// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ReversibleBridge
 * @notice Time-reversible transfers - undo mistakes within grace period
 * @dev Quantum-inspired: transfers can be "unmade" before finalization
 * 
 * GENIUS TRICK: Sent to wrong address? Just reverse it!
 * Use case: Fat finger protection, scam recovery
 */
contract ReversibleBridge {
    
    IERC20 public immutable btcbr;
    
    uint256 public constant REVERSAL_WINDOW = 1 hours;
    uint256 public constant DISPUTE_FEE = 100 * 10**18;
    
    enum TransferState { PENDING, FINALIZED, REVERSED, DISPUTED }
    
    struct Transfer {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        TransferState state;
        address disputer;
        uint256 votes_reverse;
        uint256 votes_keep;
    }
    
    mapping(bytes32 => Transfer) public transfers;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    event TransferInitiated(bytes32 indexed transferId, address from, address to, uint256 amount);
    event TransferReversed(bytes32 indexed transferId);
    event TransferFinalized(bytes32 indexed transferId);
    event DisputeRaised(bytes32 indexed transferId, address disputer);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Initiate reversible transfer
     */
    function transfer(address to, uint256 amount) external returns (bytes32 transferId) {
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        transferId = keccak256(abi.encodePacked(msg.sender, to, amount, block.timestamp));
        
        transfers[transferId] = Transfer({
            from: msg.sender,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            state: TransferState.PENDING,
            disputer: address(0),
            votes_reverse: 0,
            votes_keep: 0
        });
        
        emit TransferInitiated(transferId, msg.sender, to, amount);
    }
    
    /**
     * @notice Reverse transfer during grace period
     * Sender can undo their mistake!
     */
    function reverse(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];
        require(msg.sender == t.from, "Not sender");
        require(t.state == TransferState.PENDING, "Not reversible");
        require(block.timestamp < t.timestamp + REVERSAL_WINDOW, "Window closed");
        
        t.state = TransferState.REVERSED;
        
        // Return tokens to sender
        require(btcbr.transfer(t.from, t.amount), "Transfer failed");
        
        emit TransferReversed(transferId);
    }
    
    /**
     * @notice Finalize transfer (recipient can claim early)
     */
    function finalize(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];
        require(t.state == TransferState.PENDING, "Not pending");
        
        bool canFinalize = block.timestamp >= t.timestamp + REVERSAL_WINDOW || 
                          msg.sender == t.to;
        require(canFinalize, "Cannot finalize yet");
        
        t.state = TransferState.FINALIZED;
        
        require(btcbr.transfer(t.to, t.amount), "Transfer failed");
        
        emit TransferFinalized(transferId);
    }
    
    /**
     * @notice Recipient can dispute reversal attempt
     * Triggers community vote
     */
    function dispute(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];
        require(msg.sender == t.to, "Not recipient");
        require(t.state == TransferState.PENDING, "Not disputable");
        require(btcbr.transferFrom(msg.sender, address(this), DISPUTE_FEE), "Fee failed");
        
        t.state = TransferState.DISPUTED;
        t.disputer = msg.sender;
        
        emit DisputeRaised(transferId, msg.sender);
    }
    
    /**
     * @notice Vote on disputed transfer
     * Community decides: reverse or keep?
     */
    function vote(bytes32 transferId, bool shouldReverse) external {
        Transfer storage t = transfers[transferId];
        require(t.state == TransferState.DISPUTED, "Not disputed");
        require(!hasVoted[transferId][msg.sender], "Already voted");
        
        hasVoted[transferId][msg.sender] = true;
        
        if (shouldReverse) {
            t.votes_reverse++;
        } else {
            t.votes_keep++;
        }
    }
    
    /**
     * @notice Resolve dispute based on votes
     */
    function resolveDispute(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];
        require(t.state == TransferState.DISPUTED, "Not disputed");
        require(t.votes_reverse + t.votes_keep >= 10, "Not enough votes");
        
        if (t.votes_reverse > t.votes_keep) {
            // Community voted to reverse
            t.state = TransferState.REVERSED;
            require(btcbr.transfer(t.from, t.amount + DISPUTE_FEE), "Transfer failed");
        } else {
            // Community voted to keep
            t.state = TransferState.FINALIZED;
            require(btcbr.transfer(t.to, t.amount + DISPUTE_FEE), "Transfer failed");
        }
    }
}

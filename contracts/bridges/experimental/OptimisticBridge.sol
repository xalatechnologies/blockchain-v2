// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title OptimisticBridge
 * @notice Optimistic bridge with fraud proofs and challenge period
 * @dev Fast withdrawals with challenge window for security
 * 
 * WARNING: Experimental - requires robust fraud proof system
 */
contract OptimisticBridge is Ownable, ReentrancyGuard {
    
    IERC20 public immutable btcbr;
    
    uint256 public constant CHALLENGE_PERIOD = 7 days;
    uint256 public constant BOND_AMOUNT = 1000 * 10**18; // 1000 BTCBR bond
    
    enum WithdrawalState { PENDING, CHALLENGED, FINALIZED, CANCELLED }
    
    struct Withdrawal {
        address recipient;
        uint256 amount;
        uint256 timestamp;
        WithdrawalState state;
        address proposer;
        uint256 bond;
    }
    
    mapping(bytes32 => Withdrawal) public withdrawals;
    mapping(address => bool) public proposers;
    
    event WithdrawalProposed(bytes32 indexed withdrawalId, address recipient, uint256 amount, address proposer);
    event WithdrawalChallenged(bytes32 indexed withdrawalId, address challenger);
    event WithdrawalFinalized(bytes32 indexed withdrawalId);
    event WithdrawalCancelled(bytes32 indexed withdrawalId);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Propose withdrawal (optimistically assume valid)
     */
    function proposeWithdrawal(
        bytes32 withdrawalId,
        address recipient,
        uint256 amount
    ) external nonReentrant {
        require(proposers[msg.sender], "Not a proposer");
        require(withdrawals[withdrawalId].timestamp == 0, "Already exists");
        
        // Lock bond
        require(btcbr.transferFrom(msg.sender, address(this), BOND_AMOUNT), "Bond transfer failed");
        
        withdrawals[withdrawalId] = Withdrawal({
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            state: WithdrawalState.PENDING,
            proposer: msg.sender,
            bond: BOND_AMOUNT
        });
        
        emit WithdrawalProposed(withdrawalId, recipient, amount, msg.sender);
    }
    
    /**
     * @notice Challenge fraudulent withdrawal
     */
    function challengeWithdrawal(bytes32 withdrawalId, bytes calldata fraudProof) external nonReentrant {
        Withdrawal storage withdrawal = withdrawals[withdrawalId];
        require(withdrawal.state == WithdrawalState.PENDING, "Not pending");
        require(block.timestamp < withdrawal.timestamp + CHALLENGE_PERIOD, "Challenge period over");
        
        // Verify fraud proof (simplified - real implementation needs merkle proofs)
        bool isFraudulent = _verifyFraudProof(withdrawalId, fraudProof);
        require(isFraudulent, "Valid withdrawal");
        
        withdrawal.state = WithdrawalState.CHALLENGED;
        
        // Slash bond, reward challenger
        require(btcbr.transfer(msg.sender, withdrawal.bond), "Reward failed");
        
        emit WithdrawalChallenged(withdrawalId, msg.sender);
    }
    
    /**
     * @notice Finalize withdrawal after challenge period
     */
    function finalizeWithdrawal(bytes32 withdrawalId) external nonReentrant {
        Withdrawal storage withdrawal = withdrawals[withdrawalId];
        require(withdrawal.state == WithdrawalState.PENDING, "Not pending");
        require(block.timestamp >= withdrawal.timestamp + CHALLENGE_PERIOD, "Challenge period active");
        
        withdrawal.state = WithdrawalState.FINALIZED;
        
        // Return bond
        require(btcbr.transfer(withdrawal.proposer, withdrawal.bond), "Bond return failed");
        
        // Execute withdrawal
        require(btcbr.transfer(withdrawal.recipient, withdrawal.amount), "Withdrawal failed");
        
        emit WithdrawalFinalized(withdrawalId);
    }
    
    /**
     * @notice Verify fraud proof (simplified)
     */
    function _verifyFraudProof(bytes32, bytes calldata) internal pure returns (bool) {
        // Real implementation would verify:
        // 1. Merkle proof of source chain state
        // 2. Signature verification
        // 3. State transition validity
        return false; // Placeholder
    }
    
    function addProposer(address proposer) external onlyOwner {
        proposers[proposer] = true;
    }
    
    function removeProposer(address proposer) external onlyOwner {
        proposers[proposer] = false;
    }
}

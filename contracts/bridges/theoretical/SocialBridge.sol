// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SocialBridge
 * @notice Social consensus bridge - transfers validated by social graph
 * @dev Uses web-of-trust and reputation instead of validators
 * 
 * WARNING: Experimental social consensus mechanism
 * DISCLAIMER: May enable sybil attacks if not properly configured
 */
contract SocialBridge {
    
    IERC20 public immutable btcbr;
    
    struct SocialProof {
        address[] endorsers;
        mapping(address => bool) hasEndorsed;
        uint256 reputationScore;
        uint256 timestamp;
    }
    
    mapping(bytes32 => SocialProof) public proofs;
    mapping(address => uint256) public reputation;
    mapping(address => mapping(address => bool)) public trusts; // A trusts B
    
    uint256 public constant MIN_ENDORSEMENTS = 5;
    uint256 public constant MIN_REPUTATION = 100;
    
    event TransferProposed(bytes32 indexed proofId, address proposer, uint256 amount);
    event Endorsed(bytes32 indexed proofId, address endorser, uint256 reputation);
    event TransferExecuted(bytes32 indexed proofId);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Propose transfer (requires social validation)
     */
    function proposeTransfer(
        uint256 amount,
        address recipient
    ) external returns (bytes32 proofId) {
        require(reputation[msg.sender] >= MIN_REPUTATION, "Insufficient reputation");
        
        proofId = keccak256(abi.encodePacked(msg.sender, recipient, amount, block.timestamp));
        
        SocialProof storage proof = proofs[proofId];
        proof.timestamp = block.timestamp;
        
        emit TransferProposed(proofId, msg.sender, amount);
    }
    
    /**
     * @notice Endorse transfer (vouch for validity)
     */
    function endorse(bytes32 proofId) external {
        SocialProof storage proof = proofs[proofId];
        require(!proof.hasEndorsed[msg.sender], "Already endorsed");
        require(reputation[msg.sender] > 0, "No reputation");
        
        proof.endorsers.push(msg.sender);
        proof.hasEndorsed[msg.sender] = true;
        proof.reputationScore += reputation[msg.sender];
        
        emit Endorsed(proofId, msg.sender, reputation[msg.sender]);
    }
    
    /**
     * @notice Execute transfer after sufficient social proof
     */
    function executeTransfer(bytes32 proofId, address recipient, uint256 amount) external {
        SocialProof storage proof = proofs[proofId];
        require(proof.endorsers.length >= MIN_ENDORSEMENTS, "Insufficient endorsements");
        require(proof.reputationScore >= MIN_REPUTATION * 10, "Insufficient reputation score");
        
        // Transfer tokens
        require(btcbr.transfer(recipient, amount), "Transfer failed");
        
        // Reward endorsers with reputation
        for (uint256 i = 0; i < proof.endorsers.length; i++) {
            reputation[proof.endorsers[i]] += 10;
        }
        
        emit TransferExecuted(proofId);
    }
    
    /**
     * @notice Build trust relationship
     */
    function trust(address trustee) external {
        trusts[msg.sender][trustee] = true;
    }
    
    /**
     * @notice Revoke trust
     */
    function distrust(address trustee) external {
        trusts[msg.sender][trustee] = false;
    }
    
    /**
     * @notice Earn reputation through actions
     */
    function earnReputation() external {
        // In real implementation: proof of work, successful transfers, endorsements
        reputation[msg.sender] += 1;
    }
}

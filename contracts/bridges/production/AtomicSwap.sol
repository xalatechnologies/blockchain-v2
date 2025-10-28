// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AtomicSwap
 * @notice Hash Time-Locked Contract (HTLC) for trustless cross-chain atomic swaps
 * @dev Enables direct Token Consciousness Exchange between two parties across chains
 * 
 * How it works:
 * 1. Party A creates swap on Chain 1 with secret hash
 * 2. Party B creates swap on Chain 2 with same secret hash
 * 3. Party A reveals secret and claims Party B's tokens
 * 4. Party B uses revealed secret to claim Party A's tokens
 * 5. If timeout, both parties can refund
 */
contract AtomicSwap is ReentrancyGuard {
    
    // Swap states
    enum State { EMPTY, OPEN, COMPLETED, REFUNDED, EXPIRED }
    
    // Swap structure
    struct Swap {
        address initiator;           // Party creating the swap
        address participant;         // Counterparty
        address token;              // Token contract address
        uint256 amount;             // Amount locked
        bytes32 secretHash;         // Hash of secret
        uint256 timelock;           // Expiry timestamp
        State state;                // Current state
    }
    
    // Swap ID => Swap details
    mapping(bytes32 => Swap) public swaps;
    
    // Events
    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed initiator,
        address indexed participant,
        address token,
        uint256 amount,
        bytes32 secretHash,
        uint256 timelock
    );
    
    event SwapCompleted(
        bytes32 indexed swapId,
        address indexed participant,
        bytes32 secret
    );
    
    event SwapRefunded(
        bytes32 indexed swapId,
        address indexed initiator
    );
    
    /**
     * @notice Initiate atomic swap
     * @param swapId Unique swap identifier (must match across chains)
     * @param participant Counterparty address
     * @param token Token contract address
     * @param amount Amount to lock
     * @param secretHash Hash of secret (keccak256(secret))
     * @param timelock Expiry timestamp (unix seconds)
     */
    function initiate(
        bytes32 swapId,
        address participant,
        address token,
        uint256 amount,
        bytes32 secretHash,
        uint256 timelock
    ) external nonReentrant {
        require(swaps[swapId].state == State.EMPTY, "Swap already exists");
        require(participant != address(0), "Invalid participant");
        require(participant != msg.sender, "Cannot swap with self");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        require(secretHash != bytes32(0), "Invalid secret hash");
        require(timelock > block.timestamp, "Timelock must be in future");
        require(timelock <= block.timestamp + 48 hours, "Timelock too far");
        
        // Transfer tokens to contract
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Create swap
        swaps[swapId] = Swap({
            initiator: msg.sender,
            participant: participant,
            token: token,
            amount: amount,
            secretHash: secretHash,
            timelock: timelock,
            state: State.OPEN
        });
        
        emit SwapInitiated(
            swapId,
            msg.sender,
            participant,
            token,
            amount,
            secretHash,
            timelock
        );
    }
    
    /**
     * @notice Complete swap by revealing secret
     * @param swapId Swap identifier
     * @param secret Pre-image of secretHash
     */
    function complete(
        bytes32 swapId,
        bytes32 secret
    ) external nonReentrant {
        Swap storage swap = swaps[swapId];
        
        require(swap.state == State.OPEN, "Swap not open");
        require(msg.sender == swap.participant, "Only participant can complete");
        require(block.timestamp < swap.timelock, "Swap expired");
        require(keccak256(abi.encodePacked(secret)) == swap.secretHash, "Invalid secret");
        
        // Mark as completed
        swap.state = State.COMPLETED;
        
        // Transfer tokens to participant
        require(
            IERC20(swap.token).transfer(swap.participant, swap.amount),
            "Transfer failed"
        );
        
        emit SwapCompleted(swapId, swap.participant, secret);
    }
    
    /**
     * @notice Refund tokens after timelock expires
     * @param swapId Swap identifier
     */
    function refund(bytes32 swapId) external nonReentrant {
        Swap storage swap = swaps[swapId];
        
        require(swap.state == State.OPEN, "Swap not open");
        require(msg.sender == swap.initiator, "Only initiator can refund");
        require(block.timestamp >= swap.timelock, "Timelock not expired");
        
        // Mark as refunded
        swap.state = State.REFUNDED;
        
        // Return tokens to initiator
        require(
            IERC20(swap.token).transfer(swap.initiator, swap.amount),
            "Transfer failed"
        );
        
        emit SwapRefunded(swapId, swap.initiator);
    }
    
    /**
     * @notice Get swap details
     * @param swapId Swap identifier
     */
    function getSwap(bytes32 swapId) external view returns (
        address initiator,
        address participant,
        address token,
        uint256 amount,
        bytes32 secretHash,
        uint256 timelock,
        State state
    ) {
        Swap storage swap = swaps[swapId];
        return (
            swap.initiator,
            swap.participant,
            swap.token,
            swap.amount,
            swap.secretHash,
            swap.timelock,
            swap.state
        );
    }
    
    /**
     * @notice Check if swap is active
     * @param swapId Swap identifier
     */
    function isActive(bytes32 swapId) external view returns (bool) {
        Swap storage swap = swaps[swapId];
        return swap.state == State.OPEN && block.timestamp < swap.timelock;
    }
    
    /**
     * @notice Check if swap is completable
     * @param swapId Swap identifier
     */
    function isCompletable(bytes32 swapId) external view returns (bool) {
        Swap storage swap = swaps[swapId];
        return swap.state == State.OPEN && block.timestamp < swap.timelock;
    }
    
    /**
     * @notice Check if swap is refundable
     * @param swapId Swap identifier
     */
    function isRefundable(bytes32 swapId) external view returns (bool) {
        Swap storage swap = swaps[swapId];
        return swap.state == State.OPEN && block.timestamp >= swap.timelock;
    }
    
    /**
     * @notice Generate swap ID from parameters
     * @dev Ensures same swap ID across chains
     */
    function generateSwapId(
        address initiator,
        address participant,
        uint256 amount,
        bytes32 secretHash,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            initiator,
            participant,
            amount,
            secretHash,
            nonce
        ));
    }
}

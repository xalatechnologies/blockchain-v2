// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTLockUltra
 * @dev Ultra-secure NFT lock contract for Uniswap V3 LP positions
 *
 * Features:
 * - Lock NFT positions for 2+ years
 * - Multiple NFT locks
 * - Emergency unlock with delay
 * - Transfer ownership of lock
 * - Public proof of lock
 * - Batch operations
 * - Event logging for transparency
 */
contract NFTLockUltra is Ownable, ReentrancyGuard, IERC721Receiver {
    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    struct NFTLock {
        address nftContract;     // NFT contract address (Uniswap V3 Position Manager)
        uint256 tokenId;         // NFT token ID
        address owner;           // Lock owner
        uint256 lockTime;        // When lock was created
        uint256 unlockTime;      // When lock can be unlocked
        bool withdrawn;          // Whether NFT was withdrawn
        string description;      // Public description
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    NFTLock[] public locks;
    mapping(address => uint256[]) public userLocks;         // User -> lock IDs
    mapping(address => mapping(uint256 => uint256)) public nftLockId;  // NFT -> tokenId -> lock ID

    uint256 public constant MIN_LOCK_PERIOD = 365 days;          // 1 year minimum
    uint256 public constant RECOMMENDED_LOCK = 730 days;         // 2 years recommended
    uint256 public constant EMERGENCY_UNLOCK_DELAY = 30 days;    // Emergency unlock delay

    uint256 public totalLocksCreated;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event NFTLockCreated(
        uint256 indexed lockId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address owner,
        uint256 unlockTime,
        string description
    );

    event NFTLockWithdrawn(
        uint256 indexed lockId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address owner
    );

    event NFTLockTransferred(
        uint256 indexed lockId,
        address indexed oldOwner,
        address indexed newOwner
    );

    event NFTLockExtended(
        uint256 indexed lockId,
        uint256 oldUnlockTime,
        uint256 newUnlockTime
    );

    event EmergencyUnlockInitiated(
        uint256 indexed lockId,
        uint256 emergencyUnlockTime
    );

    // ═══════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════

    modifier lockExists(uint256 lockId) {
        require(lockId < locks.length, "Lock does not exist");
        _;
    }

    modifier onlyLockOwner(uint256 lockId) {
        require(locks[lockId].owner == msg.sender, "Not lock owner");
        _;
    }

    modifier notWithdrawn(uint256 lockId) {
        require(!locks[lockId].withdrawn, "Already withdrawn");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor() {
        // Owner is set by Ownable constructor
    }

    // ═══════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Create a new NFT lock
     * @param nftContract NFT contract address (Uniswap V3 Position Manager)
     * @param tokenId NFT token ID to lock
     * @param lockDuration Duration in seconds (minimum 1 year)
     * @param description Public description of the lock
     */
    function createLock(
        address nftContract,
        uint256 tokenId,
        uint256 lockDuration,
        string calldata description
    ) public nonReentrant returns (uint256 lockId) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(lockDuration >= MIN_LOCK_PERIOD, "Lock period too short");

        // Transfer NFT to this contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        // Create lock
        lockId = locks.length;
        locks.push(NFTLock({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            lockTime: block.timestamp,
            unlockTime: block.timestamp + lockDuration,
            withdrawn: false,
            description: description
        }));

        // Update mappings
        userLocks[msg.sender].push(lockId);
        nftLockId[nftContract][tokenId] = lockId;

        // Update stats
        totalLocksCreated++;

        emit NFTLockCreated(
            lockId,
            nftContract,
            tokenId,
            msg.sender,
            block.timestamp + lockDuration,
            description
        );

        return lockId;
    }

    /**
     * @dev Withdraw locked NFT after unlock time
     * @param lockId ID of the lock to withdraw
     */
    function withdraw(uint256 lockId)
        external
        nonReentrant
        lockExists(lockId)
        onlyLockOwner(lockId)
        notWithdrawn(lockId)
    {
        NFTLock storage lock = locks[lockId];
        require(block.timestamp >= lock.unlockTime, "Lock not yet unlocked");

        // Mark as withdrawn
        lock.withdrawn = true;

        // Transfer NFT back to owner
        IERC721(lock.nftContract).safeTransferFrom(
            address(this),
            lock.owner,
            lock.tokenId
        );

        emit NFTLockWithdrawn(lockId, lock.nftContract, lock.tokenId, lock.owner);
    }

    /**
     * @dev Transfer lock ownership to another address
     * @param lockId ID of the lock
     * @param newOwner New owner address
     */
    function transferLock(uint256 lockId, address newOwner)
        external
        lockExists(lockId)
        onlyLockOwner(lockId)
        notWithdrawn(lockId)
    {
        require(newOwner != address(0), "Invalid new owner");

        NFTLock storage lock = locks[lockId];
        address oldOwner = lock.owner;

        // Update owner
        lock.owner = newOwner;

        // Update user locks mapping
        userLocks[newOwner].push(lockId);

        emit NFTLockTransferred(lockId, oldOwner, newOwner);
    }

    /**
     * @dev Extend lock duration
     * @param lockId ID of the lock
     * @param additionalTime Additional time to add (in seconds)
     */
    function extendLock(uint256 lockId, uint256 additionalTime)
        external
        lockExists(lockId)
        onlyLockOwner(lockId)
        notWithdrawn(lockId)
    {
        require(additionalTime > 0, "Additional time must be positive");

        NFTLock storage lock = locks[lockId];
        uint256 oldUnlockTime = lock.unlockTime;
        lock.unlockTime += additionalTime;

        emit NFTLockExtended(lockId, oldUnlockTime, lock.unlockTime);
    }

    /**
     * @dev Batch create NFT locks (for multiple positions)
     * @param nftContracts Array of NFT contract addresses
     * @param tokenIds Array of token IDs
     * @param lockDurations Array of lock durations
     * @param descriptions Array of descriptions
     */
    function batchCreateLocks(
        address[] calldata nftContracts,
        uint256[] calldata tokenIds,
        uint256[] calldata lockDurations,
        string[] calldata descriptions
    ) external nonReentrant returns (uint256[] memory lockIds) {
        require(
            nftContracts.length == tokenIds.length &&
            tokenIds.length == lockDurations.length &&
            lockDurations.length == descriptions.length,
            "Array lengths mismatch"
        );

        lockIds = new uint256[](nftContracts.length);

        for (uint256 i = 0; i < nftContracts.length; i++) {
            lockIds[i] = createLock(
                nftContracts[i],
                tokenIds[i],
                lockDurations[i],
                descriptions[i]
            );
        }

        return lockIds;
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Get lock details
     */
    function getLock(uint256 lockId)
        external
        view
        lockExists(lockId)
        returns (NFTLock memory)
    {
        return locks[lockId];
    }

    /**
     * @dev Get all locks for a user
     */
    function getUserLocks(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userLocks[user];
    }

    /**
     * @dev Get lock ID for a specific NFT
     */
    function getLockIdForNFT(address nftContract, uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return nftLockId[nftContract][tokenId];
    }

    /**
     * @dev Get time until unlock
     */
    function getTimeUntilUnlock(uint256 lockId)
        external
        view
        lockExists(lockId)
        returns (uint256)
    {
        NFTLock memory lock = locks[lockId];
        if (block.timestamp >= lock.unlockTime) {
            return 0;
        }
        return lock.unlockTime - block.timestamp;
    }

    /**
     * @dev Check if lock is unlocked
     */
    function isUnlocked(uint256 lockId)
        external
        view
        lockExists(lockId)
        returns (bool)
    {
        return block.timestamp >= locks[lockId].unlockTime;
    }

    /**
     * @dev Get total number of locks
     */
    function getTotalLocks() external view returns (uint256) {
        return locks.length;
    }

    /**
     * @dev Get active (non-withdrawn) locks for user
     */
    function getActiveLocks(address user)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory userLockIds = userLocks[user];
        uint256 activeCount = 0;

        // Count active locks
        for (uint256 i = 0; i < userLockIds.length; i++) {
            if (!locks[userLockIds[i]].withdrawn) {
                activeCount++;
            }
        }

        // Create array of active lock IDs
        uint256[] memory activeLocks = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < userLockIds.length; i++) {
            if (!locks[userLockIds[i]].withdrawn) {
                activeLocks[index] = userLockIds[i];
                index++;
            }
        }

        return activeLocks;
    }

    /**
     * @dev Get lock proof (public verification data)
     */
    function getLockProof(uint256 lockId)
        external
        view
        lockExists(lockId)
        returns (
            address nftContract,
            uint256 tokenId,
            uint256 lockTime,
            uint256 unlockTime,
            bool withdrawn,
            string memory description
        )
    {
        NFTLock memory lock = locks[lockId];
        return (
            lock.nftContract,
            lock.tokenId,
            lock.lockTime,
            lock.unlockTime,
            lock.withdrawn,
            lock.description
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Emergency unlock (only contract owner, with delay)
     * IMPORTANT: This should only be used in extreme emergencies
     * and requires 30-day delay for transparency
     */
    function initiateEmergencyUnlock(uint256 lockId)
        external
        onlyOwner
        lockExists(lockId)
    {
        NFTLock storage lock = locks[lockId];
        uint256 emergencyUnlockTime = block.timestamp + EMERGENCY_UNLOCK_DELAY;

        // Set unlock time to emergency unlock time
        lock.unlockTime = emergencyUnlockTime;

        emit EmergencyUnlockInitiated(lockId, emergencyUnlockTime);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ERC721 RECEIVER
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Required to receive ERC-721 tokens
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

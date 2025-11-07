// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LiquidityLockUltra
 * @dev Ultra-secure liquidity lock contract with multi-year timelock
 *
 * Features:
 * - Lock LP tokens for 2+ years
 * - Multiple locks per token
 * - Emergency unlock with delay
 * - Transfer ownership of lock
 * - Public proof of lock
 * - Batch operations
 * - Event logging for transparency
 */
contract LiquidityLockUltra is Ownable, ReentrancyGuard {
    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    struct Lock {
        address token;           // LP token address
        address owner;           // Lock owner
        uint256 amount;          // Locked amount
        uint256 lockTime;        // When lock was created
        uint256 unlockTime;      // When lock can be unlocked
        bool withdrawn;          // Whether tokens were withdrawn
        string description;      // Public description
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    Lock[] public locks;
    mapping(address => uint256[]) public userLocks;     // User -> lock IDs
    mapping(address => uint256[]) public tokenLocks;    // Token -> lock IDs

    uint256 public constant MIN_LOCK_PERIOD = 365 days;          // 1 year minimum
    uint256 public constant RECOMMENDED_LOCK = 730 days;         // 2 years recommended
    uint256 public constant EMERGENCY_UNLOCK_DELAY = 30 days;    // Emergency unlock delay

    uint256 public totalLocksCreated;
    uint256 public totalValueLocked;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event LockCreated(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime,
        string description
    );

    event LockWithdrawn(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount
    );

    event LockTransferred(
        uint256 indexed lockId,
        address indexed oldOwner,
        address indexed newOwner
    );

    event LockExtended(
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
     * @dev Create a new liquidity lock
     * @param token LP token address to lock
     * @param amount Amount of LP tokens to lock
     * @param lockDuration Duration in seconds (minimum 1 year)
     * @param description Public description of the lock
     */
    function createLock(
        address token,
        uint256 amount,
        uint256 lockDuration,
        string calldata description
    ) public nonReentrant returns (uint256 lockId) {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than zero");
        require(lockDuration >= MIN_LOCK_PERIOD, "Lock period too short");

        // Transfer tokens to this contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Create lock
        lockId = locks.length;
        locks.push(Lock({
            token: token,
            owner: msg.sender,
            amount: amount,
            lockTime: block.timestamp,
            unlockTime: block.timestamp + lockDuration,
            withdrawn: false,
            description: description
        }));

        // Update mappings
        userLocks[msg.sender].push(lockId);
        tokenLocks[token].push(lockId);

        // Update stats
        totalLocksCreated++;
        totalValueLocked += amount;

        emit LockCreated(
            lockId,
            token,
            msg.sender,
            amount,
            block.timestamp + lockDuration,
            description
        );

        return lockId;
    }

    /**
     * @dev Withdraw locked tokens after unlock time
     * @param lockId ID of the lock to withdraw
     */
    function withdraw(uint256 lockId)
        external
        nonReentrant
        lockExists(lockId)
        onlyLockOwner(lockId)
        notWithdrawn(lockId)
    {
        Lock storage lock = locks[lockId];
        require(block.timestamp >= lock.unlockTime, "Lock not yet unlocked");

        // Mark as withdrawn
        lock.withdrawn = true;
        totalValueLocked -= lock.amount;

        // Transfer tokens
        IERC20(lock.token).transfer(lock.owner, lock.amount);

        emit LockWithdrawn(lockId, lock.token, lock.owner, lock.amount);
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

        Lock storage lock = locks[lockId];
        address oldOwner = lock.owner;

        // Update owner
        lock.owner = newOwner;

        // Update user locks mapping
        userLocks[newOwner].push(lockId);

        emit LockTransferred(lockId, oldOwner, newOwner);
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

        Lock storage lock = locks[lockId];
        uint256 oldUnlockTime = lock.unlockTime;
        lock.unlockTime += additionalTime;

        emit LockExtended(lockId, oldUnlockTime, lock.unlockTime);
    }

    /**
     * @dev Batch create locks (for multiple pairs)
     * @param tokens Array of LP token addresses
     * @param amounts Array of amounts
     * @param lockDurations Array of lock durations
     * @param descriptions Array of descriptions
     */
    function batchCreateLocks(
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256[] calldata lockDurations,
        string[] calldata descriptions
    ) external nonReentrant returns (uint256[] memory lockIds) {
        require(
            tokens.length == amounts.length &&
            amounts.length == lockDurations.length &&
            lockDurations.length == descriptions.length,
            "Array lengths mismatch"
        );

        lockIds = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            lockIds[i] = createLock(
                tokens[i],
                amounts[i],
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
        returns (Lock memory)
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
     * @dev Get all locks for a token
     */
    function getTokenLocks(address token)
        external
        view
        returns (uint256[] memory)
    {
        return tokenLocks[token];
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
        Lock memory lock = locks[lockId];
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
            address token,
            uint256 amount,
            uint256 lockTime,
            uint256 unlockTime,
            bool withdrawn,
            string memory description
        )
    {
        Lock memory lock = locks[lockId];
        return (
            lock.token,
            lock.amount,
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
        Lock storage lock = locks[lockId];
        uint256 emergencyUnlockTime = block.timestamp + EMERGENCY_UNLOCK_DELAY;

        // Set unlock time to emergency unlock time
        lock.unlockTime = emergencyUnlockTime;

        emit EmergencyUnlockInitiated(lockId, emergencyUnlockTime);
    }

    /**
     * @dev Recover stuck tokens (only non-locked tokens)
     */
    function recoverStuckTokens(address token, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(token != address(0), "Invalid token");

        // Calculate total locked amount for this token
        uint256 totalLocked = 0;
        uint256[] memory tokenLockIds = tokenLocks[token];

        for (uint256 i = 0; i < tokenLockIds.length; i++) {
            if (!locks[tokenLockIds[i]].withdrawn) {
                totalLocked += locks[tokenLockIds[i]].amount;
            }
        }

        // Ensure we're not recovering locked tokens
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance - totalLocked >= amount, "Cannot recover locked tokens");

        IERC20(token).transfer(owner(), amount);
    }
}

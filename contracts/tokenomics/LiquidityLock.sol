// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LiquidityLock
 * @notice Time-locked liquidity pool token vault for Noor Chain DEX
 * @dev Locks LP tokens for a specified period to prevent rug pulls and build trust
 *
 * Features:
 * - Lock LP tokens for specified duration
 * - Multiple lock deposits supported
 * - Emergency unlock by owner (with governance approval)
 * - Transparent unlock schedule
 * - Event emission for all state changes
 *
 * Use Cases:
 * - Lock initial $800k LP tokens for 12+ months
 * - Lock team/advisor LP allocations with vesting
 * - Lock liquidity mining rewards
 */
contract LiquidityLock is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Lock information
    struct Lock {
        address lpToken;        // LP token address
        address beneficiary;    // Who can unlock
        uint256 amount;         // Amount locked
        uint256 lockTime;       // When locked
        uint256 unlockTime;     // When can unlock
        bool withdrawn;         // Whether withdrawn
        string description;     // Lock description (e.g., "Initial Liquidity Lock")
    }

    // All locks
    Lock[] public locks;

    // Lock ID by beneficiary
    mapping(address => uint256[]) public beneficiaryLocks;

    // Lock ID by LP token
    mapping(address => uint256[]) public tokenLocks;

    // Events
    event LiquidityLocked(
        uint256 indexed lockId,
        address indexed lpToken,
        address indexed beneficiary,
        uint256 amount,
        uint256 unlockTime,
        string description
    );

    event LiquidityUnlocked(
        uint256 indexed lockId,
        address indexed lpToken,
        address indexed beneficiary,
        uint256 amount
    );

    event LockExtended(
        uint256 indexed lockId,
        uint256 oldUnlockTime,
        uint256 newUnlockTime
    );

    event EmergencyUnlock(
        uint256 indexed lockId,
        address indexed admin,
        string reason
    );

    constructor() {
        // Constructor is empty - Ownable sets owner to msg.sender
    }

    /**
     * @notice Lock LP tokens for a specified duration
     * @param lpToken LP token address to lock
     * @param amount Amount to lock
     * @param unlockTime Timestamp when tokens can be unlocked
     * @param beneficiary Address that can unlock tokens
     * @param description Human-readable description
     */
    function lockLiquidity(
        address lpToken,
        uint256 amount,
        uint256 unlockTime,
        address beneficiary,
        string calldata description
    ) external returns (uint256 lockId) {
        require(lpToken != address(0), "LiquidityLock: ZERO_LP_TOKEN");
        require(amount > 0, "LiquidityLock: ZERO_AMOUNT");
        require(unlockTime > block.timestamp, "LiquidityLock: INVALID_UNLOCK_TIME");
        require(beneficiary != address(0), "LiquidityLock: ZERO_BENEFICIARY");

        // Transfer LP tokens to this contract
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);

        // Create lock
        lockId = locks.length;
        locks.push(Lock({
            lpToken: lpToken,
            beneficiary: beneficiary,
            amount: amount,
            lockTime: block.timestamp,
            unlockTime: unlockTime,
            withdrawn: false,
            description: description
        }));

        // Track locks
        beneficiaryLocks[beneficiary].push(lockId);
        tokenLocks[lpToken].push(lockId);

        emit LiquidityLocked(
            lockId,
            lpToken,
            beneficiary,
            amount,
            unlockTime,
            description
        );
    }

    /**
     * @notice Unlock and withdraw LP tokens
     * @param lockId Lock ID to unlock
     */
    function unlockLiquidity(uint256 lockId) external nonReentrant {
        require(lockId < locks.length, "LiquidityLock: INVALID_LOCK_ID");

        Lock storage lock = locks[lockId];

        require(msg.sender == lock.beneficiary, "LiquidityLock: NOT_BENEFICIARY");
        require(block.timestamp >= lock.unlockTime, "LiquidityLock: STILL_LOCKED");
        require(!lock.withdrawn, "LiquidityLock: ALREADY_WITHDRAWN");

        // Mark as withdrawn
        lock.withdrawn = true;

        // Transfer LP tokens to beneficiary
        IERC20(lock.lpToken).safeTransfer(lock.beneficiary, lock.amount);

        emit LiquidityUnlocked(lockId, lock.lpToken, lock.beneficiary, lock.amount);
    }

    /**
     * @notice Extend lock duration (beneficiary can extend their own lock)
     * @param lockId Lock ID to extend
     * @param newUnlockTime New unlock timestamp (must be later than current)
     */
    function extendLock(uint256 lockId, uint256 newUnlockTime) external {
        require(lockId < locks.length, "LiquidityLock: INVALID_LOCK_ID");

        Lock storage lock = locks[lockId];

        require(msg.sender == lock.beneficiary || msg.sender == owner(), "LiquidityLock: NOT_AUTHORIZED");
        require(!lock.withdrawn, "LiquidityLock: ALREADY_WITHDRAWN");
        require(newUnlockTime > lock.unlockTime, "LiquidityLock: INVALID_EXTENSION");

        uint256 oldUnlockTime = lock.unlockTime;
        lock.unlockTime = newUnlockTime;

        emit LockExtended(lockId, oldUnlockTime, newUnlockTime);
    }

    /**
     * @notice Emergency unlock (owner only - requires governance approval in production)
     * @param lockId Lock ID to emergency unlock
     * @param reason Reason for emergency unlock
     */
    function emergencyUnlock(uint256 lockId, string calldata reason) external onlyOwner {
        require(lockId < locks.length, "LiquidityLock: INVALID_LOCK_ID");

        Lock storage lock = locks[lockId];
        require(!lock.withdrawn, "LiquidityLock: ALREADY_WITHDRAWN");

        // Mark as withdrawn
        lock.withdrawn = true;

        // Transfer LP tokens to beneficiary
        IERC20(lock.lpToken).safeTransfer(lock.beneficiary, lock.amount);

        emit EmergencyUnlock(lockId, msg.sender, reason);
        emit LiquidityUnlocked(lockId, lock.lpToken, lock.beneficiary, lock.amount);
    }

    /**
     * @notice Get lock information
     * @param lockId Lock ID
     */
    function getLock(uint256 lockId) external view returns (
        address lpToken,
        address beneficiary,
        uint256 amount,
        uint256 lockTime,
        uint256 unlockTime,
        bool withdrawn,
        string memory description
    ) {
        require(lockId < locks.length, "LiquidityLock: INVALID_LOCK_ID");

        Lock memory lock = locks[lockId];
        return (
            lock.lpToken,
            lock.beneficiary,
            lock.amount,
            lock.lockTime,
            lock.unlockTime,
            lock.withdrawn,
            lock.description
        );
    }

    /**
     * @notice Get all lock IDs for a beneficiary
     */
    function getBeneficiaryLocks(address beneficiary) external view returns (uint256[] memory) {
        return beneficiaryLocks[beneficiary];
    }

    /**
     * @notice Get all lock IDs for an LP token
     */
    function getTokenLocks(address lpToken) external view returns (uint256[] memory) {
        return tokenLocks[lpToken];
    }

    /**
     * @notice Get total locks count
     */
    function getTotalLocks() external view returns (uint256) {
        return locks.length;
    }

    /**
     * @notice Check if lock is unlockable
     */
    function isUnlockable(uint256 lockId) external view returns (bool) {
        if (lockId >= locks.length) return false;

        Lock memory lock = locks[lockId];
        return !lock.withdrawn && block.timestamp >= lock.unlockTime;
    }

    /**
     * @notice Get time remaining until unlock
     */
    function getTimeUntilUnlock(uint256 lockId) external view returns (uint256) {
        require(lockId < locks.length, "LiquidityLock: INVALID_LOCK_ID");

        Lock memory lock = locks[lockId];

        if (lock.withdrawn) return 0;
        if (block.timestamp >= lock.unlockTime) return 0;

        return lock.unlockTime - block.timestamp;
    }

    /**
     * @notice Get total locked amount for an LP token
     */
    function getTotalLockedAmount(address lpToken) external view returns (uint256 total) {
        uint256[] memory lockIds = tokenLocks[lpToken];

        for (uint256 i = 0; i < lockIds.length; i++) {
            Lock memory lock = locks[lockIds[i]];
            if (!lock.withdrawn) {
                total += lock.amount;
            }
        }

        return total;
    }
}

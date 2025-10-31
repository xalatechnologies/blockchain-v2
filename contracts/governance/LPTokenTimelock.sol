// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LPTokenTimelock
 * @dev A timelock contract for locking LP tokens with scheduled releases
 *
 * Features:
 * - Lock LP tokens for specified duration
 * - Multiple lock schedules supported
 * - Emergency unlock by owner (with time delay)
 * - Transparent on-chain verification
 * - Events for all actions
 */
contract LPTokenTimelock is Ownable {
    using SafeERC20 for IERC20;

    struct Lock {
        uint256 amount;          // Amount of tokens locked
        uint256 lockTime;        // Timestamp when locked
        uint256 unlockTime;      // Timestamp when can be unlocked
        bool withdrawn;          // Whether tokens have been withdrawn
        string description;      // Description of the lock
    }

    // LP token being locked
    IERC20 public immutable lpToken;

    // Beneficiary who can withdraw after unlock
    address public beneficiary;

    // All locks created
    Lock[] public locks;

    // Total amount currently locked
    uint256 public totalLocked;

    // Emergency unlock timestamp (0 if not requested)
    uint256 public emergencyUnlockTime;

    // Emergency unlock delay (7 days)
    uint256 public constant EMERGENCY_DELAY = 7 days;

    // Events
    event TokensLocked(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount,
        uint256 lockTime,
        uint256 unlockTime,
        string description
    );

    event TokensWithdrawn(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount
    );

    event BeneficiaryChanged(
        address indexed oldBeneficiary,
        address indexed newBeneficiary
    );

    event EmergencyUnlockRequested(
        uint256 requestTime,
        uint256 executeTime
    );

    event EmergencyUnlockCancelled();

    /**
     * @dev Constructor
     * @param _lpToken Address of LP token to lock
     * @param _beneficiary Address that can withdraw after unlock
     */
    constructor(address _lpToken, address _beneficiary) {
        require(_lpToken != address(0), "Invalid LP token address");
        require(_beneficiary != address(0), "Invalid beneficiary address");

        lpToken = IERC20(_lpToken);
        beneficiary = _beneficiary;

        // Transfer ownership to deployer (msg.sender is automatically owner)
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Lock LP tokens for specified duration
     * @param amount Amount of LP tokens to lock
     * @param lockDurationDays Duration in days to lock tokens
     * @param description Description of the lock (e.g., "Initial 30% lock - 12 months")
     */
    function lockTokens(
        uint256 amount,
        uint256 lockDurationDays,
        string memory description
    ) external onlyOwner returns (uint256 lockId) {
        require(amount > 0, "Amount must be greater than 0");
        require(lockDurationDays > 0, "Duration must be greater than 0");

        // Transfer tokens from sender to this contract
        lpToken.safeTransferFrom(msg.sender, address(this), amount);

        // Create lock
        uint256 unlockTime = block.timestamp + (lockDurationDays * 1 days);

        lockId = locks.length;
        locks.push(Lock({
            amount: amount,
            lockTime: block.timestamp,
            unlockTime: unlockTime,
            withdrawn: false,
            description: description
        }));

        totalLocked += amount;

        emit TokensLocked(
            lockId,
            beneficiary,
            amount,
            block.timestamp,
            unlockTime,
            description
        );

        return lockId;
    }

    /**
     * @dev Withdraw unlocked tokens
     * @param lockId ID of the lock to withdraw from
     */
    function withdrawTokens(uint256 lockId) external {
        require(msg.sender == beneficiary, "Only beneficiary can withdraw");
        require(lockId < locks.length, "Invalid lock ID");

        Lock storage lock = locks[lockId];
        require(!lock.withdrawn, "Already withdrawn");
        require(block.timestamp >= lock.unlockTime, "Tokens still locked");

        lock.withdrawn = true;
        totalLocked -= lock.amount;

        lpToken.safeTransfer(beneficiary, lock.amount);

        emit TokensWithdrawn(lockId, beneficiary, lock.amount);
    }

    /**
     * @dev Withdraw multiple locks at once
     * @param lockIds Array of lock IDs to withdraw
     */
    function withdrawMultiple(uint256[] calldata lockIds) external {
        require(msg.sender == beneficiary, "Only beneficiary can withdraw");

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < lockIds.length; i++) {
            uint256 lockId = lockIds[i];
            require(lockId < locks.length, "Invalid lock ID");

            Lock storage lock = locks[lockId];
            if (!lock.withdrawn && block.timestamp >= lock.unlockTime) {
                lock.withdrawn = true;
                totalAmount += lock.amount;

                emit TokensWithdrawn(lockId, beneficiary, lock.amount);
            }
        }

        require(totalAmount > 0, "No tokens available to withdraw");

        totalLocked -= totalAmount;
        lpToken.safeTransfer(beneficiary, totalAmount);
    }

    /**
     * @dev Change beneficiary (only owner can change)
     * @param newBeneficiary New beneficiary address
     */
    function changeBeneficiary(address newBeneficiary) external onlyOwner {
        require(newBeneficiary != address(0), "Invalid beneficiary");

        address oldBeneficiary = beneficiary;
        beneficiary = newBeneficiary;

        emit BeneficiaryChanged(oldBeneficiary, newBeneficiary);
    }

    /**
     * @dev Request emergency unlock (7-day delay)
     * Can only be called by owner in case of critical issues
     */
    function requestEmergencyUnlock() external onlyOwner {
        require(emergencyUnlockTime == 0, "Emergency unlock already requested");

        emergencyUnlockTime = block.timestamp + EMERGENCY_DELAY;

        emit EmergencyUnlockRequested(block.timestamp, emergencyUnlockTime);
    }

    /**
     * @dev Cancel emergency unlock request
     */
    function cancelEmergencyUnlock() external onlyOwner {
        require(emergencyUnlockTime != 0, "No emergency unlock requested");

        emergencyUnlockTime = 0;

        emit EmergencyUnlockCancelled();
    }

    /**
     * @dev Execute emergency unlock (after 7-day delay)
     * Withdraws ALL locked tokens to beneficiary
     */
    function executeEmergencyUnlock() external onlyOwner {
        require(emergencyUnlockTime != 0, "No emergency unlock requested");
        require(block.timestamp >= emergencyUnlockTime, "Emergency delay not passed");

        uint256 totalAmount = lpToken.balanceOf(address(this));
        require(totalAmount > 0, "No tokens to withdraw");

        // Mark all locks as withdrawn
        for (uint256 i = 0; i < locks.length; i++) {
            if (!locks[i].withdrawn) {
                locks[i].withdrawn = true;
            }
        }

        totalLocked = 0;
        emergencyUnlockTime = 0;

        lpToken.safeTransfer(beneficiary, totalAmount);
    }

    /**
     * @dev Get total number of locks
     */
    function getTotalLocks() external view returns (uint256) {
        return locks.length;
    }

    /**
     * @dev Get lock details
     * @param lockId ID of the lock
     */
    function getLock(uint256 lockId) external view returns (
        uint256 amount,
        uint256 lockTime,
        uint256 unlockTime,
        bool withdrawn,
        string memory description,
        bool canWithdraw
    ) {
        require(lockId < locks.length, "Invalid lock ID");

        Lock memory lock = locks[lockId];

        return (
            lock.amount,
            lock.lockTime,
            lock.unlockTime,
            lock.withdrawn,
            lock.description,
            !lock.withdrawn && block.timestamp >= lock.unlockTime
        );
    }

    /**
     * @dev Get all locks
     */
    function getAllLocks() external view returns (Lock[] memory) {
        return locks;
    }

    /**
     * @dev Get available balance (unlocked and not withdrawn)
     */
    function getAvailableBalance() external view returns (uint256) {
        uint256 available = 0;

        for (uint256 i = 0; i < locks.length; i++) {
            Lock memory lock = locks[i];
            if (!lock.withdrawn && block.timestamp >= lock.unlockTime) {
                available += lock.amount;
            }
        }

        return available;
    }

    /**
     * @dev Get locked balance (not yet unlocked)
     */
    function getLockedBalance() external view returns (uint256) {
        uint256 locked = 0;

        for (uint256 i = 0; i < locks.length; i++) {
            Lock memory lock = locks[i];
            if (!lock.withdrawn && block.timestamp < lock.unlockTime) {
                locked += lock.amount;
            }
        }

        return locked;
    }

    /**
     * @dev Get next unlock time
     */
    function getNextUnlockTime() external view returns (uint256) {
        uint256 nextUnlock = type(uint256).max;

        for (uint256 i = 0; i < locks.length; i++) {
            Lock memory lock = locks[i];
            if (!lock.withdrawn && block.timestamp < lock.unlockTime) {
                if (lock.unlockTime < nextUnlock) {
                    nextUnlock = lock.unlockTime;
                }
            }
        }

        return nextUnlock == type(uint256).max ? 0 : nextUnlock;
    }
}

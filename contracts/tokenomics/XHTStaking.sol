// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title XHTStaking
 * @notice Intelligent staking contract for XHT (Xaheen Token)
 * @dev Features:
 * - Dynamic APY (8-20%) based on network security needs
 * - Lock period multipliers (up to 3x voting power)
 * - Revenue sharing (50% of protocol revenue)
 * - Automatic compounding
 */
contract XHTStaking is ReentrancyGuard, Ownable, Pausable {

    // ============ State Variables ============

    struct StakeInfo {
        uint256 amount;           // Amount staked
        uint256 startTime;        // When stake started
        uint256 lockPeriod;       // Lock duration (0, 90, 180, 365 days)
        uint256 lastRewardTime;   // Last reward claim
        uint256 accumulatedRewards; // Pending rewards
        bool isValidator;         // Validator status (5x voting power)
    }

    struct LockTier {
        uint256 duration;         // Lock period in days
        uint256 votingMultiplier; // Voting power multiplier (100 = 1x)
        uint256 rewardBonus;      // Reward bonus percentage
    }

    mapping(address => StakeInfo) public stakes;
    mapping(uint256 => LockTier) public lockTiers;

    uint256 public totalStaked;
    uint256 public totalSupply = 1_000_000_000 ether; // 1 billion XHT
    uint256 public targetStakePercentage = 30; // 30% of supply
    uint256 public revenuePool; // Protocol revenue for distribution

    uint256 public constant MIN_STAKE = 1000 ether; // 1,000 XHT minimum
    uint256 public constant VALIDATOR_STAKE = 10_000 ether; // 10,000 XHT for validator
    uint256 public constant BASE_APY_MIN = 8; // 8% minimum APY
    uint256 public constant BASE_APY_MAX = 20; // 20% maximum APY

    // ============ Events ============

    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardsClaimed(address indexed user, uint256 reward);
    event RevenueAdded(uint256 amount);
    event ValidatorStatusUpdated(address indexed user, bool isValidator);

    // ============ Constructor ============

    constructor() {
        // Initialize lock tiers
        lockTiers[0] = LockTier(0, 100, 0);      // No lock: 1x voting, 0% bonus
        lockTiers[1] = LockTier(90, 150, 5);     // 3 months: 1.5x voting, 5% bonus
        lockTiers[2] = LockTier(180, 200, 15);   // 6 months: 2x voting, 15% bonus
        lockTiers[3] = LockTier(365, 300, 30);   // 12 months: 3x voting, 30% bonus
        lockTiers[4] = LockTier(1095, 500, 200); // 36 months: 5x voting, 200% bonus
    }

    // ============ Core Functions ============

    /**
     * @notice Stake XHT tokens
     * @param amount Amount to stake (must be >= MIN_STAKE)
     * @param lockTierId Lock tier (0-4)
     */
    function stake(uint256 amount, uint256 lockTierId) external payable nonReentrant whenNotPaused {
        require(msg.value == amount, "Amount mismatch");
        require(amount >= MIN_STAKE, "Below minimum stake");
        require(lockTierId <= 4, "Invalid lock tier");
        require(stakes[msg.sender].amount == 0, "Already staking");

        LockTier memory tier = lockTiers[lockTierId];

        stakes[msg.sender] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: tier.duration * 1 days,
            lastRewardTime: block.timestamp,
            accumulatedRewards: 0,
            isValidator: amount >= VALIDATOR_STAKE
        });

        totalStaked += amount;

        emit Staked(msg.sender, amount, tier.duration);

        if (amount >= VALIDATOR_STAKE) {
            emit ValidatorStatusUpdated(msg.sender, true);
        }
    }

    /**
     * @notice Unstake XHT tokens and claim rewards
     */
    function unstake() external nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount > 0, "No stake found");
        require(block.timestamp >= stakeInfo.startTime + stakeInfo.lockPeriod, "Still locked");

        uint256 reward = calculateReward(msg.sender);
        uint256 totalAmount = stakeInfo.amount + reward;

        totalStaked -= stakeInfo.amount;

        emit Unstaked(msg.sender, stakeInfo.amount, reward);

        delete stakes[msg.sender];

        (bool success, ) = msg.sender.call{value: totalAmount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Claim accumulated rewards without unstaking
     */
    function claimRewards() external nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount > 0, "No stake found");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards available");

        stakeInfo.lastRewardTime = block.timestamp;
        stakeInfo.accumulatedRewards = 0;

        emit RewardsClaimed(msg.sender, reward);

        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Calculate dynamic APY based on total staked
     * @return APY percentage (8-20%)
     */
    function calculateDynamicAPY() public view returns (uint256) {
        uint256 targetStake = (totalSupply * targetStakePercentage) / 100;

        if (totalStaked < targetStake) {
            // Incentivize more staking
            uint256 stakingRatio = (totalStaked * 100) / targetStake;
            return BASE_APY_MAX - ((BASE_APY_MAX - BASE_APY_MIN) * stakingRatio) / 100;
        } else {
            // Gradually reduce as security improves
            return BASE_APY_MIN;
        }
    }

    /**
     * @notice Calculate pending rewards for a user
     * @param user Address to check
     * @return Pending reward amount
     */
    function calculateReward(address user) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;

        uint256 stakingTime = block.timestamp - stakeInfo.lastRewardTime;
        uint256 baseAPY = calculateDynamicAPY();

        // Get lock tier bonus
        uint256 lockTierId = getLockTierId(stakeInfo.lockPeriod);
        uint256 rewardBonus = lockTiers[lockTierId].rewardBonus;

        // Calculate base reward
        uint256 baseReward = (stakeInfo.amount * baseAPY * stakingTime) / (365 days * 100);

        // Apply lock bonus
        uint256 bonusReward = (baseReward * rewardBonus) / 100;

        // Add revenue share
        uint256 revenueShare = calculateRevenueShare(user);

        return baseReward + bonusReward + revenueShare + stakeInfo.accumulatedRewards;
    }

    /**
     * @notice Calculate revenue share for a user (50% of protocol revenue)
     * @param user Address to check
     * @return Revenue share amount
     */
    function calculateRevenueShare(address user) public view returns (uint256) {
        if (totalStaked == 0) return 0;

        StakeInfo memory stakeInfo = stakes[user];
        uint256 userShare = (stakeInfo.amount * 1e18) / totalStaked;
        uint256 distributionPool = (revenuePool * 50) / 100; // 50% to stakers

        return (distributionPool * userShare) / 1e18;
    }

    /**
     * @notice Get voting power for governance
     * @param user Address to check
     * @return Voting power (with multipliers)
     */
    function getVotingPower(address user) external view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;

        uint256 lockTierId = getLockTierId(stakeInfo.lockPeriod);
        uint256 multiplier = lockTiers[lockTierId].votingMultiplier;

        // Apply validator multiplier (5x)
        if (stakeInfo.isValidator) {
            multiplier *= 5;
        }

        return (stakeInfo.amount * multiplier) / 100;
    }

    /**
     * @notice Get lock tier ID from lock period
     */
    function getLockTierId(uint256 lockPeriod) internal pure returns (uint256) {
        if (lockPeriod == 0) return 0;
        if (lockPeriod == 90 days) return 1;
        if (lockPeriod == 180 days) return 2;
        if (lockPeriod == 365 days) return 3;
        if (lockPeriod == 1095 days) return 4;
        return 0;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add protocol revenue for distribution
     */
    function addRevenue() external payable onlyOwner {
        revenuePool += msg.value;
        emit RevenueAdded(msg.value);
    }

    /**
     * @notice Update target stake percentage
     */
    function setTargetStakePercentage(uint256 percentage) external onlyOwner {
        require(percentage > 0 && percentage <= 100, "Invalid percentage");
        targetStakePercentage = percentage;
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get complete stake information
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockPeriod,
        uint256 pendingRewards,
        uint256 votingPower,
        uint256 currentAPY,
        bool isValidator
    ) {
        StakeInfo memory stakeInfo = stakes[user];
        return (
            stakeInfo.amount,
            stakeInfo.startTime,
            stakeInfo.lockPeriod,
            calculateReward(user),
            this.getVotingPower(user),
            calculateDynamicAPY(),
            stakeInfo.isValidator
        );
    }

    /**
     * @notice Get total staking statistics
     */
    function getStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalSupply,
        uint256 stakingPercentage,
        uint256 currentAPY,
        uint256 _revenuePool
    ) {
        return (
            totalStaked,
            totalSupply,
            (totalStaked * 100) / totalSupply,
            calculateDynamicAPY(),
            revenuePool
        );
    }
}

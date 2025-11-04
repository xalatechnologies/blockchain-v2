// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NorStaking
 * @notice Staking contract for NOR tokens with flexible reward distribution
 * @dev Implements time-weighted staking with penalty for early withdrawal
 */
contract NorStaking is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken; // NOR
    IERC20 public immutable rewardToken;  // Can be NOR or another token
    
    uint256 public rewardRate = 100; // 100 tokens per day per 1000 staked (10% APY)
    uint256 public constant RATE_PRECISION = 1000;
    uint256 public constant SECONDS_PER_DAY = 86400;
    
    uint256 public minStakingPeriod = 7 days;
    uint256 public earlyWithdrawalPenalty = 10; // 10% penalty
    
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 rewardsEarned;
    }
    
    mapping(address => StakeInfo) public stakes;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 penalty);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    
    constructor(
        address _stakingToken,
        address _rewardToken
    ) {
        require(_stakingToken != address(0), "NorStaking: INVALID_STAKING_TOKEN");
        require(_rewardToken != address(0), "NorStaking: INVALID_REWARD_TOKEN");
        
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }
    
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "NorStaking: ZERO_AMOUNT");
        
        StakeInfo storage stakeInfo = stakes[msg.sender];
        
        // Claim pending rewards if already staking
        if (stakeInfo.amount > 0) {
            _claimRewards(msg.sender);
        }
        
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        if (stakeInfo.amount == 0) {
            stakeInfo.startTime = block.timestamp;
            stakeInfo.lastClaimTime = block.timestamp;
        }
        
        stakeInfo.amount += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount >= amount, "NorStaking: INSUFFICIENT_BALANCE");
        
        // Claim rewards before unstaking
        _claimRewards(msg.sender);
        
        uint256 penalty = 0;
        uint256 amountToReturn = amount;
        
        // Apply penalty if unstaking before minimum period
        if (block.timestamp < stakeInfo.startTime + minStakingPeriod) {
            penalty = (amount * earlyWithdrawalPenalty) / 100;
            amountToReturn = amount - penalty;
        }
        
        stakeInfo.amount -= amount;
        totalStaked -= amount;
        
        if (stakeInfo.amount == 0) {
            delete stakes[msg.sender];
        }
        
        stakingToken.safeTransfer(msg.sender, amountToReturn);
        
        // Penalty goes to contract (can be distributed later)
        if (penalty > 0) {
            emit Unstaked(msg.sender, amountToReturn, penalty);
        } else {
            emit Unstaked(msg.sender, amount, 0);
        }
    }
    
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }
    
    function _claimRewards(address user) internal {
        StakeInfo storage stakeInfo = stakes[user];
        require(stakeInfo.amount > 0, "NorStaking: NO_STAKE");
        
        uint256 pending = calculatePendingRewards(user);
        
        if (pending > 0) {
            stakeInfo.rewardsEarned += pending;
            stakeInfo.lastClaimTime = block.timestamp;
            totalRewardsDistributed += pending;
            
            rewardToken.safeTransfer(user, pending);
            emit RewardsClaimed(user, pending);
        }
    }
    
    function calculatePendingRewards(address user) public view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        
        if (stakeInfo.amount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - stakeInfo.lastClaimTime;
        uint256 daysStaked = timeStaked / SECONDS_PER_DAY;
        
        // rewards = (amount * rewardRate * daysStaked) / RATE_PRECISION
        return (stakeInfo.amount * rewardRate * daysStaked) / RATE_PRECISION;
    }
    
    function getStakeInfo(address user)
        external
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 lastClaimTime,
            uint256 rewardsEarned,
            uint256 pendingRewards
        )
    {
        StakeInfo storage stakeInfo = stakes[user];
        return (
            stakeInfo.amount,
            stakeInfo.startTime,
            stakeInfo.lastClaimTime,
            stakeInfo.rewardsEarned,
            calculatePendingRewards(user)
        );
    }
    
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }
    
    function setMinStakingPeriod(uint256 _minStakingPeriod) external onlyOwner {
        minStakingPeriod = _minStakingPeriod;
    }
    
    function setEarlyWithdrawalPenalty(uint256 _penalty) external onlyOwner {
        require(_penalty <= 50, "NorStaking: PENALTY_TOO_HIGH");
        earlyWithdrawalPenalty = _penalty;
    }
    
    function depositRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        if (address(rewardToken) == address(stakingToken)) {
            // Don't withdraw staked tokens
            balance -= totalStaked;
        }
        rewardToken.safeTransfer(owner(), balance);
    }
}

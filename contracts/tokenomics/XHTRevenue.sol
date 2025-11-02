// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IXHTStaking {
    function totalStaked() external view returns (uint256);
    function stakes(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockPeriod,
        uint256 lastRewardTime,
        uint256 accumulatedRewards,
        bool isValidator
    );
}

interface IXHTBurnMechanism {
    function burnBridgeFees() external payable;
}

/**
 * @title XHTRevenue
 * @notice Revenue collection and distribution for Xaheen ecosystem
 * @dev Collects fees from:
 * - Bridge transfers (0.1-0.2%)
 * - DEX swaps (0.3%)
 * - NFT marketplace (2.5%)
 * - Premium services
 *
 * Distribution:
 * - 50% to stakers (proportional to stake)
 * - 30% to validators
 * - 10% burned
 * - 10% to treasury
 */
contract XHTRevenue is Ownable, ReentrancyGuard {

    // ============ State Variables ============

    IXHTStaking public stakingContract;
    IXHTBurnMechanism public burnContract;
    address public treasuryAddress;

    struct RevenueStats {
        uint256 totalCollected;
        uint256 distributedToStakers;
        uint256 distributedToValidators;
        uint256 burned;
        uint256 toTreasury;
    }

    RevenueStats public stats;

    mapping(address => bool) public isValidator;
    mapping(address => uint256) public validatorRewards;
    mapping(address => uint256) public stakerRewards;

    uint256 public pendingStakerPool;
    uint256 public pendingValidatorPool;

    // Distribution percentages
    uint256 public constant STAKERS_PERCENTAGE = 50;
    uint256 public constant VALIDATORS_PERCENTAGE = 30;
    uint256 public constant BURN_PERCENTAGE = 10;
    uint256 public constant TREASURY_PERCENTAGE = 10;

    // Minimum distribution threshold (prevents gas waste on small amounts)
    uint256 public constant MIN_DISTRIBUTION_AMOUNT = 1 ether;

    // ============ Events ============

    event RevenueReceived(address indexed from, uint256 amount, string source);
    event RevenueDistributed(
        uint256 toStakers,
        uint256 toValidators,
        uint256 burned,
        uint256 toTreasury
    );
    event StakerRewardClaimed(address indexed staker, uint256 amount);
    event ValidatorRewardClaimed(address indexed validator, uint256 amount);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    // ============ Constructor ============

    constructor(
        address _stakingContract,
        address _burnContract,
        address _treasuryAddress
    ) {
        stakingContract = IXHTStaking(_stakingContract);
        burnContract = IXHTBurnMechanism(_burnContract);
        treasuryAddress = _treasuryAddress;
    }

    // ============ Core Functions ============

    /**
     * @notice Collect revenue from various sources
     * @param source Description of revenue source (bridge, dex, nft, etc.)
     * @dev Uses Checks-Effects-Interactions (CEI) pattern to prevent reentrancy
     */
    function collectRevenue(string memory source) external payable nonReentrant {
        // ============ CHECKS ============
        require(msg.value > 0, "No revenue sent");

        // Split revenue according to percentages
        uint256 toStakers = (msg.value * STAKERS_PERCENTAGE) / 100;
        uint256 toValidators = (msg.value * VALIDATORS_PERCENTAGE) / 100;
        uint256 toBurn = (msg.value * BURN_PERCENTAGE) / 100;
        uint256 toTreasury = msg.value - toStakers - toValidators - toBurn;

        // Check if auto-distribution needed
        bool shouldDistributeStakers = (pendingStakerPool + toStakers) >= MIN_DISTRIBUTION_AMOUNT;
        bool shouldDistributeValidators = (pendingValidatorPool + toValidators) >= MIN_DISTRIBUTION_AMOUNT;

        // ============ EFFECTS (all state updates BEFORE external calls) ============
        stats.totalCollected += msg.value;
        stats.burned += toBurn;
        stats.toTreasury += toTreasury;

        if (shouldDistributeStakers) {
            // Calculate total before resetting
            uint256 stakerAmount = pendingStakerPool + toStakers;
            pendingStakerPool = 0;
            stats.distributedToStakers += stakerAmount;
        } else {
            pendingStakerPool += toStakers;
        }

        if (shouldDistributeValidators) {
            // Calculate total before resetting
            uint256 validatorAmount = pendingValidatorPool + toValidators;
            pendingValidatorPool = 0;
            stats.distributedToValidators += validatorAmount;
        } else {
            pendingValidatorPool += toValidators;
        }

        emit RevenueReceived(msg.sender, msg.value, source);

        // ============ INTERACTIONS (all external calls LAST) ============
        // Burn portion
        if (toBurn > 0) {
            burnContract.burnBridgeFees{value: toBurn}();
        }

        // Send to treasury
        if (toTreasury > 0) {
            (bool success, ) = treasuryAddress.call{value: toTreasury}("");
            require(success, "Treasury transfer failed");
        }
    }

    /**
     * @notice Distribute pending rewards to stakers
     */
    function distributeToStakers() external nonReentrant {
        require(pendingStakerPool > 0, "No pending rewards");
        _distributeToStakers();
    }

    /**
     * @notice Internal distribution to stakers
     */
    function _distributeToStakers() internal {
        uint256 totalStaked = stakingContract.totalStaked();
        require(totalStaked > 0, "No stakers");

        uint256 amount = pendingStakerPool;
        pendingStakerPool = 0;

        // Note: In production, we'd iterate through stakers or use a snapshot
        // For now, we'll keep rewards claimable per user

        stats.distributedToStakers += amount;
        emit RevenueDistributed(amount, 0, 0, 0);
    }

    /**
     * @notice Distribute pending rewards to validators
     */
    function distributeToValidators() external nonReentrant {
        require(pendingValidatorPool > 0, "No pending rewards");
        _distributeToValidators();
    }

    /**
     * @notice Internal distribution to validators
     */
    function _distributeToValidators() internal {
        uint256 validatorCount = getValidatorCount();
        require(validatorCount > 0, "No validators");

        uint256 amount = pendingValidatorPool;
        pendingValidatorPool = 0;

        uint256 perValidator = amount / validatorCount;

        // In production, iterate through validator list
        // For now, track as claimable rewards

        stats.distributedToValidators += amount;
        emit RevenueDistributed(0, amount, 0, 0);
    }

    /**
     * @notice Claim staker rewards
     */
    function claimStakerRewards() external nonReentrant {
        uint256 reward = calculateStakerReward(msg.sender);
        require(reward > 0, "No rewards available");

        stakerRewards[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");

        emit StakerRewardClaimed(msg.sender, reward);
    }

    /**
     * @notice Claim validator rewards
     */
    function claimValidatorRewards() external nonReentrant {
        require(isValidator[msg.sender], "Not a validator");
        uint256 reward = validatorRewards[msg.sender];
        require(reward > 0, "No rewards available");

        validatorRewards[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");

        emit ValidatorRewardClaimed(msg.sender, reward);
    }

    /**
     * @notice Calculate staker's share of revenue
     * @param staker Address to check
     * @return Pending reward amount
     */
    function calculateStakerReward(address staker) public view returns (uint256) {
        uint256 totalStaked = stakingContract.totalStaked();
        if (totalStaked == 0) return 0;

        (uint256 stakedAmount, , , , , ) = stakingContract.stakes(staker);
        if (stakedAmount == 0) return 0;

        uint256 share = (stats.distributedToStakers * stakedAmount) / totalStaked;
        return share + stakerRewards[staker];
    }

    /**
     * @notice Get validator count
     */
    function getValidatorCount() public view returns (uint256) {
        // In production, maintain a validator array
        // For now, return a fixed count
        return 3; // Three validators
    }

    // ============ Admin Functions ============

    /**
     * @notice Add a validator
     */
    function addValidator(address validator) external onlyOwner {
        require(!isValidator[validator], "Already validator");
        isValidator[validator] = true;
        emit ValidatorAdded(validator);
    }

    /**
     * @notice Remove a validator
     */
    function removeValidator(address validator) external onlyOwner {
        require(isValidator[validator], "Not a validator");
        isValidator[validator] = false;
        emit ValidatorRemoved(validator);
    }

    /**
     * @notice Update treasury address
     */
    function updateTreasuryAddress(address _treasuryAddress) external onlyOwner {
        treasuryAddress = _treasuryAddress;
    }

    /**
     * @notice Update staking contract
     */
    function updateStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = IXHTStaking(_stakingContract);
    }

    /**
     * @notice Update burn contract
     */
    function updateBurnContract(address _burnContract) external onlyOwner {
        burnContract = IXHTBurnMechanism(_burnContract);
    }

    // ============ View Functions ============

    /**
     * @notice Get complete revenue statistics
     */
    function getRevenueStats() external view returns (
        uint256 totalCollected,
        uint256 distributedToStakers,
        uint256 distributedToValidators,
        uint256 burned,
        uint256 toTreasury,
        uint256 pendingStakers,
        uint256 pendingValidators
    ) {
        return (
            stats.totalCollected,
            stats.distributedToStakers,
            stats.distributedToValidators,
            stats.burned,
            stats.toTreasury,
            pendingStakerPool,
            pendingValidatorPool
        );
    }

    /**
     * @notice Get distribution breakdown for an amount
     */
    function getDistributionBreakdown(uint256 amount) external pure returns (
        uint256 toStakers,
        uint256 toValidators,
        uint256 toBurn,
        uint256 toTreasury
    ) {
        toStakers = (amount * STAKERS_PERCENTAGE) / 100;
        toValidators = (amount * VALIDATORS_PERCENTAGE) / 100;
        toBurn = (amount * BURN_PERCENTAGE) / 100;
        toTreasury = amount - toStakers - toValidators - toBurn;

        return (toStakers, toValidators, toBurn, toTreasury);
    }

    // ============ Receive Function ============

    receive() external payable {
        stats.totalCollected += msg.value;
        emit RevenueReceived(msg.sender, msg.value, "direct");
    }
}

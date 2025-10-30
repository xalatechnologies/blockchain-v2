// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title XHTBurnMechanism
 * @notice Triple burn mechanism for XHT deflationary tokenomics
 * @dev Burns XHT from three sources:
 * 1. 50% of gas fees (velocity sink - more usage = more burn)
 * 2. 10% of validator rewards
 * 3. 5% of bridge fees
 *
 * Expected burn rate: 5-10% annually
 * Minimum supply floor: 100M XHT (10% of original 1B)
 */
contract XHTBurnMechanism is Ownable {

    // ============ State Variables ============

    uint256 public totalBurned;
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether; // 1 billion XHT
    uint256 public constant MINIMUM_SUPPLY = 100_000_000 ether;   // 100 million XHT floor

    uint256 public gasBurnPercentage = 50;      // 50% of gas fees
    uint256 public validatorBurnPercentage = 10; // 10% of validator rewards
    uint256 public bridgeBurnPercentage = 5;     // 5% of bridge fees

    // Velocity sink - increases burn for heavy users
    mapping(address => uint256) public userTransactionCount;

    uint256 public constant BASE_BURN_RATE = 50;     // 50% base
    uint256 public constant POWER_USER_THRESHOLD = 10;
    uint256 public constant HEAVY_USER_THRESHOLD = 100;
    uint256 public constant MAX_BURN_RATE = 80;      // 80% maximum

    address public deadAddress = 0x000000000000000000000000000000000000dEaD;

    // ============ Events ============

    event GasBurned(address indexed user, uint256 amount, uint256 burnRate);
    event ValidatorRewardBurned(address indexed validator, uint256 amount);
    event BridgeFeeBurned(uint256 amount);
    event BurnRatesUpdated(uint256 gasBurn, uint256 validatorBurn, uint256 bridgeBurn);
    event TotalBurnedUpdated(uint256 totalBurned, uint256 remainingSupply);

    // ============ Core Functions ============

    /**
     * @notice Burn portion of gas fees (called by validator after each block)
     * @param user Transaction sender
     * @param gasUsed Amount of gas used
     */
    function burnGasFees(address user, uint256 gasUsed) external payable {
        require(msg.value > 0, "No value sent");

        // Increment user transaction count
        userTransactionCount[user]++;

        // Calculate dynamic burn rate based on user activity
        uint256 burnRate = calculateBurnRate(user);

        // Calculate burn amount
        uint256 burnAmount = (msg.value * burnRate) / 100;

        // Ensure we don't go below minimum supply
        if (getCurrentSupply() - burnAmount < MINIMUM_SUPPLY) {
            burnAmount = getCurrentSupply() - MINIMUM_SUPPLY;
        }

        if (burnAmount > 0) {
            totalBurned += burnAmount;

            // Send to dead address
            (bool success, ) = deadAddress.call{value: burnAmount}("");
            require(success, "Burn failed");

            emit GasBurned(user, burnAmount, burnRate);
            emit TotalBurnedUpdated(totalBurned, getCurrentSupply());
        }

        // Return remaining to validator
        uint256 remaining = msg.value - burnAmount;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Burn portion of validator rewards
     * @param validator Validator address
     */
    function burnValidatorReward(address validator) external payable {
        require(msg.value > 0, "No value sent");

        uint256 burnAmount = (msg.value * validatorBurnPercentage) / 100;

        // Ensure we don't go below minimum supply
        if (getCurrentSupply() - burnAmount < MINIMUM_SUPPLY) {
            burnAmount = getCurrentSupply() - MINIMUM_SUPPLY;
        }

        if (burnAmount > 0) {
            totalBurned += burnAmount;

            (bool success, ) = deadAddress.call{value: burnAmount}("");
            require(success, "Burn failed");

            emit ValidatorRewardBurned(validator, burnAmount);
            emit TotalBurnedUpdated(totalBurned, getCurrentSupply());
        }

        // Return remaining to validator
        uint256 remaining = msg.value - burnAmount;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Burn portion of bridge fees
     */
    function burnBridgeFees() external payable {
        require(msg.value > 0, "No value sent");

        uint256 burnAmount = (msg.value * bridgeBurnPercentage) / 100;

        // Ensure we don't go below minimum supply
        if (getCurrentSupply() - burnAmount < MINIMUM_SUPPLY) {
            burnAmount = getCurrentSupply() - MINIMUM_SUPPLY;
        }

        if (burnAmount > 0) {
            totalBurned += burnAmount;

            (bool success, ) = deadAddress.call{value: burnAmount}("");
            require(success, "Burn failed");

            emit BridgeFeeBurned(burnAmount);
            emit TotalBurnedUpdated(totalBurned, getCurrentSupply());
        }

        // Return remaining to bridge contract
        uint256 remaining = msg.value - burnAmount;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Calculate dynamic burn rate based on user activity (Velocity Sink)
     * @param user User address
     * @return Burn rate percentage (50-80%)
     */
    function calculateBurnRate(address user) public view returns (uint256) {
        uint256 txCount = userTransactionCount[user];

        if (txCount < POWER_USER_THRESHOLD) {
            return BASE_BURN_RATE; // 50%
        } else if (txCount < HEAVY_USER_THRESHOLD) {
            return 60; // Power users burn 60%
        } else if (txCount < 1000) {
            return 70; // Heavy users burn 70%
        } else {
            return MAX_BURN_RATE; // 80% for very heavy users
        }
    }

    /**
     * @notice Get current circulating supply
     * @return Current supply (initial - burned)
     */
    function getCurrentSupply() public view returns (uint256) {
        return INITIAL_SUPPLY - totalBurned;
    }

    /**
     * @notice Get burn percentage (of initial supply)
     * @return Percentage burned (0-100)
     */
    function getBurnPercentage() external view returns (uint256) {
        return (totalBurned * 100) / INITIAL_SUPPLY;
    }

    /**
     * @notice Check if supply is at minimum floor
     * @return True if at floor
     */
    function isAtMinimumSupply() external view returns (bool) {
        return getCurrentSupply() <= MINIMUM_SUPPLY;
    }

    /**
     * @notice Get complete burn statistics
     */
    function getBurnStats() external view returns (
        uint256 _totalBurned,
        uint256 currentSupply,
        uint256 burnPercentage,
        uint256 remainingBurnCapacity,
        bool atFloor
    ) {
        uint256 supply = getCurrentSupply();
        return (
            totalBurned,
            supply,
            (totalBurned * 100) / INITIAL_SUPPLY,
            supply - MINIMUM_SUPPLY,
            supply <= MINIMUM_SUPPLY
        );
    }

    // ============ Admin Functions ============

    /**
     * @notice Update burn percentages
     * @param gasBurn Gas fee burn percentage
     * @param validatorBurn Validator reward burn percentage
     * @param bridgeBurn Bridge fee burn percentage
     */
    function updateBurnRates(
        uint256 gasBurn,
        uint256 validatorBurn,
        uint256 bridgeBurn
    ) external onlyOwner {
        require(gasBurn <= 80, "Gas burn too high");
        require(validatorBurn <= 20, "Validator burn too high");
        require(bridgeBurn <= 10, "Bridge burn too high");

        gasBurnPercentage = gasBurn;
        validatorBurnPercentage = validatorBurn;
        bridgeBurnPercentage = bridgeBurn;

        emit BurnRatesUpdated(gasBurn, validatorBurn, bridgeBurn);
    }

    /**
     * @notice Manual burn (for buyback & burn)
     */
    function manualBurn() external payable onlyOwner {
        require(msg.value > 0, "No value sent");
        require(getCurrentSupply() - msg.value >= MINIMUM_SUPPLY, "Would go below floor");

        totalBurned += msg.value;

        (bool success, ) = deadAddress.call{value: msg.value}("");
        require(success, "Burn failed");

        emit TotalBurnedUpdated(totalBurned, getCurrentSupply());
    }

    // ============ View Functions ============

    /**
     * @notice Get user's transaction count and burn rate
     */
    function getUserBurnInfo(address user) external view returns (
        uint256 txCount,
        uint256 burnRate,
        string memory tier
    ) {
        uint256 count = userTransactionCount[user];
        uint256 rate = calculateBurnRate(user);
        string memory tierName;

        if (count < POWER_USER_THRESHOLD) {
            tierName = "Standard (50%)";
        } else if (count < HEAVY_USER_THRESHOLD) {
            tierName = "Power User (60%)";
        } else if (count < 1000) {
            tierName = "Heavy User (70%)";
        } else {
            tierName = "Ultra User (80%)";
        }

        return (count, rate, tierName);
    }
}

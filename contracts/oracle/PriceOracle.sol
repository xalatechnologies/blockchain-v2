// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @notice Cross-chain price oracle for NOR token
 * @dev Stores prices from BSC and NorChain, allows authorized updaters
 *
 * Purpose: Maintain accurate cross-chain price feeds for:
 * - Arbitrage monitoring
 * - Automated rebalancing
 * - DApp integrations
 */
contract PriceOracle is Ownable {

    // Price data structure
    struct PriceData {
        uint256 price;          // Price in USD (18 decimals)
        uint256 timestamp;      // Last update time
        uint256 reserve0;       // Token reserve (e.g., NOR)
        uint256 reserve1;       // Quote reserve (e.g., USDT)
        address pair;           // DEX pair address
        bool isActive;          // Price feed active status
    }

    // Chain identifiers
    uint256 public constant BSC_CHAIN_ID = 56;
    uint256 public constant NORCHAIN_ID = 65001;

    // Price data by chain
    mapping(uint256 => PriceData) public prices;

    // Authorized price updaters (bot addresses)
    mapping(address => bool) public updaters;

    // Price deviation threshold (10% = 1000 basis points)
    uint256 public deviationThreshold = 1000; // 10%

    // Maximum price age (1 hour)
    uint256 public maxPriceAge = 3600;

    // Events
    event PriceUpdated(
        uint256 indexed chainId,
        uint256 price,
        uint256 reserve0,
        uint256 reserve1,
        address pair,
        uint256 timestamp
    );

    event UpdaterAdded(address indexed updater);
    event UpdaterRemoved(address indexed updater);
    event DeviationAlert(uint256 bscPrice, uint256 norchainPrice, uint256 deviation);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    constructor() {
        // Add deployer as initial updater
        updaters[msg.sender] = true;
        emit UpdaterAdded(msg.sender);
    }

    /**
     * @notice Update price for a specific chain
     * @param chainId Chain identifier (56 for BSC, 65001 for NorChain)
     * @param price Current price in USD (18 decimals)
     * @param reserve0 Token reserve amount
     * @param reserve1 Quote reserve amount
     * @param pair DEX pair address
     */
    function updatePrice(
        uint256 chainId,
        uint256 price,
        uint256 reserve0,
        uint256 reserve1,
        address pair
    ) external onlyUpdater {
        require(
            chainId == BSC_CHAIN_ID || chainId == NORCHAIN_ID,
            "Invalid chain ID"
        );
        require(price > 0, "Invalid price");
        require(pair != address(0), "Invalid pair");

        prices[chainId] = PriceData({
            price: price,
            timestamp: block.timestamp,
            reserve0: reserve0,
            reserve1: reserve1,
            pair: pair,
            isActive: true
        });

        emit PriceUpdated(chainId, price, reserve0, reserve1, pair, block.timestamp);

        // Check for price deviation
        _checkDeviation();
    }

    /**
     * @notice Get current price for a chain
     * @param chainId Chain identifier
     * @return price Current price
     * @return timestamp Last update timestamp
     * @return isStale Whether price is stale (older than maxPriceAge)
     */
    function getPrice(uint256 chainId)
        external
        view
        returns (
            uint256 price,
            uint256 timestamp,
            bool isStale
        )
    {
        PriceData memory data = prices[chainId];
        require(data.isActive, "Price feed not active");

        price = data.price;
        timestamp = data.timestamp;
        isStale = (block.timestamp - timestamp) > maxPriceAge;
    }

    /**
     * @notice Get price data for both chains
     * @return bscPrice BSC price
     * @return norchainPrice NorChain price
     * @return deviation Percentage deviation (basis points)
     * @return needsRebalancing Whether prices need rebalancing
     */
    function getPriceComparison()
        external
        view
        returns (
            uint256 bscPrice,
            uint256 norchainPrice,
            uint256 deviation,
            bool needsRebalancing
        )
    {
        PriceData memory bsc = prices[BSC_CHAIN_ID];
        PriceData memory norchain = prices[NORCHAIN_ID];

        require(bsc.isActive && norchain.isActive, "Price feeds not active");

        bscPrice = bsc.price;
        norchainPrice = norchain.price;

        // Calculate deviation in basis points
        if (bscPrice > norchainPrice) {
            deviation = ((bscPrice - norchainPrice) * 10000) / bscPrice;
        } else {
            deviation = ((norchainPrice - bscPrice) * 10000) / norchainPrice;
        }

        needsRebalancing = deviation > deviationThreshold;
    }

    /**
     * @notice Check if rebalancing is needed
     * @return needed Whether rebalancing is needed
     * @return deviation Current deviation in basis points
     */
    function needsRebalancing()
        external
        view
        returns (bool needed, uint256 deviation)
    {
        PriceData memory bsc = prices[BSC_CHAIN_ID];
        PriceData memory norchain = prices[NORCHAIN_ID];

        if (!bsc.isActive || !norchain.isActive) {
            return (false, 0);
        }

        // Calculate deviation
        if (bsc.price > norchain.price) {
            deviation = ((bsc.price - norchain.price) * 10000) / bsc.price;
        } else {
            deviation = ((norchain.price - bsc.price) * 10000) / norchain.price;
        }

        needed = deviation > deviationThreshold;
    }

    /**
     * @notice Check for price deviation and emit alert
     */
    function _checkDeviation() internal {
        PriceData memory bsc = prices[BSC_CHAIN_ID];
        PriceData memory norchain = prices[NORCHAIN_ID];

        if (!bsc.isActive || !norchain.isActive) {
            return;
        }

        uint256 deviation;
        if (bsc.price > norchain.price) {
            deviation = ((bsc.price - norchain.price) * 10000) / bsc.price;
        } else {
            deviation = ((norchain.price - bsc.price) * 10000) / norchain.price;
        }

        if (deviation > deviationThreshold) {
            emit DeviationAlert(bsc.price, norchain.price, deviation);
        }
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Add authorized price updater
     */
    function addUpdater(address updater) external onlyOwner {
        require(updater != address(0), "Invalid address");
        require(!updaters[updater], "Already updater");

        updaters[updater] = true;
        emit UpdaterAdded(updater);
    }

    /**
     * @notice Remove price updater
     */
    function removeUpdater(address updater) external onlyOwner {
        require(updaters[updater], "Not an updater");

        updaters[updater] = false;
        emit UpdaterRemoved(updater);
    }

    /**
     * @notice Update deviation threshold
     * @param newThreshold New threshold in basis points (1000 = 10%)
     */
    function setDeviationThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0 && newThreshold <= 10000, "Invalid threshold");

        uint256 oldThreshold = deviationThreshold;
        deviationThreshold = newThreshold;

        emit ThresholdUpdated(oldThreshold, newThreshold);
    }

    /**
     * @notice Update maximum price age
     * @param newMaxAge New maximum age in seconds
     */
    function setMaxPriceAge(uint256 newMaxAge) external onlyOwner {
        require(newMaxAge > 0, "Invalid age");
        maxPriceAge = newMaxAge;
    }

    /**
     * @notice Deactivate price feed for a chain
     */
    function deactivatePriceFeed(uint256 chainId) external onlyOwner {
        prices[chainId].isActive = false;
    }

    /**
     * @notice Activate price feed for a chain
     */
    function activatePriceFeed(uint256 chainId) external onlyOwner {
        prices[chainId].isActive = true;
    }

    // ========== MODIFIERS ==========

    modifier onlyUpdater() {
        require(updaters[msg.sender], "Not authorized updater");
        _;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockOracle
 * @notice Simple mock price oracle for testing purposes
 * @dev In production, replace with Chainlink, Band Protocol, or similar
 *
 * This oracle provides:
 * - Price feeds for gold, AED/USD, KES/USD
 * - Manual price updates for testing
 * - Historical price tracking
 *
 * Production Requirements:
 * - Use decentralized oracle networks (Chainlink, Band)
 * - Implement TWAP (Time-Weighted Average Price)
 * - Add staleness checks
 * - Include circuit breakers
 */
contract MockOracle is Ownable {
    // Current price (18 decimals)
    uint256 public price = 1 * 10**18; // Default: 1.0

    // Price update tracking
    uint256 public lastUpdateTimestamp;
    address public lastUpdater;

    // Historical prices
    struct PricePoint {
        uint256 price;
        uint256 timestamp;
    }

    PricePoint[] public priceHistory;
    uint256 public constant MAX_HISTORY = 100;

    // Events
    event PriceUpdated(uint256 newPrice, uint256 timestamp, address updatedBy);

    constructor() {
        lastUpdateTimestamp = block.timestamp;
        priceHistory.push(PricePoint(price, block.timestamp));
    }

    /**
     * @notice Sets the current price
     * @param _price New price in wei (18 decimals)
     */
    function setPrice(uint256 _price) external onlyOwner {
        require(_price > 0, "MockOracle: INVALID_PRICE");

        price = _price;
        lastUpdateTimestamp = block.timestamp;
        lastUpdater = msg.sender;

        // Add to history
        if (priceHistory.length >= MAX_HISTORY) {
            // Remove oldest price if at max capacity
            for (uint256 i = 0; i < priceHistory.length - 1; i++) {
                priceHistory[i] = priceHistory[i + 1];
            }
            priceHistory[priceHistory.length - 1] = PricePoint(_price, block.timestamp);
        } else {
            priceHistory.push(PricePoint(_price, block.timestamp));
        }

        emit PriceUpdated(_price, block.timestamp, msg.sender);
    }

    /**
     * @notice Returns the current price
     * @return Current price in wei (18 decimals)
     */
    function getPrice() external view returns (uint256) {
        return price;
    }

    /**
     * @notice Returns the latest price data
     * @return price Current price
     * @return timestamp Last update timestamp
     * @return updater Address that last updated the price
     */
    function getLatestData() external view returns (
        uint256,
        uint256,
        address
    ) {
        return (price, lastUpdateTimestamp, lastUpdater);
    }

    /**
     * @notice Returns price history length
     */
    function getPriceHistoryLength() external view returns (uint256) {
        return priceHistory.length;
    }

    /**
     * @notice Returns historical price at index
     * @param index Index in price history
     */
    function getPriceAt(uint256 index) external view returns (uint256 priceValue, uint256 timestamp) {
        require(index < priceHistory.length, "MockOracle: INDEX_OUT_OF_BOUNDS");
        PricePoint memory point = priceHistory[index];
        return (point.price, point.timestamp);
    }

    /**
     * @notice Calculates simple moving average over last N data points
     * @param periods Number of periods for moving average
     */
    function getMovingAverage(uint256 periods) external view returns (uint256 average) {
        require(periods > 0 && periods <= priceHistory.length, "MockOracle: INVALID_PERIODS");

        uint256 sum = 0;
        uint256 startIndex = priceHistory.length - periods;

        for (uint256 i = startIndex; i < priceHistory.length; i++) {
            sum += priceHistory[i].price;
        }

        average = sum / periods;
    }

    /**
     * @notice Returns time since last update
     */
    function timeSinceLastUpdate() external view returns (uint256) {
        return block.timestamp - lastUpdateTimestamp;
    }

    /**
     * @notice Checks if price is stale (older than specified time)
     * @param maxAge Maximum age in seconds
     * @return isStale True if price is older than maxAge
     */
    function isStale(uint256 maxAge) external view returns (bool) {
        return block.timestamp - lastUpdateTimestamp > maxAge;
    }
}

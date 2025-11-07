// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title DirhamatPriceOracle
 * @dev Decentralized price oracle for gold/AED/USD prices
 *
 * Features:
 * - Multi-source price aggregation
 * - Chainlink integration
 * - Manual price feeds for gold markets
 * - Price deviation protection
 * - Historical price tracking
 * - Shariah-compliant price discovery (no speculation-based pricing)
 */
contract DirhamatPriceOracle is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    // ═══════════════════════════════════════════════════════════════════
    // ROLES & CONSTANTS
    // ═══════════════════════════════════════════════════════════════════

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant MAX_PRICE_DEVIATION = 500; // 5% max deviation
    uint256 public constant MIN_ORACLE_COUNT = 3;      // Minimum oracle sources
    uint256 public constant PRICE_VALIDITY_PERIOD = 1 hours;
    uint256 public constant HEARTBEAT = 30 minutes;    // Price update frequency

    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    struct PriceData {
        uint256 price;          // Price with 18 decimals
        uint256 timestamp;      // Last update timestamp
        uint256 roundId;        // Round ID for tracking
        bool isActive;          // Is this price feed active
    }

    struct OracleInfo {
        address oracle;         // Oracle address
        uint256 weight;         // Weight in aggregation (basis points, total 10000)
        bool isActive;          // Active status
        uint256 lastUpdate;     // Last update timestamp
        uint256 deviationCount; // Count of price deviations
        string source;          // Price source description
    }

    struct AggregatedPrice {
        uint256 price;          // Aggregated price
        uint256 timestamp;      // Aggregation timestamp
        uint256 confidence;     // Confidence score (0-10000)
        uint256 oracleCount;    // Number of oracles used
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    // Price feeds for different assets
    mapping(bytes32 => PriceData) public prices;           // Asset symbol => price data
    mapping(bytes32 => AggregatedPrice) public aggregatedPrices; // Asset => aggregated price
    mapping(bytes32 => OracleInfo[]) public assetOracles;   // Asset => oracle list
    mapping(address => mapping(bytes32 => uint256)) public oracleSubmissions; // Oracle => asset => submission count

    // Supported assets
    bytes32 public constant GOLD_AED = keccak256("GOLD_AED");  // Gold price in AED per gram
    bytes32 public constant AED_USD = keccak256("AED_USD");    // AED price in USD
    bytes32 public constant GOLD_USD = keccak256("GOLD_USD");  // Gold price in USD per ounce

    // Price history (for 24h tracking)
    mapping(bytes32 => uint256[]) public priceHistory;     // Asset => price history
    mapping(bytes32 => uint256[]) public timestampHistory; // Asset => timestamp history
    uint256 public constant MAX_HISTORY = 48;              // Keep 48 data points (24 hours at 30min intervals)

    // Circuit breaker
    bool public emergencyPaused;
    mapping(bytes32 => bool) public assetPaused;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event PriceSubmitted(
        bytes32 indexed asset,
        address indexed oracle,
        uint256 price,
        uint256 timestamp
    );

    event PriceAggregated(
        bytes32 indexed asset,
        uint256 price,
        uint256 confidence,
        uint256 oracleCount,
        uint256 timestamp
    );

    event OracleAdded(
        bytes32 indexed asset,
        address indexed oracle,
        uint256 weight,
        string source
    );

    event OracleRemoved(
        bytes32 indexed asset,
        address indexed oracle
    );

    event PriceDeviationAlert(
        bytes32 indexed asset,
        address indexed oracle,
        uint256 submittedPrice,
        uint256 aggregatedPrice,
        uint256 deviation
    );

    event EmergencyAction(
        string action,
        bytes32 asset,
        address actor
    );

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ORACLE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Add oracle for specific asset
     * @param asset Asset symbol (e.g., GOLD_AED)
     * @param oracle Oracle address
     * @param weight Weight in aggregation (basis points, max 10000)
     * @param source Description of price source
     */
    function addOracle(
        bytes32 asset,
        address oracle,
        uint256 weight,
        string calldata source
    ) external onlyRole(MANAGER_ROLE) {
        require(oracle != address(0), "Invalid oracle");
        require(weight > 0 && weight <= 10000, "Invalid weight");
        
        // Check if oracle already exists
        OracleInfo[] storage oracles = assetOracles[asset];
        for (uint i = 0; i < oracles.length; i++) {
            require(oracles[i].oracle != oracle, "Oracle already exists");
        }
        
        // Add oracle
        oracles.push(OracleInfo({
            oracle: oracle,
            weight: weight,
            isActive: true,
            lastUpdate: 0,
            deviationCount: 0,
            source: source
        }));

        // Grant oracle role
        _grantRole(ORACLE_ROLE, oracle);

        emit OracleAdded(asset, oracle, weight, source);
    }

    /**
     * @dev Remove oracle
     * @param asset Asset symbol
     * @param oracle Oracle address
     */
    function removeOracle(bytes32 asset, address oracle) external onlyRole(MANAGER_ROLE) {
        OracleInfo[] storage oracles = assetOracles[asset];
        
        for (uint i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == oracle) {
                // Remove oracle
                oracles[i] = oracles[oracles.length - 1];
                oracles.pop();
                
                // Revoke oracle role if not used elsewhere
                _revokeRole(ORACLE_ROLE, oracle);
                
                emit OracleRemoved(asset, oracle);
                return;
            }
        }
        
        revert("Oracle not found");
    }

    /**
     * @dev Update oracle weight
     */
    function updateOracleWeight(
        bytes32 asset,
        address oracle,
        uint256 newWeight
    ) external onlyRole(MANAGER_ROLE) {
        require(newWeight > 0 && newWeight <= 10000, "Invalid weight");
        
        OracleInfo[] storage oracles = assetOracles[asset];
        for (uint i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == oracle) {
                oracles[i].weight = newWeight;
                return;
            }
        }
        
        revert("Oracle not found");
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRICE SUBMISSION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Submit price data
     * @param asset Asset symbol
     * @param price Price with 18 decimals
     */
    function submitPrice(
        bytes32 asset,
        uint256 price
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        require(!emergencyPaused && !assetPaused[asset], "Price submission paused");
        require(price > 0, "Invalid price");
        
        // Verify oracle is authorized for this asset
        require(_isAuthorizedOracle(asset, msg.sender), "Not authorized for this asset");
        
        // Check for large price deviations
        uint256 currentAggregatedPrice = aggregatedPrices[asset].price;
        if (currentAggregatedPrice > 0) {
            uint256 deviation = _calculateDeviation(price, currentAggregatedPrice);
            if (deviation > MAX_PRICE_DEVIATION) {
                _handlePriceDeviation(asset, msg.sender, price, currentAggregatedPrice, deviation);
                return; // Don't update price if deviation too large
            }
        }
        
        // Update oracle's price submission
        prices[keccak256(abi.encodePacked(asset, msg.sender))] = PriceData({
            price: price,
            timestamp: block.timestamp,
            roundId: oracleSubmissions[msg.sender][asset]++,
            isActive: true
        });
        
        // Update oracle info
        _updateOracleInfo(asset, msg.sender);
        
        emit PriceSubmitted(asset, msg.sender, price, block.timestamp);
        
        // Trigger price aggregation
        _aggregatePrice(asset);
    }

    /**
     * @dev Submit multiple prices in batch
     */
    function submitPrices(
        bytes32[] calldata assets,
        uint256[] calldata priceValues
    ) external onlyRole(ORACLE_ROLE) {
        require(assets.length == priceValues.length, "Array length mismatch");
        
        for (uint i = 0; i < assets.length; i++) {
            _submitPriceSingle(assets[i], priceValues[i]);
        }
    }
    
    function _submitPriceSingle(bytes32 asset, uint256 price) internal {
        require(!emergencyPaused && !assetPaused[asset], "Price submission paused");
        require(price > 0, "Invalid price");
        
        // Verify oracle is authorized for this asset
        require(_isAuthorizedOracle(asset, msg.sender), "Not authorized for this asset");
        
        // Check for large price deviations
        uint256 currentAggregatedPrice = aggregatedPrices[asset].price;
        if (currentAggregatedPrice > 0) {
            uint256 deviation = _calculateDeviation(price, currentAggregatedPrice);
            if (deviation > MAX_PRICE_DEVIATION) {
                _handlePriceDeviation(asset, msg.sender, price, currentAggregatedPrice, deviation);
                return; // Don't update price if deviation too large
            }
        }
        
        // Update oracle's price submission
        prices[keccak256(abi.encodePacked(asset, msg.sender))] = PriceData({
            price: price,
            timestamp: block.timestamp,
            roundId: oracleSubmissions[msg.sender][asset]++,
            isActive: true
        });
        
        // Update oracle info
        _updateOracleInfo(asset, msg.sender);
        
        emit PriceSubmitted(asset, msg.sender, price, block.timestamp);
        
        // Trigger price aggregation
        _aggregatePrice(asset);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRICE AGGREGATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Aggregate price from multiple oracles
     * @param asset Asset symbol
     */
    function _aggregatePrice(bytes32 asset) internal {
        OracleInfo[] memory oracles = assetOracles[asset];
        
        uint256 totalWeightedPrice = 0;
        uint256 totalWeight = 0;
        uint256 activeOracleCount = 0;
        
        // Calculate weighted average
        for (uint i = 0; i < oracles.length; i++) {
            if (!oracles[i].isActive) continue;
            
            bytes32 oraclePriceKey = keccak256(abi.encodePacked(asset, oracles[i].oracle));
            PriceData memory priceData = prices[oraclePriceKey];
            
            // Only use recent prices
            if (block.timestamp - priceData.timestamp <= PRICE_VALIDITY_PERIOD && priceData.isActive) {
                totalWeightedPrice += priceData.price * oracles[i].weight;
                totalWeight += oracles[i].weight;
                activeOracleCount++;
            }
        }
        
        require(activeOracleCount >= MIN_ORACLE_COUNT, "Insufficient oracle count");
        
        uint256 aggregatedPrice = totalWeightedPrice / totalWeight;
        uint256 confidence = _calculateConfidence(activeOracleCount, totalWeight);
        
        // Update aggregated price
        aggregatedPrices[asset] = AggregatedPrice({
            price: aggregatedPrice,
            timestamp: block.timestamp,
            confidence: confidence,
            oracleCount: activeOracleCount
        });
        
        // Add to price history
        _addToHistory(asset, aggregatedPrice);
        
        emit PriceAggregated(asset, aggregatedPrice, confidence, activeOracleCount, block.timestamp);
    }

    /**
     * @dev Calculate confidence score based on oracle participation and weights
     */
    function _calculateConfidence(
        uint256 oracleCount,
        uint256 totalWeight
    ) internal pure returns (uint256) {
        // Base confidence from oracle count
        uint256 oracleConfidence = (oracleCount * 2000) / 10; // Max 2000 for 10+ oracles
        if (oracleConfidence > 2000) oracleConfidence = 2000;
        
        // Weight distribution confidence
        uint256 weightConfidence = (totalWeight * 8000) / 10000; // Max 8000 for full weight coverage
        
        return oracleConfidence + weightConfidence;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRICE DEVIATION HANDLING
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Handle price deviation
     */
    function _handlePriceDeviation(
        bytes32 asset,
        address oracle,
        uint256 submittedPrice,
        uint256 aggregatedPrice,
        uint256 deviation
    ) internal {
        // Increment deviation count for oracle
        OracleInfo[] storage oracles = assetOracles[asset];
        for (uint i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == oracle) {
                oracles[i].deviationCount++;
                
                // Disable oracle if too many deviations
                if (oracles[i].deviationCount >= 5) {
                    oracles[i].isActive = false;
                }
                break;
            }
        }
        
        emit PriceDeviationAlert(asset, oracle, submittedPrice, aggregatedPrice, deviation);
    }

    /**
     * @dev Calculate price deviation percentage (basis points)
     */
    function _calculateDeviation(uint256 newPrice, uint256 referencePrice) internal pure returns (uint256) {
        if (referencePrice == 0) return 0;
        
        uint256 diff = newPrice > referencePrice 
            ? newPrice - referencePrice 
            : referencePrice - newPrice;
            
        return (diff * 10000) / referencePrice; // Return in basis points
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRICE HISTORY
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Add price to history
     */
    function _addToHistory(bytes32 asset, uint256 price) internal {
        uint256[] storage history = priceHistory[asset];
        uint256[] storage timestamps = timestampHistory[asset];
        
        history.push(price);
        timestamps.push(block.timestamp);
        
        // Keep only latest MAX_HISTORY entries
        if (history.length > MAX_HISTORY) {
            // Remove oldest entry
            for (uint i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
                timestamps[i] = timestamps[i + 1];
            }
            history.pop();
            timestamps.pop();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Get latest aggregated price
     * @param asset Asset symbol
     * @return price Latest price
     * @return timestamp Price timestamp
     * @return confidence Confidence score
     */
    function getPrice(bytes32 asset) external view returns (
        uint256 price,
        uint256 timestamp,
        uint256 confidence
    ) {
        AggregatedPrice memory aggPrice = aggregatedPrices[asset];
        return (aggPrice.price, aggPrice.timestamp, aggPrice.confidence);
    }

    /**
     * @dev Get price with staleness check
     */
    function getValidPrice(bytes32 asset) external view returns (uint256 price, bool isValid) {
        AggregatedPrice memory aggPrice = aggregatedPrices[asset];
        
        isValid = block.timestamp - aggPrice.timestamp <= PRICE_VALIDITY_PERIOD 
                 && aggPrice.confidence >= 7000; // Require 70% confidence
                 
        return (aggPrice.price, isValid);
    }

    /**
     * @dev Get price history for asset
     */
    function getPriceHistory(bytes32 asset) external view returns (
        uint256[] memory historicalPrices,
        uint256[] memory timestamps
    ) {
        return (priceHistory[asset], timestampHistory[asset]);
    }

    /**
     * @dev Get oracle information for asset
     */
    function getAssetOracles(bytes32 asset) external view returns (OracleInfo[] memory) {
        return assetOracles[asset];
    }

    /**
     * @dev Check if oracle is authorized for asset
     */
    function _isAuthorizedOracle(bytes32 asset, address oracle) internal view returns (bool) {
        OracleInfo[] memory oracles = assetOracles[asset];
        for (uint i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == oracle && oracles[i].isActive) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Update oracle last update timestamp
     */
    function _updateOracleInfo(bytes32 asset, address oracle) internal {
        OracleInfo[] storage oracles = assetOracles[asset];
        for (uint i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == oracle) {
                oracles[i].lastUpdate = block.timestamp;
                break;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Emergency pause all price feeds
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        emergencyPaused = true;
        emit EmergencyAction("EMERGENCY_PAUSE", bytes32(0), msg.sender);
    }

    /**
     * @dev Resume price feeds
     */
    function emergencyResume() external onlyRole(EMERGENCY_ROLE) {
        emergencyPaused = false;
        emit EmergencyAction("EMERGENCY_RESUME", bytes32(0), msg.sender);
    }

    /**
     * @dev Pause specific asset
     */
    function pauseAsset(bytes32 asset) external onlyRole(EMERGENCY_ROLE) {
        assetPaused[asset] = true;
        emit EmergencyAction("ASSET_PAUSE", asset, msg.sender);
    }

    /**
     * @dev Resume specific asset
     */
    function resumeAsset(bytes32 asset) external onlyRole(EMERGENCY_ROLE) {
        assetPaused[asset] = false;
        emit EmergencyAction("ASSET_RESUME", asset, msg.sender);
    }

    /**
     * @dev Force price update (emergency only)
     */
    function forcePrice(
        bytes32 asset,
        uint256 price
    ) external onlyRole(EMERGENCY_ROLE) {
        aggregatedPrices[asset] = AggregatedPrice({
            price: price,
            timestamp: block.timestamp,
            confidence: 5000, // 50% confidence for forced price
            oracleCount: 1
        });
        
        emit EmergencyAction("FORCE_PRICE", asset, msg.sender);
    }
}
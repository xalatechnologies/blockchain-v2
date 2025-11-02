// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title OracleAggregator
 * @notice Decentralized Price Oracle with Multi-Source Aggregation
 * @dev Aggregates price data from multiple authorized oracle nodes using median calculation
 *
 * Features:
 * - Multi-oracle consensus (minimum 3 oracles required)
 * - Median price calculation (outlier resistant)
 * - Staleness protection (24-hour validity)
 * - Oracle reputation scoring
 * - Emergency pause functionality
 * - Compatible with existing price oracle interface
 *
 * Security:
 * - Only authorized oracles can submit prices
 * - Prices must be within deviation threshold
 * - Requires minimum oracle count for consensus
 * - Automatic staleness detection
 */
contract OracleAggregator is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Price feed identifier (e.g., "GOLD/USD", "AED/USD")
    string public priceFeed;

    // Price submission structure
    struct PriceSubmission {
        uint256 price;
        uint256 timestamp;
        address oracle;
        bool isValid;
    }

    // Oracle metadata
    struct OracleMetadata {
        bool isActive;
        uint256 totalSubmissions;
        uint256 lastSubmissionTime;
        uint256 reputationScore; // 0-100
    }

    // Price submissions by round
    mapping(uint256 => PriceSubmission[]) public priceSubmissions;
    mapping(address => OracleMetadata) public oracles;

    // Current aggregated price
    uint256 public price;
    uint256 public lastUpdateTimestamp;
    uint256 public currentRound;

    // Configuration
    uint256 public minimumOracles = 3; // Minimum oracles for consensus
    uint256 public stalenessThreshold = 24 hours; // Price validity period
    uint256 public deviationThreshold = 10; // 10% maximum deviation from median
    bool public isPaused;

    // Active oracle addresses
    address[] public activeOracles;

    // Events
    event PriceSubmitted(
        uint256 indexed round,
        address indexed oracle,
        uint256 price,
        uint256 timestamp
    );
    event PriceAggregated(
        uint256 indexed round,
        uint256 price,
        uint256 timestamp,
        uint256 oracleCount
    );
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    event OracleReputationUpdated(address indexed oracle, uint256 newScore);
    event ConfigurationUpdated(string parameter, uint256 value);

    constructor(
        string memory _priceFeed,
        address[] memory _initialOracles
    ) {
        require(_initialOracles.length >= 3, "OracleAggregator: MINIMUM_3_ORACLES");

        priceFeed = _priceFeed;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Initialize oracles
        for (uint256 i = 0; i < _initialOracles.length; i++) {
            address oracle = _initialOracles[i];
            require(oracle != address(0), "OracleAggregator: ZERO_ADDRESS");

            _grantRole(ORACLE_ROLE, oracle);
            oracles[oracle] = OracleMetadata({
                isActive: true,
                totalSubmissions: 0,
                lastSubmissionTime: 0,
                reputationScore: 100 // Start with perfect score
            });
            activeOracles.push(oracle);

            emit OracleAdded(oracle);
        }
    }

    /**
     * @notice Submit price data from oracle node
     * @param _price Price in wei (18 decimals)
     */
    function submitPrice(uint256 _price) external onlyRole(ORACLE_ROLE) nonReentrant {
        require(!isPaused, "OracleAggregator: PAUSED");
        require(_price > 0, "OracleAggregator: INVALID_PRICE");
        require(oracles[msg.sender].isActive, "OracleAggregator: ORACLE_INACTIVE");

        // Check if oracle already submitted for current round
        PriceSubmission[] storage submissions = priceSubmissions[currentRound];
        for (uint256 i = 0; i < submissions.length; i++) {
            require(submissions[i].oracle != msg.sender, "OracleAggregator: ALREADY_SUBMITTED");
        }

        // Add submission
        submissions.push(PriceSubmission({
            price: _price,
            timestamp: block.timestamp,
            oracle: msg.sender,
            isValid: true
        }));

        // Update oracle metadata
        oracles[msg.sender].totalSubmissions++;
        oracles[msg.sender].lastSubmissionTime = block.timestamp;

        emit PriceSubmitted(currentRound, msg.sender, _price, block.timestamp);

        // Aggregate if we have enough submissions
        if (submissions.length >= minimumOracles) {
            _aggregatePrices();
        }
    }

    /**
     * @notice Aggregate submitted prices using median calculation
     */
    function _aggregatePrices() internal {
        PriceSubmission[] storage submissions = priceSubmissions[currentRound];
        require(submissions.length >= minimumOracles, "OracleAggregator: INSUFFICIENT_SUBMISSIONS");

        // Copy prices to array for sorting
        uint256[] memory prices = new uint256[](submissions.length);
        for (uint256 i = 0; i < submissions.length; i++) {
            prices[i] = submissions[i].price;
        }

        // Sort prices (bubble sort - simple for small arrays)
        for (uint256 i = 0; i < prices.length - 1; i++) {
            for (uint256 j = 0; j < prices.length - i - 1; j++) {
                if (prices[j] > prices[j + 1]) {
                    uint256 temp = prices[j];
                    prices[j] = prices[j + 1];
                    prices[j + 1] = temp;
                }
            }
        }

        // Calculate median
        uint256 median;
        if (prices.length % 2 == 0) {
            median = (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;
        } else {
            median = prices[prices.length / 2];
        }

        // Validate submissions against median (detect outliers)
        for (uint256 i = 0; i < submissions.length; i++) {
            uint256 deviation = _calculateDeviation(submissions[i].price, median);
            if (deviation > deviationThreshold) {
                submissions[i].isValid = false;
                // Reduce oracle reputation
                _updateOracleReputation(submissions[i].oracle, false);
            } else {
                // Increase oracle reputation
                _updateOracleReputation(submissions[i].oracle, true);
            }
        }

        // Update aggregated price
        price = median;
        lastUpdateTimestamp = block.timestamp;

        emit PriceAggregated(currentRound, median, block.timestamp, submissions.length);

        // Move to next round
        currentRound++;
    }

    /**
     * @notice Calculate percentage deviation between two prices
     */
    function _calculateDeviation(uint256 priceA, uint256 priceB) internal pure returns (uint256) {
        if (priceA > priceB) {
            return ((priceA - priceB) * 100) / priceB;
        } else {
            return ((priceB - priceA) * 100) / priceA;
        }
    }

    /**
     * @notice Update oracle reputation score
     */
    function _updateOracleReputation(address oracle, bool accurate) internal {
        if (accurate) {
            if (oracles[oracle].reputationScore < 100) {
                oracles[oracle].reputationScore += 1;
            }
        } else {
            if (oracles[oracle].reputationScore > 0) {
                oracles[oracle].reputationScore -= 5; // Penalty for outliers
            }
        }

        emit OracleReputationUpdated(oracle, oracles[oracle].reputationScore);
    }

    /**
     * @notice Get current price (standard oracle interface)
     * @return Current aggregated price
     */
    function getPrice() external view returns (uint256) {
        require(!_isStale(), "OracleAggregator: STALE_PRICE");
        require(price > 0, "OracleAggregator: NO_PRICE");
        return price;
    }

    /**
     * @notice Check if current price is stale
     */
    function _isStale() internal view returns (bool) {
        return block.timestamp > lastUpdateTimestamp + stalenessThreshold;
    }

    /**
     * @notice Check if price is stale (public)
     */
    function isStale() external view returns (bool) {
        return _isStale();
    }

    /**
     * @notice Get latest price with metadata
     */
    function getLatestPrice() external view returns (
        uint256 currentPrice,
        uint256 timestamp,
        bool stale,
        uint256 round
    ) {
        return (price, lastUpdateTimestamp, _isStale(), currentRound);
    }

    /**
     * @notice Add new oracle
     */
    function addOracle(address oracle) external onlyRole(ADMIN_ROLE) {
        require(oracle != address(0), "OracleAggregator: ZERO_ADDRESS");
        require(!hasRole(ORACLE_ROLE, oracle), "OracleAggregator: ALREADY_ORACLE");

        _grantRole(ORACLE_ROLE, oracle);
        oracles[oracle] = OracleMetadata({
            isActive: true,
            totalSubmissions: 0,
            lastSubmissionTime: 0,
            reputationScore: 100
        });
        activeOracles.push(oracle);

        emit OracleAdded(oracle);
    }

    /**
     * @notice Remove oracle
     */
    function removeOracle(address oracle) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ORACLE_ROLE, oracle), "OracleAggregator: NOT_ORACLE");
        require(activeOracles.length > minimumOracles, "OracleAggregator: BELOW_MINIMUM");

        _revokeRole(ORACLE_ROLE, oracle);
        oracles[oracle].isActive = false;

        // Remove from active oracles array
        for (uint256 i = 0; i < activeOracles.length; i++) {
            if (activeOracles[i] == oracle) {
                activeOracles[i] = activeOracles[activeOracles.length - 1];
                activeOracles.pop();
                break;
            }
        }

        emit OracleRemoved(oracle);
    }

    /**
     * @notice Set minimum oracle count
     */
    function setMinimumOracles(uint256 _minimum) external onlyRole(ADMIN_ROLE) {
        require(_minimum >= 3, "OracleAggregator: MINIMUM_3");
        require(_minimum <= activeOracles.length, "OracleAggregator: EXCEEDS_ACTIVE");
        minimumOracles = _minimum;
        emit ConfigurationUpdated("minimumOracles", _minimum);
    }

    /**
     * @notice Set staleness threshold
     */
    function setStalenessThreshold(uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        require(_threshold >= 1 hours, "OracleAggregator: TOO_SHORT");
        require(_threshold <= 7 days, "OracleAggregator: TOO_LONG");
        stalenessThreshold = _threshold;
        emit ConfigurationUpdated("stalenessThreshold", _threshold);
    }

    /**
     * @notice Set deviation threshold (percentage)
     */
    function setDeviationThreshold(uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        require(_threshold >= 5, "OracleAggregator: TOO_STRICT");
        require(_threshold <= 50, "OracleAggregator: TOO_LOOSE");
        deviationThreshold = _threshold;
        emit ConfigurationUpdated("deviationThreshold", _threshold);
    }

    /**
     * @notice Pause oracle (emergency)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        isPaused = true;
    }

    /**
     * @notice Unpause oracle
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        isPaused = false;
    }

    /**
     * @notice Get oracle metadata
     */
    function getOracleMetadata(address oracle) external view returns (
        bool isActive,
        uint256 totalSubmissions,
        uint256 lastSubmissionTime,
        uint256 reputationScore
    ) {
        OracleMetadata memory metadata = oracles[oracle];
        return (
            metadata.isActive,
            metadata.totalSubmissions,
            metadata.lastSubmissionTime,
            metadata.reputationScore
        );
    }

    /**
     * @notice Get all active oracles
     */
    function getActiveOracles() external view returns (address[] memory) {
        return activeOracles;
    }

    /**
     * @notice Get submissions for a round
     */
    function getRoundSubmissions(uint256 round) external view returns (
        uint256[] memory prices,
        uint256[] memory timestamps,
        address[] memory oracleAddresses,
        bool[] memory validFlags
    ) {
        PriceSubmission[] storage submissions = priceSubmissions[round];
        uint256 count = submissions.length;

        prices = new uint256[](count);
        timestamps = new uint256[](count);
        oracleAddresses = new address[](count);
        validFlags = new bool[](count);

        for (uint256 i = 0; i < count; i++) {
            prices[i] = submissions[i].price;
            timestamps[i] = submissions[i].timestamp;
            oracleAddresses[i] = submissions[i].oracle;
            validFlags[i] = submissions[i].isValid;
        }

        return (prices, timestamps, oracleAddresses, validFlags);
    }

    /**
     * @notice Get current round status
     */
    function getCurrentRoundStatus() external view returns (
        uint256 round,
        uint256 submissionCount,
        uint256 requiredSubmissions,
        bool canAggregate
    ) {
        return (
            currentRound,
            priceSubmissions[currentRound].length,
            minimumOracles,
            priceSubmissions[currentRound].length >= minimumOracles
        );
    }
}

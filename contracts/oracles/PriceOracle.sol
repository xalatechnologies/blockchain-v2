// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PriceOracle
 * @notice Centralized price oracle with multi-sig update mechanism
 * @dev Provides price feeds for BTCBR, NOR, and Dirhamat tokens
 */
contract PriceOracle is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 confidence; // Basis points (10000 = 100%)
    }
    
    struct PriceUpdate {
        address token;
        uint256 price;
        uint256 timestamp;
        address[] validators;
        mapping(address => bool) hasValidated;
        uint256 validationCount;
        bool executed;
    }
    
    mapping(address => PriceData) public prices;
    mapping(bytes32 => PriceUpdate) public pendingUpdates;
    
    uint256 public requiredValidations = 2; // 2-of-3 multisig
    uint256 public maxPriceAge = 1 hours;
    uint256 public maxPriceDeviation = 1000; // 10% max deviation
    
    event PriceUpdated(
        address indexed token,
        uint256 price,
        uint256 timestamp,
        uint256 confidence
    );
    
    event PriceUpdateProposed(
        bytes32 indexed updateId,
        address indexed token,
        uint256 price,
        address proposer
    );
    
    event PriceUpdateValidated(
        bytes32 indexed updateId,
        address indexed validator
    );
    
    event PriceUpdateExecuted(bytes32 indexed updateId);
    
    constructor(address[] memory _oracles, address[] memory _validators) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        for (uint256 i = 0; i < _oracles.length; i++) {
            _grantRole(ORACLE_ROLE, _oracles[i]);
        }
        
        for (uint256 i = 0; i < _validators.length; i++) {
            _grantRole(VALIDATOR_ROLE, _validators[i]);
        }
    }
    
    function proposePrice(
        address token,
        uint256 price,
        uint256 confidence
    ) external onlyRole(ORACLE_ROLE) returns (bytes32) {
        require(token != address(0), "PriceOracle: INVALID_TOKEN");
        require(price > 0, "PriceOracle: INVALID_PRICE");
        require(confidence <= 10000, "PriceOracle: INVALID_CONFIDENCE");
        
        bytes32 updateId = keccak256(
            abi.encodePacked(token, price, block.timestamp, msg.sender)
        );
        
        PriceUpdate storage update = pendingUpdates[updateId];
        update.token = token;
        update.price = price;
        update.timestamp = block.timestamp;
        update.validationCount = 0;
        update.executed = false;
        
        emit PriceUpdateProposed(updateId, token, price, msg.sender);
        
        return updateId;
    }
    
    function validatePrice(bytes32 updateId) external onlyRole(VALIDATOR_ROLE) {
        PriceUpdate storage update = pendingUpdates[updateId];
        require(update.price > 0, "PriceOracle: UPDATE_NOT_FOUND");
        require(!update.executed, "PriceOracle: ALREADY_EXECUTED");
        require(!update.hasValidated[msg.sender], "PriceOracle: ALREADY_VALIDATED");
        
        // Check price deviation if previous price exists
        PriceData storage currentPrice = prices[update.token];
        if (currentPrice.price > 0) {
            uint256 deviation = _calculateDeviation(currentPrice.price, update.price);
            require(
                deviation <= maxPriceDeviation,
                "PriceOracle: PRICE_DEVIATION_TOO_HIGH"
            );
        }
        
        update.hasValidated[msg.sender] = true;
        update.validators.push(msg.sender);
        update.validationCount++;
        
        emit PriceUpdateValidated(updateId, msg.sender);
        
        // Auto-execute if threshold reached
        if (update.validationCount >= requiredValidations) {
            _executeUpdate(updateId);
        }
    }
    
    function _executeUpdate(bytes32 updateId) internal {
        PriceUpdate storage update = pendingUpdates[updateId];
        require(!update.executed, "PriceOracle: ALREADY_EXECUTED");
        require(
            update.validationCount >= requiredValidations,
            "PriceOracle: INSUFFICIENT_VALIDATIONS"
        );
        
        prices[update.token] = PriceData({
            price: update.price,
            timestamp: block.timestamp,
            confidence: 10000 // Full confidence after multi-sig
        });
        
        update.executed = true;
        
        emit PriceUpdateExecuted(updateId);
        emit PriceUpdated(update.token, update.price, block.timestamp, 10000);
    }
    
    function getPrice(address token) external view returns (uint256, uint256) {
        PriceData storage priceData = prices[token];
        require(priceData.price > 0, "PriceOracle: PRICE_NOT_AVAILABLE");
        require(
            block.timestamp - priceData.timestamp <= maxPriceAge,
            "PriceOracle: PRICE_STALE"
        );
        
        return (priceData.price, priceData.timestamp);
    }
    
    function getPriceUnsafe(address token) external view returns (uint256) {
        return prices[token].price;
    }
    
    function isPriceStale(address token) external view returns (bool) {
        PriceData storage priceData = prices[token];
        return block.timestamp - priceData.timestamp > maxPriceAge;
    }
    
    function _calculateDeviation(uint256 oldPrice, uint256 newPrice)
        internal
        pure
        returns (uint256)
    {
        if (oldPrice == 0) return 0;
        
        uint256 diff = oldPrice > newPrice ? oldPrice - newPrice : newPrice - oldPrice;
        return (diff * 10000) / oldPrice;
    }
    
    function setRequiredValidations(uint256 _required) external onlyRole(DEFAULT_ADMIN_ROLE) {
        requiredValidations = _required;
    }
    
    function setMaxPriceAge(uint256 _maxAge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPriceAge = _maxAge;
    }
    
    function setMaxPriceDeviation(uint256 _maxDeviation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPriceDeviation = _maxDeviation;
    }
    
    function emergencySetPrice(
        address token,
        uint256 price,
        uint256 confidence
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        prices[token] = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence
        });
        
        emit PriceUpdated(token, price, block.timestamp, confidence);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NorTronBridge
 * @notice Bridge contract for transferring NOR tokens between NorChain and Tron
 * @dev Implements lock/mint mechanism with multi-sig validation
 *
 * Architecture:
 * - NorChain side: Lock NOR tokens
 * - Tron side: Mint equivalent TRC-20 NOR tokens
 * - Validators sign cross-chain transfers
 * - 2-of-3 multi-sig for security
 *
 * Features:
 * - Bi-directional bridging (NorChain ↔ Tron)
 * - Multi-validator consensus
 * - Emergency pause capability
 * - Transfer limits and fees
 * - Nonce-based replay protection
 */
contract NorTronBridge is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice The NOR token on NorChain
    IERC20 public norToken;

    /// @notice Minimum validators required for consensus (2-of-3)
    uint256 public constant REQUIRED_VALIDATORS = 2;

    /// @notice Bridge fee in basis points (e.g., 10 = 0.1%)
    uint256 public bridgeFee = 10;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Minimum bridge amount
    uint256 public minBridgeAmount = 100 * 10**18; // 100 NOR

    /// @notice Maximum bridge amount per transaction
    uint256 public maxBridgeAmount = 1000000 * 10**18; // 1M NOR

    /// @notice Daily bridge limit per address
    uint256 public dailyLimit = 5000000 * 10**18; // 5M NOR

    /// @notice Tracking daily usage per address
    mapping(address => uint256) public dailyUsage;
    mapping(address => uint256) public lastUsageReset;

    /// @notice Nonce tracking for replay protection
    mapping(bytes32 => bool) public processedTransfers;

    /// @notice Validator signatures for pending transfers
    mapping(bytes32 => address[]) public transferSignatures;

    struct Transfer {
        address from;
        address to;
        uint256 amount;
        uint256 nonce;
        bytes32 tronTxHash; // For Tron → NorChain transfers
        bool processed;
    }

    /// @notice Pending transfers awaiting validator confirmation
    mapping(bytes32 => Transfer) public pendingTransfers;

    /// @notice Emitted when tokens are locked for bridging to Tron
    event TokensLocked(
        address indexed from,
        address indexed tronAddress,
        uint256 amount,
        uint256 fee,
        bytes32 indexed transferId
    );

    /// @notice Emitted when tokens are unlocked from Tron bridge
    event TokensUnlocked(
        address indexed to,
        uint256 amount,
        bytes32 indexed tronTxHash,
        bytes32 indexed transferId
    );

    /// @notice Emitted when a validator signs a transfer
    event TransferSigned(
        bytes32 indexed transferId,
        address indexed validator,
        uint256 signatureCount
    );

    /// @notice Emitted when a transfer is completed
    event TransferCompleted(
        bytes32 indexed transferId,
        address indexed to,
        uint256 amount
    );

    constructor(
        address _norToken,
        address _feeCollector,
        address[] memory _validators
    ) {
        require(_norToken != address(0), "ZERO_NOR_TOKEN");
        require(_feeCollector != address(0), "ZERO_FEE_COLLECTOR");
        require(_validators.length >= 3, "NEED_3_VALIDATORS");

        norToken = IERC20(_norToken);
        feeCollector = _feeCollector;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Grant validator roles
        for (uint256 i = 0; i < _validators.length; i++) {
            require(_validators[i] != address(0), "ZERO_VALIDATOR");
            _grantRole(VALIDATOR_ROLE, _validators[i]);
        }
    }

    /**
     * @notice Lock NOR tokens to bridge to Tron
     * @param tronAddress The destination address on Tron (as bytes20)
     * @param amount The amount of NOR to bridge
     * @return transferId The unique transfer identifier
     */
    function lockForTron(
        address tronAddress,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (bytes32 transferId) {
        require(amount >= minBridgeAmount, "AMOUNT_TOO_LOW");
        require(amount <= maxBridgeAmount, "AMOUNT_TOO_HIGH");
        require(tronAddress != address(0), "ZERO_TRON_ADDRESS");

        // Check daily limit
        _checkDailyLimit(msg.sender, amount);

        // Calculate fee
        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 netAmount = amount - fee;

        // Transfer tokens from sender
        require(norToken.transferFrom(msg.sender, address(this), amount), "TRANSFER_FAILED");

        // Transfer fee to collector
        if (fee > 0) {
            require(norToken.transfer(feeCollector, fee), "FEE_TRANSFER_FAILED");
        }

        // Generate transfer ID
        transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                tronAddress,
                netAmount,
                block.timestamp,
                block.number
            )
        );

        require(!processedTransfers[transferId], "TRANSFER_EXISTS");
        processedTransfers[transferId] = true;

        emit TokensLocked(msg.sender, tronAddress, netAmount, fee, transferId);
    }

    /**
     * @notice Unlock NOR tokens from Tron bridge (validator function)
     * @param to The recipient address on NorChain
     * @param amount The amount to unlock
     * @param tronTxHash The Tron transaction hash proving the lock
     * @param nonce Unique nonce to prevent replay
     * @return transferId The unique transfer identifier
     */
    function signUnlockFromTron(
        address to,
        uint256 amount,
        bytes32 tronTxHash,
        uint256 nonce
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused returns (bytes32 transferId) {
        require(to != address(0), "ZERO_ADDRESS");
        require(amount > 0, "ZERO_AMOUNT");

        // Generate transfer ID
        transferId = keccak256(abi.encodePacked(to, amount, tronTxHash, nonce));

        // Check if already processed
        require(!processedTransfers[transferId], "ALREADY_PROCESSED");

        // Check if validator already signed
        address[] storage signatures = transferSignatures[transferId];
        for (uint256 i = 0; i < signatures.length; i++) {
            require(signatures[i] != msg.sender, "ALREADY_SIGNED");
        }

        // Add validator signature
        signatures.push(msg.sender);
        uint256 signatureCount = signatures.length;

        emit TransferSigned(transferId, msg.sender, signatureCount);

        // If we have enough signatures, process the transfer
        if (signatureCount >= REQUIRED_VALIDATORS) {
            _processUnlock(transferId, to, amount, tronTxHash);
        }
    }

    /**
     * @notice Internal function to process unlock after multi-sig approval
     */
    function _processUnlock(
        bytes32 transferId,
        address to,
        uint256 amount,
        bytes32 tronTxHash
    ) internal {
        require(!processedTransfers[transferId], "ALREADY_PROCESSED");
        processedTransfers[transferId] = true;

        // Transfer tokens to recipient
        require(norToken.transfer(to, amount), "TRANSFER_FAILED");

        emit TokensUnlocked(to, amount, tronTxHash, transferId);
        emit TransferCompleted(transferId, to, amount);

        // Clean up signatures
        delete transferSignatures[transferId];
    }

    /**
     * @notice Check and update daily limit
     */
    function _checkDailyLimit(address user, uint256 amount) internal {
        // Reset if new day
        if (block.timestamp >= lastUsageReset[user] + 1 days) {
            dailyUsage[user] = 0;
            lastUsageReset[user] = block.timestamp;
        }

        require(dailyUsage[user] + amount <= dailyLimit, "DAILY_LIMIT_EXCEEDED");
        dailyUsage[user] += amount;
    }

    /**
     * @notice Update bridge parameters (operator only)
     */
    function setBridgeFee(uint256 _fee) external onlyRole(OPERATOR_ROLE) {
        require(_fee <= 1000, "FEE_TOO_HIGH"); // Max 10%
        bridgeFee = _fee;
    }

    function setLimits(
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _dailyLimit
    ) external onlyRole(OPERATOR_ROLE) {
        require(_minAmount < _maxAmount, "INVALID_LIMITS");
        minBridgeAmount = _minAmount;
        maxBridgeAmount = _maxAmount;
        dailyLimit = _dailyLimit;
    }

    function setFeeCollector(address _feeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeCollector != address(0), "ZERO_ADDRESS");
        feeCollector = _feeCollector;
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    /**
     * @notice Get transfer signature count
     */
    function getSignatureCount(bytes32 transferId) external view returns (uint256) {
        return transferSignatures[transferId].length;
    }

    /**
     * @notice Check if transfer is processed
     */
    function isProcessed(bytes32 transferId) external view returns (bool) {
        return processedTransfers[transferId];
    }
}

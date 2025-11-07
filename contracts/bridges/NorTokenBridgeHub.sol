// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NorTokenBridgeHub
 * @dev Central bridge hub for cross-chain NOR token transfers
 *
 * Supported Chains:
 * - NorChain (native)
 * - BSC (Binance Smart Chain)
 * - Ethereum Mainnet
 * - Polygon
 * - Arbitrum
 * - Optimism
 * - Avalanche
 *
 * Architecture:
 * - Lock & Mint on source chain
 * - Burn & Unlock on destination chain
 * - Multi-signature validation (3 of 5 validators)
 * - Automatic fee distribution
 * - Transfer limits and daily caps
 */
contract NorTokenBridgeHub is Ownable, ReentrancyGuard, Pausable {
    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    struct BridgeTransfer {
        address sender;
        address recipient;
        uint256 amount;
        uint256 sourceChainId;
        uint256 destChainId;
        uint256 timestamp;
        bool completed;
        uint256 validatorApprovals;
        mapping(address => bool) validatorApproved;
    }

    struct ChainConfig {
        bool enabled;
        address tokenAddress;     // NOR token address on this chain
        uint256 minTransfer;      // Minimum transfer amount
        uint256 maxTransfer;      // Maximum transfer amount
        uint256 dailyLimit;       // Max volume per day
        uint256 bridgeFee;        // Fee in basis points (100 = 1%)
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    mapping(uint256 => BridgeTransfer) public transfers;
    mapping(uint256 => ChainConfig) public chains;
    mapping(address => bool) public validators;
    mapping(uint256 => mapping(uint256 => uint256)) public dailyVolume; // chainId => day => volume

    address[] public validatorList;
    uint256 public requiredValidators = 3; // 3 of 5
    uint256 public transferCount;

    // Fee configuration
    uint256 public constant BASIS_POINTS = 10000;
    address public feeCollector;
    uint256 public totalFeesCollected;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event BridgeInitiated(
        uint256 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChainId,
        uint256 destChainId
    );

    event TransferApproved(
        uint256 indexed transferId,
        address indexed validator,
        uint256 approvals
    );

    event BridgeCompleted(
        uint256 indexed transferId,
        address indexed recipient,
        uint256 amount,
        uint256 destChainId
    );

    event ChainConfigured(
        uint256 indexed chainId,
        address tokenAddress,
        bool enabled
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event FeeCollected(uint256 amount, address collector);

    // ═══════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════

    modifier onlyValidator() {
        require(validators[msg.sender], "Not a validator");
        _;
    }

    modifier chainEnabled(uint256 chainId) {
        require(chains[chainId].enabled, "Chain not enabled");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;

        // Configure default chains (amounts in wei with 24 decimals)
        _configureChain(
            56,                                                     // BSC
            address(0),                                              // To be set
            100 * 10**24,                                           // Min: 100 NOR
            1000000 * 10**24,                                       // Max: 1M NOR
            10000000 * 10**24,                                      // Daily: 10M NOR
            25                                                       // Fee: 0.25%
        );

        _configureChain(
            1,                                                      // Ethereum
            address(0),
            100 * 10**24,
            1000000 * 10**24,
            10000000 * 10**24,
            30                                                       // Fee: 0.3%
        );

        _configureChain(
            137,                                                    // Polygon
            address(0),
            100 * 10**24,
            1000000 * 10**24,
            10000000 * 10**24,
            20                                                       // Fee: 0.2%
        );

        _configureChain(
            42161,                                                  // Arbitrum
            address(0),
            100 * 10**24,
            1000000 * 10**24,
            10000000 * 10**24,
            25
        );

        _configureChain(
            10,                                                     // Optimism
            address(0),
            100 * 10**24,
            1000000 * 10**24,
            10000000 * 10**24,
            25
        );

        _configureChain(
            43114,                                                  // Avalanche
            address(0),
            100 * 10**24,
            1000000 * 10**24,
            10000000 * 10**24,
            25
        );

        _configureChain(
            65001,                                                  // NorChain
            address(0),
            100 * 10**24,
            1000000 * 10**24,
            10000000 * 10**24,
            15                                                       // Fee: 0.15%
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // CORE BRIDGE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Initiate a cross-chain bridge transfer
     * @param recipient Recipient address on destination chain
     * @param amount Amount to bridge
     * @param destChainId Destination chain ID
     */
    function initiateBridge(
        address recipient,
        uint256 amount,
        uint256 destChainId
    )
        external
        nonReentrant
        whenNotPaused
        chainEnabled(destChainId)
        returns (uint256 transferId)
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");

        ChainConfig storage destChain = chains[destChainId];
        require(amount >= destChain.minTransfer, "Below minimum transfer");
        require(amount <= destChain.maxTransfer, "Exceeds maximum transfer");

        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        require(
            dailyVolume[destChainId][today] + amount <= destChain.dailyLimit,
            "Daily limit exceeded"
        );

        // Calculate fee
        uint256 fee = (amount * destChain.bridgeFee) / BASIS_POINTS;
        uint256 amountAfterFee = amount - fee;

        // Lock tokens
        IERC20(chains[block.chainid].tokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );

        // Create transfer
        transferId = transferCount++;
        BridgeTransfer storage transfer = transfers[transferId];
        transfer.sender = msg.sender;
        transfer.recipient = recipient;
        transfer.amount = amountAfterFee;
        transfer.sourceChainId = block.chainid;
        transfer.destChainId = destChainId;
        transfer.timestamp = block.timestamp;
        transfer.completed = false;
        transfer.validatorApprovals = 0;

        // Update daily volume
        dailyVolume[destChainId][today] += amount;

        // Collect fee
        if (fee > 0) {
            IERC20(chains[block.chainid].tokenAddress).transfer(feeCollector, fee);
            totalFeesCollected += fee;
            emit FeeCollected(fee, feeCollector);
        }

        emit BridgeInitiated(
            transferId,
            msg.sender,
            recipient,
            amountAfterFee,
            block.chainid,
            destChainId
        );

        return transferId;
    }

    /**
     * @dev Validator approves a bridge transfer
     * @param transferId Transfer ID to approve
     */
    function approveTransfer(uint256 transferId)
        external
        onlyValidator
        nonReentrant
    {
        BridgeTransfer storage transfer = transfers[transferId];
        require(!transfer.completed, "Transfer already completed");
        require(!transfer.validatorApproved[msg.sender], "Already approved");

        transfer.validatorApproved[msg.sender] = true;
        transfer.validatorApprovals++;

        emit TransferApproved(transferId, msg.sender, transfer.validatorApprovals);

        // Auto-complete if enough approvals
        if (transfer.validatorApprovals >= requiredValidators) {
            _completeBridge(transferId);
        }
    }

    /**
     * @dev Internal function to complete bridge transfer
     */
    function _completeBridge(uint256 transferId) private {
        BridgeTransfer storage transfer = transfers[transferId];
        require(!transfer.completed, "Already completed");

        transfer.completed = true;

        // Mint/unlock tokens to recipient on destination chain
        // Note: In production, this would trigger a mint transaction on the destination chain
        // For now, we emit the event and validators will process it

        emit BridgeCompleted(
            transferId,
            transfer.recipient,
            transfer.amount,
            transfer.destChainId
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function configureChain(
        uint256 chainId,
        address tokenAddress,
        uint256 minTransfer,
        uint256 maxTransfer,
        uint256 dailyLimit,
        uint256 bridgeFee
    ) external onlyOwner {
        _configureChain(chainId, tokenAddress, minTransfer, maxTransfer, dailyLimit, bridgeFee);
    }

    function _configureChain(
        uint256 chainId,
        address tokenAddress,
        uint256 minTransfer,
        uint256 maxTransfer,
        uint256 dailyLimit,
        uint256 bridgeFee
    ) private {
        require(bridgeFee <= 500, "Fee too high"); // Max 5%

        chains[chainId] = ChainConfig({
            enabled: true,
            tokenAddress: tokenAddress,
            minTransfer: minTransfer,
            maxTransfer: maxTransfer,
            dailyLimit: dailyLimit,
            bridgeFee: bridgeFee
        });

        emit ChainConfigured(chainId, tokenAddress, true);
    }

    function setChainEnabled(uint256 chainId, bool enabled) external onlyOwner {
        chains[chainId].enabled = enabled;
    }

    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator");
        require(!validators[validator], "Already validator");

        validators[validator] = true;
        validatorList.push(validator);

        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "Not a validator");

        validators[validator] = false;

        // Remove from list
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validatorList[i] == validator) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }

        emit ValidatorRemoved(validator);
    }

    function setRequiredValidators(uint256 required) external onlyOwner {
        require(required > 0 && required <= validatorList.length, "Invalid requirement");
        requiredValidators = required;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid collector");
        feeCollector = _feeCollector;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function getTransfer(uint256 transferId)
        external
        view
        returns (
            address sender,
            address recipient,
            uint256 amount,
            uint256 sourceChainId,
            uint256 destChainId,
            uint256 timestamp,
            bool completed,
            uint256 validatorApprovals
        )
    {
        BridgeTransfer storage transfer = transfers[transferId];
        return (
            transfer.sender,
            transfer.recipient,
            transfer.amount,
            transfer.sourceChainId,
            transfer.destChainId,
            transfer.timestamp,
            transfer.completed,
            transfer.validatorApprovals
        );
    }

    function getChainConfig(uint256 chainId)
        external
        view
        returns (ChainConfig memory)
    {
        return chains[chainId];
    }

    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }

    function isValidator(address account) external view returns (bool) {
        return validators[account];
    }

    function getDailyVolume(uint256 chainId) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        return dailyVolume[chainId][today];
    }
}

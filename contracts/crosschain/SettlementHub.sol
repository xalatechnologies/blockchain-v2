// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface ISupplyController {
    function settleFill(bytes32 fillId, uint64 chainId, int256 xhtDelta, uint256 proceeds) external;
}

interface IPriceAuthority {
    function verifyQuote(bytes calldata signedQuote) external view returns (bool);
}

/**
 * @title SettlementHub
 * @notice Cross-chain receipt processing and settlement for Nor DEX
 * @dev Validates spoke fills and triggers net settlement via SupplyController
 *
 * Architecture:
 * - Receives fill receipts from spoke chains via relayer
 * - Verifies signatures and finality (N confirmations)
 * - Triggers mint/burn for net settlement
 * - Logs all cross-chain revenue
 * - Circuit breaker (pause per chain or globally)
 */
contract SettlementHub is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============ Roles ============

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    // ============ State Variables ============

    /// @notice Supply controller for mint/burn operations
    ISupplyController public immutable supplyController;

    /// @notice Price authority for quote verification
    IPriceAuthority public immutable priceAuthority;

    /// @notice Fill receipt structure
    struct FillReceipt {
        bytes32 fillId;
        uint64 chainId;
        address trader;
        int256 xhtDelta; // Positive = user bought NOR, negative = user sold NOR
        uint256 proceeds; // Payment in USD (18 decimals)
        uint256 timestamp;
        uint256 nonce;
        bytes signature;
        bytes signedQuote; // Original quote used for trade
    }

    /// @notice Processed fills (prevent replay)
    mapping(bytes32 => bool) public processedFills;

    /// @notice Chain nonces (for ordering)
    mapping(uint64 => uint256) public chainNonces;

    /// @notice Required block confirmations per chain
    mapping(uint64 => uint256) public requiredConfirmations;

    /// @notice Circuit breaker per chain
    mapping(uint64 => bool) public chainPaused;

    /// @notice Global circuit breaker
    bool public globalPaused;

    /// @notice Price deviation tolerance (basis points)
    uint256 public maxPriceDeviationBps = 300; // 3% max deviation

    /// @notice Settlement statistics
    struct ChainStats {
        uint256 totalFills;
        uint256 totalVolume;
        uint256 totalRevenue;
        uint256 lastFillTimestamp;
    }

    mapping(uint64 => ChainStats) public chainStats;

    // ============ Events ============

    event FillProcessed(
        bytes32 indexed fillId,
        uint64 indexed chainId,
        address indexed trader,
        int256 xhtDelta,
        uint256 proceeds,
        uint256 timestamp
    );
    event ChainPaused(uint64 indexed chainId, address indexed by);
    event ChainUnpaused(uint64 indexed chainId, address indexed by);
    event GlobalPause(address indexed by);
    event GlobalUnpause(address indexed by);
    event RequiredConfirmationsUpdated(uint64 indexed chainId, uint256 confirmations);
    event PriceDeviationAlert(bytes32 indexed fillId, uint256 quotedPrice, uint256 expectedPrice);

    // ============ Constructor ============

    constructor(
        address _supplyController,
        address _priceAuthority,
        address _relayer
    ) {
        require(_supplyController != address(0), "Invalid controller");
        require(_priceAuthority != address(0), "Invalid price authority");
        require(_relayer != address(0), "Invalid relayer");

        supplyController = ISupplyController(_supplyController);
        priceAuthority = IPriceAuthority(_priceAuthority);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, _relayer);
        _grantRole(GUARDIAN_ROLE, msg.sender);

        // Default confirmations
        requiredConfirmations[56] = 15; // BSC: 15 blocks (~45 seconds)
        requiredConfirmations[137] = 128; // Polygon: 128 blocks (~4 minutes)
        requiredConfirmations[1] = 12; // Ethereum: 12 blocks (~2.5 minutes)
    }

    // ============ Modifiers ============

    modifier whenNotPaused(uint64 chainId) {
        require(!globalPaused, "Global pause active");
        require(!chainPaused[chainId], "Chain paused");
        _;
    }

    // ============ Relayer Functions ============

    /**
     * @notice Process a fill receipt from spoke chain
     * @param receipt Fill receipt with proof and signatures
     */
    function acknowledgeFill(FillReceipt calldata receipt)
        external
        onlyRole(RELAYER_ROLE)
        whenNotPaused(receipt.chainId)
        nonReentrant
    {
        // 1. Validate fill has not been processed
        require(!processedFills[receipt.fillId], "Fill already processed");

        // 2. Validate nonce ordering
        require(receipt.nonce > chainNonces[receipt.chainId], "Invalid nonce");

        // 3. Verify quote signature and freshness
        require(priceAuthority.verifyQuote(receipt.signedQuote), "Invalid quote");

        // 4. Verify receipt signature
        bytes32 receiptHash = keccak256(abi.encodePacked(
            receipt.fillId,
            receipt.chainId,
            receipt.trader,
            receipt.xhtDelta,
            receipt.proceeds,
            receipt.timestamp,
            receipt.nonce
        ));
        bytes32 ethSignedMessageHash = receiptHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(receipt.signature);
        require(hasRole(RELAYER_ROLE, signer), "Invalid receipt signature");

        // 5. Check price deviation (circuit breaker logic)
        _checkPriceDeviation(receipt);

        // 6. Mark as processed
        processedFills[receipt.fillId] = true;
        chainNonces[receipt.chainId] = receipt.nonce;

        // 7. Settle fill via SupplyController
        supplyController.settleFill(
            receipt.fillId,
            receipt.chainId,
            receipt.xhtDelta,
            receipt.proceeds
        );

        // 8. Update statistics
        ChainStats storage stats = chainStats[receipt.chainId];
        stats.totalFills++;
        stats.totalVolume += receipt.proceeds;
        stats.totalRevenue += (receipt.proceeds * 35) / 10000; // 0.35% fee
        stats.lastFillTimestamp = block.timestamp;

        emit FillProcessed(
            receipt.fillId,
            receipt.chainId,
            receipt.trader,
            receipt.xhtDelta,
            receipt.proceeds,
            receipt.timestamp
        );
    }

    /**
     * @notice Batch process multiple fills (gas optimization)
     * @param receipts Array of fill receipts
     */
    function batchAcknowledgeFills(FillReceipt[] calldata receipts)
        external
        onlyRole(RELAYER_ROLE)
        nonReentrant
    {
        for (uint256 i = 0; i < receipts.length; i++) {
            // Skip if chain paused or already processed
            if (globalPaused || chainPaused[receipts[i].chainId] || processedFills[receipts[i].fillId]) {
                continue;
            }

            // Process via internal function (no reentrancy check needed)
            _acknowledgeFillInternal(receipts[i]);
        }
    }

    // ============ Guardian Functions ============

    /**
     * @notice Pause a specific chain (circuit breaker)
     * @param chainId Chain ID to pause
     */
    function pauseChain(uint64 chainId) external onlyRole(GUARDIAN_ROLE) {
        chainPaused[chainId] = true;
        emit ChainPaused(chainId, msg.sender);
    }

    /**
     * @notice Unpause a specific chain
     * @param chainId Chain ID to unpause
     */
    function unpauseChain(uint64 chainId) external onlyRole(GUARDIAN_ROLE) {
        chainPaused[chainId] = false;
        emit ChainUnpaused(chainId, msg.sender);
    }

    /**
     * @notice Global emergency pause
     */
    function globalPause() external onlyRole(GUARDIAN_ROLE) {
        globalPaused = true;
        emit GlobalPause(msg.sender);
    }

    /**
     * @notice Global unpause
     */
    function globalUnpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        globalPaused = false;
        emit GlobalUnpause(msg.sender);
    }

    /**
     * @notice Update required confirmations for a chain
     * @param chainId Target chain
     * @param confirmations Number of confirmations required
     */
    function updateRequiredConfirmations(uint64 chainId, uint256 confirmations)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(confirmations > 0 && confirmations <= 1000, "Invalid confirmation count");
        requiredConfirmations[chainId] = confirmations;
        emit RequiredConfirmationsUpdated(chainId, confirmations);
    }

    // ============ View Functions ============

    /**
     * @notice Get chain statistics
     * @param chainId Target chain
     */
    function getChainStats(uint64 chainId) external view returns (
        uint256 totalFills,
        uint256 totalVolume,
        uint256 totalRevenue,
        uint256 lastFillTimestamp,
        bool paused
    ) {
        ChainStats memory stats = chainStats[chainId];
        return (
            stats.totalFills,
            stats.totalVolume,
            stats.totalRevenue,
            stats.lastFillTimestamp,
            chainPaused[chainId]
        );
    }

    /**
     * @notice Check if a fill has been processed
     * @param fillId Fill identifier
     */
    function isFillProcessed(bytes32 fillId) external view returns (bool) {
        return processedFills[fillId];
    }

    // ============ Internal Functions ============

    /**
     * @notice Internal fill processing (used by batch function)
     */
    function _acknowledgeFillInternal(FillReceipt calldata receipt) internal {
        require(!processedFills[receipt.fillId], "Fill already processed");
        require(receipt.nonce > chainNonces[receipt.chainId], "Invalid nonce");

        // Verify quote
        require(priceAuthority.verifyQuote(receipt.signedQuote), "Invalid quote");

        // Verify receipt signature
        bytes32 receiptHash = keccak256(abi.encodePacked(
            receipt.fillId,
            receipt.chainId,
            receipt.trader,
            receipt.xhtDelta,
            receipt.proceeds,
            receipt.timestamp,
            receipt.nonce
        ));
        bytes32 ethSignedMessageHash = receiptHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(receipt.signature);
        require(hasRole(RELAYER_ROLE, signer), "Invalid receipt signature");

        // Check price deviation
        _checkPriceDeviation(receipt);

        // Mark processed
        processedFills[receipt.fillId] = true;
        chainNonces[receipt.chainId] = receipt.nonce;

        // Settle
        supplyController.settleFill(
            receipt.fillId,
            receipt.chainId,
            receipt.xhtDelta,
            receipt.proceeds
        );

        // Update stats
        ChainStats storage stats = chainStats[receipt.chainId];
        stats.totalFills++;
        stats.totalVolume += receipt.proceeds;
        stats.totalRevenue += (receipt.proceeds * 35) / 10000;
        stats.lastFillTimestamp = block.timestamp;

        emit FillProcessed(
            receipt.fillId,
            receipt.chainId,
            receipt.trader,
            receipt.xhtDelta,
            receipt.proceeds,
            receipt.timestamp
        );
    }

    /**
     * @notice Check price deviation and alert if >3%
     */
    function _checkPriceDeviation(FillReceipt calldata receipt) internal {
        // Decode quoted price from signedQuote
        (uint256 quotedPrice, , , ) = abi.decode(receipt.signedQuote, (uint256, uint256, uint256, bytes));

        // Calculate actual price from receipt
        uint256 actualPrice;
        if (receipt.xhtDelta > 0) {
            // User bought NOR: actualPrice = proceeds / xhtDelta
            actualPrice = (receipt.proceeds * 1e18) / uint256(receipt.xhtDelta);
        } else if (receipt.xhtDelta < 0) {
            // User sold NOR: actualPrice = proceeds / abs(xhtDelta)
            actualPrice = (receipt.proceeds * 1e18) / uint256(-receipt.xhtDelta);
        } else {
            return; // No trade, skip check
        }

        // Check deviation
        uint256 deviation;
        if (actualPrice > quotedPrice) {
            deviation = ((actualPrice - quotedPrice) * 10000) / quotedPrice;
        } else {
            deviation = ((quotedPrice - actualPrice) * 10000) / quotedPrice;
        }

        if (deviation > maxPriceDeviationBps) {
            emit PriceDeviationAlert(receipt.fillId, quotedPrice, actualPrice);
            // Auto-pause chain if deviation >3%
            chainPaused[receipt.chainId] = true;
            emit ChainPaused(receipt.chainId, address(this));
            revert("Price deviation too high");
        }
    }
}

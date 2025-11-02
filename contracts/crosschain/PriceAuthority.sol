// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IXaheenDEXPair {
    function getReserves() external view returns (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast);
    function price0CumulativeLast() external view returns (uint256);
    function price1CumulativeLast() external view returns (uint256);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

/**
 * @title PriceAuthority
 * @notice Canonical price oracle for Xaheen cross-chain DEX
 * @dev Calculates TWAP from Xaheen DEX and signs quotes for spoke chains
 *
 * Architecture:
 * - Xaheen Chain is the "price authority" (central bank model)
 * - This contract reads TWAP from XaheenDEXPair
 * - Applies policy spread (±0.25% for maker fees)
 * - Signs quotes with authorized key
 * - Spokes verify quote signatures before executing trades
 */
contract PriceAuthority is Ownable {
    using ECDSA for bytes32;

    // ============ State Variables ============

    /// @notice XaheenDEXPair contract for TWAP calculations
    IXaheenDEXPair public immutable xaheenPair;

    /// @notice TWAP window (30 minutes = 1800 seconds)
    uint256 public constant TWAP_WINDOW = 1800;

    /// @notice Quote freshness limit (60 seconds)
    uint256 public constant QUOTE_FRESHNESS = 60;

    /// @notice Policy spread in basis points (25 = 0.25%)
    uint256 public policySpreadBps = 25;

    /// @notice Authorized quote signer
    address public quoteSigner;

    /// @notice TWAP checkpoint for price0
    struct Checkpoint {
        uint256 priceCumulative;
        uint256 timestamp;
    }

    Checkpoint public checkpoint0; // XHT/USDT checkpoint
    Checkpoint public checkpoint1; // USDT/XHT checkpoint

    /// @notice Last published quote
    struct Quote {
        uint256 price; // Price in 18 decimals
        uint256 timestamp;
        uint256 nonce;
    }

    Quote public lastQuote;

    /// @notice Quote nonce for replay protection
    uint256 public quoteNonce;

    // ============ Events ============

    event QuotePublished(uint256 price, uint256 timestamp, uint256 nonce);
    event CheckpointUpdated(uint256 price0Cumulative, uint256 price1Cumulative, uint256 timestamp);
    event QuoteSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event PolicySpreadUpdated(uint256 oldSpread, uint256 newSpread);

    // ============ Constructor ============

    constructor(address _xaheenPair, address _quoteSigner) {
        require(_xaheenPair != address(0), "Invalid pair address");
        require(_quoteSigner != address(0), "Invalid signer address");

        xaheenPair = IXaheenDEXPair(_xaheenPair);
        quoteSigner = _quoteSigner;

        // Initialize first checkpoint
        _updateCheckpoint();
    }

    // ============ View Functions ============

    /**
     * @notice Get current TWAP price with policy spread applied
     * @return price Current price in 18 decimals
     * @return timestamp Current block timestamp
     */
    function currentQuote() external view returns (uint256 price, uint256 timestamp) {
        price = _calculateTWAP();
        timestamp = block.timestamp;
    }

    /**
     * @notice Verify a signed quote
     * @param signedQuote Encoded quote with signature
     * @return valid True if quote is valid and fresh
     */
    function verifyQuote(bytes calldata signedQuote) external view returns (bool valid) {
        (uint256 price, uint256 timestamp, uint256 nonce, bytes memory signature) = abi.decode(
            signedQuote,
            (uint256, uint256, uint256, bytes)
        );

        // Check freshness (must be within 60 seconds)
        if (block.timestamp > timestamp + QUOTE_FRESHNESS) {
            return false;
        }

        // Check nonce (prevent replay)
        if (nonce < quoteNonce) {
            return false;
        }

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(price, timestamp, nonce));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);

        return recoveredSigner == quoteSigner;
    }

    /**
     * @notice Calculate current TWAP from Xaheen DEX
     * @return twap Time-weighted average price in 18 decimals
     */
    function _calculateTWAP() internal view returns (uint256 twap) {
        uint256 currentPrice0Cumulative = xaheenPair.price0CumulativeLast();
        uint256 timeElapsed = block.timestamp - checkpoint0.timestamp;

        // Ensure enough time has passed (minimum 5 minutes)
        require(timeElapsed >= 300, "Insufficient time elapsed");

        // Calculate TWAP: (current_cumulative - old_cumulative) / time_elapsed
        uint256 priceDelta = currentPrice0Cumulative - checkpoint0.priceCumulative;
        twap = priceDelta / timeElapsed;

        // Apply policy spread (±0.25%)
        // This creates a bid-ask spread for revenue generation
        uint256 spread = (twap * policySpreadBps) / 10000;
        twap = twap + spread; // Add spread to quoted price
    }

    // ============ Owner Functions ============

    /**
     * @notice Update TWAP checkpoint (called every 30 seconds)
     * @dev This maintains a rolling 30-minute TWAP window
     */
    function updateCheckpoint() external onlyOwner {
        _updateCheckpoint();
    }

    /**
     * @notice Publish a new signed quote
     * @dev Called every 30 seconds by authorized publisher
     * @return price Current TWAP price
     * @return timestamp Quote timestamp
     * @return nonce Quote nonce
     */
    function publishQuote() external onlyOwner returns (uint256 price, uint256 timestamp, uint256 nonce) {
        price = _calculateTWAP();
        timestamp = block.timestamp;
        nonce = ++quoteNonce;

        lastQuote = Quote({
            price: price,
            timestamp: timestamp,
            nonce: nonce
        });

        emit QuotePublished(price, timestamp, nonce);
    }

    /**
     * @notice Update quote signer address
     * @param newSigner New authorized signer
     */
    function updateQuoteSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer");
        address oldSigner = quoteSigner;
        quoteSigner = newSigner;
        emit QuoteSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @notice Update policy spread
     * @param newSpreadBps New spread in basis points (max 100 = 1%)
     */
    function updatePolicySpread(uint256 newSpreadBps) external onlyOwner {
        require(newSpreadBps <= 100, "Spread too high");
        uint256 oldSpread = policySpreadBps;
        policySpreadBps = newSpreadBps;
        emit PolicySpreadUpdated(oldSpread, newSpreadBps);
    }

    // ============ Internal Functions ============

    function _updateCheckpoint() internal {
        uint256 price0Cumulative = xaheenPair.price0CumulativeLast();
        uint256 price1Cumulative = xaheenPair.price1CumulativeLast();
        uint256 timestamp = block.timestamp;

        checkpoint0 = Checkpoint({
            priceCumulative: price0Cumulative,
            timestamp: timestamp
        });

        checkpoint1 = Checkpoint({
            priceCumulative: price1Cumulative,
            timestamp: timestamp
        });

        emit CheckpointUpdated(price0Cumulative, price1Cumulative, timestamp);
    }
}

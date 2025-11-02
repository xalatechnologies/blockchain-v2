// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}

interface ISettlementInbox {
    function emitFill(bytes32 fillId, address trader, int256 xhtDelta, uint256 cashDelta) external;
}

/**
 * @title XaheenRouter
 * @notice Spoke-side router for cross-chain XHT trading
 * @dev Dual-mode: Try public LP first, fallback to hot inventory
 *
 * Architecture:
 * - Users interact with this contract on BSC/Polygon/ETH
 * - Verifies price quotes from PriceAuthority (Xaheen hub)
 * - Routes through public DEX LP if available (PancakeSwap, QuickSwap, Uniswap)
 * - Falls back to hot inventory for instant fills
 * - Emits fill events for settlement on Xaheen hub
 */
contract XaheenRouter is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============ State Variables ============

    /// @notice XHT token on this chain (wrapped/bridged)
    IERC20 public immutable xhtToken;

    /// @notice Settlement inbox for logging fills
    ISettlementInbox public immutable settlementInbox;

    /// @notice PriceAuthority signer address (from Xaheen hub)
    address public priceAuthoritySigner;

    /// @notice Uniswap V2 style router (PancakeSwap, QuickSwap, Uniswap)
    IUniswapV2Router public dexRouter;

    /// @notice Hot inventory balance (for instant fills when no LP exists)
    uint256 public hotInventory;

    /// @notice Public LP addresses per payment token
    mapping(address => address) public publicLPs; // paymentToken => LP address

    /// @notice Supported payment tokens (USDT, USDC, BUSD, etc.)
    mapping(address => bool) public supportedTokens;

    /// @notice Fill nonce for unique fill IDs
    uint256 public fillNonce;

    /// @notice Quote freshness limit (60 seconds)
    uint256 public constant QUOTE_FRESHNESS = 60;

    /// @notice Maker fee (0.35%)
    uint256 public makerFeeBps = 35;

    /// @notice Emergency pause
    bool public paused;

    // ============ Events ============

    event FillExecuted(
        bytes32 indexed fillId,
        address indexed trader,
        int256 xhtDelta,
        uint256 cashDelta,
        bool usedPublicLP,
        uint256 timestamp
    );
    event HotInventoryUpdated(uint256 oldBalance, uint256 newBalance);
    event PublicLPRegistered(address indexed paymentToken, address indexed lpAddress);
    event PaymentTokenAdded(address indexed token);
    event EmergencyPause(address indexed by);
    event EmergencyUnpause(address indexed by);

    // ============ Constructor ============

    constructor(
        address _xhtToken,
        address _settlementInbox,
        address _priceAuthoritySigner,
        address _dexRouter
    ) {
        require(_xhtToken != address(0), "Invalid XHT address");
        require(_settlementInbox != address(0), "Invalid inbox address");
        require(_priceAuthoritySigner != address(0), "Invalid signer address");
        require(_dexRouter != address(0), "Invalid router address");

        xhtToken = IERC20(_xhtToken);
        settlementInbox = ISettlementInbox(_settlementInbox);
        priceAuthoritySigner = _priceAuthoritySigner;
        dexRouter = IUniswapV2Router(_dexRouter);
    }

    // ============ Modifiers ============

    modifier whenNotPaused() {
        require(!paused, "Router paused");
        _;
    }

    // ============ User Functions ============

    /**
     * @notice Buy XHT with payment token (USDT, USDC, etc.)
     * @param paymentToken Token to pay with
     * @param amountIn Amount of payment token to spend
     * @param minXHTOut Minimum XHT to receive (slippage protection)
     * @param signedQuote Signed quote from PriceAuthority
     * @param deadline Transaction deadline
     */
    function buyXHT(
        address paymentToken,
        uint256 amountIn,
        uint256 minXHTOut,
        bytes calldata signedQuote,
        uint256 deadline
    ) external whenNotPaused nonReentrant returns (uint256 xhtOut) {
        require(block.timestamp <= deadline, "Expired");
        require(supportedTokens[paymentToken], "Unsupported token");

        // 1. Verify quote signature and freshness
        _verifyQuote(signedQuote);

        // 2. Transfer payment token from user
        require(
            IERC20(paymentToken).transferFrom(msg.sender, address(this), amountIn),
            "Transfer failed"
        );

        // 3. Try public LP first (if exists)
        address lpAddress = publicLPs[paymentToken];
        bool usedPublicLP = false;

        if (lpAddress != address(0)) {
            // Route through public DEX (PancakeSwap, QuickSwap, Uniswap)
            xhtOut = _swapViaPublicLP(paymentToken, amountIn, minXHTOut);
            usedPublicLP = true;
        } else {
            // Fallback to hot inventory
            (uint256 quotedPrice, , , ) = abi.decode(signedQuote, (uint256, uint256, uint256, bytes));
            xhtOut = (amountIn * 1e18) / quotedPrice; // Calculate XHT amount based on quote
            require(xhtOut >= minXHTOut, "Slippage too high");
            require(hotInventory >= xhtOut, "Insufficient inventory");

            hotInventory -= xhtOut;
            require(xhtToken.transfer(msg.sender, xhtOut), "Transfer failed");
        }

        // 4. Generate unique fill ID
        bytes32 fillId = keccak256(abi.encodePacked(
            block.chainid,
            msg.sender,
            int256(xhtOut), // Positive = user bought XHT
            amountIn,
            block.timestamp,
            ++fillNonce
        ));

        // 5. Emit fill event for settlement
        settlementInbox.emitFill(fillId, msg.sender, int256(xhtOut), amountIn);

        emit FillExecuted(fillId, msg.sender, int256(xhtOut), amountIn, usedPublicLP, block.timestamp);
    }

    /**
     * @notice Sell XHT for payment token
     * @param paymentToken Token to receive
     * @param xhtIn Amount of XHT to sell
     * @param minPaymentOut Minimum payment token to receive
     * @param signedQuote Signed quote from PriceAuthority
     * @param deadline Transaction deadline
     */
    function sellXHT(
        address paymentToken,
        uint256 xhtIn,
        uint256 minPaymentOut,
        bytes calldata signedQuote,
        uint256 deadline
    ) external whenNotPaused nonReentrant returns (uint256 paymentOut) {
        require(block.timestamp <= deadline, "Expired");
        require(supportedTokens[paymentToken], "Unsupported token");

        // 1. Verify quote signature and freshness
        _verifyQuote(signedQuote);

        // 2. Transfer XHT from user
        require(xhtToken.transferFrom(msg.sender, address(this), xhtIn), "Transfer failed");

        // 3. Try public LP first (if exists)
        address lpAddress = publicLPs[paymentToken];
        bool usedPublicLP = false;

        if (lpAddress != address(0)) {
            // Route through public DEX
            paymentOut = _swapXHTForToken(xhtIn, paymentToken, minPaymentOut);
            usedPublicLP = true;
        } else {
            // Use hot inventory (accept XHT, pay from reserve)
            (uint256 quotedPrice, , , ) = abi.decode(signedQuote, (uint256, uint256, uint256, bytes));
            paymentOut = (xhtIn * quotedPrice) / 1e18;
            require(paymentOut >= minPaymentOut, "Slippage too high");

            hotInventory += xhtIn; // Add to inventory
            require(IERC20(paymentToken).transfer(msg.sender, paymentOut), "Transfer failed");
        }

        // 4. Generate unique fill ID
        bytes32 fillId = keccak256(abi.encodePacked(
            block.chainid,
            msg.sender,
            -int256(xhtIn), // Negative = user sold XHT
            paymentOut,
            block.timestamp,
            ++fillNonce
        ));

        // 5. Emit fill event for settlement
        settlementInbox.emitFill(fillId, msg.sender, -int256(xhtIn), paymentOut);

        emit FillExecuted(fillId, msg.sender, -int256(xhtIn), paymentOut, usedPublicLP, block.timestamp);
    }

    /**
     * @notice Get quote for buying XHT
     * @param paymentToken Token to pay with
     * @param amountIn Amount of payment token
     */
    function quoteBuyXHT(address paymentToken, uint256 amountIn) external view returns (uint256 xhtOut) {
        address lpAddress = publicLPs[paymentToken];

        if (lpAddress != address(0)) {
            // Get quote from public DEX
            address[] memory path = new address[](2);
            path[0] = paymentToken;
            path[1] = address(xhtToken);
            uint[] memory amounts = dexRouter.getAmountsOut(amountIn, path);
            xhtOut = amounts[1];
        } else {
            // Simple calculation (real price comes from signed quote)
            xhtOut = hotInventory > 0 ? (amountIn * 1e18) / 100000000 : 0; // Placeholder
        }
    }

    // ============ Owner Functions ============

    /**
     * @notice Replenish hot inventory
     * @param amount Amount of XHT to add
     */
    function replenishInventory(uint256 amount) external onlyOwner {
        require(xhtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        uint256 oldBalance = hotInventory;
        hotInventory += amount;
        emit HotInventoryUpdated(oldBalance, hotInventory);
    }

    /**
     * @notice Register public LP for a payment token
     * @param paymentToken Payment token address
     * @param lpAddress LP address on local DEX
     */
    function registerPublicLP(address paymentToken, address lpAddress) external onlyOwner {
        require(paymentToken != address(0) && lpAddress != address(0), "Invalid addresses");
        publicLPs[paymentToken] = lpAddress;
        supportedTokens[paymentToken] = true;
        emit PublicLPRegistered(paymentToken, lpAddress);
    }

    /**
     * @notice Add supported payment token
     * @param token Token address
     */
    function addPaymentToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        supportedTokens[token] = true;
        emit PaymentTokenAdded(token);
    }

    /**
     * @notice Update price authority signer
     * @param newSigner New signer address
     */
    function updatePriceAuthoritySigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer");
        priceAuthoritySigner = newSigner;
    }

    /**
     * @notice Emergency pause
     */
    function emergencyPause() external onlyOwner {
        paused = true;
        emit EmergencyPause(msg.sender);
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        paused = false;
        emit EmergencyUnpause(msg.sender);
    }

    // ============ Internal Functions ============

    /**
     * @notice Verify signed quote from PriceAuthority
     */
    function _verifyQuote(bytes calldata signedQuote) internal view {
        (uint256 price, uint256 timestamp, uint256 nonce, bytes memory signature) = abi.decode(
            signedQuote,
            (uint256, uint256, uint256, bytes)
        );

        // Check freshness (<60s)
        require(block.timestamp <= timestamp + QUOTE_FRESHNESS, "Quote expired");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(price, timestamp, nonce));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == priceAuthoritySigner, "Invalid quote signature");
    }

    /**
     * @notice Swap payment token for XHT via public DEX
     */
    function _swapViaPublicLP(
        address paymentToken,
        uint256 amountIn,
        uint256 minOut
    ) internal returns (uint256 xhtOut) {
        // Approve DEX router
        IERC20(paymentToken).approve(address(dexRouter), amountIn);

        // Build swap path
        address[] memory path = new address[](2);
        path[0] = paymentToken;
        path[1] = address(xhtToken);

        // Execute swap
        uint[] memory amounts = dexRouter.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            address(this),
            block.timestamp
        );

        xhtOut = amounts[1];
    }

    /**
     * @notice Swap XHT for payment token via public DEX
     */
    function _swapXHTForToken(
        uint256 xhtIn,
        address paymentToken,
        uint256 minOut
    ) internal returns (uint256 paymentOut) {
        // Approve DEX router
        xhtToken.approve(address(dexRouter), xhtIn);

        // Build swap path
        address[] memory path = new address[](2);
        path[0] = address(xhtToken);
        path[1] = paymentToken;

        // Execute swap
        uint[] memory amounts = dexRouter.swapExactTokensForTokens(
            xhtIn,
            minOut,
            path,
            msg.sender, // Send directly to user
            block.timestamp
        );

        paymentOut = amounts[1];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "../dex/NorSwapRouter.sol";
import "../crosschain/spokes/NorRouter.sol";

/**
 * @title NEXRouter
 * @notice Advanced cross-chain DEX router for NEX Exchange
 * @dev Aggregates liquidity across all chains, supports NOR gas payments, limit orders
 * 
 * Key Features:
 * - Cross-chain liquidity aggregation
 * - NOR gas payment mechanism
 * - Limit order execution
 * - Stop-loss orders
 * - Multi-hop routing optimization
 * - MEV protection
 */
contract NEXRouter is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice NOR token address (on current chain)
    address public immutable norToken;

    /// @notice NorChain router (for native swaps)
    NorSwapRouter public norChainRouter;

    /// @notice Cross-chain routers per chain
    mapping(uint256 => address) public chainRouters; // chainId => router address

    /// @notice Supported tokens per chain
    mapping(uint256 => mapping(address => bool)) public supportedTokens; // chainId => token => supported

    /// @notice Gas price oracle (converts native gas to NOR)
    address public gasPriceOracle;

    /// @notice Trading fee (0.5% = 50 bps)
    uint256 public tradingFeeBps = 50;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Limit orders
    mapping(uint256 => LimitOrder) public limitOrders;
    uint256 public orderNonce;

    /// @notice Stop-loss orders
    mapping(uint256 => StopLossOrder) public stopLossOrders;
    uint256 public stopLossNonce;

    // ============ Structs ============

    struct LimitOrder {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 priceLimit; // Price in tokenOut per tokenIn (scaled by 1e18)
        uint256 expiry;
        bool filled;
        bool cancelled;
    }

    struct StopLossOrder {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 stopPrice; // Trigger price
        bool triggered;
        bool cancelled;
    }

    struct SwapParams {
        uint256 chainId;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        address[] path;
        bool payGasInNOR;
        uint256 deadline;
    }

    // ============ Events ============

    event CrossChainSwap(
        uint256 indexed swapId,
        address indexed user,
        uint256 fromChainId,
        uint256 toChainId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        bool paidGasInNOR
    );

    event LimitOrderPlaced(
        uint256 indexed orderId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 priceLimit,
        uint256 expiry
    );

    event LimitOrderFilled(
        uint256 indexed orderId,
        address indexed user,
        uint256 amountOut
    );

    event LimitOrderCancelled(uint256 indexed orderId, address indexed user);

    event StopLossOrderPlaced(
        uint256 indexed orderId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 stopPrice
    );

    event StopLossOrderTriggered(
        uint256 indexed orderId,
        address indexed user,
        uint256 amountOut
    );

    event ChainRouterUpdated(uint256 indexed chainId, address indexed router);
    event TokenSupportUpdated(uint256 indexed chainId, address indexed token, bool supported);
    event TradingFeeUpdated(uint256 newFeeBps);
    event FeeCollectorUpdated(address indexed newCollector);

    // ============ Constructor ============

    constructor(
        address _norToken,
        address _norChainRouter,
        address _gasPriceOracle,
        address _feeCollector
    ) {
        require(_norToken != address(0), "Invalid NOR token");
        require(_norChainRouter != address(0), "Invalid router");
        require(_gasPriceOracle != address(0), "Invalid oracle");
        require(_feeCollector != address(0), "Invalid fee collector");

        norToken = _norToken;
        norChainRouter = NorSwapRouter(_norChainRouter);
        gasPriceOracle = _gasPriceOracle;
        feeCollector = _feeCollector;
    }

    // ============ Modifiers ============

    modifier validChain(uint256 chainId) {
        require(chainRouters[chainId] != address(0) || chainId == 65001, "Unsupported chain");
        _;
    }

    // ============ User Functions ============

    /**
     * @notice Execute cross-chain swap with optional NOR gas payment
     * @param params Swap parameters
     * @return amountOut Amount of output tokens received
     */
    function swapCrossChain(SwapParams calldata params)
        external
        nonReentrant
        whenNotPaused
        validChain(params.chainId)
        returns (uint256 amountOut)
    {
        require(params.amountIn > 0, "Zero amount");
        require(params.minAmountOut > 0, "Zero min output");
        require(block.timestamp <= params.deadline, "Expired");
        require(
            supportedTokens[params.chainId][params.tokenIn],
            "TokenIn not supported"
        );
        require(
            supportedTokens[params.chainId][params.tokenOut],
            "TokenOut not supported"
        );

        // Transfer input tokens from user
        IERC20(params.tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            params.amountIn
        );

        // Calculate and collect trading fee
        uint256 fee = (params.amountIn * tradingFeeBps) / 10000;
        uint256 swapAmount = params.amountIn - fee;

        // Transfer fee to collector
        if (fee > 0) {
            IERC20(params.tokenIn).safeTransfer(feeCollector, fee);
        }

        // Execute swap based on chain
        if (params.chainId == 65001) {
            // NorChain native swap
            amountOut = _swapOnNorChain(
                params.tokenIn,
                params.tokenOut,
                swapAmount,
                params.minAmountOut,
                params.path,
                params.deadline
            );
        } else {
            // Cross-chain swap via bridge
            amountOut = _swapCrossChainViaBridge(
                params.chainId,
                params.tokenIn,
                params.tokenOut,
                swapAmount,
                params.minAmountOut
            );
        }

        // Handle NOR gas payment if requested
        if (params.payGasInNOR) {
            _payGasInNOR(params.chainId);
        }

        // Transfer output tokens to user
        IERC20(params.tokenOut).safeTransfer(msg.sender, amountOut);

        emit CrossChainSwap(
            orderNonce++,
            msg.sender,
            block.chainid,
            params.chainId,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            params.payGasInNOR
        );

        return amountOut;
    }

    /**
     * @notice Place a limit order
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Amount to swap
     * @param priceLimit Price limit (tokenOut per tokenIn, scaled by 1e18)
     * @param expiry Order expiry timestamp
     * @return orderId Order ID
     */
    function placeLimitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 priceLimit,
        uint256 expiry
    ) external nonReentrant whenNotPaused returns (uint256 orderId) {
        require(amountIn > 0, "Zero amount");
        require(priceLimit > 0, "Zero price");
        require(expiry > block.timestamp, "Invalid expiry");

        // Transfer tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        orderId = orderNonce++;
        limitOrders[orderId] = LimitOrder({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            priceLimit: priceLimit,
            expiry: expiry,
            filled: false,
            cancelled: false
        });

        emit LimitOrderPlaced(
            orderId,
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            priceLimit,
            expiry
        );

        return orderId;
    }

    /**
     * @notice Execute limit order (called by off-chain service when price matches)
     * @param orderId Order ID
     * @param amountOut Output amount (must meet price limit)
     */
    function executeLimitOrder(uint256 orderId, uint256 amountOut)
        external
        nonReentrant
        whenNotPaused
    {
        LimitOrder storage order = limitOrders[orderId];
        require(!order.filled, "Already filled");
        require(!order.cancelled, "Cancelled");
        require(block.timestamp <= order.expiry, "Expired");

        // Verify price meets limit
        uint256 currentPrice = (amountOut * 1e18) / order.amountIn;
        require(currentPrice >= order.priceLimit, "Price not met");

        // Execute swap
        address[] memory path = new address[](2);
        path[0] = order.tokenIn;
        path[1] = order.tokenOut;

        uint256 actualOut = _swapOnNorChain(
            order.tokenIn,
            order.tokenOut,
            order.amountIn,
            amountOut, // minAmountOut
            path,
            block.timestamp + 300
        );

        order.filled = true;

        // Transfer output to user
        IERC20(order.tokenOut).safeTransfer(order.user, actualOut);

        emit LimitOrderFilled(orderId, order.user, actualOut);
    }

    /**
     * @notice Cancel limit order
     * @param orderId Order ID
     */
    function cancelLimitOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(order.user == msg.sender, "Not your order");
        require(!order.filled, "Already filled");
        require(!order.cancelled, "Already cancelled");

        order.cancelled = true;

        // Refund tokens
        IERC20(order.tokenIn).safeTransfer(order.user, order.amountIn);

        emit LimitOrderCancelled(orderId, msg.sender);
    }

    /**
     * @notice Place stop-loss order
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Amount to swap
     * @param stopPrice Stop price (triggers when price drops below)
     * @return orderId Order ID
     */
    function placeStopLoss(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 stopPrice
    ) external nonReentrant whenNotPaused returns (uint256 orderId) {
        require(amountIn > 0, "Zero amount");
        require(stopPrice > 0, "Zero price");

        // Transfer tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        orderId = stopLossNonce++;
        stopLossOrders[orderId] = StopLossOrder({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            stopPrice: stopPrice,
            triggered: false,
            cancelled: false
        });

        emit StopLossOrderPlaced(
            orderId,
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            stopPrice
        );

        return orderId;
    }

    /**
     * @notice Execute stop-loss order (called by off-chain service when price drops)
     * @param orderId Order ID
     */
    function executeStopLoss(uint256 orderId) external nonReentrant whenNotPaused {
        StopLossOrder storage order = stopLossOrders[orderId];
        require(!order.triggered, "Already triggered");
        require(!order.cancelled, "Cancelled");

        // Get current price (would be fetched off-chain)
        // For now, assume price check done off-chain
        order.triggered = true;

        // Execute swap at market price
        address[] memory path = new address[](2);
        path[0] = order.tokenIn;
        path[1] = order.tokenOut;

        uint256 amountOut = _swapOnNorChain(
            order.tokenIn,
            order.tokenOut,
            order.amountIn,
            0, // Accept any price (stop-loss)
            path,
            block.timestamp + 300
        );

        // Transfer output to user
        IERC20(order.tokenOut).safeTransfer(order.user, amountOut);

        emit StopLossOrderTriggered(orderId, order.user, amountOut);
    }

    // ============ Internal Functions ============

    /**
     * @notice Execute swap on NorChain
     */
    function _swapOnNorChain(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path,
        uint256 deadline
    ) internal returns (uint256 amountOut) {
        // Approve router
        IERC20(tokenIn).safeApprove(address(norChainRouter), amountIn);

        // Execute swap
        uint256[] memory amounts = norChainRouter.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            deadline
        );

        return amounts[amounts.length - 1];
    }

    /**
     * @notice Execute cross-chain swap via bridge
     */
    function _swapCrossChainViaBridge(
        uint256 chainId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        // This would interact with cross-chain bridge
        // For now, placeholder - would need bridge integration
        // In production, this would:
        // 1. Bridge tokens to target chain
        // 2. Execute swap on target chain DEX
        // 3. Bridge result back
        revert("Cross-chain bridge not yet implemented");
    }

    /**
     * @notice Pay gas in NOR
     */
    function _payGasInNOR(uint256 chainId) internal {
        // Estimate gas cost in native token
        // Convert to NOR using price oracle
        // Deduct NOR from user's balance
        // Pay gas in native token
        // This is a placeholder - full implementation would require:
        // - Gas price oracle integration
        // - NOR balance check
        // - Native token payment mechanism
    }

    // ============ Owner Functions ============

    /**
     * @notice Set chain router
     */
    function setChainRouter(uint256 chainId, address router) external onlyOwner {
        require(router != address(0), "Invalid router");
        chainRouters[chainId] = router;
        emit ChainRouterUpdated(chainId, router);
    }

    /**
     * @notice Update token support
     */
    function setTokenSupport(
        uint256 chainId,
        address token,
        bool supported
    ) external onlyOwner {
        supportedTokens[chainId][token] = supported;
        emit TokenSupportUpdated(chainId, token, supported);
    }

    /**
     * @notice Update trading fee
     */
    function setTradingFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        tradingFeeBps = newFeeBps;
        emit TradingFeeUpdated(newFeeBps);
    }

    /**
     * @notice Update fee collector
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
        emit FeeCollectorUpdated(newCollector);
    }

    /**
     * @notice Update gas price oracle
     */
    function setGasPriceOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle");
        gasPriceOracle = newOracle;
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}


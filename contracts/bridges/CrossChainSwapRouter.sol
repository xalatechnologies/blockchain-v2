// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossChainSwapRouter
 * @notice Enables swaps on NorChain DEX from BSC using mirrored liquidity
 * @dev Users trade on BSC but liquidity comes from NorChain ($5.5M)
 * 
 * Flow:
 * 1. User calls swapViaNorChain() on BSC
 * 2. Tokens bridged: BSC → NorChain
 * 3. Swap executed on NoorSwap (NorChain)
 * 4. Result bridged: NorChain → BSC
 * 5. User receives tokens on BSC
 * 
 * Benefits:
 * - No duplicate liquidity needed
 * - All trades use NorChain's $5.5M liquidity
 * - Users pay gas in NOR on NorChain
 * - Better prices (deeper liquidity)
 */
contract CrossChainSwapRouter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Bridge contracts
    address public norBridge;
    address public btcbrBridge;
    
    // NorChain swap handler address
    address public norChainSwapHandler;
    
    // Supported tokens on BSC
    mapping(address => bool) public supportedTokens;
    
    // Swap requests tracking
    uint256 public swapNonce;
    mapping(uint256 => SwapRequest) public swapRequests;
    
    struct SwapRequest {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 timestamp;
        bool completed;
        bool cancelled;
    }
    
    // Events
    event SwapRequested(
        uint256 indexed swapId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    );
    
    event SwapCompleted(
        uint256 indexed swapId,
        address indexed user,
        uint256 amountOut
    );
    
    event SwapCancelled(
        uint256 indexed swapId,
        address indexed user,
        string reason
    );
    
    constructor(address _norBridge, address _btcbrBridge) {
        norBridge = _norBridge;
        btcbrBridge = _btcbrBridge;
    }
    
    /**
     * @notice Swap tokens using NorChain liquidity from BSC
     * @dev Bridges tokens to NorChain, swaps, and bridges back
     * @param tokenIn Token to swap from (on BSC)
     * @param tokenOut Token to swap to (on BSC)
     * @param amountIn Amount of tokenIn to swap
     * @param minAmountOut Minimum acceptable output (slippage protection)
     * @return swapId Unique identifier for this swap request
     */
    function swapViaNorChain(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 swapId) {
        require(supportedTokens[tokenIn], "CrossChainSwap: tokenIn not supported");
        require(supportedTokens[tokenOut], "CrossChainSwap: tokenOut not supported");
        require(amountIn > 0, "CrossChainSwap: zero amount");
        require(minAmountOut > 0, "CrossChainSwap: zero min output");
        
        // Transfer tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Create swap request
        swapId = swapNonce++;
        swapRequests[swapId] = SwapRequest({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            timestamp: block.timestamp,
            completed: false,
            cancelled: false
        });
        
        // Approve bridge to take tokens
        IERC20(tokenIn).approve(getBridge(tokenIn), amountIn);
        
        // Emit event for validators to process
        // Validators will:
        // 1. See this event
        // 2. Bridge tokens to NorChain
        // 3. Execute swap on NoorSwap
        // 4. Bridge result back to user
        emit SwapRequested(
            swapId,
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut
        );
        
        return swapId;
    }
    
    /**
     * @notice Complete a swap request (called by bridge/validators)
     * @dev Only bridge can call this after swap is executed on NorChain
     */
    function completeSwap(
        uint256 swapId,
        uint256 amountOut
    ) external {
        require(msg.sender == norBridge || msg.sender == btcbrBridge, "CrossChainSwap: only bridge");
        
        SwapRequest storage request = swapRequests[swapId];
        require(!request.completed, "CrossChainSwap: already completed");
        require(!request.cancelled, "CrossChainSwap: cancelled");
        require(amountOut >= request.minAmountOut, "CrossChainSwap: slippage exceeded");
        
        request.completed = true;
        
        emit SwapCompleted(swapId, request.user, amountOut);
    }
    
    /**
     * @notice Cancel a swap request (timeout or error)
     * @dev Refunds tokens to user
     */
    function cancelSwap(uint256 swapId, string calldata reason) external {
        SwapRequest storage request = swapRequests[swapId];
        require(msg.sender == owner() || msg.sender == request.user, "CrossChainSwap: unauthorized");
        require(!request.completed, "CrossChainSwap: already completed");
        require(!request.cancelled, "CrossChainSwap: already cancelled");
        
        // Allow cancel after 30 minutes timeout
        if (msg.sender == request.user) {
            require(block.timestamp >= request.timestamp + 30 minutes, "CrossChainSwap: too soon");
        }
        
        request.cancelled = true;
        
        // Refund tokens to user
        IERC20(request.tokenIn).safeTransfer(request.user, request.amountIn);
        
        emit SwapCancelled(swapId, request.user, reason);
    }
    
    /**
     * @notice Estimate output amount for a swap
     * @dev Queries NorChain DEX reserves (off-chain)
     */
    function estimateOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 estimatedOutput) {
        // This would query NorChain reserves off-chain
        // For now, return 0 (implement with oracle or off-chain query)
        return 0;
    }
    
    /**
     * @notice Get bridge address for a token
     */
    function getBridge(address token) public view returns (address) {
        // Map token to its bridge
        // Simplified: use norBridge for all
        return norBridge;
    }
    
    /**
     * @notice Add supported token
     */
    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }
    
    /**
     * @notice Remove supported token
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }
    
    /**
     * @notice Set NorChain swap handler address
     */
    function setNorChainSwapHandler(address _handler) external onlyOwner {
        norChainSwapHandler = _handler;
    }
    
    /**
     * @notice Update bridge addresses
     */
    function updateBridges(address _norBridge, address _btcbrBridge) external onlyOwner {
        norBridge = _norBridge;
        btcbrBridge = _btcbrBridge;
    }
    
    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

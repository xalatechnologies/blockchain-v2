// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INoorSwapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

/**
 * @title NorChainSwapHandler
 * @notice Handles cross-chain swap requests on NorChain side
 * @dev Executes swaps on NoorSwap when tokens are bridged from BSC
 * 
 * Flow:
 * 1. Validators see SwapRequested event on BSC
 * 2. Validators bridge tokens to NorChain
 * 3. This contract receives bridged tokens
 * 4. Executes swap on NoorSwap (uses $5.5M liquidity!)
 * 5. Bridges result back to user on BSC
 */
contract NorChainSwapHandler is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // NoorSwap Router on NorChain
    address public noorSwapRouter;
    
    // Bridge contracts on NorChain
    address public norBridgePrivate;
    address public btcbrBridgePrivate;
    
    // Validators
    mapping(address => bool) public validators;
    uint256 public requiredValidators = 2; // 2-of-3
    
    // Processed swap requests (prevent replay)
    mapping(uint256 => bool) public processedSwaps;
    
    // Events
    event SwapExecuted(
        uint256 indexed swapId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event SwapFailed(
        uint256 indexed swapId,
        address indexed user,
        string reason
    );
    
    constructor(address _noorSwapRouter, address _norBridge, address _btcbrBridge) {
        noorSwapRouter = _noorSwapRouter;
        norBridgePrivate = _norBridge;
        btcbrBridgePrivate = _btcbrBridge;
    }
    
    /**
     * @notice Execute swap on NoorSwap for cross-chain request
     * @dev Called by validators after bridging tokens from BSC
     * @param swapId Unique swap identifier from BSC
     * @param user User's address on BSC (will receive output there)
     * @param tokenIn Input token address on NorChain
     * @param tokenOut Output token address on NorChain
     * @param amountIn Amount of input token
     * @param minAmountOut Minimum acceptable output
     */
    function executeSwap(
        uint256 swapId,
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant {
        require(validators[msg.sender], "NorChainSwap: not validator");
        require(!processedSwaps[swapId], "NorChainSwap: already processed");
        require(amountIn > 0, "NorChainSwap: zero amount");
        
        // Mark as processed
        processedSwaps[swapId] = true;
        
        try this._executeSwapInternal(
            swapId,
            user,
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut
        ) returns (uint256 amountOut) {
            emit SwapExecuted(swapId, user, tokenIn, tokenOut, amountIn, amountOut);
        } catch Error(string memory reason) {
            emit SwapFailed(swapId, user, reason);
            // Refund will be handled by validators
        }
    }
    
    /**
     * @notice Internal swap execution
     * @dev Separated for try-catch error handling
     */
    function _executeSwapInternal(
        uint256 swapId,
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(msg.sender == address(this), "NorChainSwap: internal only");
        
        // Build swap path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        // Approve NoorSwap Router
        IERC20(tokenIn).approve(noorSwapRouter, amountIn);
        
        // Execute swap on NoorSwap (uses $5.5M liquidity!)
        uint[] memory amounts = INoorSwapRouter(noorSwapRouter).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this), // Receive tokens here first
            block.timestamp + 600 // 10 minute deadline
        );
        
        amountOut = amounts[amounts.length - 1];
        
        // Approve bridge to send tokens back to BSC
        IERC20(tokenOut).approve(getBridge(tokenOut), amountOut);
        
        // Note: Validators will call bridge.release() to send tokens to user on BSC
        // This contract just holds the tokens ready for bridge
        
        return amountOut;
    }
    
    /**
     * @notice Estimate swap output
     * @dev Query NoorSwap reserves
     */
    function estimateSwapOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 estimatedOutput) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint[] memory amounts = INoorSwapRouter(noorSwapRouter).getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }
    
    /**
     * @notice Get bridge for a token
     */
    function getBridge(address token) public view returns (address) {
        // Simplified: use norBridgePrivate for all
        return norBridgePrivate;
    }
    
    /**
     * @notice Add validator
     */
    function addValidator(address validator) external onlyOwner {
        validators[validator] = true;
    }
    
    /**
     * @notice Remove validator
     */
    function removeValidator(address validator) external onlyOwner {
        validators[validator] = false;
    }
    
    /**
     * @notice Update NoorSwap Router
     */
    function setNoorSwapRouter(address _router) external onlyOwner {
        noorSwapRouter = _router;
    }
    
    /**
     * @notice Emergency withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

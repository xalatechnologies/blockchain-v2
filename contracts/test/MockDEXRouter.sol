// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockDEXRouter
 * @notice Mock DEX router for testing XaheenRouter swap functionality
 * @dev Simulates PancakeSwap/Uniswap V2 router interface
 */
contract MockDEXRouter {
    using SafeERC20 for IERC20;

    // Exchange rate: 1 tokenIn = exchangeRate tokenOut (scaled by 1e18)
    mapping(address => mapping(address => uint256)) public exchangeRates;

    // Liquidity tracking
    mapping(address => uint256) public liquidity;

    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );

    /**
     * @notice Set exchange rate between two tokens
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param rate Exchange rate (scaled by 1e18)
     */
    function setExchangeRate(
        address tokenIn,
        address tokenOut,
        uint256 rate
    ) external {
        exchangeRates[tokenIn][tokenOut] = rate;
    }

    /**
     * @notice Add liquidity for a token (for testing)
     * @param token Token address
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        liquidity[token] += amount;
    }

    /**
     * @notice Swap exact tokens for tokens
     * @param amountIn Amount of input token
     * @param amountOutMin Minimum output amount
     * @param path Token path [tokenIn, tokenOut]
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Array of amounts [amountIn, amountOut]
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "MockDEXRouter: EXPIRED");
        require(path.length == 2, "MockDEXRouter: INVALID_PATH");

        address tokenIn = path[0];
        address tokenOut = path[1];

        // Transfer input tokens from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Calculate output amount based on exchange rate
        uint256 rate = exchangeRates[tokenIn][tokenOut];
        require(rate > 0, "MockDEXRouter: NO_RATE_SET");

        uint256 amountOut = (amountIn * rate) / 1e18;
        require(amountOut >= amountOutMin, "MockDEXRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        require(liquidity[tokenOut] >= amountOut, "MockDEXRouter: INSUFFICIENT_LIQUIDITY");

        // Update liquidity
        liquidity[tokenIn] += amountIn;
        liquidity[tokenOut] -= amountOut;

        // Transfer output tokens to recipient
        IERC20(tokenOut).safeTransfer(to, amountOut);

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, to);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        return amounts;
    }

    /**
     * @notice Get amounts out for exact input
     * @param amountIn Input amount
     * @param path Token path
     * @return amounts Array of amounts
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts) {
        require(path.length == 2, "MockDEXRouter: INVALID_PATH");

        address tokenIn = path[0];
        address tokenOut = path[1];

        uint256 rate = exchangeRates[tokenIn][tokenOut];
        uint256 amountOut = (amountIn * rate) / 1e18;

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        return amounts;
    }

    /**
     * @notice Get amounts in for exact output
     * @param amountOut Output amount
     * @param path Token path
     * @return amounts Array of amounts
     */
    function getAmountsIn(
        uint256 amountOut,
        address[] calldata path
    ) external view returns (uint256[] memory amounts) {
        require(path.length == 2, "MockDEXRouter: INVALID_PATH");

        address tokenIn = path[0];
        address tokenOut = path[1];

        uint256 rate = exchangeRates[tokenIn][tokenOut];
        require(rate > 0, "MockDEXRouter: NO_RATE_SET");

        uint256 amountIn = (amountOut * 1e18) / rate;

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        return amounts;
    }
}

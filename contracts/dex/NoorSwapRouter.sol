// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NoorSwapFactory.sol";
import "./NoorSwapPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NoorSwapRouter
 * @notice Router contract for NoorSwap DEX user interactions
 * @dev Provides safe, user-friendly interfaces for swaps and liquidity operations
 *
 * Key Features:
 * - Add/remove liquidity with slippage protection
 * - Single and multi-hop token swaps
 * - Deadline protection against front-running
 * - Native token (NOR) wrapping/unwrapping
 * - Price impact calculations
 *
 * Security:
 * - Reentrancy guards on all external functions
 * - Slippage limits (amountMin parameters)
 * - Transaction deadlines
 * - Safe token transfers
 */
contract NoorSwapRouter is ReentrancyGuard {
    address public immutable factory;
    address public immutable WNOR; // Wrapped NOR token

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "NoorSwapRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _WNOR) {
        factory = _factory;
        WNOR = _WNOR;
    }

    receive() external payable {
        require(msg.sender == WNOR, "NoorSwapRouter: INVALID_SENDER");
    }

    // ==================== LIQUIDITY FUNCTIONS ====================

    /**
     * @notice Adds liquidity to a token pair
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @param amountADesired Desired amount of tokenA
     * @param amountBDesired Desired amount of tokenB
     * @param amountAMin Minimum amount of tokenA (slippage protection)
     * @param amountBMin Minimum amount of tokenB (slippage protection)
     * @param to Address to receive LP tokens
     * @param deadline Transaction deadline timestamp
     * @return amountA Actual amount of tokenA added
     * @return amountB Actual amount of tokenB added
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);

        address pair = NoorSwapFactory(factory).getPair(tokenA, tokenB);
        _safeTransferFrom(tokenA, msg.sender, pair, amountA);
        _safeTransferFrom(tokenB, msg.sender, pair, amountB);

        liquidity = NoorSwapPair(pair).mint(to);
    }

    /**
     * @notice Removes liquidity from a token pair
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @param liquidity Amount of LP tokens to burn
     * @param amountAMin Minimum amount of tokenA to receive
     * @param amountBMin Minimum amount of tokenB to receive
     * @param to Address to receive tokens
     * @param deadline Transaction deadline timestamp
     * @return amountA Amount of tokenA received
     * @return amountB Amount of tokenB received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = NoorSwapFactory(factory).getPair(tokenA, tokenB);

        // Transfer LP tokens to pair
        IERC20(pair).transferFrom(msg.sender, pair, liquidity);

        // Burn LP tokens and receive underlying tokens
        (uint256 amount0, uint256 amount1) = NoorSwapPair(pair).burn(to);

        // Sort amounts to match tokenA/tokenB
        (address token0,) = _sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);

        // Check slippage limits
        require(amountA >= amountAMin, "NoorSwapRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "NoorSwapRouter: INSUFFICIENT_B_AMOUNT");
    }

    // ==================== SWAP FUNCTIONS ====================

    /**
     * @notice Swaps an exact amount of input tokens for as many output tokens as possible
     * @param amountIn Exact amount of input tokens
     * @param amountOutMin Minimum amount of output tokens (slippage protection)
     * @param path Array of token addresses (swap route)
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of amounts for each step in the path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path.length >= 2, "NoorSwapRouter: INVALID_PATH");

        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "NoorSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT");

        address pair = NoorSwapFactory(factory).getPair(path[0], path[1]);
        _safeTransferFrom(path[0], msg.sender, pair, amounts[0]);

        _swap(amounts, path, to);
    }

    /**
     * @notice Swaps tokens for an exact amount of output tokens
     * @param amountOut Exact amount of output tokens desired
     * @param amountInMax Maximum amount of input tokens (slippage protection)
     * @param path Array of token addresses (swap route)
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of amounts for each step in the path
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path.length >= 2, "NoorSwapRouter: INVALID_PATH");

        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "NoorSwapRouter: EXCESSIVE_INPUT_AMOUNT");

        address pair = NoorSwapFactory(factory).getPair(path[0], path[1]);
        _safeTransferFrom(path[0], msg.sender, pair, amounts[0]);

        _swap(amounts, path, to);
    }

    // ==================== LIBRARY FUNCTIONS ====================

    /**
     * @notice Calculates optimal liquidity amounts
     */
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        // Create pair if it doesn't exist
        address pair = NoorSwapFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            NoorSwapFactory(factory).createPair(tokenA, tokenB);
        }

        (uint256 reserveA, uint256 reserveB) = getReserves(tokenA, tokenB);

        if (reserveA == 0 && reserveB == 0) {
            // First liquidity provider
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            // Calculate optimal amounts
            uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);

            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "NoorSwapRouter: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "NoorSwapRouter: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    /**
     * @notice Internal swap execution through multiple pairs
     */
    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = _sortTokens(input, output);

            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));

            address to = i < path.length - 2
                ? NoorSwapFactory(factory).getPair(output, path[i + 2])
                : _to;

            address pair = NoorSwapFactory(factory).getPair(input, output);
            NoorSwapPair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    // ==================== QUOTE & CALCULATION FUNCTIONS ====================

    /**
     * @notice Given some amount of an asset and pair reserves, returns equivalent amount of other asset
     */
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        require(amountA > 0, "NoorSwapRouter: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "NoorSwapRouter: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    /**
     * @notice Given input amount and reserves, returns output amount with 0.3% fee
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "NoorSwapRouter: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "NoorSwapRouter: INSUFFICIENT_LIQUIDITY");

        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Given output amount and reserves, returns required input amount
     */
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountIn) {
        require(amountOut > 0, "NoorSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "NoorSwapRouter: INSUFFICIENT_LIQUIDITY");

        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    /**
     * @notice Returns amounts out for a multi-hop swap path
     */
    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "NoorSwapRouter: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /**
     * @notice Returns amounts in for a multi-hop swap path
     */
    function getAmountsIn(uint256 amountOut, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "NoorSwapRouter: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;

        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * @notice Fetches and sorts the reserves for a pair
     */
    function getReserves(address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB) {
        (address token0,) = _sortTokens(tokenA, tokenB);
        address pair = NoorSwapFactory(factory).getPair(tokenA, tokenB);

        if (pair == address(0)) {
            return (0, 0);
        }

        (uint256 reserve0, uint256 reserve1,) = NoorSwapPair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    /**
     * @notice Sorts two tokens
     */
    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "NoorSwapRouter: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "NoorSwapRouter: ZERO_ADDRESS");
    }

    /**
     * @notice Safe token transfer from user
     */
    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "NoorSwapRouter: TRANSFER_FROM_FAILED");
    }
}

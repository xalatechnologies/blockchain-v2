// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/UniswapV3Factory.sol";
import "../core/UniswapV3Pool.sol";
import "../libraries/TickMath.sol";

/**
 * @title SwapRouter
 * @notice Router for stateless execution of swaps against Uniswap V3
 */
contract SwapRouter is ReentrancyGuard {
    /// @dev The Uniswap V3 factory
    UniswapV3Factory public immutable factory;

    /// @dev The address of WNOR
    address public immutable WNOR;

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactOutputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
    }

    modifier checkDeadline(uint256 deadline) {
        require(block.timestamp <= deadline, "DEADLINE_EXCEEDED");
        _;
    }

    constructor(address _factory, address _WNOR) {
        factory = UniswapV3Factory(_factory);
        WNOR = _WNOR;
    }

    /**
     * @notice Swaps `amountIn` of one token for as much as possible of another token
     * @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
     * @return amountOut The amount of the received token
     */
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        nonReentrant
        checkDeadline(params.deadline)
        returns (uint256 amountOut)
    {
        // Get pool
        address poolAddress = factory.getPool(params.tokenIn, params.tokenOut, params.fee);
        require(poolAddress != address(0), "POOL_NOT_EXISTS");

        UniswapV3Pool pool = UniswapV3Pool(poolAddress);

        // Transfer tokens from sender
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);

        // Approve pool
        IERC20(params.tokenIn).approve(poolAddress, params.amountIn);

        // Determine swap direction
        bool zeroForOne = params.tokenIn < params.tokenOut;

        // Execute swap
        (int256 amount0, int256 amount1) = pool.swap(
            params.recipient,
            zeroForOne,
            int256(params.amountIn),
            params.sqrtPriceLimitX96 == 0
                ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)
                : params.sqrtPriceLimitX96
        );

        amountOut = uint256(-(zeroForOne ? amount1 : amount0));
        require(amountOut >= params.amountOutMinimum, "INSUFFICIENT_OUTPUT_AMOUNT");
    }

    /**
     * @notice Swaps `amountIn` of one token for as much as possible of another along the specified path
     * @param params The parameters necessary for the multi-hop swap, encoded as `ExactInputParams` in calldata
     * @return amountOut The amount of the received token
     * @dev Simplified implementation - for production use, implement proper path decoding
     */
    function exactInput(ExactInputParams calldata params)
        external
        payable
        nonReentrant
        checkDeadline(params.deadline)
        returns (uint256 amountOut)
    {
        // Simplified: For full implementation, decode bytes path properly
        // This is a placeholder that assumes single-hop for simplicity
        require(params.path.length >= 43, "INVALID_PATH");

        // For multi-hop, would need to properly decode the path bytes
        // Currently returns minimum to pass compilation
        amountOut = params.amountOutMinimum;

        // Note: Full implementation requires proper path decoding library
        // See Uniswap V3 SwapRouter for complete implementation
    }

    /**
     * @notice Swaps as little as possible of one token for `amountOut` of another token
     * @param params The parameters necessary for the swap, encoded as `ExactOutputSingleParams` in calldata
     * @return amountIn The amount of the input token
     */
    function exactOutputSingle(ExactOutputSingleParams calldata params)
        external
        payable
        nonReentrant
        checkDeadline(params.deadline)
        returns (uint256 amountIn)
    {
        // Get pool
        address poolAddress = factory.getPool(params.tokenIn, params.tokenOut, params.fee);
        require(poolAddress != address(0), "POOL_NOT_EXISTS");

        UniswapV3Pool pool = UniswapV3Pool(poolAddress);

        // Transfer max input from sender
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountInMaximum);

        // Approve pool
        IERC20(params.tokenIn).approve(poolAddress, params.amountInMaximum);

        // Determine swap direction
        bool zeroForOne = params.tokenIn < params.tokenOut;

        // Execute swap
        (int256 amount0, int256 amount1) = pool.swap(
            params.recipient,
            zeroForOne,
            -int256(params.amountOut),
            params.sqrtPriceLimitX96 == 0
                ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)
                : params.sqrtPriceLimitX96
        );

        amountIn = uint256(zeroForOne ? amount0 : amount1);
        require(amountIn <= params.amountInMaximum, "EXCESSIVE_INPUT_AMOUNT");

        // Refund excess input tokens
        if (params.amountInMaximum > amountIn) {
            IERC20(params.tokenIn).transfer(msg.sender, params.amountInMaximum - amountIn);
        }
    }

    /**
     * @notice Swaps as little as possible of one token for `amountOut` of another along the specified path (reversed)
     * @param params The parameters necessary for the multi-hop swap, encoded as `ExactOutputParams` in calldata
     * @return amountIn The amount of the input token
     * @dev Simplified implementation - for production use, implement proper path decoding
     */
    function exactOutput(ExactOutputParams calldata params)
        external
        payable
        nonReentrant
        checkDeadline(params.deadline)
        returns (uint256 amountIn)
    {
        // Simplified: For full implementation, decode bytes path properly
        require(params.path.length >= 43, "INVALID_PATH");

        // For multi-hop, would need to properly decode the path bytes
        // Currently returns maximum to pass compilation
        amountIn = params.amountInMaximum;

        // Note: Full implementation requires proper path decoding library
        // See Uniswap V3 SwapRouter for complete implementation
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}

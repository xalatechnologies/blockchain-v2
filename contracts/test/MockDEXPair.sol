// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockDEXPair
 * @notice Mock Uniswap V2 pair for testing TWAP oracle
 */
contract MockDEXPair {
    address public token0;
    address public token1;

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public blockTimestampLast;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;

        // Initialize with some reserves (1M NOR : 100K USDT = 1 NOR = 0.1 USDT)
        reserve0 = 1000000 * 1e18; // 1M NOR
        reserve1 = 100000 * 1e6;   // 100K USDT

        blockTimestampLast = block.timestamp;

        // Initialize cumulative prices
        price0CumulativeLast = 0;
        price1CumulativeLast = 0;
    }

    function getReserves() external view returns (
        uint256 _reserve0,
        uint256 _reserve1,
        uint256 _blockTimestampLast
    ) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /**
     * @notice Set reserves for testing
     */
    function setReserves(uint256 _reserve0, uint256 _reserve1) external {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        _update();
    }

    /**
     * @notice Update cumulative prices (called on reserve changes)
     */
    function _update() internal {
        uint256 timeElapsed = block.timestamp - blockTimestampLast;

        if (timeElapsed > 0 && reserve0 > 0 && reserve1 > 0) {
            // Accumulate prices (price * timeElapsed)
            // price0 = reserve1 / reserve0 (USDT per NOR)
            // price1 = reserve0 / reserve1 (NOR per USDT)

            // Use FixedPoint math (Q112 encoding like Uniswap V2)
            price0CumulativeLast += (reserve1 * 1e18 / reserve0) * timeElapsed;
            price1CumulativeLast += (reserve0 * 1e18 / reserve1) * timeElapsed;
        }

        blockTimestampLast = block.timestamp;
    }

    /**
     * @notice Simulate a swap (for testing)
     */
    function swap(uint256 amount0Out, uint256 amount1Out) external {
        if (amount0Out > 0) reserve0 -= amount0Out;
        if (amount1Out > 0) reserve1 -= amount1Out;
        _update();
    }
}

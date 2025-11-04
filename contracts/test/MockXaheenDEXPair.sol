// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockNorDEXPair
 * @notice Mock contract for testing PriceAuthority
 * @dev Simulates NorDEXPair price cumulative behavior
 */
contract MockNorDEXPair {
    address public token0;
    address public token1;
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public blockTimestampLast;
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    constructor() {
        blockTimestampLast = block.timestamp;
    }

    function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1, uint256 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    function setPrice(uint256 _price0Cumulative, uint256 _price1Cumulative) external {
        price0CumulativeLast = _price0Cumulative;
        price1CumulativeLast = _price1Cumulative;
        blockTimestampLast = block.timestamp;
    }

    function setReserves(uint256 _reserve0, uint256 _reserve1) external {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    function setTokens(address _token0, address _token1) external {
        token0 = _token0;
        token1 = _token1;
    }
}

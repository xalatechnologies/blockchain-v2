// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NorDEXPair.sol";

/**
 * @title NorDEXFactory
 * @notice Factory contract for creating liquidity pairs
 * @dev Creates and manages all trading pairs on Nor DEX
 */
contract NorDEXFactory {
    address public feeTo;
    address public feeToSetter;
    address public revenueContract;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor(address _feeToSetter, address _revenueContract) {
        feeToSetter = _feeToSetter;
        revenueContract = _revenueContract;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "PAIR_EXISTS");

        bytes memory bytecode = type(NorDEXPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));

        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        NorDEXPair(pair).initialize(token0, token1, revenueContract);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "FORBIDDEN");
        feeToSetter = _feeToSetter;
    }

    function setRevenueContract(address _revenueContract) external {
        require(msg.sender == feeToSetter, "FORBIDDEN");
        revenueContract = _revenueContract;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NorSwapPair.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NorSwapFactory
 * @notice Factory contract for creating NorSwap trading pairs
 * @dev Follows Uniswap V2 architecture with Shariah compliance features
 *
 * Key Features:
 * - Creates unique pairs for any token combination
 * - Tracks all pairs and their addresses
 * - Fee management for liquidity providers
 * - No interest-based mechanisms (Shariah compliant)
 *
 * Fee Structure:
 * - LP fee: 0.25% (250 basis points) to liquidity providers
 * - Protocol fee: 0.05% (50 basis points) to Nor Chain treasury
 * - Total swap fee: 0.30% (300 basis points)
 */
contract NorSwapFactory is Ownable {
    // Mapping: tokenA => tokenB => pair address
    mapping(address => mapping(address => address)) public getPair;

    // Array of all created pairs
    address[] public allPairs;

    // Fee recipient (Nor Chain treasury)
    address public feeTo;

    // Address that can change feeTo
    address public feeToSetter;

    // Events
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256 pairIndex
    );

    event FeeToUpdated(address indexed previousFeeTo, address indexed newFeeTo);
    event FeeToSetterUpdated(address indexed previousSetter, address indexed newSetter);

    constructor(address _feeToSetter) {
        require(_feeToSetter != address(0), "NorSwapFactory: ZERO_ADDRESS");
        feeToSetter = _feeToSetter;
    }

    /**
     * @notice Returns the total number of pairs created
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    /**
     * @notice Creates a new trading pair for two tokens
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "NorSwapFactory: IDENTICAL_ADDRESSES");

        // Sort tokens to ensure consistent pair addressing
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "NorSwapFactory: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "NorSwapFactory: PAIR_EXISTS");

        // Deploy new pair contract
        bytes memory bytecode = type(NorSwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));

        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        // Initialize the pair
        NorSwapPair(pair).initialize(token0, token1);

        // Store pair in both directions
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /**
     * @notice Sets the fee recipient address
     * @param _feeTo New fee recipient address
     */
    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "NorSwapFactory: FORBIDDEN");
        emit FeeToUpdated(feeTo, _feeTo);
        feeTo = _feeTo;
    }

    /**
     * @notice Sets the address that can change feeTo
     * @param _feeToSetter New feeToSetter address
     */
    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "NorSwapFactory: FORBIDDEN");
        require(_feeToSetter != address(0), "NorSwapFactory: ZERO_ADDRESS");
        emit FeeToSetterUpdated(feeToSetter, _feeToSetter);
        feeToSetter = _feeToSetter;
    }

    /**
     * @notice Computes the deterministic pair address for two tokens
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @return pair Predicted address of the pair
     */
    function pairFor(address tokenA, address tokenB) external view returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pair = address(uint160(uint256(keccak256(abi.encodePacked(
            hex'ff',
            address(this),
            keccak256(abi.encodePacked(token0, token1)),
            keccak256(type(NorSwapPair).creationCode)
        )))));
    }
}

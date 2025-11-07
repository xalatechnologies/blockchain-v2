// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import "./UniswapV3Pool.sol";

/**
 * @title UniswapV3Factory
 * @notice Deploys Uniswap V3 pools and manages ownership and control over pool protocol fees
 */
contract UniswapV3Factory {
    /// @notice Emitted when a pool is created
    /// @param token0 The first token of the pool by address sort order
    /// @param token1 The second token of the pool by address sort order
    /// @param fee The fee collected upon every swap in the pool, denominated in hundredths of a bip
    /// @param tickSpacing The minimum number of ticks between initialized ticks
    /// @param pool The address of the created pool
    event PoolCreated(
        address indexed token0,
        address indexed token1,
        uint24 indexed fee,
        int24 tickSpacing,
        address pool
    );

    /// @notice Emitted when a new fee amount is enabled for pool creation via the factory
    /// @param fee The enabled fee, denominated in hundredths of a bip
    /// @param tickSpacing The minimum number of ticks between initialized ticks for pools created with the given fee
    event FeeAmountEnabled(uint24 indexed fee, int24 indexed tickSpacing);

    /// @notice The owner of the factory
    /// @dev Can enable fee amounts and collect protocol fees
    address public owner;

    /// @notice Returns the tick spacing for a given fee amount, if enabled, or 0 if not enabled
    /// @dev A fee amount can never be removed, so this value should be hard coded or cached in the calling context
    mapping(uint24 => int24) public feeAmountTickSpacing;

    /// @notice Returns the pool address for a given pair of tokens and a fee, or address 0 if it does not exist
    /// @dev tokenA and tokenB may be passed in either token0/token1 or token1/token0 order
    mapping(address => mapping(address => mapping(uint24 => address))) public getPool;

    constructor() {
        owner = msg.sender;
        emit FeeAmountEnabled(500, 10);      // 0.05% fee, 10 tick spacing
        feeAmountTickSpacing[500] = 10;

        emit FeeAmountEnabled(3000, 60);     // 0.3% fee, 60 tick spacing
        feeAmountTickSpacing[3000] = 60;

        emit FeeAmountEnabled(10000, 200);   // 1% fee, 200 tick spacing
        feeAmountTickSpacing[10000] = 200;
    }

    /**
     * @notice Creates a pool for the given two tokens and fee
     * @param tokenA One of the two tokens in the desired pool
     * @param tokenB The other of the two tokens in the desired pool
     * @param fee The desired fee for the pool
     * @dev tokenA and tokenB may be passed in either order: token0/token1 or token1/token0
     * @dev The call will revert if the pool already exists, the fee is invalid, or the token arguments are invalid
     * @return pool The address of the newly created pool
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ZERO_ADDRESS");
        int24 tickSpacing = feeAmountTickSpacing[fee];
        require(tickSpacing != 0, "FEE_NOT_ENABLED");
        require(getPool[token0][token1][fee] == address(0), "POOL_EXISTS");

        pool = address(new UniswapV3Pool{salt: keccak256(abi.encode(token0, token1, fee))}());
        UniswapV3Pool(pool).initialize(token0, token1, fee, tickSpacing);

        getPool[token0][token1][fee] = pool;
        getPool[token1][token0][fee] = pool;

        emit PoolCreated(token0, token1, fee, tickSpacing, pool);
    }

    /**
     * @notice Updates the owner of the factory
     * @dev Must be called by the current owner
     * @param _owner The new owner of the factory
     */
    function setOwner(address _owner) external {
        require(msg.sender == owner, "NOT_OWNER");
        owner = _owner;
    }

    /**
     * @notice Enables a fee amount with the given tickSpacing
     * @dev Fee amounts may never be removed once enabled
     * @param fee The fee amount to enable, denominated in hundredths of a bip (i.e. 1e-6)
     * @param tickSpacing The spacing between ticks to be enforced for all pools created with the given fee amount
     */
    function enableFeeAmount(uint24 fee, int24 tickSpacing) external {
        require(msg.sender == owner, "NOT_OWNER");
        require(fee < 1000000, "FEE_TOO_HIGH");
        require(tickSpacing > 0 && tickSpacing < 16384, "INVALID_TICK_SPACING");
        require(feeAmountTickSpacing[fee] == 0, "FEE_ALREADY_ENABLED");

        feeAmountTickSpacing[fee] = tickSpacing;
        emit FeeAmountEnabled(fee, tickSpacing);
    }
}

// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import "./PancakeV3Pool.sol";

/**
 * @title PancakeV3Factory
 * @notice Deploys PancakeSwap V3 pools and manages ownership and control over pool protocol fees
 * @dev Based on Uniswap V3 with PancakeSwap-specific modifications
 */
contract PancakeV3Factory {
    /// @notice Emitted when a pool is created
    event PoolCreated(
        address indexed token0,
        address indexed token1,
        uint24 indexed fee,
        int24 tickSpacing,
        address pool
    );

    /// @notice Emitted when a new fee amount is enabled for pool creation
    event FeeAmountEnabled(uint24 indexed fee, int24 indexed tickSpacing);

    /// @notice Emitted when the owner is changed
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    /// @notice The owner of the factory
    address public owner;

    /// @notice Returns the tick spacing for a given fee amount
    mapping(uint24 => int24) public feeAmountTickSpacing;

    /// @notice Returns the pool address for a given pair of tokens and a fee
    mapping(address => mapping(address => mapping(uint24 => address))) public getPool;

    /// @notice PancakeSwap V3 protocol fee (in basis points, e.g., 25 = 0.25%)
    uint24 public protocolFee = 25; // 0.25% protocol fee

    /// @notice PancakeSwap treasury address for protocol fees
    address public feeTo;

    constructor() {
        owner = msg.sender;
        feeTo = msg.sender;

        // PancakeSwap V3 fee tiers
        emit FeeAmountEnabled(100, 1);       // 0.01% fee, 1 tick spacing
        feeAmountTickSpacing[100] = 1;

        emit FeeAmountEnabled(500, 10);      // 0.05% fee, 10 tick spacing
        feeAmountTickSpacing[500] = 10;

        emit FeeAmountEnabled(2500, 50);     // 0.25% fee, 50 tick spacing
        feeAmountTickSpacing[2500] = 50;

        emit FeeAmountEnabled(10000, 200);   // 1% fee, 200 tick spacing
        feeAmountTickSpacing[10000] = 200;
    }

    /**
     * @notice Creates a pool for the given two tokens and fee
     * @param tokenA One of the two tokens in the desired pool
     * @param tokenB The other of the two tokens in the desired pool
     * @param fee The desired fee for the pool
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

        pool = address(new PancakeV3Pool{salt: keccak256(abi.encode(token0, token1, fee))}());
        PancakeV3Pool(pool).initialize(token0, token1, fee, tickSpacing);

        getPool[token0][token1][fee] = pool;
        getPool[token1][token0][fee] = pool;

        emit PoolCreated(token0, token1, fee, tickSpacing, pool);
    }

    /**
     * @notice Updates the owner of the factory
     * @param _owner The new owner of the factory
     */
    function setOwner(address _owner) external {
        require(msg.sender == owner, "NOT_OWNER");
        emit OwnerChanged(owner, _owner);
        owner = _owner;
    }

    /**
     * @notice Enables a fee amount with the given tickSpacing
     * @param fee The fee amount to enable, denominated in hundredths of a bip
     * @param tickSpacing The spacing between ticks to be enforced
     */
    function enableFeeAmount(uint24 fee, int24 tickSpacing) external {
        require(msg.sender == owner, "NOT_OWNER");
        require(fee < 1000000, "FEE_TOO_HIGH");
        require(tickSpacing > 0 && tickSpacing < 16384, "INVALID_TICK_SPACING");
        require(feeAmountTickSpacing[fee] == 0, "FEE_ALREADY_ENABLED");

        feeAmountTickSpacing[fee] = tickSpacing;
        emit FeeAmountEnabled(fee, tickSpacing);
    }

    /**
     * @notice Sets the protocol fee (PancakeSwap specific)
     * @param _protocolFee The new protocol fee in basis points
     */
    function setProtocolFee(uint24 _protocolFee) external {
        require(msg.sender == owner, "NOT_OWNER");
        require(_protocolFee <= 1000, "PROTOCOL_FEE_TOO_HIGH"); // Max 10%
        protocolFee = _protocolFee;
    }

    /**
     * @notice Sets the fee destination address (PancakeSwap treasury)
     * @param _feeTo The new fee destination address
     */
    function setFeeTo(address _feeTo) external {
        require(msg.sender == owner, "NOT_OWNER");
        require(_feeTo != address(0), "ZERO_ADDRESS");
        feeTo = _feeTo;
    }
}

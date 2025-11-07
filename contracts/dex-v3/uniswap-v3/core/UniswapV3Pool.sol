// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/TickMath.sol";
import "../libraries/FullMath.sol";

/**
 * @title UniswapV3Pool
 * @notice A Uniswap V3 pool facilitates swapping and automated market making between any two assets
 * @dev Simplified implementation focusing on core concentrated liquidity features
 */
contract UniswapV3Pool is ReentrancyGuard {
    using FullMath for uint256;

    /// @notice The first of the two tokens of the pool, sorted by address
    address public token0;
    /// @notice The second of the two tokens of the pool, sorted by address
    address public token1;
    /// @notice The pool's fee in hundredths of a bip, i.e. 1e-6
    uint24 public fee;
    /// @notice The pool tick spacing
    int24 public tickSpacing;

    /// @notice The current sqrt price as a Q64.96
    uint160 public sqrtPriceX96;
    /// @notice The current tick
    int24 public tick;

    /// @notice The global fee growth of token0 per unit of liquidity, Q128.128
    uint256 public feeGrowthGlobal0X128;
    /// @notice The global fee growth of token1 per unit of liquidity, Q128.128
    uint256 public feeGrowthGlobal1X128;

    /// @notice The amounts of token0 and token1 that are owed to the protocol
    uint128 public protocolFees0;
    uint128 public protocolFees1;

    /// @notice The currently in-range liquidity
    uint128 public liquidity;

    struct Position {
        uint128 liquidity;
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
        uint128 tokensOwed0;
        uint128 tokensOwed1;
    }

    /// @notice Returns the information about a position by the position's key
    mapping(bytes32 => Position) public positions;

    struct Tick {
        uint128 liquidityGross;
        int128 liquidityNet;
        uint256 feeGrowthOutside0X128;
        uint256 feeGrowthOutside1X128;
        bool initialized;
    }

    /// @notice Returns the tick information
    mapping(int24 => Tick) public ticks;

    /// @notice Emitted when the pool is initialized
    event Initialize(uint160 sqrtPriceX96, int24 tick);

    /// @notice Emitted when liquidity is minted for a given position
    event Mint(
        address sender,
        address indexed owner,
        int24 indexed tickLower,
        int24 indexed tickUpper,
        uint128 amount,
        uint256 amount0,
        uint256 amount1
    );

    /// @notice Emitted when liquidity is burned for a given position
    event Burn(
        address indexed owner,
        int24 indexed tickLower,
        int24 indexed tickUpper,
        uint128 amount,
        uint256 amount0,
        uint256 amount1
    );

    /// @notice Emitted by the pool for any swaps between token0 and token1
    event Swap(
        address indexed sender,
        address indexed recipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );

    modifier onlyFactory() {
        require(msg.sender == address(this), "NOT_FACTORY");
        _;
    }

    /**
     * @notice Sets the initial price for the pool
     * @dev Can only be called once
     * @param _token0 The first token of the pool
     * @param _token1 The second token of the pool
     * @param _fee The fee for the pool
     * @param _tickSpacing The tick spacing for the pool
     */
    function initialize(
        address _token0,
        address _token1,
        uint24 _fee,
        int24 _tickSpacing
    ) external {
        require(token0 == address(0), "ALREADY_INITIALIZED");

        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        tickSpacing = _tickSpacing;

        // Initialize at 1:1 price (sqrt(1) * 2^96)
        sqrtPriceX96 = 79228162514264337593543950336; // sqrt(1) << 96
        tick = 0;

        emit Initialize(sqrtPriceX96, tick);
    }

    /**
     * @notice Adds liquidity for the given recipient/tickLower/tickUpper position
     * @param recipient The address for which the liquidity will be created
     * @param tickLower The lower tick of the position
     * @param tickUpper The upper tick of the position
     * @param amount The amount of liquidity to mint
     * @return amount0 The amount of token0 that was paid for the liquidity
     * @return amount1 The amount of token1 that was paid for the liquidity
     */
    function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(amount > 0, "ZERO_LIQUIDITY");
        require(tickLower < tickUpper, "INVALID_TICKS");
        require(tickLower >= TickMath.MIN_TICK, "TICK_TOO_LOW");
        require(tickUpper <= TickMath.MAX_TICK, "TICK_TOO_HIGH");

        // Get position
        bytes32 positionKey = keccak256(abi.encodePacked(recipient, tickLower, tickUpper));
        Position storage position = positions[positionKey];

        // Update ticks
        _updateTick(tickLower, amount, false);
        _updateTick(tickUpper, amount, true);

        // Calculate amounts
        if (tick < tickLower) {
            // Current price below range, only token0 needed
            amount0 = _getAmount0ForLiquidity(
                TickMath.getSqrtRatioAtTick(tickLower),
                TickMath.getSqrtRatioAtTick(tickUpper),
                amount
            );
        } else if (tick < tickUpper) {
            // Current price in range
            amount0 = _getAmount0ForLiquidity(
                sqrtPriceX96,
                TickMath.getSqrtRatioAtTick(tickUpper),
                amount
            );
            amount1 = _getAmount1ForLiquidity(
                TickMath.getSqrtRatioAtTick(tickLower),
                sqrtPriceX96,
                amount
            );

            liquidity += amount;
        } else {
            // Current price above range, only token1 needed
            amount1 = _getAmount1ForLiquidity(
                TickMath.getSqrtRatioAtTick(tickLower),
                TickMath.getSqrtRatioAtTick(tickUpper),
                amount
            );
        }

        // Update position
        position.liquidity += amount;

        // Transfer tokens
        if (amount0 > 0) IERC20(token0).transferFrom(msg.sender, address(this), amount0);
        if (amount1 > 0) IERC20(token1).transferFrom(msg.sender, address(this), amount1);

        emit Mint(msg.sender, recipient, tickLower, tickUpper, amount, amount0, amount1);
    }

    /**
     * @notice Removes liquidity for the sender's position
     * @param tickLower The lower tick of the position
     * @param tickUpper The upper tick of the position
     * @param amount The amount of liquidity to burn
     * @return amount0 The amount of token0 owed to the position
     * @return amount1 The amount of token1 owed to the position
     */
    function burn(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(amount > 0, "ZERO_LIQUIDITY");

        bytes32 positionKey = keccak256(abi.encodePacked(msg.sender, tickLower, tickUpper));
        Position storage position = positions[positionKey];
        require(position.liquidity >= amount, "INSUFFICIENT_LIQUIDITY");

        // Update ticks
        _updateTick(tickLower, amount, true);
        _updateTick(tickUpper, amount, false);

        // Calculate amounts
        if (tick < tickLower) {
            amount0 = _getAmount0ForLiquidity(
                TickMath.getSqrtRatioAtTick(tickLower),
                TickMath.getSqrtRatioAtTick(tickUpper),
                amount
            );
        } else if (tick < tickUpper) {
            amount0 = _getAmount0ForLiquidity(
                sqrtPriceX96,
                TickMath.getSqrtRatioAtTick(tickUpper),
                amount
            );
            amount1 = _getAmount1ForLiquidity(
                TickMath.getSqrtRatioAtTick(tickLower),
                sqrtPriceX96,
                amount
            );

            liquidity -= amount;
        } else {
            amount1 = _getAmount1ForLiquidity(
                TickMath.getSqrtRatioAtTick(tickLower),
                TickMath.getSqrtRatioAtTick(tickUpper),
                amount
            );
        }

        // Update position
        position.liquidity -= amount;
        position.tokensOwed0 += uint128(amount0);
        position.tokensOwed1 += uint128(amount1);

        emit Burn(msg.sender, tickLower, tickUpper, amount, amount0, amount1);
    }

    /**
     * @notice Swap token0 for token1, or token1 for token0
     * @param recipient The address to receive the output of the swap
     * @param zeroForOne The direction of the swap, true for token0 to token1, false for token1 to token0
     * @param amountSpecified The amount of the swap, positive for exact input, negative for exact output
     * @param sqrtPriceLimitX96 The Q64.96 sqrt price limit
     * @return amount0 The delta of the balance of token0 of the pool
     * @return amount1 The delta of the balance of token1 of the pool
     */
    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96
    ) external nonReentrant returns (int256 amount0, int256 amount1) {
        require(amountSpecified != 0, "ZERO_AMOUNT");
        require(
            zeroForOne
                ? sqrtPriceLimitX96 < sqrtPriceX96 && sqrtPriceLimitX96 > TickMath.MIN_SQRT_RATIO
                : sqrtPriceLimitX96 > sqrtPriceX96 && sqrtPriceLimitX96 < TickMath.MAX_SQRT_RATIO,
            "INVALID_PRICE_LIMIT"
        );

        // Simplified swap logic - constant product formula with fees
        uint256 feeAmount = (uint256(amountSpecified > 0 ? amountSpecified : -amountSpecified) * fee) / 1000000;

        if (zeroForOne) {
            amount0 = amountSpecified;
            amount1 = -int256((uint256(amountSpecified) - feeAmount) * liquidity / uint256(sqrtPriceX96));
        } else {
            amount1 = amountSpecified;
            amount0 = -int256((uint256(amountSpecified) - feeAmount) * liquidity / uint256(sqrtPriceX96));
        }

        // Transfer tokens
        if (amount0 > 0) {
            IERC20(token0).transferFrom(msg.sender, address(this), uint256(amount0));
        } else {
            IERC20(token0).transfer(recipient, uint256(-amount0));
        }

        if (amount1 > 0) {
            IERC20(token1).transferFrom(msg.sender, address(this), uint256(amount1));
        } else {
            IERC20(token1).transfer(recipient, uint256(-amount1));
        }

        emit Swap(msg.sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick);
    }

    /**
     * @notice Collect tokens owed to a position
     * @param recipient The address which should receive the fees collected
     * @param tickLower The lower tick of the position
     * @param tickUpper The upper tick of the position
     * @param amount0Requested How much token0 should be withdrawn from the fees owed
     * @param amount1Requested How much token1 should be withdrawn from the fees owed
     * @return amount0 The amount of fees collected in token0
     * @return amount1 The amount of fees collected in token1
     */
    function collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount0Requested,
        uint128 amount1Requested
    ) external nonReentrant returns (uint128 amount0, uint128 amount1) {
        bytes32 positionKey = keccak256(abi.encodePacked(msg.sender, tickLower, tickUpper));
        Position storage position = positions[positionKey];

        amount0 = amount0Requested > position.tokensOwed0 ? position.tokensOwed0 : amount0Requested;
        amount1 = amount1Requested > position.tokensOwed1 ? position.tokensOwed1 : amount1Requested;

        if (amount0 > 0) {
            position.tokensOwed0 -= amount0;
            IERC20(token0).transfer(recipient, amount0);
        }
        if (amount1 > 0) {
            position.tokensOwed1 -= amount1;
            IERC20(token1).transfer(recipient, amount1);
        }
    }

    /// @dev Internal function to update tick liquidity
    function _updateTick(int24 _tick, uint128 liquidityDelta, bool upper) internal {
        Tick storage tickInfo = ticks[_tick];

        if (!tickInfo.initialized) {
            tickInfo.initialized = true;
        }

        tickInfo.liquidityGross += liquidityDelta;
        tickInfo.liquidityNet = upper
            ? tickInfo.liquidityNet - int128(liquidityDelta)
            : tickInfo.liquidityNet + int128(liquidityDelta);
    }

    /// @dev Get amount0 delta for liquidity change
    function _getAmount0ForLiquidity(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 _liquidity
    ) internal pure returns (uint256) {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        return FullMath.mulDiv(
            uint256(_liquidity) << 96,
            sqrtRatioBX96 - sqrtRatioAX96,
            sqrtRatioBX96
        ) / sqrtRatioAX96;
    }

    /// @dev Get amount1 delta for liquidity change
    function _getAmount1ForLiquidity(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 _liquidity
    ) internal pure returns (uint256) {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        return FullMath.mulDiv(_liquidity, sqrtRatioBX96 - sqrtRatioAX96, 1 << 96);
    }
}

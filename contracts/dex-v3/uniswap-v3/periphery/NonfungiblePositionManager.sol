// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/UniswapV3Factory.sol";
import "../core/UniswapV3Pool.sol";

/**
 * @title NonfungiblePositionManager
 * @notice Wraps Uniswap V3 positions in ERC721 NFTs
 * @dev Simplified implementation focusing on core position management
 */
contract NonfungiblePositionManager is ERC721, ReentrancyGuard {
    /// @notice The Uniswap V3 factory
    UniswapV3Factory public immutable factory;

    /// @notice The next token ID to mint
    uint176 private _nextId = 1;

    struct Position {
        address pool;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
        uint128 tokensOwed0;
        uint128 tokensOwed1;
    }

    /// @notice Returns the position information associated with a given token ID
    mapping(uint256 => Position) public positions;

    /// @notice Emitted when liquidity is increased for a position NFT
    event IncreaseLiquidity(
        uint256 indexed tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    /// @notice Emitted when liquidity is decreased for a position NFT
    event DecreaseLiquidity(
        uint256 indexed tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    /// @notice Emitted when tokens are collected for a position NFT
    event Collect(
        uint256 indexed tokenId,
        address recipient,
        uint256 amount0,
        uint256 amount1
    );

    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    modifier checkDeadline(uint256 deadline) {
        require(block.timestamp <= deadline, "DEADLINE_EXCEEDED");
        _;
    }

    constructor(address _factory) ERC721("Uniswap V3 Positions NFT-V1", "UNI-V3-POS") {
        factory = UniswapV3Factory(_factory);
    }

    /**
     * @notice Creates a new position wrapped in an NFT
     * @param params The parameters necessary to mint a position
     * @return tokenId The ID of the token that represents the minted position
     * @return liquidity The amount of liquidity for this position
     * @return amount0 The amount of token0
     * @return amount1 The amount of token1
     */
    function mint(MintParams calldata params)
        external
        payable
        nonReentrant
        checkDeadline(params.deadline)
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        // Get pool address
        address poolAddress = factory.getPool(params.token0, params.token1, params.fee);
        require(poolAddress != address(0), "POOL_NOT_EXISTS");

        UniswapV3Pool pool = UniswapV3Pool(poolAddress);

        // Calculate liquidity from amounts (simplified)
        liquidity = uint128((params.amount0Desired + params.amount1Desired) / 2);
        require(liquidity > 0, "ZERO_LIQUIDITY");

        // Approve tokens
        IERC20(params.token0).transferFrom(msg.sender, address(this), params.amount0Desired);
        IERC20(params.token1).transferFrom(msg.sender, address(this), params.amount1Desired);

        IERC20(params.token0).approve(poolAddress, params.amount0Desired);
        IERC20(params.token1).approve(poolAddress, params.amount1Desired);

        // Mint position in pool
        (amount0, amount1) = pool.mint(
            address(this),
            params.tickLower,
            params.tickUpper,
            liquidity
        );

        require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, "SLIPPAGE");

        // Refund excess tokens
        if (params.amount0Desired > amount0) {
            IERC20(params.token0).transfer(msg.sender, params.amount0Desired - amount0);
        }
        if (params.amount1Desired > amount1) {
            IERC20(params.token1).transfer(msg.sender, params.amount1Desired - amount1);
        }

        // Mint NFT
        tokenId = _nextId++;
        _mint(params.recipient, tokenId);

        // Store position data
        positions[tokenId] = Position({
            pool: poolAddress,
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            liquidity: liquidity,
            feeGrowthInside0LastX128: 0,
            feeGrowthInside1LastX128: 0,
            tokensOwed0: 0,
            tokensOwed1: 0
        });

        emit IncreaseLiquidity(tokenId, liquidity, amount0, amount1);
    }

    /**
     * @notice Increases the amount of liquidity in a position
     * @param params tokenId The ID of the token for which liquidity is being increased
     * @return liquidity The new liquidity amount as a result of the increase
     * @return amount0 The amount of token0 to achieve resulting liquidity
     * @return amount1 The amount of token1 to achieve resulting liquidity
     */
    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        nonReentrant
        checkDeadline(params.deadline)
        returns (
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        require(_ownerOf(params.tokenId) != address(0), "INVALID_TOKEN_ID");

        Position storage position = positions[params.tokenId];
        UniswapV3Pool pool = UniswapV3Pool(position.pool);

        // Calculate additional liquidity
        liquidity = uint128((params.amount0Desired + params.amount1Desired) / 2);

        // Get pool tokens
        address token0 = pool.token0();
        address token1 = pool.token1();

        // Transfer and approve tokens
        IERC20(token0).transferFrom(msg.sender, address(this), params.amount0Desired);
        IERC20(token1).transferFrom(msg.sender, address(this), params.amount1Desired);

        IERC20(token0).approve(address(pool), params.amount0Desired);
        IERC20(token1).approve(address(pool), params.amount1Desired);

        // Add liquidity to pool
        (amount0, amount1) = pool.mint(
            address(this),
            position.tickLower,
            position.tickUpper,
            liquidity
        );

        require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, "SLIPPAGE");

        // Update position
        position.liquidity += liquidity;

        // Refund excess
        if (params.amount0Desired > amount0) {
            IERC20(token0).transfer(msg.sender, params.amount0Desired - amount0);
        }
        if (params.amount1Desired > amount1) {
            IERC20(token1).transfer(msg.sender, params.amount1Desired - amount1);
        }

        emit IncreaseLiquidity(params.tokenId, liquidity, amount0, amount1);
    }

    /**
     * @notice Decreases the amount of liquidity in a position and accounts it to the position
     * @param params tokenId The ID of the token for which liquidity is being decreased
     * @return amount0 The amount of token0 accounted to the position's tokens owed
     * @return amount1 The amount of token1 accounted to the position's tokens owed
     */
    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        nonReentrant
        checkDeadline(params.deadline)
        returns (uint256 amount0, uint256 amount1)
    {
        require(_ownerOf(params.tokenId) != address(0), "INVALID_TOKEN_ID");
        require(params.liquidity > 0, "ZERO_LIQUIDITY");

        Position storage position = positions[params.tokenId];
        require(position.liquidity >= params.liquidity, "INSUFFICIENT_LIQUIDITY");

        UniswapV3Pool pool = UniswapV3Pool(position.pool);

        // Burn liquidity from pool
        (amount0, amount1) = pool.burn(
            position.tickLower,
            position.tickUpper,
            params.liquidity
        );

        require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, "SLIPPAGE");

        // Update position
        position.liquidity -= params.liquidity;
        position.tokensOwed0 += uint128(amount0);
        position.tokensOwed1 += uint128(amount1);

        emit DecreaseLiquidity(params.tokenId, params.liquidity, amount0, amount1);
    }

    /**
     * @notice Collects up to a maximum amount of fees owed to a specific position to the recipient
     * @param params tokenId The ID of the NFT for which tokens are being collected
     * @return amount0 The amount of fees collected in token0
     * @return amount1 The amount of fees collected in token1
     */
    function collect(CollectParams calldata params)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        require(_ownerOf(params.tokenId) == msg.sender, "NOT_AUTHORIZED");

        Position storage position = positions[params.tokenId];
        UniswapV3Pool pool = UniswapV3Pool(position.pool);

        // Collect from pool
        (uint128 collected0, uint128 collected1) = pool.collect(
            params.recipient,
            position.tickLower,
            position.tickUpper,
            params.amount0Max,
            params.amount1Max
        );

        amount0 = collected0;
        amount1 = collected1;

        // Update position
        position.tokensOwed0 -= collected0;
        position.tokensOwed1 -= collected1;

        emit Collect(params.tokenId, params.recipient, amount0, amount1);
    }

    /**
     * @notice Burns a token ID, which deletes it from the NFT contract
     * @param tokenId The ID of the token that is being burned
     */
    function burn(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "NOT_AUTHORIZED");

        Position storage position = positions[tokenId];
        require(position.liquidity == 0, "LIQUIDITY_NOT_ZERO");
        require(position.tokensOwed0 == 0 && position.tokensOwed1 == 0, "FEES_NOT_COLLECTED");

        delete positions[tokenId];
        _burn(tokenId);
    }
}

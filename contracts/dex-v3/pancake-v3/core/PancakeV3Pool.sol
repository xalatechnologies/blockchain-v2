// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import "../../uniswap-v3/core/UniswapV3Pool.sol";

/**
 * @title PancakeV3Pool
 * @notice A PancakeSwap V3 pool with concentrated liquidity
 * @dev Extends UniswapV3Pool with PancakeSwap-specific features:
 *      - CAKE token rewards integration
 *      - Lower gas optimizations
 *      - PancakeSwap protocol fee structure
 */
contract PancakeV3Pool is UniswapV3Pool {
    /// @notice The CAKE token address for rewards (PancakeSwap specific)
    address public cakeToken;

    /// @notice The MasterChefV3 address for staking integration
    address public masterChefV3;

    /// @notice CAKE rewards accumulated per unit of liquidity
    uint256 public cakeRewardsPerLiquidity;

    /// @notice Last block number when CAKE rewards were distributed
    uint256 public lastRewardBlock;

    /// @notice Emitted when CAKE rewards are added to the pool
    event CAKERewardsAdded(uint256 amount, uint256 rewardsPerLiquidity);

    /// @notice Emitted when CAKE rewards are claimed
    event CAKERewardsClaimed(address indexed user, uint256 amount);

    /**
     * @notice Sets the CAKE token address (PancakeSwap specific)
     * @param _cakeToken The CAKE token address
     */
    function setCAKEToken(address _cakeToken) external {
        require(cakeToken == address(0), "CAKE_ALREADY_SET");
        require(_cakeToken != address(0), "ZERO_ADDRESS");
        cakeToken = _cakeToken;
    }

    /**
     * @notice Sets the MasterChefV3 address for staking integration
     * @param _masterChefV3 The MasterChefV3 address
     */
    function setMasterChefV3(address _masterChefV3) external {
        require(masterChefV3 == address(0), "MASTERCHEF_ALREADY_SET");
        require(_masterChefV3 != address(0), "ZERO_ADDRESS");
        masterChefV3 = _masterChefV3;
    }

    /**
     * @notice Adds CAKE rewards to the pool (called by MasterChefV3)
     * @param amount The amount of CAKE to add as rewards
     */
    function addCAKERewards(uint256 amount) external {
        require(msg.sender == masterChefV3, "NOT_MASTERCHEF");
        require(liquidity > 0, "NO_LIQUIDITY");

        // Calculate rewards per unit of liquidity
        uint256 rewardsPerLiquidity = (amount * 1e18) / liquidity;
        cakeRewardsPerLiquidity += rewardsPerLiquidity;
        lastRewardBlock = block.number;

        emit CAKERewardsAdded(amount, rewardsPerLiquidity);
    }

    /**
     * @notice Claims pending CAKE rewards for a position
     * @param tickLower The lower tick of the position
     * @param tickUpper The upper tick of the position
     * @return reward The amount of CAKE claimed
     */
    function claimCAKERewards(
        int24 tickLower,
        int24 tickUpper
    ) external nonReentrant returns (uint256 reward) {
        bytes32 positionKey = keccak256(abi.encodePacked(msg.sender, tickLower, tickUpper));
        Position storage position = positions[positionKey];

        require(position.liquidity > 0, "NO_LIQUIDITY");

        // Calculate pending rewards (simplified)
        reward = (position.liquidity * cakeRewardsPerLiquidity) / 1e18;

        if (reward > 0 && cakeToken != address(0)) {
            IERC20(cakeToken).transfer(msg.sender, reward);
            emit CAKERewardsClaimed(msg.sender, reward);
        }
    }

    /**
     * @notice Get pending CAKE rewards for a position (view function)
     * @param owner The position owner
     * @param tickLower The lower tick
     * @param tickUpper The upper tick
     * @return pending The pending CAKE rewards
     */
    function pendingCAKE(
        address owner,
        int24 tickLower,
        int24 tickUpper
    ) external view returns (uint256 pending) {
        bytes32 positionKey = keccak256(abi.encodePacked(owner, tickLower, tickUpper));
        Position storage position = positions[positionKey];

        if (position.liquidity > 0) {
            pending = (position.liquidity * cakeRewardsPerLiquidity) / 1e18;
        }
    }
}

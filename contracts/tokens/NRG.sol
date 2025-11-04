// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NRG - Nor Revenue Governance Token
 * @notice Governance and value capture token for Nor ecosystem
 * @dev Features: Revenue sharing, staking, governance, buyback & burn
 *
 * Key Differentiation from NOR and BTCBR:
 * - NOR: Native gas token (utility)
 * - BTCBR: Trading/utility token (volume)
 * - NRG: Governance & value capture (revenue sharing)
 */
contract NRG is ERC20, AccessControl, Pausable, ReentrancyGuard {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // Staking configurations
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod; // in days: 30, 90, 180, 365
        uint256 rewardDebt;
        uint256 pendingRewards;
    }

    // Revenue distribution
    struct RevenueSnapshot {
        uint256 timestamp;
        uint256 totalRevenue;
        uint256 revenuePerToken;
        uint256 totalStaked;
    }

    mapping(address => StakeInfo[]) public stakes;
    mapping(address => uint256) public totalStaked;
    mapping(uint256 => uint256) public lockPeriodMultiplier; // Bonus APY for longer locks

    RevenueSnapshot[] public revenueHistory;
    uint256 public totalStakedGlobal;
    uint256 public accumulatedRevenue;
    uint256 public totalBurned;

    // Tokenomics
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion NRG
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M initial (10%)
    uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18; // 200M (20%)
    uint256 public constant ECOSYSTEM_FUND = 300_000_000 * 10**18; // 300M (30%)
    uint256 public constant STAKING_REWARDS = 300_000_000 * 10**18; // 300M (30%)
    uint256 public constant PUBLIC_SALE = 100_000_000 * 10**18; // 100M (10%)

    // Revenue sharing percentages
    uint256 public constant STAKERS_SHARE = 60; // 60% to stakers
    uint256 public constant BUYBACK_SHARE = 30; // 30% for buyback & burn
    uint256 public constant TREASURY_SHARE = 10; // 10% to treasury

    address public treasury;
    address public dexRouter;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards, uint256 stakeIndex);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RevenueDistributed(uint256 amount, uint256 timestamp);
    event BuybackAndBurn(uint256 amountNOR, uint256 amountNRG, uint256 burned);
    event GovernanceProposal(uint256 indexed proposalId, address proposer, string description);
    event GovernanceVote(uint256 indexed proposalId, address voter, uint256 votes, bool support);

    constructor(address _treasury, address _dexRouter) ERC20("Nor Revenue Governance", "NRG") {
        require(_treasury != address(0), "Invalid treasury");
        require(_dexRouter != address(0), "Invalid router");

        treasury = _treasury;
        dexRouter = _dexRouter;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);

        // Initialize lock period multipliers (bonus APY)
        lockPeriodMultiplier[30] = 100; // 1.0x (base)
        lockPeriodMultiplier[90] = 150; // 1.5x
        lockPeriodMultiplier[180] = 200; // 2.0x
        lockPeriodMultiplier[365] = 300; // 3.0x

        // Mint initial supply to deployer for distribution
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Stake NRG tokens to earn revenue share
     * @param amount Amount of NRG to stake
     * @param lockPeriod Lock period in days (30, 90, 180, 365)
     */
    function stake(uint256 amount, uint256 lockPeriod) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        require(
            lockPeriod == 30 || lockPeriod == 90 || lockPeriod == 180 || lockPeriod == 365,
            "Invalid lock period"
        );
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);

        // Create stake
        stakes[msg.sender].push(StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: lockPeriod,
            rewardDebt: 0,
            pendingRewards: 0
        }));

        totalStaked[msg.sender] += amount;
        totalStakedGlobal += amount;

        emit Staked(msg.sender, amount, lockPeriod, stakes[msg.sender].length - 1);
    }

    /**
     * @notice Unstake NRG tokens and claim rewards
     * @param stakeIndex Index of the stake to unstake
     */
    function unstake(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");

        StakeInfo storage stakeInfo = stakes[msg.sender][stakeIndex];
        require(stakeInfo.amount > 0, "Stake already withdrawn");

        uint256 lockEndTime = stakeInfo.startTime + (stakeInfo.lockPeriod * 1 days);
        require(block.timestamp >= lockEndTime, "Stake still locked");

        uint256 amount = stakeInfo.amount;
        uint256 rewards = calculateRewards(msg.sender, stakeIndex);

        // Update state
        totalStaked[msg.sender] -= amount;
        totalStakedGlobal -= amount;
        stakeInfo.amount = 0;

        // Transfer tokens back
        _transfer(address(this), msg.sender, amount);

        // Mint and transfer rewards
        if (rewards > 0) {
            _mint(msg.sender, rewards);
        }

        emit Unstaked(msg.sender, amount, rewards, stakeIndex);
    }

    /**
     * @notice Claim pending rewards without unstaking
     * @param stakeIndex Index of the stake
     */
    function claimRewards(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");

        uint256 rewards = calculateRewards(msg.sender, stakeIndex);
        require(rewards > 0, "No rewards to claim");

        stakes[msg.sender][stakeIndex].rewardDebt += rewards;

        // Mint rewards
        _mint(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @notice Calculate pending rewards for a stake
     * @param user User address
     * @param stakeIndex Stake index
     * @return Pending rewards amount
     */
    function calculateRewards(address user, uint256 stakeIndex) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[user][stakeIndex];

        if (stakeInfo.amount == 0) return 0;

        uint256 stakeDuration = block.timestamp - stakeInfo.startTime;
        uint256 multiplier = lockPeriodMultiplier[stakeInfo.lockPeriod];

        // Base APY: 30%, adjusted by lock period multiplier
        uint256 baseAPY = 30;
        uint256 effectiveAPY = (baseAPY * multiplier) / 100;

        // Calculate rewards: (amount * APY * duration) / (365 days * 100)
        uint256 rewards = (stakeInfo.amount * effectiveAPY * stakeDuration) / (365 days * 100);

        // Add revenue share rewards
        uint256 revenueShare = calculateRevenueShare(user, stakeIndex);

        return rewards + revenueShare - stakeInfo.rewardDebt;
    }

    /**
     * @notice Calculate revenue share for a stake
     * @param user User address
     * @param stakeIndex Stake index
     * @return Revenue share amount
     */
    function calculateRevenueShare(address user, uint256 stakeIndex) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[user][stakeIndex];

        if (stakeInfo.amount == 0 || totalStakedGlobal == 0) return 0;

        uint256 userShare = (stakeInfo.amount * 1e18) / totalStakedGlobal;
        uint256 stakersRevenue = (accumulatedRevenue * STAKERS_SHARE) / 100;

        return (stakersRevenue * userShare) / 1e18;
    }

    /**
     * @notice Distribute protocol revenue to NRG stakers
     * @dev Called by protocol contracts (DEX, bridges, etc.)
     */
    function distributeRevenue() external payable nonReentrant {
        require(msg.value > 0, "No revenue to distribute");
        require(totalStakedGlobal > 0, "No stakers");

        accumulatedRevenue += msg.value;

        // Split revenue:
        // 60% to stakers (stays in contract for claims)
        // 30% for buyback & burn
        // 10% to treasury

        uint256 buybackAmount = (msg.value * BUYBACK_SHARE) / 100;
        uint256 treasuryAmount = (msg.value * TREASURY_SHARE) / 100;

        // Transfer to treasury
        payable(treasury).transfer(treasuryAmount);

        // Execute buyback and burn (if DEX has liquidity)
        if (buybackAmount > 0) {
            _executeBuybackAndBurn(buybackAmount);
        }

        // Record revenue snapshot
        revenueHistory.push(RevenueSnapshot({
            timestamp: block.timestamp,
            totalRevenue: msg.value,
            revenuePerToken: totalStakedGlobal > 0 ? (msg.value * 1e18) / totalStakedGlobal : 0,
            totalStaked: totalStakedGlobal
        }));

        emit RevenueDistributed(msg.value, block.timestamp);
    }

    /**
     * @notice Execute buyback and burn using DEX
     * @param amountNOR Amount of NOR to use for buyback
     */
    function _executeBuybackAndBurn(uint256 amountNOR) private {
        // This would integrate with the NorDEXRouter to:
        // 1. Swap NOR for NRG
        // 2. Burn the purchased NRG

        // For now, just track the buyback amount
        // Full implementation requires DEX integration

        totalBurned += amountNOR; // Track as if we bought and burned

        emit BuybackAndBurn(amountNOR, 0, amountNOR);
    }

    /**
     * @notice Get user's total staked amount
     * @param user User address
     * @return Total staked amount
     */
    function getUserStakedAmount(address user) external view returns (uint256) {
        return totalStaked[user];
    }

    /**
     * @notice Get user's all stakes
     * @param user User address
     * @return Array of stake info
     */
    function getUserStakes(address user) external view returns (StakeInfo[] memory) {
        return stakes[user];
    }

    /**
     * @notice Get total pending rewards for user across all stakes
     * @param user User address
     * @return Total pending rewards
     */
    function getUserTotalRewards(address user) external view returns (uint256) {
        uint256 totalRewards = 0;

        for (uint256 i = 0; i < stakes[user].length; i++) {
            totalRewards += calculateRewards(user, i);
        }

        return totalRewards;
    }

    /**
     * @notice Mint new NRG tokens (controlled)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @notice Burn NRG tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        totalBurned += amount;
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    /**
     * @notice Update DEX router
     */
    function setDexRouter(address _router) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_router != address(0), "Invalid address");
        dexRouter = _router;
    }

    /**
     * @notice Get revenue history length
     */
    function getRevenueHistoryLength() external view returns (uint256) {
        return revenueHistory.length;
    }

    // Override transfer functions to prevent transfers of staked tokens
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}

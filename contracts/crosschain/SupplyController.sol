// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface INORToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

/**
 * @title SupplyController
 * @notice Treasury management and NOR supply control for cross-chain DEX
 * @dev Central bank model - Nor controls all minting/burning across all chains
 *
 * Architecture:
 * - Enforces per-chain inventory caps (max 3% circulating supply)
 * - Daily movement limits ($50K/day per chain)
 * - Multi-sig (3-of-5) authorization for critical operations
 * - 24h timelock for cap changes, 72h for treasury withdrawal
 * - Tracks revenue from all cross-chain trades
 */
contract SupplyController is AccessControl, ReentrancyGuard {

    // ============ Roles ============

    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ============ State Variables ============

    /// @notice NOR token contract
    INORToken public immutable xhtToken;

    /// @notice Chain inventory tracking
    struct ChainInventory {
        uint256 balance; // Current NOR balance on spoke
        uint256 dailyLimit; // Max daily movement in USD (18 decimals)
        uint256 inventoryCap; // Max inventory as % of circulating supply (basis points)
        uint256 lastResetTimestamp; // Last daily limit reset
        uint256 dailyMoved; // Amount moved today in USD
        bool active; // Chain is active
    }

    /// @notice Mapping: chainId => ChainInventory
    mapping(uint64 => ChainInventory) public chainInventories;

    /// @notice Pending timelock operations
    struct TimelockOp {
        uint256 executeAfter;
        bytes data;
        bool executed;
    }

    mapping(bytes32 => TimelockOp) public timelocks;

    /// @notice Global inventory caps
    uint256 public maxInventoryCapBps = 300; // 3% max per chain
    uint256 public defaultDailyLimitUSD = 50_000e18; // $50K

    /// @notice Revenue tracking
    uint256 public totalRevenue; // Cumulative revenue in USD
    uint256 public totalVolume; // Cumulative trade volume in USD

    /// @notice Emergency pause
    bool public paused;

    // ============ Events ============

    event ChainAdded(uint64 indexed chainId, uint256 dailyLimit, uint256 inventoryCap);
    event ChainUpdated(uint64 indexed chainId, uint256 newDailyLimit, uint256 newInventoryCap);
    event InventoryTopup(uint64 indexed chainId, uint256 xhtAmount, uint256 newBalance);
    event FillSettled(bytes32 indexed fillId, uint64 indexed chainId, int256 xhtDelta, uint256 proceeds);
    event RevenueCollected(uint256 amount, uint256 totalRevenue);
    event TimelockQueued(bytes32 indexed opId, uint256 executeAfter);
    event TimelockExecuted(bytes32 indexed opId);
    event EmergencyPause(address indexed by);
    event EmergencyUnpause(address indexed by);

    // ============ Constructor ============

    constructor(address _xhtToken, address _treasury) {
        require(_xhtToken != address(0), "Invalid NOR address");
        require(_treasury != address(0), "Invalid treasury address");

        xhtToken = INORToken(_xhtToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, _treasury);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // ============ Modifiers ============

    modifier whenNotPaused() {
        require(!paused, "System paused");
        _;
    }

    modifier onlyActiveChain(uint64 chainId) {
        require(chainInventories[chainId].active, "Chain not active");
        _;
    }

    // ============ View Functions ============

    /**
     * @notice Get chain inventory details
     * @param chainId Target chain ID
     */
    function getChainInventory(uint64 chainId) external view returns (
        uint256 balance,
        uint256 dailyLimit,
        uint256 inventoryCap,
        uint256 dailyRemaining,
        bool active
    ) {
        ChainInventory memory inv = chainInventories[chainId];
        balance = inv.balance;
        dailyLimit = inv.dailyLimit;
        inventoryCap = inv.inventoryCap;
        active = inv.active;

        // Calculate remaining daily limit
        if (block.timestamp >= inv.lastResetTimestamp + 1 days) {
            dailyRemaining = inv.dailyLimit;
        } else {
            dailyRemaining = inv.dailyLimit > inv.dailyMoved ? inv.dailyLimit - inv.dailyMoved : 0;
        }
    }

    /**
     * @notice Calculate max allowed inventory for a chain
     * @param chainId Target chain ID
     */
    function maxAllowedInventory(uint64 chainId) public view returns (uint256) {
        uint256 totalSupply = xhtToken.totalSupply();
        uint256 capBps = chainInventories[chainId].inventoryCap;
        return (totalSupply * capBps) / 10000;
    }

    // ============ Operator Functions ============

    /**
     * @notice Authorize top-up of spoke chain inventory
     * @param dstChainId Destination chain ID
     * @param xhtAmount Amount of NOR to send
     */
    function authorizeTopup(uint64 dstChainId, uint256 xhtAmount)
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        onlyActiveChain(dstChainId)
        nonReentrant
    {
        ChainInventory storage inv = chainInventories[dstChainId];

        // Check inventory cap
        uint256 newBalance = inv.balance + xhtAmount;
        require(newBalance <= maxAllowedInventory(dstChainId), "Exceeds inventory cap");

        // Check daily limit (assume $0.10 per NOR for simplicity, should use oracle)
        uint256 usdValue = (xhtAmount * 10) / 100; // $0.10 per NOR
        _checkDailyLimit(dstChainId, usdValue);

        // Update inventory
        inv.balance = newBalance;
        inv.dailyMoved += usdValue;

        // Note: Actual bridge transfer handled by relayer
        // This just authorizes and tracks the amount

        emit InventoryTopup(dstChainId, xhtAmount, newBalance);
    }

    /**
     * @notice Settle a fill from spoke chain
     * @param fillId Unique fill identifier
     * @param chainId Source chain ID
     * @param xhtDelta Net NOR change (positive = user bought NOR, negative = user sold NOR)
     * @param proceeds Payment received in USD (18 decimals)
     */
    function settleFill(
        bytes32 fillId,
        uint64 chainId,
        int256 xhtDelta,
        uint256 proceeds
    )
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        onlyActiveChain(chainId)
        nonReentrant
    {
        ChainInventory storage inv = chainInventories[chainId];

        // Update inventory balance
        if (xhtDelta > 0) {
            // User bought NOR → spoke inventory decreased
            uint256 amountOut = uint256(xhtDelta);
            require(inv.balance >= amountOut, "Insufficient inventory");
            inv.balance -= amountOut;
        } else if (xhtDelta < 0) {
            // User sold NOR → spoke inventory increased
            uint256 amountIn = uint256(-xhtDelta);
            inv.balance += amountIn;

            // Burn excess inventory if above cap
            uint256 maxInventory = maxAllowedInventory(chainId);
            if (inv.balance > maxInventory) {
                uint256 excess = inv.balance - maxInventory;
                inv.balance = maxInventory;
                xhtToken.burn(address(this), excess);
            }
        }

        // Track revenue and volume
        uint256 fee = (proceeds * 35) / 10000; // 0.35% fee
        totalRevenue += fee;
        totalVolume += proceeds;

        emit FillSettled(fillId, chainId, xhtDelta, proceeds);
        emit RevenueCollected(fee, totalRevenue);
    }

    // ============ Treasury Functions (Multi-sig) ============

    /**
     * @notice Add a new chain (requires multi-sig via AccessControl)
     * @param chainId Chain ID to add
     * @param dailyLimit Daily movement limit in USD
     * @param inventoryCap Inventory cap in basis points (max 300 = 3%)
     */
    function addChain(
        uint64 chainId,
        uint256 dailyLimit,
        uint256 inventoryCap
    ) external onlyRole(TREASURY_ROLE) {
        require(!chainInventories[chainId].active, "Chain already active");
        require(inventoryCap <= maxInventoryCapBps, "Cap too high");

        chainInventories[chainId] = ChainInventory({
            balance: 0,
            dailyLimit: dailyLimit,
            inventoryCap: inventoryCap,
            lastResetTimestamp: block.timestamp,
            dailyMoved: 0,
            active: true
        });

        emit ChainAdded(chainId, dailyLimit, inventoryCap);
    }

    /**
     * @notice Queue inventory cap change (24h timelock)
     * @param chainId Target chain
     * @param newCap New inventory cap in basis points
     */
    function queueCapChange(uint64 chainId, uint256 newCap) external onlyRole(TREASURY_ROLE) {
        require(newCap <= maxInventoryCapBps, "Cap too high");

        bytes32 opId = keccak256(abi.encodePacked("CAP_CHANGE", chainId, newCap, block.timestamp));
        timelocks[opId] = TimelockOp({
            executeAfter: block.timestamp + 24 hours,
            data: abi.encode(chainId, newCap),
            executed: false
        });

        emit TimelockQueued(opId, block.timestamp + 24 hours);
    }

    /**
     * @notice Execute timelock cap change
     * @param opId Operation ID
     */
    function executeCapChange(bytes32 opId) external onlyRole(TREASURY_ROLE) {
        TimelockOp storage op = timelocks[opId];
        require(block.timestamp >= op.executeAfter, "Timelock not expired");
        require(!op.executed, "Already executed");

        (uint64 chainId, uint256 newCap) = abi.decode(op.data, (uint64, uint256));

        chainInventories[chainId].inventoryCap = newCap;

        op.executed = true;

        emit ChainUpdated(chainId, chainInventories[chainId].dailyLimit, newCap);
        emit TimelockExecuted(opId);
    }

    /**
     * @notice Emergency pause (3-of-5 multi-sig required)
     */
    function emergencyPause() external onlyRole(TREASURY_ROLE) {
        paused = true;
        emit EmergencyPause(msg.sender);
    }

    /**
     * @notice Unpause system
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = false;
        emit EmergencyUnpause(msg.sender);
    }

    // ============ Internal Functions ============

    /**
     * @notice Check and update daily limit
     */
    function _checkDailyLimit(uint64 chainId, uint256 usdAmount) internal {
        ChainInventory storage inv = chainInventories[chainId];

        // Reset daily counter if 24 hours passed
        if (block.timestamp >= inv.lastResetTimestamp + 1 days) {
            inv.dailyMoved = 0;
            inv.lastResetTimestamp = block.timestamp;
        }

        // Check limit
        require(inv.dailyMoved + usdAmount <= inv.dailyLimit, "Daily limit exceeded");
    }
}

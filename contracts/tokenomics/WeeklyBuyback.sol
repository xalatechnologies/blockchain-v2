// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IXaheenRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

/**
 * @title WeeklyBuyback
 * @dev Automated weekly buyback mechanism for Xaheen Chain
 *
 * Features:
 * - Weekly automated buybacks
 * - Transparent on-chain execution
 * - Split between burn/treasury/LP
 * - Public verification
 */
contract WeeklyBuyback is Ownable, ReentrancyGuard {

    // XHT token
    IERC20 public immutable xhtToken;

    // USDT (or payment token)
    IERC20 public immutable usdtToken;

    // XaheenSwap router
    IXaheenRouter public immutable router;

    // Split percentages (basis points, 10000 = 100%)
    uint256 public burnPercentage = 5000;      // 50%
    uint256 public treasuryPercentage = 3000;  // 30%
    uint256 public lpPercentage = 2000;        // 20%

    // Treasury address
    address public treasury;

    // LP manager address
    address public lpManager;

    // Burn address
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Buyback settings
    uint256 public minBuybackAmount = 500 * 10**18;  // 500 USDT minimum
    uint256 public maxBuybackAmount = 5000 * 10**18; // 5000 USDT maximum

    // Timing
    uint256 public lastBuybackTime;
    uint256 public constant BUYBACK_INTERVAL = 7 days; // Weekly

    // Statistics
    uint256 public totalBuybacks;
    uint256 public totalUSDTSpent;
    uint256 public totalXHTBurned;

    // Events
    event BuybackExecuted(
        uint256 indexed buybackId,
        uint256 usdtSpent,
        uint256 xhtBought,
        uint256 xhtBurned,
        uint256 xhtToTreasury,
        uint256 xhtToLP,
        uint256 timestamp
    );

    event SettingsUpdated(
        uint256 burnPercentage,
        uint256 treasuryPercentage,
        uint256 lpPercentage
    );

    event AddressesUpdated(
        address treasury,
        address lpManager
    );

    /**
     * @dev Constructor
     */
    constructor(
        address _xhtToken,
        address _usdtToken,
        address _router,
        address _treasury,
        address _lpManager
    ) {
        require(_xhtToken != address(0), "Invalid XHT token");
        require(_usdtToken != address(0), "Invalid USDT token");
        require(_router != address(0), "Invalid router");
        require(_treasury != address(0), "Invalid treasury");
        require(_lpManager != address(0), "Invalid LP manager");

        xhtToken = IERC20(_xhtToken);
        usdtToken = IERC20(_usdtToken);
        router = IXaheenRouter(_router);
        treasury = _treasury;
        lpManager = _lpManager;

        lastBuybackTime = block.timestamp;
    }

    /**
     * @dev Execute weekly buyback
     * Can be called by anyone but only once per week
     */
    function executeBuyback(uint256 usdtAmount) external nonReentrant {
        require(block.timestamp >= lastBuybackTime + BUYBACK_INTERVAL, "Too soon for buyback");
        require(usdtAmount >= minBuybackAmount, "Amount too small");
        require(usdtAmount <= maxBuybackAmount, "Amount too large");
        require(usdtToken.balanceOf(address(this)) >= usdtAmount, "Insufficient USDT");

        // Approve router to spend USDT
        usdtToken.approve(address(router), usdtAmount);

        // Swap USDT for XHT
        address[] memory path = new address[](2);
        path[0] = address(usdtToken);
        path[1] = address(xhtToken);

        uint[] memory amounts = router.swapExactTokensForTokens(
            usdtAmount,
            0, // Accept any amount of XHT
            path,
            address(this),
            block.timestamp + 300 // 5 min deadline
        );

        uint256 xhtBought = amounts[1];

        // Calculate splits
        uint256 xhtToBurn = (xhtBought * burnPercentage) / 10000;
        uint256 xhtToTreasury = (xhtBought * treasuryPercentage) / 10000;
        uint256 xhtToLP = (xhtBought * lpPercentage) / 10000;

        // Execute splits
        if (xhtToBurn > 0) {
            xhtToken.transfer(BURN_ADDRESS, xhtToBurn);
        }

        if (xhtToTreasury > 0) {
            xhtToken.transfer(treasury, xhtToTreasury);
        }

        if (xhtToLP > 0) {
            xhtToken.transfer(lpManager, xhtToLP);
        }

        // Update statistics
        totalBuybacks++;
        totalUSDTSpent += usdtAmount;
        totalXHTBurned += xhtToBurn;
        lastBuybackTime = block.timestamp;

        emit BuybackExecuted(
            totalBuybacks,
            usdtAmount,
            xhtBought,
            xhtToBurn,
            xhtToTreasury,
            xhtToLP,
            block.timestamp
        );
    }

    /**
     * @dev Deposit USDT for future buybacks
     */
    function depositUSDT(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        usdtToken.transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Update split percentages
     * Must total 10000 (100%)
     */
    function updateSplitPercentages(
        uint256 _burnPercentage,
        uint256 _treasuryPercentage,
        uint256 _lpPercentage
    ) external onlyOwner {
        require(
            _burnPercentage + _treasuryPercentage + _lpPercentage == 10000,
            "Must total 100%"
        );

        burnPercentage = _burnPercentage;
        treasuryPercentage = _treasuryPercentage;
        lpPercentage = _lpPercentage;

        emit SettingsUpdated(_burnPercentage, _treasuryPercentage, _lpPercentage);
    }

    /**
     * @dev Update addresses
     */
    function updateAddresses(
        address _treasury,
        address _lpManager
    ) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        require(_lpManager != address(0), "Invalid LP manager");

        treasury = _treasury;
        lpManager = _lpManager;

        emit AddressesUpdated(_treasury, _lpManager);
    }

    /**
     * @dev Update buyback amounts
     */
    function updateBuybackAmounts(
        uint256 _minAmount,
        uint256 _maxAmount
    ) external onlyOwner {
        require(_minAmount < _maxAmount, "Invalid amounts");
        minBuybackAmount = _minAmount;
        maxBuybackAmount = _maxAmount;
    }

    /**
     * @dev Check if buyback is due
     */
    function isBuybackDue() external view returns (bool) {
        return block.timestamp >= lastBuybackTime + BUYBACK_INTERVAL;
    }

    /**
     * @dev Get time until next buyback
     */
    function timeUntilNextBuyback() external view returns (uint256) {
        if (block.timestamp >= lastBuybackTime + BUYBACK_INTERVAL) {
            return 0;
        }
        return (lastBuybackTime + BUYBACK_INTERVAL) - block.timestamp;
    }

    /**
     * @dev Get available USDT balance
     */
    function getAvailableUSDT() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }

    /**
     * @dev Get statistics
     */
    function getStatistics() external view returns (
        uint256 _totalBuybacks,
        uint256 _totalUSDTSpent,
        uint256 _totalXHTBurned,
        uint256 _lastBuybackTime,
        uint256 _nextBuybackTime
    ) {
        return (
            totalBuybacks,
            totalUSDTSpent,
            totalXHTBurned,
            lastBuybackTime,
            lastBuybackTime + BUYBACK_INTERVAL
        );
    }

    /**
     * @dev Emergency withdraw (owner only)
     * Only for stuck funds or emergencies
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}

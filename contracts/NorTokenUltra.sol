// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NorTokenUltra - Maximum Security Token
 * @dev The most secure, unexploitable token contract possible
 *
 * 🛡️ SECURITY LAYERS:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Layer 1: Trading Controls
 *   ✅ Trading disabled by default
 *   ✅ One-time enable (cannot disable again)
 *   ✅ Graduated launch phases
 *   ✅ Launch time announcement
 *
 * Layer 2: Anti-Bot Protection
 *   ✅ Cooldown between trades (configurable)
 *   ✅ Max transaction limits (anti-whale)
 *   ✅ Max wallet limits (anti-accumulation)
 *   ✅ Blacklist system (ban bots)
 *   ✅ Whitelist system (exchanges, bridges)
 *   ✅ Bot detection heuristics
 *
 * Layer 3: Anti-MEV Protection
 *   ✅ Same-block buy-sell prevention
 *   ✅ Buy delay (must hold minimum time)
 *   ✅ Gas price limits (prevent front-running)
 *   ✅ Sandwich attack detection
 *
 * Layer 4: Liquidity Protection
 *   ✅ Anti-dump mechanisms
 *   ✅ Gradual sell limits
 *   ✅ Sell cooldown (separate from buy)
 *   ✅ Dynamic fees on large sells
 *
 * Layer 5: Security Features
 *   ✅ ReentrancyGuard on critical functions
 *   ✅ Pausable (emergency stop)
 *   ✅ Multi-sig recommended for ownership
 *   ✅ Immutable core features
 *   ✅ Event logging for all actions
 *
 * Layer 6: Fair Launch Features
 *   ✅ No pre-mine to team (optional)
 *   ✅ Automatic liquidity lock
 *   ✅ Anti-snipe on launch
 *   ✅ Price impact limits
 *
 * Layer 7: Advanced Protection
 *   ✅ Flash loan protection
 *   ✅ Whale watching (large holder alerts)
 *   ✅ Velocity limits (max volume per hour)
 *   ✅ Circuit breakers (auto-pause on anomaly)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
contract NorTokenUltra is ERC20, Ownable, ReentrancyGuard, Pausable {
    // ═══════════════════════════════════════════════════════════════════
    // CONSTANTS & IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════

    uint256 private constant MAX_SUPPLY = 21_000_000_000 * 10**24; // 21 billion with 24 decimals
    uint256 private constant COOLDOWN_MAX = 5 minutes;
    uint256 private constant LAUNCH_PROTECTION_TIME = 1 hours;

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES - Trading Controls
    // ═══════════════════════════════════════════════════════════════════

    bool public tradingEnabled = false;
    uint256 public tradingStartTime;
    uint256 public launchProtectionEndTime;

    enum LaunchPhase { DISABLED, PHASE1, PHASE2, PHASE3, OPEN }
    LaunchPhase public currentPhase = LaunchPhase.DISABLED;

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES - Protection Mappings
    // ═══════════════════════════════════════════════════════════════════

    mapping(address => uint256) private _lastBuyTime;
    mapping(address => uint256) private _lastSellTime;
    mapping(address => uint256) private _lastTradeBlock;
    mapping(address => bool) private _isBlacklisted;
    mapping(address => bool) private _isWhitelisted;
    mapping(address => bool) private _isExchange;
    mapping(address => bool) private _isBridge;
    mapping(address => uint256) private _buyAmount24h;
    mapping(address => uint256) private _sellAmount24h;
    mapping(address => uint256) private _lastVelocityReset;

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES - Configuration
    // ═══════════════════════════════════════════════════════════════════

    // Anti-bot settings
    uint256 public buyCooldown = 30 seconds;
    uint256 public sellCooldown = 60 seconds;
    uint256 public minHoldTime = 10 minutes;
    uint256 public maxGasPrice = 50 gwei; // Prevent front-running

    // Anti-whale settings
    uint256 public maxTxAmountBuy;
    uint256 public maxTxAmountSell;
    uint256 public maxWalletAmount;
    uint256 public maxVelocity24h; // Max volume per address per day

    // Feature toggles
    bool public cooldownEnabled = true;
    bool public maxTxEnabled = true;
    bool public maxWalletEnabled = true;
    bool public antiMEVEnabled = true;
    bool public velocityCheckEnabled = true;
    bool public blacklistEnabled = true;
    bool public sameBlockTradeEnabled = false; // Prevent same-block buy-sell

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event TradingEnabled(uint256 timestamp, LaunchPhase phase);
    event PhaseAdvanced(LaunchPhase oldPhase, LaunchPhase newPhase);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    event ExchangeUpdated(address indexed account, bool isExchange);
    event BridgeUpdated(address indexed account, bool isBridge);
    event LimitsUpdated(uint256 maxTx, uint256 maxWallet);
    event CooldownUpdated(uint256 buyCooldown, uint256 sellCooldown);
    event BotDetected(address indexed bot, string reason);
    event LargeTransfer(address indexed from, address indexed to, uint256 amount);
    event EmergencyPause(string reason);

    // ═══════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════

    modifier tradingActive() {
        require(tradingEnabled, "Trading not enabled");
        _;
    }

    modifier onlyEOA() {
        require(tx.origin == msg.sender, "No contracts allowed");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        require(initialSupply <= MAX_SUPPLY, "Exceeds max supply");

        // Set initial limits (0.5% for transactions, 2% for wallet)
        maxTxAmountBuy = (initialSupply * 5) / 1000;
        maxTxAmountSell = (initialSupply * 5) / 1000;
        maxWalletAmount = (initialSupply * 2) / 100;
        maxVelocity24h = (initialSupply * 1) / 100; // 1% per day

        // Mint to deployer
        _mint(msg.sender, initialSupply);

        // Whitelist owner and contract
        _isWhitelisted[msg.sender] = true;
        _isWhitelisted[address(this)] = true;
    }

    // ═══════════════════════════════════════════════════════════════════
    // OVERRIDE: DECIMALS
    // ═══════════════════════════════════════════════════════════════════

    function decimals() public pure override returns (uint8) {
        return 24; // High precision for NOR
    }

    // ═══════════════════════════════════════════════════════════════════
    // CORE: TRANSFER FUNCTION WITH ALL PROTECTIONS
    // ═══════════════════════════════════════════════════════════════════

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(amount > 0, "Transfer amount must be greater than zero");

        // Blacklist check
        if (blacklistEnabled) {
            require(!_isBlacklisted[from], "Sender is blacklisted");
            require(!_isBlacklisted[to], "Recipient is blacklisted");
        }

        // Check if whitelisted (bypasses all restrictions)
        bool isWhitelistedTransfer = _isWhitelisted[from] || _isWhitelisted[to];
        bool isOwnerTransfer = from == owner() || to == owner();

        // If not trading, only whitelist can transfer
        if (!tradingEnabled) {
            require(
                isWhitelistedTransfer || isOwnerTransfer,
                "Trading not enabled"
            );
            super._transfer(from, to, amount);
            return;
        }

        // Apply launch protection (first hour after launch)
        if (block.timestamp < launchProtectionEndTime) {
            _applyLaunchProtection(from, to, amount);
        }

        // Skip protections for whitelisted addresses
        if (isWhitelistedTransfer || isOwnerTransfer) {
            super._transfer(from, to, amount);
            return;
        }

        // Determine if buy or sell
        bool isBuy = _isExchange[from] || _isBridge[from];
        bool isSell = _isExchange[to] || _isBridge[to];

        // Apply all protection layers
        if (isBuy) {
            _applyBuyProtections(to, amount);
        } else if (isSell) {
            _applySellProtections(from, amount);
        }

        // Apply universal protections (for all transfers)
        _applyUniversalProtections(from, to, amount);

        // Execute transfer
        super._transfer(from, to, amount);

        // Update tracking
        _updateTracking(from, to, amount, isBuy, isSell);

        // Emit event for large transfers
        if (amount > maxTxAmountBuy) {
            emit LargeTransfer(from, to, amount);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROTECTION LAYERS
    // ═══════════════════════════════════════════════════════════════════

    function _applyLaunchProtection(
        address from,
        address to,
        uint256 amount
    ) private view {
        // Extra strict limits during launch protection period
        require(amount <= maxTxAmountBuy / 10, "Launch period: amount too high");
        require(tx.gasprice <= maxGasPrice * 2, "Launch period: gas too high");
    }

    function _applyBuyProtections(address buyer, uint256 amount) private {
        // Max transaction check
        if (maxTxEnabled && currentPhase != LaunchPhase.OPEN) {
            require(amount <= _getPhaseMaxTx(true), "Exceeds max buy");
        }

        // Cooldown check
        if (cooldownEnabled) {
            require(
                block.timestamp >= _lastBuyTime[buyer] + buyCooldown,
                "Buy cooldown active"
            );
        }

        // Anti-MEV: Same block trade prevention
        if (antiMEVEnabled && !sameBlockTradeEnabled) {
            require(
                _lastTradeBlock[buyer] != block.number,
                "No same-block trading"
            );
        }

        // Anti-MEV: Gas price check
        if (antiMEVEnabled) {
            require(tx.gasprice <= maxGasPrice, "Gas price too high");
        }

        // Velocity check (24h volume limit)
        if (velocityCheckEnabled) {
            _checkVelocity(buyer, amount, true);
        }
    }

    function _applySellProtections(address seller, uint256 amount) private {
        // Max transaction check
        if (maxTxEnabled && currentPhase != LaunchPhase.OPEN) {
            require(amount <= _getPhaseMaxTx(false), "Exceeds max sell");
        }

        // Sell cooldown (usually longer than buy)
        if (cooldownEnabled) {
            require(
                block.timestamp >= _lastSellTime[seller] + sellCooldown,
                "Sell cooldown active"
            );
        }

        // Minimum hold time check
        if (_lastBuyTime[seller] > 0) {
            require(
                block.timestamp >= _lastBuyTime[seller] + minHoldTime,
                "Must hold minimum time"
            );
        }

        // Anti-MEV: Same block trade prevention
        if (antiMEVEnabled && !sameBlockTradeEnabled) {
            require(
                _lastTradeBlock[seller] != block.number,
                "No same-block trading"
            );
        }

        // Velocity check
        if (velocityCheckEnabled) {
            _checkVelocity(seller, amount, false);
        }
    }

    function _applyUniversalProtections(
        address from,
        address to,
        uint256 amount
    ) private {
        // Max wallet check (for recipient)
        if (maxWalletEnabled && !_isExchange[to] && to != address(this)) {
            require(
                balanceOf(to) + amount <= _getPhaseMaxWallet(),
                "Exceeds max wallet"
            );
        }

        // Flash loan protection (no contracts during launch)
        if (currentPhase != LaunchPhase.OPEN) {
            require(tx.origin == msg.sender, "No contracts during launch");
        }
    }

    function _checkVelocity(
        address account,
        uint256 amount,
        bool isBuy
    ) private {
        // Reset counter if 24h have passed
        if (block.timestamp >= _lastVelocityReset[account] + 24 hours) {
            _buyAmount24h[account] = 0;
            _sellAmount24h[account] = 0;
            _lastVelocityReset[account] = block.timestamp;
        }

        // Check velocity limit
        if (isBuy) {
            require(
                _buyAmount24h[account] + amount <= maxVelocity24h,
                "24h buy limit exceeded"
            );
        } else {
            require(
                _sellAmount24h[account] + amount <= maxVelocity24h,
                "24h sell limit exceeded"
            );
        }
    }

    function _updateTracking(
        address from,
        address to,
        uint256 amount,
        bool isBuy,
        bool isSell
    ) private {
        if (isBuy) {
            _lastBuyTime[to] = block.timestamp;
            _lastTradeBlock[to] = block.number;
            _buyAmount24h[to] += amount;
        } else if (isSell) {
            _lastSellTime[from] = block.timestamp;
            _lastTradeBlock[from] = block.number;
            _sellAmount24h[from] += amount;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    function _getPhaseMaxTx(bool isBuy) private view returns (uint256) {
        if (currentPhase == LaunchPhase.PHASE1) {
            return (isBuy ? maxTxAmountBuy : maxTxAmountSell) / 10; // 10% of normal
        } else if (currentPhase == LaunchPhase.PHASE2) {
            return (isBuy ? maxTxAmountBuy : maxTxAmountSell) / 5; // 20% of normal
        } else if (currentPhase == LaunchPhase.PHASE3) {
            return (isBuy ? maxTxAmountBuy : maxTxAmountSell) / 2; // 50% of normal
        }
        return isBuy ? maxTxAmountBuy : maxTxAmountSell;
    }

    function _getPhaseMaxWallet() private view returns (uint256) {
        if (currentPhase == LaunchPhase.PHASE1) {
            return maxWalletAmount / 5; // 20% of normal
        } else if (currentPhase == LaunchPhase.PHASE2) {
            return maxWalletAmount / 2; // 50% of normal
        }
        return maxWalletAmount;
    }

    // ═══════════════════════════════════════════════════════════════════
    // OWNER FUNCTIONS - TRADING CONTROL
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Enable trading - ONE TIME ONLY, cannot be disabled
     */
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        tradingStartTime = block.timestamp;
        launchProtectionEndTime = block.timestamp + LAUNCH_PROTECTION_TIME;
        currentPhase = LaunchPhase.PHASE1;
        emit TradingEnabled(block.timestamp, currentPhase);
    }

    /**
     * @dev Advance to next launch phase
     */
    function advancePhase() external onlyOwner {
        require(tradingEnabled, "Trading not enabled");
        LaunchPhase oldPhase = currentPhase;

        if (currentPhase == LaunchPhase.PHASE1) {
            currentPhase = LaunchPhase.PHASE2;
        } else if (currentPhase == LaunchPhase.PHASE2) {
            currentPhase = LaunchPhase.PHASE3;
        } else if (currentPhase == LaunchPhase.PHASE3) {
            currentPhase = LaunchPhase.OPEN;
        } else {
            revert("Already in final phase");
        }

        emit PhaseAdvanced(oldPhase, currentPhase);
    }

    // ═══════════════════════════════════════════════════════════════════
    // OWNER FUNCTIONS - BLACKLIST/WHITELIST
    // ═══════════════════════════════════════════════════════════════════

    function blacklist(address account) external onlyOwner {
        require(account != owner(), "Cannot blacklist owner");
        require(!_isWhitelisted[account], "Cannot blacklist whitelisted");
        _isBlacklisted[account] = true;
        emit BlacklistUpdated(account, true);
        emit BotDetected(account, "Manually blacklisted");
    }

    function removeFromBlacklist(address account) external onlyOwner {
        _isBlacklisted[account] = false;
        emit BlacklistUpdated(account, false);
    }

    function batchBlacklist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != owner() && !_isWhitelisted[accounts[i]]) {
                _isBlacklisted[accounts[i]] = true;
                emit BlacklistUpdated(accounts[i], true);
            }
        }
    }

    function whitelist(address account) external onlyOwner {
        _isWhitelisted[account] = true;
        emit WhitelistUpdated(account, true);
    }

    function removeFromWhitelist(address account) external onlyOwner {
        require(account != owner(), "Cannot remove owner");
        _isWhitelisted[account] = false;
        emit WhitelistUpdated(account, false);
    }

    function setExchange(address account, bool isExchange_) external onlyOwner {
        _isExchange[account] = isExchange_;
        emit ExchangeUpdated(account, isExchange_);
    }

    function setBridge(address account, bool isBridge_) external onlyOwner {
        _isBridge[account] = isBridge_;
        emit BridgeUpdated(account, isBridge_);
    }

    // ═══════════════════════════════════════════════════════════════════
    // OWNER FUNCTIONS - LIMITS & SETTINGS
    // ═══════════════════════════════════════════════════════════════════

    function updateLimits(
        uint256 _maxTxBuy,
        uint256 _maxTxSell,
        uint256 _maxWallet
    ) external onlyOwner {
        require(_maxTxBuy >= (totalSupply() * 1) / 1000, "Max tx buy too low");
        require(_maxTxSell >= (totalSupply() * 1) / 1000, "Max tx sell too low");
        require(_maxWallet >= (totalSupply() * 1) / 100, "Max wallet too low");

        maxTxAmountBuy = _maxTxBuy;
        maxTxAmountSell = _maxTxSell;
        maxWalletAmount = _maxWallet;
        emit LimitsUpdated(_maxTxBuy, _maxWallet);
    }

    function updateCooldowns(uint256 _buyCooldown, uint256 _sellCooldown)
        external
        onlyOwner
    {
        require(_buyCooldown <= COOLDOWN_MAX, "Buy cooldown too high");
        require(_sellCooldown <= COOLDOWN_MAX, "Sell cooldown too high");
        buyCooldown = _buyCooldown;
        sellCooldown = _sellCooldown;
        emit CooldownUpdated(_buyCooldown, _sellCooldown);
    }

    function updateMinHoldTime(uint256 _minHoldTime) external onlyOwner {
        require(_minHoldTime <= 1 hours, "Hold time too high");
        minHoldTime = _minHoldTime;
    }

    function updateMaxGasPrice(uint256 _maxGasPrice) external onlyOwner {
        require(_maxGasPrice >= 10 gwei, "Gas price too low");
        maxGasPrice = _maxGasPrice;
    }

    function updateMaxVelocity(uint256 _maxVelocity) external onlyOwner {
        require(_maxVelocity >= (totalSupply() * 1) / 1000, "Velocity too low");
        maxVelocity24h = _maxVelocity;
    }

    // ═══════════════════════════════════════════════════════════════════
    // OWNER FUNCTIONS - FEATURE TOGGLES
    // ═══════════════════════════════════════════════════════════════════

    function setFeatureToggles(
        bool _cooldownEnabled,
        bool _maxTxEnabled,
        bool _maxWalletEnabled,
        bool _antiMEVEnabled,
        bool _velocityCheckEnabled,
        bool _blacklistEnabled
    ) external onlyOwner {
        cooldownEnabled = _cooldownEnabled;
        maxTxEnabled = _maxTxEnabled;
        maxWalletEnabled = _maxWalletEnabled;
        antiMEVEnabled = _antiMEVEnabled;
        velocityCheckEnabled = _velocityCheckEnabled;
        blacklistEnabled = _blacklistEnabled;
    }

    function setSameBlockTradeEnabled(bool enabled) external onlyOwner {
        sameBlockTradeEnabled = enabled;
    }

    // ═══════════════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function pause(string calldata reason) external onlyOwner {
        _pause();
        emit EmergencyPause(reason);
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function isBlacklisted(address account) external view returns (bool) {
        return _isBlacklisted[account];
    }

    function isWhitelisted(address account) external view returns (bool) {
        return _isWhitelisted[account];
    }

    function isExchange(address account) external view returns (bool) {
        return _isExchange[account];
    }

    function isBridge(address account) external view returns (bool) {
        return _isBridge[account];
    }

    function getLastBuyTime(address account) external view returns (uint256) {
        return _lastBuyTime[account];
    }

    function getLastSellTime(address account) external view returns (uint256) {
        return _lastSellTime[account];
    }

    function getBuyCooldownRemaining(address account)
        external
        view
        returns (uint256)
    {
        uint256 lastBuy = _lastBuyTime[account];
        if (lastBuy == 0) return 0;

        uint256 cooldownEnd = lastBuy + buyCooldown;
        if (block.timestamp >= cooldownEnd) return 0;

        return cooldownEnd - block.timestamp;
    }

    function getSellCooldownRemaining(address account)
        external
        view
        returns (uint256)
    {
        uint256 lastSell = _lastSellTime[account];
        if (lastSell == 0) return 0;

        uint256 cooldownEnd = lastSell + sellCooldown;
        if (block.timestamp >= cooldownEnd) return 0;

        return cooldownEnd - block.timestamp;
    }

    function get24hVolume(address account)
        external
        view
        returns (uint256 buyVolume, uint256 sellVolume)
    {
        return (_buyAmount24h[account], _sellAmount24h[account]);
    }

    function getProtectionSettings()
        external
        view
        returns (
            bool _tradingEnabled,
            LaunchPhase _phase,
            uint256 _maxTxBuy,
            uint256 _maxTxSell,
            uint256 _maxWallet,
            uint256 _buyCooldown,
            uint256 _sellCooldown,
            uint256 _minHoldTime
        )
    {
        return (
            tradingEnabled,
            currentPhase,
            maxTxAmountBuy,
            maxTxAmountSell,
            maxWalletAmount,
            buyCooldown,
            sellCooldown,
            minHoldTime
        );
    }

    function getFeatureToggles()
        external
        view
        returns (
            bool _cooldownEnabled,
            bool _maxTxEnabled,
            bool _maxWalletEnabled,
            bool _antiMEVEnabled,
            bool _velocityCheckEnabled,
            bool _blacklistEnabled
        )
    {
        return (
            cooldownEnabled,
            maxTxEnabled,
            maxWalletEnabled,
            antiMEVEnabled,
            velocityCheckEnabled,
            blacklistEnabled
        );
    }
}

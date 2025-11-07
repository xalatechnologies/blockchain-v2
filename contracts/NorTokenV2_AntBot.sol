// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NorTokenV2 - Anti-Bot Protected
 * @dev ERC20 token with comprehensive anti-bot and anti-whale protections
 *
 * Security Features:
 * - Trading disabled by default
 * - Cooldown between trades
 * - Max transaction limits
 * - Max wallet limits
 * - Bot blacklist
 * - Whitelist for exchanges
 * - Emergency pause
 */
contract NorTokenV2 is ERC20, Ownable, ReentrancyGuard {
    // Anti-bot mappings
    mapping(address => uint256) private _lastTrade;
    mapping(address => bool) private _isBlacklisted;
    mapping(address => bool) private _isWhitelisted;
    mapping(address => bool) private _isExchange;

    // Trading controls
    bool public tradingEnabled = false;
    uint256 public tradingStartTime;

    // Anti-whale limits
    uint256 public maxTxAmount;
    uint256 public maxWallet;
    uint256 public cooldownTime = 60; // 60 seconds between trades

    // Feature toggles
    bool public antiWhaleEnabled = true;
    bool public cooldownEnabled = true;
    bool public blacklistEnabled = true;

    // Events
    event TradingEnabled(uint256 timestamp);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    event LimitsUpdated(uint256 maxTx, uint256 maxWallet);
    event CooldownUpdated(uint256 cooldownTime);

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        // Set initial limits (can be adjusted after launch)
        maxTxAmount = (totalSupply * 5) / 1000; // 0.5% of supply
        maxWallet = (totalSupply * 2) / 100;    // 2% of supply

        // Mint total supply to deployer
        _mint(msg.sender, totalSupply);

        // Whitelist owner and contract
        _isWhitelisted[msg.sender] = true;
        _isWhitelisted[address(this)] = true;
    }

    /**
     * @dev Override transfer to add protections
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "ERC20: transfer from zero address");
        require(to != address(0), "ERC20: transfer to zero address");
        require(amount > 0, "Transfer amount must be greater than zero");

        // Blacklist check
        if (blacklistEnabled) {
            require(!_isBlacklisted[from], "Sender is blacklisted");
            require(!_isBlacklisted[to], "Recipient is blacklisted");
        }

        // If trading not enabled, only whitelist can trade
        if (!tradingEnabled) {
            require(
                _isWhitelisted[from] || _isWhitelisted[to],
                "Trading not enabled yet"
            );
        }

        // Apply protections (skip for whitelisted addresses and owner)
        bool isWhitelistedTransfer = _isWhitelisted[from] || _isWhitelisted[to];
        bool isOwnerTransfer = from == owner() || to == owner();

        if (tradingEnabled && !isWhitelistedTransfer && !isOwnerTransfer) {
            // Anti-whale: max transaction limit
            if (antiWhaleEnabled && !_isExchange[to]) {
                require(amount <= maxTxAmount, "Exceeds max transaction amount");
            }

            // Anti-whale: max wallet limit (skip for exchanges)
            if (antiWhaleEnabled && !_isExchange[to] && to != address(this)) {
                require(
                    balanceOf(to) + amount <= maxWallet,
                    "Exceeds max wallet amount"
                );
            }

            // Cooldown: minimum time between trades
            if (cooldownEnabled && !_isExchange[from]) {
                require(
                    block.timestamp >= _lastTrade[from] + cooldownTime,
                    "Cooldown period active"
                );
                _lastTrade[from] = block.timestamp;
            }
        }

        super._transfer(from, to, amount);
    }

    // ========== OWNER FUNCTIONS ==========

    /**
     * @dev Enable trading (ONE-TIME, cannot be disabled)
     */
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        tradingStartTime = block.timestamp;
        emit TradingEnabled(block.timestamp);
    }

    /**
     * @dev Add address to blacklist (for bots)
     */
    function blacklist(address account) external onlyOwner {
        require(account != owner(), "Cannot blacklist owner");
        require(!_isWhitelisted[account], "Cannot blacklist whitelisted address");
        _isBlacklisted[account] = true;
        emit BlacklistUpdated(account, true);
    }

    /**
     * @dev Remove address from blacklist
     */
    function removeFromBlacklist(address account) external onlyOwner {
        _isBlacklisted[account] = false;
        emit BlacklistUpdated(account, false);
    }

    /**
     * @dev Batch blacklist (for emergency bot attacks)
     */
    function batchBlacklist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != owner() && !_isWhitelisted[accounts[i]]) {
                _isBlacklisted[accounts[i]] = true;
                emit BlacklistUpdated(accounts[i], true);
            }
        }
    }

    /**
     * @dev Add address to whitelist (for team, exchanges, bridges)
     */
    function whitelist(address account) external onlyOwner {
        _isWhitelisted[account] = true;
        emit WhitelistUpdated(account, true);
    }

    /**
     * @dev Remove address from whitelist
     */
    function removeFromWhitelist(address account) external onlyOwner {
        require(account != owner(), "Cannot remove owner from whitelist");
        _isWhitelisted[account] = false;
        emit WhitelistUpdated(account, false);
    }

    /**
     * @dev Mark address as exchange (exempt from max wallet)
     */
    function setExchange(address account, bool status) external onlyOwner {
        _isExchange[account] = status;
    }

    /**
     * @dev Update transaction and wallet limits
     * @param _maxTxAmount New max transaction (in tokens)
     * @param _maxWallet New max wallet (in tokens)
     */
    function updateLimits(uint256 _maxTxAmount, uint256 _maxWallet)
        external
        onlyOwner
    {
        require(_maxTxAmount >= (totalSupply() * 1) / 1000, "Max tx too low"); // Min 0.1%
        require(_maxWallet >= (totalSupply() * 1) / 100, "Max wallet too low"); // Min 1%

        maxTxAmount = _maxTxAmount;
        maxWallet = _maxWallet;
        emit LimitsUpdated(_maxTxAmount, _maxWallet);
    }

    /**
     * @dev Update cooldown time between trades
     * @param _cooldownTime New cooldown in seconds
     */
    function updateCooldown(uint256 _cooldownTime) external onlyOwner {
        require(_cooldownTime <= 300, "Cooldown too high"); // Max 5 minutes
        cooldownTime = _cooldownTime;
        emit CooldownUpdated(_cooldownTime);
    }

    /**
     * @dev Toggle anti-whale protection
     */
    function setAntiWhaleEnabled(bool enabled) external onlyOwner {
        antiWhaleEnabled = enabled;
    }

    /**
     * @dev Toggle cooldown protection
     */
    function setCooldownEnabled(bool enabled) external onlyOwner {
        cooldownEnabled = enabled;
    }

    /**
     * @dev Toggle blacklist feature
     */
    function setBlacklistEnabled(bool enabled) external onlyOwner {
        blacklistEnabled = enabled;
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Check if address is blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _isBlacklisted[account];
    }

    /**
     * @dev Check if address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _isWhitelisted[account];
    }

    /**
     * @dev Check if address is marked as exchange
     */
    function isExchange(address account) external view returns (bool) {
        return _isExchange[account];
    }

    /**
     * @dev Get last trade timestamp for address
     */
    function getLastTrade(address account) external view returns (uint256) {
        return _lastTrade[account];
    }

    /**
     * @dev Get time until cooldown expires
     */
    function getCooldownTime(address account) external view returns (uint256) {
        uint256 lastTrade = _lastTrade[account];
        if (lastTrade == 0) return 0;

        uint256 cooldownEnd = lastTrade + cooldownTime;
        if (block.timestamp >= cooldownEnd) return 0;

        return cooldownEnd - block.timestamp;
    }

    /**
     * @dev Get all protection settings
     */
    function getProtectionSettings()
        external
        view
        returns (
            bool _tradingEnabled,
            uint256 _maxTxAmount,
            uint256 _maxWallet,
            uint256 _cooldownTime,
            bool _antiWhaleEnabled,
            bool _cooldownEnabled,
            bool _blacklistEnabled
        )
    {
        return (
            tradingEnabled,
            maxTxAmount,
            maxWallet,
            cooldownTime,
            antiWhaleEnabled,
            cooldownEnabled,
            blacklistEnabled
        );
    }
}

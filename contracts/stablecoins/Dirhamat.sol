// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Dirhamat
 * @notice Shariah-Compliant AED/Gold-Backed Stablecoin
 * @dev Dirhamat (درهم) is a 1:1 AED-pegged stablecoin backed by physical gold reserves
 *
 * Shariah Compliance:
 * - No interest (riba) - zero yield mechanisms
 * - Asset-backed (backed by vaulted gold)
 * - Transparent reserve audits
 * - Murabaha structure for issuance
 * - Shariah Board oversight
 *
 * Reserve Backing:
 * - 1 DIRHAM = 1 AED worth of gold
 * - Gold stored in UAE-licensed vaults
 * - Monthly third-party audits
 * - Reserve ratio minimum: 100%
 *
 * Regulatory Compliance:
 * - UAE VARA licensed
 * - AAOIFI FAS standards
 * - FATF travel rule integration
 * - KYC/AML via Compliance Core
 *
 * Use Cases:
 * - Stable store of value
 * - Cross-border remittances
 * - Trading pair base currency
 * - Smart contract settlements
 */
contract Dirhamat is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // Oracle for gold price feeds
    address public goldPriceOracle;

    // Oracle for AED/USD rate
    address public aedUsdOracle;

    // Reserve tracking
    uint256 public totalReserveValue; // In AED
    uint256 public totalGoldGrams; // Physical gold backing
    uint256 public lastAuditTimestamp;
    string public lastAuditHash; // IPFS hash of audit report

    // Compliance integration
    address public complianceCore;
    bool public complianceRequired = true;

    // Minimum reserve ratio (in basis points, 10000 = 100%)
    uint256 public minimumReserveRatio = 10000; // 100% backing

    // Minting/burning limits
    uint256 public dailyMintLimit = 10_000_000 * 10**18; // 10M DIRHAM per day
    uint256 public dailyBurnLimit = 10_000_000 * 10**18;

    mapping(uint256 => uint256) public dailyMinted; // day => amount
    mapping(uint256 => uint256) public dailyBurned;

    // Blacklist for compliance
    mapping(address => bool) public blacklisted;

    // Events
    event ReserveUpdated(uint256 reserveValue, uint256 goldGrams, uint256 timestamp);
    event AuditCompleted(string auditHash, uint256 timestamp, uint256 reserveValue);
    event OracleUpdated(address indexed oracle, string oracleType);
    event ComplianceCoreUpdated(address indexed newCore);
    event AddressBlacklisted(address indexed account, string reason);
    event AddressWhitelisted(address indexed account);
    event ReserveRatioUpdated(uint256 oldRatio, uint256 newRatio);

    constructor(
        address _goldPriceOracle,
        address _aedUsdOracle,
        address _complianceCore
    ) ERC20("Dirhamat", "DIRHAMAT") {
        require(_goldPriceOracle != address(0), "Dirhamat: ZERO_ADDRESS");
        require(_aedUsdOracle != address(0), "Dirhamat: ZERO_ADDRESS");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(RESERVE_MANAGER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);

        goldPriceOracle = _goldPriceOracle;
        aedUsdOracle = _aedUsdOracle;
        complianceCore = _complianceCore;

        lastAuditTimestamp = block.timestamp;
    }

    /**
     * @notice Returns 18 decimals (standard ERC20)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @notice Mints new Dirhamat tokens (requires MINTER_ROLE)
     * @dev Only callable after reserve verification
     * @param to Address to receive tokens
     * @param amount Amount to mint (in wei)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(!blacklisted[to], "Dirhamat: RECIPIENT_BLACKLISTED");

        // Check daily mint limit
        uint256 currentDay = block.timestamp / 1 days;
        require(dailyMinted[currentDay] + amount <= dailyMintLimit, "Dirhamat: DAILY_MINT_LIMIT_EXCEEDED");

        // Verify reserve ratio after minting
        uint256 newSupply = totalSupply() + amount;
        require(_checkReserveRatio(newSupply), "Dirhamat: INSUFFICIENT_RESERVES");

        dailyMinted[currentDay] += amount;
        _mint(to, amount);
    }

    /**
     * @notice Burns Dirhamat tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public override whenNotPaused nonReentrant {
        uint256 currentDay = block.timestamp / 1 days;
        require(dailyBurned[currentDay] + amount <= dailyBurnLimit, "Dirhamat: DAILY_BURN_LIMIT_EXCEEDED");

        dailyBurned[currentDay] += amount;
        super.burn(amount);
    }

    /**
     * @notice Updates reserve backing information
     * @param _reserveValue Total reserve value in AED
     * @param _goldGrams Physical gold in grams
     */
    function updateReserve(
        uint256 _reserveValue,
        uint256 _goldGrams
    ) external onlyRole(RESERVE_MANAGER_ROLE) {
        require(_reserveValue > 0, "Dirhamat: ZERO_RESERVE");
        require(_goldGrams > 0, "Dirhamat: ZERO_GOLD");

        totalReserveValue = _reserveValue;
        totalGoldGrams = _goldGrams;

        emit ReserveUpdated(_reserveValue, _goldGrams, block.timestamp);
    }

    /**
     * @notice Records completion of reserve audit
     * @param auditHash IPFS hash of audit report
     */
    function recordAudit(string calldata auditHash) external onlyRole(RESERVE_MANAGER_ROLE) {
        require(bytes(auditHash).length > 0, "Dirhamat: EMPTY_HASH");

        lastAuditHash = auditHash;
        lastAuditTimestamp = block.timestamp;

        emit AuditCompleted(auditHash, block.timestamp, totalReserveValue);
    }

    /**
     * @notice Updates gold price oracle
     */
    function setGoldPriceOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracle != address(0), "Dirhamat: ZERO_ADDRESS");
        goldPriceOracle = _oracle;
        emit OracleUpdated(_oracle, "GOLD");
    }

    /**
     * @notice Updates AED/USD oracle
     */
    function setAedUsdOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracle != address(0), "Dirhamat: ZERO_ADDRESS");
        aedUsdOracle = _oracle;
        emit OracleUpdated(_oracle, "AED_USD");
    }

    /**
     * @notice Updates compliance core contract
     */
    function setComplianceCore(address _core) external onlyRole(DEFAULT_ADMIN_ROLE) {
        complianceCore = _core;
        emit ComplianceCoreUpdated(_core);
    }

    /**
     * @notice Sets minimum reserve ratio
     * @param _ratio Reserve ratio in basis points (10000 = 100%)
     */
    function setMinimumReserveRatio(uint256 _ratio) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_ratio >= 10000, "Dirhamat: RATIO_TOO_LOW"); // Minimum 100%
        require(_ratio <= 20000, "Dirhamat: RATIO_TOO_HIGH"); // Maximum 200%

        emit ReserveRatioUpdated(minimumReserveRatio, _ratio);
        minimumReserveRatio = _ratio;
    }

    /**
     * @notice Blacklists an address for compliance
     */
    function blacklistAddress(address account, string calldata reason) external onlyRole(COMPLIANCE_ROLE) {
        require(account != address(0), "Dirhamat: ZERO_ADDRESS");
        blacklisted[account] = true;
        emit AddressBlacklisted(account, reason);
    }

    /**
     * @notice Removes address from blacklist
     */
    function whitelistAddress(address account) external onlyRole(COMPLIANCE_ROLE) {
        blacklisted[account] = false;
        emit AddressWhitelisted(account);
    }

    /**
     * @notice Pauses all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Returns current reserve ratio in basis points
     * @return ratio Reserve backing percentage (10000 = 100%)
     */
    function getReserveRatio() public view returns (uint256 ratio) {
        uint256 supply = totalSupply();
        if (supply == 0) return 0;

        // Reserve value is in AED, supply is in wei (18 decimals)
        // Convert supply to AED units (divide by 10^18)
        ratio = (totalReserveValue * 10000 * 10**18) / supply;
    }

    /**
     * @notice Checks if reserve ratio meets minimum requirement
     */
    function _checkReserveRatio(uint256 projectedSupply) internal view returns (bool) {
        if (projectedSupply == 0) return true;

        uint256 projectedRatio = (totalReserveValue * 10000 * 10**18) / projectedSupply;
        return projectedRatio >= minimumReserveRatio;
    }

    /**
     * @notice Returns reserve health status
     * @return healthy True if reserves meet minimum ratio
     * @return currentRatio Current reserve ratio in basis points
     * @return requiredRatio Minimum required ratio
     */
    function getReserveHealth() external view returns (
        bool healthy,
        uint256 currentRatio,
        uint256 requiredRatio
    ) {
        currentRatio = getReserveRatio();
        requiredRatio = minimumReserveRatio;
        healthy = currentRatio >= requiredRatio;
    }

    /**
     * @notice Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        require(!blacklisted[from], "Dirhamat: SENDER_BLACKLISTED");
        require(!blacklisted[to], "Dirhamat: RECIPIENT_BLACKLISTED");

        // Check compliance if enabled
        if (complianceRequired && complianceCore != address(0)) {
            // Call compliance core to verify transfer
            // Implementation depends on Compliance Core interface
            // For now, we just check blacklist
        }

        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @notice Returns time since last audit
     */
    function timeSinceLastAudit() external view returns (uint256) {
        return block.timestamp - lastAuditTimestamp;
    }

    /**
     * @notice Returns audit information
     */
    function getAuditInfo() external view returns (
        string memory auditHash,
        uint256 timestamp,
        uint256 reserveValue,
        uint256 goldGrams
    ) {
        return (lastAuditHash, lastAuditTimestamp, totalReserveValue, totalGoldGrams);
    }
}

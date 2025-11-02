// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DigitalKES
 * @notice Digital Kenyan Shilling Stablecoin
 * @dev 1:1 KES-pegged digital currency for East African markets
 *
 * Regulatory Alignment:
 * - CBK (Central Bank of Kenya) sandbox participant
 * - CMA (Capital Markets Authority) oversight
 * - FATF travel rule compliance
 * - KYC/AML integration
 *
 * Reserve Backing:
 * - 1 DKES = 1 KES
 * - Fiat reserves in Kenyan banks
 * - Commercial paper backing
 * - Monthly audits
 *
 * Use Cases:
 * - Cross-border remittances (reducing fees from 7% to <1%)
 * - M-Pesa integration
 * - Merchant payments
 * - Microfinance settlements
 * - Agricultural supply chain payments
 *
 * Target Markets:
 * - Kenya
 * - Uganda
 * - Tanzania
 * - Rwanda
 * - Ethiopia (future)
 */
contract DigitalKES is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE"); // Licensed banks can mint

    // Oracle for KES/USD rate
    address public kesUsdOracle;

    // Reserve tracking
    uint256 public totalReserveValue; // In KES
    uint256 public lastAuditTimestamp;
    string public lastAuditHash; // IPFS hash of audit report

    // Compliance integration
    address public complianceCore;
    bool public complianceRequired = true;

    // Minimum reserve ratio (in basis points, 10000 = 100%)
    uint256 public minimumReserveRatio = 10000; // 100% backing

    // Minting/burning limits per bank
    mapping(address => uint256) public bankDailyMintLimit;
    mapping(address => uint256) public bankDailyBurnLimit;
    mapping(address => mapping(uint256 => uint256)) public bankDailyMinted; // bank => day => amount
    mapping(address => mapping(uint256 => uint256)) public bankDailyBurned;

    // Licensed banks
    address[] public licensedBanks;
    mapping(address => bool) public isBankLicensed;
    mapping(address => string) public bankNames;

    // M-Pesa integration tracking
    mapping(bytes32 => bool) public processedMpesaTransactions;

    // Blacklist for compliance
    mapping(address => bool) public blacklisted;

    // Transaction limits for retail users
    uint256 public maxTransactionAmount = 1_000_000 * 10**18; // 1M KES per transaction
    uint256 public dailyTransactionLimit = 5_000_000 * 10**18; // 5M KES per day per user
    mapping(address => mapping(uint256 => uint256)) public userDailyVolume;

    // Events
    event ReserveUpdated(uint256 reserveValue, uint256 timestamp);
    event AuditCompleted(string auditHash, uint256 timestamp, uint256 reserveValue);
    event OracleUpdated(address indexed oracle);
    event BankLicensed(address indexed bank, string name, uint256 dailyMintLimit, uint256 dailyBurnLimit);
    event BankRevoked(address indexed bank, string reason);
    event MpesaTransactionProcessed(bytes32 indexed txHash, address indexed recipient, uint256 amount);
    event ComplianceCoreUpdated(address indexed newCore);
    event AddressBlacklisted(address indexed account, string reason);
    event AddressWhitelisted(address indexed account);
    event TransactionLimitUpdated(uint256 maxPerTransaction, uint256 dailyLimit);

    constructor(
        address _kesUsdOracle,
        address _complianceCore
    ) ERC20("Digital Kenyan Shilling", "DKES") {
        require(_kesUsdOracle != address(0), "DigitalKES: ZERO_ADDRESS");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(RESERVE_MANAGER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);

        kesUsdOracle = _kesUsdOracle;
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
     * @notice Licenses a bank to mint/burn DKES
     * @param bank Bank address
     * @param name Bank name
     * @param dailyMintLimit Daily minting limit for this bank
     * @param dailyBurnLimit Daily burning limit for this bank
     */
    function licenseBank(
        address bank,
        string calldata name,
        uint256 dailyMintLimit,
        uint256 dailyBurnLimit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bank != address(0), "DigitalKES: ZERO_ADDRESS");
        require(!isBankLicensed[bank], "DigitalKES: ALREADY_LICENSED");

        _grantRole(BANK_ROLE, bank);
        _grantRole(MINTER_ROLE, bank);

        isBankLicensed[bank] = true;
        bankNames[bank] = name;
        bankDailyMintLimit[bank] = dailyMintLimit;
        bankDailyBurnLimit[bank] = dailyBurnLimit;
        licensedBanks.push(bank);

        emit BankLicensed(bank, name, dailyMintLimit, dailyBurnLimit);
    }

    /**
     * @notice Revokes a bank's license
     * @param bank Bank address to revoke
     * @param reason Reason for revocation
     */
    function revokeBank(address bank, string calldata reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isBankLicensed[bank], "DigitalKES: NOT_LICENSED");

        _revokeRole(BANK_ROLE, bank);
        _revokeRole(MINTER_ROLE, bank);

        isBankLicensed[bank] = false;

        emit BankRevoked(bank, reason);
    }

    /**
     * @notice Mints new DKES tokens (requires BANK_ROLE)
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(BANK_ROLE) whenNotPaused nonReentrant {
        require(!blacklisted[to], "DigitalKES: RECIPIENT_BLACKLISTED");
        require(isBankLicensed[msg.sender], "DigitalKES: BANK_NOT_LICENSED");

        // Check daily mint limit for this bank
        uint256 currentDay = block.timestamp / 1 days;
        require(
            bankDailyMinted[msg.sender][currentDay] + amount <= bankDailyMintLimit[msg.sender],
            "DigitalKES: BANK_DAILY_MINT_LIMIT_EXCEEDED"
        );

        // Verify reserve ratio after minting
        uint256 newSupply = totalSupply() + amount;
        require(_checkReserveRatio(newSupply), "DigitalKES: INSUFFICIENT_RESERVES");

        bankDailyMinted[msg.sender][currentDay] += amount;
        _mint(to, amount);
    }

    /**
     * @notice Mints DKES from M-Pesa transaction
     * @param recipient Recipient address
     * @param amount Amount to mint
     * @param mpesaTxHash M-Pesa transaction hash
     */
    function mintFromMpesa(
        address recipient,
        uint256 amount,
        bytes32 mpesaTxHash
    ) external onlyRole(BANK_ROLE) whenNotPaused nonReentrant {
        require(!blacklisted[recipient], "DigitalKES: RECIPIENT_BLACKLISTED");
        require(!processedMpesaTransactions[mpesaTxHash], "DigitalKES: MPESA_TX_ALREADY_PROCESSED");

        // Check bank limits
        uint256 currentDay = block.timestamp / 1 days;
        require(
            bankDailyMinted[msg.sender][currentDay] + amount <= bankDailyMintLimit[msg.sender],
            "DigitalKES: BANK_DAILY_MINT_LIMIT_EXCEEDED"
        );

        processedMpesaTransactions[mpesaTxHash] = true;
        bankDailyMinted[msg.sender][currentDay] += amount;

        _mint(recipient, amount);

        emit MpesaTransactionProcessed(mpesaTxHash, recipient, amount);
    }

    /**
     * @notice Burns DKES tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public override whenNotPaused nonReentrant {
        if (hasRole(BANK_ROLE, msg.sender)) {
            // Bank burning
            uint256 currentDay = block.timestamp / 1 days;
            require(
                bankDailyBurned[msg.sender][currentDay] + amount <= bankDailyBurnLimit[msg.sender],
                "DigitalKES: BANK_DAILY_BURN_LIMIT_EXCEEDED"
            );
            bankDailyBurned[msg.sender][currentDay] += amount;
        }

        super.burn(amount);
    }

    /**
     * @notice Updates reserve backing information
     * @param _reserveValue Total reserve value in KES
     */
    function updateReserve(uint256 _reserveValue) external onlyRole(RESERVE_MANAGER_ROLE) {
        require(_reserveValue > 0, "DigitalKES: ZERO_RESERVE");
        totalReserveValue = _reserveValue;
        emit ReserveUpdated(_reserveValue, block.timestamp);
    }

    /**
     * @notice Records completion of reserve audit
     * @param auditHash IPFS hash of audit report
     */
    function recordAudit(string calldata auditHash) external onlyRole(RESERVE_MANAGER_ROLE) {
        require(bytes(auditHash).length > 0, "DigitalKES: EMPTY_HASH");

        lastAuditHash = auditHash;
        lastAuditTimestamp = block.timestamp;

        emit AuditCompleted(auditHash, block.timestamp, totalReserveValue);
    }

    /**
     * @notice Updates KES/USD oracle
     */
    function setKesUsdOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracle != address(0), "DigitalKES: ZERO_ADDRESS");
        kesUsdOracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    /**
     * @notice Updates transaction limits
     */
    function setTransactionLimits(
        uint256 _maxPerTransaction,
        uint256 _dailyLimit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxTransactionAmount = _maxPerTransaction;
        dailyTransactionLimit = _dailyLimit;
        emit TransactionLimitUpdated(_maxPerTransaction, _dailyLimit);
    }

    /**
     * @notice Blacklists an address for compliance
     */
    function blacklistAddress(address account, string calldata reason) external onlyRole(COMPLIANCE_ROLE) {
        require(account != address(0), "DigitalKES: ZERO_ADDRESS");
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
     */
    function getReserveRatio() public view returns (uint256 ratio) {
        uint256 supply = totalSupply();
        if (supply == 0) return 0;

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
     * @notice Returns list of licensed banks
     */
    function getLicensedBanks() external view returns (address[] memory) {
        return licensedBanks;
    }

    /**
     * @notice Returns bank information
     */
    function getBankInfo(address bank) external view returns (
        bool licensed,
        string memory name,
        uint256 dailyMintLimit,
        uint256 dailyBurnLimit,
        uint256 todayMinted,
        uint256 todayBurned
    ) {
        uint256 currentDay = block.timestamp / 1 days;

        return (
            isBankLicensed[bank],
            bankNames[bank],
            bankDailyMintLimit[bank],
            bankDailyBurnLimit[bank],
            bankDailyMinted[bank][currentDay],
            bankDailyBurned[bank][currentDay]
        );
    }

    /**
     * @notice Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        require(!blacklisted[from], "DigitalKES: SENDER_BLACKLISTED");
        require(!blacklisted[to], "DigitalKES: RECIPIENT_BLACKLISTED");

        // Enforce transaction limits for retail users (not banks)
        if (!hasRole(BANK_ROLE, from) && from != address(0)) {
            require(amount <= maxTransactionAmount, "DigitalKES: EXCEEDS_MAX_TRANSACTION");

            uint256 currentDay = block.timestamp / 1 days;
            userDailyVolume[from][currentDay] += amount;
            require(
                userDailyVolume[from][currentDay] <= dailyTransactionLimit,
                "DigitalKES: EXCEEDS_DAILY_LIMIT"
            );
        }

        super._beforeTokenTransfer(from, to, amount);
    }
}

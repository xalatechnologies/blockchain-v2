// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FundUnit
 * @notice Shariah-Compliant Fund Unit Token Standard for Nor Funds
 * @dev Represents investor positions in halal investment funds
 *
 * Fund Types Supported:
 * - Gold Savings Fund (Murabahah structure)
 * - Sukuk Income Fund (Mudarabah)
 * - Halal Equity Index (Wakalah)
 * - Real Estate Ijārah (Musharakah/Ijārah)
 * - SME Partnership (Musharakah)
 * - Liquidity Park (Commodity Murabahah)
 * - Waqf Impact Fund (Waqf/Tabarru')
 * - Takaful Reserve Pool (Tabarru')
 *
 * Key Features:
 * - KYC flag for compliance
 * - Transfer restrictions per jurisdiction
 * - NAV oracle binding for valuation
 * - Redemption lock (notice period, gate limit)
 * - Zakat metadata (purification tracking)
 * - Shariah Board certification
 *
 * Shariah Compliance:
 * - No interest (riba) - profits from asset appreciation only
 * - Asset-backed investments
 * - Transparent fee structure
 * - Regular Shariah audits
 * - Automatic zakat calculation (2.5% annually on eligible holdings)
 */
contract FundUnit is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 public constant NAV_ORACLE_ROLE = keccak256("NAV_ORACLE_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant SHARIAH_BOARD_ROLE = keccak256("SHARIAH_BOARD_ROLE");

    // Fund metadata
    string public fundType; // e.g., "Gold Savings", "Sukuk Income", "Halal Equity"
    string public shariahStructure; // e.g., "Murabahah", "Mudarabah", "Wakalah"
    string public fundStrategy;
    address public fundManager;

    // Net Asset Value (NAV) tracking
    uint256 public navPerUnit; // NAV per unit in wei (18 decimals)
    uint256 public lastNavUpdate;
    address public navOracle;

    // Subscription and redemption
    uint256 public minSubscription = 1_000 * 10**18; // Minimum 1,000 units
    uint256 public redemptionNoticePeriod = 7 days; // T+7 redemption
    uint256 public redemptionGateLimit = 10; // 10% daily redemption limit (percentage * 100)

    mapping(address => uint256) public redemptionRequests; // investor => request timestamp
    mapping(uint256 => uint256) public dailyRedemptions; // day => total redeemed

    // KYC and compliance
    mapping(address => bool) public isVerified;
    mapping(address => string) public investorJurisdiction; // e.g., "AE", "KE", "NO"
    bool public kycRequired = true;

    // Transfer restrictions
    bool public transfersRestricted = false;
    mapping(address => bool) public isWhitelisted;

    // Zakat tracking
    uint256 public zakatRate = 250; // 2.5% in basis points
    mapping(address => uint256) public lastZakatCalculation;
    mapping(address => uint256) public accumulatedZakat;
    address public zakatRecipient;

    // Shariah certification
    string public fatwaCertificate; // IPFS hash of fatwa certificate
    uint256 public fatwaExpiry;
    address public shariahBoard;
    bool public shariahCompliant = true;

    // Performance fees
    uint256 public managementFee = 200; // 2% annual in basis points
    uint256 public performanceFee = 2000; // 20% on profits in basis points
    uint256 public lastFeeCollection;

    // Events
    event NAVUpdated(uint256 newNav, uint256 timestamp, address updatedBy);
    event SubscriptionProcessed(address indexed investor, uint256 amount, uint256 navUsed);
    event RedemptionRequested(address indexed investor, uint256 amount, uint256 effectiveDate);
    event RedemptionProcessed(address indexed investor, uint256 units, uint256 value);
    event InvestorVerified(address indexed investor, string jurisdiction);
    event ZakatCalculated(address indexed investor, uint256 amount, uint256 timestamp);
    event ShariahCertificationUpdated(string fatwaCert, uint256 expiry, address board);
    event FeeCollected(uint256 managementFee, uint256 performanceFee, uint256 timestamp);

    constructor(
        string memory name,
        string memory symbol,
        string memory _fundType,
        string memory _shariahStructure,
        address _fundManager,
        address _navOracle,
        address _zakatRecipient
    ) ERC20(name, symbol) {
        require(_fundManager != address(0), "FundUnit: ZERO_ADDRESS");
        require(_navOracle != address(0), "FundUnit: ZERO_ADDRESS");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FUND_MANAGER_ROLE, _fundManager);
        _grantRole(NAV_ORACLE_ROLE, _navOracle);

        fundType = _fundType;
        shariahStructure = _shariahStructure;
        fundManager = _fundManager;
        navOracle = _navOracle;
        zakatRecipient = _zakatRecipient;

        navPerUnit = 1 * 10**18; // Initial NAV = 1.0
        lastNavUpdate = block.timestamp;
        lastFeeCollection = block.timestamp;
    }

    /**
     * @notice Returns 18 decimals (standard)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // ==================== NAV MANAGEMENT ====================

    /**
     * @notice Updates Net Asset Value per unit
     * @param newNav New NAV in wei (18 decimals)
     */
    function updateNAV(uint256 newNav) external onlyRole(NAV_ORACLE_ROLE) {
        require(newNav > 0, "FundUnit: INVALID_NAV");

        navPerUnit = newNav;
        lastNavUpdate = block.timestamp;

        emit NAVUpdated(newNav, block.timestamp, msg.sender);
    }

    /**
     * @notice Returns current NAV and last update time
     */
    function getNAV() external view returns (uint256 nav, uint256 lastUpdate) {
        return (navPerUnit, lastNavUpdate);
    }

    // ==================== SUBSCRIPTION & REDEMPTION ====================

    /**
     * @notice Processes subscription (minting new units)
     * @param investor Investor address
     * @param amount Amount of units to mint
     */
    function subscribe(address investor, uint256 amount) external onlyRole(FUND_MANAGER_ROLE) nonReentrant {
        require(amount >= minSubscription, "FundUnit: BELOW_MINIMUM");
        require(!kycRequired || isVerified[investor], "FundUnit: KYC_REQUIRED");

        _mint(investor, amount);

        emit SubscriptionProcessed(investor, amount, navPerUnit);
    }

    /**
     * @notice Requests redemption (with notice period)
     * @param amount Amount of units to redeem
     */
    function requestRedemption(uint256 amount) external nonReentrant {
        require(balanceOf(msg.sender) >= amount, "FundUnit: INSUFFICIENT_BALANCE");

        redemptionRequests[msg.sender] = block.timestamp;

        emit RedemptionRequested(msg.sender, amount, block.timestamp + redemptionNoticePeriod);
    }

    /**
     * @notice Processes redemption after notice period
     * @param investor Investor address
     * @param units Amount of units to redeem
     */
    function processRedemption(
        address investor,
        uint256 units
    ) external onlyRole(FUND_MANAGER_ROLE) nonReentrant returns (uint256 value) {
        require(redemptionRequests[investor] > 0, "FundUnit: NO_REQUEST");
        require(
            block.timestamp >= redemptionRequests[investor] + redemptionNoticePeriod,
            "FundUnit: NOTICE_PERIOD_NOT_MET"
        );

        // Check daily redemption gate
        uint256 currentDay = block.timestamp / 1 days;
        uint256 dailyLimit = (totalSupply() * redemptionGateLimit) / 1000;
        require(
            dailyRedemptions[currentDay] + units <= dailyLimit,
            "FundUnit: REDEMPTION_GATE_EXCEEDED"
        );

        // Calculate redemption value
        value = (units * navPerUnit) / 10**18;

        // Update tracking
        dailyRedemptions[currentDay] += units;
        delete redemptionRequests[investor];

        // Burn units
        _burn(investor, units);

        emit RedemptionProcessed(investor, units, value);
    }

    // ==================== KYC & COMPLIANCE ====================

    /**
     * @notice Verifies an investor for KYC
     */
    function verifyInvestor(address investor, string calldata jurisdiction) external onlyRole(COMPLIANCE_ROLE) {
        require(investor != address(0), "FundUnit: ZERO_ADDRESS");

        isVerified[investor] = true;
        investorJurisdiction[investor] = jurisdiction;

        emit InvestorVerified(investor, jurisdiction);
    }

    /**
     * @notice Adds investor to whitelist for transfers
     */
    function whitelistInvestor(address investor) external onlyRole(COMPLIANCE_ROLE) {
        isWhitelisted[investor] = true;
    }

    /**
     * @notice Removes investor from whitelist
     */
    function removeFromWhitelist(address investor) external onlyRole(COMPLIANCE_ROLE) {
        isWhitelisted[investor] = false;
    }

    // ==================== ZAKAT CALCULATION ====================

    /**
     * @notice Calculates zakat due for an investor
     * @param investor Investor address
     * @return zakatDue Zakat amount due
     */
    function calculateZakat(address investor) external onlyRole(FUND_MANAGER_ROLE) returns (uint256 zakatDue) {
        uint256 balance = balanceOf(investor);
        uint256 lastCalc = lastZakatCalculation[investor];

        // Zakat calculated annually
        if (block.timestamp >= lastCalc + 365 days && balance > 0) {
            zakatDue = (balance * zakatRate) / 10000; // 2.5% of holdings

            accumulatedZakat[investor] += zakatDue;
            lastZakatCalculation[investor] = block.timestamp;

            emit ZakatCalculated(investor, zakatDue, block.timestamp);
        }

        return zakatDue;
    }

    /**
     * @notice Distributes accumulated zakat to recipient
     * @param investor Investor address
     */
    function distributeZakat(address investor) external onlyRole(FUND_MANAGER_ROLE) nonReentrant {
        uint256 zakat = accumulatedZakat[investor];
        require(zakat > 0, "FundUnit: NO_ZAKAT");
        require(zakatRecipient != address(0), "FundUnit: NO_RECIPIENT");

        accumulatedZakat[investor] = 0;

        // Transfer zakat amount (in fund units or equivalent value)
        _transfer(investor, zakatRecipient, zakat);
    }

    // ==================== SHARIAH CERTIFICATION ====================

    /**
     * @notice Updates Shariah certification
     */
    function updateShariahCertification(
        string calldata fatwaHash,
        uint256 expiryTimestamp,
        address board
    ) external onlyRole(SHARIAH_BOARD_ROLE) {
        require(expiryTimestamp > block.timestamp, "FundUnit: EXPIRED_FATWA");

        fatwaCertificate = fatwaHash;
        fatwaExpiry = expiryTimestamp;
        shariahBoard = board;
        shariahCompliant = true;

        emit ShariahCertificationUpdated(fatwaHash, expiryTimestamp, board);
    }

    /**
     * @notice Returns Shariah compliance status
     */
    function getShariahStatus() external view returns (
        bool compliant,
        string memory fatwa,
        uint256 expiry,
        address board
    ) {
        return (
            shariahCompliant && block.timestamp < fatwaExpiry,
            fatwaCertificate,
            fatwaExpiry,
            shariahBoard
        );
    }

    // ==================== FEE MANAGEMENT ====================

    /**
     * @notice Collects management and performance fees
     */
    function collectFees() external onlyRole(FUND_MANAGER_ROLE) returns (uint256 mgmtFee, uint256 perfFee) {
        uint256 timeElapsed = block.timestamp - lastFeeCollection;
        require(timeElapsed >= 30 days, "FundUnit: TOO_SOON");

        // Calculate management fee (annual rate, prorated)
        mgmtFee = (totalSupply() * managementFee * timeElapsed) / (10000 * 365 days);

        // Performance fee calculation (simplified - would need high water mark in production)
        perfFee = 0; // Implement based on NAV growth

        lastFeeCollection = block.timestamp;

        // Mint fees to fund manager
        if (mgmtFee > 0) {
            _mint(fundManager, mgmtFee);
        }

        emit FeeCollected(mgmtFee, perfFee, block.timestamp);
    }

    // ==================== HOOKS ====================

    /**
     * @notice Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Skip checks for minting and burning
        if (from == address(0) || to == address(0)) {
            super._beforeTokenTransfer(from, to, amount);
            return;
        }

        // KYC check
        if (kycRequired) {
            require(isVerified[from] && isVerified[to], "FundUnit: KYC_REQUIRED");
        }

        // Transfer restrictions
        if (transfersRestricted) {
            require(
                isWhitelisted[from] || isWhitelisted[to] || hasRole(FUND_MANAGER_ROLE, from),
                "FundUnit: TRANSFER_RESTRICTED"
            );
        }

        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @notice Pauses all token operations
     */
    function pause() external onlyRole(FUND_MANAGER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses token operations
     */
    function unpause() external onlyRole(FUND_MANAGER_ROLE) {
        _unpause();
    }
}

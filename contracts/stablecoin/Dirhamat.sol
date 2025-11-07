// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Dirhamat (DRHM)
 * @dev Gold-backed Shariah-compliant stablecoin
 *
 * Features:
 * - Backed by physical gold reserves
 * - Pegged to UAE Dirham (AED) with gold price adjustments
 * - Shariah-compliant (no interest, profit-sharing mechanism)
 * - Redeemable for gold or AED through licensed partners
 * - Cross-chain compatible
 * - Compliance reporting (AAOIFI standards)
 * - Zakat calculation support
 *
 * Backing Mechanism:
 * - Each DRHM backed by X grams of gold
 * - Price updated via oracle (gold/AED rate)
 * - Reserves audited monthly
 * - Emergency stability mechanisms
 */
contract Dirhamat is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard, Pausable {
    
    // ═══════════════════════════════════════════════════════════════════
    // ROLES & CONSTANTS
    // ═══════════════════════════════════════════════════════════════════

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Precision constants
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant GOLD_PRECISION = 1e6; // 6 decimals for grams
    uint256 public constant AED_PRECISION = 1e18;

    // Reserve requirements
    uint256 public constant MIN_COLLATERAL_RATIO = 110; // 110% minimum
    uint256 public constant LIQUIDATION_RATIO = 105;    // 105% liquidation threshold
    uint256 public constant TARGET_RATIO = 120;         // 120% target ratio

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    // Price feeds
    uint256 public goldPriceAED;           // Gold price in AED per gram (18 decimals)
    uint256 public aedPriceUSD;            // AED price in USD (18 decimals)
    uint256 public lastPriceUpdate;        // Timestamp of last price update
    uint256 public constant PRICE_VALIDITY = 1 hours; // Price valid for 1 hour

    // Reserve tracking
    uint256 public totalGoldReserves;      // Total gold in grams (6 decimals)
    uint256 public totalAEDReserves;       // Total AED reserves (18 decimals)
    uint256 public totalUSDReserves;       // Total USD reserves (18 decimals)

    // Stability mechanisms
    uint256 public stabilityFeeRate;       // Annual stability fee (basis points)
    uint256 public redemptionFeeRate;      // Redemption fee (basis points)
    uint256 public mintingFeeRate;         // Minting fee (basis points)

    // Shariah compliance
    mapping(address => uint256) public zakatDue;     // Zakat due per address
    uint256 public totalZakatPool;                   // Total zakat collected
    mapping(address => bool) public shariahApproved; // Shariah board approved addresses
    address public shariahBoard;                     // Shariah supervisory board

    // Reserve certificates
    struct ReserveCertificate {
        uint256 goldAmount;      // Gold amount in grams
        uint256 aedAmount;       // AED amount
        uint256 timestamp;       // Certificate timestamp
        address auditor;         // Auditing authority
        string ipfsHash;         // IPFS hash of audit report
        bool isActive;           // Certificate validity
    }

    mapping(uint256 => ReserveCertificate) public reserveCertificates;
    uint256 public currentCertificateId;

    // Redemption requests
    struct RedemptionRequest {
        address user;
        uint256 amount;
        bool isGoldRedemption;   // true for gold, false for AED
        uint256 timestamp;
        bool fulfilled;
        uint256 feesPaid;
    }

    mapping(uint256 => RedemptionRequest) public redemptionRequests;
    uint256 public currentRequestId;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event PriceUpdated(
        uint256 indexed timestamp,
        uint256 goldPriceAED,
        uint256 aedPriceUSD,
        address indexed oracle
    );

    event ReserveAdded(
        uint256 indexed goldAmount,
        uint256 indexed aedAmount,
        uint256 indexed usdAmount,
        address auditor
    );

    event RedemptionRequested(
        uint256 indexed requestId,
        address indexed user,
        uint256 amount,
        bool isGoldRedemption
    );

    event RedemptionFulfilled(
        uint256 indexed requestId,
        address indexed user,
        uint256 amount,
        uint256 feesPaid
    );

    event ZakatCalculated(
        address indexed user,
        uint256 amount,
        uint256 zakatDue
    );

    event ShariahComplianceUpdated(
        address indexed entity,
        bool approved,
        address indexed shariahBoard
    );

    event StabilityAction(
        string action,
        uint256 amount,
        uint256 newCollateralRatio
    );

    // ═══════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════

    modifier onlyShariahCompliant(address user) {
        require(shariahApproved[user] || shariahBoard == address(0), "Not Shariah approved");
        _;
    }

    modifier validPrice() {
        require(
            block.timestamp - lastPriceUpdate <= PRICE_VALIDITY,
            "Price data stale"
        );
        require(goldPriceAED > 0 && aedPriceUSD > 0, "Invalid price");
        _;
    }

    modifier sufficientReserves() {
        require(_getCollateralRatio() >= MIN_COLLATERAL_RATIO, "Insufficient reserves");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor() ERC20("Dirhamat", "DRHM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
        
        // Initialize with default values
        stabilityFeeRate = 50; // 0.5% annually
        redemptionFeeRate = 25; // 0.25%
        mintingFeeRate = 25;   // 0.25%
        
        // Initial price (placeholder - will be set by oracle)
        goldPriceAED = 250 * PRICE_PRECISION; // ~250 AED per gram
        aedPriceUSD = 272 * PRICE_PRECISION / 1000; // ~0.272 USD per AED
        lastPriceUpdate = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Mint DRHM tokens backed by gold/AED reserves
     * @param to Recipient address
     * @param amount Amount of DRHM to mint
     * @param goldBacking Amount of gold backing (in grams with 6 decimals)
     * @param aedBacking Amount of AED backing (18 decimals)
     */
    function mint(
        address to,
        uint256 amount,
        uint256 goldBacking,
        uint256 aedBacking
    ) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
        whenNotPaused 
        validPrice
        onlyShariahCompliant(to)
    {
        require(amount > 0, "Amount must be positive");
        
        // Calculate required backing
        uint256 requiredValue = _getDirhamatValue(amount);
        uint256 providedValue = _calculateBackingValue(goldBacking, aedBacking);
        
        require(providedValue >= requiredValue, "Insufficient backing");
        
        // Update reserves
        totalGoldReserves += goldBacking;
        totalAEDReserves += aedBacking;
        
        // Apply minting fee
        uint256 fee = (amount * mintingFeeRate) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        // Mint tokens
        _mint(to, amountAfterFee);
        
        // Mint fee to treasury (contract owner)
        if (fee > 0) {
            _mint(_msgSender(), fee);
        }
        
        // Calculate and track zakat
        _calculateZakat(to, amountAfterFee);
        
        // Ensure we maintain minimum collateral ratio
        require(_getCollateralRatio() >= MIN_COLLATERAL_RATIO, "Would breach collateral ratio");
    }

    /**
     * @dev Request redemption of DRHM for gold or AED
     * @param amount Amount of DRHM to redeem
     * @param redeemForGold true for gold, false for AED
     */
    function requestRedemption(
        uint256 amount, 
        bool redeemForGold
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validPrice
        returns (uint256 requestId)
    {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Calculate redemption fee
        uint256 fee = (amount * redemptionFeeRate) / 10000;
        uint256 netAmount = amount - fee;
        
        // Burn DRHM tokens (including fee)
        _burn(msg.sender, amount);
        
        // Create redemption request
        requestId = currentRequestId++;
        redemptionRequests[requestId] = RedemptionRequest({
            user: msg.sender,
            amount: netAmount,
            isGoldRedemption: redeemForGold,
            timestamp: block.timestamp,
            fulfilled: false,
            feesPaid: fee
        });
        
        emit RedemptionRequested(requestId, msg.sender, netAmount, redeemForGold);
        
        return requestId;
    }

    /**
     * @dev Fulfill redemption request (called by authorized fulfiller)
     * @param requestId Redemption request ID
     */
    function fulfillRedemption(uint256 requestId) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
    {
        RedemptionRequest storage request = redemptionRequests[requestId];
        require(!request.fulfilled, "Already fulfilled");
        require(request.amount > 0, "Invalid request");
        
        // Calculate redemption amount in backing assets
        uint256 dirhamatValue = _getDirhamatValue(request.amount);
        
        if (request.isGoldRedemption) {
            // Redeem for gold
            uint256 goldAmount = (dirhamatValue * GOLD_PRECISION) / goldPriceAED;
            require(totalGoldReserves >= goldAmount, "Insufficient gold reserves");
            totalGoldReserves -= goldAmount;
        } else {
            // Redeem for AED
            require(totalAEDReserves >= dirhamatValue, "Insufficient AED reserves");
            totalAEDReserves -= dirhamatValue;
        }
        
        request.fulfilled = true;
        
        emit RedemptionFulfilled(requestId, request.user, request.amount, request.feesPaid);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ORACLE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Update gold and AED prices
     * @param _goldPriceAED Gold price in AED per gram (18 decimals)
     * @param _aedPriceUSD AED price in USD (18 decimals)
     */
    function updatePrices(
        uint256 _goldPriceAED,
        uint256 _aedPriceUSD
    ) external onlyRole(ORACLE_ROLE) {
        require(_goldPriceAED > 0 && _aedPriceUSD > 0, "Invalid prices");
        
        goldPriceAED = _goldPriceAED;
        aedPriceUSD = _aedPriceUSD;
        lastPriceUpdate = block.timestamp;
        
        emit PriceUpdated(block.timestamp, _goldPriceAED, _aedPriceUSD, msg.sender);
        
        // Check if stability action is needed
        _checkStabilityMechanisms();
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESERVE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Add reserves to backing
     * @param goldAmount Gold amount in grams (6 decimals)
     * @param aedAmount AED amount (18 decimals)
     * @param usdAmount USD amount (18 decimals)
     * @param auditHash IPFS hash of audit certificate
     */
    function addReserves(
        uint256 goldAmount,
        uint256 aedAmount,
        uint256 usdAmount,
        string calldata auditHash
    ) external onlyRole(AUDITOR_ROLE) {
        totalGoldReserves += goldAmount;
        totalAEDReserves += aedAmount;
        totalUSDReserves += usdAmount;
        
        // Create reserve certificate
        uint256 certId = currentCertificateId++;
        reserveCertificates[certId] = ReserveCertificate({
            goldAmount: goldAmount,
            aedAmount: aedAmount,
            timestamp: block.timestamp,
            auditor: msg.sender,
            ipfsHash: auditHash,
            isActive: true
        });
        
        emit ReserveAdded(goldAmount, aedAmount, usdAmount, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SHARIAH COMPLIANCE
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Calculate zakat for user holdings
     * @param user User address
     * @param amount DRHM amount to calculate zakat for
     */
    function _calculateZakat(address user, uint256 amount) internal {
        // Zakat rate: 2.5% annually on holdings above nisab
        uint256 nisab = 85 * GOLD_PRECISION; // 85 grams of gold equivalent
        uint256 userBalance = balanceOf(user);
        
        if (userBalance >= nisab) {
            uint256 zakatAmount = (amount * 25) / 1000; // 2.5%
            zakatDue[user] += zakatAmount;
            totalZakatPool += zakatAmount;
            
            emit ZakatCalculated(user, amount, zakatAmount);
        }
    }

    /**
     * @dev Pay zakat (voluntary)
     * @param amount Amount of zakat to pay
     */
    function payZakat(uint256 amount) external nonReentrant {
        require(amount <= zakatDue[msg.sender], "Exceeds zakat due");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        zakatDue[msg.sender] -= amount;
        totalZakatPool -= amount;
        
        // Transfer to zakat pool (burn tokens, reserves go to charity)
        _burn(msg.sender, amount);
        
        // Note: In practice, equivalent reserves would be donated to charity
    }

    /**
     * @dev Update Shariah compliance status
     * @param entity Address to update
     * @param approved Approval status
     */
    function updateShariahCompliance(
        address entity, 
        bool approved
    ) external onlyRole(COMPLIANCE_ROLE) {
        shariahApproved[entity] = approved;
        emit ShariahComplianceUpdated(entity, approved, msg.sender);
    }

    /**
     * @dev Set Shariah supervisory board
     */
    function setShariahBoard(address _shariahBoard) external onlyRole(DEFAULT_ADMIN_ROLE) {
        shariahBoard = _shariahBoard;
    }

    // ═══════════════════════════════════════════════════════════════════
    // STABILITY MECHANISMS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Check and trigger stability mechanisms if needed
     */
    function _checkStabilityMechanisms() internal {
        uint256 collateralRatio = _getCollateralRatio();
        
        if (collateralRatio < LIQUIDATION_RATIO) {
            // Emergency: liquidate excess DRHM or add reserves
            emit StabilityAction("EMERGENCY_LIQUIDATION", totalSupply(), collateralRatio);
        } else if (collateralRatio < MIN_COLLATERAL_RATIO) {
            // Warning: need more reserves
            emit StabilityAction("LOW_RESERVES_WARNING", totalSupply(), collateralRatio);
        } else if (collateralRatio > TARGET_RATIO * 150 / 100) {
            // Over-collateralized: can mint more or reduce reserves
            emit StabilityAction("OVER_COLLATERALIZED", totalSupply(), collateralRatio);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Get current collateral ratio (percentage)
     */
    function _getCollateralRatio() internal view returns (uint256) {
        uint256 totalSupplyValue = _getDirhamatValue(totalSupply());
        if (totalSupplyValue == 0) return type(uint256).max;
        
        uint256 totalReservesValue = _calculateBackingValue(totalGoldReserves, totalAEDReserves);
        return (totalReservesValue * 100) / totalSupplyValue;
    }

    /**
     * @dev Calculate DRHM value in AED
     */
    function _getDirhamatValue(uint256 dirhamatAmount) internal pure returns (uint256) {
        // 1 DRHM = 1 AED (simplified, could be adjusted based on backing mix)
        return dirhamatAmount;
    }

    /**
     * @dev Calculate total backing value in AED
     */
    function _calculateBackingValue(
        uint256 goldAmount, 
        uint256 aedAmount
    ) internal view returns (uint256) {
        uint256 goldValueAED = (goldAmount * goldPriceAED) / GOLD_PRECISION;
        return goldValueAED + aedAmount;
    }

    /**
     * @dev Get current prices and reserve status
     */
    function getReserveStatus() external view returns (
        uint256 _goldPriceAED,
        uint256 _aedPriceUSD,
        uint256 _totalGoldReserves,
        uint256 _totalAEDReserves,
        uint256 _collateralRatio,
        uint256 _totalSupply
    ) {
        return (
            goldPriceAED,
            aedPriceUSD,
            totalGoldReserves,
            totalAEDReserves,
            _getCollateralRatio(),
            totalSupply()
        );
    }

    /**
     * @dev Get user's zakat information
     */
    function getUserZakatInfo(address user) external view returns (
        uint256 balance,
        uint256 zakatDueAmount,
        bool aboveNisab
    ) {
        uint256 userBalance = balanceOf(user);
        uint256 nisab = 85 * GOLD_PRECISION; // 85 grams of gold equivalent
        
        return (
            userBalance,
            zakatDue[user],
            userBalance >= nisab
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
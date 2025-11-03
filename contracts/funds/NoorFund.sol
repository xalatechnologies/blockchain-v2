// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NoorFund
 * @notice Shariah-compliant investment fund with multi-asset backing
 * @dev Base contract for all Noor Chain investment funds
 *
 * Features:
 * - Multi-asset portfolio management (crypto, gold, real estate, sukuk, SME, cash)
 * - NAV (Net Asset Value) tracking with oracle updates
 * - Subscribe/redeem functionality with instant settlement
 * - Shariah compliance tracking and purification
 * - IPFS proof integration for transparency
 * - Role-based access control
 */
contract NoorFund is ERC20, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 public constant NAV_ORACLE_ROLE = keccak256("NAV_ORACLE_ROLE");
    bytes32 public constant SHARIAH_BOARD_ROLE = keccak256("SHARIAH_BOARD_ROLE");

    // Fund configuration
    string public fundName;
    string public shariahStructure;  // e.g., "Mudarabah", "Musharakah", "Wakalah"
    uint256 public managementFee;    // Annual fee in basis points (e.g., 200 = 2%)
    uint256 public performanceFee;   // Performance fee in basis points
    uint256 public minimumInvestment;
    uint256 public minimumRedemption;
    uint256 public redemptionNoticeDays;
    uint256 public inceptionDate;

    // NAV tracking
    uint256 public netAssetValue;      // Total fund value in USD (18 decimals)
    uint256 public sharePrice;         // Price per share in USD (18 decimals)
    uint256 public lastNAVUpdate;
    string public navProofHash;        // IPFS hash of NAV calculation

    // Asset tracking
    enum AssetType {
        CRYPTO,           // Cryptocurrency assets (WUSDT, WBNB, WETH, etc.)
        GOLD,             // Physical gold in vaults
        REAL_ESTATE,      // Tokenized real estate / Ijārah properties
        SUKUK,            // Islamic bonds
        SME_EQUITY,       // Small/Medium Enterprise equity
        CASH_EQUIVALENTS  // Dirhamat, stablecoins, money market
    }

    struct Asset {
        AssetType assetType;
        address tokenAddress;      // For crypto (address(0) for physical assets)
        uint256 amount;           // Token amount or units
        uint256 valueUSD;         // USD value (18 decimals)
        uint256 lastUpdated;      // Last valuation timestamp
        string description;       // Asset description
        string proofHash;         // IPFS hash of proof/audit
        bool isActive;
        bool shariahCompliant;    // Shariah compliance flag
    }

    mapping(bytes32 => Asset) public assets;
    bytes32[] public assetIds;

    // Shariah compliance
    address public shariahOracle;
    uint256 public purificationRatio;  // Non-compliant income to purify (basis points)
    uint256 public totalPurified;      // Total purified amount in USD

    // Fee tracking
    uint256 public totalManagementFees;
    uint256 public totalPerformanceFees;
    uint256 public lastFeeCollection;

    // Investor tracking
    mapping(address => uint256) public investorSubscriptionDate;
    mapping(address => uint256) public investorTotalInvested;
    address[] public investors;
    uint256 public totalInvestors;

    // Events
    event Subscribed(address indexed investor, uint256 amountUSD, uint256 shares, uint256 navPerShare, uint256 timestamp);
    event Redeemed(address indexed investor, uint256 shares, uint256 amountUSD, uint256 navPerShare, uint256 timestamp);
    event NAVUpdated(uint256 oldNAV, uint256 newNAV, uint256 sharePrice, string proofHash, uint256 timestamp);
    event AssetAdded(bytes32 indexed assetId, AssetType assetType, uint256 valueUSD, string description);
    event AssetUpdated(bytes32 indexed assetId, uint256 oldValue, uint256 newValueUSD, string proofHash);
    event AssetRemoved(bytes32 indexed assetId);
    event FeeCollected(address indexed recipient, uint256 amount, string feeType, uint256 timestamp);
    event ShariahStatusChanged(bytes32 indexed assetId, bool compliant, string reason, uint256 timestamp);
    event Purified(uint256 amount, address indexed recipient, string reason, uint256 timestamp);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _fundName,
        string memory _shariahStructure,
        uint256 _managementFee,
        uint256 _minimumInvestment
    ) ERC20(_name, _symbol) {
        require(_managementFee <= 500, "Management fee too high"); // Max 5%

        fundName = _fundName;
        shariahStructure = _shariahStructure;
        managementFee = _managementFee;
        minimumInvestment = _minimumInvestment;
        minimumRedemption = _minimumInvestment / 10; // 10% of minimum investment
        sharePrice = 1e18; // Initial price: 1 USD per share
        inceptionDate = block.timestamp;
        lastFeeCollection = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FUND_MANAGER_ROLE, msg.sender);
        _grantRole(NAV_ORACLE_ROLE, msg.sender);
    }

    /**
     * @notice Subscribe to the fund by depositing capital
     * @param _token Token address for payment (must be stablecoin)
     * @param _amount Amount to invest in token decimals
     * @return shares Number of fund shares minted
     */
    function subscribe(
        address _token,
        uint256 _amount
    ) external nonReentrant whenNotPaused returns (uint256 shares) {
        require(_amount >= minimumInvestment, "Below minimum investment");
        require(sharePrice > 0, "NAV not initialized");

        // Transfer tokens from investor
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Convert token amount to USD value (assuming 18 decimals)
        uint256 amountUSD = _amount; // Simplification: assumes 1:1 USD value

        // Calculate shares based on current NAV per share
        shares = (amountUSD * 1e18) / sharePrice;

        // Track investor
        if (balanceOf(msg.sender) == 0) {
            investors.push(msg.sender);
            totalInvestors++;
            investorSubscriptionDate[msg.sender] = block.timestamp;
        }
        investorTotalInvested[msg.sender] += amountUSD;

        // Mint fund shares to investor
        _mint(msg.sender, shares);

        emit Subscribed(msg.sender, amountUSD, shares, sharePrice, block.timestamp);
        return shares;
    }

    /**
     * @notice Redeem fund shares for underlying assets
     * @param _shares Number of shares to redeem
     * @param _token Token to receive (must be available in fund)
     * @return amount Amount of tokens returned
     */
    function redeem(
        uint256 _shares,
        address _token
    ) external nonReentrant returns (uint256 amount) {
        require(balanceOf(msg.sender) >= _shares, "Insufficient shares");
        require(_shares >= minimumRedemption, "Below minimum redemption");

        // Check redemption notice period
        uint256 daysSinceSubscription = (block.timestamp - investorSubscriptionDate[msg.sender]) / 1 days;
        require(daysSinceSubscription >= redemptionNoticeDays, "Redemption notice period not met");

        // Calculate redemption amount based on current NAV
        uint256 amountUSD = (_shares * sharePrice) / 1e18;

        // Burn fund shares
        _burn(msg.sender, _shares);

        // Transfer assets to investor
        amount = amountUSD; // Simplification: assumes 1:1 token/USD
        IERC20(_token).safeTransfer(msg.sender, amount);

        emit Redeemed(msg.sender, _shares, amountUSD, sharePrice, block.timestamp);
        return amount;
    }

    /**
     * @notice Update Net Asset Value (NAV)
     * @dev Called by authorized NAV oracle with proof
     * @param _newNAV New total fund value in USD (18 decimals)
     * @param _proofHash IPFS hash of NAV calculation proof
     */
    function updateNAV(
        uint256 _newNAV,
        string calldata _proofHash
    ) external onlyRole(NAV_ORACLE_ROLE) {
        uint256 oldNAV = netAssetValue;
        netAssetValue = _newNAV;
        lastNAVUpdate = block.timestamp;
        navProofHash = _proofHash;

        // Calculate new share price
        uint256 totalShares = totalSupply();
        if (totalShares > 0) {
            sharePrice = (_newNAV * 1e18) / totalShares;
        } else {
            sharePrice = 1e18; // Default: 1 USD per share
        }

        emit NAVUpdated(oldNAV, _newNAV, sharePrice, _proofHash, block.timestamp);
    }

    /**
     * @notice Add asset to fund portfolio
     */
    function addAsset(
        bytes32 _assetId,
        AssetType _assetType,
        address _tokenAddress,
        uint256 _amount,
        uint256 _valueUSD,
        string calldata _description,
        bool _shariahCompliant
    ) external onlyRole(FUND_MANAGER_ROLE) {
        require(!assets[_assetId].isActive, "Asset already exists");
        require(_valueUSD > 0, "Zero value");

        assets[_assetId] = Asset({
            assetType: _assetType,
            tokenAddress: _tokenAddress,
            amount: _amount,
            valueUSD: _valueUSD,
            lastUpdated: block.timestamp,
            description: _description,
            proofHash: "",
            isActive: true,
            shariahCompliant: _shariahCompliant
        });

        assetIds.push(_assetId);

        emit AssetAdded(_assetId, _assetType, _valueUSD, _description);
    }

    /**
     * @notice Update asset valuation
     */
    function updateAssetValue(
        bytes32 _assetId,
        uint256 _newValueUSD,
        uint256 _newAmount,
        string calldata _proofHash
    ) external onlyRole(FUND_MANAGER_ROLE) {
        Asset storage asset = assets[_assetId];
        require(asset.isActive, "Asset not active");

        uint256 oldValue = asset.valueUSD;
        asset.valueUSD = _newValueUSD;

        if (_newAmount > 0) {
            asset.amount = _newAmount;
        }

        asset.lastUpdated = block.timestamp;
        asset.proofHash = _proofHash;

        emit AssetUpdated(_assetId, oldValue, _newValueUSD, _proofHash);
    }

    /**
     * @notice Remove asset from portfolio
     */
    function removeAsset(bytes32 _assetId) external onlyRole(FUND_MANAGER_ROLE) {
        Asset storage asset = assets[_assetId];
        require(asset.isActive, "Asset not active");

        asset.isActive = false;
        emit AssetRemoved(_assetId);
    }

    /**
     * @notice Update Shariah compliance status
     */
    function updateShariahStatus(
        bytes32 _assetId,
        bool _compliant,
        string calldata _reason
    ) external onlyRole(SHARIAH_BOARD_ROLE) {
        require(assets[_assetId].isActive, "Asset not found");
        assets[_assetId].shariahCompliant = _compliant;

        emit ShariahStatusChanged(_assetId, _compliant, _reason, block.timestamp);
    }

    /**
     * @notice Purify non-compliant income
     * @param _amount Amount to purify in USD
     * @param _recipient Charity address
     * @param _reason Reason for purification
     */
    function purify(
        uint256 _amount,
        address _recipient,
        string calldata _reason
    ) external onlyRole(FUND_MANAGER_ROLE) {
        require(_amount > 0, "Zero amount");
        require(_recipient != address(0), "Invalid recipient");

        totalPurified += _amount;

        emit Purified(_amount, _recipient, _reason, block.timestamp);
    }

    /**
     * @notice Collect management fees
     */
    function collectManagementFee() external onlyRole(FUND_MANAGER_ROLE) {
        uint256 daysSinceLastCollection = (block.timestamp - lastFeeCollection) / 1 days;
        require(daysSinceLastCollection > 0, "Too soon");

        // Calculate daily fee
        uint256 dailyFeeRate = (managementFee * 1e18) / (365 * 10000); // Basis points to daily rate
        uint256 feeAmount = (netAssetValue * dailyFeeRate * daysSinceLastCollection) / 1e18;

        totalManagementFees += feeAmount;
        lastFeeCollection = block.timestamp;

        emit FeeCollected(msg.sender, feeAmount, "Management", block.timestamp);
    }

    /**
     * @notice Get fund performance metrics
     */
    function getPerformanceMetrics() external view returns (
        uint256 totalAssetValue,
        uint256 currentSharePrice,
        uint256 totalShares,
        uint256 managementFeeAnnual,
        uint256 lastUpdate,
        uint256 numberOfInvestors
    ) {
        return (
            netAssetValue,
            sharePrice,
            totalSupply(),
            managementFee,
            lastNAVUpdate,
            totalInvestors
        );
    }

    /**
     * @notice Get asset allocation breakdown
     */
    function getAssetAllocation() external view returns (
        uint256 cryptoValue,
        uint256 goldValue,
        uint256 realEstateValue,
        uint256 sukukValue,
        uint256 smeEquityValue,
        uint256 cashValue
    ) {
        for (uint256 i = 0; i < assetIds.length; i++) {
            Asset memory asset = assets[assetIds[i]];
            if (!asset.isActive) continue;

            if (asset.assetType == AssetType.CRYPTO) {
                cryptoValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.GOLD) {
                goldValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.REAL_ESTATE) {
                realEstateValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.SUKUK) {
                sukukValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.SME_EQUITY) {
                smeEquityValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.CASH_EQUIVALENTS) {
                cashValue += asset.valueUSD;
            }
        }
    }

    /**
     * @notice Get total number of assets
     */
    function getAssetCount() external view returns (uint256) {
        return assetIds.length;
    }

    /**
     * @notice Get asset by ID
     */
    function getAsset(bytes32 _assetId) external view returns (Asset memory) {
        return assets[_assetId];
    }

    /**
     * @notice Get all investors
     */
    function getAllInvestors() external view returns (address[] memory) {
        return investors;
    }

    /**
     * @notice Get investor details
     */
    function getInvestorDetails(address _investor) external view returns (
        uint256 shares,
        uint256 value,
        uint256 subscriptionDate,
        uint256 totalInvested
    ) {
        return (
            balanceOf(_investor),
            (balanceOf(_investor) * sharePrice) / 1e18,
            investorSubscriptionDate[_investor],
            investorTotalInvested[_investor]
        );
    }

    /**
     * @notice Pause fund operations
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause fund operations
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Set Shariah oracle address
     */
    function setShariahOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracle != address(0), "Invalid oracle");
        shariahOracle = _oracle;
    }

    /**
     * @notice Set redemption notice period
     */
    function setRedemptionNoticeDays(uint256 _days) external onlyRole(FUND_MANAGER_ROLE) {
        redemptionNoticeDays = _days;
    }

    /**
     * @notice Set performance fee
     */
    function setPerformanceFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_fee <= 2000, "Performance fee too high"); // Max 20%
        performanceFee = _fee;
    }
}

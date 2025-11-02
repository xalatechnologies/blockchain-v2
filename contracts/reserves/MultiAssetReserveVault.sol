// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MultiAssetReserveVault
 * @notice Multi-asset reserve vault for backing Dirhamat stablecoin
 * @dev Supports WUSDT, WBNB, WETH, physical gold, mining operations, and other assets
 */
contract MultiAssetReserveVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Asset types
    enum AssetType {
        CRYPTO,      // On-chain crypto assets (WUSDT, WBNB, WETH, etc.)
        GOLD,        // Physical gold in vaults
        MINING,      // Mining operations/revenue
        REAL_ESTATE, // Real estate holdings
        COMMODITIES, // Other commodities
        FIAT         // Fiat currency reserves
    }

    // Asset information
    struct Asset {
        AssetType assetType;
        address tokenAddress;    // For crypto assets (address(0) for physical assets)
        uint256 amount;         // Token amount or units
        uint256 valueUSD;       // USD value (18 decimals)
        uint256 lastUpdated;    // Last valuation timestamp
        string description;     // Description of asset
        string proofHash;       // IPFS hash of proof/audit
        bool isActive;
    }

    // Reserve assets
    mapping(bytes32 => Asset) public assets;  // assetId => Asset
    bytes32[] public assetIds;

    // Total reserve value tracking
    uint256 public totalReserveValueUSD;  // Total in USD (18 decimals)

    // Events
    event AssetAdded(bytes32 indexed assetId, AssetType assetType, uint256 valueUSD, string description);
    event AssetUpdated(bytes32 indexed assetId, uint256 newValueUSD, string proofHash);
    event AssetRemoved(bytes32 indexed assetId);
    event CryptoDeposited(bytes32 indexed assetId, address token, uint256 amount, uint256 valueUSD);
    event CryptoWithdrawn(bytes32 indexed assetId, address token, uint256 amount, address to);
    event ReserveAudited(uint256 totalValueUSD, string auditHash, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RESERVE_MANAGER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }

    /**
     * @notice Add a new reserve asset
     * @param _assetId Unique identifier for the asset
     * @param _assetType Type of asset
     * @param _tokenAddress Token address (for crypto) or address(0) for physical assets
     * @param _amount Amount/units of asset
     * @param _valueUSD USD value of asset (18 decimals)
     * @param _description Description of asset
     */
    function addAsset(
        bytes32 _assetId,
        AssetType _assetType,
        address _tokenAddress,
        uint256 _amount,
        uint256 _valueUSD,
        string calldata _description
    ) external onlyRole(RESERVE_MANAGER_ROLE) {
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
            isActive: true
        });

        assetIds.push(_assetId);
        totalReserveValueUSD += _valueUSD;

        emit AssetAdded(_assetId, _assetType, _valueUSD, _description);
    }

    /**
     * @notice Deposit crypto asset to vault
     * @param _assetId Asset identifier
     * @param _amount Amount to deposit
     */
    function depositCrypto(
        bytes32 _assetId,
        uint256 _amount
    ) external onlyRole(RESERVE_MANAGER_ROLE) nonReentrant whenNotPaused {
        Asset storage asset = assets[_assetId];
        require(asset.isActive, "Asset not active");
        require(asset.assetType == AssetType.CRYPTO, "Not a crypto asset");
        require(asset.tokenAddress != address(0), "Invalid token");

        IERC20(asset.tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        asset.amount += _amount;
        asset.lastUpdated = block.timestamp;

        emit CryptoDeposited(_assetId, asset.tokenAddress, _amount, asset.valueUSD);
    }

    /**
     * @notice Withdraw crypto asset from vault
     * @param _assetId Asset identifier
     * @param _amount Amount to withdraw
     * @param _to Recipient address
     */
    function withdrawCrypto(
        bytes32 _assetId,
        uint256 _amount,
        address _to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Asset storage asset = assets[_assetId];
        require(asset.isActive, "Asset not active");
        require(asset.assetType == AssetType.CRYPTO, "Not a crypto asset");
        require(asset.amount >= _amount, "Insufficient balance");

        asset.amount -= _amount;
        asset.lastUpdated = block.timestamp;

        IERC20(asset.tokenAddress).safeTransfer(_to, _amount);

        emit CryptoWithdrawn(_assetId, asset.tokenAddress, _amount, _to);
    }

    /**
     * @notice Update asset valuation
     * @param _assetId Asset identifier
     * @param _newValueUSD New USD value (18 decimals)
     * @param _newAmount New amount/units (optional, 0 to keep current)
     * @param _proofHash IPFS hash of valuation proof
     */
    function updateAssetValue(
        bytes32 _assetId,
        uint256 _newValueUSD,
        uint256 _newAmount,
        string calldata _proofHash
    ) external onlyRole(AUDITOR_ROLE) {
        Asset storage asset = assets[_assetId];
        require(asset.isActive, "Asset not active");

        // Update total reserve value
        totalReserveValueUSD = totalReserveValueUSD - asset.valueUSD + _newValueUSD;

        asset.valueUSD = _newValueUSD;
        if (_newAmount > 0) {
            asset.amount = _newAmount;
        }
        asset.lastUpdated = block.timestamp;
        asset.proofHash = _proofHash;

        emit AssetUpdated(_assetId, _newValueUSD, _proofHash);
    }

    /**
     * @notice Record completion of reserve audit
     * @param _auditHash IPFS hash of audit report
     */
    function recordAudit(string calldata _auditHash) external onlyRole(AUDITOR_ROLE) {
        emit ReserveAudited(totalReserveValueUSD, _auditHash, block.timestamp);
    }

    /**
     * @notice Remove asset from reserves
     * @param _assetId Asset identifier
     */
    function removeAsset(bytes32 _assetId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Asset storage asset = assets[_assetId];
        require(asset.isActive, "Asset not active");
        require(asset.amount == 0, "Asset balance not zero");

        totalReserveValueUSD -= asset.valueUSD;
        asset.isActive = false;

        emit AssetRemoved(_assetId);
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
     * @notice Get reserve breakdown by asset type
     */
    function getReserveBreakdown() external view returns (
        uint256 cryptoValue,
        uint256 goldValue,
        uint256 miningValue,
        uint256 realEstateValue,
        uint256 commoditiesValue,
        uint256 fiatValue
    ) {
        for (uint256 i = 0; i < assetIds.length; i++) {
            Asset memory asset = assets[assetIds[i]];
            if (!asset.isActive) continue;

            if (asset.assetType == AssetType.CRYPTO) {
                cryptoValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.GOLD) {
                goldValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.MINING) {
                miningValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.REAL_ESTATE) {
                realEstateValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.COMMODITIES) {
                commoditiesValue += asset.valueUSD;
            } else if (asset.assetType == AssetType.FIAT) {
                fiatValue += asset.valueUSD;
            }
        }
    }

    /**
     * @notice Get crypto asset balance
     */
    function getCryptoBalance(bytes32 _assetId) external view returns (uint256) {
        Asset memory asset = assets[_assetId];
        if (asset.assetType != AssetType.CRYPTO || asset.tokenAddress == address(0)) {
            return 0;
        }
        return IERC20(asset.tokenAddress).balanceOf(address(this));
    }

    /**
     * @notice Pause the vault
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the vault
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

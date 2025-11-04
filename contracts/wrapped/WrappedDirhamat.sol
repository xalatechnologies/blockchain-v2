// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WrappedDirhamat
 * @dev Wrapped Dirhamat stablecoin for deployment on external chains (Ethereum, BSC, Polygon)
 * Minted 1:1 when Dirhamat is locked on Nor Chain
 * Maintains AED peg and Shariah compliance across chains
 */
contract WrappedDirhamat is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    address public norChainBridge;
    address public complianceContract;
    
    uint256 public totalBridged;
    uint256 public totalRedeemed;
    
    mapping(address => bool) public blacklisted;
    
    event Bridged(address indexed user, uint256 amount, bytes32 norTxHash);
    event Redeemed(address indexed user, uint256 amount, address norAddress);
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);
    
    constructor(address _bridge, address _compliance) ERC20("Wrapped Dirhamat", "wDIRHAMAT") {
        require(_bridge != address(0), "WrappedDirhamat: ZERO_BRIDGE");
        require(_compliance != address(0), "WrappedDirhamat: ZERO_COMPLIANCE");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, _bridge);
        _grantRole(COMPLIANCE_ROLE, _compliance);
        
        norChainBridge = _bridge;
        complianceContract = _compliance;
    }
    
    /**
     * @dev Mint wrapped Dirhamat when tokens are locked on Nor Chain
     * Only callable by authorized bridge contract
     */
    function mint(address to, uint256 amount, bytes32 norTxHash) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        require(to != address(0), "WrappedDirhamat: ZERO_ADDRESS");
        require(amount > 0, "WrappedDirhamat: ZERO_AMOUNT");
        require(!blacklisted[to], "WrappedDirhamat: BLACKLISTED");
        
        _mint(to, amount);
        totalBridged += amount;
        
        emit Bridged(to, amount, norTxHash);
    }
    
    /**
     * @dev Burn wrapped Dirhamat to redeem on Nor Chain
     */
    function redeem(uint256 amount, address norAddress) external whenNotPaused {
        require(amount > 0, "WrappedDirhamat: ZERO_AMOUNT");
        require(norAddress != address(0), "WrappedDirhamat: ZERO_ADDRESS");
        require(!blacklisted[msg.sender], "WrappedDirhamat: BLACKLISTED");
        
        _burn(msg.sender, amount);
        totalRedeemed += amount;
        
        emit Redeemed(msg.sender, amount, norAddress);
    }
    
    /**
     * @dev Blacklist addresses for compliance (AML/KYC)
     */
    function blacklist(address account) external onlyRole(COMPLIANCE_ROLE) {
        require(account != address(0), "WrappedDirhamat: ZERO_ADDRESS");
        blacklisted[account] = true;
        emit Blacklisted(account);
    }
    
    /**
     * @dev Remove address from blacklist
     */
    function unblacklist(address account) external onlyRole(COMPLIANCE_ROLE) {
        blacklisted[account] = false;
        emit Unblacklisted(account);
    }
    
    /**
     * @dev Update bridge contract address
     */
    function updateBridge(address newBridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newBridge != address(0), "WrappedDirhamat: ZERO_ADDRESS");
        
        address oldBridge = norChainBridge;
        _revokeRole(BRIDGE_ROLE, oldBridge);
        _grantRole(BRIDGE_ROLE, newBridge);
        
        norChainBridge = newBridge;
        
        emit BridgeUpdated(oldBridge, newBridge);
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Override to add blacklist and pause checks
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        require(!blacklisted[from], "WrappedDirhamat: SENDER_BLACKLISTED");
        require(!blacklisted[to], "WrappedDirhamat: RECEIVER_BLACKLISTED");
        super._beforeTokenTransfer(from, to, amount);
    }
    
    function getBridgeStats() external view returns (uint256 bridged, uint256 redeemed, uint256 netLocked) {
        return (totalBridged, totalRedeemed, totalBridged - totalRedeemed);
    }
}

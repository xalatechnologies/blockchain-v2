// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WrappedBTCBR
 * @dev Wrapped BTCBR token for deployment on external chains (Ethereum, BSC, Polygon)
 * Minted 1:1 when BTCBR is locked on Nor Chain
 * Burned when users bridge back to Nor Chain
 */
contract WrappedBTCBR is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    
    address public norChainBridge;
    uint256 public totalBridged;
    uint256 public totalRedeemed;
    
    event Bridged(address indexed user, uint256 amount, bytes32 norTxHash);
    event Redeemed(address indexed user, uint256 amount, address norAddress);
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    
    constructor(address _bridge) ERC20("Wrapped Bitcoin BR", "wBTCBR") {
        require(_bridge != address(0), "WrappedBTCBR: ZERO_ADDRESS");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, _bridge);
        
        norChainBridge = _bridge;
    }
    
    /**
     * @dev Mint wrapped BTCBR when tokens are locked on Nor Chain
     * Only callable by authorized bridge contract
     */
    function mint(address to, uint256 amount, bytes32 norTxHash) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        require(to != address(0), "WrappedBTCBR: ZERO_ADDRESS");
        require(amount > 0, "WrappedBTCBR: ZERO_AMOUNT");
        
        _mint(to, amount);
        totalBridged += amount;
        
        emit Bridged(to, amount, norTxHash);
    }
    
    /**
     * @dev Burn wrapped BTCBR to redeem on Nor Chain
     * Tokens are burned and unlock event is emitted for bridge validators
     */
    function redeem(uint256 amount, address norAddress) external whenNotPaused {
        require(amount > 0, "WrappedBTCBR: ZERO_AMOUNT");
        require(norAddress != address(0), "WrappedBTCBR: ZERO_ADDRESS");
        
        _burn(msg.sender, amount);
        totalRedeemed += amount;
        
        emit Redeemed(msg.sender, amount, norAddress);
    }
    
    /**
     * @dev Update bridge contract address
     * Only callable by admin
     */
    function updateBridge(address newBridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newBridge != address(0), "WrappedBTCBR: ZERO_ADDRESS");
        
        address oldBridge = norChainBridge;
        _revokeRole(BRIDGE_ROLE, oldBridge);
        _grantRole(BRIDGE_ROLE, newBridge);
        
        norChainBridge = newBridge;
        
        emit BridgeUpdated(oldBridge, newBridge);
    }
    
    /**
     * @dev Pause token transfers in emergency
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Override to add pause functionality
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (uint256 bridged, uint256 redeemed, uint256 netLocked) {
        return (totalBridged, totalRedeemed, totalBridged - totalRedeemed);
    }
}

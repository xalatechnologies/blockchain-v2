// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WrappedNOR
 * @dev Wrapped NOR token for deployment on external chains (Ethereum, BSC, Polygon)
 * Minted 1:1 when NOR is locked on Noor Chain
 * Burned when users bridge back to Noor Chain
 */
contract WrappedNOR is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    
    address public noorChainBridge;
    uint256 public totalBridged;
    uint256 public totalRedeemed;
    
    event Bridged(address indexed user, uint256 amount, bytes32 noorTxHash);
    event Redeemed(address indexed user, uint256 amount, address noorAddress);
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    
    constructor(address _bridge) ERC20("Wrapped Noor", "wNOR") {
        require(_bridge != address(0), "WrappedNOR: ZERO_ADDRESS");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, _bridge);
        
        noorChainBridge = _bridge;
    }
    
    /**
     * @dev Mint wrapped NOR when tokens are locked on Noor Chain
     * Only callable by authorized bridge contract
     */
    function mint(address to, uint256 amount, bytes32 noorTxHash) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        require(to != address(0), "WrappedNOR: ZERO_ADDRESS");
        require(amount > 0, "WrappedNOR: ZERO_AMOUNT");
        
        _mint(to, amount);
        totalBridged += amount;
        
        emit Bridged(to, amount, noorTxHash);
    }
    
    /**
     * @dev Burn wrapped NOR to redeem on Noor Chain
     * Tokens are burned and unlock event is emitted for bridge validators
     */
    function redeem(uint256 amount, address noorAddress) external whenNotPaused {
        require(amount > 0, "WrappedNOR: ZERO_AMOUNT");
        require(noorAddress != address(0), "WrappedNOR: ZERO_ADDRESS");
        
        _burn(msg.sender, amount);
        totalRedeemed += amount;
        
        emit Redeemed(msg.sender, amount, noorAddress);
    }
    
    /**
     * @dev Update bridge contract address
     */
    function updateBridge(address newBridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newBridge != address(0), "WrappedNOR: ZERO_ADDRESS");
        
        address oldBridge = noorChainBridge;
        _revokeRole(BRIDGE_ROLE, oldBridge);
        _grantRole(BRIDGE_ROLE, newBridge);
        
        noorChainBridge = newBridge;
        
        emit BridgeUpdated(oldBridge, newBridge);
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    function getBridgeStats() external view returns (uint256 bridged, uint256 redeemed, uint256 netLocked) {
        return (totalBridged, totalRedeemed, totalBridged - totalRedeemed);
    }
}

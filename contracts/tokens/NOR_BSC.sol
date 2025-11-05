// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NOR BSC Token
 * @notice Bridgeable NOR token on BSC Mainnet
 * @dev This is the BSC representation of NOR from NorChain
 * 
 * Key Features:
 * - Mintable by bridge contract only
 * - Burnable for bridge withdrawals
 * - 18 decimals (BSC standard)
 * - Owner can grant minter role to bridge
 */
contract NOR_BSC is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor() ERC20("Nor", "NOR") {
        // No initial mint - tokens are minted when bridged from NorChain
        // Owner will grant minter role to bridge contract
    }
    
    /**
     * @notice Standard 18 decimals for BSC compatibility
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @notice Mint tokens (bridge only)
     * @dev Only callable by approved minters (bridge contracts)
     */
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "NOR: caller is not a minter");
        _mint(to, amount);
    }
    
    /**
     * @notice Add minter (typically bridge contract)
     * @dev Only owner can add minters
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "NOR: zero address");
        require(!minters[minter], "NOR: already minter");
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @notice Remove minter
     * @dev Only owner can remove minters
     */
    function removeMinter(address minter) external onlyOwner {
        require(minters[minter], "NOR: not a minter");
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
}

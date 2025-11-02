// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @notice Mock USDT token for testing and development
 * @dev ERC-20 token with 6 decimals (matching real USDT)
 *
 * This is a test token for development purposes. In production, use bridged USDT.
 *
 * Features:
 * - 6 decimals (same as real USDT)
 * - Mintable by owner for testing
 * - Initial supply for testing
 * - Can be used in DEX pairs during development
 *
 * ⚠️ WARNING: This is a MOCK token for testing only!
 * For production, use real bridged USDT from BSC/Ethereum.
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private constant _decimals = 6;

    /**
     * @notice Constructor mints initial supply to deployer
     * @param initialSupply Initial supply in USDT (6 decimals)
     */
    constructor(uint256 initialSupply) ERC20("Mock USDT", "USDT") {
        // Mint initial supply to deployer (e.g., 1,000,000 USDT for testing)
        _mint(msg.sender, initialSupply * 10 ** _decimals);
    }

    /**
     * @notice Get token decimals (6 for USDT)
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint new tokens (owner only) for testing
     * @param to Recipient address
     * @param amount Amount in USDT (6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens (owner only)
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Faucet function - anyone can get 1000 USDT for testing
     * @dev Useful for testing, remove in production
     */
    function faucet() external {
        require(balanceOf(msg.sender) < 10000 * 10 ** _decimals, "MockUSDT: Already have enough");
        _mint(msg.sender, 1000 * 10 ** _decimals); // Give 1000 USDT
    }
}

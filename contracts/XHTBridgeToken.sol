// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NOR Bridge Token (BSC Side)
 * @notice Bridged version of NOR on BSC for PancakeSwap trading
 * @dev This is the "World 2" token that connects to Nor Chain
 *
 * How it works:
 * 1. User locks NOR on Nor Chain
 * 2. Bridge mints same amount here on BSC
 * 3. User can trade on PancakeSwap
 * 4. User burns to bridge back to Nor
 */
contract NORBridgeToken is ERC20, Ownable {
    // Bridge operators (can mint/burn)
    mapping(address => bool) public bridges;

    // Events
    event BridgeAdded(address indexed bridge);
    event BridgeRemoved(address indexed bridge);
    event BridgeDeposit(address indexed from, uint256 amount, string destinationChain, bytes32 txHash);
    event BridgeWithdrawal(address indexed to, uint256 amount, string sourceChain, bytes32 txHash);

    constructor() ERC20("Nor Token", "NOR") Ownable() {
        // Owner is initial bridge operator
        bridges[msg.sender] = true;
    }

    /**
     * @notice Add a bridge operator
     * @param bridge Address of bridge contract
     */
    function addBridge(address bridge) external onlyOwner {
        bridges[bridge] = true;
        emit BridgeAdded(bridge);
    }

    /**
     * @notice Remove a bridge operator
     * @param bridge Address of bridge contract
     */
    function removeBridge(address bridge) external onlyOwner {
        bridges[bridge] = false;
        emit BridgeRemoved(bridge);
    }

    /**
     * @notice Mint tokens (called by bridge when user locks on Nor)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(bridges[msg.sender] || msg.sender == owner(), "Not authorized");
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens to bridge back to Nor
     * @param amount Amount to burn
     */
    function bridgeOut(uint256 amount) external {
        _burn(msg.sender, amount);
        emit BridgeDeposit(msg.sender, amount, "XAHEEN", bytes32(0));
    }

    /**
     * @notice Bridge operator mints tokens for user
     * @param to Recipient address
     * @param amount Amount to mint
     * @param txHash Source chain transaction hash (for tracking)
     */
    function bridgeIn(address to, uint256 amount, bytes32 txHash) external {
        require(bridges[msg.sender], "Not authorized bridge");
        _mint(to, amount);
        emit BridgeWithdrawal(to, amount, "XAHEEN", txHash);
    }
}

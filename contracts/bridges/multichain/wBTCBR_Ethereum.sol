// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title wBTCBR (Wrapped BTCBR for Ethereum)
 * @notice ERC-20 wrapped version of BTCBR for Ethereum mainnet
 * @dev Minted by bridge when BTCBR is locked on Nor Chain
 */
contract wBTCBR_Ethereum is ERC20, AccessControl, Pausable {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    event BridgeMint(address indexed to, uint256 amount, bytes32 indexed transferId);
    event BridgeBurn(address indexed from, uint256 amount, bytes32 indexed transferId);

    constructor() ERC20("Wrapped BTCBR", "wBTCBR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    /**
     * @notice Mint wBTCBR (bridge only)
     * @param to Recipient address
     * @param amount Amount to mint
     * @param transferId Bridge transfer ID
     */
    function bridgeMint(address to, uint256 amount, bytes32 transferId)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        _mint(to, amount);
        emit BridgeMint(to, amount, transferId);
    }

    /**
     * @notice Burn wBTCBR for bridge transfer back
     * @param from Address to burn from
     * @param amount Amount to burn
     * @param transferId Bridge transfer ID
     */
    function bridgeBurn(address from, uint256 amount, bytes32 transferId)
        external
        onlyRole(BURNER_ROLE)
        whenNotPaused
    {
        _burn(from, amount);
        emit BridgeBurn(from, amount, transferId);
    }

    /**
     * @notice Pause token transfers
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Hook called before token transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}

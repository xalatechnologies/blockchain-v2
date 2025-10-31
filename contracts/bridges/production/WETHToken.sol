// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WETHToken
 * @notice Wrapped ETH on Xaheen Chain
 * @dev Minted when ETH is locked on BSC, burned when withdrawn
 */
contract WETHToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(uint256 => bool) public processedNonces;

    event BridgeMint(address indexed to, uint256 amount, uint256 nonce);
    event BridgeBurn(address indexed from, uint256 amount, uint256 nonce);

    constructor() ERC20("Wrapped Ethereum", "WETH") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount, uint256 nonce) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(!processedNonces[nonce], "Nonce already processed");
        processedNonces[nonce] = true;

        _mint(to, amount);
        emit BridgeMint(to, amount, nonce);
    }

    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
        emit BridgeBurn(msg.sender, amount, 0);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}

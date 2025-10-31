// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WBNBToken
 * @notice Wrapped BNB token on Xaheen Chain
 * @dev Minted when users bridge BNB from BSC
 */
contract WBNBToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event BridgeMint(address indexed to, uint256 amount, uint256 nonce);
    event BridgeBurn(address indexed from, uint256 amount, uint256 nonce);

    constructor() ERC20("Wrapped BNB", "WBNB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @notice Mint WBNB (called by bridge when user locks BNB on BSC)
     */
    function mint(address to, uint256 amount, uint256 nonce) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
        emit BridgeMint(to, amount, nonce);
    }

    /**
     * @notice Burn WBNB (user initiates withdrawal to BSC)
     */
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

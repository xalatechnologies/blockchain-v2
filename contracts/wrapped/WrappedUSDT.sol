// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title WrappedUSDT
 * @dev Wrapped USDT on NorChain (bridged from BSC)
 * BSC USDT: 0x55d398326f99059fF775485246999027B3197955
 */
contract WrappedUSDT is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Track nonces to prevent replay attacks
    mapping(uint256 => bool) public usedNonces;

    event Minted(address indexed to, uint256 amount, uint256 nonce);
    event Burned(address indexed from, uint256 amount);

    constructor() ERC20("Wrapped USDT", "WUSDT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Mint tokens (called by bridge contract)
     */
    function mint(address to, uint256 amount, uint256 nonce) external onlyRole(MINTER_ROLE) {
        require(!usedNonces[nonce], "Nonce already used");
        usedNonces[nonce] = true;

        _mint(to, amount);
        emit Minted(to, amount, nonce);
    }

    /**
     * @dev Burn tokens (for bridging back)
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /**
     * @dev Grant minter role to bridge contract
     */
    function grantMinterRole(address bridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, bridge);
    }

    /**
     * @dev Decimals (USDT uses 18 on NorChain for simplicity)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

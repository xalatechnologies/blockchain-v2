// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title WrappedBNB
 * @dev Wrapped BNB on NorChain (bridged from BSC)
 */
contract WrappedBNB is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(uint256 => bool) public usedNonces;

    event Minted(address indexed to, uint256 amount, uint256 nonce);
    event Burned(address indexed from, uint256 amount);

    constructor() ERC20("Wrapped BNB", "WBNB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount, uint256 nonce) external onlyRole(MINTER_ROLE) {
        require(!usedNonces[nonce], "Nonce already used");
        usedNonces[nonce] = true;

        _mint(to, amount);
        emit Minted(to, amount, nonce);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    function grantMinterRole(address bridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, bridge);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

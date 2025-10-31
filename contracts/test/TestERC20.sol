// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestERC20
 * @dev Simple ERC20 token for testing purposes
 */
contract TestERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) {
        _decimals = 18;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Allow minting for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

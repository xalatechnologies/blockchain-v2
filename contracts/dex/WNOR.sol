// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WNOR (Wrapped NOR)
 * @notice ERC-20 wrapper for native NOR token on Nor Chain
 * @dev Standard WETH9 implementation adapted for NOR
 *
 * WNOR enables native NOR tokens to be used in DEX pairs and DeFi protocols
 * that require ERC-20 token standards.
 *
 * Features:
 * - Deposit NOR to receive WNOR (1:1 ratio)
 * - Withdraw WNOR to receive NOR (1:1 ratio)
 * - Fully ERC-20 compatible
 * - Gas-efficient implementation
 */
contract WNOR {
    string public constant name = "Wrapped NOR";
    string public constant symbol = "WNOR";
    uint8 public constant decimals = 18;

    event Approval(address indexed src, address indexed guy, uint256 wad);
    event Transfer(address indexed src, address indexed dst, uint256 wad);
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /**
     * @notice Fallback function to wrap NOR when sent directly to contract
     */
    receive() external payable {
        deposit();
    }

    /**
     * @notice Deposit NOR and receive WNOR
     */
    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
        emit Transfer(address(0), msg.sender, msg.value);
    }

    /**
     * @notice Withdraw WNOR and receive NOR
     * @param wad Amount of WNOR to withdraw
     */
    function withdraw(uint256 wad) public {
        require(balanceOf[msg.sender] >= wad, "WNOR: Insufficient balance");
        balanceOf[msg.sender] -= wad;
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
        emit Transfer(msg.sender, address(0), wad);
    }

    /**
     * @notice Get total supply of WNOR
     * @return Total WNOR supply (equals contract's NOR balance)
     */
    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Approve spender to transfer tokens
     * @param guy Spender address
     * @param wad Amount to approve
     */
    function approve(address guy, uint256 wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    /**
     * @notice Transfer WNOR tokens
     * @param dst Recipient address
     * @param wad Amount to transfer
     */
    function transfer(address dst, uint256 wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    /**
     * @notice Transfer WNOR tokens from source to destination
     * @param src Source address
     * @param dst Destination address
     * @param wad Amount to transfer
     */
    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) public returns (bool) {
        require(balanceOf[src] >= wad, "WNOR: Insufficient balance");

        if (src != msg.sender && allowance[src][msg.sender] != type(uint256).max) {
            require(allowance[src][msg.sender] >= wad, "WNOR: Insufficient allowance");
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }
}

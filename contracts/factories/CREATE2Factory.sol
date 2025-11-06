// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CREATE2Factory
 * @notice Deploys contracts to deterministic addresses across all chains
 * @dev Uses CREATE2 opcode for same address on every chain
 */
contract CREATE2Factory {
    event Deployed(address indexed addr, bytes32 indexed salt);

    /**
     * @notice Deploy a contract using CREATE2
     * @param bytecode The contract bytecode to deploy
     * @param salt A unique salt for deterministic address
     * @return addr The deployed contract address
     */
    function deploy(bytes memory bytecode, bytes32 salt) public returns (address addr) {
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }

        emit Deployed(addr, salt);
    }

    /**
     * @notice Compute the address where a contract will be deployed
     * @param bytecode The contract bytecode
     * @param salt The salt to use
     * @return The predicted address
     */
    function computeAddress(bytes memory bytecode, bytes32 salt) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    /**
     * @notice Compute address with deployer and bytecode hash
     * @param deployer The factory address
     * @param salt The salt
     * @param bytecodeHash The keccak256 hash of bytecode
     * @return The predicted address
     */
    function computeAddressWithHash(
        address deployer,
        bytes32 salt,
        bytes32 bytecodeHash
    ) public pure returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), deployer, salt, bytecodeHash)
        );

        return address(uint160(uint256(hash)));
    }
}

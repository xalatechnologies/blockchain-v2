// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CREATE2Factory
 * @dev Factory contract for deploying contracts with deterministic addresses using CREATE2
 * This enables same contract addresses across different chains
 */
contract CREATE2Factory {
    event ContractDeployed(address indexed deployedAddress, bytes32 indexed salt);

    /**
     * @dev Deploys a contract using CREATE2
     * @param bytecode The creation bytecode of the contract to deploy
     * @param salt The salt to use for CREATE2 (determines the address)
     * @return deployedAddress The address of the deployed contract
     */
    function deploy(bytes memory bytecode, bytes32 salt) public returns (address deployedAddress) {
        assembly {
            deployedAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(deployedAddress != address(0), "CREATE2: Failed to deploy contract");

        emit ContractDeployed(deployedAddress, salt);
    }

    /**
     * @dev Computes the address of a contract deployed with CREATE2
     * @param bytecode The creation bytecode of the contract
     * @param salt The salt used for CREATE2
     * @return predictedAddress The predicted address where the contract will be deployed
     */
    function computeAddress(bytes memory bytecode, bytes32 salt) public view returns (address predictedAddress) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        predictedAddress = address(uint160(uint256(hash)));
    }

    /**
     * @dev Computes the address with a specific factory address (for cross-chain prediction)
     * @param factoryAddress The address of the CREATE2Factory on another chain
     * @param bytecode The creation bytecode of the contract
     * @param salt The salt to use
     * @return predictedAddress The predicted address
     */
    function computeAddressWithFactory(
        address factoryAddress,
        bytes memory bytecode,
        bytes32 salt
    ) public pure returns (address predictedAddress) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                factoryAddress,
                salt,
                keccak256(bytecode)
            )
        );

        predictedAddress = address(uint160(uint256(hash)));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CREATE2Factory
 * @notice Factory for deterministic contract deployment using CREATE2
 */
contract CREATE2Factory {
    event ContractDeployed(address indexed deployedAddress, bytes32 indexed salt);

    /**
     * @notice Deploy a contract using CREATE2
     * @param bytecode Contract bytecode to deploy
     * @param salt Salt for deterministic address
     * @return deployed Address of deployed contract
     */
    function deploy(bytes memory bytecode, bytes32 salt) external returns (address deployed) {
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(deployed != address(0), "CREATE2Factory: deployment failed");
        
        emit ContractDeployed(deployed, salt);
        return deployed;
    }

    /**
     * @notice Compute the address where a contract will be deployed
     * @param bytecode Contract bytecode
     * @param salt Salt for deterministic address
     * @return predicted Predicted deployment address
     */
    function computeAddress(bytes memory bytecode, bytes32 salt) external view returns (address predicted) {
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
     * @notice Check if contract is deployed at address
     * @param addr Address to check
     * @return deployed True if contract exists at address
     */
    function isDeployed(address addr) external view returns (bool deployed) {
        uint size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}

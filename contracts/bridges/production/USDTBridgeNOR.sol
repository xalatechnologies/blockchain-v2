// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IWUSDTToken {
    function mint(address to, uint256 amount, uint256 nonce) external;
    function burn(uint256 amount) external;
}

/**
 * @title USDTBridgeNor
 * @notice Mints WUSDT on Nor when USDT locked on BSC
 * @dev Receives validator signatures and mints wrapped tokens
 */
contract USDTBridgeNor is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    IWUSDTToken public immutable wusdt;

    uint256 public requiredSignatures;
    mapping(address => bool) public validators;
    address[] public validatorList;
    uint256 public validatorCount;

    mapping(uint256 => bool) public processedNonces;

    event WUSDTMinted(
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    constructor(address _wusdt, uint256 _requiredSignatures) {
        require(_wusdt != address(0), "Invalid WUSDT address");
        require(_requiredSignatures > 0, "Invalid signature requirement");

        wusdt = IWUSDTToken(_wusdt);
        requiredSignatures = _requiredSignatures;
    }

    /**
     * @notice Mint WUSDT on Nor with validator signatures
     */
    function mintWUSDT(
        address recipient,
        uint256 amount,
        uint256 nonce,
        bytes[] calldata signatures
    ) external whenNotPaused nonReentrant {
        require(!processedNonces[nonce], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        require(recipient != address(0), "Invalid recipient");

        // Create message hash
        bytes32 message = keccak256(abi.encodePacked(
            recipient,
            amount,
            nonce,
            block.chainid
        ));
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();

        // Verify signatures from validators
        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethSignedMessage.recover(signatures[i]);
            require(validators[signer], "Invalid validator");

            // Check for duplicate signatures
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            signers[i] = signer;
        }

        processedNonces[nonce] = true;

        // Mint WUSDT
        wusdt.mint(recipient, amount, nonce);

        emit WUSDTMinted(recipient, amount, nonce, block.timestamp);
    }

    // Validator management
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid address");
        require(!validators[validator], "Already validator");

        validators[validator] = true;
        validatorList.push(validator);
        validatorCount++;

        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "Not a validator");
        require(validatorCount > requiredSignatures, "Cannot remove");

        validators[validator] = false;
        validatorCount--;

        // Remove from list
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validatorList[i] == validator) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }

        emit ValidatorRemoved(validator);
    }

    function setRequiredSignatures(uint256 newRequirement) external onlyOwner {
        require(newRequirement > 0, "Invalid requirement");
        require(newRequirement <= validatorCount, "Exceeds validator count");
        requiredSignatures = newRequirement;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IWBNBToken {
    function mint(address to, uint256 amount, uint256 nonce) external;
    function burn(uint256 amount) external;
}

/**
 * @title BNBBridgeNor
 * @notice Bridge contract on Nor Chain side
 * @dev Mints WBNB when users lock BNB on BSC
 */
contract BNBBridgeNor is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    IWBNBToken public immutable wbnb;

    uint256 public requiredSignatures;

    mapping(address => bool) public validators;
    address[] public validatorList;
    uint256 public validatorCount;

    mapping(uint256 => bool) public processedNonces;
    uint256 public currentNonce;

    uint256 public totalMinted;
    uint256 public totalBurned;

    event BridgeMint(
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );

    event BridgeBurn(
        address indexed user,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    constructor(
        address _wbnb,
        uint256 _requiredSignatures
    ) {
        require(_wbnb != address(0), "Invalid token address");
        require(_requiredSignatures > 0, "Invalid signature requirement");

        wbnb = IWBNBToken(_wbnb);
        requiredSignatures = _requiredSignatures;
    }

    /**
     * @notice Mint WBNB on Nor (triggered by BSC bridge deposit)
     * @param recipient Recipient address on Nor
     * @param amount Amount to mint
     * @param nonce Unique transaction nonce from BSC
     * @param signatures Validator signatures
     */
    function mintWBNB(
        address recipient,
        uint256 amount,
        uint256 nonce,
        bytes[] calldata signatures
    ) external whenNotPaused nonReentrant {
        require(!processedNonces[nonce], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        require(recipient != address(0), "Invalid recipient");

        // Verify signatures
        bytes32 message = keccak256(abi.encodePacked(
            recipient,
            amount,
            nonce,
            block.chainid
        ));
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();

        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethSignedMessage.recover(signatures[i]);
            require(validators[signer], "Invalid validator");

            // Prevent duplicate signatures
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            signers[i] = signer;
        }

        processedNonces[nonce] = true;
        totalMinted += amount;

        // Mint WBNB to recipient
        wbnb.mint(recipient, amount, nonce);

        emit BridgeMint(recipient, amount, nonce, block.timestamp);
    }

    /**
     * @notice Burn WBNB to withdraw back to BSC
     * @param amount Amount to burn
     */
    function burnWBNB(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Invalid amount");

        totalBurned += amount;

        // Burn WBNB (user must have approved)
        wbnb.burn(amount);

        emit BridgeBurn(msg.sender, amount, currentNonce, block.timestamp);
        currentNonce++;
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

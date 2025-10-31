// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BNBBridgeMainnet
 * @notice Bridge contract for BNB on BSC Mainnet side (REVENUE GENERATOR!)
 * @dev Locks BNB on BSC mainnet for transfer to Xaheen Chain
 *
 * MONETIZATION:
 * - Charges 0.2% fee per bridge transaction
 * - Owner can withdraw accumulated fees
 * - All fees go to treasury for revenue
 */
contract BNBBridgeMainnet is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    uint256 public requiredSignatures;
    uint256 public minTransferAmount;
    uint256 public maxTransferAmount;
    uint256 public dailyLimit;
    uint256 public bridgeFeePercent; // Revenue generator!

    mapping(address => bool) public validators;
    address[] public validatorList;
    uint256 public validatorCount;

    mapping(uint256 => bool) public processedNonces;
    uint256 public currentNonce;

    mapping(address => mapping(uint256 => uint256)) public dailyTransfers;

    uint256 public totalLocked;
    uint256 public totalReleased;
    uint256 public totalFees; // Revenue tracker!

    event BridgeDeposit(
        address indexed user,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        uint256 timestamp
    );

    event BridgeWithdrawal(
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );

    event FeeCollected(uint256 amount, uint256 timestamp);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    constructor(uint256 _requiredSignatures) {
        require(_requiredSignatures > 0, "Invalid signature requirement");

        requiredSignatures = _requiredSignatures;

        // Reasonable limits for BNB
        minTransferAmount = 0.01 ether; // 0.01 BNB (~$4)
        maxTransferAmount = 10 ether;   // 10 BNB (~$4000)
        dailyLimit = 100 ether;         // 100 BNB per address per day
        bridgeFeePercent = 20;          // 0.2% fee (REVENUE!)
    }

    /**
     * @notice Lock BNB on BSC to bridge to Xaheen Chain
     * @param recipient Address on Xaheen Chain to receive WBNB
     */
    function bridgeBNB(address recipient) external payable whenNotPaused nonReentrant {
        require(msg.value >= minTransferAmount, "Amount below minimum");
        require(msg.value <= maxTransferAmount, "Amount above maximum");
        require(recipient != address(0), "Invalid recipient");

        uint256 today = block.timestamp / 1 days;
        require(
            dailyTransfers[msg.sender][today] + msg.value <= dailyLimit,
            "Daily limit exceeded"
        );

        // Calculate fee (0.2% = 20 basis points)
        uint256 fee = (msg.value * bridgeFeePercent) / 10000;
        uint256 netAmount = msg.value - fee;

        totalLocked += netAmount;
        totalFees += fee; // Track revenue!
        dailyTransfers[msg.sender][today] += msg.value;

        emit BridgeDeposit(
            msg.sender,
            recipient,
            netAmount,
            fee,
            currentNonce,
            block.timestamp
        );

        emit FeeCollected(fee, block.timestamp);

        currentNonce++;
    }

    /**
     * @notice Release BNB back to user (when bridging from Xaheen → BSC)
     * @param amount Amount to release
     * @param recipient Recipient address on BSC
     * @param nonce Unique transaction nonce
     * @param signatures Validator signatures
     */
    function releaseBNB(
        uint256 amount,
        address payable recipient,
        uint256 nonce,
        bytes[] calldata signatures
    ) external whenNotPaused nonReentrant {
        require(!processedNonces[nonce], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        require(recipient != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient balance");

        bytes32 message = keccak256(abi.encodePacked(
            amount,
            recipient,
            nonce,
            block.chainid
        ));
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();

        // Verify signatures
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
        totalReleased += amount;

        // Send BNB to recipient
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit BridgeWithdrawal(recipient, amount, nonce, block.timestamp);
    }

    /**
     * @notice Withdraw accumulated fees (REVENUE COLLECTION!)
     * @param recipient Address to receive fees
     */
    function withdrawFees(address payable recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        uint256 fees = totalFees;
        require(fees > 0, "No fees to withdraw");

        totalFees = 0;

        (bool success, ) = recipient.call{value: fees}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Emergency withdrawal of locked BNB (owner only)
     */
    function emergencyWithdraw(address payable recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        (bool success, ) = recipient.call{value: balance}("");
        require(success, "Transfer failed");
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

    function setLimits(
        uint256 _minTransferAmount,
        uint256 _maxTransferAmount,
        uint256 _dailyLimit
    ) external onlyOwner {
        minTransferAmount = _minTransferAmount;
        maxTransferAmount = _maxTransferAmount;
        dailyLimit = _dailyLimit;
    }

    function setBridgeFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 100, "Fee too high"); // Max 1%
        bridgeFeePercent = newFeePercent;
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

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Receive BNB
    receive() external payable {}
}

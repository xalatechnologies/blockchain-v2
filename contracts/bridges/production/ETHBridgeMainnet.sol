// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ETHBridgeMainnet
 * @notice Bridge ETH (ERC-20) from BSC to Xaheen Chain (REVENUE GENERATOR!)
 * @dev Locks ERC-20 ETH on BSC, mints WETH on Xaheen
 *
 * MONETIZATION: 0.2% fee on every bridge = PURE PROFIT!
 */
contract ETHBridgeMainnet is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    IERC20 public immutable ethToken; // Binance-Peg ETH Token

    uint256 public requiredSignatures;
    uint256 public minTransferAmount;
    uint256 public maxTransferAmount;
    uint256 public dailyLimit;
    uint256 public bridgeFeePercent; // REVENUE!

    mapping(address => bool) public validators;
    address[] public validatorList;
    uint256 public validatorCount;

    mapping(uint256 => bool) public processedNonces;
    uint256 public currentNonce;

    mapping(address => mapping(uint256 => uint256)) public dailyTransfers;

    uint256 public totalLocked;
    uint256 public totalReleased;
    uint256 public totalFees; // REVENUE TRACKER!

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

    constructor(address _ethToken, uint256 _requiredSignatures) {
        require(_ethToken != address(0), "Invalid token address");
        require(_requiredSignatures > 0, "Invalid signature requirement");

        ethToken = IERC20(_ethToken);
        requiredSignatures = _requiredSignatures;

        // ETH limits
        minTransferAmount = 0.005 ether;  // 0.005 ETH (~$10)
        maxTransferAmount = 5 ether;      // 5 ETH (~$10,000)
        dailyLimit = 50 ether;            // 50 ETH per address/day
        bridgeFeePercent = 20;            // 0.2% fee (REVENUE!)
    }

    /**
     * @notice Lock ETH (ERC-20) on BSC to bridge to Xaheen
     */
    function bridgeETH(address recipient, uint256 amount) external whenNotPaused nonReentrant {
        require(amount >= minTransferAmount, "Amount below minimum");
        require(amount <= maxTransferAmount, "Amount above maximum");
        require(recipient != address(0), "Invalid recipient");

        uint256 today = block.timestamp / 1 days;
        require(
            dailyTransfers[msg.sender][today] + amount <= dailyLimit,
            "Daily limit exceeded"
        );

        // Calculate fee (0.2% = 20 basis points)
        uint256 fee = (amount * bridgeFeePercent) / 10000;
        uint256 netAmount = amount - fee;

        // Transfer ETH tokens from user to bridge
        require(ethToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        totalLocked += netAmount;
        totalFees += fee; // Track revenue!
        dailyTransfers[msg.sender][today] += amount;

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
     * @notice Release ETH back to user (Xaheen → BSC withdrawal)
     */
    function releaseETH(
        uint256 amount,
        address recipient,
        uint256 nonce,
        bytes[] calldata signatures
    ) external whenNotPaused nonReentrant {
        require(!processedNonces[nonce], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        require(recipient != address(0), "Invalid recipient");

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

            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            signers[i] = signer;
        }

        processedNonces[nonce] = true;
        totalReleased += amount;

        require(ethToken.transfer(recipient, amount), "Transfer failed");

        emit BridgeWithdrawal(recipient, amount, nonce, block.timestamp);
    }

    /**
     * @notice Withdraw fees (REVENUE COLLECTION!)
     */
    function withdrawFees(address payable recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        uint256 fees = totalFees;
        require(fees > 0, "No fees to withdraw");

        totalFees = 0;

        (bool success, ) = recipient.call{value: fees}("");
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
        require(newFeePercent <= 100, "Fee too high");
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

    receive() external payable {
        revert("Use bridgeETH() function");
    }
}

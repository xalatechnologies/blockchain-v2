// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BTCBRBridgeMainnet
 * @notice Bridge contract for BSC Mainnet side
 * @dev Locks BTCBR tokens on mainnet for transfer to private chain
 * 
 * Flow: Lock tokens → Validators sign → Mint on private chain
 */
contract BTCBRBridgeMainnet is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    // BTCBR token on BSC mainnet
    IERC20 public immutable btcbr;
    
    // Bridge configuration
    uint256 public requiredSignatures;
    uint256 public minTransferAmount;
    uint256 public maxTransferAmount;
    uint256 public dailyLimit;
    uint256 public bridgeFeePercent; // in basis points (100 = 1%)
    
    // Validator management
    mapping(address => bool) public validators;
    address[] public validatorList;
    uint256 public validatorCount;
    
    // Nonce tracking to prevent replay attacks
    mapping(uint256 => bool) public processedNonces;
    uint256 public currentNonce;
    
    // Daily limit tracking
    mapping(address => mapping(uint256 => uint256)) public dailyTransfers;
    
    // Statistics
    uint256 public totalLocked;
    uint256 public totalReleased;
    uint256 public totalFees;
    
    // Events
    event Locked(
        address indexed user,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        uint256 timestamp
    );
    
    event Released(
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event RequiredSignaturesChanged(uint256 newRequirement);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    /**
     * @notice Initialize bridge with BTCBR token address
     * @param _btcbr Address of BTCBR token on BSC mainnet
     * @param _requiredSignatures Number of validator signatures required
     */
    constructor(
        address _btcbr,
        uint256 _requiredSignatures
    ) {
        require(_btcbr != address(0), "Invalid token address");
        require(_requiredSignatures > 0, "Invalid signature requirement");
        
        btcbr = IERC20(_btcbr);
        requiredSignatures = _requiredSignatures;
        
        // Default limits
        minTransferAmount = 100 * 10**18; // 100 BTCBR
        maxTransferAmount = 100_000 * 10**18; // 100,000 BTCBR
        dailyLimit = 500_000 * 10**18; // 500,000 BTCBR
        bridgeFeePercent = 10; // 0.1%
    }
    
    /**
     * @notice Lock BTCBR tokens to transfer to private chain
     * @param amount Amount of BTCBR to lock
     * @param recipient Address on private chain to receive tokens
     */
    function deposit(
        uint256 amount,
        address recipient
    ) external whenNotPaused nonReentrant {
        require(amount >= minTransferAmount, "Amount below minimum");
        require(amount <= maxTransferAmount, "Amount above maximum");
        require(recipient != address(0), "Invalid recipient");
        
        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        require(
            dailyTransfers[msg.sender][today] + amount <= dailyLimit,
            "Daily limit exceeded"
        );
        
        // Calculate fee
        uint256 fee = (amount * bridgeFeePercent) / 10000;
        uint256 netAmount = amount - fee;
        
        // Transfer tokens to bridge
        require(
            btcbr.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Update statistics
        totalLocked += netAmount;
        totalFees += fee;
        dailyTransfers[msg.sender][today] += amount;
        
        // Emit event for relayers
        emit Locked(
            msg.sender,
            recipient,
            netAmount,
            fee,
            currentNonce,
            block.timestamp
        );
        
        currentNonce++;
    }
    
    /**
     * @notice Release locked tokens when burned on private chain
     * @param amount Amount to release
     * @param recipient Address to receive tokens
     * @param nonce Unique nonce from private chain burn
     * @param signatures Array of validator signatures
     */
    function withdraw(
        uint256 amount,
        address recipient,
        uint256 nonce,
        bytes[] calldata signatures
    ) external whenNotPaused nonReentrant {
        require(!processedNonces[nonce], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        require(recipient != address(0), "Invalid recipient");
        
        // Verify signatures
        bytes32 message = keccak256(abi.encodePacked(
            amount,
            recipient,
            nonce,
            block.chainid
        ));
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();
        
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
        
        // Mark as processed
        processedNonces[nonce] = true;
        totalReleased += amount;
        
        // Transfer tokens
        require(btcbr.transfer(recipient, amount), "Transfer failed");
        
        emit Released(recipient, amount, nonce, block.timestamp);
    }
    
    /**
     * @notice Add a validator
     * @param validator Address of validator to add
     */
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid address");
        require(!validators[validator], "Already validator");
        
        validators[validator] = true;
        validatorList.push(validator);
        validatorCount++;
        
        emit ValidatorAdded(validator);
    }
    
    /**
     * @notice Remove a validator
     * @param validator Address of validator to remove
     */
    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "Not a validator");
        require(validatorCount > requiredSignatures, "Cannot remove, too few validators");
        
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
    
    /**
     * @notice Update required signature count
     * @param newRequirement New signature requirement
     */
    function setRequiredSignatures(uint256 newRequirement) external onlyOwner {
        require(newRequirement > 0, "Invalid requirement");
        require(newRequirement <= validatorCount, "Exceeds validator count");
        
        requiredSignatures = newRequirement;
        emit RequiredSignaturesChanged(newRequirement);
    }
    
    /**
     * @notice Update transfer limits
     */
    function setLimits(
        uint256 _minTransferAmount,
        uint256 _maxTransferAmount,
        uint256 _dailyLimit
    ) external onlyOwner {
        minTransferAmount = _minTransferAmount;
        maxTransferAmount = _maxTransferAmount;
        dailyLimit = _dailyLimit;
    }
    
    /**
     * @notice Update bridge fee
     * @param newFeePercent New fee in basis points
     */
    function setBridgeFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 100, "Fee too high"); // Max 1%
        bridgeFeePercent = newFeePercent;
    }
    
    /**
     * @notice Withdraw collected fees
     * @param recipient Address to receive fees
     */
    function withdrawFees(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        uint256 fees = totalFees;
        totalFees = 0;
        
        require(btcbr.transfer(recipient, fees), "Transfer failed");
        emit FeesWithdrawn(recipient, fees);
    }
    
    /**
     * @notice Pause bridge operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause bridge operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Get list of all validators
     */
    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }
    
    /**
     * @notice Check if nonce has been processed
     */
    function isNonceProcessed(uint256 nonce) external view returns (bool) {
        return processedNonces[nonce];
    }
}

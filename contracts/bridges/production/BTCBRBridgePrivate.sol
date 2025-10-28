// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IMintableBTCBR {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

/**
 * @title BTCBRBridgePrivate
 * @notice Bridge contract for Private BSC Chain side
 * @dev Mints BTCBR when locked on mainnet, burns when withdrawing
 * 
 * Flow: Validators sign → Mint tokens | Burn tokens → Validators sign
 */
contract BTCBRBridgePrivate is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    IMintableBTCBR public immutable btcbr;
    
    uint256 public requiredSignatures;
    uint256 public minTransferAmount;
    uint256 public maxTransferAmount;
    uint256 public dailyLimit;
    
    mapping(address => bool) public validators;
    address[] public validatorList;
    uint256 public validatorCount;
    
    mapping(uint256 => bool) public processedNonces;
    uint256 public currentNonce;
    
    mapping(address => mapping(uint256 => uint256)) public dailyTransfers;
    
    uint256 public totalMinted;
    uint256 public totalBurned;
    
    event Minted(
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );
    
    event Burned(
        address indexed user,
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    
    constructor(
        address _btcbr,
        uint256 _requiredSignatures
    ) {
        require(_btcbr != address(0), "Invalid token address");
        require(_requiredSignatures > 0, "Invalid signature requirement");
        
        btcbr = IMintableBTCBR(_btcbr);
        requiredSignatures = _requiredSignatures;
        
        minTransferAmount = 100 * 10**18;
        maxTransferAmount = 100_000 * 10**18;
        dailyLimit = 500_000 * 10**18;
    }
    
    function mint(
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
        totalMinted += amount;
        
        btcbr.mint(recipient, amount);
        
        emit Minted(recipient, amount, nonce, block.timestamp);
    }
    
    function burn(uint256 amount, address recipient) external whenNotPaused nonReentrant {
        require(amount >= minTransferAmount, "Amount below minimum");
        require(amount <= maxTransferAmount, "Amount above maximum");
        require(recipient != address(0), "Invalid recipient");
        
        uint256 today = block.timestamp / 1 days;
        require(
            dailyTransfers[msg.sender][today] + amount <= dailyLimit,
            "Daily limit exceeded"
        );
        
        btcbr.burn(msg.sender, amount);
        
        totalBurned += amount;
        dailyTransfers[msg.sender][today] += amount;
        
        emit Burned(msg.sender, recipient, amount, currentNonce, block.timestamp);
        
        currentNonce++;
    }
    
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

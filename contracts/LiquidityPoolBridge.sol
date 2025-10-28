// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title LiquidityPoolBridge
 * @notice Liquidity pool-based bridge for fast token transfers
 * @dev Maintains liquidity pools on both chains, swaps instead of mint/burn
 * 
 * Liquidity providers deposit on both chains and earn fees
 */
contract LiquidityPoolBridge is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    IERC20 public immutable btcbr;
    
    // Pool state
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidityProviders;
    
    // Fee configuration (basis points)
    uint256 public transferFee = 30; // 0.3%
    uint256 public lpFeeShare = 25; // 0.25% to LPs
    uint256 public protocolFeeShare = 5; // 0.05% to protocol
    
    uint256 public accumulatedFees;
    uint256 public lpRewards;
    
    // Transfer limits
    uint256 public minTransfer = 10 * 10**18;
    uint256 public maxTransfer = 1_000_000 * 10**18;
    
    // Cross-chain transfer tracking
    mapping(uint256 => bool) public processedNonces;
    mapping(address => bool) public validators;
    uint256 public requiredSignatures = 2;
    
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event TransferInitiated(address indexed from, address indexed to, uint256 amount, uint256 fee, uint256 nonce);
    event TransferCompleted(address indexed to, uint256 amount, uint256 nonce);
    event FeesCollected(uint256 lpFees, uint256 protocolFees);
    
    constructor(address _btcbr) {
        require(_btcbr != address(0), "Invalid token");
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Add liquidity to pool
     */
    function addLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        liquidityProviders[msg.sender] += amount;
        totalLiquidity += amount;
        
        emit LiquidityAdded(msg.sender, amount);
    }
    
    /**
     * @notice Remove liquidity from pool
     */
    function removeLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(liquidityProviders[msg.sender] >= amount, "Insufficient liquidity");
        require(totalLiquidity - amount >= minTransfer * 10, "Would drain pool");
        
        // Calculate LP's share of accumulated rewards
        uint256 share = (lpRewards * amount) / totalLiquidity;
        
        liquidityProviders[msg.sender] -= amount;
        totalLiquidity -= amount;
        lpRewards -= share;
        
        require(btcbr.transfer(msg.sender, amount + share), "Transfer failed");
        
        emit LiquidityRemoved(msg.sender, amount + share);
    }
    
    /**
     * @notice Initiate cross-chain transfer
     */
    function transfer(address recipient, uint256 amount) external nonReentrant returns (uint256 nonce) {
        require(amount >= minTransfer, "Below minimum");
        require(amount <= maxTransfer, "Above maximum");
        require(recipient != address(0), "Invalid recipient");
        
        // Calculate fees
        uint256 fee = (amount * transferFee) / 10000;
        uint256 lpFee = (amount * lpFeeShare) / 10000;
        uint256 protocolFee = fee - lpFee;
        uint256 netAmount = amount - fee;
        
        // Check pool liquidity
        require(totalLiquidity >= netAmount, "Insufficient pool liquidity");
        
        // Transfer from user
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Distribute fees
        lpRewards += lpFee;
        accumulatedFees += protocolFee;
        totalLiquidity += netAmount;
        
        nonce = uint256(keccak256(abi.encodePacked(msg.sender, recipient, amount, block.timestamp)));
        
        emit TransferInitiated(msg.sender, recipient, netAmount, fee, nonce);
        return nonce;
    }
    
    /**
     * @notice Complete transfer (called by validators)
     */
    function completeTransfer(
        address recipient,
        uint256 amount,
        uint256 nonce,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(!processedNonces[nonce], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        
        // Verify signatures
        bytes32 message = keccak256(abi.encodePacked(recipient, amount, nonce, block.chainid));
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
        totalLiquidity -= amount;
        
        require(btcbr.transfer(recipient, amount), "Transfer failed");
        
        emit TransferCompleted(recipient, amount, nonce);
    }
    
    /**
     * @notice Get LP rewards for address
     */
    function calculateRewards(address provider) external view returns (uint256) {
        if (totalLiquidity == 0) return 0;
        return (lpRewards * liquidityProviders[provider]) / totalLiquidity;
    }
    
    /**
     * @notice Withdraw protocol fees
     */
    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        accumulatedFees = 0;
        require(btcbr.transfer(owner(), fees), "Transfer failed");
    }
    
    function addValidator(address validator) external onlyOwner {
        validators[validator] = true;
    }
    
    function removeValidator(address validator) external onlyOwner {
        validators[validator] = false;
    }
    
    function setFees(uint256 _transferFee, uint256 _lpFeeShare) external onlyOwner {
        require(_transferFee <= 100, "Fee too high"); // Max 1%
        require(_lpFeeShare <= _transferFee, "LP fee exceeds total");
        transferFee = _transferFee;
        lpFeeShare = _lpFeeShare;
        protocolFeeShare = _transferFee - _lpFeeShare;
    }
}

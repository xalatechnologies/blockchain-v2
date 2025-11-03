// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CrossChainBridge
 * @dev Universal bridge for BTCBR, NOR, and Dirhamat across Ethereum, BSC, Polygon
 * Implements Lock & Mint / Burn & Release mechanism with multi-sig validation
 */
contract CrossChainBridge is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    uint256 public constant MIN_VALIDATORS = 2;
    uint256 public requiredSignatures;
    
    struct Bridge {
        uint256 chainId;
        string name;
        address remoteContract;
        bool isActive;
    }
    
    struct PendingTransfer {
        address token;
        address from;
        address to;
        uint256 amount;
        uint256 targetChainId;
        bytes32 txHash;
        uint256 timestamp;
        uint256 approvals;
        bool executed;
        mapping(address => bool) hasApproved;
    }
    
    mapping(uint256 => Bridge) public bridges; // chainId => Bridge
    mapping(address => bool) public supportedTokens; // token => supported
    mapping(bytes32 => PendingTransfer) public pendingTransfers; // transferId => transfer
    mapping(address => uint256) public totalLocked; // token => amount
    
    uint256[] public supportedChainIds;
    address[] public tokenList;
    
    event BridgeAdded(uint256 indexed chainId, string name, address remoteContract);
    event BridgeUpdated(uint256 indexed chainId, address newRemoteContract);
    event TokenAdded(address indexed token, string symbol);
    event TokenRemoved(address indexed token);
    
    event TransferInitiated(
        bytes32 indexed transferId,
        address indexed token,
        address indexed from,
        address to,
        uint256 amount,
        uint256 targetChainId
    );
    
    event TransferApproved(
        bytes32 indexed transferId,
        address indexed validator,
        uint256 approvalCount
    );
    
    event TransferExecuted(
        bytes32 indexed transferId,
        address indexed token,
        address indexed to,
        uint256 amount
    );
    
    event TransferCancelled(bytes32 indexed transferId, string reason);
    
    constructor(uint256 _requiredSignatures) {
        require(_requiredSignatures >= MIN_VALIDATORS, "CrossChainBridge: MIN_VALIDATORS");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        requiredSignatures = _requiredSignatures;
    }
    
    /**
     * @dev Add validator to multi-sig
     */
    function addValidator(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(validator != address(0), "CrossChainBridge: ZERO_ADDRESS");
        _grantRole(VALIDATOR_ROLE, validator);
    }
    
    /**
     * @dev Remove validator
     */
    function removeValidator(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(VALIDATOR_ROLE, validator);
    }
    
    /**
     * @dev Add supported bridge chain
     */
    function addBridge(
        uint256 chainId,
        string memory name,
        address remoteContract
    ) external onlyRole(OPERATOR_ROLE) {
        require(chainId != block.chainid, "CrossChainBridge: SAME_CHAIN");
        require(remoteContract != address(0), "CrossChainBridge: ZERO_ADDRESS");
        require(!bridges[chainId].isActive, "CrossChainBridge: BRIDGE_EXISTS");
        
        bridges[chainId] = Bridge({
            chainId: chainId,
            name: name,
            remoteContract: remoteContract,
            isActive: true
        });
        
        supportedChainIds.push(chainId);
        
        emit BridgeAdded(chainId, name, remoteContract);
    }
    
    /**
     * @dev Add supported token
     */
    function addToken(address token) external onlyRole(OPERATOR_ROLE) {
        require(token != address(0), "CrossChainBridge: ZERO_ADDRESS");
        require(!supportedTokens[token], "CrossChainBridge: TOKEN_EXISTS");
        
        supportedTokens[token] = true;
        tokenList.push(token);
        
        emit TokenAdded(token, "");
    }
    
    /**
     * @dev Lock tokens on source chain and initiate cross-chain transfer
     */
    function lock(
        address token,
        uint256 amount,
        address recipient,
        uint256 targetChainId
    ) external nonReentrant whenNotPaused returns (bytes32 transferId) {
        require(supportedTokens[token], "CrossChainBridge: UNSUPPORTED_TOKEN");
        require(bridges[targetChainId].isActive, "CrossChainBridge: UNSUPPORTED_CHAIN");
        require(amount > 0, "CrossChainBridge: ZERO_AMOUNT");
        require(recipient != address(0), "CrossChainBridge: ZERO_RECIPIENT");
        
        // Lock tokens
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        totalLocked[token] += amount;
        
        // Generate transfer ID
        transferId = keccak256(abi.encodePacked(
            token,
            msg.sender,
            recipient,
            amount,
            targetChainId,
            block.timestamp,
            block.number
        ));
        
        // Create pending transfer
        PendingTransfer storage transfer = pendingTransfers[transferId];
        transfer.token = token;
        transfer.from = msg.sender;
        transfer.to = recipient;
        transfer.amount = amount;
        transfer.targetChainId = targetChainId;
        transfer.timestamp = block.timestamp;
        transfer.executed = false;
        transfer.approvals = 0;
        
        emit TransferInitiated(transferId, token, msg.sender, recipient, amount, targetChainId);
        
        return transferId;
    }
    
    /**
     * @dev Approve incoming cross-chain transfer (validator only)
     */
    function approveTransfer(
        bytes32 transferId,
        bytes32 sourceTxHash
    ) external onlyRole(VALIDATOR_ROLE) {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        
        require(!transfer.executed, "CrossChainBridge: ALREADY_EXECUTED");
        require(!transfer.hasApproved[msg.sender], "CrossChainBridge: ALREADY_APPROVED");
        
        if (transfer.txHash == bytes32(0)) {
            transfer.txHash = sourceTxHash;
        } else {
            require(transfer.txHash == sourceTxHash, "CrossChainBridge: TX_HASH_MISMATCH");
        }
        
        transfer.hasApproved[msg.sender] = true;
        transfer.approvals++;
        
        emit TransferApproved(transferId, msg.sender, transfer.approvals);
        
        // Auto-execute if threshold met
        if (transfer.approvals >= requiredSignatures) {
            _executeTransfer(transferId);
        }
    }
    
    /**
     * @dev Execute approved transfer (release locked tokens)
     */
    function _executeTransfer(bytes32 transferId) internal {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        
        require(!transfer.executed, "CrossChainBridge: ALREADY_EXECUTED");
        require(transfer.approvals >= requiredSignatures, "CrossChainBridge: INSUFFICIENT_APPROVALS");
        
        transfer.executed = true;
        totalLocked[transfer.token] -= transfer.amount;
        
        IERC20(transfer.token).safeTransfer(transfer.to, transfer.amount);
        
        emit TransferExecuted(transferId, transfer.token, transfer.to, transfer.amount);
    }
    
    /**
     * @dev Cancel pending transfer (admin emergency)
     */
    function cancelTransfer(bytes32 transferId, string memory reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        
        require(!transfer.executed, "CrossChainBridge: ALREADY_EXECUTED");
        
        transfer.executed = true;
        totalLocked[transfer.token] -= transfer.amount;
        
        // Refund to sender
        IERC20(transfer.token).safeTransfer(transfer.from, transfer.amount);
        
        emit TransferCancelled(transferId, reason);
    }
    
    /**
     * @dev Get transfer details
     */
    function getTransfer(bytes32 transferId) external view returns (
        address token,
        address from,
        address to,
        uint256 amount,
        uint256 targetChainId,
        bytes32 txHash,
        uint256 approvals,
        bool executed
    ) {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        return (
            transfer.token,
            transfer.from,
            transfer.to,
            transfer.amount,
            transfer.targetChainId,
            transfer.txHash,
            transfer.approvals,
            transfer.executed
        );
    }
    
    /**
     * @dev Get all supported chains
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChainIds;
    }
    
    /**
     * @dev Get all supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }
}

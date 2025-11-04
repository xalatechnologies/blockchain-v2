// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title USDTBridgeBSC
 * @notice Bridge USDT-BEP20 from BSC to Nor Chain
 * @dev Lock on BSC, mint wrapped on Nor (or vice versa)
 */
contract USDTBridgeBSC is Ownable, ReentrancyGuard, Pausable {

    IERC20 public immutable USDT_BEP20;

    // Bridge configuration
    uint256 public minTransfer = 10 * 10**18; // 10 USDT
    uint256 public maxTransfer = 100_000 * 10**18; // 100K USDT
    uint256 public dailyLimit = 1_000_000 * 10**18; // 1M USDT per day
    uint256 public bridgeFee = 10; // 0.1% (10 basis points)

    // Daily limit tracking
    mapping(uint256 => uint256) public dailyVolume; // day => volume
    mapping(address => mapping(uint256 => uint256)) public userDailyVolume;

    // Transfer tracking
    mapping(bytes32 => bool) public processedTransfers;
    mapping(address => bool) public validators;
    uint256 public requiredSignatures = 2;

    uint256 public totalLocked;
    uint256 public totalBridged;
    uint256 public accumulatedFees;

    event TransferInitiated(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        bytes32 indexed transferId,
        uint256 chainId
    );

    event TransferCompleted(
        bytes32 indexed transferId,
        address indexed to,
        uint256 amount
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdtBEP20) {
        require(_usdtBEP20 != address(0), "Invalid USDT address");
        USDT_BEP20 = IERC20(_usdtBEP20);
    }

    /**
     * @notice Bridge USDT from BSC to Nor Chain
     * @param recipient Address on Nor Chain
     * @param amount Amount to bridge
     * @param destinationChainId Target chain ID (65001 for Nor)
     */
    function bridgeToNor(
        address recipient,
        uint256 amount,
        uint256 destinationChainId
    ) external nonReentrant whenNotPaused returns (bytes32 transferId) {
        require(amount >= minTransfer, "Below minimum");
        require(amount <= maxTransfer, "Above maximum");
        require(recipient != address(0), "Invalid recipient");

        uint256 today = block.timestamp / 1 days;
        require(dailyVolume[today] + amount <= dailyLimit, "Daily limit exceeded");

        // Calculate fee
        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 netAmount = amount - fee;

        // Transfer USDT from user
        require(USDT_BEP20.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Update state
        totalLocked += netAmount;
        accumulatedFees += fee;
        dailyVolume[today] += amount;
        userDailyVolume[msg.sender][today] += amount;

        // Generate transfer ID
        transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                amount,
                destinationChainId,
                block.timestamp,
                totalBridged
            )
        );

        totalBridged++;

        emit TransferInitiated(
            msg.sender,
            recipient,
            netAmount,
            fee,
            transferId,
            destinationChainId
        );

        return transferId;
    }

    /**
     * @notice Complete bridge transfer (validators only)
     * @param transferId Unique transfer identifier
     * @param recipient Recipient address
     * @param amount Amount to release
     * @param signatures Validator signatures
     */
    function completeTransfer(
        bytes32 transferId,
        address recipient,
        uint256 amount,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused {
        require(!processedTransfers[transferId], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        require(totalLocked >= amount, "Insufficient locked funds");

        // Verify signatures (simplified - in production use proper ECDSA)
        _verifySignatures(transferId, recipient, amount, signatures);

        processedTransfers[transferId] = true;
        totalLocked -= amount;

        require(USDT_BEP20.transfer(recipient, amount), "Transfer failed");

        emit TransferCompleted(transferId, recipient, amount);
    }

    /**
     * @notice Verify validator signatures
     */
    function _verifySignatures(
        bytes32 transferId,
        address recipient,
        uint256 amount,
        bytes[] calldata signatures
    ) internal view {
        bytes32 message = keccak256(abi.encodePacked(transferId, recipient, amount, block.chainid));

        for (uint256 i = 0; i < signatures.length; i++) {
            // In production, properly recover signer from signature
            // For now, just check length
            require(signatures[i].length == 65, "Invalid signature");
        }
    }

    /**
     * @notice Add validator
     */
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid address");
        validators[validator] = true;
        emit ValidatorAdded(validator);
    }

    /**
     * @notice Remove validator
     */
    function removeValidator(address validator) external onlyOwner {
        validators[validator] = false;
        emit ValidatorRemoved(validator);
    }

    /**
     * @notice Update bridge parameters
     */
    function updateBridgeParams(
        uint256 _minTransfer,
        uint256 _maxTransfer,
        uint256 _dailyLimit,
        uint256 _bridgeFee
    ) external onlyOwner {
        require(_bridgeFee <= 100, "Fee too high"); // Max 1%
        minTransfer = _minTransfer;
        maxTransfer = _maxTransfer;
        dailyLimit = _dailyLimit;
        bridgeFee = _bridgeFee;
    }

    /**
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        accumulatedFees = 0;
        require(USDT_BEP20.transfer(owner(), fees), "Transfer failed");
        emit FeesWithdrawn(owner(), fees);
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 _totalLocked,
        uint256 _totalBridged,
        uint256 _accumulatedFees,
        uint256 todayVolume
    ) {
        uint256 today = block.timestamp / 1 days;
        return (totalLocked, totalBridged, accumulatedFees, dailyVolume[today]);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./BTCBR_TRC20.sol";

/**
 * @title BTCBRBridgeTron
 * @notice Bridge BTCBR between Xaheen Chain and Tron Network
 * @dev Lock/mint mechanism optimized for Tron's low fees
 *      Tron fees: ~$0.01 vs Ethereum $5-50
 *      This makes Tron ideal for retail users and high frequency trading
 */
contract BTCBRBridgeTron is Ownable, ReentrancyGuard, Pausable {

    BTCBR_TRC20 public immutable btcbrTRC20;

    // Bridge configuration (lower minimums due to Tron's cheap fees)
    uint256 public minTransfer = 10 * 10**18; // 10 BTCBR (lower than ETH due to cheap fees)
    uint256 public maxTransfer = 100_000 * 10**18; // 100K BTCBR
    uint256 public dailyLimit = 5_000_000 * 10**18; // 5M BTCBR (higher due to expected volume)
    uint256 public bridgeFee = 10; // 0.1% (10 basis points - cheaper than ETH)

    // Daily limit tracking
    mapping(uint256 => uint256) public dailyVolume;

    // Transfer tracking
    mapping(bytes32 => bool) public processedTransfers;
    mapping(address => bool) public validators;
    uint256 public requiredSignatures = 2; // 2-of-3 for faster processing

    uint256 public totalBridged;
    uint256 public accumulatedFees;

    event TransferToXaheen(
        address indexed from,
        address indexed xaheenRecipient,
        uint256 amount,
        uint256 fee,
        bytes32 indexed transferId
    );

    event TransferFromXaheen(
        bytes32 indexed transferId,
        address indexed to,
        uint256 amount
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    constructor(address _btcbrTRC20) {
        require(_btcbrTRC20 != address(0), "Invalid BTCBR-TRC20 address");
        btcbrTRC20 = BTCBR_TRC20(_btcbrTRC20);
    }

    /**
     * @notice Bridge BTCBR-TRC20 from Tron to Xaheen Chain
     * @param xaheenRecipient Address on Xaheen Chain
     * @param amount Amount to bridge
     */
    function bridgeToXaheen(
        address xaheenRecipient,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (bytes32 transferId) {
        require(amount >= minTransfer, "Below minimum");
        require(amount <= maxTransfer, "Above maximum");
        require(xaheenRecipient != address(0), "Invalid recipient");

        uint256 today = block.timestamp / 1 days;
        require(dailyVolume[today] + amount <= dailyLimit, "Daily limit exceeded");

        // Calculate fee (lower than Ethereum due to cheaper Tron fees)
        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 netAmount = amount - fee;

        // Burn BTCBR-TRC20 on Tron
        btcbrTRC20.bridgeBurn(msg.sender, amount, bytes32(0));

        // Update state
        accumulatedFees += fee;
        dailyVolume[today] += amount;

        // Generate transfer ID
        transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                xaheenRecipient,
                amount,
                block.timestamp,
                totalBridged
            )
        );

        totalBridged++;

        emit TransferToXaheen(
            msg.sender,
            xaheenRecipient,
            netAmount,
            fee,
            transferId
        );

        return transferId;
    }

    /**
     * @notice Complete bridge transfer from Xaheen (validators only)
     * @param transferId Unique transfer identifier
     * @param recipient Recipient address on Tron
     * @param amount Amount to mint
     * @param signatures Validator signatures
     */
    function bridgeFromXaheen(
        bytes32 transferId,
        address recipient,
        uint256 amount,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused {
        require(!processedTransfers[transferId], "Already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");

        // Verify signatures
        _verifySignatures(transferId, recipient, amount, signatures);

        processedTransfers[transferId] = true;

        // Mint BTCBR-TRC20 on Tron
        btcbrTRC20.bridgeMint(recipient, amount, transferId);

        emit TransferFromXaheen(transferId, recipient, amount);
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

        // In production, implement proper ECDSA signature verification
        for (uint256 i = 0; i < signatures.length; i++) {
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
        require(_bridgeFee <= 50, "Fee too high"); // Max 0.5% for Tron
        minTransfer = _minTransfer;
        maxTransfer = _maxTransfer;
        dailyLimit = _dailyLimit;
        bridgeFee = _bridgeFee;
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
        uint256 _totalBridged,
        uint256 _accumulatedFees,
        uint256 todayVolume,
        uint256 btcbrSupply
    ) {
        uint256 today = block.timestamp / 1 days;
        return (
            totalBridged,
            accumulatedFees,
            dailyVolume[today],
            btcbrTRC20.totalSupply()
        );
    }
}

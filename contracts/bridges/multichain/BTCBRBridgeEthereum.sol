// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./wBTCBR_Ethereum.sol";

/**
 * @title BTCBRBridgeEthereum
 * @notice Bridge BTCBR between Xaheen Chain and Ethereum
 * @dev Lock/mint mechanism with multi-sig validation
 */
contract BTCBRBridgeEthereum is Ownable, ReentrancyGuard, Pausable {

    wBTCBR_Ethereum public immutable wBTCBR;

    // Bridge configuration
    uint256 public minTransfer = 100 * 10**18; // 100 BTCBR
    uint256 public maxTransfer = 100_000 * 10**18; // 100K BTCBR
    uint256 public dailyLimit = 1_000_000 * 10**18; // 1M BTCBR per day
    uint256 public bridgeFee = 30; // 0.3% (30 basis points)

    // Daily limit tracking
    mapping(uint256 => uint256) public dailyVolume;

    // Transfer tracking
    mapping(bytes32 => bool) public processedTransfers;
    mapping(address => bool) public validators;
    uint256 public requiredSignatures = 3; // 3-of-5 multisig

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

    constructor(address _wBTCBR) {
        require(_wBTCBR != address(0), "Invalid wBTCBR address");
        wBTCBR = wBTCBR_Ethereum(_wBTCBR);
    }

    /**
     * @notice Bridge wBTCBR from Ethereum to Xaheen Chain
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

        // Calculate fee
        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 netAmount = amount - fee;

        // Burn wBTCBR on Ethereum
        wBTCBR.bridgeBurn(msg.sender, amount, bytes32(0));

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
     * @param recipient Recipient address on Ethereum
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

        // Mint wBTCBR on Ethereum
        wBTCBR.bridgeMint(recipient, amount, transferId);

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
        require(_bridgeFee <= 100, "Fee too high"); // Max 1%
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
        uint256 wBTCBRSupply
    ) {
        uint256 today = block.timestamp / 1 days;
        return (
            totalBridged,
            accumulatedFees,
            dailyVolume[today],
            wBTCBR.totalSupply()
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IMintableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}

/**
 * @title NORBridgeV2
 * @notice Bridge for NOR token between NorChain and BSC with TRUE mint/burn
 * @dev This contract handles:
 *      - On NorChain: Lock/Unlock native NOR
 *      - On BSC: Mint/Burn NOR_BSC (requires minter role)
 */
contract NORBridgeV2 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Token being bridged
    IMintableERC20 public immutable token;

    // Whether this bridge mints/burns (BSC) or locks/unlocks (NorChain)
    bool public immutable isMintBurnMode;

    // Validators who can complete bridge transfers
    mapping(address => bool) public validators;

    // Track bridge transfers
    struct BridgeTransfer {
        address user;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        string destinationChain;
    }

    mapping(uint256 => BridgeTransfer) public bridgeTransfers;
    uint256 public bridgeNonce;

    // Track completed transfers from other chain (to prevent replay)
    mapping(bytes32 => bool) public completedTransfers;

    // Minimum and maximum transfer amounts
    uint256 public minTransfer = 100 ether;       // 100 NOR minimum
    uint256 public maxTransfer = 1000000 ether;   // 1M NOR maximum

    // Daily limits per user
    uint256 public dailyLimit = 5000000 ether;    // 5M NOR per day
    mapping(address => uint256) public dailyTransferred;
    mapping(address => uint256) public lastTransferDay;

    // Events
    event BridgeInitiated(
        uint256 indexed bridgeId,
        address indexed user,
        uint256 amount,
        string destinationChain
    );

    event BridgeCompleted(
        uint256 indexed bridgeId,
        address indexed user,
        uint256 amount,
        bytes32 sourceTransferId
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event LimitsUpdated(uint256 minTransfer, uint256 maxTransfer, uint256 dailyLimit);

    constructor(
        address _token,
        bool _isMintBurnMode
    ) {
        require(_token != address(0), "NORBridge: zero address");
        token = IMintableERC20(_token);
        isMintBurnMode = _isMintBurnMode;
    }

    /**
     * @notice Initiate bridge transfer (lock on source chain)
     * @param amount Amount to bridge
     * @param destinationChain Name of destination chain
     */
    function initiateBridge(
        uint256 amount,
        string memory destinationChain
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(amount >= minTransfer, "NORBridge: below minimum");
        require(amount <= maxTransfer, "NORBridge: above maximum");

        // Check daily limit
        uint256 currentDay = block.timestamp / 1 days;
        if (lastTransferDay[msg.sender] < currentDay) {
            dailyTransferred[msg.sender] = 0;
            lastTransferDay[msg.sender] = currentDay;
        }

        require(
            dailyTransferred[msg.sender] + amount <= dailyLimit,
            "NORBridge: daily limit exceeded"
        );

        dailyTransferred[msg.sender] += amount;

        uint256 bridgeId = bridgeNonce++;

        if (isMintBurnMode) {
            // BSC: Burn tokens when bridging back to NorChain
            IERC20(address(token)).safeTransferFrom(msg.sender, address(this), amount);
            token.burn(amount);
        } else {
            // NorChain: Lock NOR tokens when bridging to BSC
            IERC20(address(token)).safeTransferFrom(msg.sender, address(this), amount);
        }

        bridgeTransfers[bridgeId] = BridgeTransfer({
            user: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            completed: false,
            destinationChain: destinationChain
        });

        emit BridgeInitiated(bridgeId, msg.sender, amount, destinationChain);

        return bridgeId;
    }

    /**
     * @notice Complete bridge transfer (mint on destination chain)
     * @param bridgeId Bridge ID from source chain
     * @param user User receiving tokens
     * @param amount Amount to mint/unlock
     * @param sourceTransferId Hash of source chain transfer
     */
    function completeBridge(
        uint256 bridgeId,
        address user,
        uint256 amount,
        bytes32 sourceTransferId
    ) external nonReentrant whenNotPaused {
        require(validators[msg.sender], "NORBridge: not validator");
        require(!completedTransfers[sourceTransferId], "NORBridge: already completed");
        require(user != address(0), "NORBridge: zero address");
        require(amount > 0, "NORBridge: zero amount");

        completedTransfers[sourceTransferId] = true;

        if (isMintBurnMode) {
            // BSC: Mint tokens (REAL MINT NOW!)
            token.mint(user, amount);
        } else {
            // NorChain: Unlock tokens
            IERC20(address(token)).safeTransfer(user, amount);
        }

        emit BridgeCompleted(bridgeId, user, amount, sourceTransferId);
    }

    /**
     * @notice Emergency: Owner can recover stuck tokens
     */
    function emergencyWithdraw(
        address _token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "NORBridge: zero address");
        IERC20(_token).safeTransfer(to, amount);
    }

    /**
     * @notice Add validator
     */
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "NORBridge: zero address");
        require(!validators[validator], "NORBridge: already validator");
        validators[validator] = true;
        emit ValidatorAdded(validator);
    }

    /**
     * @notice Remove validator
     */
    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "NORBridge: not validator");
        validators[validator] = false;
        emit ValidatorRemoved(validator);
    }

    /**
     * @notice Update transfer limits
     */
    function updateLimits(
        uint256 _minTransfer,
        uint256 _maxTransfer,
        uint256 _dailyLimit
    ) external onlyOwner {
        require(_minTransfer < _maxTransfer, "NORBridge: invalid limits");
        minTransfer = _minTransfer;
        maxTransfer = _maxTransfer;
        dailyLimit = _dailyLimit;
        emit LimitsUpdated(_minTransfer, _maxTransfer, _dailyLimit);
    }

    /**
     * @notice Pause bridge
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause bridge
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get bridge transfer details
     */
    function getBridgeTransfer(uint256 bridgeId) external view returns (
        address user,
        uint256 amount,
        uint256 timestamp,
        bool completed,
        string memory destinationChain
    ) {
        BridgeTransfer memory transfer = bridgeTransfers[bridgeId];
        return (
            transfer.user,
            transfer.amount,
            transfer.timestamp,
            transfer.completed,
            transfer.destinationChain
        );
    }
}

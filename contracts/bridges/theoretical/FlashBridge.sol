// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FlashBridge
 * @notice Instant cross-chain transfers using flash loans and arbitrage
 * @dev EXPERIMENTAL: Uses economic incentives instead of validators
 * 
 * Concept: Arbitrageurs provide instant liquidity, earn fees + arbitrage
 * WARNING: Legally questionable - may enable wash trading
 */
contract FlashBridge is ReentrancyGuard {
    
    IERC20 public immutable btcbr;
    
    struct TransferRequest {
        address user;
        uint256 amount;
        address destinationChain;
        uint256 fee;
        uint256 timestamp;
        bool filled;
    }
    
    mapping(bytes32 => TransferRequest) public requests;
    mapping(address => uint256) public arbitrageurRewards;
    
    uint256 public minFee = 50; // 0.5% minimum
    
    event TransferRequested(bytes32 indexed requestId, address user, uint256 amount, uint256 fee);
    event TransferFilled(bytes32 indexed requestId, address arbitrageur);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Request instant transfer
     * User pays premium fee for instant execution
     */
    function requestTransfer(
        uint256 amount,
        address destinationChain,
        uint256 feePercent
    ) external nonReentrant returns (bytes32 requestId) {
        require(feePercent >= minFee, "Fee too low");
        
        uint256 fee = (amount * feePercent) / 10000;
        
        require(btcbr.transferFrom(msg.sender, address(this), amount + fee), "Transfer failed");
        
        requestId = keccak256(abi.encodePacked(msg.sender, amount, destinationChain, block.timestamp));
        
        requests[requestId] = TransferRequest({
            user: msg.sender,
            amount: amount,
            destinationChain: destinationChain,
            fee: fee,
            timestamp: block.timestamp,
            filled: false
        });
        
        emit TransferRequested(requestId, msg.sender, amount, fee);
    }
    
    /**
     * @notice Fill transfer (arbitrageurs provide instant liquidity)
     * They get fee + can arbitrage price differences
     */
    function fillTransfer(bytes32 requestId, bytes calldata proof) external nonReentrant {
        TransferRequest storage request = requests[requestId];
        require(!request.filled, "Already filled");
        require(block.timestamp < request.timestamp + 1 hours, "Expired");
        
        // Verify they sent tokens on destination chain (simplified)
        require(_verifyDestinationTransfer(proof), "Invalid proof");
        
        request.filled = true;
        
        // Send amount + fee to arbitrageur
        require(btcbr.transfer(msg.sender, request.amount + request.fee), "Transfer failed");
        
        emit TransferFilled(requestId, msg.sender);
    }
    
    function _verifyDestinationTransfer(bytes calldata) internal pure returns (bool) {
        // Would verify merkle proof of destination chain transfer
        return true; // Placeholder
    }
}

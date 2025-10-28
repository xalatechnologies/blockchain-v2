// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OracleBridge
 * @notice Chainlink oracle-based bridge for price-adjusted transfers
 * @dev Transfers maintain USD value across chains using oracle prices
 * 
 * Example: Lock $1000 worth of BTCBR, receive $1000 worth on destination
 * WARNING: Requires reliable price oracles
 */
contract OracleBridge is Ownable {
    
    IERC20 public immutable btcbr;
    
    // Mock oracle interface
    interface IPriceOracle {
        function getPrice() external view returns (uint256);
    }
    
    IPriceOracle public mainnetOracle;
    IPriceOracle public privateOracle;
    
    struct PendingTransfer {
        address user;
        uint256 amount;
        uint256 usdValue;
        uint256 timestamp;
        bool completed;
    }
    
    mapping(bytes32 => PendingTransfer) public transfers;
    
    event TransferInitiated(bytes32 indexed transferId, uint256 amount, uint256 usdValue);
    event TransferCompleted(bytes32 indexed transferId, uint256 receivedAmount);
    
    constructor(address _btcbr, address _mainnetOracle, address _privateOracle) {
        btcbr = IERC20(_btcbr);
        mainnetOracle = IPriceOracle(_mainnetOracle);
        privateOracle = IPriceOracle(_privateOracle);
    }
    
    /**
     * @notice Initiate transfer with price protection
     */
    function initiateTransfer(uint256 amount) external returns (bytes32 transferId) {
        uint256 price = mainnetOracle.getPrice();
        uint256 usdValue = (amount * price) / 1e18;
        
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        transferId = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp));
        
        transfers[transferId] = PendingTransfer({
            user: msg.sender,
            amount: amount,
            usdValue: usdValue,
            timestamp: block.timestamp,
            completed: false
        });
        
        emit TransferInitiated(transferId, amount, usdValue);
    }
    
    /**
     * @notice Complete transfer - receive amount worth same USD value
     */
    function completeTransfer(bytes32 transferId) external {
        PendingTransfer storage transfer = transfers[transferId];
        require(!transfer.completed, "Already completed");
        require(msg.sender == transfer.user, "Not initiator");
        
        uint256 privatePrice = privateOracle.getPrice();
        uint256 receiveAmount = (transfer.usdValue * 1e18) / privatePrice;
        
        transfer.completed = true;
        
        require(btcbr.transfer(transfer.user, receiveAmount), "Transfer failed");
        
        emit TransferCompleted(transferId, receiveAmount);
    }
}

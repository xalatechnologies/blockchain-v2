// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PredictionMarketBridge
 * @notice Bridge using prediction markets for consensus
 * @dev Bet on whether transfer is valid - wisdom of the crowd
 * 
 * GENIUS TRICK: Market price reveals truth about transfer validity
 * Inspired by Augur, Polymarket, futarchy
 */
contract PredictionMarketBridge {
    
    IERC20 public immutable btcbr;
    
    struct Market {
        bytes32 transferId;
        uint256 yesShares;       // Shares betting transfer is valid
        uint256 noShares;        // Shares betting transfer is invalid
        uint256 yesPool;         // BTCBR backing YES
        uint256 noPool;          // BTCBR backing NO
        uint256 deadline;
        bool resolved;
        bool outcome;            // True if valid transfer
    }
    
    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => uint256)) public yesPositions;
    mapping(bytes32 => mapping(address => uint256)) public noPositions;
    
    event MarketCreated(bytes32 indexed marketId, bytes32 transferId);
    event SharesPurchased(bytes32 indexed marketId, address buyer, bool yes, uint256 amount);
    event MarketResolved(bytes32 indexed marketId, bool outcome);
    event Claimed(bytes32 indexed marketId, address winner, uint256 payout);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Create prediction market for transfer
     */
    function createMarket(bytes32 transferId, uint256 duration) external returns (bytes32 marketId) {
        marketId = keccak256(abi.encodePacked(transferId, block.timestamp));
        
        markets[marketId] = Market({
            transferId: transferId,
            yesShares: 0,
            noShares: 0,
            yesPool: 0,
            noPool: 0,
            deadline: block.timestamp + duration,
            resolved: false,
            outcome: false
        });
        
        emit MarketCreated(marketId, transferId);
    }
    
    /**
     * @notice Buy shares - bet on transfer validity
     */
    function buyShares(bytes32 marketId, bool yes, uint256 amount) external {
        Market storage market = markets[marketId];
        require(block.timestamp < market.deadline, "Market closed");
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        if (yes) {
            market.yesPool += amount;
            market.yesShares += amount;
            yesPositions[marketId][msg.sender] += amount;
        } else {
            market.noPool += amount;
            market.noShares += amount;
            noPositions[marketId][msg.sender] += amount;
        }
        
        emit SharesPurchased(marketId, msg.sender, yes, amount);
    }
    
    /**
     * @notice Resolve market based on actual transfer validity
     */
    function resolveMarket(bytes32 marketId, bool outcome, bytes calldata proof) external {
        Market storage market = markets[marketId];
        require(block.timestamp >= market.deadline, "Not ended");
        require(!market.resolved, "Already resolved");
        
        // Verify outcome with proof
        require(_verifyOutcome(proof), "Invalid proof");
        
        market.resolved = true;
        market.outcome = outcome;
        
        emit MarketResolved(marketId, outcome);
    }
    
    /**
     * @notice Claim winnings if bet correctly
     */
    function claim(bytes32 marketId) external {
        Market storage market = markets[marketId];
        require(market.resolved, "Not resolved");
        
        uint256 payout;
        
        if (market.outcome) {
            // YES won - distribute total pool proportionally
            uint256 shares = yesPositions[marketId][msg.sender];
            payout = (shares * (market.yesPool + market.noPool)) / market.yesShares;
            yesPositions[marketId][msg.sender] = 0;
        } else {
            // NO won
            uint256 shares = noPositions[marketId][msg.sender];
            payout = (shares * (market.yesPool + market.noPool)) / market.noShares;
            noPositions[marketId][msg.sender] = 0;
        }
        
        require(payout > 0, "Nothing to claim");
        require(btcbr.transfer(msg.sender, payout), "Transfer failed");
        
        emit Claimed(marketId, msg.sender, payout);
    }
    
    /**
     * @notice Get current market price (probability of validity)
     * Price = yesPool / (yesPool + noPool)
     */
    function getMarketPrice(bytes32 marketId) external view returns (uint256) {
        Market storage market = markets[marketId];
        uint256 total = market.yesPool + market.noPool;
        if (total == 0) return 50; // 50% if no bets
        return (market.yesPool * 100) / total;
    }
    
    function _verifyOutcome(bytes calldata) internal pure returns (bool) {
        return true; // Placeholder
    }
}

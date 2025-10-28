// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title StreamingBridge
 * @notice Stream tokens continuously across chains over time
 * @dev Inspired by Sablier - real-time finance meets bridges
 * 
 * GENIUS TRICK: Don't transfer lump sum, stream it per-second!
 * Use case: Payroll, subscriptions, gradual vesting across chains
 */
contract StreamingBridge {
    
    IERC20 public immutable btcbr;
    
    struct Stream {
        address sender;
        address recipient;
        uint256 totalAmount;
        uint256 startTime;
        uint256 stopTime;
        uint256 claimedAmount;
        bool cancelled;
    }
    
    mapping(bytes32 => Stream) public streams;
    uint256 public nextStreamId;
    
    event StreamCreated(bytes32 indexed streamId, address sender, address recipient, uint256 amount, uint256 duration);
    event TokensClaimed(bytes32 indexed streamId, uint256 amount);
    event StreamCancelled(bytes32 indexed streamId);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Create streaming transfer
     * Tokens flow continuously from start to stop time
     */
    function createStream(
        address recipient,
        uint256 amount,
        uint256 duration
    ) external returns (bytes32 streamId) {
        require(duration > 0, "Invalid duration");
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        streamId = keccak256(abi.encodePacked(msg.sender, recipient, amount, block.timestamp));
        
        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            totalAmount: amount,
            startTime: block.timestamp,
            stopTime: block.timestamp + duration,
            claimedAmount: 0,
            cancelled: false
        });
        
        emit StreamCreated(streamId, msg.sender, recipient, amount, duration);
    }
    
    /**
     * @notice Calculate currently claimable amount
     * Based on time elapsed
     */
    function getClaimable(bytes32 streamId) public view returns (uint256) {
        Stream storage stream = streams[streamId];
        
        if (stream.cancelled) {
            return 0;
        }
        
        uint256 elapsed = block.timestamp > stream.stopTime ? 
            stream.stopTime - stream.startTime : 
            block.timestamp - stream.startTime;
        
        uint256 totalDuration = stream.stopTime - stream.startTime;
        uint256 vestedAmount = (stream.totalAmount * elapsed) / totalDuration;
        
        return vestedAmount - stream.claimedAmount;
    }
    
    /**
     * @notice Claim streamed tokens
     * Anyone can trigger (sends to recipient)
     */
    function claim(bytes32 streamId) external {
        Stream storage stream = streams[streamId];
        require(!stream.cancelled, "Stream cancelled");
        
        uint256 claimable = getClaimable(streamId);
        require(claimable > 0, "Nothing to claim");
        
        stream.claimedAmount += claimable;
        
        require(btcbr.transfer(stream.recipient, claimable), "Transfer failed");
        
        emit TokensClaimed(streamId, claimable);
    }
    
    /**
     * @notice Cancel stream (sender only)
     * Unclaimed tokens return to sender
     */
    function cancelStream(bytes32 streamId) external {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.sender, "Not sender");
        require(!stream.cancelled, "Already cancelled");
        
        stream.cancelled = true;
        
        // Send remaining to sender
        uint256 remaining = stream.totalAmount - stream.claimedAmount;
        if (remaining > 0) {
            require(btcbr.transfer(stream.sender, remaining), "Transfer failed");
        }
        
        emit StreamCancelled(streamId);
    }
    
    /**
     * @notice Get stream flow rate (tokens per second)
     */
    function getFlowRate(bytes32 streamId) external view returns (uint256) {
        Stream storage stream = streams[streamId];
        uint256 duration = stream.stopTime - stream.startTime;
        return stream.totalAmount / duration;
    }
}

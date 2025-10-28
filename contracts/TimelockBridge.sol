// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TimelockBridge
 * @notice Time-based token migration with scheduled releases
 * @dev Tokens locked until future date, prevents rugpulls
 * 
 * Use case: Vesting schedules across chains
 */
contract TimelockBridge {
    
    IERC20 public immutable btcbr;
    
    struct TimeLock {
        address beneficiary;
        uint256 amount;
        uint256 releaseTime;
        bool claimed;
        uint256 vestingDuration;
        uint256 startTime;
        uint256 claimedAmount;
    }
    
    mapping(bytes32 => TimeLock) public timelocks;
    
    event TokensLocked(bytes32 indexed lockId, address beneficiary, uint256 amount, uint256 releaseTime);
    event TokensClaimed(bytes32 indexed lockId, uint256 amount);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Lock tokens for future release
     */
    function lockTokens(
        address beneficiary,
        uint256 amount,
        uint256 releaseTime,
        uint256 vestingDuration
    ) external returns (bytes32 lockId) {
        require(releaseTime > block.timestamp, "Must be future");
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        lockId = keccak256(abi.encodePacked(msg.sender, beneficiary, amount, block.timestamp));
        
        timelocks[lockId] = TimeLock({
            beneficiary: beneficiary,
            amount: amount,
            releaseTime: releaseTime,
            claimed: false,
            vestingDuration: vestingDuration,
            startTime: releaseTime,
            claimedAmount: 0
        });
        
        emit TokensLocked(lockId, beneficiary, amount, releaseTime);
    }
    
    /**
     * @notice Claim vested tokens
     */
    function claim(bytes32 lockId) external {
        TimeLock storage lock = timelocks[lockId];
        require(msg.sender == lock.beneficiary, "Not beneficiary");
        require(block.timestamp >= lock.releaseTime, "Still locked");
        
        uint256 claimable = _calculateClaimable(lock);
        require(claimable > 0, "Nothing to claim");
        
        lock.claimedAmount += claimable;
        
        if (lock.claimedAmount >= lock.amount) {
            lock.claimed = true;
        }
        
        require(btcbr.transfer(lock.beneficiary, claimable), "Transfer failed");
        
        emit TokensClaimed(lockId, claimable);
    }
    
    function _calculateClaimable(TimeLock memory lock) internal view returns (uint256) {
        if (lock.vestingDuration == 0) {
            return lock.amount - lock.claimedAmount;
        }
        
        uint256 elapsed = block.timestamp - lock.startTime;
        if (elapsed >= lock.vestingDuration) {
            return lock.amount - lock.claimedAmount;
        }
        
        uint256 vested = (lock.amount * elapsed) / lock.vestingDuration;
        return vested - lock.claimedAmount;
    }
}

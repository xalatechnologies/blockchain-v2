// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainlinkPriceAggregator
 * @notice Chainlink-compatible price aggregator for external integrations
 * @dev Implements Chainlink AggregatorV3Interface for compatibility
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    
    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract ChainlinkPriceAggregator is AggregatorV3Interface, Ownable {
    struct RoundData {
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }
    
    uint8 public override decimals;
    string public override description;
    uint256 public override constant version = 1;
    
    uint80 public latestRound;
    mapping(uint80 => RoundData) public rounds;
    
    event AnswerUpdated(int256 indexed current, uint80 indexed roundId, uint256 updatedAt);
    event NewRound(uint80 indexed roundId, address indexed startedBy, uint256 startedAt);
    
    constructor(string memory _description, uint8 _decimals) {
        description = _description;
        decimals = _decimals;
    }
    
    function updateAnswer(int256 _answer) external onlyOwner {
        latestRound++;
        
        rounds[latestRound] = RoundData({
            answer: _answer,
            startedAt: block.timestamp,
            updatedAt: block.timestamp,
            answeredInRound: latestRound
        });
        
        emit NewRound(latestRound, msg.sender, block.timestamp);
        emit AnswerUpdated(_answer, latestRound, block.timestamp);
    }
    
    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        RoundData storage round = rounds[_roundId];
        require(round.updatedAt > 0, "No data present");
        
        return (
            _roundId,
            round.answer,
            round.startedAt,
            round.updatedAt,
            round.answeredInRound
        );
    }
    
    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        RoundData storage round = rounds[latestRound];
        require(round.updatedAt > 0, "No data present");
        
        return (
            latestRound,
            round.answer,
            round.startedAt,
            round.updatedAt,
            round.answeredInRound
        );
    }
}

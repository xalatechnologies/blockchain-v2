// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GameTheoryBridge
 * @notice Bridge using game theory and Nash equilibrium
 * @dev Rational actors ensure security through economic incentives
 * 
 * Concept: Prisoners' dilemma - honesty is the dominant strategy
 * WARNING: Assumes rational actors, vulnerable to irrational behavior
 */
contract GameTheoryBridge {
    
    IERC20 public immutable btcbr;
    
    uint256 public constant STAKE_AMOUNT = 10000 * 10**18;
    uint256 public constant REWARD_HONEST = 100 * 10**18;
    uint256 public constant PENALTY_DISHONEST = 5000 * 10**18;
    
    struct Game {
        address player1;
        address player2;
        uint256 stake1;
        uint256 stake2;
        bytes32 commitment1;
        bytes32 commitment2;
        bool revealed1;
        bool revealed2;
        bool honest1;
        bool honest2;
    }
    
    mapping(bytes32 => Game) public games;
    
    event GameCreated(bytes32 indexed gameId, address player1, address player2);
    event CommitmentMade(bytes32 indexed gameId, address player, bytes32 commitment);
    event Revealed(bytes32 indexed gameId, address player, bool honest);
    event PayoutExecuted(bytes32 indexed gameId, address winner, uint256 amount);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Create game (both players stake)
     */
    function createGame(bytes32 gameId, address player2) external {
        require(btcbr.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake failed");
        
        games[gameId].player1 = msg.sender;
        games[gameId].player2 = player2;
        games[gameId].stake1 = STAKE_AMOUNT;
        
        emit GameCreated(gameId, msg.sender, player2);
    }
    
    /**
     * @notice Join game (second player stakes)
     */
    function joinGame(bytes32 gameId) external {
        Game storage game = games[gameId];
        require(msg.sender == game.player2, "Not player 2");
        require(btcbr.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake failed");
        
        game.stake2 = STAKE_AMOUNT;
    }
    
    /**
     * @notice Commit to strategy (honest or dishonest)
     */
    function commit(bytes32 gameId, bytes32 commitment) external {
        Game storage game = games[gameId];
        
        if (msg.sender == game.player1) {
            game.commitment1 = commitment;
        } else if (msg.sender == game.player2) {
            game.commitment2 = commitment;
        } else {
            revert("Not a player");
        }
        
        emit CommitmentMade(gameId, msg.sender, commitment);
    }
    
    /**
     * @notice Reveal strategy
     */
    function reveal(bytes32 gameId, bool honest, bytes32 nonce) external {
        Game storage game = games[gameId];
        bytes32 commitment = keccak256(abi.encodePacked(honest, nonce));
        
        if (msg.sender == game.player1) {
            require(commitment == game.commitment1, "Invalid reveal");
            game.revealed1 = true;
            game.honest1 = honest;
        } else if (msg.sender == game.player2) {
            require(commitment == game.commitment2, "Invalid reveal");
            game.revealed2 = true;
            game.honest2 = honest;
        } else {
            revert("Not a player");
        }
        
        emit Revealed(gameId, msg.sender, honest);
        
        // Execute payout if both revealed
        if (game.revealed1 && game.revealed2) {
            _executePayout(gameId);
        }
    }
    
    /**
     * @notice Execute payout based on game theory payoff matrix
     * 
     * Payoff Matrix:
     *                Player 2 Honest    Player 2 Dishonest
     * Player 1 Honest      (+100, +100)        (-5000, +15000)
     * Player 1 Dishonest   (+15000, -5000)     (-5000, -5000)
     * 
     * Nash Equilibrium: (Honest, Honest)
     */
    function _executePayout(bytes32 gameId) internal {
        Game storage game = games[gameId];
        
        if (game.honest1 && game.honest2) {
            // Both honest - both win
            btcbr.transfer(game.player1, game.stake1 + REWARD_HONEST);
            btcbr.transfer(game.player2, game.stake2 + REWARD_HONEST);
        } else if (game.honest1 && !game.honest2) {
            // P1 honest, P2 dishonest - P2 penalized
            btcbr.transfer(game.player1, game.stake1 + game.stake2);
        } else if (!game.honest1 && game.honest2) {
            // P1 dishonest, P2 honest - P1 penalized
            btcbr.transfer(game.player2, game.stake1 + game.stake2);
        } else {
            // Both dishonest - both lose stake
            // Stakes burned or sent to treasury
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleNorGovernance
 * @dev Simplified governance system for NorChain
 * 
 * Features:
 * - Token-based voting (stake NOR to vote)
 * - Multi-layer governance (Community, Validator, Council)
 * - Proposal creation and voting
 * - Timelock execution
 * - Emergency functions
 */
contract SimpleNorGovernance is Ownable, ReentrancyGuard {
    
    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS & ENUMS
    // ═══════════════════════════════════════════════════════════════════

    enum ProposalState {
        Pending,    // Proposal created, voting hasn't started
        Active,     // Voting in progress
        Canceled,   // Proposal was canceled
        Defeated,   // Proposal failed
        Succeeded,  // Proposal passed
        Queued,     // Proposal queued for execution
        Executed    // Proposal executed
    }

    enum ProposalType {
        COMMUNITY,  // Community governance (simple majority)
        VALIDATOR,  // Validator governance (validator voting)
        PROTOCOL,   // Protocol changes (Council + Validator approval)
        EMERGENCY   // Emergency actions (Council only)
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        ProposalType proposalType;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votes;
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    IERC20 public immutable norToken;
    
    // Governance parameters
    uint256 public constant MIN_PROPOSAL_STAKE = 10_000e24; // 10k NOR
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant TIMELOCK_PERIOD = 2 days;
    uint256 public constant QUORUM_PERCENTAGE = 15; // 15%

    // Proposals
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // Staking for governance
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakeTimestamp;
    uint256 public totalStaked;

    // Governance levels
    mapping(address => bool) public validators;
    mapping(address => uint256) public validatorStake;
    mapping(address => bool) public councilMembers;
    address[] public councilMembersList;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string description
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    event ValidatorAdded(address indexed validator, uint256 stake);
    event CouncilMemberAdded(address indexed member);

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor(address _norToken) {
        require(_norToken != address(0), "Invalid NOR token");
        norToken = IERC20(_norToken);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STAKING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Stake NOR tokens for governance voting
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        
        norToken.transferFrom(msg.sender, address(this), amount);
        
        stakedAmount[msg.sender] += amount;
        stakeTimestamp[msg.sender] = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake NOR tokens (with 7-day delay)
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount <= stakedAmount[msg.sender], "Insufficient staked");
        require(block.timestamp >= stakeTimestamp[msg.sender] + 7 days, "Stake locked");
        
        stakedAmount[msg.sender] -= amount;
        totalStaked -= amount;
        
        norToken.transfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROPOSAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Create a governance proposal
     */
    function propose(
        string calldata description,
        ProposalType proposalType
    ) external returns (uint256) {
        require(stakedAmount[msg.sender] >= MIN_PROPOSAL_STAKE, "Insufficient stake");
        require(_canCreateProposal(msg.sender, proposalType), "Not authorized");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.startTime = block.timestamp + 1 days; // 1 day delay
        proposal.endTime = block.timestamp + 1 days + VOTING_PERIOD;
        proposal.state = ProposalState.Pending;
        
        emit ProposalCreated(proposalId, msg.sender, proposalType, description);
        
        return proposalId;
    }

    /**
     * @dev Vote on a proposal
     */
    function vote(uint256 proposalId, bool support, uint256 weight) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.state == ProposalState.Active, "Voting not active");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        
        uint256 votingPower = _getVotingPower(msg.sender, proposal.proposalType);
        require(votingPower > 0, "No voting power");
        
        if (weight > votingPower) {
            weight = votingPower; // Cap at available voting power
        }
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = weight;
        
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight);
        
        // Update proposal state if needed
        _updateProposalState(proposalId);
    }

    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.state == ProposalState.Succeeded, "Proposal not ready");
        require(!proposal.executed, "Already executed");
        require(block.timestamp >= proposal.endTime + TIMELOCK_PERIOD, "Timelock active");
        
        proposal.executed = true;
        proposal.state = ProposalState.Executed;
        
        emit ProposalExecuted(proposalId);
    }

    // ═══════════════════════════════════════════════════════════════════
    // GOVERNANCE LEVEL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Register as validator
     */
    function registerValidator(uint256 stakeAmount) external {
        require(stakeAmount >= 100_000e24, "Minimum 100k NOR stake");
        require(!validators[msg.sender], "Already registered");
        
        norToken.transferFrom(msg.sender, address(this), stakeAmount);
        
        validators[msg.sender] = true;
        validatorStake[msg.sender] = stakeAmount;
        
        emit ValidatorAdded(msg.sender, stakeAmount);
    }

    /**
     * @dev Add council member (only owner)
     */
    function addCouncilMember(address member) external onlyOwner {
        require(!councilMembers[member], "Already council member");
        require(councilMembersList.length < 5, "Council full");
        
        councilMembers[member] = true;
        councilMembersList.push(member);
        
        emit CouncilMemberAdded(member);
    }

    // ═══════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Check if user can create proposal of specific type
     */
    function _canCreateProposal(address user, ProposalType proposalType) internal view returns (bool) {
        if (proposalType == ProposalType.EMERGENCY) {
            return councilMembers[user];
        }
        if (proposalType == ProposalType.PROTOCOL) {
            return councilMembers[user] || validators[user];
        }
        return stakedAmount[user] >= MIN_PROPOSAL_STAKE;
    }

    /**
     * @dev Get voting power for user based on proposal type
     */
    function _getVotingPower(address user, ProposalType proposalType) internal view returns (uint256) {
        if (proposalType == ProposalType.EMERGENCY && councilMembers[user]) {
            return 1; // Council members get 1 vote each
        }
        if (proposalType == ProposalType.VALIDATOR && validators[user]) {
            return validatorStake[user];
        }
        return stakedAmount[user]; // Community voting power
    }

    /**
     * @dev Update proposal state based on votes
     */
    function _updateProposalState(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        
        if (block.timestamp >= proposal.startTime && proposal.state == ProposalState.Pending) {
            proposal.state = ProposalState.Active;
        }
        
        if (block.timestamp > proposal.endTime && proposal.state == ProposalState.Active) {
            // Check if proposal succeeded
            uint256 quorum = _getQuorumThreshold(proposal.proposalType);
            uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
            
            if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
                proposal.state = ProposalState.Succeeded;
            } else {
                proposal.state = ProposalState.Defeated;
            }
        }
    }

    /**
     * @dev Get quorum threshold for proposal type
     */
    function _getQuorumThreshold(ProposalType proposalType) internal view returns (uint256) {
        if (proposalType == ProposalType.EMERGENCY) {
            return 3; // 3 of 5 council members
        }
        if (proposalType == ProposalType.VALIDATOR) {
            return (getTotalValidatorStake() * QUORUM_PERCENTAGE) / 100;
        }
        return (totalStaked * QUORUM_PERCENTAGE) / 100; // Community quorum
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Get proposal state
     */
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        
        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        uint256 quorum = _getQuorumThreshold(proposal.proposalType);
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        
        if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }
        return ProposalState.Defeated;
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory description,
        ProposalType proposalType,
        uint256 forVotes,
        uint256 againstVotes,
        ProposalState state
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.proposalType,
            proposal.forVotes,
            proposal.againstVotes,
            this.getProposalState(proposalId)
        );
    }

    /**
     * @dev Get total validator stake
     */
    function getTotalValidatorStake() public view returns (uint256 total) {
        // In a real implementation, you'd iterate through all validators
        // For simplicity, returning a placeholder
        return 1_000_000e24; // 1M NOR
    }

    /**
     * @dev Get council members
     */
    function getCouncilMembers() external view returns (address[] memory) {
        return councilMembersList;
    }

    /**
     * @dev Check if user has voted on proposal
     */
    function hasVoted(uint256 proposalId, address user) external view returns (bool) {
        return proposals[proposalId].hasVoted[user];
    }
}
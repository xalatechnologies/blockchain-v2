// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IXHTStaking {
    function getVotingPower(address user) external view returns (uint256);
}

/**
 * @title XHTGovernance
 * @notice Decentralized governance for Xaheen Chain with voting power from staking
 * @dev Features:
 * - Proposal creation and voting
 * - Voting power based on staked XHT (from XHTStaking)
 * - Timelock for executed proposals (48 hours)
 * - Treasury management
 * - Parameter updates (fees, limits, etc.)
 */
contract XHTGovernance is Ownable, ReentrancyGuard {

    // ============ State Variables ============

    IXHTStaking public stakingContract;

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        ProposalType proposalType;
        bytes executionData;
    }

    enum ProposalType {
        ParameterChange,    // Change protocol parameters
        TreasurySpend,      // Spend from treasury
        ContractUpgrade,    // Upgrade contracts
        ValidatorChange,    // Add/remove validators
        EmergencyAction     // Emergency response
    }

    enum VoteChoice {
        Against,
        For,
        Abstain
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteChoice)) public votes;

    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant TIMELOCK_PERIOD = 2 days;
    uint256 public constant MIN_VOTING_POWER = 10_000 ether; // 10,000 XHT to propose
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total staking
    uint256 public treasury;

    // ============ Events ============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 votingPower
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event TreasuryDeposit(address indexed from, uint256 amount);

    // ============ Constructor ============

    constructor(address _stakingContract) {
        stakingContract = IXHTStaking(_stakingContract);
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new governance proposal
     * @param title Proposal title
     * @param description Detailed description
     * @param proposalType Type of proposal
     * @param executionData Encoded function call data
     */
    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType,
        bytes memory executionData
    ) external returns (uint256) {
        uint256 votingPower = stakingContract.getVotingPower(msg.sender);
        require(votingPower >= MIN_VOTING_POWER, "Insufficient voting power");

        proposalCount++;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            executed: false,
            canceled: false,
            proposalType: proposalType,
            executionData: executionData
        });

        emit ProposalCreated(proposalId, msg.sender, title, proposalType);
        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId Proposal ID
     * @param choice Vote choice (Against, For, Abstain)
     */
    function castVote(uint256 proposalId, VoteChoice choice) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.canceled, "Proposal canceled");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 votingPower = stakingContract.getVotingPower(msg.sender);
        require(votingPower > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;
        votes[proposalId][msg.sender] = choice;

        if (choice == VoteChoice.For) {
            proposal.forVotes += votingPower;
        } else if (choice == VoteChoice.Against) {
            proposal.againstVotes += votingPower;
        }

        emit VoteCast(proposalId, msg.sender, choice, votingPower);
    }

    /**
     * @notice Execute a passed proposal after timelock
     * @param proposalId Proposal ID
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(block.timestamp >= proposal.endTime + TIMELOCK_PERIOD, "Timelock active");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(proposal.forVotes > proposal.againstVotes, "Proposal failed");
        require(hasReachedQuorum(proposalId), "Quorum not reached");

        proposal.executed = true;

        // Execute proposal based on type
        if (proposal.proposalType == ProposalType.TreasurySpend) {
            _executeTreasurySpend(proposal.executionData);
        }
        // Other types can be implemented as needed

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal (only proposer or owner)
     * @param proposalId Proposal ID
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Already canceled");

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @notice Check if proposal reached quorum
     * @param proposalId Proposal ID
     * @return True if quorum reached
     */
    function hasReachedQuorum(uint256 proposalId) public view returns (bool) {
        Proposal memory proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;

        // For simplicity, using a fixed quorum threshold
        // In production, this should check against total staked supply
        return totalVotes >= 100_000 ether; // 100,000 XHT voting power
    }

    /**
     * @notice Get proposal status
     * @param proposalId Proposal ID
     */
    function getProposalStatus(uint256 proposalId) external view returns (
        bool active,
        bool passed,
        bool executed,
        bool canExecute
    ) {
        Proposal memory proposal = proposals[proposalId];

        active = block.timestamp <= proposal.endTime && !proposal.canceled;
        passed = proposal.forVotes > proposal.againstVotes && hasReachedQuorum(proposalId);
        executed = proposal.executed;
        canExecute = passed &&
                     block.timestamp > proposal.endTime + TIMELOCK_PERIOD &&
                     !proposal.executed &&
                     !proposal.canceled;

        return (active, passed, executed, canExecute);
    }

    // ============ Treasury Functions ============

    /**
     * @notice Deposit to treasury
     */
    function depositToTreasury() external payable {
        treasury += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value);
    }

    /**
     * @notice Execute treasury spend (internal)
     * @param data Encoded recipient and amount
     */
    function _executeTreasurySpend(bytes memory data) internal {
        (address recipient, uint256 amount) = abi.decode(data, (address, uint256));
        require(treasury >= amount, "Insufficient treasury");

        treasury -= amount;
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Get treasury balance
     */
    function getTreasuryBalance() external view returns (uint256) {
        return treasury;
    }

    // ============ View Functions ============

    /**
     * @notice Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 endTime,
        bool executed,
        bool canceled,
        ProposalType proposalType
    ) {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.endTime,
            proposal.executed,
            proposal.canceled,
            proposal.proposalType
        );
    }

    /**
     * @notice Get user's vote on a proposal
     */
    function getUserVote(uint256 proposalId, address user) external view returns (
        bool voted,
        VoteChoice choice
    ) {
        return (hasVoted[proposalId][user], votes[proposalId][user]);
    }

    /**
     * @notice Get voting statistics
     */
    function getVotingStats(uint256 proposalId) external view returns (
        uint256 totalVotes,
        uint256 forPercentage,
        uint256 againstPercentage,
        bool quorumReached
    ) {
        Proposal memory proposal = proposals[proposalId];
        uint256 total = proposal.forVotes + proposal.againstVotes;

        uint256 forPct = total > 0 ? (proposal.forVotes * 100) / total : 0;
        uint256 againstPct = total > 0 ? (proposal.againstVotes * 100) / total : 0;

        return (total, forPct, againstPct, hasReachedQuorum(proposalId));
    }

    // ============ Admin Functions ============

    /**
     * @notice Update staking contract address
     */
    function updateStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = IXHTStaking(_stakingContract);
    }

    /**
     * @notice Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ============ Receive Function ============

    receive() external payable {
        treasury += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title NorGovernance
 * @notice Decentralized governance for Nor Chain ecosystem
 * @dev Implements proposal creation, voting, and execution with timelock
 */
contract NorGovernance is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    IERC20 public immutable governanceToken; // NOR token
    
    uint256 public proposalCount;
    uint256 public votingPeriod = 3 days;
    uint256 public executionDelay = 2 days;
    uint256 public proposalThreshold = 100_000e18; // 100K NOR to create proposal
    uint256 public quorumVotes = 500_000e18; // 500K NOR quorum
    
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        uint256 eta;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        mapping(address => Receipt) receipts;
        string description;
    }
    
    struct Receipt {
        bool hasVoted;
        uint8 support; // 0=against, 1=for, 2=abstain
        uint256 votes;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public latestProposalIds;
    
    event ProposalCreated(
        uint256 id,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );
    
    event VoteCast(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        uint256 votes,
        string reason
    );
    
    event ProposalCanceled(uint256 id);
    event ProposalQueued(uint256 id, uint256 eta);
    event ProposalExecuted(uint256 id);
    
    constructor(address _governanceToken, address _guardian) {
        require(_governanceToken != address(0), "NorGovernance: INVALID_TOKEN");
        governanceToken = IERC20(_governanceToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GUARDIAN_ROLE, _guardian);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }
    
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "NorGovernance: BELOW_PROPOSAL_THRESHOLD"
        );
        require(
            targets.length == values.length &&
            targets.length == signatures.length &&
            targets.length == calldatas.length,
            "NorGovernance: ARITY_MISMATCH"
        );
        require(targets.length > 0, "NorGovernance: EMPTY_PROPOSAL");
        
        uint256 latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposerLatestProposalState = state(latestProposalId);
            require(
                proposerLatestProposalState != ProposalState.Active,
                "NorGovernance: ONE_ACTIVE_PROPOSAL"
            );
        }
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.eta = 0;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.signatures = signatures;
        newProposal.calldatas = calldatas;
        newProposal.startBlock = block.number;
        newProposal.endBlock = block.number + (votingPeriod / 12); // ~12s per block
        newProposal.forVotes = 0;
        newProposal.againstVotes = 0;
        newProposal.abstainVotes = 0;
        newProposal.canceled = false;
        newProposal.executed = false;
        newProposal.description = description;
        
        latestProposalIds[msg.sender] = proposalId;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            signatures,
            calldatas,
            newProposal.startBlock,
            newProposal.endBlock,
            description
        );
        
        return proposalId;
    }
    
    function queue(uint256 proposalId) external {
        require(
            state(proposalId) == ProposalState.Succeeded,
            "NorGovernance: PROPOSAL_NOT_SUCCEEDED"
        );
        
        Proposal storage proposal = proposals[proposalId];
        uint256 eta = block.timestamp + executionDelay;
        proposal.eta = eta;
        
        emit ProposalQueued(proposalId, eta);
    }
    
    function execute(uint256 proposalId) external payable nonReentrant {
        require(
            state(proposalId) == ProposalState.Queued,
            "NorGovernance: PROPOSAL_NOT_QUEUED"
        );
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            _executeTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i]
            );
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    function cancel(uint256 proposalId) external {
        ProposalState currentState = state(proposalId);
        require(
            currentState != ProposalState.Executed,
            "NorGovernance: PROPOSAL_EXECUTED"
        );
        
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer ||
            hasRole(GUARDIAN_ROLE, msg.sender),
            "NorGovernance: UNAUTHORIZED"
        );
        
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }
    
    function castVote(uint256 proposalId, uint8 support) external {
        return _castVote(msg.sender, proposalId, support, "");
    }
    
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) external {
        return _castVote(msg.sender, proposalId, support, reason);
    }
    
    function _castVote(
        address voter,
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) internal {
        require(
            state(proposalId) == ProposalState.Active,
            "NorGovernance: VOTING_CLOSED"
        );
        require(support <= 2, "NorGovernance: INVALID_VOTE_TYPE");
        
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        require(!receipt.hasVoted, "NorGovernance: ALREADY_VOTED");
        
        uint256 votes = governanceToken.balanceOf(voter);
        require(votes > 0, "NorGovernance: NO_VOTING_POWER");
        
        if (support == 0) {
            proposal.againstVotes += votes;
        } else if (support == 1) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }
        
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;
        
        emit VoteCast(voter, proposalId, support, votes, reason);
    }
    
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId > 0 && proposalId <= proposalCount, "NorGovernance: INVALID_PROPOSAL");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes) {
            return ProposalState.Defeated;
        } else if (proposal.eta == 0) {
            return ProposalState.Succeeded;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.timestamp >= proposal.eta + 14 days) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Queued;
        }
    }
    
    function getReceipt(uint256 proposalId, address voter)
        external
        view
        returns (Receipt memory)
    {
        return proposals[proposalId].receipts[voter];
    }
    
    function _executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data
    ) internal {
        bytes memory callData;
        
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }
        
        (bool success, ) = target.call{value: value}(callData);
        require(success, "NorGovernance: TRANSACTION_FAILED");
    }
    
    function setVotingPeriod(uint256 _votingPeriod) external onlyRole(GUARDIAN_ROLE) {
        votingPeriod = _votingPeriod;
    }
    
    function setExecutionDelay(uint256 _executionDelay) external onlyRole(GUARDIAN_ROLE) {
        executionDelay = _executionDelay;
    }
    
    function setProposalThreshold(uint256 _proposalThreshold) external onlyRole(GUARDIAN_ROLE) {
        proposalThreshold = _proposalThreshold;
    }
    
    function setQuorumVotes(uint256 _quorumVotes) external onlyRole(GUARDIAN_ROLE) {
        quorumVotes = _quorumVotes;
    }
}

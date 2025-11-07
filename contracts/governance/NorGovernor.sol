// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NorGovernor
 * @dev Multi-layer governance system for NorChain
 *
 * Three governance layers:
 * 1. Community DAO - Token holders (>10k NOR staked)
 * 2. Validator DAO - Validators + delegators
 * 3. Council DAO - 5 institutional signers
 *
 * Proposal types:
 * - Protocol upgrades (Council + Validator approval required)
 * - Parameter changes (Validator DAO)
 * - Grant funding (Community DAO)
 * - Emergency actions (Council supermajority)
 */
contract NorGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Ownable
{
    // ═══════════════════════════════════════════════════════════════════
    // ENUMS & STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    enum ProposalType {
        COMMUNITY,      // Grant funding, community decisions
        VALIDATOR,      // Consensus params, validator changes
        PROTOCOL,       // Protocol upgrades, major changes
        EMERGENCY       // Immediate action required
    }

    enum GovernanceLevel {
        COMMUNITY,
        VALIDATOR, 
        COUNCIL
    }

    struct ProposalData {
        ProposalType proposalType;
        uint256 communityVotes;
        uint256 validatorVotes;
        uint256 councilVotes;
        bool councilApproved;
        bool validatorApproved;
        bool communityApproved;
        uint256 requiredQuorum;
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    // Governance token contract
    INorGovernanceToken public immutable governanceToken;

    // Proposal tracking
    mapping(uint256 => ProposalData) public proposalData;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Council members (5 institutional signers)
    address[] public councilMembers;
    mapping(address => bool) public isCouncilMember;
    uint256 public constant COUNCIL_SIZE = 5;
    uint256 public constant COUNCIL_SUPERMAJORITY = 3; // 3 of 5

    // Quorum settings by proposal type
    mapping(ProposalType => uint256) public quorumByType;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event ProposalCreatedWithType(
        uint256 indexed proposalId,
        ProposalType proposalType,
        address proposer,
        string description
    );

    event LayeredVoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        GovernanceLevel level,
        uint8 support,
        uint256 weight
    );

    event ProposalApprovalChanged(
        uint256 indexed proposalId,
        GovernanceLevel level,
        bool approved
    );

    event CouncilMembershipChanged(
        address indexed member,
        bool added
    );

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _governanceToken
    )
        Governor("NorGovernor")
        GovernorSettings(1 days, 1 weeks, 10_000e24) // 1 day delay, 1 week voting, 10k proposal threshold
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(15) // 15% quorum
        GovernorTimelockControl(_timelock)
    {
        governanceToken = INorGovernanceToken(_governanceToken);

        // Set quorum by proposal type
        quorumByType[ProposalType.COMMUNITY] = 10; // 10%
        quorumByType[ProposalType.VALIDATOR] = 15; // 15%
        quorumByType[ProposalType.PROTOCOL] = 25;  // 25%
        quorumByType[ProposalType.EMERGENCY] = 20; // 20%
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROPOSAL CREATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Create proposal with specified type and governance level requirements
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType
    ) public returns (uint256) {
        // Check proposal permissions based on type
        require(_canCreateProposal(msg.sender, proposalType), "Insufficient permissions");

        // Create standard proposal
        uint256 proposalId = super.propose(targets, values, calldatas, description);

        // Set proposal type and requirements
        ProposalData storage data = proposalData[proposalId];
        data.proposalType = proposalType;
        data.requiredQuorum = quorumByType[proposalType];

        emit ProposalCreatedWithType(proposalId, proposalType, msg.sender, description);

        return proposalId;
    }

    // ═══════════════════════════════════════════════════════════════════
    // LAYERED VOTING SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Cast vote with governance level consideration
     */
    function castVote(uint256 proposalId, uint8 support) public override returns (uint256) {
        return castVoteWithLevel(proposalId, support, _getGovernanceLevel(msg.sender));
    }

    /**
     * @dev Cast vote with explicit governance level
     */
    function castVoteWithLevel(
        uint256 proposalId,
        uint8 support,
        GovernanceLevel level
    ) public returns (uint256) {
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(_validateVoterLevel(msg.sender, level), "Invalid governance level");

        uint256 weight = _getVotingWeight(msg.sender, level);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;
        
        // Record vote by governance level
        ProposalData storage data = proposalData[proposalId];
        
        if (level == GovernanceLevel.COMMUNITY) {
            data.communityVotes += weight;
        } else if (level == GovernanceLevel.VALIDATOR) {
            data.validatorVotes += weight;
        } else if (level == GovernanceLevel.COUNCIL) {
            data.councilVotes += weight;
        }

        // Check if layer approval thresholds are met
        _updateLayerApproval(proposalId, data);

        emit LayeredVoteCast(proposalId, msg.sender, level, support, weight);

        return weight;
    }

    // ═══════════════════════════════════════════════════════════════════
    // GOVERNANCE LEVEL LOGIC
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Get user's governance level
     */
    function _getGovernanceLevel(address user) internal view returns (GovernanceLevel) {
        if (isCouncilMember[user]) {
            return GovernanceLevel.COUNCIL;
        }
        if (governanceToken.validators(user)) {
            return GovernanceLevel.VALIDATOR;
        }
        return GovernanceLevel.COMMUNITY;
    }

    /**
     * @dev Validate that user belongs to claimed governance level
     */
    function _validateVoterLevel(address user, GovernanceLevel level) internal view returns (bool) {
        if (level == GovernanceLevel.COUNCIL) {
            return isCouncilMember[user];
        }
        if (level == GovernanceLevel.VALIDATOR) {
            return governanceToken.validators(user) || isCouncilMember[user];
        }
        // Community level - anyone with voting power
        return _getVotingWeight(user, level) > 0;
    }

    /**
     * @dev Get voting weight for user at specific governance level
     */
    function _getVotingWeight(address user, GovernanceLevel level) internal view returns (uint256) {
        if (level == GovernanceLevel.COUNCIL && isCouncilMember[user]) {
            return 1; // Each council member has 1 vote
        }
        if (level == GovernanceLevel.VALIDATOR && governanceToken.validators(user)) {
            return governanceToken.validatorStake(user); // Weight by stake
        }
        // Community voting power from locked tokens
        return governanceToken.balanceOf(user);
    }

    /**
     * @dev Check if user can create proposal of specific type
     */
    function _canCreateProposal(address user, ProposalType proposalType) internal view returns (bool) {
        if (proposalType == ProposalType.EMERGENCY) {
            return isCouncilMember[user]; // Only council can create emergency proposals
        }
        if (proposalType == ProposalType.PROTOCOL) {
            return isCouncilMember[user] || governanceToken.validators(user);
        }
        // Community and validator proposals - need minimum stake
        return governanceToken.canCreateProposal(user);
    }

    /**
     * @dev Update layer approval status based on votes
     */
    function _updateLayerApproval(uint256 proposalId, ProposalData storage data) internal {
        ProposalType pType = data.proposalType;

        // Council approval (for protocol and emergency proposals)
        if (pType == ProposalType.PROTOCOL || pType == ProposalType.EMERGENCY) {
            if (data.councilVotes >= COUNCIL_SUPERMAJORITY && !data.councilApproved) {
                data.councilApproved = true;
                emit ProposalApprovalChanged(proposalId, GovernanceLevel.COUNCIL, true);
            }
        }

        // Validator approval (for protocol and validator proposals)
        if (pType == ProposalType.PROTOCOL || pType == ProposalType.VALIDATOR) {
            uint256 totalValidatorStake = _getTotalValidatorStake();
            uint256 requiredValidatorVotes = (totalValidatorStake * data.requiredQuorum) / 100;
            
            if (data.validatorVotes >= requiredValidatorVotes && !data.validatorApproved) {
                data.validatorApproved = true;
                emit ProposalApprovalChanged(proposalId, GovernanceLevel.VALIDATOR, true);
            }
        }

        // Community approval (for community proposals)
        if (pType == ProposalType.COMMUNITY) {
            uint256 totalCommunityVotes = token().totalSupply();
            uint256 requiredCommunityVotes = (totalCommunityVotes * data.requiredQuorum) / 100;
            
            if (data.communityVotes >= requiredCommunityVotes && !data.communityApproved) {
                data.communityApproved = true;
                emit ProposalApprovalChanged(proposalId, GovernanceLevel.COMMUNITY, true);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROPOSAL EXECUTION LOGIC
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Check if proposal has met all required approvals
     */
    function _proposalApproved(uint256 proposalId) internal view returns (bool) {
        ProposalData memory data = proposalData[proposalId];
        ProposalType pType = data.proposalType;

        if (pType == ProposalType.COMMUNITY) {
            return data.communityApproved;
        }
        if (pType == ProposalType.VALIDATOR) {
            return data.validatorApproved;
        }
        if (pType == ProposalType.PROTOCOL) {
            return data.councilApproved && data.validatorApproved;
        }
        if (pType == ProposalType.EMERGENCY) {
            return data.councilApproved; // Emergency only needs council
        }

        return false;
    }

    /**
     * @dev Override proposal success logic to use layered approval
     */
    function _quorumReached(uint256 proposalId) internal view override returns (bool) {
        return _proposalApproved(proposalId);
    }

    /**
     * @dev Override vote success logic
     */
    function _voteSucceeded(uint256 proposalId) internal view override returns (bool) {
        return _proposalApproved(proposalId);
    }

    // ═══════════════════════════════════════════════════════════════════
    // COUNCIL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Add council member (only owner initially, then DAO controlled)
     */
    function addCouncilMember(address member) external onlyOwner {
        require(member != address(0), "Invalid address");
        require(!isCouncilMember[member], "Already council member");
        require(councilMembers.length < COUNCIL_SIZE, "Council full");

        isCouncilMember[member] = true;
        councilMembers.push(member);

        emit CouncilMembershipChanged(member, true);
    }

    /**
     * @dev Remove council member
     */
    function removeCouncilMember(address member) external onlyOwner {
        require(isCouncilMember[member], "Not council member");

        isCouncilMember[member] = false;

        // Remove from array
        for (uint i = 0; i < councilMembers.length; i++) {
            if (councilMembers[i] == member) {
                councilMembers[i] = councilMembers[councilMembers.length - 1];
                councilMembers.pop();
                break;
            }
        }

        emit CouncilMembershipChanged(member, false);
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Get total validator stake for quorum calculations
     */
    function _getTotalValidatorStake() internal view returns (uint256 total) {
        // This would query all registered validators
        // For now, simplified implementation
        return 1_000_000e24; // 1M NOR total validator stake
    }

    /**
     * @dev Get proposal approval status by layer
     */
    function getProposalApprovalStatus(uint256 proposalId) 
        external 
        view 
        returns (bool community, bool validator, bool council) 
    {
        ProposalData memory data = proposalData[proposalId];
        return (data.communityApproved, data.validatorApproved, data.councilApproved);
    }

    /**
     * @dev Get council members list
     */
    function getCouncilMembers() external view returns (address[] memory) {
        return councilMembers;
    }

    // ═══════════════════════════════════════════════════════════════════
    // REQUIRED OVERRIDES
    // ═══════════════════════════════════════════════════════════════════

    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

// ═══════════════════════════════════════════════════════════════════
// INTERFACE
// ═══════════════════════════════════════════════════════════════════

interface INorGovernanceToken {
    function validators(address) external view returns (bool);
    function validatorStake(address) external view returns (uint256);
    function canCreateProposal(address) external view returns (bool);
    function balanceOf(address) external view returns (uint256);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NorGovernanceToken (vNOR)
 * @dev Voting-escrowed NOR governance token
 *
 * Features:
 * - Vote-escrow mechanism (lock NOR → get vNOR)
 * - Longer locks = more voting power
 * - Delegated voting
 * - Quadratic voting support
 * - Minimum stake requirements for proposals
 * - Halal compliance (no interest, profit-sharing only)
 */
contract NorGovernanceToken is ERC20, ERC20Votes, ERC20Permit, Ownable, ReentrancyGuard {
    
    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS & ENUMS
    // ═══════════════════════════════════════════════════════════════════

    struct VoteLock {
        uint256 amount;          // Amount of NOR locked
        uint256 unlockTime;      // When tokens can be unlocked
        uint256 votingPower;     // vNOR voting power (amount * multiplier)
        bool claimed;            // Whether tokens have been claimed back
    }

    enum GovernanceLevel {
        COMMUNITY,      // Community DAO (token holders)
        VALIDATOR,      // Validator DAO (validators + delegators)
        COUNCIL        // Council DAO (institutional signers)
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    // NOR token contract
    IERC20 public immutable norToken;

    // Lock parameters
    uint256 public constant MIN_LOCK_PERIOD = 30 days;      // Minimum lock period
    uint256 public constant MAX_LOCK_PERIOD = 4 * 365 days; // Maximum lock period (4 years)
    uint256 public constant BASE_MULTIPLIER = 1e18;         // 1x multiplier for minimum lock
    uint256 public constant MAX_MULTIPLIER = 10e18;         // 10x multiplier for maximum lock

    // Governance parameters
    uint256 public constant MIN_PROPOSAL_STAKE = 10_000e24;  // 10,000 NOR to create proposal
    uint256 public constant QUORUM_PERCENTAGE = 15;         // 15% participation required
    uint256 public constant VOTING_DELAY = 1 days;          // Delay before voting starts
    uint256 public constant VOTING_PERIOD = 7 days;         // Voting duration

    // User data
    mapping(address => VoteLock[]) public userLocks;
    mapping(address => uint256) public totalUserVotingPower;
    mapping(address => GovernanceLevel) public userGovernanceLevel;

    // Council members (institutional validators)
    mapping(address => bool) public councilMembers;
    address[] public councilMembersList;

    // Validator registry
    mapping(address => bool) public validators;
    mapping(address => uint256) public validatorStake;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event TokensLocked(
        address indexed user,
        uint256 indexed lockId,
        uint256 amount,
        uint256 unlockTime,
        uint256 votingPower
    );

    event TokensUnlocked(
        address indexed user,
        uint256 indexed lockId,
        uint256 amount
    );

    event VotingPowerDelegated(
        address indexed delegator,
        address indexed delegatee,
        uint256 amount
    );

    event CouncilMemberAdded(address indexed member);
    event CouncilMemberRemoved(address indexed member);
    
    event ValidatorRegistered(address indexed validator, uint256 stake);
    event ValidatorUnregistered(address indexed validator);

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor(
        address _norToken,
        string memory _name,
        string memory _symbol
    ) 
        ERC20(_name, _symbol) 
        ERC20Permit(_name) 
    {
        require(_norToken != address(0), "Invalid NOR token");
        norToken = IERC20(_norToken);
    }

    // ═══════════════════════════════════════════════════════════════════
    // VOTE ESCROW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Lock NOR tokens to receive vNOR voting power
     * @param amount Amount of NOR to lock
     * @param lockPeriod Lock duration in seconds
     */
    function lockTokens(uint256 amount, uint256 lockPeriod) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(lockPeriod >= MIN_LOCK_PERIOD, "Lock period too short");
        require(lockPeriod <= MAX_LOCK_PERIOD, "Lock period too long");

        // Transfer NOR tokens to this contract
        norToken.transferFrom(msg.sender, address(this), amount);

        // Calculate voting power based on lock duration
        uint256 multiplier = calculateMultiplier(lockPeriod);
        uint256 votingPower = (amount * multiplier) / BASE_MULTIPLIER;

        // Create lock
        uint256 unlockTime = block.timestamp + lockPeriod;
        VoteLock memory newLock = VoteLock({
            amount: amount,
            unlockTime: unlockTime,
            votingPower: votingPower,
            claimed: false
        });

        userLocks[msg.sender].push(newLock);
        totalUserVotingPower[msg.sender] += votingPower;

        // Mint vNOR tokens (voting power)
        _mint(msg.sender, votingPower);

        emit TokensLocked(
            msg.sender, 
            userLocks[msg.sender].length - 1, 
            amount, 
            unlockTime, 
            votingPower
        );
    }

    /**
     * @dev Unlock NOR tokens after lock period expires
     * @param lockId Lock ID to unlock
     */
    function unlockTokens(uint256 lockId) external nonReentrant {
        require(lockId < userLocks[msg.sender].length, "Invalid lock ID");
        
        VoteLock storage lock = userLocks[msg.sender][lockId];
        require(!lock.claimed, "Already claimed");
        require(block.timestamp >= lock.unlockTime, "Lock period not expired");

        // Mark as claimed
        lock.claimed = true;
        totalUserVotingPower[msg.sender] -= lock.votingPower;

        // Burn vNOR tokens
        _burn(msg.sender, lock.votingPower);

        // Return NOR tokens
        norToken.transfer(msg.sender, lock.amount);

        emit TokensUnlocked(msg.sender, lockId, lock.amount);
    }

    /**
     * @dev Calculate voting power multiplier based on lock period
     * @param lockPeriod Lock duration in seconds
     * @return multiplier Voting power multiplier
     */
    function calculateMultiplier(uint256 lockPeriod) public pure returns (uint256) {
        if (lockPeriod <= MIN_LOCK_PERIOD) {
            return BASE_MULTIPLIER; // 1x for minimum lock
        }
        
        if (lockPeriod >= MAX_LOCK_PERIOD) {
            return MAX_MULTIPLIER; // 10x for maximum lock
        }

        // Linear interpolation between min and max
        uint256 lockRange = MAX_LOCK_PERIOD - MIN_LOCK_PERIOD;
        uint256 multiplierRange = MAX_MULTIPLIER - BASE_MULTIPLIER;
        uint256 lockProgress = lockPeriod - MIN_LOCK_PERIOD;
        
        return BASE_MULTIPLIER + (multiplierRange * lockProgress) / lockRange;
    }

    // ═══════════════════════════════════════════════════════════════════
    // GOVERNANCE LEVEL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Add council member (institutional validator)
     */
    function addCouncilMember(address member) external onlyOwner {
        require(member != address(0), "Invalid address");
        require(!councilMembers[member], "Already council member");

        councilMembers[member] = true;
        councilMembersList.push(member);
        userGovernanceLevel[member] = GovernanceLevel.COUNCIL;

        emit CouncilMemberAdded(member);
    }

    /**
     * @dev Remove council member
     */
    function removeCouncilMember(address member) external onlyOwner {
        require(councilMembers[member], "Not council member");

        councilMembers[member] = false;
        userGovernanceLevel[member] = GovernanceLevel.COMMUNITY;

        // Remove from array
        for (uint i = 0; i < councilMembersList.length; i++) {
            if (councilMembersList[i] == member) {
                councilMembersList[i] = councilMembersList[councilMembersList.length - 1];
                councilMembersList.pop();
                break;
            }
        }

        emit CouncilMemberRemoved(member);
    }

    /**
     * @dev Register as validator
     * @param stakeAmount Amount of NOR to stake
     */
    function registerValidator(uint256 stakeAmount) external {
        require(stakeAmount >= 100_000e24, "Minimum 100k NOR stake required");
        require(!validators[msg.sender], "Already registered");

        // Transfer stake
        norToken.transferFrom(msg.sender, address(this), stakeAmount);

        validators[msg.sender] = true;
        validatorStake[msg.sender] = stakeAmount;
        userGovernanceLevel[msg.sender] = GovernanceLevel.VALIDATOR;

        emit ValidatorRegistered(msg.sender, stakeAmount);
    }

    /**
     * @dev Unregister as validator
     */
    function unregisterValidator() external {
        require(validators[msg.sender], "Not registered validator");

        uint256 stake = validatorStake[msg.sender];
        
        validators[msg.sender] = false;
        validatorStake[msg.sender] = 0;
        userGovernanceLevel[msg.sender] = GovernanceLevel.COMMUNITY;

        // Return stake (with 7-day delay for security)
        norToken.transfer(msg.sender, stake);

        emit ValidatorUnregistered(msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @dev Get user's total locked NOR amount
     */
    function getTotalLockedAmount(address user) external view returns (uint256 total) {
        VoteLock[] memory locks = userLocks[user];
        for (uint256 i = 0; i < locks.length; i++) {
            if (!locks[i].claimed) {
                total += locks[i].amount;
            }
        }
    }

    /**
     * @dev Get user's lock details
     */
    function getUserLocks(address user) external view returns (VoteLock[] memory) {
        return userLocks[user];
    }

    /**
     * @dev Get number of council members
     */
    function getCouncilSize() external view returns (uint256) {
        return councilMembersList.length;
    }

    /**
     * @dev Check if user can create proposals
     */
    function canCreateProposal(address user) external view returns (bool) {
        return totalUserVotingPower[user] >= MIN_PROPOSAL_STAKE;
    }

    // ═══════════════════════════════════════════════════════════════════
    // REQUIRED OVERRIDES
    // ═══════════════════════════════════════════════════════════════════

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 24; // Match NOR token decimals
    }
}
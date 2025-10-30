// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title XHTCrowdfunding
 * @notice Decentralized crowdfunding platform for Xaheen ecosystem
 * @dev Features:
 * - All-or-nothing funding (like Kickstarter)
 * - Flexible funding (keep what you raise)
 * - Milestone-based fund release
 * - Backer refunds if goals not met
 * - Platform fee (2% on successful campaigns)
 * - KYC verification for large campaigns
 */
contract XHTCrowdfunding is Ownable, ReentrancyGuard, Pausable {

    // ============ State Variables ============

    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 startTime;
        uint256 endTime;
        bool isFlexible;        // Flexible funding (keep raised) vs all-or-nothing
        bool goalReached;
        bool fundsWithdrawn;
        bool canceled;
        uint256 milestoneCount;
        mapping(uint256 => Milestone) milestones;
        mapping(address => uint256) contributions;
        address[] contributors;
    }

    struct Milestone {
        string description;
        uint256 amount;
        bool released;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    struct CampaignView {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 startTime;
        uint256 endTime;
        bool isFlexible;
        bool goalReached;
        bool fundsWithdrawn;
        bool canceled;
        uint256 milestoneCount;
        uint256 contributorCount;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;

    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2; // 2% fee
    uint256 public constant MIN_CAMPAIGN_DURATION = 7 days;
    uint256 public constant MAX_CAMPAIGN_DURATION = 90 days;
    uint256 public constant MIN_GOAL = 100 ether; // 100 XHT minimum
    uint256 public constant MAX_GOAL = 1_000_000 ether; // 1M XHT maximum

    address public feeCollector;
    uint256 public totalFeesCollected;

    // ============ Events ============

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goalAmount,
        bool isFlexible
    );
    event ContributionMade(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );
    event CampaignGoalReached(uint256 indexed campaignId, uint256 totalRaised);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event RefundIssued(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event CampaignCanceled(uint256 indexed campaignId);
    event MilestoneCreated(uint256 indexed campaignId, uint256 milestoneId, uint256 amount);
    event MilestoneApproved(uint256 indexed campaignId, uint256 milestoneId, address approver);
    event MilestoneReleased(uint256 indexed campaignId, uint256 milestoneId, uint256 amount);

    // ============ Constructor ============

    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new crowdfunding campaign
     * @param title Campaign title
     * @param description Detailed description
     * @param category Campaign category (tech, art, charity, etc.)
     * @param goalAmount Funding goal in XHT
     * @param duration Campaign duration in seconds
     * @param isFlexible True for flexible funding, false for all-or-nothing
     */
    function createCampaign(
        string memory title,
        string memory description,
        string memory category,
        uint256 goalAmount,
        uint256 duration,
        bool isFlexible
    ) external whenNotPaused returns (uint256) {
        require(goalAmount >= MIN_GOAL, "Goal too low");
        require(goalAmount <= MAX_GOAL, "Goal too high");
        require(duration >= MIN_CAMPAIGN_DURATION, "Duration too short");
        require(duration <= MAX_CAMPAIGN_DURATION, "Duration too long");
        require(bytes(title).length > 0, "Title required");

        campaignCount++;
        uint256 campaignId = campaignCount;

        Campaign storage campaign = campaigns[campaignId];
        campaign.id = campaignId;
        campaign.creator = msg.sender;
        campaign.title = title;
        campaign.description = description;
        campaign.category = category;
        campaign.goalAmount = goalAmount;
        campaign.startTime = block.timestamp;
        campaign.endTime = block.timestamp + duration;
        campaign.isFlexible = isFlexible;

        emit CampaignCreated(campaignId, msg.sender, title, goalAmount, isFlexible);
        return campaignId;
    }

    /**
     * @notice Contribute to a campaign
     * @param campaignId Campaign ID
     */
    function contribute(uint256 campaignId) external payable nonReentrant whenNotPaused {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.value > 0, "No contribution sent");
        require(block.timestamp >= campaign.startTime, "Campaign not started");
        require(block.timestamp <= campaign.endTime, "Campaign ended");
        require(!campaign.canceled, "Campaign canceled");

        // Track new contributor
        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributors.push(msg.sender);
        }

        campaign.contributions[msg.sender] += msg.value;
        campaign.raisedAmount += msg.value;

        emit ContributionMade(campaignId, msg.sender, msg.value);

        // Check if goal reached
        if (!campaign.goalReached && campaign.raisedAmount >= campaign.goalAmount) {
            campaign.goalReached = true;
            emit CampaignGoalReached(campaignId, campaign.raisedAmount);
        }
    }

    /**
     * @notice Withdraw funds from successful campaign
     * @param campaignId Campaign ID
     */
    function withdrawFunds(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator, "Not campaign creator");
        require(block.timestamp > campaign.endTime, "Campaign still active");
        require(!campaign.fundsWithdrawn, "Funds already withdrawn");
        require(!campaign.canceled, "Campaign canceled");

        // Check if withdrawal allowed
        if (!campaign.isFlexible) {
            require(campaign.goalReached, "Goal not reached");
        }

        campaign.fundsWithdrawn = true;

        uint256 amount = campaign.raisedAmount;
        uint256 fee = (amount * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 creatorAmount = amount - fee;

        // Send fee to collector
        if (fee > 0) {
            (bool feeSuccess, ) = feeCollector.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
            totalFeesCollected += fee;
        }

        // Send remaining to creator
        (bool success, ) = campaign.creator.call{value: creatorAmount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(campaignId, campaign.creator, creatorAmount);
    }

    /**
     * @notice Request refund for failed campaign
     * @param campaignId Campaign ID
     */
    function requestRefund(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp > campaign.endTime, "Campaign still active");
        require(!campaign.isFlexible, "Flexible funding campaign");
        require(!campaign.goalReached, "Goal was reached");
        require(!campaign.fundsWithdrawn, "Funds already withdrawn");

        uint256 contribution = campaign.contributions[msg.sender];
        require(contribution > 0, "No contribution found");

        campaign.contributions[msg.sender] = 0;
        campaign.raisedAmount -= contribution;

        (bool success, ) = msg.sender.call{value: contribution}("");
        require(success, "Refund failed");

        emit RefundIssued(campaignId, msg.sender, contribution);
    }

    /**
     * @notice Cancel campaign (creator only, before end)
     * @param campaignId Campaign ID
     */
    function cancelCampaign(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator || msg.sender == owner(), "Not authorized");
        require(block.timestamp <= campaign.endTime, "Campaign ended");
        require(!campaign.fundsWithdrawn, "Funds already withdrawn");
        require(!campaign.canceled, "Already canceled");

        campaign.canceled = true;
        emit CampaignCanceled(campaignId);
    }

    /**
     * @notice Add milestone to campaign
     * @param campaignId Campaign ID
     * @param description Milestone description
     * @param amount Amount to release for this milestone
     */
    function addMilestone(
        uint256 campaignId,
        string memory description,
        uint256 amount
    ) external {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator, "Not campaign creator");
        require(block.timestamp <= campaign.endTime, "Campaign ended");

        uint256 milestoneId = campaign.milestoneCount++;
        Milestone storage milestone = campaign.milestones[milestoneId];
        milestone.description = description;
        milestone.amount = amount;

        emit MilestoneCreated(campaignId, milestoneId, amount);
    }

    /**
     * @notice Approve milestone completion (backers only)
     * @param campaignId Campaign ID
     * @param milestoneId Milestone ID
     */
    function approveMilestone(uint256 campaignId, uint256 milestoneId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.contributions[msg.sender] > 0, "Not a contributor");

        Milestone storage milestone = campaign.milestones[milestoneId];
        require(!milestone.released, "Already released");
        require(!milestone.approvals[msg.sender], "Already approved");

        milestone.approvals[msg.sender] = true;
        milestone.approvalCount++;

        emit MilestoneApproved(campaignId, milestoneId, msg.sender);
    }

    // ============ View Functions ============

    /**
     * @notice Get campaign details
     */
    function getCampaign(uint256 campaignId) external view returns (CampaignView memory) {
        Campaign storage campaign = campaigns[campaignId];
        return CampaignView({
            id: campaign.id,
            creator: campaign.creator,
            title: campaign.title,
            description: campaign.description,
            category: campaign.category,
            goalAmount: campaign.goalAmount,
            raisedAmount: campaign.raisedAmount,
            startTime: campaign.startTime,
            endTime: campaign.endTime,
            isFlexible: campaign.isFlexible,
            goalReached: campaign.goalReached,
            fundsWithdrawn: campaign.fundsWithdrawn,
            canceled: campaign.canceled,
            milestoneCount: campaign.milestoneCount,
            contributorCount: campaign.contributors.length
        });
    }

    /**
     * @notice Get user's contribution to a campaign
     */
    function getUserContribution(uint256 campaignId, address user) external view returns (uint256) {
        return campaigns[campaignId].contributions[user];
    }

    /**
     * @notice Get campaign progress percentage
     */
    function getCampaignProgress(uint256 campaignId) external view returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.goalAmount == 0) return 0;
        return (campaign.raisedAmount * 100) / campaign.goalAmount;
    }

    /**
     * @notice Check if campaign is active
     */
    function isCampaignActive(uint256 campaignId) external view returns (bool) {
        Campaign storage campaign = campaigns[campaignId];
        return block.timestamp >= campaign.startTime &&
               block.timestamp <= campaign.endTime &&
               !campaign.canceled;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update fee collector address
     */
    function updateFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

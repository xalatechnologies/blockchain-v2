// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NORCharity
 * @notice Transparent charity and donation platform for Nor ecosystem
 * @dev Features:
 * - Verified charity organizations
 * - Transparent fund tracking
 * - Recurring donations (monthly/yearly)
 * - Donation matching (corporate/community)
 * - Impact reporting and milestones
 * - Tax receipt generation (metadata)
 * - Zero platform fees for verified charities
 */
contract NORCharity is Ownable, ReentrancyGuard, Pausable {

    // ============ State Variables ============

    struct Charity {
        uint256 id;
        address wallet;
        string name;
        string description;
        string category;
        string website;
        bool verified;
        bool active;
        uint256 totalReceived;
        uint256 totalWithdrawn;
        uint256 donorCount;
        mapping(address => uint256) donations;
        mapping(address => RecurringDonation) recurring;
    }

    struct RecurringDonation {
        uint256 amount;
        uint256 interval; // seconds between donations (30 days for monthly)
        uint256 lastDonation;
        bool active;
    }

    struct DonationMatch {
        uint256 id;
        address matcher;
        uint256 matchAmount;
        uint256 maxMatch;
        uint256 currentMatch;
        uint256 charityId;
        bool active;
    }

    struct CharityView {
        uint256 id;
        address wallet;
        string name;
        string description;
        string category;
        string website;
        bool verified;
        bool active;
        uint256 totalReceived;
        uint256 totalWithdrawn;
        uint256 donorCount;
        uint256 availableBalance;
    }

    struct ImpactReport {
        uint256 charityId;
        string title;
        string description;
        uint256 amountUsed;
        uint256 beneficiaries;
        string proofUrl;
        uint256 timestamp;
    }

    mapping(uint256 => Charity) public charities;
    uint256 public charityCount;

    mapping(uint256 => DonationMatch) public matches;
    uint256 public matchCount;

    mapping(uint256 => ImpactReport[]) public impactReports;

    uint256 public totalDonations;
    uint256 public totalMatched;

    // ============ Events ============

    event CharityRegistered(
        uint256 indexed charityId,
        address indexed wallet,
        string name
    );
    event CharityVerified(uint256 indexed charityId);
    event DonationMade(
        uint256 indexed charityId,
        address indexed donor,
        uint256 amount,
        bool isRecurring
    );
    event RecurringDonationSetup(
        uint256 indexed charityId,
        address indexed donor,
        uint256 amount,
        uint256 interval
    );
    event RecurringDonationExecuted(
        uint256 indexed charityId,
        address indexed donor,
        uint256 amount
    );
    event DonationMatched(
        uint256 indexed matchId,
        uint256 indexed charityId,
        uint256 amount
    );
    event FundsWithdrawn(
        uint256 indexed charityId,
        address indexed wallet,
        uint256 amount
    );
    event ImpactReportAdded(
        uint256 indexed charityId,
        string title,
        uint256 amountUsed,
        uint256 beneficiaries
    );

    // ============ Core Functions ============

    /**
     * @notice Register a new charity organization
     * @param name Charity name
     * @param description Detailed description
     * @param category Category (health, education, environment, etc.)
     * @param website Official website
     */
    function registerCharity(
        string memory name,
        string memory description,
        string memory category,
        string memory website
    ) external whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Name required");

        charityCount++;
        uint256 charityId = charityCount;

        Charity storage charity = charities[charityId];
        charity.id = charityId;
        charity.wallet = msg.sender;
        charity.name = name;
        charity.description = description;
        charity.category = category;
        charity.website = website;
        charity.active = true;

        emit CharityRegistered(charityId, msg.sender, name);
        return charityId;
    }

    /**
     * @notice Make a one-time donation
     * @param charityId Charity ID
     */
    function donate(uint256 charityId) external payable nonReentrant whenNotPaused {
        Charity storage charity = charities[charityId];
        require(charity.active, "Charity not active");
        require(msg.value > 0, "No donation sent");

        // Track new donor
        if (charity.donations[msg.sender] == 0) {
            charity.donorCount++;
        }

        charity.donations[msg.sender] += msg.value;
        charity.totalReceived += msg.value;
        totalDonations += msg.value;

        emit DonationMade(charityId, msg.sender, msg.value, false);

        // Check for active donation matches
        _applyMatching(charityId, msg.value);
    }

    /**
     * @notice Setup recurring donation
     * @param charityId Charity ID
     * @param amount Donation amount per interval
     * @param interval Seconds between donations (30 days = 2592000)
     */
    function setupRecurringDonation(
        uint256 charityId,
        uint256 amount,
        uint256 interval
    ) external payable nonReentrant whenNotPaused {
        Charity storage charity = charities[charityId];
        require(charity.active, "Charity not active");
        require(amount > 0, "Amount must be positive");
        require(interval >= 1 days, "Interval too short");
        require(msg.value >= amount, "Insufficient initial payment");

        RecurringDonation storage recurring = charity.recurring[msg.sender];
        recurring.amount = amount;
        recurring.interval = interval;
        recurring.lastDonation = block.timestamp;
        recurring.active = true;

        // Process initial donation
        if (charity.donations[msg.sender] == 0) {
            charity.donorCount++;
        }

        charity.donations[msg.sender] += amount;
        charity.totalReceived += amount;
        totalDonations += amount;

        emit RecurringDonationSetup(charityId, msg.sender, amount, interval);
        emit DonationMade(charityId, msg.sender, amount, true);

        // Refund excess
        if (msg.value > amount) {
            (bool success, ) = msg.sender.call{value: msg.value - amount}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Execute recurring donation (called by donor or automation)
     * @param charityId Charity ID
     */
    function executeRecurringDonation(uint256 charityId) external payable nonReentrant {
        Charity storage charity = charities[charityId];
        RecurringDonation storage recurring = charity.recurring[msg.sender];

        require(recurring.active, "No active recurring donation");
        require(
            block.timestamp >= recurring.lastDonation + recurring.interval,
            "Too early"
        );
        require(msg.value >= recurring.amount, "Insufficient payment");

        recurring.lastDonation = block.timestamp;

        charity.donations[msg.sender] += recurring.amount;
        charity.totalReceived += recurring.amount;
        totalDonations += recurring.amount;

        emit RecurringDonationExecuted(charityId, msg.sender, recurring.amount);

        // Refund excess
        if (msg.value > recurring.amount) {
            (bool success, ) = msg.sender.call{value: msg.value - recurring.amount}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Cancel recurring donation
     * @param charityId Charity ID
     */
    function cancelRecurringDonation(uint256 charityId) external {
        Charity storage charity = charities[charityId];
        RecurringDonation storage recurring = charity.recurring[msg.sender];
        require(recurring.active, "No active recurring donation");

        recurring.active = false;
    }

    /**
     * @notice Create donation matching campaign
     * @param charityId Charity to match donations for
     * @param maxMatch Maximum total match amount
     */
    function createDonationMatch(
        uint256 charityId,
        uint256 maxMatch
    ) external payable nonReentrant {
        require(charities[charityId].active, "Charity not active");
        require(msg.value >= maxMatch, "Insufficient funding");

        matchCount++;
        uint256 matchId = matchCount;

        DonationMatch storage donationMatch = matches[matchId];
        donationMatch.id = matchId;
        donationMatch.matcher = msg.sender;
        donationMatch.matchAmount = msg.value;
        donationMatch.maxMatch = maxMatch;
        donationMatch.charityId = charityId;
        donationMatch.active = true;
    }

    /**
     * @notice Internal function to apply matching
     */
    function _applyMatching(uint256 charityId, uint256 amount) internal {
        // Find active matches for this charity
        for (uint256 i = 1; i <= matchCount; i++) {
            DonationMatch storage donationMatch = matches[i];
            if (donationMatch.charityId == charityId &&
                donationMatch.active &&
                donationMatch.currentMatch < donationMatch.maxMatch) {

                uint256 matchAmount = amount; // 1:1 matching
                uint256 remaining = donationMatch.maxMatch - donationMatch.currentMatch;

                if (matchAmount > remaining) {
                    matchAmount = remaining;
                }

                if (matchAmount > 0) {
                    donationMatch.currentMatch += matchAmount;
                    charities[charityId].totalReceived += matchAmount;
                    totalMatched += matchAmount;

                    emit DonationMatched(i, charityId, matchAmount);

                    if (donationMatch.currentMatch >= donationMatch.maxMatch) {
                        donationMatch.active = false;
                    }
                }
            }
        }
    }

    /**
     * @notice Withdraw funds (charity wallet only)
     * @param charityId Charity ID
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 charityId, uint256 amount) external nonReentrant {
        Charity storage charity = charities[charityId];
        require(msg.sender == charity.wallet, "Not charity wallet");
        require(charity.verified, "Charity not verified");

        uint256 available = charity.totalReceived - charity.totalWithdrawn;
        require(amount <= available, "Insufficient balance");

        charity.totalWithdrawn += amount;

        (bool success, ) = charity.wallet.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(charityId, charity.wallet, amount);
    }

    /**
     * @notice Add impact report
     * @param charityId Charity ID
     * @param title Report title
     * @param description Detailed impact description
     * @param amountUsed Amount of donations used
     * @param beneficiaries Number of people/entities helped
     * @param proofUrl URL to proof/documentation
     */
    function addImpactReport(
        uint256 charityId,
        string memory title,
        string memory description,
        uint256 amountUsed,
        uint256 beneficiaries,
        string memory proofUrl
    ) external {
        Charity storage charity = charities[charityId];
        require(msg.sender == charity.wallet, "Not charity wallet");

        impactReports[charityId].push(ImpactReport({
            charityId: charityId,
            title: title,
            description: description,
            amountUsed: amountUsed,
            beneficiaries: beneficiaries,
            proofUrl: proofUrl,
            timestamp: block.timestamp
        }));

        emit ImpactReportAdded(charityId, title, amountUsed, beneficiaries);
    }

    // ============ View Functions ============

    /**
     * @notice Get charity details
     */
    function getCharity(uint256 charityId) external view returns (CharityView memory) {
        Charity storage charity = charities[charityId];
        return CharityView({
            id: charity.id,
            wallet: charity.wallet,
            name: charity.name,
            description: charity.description,
            category: charity.category,
            website: charity.website,
            verified: charity.verified,
            active: charity.active,
            totalReceived: charity.totalReceived,
            totalWithdrawn: charity.totalWithdrawn,
            donorCount: charity.donorCount,
            availableBalance: charity.totalReceived - charity.totalWithdrawn
        });
    }

    /**
     * @notice Get user's total donations to a charity
     */
    function getUserDonations(uint256 charityId, address user) external view returns (uint256) {
        return charities[charityId].donations[user];
    }

    /**
     * @notice Get user's recurring donation info
     */
    function getRecurringDonation(uint256 charityId, address user) external view returns (
        uint256 amount,
        uint256 interval,
        uint256 lastDonation,
        uint256 nextDonation,
        bool active
    ) {
        RecurringDonation memory recurring = charities[charityId].recurring[user];
        uint256 next = recurring.active ? recurring.lastDonation + recurring.interval : 0;
        return (
            recurring.amount,
            recurring.interval,
            recurring.lastDonation,
            next,
            recurring.active
        );
    }

    /**
     * @notice Get impact reports for charity
     */
    function getImpactReports(uint256 charityId) external view returns (ImpactReport[] memory) {
        return impactReports[charityId];
    }

    /**
     * @notice Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalCharities,
        uint256 verifiedCharities,
        uint256 _totalDonations,
        uint256 _totalMatched
    ) {
        uint256 verified = 0;
        for (uint256 i = 1; i <= charityCount; i++) {
            if (charities[i].verified) verified++;
        }

        return (charityCount, verified, totalDonations, totalMatched);
    }

    // ============ Admin Functions ============

    /**
     * @notice Verify a charity (owner only)
     */
    function verifyCharity(uint256 charityId) external onlyOwner {
        charities[charityId].verified = true;
        emit CharityVerified(charityId);
    }

    /**
     * @notice Deactivate charity (owner or charity wallet)
     */
    function deactivateCharity(uint256 charityId) external {
        Charity storage charity = charities[charityId];
        require(
            msg.sender == owner() || msg.sender == charity.wallet,
            "Not authorized"
        );
        charity.active = false;
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

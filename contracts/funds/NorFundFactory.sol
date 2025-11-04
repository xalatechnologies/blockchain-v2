// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NorFund.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NorFundFactory
 * @notice Factory contract for deploying new Nor Chain investment funds
 * @dev Manages fund creation, tracking, and verification
 */
contract NorFundFactory is AccessControl {

    bytes32 public constant FUND_CREATOR_ROLE = keccak256("FUND_CREATOR_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    struct FundInfo {
        address fundAddress;
        string fundName;
        string shariahStructure;
        address creator;
        uint256 createdAt;
        bool isActive;
        bool isVerified;  // Verified by regulator
    }

    address[] public deployedFunds;
    mapping(address => bool) public isFund;
    mapping(address => FundInfo) public fundInfo;

    // Track funds by creator
    mapping(address => address[]) public creatorFunds;

    // Statistics
    uint256 public totalFundsCreated;
    uint256 public activeFunds;

    event FundCreated(
        address indexed fundAddress,
        string name,
        string shariahStructure,
        address indexed creator,
        uint256 timestamp
    );

    event FundVerified(
        address indexed fundAddress,
        address indexed regulator,
        uint256 timestamp
    );

    event FundDeactivated(
        address indexed fundAddress,
        address indexed admin,
        string reason,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FUND_CREATOR_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }

    /**
     * @notice Deploy a new fund contract
     * @param _name ERC20 token name (e.g., "Nor Gold Savings Fund Shares")
     * @param _symbol ERC20 token symbol (e.g., "NGSF")
     * @param _fundName Display name (e.g., "Gold Savings Fund")
     * @param _shariahStructure Shariah structure (e.g., "Mudarabah", "Musharakah")
     * @param _managementFee Annual fee in basis points (e.g., 200 = 2%)
     * @param _minimumInvestment Minimum investment in USD (18 decimals)
     * @return fundAddress Address of newly created fund
     */
    function createFund(
        string memory _name,
        string memory _symbol,
        string memory _fundName,
        string memory _shariahStructure,
        uint256 _managementFee,
        uint256 _minimumInvestment
    ) external onlyRole(FUND_CREATOR_ROLE) returns (address fundAddress) {
        require(_managementFee <= 500, "Management fee too high"); // Max 5%
        require(_minimumInvestment > 0, "Minimum investment must be positive");

        // Deploy new fund
        NorFund fund = new NorFund(
            _name,
            _symbol,
            _fundName,
            _shariahStructure,
            _managementFee,
            _minimumInvestment
        );

        fundAddress = address(fund);

        // Transfer admin role to fund creator
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;
        fund.grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        fund.renounceRole(DEFAULT_ADMIN_ROLE, address(this));

        // Store fund info
        fundInfo[fundAddress] = FundInfo({
            fundAddress: fundAddress,
            fundName: _fundName,
            shariahStructure: _shariahStructure,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            isVerified: false
        });

        // Update tracking
        deployedFunds.push(fundAddress);
        isFund[fundAddress] = true;
        creatorFunds[msg.sender].push(fundAddress);
        totalFundsCreated++;
        activeFunds++;

        emit FundCreated(fundAddress, _fundName, _shariahStructure, msg.sender, block.timestamp);

        return fundAddress;
    }

    /**
     * @notice Verify fund (by regulator)
     * @param _fundAddress Address of fund to verify
     */
    function verifyFund(address _fundAddress) external onlyRole(REGULATOR_ROLE) {
        require(isFund[_fundAddress], "Not a fund");
        require(!fundInfo[_fundAddress].isVerified, "Already verified");

        fundInfo[_fundAddress].isVerified = true;

        emit FundVerified(_fundAddress, msg.sender, block.timestamp);
    }

    /**
     * @notice Deactivate fund
     * @param _fundAddress Address of fund to deactivate
     * @param _reason Reason for deactivation
     */
    function deactivateFund(
        address _fundAddress,
        string calldata _reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isFund[_fundAddress], "Not a fund");
        require(fundInfo[_fundAddress].isActive, "Already inactive");

        fundInfo[_fundAddress].isActive = false;
        activeFunds--;

        emit FundDeactivated(_fundAddress, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Get all deployed funds
     * @return Array of fund addresses
     */
    function getAllFunds() external view returns (address[] memory) {
        return deployedFunds;
    }

    /**
     * @notice Get active funds only
     * @return Array of active fund addresses
     */
    function getActiveFunds() external view returns (address[] memory) {
        address[] memory active = new address[](activeFunds);
        uint256 counter = 0;

        for (uint256 i = 0; i < deployedFunds.length; i++) {
            if (fundInfo[deployedFunds[i]].isActive) {
                active[counter] = deployedFunds[i];
                counter++;
            }
        }

        return active;
    }

    /**
     * @notice Get verified funds only
     * @return Array of verified fund addresses
     */
    function getVerifiedFunds() external view returns (address[] memory) {
        uint256 verifiedCount = 0;

        // Count verified funds
        for (uint256 i = 0; i < deployedFunds.length; i++) {
            if (fundInfo[deployedFunds[i]].isVerified && fundInfo[deployedFunds[i]].isActive) {
                verifiedCount++;
            }
        }

        // Populate array
        address[] memory verified = new address[](verifiedCount);
        uint256 counter = 0;

        for (uint256 i = 0; i < deployedFunds.length; i++) {
            if (fundInfo[deployedFunds[i]].isVerified && fundInfo[deployedFunds[i]].isActive) {
                verified[counter] = deployedFunds[i];
                counter++;
            }
        }

        return verified;
    }

    /**
     * @notice Get funds created by specific address
     * @param _creator Creator address
     * @return Array of fund addresses
     */
    function getFundsByCreator(address _creator) external view returns (address[] memory) {
        return creatorFunds[_creator];
    }

    /**
     * @notice Get fund details
     * @param _fundAddress Fund address
     * @return FundInfo struct
     */
    function getFundInfo(address _fundAddress) external view returns (FundInfo memory) {
        require(isFund[_fundAddress], "Not a fund");
        return fundInfo[_fundAddress];
    }

    /**
     * @notice Get number of deployed funds
     * @return Total number of funds
     */
    function getFundCount() external view returns (uint256) {
        return deployedFunds.length;
    }

    /**
     * @notice Check if address is a fund
     * @param _address Address to check
     * @return True if address is a fund
     */
    function isNorFund(address _address) external view returns (bool) {
        return isFund[_address];
    }

    /**
     * @notice Get factory statistics
     * @return totalCreated Total funds created
     * @return active Currently active funds
     * @return verified Total verified funds
     */
    function getStatistics() external view returns (
        uint256 totalCreated,
        uint256 active,
        uint256 verified
    ) {
        uint256 verifiedCount = 0;

        for (uint256 i = 0; i < deployedFunds.length; i++) {
            if (fundInfo[deployedFunds[i]].isVerified) {
                verifiedCount++;
            }
        }

        return (
            totalFundsCreated,
            activeFunds,
            verifiedCount
        );
    }
}

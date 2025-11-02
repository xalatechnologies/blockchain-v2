// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NOR - Noor Chain Native Token
 * @notice NOR (نور - "Light") is the native utility token of Noor Chain
 *
 * Token Economics:
 * - Total Supply: 21,000,000,000 NOR (21 billion)
 * - Decimals: 24 (ultra-high precision)
 * - Use Cases: Gas fees, staking, governance, liquidity provision, fund subscriptions
 *
 * Features:
 * - Burnable: Deflationary mechanism through burns
 * - Pausable: Emergency circuit breaker
 * - Access Control: Role-based permissions (MINTER_ROLE, PAUSER_ROLE)
 * - Shariah Compliant: No interest-bearing mechanisms
 *
 * Distribution:
 * - 30% Public Sale & Liquidity
 * - 25% Treasury & Grants
 * - 15% Team & Advisors (vested)
 * - 20% Reserve (locked)
 * - 5% Charity & Zakat Fund
 * - 5% Validators & Rewards
 */
contract NOR is ERC20, ERC20Burnable, Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 21_000_000_000 * 10**24; // 21 billion with 24 decimals

    // Vesting tracking
    mapping(address => VestingSchedule) public vestingSchedules;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
    }

    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    );

    event TokensVested(address indexed beneficiary, uint256 amount);

    constructor() ERC20("Noor Token", "NOR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Initial mint to deployer (will be distributed according to tokenomics)
        _mint(msg.sender, MAX_SUPPLY);
    }

    /**
     * @notice Returns 24 decimals for ultra-high precision
     * @dev Matches Noor Chain's native precision
     */
    function decimals() public pure override returns (uint8) {
        return 24;
    }

    /**
     * @notice Mints new tokens (capped at MAX_SUPPLY)
     * @dev Only callable by MINTER_ROLE
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "NOR: exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @notice Pauses all token transfers
     * @dev Only callable by PAUSER_ROLE, emergency use only
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Creates a vesting schedule for team/advisors
     * @param beneficiary Address to receive vested tokens
     * @param totalAmount Total tokens to vest
     * @param cliffDuration Cliff period in seconds
     * @param vestingDuration Total vesting period in seconds
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(beneficiary != address(0), "NOR: zero address");
        require(totalAmount > 0, "NOR: zero amount");
        require(vestingDuration > 0, "NOR: zero duration");
        require(vestingSchedules[beneficiary].totalAmount == 0, "NOR: schedule exists");

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration
        });

        // Transfer tokens to this contract for vesting
        _transfer(msg.sender, address(this), totalAmount);

        emit VestingScheduleCreated(
            beneficiary,
            totalAmount,
            block.timestamp,
            cliffDuration,
            vestingDuration
        );
    }

    /**
     * @notice Releases vested tokens to beneficiary
     */
    function releaseVestedTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "NOR: no vesting schedule");

        uint256 vestedAmount = _calculateVestedAmount(schedule);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;

        require(releasableAmount > 0, "NOR: no tokens to release");

        schedule.releasedAmount += releasableAmount;
        _transfer(address(this), msg.sender, releasableAmount);

        emit TokensVested(msg.sender, releasableAmount);
    }

    /**
     * @notice Calculates vested amount for a schedule
     */
    function _calculateVestedAmount(VestingSchedule memory schedule)
        private
        view
        returns (uint256)
    {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            return schedule.totalAmount;
        }

        uint256 timeVested = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeVested) / schedule.vestingDuration;
    }

    /**
     * @notice Returns releasable vested amount for an address
     */
    function releasableAmount(address beneficiary) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0) return 0;

        uint256 vestedAmount = _calculateVestedAmount(schedule);
        return vestedAmount - schedule.releasedAmount;
    }

    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}

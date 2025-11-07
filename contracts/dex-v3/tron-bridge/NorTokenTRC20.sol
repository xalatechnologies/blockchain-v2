// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NorTokenTRC20
 * @notice TRC-20 wrapped NOR token on Tron network
 * @dev Minted/burned by the Tron bridge contract
 *
 * Key Features:
 * - TRC-20 standard (ERC-20 compatible)
 * - Bridge-controlled minting/burning
 * - Pausable for emergencies
 * - 18 decimals (matching NorChain NOR)
 *
 * Supply Management:
 * - No fixed supply on Tron
 * - Minted when NOR locked on NorChain
 * - Burned when bridging back to NorChain
 * - 1:1 backing with NorChain NOR
 */
contract NorTokenTRC20 is ERC20, AccessControl, Pausable {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Total NOR tokens bridged from NorChain
    uint256 public totalBridged;

    /// @notice Total NOR tokens burned (bridged back)
    uint256 public totalBurned;

    /// @notice Mapping of nonces used for minting (replay protection)
    mapping(uint256 => bool) public usedNonces;

    /// @notice Emitted when tokens are minted by bridge
    event BridgeMint(
        address indexed to,
        uint256 amount,
        bytes32 indexed norChainTxHash,
        uint256 indexed nonce
    );

    /// @notice Emitted when tokens are burned for bridging back
    event BridgeBurn(
        address indexed from,
        uint256 amount,
        address indexed norChainAddress
    );

    constructor(
        address _bridgeAddress
    ) ERC20("NOR Token", "NOR") {
        require(_bridgeAddress != address(0), "ZERO_BRIDGE");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, _bridgeAddress);
    }

    /**
     * @notice Mint NOR tokens (bridge only)
     * @param to Recipient address on Tron
     * @param amount Amount to mint
     * @param norChainTxHash Transaction hash from NorChain proving the lock
     * @param nonce Unique nonce to prevent replay attacks
     */
    function bridgeMint(
        address to,
        uint256 amount,
        bytes32 norChainTxHash,
        uint256 nonce
    ) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        require(to != address(0), "ZERO_ADDRESS");
        require(amount > 0, "ZERO_AMOUNT");
        require(!usedNonces[nonce], "NONCE_USED");

        usedNonces[nonce] = true;
        totalBridged += amount;

        _mint(to, amount);

        emit BridgeMint(to, amount, norChainTxHash, nonce);
    }

    /**
     * @notice Burn NOR tokens to bridge back to NorChain (user function)
     * @param amount Amount to burn
     * @param norChainAddress Destination address on NorChain
     */
    function bridgeBurn(
        uint256 amount,
        address norChainAddress
    ) external whenNotPaused {
        require(amount > 0, "ZERO_AMOUNT");
        require(norChainAddress != address(0), "ZERO_ADDRESS");
        require(balanceOf(msg.sender) >= amount, "INSUFFICIENT_BALANCE");

        totalBurned += amount;

        _burn(msg.sender, amount);

        emit BridgeBurn(msg.sender, amount, norChainAddress);
    }

    /**
     * @notice Get circulating supply on Tron
     * @return Circulating supply (bridged - burned)
     */
    function circulatingSupply() external view returns (uint256) {
        return totalBridged - totalBurned;
    }

    /**
     * @notice Check if nonce is used
     */
    function isNonceUsed(uint256 nonce) external view returns (bool) {
        return usedNonces[nonce];
    }

    /**
     * @notice Emergency pause (operator only)
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    /**
     * @notice Override decimals to match NorChain (18 decimals)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @notice Standard TRC-20 transfer with pause check
     */
    function transfer(
        address to,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    /**
     * @notice Standard TRC-20 transferFrom with pause check
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}

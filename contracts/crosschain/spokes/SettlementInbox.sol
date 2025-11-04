// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SettlementInbox
 * @notice Logs fill events on spoke chains for relayer pickup
 * @dev Simple event emitter for cross-chain settlement
 *
 * Architecture:
 * - NorRouter calls emitFill() after each trade
 * - Events are picked up by off-chain relayer
 * - Relayer forwards receipts to SettlementHub on Nor
 * - Nonce-tracked to prevent replays
 */
contract SettlementInbox is Ownable {

    // ============ State Variables ============

    /// @notice NorRouter address (only authorized caller)
    address public router;

    /// @notice Fill nonce for ordering
    uint256 public fillNonce;

    /// @notice Processed fill tracking
    mapping(bytes32 => bool) public processedFills;

    // ============ Events ============

    /**
     * @notice Fill event emitted when a trade is executed
     * @param fillId Unique fill identifier
     * @param trader User who executed the trade
     * @param xhtDelta Net NOR change (positive = bought, negative = sold)
     * @param cashDelta Payment amount in USD (18 decimals)
     * @param nonce Fill nonce for ordering
     * @param timestamp Block timestamp
     */
    event Fill(
        bytes32 indexed fillId,
        address indexed trader,
        int256 xhtDelta,
        uint256 cashDelta,
        uint256 nonce,
        uint256 timestamp
    );

    event RouterUpdated(address indexed oldRouter, address indexed newRouter);

    // ============ Constructor ============

    constructor(address _router) {
        require(_router != address(0), "Invalid router address");
        router = _router;
    }

    // ============ Modifiers ============

    modifier onlyRouter() {
        require(msg.sender == router, "Only router can call");
        _;
    }

    // ============ Router Functions ============

    /**
     * @notice Emit fill event for relayer pickup
     * @param fillId Unique fill identifier (from router)
     * @param trader User who executed the trade
     * @param xhtDelta Net NOR change
     * @param cashDelta Payment amount
     */
    function emitFill(
        bytes32 fillId,
        address trader,
        int256 xhtDelta,
        uint256 cashDelta
    ) external onlyRouter {
        require(!processedFills[fillId], "Fill already emitted");

        // Mark as processed
        processedFills[fillId] = true;
        fillNonce++;

        // Emit event for relayer
        emit Fill(
            fillId,
            trader,
            xhtDelta,
            cashDelta,
            fillNonce,
            block.timestamp
        );
    }

    // ============ Owner Functions ============

    /**
     * @notice Update router address
     * @param newRouter New NorRouter address
     */
    function updateRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router");
        address oldRouter = router;
        router = newRouter;
        emit RouterUpdated(oldRouter, newRouter);
    }

    // ============ View Functions ============

    /**
     * @notice Check if fill has been processed
     * @param fillId Fill identifier
     */
    function isFillProcessed(bytes32 fillId) external view returns (bool) {
        return processedFills[fillId];
    }

    /**
     * @notice Get current fill nonce
     */
    function getCurrentNonce() external view returns (uint256) {
        return fillNonce;
    }
}

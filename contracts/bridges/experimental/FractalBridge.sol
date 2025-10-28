// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FractalBridge
 * @notice Self-similar recursive bridge - bridge the bridge
 * @dev Meta-bridge: can bridge between bridges, infinite recursion
 * 
 * GENIUS TRICK: Fractal consciousness - each transfer can spawn sub-transfers
 * Like a Mandelbrot set, but for token transfers!
 */
contract FractalBridge {
    
    IERC20 public immutable btcbr;
    
    struct FractalTransfer {
        address initiator;
        uint256 amount;
        uint256 depth;           // Recursion level
        bytes32 parentTransfer;  // Parent in fractal tree
        bytes32[] childTransfers;// Children spawned
        bool completed;
        mapping(address => uint256) splits; // Split to multiple recipients
    }
    
    mapping(bytes32 => FractalTransfer) public transfers;
    
    uint256 public constant MAX_DEPTH = 10; // Prevent infinite recursion
    
    event TransferCreated(bytes32 indexed transferId, bytes32 parent, uint256 depth);
    event TransferSplit(bytes32 indexed transferId, bytes32 childId, address recipient, uint256 amount);
    event FractalCompleted(bytes32 indexed transferId, uint256 totalDepth);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Create root fractal transfer
     */
    function initiate(uint256 amount) external returns (bytes32 transferId) {
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        transferId = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, uint256(0)));
        
        FractalTransfer storage transfer = transfers[transferId];
        transfer.initiator = msg.sender;
        transfer.amount = amount;
        transfer.depth = 0;
        transfer.parentTransfer = bytes32(0);
        
        emit TransferCreated(transferId, bytes32(0), 0);
    }
    
    /**
     * @notice Split transfer into fractal children
     * Each child can further split recursively!
     */
    function split(
        bytes32 parentId,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bytes32[] memory childIds) {
        FractalTransfer storage parent = transfers[parentId];
        require(msg.sender == parent.initiator, "Not initiator");
        require(!parent.completed, "Already completed");
        require(parent.depth < MAX_DEPTH, "Max depth reached");
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint256 totalSplit = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalSplit += amounts[i];
        }
        require(totalSplit <= parent.amount, "Exceeds parent amount");
        
        childIds = new bytes32[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            bytes32 childId = keccak256(abi.encodePacked(
                parentId,
                recipients[i],
                amounts[i],
                block.timestamp,
                i
            ));
            
            FractalTransfer storage child = transfers[childId];
            child.initiator = recipients[i];
            child.amount = amounts[i];
            child.depth = parent.depth + 1;
            child.parentTransfer = parentId;
            
            parent.childTransfers.push(childId);
            parent.splits[recipients[i]] = amounts[i];
            
            childIds[i] = childId;
            
            emit TransferSplit(parentId, childId, recipients[i], amounts[i]);
            emit TransferCreated(childId, parentId, parent.depth + 1);
        }
    }
    
    /**
     * @notice Claim leaf node (no children)
     * Collapses the fractal recursion at this point
     */
    function claim(bytes32 transferId) external {
        FractalTransfer storage transfer = transfers[transferId];
        require(msg.sender == transfer.initiator, "Not recipient");
        require(!transfer.completed, "Already completed");
        require(transfer.childTransfers.length == 0, "Has children, split first");
        
        transfer.completed = true;
        
        require(btcbr.transfer(transfer.initiator, transfer.amount), "Transfer failed");
        
        emit FractalCompleted(transferId, transfer.depth);
    }
    
    /**
     * @notice Get fractal tree depth
     */
    function getDepth(bytes32 transferId) external view returns (uint256) {
        return transfers[transferId].depth;
    }
    
    /**
     * @notice Get all children
     */
    function getChildren(bytes32 transferId) external view returns (bytes32[] memory) {
        return transfers[transferId].childTransfers;
    }
    
    /**
     * @notice Visualize fractal pattern (returns tree structure)
     */
    function visualizeFractal(bytes32 rootId) external view returns (string memory) {
        return _buildTree(rootId, 0);
    }
    
    function _buildTree(bytes32 nodeId, uint256 indent) internal view returns (string memory) {
        FractalTransfer storage node = transfers[nodeId];
        
        string memory result = "";
        for (uint256 i = 0; i < indent; i++) {
            result = string(abi.encodePacked(result, "  "));
        }
        result = string(abi.encodePacked(result, "|- ", _toHexString(nodeId), "\n"));
        
        for (uint256 i = 0; i < node.childTransfers.length; i++) {
            result = string(abi.encodePacked(result, _buildTree(node.childTransfers[i], indent + 1)));
        }
        
        return result;
    }
    
    function _toHexString(bytes32 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            uint8 b = uint8(value[i]);
            buffer[i * 2] = _HEX_SYMBOLS[b >> 4];
            buffer[i * 2 + 1] = _HEX_SYMBOLS[b & 0x0f];
        }
        return string(buffer);
    }
    
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";
}

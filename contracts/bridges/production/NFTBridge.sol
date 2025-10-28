// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title NFTBridge
 * @notice Bridge ERC20 tokens as NFTs - each transfer becomes collectible
 * @dev Wrap transfers in NFTs that can be traded, collected, displayed
 * 
 * GENIUS TRICK: Your bridge transfer becomes a tradeable NFT!
 * Use cases: Collectible transactions, transfer vouchers, historical records
 */
contract NFTBridge is ERC721 {
    
    IERC20 public immutable btcbr;
    
    uint256 public nextTokenId = 1;
    
    struct TransferNFT {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        uint256 sourceChain;
        uint256 destChain;
        bool redeemed;
        string metadata;        // Custom message, image, etc.
    }
    
    mapping(uint256 => TransferNFT) public transfers;
    
    event TransferMinted(uint256 indexed tokenId, address from, uint256 amount);
    event TransferRedeemed(uint256 indexed tokenId, address recipient);
    
    constructor(address _btcbr) ERC721("BTCBR Bridge Transfer", "BRIDGE") {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Create transfer as NFT
     * Lock tokens and mint NFT representing the transfer
     */
    function mintTransfer(
        uint256 amount,
        address recipient,
        string calldata metadata
    ) external returns (uint256 tokenId) {
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        tokenId = nextTokenId++;
        
        transfers[tokenId] = TransferNFT({
            from: msg.sender,
            to: recipient,
            amount: amount,
            timestamp: block.timestamp,
            sourceChain: block.chainid,
            destChain: 0, // Set on redemption
            redeemed: false,
            metadata: metadata
        });
        
        _mint(msg.sender, tokenId);
        
        emit TransferMinted(tokenId, msg.sender, amount);
    }
    
    /**
     * @notice Redeem NFT on destination chain
     * Burn NFT, receive tokens
     */
    function redeemTransfer(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        TransferNFT storage transfer = transfers[tokenId];
        require(!transfer.redeemed, "Already redeemed");
        
        transfer.redeemed = true;
        transfer.destChain = block.chainid;
        
        _burn(tokenId);
        
        require(btcbr.transfer(msg.sender, transfer.amount), "Transfer failed");
        
        emit TransferRedeemed(tokenId, msg.sender);
    }
    
    /**
     * @notice Trade NFT - transfer ownership of pending transfer
     * Someone can buy your unredeemed transfer!
     */
    function tradeTransfer(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        TransferNFT storage transfer = transfers[tokenId];
        require(!transfer.redeemed, "Already redeemed");
        
        // Marketplace logic would go here
        // For now, just standard ERC721 transfers work
    }
    
    /**
     * @notice Get transfer history as NFT collection
     */
    function getTransferHistory(address user) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(user);
        uint256[] memory tokenIds = new uint256[](balance);
        
        uint256 found = 0;
        for (uint256 i = 1; i < nextTokenId && found < balance; i++) {
            try this.ownerOf(i) returns (address owner) {
                if (owner == user) {
                    tokenIds[found] = i;
                    found++;
                }
            } catch {
                continue;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @notice Generate metadata URI for NFT
     * Could include: transfer amount, timestamp, route, custom art
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token doesn't exist");
        TransferNFT storage transfer = transfers[tokenId];
        
        // In production: generate JSON with SVG art showing transfer details
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _encode(abi.encodePacked(
                '{"name":"Bridge Transfer #', _toString(tokenId), '",',
                '"description":"', transfer.metadata, '",',
                '"amount":', _toString(transfer.amount), ',',
                '"from":"', _toHexString(transfer.from), '"}'
            ))
        ));
    }
    
    // Helper functions
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _toHexString(address addr) internal pure returns (string memory) {
        return _toHexString(uint256(uint160(addr)), 20);
    }
    
    function _toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }
    
    function _encode(bytes memory data) internal pure returns (string memory) {
        // Base64 encoding - simplified
        return ""; // Would implement full base64
    }
    
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";
}

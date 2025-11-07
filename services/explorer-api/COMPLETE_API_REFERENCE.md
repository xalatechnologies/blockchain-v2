# Complete API Reference - Etherscan/BSCScan v2 Compatible

This document provides a complete reference of all API endpoints available in the Nor Chain Explorer API, designed to be fully compatible with Etherscan and BSCScan API v2.

**Base URL**: `https://api.norchain.org/api`  
**Chain ID**: 65001 (Nor Chain)

---

## 📋 Table of Contents

1. [Account APIs](#account-apis)
2. [Transaction APIs](#transaction-apis)
3. [Block APIs](#block-apis)
4. [Token APIs](#token-apis)
5. [Contract APIs](#contract-apis)
6. [Stats APIs](#stats-apis)
7. [Logs APIs](#logs-apis)
8. [Portfolio APIs](#portfolio-apis)
9. [Proxy APIs](#proxy-apis)

---

## Account APIs

### Get Account Balance
**Endpoint**: `GET /api/account/balance`  
**Description**: Get NOR balance for a given address

**Parameters**:
- `address` (required) - Address to check balance

**Example**:
```bash
curl "https://api.norchain.org/api/account/balance?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": "1000000000000000000"
}
```

---

### Get Transaction List
**Endpoint**: `GET /api/account/txlist`  
**Description**: Get list of transactions for an address

**Parameters**:
- `address` (required) - Address
- `startblock` (optional) - Starting block (default: 0)
- `endblock` (optional) - Ending block (default: "latest")
- `page` (optional) - Page number (default: 1)
- `offset` (optional) - Results per page (default: 10)
- `sort` (optional) - Sort order: "asc" or "desc" (default: "desc")

---

### Get Internal Transactions
**Endpoint**: `GET /api/account/txlistinternal`  
**Description**: Get internal transactions (contract calls) for an address  
**Etherscan/BSCScan Compatible**

**Parameters**: Same as `txlist`

**Note**: Requires trace API support for full functionality

---

### Get Token Transfers (ERC-20)
**Endpoint**: `GET /api/account/tokentx`  
**Description**: Get ERC-20 token transfers for an address

**Parameters**:
- `address` (required) - Address
- `contractaddress` (optional) - Filter by token contract
- `startblock`, `endblock`, `page`, `offset`, `sort` - Same as above

---

### Get NFT Transfers (ERC-721)
**Endpoint**: `GET /api/account/tokennfttx`  
**Description**: Get ERC-721 NFT token transfers for an address  
**Etherscan/BSCScan Compatible**

**Parameters**: Same as `tokentx`

**Response includes**:
- `tokenID` - NFT token ID
- `tokenName`, `tokenSymbol` - NFT metadata

---

### Get Token List
**Endpoint**: `GET /api/account/tokenlist`  
**Description**: Get list of tokens held by an address

**Parameters**:
- `address` (required) - Address

---

### Get Multiple Account Balances
**Endpoint**: `GET /api/account/balancemulti`  
**Description**: Get balances for multiple addresses in one call  
**Etherscan/BSCScan Compatible**

**Parameters**:
- `address` (required) - Comma-separated list of addresses (max 20)
- `tag` (optional) - Block tag (default: "latest")

**Example**:
```bash
curl "https://api.norchain.org/api/account/balancemulti?address=0x123...,0x456..."
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": [
    {
      "account": "0x123...",
      "balance": "1000000000000000000"
    },
    {
      "account": "0x456...",
      "balance": "2000000000000000000"
    }
  ]
}
```

---

### Get Mined Blocks
**Endpoint**: `GET /api/account/getminedblocks`  
**Description**: Get blocks mined by an address (validator)

**Parameters**:
- `address` (required) - Validator address
- `blocktype` (optional) - "blocks" or "uncles" (default: "blocks")
- `page`, `offset` - Pagination

---

## Transaction APIs

### Get Transaction Status
**Endpoint**: `GET /api/transaction/getstatus`  
**Description**: Get transaction execution status

**Parameters**:
- `txhash` (required) - Transaction hash

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "isError": "0",
    "errDescription": ""
  }
}
```

---

### Get Transaction Receipt Status
**Endpoint**: `GET /api/transaction/gettxreceiptstatus`  
**Description**: Get transaction receipt status (1 = success, 0 = failed)

**Parameters**:
- `txhash` (required) - Transaction hash

---

### Get Transaction Receipt
**Endpoint**: `GET /api/transaction/gettxreceipt`  
**Description**: Get full transaction receipt with logs

**Parameters**:
- `txhash` (required) - Transaction hash

**Response includes**:
- Block information
- Gas usage
- Contract address (if contract creation)
- Event logs
- Status

---

### Get Transaction Info
**Endpoint**: `GET /api/transaction/gettxinfo`  
**Description**: Get detailed transaction information

**Parameters**:
- `txhash` (required) - Transaction hash

**Response includes**:
- Transaction details
- Block number and timestamp
- Gas information
- Confirmations
- Error status

---

## Block APIs

### Get Block Info
**Endpoint**: `GET /api/block/getblockinfo`  
**Description**: Get detailed block information

**Parameters**:
- `blockno` (required) - Block number

**Response includes**:
- Block number, hash, timestamp
- Miner/validator address
- Gas used/limit
- Transaction count
- Difficulty

---

### Get Block Reward
**Endpoint**: `GET /api/block/getblockreward`  
**Description**: Get block reward information

**Parameters**:
- `blockno` (required) - Block number

---

### Get Block Countdown
**Endpoint**: `GET /api/block/getblockcountdown`  
**Description**: Get countdown to a specific block

**Parameters**:
- `blockno` (required) - Target block number

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "CurrentBlock": "12345",
    "CountdownBlock": "50000",
    "RemainingBlock": "37655",
    "EstimateTimeInSec": "112965"
  }
}
```

---

### Get Block Number by Time
**Endpoint**: `GET /api/block/getblocknobytime`  
**Description**: Get block number closest to a timestamp

**Parameters**:
- `timestamp` (required) - Unix timestamp
- `closest` (optional) - "before" or "after" (default: "before")

---

## Token APIs

### Get Token Info
**Endpoint**: `GET /api/token/tokeninfo`  
**Description**: Get ERC-20 token information

**Parameters**:
- `contractaddress` (required) - Token contract address

**Response includes**:
- Token name, symbol, decimals
- Total supply
- Contract address
- Social links (if available)

---

### Get Token Supply
**Endpoint**: `GET /api/token/tokensupply`  
**Description**: Get total token supply

**Parameters**:
- `contractaddress` (required) - Token contract address

**Response**: Total supply as string

---

### Get Token Balance
**Endpoint**: `GET /api/token/tokenbalance`  
**Description**: Get token balance for an address

**Parameters**:
- `contractaddress` (required) - Token contract address
- `address` (required) - Address to check

---

### Get Token Transfers
**Endpoint**: `GET /api/token/tokentx`  
**Description**: Get token transfer history

**Parameters**:
- `contractaddress` (required) - Token contract address
- `address` (optional) - Filter by address
- `startblock`, `endblock`, `page`, `offset`, `sort` - Pagination

---

### Get NFT Transfers
**Endpoint**: `GET /api/token/tokennfttx`  
**Description**: Get ERC-721 NFT transfer history  
**Etherscan/BSCScan Compatible**

**Parameters**: Same as `tokentx`

**Response includes**:
- `tokenID` - NFT token ID
- Transfer details

---

### Get Token Holder List
**Endpoint**: `GET /api/token/tokenholderlist`  
**Description**: Get list of token holders

**Parameters**:
- `contractaddress` (required) - Token contract address
- `page`, `offset` - Pagination

**Note**: Requires full blockchain indexing

---

## Contract APIs

### Get Contract ABI
**Endpoint**: `GET /api/contract/getabi`  
**Description**: Get verified contract ABI

**Parameters**:
- `address` (required) - Contract address

**Note**: Requires contract verification

---

### Get Contract Source Code
**Endpoint**: `GET /api/contract/getsourcecode`  
**Description**: Get verified contract source code

**Parameters**:
- `address` (required) - Contract address

---

### Verify Contract Source Code
**Endpoint**: `POST /api/contract/verifysourcecode`  
**Description**: Submit contract for verification

**Body**:
```json
{
  "contractaddress": "0x...",
  "sourceCode": "...",
  "codeformat": "solidity-single-file",
  "contractname": "MyContract",
  "compilerversion": "v0.8.20+commit.a1b79de6",
  "optimizationUsed": "0",
  "runs": "200",
  "constructorArguements": ""
}
```

**Note**: Requires compilation service

---

### Get Contract Creation
**Endpoint**: `GET /api/contract/getcontractcreation`  
**Description**: Get contract creation transaction

**Parameters**:
- `contractaddresses` (required) - Comma-separated contract addresses

---

## Stats APIs

### Get Network Stats
**Endpoint**: `GET /api/stats/networkstats`  
**Description**: Get comprehensive network statistics

**Response includes**:
- Chain ID, chain name
- Current block
- Block time
- Gas prices
- Peer count

---

### Get Gas Oracle
**Endpoint**: `GET /api/stats/gasoracle`  
**Description**: Get current gas price recommendations

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "LastBlock": "12345",
    "SafeGasPrice": "3000000000",
    "ProposeGasPrice": "3000000000",
    "FastGasPrice": "3000000000",
    "suggestBaseFee": "3000000000",
    "gasUsedRatio": "50.00"
  }
}
```

---

### Get Node Count
**Endpoint**: `GET /api/stats/nodecount`  
**Description**: Get number of connected nodes

---

### Get ETH/NOR Supply
**Endpoint**: `GET /api/stats/ethsupply`  
**Description**: Get total native token supply

---

### Get Chain Size
**Endpoint**: `GET /api/stats/chainsize`  
**Description**: Get blockchain size information

---

## Logs APIs

### Get Event Logs
**Endpoint**: `GET /api/logs/getLogs`  
**Description**: Get event logs with filtering  
**Etherscan/BSCScan Compatible**

**Parameters**:
- `address` (optional) - Contract address
- `fromBlock` (optional) - Starting block
- `toBlock` (optional) - Ending block (default: "latest")
- `topic0` (optional) - First topic (event signature)
- `topic1`, `topic2`, `topic3` (optional) - Additional topics
- `page`, `offset` - Pagination

**Example**:
```bash
curl "https://api.norchain.org/api/logs/getLogs?address=0x...&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&fromBlock=0&toBlock=latest"
```

**Response includes**:
- Log address
- Topics array
- Data
- Block information
- Transaction hash

---

## Portfolio APIs

### Get Address Portfolio
**Endpoint**: `GET /api/portfolio/getaddressportfolio`  
**Description**: Get complete token portfolio for an address  
**Etherscan API v2 Compatible**

**Parameters**:
- `address` (required) - Address
- `chainid` (optional) - Chain ID (default: 65001)

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "address": "0x...",
    "chainId": "65001",
    "nativeBalance": "1000000000000000000",
    "nativeBalanceFormatted": "1.0",
    "tokens": [
      {
        "contractAddress": "0x...",
        "tokenName": "Nor Token",
        "symbol": "NOR",
        "decimals": "18",
        "balance": "500000000000000000000",
        "balanceFormatted": "500.0"
      }
    ]
  }
}
```

---

## Proxy APIs

### JSON-RPC Proxy
**Endpoint**: `POST /api/proxy/eth_*`  
**Description**: Proxy any JSON-RPC method directly to blockchain node

**Body**:
```json
{
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

**Supported Methods**:
- `eth_blockNumber`
- `eth_getBalance`
- `eth_getTransactionByHash`
- `eth_getBlockByNumber`
- `eth_getBlockByHash`
- `eth_call`
- `eth_estimateGas`
- `eth_getLogs`
- `eth_sendRawTransaction`
- And all other standard JSON-RPC methods

---

### Convenience GET Endpoints

**Get Block Number**:
```bash
GET /api/proxy/eth_blockNumber
```

**Get Balance**:
```bash
GET /api/proxy/eth_getBalance?address=0x...&tag=latest
```

**Get Transaction**:
```bash
GET /api/proxy/eth_getTransactionByHash?txhash=0x...
```

**Get Block**:
```bash
GET /api/proxy/eth_getBlockByNumber?tag=latest&full=false
```

---

## Response Format

All endpoints follow Etherscan-compatible format:

**Success**:
```json
{
  "status": "1",
  "message": "OK",
  "result": { ... }
}
```

**Error**:
```json
{
  "status": "0",
  "message": "Error description",
  "result": null
}
```

---

## Rate Limits

- **Default**: 100 requests/minute per IP
- **Strict endpoints**: 10 requests/minute
- Rate limit headers included in responses

---

## API Keys

Optional API key authentication for higher rate limits:

**Query Parameter**:
```bash
?apikey=YOUR_API_KEY
```

**Header**:
```bash
X-API-Key: YOUR_API_KEY
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| "1" | Success |
| "0" | Error |

---

## Compatibility

This API is designed to be **100% compatible** with:
- ✅ Etherscan API v2
- ✅ BSCScan API v2
- ✅ Standard JSON-RPC 2.0

All endpoints follow the same parameter names, response formats, and error handling as Etherscan/BSCScan.

---

## Support

- **Documentation**: https://docs.norchain.org/api
- **GitHub**: https://github.com/nor-chain/blockchain-v2
- **Email**: support@norchain.org

---

**Last Updated**: 2025-11-07  
**API Version**: 1.0.0  
**Chain ID**: 65001 (Nor Chain)


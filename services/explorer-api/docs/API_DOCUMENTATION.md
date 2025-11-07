# Nor Chain Explorer API - Complete Documentation

## Overview

The Nor Chain Explorer API provides comprehensive blockchain data access similar to Etherscan, BSCScan, and TronScan APIs. It's designed to be compatible with existing explorer API patterns while optimized for Nor Chain (Chain ID: 65001).

**Base URL**: `https://api.norchain.org/api` (or your deployment URL)

**Response Format**: All endpoints return JSON in Etherscan-compatible format:

```json
{
  "status": "1",  // "1" = success, "0" = error
  "message": "OK",
  "result": { ... }
}
```

---

## Table of Contents

1. [Account APIs](#account-apis)
2. [Transaction APIs](#transaction-apis)
3. [Block APIs](#block-apis)
4. [Token APIs](#token-apis)
5. [Contract APIs](#contract-apis)
6. [Stats APIs](#stats-apis)
7. [Proxy APIs](#proxy-apis)
8. [Error Codes](#error-codes)
9. [Rate Limits](#rate-limits)

---

## Account APIs

### Get Account Balance

Get the NOR balance for a given address.

**Endpoint**: `GET /api/account/balance`

**Parameters**:
- `address` (required) - Address to check balance for

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

Get a list of transactions for an address.

**Endpoint**: `GET /api/account/txlist`

**Parameters**:
- `address` (required) - Address to get transactions for
- `startblock` (optional) - Starting block number (default: 0)
- `endblock` (optional) - Ending block number (default: "latest")
- `page` (optional) - Page number (default: 1)
- `offset` (optional) - Number of transactions per page (default: 10)
- `sort` (optional) - Sort order: "asc" or "desc" (default: "desc")

**Example**:
```bash
curl "https://api.norchain.org/api/account/txlist?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0&page=1&offset=10"
```

**Note**: Full transaction history requires blockchain indexing. Currently returns placeholder.

---

### Get Token Transfers

Get ERC-20 token transfers for an address.

**Endpoint**: `GET /api/account/tokentx`

**Parameters**:
- `address` (required) - Address to get transfers for
- `contractaddress` (optional) - Filter by specific token contract
- `startblock` (optional) - Starting block number (default: 0)
- `endblock` (optional) - Ending block number (default: "latest")
- `page` (optional) - Page number (default: 1)
- `offset` (optional) - Number of transfers per page (default: 10)
- `sort` (optional) - Sort order: "asc" or "desc" (default: "desc")

**Example**:
```bash
curl "https://api.norchain.org/api/account/tokentx?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0&contractaddress=0x26c0eaF731885b14c031cc50dB79b36458E0b355"
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": [
    {
      "blockNumber": "12345",
      "timeStamp": "1699123456",
      "hash": "0x...",
      "from": "0x...",
      "to": "0x...",
      "value": "1000000000000000000",
      "tokenName": "Nor Token",
      "tokenSymbol": "NOR",
      "tokenDecimal": "18",
      "transactionIndex": "0",
      "gas": "21000",
      "gasPrice": "3000000000",
      "gasUsed": "21000",
      "cumulativeGasUsed": "21000",
      "input": "deprecated",
      "confirmations": "100"
    }
  ]
}
```

---

### Get Token List

Get list of tokens held by an address.

**Endpoint**: `GET /api/account/tokenlist`

**Parameters**:
- `address` (required) - Address to get tokens for

**Note**: Requires token registry. Use `/tokentx` endpoint instead.

---

## Transaction APIs

### Get Transaction Status

Get the status of a transaction (success/failure).

**Endpoint**: `GET /api/transaction/getstatus`

**Parameters**:
- `txhash` (required) - Transaction hash

**Example**:
```bash
curl "https://api.norchain.org/api/transaction/getstatus?txhash=0x..."
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "isError": "0",
    "errDescription": ""
  }
```

---

### Get Transaction Receipt

Get full transaction receipt with logs.

**Endpoint**: `GET /api/transaction/gettxreceipt`

**Parameters**:
- `txhash` (required) - Transaction hash

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "blockNumber": "12345",
    "blockHash": "0x...",
    "transactionIndex": "0",
    "hash": "0x...",
    "from": "0x...",
    "to": "0x...",
    "gasUsed": "21000",
    "cumulativeGasUsed": "21000",
    "contractAddress": null,
    "logs": [...],
    "status": "1",
    "logsBloom": "0x...",
    "gasPrice": "3000000000",
    "effectiveGasPrice": "3000000000"
  }
}
```

---

### Get Transaction Info

Get detailed transaction information.

**Endpoint**: `GET /api/transaction/gettxinfo`

**Parameters**:
- `txhash` (required) - Transaction hash

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "blockNumber": "12345",
    "timeStamp": "1699123456",
    "hash": "0x...",
    "from": "0x...",
    "to": "0x...",
    "value": "1000000000000000000",
    "gas": "21000",
    "gasPrice": "3000000000",
    "gasUsed": "21000",
    "cumulativeGasUsed": "21000",
    "input": "0x",
    "confirmations": "100",
    "isError": "0",
    "txreceipt_status": "1",
    "contractAddress": null
  }
}
```

---

## Block APIs

### Get Block Info

Get detailed block information.

**Endpoint**: `GET /api/block/getblockinfo`

**Parameters**:
- `blockno` (required) - Block number

**Example**:
```bash
curl "https://api.norchain.org/api/block/getblockinfo?blockno=12345"
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "blockNumber": "12345",
    "timeStamp": "1699123456",
    "blockMiner": "0x...",
    "blockReward": "0",
    "uncles": [],
    "uncleInclusionReward": "0",
    "difficulty": "0",
    "totalDifficulty": "0",
    "size": "30000000",
    "gasUsed": "15000000",
    "gasLimit": "30000000",
    "extraData": "0x",
    "hash": "0x...",
    "parentHash": "0x...",
    "sha3Uncles": "0x...",
    "nonce": "0x0000000000000000",
    "transactions": "10"
  }
}
```

---

### Get Block Reward

Get block reward information.

**Endpoint**: `GET /api/block/getblockreward`

**Parameters**:
- `blockno` (required) - Block number

---

### Get Block Countdown

Get countdown to a specific block number.

**Endpoint**: `GET /api/block/getblockcountdown`

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

## Token APIs

### Get Token Info

Get ERC-20 token information.

**Endpoint**: `GET /api/token/tokeninfo`

**Parameters**:
- `contractaddress` (required) - Token contract address

**Example**:
```bash
curl "https://api.norchain.org/api/token/tokeninfo?contractaddress=0x26c0eaF731885b14c031cc50dB79b36458E0b355"
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "contractAddress": "0x26c0eaF731885b14c031cc50dB79b36458E0b355",
    "tokenName": "Nor Token",
    "symbol": "NOR",
    "divisor": "18",
    "tokenType": "ERC20",
    "totalSupply": "1000000000000000000000000",
    "blueCheckmark": "false",
    "description": "",
    "website": "",
    "email": "",
    "blog": "",
    "reddit": "",
    "slack": "",
    "facebook": "",
    "twitter": "",
    "github": "",
    "telegram": "",
    "wechat": "",
    "linkedin": "",
    "discord": ""
  }
}
```

---

### Get Token Supply

Get total token supply.

**Endpoint**: `GET /api/token/tokensupply`

**Parameters**:
- `contractaddress` (required) - Token contract address

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": "1000000000000000000000000"
}
```

---

### Get Token Balance

Get token balance for an address.

**Endpoint**: `GET /api/token/tokenbalance`

**Parameters**:
- `contractaddress` (required) - Token contract address
- `address` (required) - Address to check balance for

**Example**:
```bash
curl "https://api.norchain.org/api/token/tokenbalance?contractaddress=0x26c0eaF731885b14c031cc50dB79b36458E0b355&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
```

---

### Get Token Transfers

Get token transfer history.

**Endpoint**: `GET /api/token/tokentx`

**Parameters**:
- `contractaddress` (required) - Token contract address
- `address` (optional) - Filter by address
- `startblock` (optional) - Starting block
- `endblock` (optional) - Ending block
- `page` (optional) - Page number
- `offset` (optional) - Results per page
- `sort` (optional) - Sort order

---

## Contract APIs

### Get Contract ABI

Get verified contract ABI.

**Endpoint**: `GET /api/contract/getabi`

**Parameters**:
- `address` (required) - Contract address

**Note**: Requires contract verification.

---

### Get Contract Source Code

Get verified contract source code.

**Endpoint**: `GET /api/contract/getsourcecode`

**Parameters**:
- `address` (required) - Contract address

---

### Verify Contract Source Code

Submit contract source code for verification.

**Endpoint**: `POST /api/contract/verifysourcecode`

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

**Note**: Requires compilation service (not yet implemented).

---

## Stats APIs

### Get Network Stats

Get comprehensive network statistics.

**Endpoint**: `GET /api/stats/networkstats`

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "chainId": "65001",
    "chainName": "Nor Chain",
    "currentBlock": "12345",
    "blockTime": "3",
    "gasPrice": "3000000000",
    "gasLimit": "30000000",
    "gasUsed": "15000000",
    "peerCount": "3",
    "networkId": "65001",
    "nativeCurrency": "NOR"
  }
}
```

---

### Get Gas Oracle

Get current gas price information.

**Endpoint**: `GET /api/stats/gasoracle`

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

Get number of connected nodes.

**Endpoint**: `GET /api/stats/nodecount`

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": {
    "NodeCount": "3"
  }
}
```

---

## Proxy APIs

### JSON-RPC Proxy

Proxy any JSON-RPC method directly to the blockchain node.

**Endpoint**: `POST /api/proxy/eth_*`

**Body**:
```json
{
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": "0x3039",
  "id": 1
}
```

---

### Get Block Number (GET)

**Endpoint**: `GET /api/proxy/eth_blockNumber`

---

### Get Balance (GET)

**Endpoint**: `GET /api/proxy/eth_getBalance?address=0x...&tag=latest`

---

## Error Codes

| Status | Meaning |
|--------|---------|
| "1" | Success |
| "0" | Error |

Error responses include a `message` field with error description.

---

## Rate Limits

- **Default**: 100 requests per minute per IP
- **Strict endpoints**: 10 requests per minute
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## API Keys (Optional)

Some endpoints support API key authentication for higher rate limits:

```bash
curl "https://api.norchain.org/api/account/balance?address=0x...&apikey=YOUR_API_KEY"
```

Or via header:
```bash
curl -H "X-API-Key: YOUR_API_KEY" "https://api.norchain.org/api/account/balance?address=0x..."
```

---

## Examples

### Complete Example: Get Token Balance

```bash
# 1. Get token info
curl "https://api.norchain.org/api/token/tokeninfo?contractaddress=0x26c0eaF731885b14c031cc50dB79b36458E0b355"

# 2. Get balance for address
curl "https://api.norchain.org/api/token/tokenbalance?contractaddress=0x26c0eaF731885b14c031cc50dB79b36458E0b355&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"

# 3. Get transfer history
curl "https://api.norchain.org/api/token/tokentx?contractaddress=0x26c0eaF731885b14c031cc50dB79b36458E0b355&startblock=0&endblock=latest"
```

---

## Support

For issues or questions:
- GitHub: https://github.com/nor-chain/blockchain-v2
- Documentation: https://docs.norchain.org/api
- Email: support@norchain.org



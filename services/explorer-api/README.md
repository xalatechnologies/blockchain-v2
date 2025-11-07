# Nor Chain Explorer API

A comprehensive REST API service for Nor Chain blockchain explorer, compatible with Etherscan/BSCScan/TronScan API patterns.

## Features

- ✅ **Account APIs** - Balance, transactions, token transfers
- ✅ **Transaction APIs** - Transaction details, receipts, status
- ✅ **Block APIs** - Block information, rewards, countdown
- ✅ **Token APIs** - Token info, supply, balances, transfers
- ✅ **Contract APIs** - ABI, source code verification
- ✅ **Stats APIs** - Network statistics, gas prices, node count
- ✅ **Proxy APIs** - Direct JSON-RPC proxy endpoints
- ✅ **Caching** - Built-in response caching for performance
- ✅ **Rate Limiting** - Configurable rate limits
- ✅ **API Keys** - Optional API key authentication

## Installation

```bash
cd services/explorer-api
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
RPC_URL=https://rpc.xaheen.org
CHAIN_ID=65001
ENABLE_CACHE=true
RATE_LIMIT_MAX_REQUESTS=100
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Account Endpoints

#### Get Account Balance
```bash
GET /api/account/balance?address=0x...
```

Response:
```json
{
  "status": "1",
  "message": "OK",
  "result": "1000000000000000000"
}
```

#### Get Transaction List
```bash
GET /api/account/txlist?address=0x...&page=1&offset=10
```

#### Get Token Transfers
```bash
GET /api/account/tokentx?address=0x...&contractaddress=0x...
```

### Transaction Endpoints

#### Get Transaction Status
```bash
GET /api/transaction/getstatus?txhash=0x...
```

#### Get Transaction Receipt
```bash
GET /api/transaction/gettxreceipt?txhash=0x...
```

#### Get Transaction Info
```bash
GET /api/transaction/gettxinfo?txhash=0x...
```

### Block Endpoints

#### Get Block Info
```bash
GET /api/block/getblockinfo?blockno=12345
```

#### Get Block Reward
```bash
GET /api/block/getblockreward?blockno=12345
```

#### Get Block Countdown
```bash
GET /api/block/getblockcountdown?blockno=50000
```

### Token Endpoints

#### Get Token Info
```bash
GET /api/token/tokeninfo?contractaddress=0x...
```

#### Get Token Supply
```bash
GET /api/token/tokensupply?contractaddress=0x...
```

#### Get Token Balance
```bash
GET /api/token/tokenbalance?contractaddress=0x...&address=0x...
```

#### Get Token Transfers
```bash
GET /api/token/tokentx?contractaddress=0x...&startblock=0&endblock=latest
```

### Contract Endpoints

#### Get Contract ABI
```bash
GET /api/contract/getabi?address=0x...
```

#### Get Contract Source Code
```bash
GET /api/contract/getsourcecode?address=0x...
```

#### Verify Contract Source Code
```bash
POST /api/contract/verifysourcecode
Content-Type: application/json

{
  "contractaddress": "0x...",
  "sourceCode": "...",
  "compilerversion": "v0.8.20+commit.a1b79de6",
  "contractname": "MyContract"
}
```

### Stats Endpoints

#### Get Network Stats
```bash
GET /api/stats/networkstats
```

#### Get Gas Oracle
```bash
GET /api/stats/gasoracle
```

#### Get Node Count
```bash
GET /api/stats/nodecount
```

### Proxy Endpoints

#### Direct JSON-RPC Proxy
```bash
POST /api/proxy/eth_*
Content-Type: application/json

{
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

#### Get Block Number (GET)
```bash
GET /api/proxy/eth_blockNumber
```

#### Get Balance (GET)
```bash
GET /api/proxy/eth_getBalance?address=0x...&tag=latest
```

## Response Format

All endpoints follow Etherscan-compatible response format:

```json
{
  "status": "1",  // "1" = success, "0" = error
  "message": "OK",
  "result": { ... }
}
```

## Rate Limiting

Default rate limit: **100 requests per minute** per IP address.

Configure in `.env`:
```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Caching

Responses are cached by default for better performance:

- Account balance: 10 seconds
- Transaction data: 5 seconds
- Token info: 30 seconds
- Network stats: 10-60 seconds

Disable caching:
```env
ENABLE_CACHE=false
```

## API Keys (Optional)

Enable API key authentication:

```env
API_KEY_ENABLED=true
API_KEYS=key1,key2,key3
```

Use API key:
```bash
GET /api/account/balance?address=0x...&apikey=key1
```

## Error Handling

All errors follow standard format:

```json
{
  "status": "0",
  "message": "Error description",
  "result": null
}
```

## Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start src/index.js --name norchain-api
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.norchain.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Performance Optimization

1. **Enable Caching** - Reduces RPC calls
2. **Use CDN** - For static responses
3. **Database Indexing** - For transaction history (future)
4. **Load Balancing** - Multiple API instances
5. **Redis Cache** - For distributed caching (future)

## Limitations

Current implementation:
- Transaction history requires full blockchain indexing (use RPC directly for now)
- Token holder lists require indexing
- Contract verification requires compilation service

Future enhancements:
- Full transaction indexing
- Token holder tracking
- Contract verification service
- WebSocket subscriptions
- GraphQL API

## Documentation

Full API documentation: [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

## License

MIT



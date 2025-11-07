# Developer Guide - Nor Chain API

## 🚀 Quick Start

### Installation

**JavaScript/TypeScript SDK:**
```bash
npm install @norchain/sdk
```

**Python SDK:**
```bash
pip install norchain-sdk
```

### Basic Usage

```javascript
import { NorChainAPI } from '@norchain/sdk';

const api = new NorChainAPI({
  apiKey: 'YOUR_API_KEY', // Optional but recommended
  chainId: 65001
});

// Get balance
const balance = await api.account.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
console.log('Balance:', balance);

// Get token info
const tokenInfo = await api.token.getInfo('0x26c0eaF731885b14c031cc50dB79b36458E0b355');
console.log('Token:', tokenInfo);
```

---

## 📚 Interactive Resources

### 1. API Playground
**URL**: https://api.norchain.org/playground

Test API endpoints directly in your browser:
- Try endpoints without writing code
- See real-time responses
- Copy code examples
- Test with your own addresses

### 2. GraphQL Interface
**URL**: https://api.norchain.org/api/graphql

Interactive GraphQL playground:
- Flexible queries
- Auto-completion
- Schema explorer
- Query builder

### 3. Interactive Documentation
**URL**: https://docs.norchain.org/api

- Swagger/OpenAPI docs
- Try-it-out feature
- Code examples in multiple languages
- Migration guides

---

## 🔄 Migration from Etherscan/BSCScan

### Step 1: Update Base URL

**Before (Etherscan):**
```javascript
const url = 'https://api.etherscan.io/api?module=account&action=balance&address=0x...';
```

**After (Nor Chain):**
```javascript
const url = 'https://api.norchain.org/api/account/balance?address=0x...';
```

### Step 2: Use RESTful Endpoints

**Before:**
```
?module=account&action=balance&address=0x...
```

**After:**
```
/api/account/balance?address=0x...
```

### Step 3: Same Response Format

Response format is **100% compatible** - no changes needed!

```json
{
  "status": "1",
  "message": "OK",
  "result": "..."
}
```

### Migration Tool

Use our migration helper:
```bash
curl https://api.norchain.org/api/playground/migrate
```

---

## 💻 Code Examples

### JavaScript/TypeScript

**Using SDK:**
```javascript
import { NorChainAPI } from '@norchain/sdk';

const api = new NorChainAPI({ apiKey: 'YOUR_KEY' });

// Get balance
const balance = await api.account.getBalance('0x...');

// Get token transfers
const transfers = await api.account.getTokenTransfers('0x...', {
  contractaddress: '0x...',
  page: 1,
  offset: 10
});

// Get transaction
const tx = await api.transaction.getInfo('0x...');
```

**Using Fetch:**
```javascript
const response = await fetch(
  'https://api.norchain.org/api/account/balance?address=0x...&apikey=YOUR_KEY'
);
const data = await response.json();
console.log('Balance:', data.result);
```

### Python

**Using SDK:**
```python
from norchain import NorChainAPI

api = NorChainAPI(api_key='YOUR_KEY')

# Get balance
balance = api.account.get_balance('0x...')

# Get token info
token_info = api.token.get_info('0x...')
```

**Using Requests:**
```python
import requests

response = requests.get(
    'https://api.norchain.org/api/account/balance',
    params={'address': '0x...', 'apikey': 'YOUR_KEY'}
)
data = response.json()
print(f'Balance: {data["result"]}')
```

### cURL

```bash
# Get balance
curl "https://api.norchain.org/api/account/balance?address=0x...&apikey=YOUR_KEY"

# Get token info
curl "https://api.norchain.org/api/token/tokeninfo?contractaddress=0x...&apikey=YOUR_KEY"
```

---

## 🎯 GraphQL API

More flexible queries with GraphQL:

```graphql
query {
  account(address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0") {
    address
    balance
    transactionCount
  }
  
  token(contractAddress: "0x26c0eaF731885b14c031cc50dB79b36458E0b355") {
    name
    symbol
    decimals
    totalSupply
  }
  
  networkStats {
    chainId
    currentBlock
    blockTime
  }
}
```

**Try it**: https://api.norchain.org/api/graphql

---

## 🔑 API Keys

### Get Your Free API Key

1. Visit: https://api.norchain.org/keys
2. Sign up (free)
3. Get instant access

### Benefits

- ✅ Higher rate limits (1000 req/min vs 100)
- ✅ Priority support
- ✅ Advanced features
- ✅ Webhooks
- ✅ Analytics dashboard

### Usage

**Query Parameter:**
```javascript
?apikey=YOUR_API_KEY
```

**Header:**
```javascript
headers: {
  'X-API-Key': 'YOUR_API_KEY'
}
```

---

## 📊 Rate Limits

| Tier | Requests/Minute | Price |
|------|----------------|-------|
| Free | 100 | Free |
| Basic | 1,000 | Free |
| Pro | 10,000 | $29/mo |
| Enterprise | Unlimited | Custom |

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-11-07T12:00:00Z
```

---

## 🎨 Best Practices

### 1. Use SDKs
SDKs handle rate limiting, retries, and error handling automatically.

### 2. Cache Responses
Use caching for frequently accessed data:
```javascript
// Cache balance for 10 seconds
const balance = await api.account.getBalance(address, 'latest');
```

### 3. Batch Requests
Use `balancemulti` for multiple addresses:
```javascript
const balances = await api.account.getBalances([
  '0x...',
  '0x...',
  '0x...'
]);
```

### 4. Handle Errors
```javascript
try {
  const balance = await api.account.getBalance(address);
} catch (error) {
  console.error('Error:', error.message);
  // Check error.help for documentation links
}
```

### 5. Use GraphQL for Complex Queries
GraphQL reduces over-fetching and multiple requests.

---

## 🔔 Webhooks (Coming Soon)

Subscribe to real-time events:
- New transactions
- Token transfers
- Contract events
- Block confirmations

**Sign up**: https://api.norchain.org/webhooks

---

## 🛠️ Tools & Resources

### SDKs
- **JavaScript/TypeScript**: `npm install @norchain/sdk`
- **Python**: `pip install norchain-sdk`
- **Go**: Coming soon
- **Rust**: Coming soon

### Documentation
- **API Reference**: https://docs.norchain.org/api
- **Examples**: https://docs.norchain.org/api/examples
- **Migration Guide**: https://docs.norchain.org/api/migration

### Community
- **Discord**: https://discord.gg/norchain
- **GitHub**: https://github.com/nor-chain
- **Twitter**: @norchain

### Support
- **Email**: dev@norchain.org
- **Discord**: #dev-support
- **GitHub Issues**: https://github.com/nor-chain/issues

---

## 🎓 Tutorials

### Tutorial 1: Get Token Balance
```javascript
import { NorChainAPI } from '@norchain/sdk';

const api = new NorChainAPI();

// Get WNOR token balance
const balance = await api.token.getBalance(
  '0x26c0eaF731885b14c031cc50dB79b36458E0b355', // Token address
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'  // Your address
);

console.log('WNOR Balance:', balance);
```

### Tutorial 2: Monitor Token Transfers
```javascript
// Get recent token transfers
const transfers = await api.account.getTokenTransfers(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  {
    contractaddress: '0x26c0eaF731885b14c031cc50dB79b36458E0b355',
    page: 1,
    offset: 10
  }
);

transfers.result.forEach(transfer => {
  console.log(`Transfer: ${transfer.value} from ${transfer.from} to ${transfer.to}`);
});
```

### Tutorial 3: Check Transaction Status
```javascript
const txHash = '0x...';

// Get transaction info
const tx = await api.transaction.getInfo(txHash);
console.log('Status:', tx.isError === '0' ? 'Success' : 'Failed');
console.log('Gas Used:', tx.gasUsed);
```

---

## 🚀 For Token Creators

### Deploy Your Token

1. Deploy your ERC-20/ERC-721 contract
2. Verify source code via API
3. Get token info automatically

### Verify Contract

```javascript
const api = new NorChainAPI({ apiKey: 'YOUR_KEY' });

await api.contract.verify({
  contractaddress: '0x...',
  sourceCode: '...',
  compilerversion: 'v0.8.20+commit.a1b79de6',
  contractname: 'MyToken'
});
```

### Get Token Listed

Once verified, your token automatically appears in:
- Token explorer
- Portfolio API
- Transfer tracking

---

## 📈 Analytics Dashboard

**URL**: https://api.norchain.org/dashboard

Track your API usage:
- Request statistics
- Rate limit usage
- Error rates
- Popular endpoints

---

## ❓ FAQ

**Q: Is it free?**  
A: Yes! Free tier includes 100 requests/minute.

**Q: Compatible with Etherscan?**  
A: 100% compatible - same response format and parameters.

**Q: Can I use my Etherscan code?**  
A: Yes! Just change the base URL.

**Q: Rate limits?**  
A: Free: 100/min, Pro: 10,000/min, Enterprise: Unlimited.

**Q: Support?**  
A: Discord, email, or GitHub issues.

---

**Ready to build?** Start at: https://api.norchain.org/playground


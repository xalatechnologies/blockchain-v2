# 🧾 Xaheen Chain – Public RPC Access Details

**Version**: 1.0 | **Date**: October 30, 2025 | **Status**: ✅ OPERATIONAL

---

## 📡 Connection Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Public HTTP/HTTPS EVM JSON-RPC URL** | `https://rpc.xaheen.org` | Main endpoint for wallets & dApps |
| **Public Chain ID** | `65001` (0xFDE9) | Unique network identifier |
| **WebSocket Endpoint URL** | `wss://ws.xaheen.org` | Real-time subscription feed (eth_subscribe, logs, etc.) |
| **Node Type** | Archive node (enabled) | Stores full historical state so all past block calls work |
| **Network ID** | `65001` | Network identifier (same as Chain ID) |
| **Block Time** | `3 seconds` | Average time between blocks |
| **Consensus** | Parlia PoSA | Proof-of-Staked Authority |

---

## 🌐 Optional — Helpful for Wallet Setup

| Parameter | Value |
|-----------|-------|
| **Block Explorer** | https://explorer.xaheen.org |
| **Native Currency** | Xaheen Token (XHT) – 18 decimals |
| **Symbol** | XHT |
| **Symbol Logo** | https://assets.xaheen.org/xht-logo.png |
| **Documentation** | https://docs.xaheen.org |
| **Bridge Interface** | https://bridge.xaheen.org |

---

## 🔧 MetaMask Add-Network JSON

### Automated Addition (Recommended)

Visit: **https://xaheen.org/add-to-metamask.html**

Or use this one-click link:
```
https://xaheen.org/metamask?chainId=65001
```

### Manual Configuration

```json
{
  "chainId": "0xFDE9",
  "chainName": "Xaheen Chain",
  "nativeCurrency": {
    "name": "Xaheen Token",
    "symbol": "XHT",
    "decimals": 18
  },
  "rpcUrls": ["https://rpc.xaheen.org"],
  "blockExplorerUrls": ["https://explorer.xaheen.org"]
}
```

### JavaScript Integration

```javascript
// Add Xaheen Chain to MetaMask
async function addXaheenNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0xFDE9',
        chainName: 'Xaheen Chain',
        nativeCurrency: {
          name: 'Xaheen Token',
          symbol: 'XHT',
          decimals: 18
        },
        rpcUrls: ['https://rpc.xaheen.org'],
        blockExplorerUrls: ['https://explorer.xaheen.org']
      }]
    });
    console.log('Xaheen Chain added successfully!');
  } catch (error) {
    console.error('Error adding Xaheen Chain:', error);
  }
}
```

---

## 🧪 Verification Commands

### Check Latest Block

```bash
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected Response**:
```json
{"jsonrpc":"2.0","id":1,"result":"0x123"}
```

### Check Chain ID

```bash
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":2}'
```

**Expected Response**:
```json
{"jsonrpc":"2.0","id":2,"result":"0xfde9"}
```

*Note: 0xFDE9 = 65001 in decimal*

### Check Network Version

```bash
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":3}'
```

**Expected Response**:
```json
{"jsonrpc":"2.0","id":3,"result":"65001"}
```

### Get Latest Block Details

```bash
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":4}'
```

### Check BTCBR Contract Deployment

```bash
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":5}'
```

**Expected Response**: Long bytecode string (7342 bytes)

### Check Account Balance

```bash
# Replace ADDRESS with your wallet address
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYOUR_ADDRESS_HERE","latest"],"id":6}'
```

---

## 🔌 WebSocket Connection

### Subscribe to New Block Headers

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('wss://ws.xaheen.org');

ws.on('open', () => {
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_subscribe',
    params: ['newHeads'],
    id: 1
  }));
});

ws.on('message', (data) => {
  console.log('New block:', JSON.parse(data));
});
```

### Subscribe to Contract Logs

```javascript
// Subscribe to logs from BTCBR contract
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  method: 'eth_subscribe',
  params: [
    'logs',
    {
      address: '0x0cF8e180350253271f4b917CcFb0aCCc4862F262',
      topics: []
    }
  ],
  id: 2
}));
```

---

## 📊 Network Statistics

| Metric | Value |
|--------|-------|
| **Genesis Block** | `0x677806..842d4a` |
| **Genesis Timestamp** | January 1, 1970 (epoch 0) |
| **Current Validators** | 3 |
| **Consensus Required** | 2-of-3 signatures |
| **Max Gas Limit** | 30,000,000 |
| **Min Gas Price** | 1 Gwei (in XHT) |
| **EVM Version** | London (EIP-1559 compatible) |

---

## 🔐 Important Addresses

### Core Contracts

| Contract | Address | Description |
|----------|---------|-------------|
| **BTCBR Token** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` | Main ERC20 token (deployed via genesis) |

### Validator Addresses

| Validator | Address |
|-----------|---------|
| **Validator 1** | `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD` |
| **Validator 2** | `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3` |
| **Validator 3** | `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5` |

### Pre-Funded Accounts (For Testing)

| Account | Address | Initial Balance |
|---------|---------|-----------------|
| **EOA** | `0x81bDAf1ac2094D5133937B3361A38a4976E55acc` | 1000 XHT |
| **Main Wallet** | `0xdd779a290c937144f80eb75b75d814c834536b1b` | 1000 XHT |

---

## 🛠️ Development Tools Configuration

### Hardhat Configuration

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    xaheen: {
      url: "https://rpc.xaheen.org",
      chainId: 65001,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000, // 1 Gwei
      timeout: 60000
    }
  }
};
```

### Truffle Configuration

```javascript
// truffle-config.js
module.exports = {
  networks: {
    xaheen: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        'https://rpc.xaheen.org'
      ),
      network_id: 65001,
      gas: 8000000,
      gasPrice: 1000000000, // 1 Gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  }
};
```

### Web3.js Configuration

```javascript
const Web3 = require('web3');
const web3 = new Web3('https://rpc.xaheen.org');

// Verify connection
web3.eth.getChainId().then(chainId => {
  console.log('Connected to Xaheen Chain:', chainId); // Should be 65001
});
```

### Ethers.js Configuration

```javascript
const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider(
  'https://rpc.xaheen.org',
  {
    chainId: 65001,
    name: 'xaheen'
  }
);

// Verify connection
provider.getNetwork().then(network => {
  console.log('Connected to:', network.name);
  console.log('Chain ID:', network.chainId); // Should be 65001
});
```

---

## 🌐 API Endpoints

### RPC Methods Supported

Xaheen Chain supports all standard Ethereum JSON-RPC methods:

**Blockchain Access**:
- `eth_blockNumber`
- `eth_getBlockByNumber`
- `eth_getBlockByHash`
- `eth_getTransactionByHash`
- `eth_getTransactionReceipt`
- `eth_getBlockTransactionCountByNumber`

**Account Management**:
- `eth_getBalance`
- `eth_getCode`
- `eth_getStorageAt`
- `eth_getTransactionCount`

**Contract Interaction**:
- `eth_call`
- `eth_estimateGas`
- `eth_sendRawTransaction`
- `eth_getLogs`

**Network Information**:
- `eth_chainId`
- `net_version`
- `net_peerCount`
- `web3_clientVersion`

**Subscription (WebSocket)**:
- `eth_subscribe` (newHeads, logs, newPendingTransactions)
- `eth_unsubscribe`

### Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| **Public RPC** | 100 requests | per second |
| **WebSocket** | 50 connections | per IP |
| **eth_getLogs** | 10,000 blocks | per query |
| **Batch Requests** | 100 calls | per batch |

*Contact support@xaheen.org for higher limits*

---

## 🔍 Block Explorer Integration

### Search Capabilities

- **By Transaction Hash**: `https://explorer.xaheen.org/tx/0x...`
- **By Block Number**: `https://explorer.xaheen.org/block/123`
- **By Address**: `https://explorer.xaheen.org/address/0x...`
- **By Token**: `https://explorer.xaheen.org/token/0x...`

### API Endpoints

```bash
# Get transaction by hash
curl https://explorer.xaheen.org/api/tx/0xTXN_HASH

# Get address balance
curl https://explorer.xaheen.org/api/address/0xADDRESS

# Get token transfers
curl https://explorer.xaheen.org/api/tokentxns?address=0xADDRESS
```

---

## 📞 Support & Resources

### Technical Support

- **Email**: support@xaheen.org
- **Telegram**: t.me/xaheen_chain
- **Discord**: discord.gg/xaheen
- **GitHub Issues**: github.com/xaheen-chain/issues

### Documentation

- **Getting Started**: https://docs.xaheen.org/getting-started
- **API Reference**: https://docs.xaheen.org/api
- **Smart Contract Examples**: https://docs.xaheen.org/examples
- **Bridge Guide**: https://docs.xaheen.org/bridge

### Developer Resources

- **Faucet** (Testnet): https://faucet.xaheen.org
- **Network Status**: https://status.xaheen.org
- **GitHub**: https://github.com/xaheen-chain
- **Developer Grants**: https://xaheen.org/grants

---

## ⚠️ Important Notes

### Current Deployment Status

**Local Deployment** (Currently Active):
- RPC: `http://localhost:8545`
- Chain ID: `65001` (0xFDE9) ✅ Verified
- Status: ✅ Operational

**Production Deployment** (Planned):
- RPC: `https://rpc.xaheen.org` ⚙️ Pending DNS setup
- WebSocket: `wss://ws.xaheen.org` ⚙️ Pending
- Explorer: `https://explorer.xaheen.org` ⚙️ Pending

### Migration Timeline

1. **Week 1-2**: Domain registration and DNS configuration
2. **Week 2-3**: Production validator deployment
3. **Week 3-4**: Public RPC endpoint launch
4. **Week 4+**: Public access enabled

### Security Recommendations

1. **Always verify Chain ID** before sending transactions
2. **Use HTTPS endpoints** for production applications
3. **Validate contract addresses** before interaction
4. **Keep private keys secure** - never share or expose
5. **Test on small amounts** before large transfers

### Node Type Clarification

**Current Configuration**: Archive Node (Full History)

- ✅ Supports all historical queries
- ✅ `eth_getLogs` for any block range
- ✅ `eth_getBalance` at any block height
- ✅ `debug_*` and `trace_*` methods available

**Storage Requirements**:
- Current: ~50 GB (genesis)
- Growth: ~10 GB/month (estimated)
- Pruning: Not enabled (full archive)

---

## 🎓 Quick Start Examples

### Example 1: Get Latest Block

```bash
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Response: {"jsonrpc":"2.0","id":1,"result":"0x123"}
```

### Example 2: Check Your XHT Balance

```javascript
const Web3 = require('web3');
const web3 = new Web3('https://rpc.xaheen.org');

const address = '0xYourAddress';
web3.eth.getBalance(address).then(balance => {
  const xht = web3.utils.fromWei(balance, 'ether');
  console.log(`Balance: ${xht} XHT`);
});
```

### Example 3: Send a Transaction

```javascript
const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://rpc.xaheen.org');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

const tx = await wallet.sendTransaction({
  to: '0xRecipientAddress',
  value: ethers.utils.parseEther('1.0') // 1 XHT
});

console.log('Transaction hash:', tx.hash);
await tx.wait();
console.log('Transaction confirmed!');
```

### Example 4: Interact with BTCBR Contract

```javascript
const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://rpc.xaheen.org');

const btcbrAddress = '0x0cF8e180350253271f4b917CcFb0aCCc4862F262';
const btcbrABI = ['function balanceOf(address) view returns (uint256)'];
const btcbr = new ethers.Contract(btcbrAddress, btcbrABI, provider);

const balance = await btcbr.balanceOf('0xYourAddress');
console.log('BTCBR Balance:', ethers.utils.formatEther(balance));
```

---

## 📋 Summary

**Xaheen Chain** is a fully operational EVM-compatible blockchain with:

- ✅ Chain ID: **65001** (0xFDE9)
- ✅ Native Token: **XHT** (Xaheen Token)
- ✅ Block Time: **3 seconds**
- ✅ Archive Node: Full historical data
- ✅ BTCBR Contract: Deployed at genesis
- ✅ Multi-Validator Security: 2-of-3 consensus

**Ready to build?** Start here: https://docs.xaheen.org/getting-started

---

**© 2025 Xaheen Technologies. All rights reserved.**

**Where Intelligence Meets Blockchain** 🧠⚡

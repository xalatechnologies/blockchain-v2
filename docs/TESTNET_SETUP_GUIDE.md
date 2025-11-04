# Nor Chain Testnet Setup Guide

**Version**: 1.0
**Date**: November 2, 2025
**Status**: 🔄 **In Progress**

---

## Overview

Nor Chain currently operates as a **private testnet** with 3 validators. This guide outlines the steps to convert it into a **public testnet** for community testing and development.

---

## Current Status ✅

| Component | Status | Details |
|-----------|--------|---------|
| **Blockchain** | ✅ Running | Chain ID 65001, 3 validators, producing blocks |
| **RPC Endpoint** | ✅ Active | https://rpc.xaheen.org (migrating to rpc.norchain.org) |
| **WebSocket** | ✅ Active | Port 8546 on validator-1 |
| **Block Explorer** | ❌ **NEEDED** | Critical for public testnet |
| **Faucet** | ❌ **NEEDED** | Users need test NOR tokens |
| **Documentation** | ⏳ In Progress | Testnet user guides needed |

---

## Requirements for Public Testnet

### Priority 1: Critical Infrastructure (Week 1-2)

#### 1. Block Explorer Deployment ⭐ **HIGHEST PRIORITY**

**Recommended**: Blockscout (open-source, EVM-compatible)

**Setup Steps**:
```bash
# On AWS/server
cd /opt
git clone https://github.com/blockscout/blockscout.git
cd blockscout/docker-compose

# Configure for Nor Chain
cp .env.example .env
```

**Configuration** (`.env`):
```bash
# Network
ETHEREUM_JSONRPC_VARIANT=geth
ETHEREUM_JSONRPC_HTTP_URL=http://3.91.50.187:8545
ETHEREUM_JSONRPC_WS_URL=ws://3.91.50.187:8546
CHAIN_ID=65001

# Branding
SUBNETWORK=Nor Chain Testnet
LOGO=/images/nor_logo.svg
COIN=NOR
COIN_NAME=Nor

# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/blockscout

# URLs
BLOCKSCOUT_HOST=explorer.testnet.norchain.org
BLOCKSCOUT_PROTOCOL=https
```

**Deploy**:
```bash
docker-compose up -d
```

**DNS Setup**:
- Point `explorer.testnet.norchain.org` → Server IP
- Configure SSL certificate (Let's Encrypt)

**Verification**:
```bash
curl https://explorer.testnet.norchain.org/api/v2/stats
```

#### 2. Test Token Faucet ⭐ **HIGH PRIORITY**

**Faucet Contract** (`contracts/testnet/NorFaucet.sol`):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NorFaucet {
    address public owner;
    uint256 public constant DRIP_AMOUNT = 100 * 10**24; // 100 NOR
    uint256 public constant COOLDOWN_TIME = 24 hours;

    mapping(address => uint256) public lastDrip;

    event TokensDripped(address indexed recipient, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function drip() external {
        require(
            block.timestamp >= lastDrip[msg.sender] + COOLDOWN_TIME,
            "Cooldown period not elapsed"
        );

        lastDrip[msg.sender] = block.timestamp;

        (bool success, ) = msg.sender.call{value: DRIP_AMOUNT}("");
        require(success, "Transfer failed");

        emit TokensDripped(msg.sender, DRIP_AMOUNT);
    }

    function fund() external payable onlyOwner {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    receive() external payable {}
}
```

**Faucet Frontend** (`faucet.testnet.norchain.org`):
```html
<!DOCTYPE html>
<html>
<head>
    <title>Nor Chain Testnet Faucet</title>
</head>
<body>
    <h1>🌙 Nor Chain Testnet Faucet</h1>
    <p>Get 100 test NOR tokens (once per 24 hours)</p>

    <input id="address" placeholder="0x... your address" />
    <button onclick="requestTokens()">Request Tokens</button>

    <script>
        async function requestTokens() {
            const address = document.getElementById('address').value;
            const response = await fetch('/api/drip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });
            const data = await response.json();
            alert(data.message);
        }
    </script>
</body>
</html>
```

**Faucet Backend** (Node.js + Express):
```javascript
import express from 'express';
import { ethers } from 'ethers';

const app = express();
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.norchain.org');
const faucetWallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
const faucetContract = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, faucetWallet);

app.post('/api/drip', async (req, res) => {
    try {
        const { address } = req.body;

        // Validate address
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }

        // Call faucet contract
        const tx = await faucetContract.drip({ from: address });
        await tx.wait();

        res.json({
            message: 'Success! 100 NOR sent to your address',
            txHash: tx.hash
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);
```

### Priority 2: Network Configuration (Week 2-3)

#### 3. DNS & SSL Setup

**DNS Records** (at domain registrar):
```
testnet.norchain.org        → AWS EC2 IP
rpc.testnet.norchain.org    → AWS EC2 IP (3.91.50.187)
explorer.testnet.norchain.org → Blockscout server IP
faucet.testnet.norchain.org   → Faucet server IP
```

**SSL Certificates** (Let's Encrypt):
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates for all domains
sudo certbot --nginx -d rpc.testnet.norchain.org
sudo certbot --nginx -d explorer.testnet.norchain.org
sudo certbot --nginx -d faucet.testnet.norchain.org

# Auto-renewal
sudo certbot renew --dry-run
```

**Nginx Configuration** (`/etc/nginx/sites-available/nor-testnet`):
```nginx
# RPC Endpoint
server {
    listen 443 ssl http2;
    server_name rpc.testnet.norchain.org;

    ssl_certificate /etc/letsencrypt/live/rpc.testnet.norchain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.testnet.norchain.org/privkey.pem;

    location / {
        proxy_pass http://localhost:8545;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Rate limiting
        limit_req zone=rpc_limit burst=10 nodelay;
    }
}

# WebSocket
server {
    listen 443 ssl http2;
    server_name ws.testnet.norchain.org;

    ssl_certificate /etc/letsencrypt/live/rpc.testnet.norchain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.testnet.norchain.org/privkey.pem;

    location / {
        proxy_pass http://localhost:8546;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Rate Limiting** (add to `nginx.conf`):
```nginx
http {
    # Rate limit RPC calls
    limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=10r/s;

    # Connection limits
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    limit_conn addr 10;
}
```

#### 4. Wallet Integration

**MetaMask Configuration JSON**:
```json
{
  "chainId": "0xFDE9",
  "chainName": "Nor Chain Testnet",
  "nativeCurrency": {
    "name": "Nor",
    "symbol": "NOR",
    "decimals": 24
  },
  "rpcUrls": ["https://rpc.testnet.norchain.org"],
  "blockExplorerUrls": ["https://explorer.testnet.norchain.org"],
  "iconUrls": ["https://norchain.org/logo.png"]
}
```

**"Add to MetaMask" Button** (for website):
```html
<button onclick="addNorTestnet()">Add Nor Testnet to MetaMask</button>

<script>
async function addNorTestnet() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0xFDE9',
                chainName: 'Nor Chain Testnet',
                nativeCurrency: {
                    name: 'Nor',
                    symbol: 'NOR',
                    decimals: 24
                },
                rpcUrls: ['https://rpc.testnet.norchain.org'],
                blockExplorerUrls: ['https://explorer.testnet.norchain.org']
            }]
        });
        alert('Nor Testnet added to MetaMask!');
    } catch (error) {
        console.error(error);
    }
}
</script>
```

### Priority 3: Documentation & Community (Week 3-4)

#### 5. Developer Documentation

**Create** `docs/testnet/DEVELOPER_GUIDE.md`:
```markdown
# Nor Chain Testnet Developer Guide

## Quick Start

### 1. Add Network to MetaMask
- Network Name: Nor Chain Testnet
- RPC URL: https://rpc.testnet.norchain.org
- Chain ID: 65001
- Symbol: NOR
- Explorer: https://explorer.testnet.norchain.org

### 2. Get Test Tokens
Visit https://faucet.testnet.norchain.org
Enter your address
Receive 100 NOR (once per 24 hours)

### 3. Deploy a Contract
```bash
npx hardhat run scripts/deploy.js --network norTestnet
```

### 4. Verify on Explorer
https://explorer.testnet.norchain.org/address/YOUR_CONTRACT
```

#### 6. Hardhat Configuration

**Update** `hardhat.config.js`:
```javascript
module.exports = {
  networks: {
    // Testnet
    norTestnet: {
      url: "https://rpc.testnet.norchain.org",
      chainId: 65001,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000, // 1 gwei
    },
    // Mainnet (future)
    norMainnet: {
      url: "https://rpc.norchain.org",
      chainId: 65002, // Different chain ID for mainnet
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000,
    }
  }
};
```

---

## Testnet vs Mainnet Separation Strategy

| Aspect | Testnet | Mainnet |
|--------|---------|---------|
| **Chain ID** | 65001 | 65002 (recommended) |
| **Domain** | `*.testnet.norchain.org` | `*.norchain.org` |
| **Token Value** | $0 (no value) | Real value |
| **Validators** | 3 (current) | 5+ (increase for mainnet) |
| **Epoch** | 10,000 blocks (testing) | 9,000,000 blocks (production) |
| **Faucet** | ✅ Yes | ❌ No |
| **Rate Limits** | Relaxed | Strict |

---

## Deployment Checklist

### Phase 1: Infrastructure (Week 1-2)
- [ ] Deploy Blockscout explorer
- [ ] Deploy faucet contract
- [ ] Build faucet frontend/backend
- [ ] Configure DNS records
- [ ] Setup SSL certificates
- [ ] Configure Nginx with rate limiting

### Phase 2: Testing (Week 3)
- [ ] Test RPC endpoints
- [ ] Test WebSocket connections
- [ ] Test faucet functionality
- [ ] Test explorer functionality
- [ ] Deploy test contracts
- [ ] Verify contract verification works

### Phase 3: Documentation (Week 3-4)
- [ ] Write developer guide
- [ ] Create video tutorials
- [ ] Write deployment examples
- [ ] Document common issues
- [ ] Create FAQ

### Phase 4: Launch (Week 4)
- [ ] Internal testing (team)
- [ ] Beta testing (trusted developers)
- [ ] Public announcement
- [ ] Monitor and support

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Validator Health**
   - Block production rate
   - Peer connectivity
   - Resource usage (CPU, RAM, disk)

2. **RPC Performance**
   - Request rate
   - Response time
   - Error rate

3. **Faucet Usage**
   - Drips per day
   - Unique addresses
   - Abuse attempts

### Monitoring Tools

**Grafana + Prometheus Stack**:
```bash
# Install on monitoring server
docker-compose -f monitoring/docker-compose.yml up -d
```

**Alerts** (via Telegram/Discord):
- Validator down
- High error rate on RPC
- Faucet running low on funds
- Suspicious activity detected

---

## Cost Estimate

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| EC2 t3.large (validators) | $60-80 | Already running |
| Blockscout server (t3.medium) | $30-40 | New |
| Faucet server (t3.small) | $15-20 | New |
| SSL certificates | $0 | Let's Encrypt (free) |
| Domain | $10-20 | Annual cost |
| **Total** | **$115-160/month** | Testnet only |

---

## Security Considerations

1. **Rate Limiting**: Prevent RPC abuse
2. **Faucet Protection**: CAPTCHA, IP limits, cooldowns
3. **DDoS Protection**: Cloudflare or AWS Shield
4. **Private Keys**: AWS Secrets Manager
5. **Monitoring**: 24/7 uptime monitoring

---

## Quick Commands

### Check Testnet Status
```bash
# Block number
curl https://rpc.testnet.norchain.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Peer count
curl https://rpc.testnet.norchain.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Chain ID
curl https://rpc.testnet.norchain.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Deploy Test Contract
```bash
npx hardhat run scripts/deploy-nor-ecosystem.js --network norTestnet
```

### Verify Contract
```bash
npx hardhat verify --network norTestnet CONTRACT_ADDRESS
```

---

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| **1-2** | Infrastructure | Blockscout, Faucet, DNS, SSL |
| **3** | Testing | Internal testing, documentation |
| **4** | Launch | Beta testing, public announcement |

**Target Launch Date**: ~4 weeks from start

---

## Support & Resources

**Documentation**: https://docs.norchain.org/testnet
**Faucet**: https://faucet.testnet.norchain.org
**Explorer**: https://explorer.testnet.norchain.org
**RPC**: https://rpc.testnet.norchain.org
**Discord**: (Create community server)
**GitHub**: (Open testnet feedback repo)

---

🌙 **Nor Chain Testnet - Building the Future of Finance** 🌙

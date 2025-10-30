# POST-LAUNCH SETUP GUIDE

**Status**: Xaheen Chain is LIVE! Now we need to complete post-launch setup.

---

## 🔒 1. HTTPS/SSL SETUP (HIGH PRIORITY)

### Current Status
- ✅ RPC working: http://3.91.50.187:8545
- ✅ WebSocket working: ws://3.91.50.187:8548
- ❌ HTTPS NOT configured
- ❌ Domain NOT configured

### Goal
- https://rpc.xaheen.org (secure RPC)
- wss://ws.xaheen.org (secure WebSocket)

### Steps to Configure

#### Step 1: DNS Configuration

**You need to configure these DNS records in your domain registrar:**

```
Type: A Record
Name: rpc
Value: 3.91.50.187
TTL: 300

Type: A Record
Name: ws
Value: 3.91.50.187
TTL: 300

Type: A Record
Name: explorer (for future Blockscout)
Value: 3.91.50.187
TTL: 300
```

**Where to configure:**
- Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
- Find DNS Management section
- Add the A records above

**Verification:**
```bash
# Wait 5-10 minutes after adding DNS records
nslookup rpc.xaheen.org
nslookup ws.xaheen.org
```

#### Step 2: Install Nginx + SSL on Server

**Run this script on the server:**

```bash
#!/bin/bash
# File: setup-https-ssl.sh

echo "🔒 Setting up HTTPS/SSL for Xaheen Chain"

# Install Nginx and Certbot
sudo yum install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/conf.d/xaheen-rpc.conf > /dev/null <<'EOF'
# RPC endpoint
server {
    listen 80;
    server_name rpc.xaheen.org;

    location / {
        proxy_pass http://localhost:8545;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}

# WebSocket endpoint
server {
    listen 80;
    server_name ws.xaheen.org;

    location / {
        proxy_pass http://localhost:8548;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Get SSL certificates (AFTER DNS is configured!)
sudo certbot --nginx -d rpc.xaheen.org -d ws.xaheen.org --non-interactive --agree-tos --email admin@xaheen.org

# Setup auto-renewal
sudo systemctl enable certbot-renew.timer

echo ""
echo "✅ HTTPS/SSL Setup Complete!"
echo ""
echo "Your endpoints are now:"
echo "  RPC:       https://rpc.xaheen.org"
echo "  WebSocket: wss://ws.xaheen.org"
```

**To run:**
```bash
# SSH into server
ssh -i bsc-validator-key.pem ec2-user@3.91.50.187

# Create and run script
nano setup-https-ssl.sh
chmod +x setup-https-ssl.sh
./setup-https-ssl.sh
```

---

## 🦊 2. METAMASK LOGO FIX

### Problem
MetaMask doesn't show logos for custom networks by default. You need to:

1. **Host logo files publicly**
2. **Update network configuration with logo URL**

### Solution

#### Create Logo Files

**You need 3 logo files:**
- `xht-logo-64.png` (64x64 pixels) - Small icon
- `xht-logo-256.png` (256x256 pixels) - Medium icon
- `xht-logo-512.png` (512x512 pixels) - Large icon

**Host them publicly:**
Option 1: Use GitHub Pages
Option 2: Use IPFS
Option 3: Use Cloudflare Images
Option 4: Host on your domain (https://xaheen.org/images/)

#### Update MetaMask Configuration

**When users add Xaheen Chain to MetaMask, use these parameters:**

```javascript
// Add Xaheen Chain to MetaMask
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0xFDE9', // 65001 in hex
    chainName: 'Xaheen Chain',
    nativeCurrency: {
      name: 'Xaheen Token',
      symbol: 'XHT',
      decimals: 18
    },
    rpcUrls: ['https://rpc.xaheen.org'], // Use HTTPS after setup
    blockExplorerUrls: ['https://explorer.xaheen.org'], // After Blockscout deployment
    iconUrls: [
      'https://xaheen.org/images/xht-logo-64.png',
      'https://xaheen.org/images/xht-logo-256.png'
    ]
  }]
});
```

#### Add BTCBR Token to MetaMask

**Users can add BTCBR token with logo:**

```javascript
// Add BTCBR token to MetaMask
await window.ethereum.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC20',
    options: {
      address: '0x0cF8e180350253271f4b917CcFb0aCCc4862F262',
      symbol: 'BTCBR',
      decimals: 18,
      image: 'https://xaheen.org/images/btcbr-logo-256.png'
    }
  }
});
```

#### Create One-Click Add Scripts

**Create a simple web page for users:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Add Xaheen Chain to MetaMask</title>
</head>
<body>
    <h1>Add Xaheen Chain</h1>

    <button onclick="addXaheenChain()">Add Xaheen Chain to MetaMask</button>
    <button onclick="addBTCBRToken()">Add BTCBR Token</button>

    <script>
        async function addXaheenChain() {
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
                        blockExplorerUrls: ['https://explorer.xaheen.org'],
                        iconUrls: [
                            'https://xaheen.org/images/xht-logo-64.png',
                            'https://xaheen.org/images/xht-logo-256.png'
                        ]
                    }]
                });
                alert('Xaheen Chain added successfully!');
            } catch (error) {
                console.error(error);
                alert('Error adding chain: ' + error.message);
            }
        }

        async function addBTCBRToken() {
            try {
                await window.ethereum.request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC20',
                        options: {
                            address: '0x0cF8e180350253271f4b917CcFb0aCCc4862F262',
                            symbol: 'BTCBR',
                            decimals: 18,
                            image: 'https://xaheen.org/images/btcbr-logo-256.png'
                        }
                    }
                });
                alert('BTCBR token added successfully!');
            } catch (error) {
                console.error(error);
                alert('Error adding token: ' + error.message);
            }
        }
    </script>
</body>
</html>
```

---

## 🔐 3. SECURITY AUDIT FIXES

### High Priority Fixes

#### A. Setup Multi-Sig Wallet (Gnosis Safe)

**Deploy Gnosis Safe on Xaheen Chain:**

```bash
# 1. Install Gnosis Safe contracts
npm install @safe-global/safe-contracts

# 2. Deploy Safe Proxy Factory
# See: scripts/deploy-gnosis-safe.js
```

**Create 3-of-5 multi-sig with:**
- Team member 1
- Team member 2
- Community representative 1
- Community representative 2
- Security auditor

#### B. Transfer Ownership to Multi-Sig

```javascript
// After deploying multi-sig
const multiSigAddress = "0x..."; // Your Gnosis Safe address

// Transfer all contracts
await xhtStaking.transferOwnership(multiSigAddress);
await xhtBurnMechanism.transferOwnership(multiSigAddress);
await xhtGovernance.transferOwnership(multiSigAddress);
await xhtRevenue.transferOwnership(multiSigAddress);
await xhtCrowdfunding.transferOwnership(multiSigAddress);
await xhtCharity.transferOwnership(multiSigAddress);
```

#### C. Setup Monitoring Dashboard

**Use Grafana + Prometheus to monitor:**
- Total supply (tracking burns)
- Total staked amount
- Revenue collected
- Burn rate (daily/weekly/monthly)
- Active stakers count
- Validator status

#### D. Write Unit Tests

**Coverage target: 95%+**

Run tests:
```bash
npx hardhat test
npx hardhat coverage
```

#### E. External Security Audit

**Recommended audit firms:**
- OpenZeppelin: $50K-100K (4-6 weeks)
- Trail of Bits: $75K-150K (6-8 weeks)
- Consensys Diligence: $60K-120K (4-6 weeks)

**Budget options:**
- Hacken: $15K-30K (2-3 weeks)
- CertiK: $20K-40K (3-4 weeks)

---

## 📊 4. DEPLOY BLOCK EXPLORER (Blockscout)

### Why Blockscout?

- Open source and free
- Full blockchain explorer
- Transaction tracking
- Contract verification
- Token tracking

### Deploy Using Ansible

```bash
cd infrastructure/ansible
ansible-playbook -i inventory/xaheen-hosts playbooks/deploy-explorer.yml
```

After deployment, explorer will be available at:
- http://3.91.50.187:4000 (HTTP)
- https://explorer.xaheen.org (HTTPS after SSL setup)

---

## 🎯 PRIORITY ORDER

**Week 1 (Critical):**
1. ✅ Configure DNS records
2. ✅ Setup HTTPS/SSL with Let's Encrypt
3. ✅ Create and host logo files
4. ✅ Deploy Blockscout explorer
5. ✅ Update documentation with HTTPS endpoints

**Week 2-3 (High Priority):**
6. ⚠️ Write comprehensive unit tests (95%+ coverage)
7. ⚠️ Write integration tests
8. ⚠️ Deploy Gnosis Safe multi-sig
9. ⚠️ Transfer ownership to multi-sig
10. ⚠️ Setup monitoring dashboard

**Month 1 (Important):**
11. ⚠️ Launch staking dashboard UI
12. ⚠️ Create governance voting interface
13. ⚠️ Deploy crowdfunding platform UI
14. ⚠️ Setup charity portal
15. ⚠️ Marketing campaign

**Quarter 1 (Recommended):**
16. ⚠️ External security audit
17. ⚠️ Bug bounty program
18. ⚠️ DEX integration
19. ⚠️ NFT marketplace
20. ⚠️ Cross-chain bridges (BSC, Ethereum, Polygon)

---

## ✅ QUICK WINS (Do These NOW)

### 1. Configure DNS (5 minutes)
```
Go to your domain registrar → DNS settings → Add A records
```

### 2. Setup SSL (15 minutes)
```bash
ssh into server → run setup-https-ssl.sh
```

### 3. Create Simple Logo (10 minutes)
```
Use Canva or similar tool → Create 256x256 PNG → Upload to GitHub/IPFS
```

### 4. Update MetaMask Add Code (5 minutes)
```javascript
// Update your website/docs with the iconUrls parameter
```

---

## 📞 SUPPORT

**Need help?**
- GitHub Issues: https://github.com/sahalat/blockchain-v2/issues
- Security: security@xaheen.org
- General: support@xaheen.org

---

**Last Updated**: October 30, 2025
**Network Status**: 🟢 OPERATIONAL
**Block Height**: Continuously increasing

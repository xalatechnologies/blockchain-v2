# 🚀 BTCBR Chain Public Launch Checklist
## $10,000 Budget - Week 1 Execution Plan

**Network Name:** BTCBR Private BSC → **Xaheen Chain** (rebrand)  
**Chain ID:** 885824  
**Budget Cap:** $10,000 USD  
**Timeline:** 7 days to public launch  

---

## 📋 PRE-LAUNCH STATUS

### ✅ Already Deployed
- [x] Private BSC chain with 3 validators
- [x] HTTPS RPC endpoint: https://rpc.bitcoinbr.tech
- [x] HTTP RPC endpoint: http://3.91.50.187:8545
- [x] BTCBR Token: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
- [x] Parlia consensus (epoch: 30,000 blocks)
- [x] Bridge contracts (ready for deployment)
- [x] SSL/TLS certificates (Let's Encrypt)

### ❌ Required for Launch
- [ ] Block Explorer (Blockscout)
- [ ] DEX Pool (BTCBR/USDT)
- [ ] Bridge Vaults Deployment
- [ ] Chainlist Registration
- [ ] Public Dashboard
- [ ] LP Token Locking (Team Finance)
- [ ] Marketing Materials

---

## 💰 BUDGET BREAKDOWN

| Item | USD | Status | Priority |
|------|-----|--------|----------|
| DEX pool (BTCBR/USDT) | $5,000 | Pending | P0 |
| Bridge vault | $2,000 | Pending | P0 |
| Incentives / airdrops | $1,000 | Pending | P1 |
| Marketing / design | $1,000 | Pending | P1 |
| Ops buffer | $1,000 | Pending | P2 |
| **Total** | **$10,000** | **Hard Cap** | - |

---

## 🗓️ DAY-BY-DAY EXECUTION

### **DAY 1: Infrastructure Setup**

#### Task 1.1: Deploy Block Explorer (Blockscout)
```bash
# SSH to server
ssh -i bsc-validator-key.pem ubuntu@3.91.50.187

# Install Docker Compose if not present
sudo apt-get update
sudo apt-get install -y docker-compose

# Create blockscout directory
mkdir -p ~/blockscout
cd ~/blockscout

# Download Blockscout docker-compose
wget https://raw.githubusercontent.com/blockscout/blockscout/master/docker-compose/docker-compose.yml

# Configure environment
cat > .env << 'EOF'
NETWORK_NAME=BTCBR Chain
SUBNETWORK=Mainnet
CHAIN_ID=885824
ETHEREUM_JSONRPC_VARIANT=geth
ETHEREUM_JSONRPC_HTTP_URL=http://localhost:8545
ETHEREUM_JSONRPC_WS_URL=ws://localhost:8546
COIN=BNB
LOGO=/images/btcbr_logo.svg
BLOCKSCOUT_HOST=explorer.bitcoinbr.tech
BLOCKSCOUT_PROTOCOL=https
SECRET_KEY_BASE=$(openssl rand -base64 64)
DATABASE_URL=postgresql://postgres:changeme@postgres:5432/blockscout
EOF

# Start Blockscout
docker-compose up -d

# Wait for initialization (5-10 minutes)
docker-compose logs -f
```

**Expected Result:**
- Explorer accessible at: http://3.91.50.187:4000
- Indexing blocks from genesis

**Budget Impact:** $0 (self-hosted)

---

#### Task 1.2: Configure NGINX for Explorer
```bash
# Add explorer subdomain to NGINX
sudo tee /etc/nginx/sites-available/explorer << 'EOF'
server {
    listen 80;
    server_name explorer.bitcoinbr.tech;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/explorer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d explorer.bitcoinbr.tech
```

**Expected Result:**
- Explorer accessible at: https://explorer.bitcoinbr.tech

**DNS Required:**
```
explorer.bitcoinbr.tech  A  3.91.50.187
```

---

#### Task 1.3: Verify Token on Explorer
```bash
# Prepare token verification
cd /Volumes/Development/sahalat/blockchain-v2

# Token contract details:
# Address: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
# Name: Bitcoin BR
# Symbol: BTCBR
# Decimals: 18
# Compiler: Solidity 0.5.16
```

1. Go to: https://explorer.bitcoinbr.tech/address/0x0cF8e180350253271f4b917CcFb0aCCc4862F262
2. Click "Verify & Publish"
3. Upload contract source from `contracts/` folder
4. Match compiler version and optimization settings

**Expected Result:**
- ✅ Green checkmark on token contract
- Public can read contract code

---

### **DAY 2: Bridge Deployment**

#### Task 2.1: Deploy Bridge to BSC Mainnet
```bash
cd /Volumes/Development/sahalat/blockchain-v2

# Set environment variables
export BSC_MAINNET_RPC="https://bsc-dataseed.binance.org"
export MAINNET_PRIVATE_KEY="YOUR_MAINNET_DEPLOYER_KEY"
export BTCBR_MAINNET="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"

# Deploy mainnet bridge
node scripts/deploy-mainnet-bridge.js
```

**Expected Output:**
```
✅ BTCBRBridgeMainnet deployed at: 0x...
✅ Validators added: 3/3
✅ Transfer limits configured
✅ Daily limit: 500,000 BTCBR
```

**Save Contract Address:** `MAINNET_BRIDGE_ADDRESS=0x...`

**Budget Impact:** ~$5-10 in gas fees (BNB)

---

#### Task 2.2: Deploy Bridge to Private Chain
```bash
# Deploy private chain bridge
export PRIVATE_RPC="https://rpc.bitcoinbr.tech"
export PRIVATE_KEY="YOUR_PRIVATE_CHAIN_KEY"

node scripts/deploy-private-bridge.js
```

**Expected Output:**
```
✅ BTCBRBridgePrivate deployed at: 0x...
✅ Mainnet bridge linked
✅ Validators synchronized
```

**Save Contract Address:** `PRIVATE_BRIDGE_ADDRESS=0x...`

---

#### Task 2.3: Fund Bridge Vaults ($2,000)
```bash
# Calculate token amounts
# $2,000 at current BTCBR price (assume $0.001 = 2,000,000 BTCBR)

# Fund mainnet vault
node -e "
const { ethers } = require('ethers');
(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);
  
  const btcbr = new ethers.Contract(
    '0x0cF8e180350253271f4b917CcFb0aCCc4862F262',
    ['function transfer(address to, uint256 amount) returns (bool)'],
    wallet
  );
  
  const amount = ethers.parseEther('2000000'); // 2M BTCBR
  const tx = await btcbr.transfer(process.env.MAINNET_BRIDGE_ADDRESS, amount);
  await tx.wait();
  
  console.log('✅ Mainnet vault funded:', tx.hash);
})();
"
```

**Expected Result:**
- Mainnet vault: 2,000,000 BTCBR
- Private vault: 0 BTCBR (mints on demand)

**Budget Impact:** $2,000 in BTCBR tokens

---

#### Task 2.4: Setup Multisig (2-of-3)
```bash
# Use Gnosis Safe on BSC Mainnet
# Visit: https://app.safe.global

# Create Safe with:
# - Your wallet
# - Trusted partner #1
# - Trusted partner #2
# Threshold: 2 of 3

# Transfer bridge ownership to Safe
node -e "
const { ethers } = require('ethers');
(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);
  
  const bridge = new ethers.Contract(
    process.env.MAINNET_BRIDGE_ADDRESS,
    ['function transferOwnership(address newOwner)'],
    wallet
  );
  
  const safedAddress = 'YOUR_GNOSIS_SAFE_ADDRESS';
  const tx = await bridge.transferOwnership(safeAddress);
  await tx.wait();
  
  console.log('✅ Bridge ownership transferred to multisig');
})();
"
```

**Expected Result:**
- Bridge controlled by 2-of-3 multisig
- Daily limit: $1,000 max withdrawal

**Budget Impact:** $0

---

### **DAY 3: DEX Pool Setup**

#### Task 3.1: Deploy PancakeSwap V2 Fork (Optional)

**Option A:** Use existing PancakeSwap on BSC
- Pair: BTCBR/USDT on PancakeSwap
- URL: https://pancakeswap.finance

**Option B:** Deploy private DEX (advanced)
```bash
# Clone PancakeSwap contracts
git clone https://github.com/pancakeswap/pancake-swap-core.git
cd pancake-swap-core

# Deploy factory and router
# (Complex - recommend using existing PancakeSwap)
```

**Recommendation:** Use **Option A** (existing PancakeSwap)

---

#### Task 3.2: Create BTCBR/USDT Pool
```bash
# Required tokens:
# - BTCBR: 2,500,000 tokens (~$2,500 at $0.001)
# - USDT: 2,500 USDT

# Steps:
# 1. Go to https://pancakeswap.finance/add
# 2. Select BTCBR: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
# 3. Select USDT: 0x55d398326f99059fF775485246999027B3197955
# 4. Add liquidity:
#    - BTCBR: 2,500,000
#    - USDT: 2,500
# 5. Confirm transaction
```

**Expected Result:**
- Pool created: BTCBR/USDT
- Initial price: $0.001 per BTCBR
- Total liquidity: $5,000
- LP tokens received: ~XXX CAKE-LP

**Budget Impact:** $5,000 ($2,500 BTCBR + $2,500 USDT)

---

#### Task 3.3: Lock LP Tokens (12 months)
```bash
# Use Team Finance
# URL: https://www.team.finance/lock

# Steps:
# 1. Connect wallet with LP tokens
# 2. Select "Lock Tokens"
# 3. Choose LP token: BTCBR-USDT CAKE-LP
# 4. Lock duration: 365 days
# 5. Set unlock date: [Today + 1 year]
# 6. Confirm and pay fee (~0.1 BNB)
```

**Expected Result:**
- LP tokens locked for 12 months
- Public lock certificate URL
- Lock proof on-chain

**Budget Impact:** ~$30 in BNB fees

---

### **DAY 4: Public Visibility**

#### Task 4.1: Register on Chainlist.org
```bash
# Prepare network metadata
cat > chainlist-submission.json << 'EOF'
{
  "name": "BTCBR Chain",
  "chain": "BTCBR",
  "network": "mainnet",
  "chainId": 885824,
  "nativeCurrency": {
    "name": "BNB",
    "symbol": "BNB",
    "decimals": 18
  },
  "rpc": [
    "https://rpc.bitcoinbr.tech"
  ],
  "faucets": [],
  "explorers": [
    {
      "name": "BTCBR Explorer",
      "url": "https://explorer.bitcoinbr.tech",
      "standard": "EIP3091"
    }
  ],
  "infoURL": "https://bitcoinbr.tech"
}
EOF

# Submit to: https://github.com/ethereum-lists/chains
# Create PR with above JSON
```

**Expected Result:**
- Network visible on Chainlist.org
- Users can add to MetaMask with 1 click

**Budget Impact:** $0

---

#### Task 4.2: Add Token Metadata
```javascript
// Add to website for MetaMask auto-detection
const tokenMetadata = {
  type: 'ERC20',
  options: {
    address: '0x0cF8e180350253271f4b917CcFb0aCCc4862F262',
    symbol: 'BTCBR',
    decimals: 18,
    image: 'https://bitcoinbr.tech/images/btcbr-logo.png'
  }
};

// Add "Add to MetaMask" button
window.ethereum.request({
  method: 'wallet_watchAsset',
  params: tokenMetadata
});
```

**Expected Result:**
- Users can add BTCBR token with 1 click
- Token logo appears in MetaMask

**Budget Impact:** $0

---

#### Task 4.3: Create Public Dashboard
```bash
# Create simple Next.js dashboard
npx create-next-app@latest btcbr-dashboard
cd btcbr-dashboard

# Install dependencies
npm install ethers recharts

# Create dashboard components:
# - Live block number
# - Total supply
# - Pool statistics
# - Bridge volume
# - Top holders

# Deploy to Vercel (free)
vercel --prod
```

**Expected Result:**
- Public dashboard at: https://dashboard.bitcoinbr.tech
- Real-time stats from explorer API
- Pool TVL and volume

**Budget Impact:** $0 (Vercel free tier)

---

### **DAY 5: Marketing & Documentation**

#### Task 5.1: Launch Materials
```bash
# Create launch announcement
cat > LAUNCH_ANNOUNCEMENT.md << 'EOF'
# 🚀 BTCBR Chain Public Launch

We're excited to announce the public launch of BTCBR Chain!

## Network Details
- Chain ID: 885824
- RPC: https://rpc.bitcoinbr.tech
- Explorer: https://explorer.bitcoinbr.tech
- Symbol: BNB

## BTCBR Token
- Contract: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- Symbol: BTCBR
- Decimals: 18
- Total Supply: 21 Septillion

## Trading
- DEX: PancakeSwap
- Pair: BTCBR/USDT
- Liquidity: $5,000 (Locked 12 months)
- Pool: [Link to PancakeSwap]

## Bridge
- BSC Mainnet ↔ BTCBR Chain
- Vault: $2,000 reserve
- Daily limit: $1,000
- Multisig: 2-of-3

## Getting Started
1. Add network: [Chainlist Link]
2. Add token to MetaMask
3. Bridge tokens: [Bridge URL]
4. Trade on PancakeSwap

## Links
- Website: https://bitcoinbr.tech
- Explorer: https://explorer.bitcoinbr.tech
- Dashboard: https://dashboard.bitcoinbr.tech
- Bridge: https://bridge.bitcoinbr.tech
- Twitter: @BTCBRChain
- Telegram: t.me/btcbrchain

## Security
- LP Locked: [Team Finance Link]
- Multisig: [Gnosis Safe Link]
- Audit: [Link when available]
EOF
```

**Distribution Channels:**
- Twitter announcement
- Telegram group
- Reddit (r/CryptoMoonShots, r/BSC)
- Medium article
- CoinGecko/CoinMarketCap listing request

**Budget Impact:** $500 (Twitter ads + influencer mentions)

---

#### Task 5.2: Design Assets
- Logo (high-res PNG, SVG)
- Banner (Twitter, Telegram)
- Infographics (tokenomics, roadmap)
- Tutorial videos

**Tools:**
- Canva (free tier)
- Figma (free tier)

**Budget Impact:** $500 (freelance designer if needed)

---

### **DAY 6: Incentive Campaign**

#### Task 6.1: Airdrop Setup
```javascript
// Airdrop script for early testers
const recipients = [
  { address: '0x...', amount: '1000' },
  { address: '0x...', amount: '1000' },
  // ... 100 recipients
];

// Total: 100,000 BTCBR = $100
// Budget: $1,000 = 1,000,000 BTCBR for 1,000 users

// Execute airdrop
node scripts/airdrop-btcbr.js
```

**Campaign Ideas:**
- Bridge test rewards: 100 BTCBR per test
- Liquidity provider bonus: 500 BTCBR
- Twitter engagement: 50 BTCBR per retweet
- Telegram participation: 50 BTCBR per join

**Budget Impact:** $1,000 in BTCBR

---

#### Task 6.2: LP Incentive Program
```solidity
// Optional: Deploy staking contract for LP rewards
// Reward: 10,000 BTCBR per day for 30 days
// Total: 300,000 BTCBR = $300
```

**Budget Impact:** Included in $1,000 incentive budget

---

### **DAY 7: Go Live!**

#### Task 7.1: Final Checklist
- [ ] Explorer fully synced
- [ ] Token verified on explorer
- [ ] Bridge functional (test transfer)
- [ ] DEX pool active
- [ ] LP tokens locked
- [ ] Chainlist approved
- [ ] Dashboard live
- [ ] Social accounts active
- [ ] Launch announcement ready

---

#### Task 7.2: Launch Sequence
```bash
# 1. Morning (9 AM UTC)
# - Post Twitter announcement
# - Pin Telegram message
# - Activate Chainlist PR

# 2. Midday (12 PM UTC)
# - Start airdrop campaign
# - Enable bridge website
# - Monitor pool activity

# 3. Evening (6 PM UTC)
# - First community AMA
# - Share explorer stats
# - Announce first week goals
```

**Expected Result:**
- Network public and discoverable
- Trading active on PancakeSwap
- Bridge processing transfers
- Community engaging

---

## 📊 POST-LAUNCH MONITORING

### Week 1-2: Price Discovery
**Goals:**
- Maintain stable $0.001 price
- Avoid pump & dump
- Build organic volume

**Metrics:**
- Daily volume: Target $500+
- Unique wallets: Target 100+
- Bridge transfers: Target 50+

---

### Week 3-4: Trust Building
**Actions:**
- Publish burn proofs (if applicable)
- Share lock certificates
- Weekly transparency reports
- Community calls

---

### Week 5-8: Volume Growth
**Actions:**
- Airdrop to early supporters
- Partner with other BSC projects
- List on CoinGecko
- Medium articles

---

### Week 9-12: Expansion Prep
**Planning:**
- Increase liquidity to $20k
- Audit bridge contracts
- Expand validator set
- Launch governance token

---

## 🔒 SECURITY CHECKLIST

- [ ] All private keys in hardware wallets
- [ ] Multisig configured (2-of-3)
- [ ] Daily bridge limit: $1,000
- [ ] LP tokens locked (proof public)
- [ ] Rate limiting on RPC
- [ ] DDOS protection (Cloudflare)
- [ ] Monitoring alerts (Grafana)
- [ ] Incident response plan

---

## 💡 CONTINGENCY PLANS

### If pool gets drained:
- Pause bridge immediately
- Contact DEX support
- Publish incident report
- Compensate affected users from ops buffer

### If chain halts:
- Restart validators within 5 minutes
- Investigate consensus issue
- Publish post-mortem
- Upgrade if needed

### If bridge exploited:
- Pause both bridges
- Secure remaining funds
- Hire security firm
- Reimburse from insurance fund

---

## 📞 SUPPORT RESOURCES

**Technical Support:**
- Email: support@bitcoinbr.tech
- Telegram: @btcbr_support
- Discord: [Server Link]

**Documentation:**
- User Guide: https://docs.bitcoinbr.tech
- Developer Docs: https://dev.bitcoinbr.tech
- Bridge Guide: docs/BRIDGE_DEPLOYMENT_SIMPLE.md

**Emergency Contacts:**
- Validator Admin: [Phone]
- Security Team: [Email]
- Bridge Operators: [Telegram]

---

## ✅ LAUNCH DAY COMMAND SEQUENCE

```bash
# Execute in order:

# 1. Final health check
curl https://rpc.bitcoinbr.tech -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 2. Verify explorer
curl https://explorer.bitcoinbr.tech

# 3. Test bridge
node scripts/test-bridge-transfer.js

# 4. Verify pool
# Visit: https://pancakeswap.finance/info/pool/[YOUR_POOL_ADDRESS]

# 5. Publish announcement
# Post to all channels simultaneously

# 6. Monitor logs
tail -f /var/log/geth/validator1.log
docker-compose -f ~/blockscout/docker-compose.yml logs -f

# 7. Watch analytics
# Dashboard: https://dashboard.bitcoinbr.tech
# DEXTools: [Add pool]
```

---

## 🎯 SUCCESS METRICS

### Day 1
- [ ] 50+ unique wallets
- [ ] $1,000+ trading volume
- [ ] 10+ bridge transfers
- [ ] 500+ Twitter impressions

### Week 1
- [ ] 200+ unique wallets
- [ ] $5,000+ trading volume
- [ ] 100+ bridge transfers
- [ ] 5,000+ Twitter impressions
- [ ] CoinGecko application submitted

### Month 1
- [ ] 1,000+ unique wallets
- [ ] $50,000+ trading volume
- [ ] 1,000+ bridge transfers
- [ ] CoinGecko listing approved
- [ ] First partner integration

---

## 💰 BUDGET TRACKING

| Item | Allocated | Spent | Remaining |
|------|-----------|-------|-----------|
| DEX Pool | $5,000 | $0 | $5,000 |
| Bridge Vault | $2,000 | $0 | $2,000 |
| Incentives | $1,000 | $0 | $1,000 |
| Marketing | $1,000 | $0 | $1,000 |
| Operations | $1,000 | $0 | $1,000 |
| **Total** | **$10,000** | **$0** | **$10,000** |

Update this table daily during launch week.

---

## 📝 NOTES

- This checklist assumes you already have the $10,000 in liquid funds
- All amounts are estimates; actual costs may vary
- Test everything on testnet first before mainnet
- Keep detailed records of all transactions
- Publish transparency reports weekly

---

**Created:** $(date)  
**Chain ID:** 885824  
**Network:** BTCBR Chain  
**Budget:** $10,000 USD  
**Timeline:** 7 days  

**Ready to launch? Let's go! 🚀**

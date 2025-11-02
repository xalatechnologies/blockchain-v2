# 🚀 BTCBR Chain Launch - Quick Reference Card

## 📞 Emergency Contacts
```
Validator Admin: [YOUR_PHONE]
Security Team:   security@bitcoinbr.tech
Bridge Operators: @btcbr_bridge (Telegram)
```

## 🔑 Critical Addresses
```bash
# Network
Chain ID:        885824
RPC HTTPS:       https://rpc.bitcoinbr.tech
RPC HTTP:        http://3.91.50.187:8545
Explorer:        https://explorer.bitcoinbr.tech

# Token
BTCBR Contract:  0x0cF8e180350253271f4b917CcFb0aCCc4862F262
Symbol:          BTCBR
Decimals:        18
Total Supply:    21 septillion

# Bridges (deploy to get addresses)
Mainnet Bridge:  [TO BE DEPLOYED]
Private Bridge:  [TO BE DEPLOYED]

# DEX (create to get addresses)
Pool Address:    [TO BE CREATED]
LP Token:        [TO BE CREATED]
```

## 💰 Budget Allocation ($10,000)
```
✓ DEX Pool:      $5,000  (BTCBR/USDT liquidity)
✓ Bridge Vault:  $2,000  (Reserve for transfers)
✓ Incentives:    $1,000  (Airdrops & rewards)
✓ Marketing:     $1,000  (Social ads & design)
✓ Operations:    $1,000  (Gas, servers, buffer)
```

## 🗓️ 7-Day Launch Timeline

### Day 1: Infrastructure ⚙️
- [ ] Deploy Blockscout Explorer
- [ ] Configure NGINX + SSL
- [ ] Verify token on explorer
- **Budget:** $0 (self-hosted)

### Day 2: Bridge 🌉
- [ ] Deploy mainnet bridge
- [ ] Deploy private bridge
- [ ] Fund vaults with $2k
- [ ] Setup 2-of-3 multisig
- **Budget:** $2,010 (vault + gas)

### Day 3: DEX 💱
- [ ] Create BTCBR/USDT pool
- [ ] Add $5k liquidity
- [ ] Lock LP tokens (12 months)
- **Budget:** $5,030 (liquidity + lock fee)

### Day 4: Visibility 📣
- [ ] Register Chainlist.org
- [ ] Deploy public dashboard
- [ ] Add MetaMask detection
- **Budget:** $0 (free services)

### Day 5: Marketing 📢
- [ ] Launch announcement
- [ ] Social media setup
- [ ] Design assets
- **Budget:** $1,000 (ads + design)

### Day 6: Incentives 🎁
- [ ] Airdrop script ready
- [ ] Rewards campaign plan
- [ ] Test distribution
- **Budget:** $1,000 (token rewards)

### Day 7: Launch! 🎉
- [ ] Final checks
- [ ] Go live announcement
- [ ] Monitor & respond
- **Budget:** $0 (included)

---

## ⚡ Quick Commands

### Check Chain Health
```bash
# Block number
curl -s -X POST https://rpc.bitcoinbr.tech \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq -r '.result'

# Peer count
curl -s -X POST https://rpc.bitcoinbr.tech \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | jq -r '.result'
```

### Check Token Balance
```bash
# Your balance
node -e "
const { ethers } = require('ethers');
(async () => {
  const provider = new ethers.JsonRpcProvider('https://rpc.bitcoinbr.tech');
  const btcbr = new ethers.Contract(
    '0x0cF8e180350253271f4b917CcFb0aCCc4862F262',
    ['function balanceOf(address) view returns (uint256)'],
    provider
  );
  const balance = await btcbr.balanceOf('YOUR_ADDRESS');
  console.log('Balance:', ethers.formatEther(balance), 'BTCBR');
})();
"
```

### Deploy Explorer (On Server)
```bash
ssh -i bsc-validator-key.pem ubuntu@3.91.50.187
cd /Volumes/Development/sahalat/blockchain-v2
./scripts/launch-public.sh explorer
```

### Deploy Bridge
```bash
export MAINNET_PRIVATE_KEY="0x..."
export PRIVATE_KEY="0x..."
./scripts/launch-public.sh bridge
```

### Create DEX Pool
```bash
# Manual step - use PancakeSwap UI
# https://pancakeswap.finance/add
./scripts/launch-public.sh dex
```

### Run All Checks
```bash
./scripts/launch-public.sh checks
```

---

## 🔒 Security Checklist

### Pre-Launch
- [ ] Private keys in hardware wallets
- [ ] Multisig configured (2-of-3)
- [ ] Bridge daily limit: $1,000
- [ ] Rate limiting enabled
- [ ] DDOS protection active
- [ ] Monitoring alerts setup

### Post-Launch
- [ ] Monitor first 100 transactions
- [ ] Check pool for manipulation
- [ ] Verify bridge transfers
- [ ] Track social sentiment
- [ ] Respond to issues <5 min

---

## 🎯 Success Metrics

### Day 1 Goals
- 50+ unique wallets
- $1,000+ trading volume
- 10+ bridge transfers
- 500+ Twitter impressions

### Week 1 Goals
- 200+ unique wallets
- $5,000+ trading volume
- 100+ bridge transfers
- 5,000+ social reach

### Month 1 Goals
- 1,000+ wallets
- $50,000+ volume
- CoinGecko listing
- 1st partnership

---

## 🆘 Emergency Procedures

### Chain Halted
```bash
# SSH to server
ssh -i bsc-validator-key.pem ubuntu@3.91.50.187

# Check validator status
ps aux | grep geth

# Restart validators
cd ~/btcbr-chain
./restart-validators.sh

# OR use Ansible
cd /Volumes/Development/sahalat/blockchain-v2/infrastructure/ansible
ansible-playbook -i inventory/hosts playbooks/deploy-bsc-simple.yml
```

### Bridge Exploit
```bash
# IMMEDIATELY pause bridge
node -e "
const { ethers } = require('ethers');
(async () => {
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);
  const bridge = new ethers.Contract(
    process.env.MAINNET_BRIDGE_ADDRESS,
    ['function pause()'],
    wallet
  );
  await bridge.pause();
  console.log('✓ Bridge paused');
})();
"

# Contact security team
# Post incident report
# Investigate & patch
```

### Pool Manipulation
```bash
# Check pool reserves
# Look for large trades
# Contact DEX support
# Post warning on socials
# Prepare counter-measures
```

---

## 📊 Monitoring Dashboard URLs

```
Explorer:        https://explorer.bitcoinbr.tech
Public Dashboard: https://dashboard.bitcoinbr.tech
DEX Analytics:   https://pancakeswap.finance/info/pool/[POOL_ADDRESS]
Chainlist:       https://chainlist.org/?search=885824
Token Info:      https://bscscan.com/token/0x0cF8e180350253271f4b917CcFb0aCCc4862F262
```

---

## 🔗 Social Links

```
Website:   https://bitcoinbr.tech
Twitter:   https://twitter.com/BTCBRChain
Telegram:  https://t.me/btcbrchain
Discord:   [Create server]
Medium:    [Create publication]
GitHub:    https://github.com/btcbr/blockchain-v2
```

---

## 📝 Launch Day Sequence

### 9:00 AM UTC
- ✅ Final health check
- ✅ Verify all services up
- ✅ Test bridge transfer
- ✅ Check pool liquidity

### 12:00 PM UTC
- 🐦 Post Twitter announcement
- 📢 Pin Telegram message
- 🌐 Update website
- 📋 Activate Chainlist PR

### 3:00 PM UTC
- 🎁 Start airdrop campaign
- 🌉 Open bridge website
- 📊 Monitor pool activity
- 💬 Engage community

### 6:00 PM UTC
- 🎤 Community AMA
- 📈 Share 6-hour stats
- 🎯 Announce week 1 goals
- 🍾 Celebrate! 🎉

---

## 💡 Pro Tips

1. **Test everything twice** before going public
2. **Start small** - Don't rush to add more liquidity
3. **Be transparent** - Share metrics daily
4. **Respond quickly** - Community questions <1 hour
5. **Document everything** - Public reports build trust
6. **Stay calm** - Price volatility is normal
7. **Think long-term** - Don't panic on day 1 dips

---

## 📞 Support Resources

### Documentation
- User Guide: https://docs.bitcoinbr.tech
- Developer Docs: https://dev.bitcoinbr.tech
- Bridge Tutorial: docs/BRIDGE_DEPLOYMENT_SIMPLE.md
- Launch Checklist: docs/PUBLIC_LAUNCH_CHECKLIST.md

### Technical Support
- Email: support@bitcoinbr.tech
- Telegram: @btcbr_support
- Discord: [Support Channel]
- GitHub Issues: [Repository]

---

**🚀 Ready to Launch!**

*Last Updated: $(date)*  
*Budget: $10,000 USD*  
*Timeline: 7 Days*  
*Chain ID: 885824*

**Let's make history! 🌟**

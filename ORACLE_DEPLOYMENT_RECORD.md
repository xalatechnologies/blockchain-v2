# Nor Chain Oracle Network - Mainnet Deployment Record

**Deployment Date:** November 2, 2025
**Network:** Nor Chain Mainnet
**Chain ID:** 65001
**Deployer:** 0xdD779a290C937144F80Eb75b75d814c834536B1b

---

## ✅ Deployed Oracle Contracts

### Production OracleAggregator Contracts

| Price Feed | Contract Address | Block Explorer |
|------------|------------------|----------------|
| **GOLD/USD** | `0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651` | [View on Explorer](https://explorer.norchain.org/address/0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651) |
| **AED/USD** | `0x502ec2Ce7cd266Eff9e147d66Df3e4D4fcB9e812` | [View on Explorer](https://explorer.norchain.org/address/0x502ec2Ce7cd266Eff9e147d66Df3e4D4fcB9e812) |
| **KES/USD** | `0x0D8e7Ed1B328302bbAA0249CeFD6ca52E050F86e` | [View on Explorer](https://explorer.norchain.org/address/0x0D8e7Ed1B328302bbAA0249CeFD6ca52E050F86e) |
| **NOK/USD** | `0xa8f2fa9B2B7c26d69E996480C914914Aad25D4E6` | [View on Explorer](https://explorer.norchain.org/address/0xa8f2fa9B2B7c26d69E996480C914914Aad25D4E6) |
| **SEK/USD** | `0x68EF664d975c0fda0BbD994433e9651cBED2B38f` | [View on Explorer](https://explorer.norchain.org/address/0x68EF664d975c0fda0BbD994433e9651cBED2B38f) |
| **DKK/USD** | `0x793c849f6207E9a7B1C8Bdf99D0743400f6bB658` | [View on Explorer](https://explorer.norchain.org/address/0x793c849f6207E9a7B1C8Bdf99D0743400f6bB658) |

---

## 🔧 Oracle Configuration

### Authorized Oracle Nodes (3 Validators)

1. **Oracle Node 1:** `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD`
2. **Oracle Node 2:** `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
3. **Oracle Node 3:** `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`

### Oracle Parameters

- **Minimum Oracle Count:** 3 (requires all 3 validators to submit)
- **Staleness Threshold:** 86,400 seconds (24 hours)
- **Deviation Threshold:** 10% (prices >10% from median marked as outliers)
- **Update Frequency:** 300 seconds (5 minutes per oracle)

---

## 📊 Current Stablecoin Deployments

### Stablecoins Requiring Oracle Migration

| Stablecoin | Address | Current Oracles (MockOracle) | New Oracles (OracleAggregator) |
|------------|---------|------------------------------|--------------------------------|
| **Dirhamat** | `0x7857D6a475498e535969121f1B7B96151E422813` | Gold: 0xe97D...20fa<br>AED: 0x4A82...763 | Gold: 0x1299...651<br>AED: 0x502e...812 |
| **Digital KES** | `0x9f37c0fCc07741C7bF452390F4415820f0E605B7` | KES: 0xA37C...eDe | KES: 0x0D8e...86e |
| **NORDCoin** | `0x51321281AB0644aed5555b3A306C7AbfFf13c4C2` | NOK: 0x1495...f0b<br>SEK: 0x26c0...355<br>DKK: 0x5DAB...Da3 | NOK: 0xa8f2...4E6<br>SEK: 0x68EF...38f<br>DKK: 0x793c...658 |

---

## 🚀 Next Steps

### Phase 1: Deploy Oracle Nodes ✅ DONE

- [x] Deploy OracleAggregator contracts to mainnet
- [x] Generate oracle node configuration
- [x] Save deployment addresses

### Phase 2: Setup Oracle Services (IN PROGRESS)

**Option A: Manual Deployment to AWS**
```bash
# SSH to your AWS validator server
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187

# Install Node.js (if not present)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Create oracle directory
mkdir -p ~/oracle-node
cd ~/oracle-node

# Copy files from local machine
# (use scp or copy manually)

# Install dependencies
npm install

# Configure
cp .env.generated .env
nano .env  # Add oracle private key

# Install PM2
sudo npm install -g pm2

# Start oracle service
pm2 start oracle-service.js --name nor-oracle
pm2 save
pm2 startup

# Monitor
pm2 logs nor-oracle
```

**Option B: Automated Deployment**
```bash
# From your local machine
chmod +x scripts/deploy-oracle-to-aws.sh
bash scripts/deploy-oracle-to-aws.sh
```

### Phase 3: Update Stablecoin Oracles

**Create Migration Script:**
```javascript
// scripts/migrate-to-oracle-aggregator.js
import hre from "hardhat";
const { ethers } = hre;

// New oracle addresses
const NEW_GOLD_ORACLE = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
const NEW_AED_ORACLE = "0x502ec2Ce7cd266Eff9e147d66Df3e4D4fcB9e812";
const NEW_KES_ORACLE = "0x0D8e7Ed1B328302bbAA0249CeFD6ca52E050F86e";
const NEW_NOK_ORACLE = "0xa8f2fa9B2B7c26d69E996480C914914Aad25D4E6";
const NEW_SEK_ORACLE = "0x68EF664d975c0fda0BbD994433e9651cBED2B38f";
const NEW_DKK_ORACLE = "0x793c849f6207E9a7B1C8Bdf99D0743400f6bB658";

async function main() {
  // Update Dirhamat
  const dirhamat = await ethers.getContractAt("Dirhamat", "0x7857D6a475498e535969121f1B7B96151E422813");
  await dirhamat.setGoldPriceOracle(NEW_GOLD_ORACLE);
  await dirhamat.setAedUsdOracle(NEW_AED_ORACLE);

  // Update Digital KES
  const digitalKES = await ethers.getContractAt("DigitalKES", "0x9f37c0fCc07741C7bF452390F4415820f0E605B7");
  await digitalKES.setKesUsdOracle(NEW_KES_ORACLE);

  // Update NORDCoin
  const nordCoin = await ethers.getContractAt("NORDCoin", "0x51321281AB0644aed5555b3A306C7AbfFf13c4C2");
  await nordCoin.setNokUsdOracle(NEW_NOK_ORACLE);
  await nordCoin.setSekUsdOracle(NEW_SEK_ORACLE);
  await nordCoin.setDkkUsdOracle(NEW_DKK_ORACLE);

  console.log("✅ All stablecoins migrated to OracleAggregator!");
}
```

### Phase 4: Verify Oracle Operation

**Check oracle submissions:**
```bash
# Monitor oracle logs
pm2 logs nor-oracle

# Check blockchain for PriceSubmitted events
# Expected: 3 submissions per round (one from each oracle)

# Check blockchain for PriceAggregated events
# Expected: 1 aggregation per round (median of 3 submissions)
```

**Verify prices:**
```bash
# Using cast (foundry)
cast call 0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651 "getPrice()(uint256)" --rpc-url https://rpc.norchain.org

# Using ethers.js
const oracle = await ethers.getContractAt("OracleAggregator", "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651");
const price = await oracle.getPrice();
console.log("GOLD/USD:", ethers.formatEther(price));
```

---

## 📈 Monitoring & Alerts

### Key Metrics to Monitor

1. **Oracle Uptime:** All 3 oracle nodes should be running 24/7
2. **Price Update Frequency:** New prices every ~5 minutes
3. **Reputation Scores:** Should stay above 90 for all oracles
4. **Gas Costs:** ~0.44 NOR per day for all oracles
5. **Staleness:** Prices should never exceed 24 hours

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Oracle Downtime | 15 minutes | 1 hour |
| Reputation Score | <90 | <70 |
| Price Staleness | >6 hours | >12 hours |
| Gas Balance | <5 NOR | <1 NOR |

---

## 🔐 Security Considerations

### Oracle Wallet Management

- **Dedicated Wallets:** Use separate wallets for each oracle (not validator keys)
- **Minimal Funding:** Keep only ~10 NOR per wallet (months of operation)
- **Backup Keys:** Store private keys securely (encrypted, offline)
- **Monitoring:** Set up balance alerts

### Access Control

- **Admin Role:** Only deployer has admin rights (add/remove oracles)
- **Oracle Role:** Only authorized validators can submit prices
- **Emergency Pause:** Admin can pause oracles in case of issues

---

## 💰 Cost Analysis

### Deployment Costs

- **Oracle Contracts:** ~0.059 NOR (6 contracts deployed)
- **Total Deployment:** 0.059 NOR

### Monthly Operating Costs

**Gas Costs (1 Gwei gas price):**
- Per oracle per submission: ~0.000085 NOR
- Per oracle per day (6 feeds × 288 submissions): ~0.147 NOR
- All 3 oracles per day: ~0.44 NOR
- **Monthly: ~13.1 NOR**
- **Yearly: ~157 NOR**

**Infrastructure Costs:**
- AWS EC2 (co-located with validators): **$0/month**

**API Costs:**
- Free tier (sufficient for 3 oracles): **$0/month**
- Optional CoinGecko Pro: $129/month

**Total Monthly Cost:** ~13 NOR + $0-$129 = **Very Cost-Effective!**

---

## 📚 Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| **Deployment Record** | `/ORACLE_DEPLOYMENT_RECORD.md` | This file |
| **Setup Guide** | `/docs/ORACLE_NETWORK_GUIDE.md` | Complete setup instructions |
| **Deployment Summary** | `/docs/ORACLE_DEPLOYMENT_SUMMARY.md` | Overview and workflow |
| **Smart Contract** | `/contracts/oracles/OracleAggregator.sol` | Oracle contract code |
| **Oracle Service** | `/oracle-node/oracle-service.js` | Node.js oracle service |
| **Deployment Script** | `/scripts/deploy-oracle-network.js` | Deployment automation |
| **AWS Deployment** | `/scripts/deploy-oracle-to-aws.sh` | AWS automation |

---

## 🎯 Success Criteria

- [x] Deploy 6 OracleAggregator contracts
- [x] Configure 3 oracle nodes
- [x] Generate oracle configuration
- [ ] Deploy oracle services to AWS
- [ ] Verify price submissions
- [ ] Update stablecoin oracle addresses
- [ ] Monitor for 24 hours
- [ ] Decommission MockOracle contracts

---

## 📞 Support & Troubleshooting

### Common Issues

**Oracle not submitting:**
- Check oracle wallet has NOR for gas
- Verify RPC connection
- Check private key in .env

**"ALREADY_SUBMITTED" error:**
- Normal - oracle already submitted for this round
- Wait for next round

**Stale prices:**
- Check all 3 oracle nodes are running
- Verify internet connectivity
- Check API rate limits

### Contact

- **Documentation:** `/docs/ORACLE_NETWORK_GUIDE.md`
- **GitHub Issues:** Report issues in project repository
- **Community:** Nor Chain Discord/Telegram

---

**Status:** ✅ **Oracle Contracts Deployed - Ready for Node Deployment**

**Next Action:** Deploy oracle services to AWS validators

🌙 **Nor Chain - Decentralized Price Oracles Live on Mainnet** 🌙

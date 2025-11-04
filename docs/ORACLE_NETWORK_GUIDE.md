# Nor Chain Oracle Network Setup Guide

## Overview

The Nor Chain Oracle Network is a decentralized price feed system that provides reliable, multi-source price data for stablecoins and DeFi applications.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Price Data Sources                      │
│  CoinGecko  │  Binance  │  Forex APIs  │  Metals APIs   │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Oracle Nodes (3 validators)                │
│  Node 1  │  Node 2  │  Node 3  │  (Fetch & Aggregate)   │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│          OracleAggregator Smart Contracts                │
│  GOLD/USD  │  AED/USD  │  KES/USD  │  NOK/USD  │ etc.   │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│           Stablecoin Contracts (Consumers)               │
│  Dirhamat  │  Digital KES  │  NORDCoin                   │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. OracleAggregator Smart Contract

**Features:**
- Multi-oracle consensus (minimum 3 oracles)
- Median price calculation (outlier resistant)
- Staleness protection (24-hour validity)
- Oracle reputation scoring
- Emergency pause functionality

**Key Functions:**
- `submitPrice(uint256 _price)` - Oracle submits price data
- `getPrice()` - Returns current aggregated price
- `addOracle(address oracle)` - Add new oracle node
- `removeOracle(address oracle)` - Remove oracle node

### 2. Oracle Node Service

**Features:**
- Multi-source price fetching
- Automatic blockchain submission
- Error handling and retry logic
- Configurable update intervals
- Gas optimization

**Supported Data Sources:**
- CoinGecko API (crypto prices)
- Binance API (crypto prices)
- Forex APIs (currency rates)
- Metals APIs (gold/silver prices)

## Deployment

### Step 1: Compile Contracts

```bash
npx hardhat compile
```

### Step 2: Deploy Oracle Network

```bash
npx hardhat run scripts/deploy-oracle-network.js --network btcbr
```

This will deploy 6 OracleAggregator contracts (one for each price feed):
- GOLD/USD
- AED/USD
- KES/USD
- NOK/USD
- SEK/USD
- DKK/USD

**Output:**
- Deployment addresses saved to `deployments/oracle-network-{timestamp}.json`
- Oracle node configuration generated at `oracle-node/.env.generated`

### Step 3: Configure Oracle Nodes

1. **Create Oracle Wallets** (if not using validators):
   ```bash
   # Generate 3 new wallets for oracle nodes
   node -e "const ethers = require('ethers'); for(let i=0; i<3; i++) { const w = ethers.Wallet.createRandom(); console.log(\`Oracle \${i+1}: \${w.address}\nPrivate Key: \${w.privateKey}\n\`); }"
   ```

2. **Fund Oracle Wallets**:
   Each oracle needs ~1 NOR for gas fees
   ```bash
   # Send NOR to each oracle wallet
   # Oracle 1: 0x...
   # Oracle 2: 0x...
   # Oracle 3: 0x...
   ```

3. **Configure Environment**:
   ```bash
   cd oracle-node
   cp .env.generated .env
   nano .env  # Edit with your configuration
   ```

   **Required Settings:**
   ```env
   ORACLE_RPC_URL=https://rpc.norchain.org
   ORACLE_PRIVATE_KEY=<your_oracle_wallet_private_key>

   # Contract addresses (auto-filled from deployment)
   GOLD_ORACLE_ADDRESS=0x...
   AED_ORACLE_ADDRESS=0x...
   # etc.

   # Optional API keys for higher rate limits
   COINGECKO_API_KEY=<your_key>
   COINMARKETCAP_API_KEY=<your_key>
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

### Step 4: Start Oracle Nodes

**On Each Validator:**

```bash
cd oracle-node
npm start
```

**Or use PM2 for production**:
```bash
npm install -g pm2
pm2 start oracle-service.js --name nor-oracle
pm2 save
pm2 startup  # Auto-start on server reboot
```

**Monitor Logs:**
```bash
pm2 logs nor-oracle
```

## Oracle Node Operation

### Update Cycle

Every 5 minutes (configurable), each oracle node:

1. **Fetches prices** from multiple sources:
   - CoinGecko API
   - Binance API
   - Forex APIs
   - Metals APIs

2. **Calculates median** from all sources (outlier resistant)

3. **Submits to blockchain** via OracleAggregator contract

4. **Waits for aggregation** (requires 3/3 oracles minimum)

### Example Output

```
🌙 Nor Chain Oracle Node Initializing...
📡 Connected to: https://rpc.norchain.org
🔑 Oracle Address: 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD

📝 Initializing Oracle Contracts...
   ✅ GOLD/USD: 0xe97D574A2e1B62f4d32C5cfeaFa8e6B99Da020fa
   ✅ AED/USD: 0x4A82C98A950125F17943F56273efae39dDe81763
   ✅ KES/USD: 0xA37C1f80Bd02D9d70ce0188831A85c65fdFBeEDe
   ✅ NOK/USD: 0x1495fCf5F09D53203EE1CD1fF974591dc101df0b
   ✅ SEK/USD: 0x26c0eaF731885b14c031cc50dB79b36458E0b355
   ✅ DKK/USD: 0x5DAB997112119BeCf715607CaA0A94f020AE2Da3

✅ Oracle Node Initialized

🚀 Oracle Service Started
⏱️  Update Interval: 300 seconds

============================================================
⏰ Price Update Cycle - 2025-11-02T10:30:00.000Z
============================================================

📊 Fetching price for GOLD/USD...
   CoinGecko (PAXG): $2000.45
   ✅ Median Price: $2000.45 (from 1 sources)
📤 Submitting price to blockchain...
   Feed: GOLD/USD
   Price: 2000.45
   Price (wei): 2000450000000000000000
   Current Round: 42
   📝 Transaction sent: 0xabc123...
   ✅ Transaction confirmed in block 1234567
   ⛽ Gas used: 85432

📊 Fetching price for AED/USD...
   Forex Rate: $0.272000
   ✅ Median Price: $0.272000 (from 1 sources)
📤 Submitting price to blockchain...
   ...

✅ Update cycle complete
```

## Monitoring & Maintenance

### Check Oracle Status

**Via Smart Contract:**
```javascript
const oracle = await ethers.getContractAt("OracleAggregator", ORACLE_ADDRESS);

// Get current price
const price = await oracle.getPrice();
console.log("Current Price:", ethers.formatEther(price));

// Check if stale
const isStale = await oracle.isStale();
console.log("Is Stale:", isStale);

// Get oracle metadata
const [isActive, totalSubmissions, lastSubmission, reputation] =
  await oracle.getOracleMetadata(ORACLE_ADDRESS);
console.log({
  isActive,
  totalSubmissions: totalSubmissions.toString(),
  lastSubmission: new Date(Number(lastSubmission) * 1000),
  reputation: reputation.toString()
});

// Get current round status
const [round, submissionCount, required, canAggregate] =
  await oracle.getCurrentRoundStatus();
console.log({
  round: round.toString(),
  submissionCount: submissionCount.toString(),
  required: required.toString(),
  canAggregate
});
```

### Oracle Health Checks

**1. Price Freshness:**
```bash
# Check last update time
cast call $ORACLE_ADDRESS "lastUpdateTimestamp()(uint256)" --rpc-url https://rpc.norchain.org
```

**2. Reputation Scores:**
```bash
# Check oracle reputation
cast call $ORACLE_ADDRESS "oracles(address)(bool,uint256,uint256,uint256)" $ORACLE_NODE_ADDRESS --rpc-url https://rpc.norchain.org
```

**3. Active Oracles:**
```bash
# Get active oracle count
cast call $ORACLE_ADDRESS "getActiveOracles()(address[])" --rpc-url https://rpc.norchain.org
```

### Troubleshooting

**Oracle Not Submitting:**
1. Check oracle wallet has NOR for gas
2. Verify private key in .env is correct
3. Check RPC connection: `curl https://rpc.norchain.org`
4. Review oracle logs for errors

**"ALREADY_SUBMITTED" Error:**
- Normal - oracle already submitted for this round
- Wait for next round (when 3rd oracle submits)

**Stale Price Error:**
- No updates in 24 hours
- Check all oracle nodes are running
- Verify internet connectivity
- Check API rate limits

**Low Reputation Score:**
- Oracle submitting outlier prices
- Check price data sources
- Verify median calculation logic

## Security Best Practices

### Oracle Key Management

1. **Use Hardware Wallets** for production oracle keys
2. **Separate wallets** for each oracle (don't reuse)
3. **Backup private keys** securely (encrypted, offline)
4. **Monitor wallet balance** and set up alerts

### API Key Protection

1. **Never commit** `.env` files to git
2. **Rotate API keys** regularly
3. **Use different keys** for each oracle node
4. **Monitor API usage** for anomalies

### Network Security

1. **Firewall** oracle node servers
2. **SSL/TLS** for all API connections
3. **VPN** for remote access
4. **DDoS protection** for public endpoints

## Upgrading Oracle Network

### Adding New Oracle Node

```javascript
// Via admin wallet
const oracle = await ethers.getContractAt("OracleAggregator", ORACLE_ADDRESS);
await oracle.addOracle(NEW_ORACLE_ADDRESS);
```

### Removing Oracle Node

```javascript
await oracle.removeOracle(ORACLE_ADDRESS_TO_REMOVE);
```

### Updating Configuration

```javascript
// Set minimum oracle count
await oracle.setMinimumOracles(3);

// Set staleness threshold (in seconds)
await oracle.setStalenessThreshold(86400); // 24 hours

// Set deviation threshold (percentage)
await oracle.setDeviationThreshold(10); // 10%
```

### Emergency Pause

```javascript
// Pause oracle in emergency
await oracle.pause();

// Resume after issue resolved
await oracle.unpause();
```

## Integration with Stablecoins

### Updating Stablecoin Contracts

After deploying the oracle network, update stablecoin contracts to use the new oracles:

```javascript
// Dirhamat example
const dirhamat = await ethers.getContractAt("Dirhamat", DIRHAMAT_ADDRESS);

// Update gold oracle
await dirhamat.setGoldPriceOracle(GOLD_ORACLE_ADDRESS);

// Update AED/USD oracle
await dirhamat.setAedUsdOracle(AED_ORACLE_ADDRESS);
```

### Migration from MockOracle

**Step 1:** Deploy new oracle network (completed above)

**Step 2:** Run oracle nodes and verify price submissions

**Step 3:** Update stablecoin oracle addresses

**Step 4:** Verify prices are updating correctly

**Step 5:** Decommission MockOracle contracts

## Cost Analysis

### Gas Costs

**Per Oracle Submission:**
- ~85,000 gas per `submitPrice()` call
- At 1 Gwei gas price: 0.000085 NOR
- Per day (288 submissions): 0.02448 NOR
- Per month: ~0.73 NOR per oracle

**Total Network Cost (3 oracles, 6 feeds):**
- Per day: 0.44 NOR
- Per month: ~13.1 NOR
- Per year: ~157 NOR

**At $1 NOR price: ~$157/year for complete oracle network**

### API Costs

**Free Tier (Sufficient for 3 oracles):**
- CoinGecko: 10-50 calls/min (free)
- Binance: No limit (free)
- Forex APIs: 250-1000 calls/month (free)

**Recommended for Production:**
- CoinGecko Pro: $129/month (500 calls/min)
- CoinMarketCap Standard: $79/month (10K calls/month)

## Performance Metrics

### Target SLAs

- **Price Update Frequency:** 5 minutes
- **Maximum Staleness:** 24 hours (configurable)
- **Consensus Time:** < 1 minute (3 oracle submissions)
- **Availability:** 99.9% uptime
- **Accuracy:** ±0.5% from market median

### Monitoring Dashboard

Track these metrics:
1. Price update frequency
2. Oracle uptime percentage
3. Reputation scores
4. Submission delays
5. Gas costs
6. API rate limits

## Support & Resources

### Documentation
- Smart Contracts: `/contracts/oracles/OracleAggregator.sol`
- Oracle Node: `/oracle-node/oracle-service.js`
- Deployment: `/scripts/deploy-oracle-network.js`

### Tools
- Hardhat: https://hardhat.org
- Ethers.js: https://docs.ethers.org
- PM2: https://pm2.keymetrics.io

### APIs
- CoinGecko: https://www.coingecko.com/en/api
- Binance: https://binance-docs.github.io/apidocs/spot/en/
- ExchangeRate API: https://www.exchangerate-api.com

---

**Oracle Network Status:** ✅ Production Ready

**Last Updated:** November 2, 2025

**Version:** 1.0

🌙 **Nor Chain - Illuminating Finance with Decentralized Price Feeds** 🌙

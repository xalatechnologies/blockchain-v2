# Xaheen Cross-Chain Relayer

Event monitoring and receipt forwarding service for cross-chain settlement.

## Purpose

Monitor `Fill` events from spoke chains (BSC, Polygon, Ethereum) and forward signed receipts to `SettlementHub` on Xaheen Chain for final settlement.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Relayer Service Architecture                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ EventMonitor │  │ EventMonitor │  │ EventMonitor │  │
│  │    (BSC)     │  │  (Polygon)   │  │  (Ethereum)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                             │
│                            ▼                             │
│                 ┌─────────────────────┐                  │
│                 │  ReceiptForwarder   │                  │
│                 │  (Signs & Forwards) │                  │
│                 └──────────┬──────────┘                  │
│                            │                             │
│                            ▼                             │
│                   ┌────────────────┐                     │
│                   │ SettlementHub  │                     │
│                   │ (Xaheen Chain) │                     │
│                   └────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### Event Monitoring Flow

```
1. SettlementInbox emits Fill event on spoke
   └─> XaheenRouter executed trade
       └─> User bought/sold XHT

2. EventMonitor detects event
   └─> Waits for confirmations (BSC: 15, Polygon: 128, ETH: 12)
       └─> Ensures finality, prevents reorg attacks

3. Receipt Forwarder signs receipt
   └─> Uses relayer's private key
       └─> SettlementHub verifies signature

4. Submit to SettlementHub
   └─> Calls acknowledgeFill()
       └─> Triggers SupplyController.settleFill()
           └─> Updates inventory + logs revenue
```

## Installation

```bash
cd services/relayer
npm install
```

## Configuration

### Environment Variables (.env)

```bash
# Xaheen Chain (Hub)
PRIVATE_CHAIN_RPC=https://rpc.xaheen.org
SETTLEMENT_HUB_ADDRESS=0x[HUB_ADDRESS]
PRICE_AUTHORITY_ADDRESS=0x[PRICE_AUTHORITY]

# BSC
BSC_MAINNET_RPC=https://bsc.publicnode.com
SETTLEMENT_INBOX_BSC_ADDRESS=0x[BSC_INBOX]

# Polygon
POLYGON_RPC=https://polygon-rpc.com
SETTLEMENT_INBOX_POLYGON_ADDRESS=0x[POLYGON_INBOX]

# Ethereum
ETH_RPC=https://eth.llamarpc.com
SETTLEMENT_INBOX_ETH_ADDRESS=0x[ETH_INBOX]

# Relayer Wallet (must have RELAYER_ROLE)
RELAYER_PRIVATE_KEY=0x[RELAYER_KEY]

# Optional
LOG_LEVEL=info
```

### Finality Windows (in src/config.js)

| Chain | Confirmations | Time | Purpose |
|-------|---------------|------|---------|
| BSC | 15 blocks | ~45s | Prevent BSC reorgs |
| Polygon | 128 blocks | ~4min | Prevent Polygon reorgs |
| Ethereum | 12 blocks | ~2.5min | Prevent ETH reorgs |

## Usage

### Start Relayer

```bash
npm start
```

**Output:**
```
🔗 Xaheen Cross-Chain Relayer Starting...

📤 Initializing Receipt Forwarder...
✅ Receipt Forwarder initialized (0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)

📡 Starting monitor for BSC...
   Initialized BSC monitor
   Starting from block: 35123456
   Confirmations required: 15
✅ BSC monitor active

📡 Starting monitor for Polygon...
   Initialized Polygon monitor
   Starting from block: 52678901
   Confirmations required: 128
✅ Polygon monitor active

📡 Starting monitor for Ethereum...
   Initialized Ethereum monitor
   Starting from block: 19456789
   Confirmations required: 12
✅ Ethereum monitor active

✅ Relayer service running
📊 Monitoring 3 spoke chains
🎯 Target: 0xSettlementHub...

📥 New Fill event on BSC:
   Fill ID: 0x1234...
   Trader: 0x5678...
   XHT Delta: 1000.0
   Block: 35123470

   ⏳ Waiting for 15 more blocks (~45s)...
   ✅ 15 confirmations reached

🔄 Processing fill 0x1234... on BSC...
📤 Forwarding receipt for fill 0x1234...
   📡 Submitting to SettlementHub (attempt 1/5)...
   ⏳ Transaction sent: 0xabcd...
   ✅ Transaction confirmed in block 1234567
   ✅ Receipt forwarded successfully
```

## Components

### 1. EventMonitor.js

**Responsibility:** Monitor Fill events on spoke chains

**Features:**
- Real-time event listening
- Polling fallback (more reliable)
- Finality window enforcement
- Duplicate detection

**Key Methods:**
```javascript
setupEventListener()    // WebSocket event listener
pollForEvents()         // Polling for missed events
waitForConfirmations()  // Wait for N blocks
processFill()           // Extract and forward receipt
```

### 2. ReceiptForwarder.js

**Responsibility:** Sign and forward receipts to SettlementHub

**Features:**
- Receipt signing with relayer key
- Exponential backoff retry
- Batch submission (gas optimization)
- Status tracking

**Key Methods:**
```javascript
forwardReceipt()   // Forward single receipt
signReceipt()      // Sign with relayer key
submitWithRetry()  // Retry with backoff
submitBatch()      // Batch multiple receipts
```

### 3. config.js

**Responsibility:** Configuration and validation

**Features:**
- Multi-chain setup
- Retry configuration
- Environment validation
- Default values

## Retry Logic

```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
Attempt 5: Wait 8 seconds

Max: 5 attempts, 60 second max delay
```

**Example:**
```
❌ Submission failed (attempt 1): gas too low
⏳ Retrying in 1 seconds...
❌ Submission failed (attempt 2): network error
⏳ Retrying in 2 seconds...
✅ Transaction confirmed in block 1234567
```

## Batch Processing

**When to use:**
- High volume (>10 fills/minute)
- Gas optimization (save ~30% gas)
- Network congestion

**Configuration:**
```javascript
batchSize: 10  // Max 10 receipts per batch
```

**Trade-offs:**
- ✅ Lower gas costs
- ❌ Longer confirmation time
- ❌ All-or-nothing (if one fails, all resubmit individually)

## Monitoring

### Status Endpoint

```javascript
const status = relayer.getStatus();

console.log(status);
// {
//   running: true,
//   monitors: {
//     56: {
//       name: "BSC",
//       isRunning: true,
//       lastProcessedBlock: 35123500,
//       stats: {
//         eventsDetected: 42,
//         eventsForwarded: 40,
//         eventsFailed: 2,
//         lastEventTime: "2025-01-15T12:00:00.000Z"
//       }
//     },
//     // ...
//   }
// }
```

### Key Metrics

1. **Events Detected** - Total Fill events seen
2. **Events Forwarded** - Successfully submitted to hub
3. **Events Failed** - Failed after max retries
4. **Last Event Time** - Most recent activity
5. **Pending Receipts** - Queued for batch submission

### Alerts

**Critical:**
- Event forwarding failure rate >5%
- No events detected for >1 hour
- RPC connection loss

**Warning:**
- Retry attempts >2
- Pending receipts >20
- Last event >30 minutes ago

## Error Handling

### Common Errors

**1. "No relayer private key configured"**
```bash
# Solution: Set RELAYER_PRIVATE_KEY in .env
RELAYER_PRIVATE_KEY=0x...
```

**2. "Invalid receipt signature"**
```bash
# Solution: Ensure relayer has RELAYER_ROLE on SettlementHub
await settlementHub.grantRole(RELAYER_ROLE, relayerAddress);
```

**3. "Fill already processed"**
```bash
# Not an error - receipt was already submitted
# Relayer skips duplicate
```

**4. "Insufficient confirmations"**
```bash
# Waiting for finality...
# BSC: 15 blocks (~45s)
# Polygon: 128 blocks (~4 minutes)
# Ethereum: 12 blocks (~2.5 minutes)
```

## Security

### Private Key Management

1. **Dedicated Relayer Wallet**
   - Separate from treasury
   - Only needs RELAYER_ROLE
   - Fund with minimal BNB (~$50 for gas)

2. **Key Rotation**
   - Rotate every 90 days
   - Update RELAYER_ROLE on hub
   - Monitor for unauthorized usage

3. **Monitoring**
   - Alert on unusual activity
   - Track gas spending
   - Log all submissions

### Receipt Signing

**Signature Includes:**
```solidity
keccak256(abi.encodePacked(
  fillId,
  chainId,
  trader,
  xhtDelta,
  proceeds,
  timestamp,
  nonce
))
```

**Security Features:**
- Nonce prevents replay attacks
- ChainId prevents cross-chain replays
- Signature verifies relayer authorization
- SettlementHub validates all fields

## Performance

### Expected Load

| Scenario | Daily Fills | Fills/Hour | Fills/Minute |
|----------|-------------|------------|--------------|
| Low | 50 | 2 | 0.03 |
| Medium | 500 | 21 | 0.35 |
| High | 5,000 | 208 | 3.5 |

### Resource Usage

- **CPU**: <5% (idle), <20% (high load)
- **Memory**: ~100 MB
- **Network**: ~10 MB/hour
- **Gas**: ~200K gas per receipt (~$0.10 on BSC)

### Optimization Tips

1. **Use Batch Submission** - Save 30% gas
2. **Increase Poll Interval** - Reduce RPC calls
3. **Use Dedicated RPC** - Avoid rate limits
4. **Monitor Gas Prices** - Submit during low congestion

## Testing

### Testnet Testing

```bash
# Configure testnet RPCs
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com

# Deploy test contracts
npx hardhat run scripts/deploy-crosschain-spoke.js --network bscTestnet

# Start relayer
npm start
```

### Test Flow

```bash
# 1. Execute test trade on spoke
await xaheenRouter.buyXHT(...)

# 2. Watch relayer logs
📥 New Fill event on BSC Testnet:
   Fill ID: 0x...
   Trader: 0x...

# 3. Verify on hub
await settlementHub.isFillProcessed(fillId)
// true ✅
```

## Deployment

### Production Checklist

- [ ] Relayer wallet funded with BNB (~$50)
- [ ] RELAYER_ROLE granted on SettlementHub
- [ ] All environment variables set
- [ ] RPC endpoints tested
- [ ] Monitoring dashboards configured
- [ ] Alert system active
- [ ] Backup relayer ready (failover)

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start relayer
pm2 start index.js --name xaheen-relayer

# Configure auto-restart
pm2 startup
pm2 save

# Monitor
pm2 logs xaheen-relayer
pm2 monit
```

## Troubleshooting

### Relayer Not Forwarding

**Checklist:**
1. Check RPC connections (`curl <RPC_URL>`)
2. Verify contract addresses in .env
3. Check relayer has RELAYER_ROLE
4. Ensure relayer wallet has BNB for gas
5. Check event logs for errors

### High Failure Rate

**Possible Causes:**
- RPC rate limiting → Use dedicated RPC
- Gas price too low → Increase gas price
- Network congestion → Wait or increase gas
- Contract paused → Check SettlementHub status

### Missing Events

**Possible Causes:**
- Relayer started after events → Replay from specific block
- WebSocket connection dropped → Polling will catch up
- RPC node not synced → Use different RPC

## Maintenance

### Daily Tasks
- Check relayer logs for errors
- Monitor gas spending
- Verify receipt forwarding rate

### Weekly Tasks
- Review event statistics
- Check RPC endpoint health
- Analyze failure patterns

### Monthly Tasks
- Rotate relayer keys (optional)
- Update dependencies
- Review and optimize configuration

## Support

**Issues**: https://github.com/xaheen-chain/blockchain-v2/issues
**Docs**: See `CROSS_CHAIN_DEX_ARCHITECTURE.md`

---

**Status:** ✅ Ready for Testnet
**Last Updated:** 2025-01-15

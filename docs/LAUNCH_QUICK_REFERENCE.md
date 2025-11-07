# NOR Token Ultra - Launch Quick Reference

**Status**: ✅ LIVE | **Phase**: PHASE1 | **Trading**: ENABLED
**Last Updated**: November 7, 2025

---

## 🔗 Essential Links

- **Contract**: `0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC`
- **LP Token**: `0x57a363B3a26B3187DbD6AbbC44624F556c4AE4e8`
- **Router**: `0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84`
- **Lock Contract**: `0x30ca927fA0d57C975A16c055BB0fc4fb9Fc3AB63`
- **Explorer**: https://explorer.norchain.org/address/0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC

---

## ⚡ Quick Commands

### Check Trading Status
```bash
npx hardhat run scripts/check-trading-status.js --network btcbr
```

### Monitor Recent Trades
```bash
npx hardhat run scripts/monitor-trading.js --network btcbr
```

### Advance to Next Phase
```bash
# Only after 1 hour of stable trading
npx hardhat run scripts/advance-phase.js --network btcbr
```

### Blacklist Malicious Address
```bash
# Edit scripts/blacklist-address.js to add address
npx hardhat run scripts/blacklist-address.js --network btcbr
```

### Check Lock Status
```bash
npx hardhat run scripts/verify-lock.js --network btcbr
```

### Verify All Contracts
```bash
npx hardhat run scripts/verify-all-contracts.js --network btcbr
```

---

## 📊 Current Configuration

**Phase**: PHASE1
- Max TX Buy: 210,000,000 NOR (1%)
- Max TX Sell: 210,000,000 NOR (1%)
- Max Wallet: 420,000,000 NOR (2%)

**Cooldowns**:
- Buy: 3 seconds
- Sell: 5 seconds
- Min Hold: 30 seconds

**Security**:
- ✅ Cooldown Enabled
- ✅ Max TX Enabled
- ✅ Max Wallet Enabled
- ✅ Anti-MEV Enabled
- ✅ Blacklist Enabled

**Liquidity**:
- Locked: 2,000,000 LP tokens
- Duration: 3 years
- Unlock: November 6, 2028
- Lock ID: 0

---

## 🎛️ Phase Progression

### PHASE1 (Current)
- Max TX: 1% (210M NOR)
- Max Wallet: 2% (420M NOR)
- **When to advance**: After 1 hour of stable trading

### PHASE2
- Max TX: 2% (420M NOR)
- Max Wallet: 4% (840M NOR)
- **When to advance**: After 24 hours of stable trading

### PHASE3
- Max TX: 3% (630M NOR)
- Max Wallet: 5% (1.05B NOR)
- **When to advance**: After 7 days of stable trading

### OPEN
- No TX limits
- No wallet limits
- Fully decentralized
- **When to advance**: After 30 days + community vote

---

## 🚨 Emergency Procedures

### If Bot Attack Detected

1. **Identify malicious addresses**:
```bash
npx hardhat run scripts/detect-bots.js --network btcbr
```

2. **Blacklist addresses**:
```javascript
// Edit scripts/blacklist-address.js
const ADDRESSES_TO_BLACKLIST = [
  "0x...",  // Bot address 1
  "0x...",  // Bot address 2
];

// Run
npx hardhat run scripts/blacklist-address.js --network btcbr
```

3. **Announce publicly**:
```
⚠️ Bot Activity Detected

We've identified and blacklisted X malicious addresses attempting to manipulate the market.

✅ Blacklisted: [addresses]
✅ Protection: Active
✅ Trading: Continues normally for legitimate users

Our 7-layer security is working as designed. 🛡️
```

### If Emergency Pause Needed

⚠️ **USE ONLY IN EXTREME CASES** (critical exploit discovered)

```bash
npx hardhat run scripts/emergency-pause.js --network btcbr
```

**After pausing**:
1. Announce immediately on all channels
2. Investigate the issue
3. Prepare fix or mitigation
4. Unpause when safe

---

## 📢 Announcement Templates

### Hourly Update (First 24h)
```
📊 NOR Token - Hour X Update

✅ Trading Volume: $XXX
✅ Holders: XXX
✅ Price: $X.XX (+XX%)
✅ Bots Blacklisted: X
✅ Security: All systems operational

Phase advancement coming soon! 🚀
#NorChain
```

### Phase Advancement
```
🎛️ NOR Token - Advancing to PHASEXX!

We're increasing limits to allow more trading freedom:

BEFORE:
- Max TX: X%
- Max Wallet: X%

AFTER:
- Max TX: X%
- Max Wallet: X%

Security protections remain active. 🛡️
Trade responsibly! 🚀
```

### Weekly Progress
```
📈 NOR Token - Week X Summary

✅ Total Volume: $XXX
✅ Total Holders: XXX
✅ ATH: $X.XX
✅ Liquidity: Still locked (X years remaining)
✅ Phase: PHASEXX

Next milestone: [goal]
Join us! 🚀
```

---

## 🔍 Troubleshooting

### "Trading not enabled" error
- Check: `await norToken.tradingEnabled()` returns `true`
- If false: Trading was disabled (should not happen post-launch)

### "Transfer amount exceeds max" error
- User trying to buy/sell more than phase limit
- Solution: Split into smaller transactions

### "Cooldown period active" error
- User buying/selling too quickly
- Solution: Wait for cooldown period to expire

### "Recipient is blacklisted" error
- Address is on blacklist
- Reason: Likely bot or malicious actor
- Action: If legitimate user, investigate and potentially unblacklist

### Gas estimation failed
- May be hitting a revert condition
- Check: Phase limits, cooldowns, blacklist
- Use: `--gas-limit 500000` to force execution

---

## 📊 Analytics & Monitoring

### Key Metrics to Track

**Daily**:
- Trading volume
- Unique buyers/sellers
- Holder count growth
- Price action
- Bot detections

**Weekly**:
- Total volume
- Average transaction size
- Holder distribution
- Social media engagement
- Community sentiment

**Monthly**:
- CEX listing progress
- Partnerships
- Development milestones
- Governance proposals
- Scanner score improvements

---

## 🌐 DEX Aggregator Submissions

### DexTools
1. Visit: https://www.dextools.io/app/submit
2. Fill in:
   - Contract: `0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC`
   - Network: NorChain (65001)
   - DEX: NorSwap
   - Pair: `0x57a363B3a26B3187DbD6AbbC44624F556c4AE4e8`
3. Wait: 10-30 min for indexing

### DexScreener
1. Visit: https://dexscreener.com/submit
2. Paste contract address
3. Wait: 1-2 hours for full data

### CoinMarketCap
1. Visit: https://coinmarketcap.com/request/
2. Requirements:
   - 2,000+ holders
   - $100k+ market cap
   - Active community
   - Verified contract
3. Wait: 7-14 days for review

### CoinGecko
1. Visit: https://www.coingecko.com/en/coins/new
2. Requirements:
   - Listed on DEX aggregator
   - Active trading
   - Community presence
3. Wait: 7-30 days for review

---

## 🎯 90-Day Renouncement Timeline

**Day 0 (Today)**: Launch with owner protection
**Days 1-30**: Active bot monitoring and blacklisting
**Days 31-60**: Reduced intervention, focus on growth
**Days 61-89**: Prepare for renouncement, transparency reports
**Day 90**: Renounce ownership → Perfect scanner scores

**Command to renounce** (Day 90 only):
```bash
npx hardhat run scripts/renounce-ownership.js --network btcbr
```

⚠️ **CRITICAL**: Renouncement is PERMANENT and IRREVERSIBLE!

---

## 📞 Support Channels

**Documentation**: `/docs/NORCHAIN_LAUNCH_SUCCESS.md`
**Community**: [Discord/Telegram link]
**Updates**: [Twitter/X handle]
**Issues**: https://github.com/[repo]/issues

---

**Last Updated**: November 7, 2025
**Version**: 1.0
**Status**: PRODUCTION - LIVE TRADING

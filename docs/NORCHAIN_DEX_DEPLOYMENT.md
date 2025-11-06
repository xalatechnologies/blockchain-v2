# NorChain DEX Deployment Guide

**Network**: NorChain (Xaheen) Layer-1
**Chain ID**: 65001
**RPC**: https://rpc.xaheen.org
**Purpose**: Native DEX for fast, cheap NOR trading

---

## 📊 Current Status

**BSC (PancakeSwap)**:
- ✅ NOR/BNB: $19 liquidity
- ✅ NOR/USDT: $40 liquidity
- ✅ NOR/ETH: $21 liquidity
- ✅ Total: $80 liquidity

**NorChain (NorSwap)**:
- ❌ DEX not deployed yet
- ⏳ Ready to deploy now

---

## 🎯 Why Deploy DEX on NorChain?

### Benefits:
1. **Ultra-low gas fees** (~$0.0001 per swap vs $0.10-0.50 on BSC)
2. **Instant finality** (3-second blocks)
3. **Native NOR trading** (no bridging needed)
4. **Two-market strategy**:
   - **BSC**: Main market with USD liquidity
   - **NorChain**: Fast trading, low fees, native ecosystem

### Use Cases:
- **Traders**: Fast, cheap swaps without BSC fees
- **Arbitrage bots**: Profit from price differences between chains
- **DApp integration**: Native swaps for NorChain dApps
- **Future ecosystem**: Foundation for NOR staking, farms, etc.

---

## 🚀 DEPLOYMENT PLAN

### Phase 1: Deploy DEX Contracts (10-15 min)

**Contracts to deploy:**
1. **WNOR** (Wrapped NOR) - For liquidity pairs
2. **NorDEXFactory** - Creates trading pairs
3. **NorDEXRouter** - Handles swaps and liquidity

**Requirements:**
- ✅ Need 1,000 NOR for deployment gas (~$6 at $0.006/NOR)
- ✅ Scripts ready
- ✅ Contracts compiled

**Command:**
```bash
node scripts/deploy-xaheen-dex.js
```

---

### Phase 2: Deploy/Bridge Tokens (5-10 min)

**Initial pairs to create:**
1. **NOR/BTCBR** - Primary pair (BTCBR already on NorChain)
2. **NOR/USDT** - Stablecoin pair (need to bridge USDT)
3. **NOR/BNB** - Cross-chain pair (need to bridge BNB)

**Option A: Use existing BTCBR** (FASTEST)
- BTCBR already deployed: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
- Deploy NOR/BTCBR pair only

**Option B: Bridge tokens from BSC**
- Bridge USDT and BNB from BSC to NorChain
- Create multiple pairs

---

### Phase 3: Add Initial Liquidity (5 min)

**Recommended amounts:**
- **NOR/BTCBR**: 10,000 NOR + 10,000 BTCBR (~$60 value)

**Command:**
```bash
node scripts/add-xaheen-dex-liquidity.js
```

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Check Prerequisites

```bash
# Check NOR balance on NorChain
node -e "
const { ethers } = require('hardhat');
const provider = new ethers.JsonRpcProvider('https://rpc.xaheen.org');
const wallet = '0xdD779a290C937144F80Eb75b75d814c834536B1b';
provider.getBalance(wallet).then(b => console.log('NOR:', ethers.formatEther(b)));
"
```

**Minimum needed**: 11,000 NOR
- 1,000 NOR for deployment gas
- 10,000 NOR for initial liquidity

---

### Step 2: Deploy DEX Contracts

```bash
# Deploy WNOR + Factory + Router
node scripts/deploy-xaheen-dex.js
```

**Expected output:**
```
✅ WNOR deployed: 0x...
✅ Factory deployed: 0x...
✅ Router deployed: 0x...
```

**Deployment saved to**: `docs/deployment-logs/xaheen-dex-deployment.json`

---

### Step 3: Add Liquidity

```bash
# Add NOR/BTCBR liquidity
node scripts/add-xaheen-dex-liquidity.js
```

**Expected output:**
```
✅ Liquidity added!
📊 FINAL PAIR RESERVES:
  NOR: 10,000 NOR
  BTCBR: 10,000 BTCBR
```

---

### Step 4: Verify Deployment

Check contracts on explorer:
- WNOR: https://explorer.xaheen.org/address/0x...
- Factory: https://explorer.xaheen.org/address/0x...
- Router: https://explorer.xaheen.org/address/0x...

---

## 💧 Liquidity Strategy

### Initial Liquidity (Phase 1)

**NOR/BTCBR Pair:**
- Amount: 10,000 NOR + 10,000 BTCBR
- Value: ~$60 (at $0.006/NOR)
- Purpose: Test functionality, enable trading

**Why start small?**
- Test DEX functionality
- Verify router/factory working
- No risk of large funds if issues found

---

### Growth Liquidity (Phase 2 - After 1 week)

Once DEX proven stable:

**Increase NOR/BTCBR:**
- Add 100,000 NOR + 100,000 BTCBR (~$600)
- Result: Lower slippage, larger trades possible

**Add USDT Pair:**
- Bridge 200 USDT from BSC
- Add 30,000 NOR + 200 USDT
- Result: Direct USD value trades

---

### Production Liquidity (Phase 3 - After 1 month)

**Target liquidity:**
- NOR/BTCBR: $5,000
- NOR/USDT: $3,000
- NOR/BNB: $2,000
- **Total**: $10,000 on NorChain

**Combined with BSC**:
- BSC liquidity: $80 → $5,000 (grow gradually)
- NorChain liquidity: $0 → $10,000
- **Total ecosystem**: $15,000 liquidity

---

## 🔄 Cross-Chain Arbitrage

With DEX on both chains:

**Arbitrage opportunity example:**
```
BSC Price:      $0.0065/NOR
NorChain Price: $0.0060/NOR
Spread:         8.3% profit opportunity
```

**How bots will balance:**
1. Buy NOR cheap on NorChain ($0.0060)
2. Bridge to BSC via NOR Bridge
3. Sell on PancakeSwap ($0.0065)
4. Profit: 8.3% minus bridge fees (0.1%) = 8.2% profit

**Result**: Prices naturally balance across chains

---

## 🎯 Benefits of Two-DEX Strategy

| Feature | BSC (PancakeSwap) | NorChain (NorSwap) |
|---------|-------------------|---------------------|
| **Liquidity** | High (start with $80) | Low (start with $60) |
| **Gas Fees** | $0.10-0.50 per swap | $0.0001 per swap ✅ |
| **Speed** | 3 seconds | 3 seconds |
| **Users** | 10M BSC users | NorChain ecosystem |
| **USD Value** | Direct USDT/BNB pairs | Requires bridge for USD |
| **Purpose** | Main market, cash out | Fast trading, low fees |

**Strategy**:
- BSC = Main liquidity (grow to $5k+)
- NorChain = Fast trades (grow to $10k+)

---

## ⚠️ Important Notes

### Gas Requirements
- Deployment: ~1,000 NOR (~$6)
- Liquidity: 10,000 NOR (~$60)
- Total needed: 11,000 NOR (~$66)

### SSL Certificate Issue
If you see "self-signed certificate" error:
```bash
# Option 1: Set environment variable
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Option 2: Use HTTP instead of HTTPS (if available)
# Change RPC to: http://rpc.xaheen.org
```

### Bootstrap Liquidity
First liquidity provider gets ALL LP tokens. Consider:
- Lock LP tokens for 6-12 months (trust signal)
- Or keep them to manage liquidity
- Display LP lock on website for transparency

---

## 📈 Expected Results

### Week 1
- DEX deployed and functional ✓
- 1-5 daily trades (testing phase)
- $60 liquidity stable

### Month 1
- 10-50 daily trades
- Arbitrage bots active
- Grow liquidity to $500-1,000

### Month 3
- 100-500 daily trades
- Multiple pairs active
- $10,000+ liquidity on NorChain
- $5,000+ liquidity on BSC

---

## 🚀 DEPLOY NOW?

**Command to start:**
```bash
node scripts/deploy-xaheen-dex.js
```

**What happens:**
1. Deploys WNOR, Factory, Router (2-3 min)
2. Saves addresses to deployment-logs (automatic)
3. Shows next steps for adding liquidity

**After deployment:**
```bash
node scripts/add-xaheen-dex-liquidity.js
```

**What happens:**
1. Creates NOR/BTCBR pair
2. Adds 10,000 NOR + 10,000 BTCBR liquidity
3. DEX is live and tradeable!

---

## ✅ CHECKLIST

Before deployment:
- [ ] Have 11,000 NOR on NorChain (1k gas + 10k liquidity)
- [ ] Have 10,000 BTCBR on NorChain
- [ ] RPC accessible: https://rpc.xaheen.org
- [ ] Private key in .env: MAIN_WALLET_PRIVATE_KEY

After deployment:
- [ ] Verify contracts on explorer
- [ ] Test swap functionality
- [ ] Create swap interface (or wait for community)
- [ ] Announce DEX live on socials
- [ ] Monitor for arbitrage activity

---

**Ready to deploy? Run the scripts above!** 🚀

**Estimated time**: 20 minutes total (deploy + liquidity)
**Cost**: ~$66 (11,000 NOR)
**Result**: Live DEX on NorChain with $60 liquidity

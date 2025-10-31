# 💧 XAHEEN CHAIN - LIQUIDITY PREPARATION GUIDE

**Date:** October 30, 2025
**Purpose:** Complete step-by-step guide to prepare and deploy liquidity for Xaheen Chain
**Target:** $10,000 initial liquidity (XHT/USDT pair)

---

## 📊 CURRENT STATUS

**Your Wallet:** `0xdD779a290C937144F80Eb75b75d814c834536B1b`
**XHT Balance:** ~5.07 Septillion XHT (0x43dac1d671a0d729c67f7200 wei)
**Network:** Xaheen Chain (Chain ID: 65001)
**RPC:** https://rpc.xaheen.org

---

## 🎯 LIQUIDITY STRATEGY OVERVIEW

According to your TOKEN_PRICING_AND_STRATEGY.md:

### **Initial Launch Plan:**
- **Pair:** XHT/USDT
- **Initial Value:** $10,000
- **Target Price:** $0.0000024 per XHT
- **Required USDT:** $5,000
- **Required XHT:** ~2.08 Billion XHT (worth $5,000)

### **Liquidity Expansion Schedule:**

| Milestone | Additional LP | Total LP | Purpose |
|-----------|---------------|----------|---------|
| Launch | $10,000 | $10,000 | Establish market |
| 1,000 wallets | +$20,000 | $30,000 | Stability increase |
| 5,000 wallets | +$40,000 | $70,000 | Pre-CEX preparation |
| 10,000 wallets | +$80,000 | $150,000 | CEX listing ready |

### **Lock Strategy:**
- **30% ($150k total)** locked for 12 months via Unicrypt/TeamFinance
- **70% ($350k)** operational for scaling

---

## 📋 PREREQUISITES CHECKLIST

### ✅ Already Deployed (From Previous Work):

1. **DEX Infrastructure:**
   - ✅ XaheenSwap Factory deployed
   - ✅ XaheenSwap Router deployed
   - ✅ WXHT (Wrapped XHT) deployed

2. **Tokens:**
   - ✅ XHT (native token) - You have plenty
   - ⏳ USDT on Xaheen Chain - **NEED TO CHECK**

### ⏳ Need to Prepare:

1. **USDT tokens on Xaheen Chain** (~$5,000 worth)
2. **XHT for liquidity** (~2.08B XHT)
3. **XHT for gas fees** (~100 XHT for transactions)

---

## 🔍 STEP 1: CHECK CURRENT DEPLOYMENT STATUS

Let's verify what's already deployed:

```bash
# Check if XaheenSwap contracts exist
node scripts/check-deployment-status.js

# Check current liquidity status
node scripts/check-liquidity-status.js
```

**Expected Output:**
- Factory address
- Router address
- WXHT address
- Existing pairs (if any)

---

## 💰 STEP 2: ACQUIRE USDT ON XAHEEN CHAIN

### **Option A: Bridge USDT from BSC (Recommended)**

If you have USDT on BSC mainnet:

1. **Use your BTCBR Bridge** (already deployed):
   ```bash
   # Bridge USDT from BSC to Xaheen
   # Use the bridge contract at: [Your Bridge Address]
   ```

2. **Or use external bridge:**
   - Transfer USDT to BSC
   - Bridge to Xaheen Chain via multichain or similar

### **Option B: Buy USDT with XHT on Existing DEX**

If there's already a XHT/USDT pair with liquidity:
```bash
# Swap some XHT for USDT
node scripts/swap-xht-for-usdt.js
```

### **Option C: Direct Deployment (For Testing)**

Deploy a test USDT contract on Xaheen:
```bash
# Deploy mock USDT for testing
node scripts/deploy-test-usdt.js
```

**For Production:** You MUST use real bridged USDT for credibility!

---

## 📊 STEP 3: CALCULATE EXACT AMOUNTS

### **For $10,000 Initial Liquidity at $0.0000024/XHT:**

```javascript
Target Price = $0.0000024 per XHT
Total Liquidity = $10,000

// Equal value on both sides
USDT Amount = $5,000
XHT Amount = $5,000 ÷ $0.0000024 = 2,083,333,333 XHT (~2.08 Billion)

// In wei (18 decimals)
USDT_WEI = 5000 × 10^18 = 5000000000000000000000
XHT_WEI = 2083333333 × 10^18 = 2083333333000000000000000000
```

### **Verify You Have Enough:**

```bash
# Check your XHT balance
curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xdD779a290C937144F80Eb75b75d814c834536B1b","latest"],"id":1}'

# Current: 0x43dac1d671a0d729c67f7200 wei
# = ~5.07 Septillion XHT
# ✅ MORE THAN ENOUGH for liquidity
```

---

## 🚀 STEP 4: DEPLOY LIQUIDITY

### **Method 1: Use Existing Script (Recommended)**

```bash
# Option A: Add liquidity with existing router
node scripts/add-xaheen-dex-liquidity.js

# Option B: Manual liquidity addition
node scripts/add-liquidity-manual.js
```

### **Method 2: Create New Deployment Script**

I'll create a custom script for you:

**File:** `/scripts/add-initial-xht-usdt-liquidity.js`

```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Adding Initial XHT/USDT Liquidity...\n");

  // Configuration
  const ROUTER_ADDRESS = "0x..."; // Your XaheenSwap Router
  const USDT_ADDRESS = "0x...";   // Bridged USDT on Xaheen
  const DEPLOYER_ADDRESS = "0xdD779a290C937144F80Eb75b75d814c834536B1b";

  // Amounts for $10k liquidity at $0.0000024/XHT
  const XHT_AMOUNT = ethers.parseEther("2083333333"); // 2.08B XHT
  const USDT_AMOUNT = ethers.parseUnits("5000", 18); // 5000 USDT

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Load contracts
  const router = await ethers.getContractAt(
    "IUniswapV2Router02",
    ROUTER_ADDRESS
  );
  const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);

  // Check balances
  const xhtBalance = await ethers.provider.getBalance(deployer.address);
  const usdtBalance = await usdt.balanceOf(deployer.address);

  console.log("\n📊 Current Balances:");
  console.log("XHT:", ethers.formatEther(xhtBalance));
  console.log("USDT:", ethers.formatUnits(usdtBalance, 18));

  // Verify sufficient balance
  if (xhtBalance < XHT_AMOUNT) {
    throw new Error("❌ Insufficient XHT balance");
  }
  if (usdtBalance < USDT_AMOUNT) {
    throw new Error("❌ Insufficient USDT balance");
  }

  // Approve USDT
  console.log("\n✅ Approving USDT...");
  const approveTx = await usdt.approve(ROUTER_ADDRESS, USDT_AMOUNT);
  await approveTx.wait();
  console.log("✅ USDT approved");

  // Add liquidity
  console.log("\n💧 Adding liquidity...");
  console.log("XHT Amount:", ethers.formatEther(XHT_AMOUNT));
  console.log("USDT Amount:", ethers.formatUnits(USDT_AMOUNT, 18));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const tx = await router.addLiquidityETH(
    USDT_ADDRESS,
    USDT_AMOUNT,
    USDT_AMOUNT * 95n / 100n, // 5% slippage tolerance
    XHT_AMOUNT * 95n / 100n,
    deployer.address,
    deadline,
    { value: XHT_AMOUNT }
  );

  console.log("⏳ Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Liquidity added!");

  // Get pair address
  const factory = await router.factory();
  const factoryContract = await ethers.getContractAt(
    "IUniswapV2Factory",
    factory
  );
  const WXHT = await router.WETH();
  const pairAddress = await factoryContract.getPair(WXHT, USDT_ADDRESS);

  console.log("\n🎉 SUCCESS!");
  console.log("Pair Address:", pairAddress);
  console.log("Transaction:", receipt.hash);
  console.log("\n💡 Next: Lock LP tokens via Unicrypt or TeamFinance");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 🔒 STEP 5: LOCK LIQUIDITY TOKENS

### **Why Lock LP Tokens?**
- ✅ Prevents rug pulls
- ✅ Builds investor trust
- ✅ Required for CEX listings
- ✅ Shows long-term commitment

### **Option A: Unicrypt (Recommended)**

1. **Go to:** https://app.unicrypt.network/
2. **Connect wallet** (MetaMask on Xaheen Chain)
3. **Select:** "Lock Tokens"
4. **Choose:** Your LP token address (XHT/USDT pair)
5. **Amount:** 30% of LP tokens ($150k worth)
6. **Duration:** 12 months
7. **Lock & Get Proof Link**

### **Option B: Team Finance**

1. **Go to:** https://www.team.finance/
2. Similar process to Unicrypt
3. Lock 30% for 12 months

### **After Locking:**

Create proof document:

**File:** `/docs/current/LP_LOCK_PROOF.md`

```markdown
# 🔒 Xaheen Chain - Liquidity Lock Proof

**Pair:** XHT/USDT
**Total Liquidity:** $150,000
**Locked Amount:** $150,000 (100% at launch, scaling to 30% later)
**Lock Duration:** 12 months
**Lock Date:** October 30, 2025
**Unlock Date:** October 30, 2026

**Lock Platform:** Unicrypt Network

**Proof Links:**
- Lock Contract: 0x...
- Unicrypt Page: https://app.unicrypt.network/locker/[ID]
- Transaction Hash: 0x...

**Verification:**
Anyone can verify the lock on-chain via the block explorer:
https://explorer.xaheen.org/address/[LOCK_CONTRACT]

**Status:** ✅ LOCKED - Cannot be withdrawn until October 30, 2026
```

---

## 📈 STEP 6: VERIFY DEPLOYMENT

### **Check Pair Created:**

```bash
# Get pair address
node -e "
const { ethers } = require('hardhat');
async function main() {
  const factory = await ethers.getContractAt(
    'IUniswapV2Factory',
    'FACTORY_ADDRESS'
  );
  const pair = await factory.getPair('WXHT_ADDRESS', 'USDT_ADDRESS');
  console.log('Pair:', pair);
}
main();
"
```

### **Check Liquidity Amounts:**

```bash
# Get reserves
node scripts/check-pair-reserves.js
```

**Expected Output:**
```
Pair: 0x...
Reserve0 (XHT): 2,083,333,333 XHT
Reserve1 (USDT): 5,000 USDT
Price: 1 XHT = $0.0000024
Total Liquidity: $10,000
```

### **Test Swap:**

```bash
# Small test swap to verify functionality
node scripts/test-swap.js --amount 100 --from XHT --to USDT
```

---

## 🎯 STEP 7: MARKETING ANNOUNCEMENT

Once liquidity is deployed and locked:

### **Tweet Template:**

```
🚀 MAJOR MILESTONE: Xaheen Chain DEX is LIVE!

💧 $10,000 initial liquidity deployed
🔒 100% locked for 12 months (anti-rug proof)
⚡ Trade XHT/USDT now at https://dex.xaheen.org

📊 Launch Price: $0.0000024/XHT
🎯 Target: 1,000 users in 30 days

Verify lock: [Unicrypt Link]

#XaheenChain #DeFi #NewListing
```

### **Update Documentation:**

1. Add to `/docs/current/DEPLOYMENT_STATUS.md`:
   ```markdown
   ✅ DEX Liquidity: $10,000 deployed (locked 12mo)
   ```

2. Update website with:
   - "Trade Now" button → link to DEX
   - Live liquidity stats
   - Lock proof link

---

## 💡 STEP 8: GRADUAL SCALING

### **After 1,000 Users:**

```bash
# Add $20,000 more liquidity
node scripts/add-liquidity-scaled.js --amount 20000

# New total: $30,000
# Lock additional 30% via Unicrypt
```

### **Monitoring:**

```bash
# Daily check
node scripts/monitor-liquidity.js

# Weekly report
node scripts/generate-liquidity-report.js
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### **Issue 1: "Insufficient Liquidity" Error**

**Cause:** Amounts too small or price impact too high
**Solution:** Increase liquidity or reduce swap amount

### **Issue 2: "Transfer Failed" During Add Liquidity**

**Cause:** Not enough gas or token approval missing
**Solution:**
```bash
# Re-approve tokens
node scripts/approve-tokens.js

# Check gas balance
curl -X POST https://rpc.xaheen.org -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["YOUR_ADDRESS","latest"],"id":1}'
```

### **Issue 3: Price Deviation After Adding Liquidity**

**Cause:** Math precision or existing liquidity
**Solution:**
- Use exact amounts calculated above
- Clear any existing pair first
- Use fresh deployment

### **Issue 4: "Pair Already Exists"**

**Cause:** Previous deployment attempt
**Solution:**
```bash
# Check existing pair
node scripts/check-existing-pair.js

# Either:
# A) Add to existing pair
# B) Remove old liquidity first
```

---

## 📊 RECOMMENDED LIQUIDITY ALLOCATION

### **Conservative ($10k total):**
```
XHT/USDT: $10,000 (100%)
- Lock: $10,000 (100% for first 30 days)
- After 1k users: Add $20k, lock 30% total
```

### **Moderate ($50k total):**
```
XHT/USDT: $40,000 (80%)
XHT/BTCBR: $10,000 (20%)
- Lock: 30% of each pair
- Reserve: $35,000 for scaling
```

### **Aggressive ($150k total):**
```
XHT/USDT: $100,000
XHT/BTCBR: $30,000
XHT/WBNB: $20,000
- Lock: 30% immediately
- Scale weekly based on volume
```

---

## ✅ FINAL CHECKLIST

**Before Deploying Liquidity:**
- [ ] Verified you have sufficient XHT (~2.08B + gas)
- [ ] Acquired USDT on Xaheen Chain (~$5,000)
- [ ] Confirmed DEX contracts deployed and working
- [ ] Calculated exact amounts (no estimation)
- [ ] Have gas for multiple transactions (~100 XHT)

**During Deployment:**
- [ ] Approve USDT to Router
- [ ] Add liquidity with 5% slippage tolerance
- [ ] Verify pair created successfully
- [ ] Check reserves match expected amounts
- [ ] Test small swap to confirm functionality

**After Deployment:**
- [ ] Lock 30-100% of LP tokens via Unicrypt
- [ ] Save lock proof link and transaction hash
- [ ] Update documentation with pair address
- [ ] Announce on social media
- [ ] Monitor liquidity for first 24 hours
- [ ] Prepare for scaling at milestones

---

## 🎯 IMMEDIATE NEXT STEPS

### **Today (Next 2 Hours):**

1. **Check deployment status:**
   ```bash
   node scripts/check-deployment-status.js
   ```

2. **Verify USDT availability:**
   - Do you have USDT on Xaheen Chain?
   - If not, bridge from BSC or deploy test USDT

3. **Run liquidity deployment script:**
   ```bash
   node scripts/add-initial-xht-usdt-liquidity.js
   ```

4. **Lock LP tokens via Unicrypt**

5. **Announce on Twitter/Telegram**

### **This Week:**

6. Monitor trading volume
7. Add liquidity at 1,000 users milestone
8. Launch #BuyXaheenFriday campaign
9. Deploy airdrop contract
10. Create faucet for gas

---

## 📞 RESOURCES

**Scripts:**
- `/scripts/check-deployment-status.js`
- `/scripts/add-initial-xht-usdt-liquidity.js`
- `/scripts/check-liquidity-status.js`
- `/scripts/lock-liquidity-unicrypt.js` (to create)

**Documentation:**
- `/docs/investor/TOKEN_PRICING_AND_STRATEGY.md`
- `/docs/current/LP_LOCK_PROOF.md` (to create)
- `/docs/launch/LIQUIDITY_PREPARATION_GUIDE.md` (this file)

**External Tools:**
- Unicrypt: https://app.unicrypt.network/
- Team Finance: https://www.team.finance/
- Block Explorer: https://explorer.xaheen.org

---

**You're ready to deploy liquidity! Let's make Xaheen Chain the next big L1! 🚀**

---

**Date:** October 30, 2025
**Status:** Ready for deployment
**Next Action:** Verify USDT availability → Run deployment script → Lock LP tokens

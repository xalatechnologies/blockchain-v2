# Nor Chain DEX Liquidity Implementation Guide

**Date:** November 2, 2025
**Status:** Ready for Implementation
**Total Initial Liquidity:** $800,000 (locked for 12+ months)

---

## 🎯 Implementation Goals

Based on Nor Chain Playbook v3 (Part 5 & 6):

1. **Launch NorSwap DEX** with $800k initial liquidity
2. **Lock LP tokens** for trust and security (prevent rug pulls)
3. **Establish initial pricing** for NOR and stable assets
4. **Create trading pairs** for ecosystem tokens
5. **Enable public trading** with proper price discovery

---

## 📊 Liquidity Allocation Plan

### Total Budget: $800,000 USD Equivalent

| Pair | Liquidity | % of Total | Initial NOR Price | LP Tokens Lock |
|------|-----------|------------|-------------------|----------------|
| **NOR/USDT** | $400,000 | 50% | $0.01 | 12 months |
| **NOR/Dirhamat** | $200,000 | 25% | $0.01 | 12 months |
| **Dirhamat/USDT** | $150,000 | 18.75% | 1 DIRHAMAT = 1 AED = ~$0.27 | 12 months |
| **Reserve** | $50,000 | 6.25% | TBD | Flexible |

**Total:** $800,000

### Liquidity Distribution Breakdown

**1. NOR/USDT Pair** ($400,000 total liquidity)
```
Target Price: 1 NOR = $0.01 USD
NOR Side: 20,000,000 NOR ($200,000 equivalent)
USDT Side: $200,000 USDT
Constant Product (k): 20M NOR × $200k = 4 trillion
```

**2. NOR/Dirhamat Pair** ($200,000 total liquidity)
```
Target Prices:
- 1 NOR = $0.01 USD
- 1 DIRHAMAT = $0.27 USD (1 AED equivalent)
- 1 NOR = 0.037 DIRHAMAT (or ~27 NOR = 1 DIRHAMAT)

NOR Side: 10,000,000 NOR ($100,000 equivalent)
DIRHAMAT Side: 370,370 DIRHAMAT ($100,000 equivalent @ $0.27/DIRHAMAT)
Constant Product (k): 10M NOR × 370,370 DIRHAMAT = 3.7 trillion
```

**3. Dirhamat/USDT Pair** ($150,000 total liquidity)
```
Target Price: 1 DIRHAMAT = $0.27 USD (1 AED)
DIRHAMAT Side: 277,778 DIRHAMAT ($75,000 equivalent)
USDT Side: $75,000 USDT
Constant Product (k): 277,778 × $75k = 20.8 billion
```

---

## 🏗️ Implementation Steps

### Phase 1: Preparation (Contracts & Tokens)

**Status:** ✅ Mostly Complete

**1.1 Deployed Contracts:**
- ✅ NOR Token: `0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c`
- ✅ NorSwapFactory: `0xbbb1ec421b156f0442D435A875E5267B8A2FDc39`
- ✅ Dirhamat: `0x7857D6a475498e535969121f1B7B96151E422813`
- ✅ LiquidityLock: ⏳ Ready to deploy

**1.2 Required Tokens (Need to Deploy):**
- ⏳ WUSDT: Wrapped USDT (18 decimals, bridge-ready, can mint for initial liquidity)
- ⏳ Router: NorSwapRouter (if not deployed)
- ⏳ WNOR: Wrapped NOR (for native token trading, 18 decimals)

**1.3 Compile LiquidityLock:**
```bash
npx hardhat compile
```

### Phase 2: Deploy Missing Infrastructure

**2.1 Deploy NorSwapRouter** (if not exists)
```bash
npx hardhat run scripts/deploy-norswap-router.js --network btcbr
```

**2.2 Deploy WNOR** (Wrapped NOR)
```bash
npx hardhat run scripts/deploy-wnor.js --network btcbr
```

**2.3 Deploy WUSDT** (Wrapped USDT - Bridge-Ready)
```bash
# WUSDT is bridge-compatible and will be deployed automatically
# In deploy-dex-infrastructure.js script
# For production: Bridge real USDT from BSC → WUSDT on Nor Chain
```

**2.4 Deploy LiquidityLock Contract**
```bash
npx hardhat run scripts/deploy-liquidity-lock.js --network btcbr
```

### Phase 3: Create Trading Pairs

**3.1 Create Pairs via Factory:**
```javascript
// Using NorSwapFactory
const factory = await ethers.getContractAt("NorSwapFactory", FACTORY_ADDRESS);

// Create NOR/USDT pair
await factory.createPair(NOR_ADDRESS, USDT_ADDRESS);
const norUsdtPair = await factory.getPair(NOR_ADDRESS, USDT_ADDRESS);

// Create NOR/Dirhamat pair
await factory.createPair(NOR_ADDRESS, DIRHAMAT_ADDRESS);
const norDirhamatPair = await factory.getPair(NOR_ADDRESS, DIRHAMAT_ADDRESS);

// Create Dirhamat/USDT pair
await factory.createPair(DIRHAMAT_ADDRESS, USDT_ADDRESS);
const dirhamatUsdtPair = await factory.getPair(DIRHAMAT_ADDRESS, USDT_ADDRESS);
```

### Phase 4: Add Initial Liquidity

**4.1 Approve Tokens for Router:**
```javascript
const router = await ethers.getContractAt("NorSwapRouter", ROUTER_ADDRESS);

// Approve NOR
await norToken.approve(router.address, ethers.parseEther("30000000"));

// Approve WUSDT
await wusdtToken.approve(router.address, ethers.parseEther("275000")); // WUSDT is 18 decimals

// Approve Dirhamat
await dirhamat.approve(router.address, ethers.parseEther("648148"));
```

**4.2 Add Liquidity via Router:**

**NOR/USDT Pair** ($400k):
```javascript
await router.addLiquidity(
  NOR_ADDRESS,                                    // tokenA
  WUSDT_ADDRESS,                                  // tokenB
  ethers.parseEther("20000000"),                  // 20M NOR (24 decimals)
  ethers.parseEther("200000"),                    // $200k WUSDT (18 decimals)
  ethers.parseEther("19900000"),                  // amountAMin (0.5% slippage)
  ethers.parseEther("199000"),                    // amountBMin (0.5% slippage)
  deployer.address,                               // LP tokens to deployer
  Math.floor(Date.now() / 1000) + 3600            // deadline (1 hour)
);
```

**NOR/Dirhamat Pair** ($200k):
```javascript
await router.addLiquidity(
  NOR_ADDRESS,
  DIRHAMAT_ADDRESS,
  ethers.parseEther("10000000"),                  // 10M NOR
  ethers.parseEther("370370"),                    // 370,370 DIRHAMAT
  ethers.parseEther("9950000"),                   // amountAMin (0.5% slippage)
  ethers.parseEther("368868"),                    // amountBMin (0.5% slippage)
  deployer.address,
  Math.floor(Date.now() / 1000) + 3600
);
```

**Dirhamat/WUSDT Pair** ($150k):
```javascript
await router.addLiquidity(
  DIRHAMAT_ADDRESS,
  WUSDT_ADDRESS,
  ethers.parseEther("277778"),                    // 277,778 DIRHAMAT
  ethers.parseEther("75000"),                     // $75k WUSDT (18 decimals)
  ethers.parseEther("276389"),                    // amountAMin (0.5% slippage)
  ethers.parseEther("74625"),                     // amountBMin (0.5% slippage)
  deployer.address,
  Math.floor(Date.now() / 1000) + 3600
);
```

### Phase 5: Lock LP Tokens

**5.1 Get LP Token Balances:**
```javascript
const norUsdtPair = await ethers.getContractAt("NorSwapPair", NOR_USDT_PAIR_ADDRESS);
const lpBalance1 = await norUsdtPair.balanceOf(deployer.address);

const norDirhamatPair = await ethers.getContractAt("NorSwapPair", NOR_DIRHAMAT_PAIR_ADDRESS);
const lpBalance2 = await norDirhamatPair.balanceOf(deployer.address);

const dirhamatUsdtPair = await ethers.getContractAt("NorSwapPair", DIRHAMAT_USDT_PAIR_ADDRESS);
const lpBalance3 = await dirhamatUsdtPair.balanceOf(deployer.address);
```

**5.2 Approve LP Tokens for LiquidityLock:**
```javascript
const liquidityLock = await ethers.getContractAt("LiquidityLock", LIQUIDITY_LOCK_ADDRESS);

await norUsdtPair.approve(liquidityLock.address, lpBalance1);
await norDirhamatPair.approve(liquidityLock.address, lpBalance2);
await dirhamatUsdtPair.approve(liquidityLock.address, lpBalance3);
```

**5.3 Lock LP Tokens (12 months):**
```javascript
const lockDuration = 365 * 24 * 60 * 60; // 12 months in seconds
const unlockTime = Math.floor(Date.now() / 1000) + lockDuration;

// Lock NOR/USDT LP
await liquidityLock.lockLiquidity(
  NOR_USDT_PAIR_ADDRESS,
  lpBalance1,
  unlockTime,
  TREASURY_ADDRESS, // Can be treasury or multisig
  "Initial NOR/USDT Liquidity - $400k - 12 month lock"
);

// Lock NOR/Dirhamat LP
await liquidityLock.lockLiquidity(
  NOR_DIRHAMAT_PAIR_ADDRESS,
  lpBalance2,
  unlockTime,
  TREASURY_ADDRESS,
  "Initial NOR/Dirhamat Liquidity - $200k - 12 month lock"
);

// Lock Dirhamat/USDT LP
await liquidityLock.lockLiquidity(
  DIRHAMAT_USDT_PAIR_ADDRESS,
  lpBalance3,
  unlockTime,
  TREASURY_ADDRESS,
  "Initial Dirhamat/USDT Liquidity - $150k - 12 month lock"
);
```

### Phase 6: Verify & Announce

**6.1 Verify Liquidity:**
```javascript
// Check reserves
const [reserve0, reserve1] = await norUsdtPair.getReserves();
console.log("NOR/USDT Reserves:", reserve0, reserve1);

// Check locked amounts
const totalLocked = await liquidityLock.getTotalLockedAmount(NOR_USDT_PAIR_ADDRESS);
console.log("Total LP Tokens Locked:", totalLocked);

// Verify unlock time
const lock = await liquidityLock.getLock(0);
console.log("Unlock Time:", new Date(lock.unlockTime * 1000));
```

**6.2 Public Announcement:**
```
🌙 Nor Chain DEX Launch Announcement 🌙

✅ $800,000 Initial Liquidity Deployed
✅ All LP Tokens Locked for 12 Months
✅ Trading Now Live on NorSwap

Trading Pairs:
- NOR/USDT: $400k liquidity (1 NOR = $0.01)
- NOR/Dirhamat: $200k liquidity
- Dirhamat/USDT: $150k liquidity (1 DIRHAMAT = ~$0.27)

Liquidity Lock Proof:
Contract: [LIQUIDITY_LOCK_ADDRESS]
Unlock Date: [DATE]
Total Locked: 100% of initial LP tokens

Trade on: https://swap.norchain.org
```

---

## 💰 Price Calculation & Formulas

### Constant Product AMM (x * y = k)

**Formula:**
```
Reserve A × Reserve B = Constant (k)
Price of A in terms of B = Reserve B / Reserve A
Price of B in terms of A = Reserve A / Reserve B
```

### NOR/USDT Initial Price

**Target:** 1 NOR = $0.01 USD

**Calculation:**
```
If we want 1 NOR = $0.01:
Then for every 100 NOR, we need $1 USDT

With 20M NOR and $200k USDT:
Price = $200,000 / 20,000,000 NOR = $0.01 per NOR ✅

Constant k = 20,000,000 × 200,000 = 4,000,000,000,000
```

### Dirhamat/USDT Initial Price

**Target:** 1 DIRHAMAT = $0.27 USD (1 AED equivalent)

**Calculation:**
```
With 277,778 DIRHAMAT and $75,000 USDT:
Price = $75,000 / 277,778 DIRHAMAT = $0.27 per DIRHAMAT ✅

Constant k = 277,778 × 75,000 = 20,833,350,000
```

### NOR/Dirhamat Cross Price

**Calculation:**
```
From NOR/USDT: 1 NOR = $0.01
From Dirhamat/USDT: 1 DIRHAMAT = $0.27

Therefore: 1 DIRHAMAT = 27 NOR (or 1 NOR = 0.037 DIRHAMAT)

With 10M NOR and 370,370 DIRHAMAT:
Price = 370,370 / 10,000,000 = 0.037 DIRHAMAT per NOR ✅
Or: 10,000,000 / 370,370 = 27 NOR per DIRHAMAT ✅
```

---

## 🔒 Security Considerations

### Liquidity Lock Benefits

1. **Prevents Rug Pulls** - Developers cannot withdraw liquidity
2. **Builds Trust** - Community knows liquidity is secure
3. **Price Stability** - Less susceptible to manipulation
4. **Long-term Commitment** - Demonstrates project seriousness

### Lock Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Duration** | 12 months | Industry standard for serious projects |
| **Beneficiary** | Treasury Multisig | Requires governance approval to unlock |
| **Description** | Transparent | Publicly verifiable on-chain |
| **Emergency Unlock** | Owner only | Requires DAO approval in production |

### Additional Security Measures

1. **Multi-signature treasury** (3-of-5 for lock beneficiary)
2. **Time-lock on emergency unlock** (48-hour delay)
3. **Public announcement** before any liquidity changes
4. **Third-party audit** of LiquidityLock contract
5. **Explorer verification** of all contracts

---

## 📈 Expected Trading Activity

### Initial Price Discovery (Week 1-2)

- **NOR Price:** $0.01 → $0.008-$0.015 (market discovery)
- **Volume:** Low to moderate ($10k-$50k/day)
- **Slippage:** <2% for trades up to $1,000

### Post-Listing (Week 3-8)

- **NOR Price:** $0.012-$0.020 (with CEX listing)
- **Volume:** Moderate to high ($50k-$200k/day)
- **TVL Growth:** Additional community LP providers

### Target Metrics (Month 3)

- **Total TVL:** $1.5M+ (including community LPs)
- **Daily Volume:** $300k+
- **Active Traders:** 1,000+
- **Average Slippage:** <1% for $5k trades

---

## 🚀 Deployment Scripts

All required deployment scripts need to be created in `/scripts/`:

1. `deploy-norswap-router.js` - Deploy Router contract
2. `deploy-wnor.js` - Deploy Wrapped NOR
3. `deploy-mock-usdt.js` - Deploy test USDT (or bridge real)
4. `deploy-liquidity-lock.js` - Deploy LiquidityLock
5. `create-dex-pairs.js` - Create trading pairs
6. `add-initial-liquidity.js` - Add $800k liquidity
7. `lock-lp-tokens.js` - Lock LP tokens for 12 months

**Complete Deployment Command:**
```bash
# All-in-one deployment
npx hardhat run scripts/deploy-dex-complete.js --network btcbr
```

---

## ✅ Pre-Launch Checklist

- [ ] Compile all contracts
- [ ] Deploy NorSwapRouter
- [ ] Deploy WNOR (Wrapped NOR)
- [ ] Deploy or bridge USDT
- [ ] Deploy LiquidityLock contract
- [ ] Create NOR/USDT pair
- [ ] Create NOR/Dirhamat pair
- [ ] Create Dirhamat/USDT pair
- [ ] Add initial liquidity ($800k total)
- [ ] Lock all LP tokens (12 months)
- [ ] Verify contracts on explorer
- [ ] Test swaps on all pairs
- [ ] Publish liquidity lock proof
- [ ] Announce DEX launch

---

## 📚 References

- **Playbook Part 5:** Market Strategy & Launch Plan
- **Playbook Part 6:** Smart Contracts & DeFi Architecture
- **Uniswap V2 Documentation:** https://docs.uniswap.org/protocol/V2/introduction
- **OpenZeppelin SafeERC20:** https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#SafeERC20

---

## 🌙 Summary

**Total Initial Liquidity:** $800,000
**Lock Duration:** 12 months
**Trading Pairs:** 3 (NOR/USDT, NOR/Dirhamat, Dirhamat/USDT)
**Initial NOR Price:** $0.01 USD
**Security:** 100% LP tokens locked, multi-sig treasury
**Status:** Ready for Implementation

🌙 **Nor Chain - Illuminating DeFi with Trust and Transparency** 🌙

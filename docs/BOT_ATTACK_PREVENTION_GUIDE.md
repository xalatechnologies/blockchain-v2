# Bot Attack Prevention Guide

**Attack Pattern Identified**: Bot bought NOR cheap → Dumped immediately → Drained liquidity

**Date**: November 7, 2025

---

## 🚨 What Happened (Confirmed)

```
ATTACK SEQUENCE:

1. You add liquidity: 1,000 NOR + $20 USDT
2. Bot detects new pool INSTANTLY
3. Bot buys NOR at cheap price (using $10)
4. Bot immediately sells ALL NOR back (gets $19.98)
5. Bot profits: $9.98
6. Your pool: DESTROYED

Time from liquidity add to attack: ~30 seconds
```

---

## 🛡️ 7 Ways to Prevent This Attack

### 1. **Disable Trading Until Ready** ⭐⭐⭐ (MOST IMPORTANT)

**The Problem**: Trading started the moment you added liquidity

**The Solution**: Use a token contract with trading controls

```solidity
// In your token contract
bool public tradingEnabled = false;
uint256 public tradingStartTime;

function _transfer(address from, address to, uint256 amount) internal override {
    // Block all transfers except owner/whitelist until enabled
    if (!tradingEnabled) {
        require(
            _isWhitelisted[from] || _isWhitelisted[to],
            "Trading not enabled"
        );
    }

    super._transfer(from, to, amount);
}

// Only owner can enable (ONE TIME)
function enableTrading() external onlyOwner {
    require(!tradingEnabled, "Already enabled");
    tradingEnabled = true;
    tradingStartTime = block.timestamp;
}
```

**Launch Sequence:**
```
✅ Step 1: Deploy token (trading DISABLED)
✅ Step 2: Add liquidity (bots can't trade yet)
✅ Step 3: Lock liquidity for 2+ years
✅ Step 4: Announce launch (24h notice)
✅ Step 5: Enable trading at announced time
✅ Step 6: Monitor for first hour
```

**Result**: Bots cannot buy during liquidity setup!

---

### 2. **Add Massive Liquidity** ⭐⭐⭐ (CRITICAL)

**The Problem**: $20 liquidity = Easy to drain

**The Solution**: Add AT LEAST $50,000 liquidity

**Why This Works:**

```
SCENARIO A: $20 Liquidity (What You Had)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bot buys: $10 worth of NOR
Bot sells: Gets $19.98 back
Bot profit: $9.98 ✅ PROFITABLE
Your pool: DEAD ❌

SCENARIO B: $50,000 Liquidity (What You Need)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bot buys: $10,000 worth of NOR (massive buy)
Bot sells: Gets $9,500 back (5% slippage)
Bot profit: -$500 ❌ LOSES MONEY
Your pool: SURVIVES ✅
```

**Calculation:**

```javascript
// For $0.25 target price per NOR

Minimum Liquidity:
- 200,000 NOR × $0.25 = $50,000
- Composition: 200,000 NOR + $50,000 USDT

Recommended Liquidity:
- 400,000 NOR × $0.25 = $100,000
- Composition: 400,000 NOR + $100,000 USDT

Professional Launch:
- 1,000,000 NOR × $0.25 = $250,000+
- Multiple pools (USDT, BNB, BUSD)
```

**Math**: With proper liquidity, bots LOSE money on gas fees trying to manipulate!

---

### 3. **Lock Liquidity BEFORE Enabling Trading** ⭐⭐⭐ (MANDATORY)

**The Problem**: Unlocked liquidity = Rug pull signal → Bot attacks

**The Solution**: Lock LP tokens for 2+ years FIRST

**Step-by-Step:**

```bash
# 1. Add liquidity (trading still disabled)
# You receive LP tokens

# 2. Lock LP tokens immediately
Go to: https://www.team.finance/

Steps:
├─ Connect wallet
├─ Click "Lock Tokens"
├─ Select: LP-Token address
├─ Amount: 100% of LP tokens
├─ Duration: 2-3 years
└─ Confirm transaction

# 3. Get lock proof
Lock Address: 0x... (save this!)
Proof URL: https://www.team.finance/view-token/...

# 4. Publish lock proof
├─ Add to website
├─ Post in Telegram
├─ Tweet announcement
└─ Add to contract comments

# 5. NOW enable trading
Only after lock is confirmed and public
```

**Why This Works:**
- ✅ Shows you're committed long-term
- ✅ Bots see this and move to easier targets
- ✅ Community trusts you
- ✅ Makes attack less attractive

---

### 4. **Anti-Bot Cooldown Period** ⭐⭐

**The Problem**: Bots can buy and sell in same block

**The Solution**: Enforce cooldown between trades

```solidity
mapping(address => uint256) private _lastTrade;
uint256 public cooldownTime = 60; // 60 seconds

function _transfer(address from, address to, uint256 amount) internal override {
    // Require 60 seconds between trades
    if (tradingEnabled && !_isWhitelisted[from]) {
        require(
            block.timestamp >= _lastTrade[from] + cooldownTime,
            "Cooldown active"
        );
        _lastTrade[from] = block.timestamp;
    }

    super._transfer(from, to, amount);
}
```

**Effect on Bot:**
```
Block 1: Bot buys NOR ✅
Block 2: Bot tries to sell → FAILS ❌ (cooldown)
Block 3: Bot tries to sell → FAILS ❌ (cooldown)
...
Block 20: Bot can sell (60 seconds passed)
└─ BUT: Price has normalized, others traded
└─ Bot's profit opportunity = GONE
```

---

### 5. **Max Transaction Limits** ⭐⭐

**The Problem**: Bot buys/sells unlimited amounts

**The Solution**: Cap per-transaction amounts

```solidity
uint256 public maxTxAmount = totalSupply() / 200; // 0.5% max per tx

function _transfer(address from, address to, uint256 amount) internal override {
    if (tradingEnabled && !_isWhitelisted[from]) {
        require(amount <= maxTxAmount, "Exceeds max transaction");
    }

    super._transfer(from, to, amount);
}
```

**Effect:**
```
Total Supply: 20,000,000 NOR
Max per TX: 100,000 NOR (0.5%)

Bot wants to buy 2,000,000 NOR:
├─ Needs 20 transactions
├─ Each transaction = 1 block minimum
├─ Takes 60+ seconds (with cooldown)
└─ By then, price has moved against bot
```

**Result**: Large dumps impossible, bot attack ineffective

---

### 6. **Graduated Launch with Limits** ⭐⭐

**The Problem**: All liquidity available from second 1

**The Solution**: Increase limits gradually

```solidity
// Launch phases
enum Phase { CLOSED, PHASE1, PHASE2, OPEN }
Phase public currentPhase = Phase.CLOSED;

function _transfer(address from, address to, uint256 amount) internal override {
    if (currentPhase == Phase.PHASE1) {
        // First 1 hour: Max 10,000 NOR per tx
        require(amount <= 10000 * 10**18, "Phase 1 limit");
    } else if (currentPhase == Phase.PHASE2) {
        // Next 6 hours: Max 50,000 NOR per tx
        require(amount <= 50000 * 10**18, "Phase 2 limit");
    }
    // After that: No limits

    super._transfer(from, to, amount);
}
```

**Timeline:**
```
Hour 0: Enable trading (Phase 1)
├─ Max 10,000 NOR per trade
├─ Bot impact: MINIMAL
└─ Community can participate

Hour 1: Enter Phase 2
├─ Max 50,000 NOR per trade
├─ Bot impact: LIMITED
└─ More trading freedom

Hour 7: Fully Open
├─ No limits
├─ Bot impact: NORMAL
└─ But pool has been tested and stabilized
```

---

### 7. **Use Fair Launch Platform** ⭐⭐⭐ (RECOMMENDED)

**The Problem**: DIY launch = Bot heaven

**The Solution**: Use PinkSale or DxSale

**PinkSale Launch Process:**

```
1. Go to: https://www.pinksale.finance/
2. Click "Create Fair Launch"
3. Fill in details:
   ├─ Token address
   ├─ Soft cap: $50,000
   ├─ Hard cap: $100,000
   ├─ Min buy: $50
   ├─ Max buy: $5,000
   └─ Launch duration: 48 hours

4. Launch goes live:
   ├─ Users contribute funds
   ├─ Token NOT tradeable yet
   └─ Bots CANNOT front-run

5. After 48 hours:
   ├─ Liquidity auto-added
   ├─ LP tokens auto-locked
   ├─ Trading enabled instantly
   └─ FAIR for everyone
```

**Built-in Protections:**
- ✅ Anti-bot measures
- ✅ Automatic liquidity lock
- ✅ KYC verification available
- ✅ Vetted by platform
- ✅ Community trusts it

**Cost**: ~$300-600 (worth it for security)

---

## 🎯 Recommended Prevention Stack

### **For NOR Token V2 Relaunch:**

```
LAYER 1: Smart Contract
✅ Trading disabled by default
✅ 60-second cooldown between trades
✅ Max 0.5% per transaction
✅ Whitelist for exchanges/bridges

LAYER 2: Liquidity
✅ Minimum $50,000 USDT liquidity
✅ Split across USDT (50%), BNB (30%), BUSD (20%)
✅ Lock ALL LP tokens for 2 years
✅ Publish lock proof publicly

LAYER 3: Launch Process
✅ Use PinkSale fair launch OR
✅ Add liquidity with trading disabled
✅ Lock liquidity
✅ Announce 24h in advance
✅ Enable trading at announced time

LAYER 4: Monitoring
✅ Real-time price alerts (Telegram bot)
✅ Large transaction notifications
✅ Team on standby first hour
✅ Ready to blacklist bot addresses

LAYER 5: Post-Launch
✅ Gradually remove limits after 7 days
✅ Keep monitoring for 30 days
✅ Build community trust
✅ Professional marketing
```

---

## 📋 Implementation Checklist

### Before Next Launch:

#### Smart Contract
- [ ] Deploy NorTokenV2_AntiBot.sol
- [ ] Set trading disabled
- [ ] Configure cooldown (60 seconds)
- [ ] Set max transaction (0.5% supply)
- [ ] Set max wallet (2% supply)
- [ ] Whitelist owner and bridges
- [ ] Verify contract on BSCScan

#### Liquidity Preparation
- [ ] Prepare $50,000+ USDT minimum
- [ ] Prepare equivalent NOR tokens
- [ ] Create multiple pools (USDT, BNB, BUSD)
- [ ] Test liquidity lock service (Team Finance)
- [ ] Prepare lock announcements

#### Launch Platform
- [ ] Choose: PinkSale or DIY
- [ ] If PinkSale: Complete KYC
- [ ] If DIY: Prepare announcement schedule
- [ ] Setup Telegram group
- [ ] Create launch countdown

#### Monitoring Setup
- [ ] Deploy Telegram alert bot
- [ ] Configure price alerts (>5% move)
- [ ] Setup transaction monitoring
- [ ] Prepare blacklist script (emergency)
- [ ] Team communication channel ready

#### Marketing & Trust
- [ ] Website with contract address
- [ ] Liquidity lock proof page
- [ ] Tokenomics documentation
- [ ] Team/advisor transparency
- [ ] Social media presence

---

## 💰 Cost Breakdown

### Proper Launch Budget:

| Item | Cost | Priority |
|------|------|----------|
| **Liquidity** | $50,000 - $100,000 | ⭐⭐⭐ CRITICAL |
| **Liquidity Lock** | $0 - $200 | ⭐⭐⭐ CRITICAL |
| **Fair Launch Platform** | $300 - $600 | ⭐⭐⭐ HIGHLY RECOMMENDED |
| **Contract Audit** | $5,000 - $15,000 | ⭐⭐ RECOMMENDED |
| **KYC Verification** | $1,000 - $3,000 | ⭐⭐ RECOMMENDED |
| **Marketing** | $5,000 - $20,000 | ⭐ GOOD TO HAVE |
| **Telegram Bot** | $50/month | ⭐ GOOD TO HAVE |
| **Total (Minimum)** | **$55,350** | - |
| **Total (Recommended)** | **$80,000 - $140,000** | - |

---

## 🎓 Key Lessons

### What Went Wrong:

1. ❌ **$20 liquidity** = Bot's dream target
2. ❌ **Trading enabled immediately** = No preparation time
3. ❌ **No liquidity lock** = Rug pull signal
4. ❌ **No anti-bot protections** = Easy money for bots
5. ❌ **No monitoring** = Couldn't respond

### What You Need:

1. ✅ **$50,000+ liquidity** = Bot attack unprofitable
2. ✅ **Trading disabled first** = Control the launch
3. ✅ **Lock liquidity 2+ years** = Trust signal
4. ✅ **Anti-bot contract** = Makes attacks harder
5. ✅ **Real-time monitoring** = Quick response

---

## 🚀 Your Next Steps

### Option 1: Proper Relaunch (Recommended)

```
Week 1-2:
├─ Deploy NorTokenV2 with anti-bot features
├─ Secure $50,000+ liquidity
├─ Test everything on testnet
└─ Plan marketing campaign

Week 3:
├─ Launch on PinkSale or prepare DIY launch
├─ Add and lock liquidity
├─ Enable trading at announced time
└─ Monitor intensively first 24h

Week 4+:
├─ Gradually remove limits
├─ Build community
├─ List on CoinGecko/CMC
└─ Expand to other chains
```

### Option 2: Focus on NorChain First

```
Phase 1: Build on NorChain
├─ No BSC launch yet
├─ Build community on private chain
├─ Prove concept and utility
└─ Grow organically

Phase 2: Cross-chain when ready
├─ Bridge to BSC with proper funding
├─ $100,000+ liquidity
├─ Established community support
└─ Lower risk of failure
```

---

## 📚 Resources

### Anti-Bot Tools
- **PinkSale**: https://www.pinksale.finance/
- **Team Finance (locks)**: https://www.team.finance/
- **Token Sniffer**: https://tokensniffer.com/
- **Honeypot Checker**: https://honeypot.is/

### Monitoring Tools
- **DexTools**: https://www.dextools.io/
- **DexScreener**: https://dexscreener.com/
- **Tenderly**: https://tenderly.co/
- **Forta Network**: https://forta.org/

### Educational Resources
- **How to Launch a Token**: https://academy.binance.com/
- **Liquidity Pool Attacks**: https://blog.chain.link/liquidity-pool-attacks/
- **MEV Bots Explained**: https://ethereum.org/en/developers/docs/mev/

---

## ✅ Summary

**What Happened**: Bot bought cheap → Dumped immediately

**Why It Worked**:
- $20 liquidity = Too easy
- No anti-bot protection
- Trading enabled immediately
- No liquidity lock

**How to Prevent**:
1. ✅ Add $50,000+ liquidity
2. ✅ Disable trading until ready
3. ✅ Lock liquidity 2+ years
4. ✅ Use anti-bot contract features
5. ✅ Launch via PinkSale or with preparation
6. ✅ Real-time monitoring
7. ✅ Professional marketing

**Cost to Do It Right**: $50,000 - $140,000 minimum

**Result**: Bot attacks become UNPROFITABLE and ineffective!

---

**The Bottom Line**: You can't prevent bots from TRYING to attack, but you CAN make attacks unprofitable and ineffective with proper protections.

With these measures, bots will find easier targets and leave your token alone! 🛡️

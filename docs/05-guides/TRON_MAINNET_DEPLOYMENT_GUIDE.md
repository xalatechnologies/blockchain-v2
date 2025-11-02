# 🌟 BTCBR-TRC20 Tron Mainnet Deployment Guide

**Network**: Tron Mainnet
**Priority**: ⭐⭐⭐ HIGHEST (50%+ of global USDT is TRC20)
**Estimated Cost**: 1,000-5,000 TRX (~$0.20-$1.00) for deployment

---

## 📋 Prerequisites Checklist

### 1. Environment Setup

**Required:**
- ✅ TronLink wallet installed ([tronlink.org](https://www.tronlink.org))
- ✅ At least 5,000 TRX in deployer wallet (~$1)
  - Deployment: ~1,000 TRX
  - Energy rental buffer: ~2,000 TRX
  - Liquidity provision: Variable ($10K-$25K recommended)
- ✅ Node.js 18+ installed
- ✅ Hardhat project cloned and dependencies installed

### 2. Configuration Files

Add to `.env` file:

\`\`\`bash
# Tron Mainnet Configuration
TRON_RPC=https://api.trongrid.io
TRON_DEPLOYER_KEY=your_private_key_here_without_0x
TRON_CHAIN_ID=728126428 # Tron mainnet (0x2b6653dc in hex)

# Optional: For verification
TRONSCAN_API_KEY=your_tronscan_api_key_here
\`\`\`

**IMPORTANT**: Tron private keys do NOT have `0x` prefix!

### 3. Hardhat Configuration

Add Tron network to `hardhat.config.js`:

\`\`\`javascript
// hardhat.config.js
export default {
  // ... existing config ...

  networks: {
    // ... existing networks ...

    // Tron Mainnet
    tron: {
      type: "http",
      url: process.env.TRON_RPC || "https://api.trongrid.io",
      chainId: 728126428, // Tron mainnet
      accounts: process.env.TRON_DEPLOYER_KEY
        ? [process.env.TRON_DEPLOYER_KEY]
        : [],
      gasPrice: 420000000000, // 420 SUN (standard Tron gas price)
      timeout: 120000, // 2 minutes
    },

    // Tron Nile Testnet (for testing first)
    tronNile: {
      type: "http",
      url: "https://nile.trongrid.io",
      chainId: 3448148188, // Nile testnet
      accounts: process.env.TRON_DEPLOYER_KEY
        ? [process.env.TRON_DEPLOYER_KEY]
        : [],
      gasPrice: 420000000000,
      timeout: 120000,
    },
  },
};
\`\`\`

---

## 🚀 Deployment Steps

### Phase 1: Test on Tron Nile Testnet (Recommended First)

#### 1. Get Nile TRX (Free)

Visit: [https://nileex.io/join/getJoinPage](https://nileex.io/join/getJoinPage)

Request 10,000 TRX (free testnet tokens)

#### 2. Deploy to Nile Testnet

\`\`\`bash
# Deploy to Nile testnet first
npx hardhat run scripts/deploy-tron-mainnet.js --network tronNile

# Expected output:
# 🚀 Deploying to Tron Nile Testnet
# ================================================
# 📍 Deployer address: [YOUR_ADDRESS]
# 💰 Deployer balance: 10000.0 TRX
#
# [1/2] Deploying BTCBR-TRC20...
# ✅ BTCBR-TRC20 deployed at: [TRC20_ADDRESS]
#
# [2/2] Deploying BTCBRBridgeTron...
# ✅ BTCBRBridgeTron deployed at: [BRIDGE_ADDRESS]
#
# Gas Used: ~1000 TRX
\`\`\`

#### 3. Verify on Nile Explorer

Visit: [https://nile.tronscan.org](https://nile.tronscan.org)

Paste your contract address to verify deployment

#### 4. Test Bridge Functionality

\`\`\`bash
# Test minting (if you're a validator)
npx hardhat console --network tronNile

> const btcbr = await ethers.getContractAt("BTCBR_TRC20", "YOUR_TRC20_ADDRESS");
> await btcbr.bridgeMint("YOUR_ADDRESS", ethers.parseEther("1000"), ethers.id("test-transfer-1"));
> const balance = await btcbr.balanceOf("YOUR_ADDRESS");
> console.log("Balance:", ethers.formatEther(balance));
\`\`\`

### Phase 2: Deploy to Tron Mainnet

#### 1. Pre-Deployment Checklist

- [ ] Tested successfully on Nile testnet
- [ ] At least 5,000 TRX in deployer wallet
- [ ] Private key correctly configured (NO 0x prefix!)
- [ ] Validator addresses confirmed
- [ ] Backup of private key stored securely
- [ ] Team notified of deployment

#### 2. Execute Mainnet Deployment

\`\`\`bash
# FINAL DEPLOYMENT - MAINNET
npx hardhat run scripts/deploy-tron-mainnet.js --network tron

# This will:
# 1. Deploy BTCBR-TRC20 token contract
# 2. Deploy BTCBRBridgeTron contract
# 3. Grant MINTER and BURNER roles to bridge
# 4. Add validator addresses
# 5. Save deployment info to deployment-tron-[timestamp].json
\`\`\`

**Expected Output:**

\`\`\`
🚀 Deploying to Tron Mainnet
======================================================================
📍 Deployer address: TXyz...abc
💰 Deployer balance: 5234.567 TRX

[1/2] Deploying BTCBR-TRC20...
✅ BTCBR-TRC20 deployed at: TBtc...123

[2/2] Deploying BTCBRBridgeTron...
✅ BTCBRBridgeTron deployed at: TBri...456

[3/3] Granting MINTER and BURNER roles to bridge...
✅ Roles granted

[4/4] Adding validators...
  ✓ Added validator: 0xA4522eD2379C2214D471374fFA06B06d6513686E
  ✓ Added validator: 0x55ad41D5800d53d5249fE2D7B33bde887A293c73
  ✓ Added validator: 0x7e05277D528B9192572EB1dCdAdcE3527c337Cdf

======================================================================
TRON DEPLOYMENT COMPLETE
======================================================================

📊 SUMMARY:
  BTCBR-TRC20: TBtc...123
  Bridge: TBri...456
  Gas Used: 1234.56 TRX (~$0.25)

💾 Saved to: deployment-tron-1730304567890.json

📝 NEXT STEPS:
  1. Verify contracts on Tronscan
  2. Create SunSwap pools:
     - BTCBR-TRC20/TRX
     - BTCBR-TRC20/USDT-TRC20 ⭐ PRIORITY
  3. Add initial liquidity ($5K-20K recommended)
  4. Update frontend with Tron bridge integration
  5. Announce BTCBR launch on Tron

💡 WHY TRON IS CRITICAL:
  ✅ $0.01 transaction fees (cheapest)
  ✅ 50%+ of global USDT is TRC20
  ✅ 3-second finality
  ✅ Dominant in Asia (largest crypto market)
  ✅ Perfect for retail users
\`\`\`

#### 3. Verify Contracts on Tronscan

**Automatic (if configured):**
\`\`\`bash
npx hardhat verify --network tron [BTCBR_TRC20_ADDRESS]
npx hardhat verify --network tron [BRIDGE_ADDRESS] [BTCBR_TRC20_ADDRESS]
\`\`\`

**Manual:**
1. Go to [https://tronscan.org](https://tronscan.org)
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Upload source code and compiler settings

---

## 💧 Phase 3: Create SunSwap Liquidity Pools

### Pool 1: BTCBR-TRC20/USDT-TRC20 ⭐ HIGHEST PRIORITY

**Why This is Critical:**
- 🚀 50%+ of global USDT is TRC20
- 💰 $0.01 transaction fees (vs Ethereum $5-50)
- ⚡ 3-second confirmation
- 🌏 Dominant in Asia (largest retail market)
- 📈 Highest expected volume

**Recommended Initial Liquidity**: $10K-$25K
- Example: 20,000 USDT + equivalent BTCBR

#### Steps to Create Pool:

1. **Navigate to SunSwap**
   ```
   https://sunswap.com/#/pool
   ```

2. **Connect TronLink Wallet**
   - Click "Connect Wallet"
   - Select TronLink
   - Approve connection

3. **Click "Add Liquidity"**

4. **Select Tokens**
   - Token A: BTCBR-TRC20 (paste your deployed address)
   - Token B: USDT-TRC20 (`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`)

5. **Enter Amounts**
   ```
   BTCBR-TRC20: [Your amount]
   USDT: [Corresponding amount]

   SunSwap will show:
   - Exchange rate
   - Pool share percentage
   - LP tokens you'll receive
   ```

6. **Approve Tokens**
   - Click "Approve BTCBR-TRC20"
   - Confirm in TronLink (Energy cost: ~32,000)
   - Click "Approve USDT" (if needed)

7. **Supply Liquidity**
   - Review details
   - Click "Supply"
   - Confirm transaction in TronLink
   - Wait for confirmation (~3 seconds)

8. **Receive LP Tokens**
   - You'll receive SunSwap LP tokens
   - These represent your share of the pool
   - **Keep safe!** Needed to withdraw liquidity

### Pool 2: BTCBR-TRC20/TRX

**Why TRX Pair:**
- Native Tron token
- High liquidity
- Gateway to Tron ecosystem

**Recommended Initial Liquidity**: $5K-$15K
- Example: 50,000 TRX + equivalent BTCBR

Follow same steps as USDT pool, but use WTRX address:
- WTRX: `TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR`

---

## 📊 Energy and Bandwidth Management

### Understanding Tron Resources

Unlike Ethereum gas, Tron uses:
- **Energy**: For smart contract executions
- **Bandwidth**: For TRX transfers

### Option 1: Freeze TRX for Energy (Long-term)

\`\`\`javascript
// Freeze TRX to get energy
await tronWeb.transactionBuilder.freezeBalance(
    tronWeb.toSun(1000), // 1000 TRX
    3, // Freeze for 3 days
    "ENERGY"
);
\`\`\`

- 1000 TRX frozen = ~50,000 energy
- Enough for ~10-15 transactions
- Get TRX back after 3 days

### Option 2: Rent Energy (Cheaper & Flexible) ⭐ RECOMMENDED

**Platforms:**
- [JustLend](https://justlend.org) - Official Tron lending
- [Poloniex Energy](https://www.poloniex.com) - Centralized exchange
- [Energy Rental Markets](https://www.trx.rent) - P2P rental

**Cost**: ~$0.005 per 32,000 energy (enough for 1 approval)

**Benefits:**
- Instant
- No lock-up period
- Pay only for what you use
- Much cheaper for infrequent transactions

### Estimated Energy Costs

| Operation | Energy Needed | Cost (Rental) |
|-----------|---------------|---------------|
| Approve token | 32,000 | $0.005 |
| Add liquidity | 64,000 | $0.01 |
| Swap tokens | 32,000 | $0.005 |
| Bridge transfer | 96,000 | $0.015 |
| Deploy contract | 200,000 | $0.03 |

---

## 🎯 Marketing Strategy for Tron Launch

### Target Audience

1. **Asian Crypto Community**
   - China, Korea, Japan, SEA
   - Tron-native users
   - Mobile-first traders

2. **Cost-Conscious Traders**
   - Retail users avoiding ETH fees
   - High-frequency traders
   - Small balance holders ($10-1000)

3. **USDT Holders**
   - 55% of USDT holders use TRC20
   - Easy onboarding to BTCBR
   - Natural trading pair

### Launch Announcements

**Twitter/X:**
\`\`\`
🎉 BTCBR NOW LIVE ON TRON! 🌟

The cheapest way to trade BTCBR is here!

✅ $0.01 transaction fees
✅ 3-second finality
✅ Trade with USDT-TRC20
✅ Perfect for retail traders

Contract: [YOUR_TRC20_ADDRESS]

Trade on @SunSwapV2 NOW! 🚀

#BTCBR #Tron #TRC20 #DeFi
\`\`\`

**Telegram:**
\`\`\`
🚨 MAJOR ANNOUNCEMENT 🚨

BTCBR is now available on TRON MAINNET!

💎 WHAT THIS MEANS FOR YOU:
• Trade for $0.01 (vs $15+ on Ethereum)
• Instant 3-second confirmations
• Use your USDT-TRC20 directly
• Perfect for small trades

📝 CONTRACT ADDRESS:
[YOUR_TRC20_ADDRESS]

🔗 TRADE ON SUNSWAP:
https://sunswap.com/#/swap?inputCurrency=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&outputCurrency=[YOUR_ADDRESS]

💰 LIQUIDITY POOLS:
• BTCBR/USDT (⭐ Highest volume)
• BTCBR/TRX (Native pair)

First 100 traders get 5% BONUS! 🎁
\`\`\`

**Chinese Translation (Critical for Tron Market):**
\`\`\`
🎉 BTCBR 现已在波场链上线！🌟

最便宜的 BTCBR 交易方式来了！

✅ 交易费仅 $0.01
✅ 3 秒确认
✅ 直接使用 USDT-TRC20
✅ 完美适合散户交易

合约地址：[YOUR_TRC20_ADDRESS]

立即在 @SunSwapV2 交易！🚀

#BTCBR #波场 #TRC20 #DeFi
\`\`\`

---

## 📈 Expected Results and ROI

### Volume Projections

**Conservative Scenario:**
- Month 1: $1M trading volume
- Month 3: $10M trading volume
- Month 6: $50M trading volume

**Optimistic Scenario:**
- Month 1: $5M trading volume
- Month 3: $50M trading volume
- Month 6: $200M+ trading volume

### LP Returns (0.3% fee)

| Monthly Volume | Monthly Fees | APY on $20K Liquidity |
|----------------|--------------|----------------------|
| $1M | $3K | 180% |
| $10M | $30K | 1,800% 🚀 |
| $50M | $150K | 9,000% 🚀🚀 |

### Success Metrics

**Week 1:**
- ✅ Pools created and liquid
- ✅ 100+ unique traders
- ✅ $100K+ volume
- ✅ Listed on SunSwap frontend

**Month 1:**
- ✅ $100K+ TVL (both pools)
- ✅ $5M+ monthly volume
- ✅ 1,000+ unique traders
- ✅ Top 50 pair on SunSwap

**Month 3:**
- ✅ $500K+ TVL
- ✅ $50M+ monthly volume
- ✅ 10,000+ unique traders
- ✅ Top 20 pair on SunSwap

---

## 🔒 Security Considerations

### Smart Contract Security

**BTCBR-TRC20:**
- ✅ Based on OpenZeppelin ERC20
- ✅ AccessControl for role management
- ✅ Pausable for emergency stops
- ✅ Same security as EVM chains

**Bridge Security:**
- ✅ Multi-signature validation (3-of-5 validators)
- ✅ Transfer limits (100 - 100,000 BTCBR)
- ✅ Daily limits (500,000 BTCBR per address)
- ✅ Pausable for emergencies

### Best Practices

1. **Never share private keys**
2. **Test on Nile first**
3. **Verify contracts on Tronscan**
4. **Start with small liquidity**
5. **Monitor for suspicious activity**
6. **Keep emergency pause function accessible**

---

## 📞 Support Resources

**SunSwap:**
- Website: [https://sunswap.com](https://sunswap.com)
- Docs: [https://docs.sunswap.com](https://docs.sunswap.com)
- Twitter: [@SunSwapV2](https://twitter.com/SunSwapV2)

**Tron:**
- Tronscan: [https://tronscan.org](https://tronscan.org)
- TronLink: [https://www.tronlink.org](https://www.tronlink.org)
- Tron Docs: [https://developers.tron.network](https://developers.tron.network)

**Analytics:**
- SunSwap Analytics: [https://sunswap.com/#/analytics](https://sunswap.com/#/analytics)
- Tron Station: [https://www.tronstation.io](https://www.tronstation.io)

**Community:**
- Tron Discord: [https://discord.gg/tron](https://discord.gg/tron)
- Tron Telegram: [@TronNetworkEN](https://t.me/TronNetworkEN)
- Tron Reddit: [r/Tronix](https://reddit.com/r/Tronix)

---

## ✅ Complete Deployment Checklist

### Pre-Deployment
- [ ] Hardhat config updated with Tron network
- [ ] Environment variables configured
- [ ] At least 5,000 TRX in deployer wallet
- [ ] Tested on Nile testnet successfully
- [ ] Validator addresses confirmed
- [ ] Team notified

### Deployment
- [ ] BTCBR-TRC20 deployed to Tron mainnet
- [ ] BTCBRBridgeTron deployed
- [ ] MINTER and BURNER roles granted
- [ ] Validators added to bridge
- [ ] Contracts verified on Tronscan
- [ ] Deployment info saved

### Pool Creation
- [ ] BTCBR-TRC20/USDT pool created on SunSwap
- [ ] BTCBR-TRC20/TRX pool created
- [ ] Initial liquidity added ($15K+ total)
- [ ] LP tokens secured
- [ ] Energy rental setup (or TRX frozen)

### Marketing
- [ ] Twitter/X announcement posted
- [ ] Telegram messages sent
- [ ] Chinese translation posted
- [ ] Reddit post on r/Tronix
- [ ] Trading competition announced
- [ ] Influencer partnerships activated
- [ ] Mobile wallet integration guide published

### Post-Launch
- [ ] Bridge transfers tested
- [ ] Volume monitored
- [ ] Community support active
- [ ] Liquidity rebalanced as needed
- [ ] CoinGecko/CMC listings submitted
- [ ] Analytics dashboard created

---

## 🎉 Why Tron is Your Secret Weapon

**Market Opportunity:**
- Total USDT supply: ~$100B
- **TRC20 USDT: ~$55B (55%!)** ← LARGEST STABLECOIN NETWORK
- ERC20 USDT: ~$40B (40%)
- Other chains: ~$5B (5%)

**Cost Comparison:**
| Chain | Swap Fee | Gas Fee | Total | vs Tron |
|-------|----------|---------|-------|---------|
| **Tron** | $0.30 | $0.01 | **$0.31** | **Baseline** |
| BSC | $0.30 | $0.10 | $0.40 | 29% more |
| Ethereum | $3.00 | $15.00 | $18.00 | **5,700% more!** |
| Polygon | $0.30 | $0.03 | $0.33 | 6% more |

**User Experience:**
- ✅ **Retail users prefer Tron** due to low fees
- ✅ **Asian market dominance** (China, Korea, SEA)
- ✅ **Mobile-first** (TronLink easier than MetaMask)
- ✅ **Instant confirmation** (3 seconds vs 15s+ on other chains)

**Expected Outcome:**
- 🚀 **Highest volume** of all BTCBR chains
- 💰 **Best LP returns** (high volume + 0.3% fees)
- 🌏 **Largest user base** (Asian retail market)
- ⚡ **Best UX** (instant + cheap transactions)

---

**Last Updated**: October 30, 2025
**Status**: Ready for deployment
**Estimated Time**: 15-30 minutes (testnet + mainnet)
**Estimated Cost**: $1-$5 (deployment + initial energy)
**Expected ROI**: 1,800%+ APY on liquidity provision

🌟 **DEPLOY TO TRON AND DOMINATE THE RETAIL MARKET!** 🚀

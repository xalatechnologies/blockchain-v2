# Nor Chain DEX - Final $800K Liquidity Plan

**Date:** November 2, 2025
**Status:** Ready for Deployment
**Total Budget:** $800,000

---

## 🎯 5-Pair Strategy

### Rationale

This allocation prioritizes:
1. **Stable USD trading** (NOR/WUSDT) - Main entry point
2. **Bridge asset support** (BNB, ETH) - Cross-chain liquidity
3. **Regional adoption** (Dirhamat) - MENA market
4. **Arbitrage opportunities** (Dirhamat/WUSDT) - Price stability

---

## 💰 Detailed Allocation

| Pair | Liquidity | % | NOR Amount | Other Asset | Target Price |
|------|-----------|---|------------|-------------|--------------|
| **NOR/WUSDT** | $250,000 | 31.25% | 12,500,000 | $125,000 WUSDT | 1 NOR = $0.01 |
| **NOR/WBNB** | $200,000 | 25.00% | 10,000,000 | ~333 WBNB | 1 NOR = 0.00003 WBNB |
| **NOR/WETH** | $150,000 | 18.75% | 7,500,000 | ~47 WETH | 1 NOR = 0.0000063 WETH |
| **NOR/Dirhamat** | $150,000 | 18.75% | 7,500,000 | 277,778 DIRHAMAT | 1 DIRHAMAT = 27 NOR |
| **Dirhamat/WUSDT** | $50,000 | 6.25% | - | 92,593 DIRHAMAT + $25,000 WUSDT | 1 DIRHAMAT = $0.27 |
| **TOTAL** | **$800,000** | **100%** | **37,500,000** | - | - |

---

## 📊 Asset Requirements

### Tokens Needed

- **NOR:** 37,500,000 (37.5M for all pairs)
- **WUSDT:** $150,000 (150k for NOR/WUSDT + Dirhamat/WUSDT)
- **WBNB:** ~333 BNB (for testing, bridge will supply in production)
- **WETH:** ~47 ETH (for testing, bridge will supply in production)
- **Dirhamat:** ~370,371 (for NOR/Dirhamat + Dirhamat/WUSDT)

### Current Asset Prices (Assumed)

- BNB: $600
- ETH: $3,200
- Dirhamat: $0.27 (1 AED)
- WUSDT: $1.00

---

## 🔐 LP Token Locking

All LP tokens will be locked for **36 months (3 years)** using the LiquidityLock contract:
- Lock Duration: 1095 days (3 years)
- Beneficiary: Treasury Multisig
- Unlock Date: ~November 2, 2028
- Emergency unlock: Owner only (requires governance)

---

## 🚀 Deployment Steps

### Phase 1: Deploy Bridge Tokens ✅ NEXT
```bash
npx hardhat run scripts/deploy-bridge-tokens.js --network btcbr
```
Deploys: WBNB, WETH with test liquidity minted

### Phase 2: Add Liquidity
```bash
npx hardhat run scripts/add-complete-liquidity.js --network btcbr
```
Creates 5 pairs and adds $800k liquidity

### Phase 3: Lock LP Tokens
```bash
npx hardhat run scripts/lock-all-lp-tokens.js --network btcbr
```
Locks all LP tokens for 36 months (3 years)

---

## 📈 Expected Trading Activity

### Week 1-2 (Price Discovery)
- NOR: $0.008-$0.015
- Volume: $10k-$50k/day
- Slippage: <2% for $1k trades

### Month 1-3 (Growth)
- NOR: $0.012-$0.025
- Volume: $50k-$300k/day
- Additional community LPs join

### Month 6+ (Maturity)
- Total TVL: $1.5M+ (including community)
- Daily volume: $300k+
- Active traders: 1,000+

---

## ✅ Success Criteria

- [ ] All 5 pairs created successfully
- [ ] $800k liquidity deployed
- [ ] All LP tokens locked for 36 months (3 years)
- [ ] Price targets achieved (±2%)
- [ ] Trading enabled on all pairs
- [ ] Lock proof published
- [ ] Public announcement made

---

**Status:** Infrastructure deployed, ready for bridge tokens and liquidity
**Next Action:** Deploy WBNB & WETH, then add liquidity

🌙 **Nor Chain - Illuminating DeFi** 🌙

# Trust Wallet PR - Quick Fix

**PR**: https://github.com/trustwallet/assets/pull/34216
**Status**: ⚠️ Needs 2 fixes + payment

---

## ⚡ QUICK FIX (5 minutes)

### Step 1: Update info.json

1. Go to: https://github.com/xalatechnologies/assets/tree/master/blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
2. Click on `info.json`
3. Click "Edit" (pencil icon)
4. Copy/paste this fixed version:

```json
{
  "name": "Nor Token",
  "type": "BEP20",
  "symbol": "NOR",
  "decimals": 18,
  "website": "https://norchain.org",
  "description": "Nor Chain (نور - Light) native token - A next-generation Layer-1 blockchain engineered for compliant, halal finance with decentralized innovation. NOR powers gas fees, staking, governance, and liquidity on the Nor Chain ecosystem.",
  "explorer": "https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E",
  "status": "active",
  "id": "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E",
  "links": [
    {
      "name": "twitter",
      "url": "https://x.com/norchain"
    },
    {
      "name": "telegram",
      "url": "https://t.me/norchain"
    },
    {
      "name": "github",
      "url": "https://github.com/norchain/blockchain-v2"
    },
    {
      "name": "coinmarketcap",
      "url": "https://coinmarketcap.com/currencies/nor-token/"
    },
    {
      "name": "coingecko",
      "url": "https://www.coingecko.com/en/coins/nor-token"
    }
  ],
  "tags": [
    "defi",
    "governance"
  ]
}
```

5. Commit message: `fix: update Twitter URL and remove unsupported tag`
6. Click "Commit changes"

**Result**: PR automatically updates! ✅

---

## 💰 Step 2: Payment (10 minutes)

**Required**: 500 TWT or 2.5 BNB

### Option A: Pay with TWT (Cheaper)

1. Go to PancakeSwap: https://pancakeswap.finance/swap
2. Connect wallet
3. Swap BNB → TWT (need 500 TWT)
   - TWT contract: `0x4B0F1812e5Df2A09796481Ff14017e6005508003`
   - Cost: ~$50-100 depending on TWT price
4. Send 500 TWT to payment address from bot comment
5. Comment on PR with transaction hash

### Option B: Pay with BNB

1. Send 2.5 BNB (~$1,500) to payment address from bot comment
2. Comment on PR with transaction hash

---

## ✅ What Happens Next

| Time | Event |
|------|-------|
| 5-30 min | Bot verifies payment |
| 3-7 days | Manual review by Trust Wallet |
| Instant | PR merged if approved |
| 24-48 hours | Logo appears in Trust Wallet & MetaMask |

---

## 🎯 Two Fixes Made

1. ✅ Twitter URL: `twitter.com` → `x.com`
2. ✅ Tags: Removed `"layer-1"` (not permitted)

---

## 📊 Cost Comparison

| Method | Cost | Where |
|--------|------|-------|
| **Trust Wallet** | 500 TWT (~$50-100) | Wallets (100M+ users) |
| BSCScan Logo | FREE | BSCScan only |
| CoinGecko | FREE | CoinGecko only |
| CoinMarketCap | FREE | CMC only |

**Trust Wallet advantage**: Logo shows in Trust Wallet, MetaMask, and all wallets using Trust Wallet assets!

---

## 📋 Quick Checklist

- [ ] Update info.json (5 min)
- [ ] Get 500 TWT from PancakeSwap (10 min)
- [ ] Send payment to Trust Wallet (2 min)
- [ ] Comment transaction hash on PR (1 min)
- [ ] Wait for approval (3-7 days)

**Total time**: 18 minutes + waiting period

---

**Full guide**: `docs/TRUST_WALLET_PR_UPDATE.md`
**Your PR**: https://github.com/trustwallet/assets/pull/34216

---

**Update the PR now, then decide on payment!** 🚀

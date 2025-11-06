# Trust Wallet PR Update Guide

**PR**: https://github.com/trustwallet/assets/pull/34216
**Status**: ⚠️ Open - Needs corrections and payment
**Author**: xalatechnologies

---

## ❌ Issues Found by Bot

The Trust Wallet bot flagged 3 issues:

1. ❌ **Twitter URL format** - Must use `x.com` not `twitter.com`
2. ❌ **"layer-1" tag** - Not permitted in Trust Wallet
3. ⚠️ **Payment required** - 500 TWT or 2.5 BNB

---

## ✅ FIXES APPLIED

I've updated `assets/trust-wallet-info.json` with the corrections:

### Fix 1: Twitter URL
```json
// ❌ OLD:
"url": "https://twitter.com/norchain"

// ✅ NEW:
"url": "https://x.com/norchain"
```

### Fix 2: Tags
```json
// ❌ OLD:
"tags": ["defi", "governance", "layer-1"]

// ✅ NEW:
"tags": ["defi", "governance"]
```

The "layer-1" tag is not permitted by Trust Wallet. We kept "defi" and "governance" which are acceptable.

---

## 🔄 HOW TO UPDATE YOUR PR

You need to update the info.json file in your existing PR.

### Option 1: Update via GitHub Web Interface (EASIEST)

1. Go to your fork: https://github.com/xalatechnologies/assets
2. Navigate to: `blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/info.json`
3. Click "Edit file" (pencil icon)
4. Replace the content with the fixed version below
5. Commit with message: "fix: update Twitter URL and remove unsupported tag"

**Fixed info.json content:**
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

### Option 2: Update via Git Command Line

If you have the assets repo cloned locally:

```bash
# 1. Navigate to your assets fork
cd path/to/assets

# 2. Make sure you're on the right branch
git checkout master
git pull origin master

# 3. Copy the fixed info.json
cp /Volumes/Development/sahalat/blockchain-v2/assets/trust-wallet-info.json \
   blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/info.json

# 4. Commit and push
git add blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/info.json
git commit -m "fix: update Twitter URL and remove unsupported tag"
git push origin master
```

**Result**: Your PR will automatically update with the fixes!

---

## 💰 PAYMENT REQUIREMENT

Trust Wallet requires payment to process token submissions:

**Options**:
- **500 TWT** (Trust Wallet Token)
- **2.5 BNB** (~$1,500 at current prices)

### How to Pay

1. **Get the payment address** from the bot comment on your PR
2. **Send exactly** 500 TWT or 2.5 BNB to that address
3. **Comment on the PR** with the transaction hash:
   ```
   Payment sent: 0xYOUR_TRANSACTION_HASH
   ```

### Where to Get TWT

**PancakeSwap** (recommended):
- Go to: https://pancakeswap.finance/swap
- Swap BNB → TWT
- Contract: 0x4B0F1812e5Df2A09796481Ff14017e6005508003
- You need 500 TWT

**Binance** (if you have account):
- Buy TWT directly
- Withdraw to your BSC wallet

### Payment Timeline

After payment:
- Bot verifies payment (5-30 min)
- Manual review by Trust Wallet team (3-7 days)
- PR merged if approved
- Logo appears in Trust Wallet & MetaMask (24-48 hours after merge)

---

## ⏱️ ESTIMATED TIMELINE

| Step | Time | Status |
|------|------|--------|
| **Update PR** | 5 min | ⏳ Pending |
| **Make payment** | 10 min | ⏳ Pending |
| **Bot verification** | 5-30 min | ⏳ After payment |
| **Manual review** | 3-7 days | ⏳ After bot approval |
| **PR merge** | Instant | ⏳ After approval |
| **Logo live** | 24-48 hours | ⏳ After merge |

**Total**: ~1 week from payment to logo appearing in wallets

---

## 📋 CHECKLIST

- [ ] Update info.json with fixed Twitter URL (x.com)
- [ ] Update info.json to remove "layer-1" tag
- [ ] Acquire 500 TWT or 2.5 BNB
- [ ] Send payment to Trust Wallet address
- [ ] Comment transaction hash on PR
- [ ] Wait for bot verification
- [ ] Wait for manual review (3-7 days)
- [ ] Verify logo appears in Trust Wallet
- [ ] Verify logo appears in MetaMask

---

## 🤔 Should You Pay?

**Consider**:
- ✅ Trust Wallet has 100M+ users
- ✅ MetaMask auto-fetches from Trust Wallet
- ✅ Logo shows in ALL wallets that use Trust Wallet assets
- ✅ Professional appearance
- ✅ One-time payment

**Alternatives** (if you prefer not to pay):
- CoinGecko logo (free, but only shows in CoinGecko)
- BSCScan logo (free, but only shows on BSCScan)
- Wait for organic listing (Trust Wallet may add popular tokens for free)

**Recommendation**: If budget allows, pay for Trust Wallet. It's the most comprehensive wallet logo solution.

---

## ❓ Common Questions

**Q: Do I have to pay?**
A: Yes, Trust Wallet requires payment for all token submissions since 2023. It helps prevent spam and ensures quality.

**Q: Is this a scam?**
A: No, this is Trust Wallet's official policy. The payment goes to Trust Wallet Foundation.

**Q: What if my PR is rejected after payment?**
A: Payments are non-refundable. Ensure your token meets all requirements before paying.

**Q: Can I use a different wallet service instead?**
A: Yes, but Trust Wallet is the industry standard. Most other wallets fetch logos from Trust Wallet's repository.

**Q: What if I don't pay?**
A: Your PR will remain open indefinitely but won't be reviewed or merged. Logo won't appear in wallets.

---

## 🔗 Useful Links

**Your PR**: https://github.com/trustwallet/assets/pull/34216
**Your Fork**: https://github.com/xalatechnologies/assets
**Trust Wallet Assets Repo**: https://github.com/trustwallet/assets
**TWT on PancakeSwap**: https://pancakeswap.finance/swap?outputCurrency=0x4B0F1812e5Df2A09796481Ff14017e6005508003

**Payment Info**: Check bot comment on your PR for payment address

---

## 📞 Need Help?

**Trust Wallet Support**: https://community.trustwallet.com/
**PR Discussion**: Comment directly on PR #34216

---

**Next Step**: Update your PR with the fixed info.json, then decide on payment! 🚀

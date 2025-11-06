# NOR Token Logo Submission Guide

**Date**: November 5, 2025
**Purpose**: Get NOR logo displayed on all wallets, DEX aggregators, and listing sites
**Logo File**: `/assets/nor-logo.svg`

---

## Quick Overview

### Logo Requirements by Platform

| Platform | Size | Format | Background | Approval Time |
|----------|------|--------|------------|---------------|
| **Trust Wallet** | 256x256 | PNG | Transparent | 3-7 days |
| **CoinGecko** | 200x200 | PNG | Any | 1-3 days |
| **CoinMarketCap** | 200x200 | PNG | Transparent preferred | 7-14 days |
| **BSCScan** | 256x256 | PNG | Transparent | Instant (manual) |
| **MetaMask** | Uses Trust Wallet | - | - | Automatic |
| **DexTools** | Auto-fetches | - | - | 24 hours |
| **DexScreener** | Auto-fetches | - | - | 24 hours |

---

## Step 1: Convert SVG to PNG

### Method A: Using Figma (Recommended - Free & Easy)

1. **Go to Figma** (figma.com - free account)

2. **Create new file**

3. **Import SVG**:
   - Drag `/assets/nor-logo.svg` into Figma
   - Or copy SVG code and paste

4. **Export PNGs**:
   ```
   Select logo → Export → PNG

   Create 4 exports:
   - 32x32 (favicon)
   - 64x64 (small icon)
   - 200x200 (standard)
   - 256x256 (large)
   ```

5. **Download** to `/assets/` folder

### Method B: Using CLI (ImageMagick)

```bash
# Install ImageMagick (if not installed)
brew install imagemagick  # Mac
# or
sudo apt-get install imagemagick  # Linux

# Convert SVG to various PNG sizes
cd /Volumes/Development/sahalat/blockchain-v2/assets

# 32x32 (favicon)
convert -background none -resize 32x32 nor-logo.svg nor-logo-32.png

# 64x64 (small icon)
convert -background none -resize 64x64 nor-logo.svg nor-logo-64.png

# 200x200 (standard - CoinGecko, CMC)
convert -background none -resize 200x200 nor-logo.svg nor-logo-200.png

# 256x256 (large - Trust Wallet, BSCScan)
convert -background none -resize 256x256 nor-logo.svg nor-logo-256.png
```

### Method C: Using Online Tool

1. Go to: https://svgtopng.com/
2. Upload `nor-logo.svg`
3. Set sizes: 32, 64, 200, 256
4. Download all versions

---

## Step 2: Trust Wallet Submission

**Why Important**: MetaMask uses Trust Wallet's asset repository

### Process

1. **Fork Trust Wallet Assets Repo**:
   ```bash
   # Go to: https://github.com/trustwallet/assets
   # Click "Fork" button
   ```

2. **Clone YOUR fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/assets.git
   cd assets
   ```

3. **Add NOR Token**:
   ```bash
   # Create directory for BNB Smart Chain (BSC)
   mkdir -p blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E

   # Copy logo
   cp /path/to/nor-logo-256.png \
      blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/logo.png
   ```

4. **Create info.json**:
   ```bash
   # Create token info file
   cat > blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/info.json << 'EOF'
   {
     "name": "Nor Token",
     "type": "BEP20",
     "symbol": "NOR",
     "decimals": 18,
     "website": "https://norchain.org",
     "description": "Nor Chain native token - A next-generation Layer-1 blockchain for compliant, halal finance",
     "explorer": "https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E",
     "status": "active",
     "id": "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E",
     "links": [
       {
         "name": "twitter",
         "url": "https://twitter.com/norchain"
       },
       {
         "name": "telegram",
         "url": "https://t.me/norchain"
       },
       {
         "name": "coinmarketcap",
         "url": "https://coinmarketcap.com/currencies/nor-token/"
       }
     ],
     "tags": [
       "defi",
       "governance"
     ]
   }
   EOF
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add Nor Token (NOR) - BEP20"
   git push origin master
   ```

6. **Create Pull Request**:
   - Go to your GitHub fork
   - Click "Pull Request"
   - Title: "Add Nor Token (NOR) - BEP20"
   - Description:
     ```
     Token Name: Nor Token
     Symbol: NOR
     Contract: 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
     Chain: BNB Smart Chain (BSC)

     Liquidity: $80 on PancakeSwap (3 pairs)
     Website: https://norchain.org
     Explorer: https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E

     Logo meets requirements:
     - 256x256 PNG
     - Transparent background
     - File size < 100KB
     ```
   - Submit

7. **Wait for approval**: 3-7 days

**Once approved**: Logo appears in Trust Wallet AND MetaMask automatically!

---

## Step 3: CoinGecko Submission

**Why Important**: Fastest price aggregator, used by many wallets

### Process

1. **Go to CoinGecko**:
   ```
   https://www.coingecko.com/en/coins/new
   ```

2. **Fill out form**:

   **Token Details**:
   ```
   Token Name: Nor Token
   Symbol: NOR
   Platform: BNB Smart Chain (BSC)
   Contract Address: 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
   ```

   **Project Information**:
   ```
   Website: https://norchain.org
   Whitepaper: https://norchain.org/whitepaper.pdf

   Description:
   Nor Chain (نور - "Light") is a next-generation Layer-1 blockchain
   engineered to illuminate the future of compliant finance with
   decentralized innovation. NOR is the native token powering the
   Nor Chain ecosystem, used for gas fees, staking, governance,
   and liquidity provision.
   ```

   **Social Links**:
   ```
   Twitter: https://twitter.com/norchain
   Telegram: https://t.me/norchain
   Discord: https://discord.gg/norchain
   GitHub: https://github.com/norchain
   ```

   **Trading Data**:
   ```
   DEX: PancakeSwap V2
   Pair 1: NOR/BNB (https://pancakeswap.finance/...)
   Pair 2: NOR/USDT (https://pancakeswap.finance/...)
   Pair 3: NOR/ETH (https://pancakeswap.finance/...)

   Total Liquidity: $80
   24h Volume: $... (fill actual volume)
   ```

3. **Upload logo**:
   - Use `nor-logo-200.png`
   - Transparent background
   - File size < 5MB

4. **Provide proof of legitimacy**:
   ```
   We are the official NOR Token team.

   Proof:
   - Contract verified on BSCScan
   - Liquidity locked on PancakeSwap
   - Official website: norchain.org
   - GitHub: github.com/norchain
   ```

5. **Submit**

6. **Wait for approval**: 1-3 days

**After approval**: Price shows in CoinGecko + many wallets auto-update

---

## Step 4: CoinMarketCap Submission

**Why Important**: Most visited crypto site, critical for credibility

### Process

1. **Go to CoinMarketCap**:
   ```
   https://coinmarketcap.com/request/
   ```

2. **Select "Add New Cryptocurrency"**

3. **Fill Comprehensive Form**:

   **Project Details**:
   ```
   Project Name: Nor Chain
   Ticker Symbol: NOR
   Blockchain Platform: BNB Smart Chain
   Contract Address: 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
   ```

   **URLs**:
   ```
   Website: https://norchain.org
   Block Explorer: https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
   Whitepaper: https://norchain.org/whitepaper.pdf
   Source Code: https://github.com/norchain/blockchain-v2
   ```

   **Social Media**:
   ```
   Twitter: https://twitter.com/norchain (follower count)
   Telegram: https://t.me/norchain (member count)
   Discord: https://discord.gg/norchain
   Reddit: https://reddit.com/r/norchain (if exists)
   Medium: https://medium.com/@norchain
   ```

   **Token Economics**:
   ```
   Total Supply: 21,000,000,000 NOR (21 billion)
   Circulating Supply: 10,000,000 NOR (10 million)
   Max Supply: 21,000,000,000 NOR

   ICO Date: N/A (fair launch)
   ICO Price: N/A
   ```

   **Trading Information**:
   ```
   Exchange: PancakeSwap V2 (BSC)
   Trading Pairs:
   - NOR/BNB (TX: 0x05f342...)
   - NOR/USDT (TX: 0xe8fd98...)
   - NOR/ETH (TX: 0x768340...)

   Launch Date: November 5, 2025
   ```

4. **Upload supporting documents**:
   ```
   Required:
   - Logo (200x200 PNG, transparent)
   - Project description (500-1000 words)
   - Team information (LinkedIn profiles)
   - Proof of liquidity (BSCScan screenshots)
   - Contract verification link
   ```

5. **Verification questions**:
   ```
   Q: Are you representing the project officially?
   A: Yes, I am [Your Name], [Your Title] at Nor Chain Foundation

   Q: How did you hear about CMC?
   A: Industry standard for crypto listings

   Q: Any paid promotions planned?
   A: [Yes/No - be honest]
   ```

6. **Submit**

7. **Respond to emails** (CMC may ask follow-ups)

8. **Wait for approval**: 7-14 days

**After approval**: Price shows on CMC + major SEO boost

---

## Step 5: BSCScan Logo Update

**Why Important**: Most visited BSC explorer, builds trust

### Process

**Method 1: Manual Update (Instant)**

1. **Go to BSCScan**:
   ```
   https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
   ```

2. **Click "Update Token Info"** (need to be contract owner)

3. **Upload logo**:
   - File: `nor-logo-256.png`
   - Format: PNG with transparent background
   - Size: 256x256 pixels

4. **Fill details**:
   ```
   Website: https://norchain.org
   Email: contact@norchain.org
   Social Media: Twitter, Telegram, Discord links
   ```

5. **Submit** → Appears instantly

**Method 2: Email BSCScan**

If you don't have owner access:

```
To: info@bscscan.com
Subject: Logo Update Request - NOR Token (0x7C9B26...6dE)

Hello BSCScan Team,

I am requesting a logo update for NOR Token:

Contract: 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
Token Name: Nor Token
Symbol: NOR
Network: BNB Smart Chain

Logo attached (256x256 PNG, transparent background)

Website: https://norchain.org
Verified Contract: [BSCScan link]

Thank you,
[Your Name]
[Your Title]
Nor Chain Foundation
```

Attach: `nor-logo-256.png`

**Response time**: 1-3 business days

---

## Step 6: DexTools & DexScreener (Automatic)

**Good News**: These platforms auto-fetch logos from Trust Wallet or CoinGecko!

### DexTools

1. **Wait for Trust Wallet approval** (3-7 days)
2. **DexTools auto-fetches** within 24 hours
3. **Verify**:
   ```
   https://www.dextools.io/app/en/bnb/pair-explorer/0x7c9b26ad3b26caab39f9945b40b2c30309ed490e
   ```

**Manual option** (if slow):
```
Contact: support@dextools.io
Subject: Logo not showing for NOR Token

Contract: 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
Trust Wallet PR: [link to your PR]
CoinGecko: [link to listing]
```

### DexScreener

1. **Automatically updates** from CoinGecko (1-2 days after CoinGecko approval)
2. **Verify**:
   ```
   https://dexscreener.com/bsc/0x7c9b26ad3b26caab39f9945b40b2c30309ed490e
   ```

**No manual submission needed** - Just wait for CoinGecko approval

---

## Step 7: Verification Checklist

### After All Submissions

**Week 1**:
- [ ] SVG logo created (`nor-logo.svg`)
- [ ] PNG versions exported (32, 64, 200, 256)
- [ ] Trust Wallet PR submitted
- [ ] CoinGecko application submitted
- [ ] CoinMarketCap application submitted
- [ ] BSCScan logo updated

**Week 2-3**:
- [ ] Trust Wallet PR approved (check email)
- [ ] CoinGecko listing live (check website)
- [ ] Logo appears in MetaMask (auto from Trust Wallet)
- [ ] Logo appears in DexTools (check pairs)
- [ ] Logo appears in DexScreener (check token page)

**Week 3-4**:
- [ ] CoinMarketCap listing live (check website)
- [ ] BSCScan logo confirmed (check explorer)
- [ ] All wallet apps showing logo

---

## Common Issues & Solutions

### Issue 1: Trust Wallet PR Rejected

**Reasons**:
```
- Logo file too large (> 100KB)
- Logo not transparent
- Logo not 256x256
- Token not verified on BSCScan
- Insufficient liquidity (< $1k)
```

**Solutions**:
```
1. Compress PNG (use tinypng.com)
2. Re-export with transparent background
3. Verify exact dimensions (256x256)
4. Verify contract on BSCScan
5. Add more liquidity (target $1k+)
6. Resubmit PR with fixes
```

### Issue 2: CoinGecko Delays

**Reasons**:
```
- Low liquidity (< $1k)
- Low volume (< $100/day)
- Incomplete social media
- No whitepaper
- Suspicious activity
```

**Solutions**:
```
1. Increase liquidity to $1k+
2. Generate trading volume ($100+/day)
3. Complete all social profiles
4. Write whitepaper (even 5-10 pages)
5. Send follow-up email after 7 days
```

### Issue 3: CoinMarketCap Very Slow

**Reality**: CMC is notoriously slow (2-4 weeks common)

**Solutions**:
```
1. Be patient (check email daily)
2. Respond to ALL follow-up questions immediately
3. Provide DETAILED information upfront
4. Get CoinGecko listing first (helps CMC approval)
5. Consider paid "fast track" ($5k) if urgent
```

### Issue 4: Logo Not Updating in Wallets

**Causes**:
```
- Trust Wallet PR not merged yet
- Wallet cache not refreshed
- Wrong contract address
```

**Solutions**:
```
1. Check Trust Wallet PR status
2. Clear wallet cache (reinstall app)
3. Wait 24-48 hours after PR merge
4. Try different wallet (test with fresh install)
```

---

## Marketing Boost After Logo Approval

### Social Media Announcements

**When Trust Wallet approves**:
```
🎨 NOR Token Logo Now Live!

Your NOR balance now shows with our official logo in:
✅ Trust Wallet
✅ MetaMask
✅ All major wallets

Trade NOR: pancakeswap.finance
Contract: 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E

#NorChain #TrustWallet #MetaMask
```

**When CoinGecko lists**:
```
📊 NOR Token Listed on CoinGecko!

✅ Live price tracking
✅ Market cap data
✅ Trading volume
✅ Official logo

Check us out: [CoinGecko link]

#NorChain #CoinGecko #Listed
```

**When CoinMarketCap lists**:
```
🚀 MAJOR MILESTONE: CMC Listing!

NOR Token is now on CoinMarketCap - the world's #1 crypto data platform!

✅ Global exposure
✅ Institutional visibility
✅ Price tracking

View listing: [CMC link]

This is just the beginning! 🌙

#NorChain #CoinMarketCap #Listed
```

---

## Timeline Summary

| Platform | Submission Time | Approval Time | Total |
|----------|----------------|---------------|-------|
| **BSCScan** | 5 min | Instant | 5 min |
| **Trust Wallet** | 30 min | 3-7 days | 3-7 days |
| **MetaMask** | Auto (Trust Wallet) | 24h after Trust Wallet | 4-8 days |
| **CoinGecko** | 20 min | 1-3 days | 1-3 days |
| **DexTools** | Auto (Trust Wallet) | 24h after Trust Wallet | 4-8 days |
| **DexScreener** | Auto (CoinGecko) | 1-2 days | 2-5 days |
| **CoinMarketCap** | 45 min | 7-14 days | 7-14 days |

**Realistic Timeline**:
- Day 1: Submit all (BSCScan instant)
- Day 3-7: Trust Wallet + CoinGecko approve
- Day 4-8: MetaMask, DexTools, DexScreener show logo
- Day 10-20: CoinMarketCap approves

**Result**: Full logo coverage across ecosystem within 2-3 weeks!

---

## Budget

### Free Submissions
- ✅ Trust Wallet (free, just requires GitHub PR)
- ✅ CoinGecko (free listing)
- ✅ CoinMarketCap (free listing)
- ✅ BSCScan (free, just requires owner access or email)
- ✅ DexTools (auto-fetches, free)
- ✅ DexScreener (auto-fetches, free)

### Paid Options (Optional Speed-Up)
- CoinMarketCap Fast Track: $5,000 (7 days → 2 days)
- Logo Design Service: $100-500 (if you want professional designer)
- Marketing Package: $1,000-5,000 (some listing sites offer promotion)

**Recommended**: Just use free options, be patient!

---

## Conclusion

**Action Plan**:
1. ✅ **Today**: Convert SVG to PNGs
2. ✅ **Today**: Submit to BSCScan (instant)
3. ✅ **Today**: Submit Trust Wallet PR (3-7 days)
4. ✅ **Today**: Submit CoinGecko application (1-3 days)
5. ✅ **Tomorrow**: Submit CoinMarketCap application (7-14 days)
6. ⏳ **Week 1-2**: Follow up on approvals
7. ⏳ **Week 2-3**: Celebrate listings on social media!

**Total Time Investment**: 2-3 hours
**Total Cost**: $0
**Result**: Professional logo across entire ecosystem

---

**Document**: Logo submission guide
**Files**:
- `/assets/nor-logo.svg` (created)
- `/assets/nor-logo-32.png` (need to create)
- `/assets/nor-logo-64.png` (need to create)
- `/assets/nor-logo-200.png` (need to create)
- `/assets/nor-logo-256.png` (need to create)

**Next Steps**: Run PNG conversion commands, then start submissions!

---

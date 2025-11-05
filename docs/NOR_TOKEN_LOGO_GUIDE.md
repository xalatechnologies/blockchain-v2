# Adding NOR Token Logo

**Goal**: Display NOR token logo in MetaMask, Trust Wallet, BSCScan, and other platforms.

---

## 📸 Logo Requirements

### Image Specifications

- **Format**: PNG (with transparency)
- **Size**: 256x256 pixels (exactly)
- **Background**: Transparent
- **File size**: < 100 KB
- **Quality**: High resolution, clear, professional

### Design Tips

- Simple, recognizable design
- Works well at small sizes (32x32)
- Clear contrast
- Brand consistent
- No text (symbol/icon only)

---

## 🎨 Option 1: Create Logo (Quick)

If you don't have a logo yet, you can use:

### Online Tools:
- **Canva**: https://canva.com (free templates)
- **LogoMakr**: https://logomakr.com
- **Looka**: https://looka.com

### AI Tools:
- **DALL-E**: https://openai.com/dall-e
- **Midjourney**: https://midjourney.com
- **Stable Diffusion**: https://stablediffusionweb.com

### Example Prompt for AI:
```
"Create a minimalist logo for 'NOR' cryptocurrency token,
golden/light themed, blockchain style, transparent background,
256x256px, simple icon"
```

---

## 📋 Option 2: Use Placeholder

For testing, you can use this placeholder generator:

1. Go to: https://via.placeholder.com/256x256/FFD700/FFFFFF?text=NOR
2. Right-click → Save image as `logo.png`
3. Upload to your server/CDN

---

## 🚀 Submit Logo to Trust Wallet (MetaMask will show it)

### Step 1: Fork Trust Wallet Assets Repository

1. Go to: https://github.com/trustwallet/assets
2. Click **"Fork"** (top right)
3. Wait for fork to complete

### Step 2: Prepare Your Files

Create this folder structure:
```
assets/
  blockchains/
    smartchain/  (BSC = smartchain)
      assets/
        0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/
          logo.png
          info.json
```

### Step 3: Create info.json

Create `info.json` with this content:

```json
{
  "name": "Nor",
  "type": "BEP20",
  "symbol": "NOR",
  "decimals": 18,
  "website": "https://norchain.org",
  "description": "Nor is the native token of NorChain, a Layer-1 blockchain for compliant decentralized finance.",
  "explorer": "https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E",
  "status": "active",
  "id": "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E",
  "links": [
    {
      "name": "github",
      "url": "https://github.com/yourusername/norchain"
    },
    {
      "name": "twitter",
      "url": "https://twitter.com/norchain"
    },
    {
      "name": "telegram",
      "url": "https://t.me/norchain"
    }
  ],
  "tags": [
    "defi",
    "dex"
  ]
}
```

### Step 4: Add Your Files

1. **Upload to your fork**:
   - Navigate to: `blockchains/smartchain/assets/`
   - Click **"Add file"** → **"Create new file"**
   - Name: `0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/info.json`
   - Paste the JSON content above

2. **Upload logo**:
   - In the same folder, click **"Add file"** → **"Upload files"**
   - Upload your `logo.png` (256x256, < 100KB)

### Step 5: Create Pull Request

1. Commit changes to your fork
2. Go to your forked repository
3. Click **"Pull Request"**
4. Title: `Add NOR (BSC) token`
5. Description:
   ```
   Adding NOR token from NorChain

   - Contract: 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
   - Network: Binance Smart Chain (BSC)
   - Verified: https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E

   Logo meets requirements (256x256 PNG, transparent)
   ```
6. Submit PR

### Step 6: Wait for Approval

- Trust Wallet team reviews PRs (usually 1-7 days)
- Once merged, logo will appear in:
  - ✅ Trust Wallet
  - ✅ MetaMask
  - ✅ CoinGecko (if listed)
  - ✅ 1inch
  - ✅ Most DEX aggregators

---

## 🔍 Submit to BSCScan

### Step 1: Verify Contract (Required)

```bash
npx hardhat verify --network bsc 0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
```

If you need BSCScan API key:
1. Go to: https://bscscan.com/myapikey
2. Sign up/login
3. Create API key
4. Add to `.env`: `BSCSCAN_API_KEY=your_key`

### Step 2: Update Token Info on BSCScan

1. Go to: https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
2. Click **"Update Token Info"** (requires login)
3. Fill in form:

**Token Information**:
- Token Name: `Nor`
- Symbol: `NOR`
- Decimals: `18`
- Website: `https://norchain.org`
- Logo: Upload your 256x256 PNG

**Optional**:
- Blog: Your blog URL
- Reddit: Your subreddit
- Slack: Your Slack invite
- Facebook: Your Facebook page
- Twitter: `@norchain`
- Telegram: `https://t.me/norchain`
- Github: Your GitHub repo
- Email: contact@norchain.org
- Whitepaper: Link to whitepaper PDF

4. Submit form

### Step 3: Wait for Approval

- BSCScan reviews updates (1-3 days)
- Once approved, logo appears on BSCScan

---

## ⚡ Quick Alternative: Host Logo on IPFS

If you want immediate logo support (while waiting for Trust Wallet approval):

### Step 1: Upload to IPFS

1. Go to: https://www.pinata.cloud (free account)
2. Upload your `logo.png`
3. Get IPFS URL: `ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
4. Convert to HTTP: `https://ipfs.io/ipfs/QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### Step 2: Update Your Website

Add metadata to your website at `norchain.org/token/nor.json`:

```json
{
  "name": "Nor",
  "symbol": "NOR",
  "address": "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E",
  "decimals": 18,
  "image": "https://ipfs.io/ipfs/YOUR_IPFS_HASH",
  "chainId": 56
}
```

### Step 3: Add to Token Lists

Submit to popular token lists:
- **Uniswap**: https://github.com/Uniswap/token-lists
- **CoinGecko**: https://www.coingecko.com/en/coins/new
- **CoinMarketCap**: https://coinmarketcap.com/request/

---

## 📱 Temporary Solution: MetaMask Custom Image

While waiting for official logo approval:

### On Desktop:
1. Install **MetaMask Token Image** extension
2. Configure custom token images
3. Add NOR logo manually

### On Mobile:
- Unfortunately, mobile apps require official Trust Wallet approval
- No temporary workaround available

---

## ✅ Checklist

**Before Submitting**:
- [ ] Logo is 256x256 PNG
- [ ] Background is transparent
- [ ] File size < 100 KB
- [ ] Logo is clear and professional
- [ ] Contract is verified on BSCScan
- [ ] info.json is correctly formatted
- [ ] All social links are working

**After Submitting**:
- [ ] Trust Wallet PR submitted
- [ ] BSCScan token info updated
- [ ] Logo hosted on IPFS (backup)
- [ ] Added to website metadata
- [ ] Submitted to CoinGecko (optional)
- [ ] Submitted to CoinMarketCap (optional)

---

## 🎯 Expected Timeline

| Platform | Submission Time | Approval Time |
|----------|----------------|---------------|
| Trust Wallet (MetaMask) | 30 min | 1-7 days |
| BSCScan | 10 min | 1-3 days |
| IPFS (immediate) | 5 min | Instant |
| CoinGecko | 20 min | 7-14 days |
| CoinMarketCap | 20 min | 7-30 days |

---

## 🔧 Tools & Resources

**Logo Creation**:
- Canva: https://canva.com
- Figma: https://figma.com
- GIMP (free): https://gimp.org

**Logo Hosting**:
- Pinata (IPFS): https://pinata.cloud
- Cloudinary: https://cloudinary.com

**Token Lists**:
- Trust Wallet: https://github.com/trustwallet/assets
- Uniswap: https://github.com/Uniswap/token-lists

**Verification**:
- BSCScan: https://bscscan.com
- Hardhat Verify: https://hardhat.org/plugins/nomiclabs-hardhat-etherscan

---

## 💡 Pro Tips

1. **Logo Quality Matters**: A professional logo increases trust and recognition
2. **Submit Everywhere**: The more platforms, the better visibility
3. **Be Patient**: Official approvals take time but are worth it
4. **Use IPFS**: Provides decentralized, permanent hosting
5. **Keep Consistent**: Use same logo across all platforms
6. **Update Website**: Add logo and token info to official site
7. **Social Proof**: Active social media helps approval process

---

## ❓ FAQ

**Q: Can I change the logo later?**
A: Yes, submit a new PR to Trust Wallet with updated logo.

**Q: My PR was rejected, why?**
A: Common reasons:
- Wrong image size
- Too large file size
- Not transparent background
- Incorrect folder structure
- Missing info.json

**Q: How long until MetaMask shows my logo?**
A: MetaMask pulls from Trust Wallet. Usually 1-2 weeks after PR is merged.

**Q: Do I need a logo to trade?**
A: No, but it greatly improves user experience and trust.

---

**Need Help?**
- Trust Wallet Discord: https://discord.gg/trustwallet
- BSCScan Support: https://bscscan.com/contactus

---

**Status**: Ready to submit once logo is created!
**Priority**: High - Improves token discoverability

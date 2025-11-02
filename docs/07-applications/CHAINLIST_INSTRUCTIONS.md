# 📋 CHAINLIST SUBMISSION GUIDE

## Step-by-Step Instructions

### 1. Go to GitHub Repository
Visit: https://github.com/ethereum-lists/chains

### 2. Fork the Repository
- Click "Fork" button (top right)
- This creates a copy in your GitHub account

### 3. Add Xaheen Chain File
Navigate to: `_data/chains/`

Create new file: `eip155-65001.json`

Copy content from: `chainlist-submission.json` (in this repo)

### 4. Add Chain Icon (Optional but Recommended)
Navigate to: `_data/icons/`

Create new file: `xaheen.json`

**Icon JSON Format:**
```json
[
  {
    "url": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "width": 256,
    "height": 256,
    "format": "png"
  }
]
```

**To get IPFS hash:**
1. Upload your logo (256x256 PNG) to IPFS via https://app.pinata.cloud/ or https://nft.storage/
2. Copy the IPFS hash (e.g., `QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
3. Use format: `ipfs://YOUR_HASH`

**Alternative (simpler):** You can skip the icon initially and add it later after the chain is accepted.

### 5. Commit Changes
Commit message: "Add Xaheen Chain (Chain ID: 65001)"

### 6. Create Pull Request
- Click "Contribute" → "Open Pull Request"
- Title: "Add Xaheen Chain (Chain ID: 65001)"
- Description:
```
Adding Xaheen Chain - Fast EVM-compatible Layer 1 blockchain

**Chain Details:**
- Chain ID: 65001
- Network ID: 65001
- RPC: https://rpc.xaheen.org
- Explorer: https://explorer.xaheen.org
- Block Time: 3 seconds
- Consensus: Parlia (PoSA)

**Features:**
- Native DEX
- Cross-chain bridges (BSC/ETH/Tron)
- Near-zero gas fees
- Full EVM compatibility

**Website:** https://xaheen.org
**Documentation:** https://docs.xaheen.org
```

### 7. Wait for Approval
- Usually takes 24-48 hours
- Maintainers will review
- Once merged, Xaheen appears on chainlist.org

### 8. After Approval
Users can add Xaheen to MetaMask by:
1. Visit https://chainlist.org
2. Search "Xaheen" or "65001"
3. Click "Add to MetaMask"
4. Done! ✅

---

## Alternative: Manual MetaMask Addition

Until Chainlist approval, users can add manually:

**MetaMask → Settings → Networks → Add Network:**

```
Network Name: Xaheen Chain
RPC URL: https://rpc.xaheen.org
Chain ID: 65001
Currency Symbol: XHT
Block Explorer: https://explorer.xaheen.org
```

---

## What This Achieves:

✅ Anyone can add Xaheen to MetaMask with 1 click
✅ Appears in major wallet providers
✅ Legitimacy and discoverability
✅ No cost, pure visibility

---

## Next Steps After Chainlist:

1. Tweet announcement with Chainlist link
2. Post on Reddit crypto subreddits
3. Share in Telegram/Discord groups
4. Developer outreach
5. Validator recruitment

**This is the first step to making Xaheen a public blockchain!** 🚀

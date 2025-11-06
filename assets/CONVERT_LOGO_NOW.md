# Convert NOR Logo to PNG - Quick Instructions

**File**: `/assets/nor-logo.svg` ✅ Created

---

## FASTEST METHOD (2 minutes):

### Go to: https://svgtopng.com/

1. **Upload** `nor-logo.svg`
2. **Set dimensions**:
   - 32x32
   - 64x64
   - 200x200
   - 256x256
3. **Download** all 4 PNGs
4. **Rename** and save to `/assets/` folder:
   - `nor-logo-32.png`
   - `nor-logo-64.png`
   - `nor-logo-200.png`
   - `nor-logo-256.png`

**Done!** Now you can submit logos immediately.

---

## Alternative: Use Figma (free, 5 minutes)

1. Go to **figma.com** (create free account)
2. Create new file
3. **Drag** `nor-logo.svg` into canvas
4. Select logo → **Export** → PNG
5. Set sizes: 32, 64, 200, 256
6. Download all

---

## After Conversion:

### 1. BSCScan (IMMEDIATE - 5 min)

Go to your token page:
```
https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
```

Click "Update Token Info" → Upload `nor-logo-256.png`

**Result**: Logo shows instantly on BSCScan!

---

### 2. Trust Wallet Submission (3-7 days)

Follow guide: `/docs/LOGO_SUBMISSION_GUIDE.md` Section "Step 2"

Quick command:
```bash
# Fork: https://github.com/trustwallet/assets
# Then clone your fork and run:

git clone https://github.com/YOUR_USERNAME/assets.git
cd assets

# Create directory
mkdir -p blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E

# Copy logo
cp /path/to/nor-logo-256.png \
   blockchains/smartchain/assets/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E/logo.png

# Create info.json (see full guide for template)
# Then commit and PR
```

---

### 3. CoinGecko (1-3 days)

Go to: https://www.coingecko.com/en/coins/new

Fill form, upload `nor-logo-200.png`

---

### 4. CoinMarketCap (7-14 days)

Go to: https://coinmarketcap.com/request/

Fill comprehensive form, upload `nor-logo-200.png`

---

## Priority Order

**Do in this order for fastest results**:

1. ✅ **BSCScan** (5 min, instant result)
2. ✅ **Trust Wallet PR** (30 min, 3-7 days approval)
3. ✅ **CoinGecko** (20 min, 1-3 days approval)
4. ⏳ **CoinMarketCap** (45 min, 7-14 days approval)

**Result**: Full logo coverage in 2-3 weeks!

---

**Full documentation**: `/docs/LOGO_SUBMISSION_GUIDE.md`

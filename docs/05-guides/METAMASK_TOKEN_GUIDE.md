# 📱 ADDING TOKENS TO METAMASK - COMPLETE GUIDE

## Issue: Symbol and Decimals Don't Auto-Fill

When you add `0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B` to MetaMask, the symbol and decimals don't show up automatically.

**This is NORMAL!** You need to enter them manually.

---

## ✅ SOLUTION: Manual Entry

### Step-by-Step for WBNB:

**1. Open MetaMask**
- Make sure you're on **Nor Chain** network
- Chain ID should show: 65001

**2. Click "Import tokens"**
- At the bottom of token list
- Or click "Assets" tab → "Import tokens"

**3. Enter Token Details:**

```
Token Contract Address: 0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B
Token Symbol: WBNB
Token Decimal: 18
```

**4. Click "Add Custom Token"**

**5. Click "Import Tokens"**

**6. Done!** You should now see your WBNB balance: **0.00998 WBNB**

---

## 🎯 ALL TOKEN ADDRESSES FOR XAHEEN CHAIN

### WBNB (Wrapped BNB)
```
Address: 0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B
Symbol: WBNB
Decimals: 18
Name: Wrapped BNB
```

### WUSDT (Wrapped USDT)
```
Address: 0xA0de216D0bF10E9a40C0666FB3De458e3AEB70F5
Symbol: WUSDT
Decimals: 18
Name: Wrapped USDT
```

### WETH (Wrapped ETH)
```
Address: 0xF1C1dc0263686093389Fbd66c2951122B2133aEA
Symbol: WETH
Decimals: 18
Name: Wrapped Ethereum
```

---

## 📸 Visual Guide:

### Before Import:
```
MetaMask shows:
┌─────────────────────────┐
│ Import tokens           │
├─────────────────────────┤
│ Token address:          │
│ [0x5E2A669Bd0...]      │
│                         │
│ Token symbol:           │
│ [        ]              │ ← Empty!
│                         │
│ Token decimal:          │
│ [        ]              │ ← Empty!
└─────────────────────────┘
```

### After Manual Entry:
```
MetaMask shows:
┌─────────────────────────┐
│ Import tokens           │
├─────────────────────────┤
│ Token address:          │
│ [0x5E2A669Bd0...]      │
│                         │
│ Token symbol:           │
│ [WBNB]                 │ ← Filled!
│                         │
│ Token decimal:          │
│ [18]                   │ ← Filled!
└─────────────────────────┘
```

---

## ❓ WHY DOESN'T IT AUTO-FILL?

MetaMask tries to read `name()`, `symbol()`, and `decimals()` from the contract, but:

1. **Network delays** - Nor RPC might be slow
2. **Contract not indexed** - MetaMask hasn't cached it yet
3. **First time** - Token is new, MetaMask doesn't know it

**Solution:** Just enter manually! It's normal for new tokens.

---

## 🔍 HOW TO VERIFY IT'S THE RIGHT TOKEN:

### Method 1: Check on Nor Explorer

1. Go to: https://explorer.xaheen.org/address/0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B
2. Should show:
   - Name: Wrapped BNB
   - Symbol: WBNB
   - Decimals: 18
   - Total Supply: 0.00998 (your test amount!)

### Method 2: Check Contract on Hardhat

```bash
npx hardhat run scripts/check-token.js --network btcbr
```

---

## 🎨 QUICK COPY-PASTE TABLE:

| Token | Address | Symbol | Decimals |
|-------|---------|--------|----------|
| WBNB | `0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B` | WBNB | 18 |
| WUSDT | `0xA0de216D0bF10E9a40C0666FB3De458e3AEB70F5` | WUSDT | 18 |
| WETH | `0xF1C1dc0263686093389Fbd66c2951122B2133aEA` | WETH | 18 |

---

## 💡 PRO TIP: Create Token List

You can create a token list file for easy import:

**Create file: `xaheen-tokens.json`**

```json
{
  "name": "Nor Chain Tokens",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "tokens": [
    {
      "chainId": 65001,
      "address": "0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B",
      "name": "Wrapped BNB",
      "symbol": "WBNB",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"
    },
    {
      "chainId": 65001,
      "address": "0xA0de216D0bF10E9a40C0666FB3De458e3AEB70F5",
      "name": "Wrapped USDT",
      "symbol": "WUSDT",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/325/small/Tether.png"
    },
    {
      "chainId": 65001,
      "address": "0xF1C1dc0263686093389Fbd66c2951122B2133aEA",
      "name": "Wrapped Ethereum",
      "symbol": "WETH",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
    }
  ]
}
```

**Host this file publicly, then:**
- MetaMask → Settings → Networks → Nor Chain → Token List
- Add your URL

---

## 🚀 AFTER ADDING TOKEN:

You should see:

```
MetaMask on Nor Chain:
┌─────────────────────────┐
│ Assets                  │
├─────────────────────────┤
│ NOR                     │
│ 20,189,999,999.86       │
│                         │
│ WBNB                    │
│ 0.00998                │ ← Your bridged BNB!
└─────────────────────────┘
```

---

## 🎯 COMMON ISSUES:

### "Invalid address"
- Check you copied the full address
- Make sure you're on Nor network (Chain ID 65001)

### "Token already added"
- Good! It's already there
- Check your asset list

### "Balance shows 0"
- Wait 30-60 seconds for balance to update
- Check transaction was successful on explorer
- Verify validator minted the tokens (check PM2 logs)

### "Can't see token even after adding"
- Scroll down in asset list
- Click "Refresh list"
- Try removing and re-adding

---

## 📋 VERIFICATION CHECKLIST:

After adding WBNB, verify:

- [ ] Token appears in asset list
- [ ] Symbol shows as "WBNB"
- [ ] Balance shows 0.00998 WBNB
- [ ] Network is Nor Chain (65001)
- [ ] Can click token to see details

---

## 🔗 USEFUL LINKS:

**Nor Explorer:**
- WBNB: https://explorer.xaheen.org/address/0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B
- WUSDT: https://explorer.xaheen.org/address/0xA0de216D0bF10E9a40C0666FB3De458e3AEB70F5
- WETH: https://explorer.xaheen.org/address/0xF1C1dc0263686093389Fbd66c2951122B2133aEA

**Your Wallet:**
- https://explorer.xaheen.org/address/0xdD779a290C937144F80Eb75b75d814c834536B1b

---

## 💰 WHAT TO DO NEXT:

Now that you can see your WBNB:

1. **Swap it for NOR** on your DEX
   - You earn 0.3% fee!

2. **Trade NOR**
   - You earn 0.3% on every trade!

3. **Bridge more assets**
   - Test USDT bridge
   - Test ETH bridge

---

**REMEMBER:** Manual entry is NORMAL for new tokens!

**Just copy these 3 things:**
1. Address: `0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B`
2. Symbol: `WBNB`
3. Decimals: `18`

**Done!** 🎉

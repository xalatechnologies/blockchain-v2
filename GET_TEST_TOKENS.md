# 🪙 GET TEST TOKENS FOR BRIDGE TESTING

## Current Balances:
- ✅ BNB: 0.148 BNB (~$89) - Good!
- ⚠️ USDT: 0.009 USDT (~$0.01) - Need more
- ⚠️ ETH: 0 ETH - Need to buy

**Target:**
- 15 USDT (for testing)
- 0.01 ETH (for testing)

---

## Option 1: Via PancakeSwap (EASIEST)

### Get USDT:

1. **Go to PancakeSwap:**
   ```
   https://pancakeswap.finance/swap
   ```

2. **Connect MetaMask** (BSC network)

3. **Swap BNB → USDT:**
   - From: BNB
   - To: USDT (BSC-USD - 0x55d398326f99059fF775485246999027B3197955)
   - Amount: 0.03 BNB (~$18) → will get ~15 USDT
   - Click "Swap"
   - Confirm in MetaMask

4. **Wait 10 seconds** - you'll have USDT!

---

### Get ETH:

1. **On same PancakeSwap page:**
   ```
   https://pancakeswap.finance/swap
   ```

2. **Swap BNB → ETH:**
   - From: BNB
   - To: ETH (Binance-Peg Ethereum - 0x2170Ed0880ac9A755fd29B2688956BD959F933F8)
   - Amount: 0.03 BNB (~$18) → will get ~0.007 ETH
   - Click "Swap"
   - Confirm in MetaMask

3. **Wait 10 seconds** - you'll have ETH!

**Total cost:** ~0.06 BNB (~$36) + gas (~$0.50)

---

## Option 2: Via 1inch (Better Rates)

1. **Go to 1inch:**
   ```
   https://app.1inch.io/#/56/simple/swap/BNB
   ```

2. **Connect MetaMask** (BSC network)

3. **Swap BNB → USDT:**
   - Select USDT: 0x55d398326f99059fF775485246999027B3197955
   - Amount: 0.03 BNB
   - Get best rate
   - Swap!

4. **Swap BNB → ETH:**
   - Select ETH: 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
   - Amount: 0.03 BNB
   - Swap!

---

## Option 3: Via Script (ADVANCED)

We can create a script to swap via PancakeSwap Router directly, but manual is easier!

---

## After Getting Tokens:

### 1. Verify Balances:
```bash
npx hardhat run scripts/check-bsc-balances.js --network bsc
```

Should show:
- ✅ USDT: ~15 USDT
- ✅ ETH: ~0.007 ETH

---

### 2. Test USDT Bridge:
```bash
npx hardhat run scripts/test-usdt-bridge.js --network bsc
```

---

### 3. Test ETH Bridge:
```bash
npx hardhat run scripts/test-eth-bridge.js --network bsc
```

---

## Token Addresses (Copy for PancakeSwap):

**USDT (BSC):**
```
0x55d398326f99059fF775485246999027B3197955
```

**ETH (Binance-Peg Ethereum):**
```
0x2170Ed0880ac9A755fd29B2688956BD959F933F8
```

---

## Quick Reference:

| What | Where | Cost |
|------|-------|------|
| Get USDT | PancakeSwap | 0.03 BNB |
| Get ETH | PancakeSwap | 0.03 BNB |
| **Total** | | **~$36** |

---

## Ready?

Once you have the tokens, run:
```bash
# Check balances
npx hardhat run scripts/check-bsc-balances.js --network bsc

# Test USDT bridge
npx hardhat run scripts/test-usdt-bridge.js --network bsc

# Test ETH bridge
npx hardhat run scripts/test-eth-bridge.js --network bsc
```

Then you'll be 100% confident all 3 bridges work! 🚀

# 🧪 BSC Testnet Deployment Guide

**Test EVERYTHING on testnet before mainnet deployment!**

---

## 🎯 WHY TEST ON TESTNET

✅ **Zero cost** - Testnet BNB is FREE
✅ **Zero risk** - Can't lose real money
✅ **100% realistic** - Same code, same process
✅ **Build confidence** - Know exactly what will happen
✅ **Find bugs** - Catch issues before mainnet

---

## 📋 STEP-BY-STEP TESTNET DEPLOYMENT

### Step 1: Get Testnet BNB (FREE!)

**Option A: Official Binance Faucet** (RECOMMENDED)
```
1. Visit: https://testnet.binance.org/faucet-smart
2. Enter your wallet address: 0xdD779a290C937144F80Eb75b75d814c834536B1b
3. Complete captcha
4. Click "Give me BNB"
5. Receive 0.5 tBNB (testnet BNB)
6. Can request every 24 hours
```

**Option B: Alternative Faucets**
```
1. https://testnet.bnbchain.org/faucet-smart
2. https://www.bnbchain.org/en/testnet-faucet
```

**Verification:**
```bash
# Check testnet balance
npx hardhat console --network bscTestnet

# In console:
const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);
console.log("Testnet Balance:", ethers.formatEther(balance), "tBNB");

# Expected: 0.5 tBNB (can request more if needed)
```

---

### Step 2: Update .env for Testnet

Add testnet private key (or use same as mainnet):

```bash
# .env file
TESTNET_PRIVATE_KEY=681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4
```

---

### Step 3: Deploy to BSC Testnet

**Command:**
```bash
# Deploy minimum ecosystem to testnet
npx hardhat run scripts/deploy-minimum-ecosystem-bsc.js --network bscTestnet
```

**Duration**: 10-15 minutes

**What Happens:**
```
1. Deploys WBNB, Factory, Router, BTCBR, XHN
2. Creates 3 trading pairs
3. Adds testnet liquidity
4. Executes mini bot launch
5. Saves deployment addresses
```

**Expected Output:**
```
💰 MINIMUM BUDGET ECOSYSTEM DEPLOYMENT - BSC MAINNET
======================================================================

📍 Deployer address: 0xdD779a290C937144F80Eb75b75d814c834536B1b
💰 Deployer balance: 0.5000 BNB
💵 USD Value: $0.00 (testnet)

======================================================================
PHASE 1: DEPLOY CORE INFRASTRUCTURE
======================================================================

[1/5] Deploying WBNB...
✅ WBNB deployed at: 0x...

[2/5] Deploying NorDEXFactory...
✅ Factory deployed at: 0x...

[3/5] Deploying NorDEXRouter...
✅ Router deployed at: 0x...

[4/5] Deploying BTCBR Token...
✅ BTCBR Token deployed at: 0x...

[5/5] Deploying XHN Token...
✅ XHN Token deployed at: 0x...

[continues...]
```

---

### Step 4: Verify Testnet Deployment

**Check contracts on BscScan Testnet:**
```bash
# Verify BTCBR
npx hardhat verify --network bscTestnet [BTCBR_ADDRESS]

# Verify XHN
npx hardhat verify --network bscTestnet [XHN_ADDRESS]
```

**Testnet Block Explorers:**
- BscScan Testnet: https://testnet.bscscan.com
- Check your contracts: https://testnet.bscscan.com/address/[YOUR_ADDRESS]

---

### Step 5: Test Trading on PancakeSwap Testnet

**PancakeSwap Testnet:**
```
1. Visit: https://pancake.kiemtienonline360.com/ (testnet version)
   OR: Add custom tokens to main PancakeSwap with testnet network

2. Connect MetaMask (BSC Testnet network)

3. Import your tokens:
   - BTCBR: [BTCBR_ADDRESS from deployment]
   - XHN: [XHN_ADDRESS from deployment]

4. Test a small swap:
   - tBNB → BTCBR (try 0.01 tBNB)
   - Confirm transaction
   - Verify you received BTCBR

5. Test reverse swap:
   - BTCBR → tBNB
   - Verify price impact
   - Confirm works correctly
```

---

### Step 6: Add Tokens to MetaMask (Testnet)

**BSC Testnet Network Settings:**
```
Network Name: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
Chain ID: 97
Currency Symbol: tBNB
Block Explorer: https://testnet.bscscan.com
```

**Add BTCBR Token:**
```
1. Open MetaMask
2. Switch to BSC Testnet
3. Click "Import tokens"
4. Paste BTCBR address: [FROM_DEPLOYMENT]
5. Symbol: BTCBR
6. Decimals: 18
7. Click "Add"
```

**Add XHN Token:**
```
Same process with XHN address
```

---

## ✅ TESTNET VERIFICATION CHECKLIST

### Deployment Verification

- [ ] All 5 contracts deployed successfully
- [ ] All 3 pairs created
- [ ] Liquidity added to all pairs
- [ ] Mini bot launch completed (5 trades)
- [ ] Deployment JSON saved
- [ ] Gas usage recorded

### Contract Verification

- [ ] BTCBR verified on BscScan Testnet
- [ ] XHN verified on BscScan Testnet
- [ ] Contract code readable on explorer
- [ ] Token info correct (name, symbol, supply)

### Trading Verification

- [ ] Can swap tBNB → BTCBR
- [ ] Can swap tBNB → XHN
- [ ] Can swap BTCBR ↔ XHN
- [ ] Price impact acceptable (~4-10%)
- [ ] No transaction errors
- [ ] Tokens appear in MetaMask

### MetaMask Verification

- [ ] BTCBR shows in wallet
- [ ] XHN shows in wallet
- [ ] Token balances correct
- [ ] Can see transaction history
- [ ] USD values show $0 (testnet - this is normal!)

---

## 🐛 COMMON TESTNET ISSUES

### Issue 1: "Insufficient funds for gas"

**Problem**: Not enough tBNB

**Solution:**
```bash
# Request more from faucet (can request every 24 hours)
Visit: https://testnet.binance.org/faucet-smart

# Or use alternative faucet
```

### Issue 2: "Transaction reverted"

**Problem**: Contract error or slippage

**Solution:**
```javascript
// Increase slippage tolerance in PancakeSwap
Settings → Slippage: 1% → 5%

// Try again
```

### Issue 3: "Cannot verify contract"

**Problem**: Verification service issue

**Solution:**
```bash
# Wait 5 minutes and try again
npx hardhat verify --network bscTestnet [ADDRESS]

# If still fails, manual verification:
# Go to BscScan Testnet → Contract → Verify & Publish
```

### Issue 4: "MetaMask shows $0"

**Problem**: This is NORMAL on testnet!

**Solution:**
```
Testnet tokens have no real value
USD values always show $0
On MAINNET, they will show real USD values
This is expected behavior ✅
```

---

## 💰 TESTNET vs MAINNET COMPARISON

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| BNB Cost | FREE | $700-750/BNB |
| Deployment Cost | $0 | $700 (1.0 BNB) |
| Risk | ZERO | Real money |
| Speed | Same | Same |
| Contract Code | IDENTICAL | IDENTICAL |
| Trading | Works | Works |
| MetaMask USD | Shows $0 | Shows real USD |
| CoinGecko Listing | No | Yes |
| Real Users | No | Yes |

**Key Point**: Testnet deployment is EXACTLY the same as mainnet, just with fake money!

---

## 🚀 READY FOR MAINNET?

### After Successful Testnet Deployment

**✅ You verified:**
- All contracts deploy correctly
- Trading pairs work
- Swaps execute properly
- No transaction errors
- Comfortable with the process

**🎯 Now you're ready for mainnet!**

---

## 📋 MAINNET DEPLOYMENT COMMAND

**After testnet success, deploy to mainnet:**

```bash
# Get 1.0 BNB ($700-750)
# Send to: 0xdD779a290C937144F80Eb75b75d814c834536B1b

# Deploy to BSC MAINNET (same script, different network!)
npx hardhat run scripts/deploy-minimum-ecosystem-bsc.js --network bsc
```

**Difference**: Just change `--network bscTestnet` to `--network bsc`

Everything else is IDENTICAL!

---

## 🎓 TESTNET LEARNING CHECKLIST

### Things to Practice on Testnet

- [ ] Full deployment process
- [ ] Contract verification
- [ ] Adding liquidity
- [ ] Executing swaps
- [ ] Checking DexScreener (won't show on testnet, but practice finding pairs)
- [ ] Adding tokens to MetaMask
- [ ] Reading transaction receipts
- [ ] Calculating gas costs
- [ ] Troubleshooting errors

### What You'll Learn

1. **Deployment Duration**: ~10-15 minutes (same on mainnet)
2. **Gas Usage**: Total BNB used (multiply by BNB price for mainnet cost)
3. **Contract Addresses**: Save these, same format on mainnet
4. **Transaction Flow**: Watch each phase complete
5. **Confidence**: Know exactly what to expect on mainnet

---

## 💡 PRO TIPS

**1. Save Testnet Addresses**
```bash
# Keep deployment JSON
# Compare with mainnet addresses later
# Helpful for documentation
```

**2. Test Multiple Swaps**
```bash
# Try different amounts
# Test all 3 pairs
# Verify price impact calculations
```

**3. Take Screenshots**
```bash
# Document each step
# Compare with mainnet later
# Share with team if needed
```

**4. Time the Process**
```bash
# Note how long each phase takes
# Plan mainnet deployment accordingly
# Know when to be available
```

**5. Test Error Scenarios**
```bash
# Try swapping with 0 BNB (should fail)
# Try huge swap (high slippage)
# Learn how errors look
```

---

## 🎯 TESTNET SUCCESS CRITERIA

### Deployment Successful When:

- [x] Got 0.5+ tBNB from faucet
- [ ] All contracts deployed
- [ ] All pairs created
- [ ] Liquidity added
- [ ] Bot trades executed
- [ ] No errors

### Ready for Mainnet When:

- [ ] Testnet deployment successful
- [ ] Verified contracts on testnet
- [ ] Tested trading successfully
- [ ] Understand the process
- [ ] Comfortable with timing
- [ ] Have 1.0 BNB ready

---

## 🚀 NEXT STEPS

**Current Status**: Ready to test on testnet

**Steps:**

1. **Get testnet BNB** (5 minutes)
   ```
   Visit: https://testnet.binance.org/faucet-smart
   Request: 0.5 tBNB
   ```

2. **Deploy to testnet** (15 minutes)
   ```bash
   npx hardhat run scripts/deploy-minimum-ecosystem-bsc.js --network bscTestnet
   ```

3. **Verify deployment** (10 minutes)
   ```bash
   npx hardhat verify --network bscTestnet [ADDRESSES]
   ```

4. **Test trading** (10 minutes)
   - Add tokens to MetaMask
   - Execute test swaps
   - Verify everything works

5. **Deploy to mainnet** (when ready!)
   ```bash
   # Same command, different network!
   npx hardhat run scripts/deploy-minimum-ecosystem-bsc.js --network bsc
   ```

**Total Time**: ~40 minutes for full testnet cycle

**Result**: 100% confidence for mainnet deployment! 🎉

---

*Let me know when you've got testnet BNB and I'll help you deploy!*

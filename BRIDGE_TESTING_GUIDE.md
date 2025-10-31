# 🧪 BRIDGE TESTING GUIDE

**Quick reference for testing all 3 bridges**

---

## Prerequisites

✅ MetaMask installed
✅ Connected to BSC Mainnet
✅ Have at least 0.05 BNB for gas + testing
✅ (Optional) Have $10-20 USDT on BSC

---

## TEST 1: BNB BRIDGE (Easiest to test!)

**Cost:** ~$4 (0.01 BNB)
**Time:** 2-3 minutes

### Step 1: Go to BSCScan

Open: https://bscscan.com/address/0x9bEFFFa3b43D34a2B470DA21aab3CA3263D0e8C0#writeContract

### Step 2: Connect MetaMask

1. Click "Connect to Web3"
2. Select MetaMask
3. Confirm connection
4. Make sure you're on BSC Mainnet

### Step 3: Bridge BNB

1. Find function **"4. bridgeBNB"**
2. Fill in:
   - `recipient`: Your wallet address (same address or different Xaheen address)
   - `payableAmount (ether)`: **0.01**
3. Click "Write"
4. Confirm transaction in MetaMask
5. Wait for confirmation

### Step 4: Check Transaction

1. Click on transaction hash
2. Look for `BridgeDeposit` event
3. Note the `nonce` value (you'll need this later)
4. Note the `netAmount` (should be 0.0098 BNB after 0.2% fee)

### Step 5: Check Fees Collected

1. Go to "Read Contract" tab
2. Find **"totalFees"**
3. Click "Query"
4. Should show: **20000000000000000** (0.0002 BNB in wei)

**✅ SUCCESS CRITERIA:**
- ✅ Transaction confirmed
- ✅ `BridgeDeposit` event emitted
- ✅ Total fees = 0.0002 BNB
- ✅ Net amount = 0.0098 BNB

---

## TEST 2: USDT BRIDGE

**Cost:** ~$10 USDT + gas
**Time:** 3-4 minutes

### Prerequisites

You need USDT on BSC. If you don't have it:
1. Buy USDT on Binance
2. Withdraw to your wallet (BSC network)
3. USDT address on BSC: `0x55d398326f99059fF775485246999027B3197955`

### Step 1: Approve USDT

Open: https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955#writeContract

1. Connect MetaMask
2. Find **"1. approve"**
3. Fill in:
   - `spender`: `0x7E1c4448A9d87d5C5478B86085AF4e3715a06f48` (USDT bridge)
   - `amount`: `10000000000000000000` (10 USDT in wei, 18 decimals)
4. Click "Write"
5. Confirm in MetaMask
6. Wait for confirmation

### Step 2: Bridge USDT

Open: https://bscscan.com/address/0x7E1c4448A9d87d5C5478B86085AF4e3715a06f48#writeContract

1. Connect MetaMask (if not already)
2. Find **"1. bridgeUSDT"**
3. Fill in:
   - `recipient`: Your Xaheen address
   - `amount`: `10000000000000000000` (10 USDT)
4. Click "Write"
5. Confirm in MetaMask
6. Wait for confirmation

### Step 3: Check Transaction

1. Look for `BridgeDeposit` event
2. Should show:
   - Amount: 9.98 USDT (after 0.2% fee)
   - Fee: 0.02 USDT
   - Nonce: (incremental number)

### Step 4: Check Fees

1. Go to "Read Contract"
2. Find **"totalFees"**
3. Should show: **20000000000000000** (0.02 USDT)

**✅ SUCCESS CRITERIA:**
- ✅ USDT approved
- ✅ Bridge transaction confirmed
- ✅ `BridgeDeposit` event emitted
- ✅ Total fees = 0.02 USDT
- ✅ Net amount = 9.98 USDT

---

## TEST 3: ETH BRIDGE (Advanced)

**Note:** BSC uses BNB, not native ETH. To test ETH bridge:

**Option A: Use Binance-Pegged ETH**
1. Buy ETH on Binance
2. Withdraw as Binance-Pegged ETH to BSC
3. ETH contract on BSC: (find current address)

**Option B: Skip for now**
- ETH bridge works same as BNB bridge
- If BNB bridge works, ETH bridge will work too
- Test later when you have ETH on BSC

---

## VERIFYING BRIDGE ON XAHEEN SIDE

### Add Xaheen Network to MetaMask

**Option 1: Manual**
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Fill in:
   - Network Name: **Xaheen Chain**
   - RPC URL: **https://rpc.xaheen.org**
   - Chain ID: **65001**
   - Currency Symbol: **XHT**
   - Block Explorer: **https://explorer.xaheen.org**
5. Click "Save"

**Option 2: Automatic (if you build the page)**
Visit: https://xaheen.org/add-network
Click "Add Network" button

### Check WBNB Balance

1. Switch to Xaheen network in MetaMask
2. Click "Import tokens"
3. Add WBNB token:
   - Address: **0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B**
   - Symbol: **WBNB**
   - Decimals: **18**
4. Should see: **0.0098 WBNB**

### Check WUSDT Balance (if tested)

1. Import WUSDT token:
   - Address: **0xA0de216D0bF10E9a40C0666FB3De458e3AEB70F5**
   - Symbol: **WUSDT**
   - Decimals: **18**
2. Should see: **9.98 WUSDT**

---

## AUTOMATED TEST SCRIPT

If you prefer automated testing:

```bash
npx hardhat run scripts/test-all-bridges.js --network bsc
```

**What it does:**
- Tests BNB bridge with 0.01 BNB
- Tests USDT bridge with 10 USDT (if you have it)
- Shows results and next steps

---

## TROUBLESHOOTING

### Error: "Amount below minimum"
- BNB: Must send at least 0.01 BNB
- USDT: Must send at least $10 (10 USDT)
- ETH: Must send at least 0.005 ETH

### Error: "Transfer failed"
- USDT: Make sure you approved the bridge first
- Check you have enough balance

### Error: "Daily limit exceeded"
- BNB: Max 100 BNB per day
- USDT: Max $500K per day
- ETH: Max 50 ETH per day

### "I don't see tokens on Xaheen"
- Make sure you added Xaheen network to MetaMask
- Make sure you imported the token addresses
- Wait 30-60 seconds for validators to process

### "Transaction pending forever"
- Increase gas price
- BSC can be slow during high traffic
- Wait up to 5 minutes

---

## CHECKING REVENUE

### View Total Fees Collected

**BNB Bridge:**
https://bscscan.com/address/0x9bEFFFa3b43D34a2B470DA21aab3CA3263D0e8C0#readContract
→ Find "totalFees"

**USDT Bridge:**
https://bscscan.com/address/0x7E1c4448A9d87d5C5478B86085AF4e3715a06f48#readContract
→ Find "totalFees"

**ETH Bridge:**
https://bscscan.com/address/0x99883F508F41Ad3750695E68B456A50909f0F3Fe#readContract
→ Find "totalFees"

### Withdraw Fees

When you want to collect revenue:

1. Go to bridge "Write Contract"
2. Find "withdrawFees"
3. Enter your treasury address
4. Click "Write"
5. Fees sent to your wallet!

---

## TEST RESULTS CHECKLIST

After testing, you should have:

- [ ] BNB bridge transaction confirmed
- [ ] USDT bridge transaction confirmed (if tested)
- [ ] ETH bridge transaction confirmed (if tested)
- [ ] 0.0098 WBNB on Xaheen Chain
- [ ] 9.98 WUSDT on Xaheen Chain (if tested)
- [ ] Total fees showing in contracts
- [ ] No errors in transactions

---

## WHAT'S NEXT AFTER TESTING?

1. **Add liquidity to DEX** (optional)
   - WBNB/XHT pair
   - WUSDT/XHT pair
   - WETH/XHT pair

2. **Market to users**
   - Share bridge links
   - Explain how to use
   - Show benefits (cheap, fast)

3. **Monitor volume**
   - Check daily bridge volume
   - Calculate revenue
   - Withdraw fees regularly

4. **Scale up**
   - More marketing
   - More liquidity
   - More users = more revenue!

---

## QUICK REFERENCE

**Bridge Contracts (BSC):**
```
BNB:  0x9bEFFFa3b43D34a2B470DA21aab3CA3263D0e8C0
USDT: 0x7E1c4448A9d87d5C5478B86085AF4e3715a06f48
ETH:  0x99883F508F41Ad3750695E68B456A50909f0F3Fe
```

**Wrapped Tokens (Xaheen):**
```
WBNB:  0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B
WUSDT: 0xA0de216D0bF10E9a40C0666FB3De458e3AEB70F5
WETH:  0xF1C1dc0263686093389Fbd66c2951122B2133aEA
```

**Bridge Contracts (Xaheen):**
```
BNB:  0xB1347E378CE63475b282fCC4E9037D51F189758A
USDT: 0x1d24C3c51855d5320d7459E03F2d1a13F7cB6334
ETH:  0x4Ce2954074a2cD465a05dE8518143Cb478A0c913
```

**Network Details:**
```
Xaheen Chain
RPC: https://rpc.xaheen.org
Chain ID: 65001
Symbol: XHT
Explorer: https://explorer.xaheen.org
```

---

**Ready to test? Start with BNB bridge - it's the easiest!** 🚀

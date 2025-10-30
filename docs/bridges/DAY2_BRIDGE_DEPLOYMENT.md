# 🌉 DAY 2: BRIDGE DEPLOYMENT GUIDE

**Budget:** $2,010 ($10 gas + $2,000 vault)  
**Timeline:** 4-6 hours  
**Objective:** Deploy production bridges enabling BSC Mainnet ↔ BTCBR Private Chain transfers

---

## 📋 PRE-REQUISITES

### Required

- ✅ BSC Mainnet wallet with ~0.02 BNB ($12 for gas)
- ✅ BTCBR Private Chain wallet with BNB
- ✅ 2,000,000 BTCBR tokens ready to transfer ($2,000)
- ✅ 2 trusted partners for multisig
- ✅ Hardware wallets (recommended)

### Tools Needed

- Remix IDE (https://remix.ethereum.org) OR
- Hardhat (for command-line deployment)
- MetaMask or hardware wallet
- Gnosis Safe account

---

## 🎯 DEPLOYMENT STEPS

### **STEP 1: Compile Bridge Contracts**

#### Option A: Using Remix (Easiest)

```
1. Go to https://remix.ethereum.org
2. Create new file: BTCBRBridgeMainnet.sol
3. Copy contract from: contracts/bridges/production/BTCBRBridgeMainnet.sol
4. Compile with Solidity 0.8.19+
5. Ensure "Optimization" is enabled
```

#### Option B: Using Hardhat

```bash
cd /Volumes/Development/sahalat/blockchain-v2

# Install dependencies
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers

# Compile contracts
npx hardhat compile

# Verify compilation
ls artifacts/contracts/bridges/production/
```

---

### **STEP 2: Deploy Mainnet Bridge**

#### Using Remix:

```
1. Select "Deploy & Run Transactions" tab
2. Environment: "Injected Provider - MetaMask"
3. Connect to BSC Mainnet (Chain ID: 56)
4. Select contract: BTCBRBridgeMainnet
5. Constructor parameters:
   - _token: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
   - _requiredSignatures: 2
6. Click "Deploy"
7. Confirm in MetaMask
8. **SAVE CONTRACT ADDRESS!**
```

#### Using Script:

```bash
# Set your mainnet deployer private key
export MAINNET_PRIVATE_KEY="0x..."

# Deploy
npx hardhat run scripts/deploy-mainnet-bridge.js --network bsc

# Save the output address!
```

**Expected Cost:** ~0.005 BNB ($3)

---

### **STEP 3: Configure Mainnet Bridge**

After deployment, configure the bridge:

```javascript
// Using Remix or ethers.js

// 1. Add validators
await bridge.addValidator("0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD");
await bridge.addValidator("0xfd634d55ce9b99058dc06cdda1f866b39579a9f3");
await bridge.addValidator("0xb753b892551d1c374fda6fd7f6e9b787688c4ea5");

// 2. Set transfer limits
const MIN = ethers.parseEther("100");       // 100 BTCBR
const MAX = ethers.parseEther("100000");    // 100,000 BTCBR
const DAILY = ethers.parseEther("500000");  // 500,000 BTCBR
await bridge.setLimits(MIN, MAX, DAILY);

// 3. Set bridge fee (0.1%)
await bridge.setBridgeFee(10); // 10 basis points

// 4. Verify configuration
console.log("Min:", await bridge.minTransfer());
console.log("Max:", await bridge.maxTransfer());
console.log("Daily:", await bridge.dailyLimit());
```

**Expected Cost:** ~0.002 BNB ($1.20)

---

### **STEP 4: Deploy Private Chain Bridge**

#### Using Remix:

```
1. Switch MetaMask to BTCBR Private Chain
   - Network: BTCBR Private BSC
   - RPC: https://rpc.bitcoinbr.tech
   - Chain ID: 885824
2. Select contract: BTCBRBridgePrivate
3. Constructor parameters:
   - _token: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
   - _mainnetBridge: [ADDRESS FROM STEP 2]
   - _requiredSignatures: 2
4. Deploy
5. **SAVE CONTRACT ADDRESS!**
```

#### Using Script:

```bash
# Set your private chain key
export PRIVATE_CHAIN_KEY="0x..."
export MAINNET_BRIDGE_ADDRESS="0x..."

# Deploy
npx hardhat run scripts/deploy-private-bridge.js --network btcbr

# Save the output address!
```

**Expected Cost:** Minimal (private chain gas)

---

### **STEP 5: Link Bridges**

```javascript
// On Mainnet Bridge
await mainnetBridge.setPrivateChainBridge(privateBridgeAddress);

// On Private Bridge
await privateBridge.setMainnetBridge(mainnetBridgeAddress);

// Verify linkage
console.log("Mainnet sees:", await mainnetBridge.privateChainBridge());
console.log("Private sees:", await privateBridge.mainnetBridge());
```

**Expected Cost:** ~0.001 BNB ($0.60)

---

### **STEP 6: Setup Multisig (Gnosis Safe)**

```
1. Visit: https://app.safe.global
2. Connect wallet (BSC Mainnet)
3. Click "Create Safe"
4. Add owners:
   - Your wallet address
   - Partner 1 address
   - Partner 2 address
5. Set threshold: 2 of 3
6. Confirm and pay setup fee (~$5)
7. **SAVE SAFE ADDRESS!**
```

**Expected Cost:** ~0.003 BNB ($1.80)

---

### **STEP 7: Transfer Bridge Ownership**

```javascript
// Transfer mainnet bridge to Safe
await mainnetBridge.transferOwnership(SAFE_ADDRESS);

// Verify
console.log("New owner:", await mainnetBridge.owner());
// Should output: SAFE_ADDRESS
```

**Expected Cost:** ~0.001 BNB ($0.60)

---

### **STEP 8: Fund Mainnet Vault**

**Amount:** 2,000,000 BTCBR ($2,000 at $0.001/token)

```javascript
// Get BTCBR contract
const btcbr = new ethers.Contract(
  "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
  ["function transfer(address to, uint256 amount) returns (bool)"],
  wallet
);

// Transfer to bridge
const amount = ethers.parseEther("2000000");
const tx = await btcbr.transfer(MAINNET_BRIDGE_ADDRESS, amount);
await tx.wait();

console.log("✅ Vault funded:", tx.hash);
```

**Expected Cost:** ~0.001 BNB ($0.60) + 2M BTCBR ($2,000)

---

### **STEP 9: Test Bridge Transfer**

Test with small amount first:

```javascript
// 1. Approve bridge
const btcbr = new ethers.Contract(BTCBR_ADDRESS, ERC20_ABI, wallet);
await btcbr.approve(MAINNET_BRIDGE_ADDRESS, ethers.parseEther("1000"));

// 2. Lock tokens (triggers mint on private chain)
const bridge = new ethers.Contract(MAINNET_BRIDGE_ADDRESS, BRIDGE_ABI, wallet);
const lockTx = await bridge.lock(ethers.parseEther("1000"));
const receipt = await lockTx.wait();

// 3. Get depositHash from event
const event = receipt.events.find(e => e.event === 'Locked');
const depositHash = event.args.depositHash;

console.log("Deposit Hash:", depositHash);
console.log("✅ Locked 1000 BTCBR on mainnet");

// 4. Validators sign the depositHash off-chain
// 5. User submits signatures to private chain bridge to mint
```

**Expected Cost:** ~0.002 BNB ($1.20)

---

### **STEP 10: Setup Monitoring**

Create monitoring dashboard:

```javascript
// Monitor locked tokens
const mainnetBridge = new ethers.Contract(MAINNET_BRIDGE, ABI, provider);

mainnetBridge.on('Locked', (from, amount, depositHash) => {
  console.log('🔒 Locked:', ethers.formatEther(amount), 'BTCBR');
  console.log('   From:', from);
  console.log('   Hash:', depositHash);
});

// Monitor minted tokens
const privateBridge = new ethers.Contract(PRIVATE_BRIDGE, ABI, provider);

privateBridge.on('Minted', (to, amount, depositHash) => {
  console.log('✨ Minted:', ethers.formatEther(amount), 'BTCBR');
  console.log('   To:', to);
  console.log('   Hash:', depositHash);
});
```

---

## 📊 DEPLOYMENT CHECKLIST

- [ ] BTCBRBridgeMainnet compiled
- [ ] BTCBRBridgePrivate compiled
- [ ] Mainnet bridge deployed: `0x...`
- [ ] Mainnet validators added (3/3)
- [ ] Mainnet limits configured
- [ ] Private bridge deployed: `0x...`
- [ ] Bridges linked bidirectionally
- [ ] Gnosis Safe created: `0x...`
- [ ] Bridge ownership transferred
- [ ] Mainnet vault funded: 2,000,000 BTCBR
- [ ] Test transfer completed
- [ ] Monitoring setup

---

## 💰 BUDGET SUMMARY

| Item | Cost | Status |
|------|------|--------|
| Mainnet deployment | $3.00 | ⏳ Pending |
| Configuration | $1.20 | ⏳ Pending |
| Private deployment | $0.10 | ⏳ Pending |
| Bridge linking | $0.60 | ⏳ Pending |
| Gnosis Safe setup | $1.80 | ⏳ Pending |
| Ownership transfer | $0.60 | ⏳ Pending |
| Test transfer | $1.20 | ⏳ Pending |
| Vault funding | $2,000.00 | ⏳ Pending |
| **TOTAL** | **$2,008.50** | **Budget: $2,010** |

---

## 🔒 SECURITY NOTES

1. **Never share private keys** - Use hardware wallets
2. **Test with small amounts first** - Don't risk large sums
3. **Verify all addresses** - Double-check before sending funds
4. **Multisig required** - All critical operations need 2-of-3 signatures
5. **Daily limits enforced** - Maximum $1,000 can be bridged per day initially

---

## 🚨 TROUBLESHOOTING

### "Insufficient funds for gas"
- Ensure wallet has at least 0.02 BNB

### "Transaction failed"
- Check gas price (use at least 5 gwei on BSC)
- Verify contract is compiled with optimization

### "Cannot verify contract"
- Make sure compiler version matches (0.8.19)
- Enable optimization with 200 runs
- Flatten contract if using imports

### "Bridge not accepting deposits"
- Verify you've called `addValidator` for all 3 validators
- Check you've set limits with `setLimits`
- Ensure bridge is not paused

---

## 📞 EMERGENCY CONTACTS

If something goes wrong:

1. **Pause the bridge immediately:**
   ```javascript
   await bridge.pause();
   ```

2. **Contact multisig signers:**
   - Partner 1: [Phone/Telegram]
   - Partner 2: [Phone/Telegram]

3. **Document the issue:**
   - Transaction hash
   - Error message
   - Expected vs. actual behavior

---

## ✅ COMPLETION CRITERIA

Day 2 is complete when:

- [x] Both bridges deployed and verified
- [x] Multisig controlling mainnet bridge
- [x] Vault funded with $2,000
- [x] Test transfer successful
- [x] All contract addresses saved
- [x] Budget under $2,010

---

## 📅 NEXT: DAY 3 - DEX POOL

Once Day 2 is complete:

1. Save all contract addresses
2. Test bridge with 100 BTCBR
3. Verify vault balance
4. Document any issues
5. Proceed to: `docs/DAY3_DEX_POOL.md`

---

## 📝 CONTRACT ADDRESSES (Fill These In!)

```
Mainnet Bridge:  0x________________________________
Private Bridge:  0x________________________________
Gnosis Safe:     0x________________________________
BTCBR Token:     0x0cF8e180350253271f4b917CcFb0aCCc4862F262
```

**Deployed By:** _____________________  
**Date:** _____________________  
**Total Spent:** $_____________________  

---

**Status:** 🟡 In Progress  
**Budget Remaining:** $7,990 / $10,000

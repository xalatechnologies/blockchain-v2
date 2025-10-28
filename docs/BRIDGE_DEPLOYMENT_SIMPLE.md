# How to Deploy BTCBR Bridge (Production)
## Simple English Explanation

---

## 🎯 What This Bridge Does

Think of it like a **secure vault system between two cities**:

1. **City A (BSC Mainnet)**: Has the real BTCBR tokens
2. **City B (Your Private Chain)**: Wants to use those tokens

**The Bridge**:
- When you send 1000 BTCBR from City A → City B:
  - City A **locks** your 1000 BTCBR in a vault (can't be touched)
  - City B **creates** (mints) 1000 new BTCBR for you
  - Now you can use those 1000 BTCBR in City B!

- When you send back from City B → City A:
  - City B **burns** (destroys) your 1000 BTCBR
  - City A **unlocks** the original 1000 BTCBR from the vault
  - You get your original tokens back!

**Always 1:1**: If 5000 BTCBR are locked on mainnet, exactly 5000 BTCBR exist on private chain. Perfect balance!

---

## 📋 What You Need

### On Your Computer:
- [ ] This project folder open
- [ ] Your wallet private key (the one with BTCBR)
- [ ] Some BNB for gas fees (on both chains)

### Network Details You Already Have:
- **BSC Mainnet**: https://bsc-dataseed.binance.org/
- **Your Private Chain**: http://3.91.50.187:8545

### Addresses You Need:
- **BTCBR Token on Mainnet**: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
- **BTCBR Token on Private**: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` (same!)

---

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Mainnet Bridge (5 minutes)

**What happens**: Creates a smart contract on BSC mainnet that can lock your BTCBR tokens.

**You'll do**:
```bash
npm run deploy:mainnet
```

**Behind the scenes**:
1. Connects to BSC mainnet
2. Deploys `BTCBRBridgeMainnet.sol`
3. Sets up 3 validators (people who verify transfers)
4. Configures transfer limits (min: 100 BTCBR, max: 100,000 BTCBR)

**Cost**: ~$5 in BNB (gas fees)

**You'll get**: A contract address like `0xABC123...` (save this!)

---

### Step 2: Deploy Private Chain Bridge (2 minutes)

**What happens**: Creates a smart contract on YOUR private chain that can mint/burn BTCBR.

**You'll do**:
```bash
npm run deploy:private
```

**Behind the scenes**:
1. Connects to your private chain (3.91.50.187)
2. Deploys `BTCBRBridgePrivate.sol`
3. Gives it permission to mint new BTCBR tokens
4. Sets up same 3 validators

**Cost**: Nearly free (your private chain)

**You'll get**: Another contract address (save this too!)

---

### Step 3: Configure Validators (3 minutes)

**What are validators?**: 
Think of them as **3 security guards** who must all agree before any transfer happens.
- You need 2 out of 3 to approve each transfer (prevents fraud)
- They watch both chains and sign off on transfers

**You'll do**:
```bash
npm run setup:validators
```

**This adds 3 validator addresses** (we'll use your existing validator wallets):
- Validator 1: `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD`
- Validator 2: `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
- Validator 3: `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`

---

### Step 4: Test It! (10 minutes)

**Small test transfer** to make sure everything works:

**You'll do**:
```bash
npm run test:bridge
```

**What happens**:
1. Approve bridge to use 100 BTCBR
2. Lock 100 BTCBR on mainnet
3. Validators detect it and sign
4. Mint 100 BTCBR on private chain
5. Check your balance - you should see 100 BTCBR!

**If it works**: 🎉 Bridge is live!

---

## 💰 How Users Will Use It

### Mainnet → Private Chain (Deposit):

1. **User goes to bridge website** (we'll create this)
2. **Enters amount**: "I want to send 5000 BTCBR to private chain"
3. **Clicks "Approve"**: Let bridge touch your tokens
4. **Clicks "Deposit"**: Lock tokens on mainnet
5. **Wait ~2 minutes**: Validators verify and sign
6. **Done!**: 5000 BTCBR appears in wallet on private chain

### Private Chain → Mainnet (Withdraw):

1. **User enters amount**: "Send 3000 BTCBR back to mainnet"
2. **Clicks "Withdraw"**: Burns tokens on private chain
3. **Wait ~2 minutes**: Validators verify
4. **Done!**: Original 3000 BTCBR unlocked on mainnet

---

## 🔒 Security Features

### How it's protected:

1. **Multi-Signature**: 
   - Need 2 out of 3 validators to approve
   - One corrupt validator can't steal

2. **Transfer Limits**:
   - Min: 100 BTCBR (prevent spam)
   - Max: 100,000 BTCBR per transfer
   - Daily limit: 500,000 BTCBR per address

3. **Emergency Pause**:
   - If something goes wrong, you can pause the bridge
   - No transfers until you unpause

4. **Perfect Accounting**:
   - Total locked on mainnet = Total minted on private
   - Always balanced!

---

## 💸 Fees

### Bridge Fees:
- **Deposit (Mainnet → Private)**: 0.1% (10 BTCBR minimum)
- **Withdrawal (Private → Mainnet)**: 0.2% (20 BTCBR minimum)

**Example**:
- Send 10,000 BTCBR to private chain
- Fee: 10 BTCBR (0.1%)
- You receive: 9,990 BTCBR on private chain

### Gas Fees:
- **Mainnet deposits**: User pays BNB gas (~$1-2)
- **Private withdrawals**: Bridge pays (free for user!)

---

## 🎨 What Happens Visually

```
USER WALLET (Mainnet)
    ↓
[10,000 BTCBR] → Approve
    ↓
BTCBRBridgeMainnet Contract
    ↓
[LOCKED: 10,000 BTCBR] ← Can't be touched!
    ↓
    📡 EVENT EMITTED
    ↓
VALIDATORS (watching both chains)
    ↓
Validator 1 ✅ Signs
Validator 2 ✅ Signs
Validator 3 ✅ Signs
    ↓
BTCBRBridgePrivate Contract
    ↓
[MINTS: 10,000 BTCBR]
    ↓
USER WALLET (Private Chain)
    ↓
[Receives 9,990 BTCBR] ← After 0.1% fee
```

**Going back is the opposite**:
Burn on private → Unlock on mainnet!

---

## 📊 Technical Details (For Nerds)

### Smart Contracts:
- **BTCBRBridgeMainnet.sol**: 300 lines, handles locking
- **BTCBRBridgePrivate.sol**: 192 lines, handles minting
- **Language**: Solidity ^0.8.20
- **Dependencies**: OpenZeppelin (audited libraries)

### How Validators Work:
1. Run a **relayer service** (Node.js)
2. Watch for `Locked` events on mainnet
3. Watch for `Burned` events on private chain
4. Sign valid transfers using their private keys
5. Submit signatures to destination chain

### Signature Format:
```javascript
// What validators sign:
message = keccak256(amount, recipient, nonce, chainId)
signature = sign(message, validatorPrivateKey)
```

---

## 🐛 Troubleshooting

### "Transfer not showing up"
- **Wait 3-5 minutes**: Validators need time to sign
- **Check validator logs**: `npm run logs:validators`

### "Transaction failed"
- **Not enough gas**: Add more BNB
- **Amount too small**: Must be ≥ 100 BTCBR
- **Amount too large**: Max 100,000 BTCBR per transfer

### "Balance wrong on private chain"
- **MetaMask cache**: Clear and reimport network
- **Check on-chain**: Balance is correct, wallet display bug

---

## 📞 Quick Commands Reference

```bash
# Deploy everything
npm run deploy:bridge

# Deploy mainnet only
npm run deploy:mainnet

# Deploy private only  
npm run deploy:private

# Add validators
npm run setup:validators

# Test bridge
npm run test:bridge

# Start validator services
npm run start:validators

# Check bridge status
npm run status:bridge
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Mainnet bridge deployed and verified
- [ ] Private bridge deployed
- [ ] 3 validators added to both bridges
- [ ] Test transfer successful (100 BTCBR)
- [ ] Validators running and signing
- [ ] Transfer limits configured
- [ ] Emergency pause working
- [ ] Fees collecting correctly

---

## 🎯 Next Steps After Deployment

1. **Create Web UI** → Users can bridge easily
2. **Set up monitoring** → Alert if validators go offline
3. **Add more validators** → Increase to 5 validators (need 3/5)
4. **Increase limits** → After testing, raise max transfer
5. **Add analytics** → Track volume, fees collected

---

## 🌟 Summary in One Sentence

**You deploy two smart contracts (one on mainnet, one on private chain), add 3 validators to watch them, and now users can securely move BTCBR between chains by locking on one side and minting on the other!**

Simple as that! 🚀

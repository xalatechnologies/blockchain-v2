# 🚰 Get FREE Testnet BNB

**Quick guide to get testnet BNB in 2 minutes!**

---

## 🎯 YOUR WALLET ADDRESS

```
0xdD779a290C937144F80Eb75b75d814c834536B1b
```

**Copy this address** - you'll need it for the faucet!

---

## 📋 STEP-BY-STEP (2 MINUTES)

### Step 1: Visit Binance Testnet Faucet

**URL**: https://testnet.binance.org/faucet-smart

OR

**Alternative**: https://testnet.bnbchain.org/faucet-smart

### Step 2: Enter Your Wallet Address

```
Paste: 0xdD779a290C937144F80Eb75b75d814c834536B1b
```

### Step 3: Complete Captcha

Click the "I'm not a robot" checkbox

### Step 4: Click "Give me BNB"

You'll receive **0.5 tBNB** instantly!

### Step 5: Verify Receipt

**Option A: Check on BscScan Testnet**
```
Visit: https://testnet.bscscan.com/address/0xdD779a290C937144F80Eb75b75d814c834536B1b
```

**Option B: Check with Hardhat**
```bash
npx hardhat console --network bscTestnet
```

Then in console:
```javascript
const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);
console.log("Testnet Balance:", ethers.formatEther(balance), "tBNB");

// Expected output:
// Testnet Balance: 0.5 tBNB
```

---

## 💰 FAUCET LIMITS

| Faucet | Amount | Frequency |
|--------|--------|-----------|
| Binance Official | 0.5 tBNB | Every 24 hours |
| BNB Chain | 0.5 tBNB | Every 24 hours |

**Pro Tip**: You can use BOTH faucets to get 1.0 tBNB total!

---

## 🆘 IF FAUCET DOESN'T WORK

### Option 1: Try Alternative Faucet

```
Faucet 1: https://testnet.binance.org/faucet-smart
Faucet 2: https://testnet.bnbchain.org/faucet-smart
Faucet 3: https://www.bnbchain.org/en/testnet-faucet
```

### Option 2: Wait 24 Hours

If you recently used the faucet, wait 24 hours and try again.

### Option 3: Ask Community

BSC Testnet Telegram: https://t.me/BinanceDEXchange

---

## ✅ VERIFICATION CHECKLIST

- [ ] Visited faucet website
- [ ] Entered wallet address: 0xdD779a290C937144F80Eb75b75d814c834536B1b
- [ ] Completed captcha
- [ ] Clicked "Give me BNB"
- [ ] Received confirmation message
- [ ] Checked balance on BscScan or Hardhat
- [ ] Confirmed 0.5+ tBNB received

---

## 🚀 NEXT STEP: DEPLOY TO TESTNET

Once you have 0.5 tBNB, deploy with:

```bash
npx hardhat run scripts/deploy-minimum-ecosystem-bsc.js --network bscTestnet
```

---

## 📊 HOW MUCH DO YOU NEED?

| Deployment | tBNB Needed | Cost |
|-----------|-------------|------|
| Minimum Ecosystem | 0.2 tBNB | FREE |
| Full Ecosystem | 0.5 tBNB | FREE |
| Extra Buffer | 1.0 tBNB | FREE |

**Recommendation**: Get 0.5 tBNB (one faucet request is enough!)

---

## 🎯 READY?

**Current Status**:
- ✅ Wallet address: 0xdD779a290C937144F80Eb75b75d814c834536B1b
- ✅ Testnet key configured in .env
- ✅ All contracts compiled
- ⏳ Need testnet BNB

**Go get your FREE testnet BNB now!**

👉 **https://testnet.binance.org/faucet-smart**

---

*Come back once you have testnet BNB and we'll deploy!*

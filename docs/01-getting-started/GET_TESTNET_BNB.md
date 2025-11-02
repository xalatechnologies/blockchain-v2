# How to Get Testnet BNB for Deployment

**Your Deployer Address:** `0xdD779a290C937144F80Eb75b75d814c834536B1b`
**Current Balance:** 0.001 BNB (VERY LOW - NEED MORE!)
**Required:** At least 0.1 BNB (0.5 BNB recommended for multiple deployments)

**STATUS:** ⚠️ **URGENT - Need more testnet BNB to complete deployment!**

---

## Option 1: BSC Testnet Faucet (Official - Recommended)

**URL:** https://testnet.binance.org/faucet-smart

**Steps:**
1. Visit: https://testnet.binance.org/faucet-smart
2. Connect your wallet (MetaMask)
3. Select "BSC Testnet" network in MetaMask
4. Click "Give me BNB" button
5. Wait 10-30 seconds for confirmation
6. You'll receive 0.5 BNB

**Limit:** 0.5 BNB per day per address

---

## Option 2: Alternative Faucets

### Faucet 1: Bnb Smart Chain Faucet
**URL:** https://www.bnbchain.org/en/testnet-faucet

**Steps:**
1. Visit the link above
2. Paste your address: `0xdD779a290C937144F80Eb75b75d814c834536B1b`
3. Complete CAPTCHA
4. Click "Give me BNB"
5. Receive 0.2-0.5 BNB

### Faucet 2: Chainlink Faucet
**URL:** https://faucets.chain.link/bsc-testnet

**Steps:**
1. Visit the link above
2. Connect wallet or paste address
3. Request testnet BNB
4. Receive 0.1 BNB

---

## Check Your Balance

**Method 1: BSCScan Testnet Explorer**
https://testnet.bscscan.com/address/0xdD779a290C937144F80Eb75b75d814c834536B1b

**Method 2: Command Line**
```bash
npx hardhat run --network bscTestnet scripts/check-balance.js
```

**Method 3: Hardhat Console**
```bash
npx hardhat console --network bscTestnet
```
Then in console:
```javascript
const balance = await ethers.provider.getBalance("0xdD779a290C937144F80Eb75b75d814c834536B1b");
console.log("Balance:", ethers.formatEther(balance), "BNB");
```

---

## After Getting Testnet BNB

Once you have at least 0.1 BNB, run the deployment:

```bash
npx hardhat run scripts/deploy-dex-testnet.cjs --network bscTestnet
```

**Estimated Gas Costs:**
- Deploy all contracts: ~0.03-0.05 BNB
- Configure and initialize: ~0.01-0.02 BNB
- **Total: ~0.04-0.07 BNB**

**Recommended:** Get 0.5 BNB to have buffer for multiple deployments and testing

---

## Troubleshooting

### "Faucet not working"
- Try different faucet from list above
- Wait 24 hours and try again (daily limits)
- Ask in BSC Testnet Discord/Telegram for help

### "Transaction fails with insufficient funds"
- Check balance is above 0.1 BNB
- Verify you're on BSC Testnet (Chain ID: 97)
- Try increasing gas price in hardhat.config.js

### "Can't connect MetaMask to faucet"
**Add BSC Testnet to MetaMask:**
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter details:
   - **Network Name:** BSC Testnet
   - **RPC URL:** https://data-seed-prebsc-1-s1.binance.org:8545
   - **Chain ID:** 97
   - **Currency Symbol:** BNB
   - **Block Explorer:** https://testnet.bscscan.com

---

## What Happens During Deployment

When you run the deployment script with sufficient BNB:

1. ✅ Deploy XHT Token (mock for testnet)
2. ✅ Deploy Mock USDT Token
3. ✅ Deploy Mock DEX Router (for TWAP oracle)
4. ✅ Deploy PriceAuthority
5. ✅ Deploy SupplyController
6. ✅ Deploy SettlementHub
7. ✅ Deploy Wrapped XHT (for spoke)
8. ✅ Deploy SettlementInbox
9. ✅ Deploy XaheenRouter
10. ✅ Configure roles and permissions
11. ✅ Initialize inventory (10K XHT)
12. ✅ Save deployment addresses

**Time:** 5-10 minutes
**Gas Used:** ~0.05 BNB
**Result:** Complete cross-chain DEX on testnet!

---

## Alternative: Use Your Own Testnet BNB

If you have testnet BNB in another wallet, you can send it to the deployer address:

**Deployer Address:**
```
0xdD779a290C937144F80Eb75b75d814c834536B1b
```

**Amount Needed:** 0.1 BNB minimum (0.5 BNB recommended)

---

## Quick Links

- 🚰 **BSC Testnet Faucet:** https://testnet.binance.org/faucet-smart
- 🔍 **Testnet Explorer:** https://testnet.bscscan.com
- 💬 **BSC Discord:** https://discord.gg/bnbchain
- 📚 **BSC Docs:** https://docs.bnbchain.org

---

**Next Step:** Get testnet BNB from faucet, then run deployment! 🚀

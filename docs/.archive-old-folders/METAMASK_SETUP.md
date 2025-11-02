# MetaMask Setup Guide for Xaheen Bridge

Complete guide to configuring MetaMask for use with Xaheen Chain and the BTCBR Bridge.

---

## Table of Contents

1. [Install MetaMask](#install-metamask)
2. [Add Xaheen Chain Network](#add-xaheen-chain-network)
3. [Add BTCBR Token](#add-btcbr-token)
4. [Switch Between Networks](#switch-between-networks)
5. [Troubleshooting](#troubleshooting)

---

## Install MetaMask

### Desktop (Chrome/Firefox/Brave)

1. **Visit MetaMask**
   - Go to: https://metamask.io/download/
   - Click **"Install MetaMask for [Your Browser]"**

2. **Add Extension**
   - Browser will open extension store
   - Click **"Add to Chrome"** (or your browser)
   - Click **"Add Extension"**

3. **Setup Wallet**
   - Click the MetaMask fox icon in your browser
   - Click **"Get Started"**

4. **Choose Setup Type**:

   **If you're new to MetaMask:**
   - Click **"Create a Wallet"**
   - Create a password (min 8 characters)
   - **CRITICAL**: Write down your 12-word seed phrase
   - Store it safely (never share with anyone!)
   - Confirm seed phrase
   - Click **"All Done"**

   **If you already have a wallet:**
   - Click **"Import Wallet"**
   - Enter your 12-word seed phrase
   - Create a password
   - Click **"Import"**

5. **Pin Extension**
   - Click puzzle icon in browser toolbar
   - Find MetaMask
   - Click pin icon 📌

### Mobile (iOS/Android)

1. **Download App**
   - **iOS**: App Store → Search "MetaMask"
   - **Android**: Google Play → Search "MetaMask"

2. **Install & Open**
   - Tap **"Get"** / **"Install"**
   - Open MetaMask app

3. **Setup**
   - Tap **"Get Started"**
   - Choose **"Create a new wallet"** or **"Import using seed phrase"**
   - Follow on-screen instructions
   - **Save your seed phrase securely!**

---

## Add Xaheen Chain Network

MetaMask doesn't include Xaheen Chain by default. Follow these steps to add it:

### Method 1: Automatic (Recommended)

1. **Visit Xaheen Bridge**
   - Go to: https://bridge.xaheen.org
   - Click **"Connect Wallet"**

2. **Connect MetaMask**
   - MetaMask popup appears
   - Click **"Next"** → **"Connect"**

3. **Attempt Transfer to Xaheen**
   - Select "From: BSC Mainnet" → "To: Xaheen Chain"
   - Enter any amount
   - Click **"Transfer"**

4. **Auto-Add Prompt**
   - MetaMask will ask: "Allow this site to add a network?"
   - Click **"Approve"**
   - Click **"Switch network"**

Done! Xaheen Chain is now added to MetaMask.

### Method 2: Manual

1. **Open MetaMask**
   - Click the MetaMask extension icon
   - Click the network dropdown (top center)

2. **Add Network**
   - Click **"Add Network"** at bottom
   - Click **"Add a network manually"**

3. **Enter Network Details**

   Copy these values **exactly**:

   ```
   Network Name: Xaheen Chain

   RPC URL: https://rpc.xaheen.org

   Chain ID: 65001

   Currency Symbol: XHT

   Block Explorer URL: https://explorer.xaheen.org
   ```

   **Screenshot of fields:**
   - **Network Name**: `Xaheen Chain`
   - **New RPC URL**: `https://rpc.xaheen.org`
   - **Chain ID**: `65001`
   - **Currency Symbol**: `XHT`
   - **Block Explorer URL (Optional)**: `https://explorer.xaheen.org`

4. **Save**
   - Click **"Save"**
   - MetaMask will automatically switch to Xaheen Chain

5. **Verify**
   - Check network dropdown shows "Xaheen Chain"
   - You should see XHT as the currency

---

## Add BTCBR Token

BTCBR must be manually added to see your balance in MetaMask.

### On BSC Mainnet

1. **Switch to BSC Mainnet**
   - Open MetaMask
   - Click network dropdown
   - Select **"BSC Mainnet"** (or "Smart Chain" if already added)

   **If BSC Mainnet not listed:**
   - Click **"Add Network"**
   - Search "Binance Smart Chain" in popular networks
   - Click **"Add"**

2. **Add BTCBR Token**
   - In MetaMask main screen (showing BNB balance)
   - Scroll down to **"Tokens"**
   - Click **"Import tokens"**

3. **Enter Token Details**
   - Click **"Custom Token"** tab

   **Token Contract Address:**
   ```
   0x0cF8e180350253271f4b917CcFb0aCCc4862F262
   ```

   - Paste the address above
   - **Token Symbol**: `BTCBR` (auto-fills)
   - **Token Decimal**: `18` (auto-fills)

4. **Import**
   - Click **"Add Custom Token"**
   - Review details
   - Click **"Import Tokens"**

5. **Verify**
   - You should now see BTCBR in your token list
   - Balance will show (0 BTCBR if you don't have any yet)

### On Xaheen Chain

1. **Switch to Xaheen Chain**
   - Open MetaMask
   - Click network dropdown
   - Select **"Xaheen Chain"**

2. **Add BTCBR Token**
   - Scroll down to **"Tokens"**
   - Click **"Import tokens"**
   - Click **"Custom Token"** tab

3. **Enter Token Details**

   **Token Contract Address:**
   ```
   0x0cF8e180350253271f4b917CcFb0aCCc4862F262
   ```

   - Paste the address above
   - **Token Symbol**: `BTCBR` (auto-fills)
   - **Token Decimal**: `18` (auto-fills)

4. **Import**
   - Click **"Add Custom Token"**
   - Click **"Import Tokens"**

5. **Verify**
   - BTCBR now appears in token list on Xaheen Chain

---

## Switch Between Networks

### Quick Switch

1. **Open MetaMask**
   - Click MetaMask extension icon

2. **Click Network Dropdown**
   - At the top center of MetaMask
   - Shows current network (e.g., "Ethereum Mainnet")

3. **Select Network**
   - **BSC Mainnet**: For BSC operations
   - **Xaheen Chain**: For Xaheen operations

4. **Verify Switch**
   - Network name updates at top
   - Currency symbol changes (BNB or XHT)

### Auto-Switch (on Bridge)

The Xaheen Bridge will automatically prompt you to switch when needed:

1. **Select Transfer Direction**
   - E.g., From "BSC Mainnet" to "Xaheen Chain"

2. **Click Transfer**
   - If you're on wrong network, MetaMask prompts:
     "Allow this site to switch the network?"

3. **Approve**
   - Click **"Switch network"**
   - MetaMask changes to correct network automatically

---

## Troubleshooting

### "Network RPC URL Not Working"

**Problem**: Can't connect to Xaheen Chain

**Solutions**:

1. **Try Alternative RPC**
   - Edit Xaheen Chain network
   - Replace RPC URL with: `https://rpc.bitcoinbr.tech`

2. **Check Internet Connection**
   - Ensure you're online
   - Try different WiFi/network

3. **Clear Cache**
   - Settings → Advanced → Reset Account
   - (This won't delete your wallet, just resets connection)

### "Can't See BTCBR Balance"

**Problem**: BTCBR shows 0 but you have tokens

**Solutions**:

1. **Verify Correct Network**
   - Check if you're on BSC Mainnet or Xaheen Chain
   - BTCBR exists on both, but balances are separate

2. **Re-import Token**
   - Remove BTCBR from token list
   - Re-import using contract address

3. **Refresh**
   - Click account icon (top right)
   - Click your account name to copy address
   - Check balance on block explorer:
     - **BSC**: https://bscscan.com
     - **Xaheen**: https://explorer.xaheen.org

### "Chain ID Already Exists"

**Problem**: Error when adding Xaheen Chain

**Solution**:

1. **Chain Already Added**
   - Check network dropdown
   - Look for "Xaheen Chain" or similar name

2. **Remove Duplicate**
   - Settings → Networks
   - Find duplicate network
   - Click **"Delete"**
   - Re-add Xaheen Chain with correct details

### "Transaction Stuck/Pending"

**Problem**: Transfer shows pending for long time

**Solutions**:

1. **Check Network Status**
   - BSC: https://bscscan.com (check if network is congested)
   - Xaheen: https://explorer.xaheen.org

2. **Speed Up (BSC only)**
   - Click pending transaction in MetaMask
   - Click **"Speed Up"**
   - Increase gas price
   - Confirm

3. **Cancel (if needed)**
   - Click pending transaction
   - Click **"Cancel"**
   - Confirm cancellation transaction

4. **Wait**
   - BSC transactions can take 3-30 seconds normally
   - During congestion: up to 5 minutes

### "Insufficient Funds for Gas"

**Problem**: Can't send transaction

**Solutions**:

1. **Get More BNB (for BSC)**
   - Buy BNB on exchange
   - Send to your MetaMask address
   - Need ~0.001 BNB (~$0.30) for gas

2. **Get More XHT (for Xaheen)**
   - Use Xaheen faucet (if available)
   - Bridge BNB or other tokens to Xaheen
   - Need ~0.0001 XHT for gas

### "Wrong Network Warning"

**Problem**: MetaMask shows wrong network warning

**Solution**:

1. **Automatic Fix**
   - Click **"Switch Network"** button
   - MetaMask will switch automatically

2. **Manual Fix**
   - Open MetaMask
   - Click network dropdown
   - Select correct network for your transaction

---

## Network Comparison

| Feature | BSC Mainnet | Xaheen Chain |
|---------|-------------|--------------|
| **Chain ID** | 56 | 65001 |
| **Currency** | BNB | XHT |
| **RPC URL** | https://bsc-dataseed.binance.org | https://rpc.xaheen.org |
| **Explorer** | https://bscscan.com | https://explorer.xaheen.org |
| **Gas Fee** | ~0.001 BNB (~$0.30) | ~0.0001 XHT (negligible) |
| **Block Time** | ~3 seconds | ~3 seconds |
| **BTCBR Address** | 0x0cF8e180350253271f4b917CcFb0aCCc4862F262 | 0x0cF8e180350253271f4b917CcFb0aCCc4862F262 |

---

## Security Best Practices

### ✅ DO

1. **Backup Seed Phrase**
   - Write it down on paper
   - Store in secure location (safe, safety deposit box)
   - **Never** store digitally (no screenshots, no cloud)

2. **Use Strong Password**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Don't reuse passwords

3. **Verify Addresses**
   - Always check addresses before sending
   - Use block explorer to verify contract addresses

4. **Keep Software Updated**
   - Update MetaMask regularly
   - Update browser regularly

### ❌ DON'T

1. **Never Share Seed Phrase**
   - No one legitimate will ever ask for it
   - MetaMask support never asks
   - Xaheen team never asks

2. **Don't Click Suspicious Links**
   - Phishing sites look like real MetaMask
   - Always verify URL: https://metamask.io

3. **Don't Trust "Free Tokens"**
   - If someone sends random tokens, ignore
   - Could be scams or dusting attacks

4. **Don't Use Public WiFi**
   - Use VPN if you must
   - Better: use mobile data

---

## Need Help?

### MetaMask Support

- **Help Center**: https://support.metamask.io
- **Community Forum**: https://community.metamask.io
- **Twitter**: @MetaMaskSupport

### Xaheen Chain Support

- **Telegram**: https://t.me/xaheenchain
- **Twitter**: https://twitter.com/xaheenchain
- **Email**: support@xaheen.org
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md)

---

## Next Steps

1. ✅ **MetaMask Installed** → Proceed to add networks
2. ✅ **Networks Added** → Import BTCBR token
3. ✅ **BTCBR Added** → Ready to use bridge!

**Start Bridging**: Visit [bridge.xaheen.org](https://bridge.xaheen.org)

---

*Last Updated: November 2025*
*Version: 1.0*

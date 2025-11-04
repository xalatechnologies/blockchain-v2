# 🦊 ADD XAHEEN TO METAMASK - USER GUIDE

## Method 1: Automatic (via Chainlist) - RECOMMENDED

**Once Chainlist PR is approved:**

1. Visit https://chainlist.org
2. Search for "Nor" or "65001"
3. Click "Add to MetaMask"
4. Approve in MetaMask popup
5. Done! ✅

---

## Method 2: Manual Addition

### Desktop/Extension:

1. Open MetaMask
2. Click network dropdown (top center)
3. Click "Add Network"
4. Click "Add a network manually"
5. Enter the following details:

```
Network Name: Nor Chain
New RPC URL: https://rpc.xaheen.org
Chain ID: 65001
Currency Symbol: NOR
Block Explorer URL: https://explorer.xaheen.org
```

6. Click "Save"
7. Switch to Nor Chain network
8. Done! ✅

### Mobile App:

1. Open MetaMask app
2. Tap hamburger menu (top left)
3. Tap "Settings"
4. Tap "Networks"
5. Tap "Add Network"
6. Enter same details as above
7. Tap "Add"
8. Done! ✅

---

## Method 3: One-Click Website Integration

### For Your Website:

Add this JavaScript to enable one-click add:

```javascript
async function addNorNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0xFDF9', // 65001 in hex
        chainName: 'Nor Chain',
        nativeCurrency: {
          name: 'Nor Token',
          symbol: 'NOR',
          decimals: 18
        },
        rpcUrls: ['https://rpc.xaheen.org'],
        blockExplorerUrls: ['https://explorer.xaheen.org']
      }]
    });
    console.log('Nor Chain added successfully!');
  } catch (error) {
    console.error('Error adding Nor Chain:', error);
  }
}

// HTML button
<button onclick="addNorNetwork()">
  Add Nor to MetaMask
</button>
```

---

## Verifying Connection

After adding Nor:

1. **Check Network:** Top of MetaMask should show "Nor Chain"
2. **Check RPC:** Settings → Networks → Nor Chain → RPC URL should be `https://rpc.xaheen.org`
3. **Check Balance:** Your NOR balance will appear (0 if new)
4. **Test Transaction:** Try sending a small amount to test

---

## Getting NOR (Native Token)

### Option 1: Airdrop (First 1,000 Users)
- Join Telegram: https://t.me/xaheenchain
- Complete airdrop form
- Receive 1,000 NOR

### Option 2: Bridge from BSC
- Use Nor Bridge
- Bridge BTCBR or other tokens
- Swap for NOR on native DEX

### Option 3: DEX (Coming Soon)
- Buy NOR directly on native DEX
- Requires having BTCBR or other tokens first

---

## Troubleshooting

### "Unable to connect to RPC"
- Check your internet connection
- Try again in a few minutes
- RPC might be temporarily down

### "Wrong network" error when using dApp
- Make sure you're on Nor Chain network
- Click network dropdown and select "Nor Chain"

### "Insufficient funds for gas"
- You need NOR for gas fees
- Get from airdrop or bridge

### Chain ID mismatch
- Delete and re-add the network
- Make sure Chain ID is exactly: **65001**

---

## Developer Resources

### Web3.js Connection:
```javascript
const Web3 = require('web3');
const web3 = new Web3('https://rpc.xaheen.org');

// Check connection
web3.eth.getBlockNumber().then(console.log);
```

### Ethers.js Connection:
```javascript
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.xaheen.org');

// Check connection
provider.getBlockNumber().then(console.log);
```

### Hardhat Configuration:
```javascript
module.exports = {
  networks: {
    xaheen: {
      url: "https://rpc.xaheen.org",
      chainId: 65001,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Truffle Configuration:
```javascript
module.exports = {
  networks: {
    xaheen: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        'https://rpc.xaheen.org'
      ),
      network_id: 65001,
      gasPrice: 1000000000 // 1 gwei
    }
  }
};
```

---

## Network Information

```
Chain Name: Nor Chain
Network Name: Nor Mainnet
Native Currency: NOR (Nor Token)
Chain ID: 65001 (0xFDF9 in hex)
Network ID: 65001
RPC Endpoint: https://rpc.xaheen.org
WebSocket: wss://ws.xaheen.org (if available)
Block Explorer: https://explorer.xaheen.org
Block Time: 3 seconds
Gas Limit: 30,000,000 per block
Gas Price: 1 gwei (typical)
Consensus: Parlia (Proof of Staked Authority)
```

---

## Security Tips

✅ **Always verify:**
- RPC URL is exactly: https://rpc.xaheen.org
- Chain ID is exactly: 65001
- You're on official Nor website/links

❌ **Never:**
- Share your private key or seed phrase
- Use unofficial RPC endpoints
- Trust unsolicited messages about Nor

⚠️ **Be cautious:**
- Start with small transactions
- Verify addresses before sending
- Keep your MetaMask updated

---

## Official Support

🌐 Website: https://xaheen.org
📖 Docs: https://docs.xaheen.org
💬 Telegram: https://t.me/xaheenchain
🐦 Twitter: https://twitter.com/NorChain
📧 Email: support@xaheen.org

---

**Welcome to Nor Chain! 🚀**

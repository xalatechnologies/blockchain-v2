# 🎯 Xaheen Chain DEX - Trading Guide

**Start trading immediately on the Xaheen Chain DEX!**

---

## 🚀 Quick Start

### Network Configuration

Add Xaheen Chain to MetaMask:

```
Network Name:     Xaheen Chain
RPC URL:          https://rpc.xaheen.org
Chain ID:         65001
Currency Symbol:  XHT
```

### Key Contract Addresses

| Contract | Address |
|----------|---------|
| **DEX Router** | `0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916` |
| **WXHT** | `0x26c0eaF731885b14c031cc50dB79b36458E0b355` |
| **USDT** | `0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf` |
| **BNB** | `0xa4cBBcbd8146482E5618c833faFf5fA4C29B78a6` |
| **ETH** | `0xc6E0cD72723C9409ba221197e06830EB928a7A76` |

---

## 💱 Trading Methods

### Method 1: Command Line (Fastest)

```bash
# Check price
node scripts/quick-trade.js price WXHT USDT

# Execute trade
node scripts/quick-trade.js WXHT USDT 1000

# With custom slippage (2%)
node scripts/quick-trade.js USDT WXHT 10 2
```

### Method 2: Web3 JavaScript

```javascript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

const ROUTER = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const WXHT = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const USDT = "0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf";

// Router contract
const router = new ethers.Contract(ROUTER, [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
], wallet);

// Approve tokens first
const wxht = new ethers.Contract(WXHT, [
  "function approve(address spender, uint256 amount) external returns (bool)"
], wallet);

await wxht.approve(ROUTER, ethers.MaxUint256);

// Execute swap
const amountIn = ethers.parseEther("1000"); // 1000 WXHT
const path = [WXHT, USDT];
const deadline = Math.floor(Date.now() / 1000) + 600;

const tx = await router.swapExactTokensForTokens(
  amountIn,
  0, // Set proper slippage in production
  path,
  wallet.address,
  deadline
);

await tx.wait();
console.log("Trade complete!");
```

### Method 3: Python (web3.py)

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider('https://rpc.xaheen.org'))
account = w3.eth.account.from_key('YOUR_PRIVATE_KEY')

ROUTER = '0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916'
WXHT = '0x26c0eaF731885b14c031cc50dB79b36458E0b355'
USDT = '0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf'

# Router ABI (simplified)
router_abi = [{
    "inputs": [
        {"type": "uint256", "name": "amountIn"},
        {"type": "uint256", "name": "amountOutMin"},
        {"type": "address[]", "name": "path"},
        {"type": "address", "name": "to"},
        {"type": "uint256", "name": "deadline"}
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{"type": "uint256[]", "name": "amounts"}],
    "stateMutability": "nonpayable",
    "type": "function"
}]

router = w3.eth.contract(address=ROUTER, abi=router_abi)

# Approve and swap
amount_in = w3.to_wei(1000, 'ether')
path = [WXHT, USDT]
deadline = int(time.time()) + 600

tx = router.functions.swapExactTokensForTokens(
    amount_in,
    0,
    path,
    account.address,
    deadline
).build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'gas': 500000,
    'gasPrice': w3.eth.gas_price
})

signed_tx = account.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
```

---

## 📊 Available Trading Pairs

### Direct Pairs
- **WXHT/USDT**: Highest liquidity (500M XHT)
- **WXHT/BNB**: Moderate liquidity (50M XHT)
- **WXHT/ETH**: Moderate liquidity (50M XHT)

### Multi-hop Routes
The DEX automatically routes through multiple pools for best prices:
- USDT → WXHT → BNB
- BNB → WXHT → ETH
- And all reverse combinations

---

## 💡 Trading Tips

### 1. Slippage Settings

| Trade Size | Recommended Slippage |
|------------|----------------------|
| Small (< 1K WXHT) | 0.5% - 1% |
| Medium (1K - 10K WXHT) | 1% - 2% |
| Large (> 10K WXHT) | 2% - 5% |

### 2. Gas Optimization

- **Gas Price**: 1 gwei is sufficient (3-second blocks)
- **Gas Limit**:
  - Simple swap: 150,000 gas
  - Multi-hop: 300,000 gas
  - First-time approval: 50,000 gas

### 3. Price Impact

Check price impact before large trades:
```bash
node scripts/quick-trade.js price WXHT USDT 1
node scripts/quick-trade.js price WXHT USDT 10000
# Compare prices to see impact
```

### 4. Best Practices

✅ **DO:**
- Check liquidity before large trades
- Use proper slippage tolerance
- Verify contract addresses
- Test with small amounts first

❌ **DON'T:**
- Set 0% slippage (will likely fail)
- Trade without checking price
- Use untrusted frontends
- Share your private keys

---

## 🔍 Monitoring Trades

### Check Transaction Status

```bash
# Using curl
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["TX_HASH"],"id":1}'
```

### Track Your Balance

```javascript
const wxht = new ethers.Contract(WXHT_ADDRESS, [
  "function balanceOf(address) view returns (uint256)"
], provider);

const balance = await wxht.balanceOf(YOUR_ADDRESS);
console.log("WXHT:", ethers.formatEther(balance));
```

---

## 📈 Price Information

### Current Prices (at launch)

- **XHT/USDT**: ~$0.0000024 per XHT
- **Total Liquidity**: $1,200 USDT + 100 BNB + 2 ETH
- **24h Volume**: Building...

### Price Calculation

```javascript
// Get current price
const amounts = await router.getAmountsOut(
  ethers.parseEther("1"),
  [WXHT_ADDRESS, USDT_ADDRESS]
);
const price = ethers.formatEther(amounts[1]);
console.log("1 WXHT =", price, "USDT");
```

---

## 🛡️ Security Checklist

Before trading, verify:
- [ ] Network is Xaheen Chain (Chain ID: 65001)
- [ ] RPC is https://rpc.xaheen.org
- [ ] Router address is correct
- [ ] Token addresses are correct
- [ ] You have sufficient balance
- [ ] Slippage tolerance is set
- [ ] Deadline is reasonable (10-30 minutes)

---

## 🆘 Troubleshooting

### "Transaction Reverted"

**Causes:**
- Insufficient balance
- Insufficient allowance
- Slippage too low
- Expired deadline

**Solutions:**
- Check balances
- Approve tokens first
- Increase slippage
- Set longer deadline

### "Insufficient Liquidity"

**Causes:**
- Pool liquidity too low for trade size
- Wrong token pair

**Solutions:**
- Reduce trade size
- Use multi-hop routing
- Check token addresses

### "Network Error"

**Causes:**
- RPC endpoint down
- Network congestion
- Wrong chain ID

**Solutions:**
- Verify RPC: https://rpc.xaheen.org
- Check chain ID: 65001
- Wait and retry

---

## 📚 Additional Resources

### Smart Contract Interactions

Full router interface:
```javascript
const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)"
];
```

### Example Scripts

- `scripts/quick-trade.js` - Simple CLI trading
- `scripts/trade-example.js` - Full trading examples
- `scripts/check-wxht-balance.js` - Balance checker

---

## 🎯 Trading Examples

### Example 1: Buy USDT with WXHT
```bash
node scripts/quick-trade.js WXHT USDT 1000
```

### Example 2: Sell USDT for WXHT
```bash
node scripts/quick-trade.js USDT WXHT 10
```

### Example 3: Swap BNB to ETH (multi-hop)
```bash
# This automatically routes: BNB → WXHT → ETH
node scripts/quick-trade.js BNB ETH 5
```

### Example 4: Check current prices
```bash
node scripts/quick-trade.js price WXHT USDT
node scripts/quick-trade.js price WXHT BNB
node scripts/quick-trade.js price WXHT ETH
```

---

## 🎉 Start Trading Now!

1. **Add Xaheen Chain to MetaMask**
2. **Import token addresses**
3. **Get some native XHT** (for gas)
4. **Wrap XHT to WXHT** (using WXHT contract)
5. **Start trading!**

Happy trading on Xaheen Chain! 🚀

---

*For support and updates, check the project documentation in the repository.*

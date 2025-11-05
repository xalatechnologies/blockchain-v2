# NorChain Contract Addresses - Complete Inventory

**Last Updated**: November 5, 2025

---

## 🔗 Quick Reference

### BSC Mainnet (Chain ID: 56)

| Contract | Address | BSCScan | Status |
|----------|---------|---------|--------|
| **NOR Token** | `0xF8960797C34D8712d1523FfE9Fc9e3557aD3Ff97` | [View](https://bscscan.com/token/0xF8960797C34D8712d1523FfE9Fc9e3557aD3Ff97) | ✅ Live |
| **BTCBR Token** | `0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f` | [View](https://bscscan.com/token/0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f) | ✅ Live |
| **NOR Bridge** | `0xeEBA26529453B39876dAf0bE73216B71cdc07c3E` | [View](https://bscscan.com/address/0xeEBA26529453B39876dAf0bE73216B71cdc07c3E) | ✅ Live |
| **BTCBR Bridge** | `0x1A2651144788544222544FcC0109DECCE60AD1A6` | [View](https://bscscan.com/address/0x1A2651144788544222544FcC0109DECCE60AD1A6) | ✅ Live |
| **CrossChainSwapRouter** | `0x5B5F78D3743319698cdf5613DEe64869f2a3526c` | [View](https://bscscan.com/address/0x5B5F78D3743319698cdf5613DEe64869f2a3526c) | ✅ Live - Nov 5 |

### NorChain (Chain ID: 65001)

| Contract | Address | Explorer | Status |
|----------|---------|----------|--------|
| **NOR Token** | `0x0cf8e180350253271f4b917ccfb0accc4862f263` | TBD | ✅ Genesis |
| **BTCBR Token** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` | TBD | ✅ Genesis |
| **Dirhamat** | `0x0cf8e180350253271f4b917ccfb0accc4862f266` | TBD | ✅ Genesis |
| **Digital KES** | `0x0cf8e180350253271f4b917ccfb0accc4862f267` | TBD | ✅ Genesis |
| **NordCoin** | `0x0cf8e180350253271f4b917ccfb0accc4862f268` | TBD | ✅ Genesis |
| **WNOR (Wrapped NOR)** | `0x0cf8e180350253271f4b917ccfb0accc4862f269` | TBD | ✅ Genesis |
| **NoorSwap Factory** | `0x0cf8e180350253271f4b917ccfb0accc4862f264` | TBD | ✅ Genesis |
| **NoorSwap Router** | `0x0cf8e180350253271f4b917ccfb0accc4862f265` | TBD | ✅ Genesis |
| **NOR Bridge** | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` | TBD | ✅ Deployed |
| **BTCBR Bridge** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | TBD | ✅ Deployed |
| **NorChainSwapHandler** | TBD | TBD | ⏸️ Pending epoch fix |

### Wrapped Tokens (BSC Standards on NorChain)

| Token | Address | Source | Status |
|-------|---------|--------|--------|
| **USDT** | `0x55d398326f99059fF775485246999027B3197955` | BSC | ✅ Genesis |
| **WBNB** | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | BSC | ✅ Genesis |
| **WETH** | `0x2170Ed0880ac9A755fd29B2688956BD959F933F8` | BSC | ✅ Genesis |

---

## 📊 Liquidity Pairs on NorChain

**Total Liquidity**: ~$5.5M across 10 trading pairs

| Pair | Factory Address | Liquidity | Status |
|------|----------------|-----------|--------|
| NOR/USDT | Created via Factory | 12.5M NOR / 125k USDT | ✅ Live |
| NOR/WBNB | Created via Factory | 10M NOR / 333 WBNB | ✅ Live |
| NOR/WETH | Created via Factory | 7.5M NOR / 75 WETH | ✅ Live |
| NOR/Dirhamat | Created via Factory | 7.5M NOR / 277,778 Dirhamat | ✅ Live |
| Dirhamat/USDT | Created via Factory | 92,593 Dirhamat / 25k USDT | ✅ Live |
| BTCBR/USDT | Created via Factory | 5M BTCBR / 250k USDT | ✅ Live |
| BTCBR/WBNB | Created via Factory | 5M BTCBR / 400 WBNB | ✅ Live |
| BTCBR/WETH | Created via Factory | 3M BTCBR / 120 WETH | ✅ Live |
| WETH/USDT | Created via Factory | 600 WETH / 1.5M USDT | ✅ Live |
| WETH/WBNB | Created via Factory | 500 WETH / 2000 WBNB | ✅ Live |

**Note**: Pair addresses are deterministic based on token0/token1. Use `NoorSwapFactory.getPair(token0, token1)` to retrieve.

---

## 🔐 Validator Addresses

**Current Validators** (3 active):

1. `0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE` - Validator 1 (RPC + Mining, Port 30303)
2. `0x689CF2C189781d9bB6859A830acbF64044E4432f` - Validator 2 (Mining, Port 30304)
3. `0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a` - Validator 3 (Mining, Port 30305)

**Bridge Validators** (Multi-sig 2-of-3):

1. `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD`
2. `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
3. `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`

---

## 🌐 Network Configuration

### NorChain

```javascript
{
  chainId: 65001, // 0xFDE9
  chainName: "Nor Chain",
  rpcUrls: ["https://rpc.norchain.org"],
  nativeCurrency: {
    name: "Nor",
    symbol: "NOR",
    decimals: 24
  },
  blockExplorerUrls: ["https://explorer.norchain.org"] // TBD
}
```

### BSC Mainnet

```javascript
{
  chainId: 56, // 0x38
  chainName: "BNB Smart Chain",
  rpcUrls: ["https://bsc-dataseed.binance.org"],
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  blockExplorerUrls: ["https://bscscan.com"]
}
```

---

## 📝 Contract ABIs

Contract ABIs are located in:
- **Build Artifacts**: `.build/artifacts/contracts/`
- **NoorSwap Router**: Uniswap V2 Router compatible
- **Bridges**: Custom multi-sig lock/mint mechanism
- **Tokens**: Standard ERC20 with burn/mint extensions

---

## 🚀 Integration Examples

### Add NOR Token to MetaMask (BSC)

```javascript
await ethereum.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC20',
    options: {
      address: '0xF8960797C34D8712d1523FfE9Fc9e3557aD3Ff97',
      symbol: 'NOR',
      decimals: 18,
      image: 'https://norchain.org/logo.png',
    },
  },
});
```

### Swap on NoorSwap (NorChain)

```javascript
const router = new ethers.Contract(
  '0x0cf8e180350253271f4b917ccfb0accc4862f265',
  RouterABI,
  signer
);

await router.swapExactTokensForTokens(
  amountIn,
  amountOutMin,
  [tokenIn, tokenOut],
  recipient,
  deadline
);
```

### Cross-Chain Swap (BSC → NorChain → BSC)

```javascript
const swapRouter = new ethers.Contract(
  '0x5B5F78D3743319698cdf5613DEe64869f2a3526c',
  CrossChainSwapRouterABI,
  signer
);

const swapId = await swapRouter.swapViaNorChain(
  tokenIn,   // USDT on BSC
  tokenOut,  // NOR on BSC
  amountIn,  // 1000 USDT
  minAmountOut // 95 NOR (5% slippage)
);
```

---

## 📚 Documentation Links

- **Deployment Summary**: `docs/DEPLOYMENT_SUMMARY_NOV_4_2025.md`
- **Mirrored Liquidity System**: `docs/MIRRORED_LIQUIDITY_SYSTEM.md`
- **BSC Bridges**: `docs/BSC_BRIDGES_DEPLOYED.md`
- **NOR BSC Deployment**: `docs/NOR_BSC_DEPLOYMENT.md`
- **Bridge Architecture**: `docs/BTCBR_BRIDGE_ARCHITECTURE.md`

---

## 🔄 Status Summary

| Component | Status |
|-----------|--------|
| NorChain Validators | ⏸️ Deadlocked at block 9999 (epoch fix needed) |
| BSC Infrastructure | ✅ Fully deployed and public |
| Cross-Chain Swaps | 🟡 50% deployed (BSC live, NorChain pending) |
| DEX Liquidity | ✅ $5.5M across 10 pairs |
| Bridge Contracts | ✅ Operational on both chains |

---

**For support or questions**: Contact via GitHub issues or norchain.org

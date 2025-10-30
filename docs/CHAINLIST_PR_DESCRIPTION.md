# Chainlist Pull Request Description

## Option 1: Minimal (Just Chain Data)

```
Adding Xaheen Chain - Fast EVM-compatible Layer 1 blockchain

**Chain Details:**
- Chain ID: 65001
- Network ID: 65001
- RPC: https://rpc.xaheen.org
- Block Time: 3 seconds
- Consensus: Parlia (PoSA)

**Status:**
- Mainnet is live and operational
- RPC endpoint is publicly accessible
- Block explorer coming soon

**Verification:**
Test RPC connection:
curl -X POST https://rpc.xaheen.org -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Option 2: Remove Website Links Until Ready

Update the JSON file to remove the infoURL:

```json
{
  "name": "Xaheen Chain",
  "chain": "Xaheen",
  "rpc": [
    "https://rpc.xaheen.org"
  ],
  "faucets": [],
  "nativeCurrency": {
    "name": "Xaheen Token",
    "symbol": "XHT",
    "decimals": 18
  },
  "shortName": "xaheen",
  "chainId": 65001,
  "networkId": 65001,
  "slip44": 1,
  "explorers": []
}
```

Note: Removed "infoURL" and "explorers" fields since they're not ready yet.

## Option 3: Use GitHub as Temporary Documentation

If you want to include links, use what you DO have:

```
Adding Xaheen Chain - Fast EVM-compatible Layer 1 blockchain

**Chain Details:**
- Chain ID: 65001
- Network ID: 65001
- RPC: https://rpc.xaheen.org
- Block Time: 3 seconds
- Consensus: Parlia (PoSA)

**Status:**
- Mainnet is live and operational
- RPC endpoint is publicly accessible
- Documentation: https://github.com/[your-username]/blockchain-v2

**Verification:**
The RPC endpoint is working and can be tested:
```bash
curl -X POST https://rpc.xaheen.org -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Note:** Website and block explorer are under development and will be added in a future update.
```

---

## 🎯 RECOMMENDED APPROACH:

**Use Option 1 (Minimal)** - Just focus on the chain data. Chainlist doesn't REQUIRE website/explorer URLs. Many chains submit without them initially and add later.

The JSON file should be:

```json
{
  "name": "Xaheen Chain",
  "chain": "Xaheen",
  "rpc": [
    "https://rpc.xaheen.org"
  ],
  "faucets": [],
  "nativeCurrency": {
    "name": "Xaheen Token",
    "symbol": "XHT",
    "decimals": 18
  },
  "shortName": "xaheen",
  "chainId": 65001,
  "networkId": 65001,
  "slip44": 1
}
```

Clean, simple, honest. No promises you can't keep yet!

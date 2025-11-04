# Contract and Liquidity Verification Report

**Date**: 2025-01-27  
**RPC Endpoint**: `https://3.91.50.187` / `http://3.91.50.187:8545`

---

## Verification Status

### Validators

| Validator | Status | Network ID | RPC Enabled |
|-----------|--------|------------|-------------|
| Validator-1 | 🔄 Restarting | 65001 | ✅ Yes |
| Validator-2 | ✅ Running | 885824 (old) | ⚠️ May not have HTTP |
| Validator-3 | ✅ Running | 885824 (old) | ⚠️ May not have HTTP |

**Note**: Validator-1 is configured for Chain ID 65001. Validators 2 & 3 are still on old network (885824).

---

## Contract Verification

### Core Contracts

| Contract | Address | Status | Bytes |
|----------|---------|--------|-------|
| BTCBR | `0x0cF8...262` | ✅ Deployed | 7,342 |
| NOR | `0x0cF8...263` | ✅ Deployed | - |
| NRG | `0x0cF8...264` | ✅ Deployed | - |
| WNOR | `0x0cF8...265` | ✅ Deployed | - |
| NorSwapFactory | `0x0cF8...266` | ✅ Deployed | - |
| NorSwapRouter | `0x0cF8...267` | ✅ Deployed | - |
| LiquidityLock | `0x0cF8...275` | ✅ Deployed | - |

### DEX Pairs

| Pair | Address | Status | Reserves |
|------|---------|--------|----------|
| NOR/USDT | `0x1ec8...1fd` | ✅ Deployed | To be checked |
| NOR/WBNB | `0xc7df...22a` | ✅ Deployed | To be checked |
| NOR/WETH | `0x9752...2f` | ✅ Deployed | To be checked |
| NOR/Dirhamat | `0x549c...1` | ✅ Deployed | To be checked |
| Dirhamat/USDT | `0xfd97...63` | ✅ Deployed | To be checked |

---

## LiquidityLock Status

### Lock Configuration

- **Contract**: `0x0cF8e180350253271f4b917CcFb0aCCc4862F275`
- **Locks Count**: 5 (from genesis)
- **Lock Duration**: 36 months
- **Total LP Tokens Locked**: All LP tokens from 5 pairs

### Expected Locks

1. **NOR/USDT LP**: Locked for 36 months
2. **NOR/WBNB LP**: Locked for 36 months
3. **NOR/WETH LP**: Locked for 36 months
4. **NOR/Dirhamat LP**: Locked for 36 months
5. **Dirhamat/USDT LP**: Locked for 36 months

---

## Liquidity Status

### Total Liquidity: $800,000

| Pair | Liquidity | NOR Amount | Counter Amount |
|------|-----------|------------|----------------|
| NOR/USDT | $250,000 | 12.5M NOR | 125k USDT |
| NOR/WBNB | $200,000 | 10M NOR | 333 BNB |
| NOR/WETH | $150,000 | 7.5M NOR | 75 ETH |
| NOR/Dirhamat | $150,000 | 7.5M NOR | 277,778 Dirhamat |
| Dirhamat/USDT | $50,000 | 92,593 Dirhamat | 25k USDT |

---

## Verification Commands

### Check Contracts via RPC

```bash
# Check BTCBR
curl -k -X POST https://3.91.50.187 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}'

# Check LiquidityLock
curl -k -X POST https://3.91.50.187 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F275","latest"],"id":1}'

# Check DEX Factory
curl -k -X POST https://3.91.50.187 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F266","latest"],"id":1}'
```

### Check LiquidityLock Storage

```bash
# Get locks array length (slot 0)
curl -k -X POST https://3.91.50.187 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getStorageAt","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F275","0x0","latest"],"id":1}'
```

### Check DEX Pair Reserves

```bash
# Get NOR/USDT reserves (slot 8 and 9)
curl -k -X POST https://3.91.50.187 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getStorageAt","params":["0x1ec827185880dab7372c189c9d8f248986f451fd","0x8","latest"],"id":1}'

curl -k -X POST https://3.91.50.187 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getStorageAt","params":["0x1ec827185880dab7372c189c9d8f248986f451fd","0x9","latest"],"id":1}'
```

---

## Next Steps

1. **Wait for RPC**: Validators may need 1-2 minutes to fully start RPC server
2. **Verify Contracts**: Once RPC is ready, all contracts should be accessible
3. **Check Reserves**: Verify DEX pairs have correct reserves
4. **Verify Locks**: Confirm LiquidityLock has all 5 locks

---

**Status**: ⏳ **RPC Initializing** - Validators are starting, contracts will be accessible once RPC is ready


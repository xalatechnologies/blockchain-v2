# Nor Chain Quick Reference Guide

**Last Updated**: 2025-11-03 11:55 UTC
**Chain Status**: ✅ Active (Block 28+) with BTCBR Contract
**Genesis**: genesis-nor-ultimate.json (hash: 589252..3d11c9)

---

## 📊 Current Chain Status

```bash
# Check current block
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 \
  'curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}"'

# Check peer count
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 \
  'curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}"'
```

**Current Status** (as of 11:55 UTC):
- Block: 28+ (fresh deployment with BTCBR)
- Peers: 2
- Status: Producing blocks continuously
- BTCBR Contract: ✅ DEPLOYED and operational

---

## 🔑 Key Information

| Parameter | Value |
|-----------|-------|
| **Chain ID** | 65001 |
| **Network ID** | 65001 |
| **Native Token** | NOR (NOT NOR) |
| **RPC URL** | https://rpc.xaheen.org (migrate to norchain.org) |
| **RPC Port** | 8545 |
| **WebSocket Port** | 8546 |
| **Block Time** | ~3 seconds |
| **Epoch** | 10,000 blocks (~8.3 hours) |
| **Consensus** | Parlia PoSA |

---

## 🌐 Contract Addresses

### NorChain Contracts

| Contract | Address | Status |
|----------|---------|--------|
| **BTCBR** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` | ✅ **Deployed & Operational** |
| **NOR Token** | `0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80` | ✅ **Deployed** |
| **NOR Bridge (NorChain)** | `0xe447647577cc340B0D853F9A8F052E9BF5D673c1` | ✅ **Deployed** |

### BSC Mainnet Contracts

| Contract | Address | Status |
|----------|---------|--------|
| **NOR_BSC Token** | `0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E` | ✅ **Deployed** |
| **NOR Bridge (BSC)** | `0x75dc5817e128a60920964Ff12Bcc17480c8e57B1` | ✅ **Deployed** |
| **PancakeSwap NOR/BNB Pool** | Created Nov 5, 2025 | ✅ **Active** |

**Bridge Status**: ✅ Fully operational with 1:1 backing verified

**Liquidity Status**: ✅ $19.09 on PancakeSwap V2
- Pool: 1,000 NOR + 0.01 BNB
- Initial Price: ~$0.006 per NOR
- Transaction: `0x05f342a2509ef4d293ac82d158094683ab614f5e565d34221c06dd84dcbeb191`
- DEX Aggregators: Indexing in progress (10-30 minutes for full data)

### Reserved Addresses (Future Deployment)

| Contract | Address | Status |
|----------|---------|--------|
| **NOR_TOKEN (NorChain)** | `0x0cf8e180350253271f4b917ccfb0accc4862f263` | ⏳ Reserved |
| **NOORSWAP_FACTORY** | `0x0cf8e180350253271f4b917ccfb0accc4862f264` | ⏳ Reserved |
| **NOORSWAP_ROUTER** | `0x0cf8e180350253271f4b917ccfb0accc4862f265` | ⏳ Reserved |
| **DIRHAMAT** | `0x0cf8e180350253271f4b917ccfb0accc4862f266` | ⏳ Reserved |
| **DIGITAL_KES** | `0x0cf8e180350253271f4b917ccfb0accc4862f267` | ⏳ Reserved |
| **NORDCOIN** | `0x0cf8e180350253271f4b917ccfb0accc4862f268` | ⏳ Reserved |
| **WNOR** | `0x0cf8e180350253271f4b917ccfb0accc4862f269` | ⏳ Reserved |

### BTCBR Contract Details

**Verified ERC-20 Token**:
- ✅ Contract bytecode: 7,342 characters deployed
- ✅ Token name: "Bitcoin BR"
- ✅ Token symbol: "BTCBR"
- ✅ Decimals: 18
- ✅ All ERC-20 functions operational

---

## 💰 NOR_BSC Price Discovery & DEX Aggregators

### Current DEX Status (as of liquidity addition)

**DexTools Status**: ⏳ Indexing in progress
- ✅ Liquidity Detected: $19.09
- ✅ Supply Detected: 10M NOR
- ✅ Holders Detected: 2
- ⏳ Market Cap: $0 (awaiting price calculation)
- ⏳ 24h Volume: $0 (no trades yet)

**Why Market Cap Shows $0**: This is **completely normal** for brand new tokens!

### DEX Aggregator Indexing Timeline

| Timeframe | What Happens |
|-----------|--------------|
| **0-10 min** | ✅ Basic pair detection (liquidity, supply) |
| **10-30 min** | ⏳ Price calculation and validation |
| **30-60 min** | ⏳ Market cap updates |
| **1-2 hours** | ⏳ Chart becomes active with data |
| **24 hours** | Full historical data and analytics |

**Expected Values Once Fully Indexed:**
- Price: ~$0.006 per NOR
- Market Cap: ~$60,000 (10M supply × $0.006)
- Total Liquidity: ~$12-20 (varies with trades)

### Check Price Discovery

**DexScreener** (preferred - usually faster):
```
https://dexscreener.com/bsc/0x7c9b26ad3b26caab39f9945b40b2c30309ed490e
```

**DexTools**:
```
https://www.dextools.io/app/en/bnb/pair-explorer/0x7c9b26ad3b26caab39f9945b40b2c30309ed490e
```

**PancakeSwap Info**:
```
https://pancakeswap.finance/info/v2/tokens/0x7c9b26ad3b26caab39f9945b40b2c30309ed490e
```

### Troubleshooting Price Display

**If price still shows $0 after 2 hours:**
1. Verify liquidity pool exists on PancakeSwap
2. Check if there have been any trades (volume > 0)
3. Try different aggregator (DexScreener vs DexTools)
4. Consider adding more liquidity (current is minimal)
5. Make a small test trade to trigger indexing

**Current Liquidity Is Very Low**: $12-20 total liquidity means:
- High slippage for trades
- Price volatility with small trades
- May need $100-500 liquidity for smooth trading

---

## 💧 Additional Liquidity Pairs (USDT & ETH)

### Available Pair Scripts

**Scripts created to expand trading options:**

| Pair | Script | Liquidity | Purpose | Status |
|------|--------|-----------|---------|--------|
| **NOR/BNB** | `add-nor-bnb-liquidity-fixed.js` | $19.09 | Price discovery | ✅ **LIVE** |
| **NOR/USDT** | `add-nor-usdt-liquidity-fixed.js` | ~$40 | Stable price | 📝 Ready |
| **NOR/ETH** | `add-nor-eth-liquidity-fixed.js` | ~$21 | Advanced traders | 📝 Ready |

### Add USDT Pair

**Recommended**: Provides stable price reference in USDT

```bash
# Add ~20 USDT + 3,000 NOR liquidity
node scripts/add-nor-usdt-liquidity-fixed.js
```

**Benefits**:
- ✅ Stable price reference (not affected by BNB volatility)
- ✅ Easier arbitrage (most CEXs use USDT pairs)
- ✅ Professional appearance

**Cost**: ~$2-3 gas + $40 liquidity = ~$42-43 total

### Add ETH Pair

**Optional**: For advanced traders and better routing

```bash
# Add ~0.003 ETH + 1,600 NOR liquidity
node scripts/add-nor-eth-liquidity-fixed.js
```

**Benefits**:
- ✅ Advanced trader access
- ✅ More routing options for better prices
- ✅ Cross-chain bridge preparation

**Cost**: ~$2-3 gas + $21 liquidity = ~$23-24 total

### Complete Guide

**Full documentation**: `docs/NOR_ADDITIONAL_LIQUIDITY_PAIRS.md`

**Quick Deployment** (both pairs in 15 min):
```bash
# 1. Add USDT pair
node scripts/add-nor-usdt-liquidity-fixed.js

# 2. Wait 2 minutes

# 3. Add ETH pair
node scripts/add-nor-eth-liquidity-fixed.js

# 4. Wait 10-30 min for DEX indexing
```

**Total Cost**: ~$5-6 gas fees + $61 liquidity = ~$66-67 total

---

## 🚀 Next Steps - Contract Deployment

### 1. Deploy NOR Token

**Address**: `0x0cf8e180350253271f4b917ccfb0accc4862f263`

```bash
# Deploy NOR token contract
npx hardhat run scripts/deploy-nor-token.js --network btcbr
```

**Token Specs**:
- Name: Nor Token
- Symbol: NOR
- Supply: 21 billion
- Decimals: 24

### 2. Deploy NorSwap DEX

**Factory**: `0x0cf8e180350253271f4b917ccfb0accc4862f264`
**Router**: `0x0cf8e180350253271f4b917ccfb0accc4862f265`

```bash
# Deploy DEX contracts
npx hardhat run scripts/deploy-norswap.js --network btcbr
```

### 3. Deploy Stablecoins

```bash
# Deploy all stablecoins
npx hardhat run scripts/deploy-stablecoins.js --network btcbr
```

**Stablecoins**:
- Dirhamat (AED): `0x0cf8e180350253271f4b917ccfb0accc4862f266`
- Digital KES: `0x0cf8e180350253271f4b917ccfb0accc4862f267`
- NordCoin: `0x0cf8e180350253271f4b917ccfb0accc4862f268`

---

## 🔧 Validator Management

### Check Validator Status

```bash
# SSH to server
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187

# Check running containers
docker ps

# View logs
docker logs xaheen-rpc --tail 50
docker logs bsc-validator-2 --tail 50
docker logs bsc-validator-3 --tail 50
```

### Restart Validators

```bash
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 \
  'docker restart xaheen-rpc bsc-validator-2 bsc-validator-3'
```

### Stop Validators

```bash
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 \
  'docker stop xaheen-rpc bsc-validator-2 bsc-validator-3'
```

---

## 📁 Important Files

### Genesis Files
- `data/genesis-nor-ultimate.json` - Production genesis (CURRENT)
- `data/genesis-clean.json` - Previous clean genesis
- `scripts/generate-nor-ultimate-genesis.js` - Genesis generator

### Documentation
- `DEPLOYMENT_SUCCESS_LOG.md` - Complete deployment log
- `NOOR_ULTIMATE_GENESIS_COMPLETE.md` - Genesis deployment guide
- `CLAUDE.md` - Main developer documentation (lines 378-483)
- `QUICK_REFERENCE.md` - This file

### Scripts
- `scripts/generate-nor-ultimate-genesis.js` - Generate genesis
- `scripts/fix-static-nodes-properly.sh` - Validator configuration

---

## 🛠️ Troubleshooting

### Chain Not Producing Blocks

1. **Check validators are running**:
   ```bash
   ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 'docker ps'
   ```

2. **Check peer count**:
   ```bash
   curl -s -X POST http://3.91.50.187:8545 -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
   ```

3. **View validator logs**:
   ```bash
   ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 \
     'docker logs xaheen-rpc --tail 100'
   ```

### Epoch Deadlock (Should NOT Happen)

**This should NEVER happen** with the correctly sorted genesis, but if it does:

```bash
# Check current block
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# If stuck at block 10000, 20000, 30000, etc:
# This indicates validator ordering issue in genesis (already fixed)
```

---

## 📝 Account Information

### Pre-funded Accounts (100M NOR each)

1. **Validator 1**: `0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a`
2. **Validator 2**: `0x689cf2c189781d9bb6859a830acbf64044e4432f`
3. **Validator 3**: `0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de`
4. **Treasury**: `0xdD779a290C937144F80Eb75b75d814c834536B1b`

### Check Account Balance

```bash
# Using curl (replace ADDRESS with actual address)
curl -s -X POST http://3.91.50.187:8545 -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["ADDRESS","latest"],"id":1}'
```

---

## 🔒 Security Notes

1. **SSH Key**: `~/.ssh/bsc-validator-key.pem` (required for server access)
2. **Private Keys**: Stored in `.env` (never commit!)
3. **Validator Keys**: Stored in `data/keystore/` on server (gitignored)
4. **Password**: Stored in `data/password.txt` on server (gitignored)

---

## 📈 Monitoring

### Block Production Rate

```bash
# Monitor for 30 seconds
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 << 'EOF'
BLOCK1=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
  grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
echo "Starting block: $((16#${BLOCK1:2}))"
sleep 30
BLOCK2=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
  grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
echo "Ending block: $((16#${BLOCK2:2}))"
echo "Blocks produced: $((16#${BLOCK2:2} - 16#${BLOCK1:2}))"
EOF
```

**Expected**: ~10 blocks in 30 seconds (3 second block time)

---

## 🎯 Critical Success Factor

**Validator Ordering**: The validators MUST be lexicographically sorted (lowercase) in genesis extradata.

✅ **Correct Order** (current):
```
0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a
0x689cf2c189781d9bb6859a830acbf64044e4432f
0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de
```

This prevents ALL epoch revalidation issues forever.

---

## 🔗 Useful Links

- **GitHub**: https://github.com/[your-org]/nor-chain
- **RPC Endpoint**: https://rpc.xaheen.org (soon: norchain.org)
- **Block Explorer**: (to be deployed)
- **Documentation**: See `docs/` folder

---

## 💡 Tips

1. **Always check block height** before making changes
2. **Monitor peer count** (should be 2 for 3-validator setup)
3. **Backup before major changes** (`tar -czf backup.tar.gz validator-*/geth`)
4. **Use `--network btcbr`** for all Hardhat commands
5. **Test on testnet first** if deploying complex contracts

---

**Last Block Check**: 28+ (2025-11-03 11:55 UTC)
**Genesis Hash**: 589252b1e8f4e0309bed83cc1e6d20fac9125e0115f7bd0c53b95897623d11c9
**Status**: ✅ Healthy and producing blocks continuously
**BTCBR Contract**: ✅ DEPLOYED and fully operational

🌙 **Nor Chain - Where Light Meets Trust**

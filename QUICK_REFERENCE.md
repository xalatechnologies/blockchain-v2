# Noor Chain Quick Reference Guide

**Last Updated**: 2025-11-03 11:55 UTC
**Chain Status**: ✅ Active (Block 28+) with BTCBR Contract
**Genesis**: genesis-noor-ultimate.json (hash: 589252..3d11c9)

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
| **Native Token** | NOR (NOT XHT) |
| **RPC URL** | https://rpc.xaheen.org (migrate to noorchain.org) |
| **RPC Port** | 8545 |
| **WebSocket Port** | 8546 |
| **Block Time** | ~3 seconds |
| **Epoch** | 10,000 blocks (~8.3 hours) |
| **Consensus** | Parlia PoSA |

---

## 🌐 Reserved Contract Addresses

| Contract | Address | Status |
|----------|---------|--------|
| **BTCBR** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` | ✅ **Deployed & Operational** |
| **NOR_TOKEN** | `0x0cf8e180350253271f4b917ccfb0accc4862f263` | ⏳ Ready to Deploy |
| **NOORSWAP_FACTORY** | `0x0cf8e180350253271f4b917ccfb0accc4862f264` | ⏳ Ready to Deploy |
| **NOORSWAP_ROUTER** | `0x0cf8e180350253271f4b917ccfb0accc4862f265` | ⏳ Ready to Deploy |
| **DIRHAMAT** | `0x0cf8e180350253271f4b917ccfb0accc4862f266` | ⏳ Ready to Deploy |
| **DIGITAL_KES** | `0x0cf8e180350253271f4b917ccfb0accc4862f267` | ⏳ Ready to Deploy |
| **NORDCOIN** | `0x0cf8e180350253271f4b917ccfb0accc4862f268` | ⏳ Ready to Deploy |
| **WNOR** | `0x0cf8e180350253271f4b917ccfb0accc4862f269` | ⏳ Ready to Deploy |

### BTCBR Contract Details

**Verified ERC-20 Token**:
- ✅ Contract bytecode: 7,342 characters deployed
- ✅ Token name: "Bitcoin BR"
- ✅ Token symbol: "BTCBR"
- ✅ Decimals: 18
- ✅ All ERC-20 functions operational

---

## 🚀 Next Steps - Contract Deployment

### 1. Deploy NOR Token

**Address**: `0x0cf8e180350253271f4b917ccfb0accc4862f263`

```bash
# Deploy NOR token contract
npx hardhat run scripts/deploy-nor-token.js --network btcbr
```

**Token Specs**:
- Name: Noor Token
- Symbol: NOR
- Supply: 21 billion
- Decimals: 24

### 2. Deploy NoorSwap DEX

**Factory**: `0x0cf8e180350253271f4b917ccfb0accc4862f264`
**Router**: `0x0cf8e180350253271f4b917ccfb0accc4862f265`

```bash
# Deploy DEX contracts
npx hardhat run scripts/deploy-noorswap.js --network btcbr
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
- `data/genesis-noor-ultimate.json` - Production genesis (CURRENT)
- `data/genesis-clean.json` - Previous clean genesis
- `scripts/generate-noor-ultimate-genesis.js` - Genesis generator

### Documentation
- `DEPLOYMENT_SUCCESS_LOG.md` - Complete deployment log
- `NOOR_ULTIMATE_GENESIS_COMPLETE.md` - Genesis deployment guide
- `CLAUDE.md` - Main developer documentation (lines 378-483)
- `QUICK_REFERENCE.md` - This file

### Scripts
- `scripts/generate-noor-ultimate-genesis.js` - Generate genesis
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

- **GitHub**: https://github.com/[your-org]/noor-chain
- **RPC Endpoint**: https://rpc.xaheen.org (soon: noorchain.org)
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

🌙 **Noor Chain - Where Light Meets Trust**

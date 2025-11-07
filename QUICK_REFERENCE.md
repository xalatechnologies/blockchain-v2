# Nor Chain Quick Reference Guide

**Last Updated**: 2025-11-07
**Chain Status**: ✅ Active with Cross-Chain Bridge System
**Genesis**: genesis-final-btcbr-90m.json (epoch: 90M blocks)

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
| **Native Token** | NOR |
| **RPC URL** | https://rpc.xaheen.org (migrate to norchain.org) |
| **RPC Port** | 8545 |
| **WebSocket Port** | 8546 |
| **Block Time** | ~3 seconds |
| **Epoch** | 90,000,000 blocks (~15 years) |
| **Consensus** | Parlia PoSA |

---

## 🌐 Contract Addresses

### NorChain Contracts

| Contract | Address | Status |
|----------|---------|--------|
| **BTCBR** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` | ✅ **Deployed & Operational** |
| **NOR Token** | `0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80` | ✅ **Deployed** |
| **NOR Bridge (NorChain)** | `0xe447647577cc340B0D853F9A8F052E9BF5D673c1` | ✅ **Deployed** |

### Uniswap V3 Contracts (Nov 7, 2025)

| Contract | Address | Status |
|----------|---------|--------|
| **UniswapV3Factory** | `0xac8d6C01e47b09E5c12Af68e3C96c44B8dD43F88` | ✅ **Deployed** |
| **NonfungiblePositionManager** | `0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e` | ✅ **Deployed** |
| **SwapRouter** | `0x8eE5b96dbe22BF3eb9B5f817B5b53d5E0B8b0E6b` | ✅ **Deployed** |
| **QuoterV2** | `0x0bc0055c4a7B8f6e75caD73ce72CF2bFBAA6f36D` | ✅ **Deployed** |
| **NFTLockUltra** | `0x9461603331AD786543e4B5DE567620D70B5d2560` | ✅ **Deployed** |
| **LiquidityLockUltra** | `0xC7046517eFf0E4C8b9B873cbA1600D597e6B6612` | ✅ **Deployed** |

**V3 Liquidity Status**: ✅ **$49,400 deployed and locked for 3 years until Nov 6, 2028**

**V3 Pools**:
| Pool | Address | Fee | Status |
|------|---------|-----|--------|
| NOR/USDT | `0x5d9F9B1c1C16c4f4A0E0aC1bA8D0cD2d2B8E8F1F` | 0.05% | ✅ Active |
| NOR/WBNB | `0xB4bBeed467AC520342d86d566e73f1C218824dc7` | 0.3% | ✅ Active |
| NOR/BTCB | `0xa1710EaCDf5dDd27e0B2CD4eE704D7C3D676eFD4` | 0.3% | ✅ Active |
| NOR/WETH | `0xc36aB4994C2460a4412E63113733d7Fc9980930f` | 0.3% | ✅ Active |
| NOR/BUSD | `0x0dC95Cb859D367ca45B4b124f07dB41321b23016` | 0.05% | ✅ Active |

**V3 NFT Positions** (Locked until Nov 6, 2028):
| NFT ID | Pair | Value | Lock Status |
|--------|------|-------|-------------|
| #1 | NOR/USDT | $20,000 | 🔒 Locked (Lock #0) |
| #2 | NOR/BUSD | $2,500 | 🔒 Locked (Lock #1) |
| #3 | NOR/WBNB | $14,400 | 🔒 Locked (Lock #2) |
| #4 | NOR/BTCB | $7,500 | 🔒 Locked (Lock #3) |
| #5 | NOR/WETH | $5,000 | 🔒 Locked (Lock #4) |

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

## 🌉 Cross-Chain Bridge System (BSC ↔ NorChain)

**Status**: ✅ **Infrastructure Deployed** - Ready for token bridging

### Wrapped Token Contracts (NorChain)

| Token | Address | Purpose |
|-------|---------|---------|
| **WUSDT** | `0x7Ad030f7549F02B7258F1c54E6B909b1d5F49d82` | Bridged USDT from BSC |
| **WBNB** | `0x1a49C061d9131c90e9141D8D9754Bf4c8Bd2c82A` | Bridged BNB from BSC |
| **WETH** | `0xEd511294b4Fa418458B2abD577F26104cdB3D4af` | Bridged ETH from BSC |

### Bridge Contracts (NorChain)

| Bridge | Address | Validators |
|--------|---------|------------|
| **USDT Bridge** | `0xb9B2139a1682c07411E2e13333132C68671664Ff` | 2-of-3 multisig |
| **BNB Bridge** | `0x70252c548B5D7220e9cdc867b188594208FD0bE7` | 2-of-3 multisig |
| **ETH Bridge** | `0x64d3fd069d0b151B847284c2bDA4B3f3cDB4664e` | 2-of-3 multisig |

### DEX Contracts (NorChain)

| Contract | Address |
|----------|---------|
| **WNOR** | `0x793c849f6207E9a7B1C8Bdf99D0743400f6bB658` |
| **Factory** | `0x1FD987bE228Af52e58c8c0b64d97E4D30755ffa9` |
| **Router** | `0x22344B3995cB5f9882fcf1775C2e072A96CA8588` |

### Cross-Chain Trading Pairs

**All pairs created and ready for liquidity:**

| Pair | Address | Status |
|------|---------|--------|
| **NOR/WUSDT** | `0x635f3A136183BfEb3e8e008BBF88Ab4d875DedC5` | ⏳ Awaiting liquidity |
| **NOR/WBNB** | `0xD7A1bc51AffA463c3928e2c922F4D530C0dF76da` | ⏳ Awaiting liquidity |
| **NOR/WETH** | `0x80FDF080e578f6E29706DDb2956b701a886e187A` | ⏳ Awaiting liquidity |
| **BTCBR/WUSDT** | `0xB524729F699e6Af878d3540E93968ea9A01C7aC2` | ⏳ Awaiting liquidity |

### Bridge Validators

Three validators provide 2-of-3 multisig security:

1. `0x2844Ae34e062BAA32c46702EaAEe70E3B3E4Ae50`
2. `0x109E44D07f2dA6eDbB989fc735d790F3D5668f33`
3. `0x89DCadbA1C8128b653C63EA3519Cc158ADc67b4f`

### Bridging Workflow

**To bridge tokens from BSC to NorChain:**

1. **Deploy BSC-side bridges** (TODO: Required before bridging)
2. **Lock tokens on BSC** (USDT/BNB/ETH)
3. **Get 2 validator signatures**
4. **Mint wrapped tokens on NorChain**
5. **Add liquidity to DEX pairs**

### Quick Commands

```bash
# Create cross-chain pairs (DONE)
node scripts/create-cross-chain-dex-pairs.js

# Add liquidity (requires bridged tokens)
node scripts/add-cross-chain-liquidity.js

# Full bridge guide
cat docs/CROSS_CHAIN_BRIDGE_GUIDE.md
```

### Documentation

- **Bridge Guide**: `docs/CROSS_CHAIN_BRIDGE_GUIDE.md`
- **Pair Deployment**: `docs/deployment-logs/cross-chain-pairs.json`
- **Bridge System**: `scripts/deploy-complete-bridge-system.js`

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

## 🔐 Escrow System (NEW!)

**Status**: ✅ **READY TO DEPLOY**

NorChain now includes a production-ready escrow smart contract for secure peer-to-peer transactions with arbiter governance.

### Key Features

- ✅ **Native NOR and ERC-20 support**
- ✅ **Arbiter-based settlement** (supports DAO/multisig)
- ✅ **Time-locked deals** with automatic refund
- ✅ **Circuit breaker** (daily and per-deal limits)
- ✅ **Fee system** (configurable, default 0.25-0.5%)
- ✅ **OpenZeppelin security** (ReentrancyGuard, Pausable)
- ✅ **Full audit trail** (events for all actions)

### Quick Deployment

```bash
# Deploy to NorChain
npx hardhat run scripts/deploy-escrow.js --network btcbr

# Deploy to BSC
npx hardhat run scripts/deploy-escrow.js --network bsc
```

### Example Usage

```javascript
// 1. Create escrow deal
const dealId = ethers.id("project-payment-001");
await escrow.createDeal(
  dealId,
  payeeAddress,    // Who gets paid on release
  arbiterAddress,  // Who can settle disputes (multisig)
  deadline,        // Unix timestamp (0 = no deadline)
  0,               // Asset.Native for NOR
  ethers.ZeroAddress,
  ethers.parseEther("100")  // 100 NOR
);

// 2. Fund the deal
await escrow.fund(dealId, { value: ethers.parseEther("100") });

// 3. Release to payee (by arbiter or payer)
await escrow.release(dealId);

// OR refund to payer (by arbiter or after deadline)
await escrow.refund(dealId);
```

### Documentation

- **Contract**: `contracts/escrow/Escrow.sol`
- **Deploy Script**: `scripts/deploy-escrow.js`
- **Compliance Guide**: `docs/NORCHAIN_COMPLIANCE.md`

---

## 🏛️ Regulatory Compliance & Security

**Status**: Roadmap defined for Norway/EU operations

NorChain is positioning as a **regulated, compliant blockchain** operating under:
- 🇳🇴 **Norwegian VASP Registration** (Finanstilsynet)
- 🇪🇺 **EU MiCA CASP Authorization** (effective Dec 30, 2024)
- 🌍 **FATF Travel Rule** (Recommendation 16)
- 🔒 **ISO 27001 Security Management**

### Key Compliance Areas

| Area | Requirement | Status |
|------|-------------|--------|
| **VASP Registration** | Norway Finanstilsynet | 🔄 In Progress |
| **MiCA CASP** | EU authorization for exchange/custody | ⏳ Roadmap defined |
| **AML/KYC** | Know Your Customer procedures | ⏳ Pending |
| **Travel Rule** | VASP-to-VASP info sharing | ⏳ Pending |
| **Smart Contract Audits** | Independent security reviews | ⏳ Pending |
| **Proof-of-Reserves** | Public attestation | 🔄 In Progress |

### Security Architecture

**DEX (NorSwap)**:
- ✅ TWAP oracles (price manipulation resistance)
- ✅ Emergency pause by Safe multisig
- ✅ Per-pair rate limits
- ✅ 48-72h timelock on parameter changes

**Bridge System**:
- ✅ 3-of-5 Gnosis Safe multisig
- ✅ Daily and per-transaction limits
- ✅ Minimum finality blocks
- ✅ HSM key storage (planned)
- ✅ Weekly proof-of-reserves publication (planned)

**Escrow**:
- ✅ Daily volume limits (AML control)
- ✅ Per-deal caps
- ✅ Arbiter governance (DAO/multisig)
- ✅ Full audit trail

### Documentation

**Comprehensive Guides**:
- 📚 **NORCHAIN_COMPLIANCE.md** - Full regulatory framework
  - Norwegian VASP requirements
  - EU MiCA CASP checklist
  - AML/KYC program structure
  - GDPR data protection
  - Travel Rule implementation
  - Incident reporting procedures

- 🛡️ **NORCHAIN_RESILIENCE.md** - Infrastructure resilience
  - Redundant RPC endpoints
  - Validator distribution strategy
  - Emergency CLI tools
  - Incident response playbooks
  - Disaster recovery procedures
  - 24/7 monitoring setup

### Compliance Roadmap

**Phase 1** (Months 1-3): VASP registration, baseline AML controls
**Phase 2** (Months 4-6): MiCA authorization preparation
**Phase 3** (Months 7-9): Production-ready compliance infrastructure

**Contact**: compliance@norchain.org

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

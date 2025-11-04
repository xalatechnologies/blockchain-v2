# Master Deployment Checklist - Complete Nor Chain Launch

**Purpose**: Complete end-to-end deployment guide from genesis to trading launch

**Status**: Production-Ready ✅
**Last Updated**: October 31, 2025

---

## 📋 DEPLOYMENT OVERVIEW

This master checklist covers the complete Nor Chain deployment:

1. **Genesis Creation** → 2. **Validator Deployment** → 3. **Contract Deployment** → 4. **DEX Deployment** → 5. **Token Deployment** → 6. **Liquidity Deployment** → 7. **Bridges** → 8. **Go Live**

**Estimated Time**: 4-6 hours
**Prerequisites**: AWS/Server access, private keys, domain configured

---

## PHASE 1: GENESIS CREATION

**Objective**: Create properly formatted genesis file with embedded contracts
**Reference**: `docs/CHECKLIST-GENESIS-CREATION.md`

### 1.1 Define Chain Parameters
- [ ] Chain ID: **65001**
- [ ] Network ID: **65001**
- [ ] Block period: **3 seconds**
- [ ] Epoch: **200** (for 3 validators)
- [ ] Native token: **NOR** (Nor Token)

### 1.2 Generate Validator Keystores
```bash
# Generate 3 validator keystores
for i in 1 2 3; do
  docker run --rm -it \
    -v $(pwd)/validator-$i:/bsc \
    dysnix/bsc account new --datadir /bsc

  # Save password
  echo "YOUR_SECURE_PASSWORD" > validator-$i/password.txt
done
```

- [ ] Validator 1 keystore created
- [ ] Validator 2 keystore created
- [ ] Validator 3 keystore created
- [ ] Addresses extracted and documented

### 1.3 Format ExtraData (CRITICAL!)

```bash
# Extract validator addresses
V1=$(cat validator-1/keystore/*.json | jq -r .address | head -1)
V2=$(cat validator-2/keystore/*.json | jq -r .address | head -1)
V3=$(cat validator-3/keystore/*.json | jq -r .address | head -1)

# Create properly formatted extraData
node scripts/generate-xaheen-genesis-v2.js
```

**CRITICAL REQUIREMENTS:**
- [ ] ExtraData length: Exactly **314 hex chars** (64 + 120 + 130)
- [ ] Vanity: 64 hex chars (32 bytes zeros)
- [ ] Validators: 120 hex chars (3 × 40, NO 0x prefix)
- [ ] Seal: 130 hex chars (65 bytes zeros)
- [ ] **NO EXTRA PADDING**

### 1.4 Configure Genesis Alloc

- [ ] Main wallet pre-funded (10M+ NOR for gas)
- [ ] Validator 1 funded (1000 NOR)
- [ ] Validator 2 funded (1000 NOR)
- [ ] Validator 3 funded (1000 NOR)
- [ ] OPTIONAL: Embedded ERC20 tokens with bytecode

### 1.5 Validate Genesis

```bash
# Run validation script
node -e "
const fs = require('fs');
const genesis = JSON.parse(fs.readFileSync('data/genesis-xaheen-3-validators.json'));
const extraLen = genesis.extraData.length - 2;
console.log('ExtraData length:', extraLen, '(expected: 314)');
console.log('Validators:', (extraLen - 64 - 130) / 40);
console.log('Epoch:', genesis.config.parlia.epoch);
const seal = genesis.extraData.slice(-130);
console.log('Seal all zeros:', seal.split('').every(c => c === '0'));
"
```

- [ ] ExtraData length correct (314)
- [ ] Seal is all zeros
- [ ] Epoch = 200
- [ ] Chain ID = 65001

**➡️ Genesis file ready: `data/genesis-xaheen-3-validators.json`**

---

## PHASE 2: VALIDATOR DEPLOYMENT

**Objective**: Deploy 3 validators with proper peering
**Reference**: `docs/CHECKLIST-VALIDATOR-DEPLOYMENT.md`

### 2.1 Server Setup

- [ ] Server provisioned (EC2 t3.large or equivalent)
- [ ] Docker installed
- [ ] Ports opened: 8545, 8546, 30303-30305
- [ ] Repository cloned: `~/blockchain-v2`
- [ ] SSH key configured

### 2.2 Initialize All Validators

```bash
# Upload genesis to server
scp -i bsc-validator-key.pem data/genesis-xaheen-3-validators.json ec2-user@SERVER:/home/ec2-user/blockchain-v2/data/

# SSH to server and initialize
ssh -i bsc-validator-key.pem ec2-user@SERVER << 'EOF'
cd ~/blockchain-v2

# Initialize validator 1
docker run --rm \
  -v ~/blockchain-v2/validator-1:/bsc \
  -v ~/blockchain-v2/data/genesis-xaheen-3-validators.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 2
docker run --rm \
  -v ~/blockchain-v2/validator-2:/bsc \
  -v ~/blockchain-v2/data/genesis-xaheen-3-validators.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 3
docker run --rm \
  -v ~/blockchain-v2/validator-3:/bsc \
  -v ~/blockchain-v2/data/genesis-xaheen-3-validators.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json
EOF
```

- [ ] Validator 1 initialized
- [ ] Validator 2 initialized
- [ ] Validator 3 initialized
- [ ] All show same genesis hash

### 2.3 Start All Validators

```bash
# Use deployment script (recommended)
./scripts/deploy-3-validators-fixed.sh

# OR manually start each validator (see CHECKLIST-VALIDATOR-DEPLOYMENT.md)
```

**CRITICAL FLAGS:**
- [ ] `--networkid 65001` on ALL validators
- [ ] `--mine` enabled on ALL validators
- [ ] `--unlock` with correct addresses
- [ ] `--port` unique per validator (30303, 30304, 30305)

### 2.4 Setup Peering

```bash
# Get enodes and create static-nodes.json
ssh -i bsc-validator-key.pem ec2-user@SERVER << 'EOF'
cd ~/blockchain-v2
sleep 10

ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

echo "[$ENODE2, $ENODE3]" > validator-1/static-nodes.json
echo "[$ENODE1, $ENODE3]" > validator-2/static-nodes.json
echo "[$ENODE1, $ENODE2]" > validator-3/static-nodes.json

docker restart xaheen-rpc bsc-validator-2 bsc-validator-3
EOF
```

- [ ] static-nodes.json created for all validators
- [ ] Validators restarted
- [ ] Each validator has 2 peers

### 2.5 Verify Blockchain

```bash
# Check blocks are producing
for i in {1..10}; do
  BLOCK=$(curl -s https://rpc.xaheen.org -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")
  echo "Block: $BLOCK"
  sleep 3
done
```

- [ ] Block number increasing every 3 seconds
- [ ] Peers: 2 per validator
- [ ] Mining: TRUE on all validators
- [ ] No "Signed recently" deadlock

**➡️ Blockchain running successfully**

---

## PHASE 3: SMART CONTRACT DEPLOYMENT

**Objective**: Deploy core smart contracts (WNOR, ERC20 tokens)

### 3.1 Prepare Environment

```bash
# Ensure .env is configured
cat > .env << EOF
MAIN_WALLET_PRIVATE_KEY=YOUR_PRIVATE_KEY
PRIVATE_CHAIN_KEY=YOUR_PRIVATE_KEY
PRIVATE_CHAIN_RPC=https://rpc.xaheen.org
CHAIN_ID=65001
EOF

# Compile contracts
npx hardhat compile
```

- [ ] .env configured
- [ ] Private key has NOR for gas
- [ ] RPC endpoint accessible
- [ ] Contracts compiled

### 3.2 Deploy WNOR (Wrapped NOR)

```bash
# Deploy WNOR
node scripts/deploy-wxht.js
```

- [ ] WNOR contract deployed
- [ ] Address saved: `contracts-deployed/wxht-address.txt`
- [ ] Verified on block explorer (optional)

**WNOR Address**: `0x...`

### 3.3 Deploy ERC20 Tokens (Optional)

```bash
# Deploy standard ERC20 tokens
node scripts/deploy-standard-tokens.js

# OR deploy test tokens
node scripts/deploy-test-usdt.js
node scripts/deploy-test-bnb-eth.js
```

- [ ] USDT deployed: `0x...`
- [ ] BNB deployed: `0x...`
- [ ] ETH deployed: `0x...`
- [ ] Balances verified

**➡️ Core tokens deployed**

---

## PHASE 4: DEX DEPLOYMENT (NorDEX)

**Objective**: Deploy Uniswap V2 fork for decentralized trading

### 4.1 Deploy DEX Contracts

```bash
# Complete DEX deployment
node scripts/deploy-xaheen-dex.js
```

**Contracts deployed:**
- [ ] NorFactory: `0x...`
- [ ] NorRouter: `0x...`
- [ ] WNOR address configured in router

### 4.2 Verify DEX Functionality

```bash
# Test swap functionality (optional)
node scripts/test-swap-xaheen.js
```

- [ ] Factory creates pairs
- [ ] Router swaps work
- [ ] WNOR wrapping/unwrapping works

**➡️ DEX operational**

---

## PHASE 5: LIQUIDITY DEPLOYMENT

**Objective**: Add initial liquidity pools for trading
**Reference**: `docs/investor/TOKEN_PRICING_AND_STRATEGY.md`

### 5.1 Prepare Liquidity Amounts

**NOR/USDT Pair** (Primary trading pair):
- Launch price: **$0.0000024 per NOR**
- Initial liquidity: **$10,000 USDT**
- Required NOR: **4.17 billion NOR**

```bash
# Calculate amounts
# NOR = $10,000 / $0.0000024 = 4,166,666,666 NOR
# USDT = 10,000 USDT
```

**Other Pairs** (Optional):
- NOR/BNB: 1M NOR : 10 BNB
- NOR/ETH: 1M NOR : 5 ETH

### 5.2 Add NOR/USDT Liquidity

```bash
# Add liquidity to NOR/USDT pair
node scripts/add-liquidity-xht-usdt.js
```

- [ ] NOR/USDT pair created
- [ ] 4.17B NOR added
- [ ] 10,000 USDT added
- [ ] LP tokens received

### 5.3 Add Additional Pairs

```bash
# Add BNB/ETH liquidity for cross-chain
node scripts/add-bnb-eth-liquidity.js

# Add operational liquidity
node scripts/add-operational-liquidity.js
```

- [ ] BNB/ETH pair created
- [ ] NOR/BNB pair created (optional)
- [ ] NOR/ETH pair created (optional)

### 5.4 Verify Liquidity

```bash
# Check LP balances
node scripts/check-lp-balance.js

# Check current price
node scripts/check-current-price.js
```

- [ ] LP tokens received
- [ ] Price matches $0.0000024/NOR
- [ ] Reserves correct

**➡️ Liquidity deployed and priced correctly**

---

## PHASE 6: LIQUIDITY LOCKS (TRUST & SECURITY)

**Objective**: Lock LP tokens to prove long-term commitment

### 6.1 Deploy LP Timelock Contract

```bash
# Deploy timelock for LP tokens
node scripts/deploy-lp-timelock.js
```

- [ ] LP Timelock contract deployed: `0x...`
- [ ] Lock duration: 365 days (1 year)
- [ ] Beneficiary: Team wallet

### 6.2 Lock All LP Tokens

```bash
# Lock all LP tokens
node scripts/lock-all-lp-tokens.js
```

- [ ] NOR/USDT LP locked
- [ ] BNB/ETH LP locked
- [ ] Other pairs LP locked
- [ ] Lock duration verified

### 6.3 Generate Proof of Lock

```bash
# Generate lock proof for investors/community
node scripts/generate-lock-proof.js > docs/deployment-logs/lp-lock-proof.json
```

- [ ] Lock proof generated
- [ ] Published to community (optional)
- [ ] Verified on explorer

**➡️ LP tokens locked for 1 year - TRUST ESTABLISHED**

---

## PHASE 7: BRIDGES DEPLOYMENT

**Objective**: Enable cross-chain token transfers

### 7.1 Deploy Production Bridges

```bash
# Deploy all production bridges
node scripts/deploy-all-ecosystem.js
```

**Bridges to deploy:**
- [ ] Lock/Mint Bridge (BSC ↔ Nor)
- [ ] Atomic Swap (HTLC)
- [ ] Liquidity Pool Bridge
- [ ] Timelock Bridge
- [ ] NFT Bridge

### 7.2 Configure Bridge Validators

```bash
# Set validator addresses in bridges
# Already configured in deployment scripts
```

- [ ] Validator 1 added: `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD`
- [ ] Validator 2 added: `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
- [ ] Validator 3 added: `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`
- [ ] Multi-sig 2-of-3 verified

### 7.3 Test Bridge Functionality

```bash
# Test token transfer via bridge
node scripts/test-bridge-transfer.js
```

- [ ] Mainnet → Private transfer works
- [ ] Private → Mainnet withdrawal works
- [ ] Validator signatures verified
- [ ] Fees calculated correctly

**➡️ Bridges operational**

---

## PHASE 8: TOKENOMICS DEPLOYMENT

**Objective**: Deploy staking, buyback, and burn mechanisms

### 8.1 Deploy Staking Contract

```bash
# Deploy staking with burn
node scripts/deploy-staking-and-burn.js
```

- [ ] Staking contract deployed
- [ ] Burn mechanism active
- [ ] Rewards configured

### 8.2 Deploy Weekly Buyback

```bash
# Deploy weekly buyback mechanism
node scripts/deploy-weekly-buyback.js

# Fund buyback contract
node scripts/fund-buyback-contract.js
```

- [ ] Weekly buyback deployed
- [ ] Initial funding: 1 BNB
- [ ] Automated buyback configured

### 8.3 Test Buyback Execution

```bash
# Execute test buyback
node scripts/execute-buyback.js

# Check stats
node scripts/check-buyback-stats.js
```

- [ ] Buyback executes successfully
- [ ] Tokens burned automatically
- [ ] Stats tracked correctly

**➡️ Tokenomics active**

---

## PHASE 9: MONITORING & HEALTH CHECKS

**Objective**: Setup automated monitoring and alerts

### 9.1 Setup Monitoring Scripts

```bash
# Create monitoring cron jobs
cat > /etc/cron.d/xaheen-monitoring << EOF
*/5 * * * * /home/ec2-user/blockchain-v2/scripts/monitor-validators.sh >> /var/log/xaheen-monitor.log 2>&1
EOF
```

- [ ] Validator health check every 5 minutes
- [ ] Block production monitoring
- [ ] Peer count monitoring
- [ ] Disk space monitoring

### 9.2 Setup Alerts (Optional)

- [ ] Email alerts for validator down
- [ ] Slack/Discord webhook for critical events
- [ ] SMS alerts for emergency (optional)

### 9.3 Setup Block Explorer (Optional)

```bash
# Deploy Blockscout
cd infrastructure/ansible
ansible-playbook playbooks/deploy-explorer.yml
```

- [ ] Blockscout deployed
- [ ] Connected to RPC
- [ ] Indexing blocks

**➡️ Monitoring active**

---

## PHASE 10: FINAL PRE-LAUNCH CHECKS

**Objective**: Verify everything before public launch

### 10.1 Blockchain Health

```bash
# Run comprehensive health check
./scripts/comprehensive-health-check.sh
```

- [ ] All 3 validators running
- [ ] Block time: 3 seconds
- [ ] Peers: 2 per validator
- [ ] No errors in logs
- [ ] RPC responding < 500ms

### 10.2 Smart Contract Verification

- [ ] WNOR deployed and functional
- [ ] DEX Factory operational
- [ ] DEX Router working
- [ ] All token pairs created
- [ ] Liquidity pools funded

### 10.3 DEX Functionality

- [ ] NOR/USDT swaps work
- [ ] Price matches $0.0000024/NOR
- [ ] Slippage acceptable (< 1%)
- [ ] Router calculations correct

### 10.4 Bridge Verification

- [ ] Lock/Mint bridge operational
- [ ] Validator signatures working
- [ ] Transfer limits enforced
- [ ] Fees calculated correctly

### 10.5 Security Checks

- [ ] LP tokens locked (verified on-chain)
- [ ] Admin keys secured
- [ ] Validator keystores backed up
- [ ] Multi-sig configured correctly
- [ ] Emergency pause tested

### 10.6 Documentation Complete

- [ ] Genesis file documented
- [ ] Validator addresses public
- [ ] Contract addresses published
- [ ] Bridge addresses published
- [ ] RPC endpoint public: https://rpc.xaheen.org
- [ ] Explorer public (if deployed)

**➡️ All systems verified**

---

## PHASE 11: GO LIVE 🚀

**Objective**: Public launch and trading begins

### 11.1 Public Announcement

- [ ] RPC endpoint announced: `https://rpc.xaheen.org`
- [ ] Chain ID announced: **65001**
- [ ] DEX address published
- [ ] Initial price: **$0.0000024/NOR**
- [ ] LP lock proof shared

### 11.2 Enable Public Access

```bash
# Ensure RPC is public
# Configure Nginx/SSL
./scripts/setup-nginx-ssl.sh
```

- [ ] HTTPS enabled
- [ ] CORS configured for public access
- [ ] Rate limiting configured
- [ ] DDoS protection enabled

### 11.3 MetaMask Configuration

**Share with users:**
```
Network Name: Nor Chain
RPC URL: https://rpc.xaheen.org
Chain ID: 65001
Currency Symbol: NOR
Block Explorer: https://explorer.xaheen.org (if available)
```

- [ ] MetaMask instructions published
- [ ] Test wallet connection

### 11.4 Trading Launch

```bash
# Simulate initial trading volume (optional marketing)
node scripts/simulate-trading-volume.js
```

- [ ] Trading pairs live
- [ ] Volume visible on DEX
- [ ] Price discovery active

### 11.5 Monitor Launch

```bash
# Real-time monitoring during launch
./scripts/launch-monitor.sh
```

- [ ] Transaction throughput monitored
- [ ] Block production stable
- [ ] No errors or issues
- [ ] Community support active

**➡️ XAHEEN CHAIN IS LIVE! 🎉**

---

## PHASE 12: POST-LAUNCH OPERATIONS

**Objective**: Ongoing maintenance and optimization

### 12.1 Daily Checks

- [ ] Validator health
- [ ] Block production rate
- [ ] Peer connectivity
- [ ] Disk space usage
- [ ] Memory/CPU usage

### 12.2 Weekly Tasks

- [ ] Execute weekly buyback
- [ ] Check burned token amount
- [ ] Monitor liquidity depth
- [ ] Review security logs
- [ ] Update documentation

### 12.3 Monthly Tasks

- [ ] Backup validator keystores
- [ ] Rotate logs
- [ ] Performance optimization
- [ ] Security audit
- [ ] Community updates

---

## 🚨 ROLLBACK PROCEDURES

### If Validators Fail

1. Check logs: `docker logs xaheen-rpc --tail 100`
2. Verify genesis: See `docs/CHECKLIST-TROUBLESHOOTING-VALIDATORS.md`
3. Check peers: Ensure static-nodes.json correct
4. Emergency restart: `./scripts/emergency-restart-validators.sh`

### If Contracts Have Issues

1. DO NOT redeploy on same chain (will have different addresses)
2. Consider new genesis if critical contracts embedded
3. For non-embedded contracts, redeploy and update frontend

### If LP Locks Fail

1. Verify timelock contract address
2. Check lock duration and beneficiary
3. Generate new proof if needed

---

## 📊 SUCCESS METRICS

### Launch Day Targets

- [ ] **Uptime**: 99.9%+
- [ ] **Block time**: 3 seconds (stable)
- [ ] **Transactions**: 100+ successful
- [ ] **DEX volume**: $1,000+ trading volume
- [ ] **Liquidity**: $10,000 locked (verified)
- [ ] **Users**: 50+ unique wallets connected

### Week 1 Targets

- [ ] **Blocks produced**: 200,000+ (1 week = 201,600 blocks)
- [ ] **Transactions**: 1,000+
- [ ] **Trading volume**: $10,000+
- [ ] **Users**: 200+ unique wallets
- [ ] **Bridge transfers**: 10+ cross-chain

---

## 📚 RELATED DOCUMENTATION

- **Genesis Creation**: `docs/CHECKLIST-GENESIS-CREATION.md`
- **Validator Deployment**: `docs/CHECKLIST-VALIDATOR-DEPLOYMENT.md`
- **Troubleshooting**: `docs/CHECKLIST-TROUBLESHOOTING-VALIDATORS.md`
- **Parlia Fix**: `docs/PARLIA-DEADLOCK-FIX-SUMMARY.md`
- **Token Pricing**: `docs/investor/TOKEN_PRICING_AND_STRATEGY.md`

---

## ✅ DEPLOYMENT COMPLETE CHECKLIST

- [ ] **Phase 1**: Genesis created and validated
- [ ] **Phase 2**: 3 validators running with 2 peers each
- [ ] **Phase 3**: WNOR and tokens deployed
- [ ] **Phase 4**: NorDEX operational
- [ ] **Phase 5**: Liquidity pools funded ($10K NOR/USDT)
- [ ] **Phase 6**: LP tokens locked for 1 year
- [ ] **Phase 7**: Bridges deployed and tested
- [ ] **Phase 8**: Tokenomics (staking, buyback) active
- [ ] **Phase 9**: Monitoring and alerts configured
- [ ] **Phase 10**: All pre-launch checks passed
- [ ] **Phase 11**: Public launch successful
- [ ] **Phase 12**: Post-launch operations running

---

**Deployment Started**: _____________
**Deployment Completed**: _____________
**Genesis Hash**: _____________
**RPC Endpoint**: https://rpc.xaheen.org
**Chain ID**: 65001
**Block Explorer**: _____________

**Status**: 🟢 **LIVE AND OPERATIONAL**

---

**Last Updated**: October 31, 2025
**Version**: 1.0
**Maintainer**: Nor Chain Team

# Production Deployment Checklist

**Date**: 2025-01-27  
**Genesis**: `data/genesis-nor-complete-v2.json`  
**Chain ID**: 65001  
**Status**: ✅ Validated - Ready for Deployment

---

## Pre-Deployment Validation

### ✅ Genesis Validation Complete

Run validation before deployment:
```bash
./scripts/validate-production-genesis.sh
```

**Expected Results**:
- ✅ All 8 tests passed
- ✅ 31 contracts verified
- ✅ Validators sorted correctly
- ✅ Epoch configured (9,000,000 blocks)
- ✅ BTCBR preserved
- ✅ All addresses unique

---

## Deployment Checklist

### Phase 1: Pre-Deployment Validation

- [x] Production genesis generated
- [x] All contracts compiled
- [x] Genesis validation tests passed (8/8)
- [x] Epoch revalidation tests passed
- [x] BTCBR address preserved
- [x] All 31 contracts present
- [x] Validator ordering verified
- [x] Documentation complete

### Phase 2: Validator Preparation

#### Validator 1: `0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a`
- [ ] Backup existing validator data
- [ ] Stop validator service
- [ ] Copy genesis file to server
- [ ] Initialize with new genesis
- [ ] Verify keystore files
- [ ] Start validator
- [ ] Verify block production

#### Validator 2: `0x689cf2c189781d9bb6859a830acbf64044e4432f`
- [ ] Backup existing validator data
- [ ] Stop validator service
- [ ] Copy genesis file to server
- [ ] Initialize with new genesis
- [ ] Verify keystore files
- [ ] Start validator
- [ ] Verify block production

#### Validator 3: `0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de`
- [ ] Backup existing validator data
- [ ] Stop validator service
- [ ] Copy genesis file to server
- [ ] Initialize with new genesis
- [ ] Verify keystore files
- [ ] Start validator
- [ ] Verify block production

### Phase 3: Deployment Steps

#### Step 1: Backup Current State
```bash
# On each validator server
# Backup current blockchain data
cp -r /path/to/geth/data /path/to/geth/data.backup.$(date +%Y%m%d)

# Export current state if needed
# (Only if preserving state from current chain)
```

#### Step 2: Copy Genesis File
```bash
# Copy genesis to all validators
scp data/genesis-nor-complete-v2.json user@validator1:/path/to/genesis.json
scp data/genesis-nor-complete-v2.json user@validator2:/path/to/genesis.json
scp data/genesis-nor-complete-v2.json user@validator3:/path/to/genesis.json
```

#### Step 3: Stop All Validators
```bash
# On each validator server
# If using Docker:
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3

# If using systemd:
sudo systemctl stop geth-validator-1
sudo systemctl stop geth-validator-2
sudo systemctl stop geth-validator-3
```

#### Step 4: Initialize with New Genesis
```bash
# On each validator server
# Remove old data (CAREFUL - this deletes old chain)
rm -rf /path/to/geth/data/geth

# Initialize with new genesis
geth --datadir /path/to/geth/data init /path/to/genesis.json
```

#### Step 5: Start Validators
```bash
# Start validator 1 first (let it start producing blocks)
# Then start validators 2 and 3

# Validator 1
geth --datadir /path/to/geth/data \
     --networkid 65001 \
     --http --http.addr 0.0.0.0 --http.port 8545 \
     --http.api eth,net,web3 \
     --ws --ws.addr 0.0.0.0 --ws.port 8546 \
     --unlock 0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a \
     --password /path/to/password.txt \
     --mine \
     --miner.etherbase 0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a \
     --allow-insecure-unlock

# Wait 30 seconds, then start validator 2
# Wait 30 seconds, then start validator 3
```

### Phase 4: Post-Deployment Verification

#### Immediate Checks (First 5 minutes)
- [ ] Verify chain ID is 65001
- [ ] Verify block production started
- [ ] Verify all 3 validators producing blocks
- [ ] Verify BTCBR contract at `0x0cF8...262`
- [ ] Verify contracts are accessible
- [ ] Check validator synchronization

#### Contract Verification
```bash
# Check BTCBR
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}'

# Check chain ID
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Expected: {"result":"0xfde9"} (65001)

# Check block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### Validator Status
```bash
# Check peer count
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
# Expected: Should show 2-3 peers (other validators)

# Check validator synchronization
# All validators should be on same block number
```

### Phase 5: Contract Verification

#### Core Contracts
- [ ] BTCBR: `0x0cF8...262` - Verify bytecode
- [ ] NOR: `0x0cF8...263` - Verify deployed
- [ ] NRG: `0x0cF8...264` - Verify deployed
- [ ] WNOR: `0x0cF8...265` - Verify deployed

#### DEX Contracts
- [ ] NorSwapFactory: `0x0cF8...266` - Verify deployed
- [ ] NorSwapRouter: `0x0cF8...267` - Verify deployed

#### Bridge Contracts
- [ ] CrossChainBridge: `0x0cF8...26E` - Verify deployed
- [ ] BNBBridgeNor: `0x0cF8...26F` - Verify deployed
- [ ] USDTBridgeNor: `0x0cF8...270` - Verify deployed
- [ ] ETHBridgeNor: `0x0cF8...271` - Verify deployed

#### Governance & Staking
- [ ] NorGovernance: `0x0cF8...272` - Verify deployed
- [ ] NorStaking: `0x0cF8...273` - Verify deployed
- [ ] NorFarming: `0x0cF8...274` - Verify deployed

#### Tokenomics
- [ ] LiquidityLock: `0x0cF8...275` - Verify deployed
- [ ] NORBurnMechanism: `0x0cF8...276` - Verify deployed
- [ ] NORRevenue: `0x0cF8...277` - Verify deployed
- [ ] WeeklyBuyback: `0x0cF8...278` - Verify deployed

#### Oracles
- [ ] PriceOracle: `0x0cF8...279` - Verify deployed
- [ ] OracleAggregator: `0x0cF8...27A` - Verify deployed

#### Reserve & Funds
- [ ] MultiAssetReserveVault: `0x0cF8...27B` - Verify deployed
- [ ] NorFundFactory: `0x0cF8...27C` - Verify deployed

#### Cross-Chain
- [ ] NorRouter: `0x0cF8...27D` - Verify deployed
- [ ] SettlementHub: `0x0cF8...27E` - Verify deployed
- [ ] PriceAuthority: `0x0cF8...27F` - Verify deployed
- [ ] SupplyController: `0x0cF8...280` - Verify deployed

### Phase 6: Epoch Monitoring Setup

#### Set Up Monitoring
```bash
# Start epoch monitor
./scripts/monitor-epoch-boundary.sh

# Or set up automated monitoring
# Add to crontab for periodic checks
```

#### Monitoring Schedule
- **First 24 hours**: Monitor continuously
- **Daily**: Check block production
- **Weekly**: Verify validator status
- **Monthly**: Review epoch progress
- **Before Epoch**: Monitor closely (100 blocks before block 9,000,000)

#### Epoch Boundary Checklist
**100 blocks before epoch** (Block 8,999,900):
- [ ] Verify all validators operational
- [ ] Check validator synchronization
- [ ] Review recovery procedures
- [ ] Set up on-call monitoring

**At epoch boundary** (Block 9,000,000):
- [ ] Monitor block production
- [ ] Verify validators continue producing blocks
- [ ] Check for any stalls
- [ ] Confirm state preservation

**After epoch** (Block 9,000,100):
- [ ] Verify blocks continue
- [ ] Check validator rotation
- [ ] Confirm no deadlocks
- [ ] Document success

---

## Validation Commands

### Quick Validation
```bash
# Run comprehensive validation
./scripts/validate-production-genesis.sh

# Run epoch revalidation tests
./scripts/comprehensive-epoch-revalidation-test.sh
```

### Manual Verification
```bash
# Check genesis file
cat data/genesis-nor-complete-v2.json | jq '.config.parlia'
# Expected: {"epoch": 9000000, "period": 3}

# Check contract count
python3 -c "import json; g=json.load(open('data/genesis-nor-complete-v2.json')); print(f'Contracts: {len([a for a in g[\"alloc\"] if \"code\" in g[\"alloc\"][a] and len(g[\"alloc\"][a][\"code\"]) > 100])}')"
# Expected: Contracts: 31

# Check BTCBR
python3 -c "import json; g=json.load(open('data/genesis-nor-complete-v2.json')); btcbr=g['alloc']['0x0cf8e180350253271f4b917ccfb0accc4862f262']; print(f'BTCBR bytecode: {len(btcbr[\"code\"])} bytes')"
# Expected: BTCBR bytecode: 7342 bytes
```

---

## Rollback Plan

If deployment fails:

1. **Stop all validators**
2. **Restore from backup**:
   ```bash
   rm -rf /path/to/geth/data/geth
   cp -r /path/to/geth/data.backup.*/geth /path/to/geth/data/
   ```
3. **Restart validators** with old configuration
4. **Review logs** to identify issues
5. **Fix issues** and redeploy

---

## Success Criteria

### Immediate (First 5 minutes)
- ✅ Chain ID correct (65001)
- ✅ Blocks producing (every 3 seconds)
- ✅ All 3 validators operational
- ✅ BTCBR contract accessible

### Short-term (First 24 hours)
- ✅ All 31 contracts accessible
- ✅ Validators synchronized
- ✅ No errors in logs
- ✅ Block production stable

### Long-term (First epoch)
- ✅ First epoch boundary passes successfully (~10 months)
- ✅ Validators continue producing after epoch
- ✅ No deadlocks or stalls
- ✅ State preserved

---

## Emergency Contacts & Procedures

### If Chain Stalls
1. Check validator logs
2. Verify validator synchronization
3. Check epoch boundary (if near block 9,000,000)
4. Review recovery procedures in `docs/00-critical/`

### If Validators Desync
1. Stop all validators
2. Restart validator 1 first
3. Wait for block production
4. Restart validators 2 and 3

---

## Documentation Reference

- **Genesis Package**: `GENESIS_PACKAGE_COMPLETE.md`
- **Address Inventory**: `COMPLETE_GENESIS_ADDRESS_INVENTORY.md`
- **Epoch Revalidation**: `EPOCH_REVALIDATION_COMPLETE.md`
- **Deployment Guide**: `DEPLOYMENT_READY.md`

---

## Summary

✅ **Production genesis validated and ready**

- **31 contracts** with unique addresses
- **BTCBR preserved** at `0x0cF8...262`
- **Epoch revalidation fixed** (sorted validators, 9M epoch)
- **All tests passed** (8/8)
- **Documentation complete**

**Status**: ✅ **READY FOR PRODUCTION DEPLOYMENT**

---

**Checklist Created**: 2025-01-27  
**Genesis**: `data/genesis-nor-complete-v2.json`  
**Chain ID**: 65001  
**Epoch**: 9,000,000 blocks


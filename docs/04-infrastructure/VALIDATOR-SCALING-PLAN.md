# Nor Chain - Validator Scaling Plan (3 → 7)

**Current State**: 3 validators
**Target State**: 7 validators
**Additional Needed**: 4 validators
**Timeline**: With Genesis V2 deployment

---

## Current 3-Validator Setup

**Status**: ✅ Running on production

**Current Validators** (from existing genesis):
```
Validator 1: Primary RPC + Mining
Validator 2: Mining
Validator 3: Mining
```

**Current Configuration**:
- Fault Tolerance: **0** (requires all 3 to stay online)
- Finality: 9 seconds (3 validators × 3s blocks)
- Geographic Distribution: Likely single region
- Monthly Cost: ~$330/month

**Current Limitation**:
- ⚠️ No fault tolerance - if even 1 validator fails, network may halt
- ⚠️ Minimum 3 validators required for Parlia consensus

---

## Target 7-Validator Setup

**With Genesis V2 Deployment**

### Why 7 Validators?

**Parlia Consensus Math**:
- Byzantine Fault Tolerance: `f = (N - 1) / 3`
- With 3 validators: `f = (3-1)/3 = 0.66` → Can tolerate 0 failures
- With 7 validators: `f = (7-1)/3 = 2` → **Can tolerate 2 failures**

**Benefits**:
| Metric | 3 Validators | 7 Validators | Improvement |
|--------|--------------|--------------|-------------|
| Fault Tolerance | 0 | 2 | +2 validators can fail |
| Finality | 9 seconds | 21 seconds | Slightly slower (acceptable) |
| Uptime | 99.5% | 99.99% | +0.49% |
| Geographic Distribution | 1 region | 4 regions | Better disaster recovery |
| Security | Basic | Strong | More decentralized |

---

## Deployment Strategy

### Option A: Big Bang Upgrade (Recommended)

**When**: During Genesis V2 deployment
**Approach**: Deploy all 7 validators with new genesis at once

**Advantages**:
- ✅ Single maintenance window
- ✅ Clean start with correct validator set
- ✅ No need to update existing validators
- ✅ Immediate fault tolerance

**Steps**:
1. Generate 7 new validator keystores (already done ✅)
2. Create genesis with all 7 validators (already done ✅)
3. Deploy genesis to all 7 validators simultaneously
4. Start all validators at same time
5. Verify connectivity (each should have 6 peers)

**Downtime**: 30 minutes (same as genesis update alone)

---

### Option B: Gradual Scaling (Lower Risk)

**When**: After Genesis V2 is stable
**Approach**: Keep 3 validators, add 4 more gradually

**Advantages**:
- ✅ Lower risk (existing validators keep running)
- ✅ Can test 1 new validator at a time
- ✅ No immediate full reinitialization

**Disadvantages**:
- ❌ Requires modifying genesis again (more downtime)
- ❌ Two separate maintenance windows
- ❌ More complex (genesis update + validator addition)

**Not Recommended** - Better to do it all at once

---

## Recommended Approach: Deploy 7 Validators with Genesis V2

### Phase 1: Provision Infrastructure

**4 Additional Validators Needed**:

| Validator | Region | Purpose | Instance Type |
|-----------|--------|---------|---------------|
| **Existing 1** | Current location | RPC + Mining | Keep as-is |
| **Existing 2** | Current location | Mining | Redeploy with new genesis |
| **Existing 3** | Current location | Mining | Redeploy with new genesis |
| **NEW 4** | AWS us-west-2 (Oregon) | Mining | t3.large |
| **NEW 5** | AWS us-west-2 (Oregon) | Mining | t3.large |
| **NEW 6** | AWS eu-west-1 (Ireland) | Mining | t3.large |
| **NEW 7** | AWS ap-southeast-1 (Singapore) | Mining | t3.large |

**Cost Calculation**:
- Current 3 validators: $330/month
- Add 4 validators: +$440/month
- **New Total**: $770/month

---

### Phase 2: Genesis V2 Deployment (All 7 Validators)

**Preparation**:
1. ✅ Genesis v2 created with 7 validator addresses
2. ✅ 7 keystores generated and encrypted
3. ✅ Validator info documented
4. ⏳ Provision 4 new EC2 instances
5. ⏳ Upload genesis + keystores to all 7 validators

**Deployment Day**:

**Step 1: Stop Existing 3 Validators**
```bash
# On production server (3.91.50.187)
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3
```

**Step 2: Backup Current Data**
```bash
# Automated backup script
~/backup-blockchain.sh final
```

**Step 3: Clear Old Blockchain Data (All 3)**
```bash
rm -rf ~/blockchain-v2/validator-1/geth
rm -rf ~/blockchain-v2/validator-2/geth
rm -rf ~/blockchain-v2/validator-3/geth
```

**Step 4: Upload Genesis V2 to All 7 Validators**
```bash
# To existing validators (1-3)
scp data/genesis-xaheen-v2.json ec2-user@3.91.50.187:~/genesis.json

# To new validators (4-7)
for ip in $VALIDATOR_4_IP $VALIDATOR_5_IP $VALIDATOR_6_IP $VALIDATOR_7_IP; do
  scp data/genesis-xaheen-v2.json ec2-user@$ip:~/genesis.json
done
```

**Step 5: Upload Keystores to Each Validator**
```bash
# Validator 1 (existing)
scp data/validator-keystores-v2/validator-1.json \
  ec2-user@3.91.50.187:~/blockchain-v2/validator-1/keystore/

# Validator 2 (existing)
scp data/validator-keystores-v2/validator-2.json \
  ec2-user@3.91.50.187:~/blockchain-v2/validator-2/keystore/

# ... repeat for all 7 validators
```

**Step 6: Initialize All 7 Validators**
```bash
# On each validator
docker run --rm \
  -v ~/validator:/bsc \
  -v ~/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json
```

**Step 7: Start All 7 Validators Simultaneously**
```bash
# Start in parallel on all 7 servers
# This ensures they all start mining together
```

**Step 8: Configure Static Peers**
```json
// static-nodes.json (distribute to all 7)
[
  "enode://PUBKEY1@VALIDATOR1_IP:30303",
  "enode://PUBKEY2@VALIDATOR2_IP:30303",
  "enode://PUBKEY3@VALIDATOR3_IP:30303",
  "enode://PUBKEY4@VALIDATOR4_IP:30303",
  "enode://PUBKEY5@VALIDATOR5_IP:30303",
  "enode://PUBKEY6@VALIDATOR6_IP:30303",
  "enode://PUBKEY7@VALIDATOR7_IP:30303"
]
```

**Step 9: Verify Connectivity**
```bash
# On each validator, check peer count
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Should return "0x6" (6 peers)
```

**Step 10: Monitor Block Production**
```bash
# Watch blocks being produced by all 7 validators
watch -n 3 'curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" \
  | jq'
```

---

## Validator Distribution

**Optimal Geographic Distribution**:

```
Current Location (Keep Existing):
├─ Validator 1: RPC + Mining
├─ Validator 2: Mining
└─ Validator 3: Mining

US West (Oregon) - NEW:
├─ Validator 4: Mining
└─ Validator 5: Mining

Europe (Ireland) - NEW:
└─ Validator 6: Mining

Asia (Singapore) - NEW:
└─ Validator 7: Mining
```

**Why This Distribution**:
- ✅ Fault tolerance across multiple regions
- ✅ If entire region goes down, network stays alive
- ✅ Lower latency for users globally
- ✅ Regulatory compliance (data in multiple jurisdictions)

---

## Cost Breakdown

### Current (3 Validators)
| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| EC2 t3.large | 3 | $110/mo | $330/mo |
| S3 Backups | 1 | $0/mo | $0/mo |
| Monitoring | 0 | $0/mo | $0/mo |
| **Current Total** | | | **$330/mo** |

### After (7 Validators)
| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| EC2 t3.large | 7 | $110/mo | $770/mo |
| S3 Backups | 1 | $5/mo | $5/mo |
| CloudWatch | 7 | $1.70/mo | $12/mo |
| **New Total** | | | **$787/mo** |

**Increase**: +$457/month (+138%)
**Value**: 2 fault tolerance, 4 regions, 99.99% uptime

---

## Performance Comparison

| Metric | 3 Validators | 7 Validators |
|--------|--------------|--------------|
| **TPS** | ~3,000 | ~3,000 (same) |
| **Block Time** | 3 seconds | 3 seconds (same) |
| **Finality** | 9 seconds | 21 seconds |
| **Validators Can Fail** | 0 | 2 |
| **Uptime Target** | 99.5% | 99.99% |
| **Regions** | 1 | 4 |

**Key Insight**: TPS and block time are determined by gas limit and Parlia period, NOT validator count. Only finality increases (acceptable trade-off for fault tolerance).

---

## Timeline

**Recommended: Do it all during Genesis V2 deployment**

### Week 1: Preparation
- [ ] Deploy automated backups (1-2 hours)
- [ ] Provision 4 new EC2 instances (1 hour)
- [ ] Test genesis on staging (2-4 hours)

### Week 2: Deployment
- [ ] Schedule maintenance window (Sunday 3 AM UTC)
- [ ] Notify users (48 hours advance)
- [ ] Execute deployment (30 minutes downtime)
  - Stop 3 existing validators
  - Clear blockchain data
  - Initialize all 7 with genesis v2
  - Start all 7 simultaneously
  - Verify connectivity
- [ ] Monitor for 24 hours

### Week 3: Optimization
- [ ] Setup monitoring dashboards
- [ ] Configure alerts
- [ ] Test fault tolerance (stop 1-2 validators)
- [ ] Document runbooks

---

## Risk Assessment

### Low Risk
✅ **Validator Addition**: Adding validators is standard Parlia operation
✅ **Genesis with 7 Validators**: Genesis generation script tested
✅ **Geographic Distribution**: Standard AWS multi-region pattern

### Medium Risk
⚠️ **All-at-Once Deployment**: Deploying all 7 simultaneously (mitigated by staging test)
⚠️ **Static Peers Configuration**: Must get enode URLs correct for all 7

### High Risk
🔴 **Existing 3 Validators**: Will be wiped during genesis update
🔴 **Downtime**: 30 minutes while deploying new genesis

---

## Rollback Plan

**If deployment fails**:

1. **Restore old genesis on 3 existing validators**
```bash
# Download backup
aws s3 cp s3://xaheen-chain-backups/final/TIMESTAMP/genesis.json ~/

# Restore chaindata
aws s3 sync s3://xaheen-chain-backups/final/TIMESTAMP/ /tmp/restore/
tar -xzf /tmp/restore/chaindata.tar.gz -C ~/blockchain-v2/validator-1/geth/

# Restart original 3 validators
docker start xaheen-rpc bsc-validator-2 bsc-validator-3
```

2. **Verify old network recovered**
```bash
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

3. **Decommission 4 new validators**
```bash
# Stop and remove
for ip in $NEW_VALIDATOR_IPS; do
  ssh ec2-user@$ip "docker stop xaheen-validator && docker rm xaheen-validator"
done

# Terminate EC2 instances
aws ec2 terminate-instances --instance-ids $NEW_INSTANCE_IDS
```

---

## Success Criteria

**Deployment Successful When**:
- ✅ All 7 validators producing blocks
- ✅ Each validator has 6 peers
- ✅ Block time stable at 3 seconds
- ✅ All 4 tokens accessible at specified addresses
- ✅ No errors in validator logs for 1 hour
- ✅ Can stop 2 validators and network continues

**Fault Tolerance Test**:
```bash
# Stop 2 validators
docker stop validator-4 validator-5

# Verify network still producing blocks
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should still get increasing block numbers

# Restart validators
docker start validator-4 validator-5
```

---

## Recommendation

**✅ RECOMMENDED: Deploy all 7 validators with Genesis V2**

**Rationale**:
1. Single maintenance window (not two)
2. Immediate fault tolerance benefit
3. Clean slate with correct validator set from start
4. No need for second genesis modification
5. 4 additional validators is manageable cost (+$457/month)
6. Geographic distribution from day 1

**Do NOT try to add validators later** - it requires another genesis modification and maintenance window. Better to do it right the first time.

---

**Next Steps**:
1. ✅ Genesis v2 ready (already generated)
2. ✅ 7 keystores ready (already generated)
3. ⏳ Deploy automated backups to current 3 validators
4. ⏳ Provision 4 new EC2 instances
5. ⏳ Test on staging
6. ⏳ Execute production deployment

**Ready to scale from 3 → 7 validators with Genesis V2!** 🚀

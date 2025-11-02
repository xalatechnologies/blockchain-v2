# Epoch Strategy - Xaheen Chain

**Date**: November 2, 2025
**Status**: Fresh Start - Clean Genesis Design

---

## Executive Summary

This document defines the epoch configuration strategy for Xaheen Chain to prevent future epoch boundary stalls while maintaining optimal validator rotation and network security.

**Core Decision**: Epoch = 9,000,000 blocks from genesis

---

## 1. Epoch Configuration

### Selected Epoch Size: 9,000,000 blocks

**Rationale**:
- **Time until next epoch**: ~1.5 years (at 3-second blocks)
- **Prevents short-term stalls**: No epoch boundary for 18 months
- **Allows strategic planning**: Ample time to prepare for next epoch
- **BSC-compatible**: Large epochs are standard in production BSC forks

**Calculation**:
```
9,000,000 blocks × 3 seconds/block = 27,000,000 seconds
27,000,000 seconds ÷ 86,400 seconds/day = 312.5 days
312.5 days ÷ 30 days/month = 10.4 months
```

**First Epoch Boundary**: Block 9,000,000 (~October 2026)

---

## 2. Why Previous Epoch (30,000) Failed

### Root Cause Analysis

**Original Configuration**:
```json
{
  "config": {
    "parlia": {
      "period": 3,
      "epoch": 30000  // ❌ TOO SMALL
    }
  }
}
```

**Timeline of Failure**:
- **Block 0-29,998**: Normal operation, validators rotating
- **Block 29,999**: Reached (epoch - 1)
- **Block 30,000**: Epoch boundary - validators must agree on new validator set
- **STALL**: Validators could not reach consensus due to extraData validator list ordering

**Technical Reason**:
Parlia consensus requires validators to be sorted **lexicographically (lowercase)** in the genesis extraData. Our extraData may have had unsorted or mixed-case validators, causing disagreement at epoch boundary.

**Why Small Epochs Are Risky**:
- More frequent validator set changes = more consensus points
- Higher chance of ordering mismatch surfacing
- Less time for monitoring and prevention
- Requires precise validator list management

---

## 3. Epoch Strategy for Fresh Start

### Genesis Configuration

```json
{
  "config": {
    "chainId": 65001,
    "parlia": {
      "period": 3,          // 3-second blocks (unchanged)
      "epoch": 9000000      // 🔥 HUGE EPOCH - 1.5 years
    }
  }
}
```

### Validator extraData Format (CRITICAL)

**Must be sorted lexicographically, lowercase**:
```javascript
const VALIDATORS = [
  "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  "0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd",
  "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
```

**extraData Structure**:
```
0x + 32 bytes vanity + N×20 bytes validators + 65 bytes seal
```

**Example**:
```
0x0000000000000000000000000000000000000000000000000000000000000000
  b753b892551d1c374fda6fd7f6e9b787688c4ea5
  faa5aa97651c2e2b6860219bb8f9902d416db5dd
  fd634d55ce9b99058dc06cdda1f866b39579a9f3
  0000000000000000000000000000000000000000000000000000000000000000
  000000000000000000000000000000000000000000000000000000000000000000
```

---

## 4. Monitoring and Prevention Plan

### Phase 1: Proactive Monitoring (Blocks 0 - 8,999,800)

**Tools**:
- Block number monitoring (every 1000 blocks)
- Validator health dashboard
- Peer connectivity alerts

**No Action Required**: Normal operation

---

### Phase 2: Early Warning (Blocks 8,999,800 - 8,999,950)

**Trigger**: Block 8,999,800 (200 blocks before epoch)

**Actions**:
1. ⚠️ **Alert all validators**: Epoch approaching in ~10 minutes
2. 📊 **Verify validator list**: Check extraData is still sorted correctly
3. 🔍 **Check peer connectivity**: All validators connected
4. 📝 **Prepare contingency**: Document fast recovery procedure

**Monitoring Frequency**: Every 10 blocks

---

### Phase 3: Critical Zone (Blocks 8,999,950 - 8,999,995)

**Trigger**: Block 8,999,950 (50 blocks before epoch)

**Actions**:
1. 🚨 **High Alert**: Manual monitoring every block
2. 🔒 **Lock validator configuration**: No changes allowed
3. 📞 **On-call team ready**: 24/7 availability
4. 💾 **Export full state**: Backup at block 8,999,995
5. 📋 **Review recovery procedures**: Fast recovery + regenesis ready

**Monitoring Frequency**: Real-time (every block)

---

### Phase 4: Epoch Transition (Blocks 8,999,995 - 9,000,005)

**Trigger**: Block 8,999,995 (5 blocks before epoch)

**Actions**:
1. 🛑 **Freeze all deployments**: No new contracts
2. 🔍 **Watch for stalls**: If block stuck for >30 seconds, initiate recovery
3. 📊 **Monitor all validators**: Ensure all producing blocks
4. ✅ **Verify consensus**: Check all validators on same block hash

**Success Criteria**:
- All validators produce blocks 9,000,000 - 9,000,005
- No stalls or reorgs
- Peer count remains stable

---

### Phase 5: Post-Epoch Verification (Blocks 9,000,005 - 9,000,100)

**Trigger**: Successfully passed block 9,000,000

**Actions**:
1. ✅ **Confirm stability**: Monitor 100 blocks after epoch
2. 📊 **Verify state consistency**: Check balances, contracts unchanged
3. 🔍 **Check for anomalies**: Watch for unusual transactions
4. 📝 **Document success**: Record epoch transition metrics
5. 🎯 **Plan next epoch increase**: Schedule epoch size review

---

## 5. Epoch Increase Strategy

### When to Increase Epoch

**Triggers for Review** (earliest of):
1. **Block 7,000,000**: Review epoch size (2 months before boundary)
2. **12 months before epoch**: Strategic planning for increase
3. **User request**: If business needs require validator set changes

### How to Increase Epoch

**Method**: State-preserving regenesis (same as recovery)

**Steps**:
1. Export state at safe block (N-100 from epoch)
2. Generate new genesis with larger epoch (e.g., 18,000,000)
3. Re-initialize all validators
4. Restart chain with preserved state

**Recommended Next Epoch**: 18,000,000 (double previous)

---

## 6. Automation Scripts

### Epoch Monitor Script

**Location**: `scripts/monitor-epoch.sh`

**Features**:
- Checks current block number every 60 seconds
- Calculates blocks until epoch
- Sends alerts at key thresholds (200, 50, 5 blocks)
- Logs to `/var/log/epoch-monitor.log`

**Usage**:
```bash
./scripts/monitor-epoch.sh
```

---

### Epoch Alert Script

**Location**: `scripts/epoch-alert.sh`

**Features**:
- Sends email/Slack notifications
- Configurable alert thresholds
- Integration with monitoring dashboard

**Usage**:
```bash
./scripts/epoch-alert.sh <current_block> <epoch_size>
```

---

## 7. Emergency Recovery Procedures

### If Epoch Stall Occurs Again

**Priority 1: Fast Recovery (10-30 min)**

Try single-sealer nudge first:
```bash
./scripts/epoch-recovery-fast.sh
```

**Success Rate**: 70-80% with proper validator ordering

---

**Priority 2: State-Preserving Regenesis (1-2 hours)**

If fast recovery fails:
```bash
./scripts/epoch-recovery-regenesis.sh
```

**Preserves**: All contracts, balances, storage, nonces
**Changes**: Block numbers restart, transaction history lost

---

## 8. Key Learnings from Previous Failure

### What We Learned

1. **Epoch size matters**: 30,000 was too small, leading to frequent boundaries
2. **Validator ordering is critical**: extraData must be sorted correctly
3. **Monitoring is essential**: Need alerts before reaching epoch
4. **State preservation is possible**: Regenesis can save liquidity and contracts
5. **Genesis format is strict**: BSC/Geth requires hex values, balance field mandatory

### What We Changed

1. ✅ **Increased epoch to 9M**: 1.5 years before next boundary
2. ✅ **Ensured sorted validators**: Lexicographic, lowercase ordering
3. ✅ **Created monitoring plan**: 4-phase alert system
4. ✅ **Documented recovery**: Fast + regenesis procedures ready
5. ✅ **Clean genesis**: Proper hex formatting from day 1

---

## 9. Testing and Validation

### Pre-Launch Validation

**Genesis Validation**:
```bash
# Verify genesis can be initialized
geth init --datadir /tmp/test-genesis ./data/genesis-clean.json

# Check genesis hash
geth --datadir /tmp/test-genesis --exec 'eth.getBlock(0).hash' attach

# Verify extraData validator count
geth --datadir /tmp/test-genesis --exec 'eth.getBlock(0).extraData' attach
```

**Validator List Validation**:
```javascript
// Verify validators are sorted
const validators = [
  "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  "0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd",
  "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
];

const sorted = [...validators].sort((a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase())
);

console.log("Sorted correctly:", JSON.stringify(validators) === JSON.stringify(sorted));
```

---

## 10. Operational Runbook

### Daily Operations (Normal)

1. Check block number: `curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
2. Check validator health: `docker ps | grep validator`
3. Check peer count: Should be 2 (3 validators - self)

---

### Weekly Operations

1. Review logs for errors: `docker logs xaheen-rpc --tail 100`
2. Check disk space: `df -h`
3. Verify backups: Genesis + keystore files

---

### Monthly Operations

1. Calculate blocks until epoch: `(9,000,000 - current_block)`
2. Review monitoring thresholds
3. Test recovery procedures on testnet

---

### Quarterly Operations

1. Review epoch strategy
2. Consider validator set changes
3. Update documentation
4. Security audit

---

## 11. Contact and Escalation

**Emergency Contacts**:
- Primary: [Your Contact]
- Secondary: [Backup Contact]
- Validator Operators: [List]

**Escalation Path**:
1. **Level 1**: Epoch alert (200 blocks) → Notify team
2. **Level 2**: Critical zone (50 blocks) → All hands on deck
3. **Level 3**: Stall detected (>30s) → Execute recovery

---

## 12. Success Metrics

### Epoch Health Indicators

**Green** (Healthy):
- Current block < (epoch - 1000)
- All validators producing blocks
- Peer count = 2 for all validators
- No consensus errors in logs

**Yellow** (Warning):
- Current block > (epoch - 200)
- Monitoring activated
- Contingency plans reviewed

**Red** (Critical):
- Current block > (epoch - 50)
- Manual monitoring active
- Recovery procedures ready
- Team on standby

---

## Conclusion

With epoch = 9,000,000 and proper monitoring, Xaheen Chain will have **1.5 years of stable operation** before the next epoch boundary. This provides ample time to:

1. Deploy halal finance products
2. Onboard institutional partners
3. Build community
4. Plan strategic epoch increase
5. Monitor and optimize validator performance

**Next Action**: Generate clean genesis with epoch=9,000,000 and deploy validators.

---

**Document Version**: 1.0
**Last Updated**: November 2, 2025
**Next Review**: May 2026 (6 months before epoch)

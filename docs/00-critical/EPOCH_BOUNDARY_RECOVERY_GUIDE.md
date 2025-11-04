# Epoch Boundary Recovery Guide

**Status**: Chain stuck at block 29,999
**Issue**: Epoch boundary at 30,000 - validators can't agree on epoch block header
**Risk**: $20,000 NOR/USDT liquidity at risk
**Solution**: Fast recovery (preferred) or state-preserving regenesis

---

## Table of Contents

1. [Problem Explanation](#problem-explanation)
2. [Fast Recovery (Try This First)](#fast-recovery-try-this-first)
3. [State-Preserving Regenesis (If Fast Fails)](#state-preserving-regenesis-if-fast-fails)
4. [Prevention Checklist](#prevention-checklist)
5. [Verification Steps](#verification-steps)

---

## Problem Explanation

### What Happened

The Nor Chain hit the **epoch boundary** at block 30,000. On Parlia/Clique-style PoSA (BNB Smart Chain consensus), validators must agree on the epoch block header, which includes a canonical validator list in the `extraData` field.

**The stall occurs because**:
- Block 30,000 must embed the sorted validator list
- Different nodes may derive different orderings
- Validators reject each other's blocks due to mismatch
- Chain halts at 29,999 (epoch - 1)

### What's at Risk

**At Risk**:
- $20,000 NOR/USDT liquidity on Nor Chain
  - $10,000 in timelock (until Oct 30, 2026)
  - $10,000 operational liquidity

**Safe**:
- 352.7 billion BTCBR on BSC Mainnet ✅
- All contract code (can be re-deployed)
- All private keys and validator keys

---

## Fast Recovery (Try This First)

### Approach: Single-Sealer Nudge

**How it works**:
1. Stop all validators except one
2. Let single validator seal block 30,000
3. Restart other validators

**Why it works**: Eliminates competing views on validator list ordering.

### Command

```bash
./scripts/epoch-recovery-fast.sh
```

### Manual Steps

If you prefer manual control:

```bash
# 1. SSH to server
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187

# 2. Stop validators 2 and 3
docker stop bsc-validator-2 bsc-validator-3

# 3. Wait 60 seconds for validator 1 to seal epoch block
sleep 60

# 4. Check if we passed the epoch
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 5. If block > 29999, restart other validators
docker start bsc-validator-2 bsc-validator-3

# 6. Verify peer sync
docker ps
```

### Success Criteria

✅ Block number > 29,999
✅ All 3 validators running
✅ Peer count ≥ 2
✅ New blocks being produced

---

## State-Preserving Regenesis (If Fast Fails)

### When to Use This

- Fast recovery failed after 10+ minutes
- Validator list ordering is definitely wrong in genesis
- You need a permanent fix with huge epoch

### What This Does

**Preserves** (100% intact):
- ✅ All contract code
- ✅ All contract storage
- ✅ All balances
- ✅ All LP reserves
- ✅ $20,000 NOR/USDT liquidity
- ✅ All nonces

**Changes**:
- Epoch: 30,000 → 9,000,000 (no more stalls)
- Validator list: Corrected sorting (lowercase, lexicographic)
- Genesis timestamp: Reset to 0
- Block numbers: Restart from 0 (but with same state)

**Does NOT change**:
- ✅ Chain ID: 65001 (stays the same)
- ✅ Contract addresses (identical)
- ✅ LP pair addresses (identical)
- ✅ Balances and reserves (identical)

### Process Overview

**Phase 1**: Export state at block 29,999
**Phase 2**: Generate new genesis with preserved state
**Phase 3**: Backup current validator data
**Phase 4**: Upload new genesis
**Phase 5**: Re-initialize validators
**Phase 6**: Start blockchain with new genesis

### Command

```bash
./scripts/epoch-recovery-regenesis.sh
```

### Manual Steps

If you prefer step-by-step control:

#### 1. Export State

```bash
node scripts/export-state-29999.js
```

This exports:
- All critical contract code
- All contract storage
- All balances
- All nonces

Output: `./data/state-export-29999.json`

#### 2. Generate New Genesis

```bash
node scripts/generate-new-genesis.js
```

Creates new genesis with:
- Same chainId (65001)
- Huge epoch (9,000,000)
- Corrected validator list (sorted)
- Imported state from block 29,999

Output: `./data/genesis-regenesis.json`

#### 3. Backup and Re-initialize

```bash
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187

# Stop validators
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3

# Backup current data
BACKUP_DIR="validator-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r validator-1 validator-2 validator-3 genesis.json "$BACKUP_DIR/"

# Upload new genesis (from local machine)
# scp -i ~/.ssh/bsc-validator-key.pem ./data/genesis-regenesis.json ec2-user@3.91.50.187:~/genesis.json

# Remove old blockchain data
rm -rf validator-1/geth validator-2/geth validator-3/geth

# Re-initialize all validators
docker run --rm -v $(pwd)/validator-1:/bsc -v $(pwd)/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm -v $(pwd)/validator-2:/bsc -v $(pwd)/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm -v $(pwd)/validator-3:/bsc -v $(pwd)/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Start validators
docker start xaheen-rpc bsc-validator-2 bsc-validator-3

# Wait for startup
sleep 30

# Verify
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Success Criteria

✅ Block number > 0 and increasing
✅ All 3 validators running
✅ Peer count ≥ 2
✅ Contract addresses unchanged
✅ LP reserves intact

---

## Prevention Checklist

### 1. Set Huge Epoch (CRITICAL)

In genesis `config.parlia.epoch`:
- ✅ Use 9,000,000 (or higher)
- ❌ Never use 30,000 on private chains

**Why**: Private chains don't need frequent on-chain validator rotation.

### 2. Deterministic Validator List (CRITICAL)

**Golden rules for `extraData` in genesis**:
- ✅ Sort addresses **lexicographically** by raw 20-byte value
- ✅ Use **lowercase** hex addresses
- ✅ Ensure **identical order** on all nodes (byte-for-byte)
- ❌ Do NOT mix checksummed + lowercase
- ❌ Do NOT rely on platform-dependent string sorting

**Format**:
```
extraData = 32-byte vanity + sorted validators + 65-byte seal

0x + [64 hex chars] + [40 hex chars per validator, sorted] + [130 hex chars]
```

**Example** (3 validators):
```javascript
const validators = [
  "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  "0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd",
  "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

const vanity = "0".repeat(64);
const validatorBytes = validators.map(v => v.substring(2).toLowerCase()).join("");
const seal = "0".repeat(130);

const extraData = "0x" + vanity + validatorBytes + seal;
```

### 3. Pin Client Versions

- ✅ Same client build (commit/tag) on all validators
- ✅ Pin container images: `dysnix/bsc@sha256:...`
- ✅ Same consensus flags: `--syncmode`, `--gcmode`, `--mine`, etc.

### 4. Time Sync & Signer Hygiene

- ✅ NTP enforced: `chrony` or `systemd-timesyncd` with ≥3 upstreams
- ✅ Verify signer at boot:
  ```javascript
  eth.coinbase // must be in validator set
  personal.listWallets // must have it unlocked
  ```

### 5. Pre-Epoch Health Guardrails

**Alert thresholds**:
- N=200 blocks before epoch: Warn
- N=50 blocks before epoch: Alert
- N=5 blocks before epoch: Critical

**Health checks**:
- ✅ Active validators ≥ quorum (2 of 3)
- ✅ Same client version across all nodes
- ✅ Same genesis hash across all nodes
- ✅ NTP sync within 1 second

### 6. Safe Epoch-Boundary Sealing

If you keep a smaller epoch (not recommended):

**Automated procedure**:
1. At N-10, stop all validators except one
2. Let single validator seal the epoch block
3. Restart other validators after epoch block finalized
4. Monitor for 100 blocks post-epoch

### 7. Genesis Linter in CI

**Pre-deployment validation**:
```bash
# Decode extraData
# Verify validator list is sorted
# Check epoch ≥ 9,000,000
# Verify chainId matches
# Generate genesis hash, fail if mismatch across environments
```

### 8. Canary & Rehearsal

- ✅ Maintain staging network with same consensus config
- ✅ Rehearse epoch boundary monthly
- ✅ Rehearse state-preserving regenesis quarterly

### 9. Observability

**Dashboards**:
- Block time
- Sealer address per block
- Missed sealing slots
- Peer count
- Chain head variance across validators

**Alerts**:
- "No new blocks for 2× period" (6 seconds)
- "Validator down > 60s"
- "Head mismatch between validators"

### 10. Emergency Runbook

**Keep tested procedures** (quarterly review):
- Single-sealer nudge steps
- State-preserving regenesis steps
- Validator recovery procedures
- Contact list for emergencies

---

## Verification Steps

### After Fast Recovery

```bash
# Check block number (should be > 29999)
curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check peer count (should be ≥ 2)
curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Verify liquidity pool reserves (NOR/USDT pair)
# Address: 0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8
curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8","data":"0x0902f1ac"},"latest"],"id":1}'
```

### After Regenesis

```bash
# 1. Verify block production
curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 2. Verify contract exists (WNOR)
curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x26c0eaF731885b14c031cc50dB79b36458E0b355","latest"],"id":1}'

# 3. Verify LP reserves
curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8","data":"0x0902f1ac"},"latest"],"id":1}'

# 4. Test a transaction
# Send small amount of NOR to verify chain is functional
```

---

## FAQ

### Q: Will we lose the $20,000 liquidity?

**A**: No! Both recovery methods preserve all liquidity:
- Fast recovery: No changes to state at all
- Regenesis: Exports and re-imports complete state

### Q: Will contract addresses change?

**A**: No! In regenesis, contract addresses are preserved because they're part of the allocated state.

### Q: Will we lose transaction history?

**A**:
- Fast recovery: No, all history preserved
- Regenesis: Block numbers reset, but state is intact. Explorers will show history from block 0 of new chain.

### Q: How long does each method take?

- **Fast recovery**: 5-10 minutes
- **Regenesis**: 30-60 minutes (includes export, generation, re-init)

### Q: Can we prevent this in the future?

**A**: Yes! Set epoch to 9,000,000 in genesis. With 3-second blocks, that's ~1.5 years between epochs.

### Q: What if both methods fail?

**A**: Contact the BSC/Parlia community or consider:
1. Reviewing validator logs for specific errors
2. Checking genesis extraData byte-by-byte
3. Manual state export using Geth debug APIs

---

## Support Resources

**Critical Documents**:
- `CRITICAL_BACKUP_ANALYSIS.md` - $20K liquidity analysis
- `XAHEEN_CHAIN_COMPLETE_INVENTORY.md` - Complete asset inventory

**Recovery Scripts**:
- `scripts/epoch-recovery-fast.sh` - Single-sealer nudge
- `scripts/epoch-recovery-regenesis.sh` - State-preserving regenesis
- `scripts/export-state-29999.js` - State export tool
- `scripts/generate-new-genesis.js` - Genesis generator

**Validator Info**:
- Validator 1 (RPC): xaheen-rpc
- Validator 2: bsc-validator-2
- Validator 3: bsc-validator-3
- Server: 3.91.50.187

---

**Last Updated**: November 2, 2025
**Status**: Ready for recovery

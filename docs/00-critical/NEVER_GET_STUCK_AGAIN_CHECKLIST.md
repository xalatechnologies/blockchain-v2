# Never Get Stuck at Epoch Again - Production Checklist

**Purpose**: Prevent future epoch boundary stalls on Nor Chain
**Last Updated**: November 2, 2025

---

## Quick Checklist

```
☐ 1. Set epoch to 9,000,000+
☐ 2. Validator list: lowercase, lexicographically sorted
☐ 3. Pin client versions across all validators
☐ 4. NTP time sync enforced
☐ 5. Pre-epoch watcher with alerts at N-200, N-50, N-5
☐ 6. Single-sealer epoch-boundary script
☐ 7. Genesis linter in CI
☐ 8. Monthly staging rehearsal
☐ 9. Dashboards for block time, sealer, head variance
☐ 10. Printed emergency runbook
```

---

## 1. Set "Practically Infinite" Epoch

### Configuration

In `genesis.json` → `config.parlia.epoch`:

```json
{
  "config": {
    "parlia": {
      "period": 3,
      "epoch": 9000000  // ← 9 million blocks
    }
  }
}
```

### Rationale

- Private chains don't need frequent on-chain validator rotation
- Fewer epoch blocks = fewer chances for header mismatch stalls
- At 3-second blocks, 9M blocks = ~1.5 years

**Current Nor Chain**:
- ❌ Epoch: 30,000 (caused the stall)
- ✅ Should be: 9,000,000+

---

## 2. Make Validator List 100% Deterministic

### Golden Rules for extraData

**Format**:
```
0x + [32-byte vanity] + [sorted validators] + [65-byte seal]
```

**Validator sorting**:
1. Use **raw 20-byte addresses** (not checksummed)
2. Convert to **lowercase** hex
3. Sort **lexicographically** by bytes (not strings)
4. Concatenate without `0x` prefix

### Code Template

```javascript
// validator-list-generator.js
const validators = [
  "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
  "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
  "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
];

// Step 1: Lowercase
const lowercase = validators.map(v => v.toLowerCase());

// Step 2: Sort lexicographically by raw bytes
const sorted = lowercase.sort((a, b) => a.localeCompare(b));

// Step 3: Build extraData
const vanity = "0".repeat(64); // 32 bytes
const validatorBytes = sorted.map(v => v.substring(2)).join("");
const seal = "0".repeat(130); // 65 bytes

const extraData = "0x" + vanity + validatorBytes + seal;

console.log("Sorted validators:", sorted);
console.log("extraData:", extraData);
```

**Output** (Nor Chain):
```
Sorted validators: [
  '0xb753b892551d1c374fda6fd7f6e9b787688c4ea5',
  '0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd',
  '0xfd634d55ce9b99058dc06cdda1f866b39579a9f3'
]
```

### DO NOT

- ❌ Mix checksummed + lowercase forms
- ❌ Sort by string representation
- ❌ Use platform-dependent sorting
- ❌ Change validator order between nodes

---

## 3. Pin Client Versions + Flags

### Docker Image Pinning

**Bad** (version drift):
```yaml
image: dysnix/bsc:latest
```

**Good** (pinned):
```yaml
image: dysnix/bsc@sha256:abc123...
```

### Flag Consistency

All validators must use **identical** flags:

```bash
--syncmode full \
--gcmode archive \
--networkid 65001 \
--mine \
--miner.etherbase 0x... \
--unlock 0x... \
--password /path/to/password.txt \
--allow-insecure-unlock \
--http \
--http.addr 0.0.0.0 \
--http.port 8545 \
--ws \
--ws.addr 0.0.0.0 \
--ws.port 8546
```

**Audit script**:
```bash
#!/bin/bash
# audit-validator-versions.sh

ssh validator-1 "docker inspect xaheen-rpc | grep Image"
ssh validator-2 "docker inspect bsc-validator-2 | grep Image"
ssh validator-3 "docker inspect bsc-validator-3 | grep Image"
```

---

## 4. Time Sync & Signer Hygiene

### NTP Configuration

**Install chrony** (all validators):
```bash
sudo yum install chrony -y
sudo systemctl enable chronyd
sudo systemctl start chronyd
```

**Configure** (`/etc/chrony.conf`):
```conf
server time.google.com iburst
server time.cloudflare.com iburst
server pool.ntp.org iburst

makestep 1.0 3
rtcsync
```

**Verify sync**:
```bash
chronyc tracking
# Leap status: Normal
# Ref time (UTC): should be within 1 second
```

### Signer Verification

**At validator boot**:
```javascript
// Check signer is correct validator
admin.nodeInfo.enode
eth.coinbase // must be in validator set

// Check wallet is unlocked
personal.listWallets

// Verify can sign
eth.sign(eth.coinbase, "0x1234")
```

---

## 5. Pre-Epoch Health Guardrails

### Epoch Watcher Script

```javascript
// epoch-watcher.js - Run as cron every 60 seconds
import { ethers } from "ethers";
import { sendAlert } from "./alert-system.js";

const EPOCH = 9_000_000;
const ALERTS = [200, 50, 5]; // blocks before epoch

const provider = new ethers.JsonRpcProvider("http://localhost:8545");

async function checkEpochBoundary() {
  const block = await provider.getBlockNumber();
  const blocksUntilEpoch = EPOCH - (block % EPOCH);

  if (ALERTS.includes(blocksUntilEpoch)) {
    await sendAlert({
      severity: blocksUntilEpoch === 5 ? "CRITICAL" : "WARNING",
      message: `Epoch boundary in ${blocksUntilEpoch} blocks`,
      block,
      nextEpoch: block + blocksUntilEpoch,
    });

    // Run health checks
    await runHealthChecks();
  }
}

async function runHealthChecks() {
  // 1. Check quorum (≥2 validators)
  const peers = await provider.send("net_peerCount", []);
  if (parseInt(peers) < 2) {
    await sendAlert({ severity: "CRITICAL", message: "Peer count < 2" });
  }

  // 2. Check all validators same version
  // (SSH to each validator and check)

  // 3. Check NTP sync
  // (Check chrony on each validator)

  // 4. Prepare single-sealer script
  // (If epoch < 1M blocks, prep auto-sealer)
}

checkEpochBoundary();
```

**Cron**:
```cron
* * * * * /usr/bin/node /opt/xaheen/epoch-watcher.js >> /var/log/epoch-watcher.log 2>&1
```

---

## 6. Safe Epoch-Boundary Sealing Procedure

### Auto-Sealer Script

```bash
#!/bin/bash
# auto-sealer-epoch.sh

EPOCH=9000000
CURRENT_BLOCK=$(curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq -r '.result' | xargs -I {} printf "%d" {})

BLOCKS_UNTIL_EPOCH=$((EPOCH - (CURRENT_BLOCK % EPOCH)))

if [ "$BLOCKS_UNTIL_EPOCH" -le 5 ]; then
  echo "⚠️  Epoch boundary in $BLOCKS_UNTIL_EPOCH blocks"
  echo "🔄 Activating single-sealer mode..."

  # Stop validators 2 and 3
  docker stop bsc-validator-2 bsc-validator-3

  # Wait for epoch block to seal
  sleep 60

  # Check if past epoch
  NEW_BLOCK=$(curl -s http://localhost:8545 -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | jq -r '.result' | xargs -I {} printf "%d" {})

  if [ "$NEW_BLOCK" -gt "$CURRENT_BLOCK" ]; then
    echo "✅ Passed epoch boundary at block $NEW_BLOCK"
    docker start bsc-validator-2 bsc-validator-3
  else
    echo "❌ Failed to pass epoch"
    # Alert ops
  fi
fi
```

---

## 7. Genesis Linter in CI

### Pre-Deployment Validation

```javascript
// genesis-linter.js
import fs from "fs";
import crypto from "crypto";

function lintGenesis(genesisPath) {
  const genesis = JSON.parse(fs.readFileSync(genesisPath, "utf8"));

  // Check 1: Epoch ≥ 9M
  const epoch = genesis.config?.parlia?.epoch;
  if (!epoch || epoch < 9_000_000) {
    throw new Error(`❌ Epoch too small: ${epoch}. Must be ≥ 9,000,000`);
  }

  // Check 2: extraData format
  const extraData = genesis.extraData;
  if (!extraData || extraData.length < 138) {
    throw new Error(`❌ Invalid extraData: ${extraData}`);
  }

  // Decode validators from extraData
  const vanity = extraData.substring(0, 66); // 0x + 64 hex
  const validatorBytes = extraData.substring(66, extraData.length - 130);
  const validators = [];

  for (let i = 0; i < validatorBytes.length; i += 40) {
    validators.push("0x" + validatorBytes.substring(i, i + 40));
  }

  // Check 3: Validators sorted
  const sorted = [...validators].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(validators) !== JSON.stringify(sorted)) {
    throw new Error(`❌ Validators not sorted:\n  Got: ${validators}\n  Expected: ${sorted}`);
  }

  // Check 4: ChainId matches
  if (genesis.config.chainId !== 65001) {
    throw new Error(`❌ Wrong chainId: ${genesis.config.chainId}`);
  }

  // Generate genesis hash
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(genesis))
    .digest("hex");

  console.log("✅ Genesis validation passed");
  console.log(`   Epoch: ${epoch}`);
  console.log(`   Validators: ${validators.length}`);
  console.log(`   ChainId: ${genesis.config.chainId}`);
  console.log(`   Hash: ${hash}`);

  return hash;
}

// CI: Fail if hash doesn't match across environments
const hash = lintGenesis("./data/genesis.json");
const expectedHash = process.env.GENESIS_HASH;

if (expectedHash && hash !== expectedHash) {
  throw new Error(`❌ Genesis hash mismatch!\n  Got: ${hash}\n  Expected: ${expectedHash}`);
}
```

**GitHub Actions**:
```yaml
name: Validate Genesis
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: node scripts/genesis-linter.js
        env:
          GENESIS_HASH: ${{ secrets.GENESIS_HASH }}
```

---

## 8. Canary & Rehearsal

### Monthly Staging Rehearsal

**Setup staging network**:
```bash
# Use same genesis (but different network)
cp genesis.json staging-genesis.json

# Update chainId for staging
# Update to isolated infrastructure
```

**Rehearse epoch boundary** (monthly):
```bash
# 1. Advance chain to epoch - 10
# 2. Run pre-epoch health checks
# 3. Execute single-sealer procedure
# 4. Verify successful epoch crossing
# 5. Document any issues
```

**Rehearse regenesis** (quarterly):
```bash
# 1. Export state at current block
# 2. Generate new genesis with preserved state
# 3. Re-initialize validators
# 4. Verify contracts, balances, storage intact
# 5. Test transactions
```

---

## 9. Observability Dashboards & Alerts

### Grafana Dashboards

**Metrics to track**:
- Block time (should be ~3 seconds)
- Sealer address per block
- Missed sealing slots
- Peer count (should be ≥ 2)
- Chain head across validators
- Epoch progress (blocks until next epoch)

**Prometheus queries**:
```promql
# Block time
rate(eth_block_number[1m]) * 60

# Peer count
eth_peer_count

# Head variance
max(eth_block_number) - min(eth_block_number)
```

### Alert Rules

```yaml
groups:
  - name: xaheen_chain
    rules:
      - alert: NoNewBlocks
        expr: rate(eth_block_number[2m]) == 0
        for: 10s
        annotations:
          summary: "No new blocks for 2 minutes"

      - alert: ValidatorDown
        expr: up{job="xaheen-validator"} == 0
        for: 1m
        annotations:
          summary: "Validator {{ $labels.instance }} down"

      - alert: HeadMismatch
        expr: max(eth_block_number) - min(eth_block_number) > 5
        for: 1m
        annotations:
          summary: "Validators have divergent heads"

      - alert: LowPeerCount
        expr: eth_peer_count < 2
        for: 1m
        annotations:
          summary: "Peer count below quorum: {{ $value }}"
```

---

## 10. Emergency Runbook (Tested Quarterly)

### Printed Runbook Checklist

```
EPOCH BOUNDARY EMERGENCY RUNBOOK
Nor Chain - Chain ID 65001

═════════════════════════════════════════

SCENARIO: Chain stuck at epoch boundary

SYMPTOMS:
☐ Block number not increasing
☐ All validators running
☐ Peer count ≥ 2
☐ Block stuck at (epoch - 1)

═════════════════════════════════════════

FAST RECOVERY (Try first):

1. SSH to server:
   ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187

2. Stop validators 2 & 3:
   docker stop bsc-validator-2 bsc-validator-3

3. Wait 60 seconds

4. Check block:
   curl http://localhost:8545 -X POST \
     -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

5. If block > previous:
   docker start bsc-validator-2 bsc-validator-3
   ✅ SUCCESS

6. If block still stuck:
   Proceed to REGENESIS

═════════════════════════════════════════

REGENESIS (If fast recovery fails):

1. Run: ./scripts/epoch-recovery-regenesis.sh

2. Verify:
   ☐ Block number increasing
   ☐ All validators running
   ☐ LP reserves intact
   ☐ Contracts responding

═════════════════════════════════════════

CONTACTS:
- DevOps: [phone]
- Blockchain Lead: [phone]
- Infrastructure: [phone]

DOCUMENTATION:
- Full guide: docs/00-critical/EPOCH_BOUNDARY_RECOVERY_GUIDE.md
- Asset inventory: docs/00-critical/XAHEEN_CHAIN_COMPLETE_INVENTORY.md
```

---

## Implementation Timeline

### Week 1: Critical Fixes
- ✅ Fix current epoch stall (fast recovery or regenesis)
- ✅ Update genesis to epoch 9,000,000
- ✅ Verify validator list sorting
- ✅ Pin client versions

### Week 2: Monitoring
- ☐ Deploy epoch watcher
- ☐ Setup Grafana dashboards
- ☐ Configure alert rules
- ☐ Test alert delivery

### Week 3: Automation
- ☐ Implement auto-sealer script
- ☐ Setup genesis linter in CI
- ☐ Document emergency procedures
- ☐ Train ops team

### Week 4: Testing
- ☐ Setup staging network
- ☐ Rehearse epoch crossing
- ☐ Rehearse regenesis
- ☐ Update runbooks

### Ongoing: Monthly
- ☐ Review epoch watcher logs
- ☐ Rehearse epoch boundary on staging
- ☐ Update dashboards
- ☐ Test emergency procedures

### Ongoing: Quarterly
- ☐ Full regenesis rehearsal
- ☐ Audit validator versions
- ☐ Review and update runbooks
- ☐ Ops team training session

---

## Validation Checklist

Before marking "never get stuck again" as complete:

```
☐ 1. Genesis epoch updated to 9,000,000+
☐ 2. Validator list sorted and verified
☐ 3. All validators same client version
☐ 4. NTP configured and synced
☐ 5. Epoch watcher deployed and tested
☐ 6. Auto-sealer script deployed
☐ 7. Genesis linter in CI
☐ 8. Staging network operational
☐ 9. Grafana dashboards live
☐ 10. Alert rules tested and delivering
☐ 11. Emergency runbook printed
☐ 12. Ops team trained
☐ 13. Monthly rehearsal scheduled
☐ 14. Quarterly audit scheduled
```

---

**Status**: Ready for implementation
**Priority**: CRITICAL
**Next Action**: Execute fast recovery or regenesis

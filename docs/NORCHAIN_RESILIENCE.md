# NorChain Resilience Pack

**Last Updated**: November 5, 2025
**Purpose**: Infrastructure resilience, business continuity, and disaster recovery
**Scope**: DEX, Bridge, Escrow, Validators, and all critical infrastructure

---

## Executive Summary

This document provides a comprehensive resilience framework ensuring NorChain operations continue even if:
- ❌ AWS servers go down
- ❌ Front-end websites are unreachable
- ❌ Validator nodes crash
- ❌ RPC endpoints fail
- ❌ Team members are unavailable

**Core Principle**: **Users must always be able to access their funds**, even if NorChain Foundation disappears.

---

## Table of Contents

1. [Infrastructure Architecture](#1-infrastructure-architecture)
2. [Contract Control & Governance](#2-contract-control--governance)
3. [Decentralized Front-End](#3-decentralized-front-end)
4. [Emergency CLI Tools](#4-emergency-cli-tools)
5. [Validator Resilience](#5-validator-resilience)
6. [Incident Response](#6-incident-response)
7. [Recovery Procedures](#7-recovery-procedures)
8. [Testing & Drills](#8-testing--drills)

---

## 1. Infrastructure Architecture

### 1.1 Redundant RPC Endpoints

**Problem**: If rpc.norchain.org goes down, users can't interact with the chain.

**Solution**: Multiple geo-distributed RPC nodes

```yaml
Primary RPC:
  URL: https://rpc.norchain.org
  Location: AWS EU-North-1 (Stockholm)
  Provider: NorChain Foundation
  Status: ✅ Primary

Backup RPC 1:
  URL: https://rpc2.norchain.org
  Location: AWS US-East-1 (Virginia)
  Provider: NorChain Foundation
  Status: ✅ Active backup

Backup RPC 2:
  URL: https://rpc3.norchain.org
  Location: Hetzner Finland
  Provider: Community-run
  Status: ✅ Active backup

Community RPCs:
  - Community members can run RPC nodes
  - List published on norchain.org/rpc
  - MetaMask custom RPC instructions
```

**MetaMask Configuration** (resilience):
```javascript
// Users add ALL RPC endpoints to MetaMask
{
  chainId: "0xFDE9", // 65001
  chainName: "Nor Chain",
  rpcUrls: [
    "https://rpc.norchain.org",      // Try primary first
    "https://rpc2.norchain.org",     // Fallback 1
    "https://rpc3.norchain.org"      // Fallback 2
  ],
  nativeCurrency: {
    name: "NOR",
    symbol: "NOR",
    decimals: 18
  },
  blockExplorerUrls: ["https://explorer.norchain.org"]
}
```

---

### 1.2 Validator Distribution

**Current Setup** (3 validators):
- All 3 validators on same AWS instance (❌ Single point of failure!)

**Resilient Setup** (5+ validators across 3+ locations):

| Validator | Location | Provider | Operator |
|-----------|----------|----------|----------|
| **Val-1** | Norway (Oslo) | Hetzner | NorChain Foundation |
| **Val-2** | UAE (Dubai) | AWS | Partner (UAE institution) |
| **Val-3** | Kenya (Nairobi) | Google Cloud | Partner (CBK/Kenyan partner) |
| **Val-4** | Sweden (Stockholm) | AWS | Community validator |
| **Val-5** | Finland (Helsinki) | Hetzner | Community validator |

**Benefits**:
- ✅ No single datacenter failure kills the chain
- ✅ Geographic diversity (EU, Middle East, Africa)
- ✅ Institutional ownership spreads governance
- ✅ Community participation strengthens decentralization

**Next Steps**:
1. Migrate Val-2 and Val-3 to partner infrastructure
2. Onboard 2 community validators (application process)
3. Test failover scenarios (kill 2 validators, chain keeps running)

---

### 1.3 RPC Load Balancing & Auto-Failover

**Architecture**:

```
User Request
    ↓
Cloudflare Load Balancer
    ↓
├─ RPC-1 (AWS Stockholm)     [Primary]
├─ RPC-2 (AWS Virginia)       [Active backup]
└─ RPC-3 (Hetzner Finland)    [Active backup]
```

**Cloudflare Health Checks**:
- Ping `eth_blockNumber` every 30 seconds
- If RPC-1 returns error 3 times → route traffic to RPC-2
- Auto-recovery when RPC-1 healthy again

**DNS Failover** (alternative):
```
rpc.norchain.org → CNAME → norchain-rpc.cloudflare.net
  ↓
Cloudflare determines healthy endpoint automatically
```

**Setup Steps**:
```bash
# 1. Configure Cloudflare Load Balancer
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/load_balancers" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "rpc.norchain.org",
    "default_pools": ["primary-pool", "backup-pool"],
    "fallback_pool": "emergency-pool",
    "region_pools": {
      "WEUR": ["eu-pool"],
      "EEU": ["eu-pool"],
      "NAM": ["us-pool"]
    }
  }'

# 2. Configure health checks
# Check: POST to /
# Expected: {"jsonrpc":"2.0","id":1,"result":"0x..."}
# Interval: 30s
# Timeout: 10s
# Retries: 3
```

---

## 2. Contract Control & Governance

### 2.1 Gnosis Safe Multisig Setup

**Problem**: If deployer wallet is compromised or lost, no one can pause/upgrade contracts.

**Solution**: Gnosis Safe 3-of-5 multisig with timelocks

**Recommended Safe Configuration**:

```yaml
Safe Address: 0x...SAFE_ADDRESS...
Chain: NorChain (65001)
Threshold: 3 of 5 signers

Signers:
  1. NorChain CEO (Norway)          - BankID-verified
  2. NorChain CTO (Norway)          - BankID-verified
  3. UAE Partner Representative     - UAE Pass-verified
  4. Kenya Partner Representative   - National ID-verified
  5. Independent Director (Nordic)  - eID-verified

Actions Requiring Safe Approval:
  - Pause/unpause DEX or Bridge
  - Update fee parameters
  - Upgrade contracts (via timelock)
  - Withdraw fees from escrow
  - Add/remove validators
```

**Deployment Steps**:

```bash
# 1. Deploy Gnosis Safe on NorChain
git clone https://github.com/safe-global/safe-contracts
cd safe-contracts
npm install
npx hardhat run scripts/deploy-safe.js --network btcbr

# 2. Transfer contract ownership to Safe
const escrow = await ethers.getContractAt("Escrow", ESCROW_ADDRESS);
await escrow.transferOwnership(SAFE_ADDRESS);

const bridge = await ethers.getContractAt("NorBridge", BRIDGE_ADDRESS);
await bridge.transferOwnership(SAFE_ADDRESS);

# 3. Verify ownership transferred
await escrow.owner(); // Should return SAFE_ADDRESS
```

**Safe Web Interface**: https://app.safe.global/nor:0x...SAFE_ADDRESS...

---

### 2.2 Timelock for Critical Changes

**Problem**: Malicious signer or hacked Safe could instantly drain funds.

**Solution**: 48-72 hour timelock for critical operations

```solidity
// TimelockController from OpenZeppelin
contract NorTimelock {
    uint256 public constant MIN_DELAY = 48 hours;
    uint256 public constant MAX_DELAY = 7 days;

    // Queue an operation
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 salt,
        uint256 delay
    ) external onlyRole(PROPOSER_ROLE);

    // Execute after delay
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 salt
    ) external onlyRole(EXECUTOR_ROLE);

    // Cancel before execution
    function cancel(bytes32 id) external onlyRole(CANCELLER_ROLE);
}
```

**Example: Update Escrow Fee**

```javascript
// Day 0: Propose fee change (0.5% → 0.25%)
const proposal = await timelock.schedule(
  ESCROW_ADDRESS,
  0,
  escrow.interface.encodeFunctionData("configureFee", [25, FEE_COLLECTOR]),
  ethers.id("reduce-fee-2025-11-05"),
  48 * 60 * 60 // 48 hours
);

console.log("⏳ Fee change proposed. Users have 48 hours to review.");

// Day 2: Execute (after 48 hours)
await timelock.execute(
  ESCROW_ADDRESS,
  0,
  escrow.interface.encodeFunctionData("configureFee", [25, FEE_COLLECTOR]),
  ethers.id("reduce-fee-2025-11-05")
);

console.log("✅ Fee changed to 0.25%");
```

**Benefits**:
- ✅ Users have time to exit if they disagree with change
- ✅ Community can sound alarm if malicious proposal
- ✅ Media/partners can review changes before execution

---

### 2.3 Emergency Pause Authority

**Two-Tier Pause System**:

| Action | Pause Type | Authority | Use Case |
|--------|------------|-----------|----------|
| **Soft Pause** | DEX swaps only | 2-of-5 Safe | Suspected price manipulation |
| **Hard Pause** | All contracts | 3-of-5 Safe | Critical vulnerability found |
| **Emergency Pause** | Instant (no Safe) | Guardian address | Ongoing exploit |

**Guardian Address** (single-sig for speed):
- Held by 24/7 on-call engineer
- Can ONLY pause, NOT upgrade or withdraw funds
- Auto-expires after 24 hours (requires Safe renewal)

```solidity
contract Escrow {
    address public guardian;
    uint256 public guardianPauseExpiry;

    modifier onlyGuardianOrOwner() {
        require(
            msg.sender == owner() ||
            (msg.sender == guardian && block.timestamp < guardianPauseExpiry),
            "Not authorized"
        );
        _;
    }

    function emergencyPause() external onlyGuardianOrOwner {
        _pause();
        guardianPauseExpiry = block.timestamp + 24 hours;
    }

    function unpause() external onlyOwner {
        // Only Safe multisig can unpause
        _unpause();
    }
}
```

---

## 3. Decentralized Front-End

### 3.1 IPFS Deployment

**Problem**: If norchain.org is down, users can't access DEX/Bridge UI.

**Solution**: Deploy front-end to IPFS with ENS/DNS fallback

```bash
# 1. Build static front-end
cd norchain-dex-frontend
npm run build

# 2. Upload to IPFS
npx ipfs-deploy build/ -p pinata -d cloudflare

# 3. Pin to multiple providers
IPFS CID: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 4. Configure DNS
norchain.org         → A record → Cloudflare server
ipfs.norchain.org    → CNAME   → cloudflare-ipfs.com/ipfs/QmXXX...
backup.norchain.org  → IPFS gateway → ipfs.io/ipfs/QmXXX...
```

**Access Methods**:
1. **Primary**: https://norchain.org (fast, cached)
2. **IPFS Mirror**: https://ipfs.norchain.org (decentralized)
3. **Public Gateway**: https://ipfs.io/ipfs/QmXXX... (always available)
4. **Local IPFS**: ipfs://QmXXX... (if user runs IPFS node)

**Update Process**:
```bash
# On each front-end update:
1. Build new version
2. Upload to IPFS → get new CID
3. Update DNS to point to new CID
4. Announce on Twitter/Discord
5. Old CID remains accessible (versioning)
```

---

### 3.2 Status Page

**Public Status Dashboard**: https://status.norchain.org

**Monitors**:
- ✅ RPC uptime (all endpoints)
- ✅ Block production (latest block age)
- ✅ Validator status (each validator)
- ✅ Bridge balances (proof-of-reserves)
- ✅ Front-end availability (IPFS)
- ✅ Explorer uptime

**Stack**: Statuspage.io, UptimeRobot, or self-hosted Cachet

**Incident Communication**:
- Auto-posts to status page when service degrades
- Sends notifications via Discord webhook
- Email alerts to mailing list

**Setup** (self-hosted):
```bash
# Deploy Cachet status page
docker run -d --name norchain-status \
  -e APP_URL=https://status.norchain.org \
  -e DB_HOST=db \
  -e DB_DATABASE=cachet \
  -e DB_USERNAME=cachet \
  -e DB_PASSWORD=password \
  -p 8000:8000 \
  cachethq/docker:latest

# Configure monitors
curl -X POST https://status.norchain.org/api/v1/components \
  -H "X-Cachet-Token: TOKEN" \
  -d '{
    "name": "RPC Endpoint 1",
    "status": 1,
    "link": "https://rpc.norchain.org"
  }'
```

---

## 4. Emergency CLI Tools

### 4.1 Direct Contract Interaction Scripts

**Purpose**: Users can interact with contracts WITHOUT any front-end

**CLI Tools** (distribute via GitHub + npm):

```bash
# Install CLI
npm install -g @norchain/emergency-cli

# Configure
nor-cli config set-rpc https://rpc.norchain.org
nor-cli config set-wallet /path/to/keystore.json

# DEX: Swap tokens
nor-cli dex swap \
  --from NOR \
  --to USDT \
  --amount 1000 \
  --slippage 5

# DEX: Remove liquidity
nor-cli dex remove-liquidity \
  --pair NOR/USDT \
  --lp-tokens 100

# Bridge: Withdraw from vault
nor-cli bridge withdraw \
  --network bsc \
  --token NOR \
  --amount 5000

# Escrow: Refund after deadline
nor-cli escrow refund \
  --deal-id 0x123abc...

# Escrow: Release to payee
nor-cli escrow release \
  --deal-id 0x456def... \
  --signer arbiter
```

**Source Code**: https://github.com/norchain/emergency-cli

---

### 4.2 Hardhat Console Access

**For Developers/Power Users**:

```bash
# 1. Clone contracts repo
git clone https://github.com/norchain/blockchain-v2
cd blockchain-v2

# 2. Install deps
npm install

# 3. Connect to NorChain via Hardhat console
npx hardhat console --network btcbr

# 4. Interact with contracts
> const Escrow = await ethers.getContractAt("Escrow", "0x...ESCROW_ADDRESS...");
> const deal = await Escrow.getDeal(ethers.id("my-deal-001"));
> console.log(deal);

# 5. Emergency refund
> await Escrow.refund(ethers.id("my-deal-001"));
```

---

## 5. Validator Resilience

### 5.1 Validator Backup & Snapshot

**Problem**: Validator crashes and loses blockchain state (days to resync).

**Solution**: Daily snapshots to S3/IPFS

```bash
#!/bin/bash
# Daily validator backup script
# Run as cron job: 0 2 * * * /scripts/backup-validator.sh

VALIDATOR_DIR="/home/ec2-user/validator-1"
BACKUP_DIR="/backups/validator-snapshots"
DATE=$(date +%Y-%m-%d)

# Stop validator
docker stop xaheen-rpc

# Create snapshot
tar -czf "${BACKUP_DIR}/validator-${DATE}.tar.gz" \
  "${VALIDATOR_DIR}/geth/chaindata" \
  "${VALIDATOR_DIR}/keystore"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/validator-${DATE}.tar.gz" \
  s3://norchain-backups/validators/

# Upload to IPFS (decentralized backup)
ipfs add "${BACKUP_DIR}/validator-${DATE}.tar.gz"

# Restart validator
docker start xaheen-rpc

# Keep only last 7 days locally
find "${BACKUP_DIR}" -name "validator-*.tar.gz" -mtime +7 -delete

echo "✅ Validator backup complete: ${DATE}"
```

**Restore Process**:

```bash
# Download latest snapshot
aws s3 cp s3://norchain-backups/validators/validator-2025-11-05.tar.gz .

# Extract
tar -xzf validator-2025-11-05.tar.gz -C /home/ec2-user/validator-1/

# Restart validator
docker start xaheen-rpc

# Resync takes minutes instead of days!
```

---

### 5.2 Validator Monitoring & Alerts

**24/7 Monitoring** (Prometheus + Grafana + AlertManager):

```yaml
# Prometheus alerts
groups:
  - name: norchain-validators
    interval: 30s
    rules:
      - alert: ValidatorDown
        expr: up{job="norchain-validator"} == 0
        for: 2m
        annotations:
          summary: "Validator {{ $labels.instance }} is down"
          description: "No response for 2 minutes"

      - alert: BlockProductionStalled
        expr: (time() - norchain_latest_block_timestamp) > 60
        for: 1m
        annotations:
          summary: "Block production stalled"
          description: "No new block in 60 seconds"

      - alert: PeerCountLow
        expr: norchain_peer_count < 2
        for: 5m
        annotations:
          summary: "Validator {{ $labels.instance }} has low peer count"
          description: "Only {{ $value }} peers connected"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 10m
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Only {{ $value }}% free"
```

**Alert Destinations**:
- PagerDuty (24/7 on-call rotation)
- Discord webhook (public alerts)
- Email (compliance team)
- SMS (critical only)

---

## 6. Incident Response

### 6.1 Incident Classification

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P0 - Critical** | Chain halted, funds at risk | < 15 min | CEO + CTO + all hands |
| **P1 - High** | RPC down, validator offline | < 1 hour | On-call engineer |
| **P2 - Medium** | Explorer slow, front-end lag | < 4 hours | Dev team |
| **P3 - Low** | Documentation issue, minor bug | < 24 hours | Next sprint |

---

### 6.2 Incident Response Playbook

**Critical Incident (P0) - Example: Bridge Exploit Detected**

```markdown
## Incident: Bridge Exploit (P0)

### 00:00 - Detection
- Alert: "Bridge vault balance decreased by 1M NOR without matching event"
- Source: Proof-of-reserves monitor

### 00:02 - Immediate Actions
1. Page on-call engineer (PagerDuty)
2. Guardian pauses Bridge contract (emergency pause)
3. Post to status.norchain.org: "Bridge paused for maintenance"
4. Alert Safe signers via encrypted Signal group

### 00:15 - Assessment
1. Review recent transactions on BSCScan + NorChain explorer
2. Identify exploit vector (reentrancy? signature bypass?)
3. Estimate losses (X NOR stolen, Y NOR still at risk)

### 00:30 - Containment
1. Safe multisig (3-of-5) approves hard pause of ALL bridges
2. Alert CEXs to halt NOR deposits/withdrawals
3. Contact Chainalysis to flag stolen funds

### 01:00 - Communication
1. Twitter announcement (details + timeline for fix)
2. Email all users who bridged in last 24h
3. Discord AMA (CTO explains situation)

### 04:00 - Fix Development
1. Patch vulnerability in code
2. Deploy to testnet, verify fix
3. Commission emergency audit (Trail of Bits 24h turnaround)

### 24:00 - Audit Complete
1. Audit confirms fix
2. Deploy patched contract via Safe + timelock (expedited 6h)
3. Conduct post-mortem

### 30:00 - Resume Operations
1. Safe multisig unpauses bridge
2. Announce resumption
3. Publish incident report + compensation plan
```

---

### 6.3 Post-Incident Review

**Post-Mortem Template**:

```markdown
# Incident Post-Mortem: [TITLE]

**Date**: 2025-11-05
**Duration**: 6 hours
**Impact**: Bridge paused, no funds lost
**Root Cause**: Reentrancy vulnerability in withdraw function

## Timeline
- 00:00: Alert triggered
- 00:02: Guardian paused bridge
- 00:15: Vulnerability identified
- 04:00: Fix deployed to testnet
- 24:00: Audit completed
- 30:00: Bridge resumed

## What Went Well
✅ Guardian pause worked as designed
✅ Safe multisig responded within 15 minutes
✅ No user funds lost
✅ Clear communication on status page

## What Went Wrong
❌ Vulnerability not caught in initial audit
❌ Proof-of-reserves monitor delayed by 10 minutes
❌ Discord notification failed (webhook issue)

## Action Items
1. [HIGH] Add reentrancy guard to all withdraw functions (Owner: CTO, Due: Nov 7)
2. [HIGH] Reduce proof-of-reserves check interval to 1 minute (Owner: DevOps, Due: Nov 6)
3. [MEDIUM] Add backup Discord webhook (Owner: Community Manager, Due: Nov 8)
4. [LOW] Update incident response playbook with this learnings (Owner: Compliance, Due: Nov 10)

## Preventative Measures
- Re-audit all contracts with Trail of Bits (scheduled Dec 2025)
- Expand bug bounty to $500k max payout
- Weekly "red team" exercises to test incident response
```

---

## 7. Recovery Procedures

### 7.1 Validator Recovery (from snapshot)

```bash
#!/bin/bash
# Validator disaster recovery script

echo "🚨 NorChain Validator Recovery"
echo "==============================="

# 1. Download latest snapshot from S3
echo "[1/5] Downloading latest snapshot..."
LATEST_SNAPSHOT=$(aws s3 ls s3://norchain-backups/validators/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://norchain-backups/validators/${LATEST_SNAPSHOT}" ./

# 2. Stop all validators
echo "[2/5] Stopping validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3

# 3. Backup current state (just in case)
echo "[3/5] Backing up current state..."
tar -czf "validator-backup-$(date +%s).tar.gz" /home/ec2-user/validator-*

# 4. Extract snapshot
echo "[4/5] Extracting snapshot..."
tar -xzf "${LATEST_SNAPSHOT}" -C /home/ec2-user/

# 5. Restart validators
echo "[5/5] Restarting validators..."
docker start xaheen-rpc bsc-validator-2 bsc-validator-3

# 6. Verify
sleep 30
BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)

echo "✅ Recovery complete! Current block: $((16#${BLOCK:2}))"
```

---

### 7.2 Genesis Reset (Nuclear Option)

**⚠️ ONLY if chain is completely broken beyond repair**

```bash
#!/bin/bash
# WARNING: This RESETS the entire chain!
# Use ONLY if validators are stuck and cannot progress

echo "⚠️  GENESIS RESET - LAST RESORT"
echo "This will reset the chain to block 0!"
read -p "Are you sure? Type 'RESET' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESET" ]; then
  echo "Aborted."
  exit 1
fi

# 1. Stop all validators
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3

# 2. Remove old chain data
rm -rf /home/ec2-user/validator-*/geth

# 3. Re-initialize with genesis
docker run --rm \
  -v /home/ec2-user/validator-1:/bsc \
  -v /home/ec2-user/genesis-nor-ultimate.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
  -v /home/ec2-user/validator-2:/bsc \
  -v /home/ec2-user/genesis-nor-ultimate.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
  -v /home/ec2-user/validator-3:/bsc \
  -v /home/ec2-user/genesis-nor-ultimate.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# 4. Restart validators
docker start xaheen-rpc bsc-validator-2 bsc-validator-3

echo "✅ Chain reset to genesis. New era begins at block 0."
```

**Communication After Reset**:
1. Announce on all channels (Twitter, Discord, email)
2. Publish new RPC endpoints (if changed)
3. Request all users re-sync MetaMask
4. Re-deploy bridge contracts (addresses may change)
5. Post-mortem explaining why reset was necessary

---

## 8. Testing & Drills

### 8.1 Monthly Chaos Engineering

**Schedule**: First Monday of every month

**Exercises**:

| Month | Scenario | Test |
|-------|----------|------|
| **November** | Kill primary RPC | Does Cloudflare fail over to backup? |
| **December** | Kill 2 validators | Does chain keep producing blocks? |
| **January** | Front-end DDOS | Can users access IPFS mirror? |
| **February** | Guardian pause | Can Safe multisig unpause within 1 hour? |
| **March** | Disk full on validator | Does monitoring alert? Auto-cleanup? |
| **April** | AWS region outage | Can we migrate to Hetzner? |

**Drill Procedure**:
```bash
# 1. Announce drill 24h in advance
echo "🧪 Chaos drill tomorrow 10:00 UTC: RPC failover test"

# 2. Execute at scheduled time
# Kill primary RPC
ssh rpc-primary "sudo systemctl stop geth"

# 3. Monitor
# - Does Cloudflare route to backup within 30s?
# - Do users experience downtime?
# - Are alerts triggered?

# 4. Restore
ssh rpc-primary "sudo systemctl start geth"

# 5. Debrief
# Write summary: What worked? What broke? Action items?
```

---

### 8.2 Incident Response Tabletop

**Quarterly Exercise** (full team):

**Example Scenario**:
> "It's 3 AM. You wake up to PagerDuty alert: 'Bridge vault drained of 5M NOR'.
> What do you do in the first 15 minutes?"

**Team Roles**:
- **Incident Commander** (CTO)
- **Technical Lead** (Senior Engineer)
- **Communications Lead** (Community Manager)
- **Compliance Lead** (MLRO)
- **Observer** (External auditor)

**Evaluation**:
- ✅ Did we pause contracts within 5 minutes?
- ✅ Did we notify users within 15 minutes?
- ✅ Did we contact authorities (if theft)?
- ✅ Did we follow playbook correctly?

---

## 9. Contact Tree (Emergency)

### Primary On-Call

```yaml
Primary:
  Name: [CTO Name]
  Phone: +47 XXX XX XXX
  Signal: @norchain-cto
  Backup: [Senior Engineer Name]

Escalation:
  Level 1 (P1-P2): On-call engineer
  Level 2 (P0): CTO + CEO
  Level 3 (P0 + funds at risk): All Safe signers + legal counsel
```

### External Contacts

```yaml
Security:
  Trail of Bits (audit): emergency@trailofbits.com
  CertiK (monitoring): alert@certik.com
  Chainalysis (tracking): support@chainalysis.com

Regulatory:
  Finanstilsynet (Norway): +47 22 93 98 00
  Datatilsynet (GDPR): +47 22 39 69 00

Legal:
  Primary Counsel: [Law Firm] - [Partner Name]
  Cyber Insurance: [Insurance Company] - [Claim Number]

Infrastructure:
  AWS Support: +1-XXX-XXX-XXXX (Premium Support)
  Cloudflare: +1-888-993-5273 (Enterprise)
  Hetzner: support@hetzner.com
```

---

## 10. Summary Checklist

**Infrastructure Resilience**:
- [ ] 3+ RPC endpoints across 2+ providers
- [ ] 5+ validators across 3+ countries
- [ ] Cloudflare load balancer with health checks
- [ ] Daily validator snapshots to S3 + IPFS
- [ ] Status page operational (status.norchain.org)

**Governance Resilience**:
- [ ] Gnosis Safe 3-of-5 multisig deployed
- [ ] Timelock (48h) for critical changes
- [ ] Guardian address for emergency pause
- [ ] All contracts owned by Safe (not EOA)

**User Resilience**:
- [ ] Front-end on IPFS (ipfs.norchain.org)
- [ ] Emergency CLI tools published
- [ ] Documentation: "How to withdraw without UI"
- [ ] Proof-of-reserves dashboard public

**Operational Resilience**:
- [ ] 24/7 monitoring with PagerDuty
- [ ] Incident response playbook tested
- [ ] Monthly chaos drills scheduled
- [ ] Quarterly tabletop exercises
- [ ] Post-incident review process

---

## Appendix: Emergency Contact Card

**Print this and keep in wallet**:

```
═══════════════════════════════════════
     NORCHAIN EMERGENCY CONTACTS
═══════════════════════════════════════

🚨 INCIDENT HOTLINE: +47 XXX XX XXX

📍 RPC ENDPOINTS:
   Primary: https://rpc.norchain.org
   Backup:  https://rpc2.norchain.org
   IPFS:    https://ipfs.norchain.org

🔐 SAFE MULTISIG: 0x...SAFE_ADDRESS...

📊 STATUS: https://status.norchain.org

🛠 CLI: npm install -g @norchain/emergency-cli

═══════════════════════════════════════
    KEEP YOUR SEED PHRASE SAFE
═══════════════════════════════════════
```

---

**Document Status**: Living document, updated after each incident or drill
**Next Review**: February 2026
**Owner**: NorChain Infrastructure Team
**Contact**: devops@norchain.org

---

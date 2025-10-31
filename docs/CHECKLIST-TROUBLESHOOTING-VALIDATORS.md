# Validator Troubleshooting Checklist

**Purpose**: Systematic diagnosis and resolution of validator issues

## 🔍 SYMPTOM: Chain Stuck at Block 1

### Quick Diagnostics
```bash
# Run this diagnostic script first
ssh user@server << 'EOF'
echo "=== Quick Validator Diagnostic ==="
echo ""
echo "Block Number:"
curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n"

echo ""
echo "Peer Count:"
curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n"

echo ""
echo "Validator Status:"
docker ps --format '{{.Names}}: {{.Status}}'

echo ""
echo "Mining Status (via logs):"
docker logs xaheen-rpc 2>&1 | grep -i "mining\|signed recently" | tail -5
EOF
```

### Decision Tree

```
Block stuck at 1?
├─ YES → Continue diagnosis
└─ NO → See "Block Production Slow" section

Validators running?
├─ NO → See "Validators Not Starting" section
└─ YES → Continue

Mining enabled on all validators?
├─ NO → Enable mining and restart
└─ YES → Continue

Peers connected (≥ N-1 peers per validator)?
├─ NO → See "Peer Connectivity Issues" section
└─ YES → Continue

Logs show "Signed recently, must wait for others"?
├─ YES → **PARLIA CONSENSUS DEADLOCK** → See fix below
└─ NO → See "Other Issues" section
```

### FIX: Parlia Consensus Deadlock

**Root Causes**:
1. Malformed extraData in genesis
2. Epoch value too high
3. Missing --networkid flag

#### Step 1: Verify Genesis ExtraData
```bash
# Check extraData length
node -e "
const fs = require('fs');
const genesis = JSON.parse(fs.readFileSync('data/genesis.json'));
const len = genesis.extraData.length - 2;
console.log('ExtraData length:', len);
console.log('Expected for 3 validators:', 314);

// Check seal
const seal = genesis.extraData.slice(-130);
console.log('Seal all zeros?', seal.split('').every(c => c === '0'));
"
```

- [ ] ExtraData length is (64 + N×40 + 130) hex chars
- [ ] Seal is all zeros (last 130 hex chars)
- [ ] No extra padding at end

**If extraData is malformed:**
```bash
# Fix extraData and redeploy
./scripts/generate-fixed-genesis.sh
./scripts/deploy-3-validators-fixed.sh
```

#### Step 2: Verify Epoch Configuration
```bash
# Check epoch value
node -e "console.log(JSON.parse(require('fs').readFileSync('data/genesis.json')).config.parlia.epoch)"
```

- [ ] Epoch ≤ 30000
- [ ] Epoch = 200-500 for 3-7 validators

**If epoch too high:**
```bash
# Update genesis epoch and redeploy
node -e "
const fs = require('fs');
const genesis = JSON.parse(fs.readFileSync('data/genesis.json'));
genesis.config.parlia.epoch = 200;
fs.writeFileSync('data/genesis-fixed.json', JSON.stringify(genesis, null, 2));
"
```

#### Step 3: Add --networkid Flag
- [ ] All validators started with `--networkid <chainId>`

**Add networkid to validator startup:**
```bash
docker run -d --name xaheen-rpc --network host \
  -v ~/blockchain-v2/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \  # ADD THIS
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --mine ...
```

#### Complete Fix Script
```bash
./scripts/deploy-3-validators-fixed.sh
```

**This script**:
- Uploads corrected genesis
- Clears old blockchain data
- Reinitializes all validators
- Starts with `--networkid` flag
- Creates static-nodes.json
- Monitors block production

## 🔍 SYMPTOM: Validators Not Starting

### Check Docker Status
```bash
docker ps -a | grep validator
docker logs xaheen-rpc --tail 50
```

### Common Issues

#### Issue: "Failed to unlock account"
**Cause**: Incorrect password or keystore file

**Fix**:
```bash
# Verify password file exists
ls -la validator-1/password.txt

# Verify keystore exists
ls -la validator-1/keystore/

# Check validator address matches
cat validator-1/keystore/*.json | jq -r .address
```

- [ ] Password file exists and readable
- [ ] Keystore file present
- [ ] Only ONE keystore file per validator (remove old ones!)
- [ ] Address in startup command matches keystore

#### Issue: "Fatal: Failed to write genesis block"
**Cause**: Invalid genesis format or existing data

**Fix**:
```bash
# Clear existing data and reinit
rm -rf validator-1/geth validator-2/geth validator-3/geth
docker run --rm \
  -v $(pwd)/validator-1:/bsc \
  -v $(pwd)/data/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json
```

#### Issue: Port already in use
**Cause**: Previous containers still running

**Fix**:
```bash
# Stop and remove all validator containers
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3

# Verify ports are free
netstat -tuln | grep -E '8545|8546|30303|30304|30305'
```

## 🔍 SYMPTOM: Peer Connectivity Issues

### Check Current Peers
```bash
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "net.peerCount"
docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "net.peerCount"
docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "net.peerCount"
```

**Expected**: Each validator should have (N-1) peers
- 3 validators: 2 peers each
- 7 validators: 6 peers each

### Fix: Create static-nodes.json

```bash
# Get enode addresses
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" | sed 's/@[0-9.]*:/@127.0.0.1:/')

# Create static-nodes.json for each validator
echo "[$ENODE2, $ENODE3]" > validator-1/static-nodes.json
echo "[$ENODE1, $ENODE3]" > validator-2/static-nodes.json
echo "[$ENODE1, $ENODE2]" > validator-3/static-nodes.json

# Restart validators
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3
```

### Manual Peering (Temporary)
```bash
# Add peers manually (temporary until restart)
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec \
  "admin.addPeer($ENODE2)"
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec \
  "admin.addPeer($ENODE3)"
```

## 🔍 SYMPTOM: Block Production Slow

### Check Block Time
```bash
# Monitor block production rate
for i in {1..10}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")
  TIME=$(date +%H:%M:%S)
  echo "[$TIME] Block: $BLOCK"
  sleep 3
done
```

**Expected**: New block every 3 seconds (period from genesis)

### Common Causes

#### Too few peers
- Validators can't communicate
- Fix: See "Peer Connectivity Issues" above

#### Validator not in turn
- Check validator set: `eth.getBlock("latest").miner`
- Ensure all validators in genesis extraData are running

#### System resources low
```bash
# Check system resources
top
df -h  # Disk space
free -h  # Memory
```

## 🔍 SYMPTOM: RPC Not Responding

### Test RPC Connectivity
```bash
# Local test
curl -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Remote test
curl -X POST http://<server-ip>:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Common Issues

#### Port not exposed
```bash
# Check firewall
sudo ufw status
sudo ufw allow 8545/tcp

# Check docker network mode
docker inspect xaheen-rpc | grep NetworkMode
# Should be "host"
```

#### HTTP API not enabled
- Check validator startup has `--http --http.addr 0.0.0.0 --http.port 8545`
- Check `--http.api` includes required modules

## 🚨 EMERGENCY: Complete Reset

**Use when all else fails:**

```bash
#!/bin/bash
# Complete validator reset
set -e

# 1. Stop everything
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# 2. Clear blockchain data (KEEP KEYSTORES!)
rm -rf validator-1/geth validator-2/geth validator-3/geth

# 3. Verify genesis is correct
./scripts/validate-genesis.sh

# 4. Reinitialize
docker run --rm -v $(pwd)/validator-1:/bsc -v $(pwd)/data/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v $(pwd)/validator-2:/bsc -v $(pwd)/data/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v $(pwd)/validator-3:/bsc -v $(pwd)/data/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json

# 5. Deploy with fixed script
./scripts/deploy-3-validators-fixed.sh
```

## 📊 Monitoring Commands

### Real-time Block Monitor
```bash
watch -n 3 'curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" | jq -r ".result" | xargs printf "%d\n"'
```

### Validator Health Check
```bash
# Run every 5 minutes
*/5 * * * * /home/user/scripts/validator-healthcheck.sh
```

```bash
#!/bin/bash
# validator-healthcheck.sh
BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")
PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")

if [ "$PEERS" -lt 2 ]; then
  echo "ALERT: Only $PEERS peers connected"
  # Send notification
fi

if [ -z "$LAST_BLOCK" ]; then
  echo "$BLOCK" > /tmp/last_block
else
  LAST_BLOCK=$(cat /tmp/last_block)
  if [ "$BLOCK" -eq "$LAST_BLOCK" ]; then
    echo "ALERT: Chain stuck at block $BLOCK"
    # Send notification
  fi
  echo "$BLOCK" > /tmp/last_block
fi
```

## 📚 Quick Reference

### Essential Commands
```bash
# Check block number
curl -s localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq

# Check peers
curl -s localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq

# Check mining
docker logs xaheen-rpc 2>&1 | grep -i mining | tail -5

# View validator logs
docker logs xaheen-rpc --tail 100 --follow

# Attach to validator console
docker exec -it xaheen-rpc geth attach /bsc/geth.ipc
```

### Critical Files
- Genesis: `data/genesis.json`
- Keystores: `validator-N/keystore/`
- Passwords: `validator-N/password.txt`
- Static peers: `validator-N/static-nodes.json`
- Blockchain data: `validator-N/geth/`

## 🔗 Related Documentation
- Genesis Creation: `docs/CHECKLIST-GENESIS-CREATION.md`
- Validator Deployment: `docs/CHECKLIST-VALIDATOR-DEPLOYMENT.md`
- Parlia Deadlock Fix: `docs/PARLIA-DEADLOCK-FIX-SUMMARY.md`

---

**Last Updated**: October 31, 2025
**Status**: Production-Ready ✅

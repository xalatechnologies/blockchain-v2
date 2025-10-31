# Validator Deployment Checklist

**Purpose**: Complete guide for deploying BSC/Parlia validators from scratch

## ✅ PRE-DEPLOYMENT REQUIREMENTS

### 1. Server Prerequisites
- [ ] Server provisioned (AWS EC2, DigitalOcean, or bare metal)
- [ ] Minimum specs:
  - CPU: 4+ cores
  - RAM: 8+ GB
  - Storage: 500+ GB SSD
  - Network: 100+ Mbps
- [ ] Operating System: Ubuntu 20.04+ or Amazon Linux 2
- [ ] Docker installed and running
- [ ] Ports opened in firewall:
  - 8545 (HTTP RPC) - for RPC node only
  - 8546 (WebSocket) - for RPC node only
  - 30303-30305 (P2P) - for all validators

### 2. Repository Setup
- [ ] Blockchain-v2 repository cloned
- [ ] Working directory: `~/blockchain-v2`
- [ ] Genesis file prepared and validated
- [ ] Deployment scripts made executable

### 3. Required Files
- [ ] `data/genesis.json` - Validated genesis file
- [ ] `bsc-validator-key.pem` - SSH key for remote deployment (if remote)
- [ ] `.env` file with required keys

## ✅ VALIDATOR KEYSTORE GENERATION

### For Each Validator

```bash
# Generate validator keystore
node scripts/create-validator-keystore.js

# Or manually with Docker
docker run --rm -it \
  -v $(pwd)/validator-1:/bsc \
  dysnix/bsc account new --datadir /bsc

# Extract validator address
cat validator-1/keystore/*.json | jq -r .address
```

**Checklist per validator:**
- [ ] Keystore file created in `validator-N/keystore/`
- [ ] Password saved in `validator-N/password.txt`
- [ ] Validator address extracted and documented
- [ ] **CRITICAL**: Only ONE keystore file per validator (remove old ones!)

### Validator Addresses Documentation

```bash
# Document all validator addresses
V1_ADDR=$(cat validator-1/keystore/*.json | jq -r .address | head -1)
V2_ADDR=$(cat validator-2/keystore/*.json | jq -r .address | head -1)
V3_ADDR=$(cat validator-3/keystore/*.json | jq -r .address | head -1)

echo "Validator 1: 0x$V1_ADDR"
echo "Validator 2: 0x$V2_ADDR"
echo "Validator 3: 0x$V3_ADDR"

# Save to file
cat > data/validators-info.json <<EOF
{
  "validator1": {
    "address": "0x$V1_ADDR",
    "port": 30303,
    "rpc": true
  },
  "validator2": {
    "address": "0x$V2_ADDR",
    "port": 30304,
    "rpc": false
  },
  "validator3": {
    "address": "0x$V3_ADDR",
    "port": 30305,
    "rpc": false
  }
}
EOF
```

- [ ] Validator addresses documented
- [ ] Addresses match those in genesis extraData
- [ ] Backup of keystore files created

## ✅ GENESIS INITIALIZATION

### Validate Genesis First

```bash
# Run validation script (from CHECKLIST-GENESIS-CREATION.md)
node -e "
const fs = require('fs');
const genesis = JSON.parse(fs.readFileSync('data/genesis.json'));

console.log('=== Genesis Validation ===');

// Check extraData length
const extraLen = genesis.extraData.length - 2;
const validatorCount = (extraLen - 64 - 130) / 40;
console.log('Validators in extraData:', validatorCount);

// Check seal
const seal = genesis.extraData.slice(-130);
const allZeros = seal.split('').every(c => c === '0');
console.log('Seal is all zeros:', allZeros ? '✅' : '❌');

// Check epoch
console.log('Epoch:', genesis.config.parlia.epoch);
if (genesis.config.parlia.epoch > 30000) console.warn('⚠️  Epoch very high!');

console.log('Chain ID:', genesis.config.chainId);
console.log('✅ Validation complete');
"
```

- [ ] Genesis validation passed
- [ ] ExtraData format correct
- [ ] Seal is all zeros
- [ ] Epoch appropriate for validator count

### Initialize All Validators

```bash
# Initialize validator 1
docker run --rm \
  -v ~/blockchain-v2/validator-1:/bsc \
  -v ~/blockchain-v2/data/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 2
docker run --rm \
  -v ~/blockchain-v2/validator-2:/bsc \
  -v ~/blockchain-v2/data/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 3
docker run --rm \
  -v ~/blockchain-v2/validator-3:/bsc \
  -v ~/blockchain-v2/data/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json
```

**Per-validator checklist:**
- [ ] Initialization completed without errors
- [ ] Genesis hash displayed and recorded
- [ ] `geth/chaindata` directory created
- [ ] All validators show SAME genesis hash

## ✅ VALIDATOR STARTUP

### Critical Startup Flags

**REQUIRED FLAGS:**
- `--datadir /bsc` - Data directory
- `--networkid <chainId>` - **CRITICAL**: Must match genesis chainId
- `--mine` - Enable mining
- `--miner.etherbase 0x<address>` - Validator's reward address
- `--unlock 0x<address>` - Unlock validator account
- `--password /bsc/password.txt` - Password file
- `--allow-insecure-unlock` - Allow HTTP unlock (private network)
- `--port <p2p-port>` - P2P port (30303, 30304, 30305)
- `--maxpeers 25` - Maximum peer connections

**RPC Node Additional Flags:**
- `--http --http.addr 0.0.0.0 --http.port 8545`
- `--http.vhosts "*" --http.corsdomain "*"`
- `--http.api eth,net,web3,txpool,personal,admin`
- `--ws --ws.addr 0.0.0.0 --ws.port 8546`
- `--ws.origins "*" --ws.api eth,net,web3,txpool`

### Start Validator 1 (RPC + Mining)

```bash
docker run -d --name xaheen-rpc --network host \
  -v ~/blockchain-v2/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --gcmode archive \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.vhosts "*" --http.corsdomain "*" \
  --http.api eth,net,web3,txpool,personal,admin \
  --ws --ws.addr 0.0.0.0 --ws.port 8546 \
  --ws.origins "*" --ws.api eth,net,web3,txpool \
  --mine --miner.threads=1 \
  --miner.etherbase 0x$V1_ADDR \
  --unlock 0x$V1_ADDR \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --port 30303 \
  --maxpeers 25
```

- [ ] Validator 1 started successfully
- [ ] Container running: `docker ps | grep xaheen-rpc`
- [ ] Logs show no errors: `docker logs xaheen-rpc --tail 50`

### Start Validator 2 (Mining only)

```bash
docker run -d --name bsc-validator-2 --network host \
  -v ~/blockchain-v2/validator-2:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --port 30304 \
  --unlock 0x$V2_ADDR \
  --password /bsc/password.txt \
  --mine --miner.threads=1 \
  --miner.etherbase 0x$V2_ADDR \
  --allow-insecure-unlock \
  --maxpeers 25
```

- [ ] Validator 2 started successfully
- [ ] Container running: `docker ps | grep bsc-validator-2`

### Start Validator 3 (Mining only)

```bash
docker run -d --name bsc-validator-3 --network host \
  -v ~/blockchain-v2/validator-3:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --port 30305 \
  --unlock 0x$V3_ADDR \
  --password /bsc/password.txt \
  --mine --miner.threads=1 \
  --miner.etherbase 0x$V3_ADDR \
  --allow-insecure-unlock \
  --maxpeers 25
```

- [ ] Validator 3 started successfully
- [ ] Container running: `docker ps | grep bsc-validator-3`

## ✅ PEER CONNECTIVITY SETUP

### Wait for Initialization

```bash
# Wait 15-30 seconds for validators to start
sleep 15
```

### Get Enode Addresses

```bash
# Get enode for validator 1
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

# Get enode for validator 2
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

# Get enode for validator 3
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

echo "Enode 1: $ENODE1"
echo "Enode 2: $ENODE2"
echo "Enode 3: $ENODE3"
```

- [ ] All 3 enode addresses retrieved
- [ ] Enodes use 127.0.0.1 (localhost) for same-server deployment
- [ ] Enodes use correct ports (30303, 30304, 30305)

### Create static-nodes.json Files

```bash
# Validator 1 connects to 2 and 3
echo "[$ENODE2, $ENODE3]" > validator-1/static-nodes.json

# Validator 2 connects to 1 and 3
echo "[$ENODE1, $ENODE3]" > validator-2/static-nodes.json

# Validator 3 connects to 1 and 2
echo "[$ENODE1, $ENODE2]" > validator-3/static-nodes.json
```

- [ ] static-nodes.json created for all validators
- [ ] Each validator lists OTHER validators (not itself)
- [ ] Files are valid JSON format

### Restart Validators to Apply Peering

```bash
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3
```

- [ ] All validators restarted
- [ ] Wait 10 seconds for reconnection

## ✅ VERIFICATION AND MONITORING

### Check Peer Connections

```bash
# Check peers on validator 1
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | jq -r '.result' | xargs printf "%d\n"

# Expected: 2 peers for 3-validator setup
```

- [ ] Validator 1 has 2 peers
- [ ] Validator 2 has 2 peers (check via geth attach)
- [ ] Validator 3 has 2 peers (check via geth attach)

### Check Block Production

```bash
# Monitor block number for 30 seconds
for i in {1..10}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | jq -r '.result' | xargs printf "%d\n")

  TIME=$(date +%H:%M:%S)
  echo "[$TIME] Block: $BLOCK"
  sleep 3
done
```

- [ ] Block number increasing every 3 seconds
- [ ] Blocks produced by all 3 validators (check miner addresses)
- [ ] No errors in logs

### Check Mining Status

```bash
# Check if mining is enabled
docker logs xaheen-rpc 2>&1 | grep -i "mining" | tail -5
```

- [ ] Logs show "Commit new mining work"
- [ ] Logs show block sealing/signing
- [ ] NO "Signed recently" deadlock (occasional is OK, permanent is not)

### Verify RPC Endpoint

```bash
# Test basic RPC calls
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

- [ ] RPC responds successfully
- [ ] Chain ID matches genesis (65001)
- [ ] Block number is increasing

## ✅ POST-DEPLOYMENT TASKS

### Document Deployment

```bash
# Save deployment information
cat > docs/deployment-logs/validator-deployment-$(date +%Y-%m-%d).json <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "chainId": 65001,
  "networkId": 65001,
  "validators": [
    {
      "name": "validator-1",
      "address": "0x$V1_ADDR",
      "port": 30303,
      "rpc": true,
      "enode": "$ENODE1"
    },
    {
      "name": "validator-2",
      "address": "0x$V2_ADDR",
      "port": 30304,
      "rpc": false,
      "enode": "$ENODE2"
    },
    {
      "name": "validator-3",
      "address": "0x$V3_ADDR",
      "port": 30305,
      "rpc": false,
      "enode": "$ENODE3"
    }
  ],
  "genesisHash": "$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["0x0",false],"id":1}' | jq -r '.result.hash')",
  "status": "deployed"
}
EOF
```

- [ ] Deployment documented with timestamp
- [ ] Genesis hash recorded
- [ ] Validator addresses and enodes saved

### Setup Monitoring

```bash
# Create monitoring script
cat > scripts/monitor-validators.sh <<'EOF'
#!/bin/bash
while true; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")
  echo "[$(date +%H:%M:%S)] Block: $BLOCK, Peers: $PEERS"
  sleep 5
done
EOF

chmod +x scripts/monitor-validators.sh
```

- [ ] Monitoring script created
- [ ] Test monitoring script: `./scripts/monitor-validators.sh`

### Setup Health Check Cron Job

```bash
# Add to crontab (optional)
# */5 * * * * /home/user/blockchain-v2/scripts/validator-healthcheck.sh >> /var/log/validator-health.log 2>&1
```

- [ ] Health check script configured (optional)
- [ ] Alerts configured (optional)

## ✅ BACKUP AND SECURITY

### Backup Critical Files

```bash
# Create backup directory
mkdir -p backups/$(date +%Y-%m-%d)

# Backup keystores
cp -r validator-1/keystore backups/$(date +%Y-%m-%d)/validator-1-keystore
cp -r validator-2/keystore backups/$(date +%Y-%m-%d)/validator-2-keystore
cp -r validator-3/keystore backups/$(date +%Y-%m-%d)/validator-3-keystore

# Backup passwords
cp validator-1/password.txt backups/$(date +%Y-%m-%d)/validator-1-password.txt
cp validator-2/password.txt backups/$(date +%Y-%m-%d)/validator-2-password.txt
cp validator-3/password.txt backups/$(date +%Y-%m-%d)/validator-3-password.txt

# Backup genesis
cp data/genesis.json backups/$(date +%Y-%m-%d)/genesis.json

# Backup static-nodes
cp validator-1/static-nodes.json backups/$(date +%Y-%m-%d)/validator-1-static-nodes.json
cp validator-2/static-nodes.json backups/$(date +%Y-%m-%d)/validator-2-static-nodes.json
cp validator-3/static-nodes.json backups/$(date +%Y-%m-%d)/validator-3-static-nodes.json
```

- [ ] All keystores backed up
- [ ] All passwords backed up
- [ ] Genesis backed up
- [ ] Static-nodes backed up
- [ ] Backups stored securely (encrypted if possible)

### Security Checklist

- [ ] Password files have restricted permissions (600)
- [ ] Keystore directories have restricted permissions (700)
- [ ] SSH keys secured (600)
- [ ] Firewall configured correctly
- [ ] RPC/WS only exposed on trusted networks
- [ ] Consider VPN for remote access

## 🚨 TROUBLESHOOTING QUICK LINKS

If issues occur, see:
- **Chain stuck at block 1**: `docs/CHECKLIST-TROUBLESHOOTING-VALIDATORS.md`
- **Genesis issues**: `docs/CHECKLIST-GENESIS-CREATION.md`
- **Parlia deadlock**: `docs/PARLIA-DEADLOCK-FIX-SUMMARY.md`

## 📋 DEPLOYMENT COMPLETE CHECKLIST

- [ ] All 3 validators running
- [ ] All validators have 2 peers
- [ ] Blocks producing every 3 seconds
- [ ] RPC endpoint responding
- [ ] Chain ID correct (65001)
- [ ] Genesis hash recorded
- [ ] Validator addresses documented
- [ ] Keystores and passwords backed up
- [ ] Monitoring script working
- [ ] No errors in logs

---

**Last Updated**: October 31, 2025
**Status**: Production-Ready ✅

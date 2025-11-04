# AWS Deployment - In Progress

**Date**: 2025-01-27  
**Status**: ⚠️ Manual Steps Required

---

## ✅ Completed Steps

1. ✅ Genesis file validated
2. ✅ Genesis file copied to AWS server (`/tmp/genesis.json`)
3. ✅ Validators stopped (none were running)
4. ⚠️ Backup attempted (permission issues - manual backup needed)

---

## ⚠️ Manual Steps Required

The automated deployment script requires manual intervention. Please follow these steps:

### Step 1: SSH to AWS Server

```bash
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187
```

### Step 2: Backup Existing Data (Manual)

```bash
# Create backup directory with proper permissions
sudo mkdir -p /backup
sudo chown ec2-user:ec2-user /backup

# Backup validator data
sudo cp -r /data/validator-1 /backup/validator-1-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
sudo cp -r /data/validator-2 /backup/validator-2-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
sudo cp -r /data/validator-3 /backup/validator-3-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

echo "✅ Backup completed"
```

### Step 3: Remove Old Blockchain Data

⚠️ **WARNING**: This will DELETE the old blockchain data. Make sure backup is complete!

```bash
# Remove old geth data directories
sudo rm -rf /data/validator-1/geth
sudo rm -rf /data/validator-2/geth
sudo rm -rf /data/validator-3/geth

echo "✅ Old data removed"
```

### Step 4: Initialize Validators with New Genesis

```bash
GENESIS_FILE="/tmp/genesis.json"

# Initialize validator 1
echo "Initializing validator-1..."
sudo geth --datadir /data/validator-1 init "$GENESIS_FILE"

# Initialize validator 2
echo "Initializing validator-2..."
sudo geth --datadir /data/validator-2 init "$GENESIS_FILE"

# Initialize validator 3
echo "Initializing validator-3..."
sudo geth --datadir /data/validator-3 init "$GENESIS_FILE"

echo "✅ All validators initialized"
```

### Step 5: Start Validators

```bash
# Start validator 1 first
echo "Starting validator-1..."
if command -v docker &> /dev/null; then
    sudo docker start bsc-validator-1
else
    sudo systemctl start geth-validator-1
fi

sleep 10

# Start validator 2
echo "Starting validator-2..."
if command -v docker &> /dev/null; then
    sudo docker start bsc-validator-2
else
    sudo systemctl start geth-validator-2
fi

sleep 10

# Start validator 3
echo "Starting validator-3..."
if command -v docker &> /dev/null; then
    sudo docker start bsc-validator-3
else
    sudo systemctl start geth-validator-3
fi

echo "✅ All validators started"
```

### Step 6: Verify Deployment

Wait 30 seconds for validators to start, then verify:

```bash
# Check chain ID
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Expected: {"result":"0xfde9"} (65001)

# Check block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check BTCBR contract
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}'

# Check DEX Factory
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F266","latest"],"id":1}'
```

---

## Quick Deployment Script (Copy-Paste)

```bash
#!/bin/bash
set -e

# Configuration
GENESIS_FILE="/tmp/genesis.json"
BACKUP_DIR="/backup/blockchain-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Starting deployment..."

# Step 1: Backup
echo "📦 Step 1: Backing up existing data..."
sudo mkdir -p /backup
sudo cp -r /data/validator-1 "$BACKUP_DIR/validator-1" 2>/dev/null || true
sudo cp -r /data/validator-2 "$BACKUP_DIR/validator-2" 2>/dev/null || true
sudo cp -r /data/validator-3 "$BACKUP_DIR/validator-3" 2>/dev/null || true
echo "✅ Backup created at: $BACKUP_DIR"

# Step 2: Stop validators
echo "🛑 Step 2: Stopping validators..."
sudo docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
sudo systemctl stop geth-validator-1 geth-validator-2 geth-validator-3 2>/dev/null || true
sleep 5

# Step 3: Remove old data
echo "🗑️  Step 3: Removing old blockchain data..."
sudo rm -rf /data/validator-1/geth
sudo rm -rf /data/validator-2/geth
sudo rm -rf /data/validator-3/geth

# Step 4: Initialize
echo "🔧 Step 4: Initializing validators..."
sudo geth --datadir /data/validator-1 init "$GENESIS_FILE"
sudo geth --datadir /data/validator-2 init "$GENESIS_FILE"
sudo geth --datadir /data/validator-3 init "$GENESIS_FILE"
echo "✅ Validators initialized"

# Step 5: Start validators
echo "🚀 Step 5: Starting validators..."
sudo docker start bsc-validator-1 && sleep 10
sudo docker start bsc-validator-2 && sleep 10
sudo docker start bsc-validator-3

echo "✅ Deployment complete!"
echo ""
echo "Wait 30 seconds, then verify:"
echo "  curl -X POST http://localhost:8545 -H 'Content-Type: application/json' --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}'"
```

---

## Verification Checklist

After deployment, verify:

- [ ] Chain ID = 65001
- [ ] Blocks producing (every 3 seconds)
- [ ] BTCBR contract accessible
- [ ] DEX Factory contract accessible
- [ ] All 3 validators running
- [ ] RPC endpoint responding: `http://3.91.50.187:8545`

---

## Current Status

- ✅ Genesis file on AWS server: `/tmp/genesis.json`
- ⚠️ Manual deployment steps required (permissions/confirmation)
- 📋 Follow steps above to complete deployment

---

**Next Action**: SSH to AWS server and execute manual deployment steps or use the quick deployment script above.


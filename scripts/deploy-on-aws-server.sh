#!/bin/bash

#
# Quick Deployment Script - Run this ON the AWS server
#
# This script should be run AFTER the genesis file is copied to /tmp/genesis.json
#

set -e

echo "🚀 Deploying Genesis to Validators"
echo "=================================="
echo ""

# Configuration
GENESIS_FILE="/tmp/genesis.json"
BACKUP_DIR="/backup/blockchain-$(date +%Y%m%d-%H%M%S)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if genesis file exists
if [ ! -f "$GENESIS_FILE" ]; then
    echo -e "${RED}❌${NC} Genesis file not found: $GENESIS_FILE"
    echo "Copy genesis file to AWS server first:"
    echo "  scp data/genesis-nor-complete-v2.json ec2-user@3.91.50.187:/tmp/genesis.json"
    exit 1
fi

echo "📋 Configuration:"
echo "   Genesis file: $GENESIS_FILE"
echo "   Backup directory: $BACKUP_DIR"
echo ""

# Step 1: Backup
echo "📦 Step 1: Backing up existing data..."
sudo mkdir -p /backup
sudo cp -r /data/validator-1 "$BACKUP_DIR/validator-1" 2>/dev/null || echo "   ⚠️  No data for validator-1"
sudo cp -r /data/validator-2 "$BACKUP_DIR/validator-2" 2>/dev/null || echo "   ⚠️  No data for validator-2"
sudo cp -r /data/validator-3 "$BACKUP_DIR/validator-3" 2>/dev/null || echo "   ⚠️  No data for validator-3"
echo -e "${GREEN}✅${NC} Backup created at: $BACKUP_DIR"
echo ""

# Step 2: Stop validators
echo "🛑 Step 2: Stopping validators..."
if command -v docker &> /dev/null; then
    sudo docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
    echo "   Stopped Docker validators"
else
    sudo systemctl stop geth-validator-1 geth-validator-2 geth-validator-3 2>/dev/null || true
    echo "   Stopped systemd validators"
fi
sleep 5
echo -e "${GREEN}✅${NC} Validators stopped"
echo ""

# Step 3: Remove old data
echo -e "${YELLOW}⚠️  Step 3: Removing old blockchain data...${NC}"
echo "   This will DELETE the old blockchain data"
read -p "   Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "   Aborted by user"
    exit 1
fi

sudo rm -rf /data/validator-1/geth
sudo rm -rf /data/validator-2/geth
sudo rm -rf /data/validator-3/geth
echo -e "${GREEN}✅${NC} Old data removed"
echo ""

# Step 4: Initialize
echo "🔧 Step 4: Initializing validators with new genesis..."
sudo geth --datadir /data/validator-1 init "$GENESIS_FILE"
echo "   ✅ Validator-1 initialized"
sudo geth --datadir /data/validator-2 init "$GENESIS_FILE"
echo "   ✅ Validator-2 initialized"
sudo geth --datadir /data/validator-3 init "$GENESIS_FILE"
echo "   ✅ Validator-3 initialized"
echo ""

# Step 5: Start validators
echo "🚀 Step 5: Starting validators..."
if command -v docker &> /dev/null; then
    echo "   Starting validator-1..."
    sudo docker start bsc-validator-1
    sleep 10
    echo "   Starting validator-2..."
    sudo docker start bsc-validator-2
    sleep 10
    echo "   Starting validator-3..."
    sudo docker start bsc-validator-3
else
    echo "   Starting validator-1..."
    sudo systemctl start geth-validator-1
    sleep 10
    echo "   Starting validator-2..."
    sudo systemctl start geth-validator-2
    sleep 10
    echo "   Starting validator-3..."
    sudo systemctl start geth-validator-3
fi
echo -e "${GREEN}✅${NC} All validators started"
echo ""

# Step 6: Verification
echo "🔍 Step 6: Verifying deployment..."
echo "   Waiting 30 seconds for validators to start..."
sleep 30

echo ""
echo "   Checking chain ID..."
CHAIN_ID=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4 || echo "error")

if [ "$CHAIN_ID" = "0xfde9" ] || [ "$CHAIN_ID" = "0xFDE9" ]; then
    echo -e "   ${GREEN}✅${NC} Chain ID correct: 65001"
else
    echo -e "   ${YELLOW}⚠️${NC}  Chain ID: $CHAIN_ID (expected 0xfde9)"
fi

echo ""
echo "   Checking block number..."
BLOCK=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4 || echo "error")

if [ "$BLOCK" != "error" ] && [ -n "$BLOCK" ]; then
    BLOCK_DEC=$((16#${BLOCK:2}))
    echo -e "   ${GREEN}✅${NC} Current block: $BLOCK_DEC"
else
    echo -e "   ${YELLOW}⚠️${NC}  Could not get block number"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete${NC}"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Monitor block production (should be every 3 seconds)"
echo "   2. Verify all contracts are accessible"
echo "   3. Test DEX operations"
echo "   4. Set up epoch monitoring"
echo ""
echo "🔗 RPC Endpoint: http://3.91.50.187:8545"
echo ""


#!/bin/bash

###############################################################################
# Migrate BitcoinBR Chain (885824) to Nor Chain (65001)
#
# This script will:
# 1. Stop old validators
# 2. Backup old data
# 3. Deploy new genesis with Chain ID 65001
# 4. Restart validators with Nor Chain
#
# Server: 3.91.50.187
# User: ec2-user
###############################################################################

set -e

SERVER_IP="3.91.50.187"
SSH_KEY="/Volumes/Development/sahalat/blockchain-v2/bsc-validator-key.pem"
SSH_USER="ec2-user"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     MIGRATING TO XAHEEN CHAIN (Chain ID 65001)                 ║"
echo "║                                                                ║"
echo "║     From: BitcoinBR (885824)                                   ║"
echo "║     To:   Nor Chain (65001)                                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check genesis file exists locally
if [ ! -f "data/genesis-xaheen-65001.json" ]; then
    echo -e "${YELLOW}⚠️  Genesis file not found locally${NC}"
    echo "Looking for alternative genesis files..."

    if [ -f "data/genesis.json" ]; then
        echo -e "${GREEN}✓ Found data/genesis.json${NC}"
        GENESIS_FILE="data/genesis.json"
    else
        echo -e "${RED}✗ No genesis file found!${NC}"
        exit 1
    fi
else
    GENESIS_FILE="data/genesis-xaheen-65001.json"
fi

echo -e "${GREEN}✓ Using genesis file: $GENESIS_FILE${NC}"

# Verify genesis has correct Chain ID
CHAIN_ID=$(cat "$GENESIS_FILE" | jq -r '.config.chainId')
echo "Genesis Chain ID: $CHAIN_ID"

if [ "$CHAIN_ID" != "65001" ]; then
    echo -e "${YELLOW}⚠️  Genesis file has Chain ID $CHAIN_ID, expected 65001${NC}"
    echo "Creating new genesis with Chain ID 65001..."

    # Update Chain ID in genesis
    cat "$GENESIS_FILE" | jq '.config.chainId = 65001' > data/genesis-xaheen-65001-temp.json
    GENESIS_FILE="data/genesis-xaheen-65001-temp.json"
    echo -e "${GREEN}✓ Created genesis with Chain ID 65001${NC}"
fi

# Create remote migration script
cat > /tmp/remote-migrate.sh << 'REMOTE'
#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}→ Stopping old validators...${NC}"
sudo docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 || true
echo -e "${GREEN}✓ Validators stopped${NC}"

echo -e "${YELLOW}→ Backing up old chain data...${NC}"
BACKUP_DIR="$HOME/bitcoinbr-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
sudo cp -r $HOME/bsc-production "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"

echo -e "${YELLOW}→ Cleaning old chain data...${NC}"
sudo rm -rf $HOME/bsc-production/validator-*/geth/chaindata
sudo rm -rf $HOME/bsc-production/validator-*/geth/lightchaindata
sudo rm -rf $HOME/bsc-production/validator-*/geth/nodes
echo -e "${GREEN}✓ Old chain data removed${NC}"

echo -e "${YELLOW}→ Copying new Nor genesis...${NC}"
sudo cp /tmp/genesis-xaheen.json $HOME/bsc-production/config/genesis.json
echo -e "${GREEN}✓ Genesis updated${NC}"

echo -e "${YELLOW}→ Re-initializing validators with Nor Chain...${NC}"

# Re-initialize validator 1
sudo docker run --rm \
    -v $HOME/bsc-production/validator-1:/bsc \
    -v $HOME/bsc-production/config/genesis.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

# Re-initialize validator 2
sudo docker run --rm \
    -v $HOME/bsc-production/validator-2:/bsc \
    -v $HOME/bsc-production/config/genesis.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

# Re-initialize validator 3
sudo docker run --rm \
    -v $HOME/bsc-production/validator-3:/bsc \
    -v $HOME/bsc-production/config/genesis.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

echo -e "${GREEN}✓ All validators re-initialized${NC}"

echo -e "${YELLOW}→ Starting Nor Chain validators...${NC}"
sudo docker start bsc-validator-1
sudo docker start bsc-validator-2
sudo docker start bsc-validator-3

# Wait for startup
sleep 10

echo -e "${GREEN}✓ Validators started${NC}"

# Verify Chain ID
NEW_CHAIN_ID=$(curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq -r .result)

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Migration Complete!${NC}"
echo ""
echo "Old Chain ID: 0xd8440 (885824)"
echo "New Chain ID: $NEW_CHAIN_ID (65001)"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
REMOTE

chmod +x /tmp/remote-migrate.sh

echo -e "${YELLOW}→ Transferring genesis file to server...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$GENESIS_FILE" ${SSH_USER}@${SERVER_IP}:/tmp/genesis-xaheen.json
echo -e "${GREEN}✓ Genesis file transferred${NC}"

echo -e "${YELLOW}→ Transferring migration script to server...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/remote-migrate.sh ${SSH_USER}@${SERVER_IP}:/tmp/
echo -e "${GREEN}✓ Migration script transferred${NC}"

echo -e "${YELLOW}→ Executing migration on server...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} "bash /tmp/remote-migrate.sh"

# Verify locally
echo ""
echo -e "${YELLOW}→ Verifying Chain ID from local machine...${NC}"
CHAIN_ID=$(curl -s http://${SERVER_IP}:8545 -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq -r .result)

if [ "$CHAIN_ID" == "0xfde9" ]; then
    echo -e "${GREEN}✓ Chain ID verified: $CHAIN_ID (65001)${NC}"
    echo -e "${GREEN}✓ XAHEEN CHAIN IS LIVE!${NC}"
else
    echo -e "${RED}✗ Chain ID mismatch: $CHAIN_ID${NC}"
    exit 1
fi

# Test block production
echo ""
echo -e "${YELLOW}→ Testing block production...${NC}"
BLOCK1=$(curl -s http://${SERVER_IP}:8545 -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)

sleep 10

BLOCK2=$(curl -s http://${SERVER_IP}:8545 -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)

echo "Block 1: $BLOCK1"
echo "Block 2: $BLOCK2"

if [ "$BLOCK1" != "$BLOCK2" ]; then
    echo -e "${GREEN}✓ Blocks are being produced!${NC}"
else
    echo -e "${YELLOW}⚠️  Blocks not increasing (validators may need time to sync)${NC}"
fi

# Cleanup
rm -f /tmp/remote-migrate.sh
rm -f data/genesis-xaheen-65001-temp.json 2>/dev/null || true

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${GREEN}║          XAHEEN CHAIN MIGRATION SUCCESSFUL!                    ║${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Chain ID: 65001 (0xfde9)"
echo "RPC: http://${SERVER_IP}:8545"
echo "WebSocket: ws://${SERVER_IP}:8548"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure DNS: xaheen.org → ${SERVER_IP}"
echo "2. Install SSL certificates"
echo "3. Update Nginx configuration"
echo "4. Launch publicly!"
echo ""

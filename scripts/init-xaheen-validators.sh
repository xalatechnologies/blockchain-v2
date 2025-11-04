#!/bin/bash

##############################################################################
# Nor Chain Validator Initialization Script
##############################################################################
#
# This script initializes Nor Chain validators with the new Chain ID 65001
#
# Usage:
#   ./scripts/init-xaheen-validators.sh
#
# Prerequisites:
#   - Docker installed
#   - Genesis file at data/genesis-xaheen-65001.json
#   - Validator keystores in validator-*/keystore/
#   - Password files in validator-*/password.txt
#
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GENESIS_FILE="data/genesis-xaheen-65001.json"
CHAIN_ID=65001
NETWORK_ID=65001

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           Nor Chain Validator Initialization           ║"
echo "║                                                            ║"
echo "║  Chain ID: 65001 | Network ID: 65001 | Native Token: NOR  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

##############################################################################
# Step 1: Verify Prerequisites
##############################################################################

echo -e "${YELLOW}[Step 1/8] Verifying prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if genesis file exists
if [ ! -f "$GENESIS_FILE" ]; then
    echo -e "${RED}Error: Genesis file not found at $GENESIS_FILE${NC}"
    echo "Please ensure the genesis file exists with Chain ID 65001"
    exit 1
fi
echo -e "${GREEN}✓ Genesis file found${NC}"

# Verify Chain ID in genesis
GENESIS_CHAIN_ID=$(grep -o '"chainId": [0-9]*' "$GENESIS_FILE" | grep -o '[0-9]*')
if [ "$GENESIS_CHAIN_ID" != "$CHAIN_ID" ]; then
    echo -e "${RED}Error: Genesis file has Chain ID $GENESIS_CHAIN_ID, expected $CHAIN_ID${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Genesis Chain ID verified: $CHAIN_ID${NC}"

##############################################################################
# Step 2: Stop Existing Validators
##############################################################################

echo -e "${YELLOW}[Step 2/8] Stopping existing validators...${NC}"

docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo -e "${GREEN}✓ Stopped and removed existing validator containers${NC}"

##############################################################################
# Step 3: Backup Old Chain Data (if exists)
##############################################################################

echo -e "${YELLOW}[Step 3/8] Backing up old chain data...${NC}"

if [ -d "validator-1/geth" ] || [ -d "validator-2/geth" ] || [ -d "validator-3/geth" ]; then
    BACKUP_DIR="backups/chain-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    [ -d "validator-1/geth" ] && cp -r validator-1/geth "$BACKUP_DIR/validator-1-geth" && echo -e "${GREEN}✓ Backed up validator-1 data${NC}"
    [ -d "validator-2/geth" ] && cp -r validator-2/geth "$BACKUP_DIR/validator-2-geth" && echo -e "${GREEN}✓ Backed up validator-2 data${NC}"
    [ -d "validator-3/geth" ] && cp -r validator-3/geth "$BACKUP_DIR/validator-3-geth" && echo -e "${GREEN}✓ Backed up validator-3 data${NC}"

    echo -e "${GREEN}✓ Backup saved to $BACKUP_DIR${NC}"
else
    echo -e "${BLUE}→ No existing chain data to backup${NC}"
fi

##############################################################################
# Step 4: Delete Old Blockchain Data
##############################################################################

echo -e "${YELLOW}[Step 4/8] Removing old blockchain data...${NC}"

rm -rf validator-1/geth validator-2/geth validator-3/geth
rm -f validator-1/static-nodes.json validator-2/static-nodes.json validator-3/static-nodes.json

echo -e "${GREEN}✓ Old blockchain data removed${NC}"

##############################################################################
# Step 5: Initialize Validators with New Genesis
##############################################################################

echo -e "${YELLOW}[Step 5/8] Initializing validators with Nor Chain genesis...${NC}"

# Initialize Validator 1
echo "Initializing validator-1..."
docker run --rm \
  -v "$(pwd)/validator-1:/bsc" \
  -v "$(pwd)/$GENESIS_FILE:/genesis.json" \
  dysnix/bsc init --datadir /bsc /genesis.json
echo -e "${GREEN}✓ Validator 1 initialized${NC}"

# Initialize Validator 2
echo "Initializing validator-2..."
docker run --rm \
  -v "$(pwd)/validator-2:/bsc" \
  -v "$(pwd)/$GENESIS_FILE:/genesis.json" \
  dysnix/bsc init --datadir /bsc /genesis.json
echo -e "${GREEN}✓ Validator 2 initialized${NC}"

# Initialize Validator 3
echo "Initializing validator-3..."
docker run --rm \
  -v "$(pwd)/validator-3:/bsc" \
  -v "$(pwd)/$GENESIS_FILE:/genesis.json" \
  dysnix/bsc init --datadir /bsc /genesis.json
echo -e "${GREEN}✓ Validator 3 initialized${NC}"

##############################################################################
# Step 6: Verify Initialization
##############################################################################

echo -e "${YELLOW}[Step 6/8] Verifying initialization...${NC}"

if [ -d "validator-1/geth/chaindata" ] && [ -d "validator-2/geth/chaindata" ] && [ -d "validator-3/geth/chaindata" ]; then
    echo -e "${GREEN}✓ All validators initialized successfully${NC}"
else
    echo -e "${RED}Error: Validator initialization incomplete${NC}"
    exit 1
fi

##############################################################################
# Step 7: Display Next Steps
##############################################################################

echo -e "${YELLOW}[Step 7/8] Initialization complete!${NC}"
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Next Steps                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}1. Start validators:${NC}"
echo "   ./scripts/setup-production-multi-validator.sh"
echo ""
echo -e "${GREEN}2. Verify validators are running:${NC}"
echo "   docker ps | grep bsc-validator"
echo ""
echo -e "${GREEN}3. Check block production:${NC}"
echo "   curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo -e "${GREEN}4. Verify Chain ID:${NC}"
echo "   curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}'"
echo "   ${BLUE}Expected result: 0xFDE9 (65001 in hex)${NC}"
echo ""
echo -e "${GREEN}5. Check peer connections:${NC}"
echo "   curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}'"
echo "   ${BLUE}Expected result: 0x2 (2 peers)${NC}"
echo ""

##############################################################################
# Step 8: Summary
##############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Initialization Summary                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Chain ID:${NC}       $CHAIN_ID (Nor Chain)"
echo -e "${GREEN}✓ Network ID:${NC}     $NETWORK_ID"
echo -e "${GREEN}✓ Native Token:${NC}   NOR (Nor Token)"
echo -e "${GREEN}✓ Block Time:${NC}     3 seconds"
echo -e "${GREEN}✓ Validators:${NC}     3 validators initialized"
echo -e "${GREEN}✓ Genesis File:${NC}   $GENESIS_FILE"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}║  Nor Chain - Where Intelligence Meets Blockchain  🧠⚡ ║${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}For documentation, visit: docs/README.md${NC}"
echo -e "${YELLOW}For migration guide, see: docs/migration/CHAIN_ID_MIGRATION.md${NC}"
echo ""

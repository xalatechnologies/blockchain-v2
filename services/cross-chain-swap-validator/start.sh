#!/bin/bash

# Cross-Chain Swap Validator - Startup Script

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cross-Chain Swap Validator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Check if .env exists
if [ ! -f "../../.env" ]; then
    echo -e "${RED}❌ ERROR: .env file not found in project root${NC}"
    echo -e "${YELLOW}   Please create .env with required variables:${NC}"
    echo ""
    echo "   MAIN_WALLET_PRIVATE_KEY=..."
    echo "   BSC_MAINNET_RPC=https://bsc-dataseed.binance.org"
    echo "   PRIVATE_CHAIN_RPC=https://rpc.norchain.org"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Configuration found${NC}"
echo ""

# Check validator balance on BSC
echo -e "${BLUE}Checking balances...${NC}"
echo ""

# Start the service
echo -e "${GREEN}Starting validator service...${NC}"
echo ""

# Run with node
node index.js

# If node exits, show message
echo ""
echo -e "${YELLOW}Service stopped${NC}"

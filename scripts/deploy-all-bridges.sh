#!/bin/bash
#
# Complete Bridge Deployment Script
# Deploys both mainnet and private bridges
#
# Usage:
#   export MAINNET_PRIVATE_KEY="0x..."
#   export PRIVATE_CHAIN_KEY="0x..."
#   ./scripts/deploy-all-bridges.sh
#

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║      🌉 DAY 2: COMPLETE BRIDGE DEPLOYMENT SCRIPT 🌉         ║"
echo "║                                                              ║"
echo "║          BSC Mainnet ↔ BTCBR Private Chain                  ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check environment variables
if [ -z "$MAINNET_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: MAINNET_PRIVATE_KEY not set${NC}"
    echo "Export your BSC mainnet deployer private key:"
    echo "  export MAINNET_PRIVATE_KEY=\"0x...\""
    exit 1
fi

if [ -z "$PRIVATE_CHAIN_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_CHAIN_KEY not set${NC}"
    echo "Export your private chain deployer key:"
    echo "  export PRIVATE_CHAIN_KEY=\"0x...\""
    echo ""
    echo "Or use your main wallet key:"
    echo "  export PRIVATE_CHAIN_KEY=\"\$MAIN_WALLET_PRIVATE_KEY\""
    exit 1
fi

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: COMPILE CONTRACTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

npx hardhat compile

echo -e "\n${GREEN}✅ Contracts compiled successfully!${NC}\n"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: DEPLOY MAINNET BRIDGE (BSC Mainnet)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}⚠️  This will deploy to BSC MAINNET${NC}"
echo -e "${YELLOW}⚠️  Estimated cost: ~\$5-10 in gas fees${NC}\n"

read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

npx hardhat run scripts/hardhat-deploy-mainnet.js --network bsc

echo -e "\n${GREEN}✅ Mainnet bridge deployed!${NC}\n"

# Extract mainnet bridge address from deployment file
MAINNET_BRIDGE=$(node -e "
const fs = require('fs');
const deployment = JSON.parse(fs.readFileSync('deployments/mainnet-bridge.json'));
console.log(deployment.bridgeAddress);
")

export MAINNET_BRIDGE_ADDRESS=$MAINNET_BRIDGE

echo -e "${GREEN}📍 Mainnet Bridge Address: $MAINNET_BRIDGE${NC}\n"

sleep 2

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: DEPLOY PRIVATE BRIDGE (BTCBR Chain)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

npx hardhat run scripts/hardhat-deploy-private.js --network btcbr

echo -e "\n${GREEN}✅ Private bridge deployed!${NC}\n"

# Extract private bridge address
PRIVATE_BRIDGE=$(node -e "
const fs = require('fs');
const deployment = JSON.parse(fs.readFileSync('deployments/private-bridge.json'));
console.log(deployment.bridgeAddress);
")

echo -e "${GREEN}📍 Private Bridge Address: $PRIVATE_BRIDGE${NC}\n"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}✅ Both bridges deployed successfully!${NC}\n"

echo "Bridge Addresses:"
echo "  Mainnet (BSC):    $MAINNET_BRIDGE"
echo "  Private (BTCBR):  $PRIVATE_BRIDGE"
echo ""

echo "Deployment Files:"
echo "  deployments/mainnet-bridge.json"
echo "  deployments/private-bridge.json"
echo ""

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. ✅ Bridges deployed"
echo "2. ⏳ Setup Gnosis Safe multisig"
echo "3. ⏳ Link bridges bidirectionally"
echo "4. ⏳ Transfer ownership to multisig"
echo "5. ⏳ Fund mainnet vault (2M BTCBR)"
echo "6. ⏳ Test bridge transfer"
echo ""

echo "To verify on BSCScan:"
echo "  npx hardhat verify --network bsc $MAINNET_BRIDGE \"0x0cF8e180350253271f4b917CcFb0aCCc4862F262\" 2"
echo ""

echo -e "${GREEN}🎉 Day 2 Bridge Deployment Complete!${NC}\n"

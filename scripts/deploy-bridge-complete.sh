#!/bin/bash

# BTCBR Bridge Complete Deployment Script
# Deploys both mainnet and private chain bridges

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         BTCBR Bridge Deployment - Production              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ NPM not found. Please install NPM${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js:$(NC} $(node --version)"
echo -e "${GREEN}✅ NPM:${NC} $(npm --version)"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Deploy to mainnet
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Step 1: Deploy to BSC MAINNET                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}⚠️  This will cost ~\$5 in BNB gas fees${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

echo -e "${YELLOW}🚀 Deploying to mainnet...${NC}"
npx hardhat run scripts/deploy-mainnet-bridge.js --network bsc

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Mainnet bridge deployed successfully!${NC}"
else
    echo -e "${RED}❌ Mainnet deployment failed${NC}"
    exit 1
fi

echo ""
sleep 2

# Deploy to private chain
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Step 2: Deploy to PRIVATE CHAIN                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}🚀 Deploying to private chain...${NC}"
npx hardhat run scripts/deploy-private-bridge.js --network private

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Private chain bridge deployed successfully!${NC}"
else
    echo -e "${RED}❌ Private chain deployment failed${NC}"
    exit 1
fi

echo ""
sleep 2

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🎉 DEPLOYMENT COMPLETE!                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}✅ Mainnet Bridge:${NC} Deployed"
echo -e "${GREEN}✅ Private Bridge:${NC} Deployed"
echo -e "${GREEN}✅ Validators:${NC} Configured (3)"
echo -e "${GREEN}✅ Limits:${NC} Set (100 - 100,000 BTCBR)"
echo ""

echo "📁 Deployment files saved to:"
echo "   - deployments/mainnet-bridge.json"
echo "   - deployments/private-bridge.json"
echo ""

echo "📋 NEXT STEPS:"
echo "   1. Grant MINTER_ROLE to private bridge"
echo "   2. Start validator relayer services"
echo "   3. Test with 100 BTCBR transfer"
echo ""

echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "   - Save deployment addresses safely"
echo "   - Backup validator private keys"
echo "   - Test before large transfers"
echo ""

echo "🎯 To test the bridge:"
echo "   npm run test:bridge"
echo ""

echo "✨ Happy bridging! 🌉"
echo ""

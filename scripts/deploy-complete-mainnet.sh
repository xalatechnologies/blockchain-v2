#!/bin/bash

#
# Complete Mainnet Deployment Script
#
# This script orchestrates the full deployment of the cross-chain DEX:
# 1. Deploy hub contracts to Nor Chain
# 2. Deploy spoke contracts to BSC Mainnet
# 3. Allocate BTCBR liquidity
# 4. Generate configuration for xaheen-sdk API
#
# Usage: ./scripts/deploy-complete-mainnet.sh
#

set -e  # Exit on error

echo ""
echo "═══════════════════════════════════════════════════════"
echo "        XAHEEN CROSS-CHAIN DEX MAINNET DEPLOYMENT"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

# Check for .env file
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "   Create .env with required variables (see .env.example)"
  exit 1
fi

# Check for required env vars
source .env

if [ -z "$MAINNET_PRIVATE_KEY" ]; then
  echo "❌ MAINNET_PRIVATE_KEY not set in .env"
  exit 1
fi

if [ -z "$XAHEEN_CHAIN_RPC" ]; then
  echo "❌ XAHEEN_CHAIN_RPC not set in .env"
  exit 1
fi

if [ -z "$BSC_MAINNET_RPC" ]; then
  echo "❌ BSC_MAINNET_RPC not set in .env"
  exit 1
fi

echo "✅ Prerequisites verified"
echo ""

# Confirm deployment
echo "⚠️  WARNING: This will deploy to MAINNET with REAL funds!"
echo ""
echo "   Deployer: $MAIN_WALLET"
echo "   Hub chain: Nor Chain (65001)"
echo "   Spoke chain: BSC Mainnet (56)"
echo ""
echo "   Estimated costs:"
echo "   - Hub deployment: ~0.05 NOR"
echo "   - Spoke deployment: ~0.01 BNB (~$6)"
echo "   - Total: ~$6-10"
echo ""

read -p "Continue with deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Deployment cancelled."
  exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1/4: DEPLOYING HUB CONTRACTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx hardhat run scripts/deploy-hub-mainnet.cjs --network btcbr

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Hub deployment failed!"
  exit 1
fi

echo ""
echo "✅ Hub contracts deployed successfully"
echo ""

# Wait a bit for blockchain to settle
sleep 3

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2/4: DEPLOYING SPOKE CONTRACTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx hardhat run scripts/deploy-spoke-mainnet.cjs --network bsc

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Spoke deployment failed!"
  echo "   Hub contracts were deployed. See deployment-mainnet.json for addresses."
  exit 1
fi

echo ""
echo "✅ Spoke contracts deployed successfully"
echo ""

# Wait a bit for blockchain to settle
sleep 3

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3/4: INITIALIZING INVENTORY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node scripts/initialize-inventory-mainnet.cjs

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Inventory initialization failed!"
  echo "   Contracts were deployed. See deployment-mainnet.json for addresses."
  exit 1
fi

echo ""
echo "✅ Inventory initialized successfully"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4/4: GENERATING API CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node scripts/generate-api-config.cjs

echo ""
echo "✅ API configuration generated"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "         DEPLOYMENT COMPLETE ✅"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📄 Deployment details: deployment-mainnet.json"
echo "📄 API configuration: api-config.env"
echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1. Copy API configuration to xaheen-sdk:"
echo "   cat api-config.env >> /Volumes/Development/sahalat/private\\ server/xaheen-sdk/apps/api/.env"
echo ""
echo "2. Run database migration in xaheen-sdk:"
echo "   cd /Volumes/Development/sahalat/private\\ server/xaheen-sdk/apps/api"
echo "   npm run db:generate && npm run db:migrate"
echo ""
echo "3. Start relayer service:"
echo "   npm run dev"
echo ""
echo "4. Execute test transfer to verify everything works"
echo ""
echo "5. (Optional) Allocate BTCBR liquidity:"
echo "   node scripts/allocate-btcbr-liquidity.cjs"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

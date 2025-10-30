#!/bin/bash
#
# Deploy Bridges Using Existing .env Configuration
#

set -e

source .env

# Use existing keys from .env
export MAINNET_PRIVATE_KEY=$MAIN_WALLET_PRIVATE_KEY
export PRIVATE_CHAIN_KEY=$MAIN_WALLET_PRIVATE_KEY

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║       🌉 DEPLOYING BRIDGES TO BSC & BTCBR 🌉                ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "📍 Using wallet: 0xdD779a290C937144F80Eb75b75d814c834536B1b"
echo "🌐 BSC Mainnet RPC: $BSC_MAINNET_RPC"
echo "🔑 BSCScan API: ${BSCSCAN_API_KEY:0:10}..."
echo ""

# Deploy mainnet bridge
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: DEPLOYING TO BSC MAINNET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx hardhat run scripts/hardhat-deploy-mainnet.js --network bsc

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: DEPLOYING TO BTCBR PRIVATE CHAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx hardhat run scripts/hardhat-deploy-private.js --network btcbr

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║              ✅ BRIDGE DEPLOYMENT COMPLETE! ✅               ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "📁 Deployment files saved:"
echo "   - deployments/mainnet-bridge.json"
echo "   - deployments/private-bridge.json"
echo ""

echo "📋 Next steps:"
echo "   1. Review deployment files"
echo "   2. Setup Gnosis Safe multisig"
echo "   3. Transfer bridge ownership"
echo "   4. Fund vault with 2M BTCBR"
echo ""

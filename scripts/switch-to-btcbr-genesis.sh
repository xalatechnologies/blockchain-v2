#!/bin/bash

echo "🔄 Switching to BTCBR Genesis Configuration"
echo "=========================================="

# Copy the BTCBR genesis as the active genesis
cp data/genesis-btcbr-fixed.json data/genesis-active.json

echo "✅ Genesis file switched to genesis-btcbr-fixed.json"
echo ""
echo "📋 BTCBR Contract Details:"
echo "   Address: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo "   Initial Supply: 21,000 BTCBR (24 decimals)"
echo ""
echo "⚠️  IMPORTANT: You need to reinitialize your validators with this genesis:"
echo ""
echo "   For AWS/Production:"
echo "   1. Stop all validators"
echo "   2. Clear blockchain data: rm -rf validator-*/geth"
echo "   3. Reinitialize: geth init --datadir validator-1 data/genesis-active.json"
echo "   4. Restart validators"
echo ""
echo "   For Local Docker:"
echo "   1. docker stop xaheen-rpc bsc-validator-2 bsc-validator-3"
echo "   2. docker rm xaheen-rpc bsc-validator-2 bsc-validator-3"
echo "   3. rm -rf validator-*/geth"
echo "   4. Reinitialize and restart"

# Show the BTCBR allocation
echo ""
echo "📊 Checking BTCBR in genesis..."
cat data/genesis-active.json | jq '.alloc["0x0cF8e180350253271f4b917CcFb0aCCc4862F262"]' | head -20

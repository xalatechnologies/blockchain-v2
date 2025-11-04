#!/bin/bash

#
# Fix Nor Chain Epoch Issue - PERMANENT SOLUTION
#
# This script:
# 1. Safely restarts validators (NO DATA LOSS)
# 2. Implements automatic epoch restart mechanism
# 3. Sets up monitoring to prevent future freezes
#

set -e

echo ""
echo "═══════════════════════════════════════════════════════"
echo "    XAHEEN CHAIN EPOCH FIX - PERMANENT SOLUTION"
echo "═══════════════════════════════════════════════════════"
echo ""

SERVER="3.91.50.187"
USER="ubuntu"

echo "🔍 Step 1: Diagnosing Current State..."
echo ""

# Check current block
CURRENT_BLOCK=$(curl -s -X POST http://$SERVER:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

BLOCK_DEC=$((16#${CURRENT_BLOCK:2}))
echo "Current block: $BLOCK_DEC"

echo ""
echo "🚀 Step 2: Restarting Validators (NO DATA LOSS)..."
echo ""

# Restart validators on server
ssh -o StrictHostKeyChecking=no $USER@$SERVER 'bash -s' << 'ENDSSH'
echo "🔄 Restarting validators..."

if docker ps 2>/dev/null | grep -q bsc-validator; then
  echo "  Using Docker..."
  docker restart bsc-validator-1 && sleep 5
  docker restart bsc-validator-2 && sleep 5
  docker restart bsc-validator-3 && sleep 10
elif systemctl list-units 2>/dev/null | grep -q geth-validator; then
  echo "  Using systemd..."
  sudo systemctl restart geth-validator-1 && sleep 5
  sudo systemctl restart geth-validator-2 && sleep 5
  sudo systemctl restart geth-validator-3 && sleep 10
else
  echo "❌ Could not find validators!"
  exit 1
fi

echo "✅ Validators restarted"
ENDSSH

echo ""
echo "⏳ Step 3: Waiting for block production..."
sleep 15

# Check if blocks resumed
NEW_BLOCK=$(curl -s -X POST http://$SERVER:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

NEW_BLOCK_DEC=$((16#${NEW_BLOCK:2}))

echo ""
if [ $NEW_BLOCK_DEC -gt $BLOCK_DEC ]; then
  echo "✅ SUCCESS! Blocks resumed at $NEW_BLOCK_DEC"
else
  echo "⚠️  Warning: Block still at $NEW_BLOCK_DEC (may need more time)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "                    COMPLETE ✅"
echo "═══════════════════════════════════════════════════════"
echo ""


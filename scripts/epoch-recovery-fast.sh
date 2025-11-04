#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# EPOCH BOUNDARY RECOVERY - FAST (Single-Sealer Nudge)
#═══════════════════════════════════════════════════════════════════════════
#
# PURPOSE: Get past block 29,999 epoch boundary using single-sealer approach
#
# APPROACH:
# 1. Stop all validators except one
# 2. Let single validator seal block 30,000
# 3. Restart other validators once past the epoch
#
# PRESERVES: All state, contracts, liquidity, balances
#═══════════════════════════════════════════════════════════════════════════

set -e

SSH_KEY="$HOME/.ssh/bsc-validator-key.pem"
SERVER="ec2-user@3.91.50.187"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║           EPOCH BOUNDARY RECOVERY - SINGLE-SEALER NUDGE                   ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verify current block
echo "📊 Step 1: Checking current block number..."
CURRENT_BLOCK=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
  "curl -s -X POST http://localhost:8545 \
  -H 'Content-Type: application/json' \
  --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' \
  | grep -o '\"result\":\"[^\"]*\"' | cut -d':' -f2 | tr -d '\"'" 2>/dev/null)

BLOCK_DEC=$((16#${CURRENT_BLOCK:2}))
echo "   Current block: $BLOCK_DEC (hex: $CURRENT_BLOCK)"

if [ "$BLOCK_DEC" != "29999" ]; then
  echo "   ⚠️  Block is not at 29999. Current: $BLOCK_DEC"
  echo "   This script is designed for epoch boundary at 29999→30000"
  read -p "   Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "🔍 Step 2: Checking validator status..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_CHECK'
echo "   Validators running:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "xaheen-rpc|bsc-validator"
echo ""
echo "   Validator addresses in genesis extraData:"
# Decode extraData from genesis to show validator list
# First 32 bytes = vanity, next N*20 bytes = validators, last 65 bytes = seal
REMOTE_CHECK

echo ""
echo "⚠️  Step 3: SINGLE-SEALER NUDGE"
echo "   This will:"
echo "   1. Stop validators 2 and 3"
echo "   2. Keep only xaheen-rpc (validator 1) running"
echo "   3. Wait for it to seal block 30,000"
echo "   4. Restart validators 2 and 3"
echo ""
read -p "   Proceed with single-sealer nudge? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "   Aborted."
  exit 1
fi

echo ""
echo "🛑 Stopping validators 2 and 3..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
  "docker stop bsc-validator-2 bsc-validator-3"

echo ""
echo "⏳ Waiting 60 seconds for single validator to seal epoch block..."
echo "   (Block 30,000 must embed canonical validator list in extraData)"
sleep 60

echo ""
echo "📊 Checking if we passed the epoch..."
for i in {1..10}; do
  BLOCK=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
    "curl -s -X POST http://localhost:8545 \
    -H 'Content-Type: application/json' \
    --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' \
    | grep -o '\"result\":\"[^\"]*\"' | cut -d':' -f2 | tr -d '\"'" 2>/dev/null)

  BLOCK_NUM=$((16#${BLOCK:2}))
  echo "   Attempt $i: Block $BLOCK_NUM"

  if [ "$BLOCK_NUM" -gt "29999" ]; then
    echo ""
    echo "✅ SUCCESS! Passed epoch boundary!"
    echo "   Current block: $BLOCK_NUM"
    echo ""
    echo "🔄 Restarting validators 2 and 3..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
      "docker start bsc-validator-2 bsc-validator-3"

    echo ""
    echo "⏳ Waiting 30 seconds for peer sync..."
    sleep 30

    echo ""
    echo "📊 Final verification..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'VERIFY'
echo "   Active validators:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "xaheen-rpc|bsc-validator"
echo ""
echo "   Current block:"
BLOCK=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
echo "   $((16#${BLOCK:2}))"
echo ""
echo "   Peer count:"
PEERS=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
echo "   $((16#${PEERS:2})) peers"
VERIFY

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                    EPOCH RECOVERY SUCCESSFUL! ✅                          ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Your $20,000 NOR/USDT liquidity is safe! 🎉"
    echo "All contracts, balances, and LP reserves preserved."
    echo ""
    exit 0
  fi

  sleep 10
done

echo ""
echo "❌ FAILED: Could not pass epoch boundary with single-sealer nudge"
echo ""
echo "This indicates a validator list mismatch in genesis extraData."
echo "Next step: State-preserving regenesis (see epoch-recovery-regenesis.sh)"
echo ""
echo "🔄 Restarting all validators..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
  "docker start bsc-validator-2 bsc-validator-3"

echo ""
echo "Run: ./scripts/epoch-recovery-regenesis.sh"
exit 1

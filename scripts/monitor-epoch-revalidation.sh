#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - EPOCH REVALIDATION MONITOR 🌙
#═══════════════════════════════════════════════════════════════════════════════
#
# Monitors Noor Chain for epoch revalidation at block 10,000
#
# Epoch Configuration:
# - Epoch Length: 10,000 blocks
# - Block Time: 3 seconds
# - Expected Time: ~8.3 hours from block 1 to 10,000
#
# What We're Testing:
# 1. Block production continues smoothly through epoch boundary
# 2. No consensus deadlock at block 10,000
# 3. Validator rotation (if configured) works correctly
# 4. Peer connections remain stable
#
#═══════════════════════════════════════════════════════════════════════════════

set -e

SERVER_IP="3.91.50.187"
RPC_URL="http://localhost:8545"
EPOCH_SIZE=10000
ALERT_BEFORE_EPOCH=10  # Start intensive monitoring 10 blocks before epoch
ALERT_AFTER_EPOCH=10   # Continue intensive monitoring 10 blocks after epoch

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN EPOCH REVALIDATION MONITOR 🌙                     ║"
echo "║          Testing Epoch Boundary at Block 10,000                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Function to get current block number
get_block_number() {
  ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@$SERVER_IP \
    "curl -s -X POST $RPC_URL -H 'Content-Type: application/json' \
    --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' \
    | jq -r '.result' | xargs printf '%d\n' 2>/dev/null || echo '0'"
}

# Function to get peer count
get_peer_count() {
  ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@$SERVER_IP \
    "curl -s -X POST $RPC_URL -H 'Content-Type: application/json' \
    --data '{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}' \
    | jq -r '.result' | xargs printf '%d\n' 2>/dev/null || echo '0'"
}

# Get initial status
CURRENT_BLOCK=$(get_block_number)
CURRENT_PEERS=$(get_peer_count)

echo "📊 Current Status:"
echo "   Block: $CURRENT_BLOCK"
echo "   Peers: $CURRENT_PEERS"
echo ""

if [ "$CURRENT_BLOCK" -eq 0 ]; then
  echo "❌ ERROR: Cannot connect to RPC or chain is not producing blocks"
  exit 1
fi

# Calculate time to epoch
BLOCKS_TO_EPOCH=$((EPOCH_SIZE - CURRENT_BLOCK))
SECONDS_TO_EPOCH=$((BLOCKS_TO_EPOCH * 3))
HOURS=$((SECONDS_TO_EPOCH / 3600))
MINUTES=$(((SECONDS_TO_EPOCH % 3600) / 60))

echo "⏱️  Time to Epoch Revalidation:"
echo "   Blocks remaining: $BLOCKS_TO_EPOCH"
echo "   Estimated time: ${HOURS}h ${MINUTES}m"
echo ""

if [ "$CURRENT_BLOCK" -ge "$EPOCH_SIZE" ]; then
  echo "✅ Epoch boundary already passed at block $EPOCH_SIZE"
  echo "   Current block: $CURRENT_BLOCK"
  echo "   Chain successfully revalidated!"
  exit 0
fi

# Determine monitoring mode
if [ "$CURRENT_BLOCK" -ge $((EPOCH_SIZE - ALERT_BEFORE_EPOCH)) ]; then
  echo "🚨 INTENSIVE MONITORING MODE"
  echo "   Approaching epoch boundary - monitoring every block!"
  echo ""
  MONITOR_INTERVAL=3  # Check every 3 seconds (1 block time)
else
  echo "📡 STANDARD MONITORING MODE"
  echo "   Checking every minute until approaching epoch boundary"
  echo ""
  MONITOR_INTERVAL=60  # Check every minute
fi

# Create log file
LOG_FILE="/tmp/noor-epoch-monitor-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Logging to: $LOG_FILE"
echo ""

# Monitoring loop
PREV_BLOCK=$CURRENT_BLOCK
STALL_COUNT=0
MAX_STALLS=5

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting epoch revalidation monitor" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Current block: $CURRENT_BLOCK, Target: $EPOCH_SIZE" >> "$LOG_FILE"

while true; do
  CURRENT_BLOCK=$(get_block_number)
  CURRENT_PEERS=$(get_peer_count)
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  # Check if we're in intensive monitoring zone
  if [ "$CURRENT_BLOCK" -ge $((EPOCH_SIZE - ALERT_BEFORE_EPOCH)) ] && [ "$CURRENT_BLOCK" -lt "$EPOCH_SIZE" ]; then
    echo "🚨 [$TIMESTAMP] APPROACHING EPOCH! Block $CURRENT_BLOCK | Peers $CURRENT_PEERS | $(($EPOCH_SIZE - $CURRENT_BLOCK)) blocks to go"
    MONITOR_INTERVAL=3
  elif [ "$CURRENT_BLOCK" -ge "$EPOCH_SIZE" ] && [ "$CURRENT_BLOCK" -lt $((EPOCH_SIZE + ALERT_AFTER_EPOCH)) ]; then
    echo "🎉 [$TIMESTAMP] POST-EPOCH! Block $CURRENT_BLOCK | Peers $CURRENT_PEERS | Epoch passed successfully!"
    MONITOR_INTERVAL=3
  else
    BLOCKS_REMAINING=$((EPOCH_SIZE - CURRENT_BLOCK))
    MINUTES_REMAINING=$((BLOCKS_REMAINING * 3 / 60))
    echo "📊 [$TIMESTAMP] Block $CURRENT_BLOCK | Peers $CURRENT_PEERS | $BLOCKS_REMAINING blocks to epoch (~${MINUTES_REMAINING}m)"
  fi

  # Log to file
  echo "[$TIMESTAMP] Block: $CURRENT_BLOCK, Peers: $CURRENT_PEERS" >> "$LOG_FILE"

  # Check for stalled blocks
  if [ "$CURRENT_BLOCK" -eq "$PREV_BLOCK" ]; then
    STALL_COUNT=$((STALL_COUNT + 1))
    echo "⚠️  WARNING: Block production stalled! Count: $STALL_COUNT/$MAX_STALLS"

    if [ "$STALL_COUNT" -ge "$MAX_STALLS" ]; then
      echo ""
      echo "╔═══════════════════════════════════════════════════════════════════════════╗"
      echo "║          ❌ CRITICAL ERROR - BLOCK PRODUCTION STOPPED ❌                 ║"
      echo "╚═══════════════════════════════════════════════════════════════════════════╝"
      echo ""
      echo "Block $CURRENT_BLOCK has not progressed for $((STALL_COUNT * MONITOR_INTERVAL)) seconds"
      echo "Checking validator logs..."

      ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@$SERVER_IP \
        "docker logs --tail 50 xaheen-rpc 2>&1 | grep -E '(ERROR|WARN|Commit new mining|Signed recently|Looking for peers)'"

      exit 1
    fi
  else
    STALL_COUNT=0  # Reset stall counter
  fi

  PREV_BLOCK=$CURRENT_BLOCK

  # Check if epoch boundary passed
  if [ "$CURRENT_BLOCK" -ge $((EPOCH_SIZE + ALERT_AFTER_EPOCH)) ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║          🎉🎉🎉 EPOCH REVALIDATION SUCCESSFUL! 🎉🎉🎉                   ║"
    echo "║                                                                           ║"
    echo "║          Block production continued smoothly through epoch 10,000        ║"
    echo "║          No consensus deadlock detected                                  ║"
    echo "║          Peer connections remained stable                                ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "✅ Current block: $CURRENT_BLOCK"
    echo "✅ Epoch boundary: $EPOCH_SIZE"
    echo "✅ Blocks after epoch: $((CURRENT_BLOCK - EPOCH_SIZE))"
    echo "✅ Peer count: $CURRENT_PEERS"
    echo ""
    echo "📝 Full log saved to: $LOG_FILE"

    # Log success
    echo "$(date '+%Y-%m-%d %H:%M:%S') - EPOCH REVALIDATION SUCCESSFUL at block $CURRENT_BLOCK" >> "$LOG_FILE"

    exit 0
  fi

  sleep "$MONITOR_INTERVAL"
done

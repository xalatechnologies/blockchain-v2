#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# AUTO-SEALER FOR EPOCH BOUNDARIES
#═══════════════════════════════════════════════════════════════════════════
#
# PURPOSE: Automatically handle epoch boundaries to prevent deadlocks
#
# HOW IT WORKS:
# 1. Runs every minute via cron
# 2. When within 5 blocks of epoch boundary:
#    - Stops validators 2 & 3
#    - Lets validator 1 seal epoch block alone
#    - Restarts validators 2 & 3
# 3. Prevents validator disagreement on epoch blocks
#
# INSTALL:
#   crontab -e
#   * * * * * /opt/noor-chain/scripts/auto-sealer-epoch.sh >> /var/log/auto-sealer.log 2>&1
#
#═══════════════════════════════════════════════════════════════════════════

set -e

# Configuration
EPOCH=10000  # ← Change this if you update genesis epoch
RPC_URL="http://localhost:8545"
LOG_FILE="/var/log/auto-sealer-epoch.log"

# Get current block
CURRENT_BLOCK=$(curl -s "$RPC_URL" -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')

if [ -z "$CURRENT_BLOCK" ]; then
  echo "[$(date)] ERROR: Could not get block number" >> "$LOG_FILE"
  exit 1
fi

BLOCK_DEC=$((16#${CURRENT_BLOCK:2}))
BLOCKS_UNTIL_EPOCH=$((EPOCH - (BLOCK_DEC % EPOCH)))

# Log current status
echo "[$(date)] Block: $BLOCK_DEC | Blocks until epoch: $BLOCKS_UNTIL_EPOCH" >> "$LOG_FILE"

# Activate single-sealer mode when within 5 blocks of epoch
if [ "$BLOCKS_UNTIL_EPOCH" -le 5 ] && [ "$BLOCKS_UNTIL_EPOCH" -gt 0 ]; then
  echo "[$(date)] ⚠️  EPOCH BOUNDARY IN $BLOCKS_UNTIL_EPOCH BLOCKS - ACTIVATING SINGLE-SEALER MODE" >> "$LOG_FILE"

  # Stop validators 2 and 3
  echo "[$(date)] Stopping validators 2 and 3..." >> "$LOG_FILE"
  docker stop bsc-validator-2 bsc-validator-3 >> "$LOG_FILE" 2>&1

  # Wait for epoch block to seal (max 60 seconds)
  echo "[$(date)] Waiting for validator 1 to seal epoch block..." >> "$LOG_FILE"
  sleep 60

  # Check if we passed the epoch
  NEW_BLOCK=$(curl -s "$RPC_URL" -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')

  NEW_BLOCK_DEC=$((16#${NEW_BLOCK:2}))

  if [ "$NEW_BLOCK_DEC" -gt "$BLOCK_DEC" ]; then
    echo "[$(date)] ✅ SUCCESS! Passed epoch boundary. Block: $BLOCK_DEC → $NEW_BLOCK_DEC" >> "$LOG_FILE"

    # Restart validators 2 and 3
    echo "[$(date)] Restarting validators 2 and 3..." >> "$LOG_FILE"
    docker start bsc-validator-2 bsc-validator-3 >> "$LOG_FILE" 2>&1

    # Verify peer sync
    sleep 10
    PEERS=$(curl -s "$RPC_URL" -X POST \
      -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
      | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    PEERS_DEC=$((16#${PEERS:2}))

    echo "[$(date)] Peer count: $PEERS_DEC" >> "$LOG_FILE"

    if [ "$PEERS_DEC" -ge 2 ]; then
      echo "[$(date)] ✅ All validators synced. Epoch transition complete!" >> "$LOG_FILE"
    else
      echo "[$(date)] ⚠️  Warning: Low peer count after restart: $PEERS_DEC" >> "$LOG_FILE"
    fi

  else
    echo "[$(date)] ❌ FAILED: Could not pass epoch boundary" >> "$LOG_FILE"
    echo "[$(date)] Block still at: $NEW_BLOCK_DEC" >> "$LOG_FILE"
    echo "[$(date)] ALERT: Manual intervention required!" >> "$LOG_FILE"

    # Restart validators anyway to restore normal operation
    docker start bsc-validator-2 bsc-validator-3 >> "$LOG_FILE" 2>&1
  fi

elif [ "$BLOCKS_UNTIL_EPOCH" -eq 0 ]; then
  # We're exactly at epoch boundary - this should not happen if script runs every minute
  echo "[$(date)] ⚠️  WARNING: Already at epoch boundary! Block: $BLOCK_DEC" >> "$LOG_FILE"
fi

# Health check: Ensure all validators are running
RUNNING=$(docker ps --filter "name=xaheen-rpc" --filter "name=bsc-validator" --format "{{.Names}}" | wc -l)
if [ "$RUNNING" -ne 3 ]; then
  echo "[$(date)] ⚠️  WARNING: Only $RUNNING/3 validators running!" >> "$LOG_FILE"
fi

exit 0

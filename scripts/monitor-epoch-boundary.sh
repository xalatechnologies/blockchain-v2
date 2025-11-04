#!/bin/bash

#
# Epoch Boundary Monitor
#
# Monitors chain blocks and alerts when approaching epoch boundary.
# Can automatically trigger validator coordination for epoch transitions.
#

set -e

# Configuration
RPC_URL="${RPC_URL:-http://localhost:8545}"
EPOCH="${EPOCH:-9000000}"
ALERT_BLOCKS_BEFORE="${ALERT_BLOCKS_BEFORE:-100}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"  # seconds
LOG_FILE="${LOG_FILE:-/tmp/epoch-monitor.log}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Epoch Boundary Monitor"
echo "========================="
echo ""
echo "Configuration:"
echo "  RPC URL: $RPC_URL"
echo "  Epoch: $EPOCH blocks"
echo "  Alert: $ALERT_BLOCKS_BEFORE blocks before epoch"
echo "  Check interval: $CHECK_INTERVAL seconds"
echo "  Log file: $LOG_FILE"
echo ""

# Initialize log
touch "$LOG_FILE"
echo "[$(date)] Epoch monitor started" >> "$LOG_FILE"

# Function to get current block
get_current_block() {
    local result=$(curl -s -X POST "$RPC_URL" \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        2>/dev/null)
    
    if [ -z "$result" ]; then
        return 1
    fi
    
    # Extract block number (handle both jq and grep)
    if command -v jq &> /dev/null; then
        echo "$result" | jq -r '.result' | sed 's/0x//' | tr '[:lower:]' '[:upper:]'
    else
        echo "$result" | grep -o '"result":"[^"]*"' | cut -d'"' -f4 | sed 's/0x//' | tr '[:lower:]' '[:upper:]'
    fi
}

# Function to convert hex to decimal
hex_to_dec() {
    python3 -c "print(int('$1', 16))"
}

# Function to calculate blocks until next epoch
blocks_until_epoch() {
    local current_block=$1
    local epoch=$2
    local blocks_in_current_epoch=$((current_block % epoch))
    local blocks_until_next=$((epoch - blocks_in_current_epoch))
    echo $blocks_until_next
}

# Main monitoring loop
echo "Starting monitoring... (Press Ctrl+C to stop)"
echo ""

LAST_ALERT=0

while true; do
    CURRENT_BLOCK_HEX=$(get_current_block)
    
    if [ -z "$CURRENT_BLOCK_HEX" ] || [ "$CURRENT_BLOCK_HEX" = "null" ]; then
        echo "[$(date)] ⚠️  Warning: Could not get block number from RPC"
        sleep "$CHECK_INTERVAL"
        continue
    fi
    
    CURRENT_BLOCK=$(hex_to_dec "$CURRENT_BLOCK_HEX")
    BLOCKS_UNTIL_EPOCH=$(blocks_until_epoch "$CURRENT_BLOCK" "$EPOCH")
    CURRENT_EPOCH=$((CURRENT_BLOCK / EPOCH + 1))
    
    # Log status
    STATUS="[$(date)] Block: $CURRENT_BLOCK | Blocks until epoch: $BLOCKS_UNTIL_EPOCH | Epoch: $CURRENT_EPOCH"
    echo "$STATUS" >> "$LOG_FILE"
    
    # Check if at epoch boundary
    if [ "$BLOCKS_UNTIL_EPOCH" -eq 0 ] || [ "$BLOCKS_UNTIL_EPOCH" -eq "$EPOCH" ]; then
        echo -e "${YELLOW}⚠️  EPOCH BOUNDARY REACHED!${NC}"
        echo -e "${YELLOW}   Block: $CURRENT_BLOCK${NC}"
        echo -e "${YELLOW}   Epoch: $CURRENT_EPOCH${NC}"
        echo "[$(date)] ⚠️  EPOCH BOUNDARY REACHED - Block $CURRENT_BLOCK" >> "$LOG_FILE"
        
        # Wait a bit and check if blocks continue
        sleep 10
        NEW_BLOCK=$(hex_to_dec $(get_current_block))
        if [ "$NEW_BLOCK" -gt "$CURRENT_BLOCK" ]; then
            echo -e "${GREEN}✅ Blocks continue after epoch boundary!${NC}"
            echo "[$(date)] ✅ Epoch boundary passed successfully - Block $NEW_BLOCK" >> "$LOG_FILE"
        else
            echo -e "${RED}❌ BLOCK PRODUCTION STALLED!${NC}"
            echo "[$(date)] ❌ BLOCK PRODUCTION STALLED at epoch boundary!" >> "$LOG_FILE"
        fi
    
    # Check if approaching epoch boundary
    elif [ "$BLOCKS_UNTIL_EPOCH" -le "$ALERT_BLOCKS_BEFORE" ]; then
        if [ $((CURRENT_BLOCK - LAST_ALERT)) -gt 10 ]; then
            echo -e "${YELLOW}⚠️  Approaching epoch boundary!${NC}"
            echo -e "${YELLOW}   Block: $CURRENT_BLOCK${NC}"
            echo -e "${YELLOW}   Blocks until epoch: $BLOCKS_UNTIL_EPOCH${NC}"
            echo -e "${YELLOW}   Epoch: $CURRENT_EPOCH${NC}"
            echo "[$(date)] ⚠️  Approaching epoch boundary - $BLOCKS_UNTIL_EPOCH blocks remaining" >> "$LOG_FILE"
            LAST_ALERT=$CURRENT_BLOCK
        fi
    else
        # Normal operation - show status every 10 checks
        if [ $((CURRENT_BLOCK % 10)) -eq 0 ]; then
            echo "Block: $CURRENT_BLOCK | Epoch: $CURRENT_EPOCH | Blocks until epoch: $BLOCKS_UNTIL_EPOCH"
        fi
    fi
    
    sleep "$CHECK_INTERVAL"
done


#!/bin/bash

#
# Comprehensive Validator and Block Production Check
# Checks if validators are running and producing blocks
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RPC_URL="${RPC_URL:-http://localhost:8545}"
HTTPS_RPC_URL="${HTTPS_RPC_URL:-https://3.91.50.187}"
SERVER_IP="${SERVER_IP:-3.91.50.187}"
SSH_KEY="${SSH_KEY:-~/.ssh/bsc-validator-key.pem}"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          VALIDATOR AND BLOCK PRODUCTION STATUS CHECK                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to call RPC
rpc_call() {
    local url=$1
    local method=$2
    local params=$3
    
    if [[ "$url" == https://* ]]; then
        curl -k -s -X POST "$url" \
            -H "Content-Type: application/json" \
            --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}" 2>/dev/null
    else
        curl -s -X POST "$url" \
            -H "Content-Type: application/json" \
            --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}" 2>/dev/null
    fi
}

# Function to get block number
get_block_number() {
    local url=$1
    local response=$(rpc_call "$url" "eth_blockNumber" "[]")
    local hex_block=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('result', '0x0'))" 2>/dev/null || echo "0x0")
    
    if [ "$hex_block" != "0x0" ] && [ -n "$hex_block" ]; then
        python3 -c "print(int('$hex_block', 16))" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Function to get peer count
get_peer_count() {
    local url=$1
    local response=$(rpc_call "$url" "net_peerCount" "[]")
    local hex_peers=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('result', '0x0'))" 2>/dev/null || echo "0x0")
    
    if [ "$hex_peers" != "0x0" ] && [ -n "$hex_peers" ]; then
        python3 -c "print(int('$hex_peers', 16))" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Function to get chain ID
get_chain_id() {
    local url=$1
    local response=$(rpc_call "$url" "eth_chainId" "[]")
    local hex_chain=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('result', '0x0'))" 2>/dev/null || echo "0x0")
    
    if [ "$hex_chain" != "0x0" ] && [ -n "$hex_chain" ]; then
        python3 -c "print(int('$hex_chain', 16))" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Function to check if syncing
is_syncing() {
    local url=$1
    local response=$(rpc_call "$url" "eth_syncing" "[]")
    local syncing=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); result=d.get('result', False); print('true' if result != False else 'false')" 2>/dev/null || echo "false")
    echo "$syncing"
}

# Determine which RPC to use
RPC_TO_USE=""
echo -e "${BLUE}1. Checking RPC Connectivity...${NC}"
echo "   --------------------"

# Try HTTPS first
if rpc_call "$HTTPS_RPC_URL" "eth_blockNumber" "[]" | grep -q "result"; then
    RPC_TO_USE="$HTTPS_RPC_URL"
    echo -e "   ${GREEN}✅${NC} HTTPS RPC accessible: $HTTPS_RPC_URL"
elif rpc_call "$RPC_URL" "eth_blockNumber" "[]" | grep -q "result"; then
    RPC_TO_USE="$RPC_URL"
    echo -e "   ${GREEN}✅${NC} HTTP RPC accessible: $RPC_URL"
else
    echo -e "   ${RED}❌${NC} Cannot connect to RPC endpoints"
    echo "   Trying: $HTTPS_RPC_URL"
    echo "   Trying: $RPC_URL"
    exit 1
fi

echo ""

# 2. Chain Information
echo -e "${BLUE}2. Chain Information${NC}"
echo "   --------------------"

CHAIN_ID=$(get_chain_id "$RPC_TO_USE")
echo "   Chain ID: $CHAIN_ID"
if [ "$CHAIN_ID" = "65001" ]; then
    echo -e "   ${GREEN}✅${NC} Correct chain ID (65001)"
else
    echo -e "   ${YELLOW}⚠️${NC}  Expected chain ID 65001, got $CHAIN_ID"
fi

BLOCK_NUMBER=$(get_block_number "$RPC_TO_USE")
echo "   Current Block: $BLOCK_NUMBER"

if [ "$BLOCK_NUMBER" = "0" ]; then
    echo -e "   ${RED}❌${NC} Stuck at genesis block (block 0)"
    BLOCK_PRODUCTION="NOT PRODUCING"
elif [ "$BLOCK_NUMBER" -gt 0 ]; then
    echo -e "   ${GREEN}✅${NC} Blocks are being produced!"
    BLOCK_PRODUCTION="PRODUCING"
    
    # Check if blocks are increasing
    echo "   Checking block progression..."
    sleep 5
    BLOCK_NUMBER_2=$(get_block_number "$RPC_TO_USE")
    if [ "$BLOCK_NUMBER_2" -gt "$BLOCK_NUMBER" ]; then
        echo -e "   ${GREEN}✅${NC} Blocks are increasing (was $BLOCK_NUMBER, now $BLOCK_NUMBER_2)"
    else
        echo -e "   ${YELLOW}⚠️${NC}  Block number unchanged (may be stuck)"
    fi
else
    BLOCK_PRODUCTION="UNKNOWN"
fi

SYNCING=$(is_syncing "$RPC_TO_USE")
if [ "$SYNCING" = "true" ]; then
    echo -e "   ${YELLOW}⚠️${NC}  Chain is still syncing"
else
    echo -e "   ${GREEN}✅${NC} Chain is not syncing (fully synced)"
fi

PEER_COUNT=$(get_peer_count "$RPC_TO_USE")
echo "   Peer Count: $PEER_COUNT"

if [ "$PEER_COUNT" -ge 2 ]; then
    echo -e "   ${GREEN}✅${NC} Validators are connected ($PEER_COUNT peers)"
elif [ "$PEER_COUNT" -eq 1 ]; then
    echo -e "   ${YELLOW}⚠️${NC}  Only 1 peer connected (expected 2+ for 3 validators)"
else
    echo -e "   ${RED}❌${NC} No peers connected (validators cannot communicate)"
fi

echo ""

# 3. Validator Container Status (if SSH available)
echo -e "${BLUE}3. Validator Container Status${NC}"
echo "   --------------------"

if [ -f "$SSH_KEY" ] && command -v ssh &> /dev/null; then
    echo "   Checking via SSH ($SERVER_IP)..."
    
    VALIDATOR_STATUS=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ec2-user@$SERVER_IP \
        "docker ps --filter 'name=validator' --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null" 2>/dev/null || echo "")
    
    if [ -n "$VALIDATOR_STATUS" ]; then
        echo "$VALIDATOR_STATUS" | while IFS=$'\t' read -r name status ports; do
            if [ -n "$name" ]; then
                if echo "$status" | grep -q "Up"; then
                    echo -e "   ${GREEN}✅${NC} $name: $status"
                else
                    echo -e "   ${RED}❌${NC} $name: $status"
                fi
            fi
        done
        
        # Check for xaheen-rpc or bsc-validator containers
        ALL_VALIDATORS=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$SERVER_IP \
            "docker ps --format '{{.Names}}' | grep -E '(xaheen-rpc|bsc-validator|validator)' | wc -l" 2>/dev/null || echo "0")
        
        echo "   Total validators running: $ALL_VALIDATORS"
    else
        echo -e "   ${YELLOW}⚠️${NC}  Could not connect via SSH or no validators found"
        echo "   (Make sure SSH key is at $SSH_KEY)"
    fi
elif command -v docker &> /dev/null; then
    # Check locally
    VALIDATOR_STATUS=$(docker ps --filter "name=validator" --format "{{.Names}}\t{{.Status}}" 2>/dev/null || echo "")
    
    if [ -n "$VALIDATOR_STATUS" ]; then
        echo "$VALIDATOR_STATUS" | while IFS=$'\t' read -r name status; do
            if [ -n "$name" ]; then
                if echo "$status" | grep -q "Up"; then
                    echo -e "   ${GREEN}✅${NC} $name: $status"
                else
                    echo -e "   ${RED}❌${NC} $name: $status"
                fi
            fi
        done
    else
        echo -e "   ${YELLOW}⚠️${NC}  No validator containers found locally"
        echo "   (Run this script on the server or configure SSH)"
    fi
else
    echo -e "   ${YELLOW}⚠️${NC}  Cannot check validator containers (no SSH or Docker)"
    echo "   Configure SSH_KEY or run on server"
fi

echo ""

# 4. Validator Addresses from Genesis
echo -e "${BLUE}4. Validator Configuration Check${NC}"
echo "   --------------------"

if [ -f "data/genesis-nor-complete-v2-new-validators.json" ]; then
    GENESIS_FILE="data/genesis-nor-complete-v2-new-validators.json"
elif [ -f "data/genesis-nor-ultimate-actual-validators.json" ]; then
    GENESIS_FILE="data/genesis-nor-ultimate-actual-validators.json"
else
    GENESIS_FILE=$(find data -name "genesis*.json" -type f | head -1)
fi

if [ -n "$GENESIS_FILE" ] && [ -f "$GENESIS_FILE" ]; then
    echo "   Reading genesis file: $GENESIS_FILE"
    
    # Extract validator addresses from extraData
    VALIDATORS=$(python3 << PYEOF
import json
import sys

try:
    with open('$GENESIS_FILE', 'r') as f:
        genesis = json.load(f)
    
    # Extract extraData (contains validator addresses)
    extra_data = genesis.get('config', {}).get('parlia', {}).get('initialValidators', [])
    
    if not extra_data:
        # Try to extract from extraData hex string
        extra_data_hex = genesis.get('extraData', '')
        if extra_data_hex and len(extra_data_hex) > 130:
            # Each validator is 20 bytes (40 hex chars) + 65 bytes signature
            # For PoSA, validators are typically in initialValidators
            pass
    
    # Try initialValidators
    if not extra_data:
        extra_data = genesis.get('config', {}).get('parlia', {}).get('initialValidators', [])
    
    # If still empty, try to parse from alloc
    if not extra_data:
        alloc = genesis.get('alloc', {})
        # Look for addresses with large balances (likely validators)
        validators = []
        for addr, data in alloc.items():
            balance = data.get('balance', '0x0')
            # Convert hex to int
            try:
                bal_int = int(balance, 16) if isinstance(balance, str) else balance
                if bal_int > 1000000000000000000000:  # > 1000 tokens
                    validators.append(addr.lower())
            except:
                pass
        if validators:
            extra_data = sorted(validators)
    
    if extra_data:
        for i, v in enumerate(extra_data, 1):
            print(f"{i}. {v}")
    else:
        print("No validators found in genesis")
        sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
PYEOF
)
    
    if [ -n "$VALIDATORS" ]; then
        echo "   Validators in genesis:"
        echo "$VALIDATORS" | while read -r line; do
            echo "      $line"
        done
    else
        echo -e "   ${YELLOW}⚠️${NC}  Could not extract validator addresses from genesis"
    fi
else
    echo -e "   ${YELLOW}⚠️${NC}  Genesis file not found"
fi

echo ""

# 5. Summary and Recommendations
echo -e "${BLUE}5. Summary and Status${NC}"
echo "   --------------------"

echo "   Chain ID: $CHAIN_ID"
echo "   Current Block: $BLOCK_NUMBER"
echo "   Peer Count: $PEER_COUNT"
echo "   Block Production: $BLOCK_PRODUCTION"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                          STATUS SUMMARY                                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$BLOCK_NUMBER" -gt 10 ]; then
    echo -e "${GREEN}✅ BLOCK PRODUCTION: ACTIVE${NC}"
    echo "   Blocks are being produced successfully"
elif [ "$BLOCK_NUMBER" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  BLOCK PRODUCTION: STARTING${NC}"
    echo "   Blocks are being produced but still early"
elif [ "$PEER_COUNT" -ge 2 ]; then
    echo -e "${YELLOW}⚠️  BLOCK PRODUCTION: PEERS CONNECTED${NC}"
    echo "   Validators are connected but blocks may not be producing yet"
    echo "   Check validator keystores and mining configuration"
else
    echo -e "${RED}❌ BLOCK PRODUCTION: NOT WORKING${NC}"
    echo "   Issues detected:"
    if [ "$PEER_COUNT" -eq 0 ]; then
        echo "   - No peer connections (validators cannot communicate)"
    fi
    if [ "$BLOCK_NUMBER" -eq 0 ]; then
        echo "   - Stuck at genesis block"
    fi
    echo ""
    echo "   Recommended actions:"
    echo "   1. Check static-nodes.json configuration"
    echo "   2. Verify validator keystores match genesis addresses"
    echo "   3. Ensure validators have --mine flag enabled"
    echo "   4. Check validator logs: docker logs <validator-container>"
fi

echo ""
echo "=========================================="
echo "Check complete!"
echo "=========================================="
echo ""


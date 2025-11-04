#!/bin/bash

#
# Comprehensive Validator and Contract Verification Script
#
# Checks:
# - Validator status
# - Contract accessibility
# - LiquidityLock status
# - DEX pairs and liquidity
#

set -e

# Configuration
RPC_URL="${RPC_URL:-http://localhost:8545}"
HTTPS_RPC_URL="${HTTPS_RPC_URL:-https://3.91.50.187}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Comprehensive Validator and Contract Check"
echo "=============================================="
echo ""

# Function to call RPC
rpc_call() {
    local method=$1
    local params=$2
    curl -s -X POST "$RPC_URL" \
        -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}" 2>/dev/null
}

# Function to check contract
check_contract() {
    local addr=$1
    local name=$2
    local code=$(rpc_call "eth_getCode" "[\"$addr\",\"latest\"]" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('result', '0x'))" 2>/dev/null)
    
    if [ -n "$code" ] && [ "$code" != "0x" ] && [ ${#code} -gt 100 ]; then
        echo -e "   ${GREEN}✅${NC} $name: Contract deployed ($((${#code}/2 - 1)) bytes)"
        return 0
    else
        echo -e "   ${RED}❌${NC} $name: Contract not found or empty"
        return 1
    fi
}

# Function to get storage value
get_storage() {
    local addr=$1
    local slot=$2
    rpc_call "eth_getStorageAt" "[\"$addr\",\"$slot\",\"latest\"]" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('result', '0x0'))" 2>/dev/null
}

# Wait for RPC
echo "⏳ Waiting for RPC to be ready..."
for i in {1..30}; do
    if rpc_call "eth_blockNumber" "[]" | grep -q "result"; then
        echo -e "${GREEN}✅${NC} RPC is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌${NC} RPC not responding after 60 seconds"
        exit 1
    fi
    sleep 2
done

echo ""

# 1. Chain Information
echo "1. Chain Information:"
echo "   --------------------"
CHAIN_ID=$(rpc_call "eth_chainId" "[]" | python3 -c "import sys, json; d=json.load(sys.stdin); result=d.get('result', '0x0'); print(int(result, 16))" 2>/dev/null)
echo "   Chain ID: $CHAIN_ID"

BLOCK=$(rpc_call "eth_blockNumber" "[]" | python3 -c "import sys, json; d=json.load(sys.stdin); result=d.get('result', '0x0'); print(int(result, 16))" 2>/dev/null)
echo "   Current Block: $BLOCK"

SYNC=$(rpc_call "eth_syncing" "[]" | python3 -c "import sys, json; d=json.load(sys.stdin); result=d.get('result', False); print('No' if result == False else 'Yes')" 2>/dev/null)
echo "   Syncing: $SYNC"

echo ""

# 2. Validator Status (if accessible via SSH)
echo "2. Validator Status:"
echo "   --------------------"
if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep validator || echo "   (Run on server to see validators)"
else
    echo "   (Docker not available - check on server)"
fi

echo ""

# 3. Core Contracts
echo "3. Core Contracts:"
echo "   --------------------"

CONTRACTS=(
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F262:BTCBR"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F263:NOR"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F264:NRG"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F265:WNOR"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F266:NorSwapFactory"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F267:NorSwapRouter"
)

for contract in "${CONTRACTS[@]}"; do
    IFS=':' read -r addr name <<< "$contract"
    check_contract "$addr" "$name"
done

echo ""

# 4. LiquidityLock Contract
echo "4. LiquidityLock Contract:"
echo "   --------------------"
LIQUIDITY_LOCK="0x0cF8e180350253271f4b917CcFb0aCCc4862F275"

if check_contract "$LIQUIDITY_LOCK" "LiquidityLock"; then
    # Check locks array length (slot 0)
    LOCKS_LENGTH=$(get_storage "$LIQUIDITY_LOCK" "0x0")
    LOCKS_COUNT=$(python3 -c "print(int('$LOCKS_LENGTH', 16))" 2>/dev/null || echo "0")
    echo "   Locks array length: $LOCKS_COUNT"
    
    if [ "$LOCKS_COUNT" -gt 0 ]; then
        echo -e "   ${GREEN}✅${NC} $LOCKS_COUNT lock(s) found"
        echo "   Checking first lock..."
        
        # Get first lock struct (slot 0 of array at keccak256(0))
        LOCK_BASE=$(python3 << 'PYEOF'
import hashlib

# Slot 0 for locks array
slot = bytes.fromhex('0' * 64)
# Array base is keccak256(slot)
base = hashlib.sha3_256(slot).hexdigest()
print('0x' + base)
PYEOF
)
        
        # Get first lock's LP token address (struct slot 0)
        FIRST_LOCK_SLOT=$(python3 << PYEOF
import hashlib

slot = bytes.fromhex('0' * 64)
base = hashlib.sha3_256(slot).hexdigest()
# First struct at base + 0, lpToken at struct slot 0
print('0x' + base)
PYEOF
)
        
        LP_TOKEN=$(get_storage "$LIQUIDITY_LOCK" "$FIRST_LOCK_SLOT")
        echo "   First lock LP token: $LP_TOKEN"
        
        # Get lock amount (struct slot 2)
        AMOUNT_SLOT=$(python3 << PYEOF
import hashlib

slot = bytes.fromhex('0' * 64)
base = int(hashlib.sha3_256(slot).hexdigest(), 16)
# Amount is at struct slot 2 (base + 2)
amount_slot = hex(base + 2)
print(amount_slot)
PYEOF
)
        
        LOCK_AMOUNT=$(get_storage "$LIQUIDITY_LOCK" "$AMOUNT_SLOT")
        if [ "$LOCK_AMOUNT" != "0x0" ] && [ "$LOCK_AMOUNT" != "0x" ]; then
            AMOUNT_DEC=$(python3 -c "print(int('$LOCK_AMOUNT', 16) / 1e18)" 2>/dev/null || echo "0")
            echo "   Lock amount: $AMOUNT_DEC LP tokens"
        fi
    else
        echo -e "   ${YELLOW}⚠️${NC}  No locks found in LiquidityLock"
    fi
fi

echo ""

# 5. DEX Pairs and Liquidity
echo "5. DEX Pairs and Liquidity:"
echo "   --------------------"

PAIRS=(
    "0x1ec827185880dab7372c189c9d8f248986f451fd:NOR/USDT"
    "0xc7df87712ef24fc8a9c733c17bfc64c61c25622a:NOR/WBNB"
    "0x9752c04e749d08bf25de413f439662a013295a2f:NOR/WETH"
    "0x549c38191ddf65238a45a75bb97d3da0cc23a9a1:NOR/Dirhamat"
    "0xfd9797ee1cb74fbbe1934f24c1479aaad1335763:Dirhamat/USDT"
)

TOTAL_PAIRS=0
VALID_PAIRS=0

for pair_info in "${PAIRS[@]}"; do
    IFS=':' read -r addr name <<< "$pair_info"
    TOTAL_PAIRS=$((TOTAL_PAIRS + 1))
    
    if check_contract "$addr" "$name"; then
        VALID_PAIRS=$((VALID_PAIRS + 1))
        
        # Get reserves (slot 8 and 9)
        RESERVE0=$(get_storage "$addr" "0x8")
        RESERVE1=$(get_storage "$addr" "0x9")
        
        if [ "$RESERVE0" != "0x0" ] && [ "$RESERVE1" != "0x0" ]; then
            R0=$(python3 -c "print(int('$RESERVE0', 16) / 1e18)" 2>/dev/null || echo "0")
            R1=$(python3 -c "print(int('$RESERVE1', 16) / 1e18)" 2>/dev/null || echo "0")
            echo "      Reserves: $R0 / $R1"
            
            # Get LP token supply (slot 2)
            LP_SUPPLY=$(get_storage "$addr" "0x2")
            if [ "$LP_SUPPLY" != "0x0" ]; then
                SUPPLY=$(python3 -c "print(int('$LP_SUPPLY', 16) / 1e18)" 2>/dev/null || echo "0")
                echo "      LP Supply: $SUPPLY"
            fi
        else
            echo -e "      ${YELLOW}⚠️${NC}  Reserves not initialized"
        fi
    fi
done

echo ""
echo "=========================================="
echo "Summary:"
echo "   Chain ID: $CHAIN_ID"
echo "   Block: $BLOCK"
echo "   DEX Pairs: $VALID_PAIRS/$TOTAL_PAIRS"
echo "   LiquidityLock: $(if [ "$LOCKS_COUNT" -gt 0 ]; then echo "$LOCKS_COUNT locks"; else echo "No locks"; fi)"
echo "=========================================="
echo ""


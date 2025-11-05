#!/bin/bash

#
# Setup Static Nodes for All Validators
# This ensures validators can find and connect to each other
#

set -e

echo "=== SETTING UP STATIC NODES ==="
echo ""

echo "1. Waiting for validators to be fully ready..."
for i in {1..30}; do
    READY=0
    for j in {1..3}; do
        if docker ps | grep -q "bsc-validator-$j.*Up"; then
            READY=$((READY + 1))
        fi
    done
    if [ "$READY" -eq 3 ]; then
        echo "   ✅ All validators are running"
        break
    fi
    echo "   Waiting... ($READY/3 ready)"
    sleep 2
done

echo ""
echo "2. Getting enode addresses (this may take a moment)..."
sleep 10

ENODES=()

for i in {1..3}; do
    echo "   Getting validator-$i enode..."
    
    # Try multiple times to get enode
    ENODE=""
    for attempt in {1..10}; do
        ENODE=$(docker exec bsc-validator-$i /usr/local/bin/geth --exec "admin.nodeInfo.enode" attach /bsc/geth.ipc 2>/dev/null | tr -d '"' | tr -d '\n' | tr -d ' ' || echo "")
        
        if [ -n "$ENODE" ] && [ "$ENODE" != "" ]; then
            break
        fi
        
        if [ $attempt -lt 10 ]; then
            sleep 2
        fi
    done
    
    if [ -n "$ENODE" ] && [ "$ENODE" != "" ]; then
        ENODES+=("$ENODE")
        echo "      ✅ Validator-$i: ${ENODE:0:60}..."
    else
        echo "      ⚠️  Validator-$i: Could not get enode"
    fi
done

echo ""
echo "3. Creating static-nodes.json..."

if [ ${#ENODES[@]} -eq 3 ]; then
    # Create JSON array of enodes
    STATIC_NODES_JSON="["
    for i in "${!ENODES[@]}"; do
        if [ $i -gt 0 ]; then
            STATIC_NODES_JSON+=","
        fi
        STATIC_NODES_JSON+="\"${ENODES[$i]}\""
    done
    STATIC_NODES_JSON+="]"
    
    echo "   Static nodes:"
    echo "$STATIC_NODES_JSON" | python3 -m json.tool 2>/dev/null | head -10 || echo "$STATIC_NODES_JSON"
    
    # Write to all validators
    for i in {1..3}; do
        echo "$STATIC_NODES_JSON" | sudo tee /data/validator-$i/static-nodes.json > /dev/null
        sudo chmod 644 /data/validator-$i/static-nodes.json
        echo "   ✅ Created static-nodes.json for validator-$i"
    done
    
    echo ""
    echo "4. Restarting validators to load static nodes..."
    
    for i in {1..3}; do
        echo "   Restarting validator-$i..."
        docker restart bsc-validator-$i
        sleep 3
    done
    
    echo ""
    echo "✅ Static nodes configured!"
    echo ""
    echo "5. Waiting 20 seconds for validators to reconnect..."
    sleep 20
    
    echo ""
    echo "6. Checking peer connections..."
    PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | python3 -c "import sys, json; print(int(json.load(sys.stdin).get('result', '0x0'), 16))" 2>/dev/null || echo "0")
    echo "   Peer count: $PEERS"
    
    if [ "$PEERS" -ge 2 ]; then
        echo "   ✅ Validators are connected!"
    else
        echo "   ⚠️  Peer connections may need more time"
    fi
    
else
    echo "   ❌ Could not get all enode addresses (got ${#ENODES[@]}/3)"
    echo "   Validators may need more time to initialize"
    exit 1
fi

echo ""
echo "✅ Static nodes setup complete!"


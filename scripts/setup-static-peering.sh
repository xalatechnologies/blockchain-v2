#!/bin/bash

################################################################################
# NOOR CHAIN - STATIC P2P PEERING SETUP
#
# This script configures static-nodes.json for all 3 validators
################################################################################

set -e

echo "═══════════════════════════════════════════════════════════════════════════"
echo "          🌙 NOOR CHAIN STATIC PEERING CONFIGURATION 🌙"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Upload and execute on server
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 << 'ENDSSH'

# Get enode addresses via RPC
echo "📡 Retrieving enode addresses from running validators..."
echo ""

# Function to extract enode from admin_nodeInfo
get_enode() {
    local port=$1
    local enode=$(curl -s -X POST http://localhost:$port \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":1}' | \
        grep -o '"enode":"enode://[^"]*"' | \
        cut -d'"' -f4)
    
    # Replace IP with 127.0.0.1 for local peering
    echo "$enode" | sed 's/@[0-9.]*:/@127.0.0.1:/'
}

# Wait a bit for validators to fully start
sleep 5

# Get enodes
ENODE1=$(get_enode 8545)
ENODE2=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"admin_peers","params":[],"id":1}' | \
    grep -o '"enode":"enode://[^"]*30304"' | head -1 | cut -d'"' -f4 || echo "")

ENODE3=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"admin_peers","params":[],"id":1}' | \
    grep -o '"enode":"enode://[^"]*30305"' | head -1 | cut -d'"' -f4 || echo "")

# If we can't get enodes from peers, generate them from keystore
if [ -z "$ENODE1" ] || [ -z "$ENODE2" ] || [ -z "$ENODE3" ]; then
    echo "⚠️  Could not retrieve all enodes from RPC. Using manual configuration..."
    
    # Get node IDs from geth console
    ENODE1=$(timeout 5 ~/geth attach ~/validator-1/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/"//g; s/@[^:]*:/@127.0.0.1:/')
    ENODE2=$(timeout 5 ~/geth attach ~/validator-2/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/"//g; s/@[^:]*:/@127.0.0.1:/')
    ENODE3=$(timeout 5 ~/geth attach ~/validator-3/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/"//g; s/@[^:]*:/@127.0.0.1:/')
fi

echo "Validator 1 enode: $ENODE1"
echo "Validator 2 enode: $ENODE2"
echo "Validator 3 enode: $ENODE3"
echo ""

if [ -z "$ENODE1" ] || [ -z "$ENODE2" ] || [ -z "$ENODE3" ]; then
    echo "❌ Failed to retrieve enode addresses. Validators may not be running."
    exit 1
fi

# Create static-nodes.json for each validator
echo "📝 Creating static-nodes.json files..."

# Validator 1: peers with 2 and 3
cat > ~/validator-1/static-nodes.json << EOF
[
  "$ENODE2",
  "$ENODE3"
]
EOF

# Validator 2: peers with 1 and 3
cat > ~/validator-2/static-nodes.json << EOF
[
  "$ENODE1",
  "$ENODE3"
]
EOF

# Validator 3: peers with 1 and 2
cat > ~/validator-3/static-nodes.json << EOF
[
  "$ENODE1",
  "$ENODE2"
]
EOF

echo "✅ Static peer configuration files created"
echo ""

# Restart validators to apply static peering
echo "🔄 Restarting validators to apply static peering..."
pkill -f geth
sleep 3

# Start validators
VALIDATOR_1="0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C"
VALIDATOR_2="0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788"
VALIDATOR_3="0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"

nohup ~/geth --datadir ~/validator-1 --networkid 885824 --port 30303 \
    --http --http.addr "0.0.0.0" --http.port 8545 \
    --http.api "eth,net,web3,personal,admin,txpool,debug" --http.corsdomain "*" \
    --ws --ws.addr "0.0.0.0" --ws.port 8546 \
    --ws.api "eth,net,web3,personal,admin,txpool,debug" --ws.origins "*" \
    --unlock "$VALIDATOR_1" --password ~/validator-1/password.txt \
    --mine --miner.etherbase "$VALIDATOR_1" --allow-insecure-unlock \
    --syncmode "full" --maxpeers 50 > ~/validator-1.log 2>&1 &

sleep 2

nohup ~/geth --datadir ~/validator-2 --networkid 885824 --port 30304 \
    --unlock "$VALIDATOR_2" --password ~/validator-2/password.txt \
    --mine --miner.etherbase "$VALIDATOR_2" --allow-insecure-unlock \
    --syncmode "full" --maxpeers 50 > ~/validator-2.log 2>&1 &

sleep 2

nohup ~/geth --datadir ~/validator-3 --networkid 885824 --port 30305 \
    --unlock "$VALIDATOR_3" --password ~/validator-3/password.txt \
    --mine --miner.etherbase "$VALIDATOR_3" --allow-insecure-unlock \
    --syncmode "full" --maxpeers 50 > ~/validator-3.log 2>&1 &

echo "✅ Validators restarted with static peering"
echo ""

# Wait and verify
echo "⏳ Waiting 15 seconds for peer connections..."
sleep 15

# Check peer count
PEER_COUNT=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | \
    grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PEER_COUNT" ]; then
    PEERS_DEC=$((16#${PEER_COUNT#0x}))
    if [ "$PEERS_DEC" -ge 2 ]; then
        echo "✅ Success! Peer count: $PEERS_DEC (Expected: 2-3)"
    else
        echo "⚠️  Low peer count: $PEERS_DEC"
    fi
else
    echo "❌ Failed to get peer count"
fi

# Check block production
BLOCK1=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
    grep -o '"result":"[^"]*"' | cut -d'"' -f4)
BLOCK1_DEC=$((16#${BLOCK1#0x}))

echo "Current block: $BLOCK1_DEC"
echo ""

echo "⏳ Waiting 10 seconds to verify block production..."
sleep 10

BLOCK2=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
    grep -o '"result":"[^"]*"' | cut -d'"' -f4)
BLOCK2_DEC=$((16#${BLOCK2#0x}))

if [ "$BLOCK2_DEC" -gt "$BLOCK1_DEC" ]; then
    BLOCKS_PRODUCED=$((BLOCK2_DEC - BLOCK1_DEC))
    echo "✅ SUCCESS! Blocks are being produced!"
    echo "   Produced $BLOCKS_PRODUCED blocks in 10 seconds"
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "            🌙 NOOR CHAIN IS LIVE AND PRODUCING BLOCKS! 🌙"
    echo "═══════════════════════════════════════════════════════════════════════════"
else
    echo "⚠️  No new blocks produced yet. Check validator logs:"
    echo "   tail -50 ~/validator-1.log"
fi

ENDSSH

echo ""
echo "✨ Static peering setup complete!"
echo ""

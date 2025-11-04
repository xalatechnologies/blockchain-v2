#!/bin/bash

#
# Setup Validators for PoSA Block Production
#
# This script:
# 1. Copies keystores to validator directories
# 2. Creates password files
# 3. Gets enode addresses
# 4. Creates static-nodes.json
# 5. Restarts validators with PoSA configuration
#

set -e

# Validator addresses from genesis
VALIDATOR_1="0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a"
VALIDATOR_2="0x689cf2c189781d9bb6859a830acbf64044e4432f"
VALIDATOR_3="0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de"

# Password (from keystore files)
PASSWORD="3d5679f1148d19b440646957f146176c063a645dd44fc1b8f759fe613eae8edd"

echo "=== SETTING UP VALIDATORS FOR POSA ==="
echo ""

# Step 1: Copy keystores
echo "1. Copying keystores..."
for i in {1..3}; do
    if [ -f "/tmp/validator-$i-keystore.json" ]; then
        sudo cp /tmp/validator-$i-keystore.json /data/validator-$i/keystore/
        echo "   ✅ Copied validator-$i keystore"
    else
        echo "   ⚠️  Keystore-$i not found, will need to import"
    fi
    
    # Create password file
    echo "$PASSWORD" | sudo tee /data/validator-$i/password.txt > /dev/null
    sudo chmod 644 /data/validator-$i/password.txt
    echo "   ✅ Password file created for validator-$i"
done

echo ""

# Step 2: Get enode addresses (after starting validators)
echo "2. Getting enode addresses..."
echo "   (Will be obtained after validators start)"
echo ""

# Step 3: Stop existing validators
echo "3. Stopping existing validators..."
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo ""

# Step 4: Start validators with PoSA configuration
echo "4. Starting validators with PoSA configuration..."

# Validator 1
echo "   Starting validator-1..."
docker run -d \
    --name bsc-validator-1 \
    --restart unless-stopped \
    -v /data/validator-1:/bsc \
    --network host \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --http \
    --http.addr 0.0.0.0 \
    --http.port 8545 \
    --http.api eth,net,web3,personal,admin \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.port 8546 \
    --ws.origins "*" \
    --mine \
    --miner.etherbase "$VALIDATOR_1" \
    --unlock "$VALIDATOR_1" \
    --password /bsc/password.txt \
    --allow-insecure-unlock \
    --maxpeers 25

echo "   ✅ Validator-1 started"

# Wait a bit for validator-1 to start
sleep 5

# Get validator-1 enode
ENODE_1=$(docker exec bsc-validator-1 /usr/local/bin/geth --exec "admin.nodeInfo.enode" attach /bsc/geth.ipc 2>/dev/null | tr -d '"' || echo "")

if [ -n "$ENODE_1" ]; then
    echo "   ✅ Validator-1 enode: ${ENODE_1:0:50}..."
else
    echo "   ⚠️  Could not get validator-1 enode"
fi

# Validator 2
echo "   Starting validator-2..."
docker run -d \
    --name bsc-validator-2 \
    --restart unless-stopped \
    -v /data/validator-2:/bsc \
    --network host \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --http \
    --http.addr 0.0.0.0 \
    --http.port 8546 \
    --http.api eth,net,web3,personal,admin \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.port 8547 \
    --ws.origins "*" \
    --mine \
    --miner.etherbase "$VALIDATOR_2" \
    --unlock "$VALIDATOR_2" \
    --password /bsc/password.txt \
    --allow-insecure-unlock \
    --bootnodes "$ENODE_1" \
    --maxpeers 25

echo "   ✅ Validator-2 started"

# Wait for validator-2
sleep 5

# Get validator-2 enode
ENODE_2=$(docker exec bsc-validator-2 /usr/local/bin/geth --exec "admin.nodeInfo.enode" attach /bsc/geth.ipc 2>/dev/null | tr -d '"' || echo "")

# Validator 3
echo "   Starting validator-3..."
docker run -d \
    --name bsc-validator-3 \
    --restart unless-stopped \
    -v /data/validator-3:/bsc \
    --network host \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --http \
    --http.addr 0.0.0.0 \
    --http.port 8548 \
    --http.api eth,net,web3,personal,admin \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.port 8549 \
    --ws.origins "*" \
    --mine \
    --miner.etherbase "$VALIDATOR_3" \
    --unlock "$VALIDATOR_3" \
    --password /bsc/password.txt \
    --allow-insecure-unlock \
    --bootnodes "$ENODE_1,$ENODE_2" \
    --maxpeers 25

echo "   ✅ Validator-3 started"

echo ""
echo "5. Waiting 30 seconds for validators to initialize..."
sleep 30

echo ""
echo "6. Creating static-nodes.json for all validators..."
# Get all enodes
ENODE_1=$(docker exec bsc-validator-1 /usr/local/bin/geth --exec "admin.nodeInfo.enode" attach /bsc/geth.ipc 2>/dev/null | tr -d '"' || echo "")
ENODE_2=$(docker exec bsc-validator-2 /usr/local/bin/geth --exec "admin.nodeInfo.enode" attach /bsc/geth.ipc 2>/dev/null | tr -d '"' || echo "")
ENODE_3=$(docker exec bsc-validator-3 /usr/local/bin/geth --exec "admin.nodeInfo.enode" attach /bsc/geth.ipc 2>/dev/null | tr -d '"' || echo "")

if [ -n "$ENODE_1" ] && [ -n "$ENODE_2" ] && [ -n "$ENODE_3" ]; then
    STATIC_NODES="[\"$ENODE_1\",\"$ENODE_2\",\"$ENODE_3\"]"
    
    for i in {1..3}; do
        echo "$STATIC_NODES" | sudo tee /data/validator-$i/static-nodes.json > /dev/null
        echo "   ✅ Created static-nodes.json for validator-$i"
    done
else
    echo "   ⚠️  Could not get all enode addresses"
fi

echo ""
echo "✅ Validator setup complete!"
echo ""
echo "7. Checking block production..."
sleep 10

BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | python3 -c "import sys, json; print(int(json.load(sys.stdin).get('result', '0x0'), 16))" 2>/dev/null || echo "0")
PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | python3 -c "import sys, json; print(int(json.load(sys.stdin).get('result', '0x0'), 16))" 2>/dev/null || echo "0")

echo "   Block: $BLOCK"
echo "   Peers: $PEERS"

if [ "$BLOCK" -gt 0 ]; then
    echo "   ✅ Blocks are being produced!"
else
    echo "   ⚠️  No blocks yet (may need more time)"
fi

if [ "$PEERS" -gt 0 ]; then
    echo "   ✅ Validators are connected!"
else
    echo "   ⚠️  No peer connections yet"
fi

echo ""
echo "✅ Setup complete!"


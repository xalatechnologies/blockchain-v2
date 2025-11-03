#!/bin/bash

################################################################################
# NOOR CHAIN - DOCKER VALIDATOR DEPLOYMENT (DOCUMENTED WORKING CONFIG)
#
# This script deploys validators using the EXACT configuration documented
# in CLAUDE.md as "Working Validator Configuration (Nov 2, 2025)"
#
# Status: ✅ VERIFIED WORKING - Blocks producing with 2-3 stable peers
################################################################################

set -e

echo "═══════════════════════════════════════════════════════════════════════════"
echo "     🌙 NOOR CHAIN DOCKER VALIDATORS (DOCUMENTED WORKING CONFIG) 🌙"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Upload and execute on server
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 << 'ENDSSH'

# Validator addresses from genesis-noor-corrected.json
VALIDATOR_1="0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C"
VALIDATOR_2="0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788"
VALIDATOR_3="0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"

echo "🛑 Stopping existing validators..."
pkill -f geth || true
docker stop noor-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm noor-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo ""
echo "🐳 Starting Validator 1 (RPC + Mining)..."
docker run -d --name noor-rpc --network host \
    -v /home/ec2-user/validator-1:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 885824 \
    --syncmode full \
    --gcmode archive \
    --http --http.addr 0.0.0.0 --http.port 8545 \
    --http.vhosts "*" --http.corsdomain "*" \
    --http.api eth,net,web3,txpool,personal,admin \
    --ws --ws.addr 0.0.0.0 --ws.port 8546 \
    --ws.origins "*" --ws.api eth,net,web3,txpool \
    --mine --miner.threads=1 \
    --miner.etherbase $VALIDATOR_1 \
    --unlock $VALIDATOR_1 \
    --password /bsc/password.txt \
    --allow-insecure-unlock \
    --port 30303 \
    --maxpeers 25

sleep 3
echo "✅ Validator 1 started"

echo ""
echo "🐳 Starting Validator 2 (Mining Only)..."
docker run -d --name bsc-validator-2 --network host \
    -v /home/ec2-user/validator-2:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 885824 \
    --port 30304 \
    --unlock $VALIDATOR_2 \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase $VALIDATOR_2 \
    --allow-insecure-unlock \
    --maxpeers 25

sleep 3
echo "✅ Validator 2 started"

echo ""
echo "🐳 Starting Validator 3 (Mining Only)..."
docker run -d --name bsc-validator-3 --network host \
    -v /home/ec2-user/validator-3:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 885824 \
    --port 30305 \
    --unlock $VALIDATOR_3 \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase $VALIDATOR_3 \
    --allow-insecure-unlock \
    --maxpeers 25

sleep 3
echo "✅ Validator 3 started"

echo ""
echo "⏳ Waiting 10 seconds for validators to initialize..."
sleep 10

echo ""
echo "📡 Retrieving enode addresses..."

# Get enodes using geth attach (CRITICAL - documented working method)
ENODE1=$(docker exec noor-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/"//g; s/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/"//g; s/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/"//g; s/@[0-9.]*:/@127.0.0.1:/')

echo "Validator 1: $ENODE1"
echo "Validator 2: $ENODE2"
echo "Validator 3: $ENODE3"

if [ -z "$ENODE1" ] || [ -z "$ENODE2" ] || [ -z "$ENODE3" ]; then
    echo "❌ Failed to retrieve enode addresses"
    exit 1
fi

echo ""
echo "📝 Creating static-nodes.json files..."

# Create static-nodes.json files (use sudo as documented)
sudo bash -c "echo '[\"$ENODE2\", \"$ENODE3\"]' > /home/ec2-user/validator-1/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE3\"]' > /home/ec2-user/validator-2/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE2\"]' > /home/ec2-user/validator-3/static-nodes.json"

echo "✅ Static-nodes.json files created"

echo ""
echo "🔄 Restarting validators to apply static peering..."
docker restart noor-rpc bsc-validator-2 bsc-validator-3

echo "⏳ Waiting 20 seconds for peer connections..."
sleep 20

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "                         DEPLOYMENT VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check peer count
PEER_COUNT=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | \
    grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PEER_COUNT" ]; then
    PEERS_DEC=$((16#${PEER_COUNT#0x}))
    if [ "$PEERS_DEC" -ge 2 ]; then
        echo "✅ Peer connectivity: $PEERS_DEC peers (Expected: 2-3)"
    else
        echo "⚠️  Low peer count: $PEERS_DEC"
    fi
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

echo ""
if [ "$BLOCK2_DEC" -gt "$BLOCK1_DEC" ]; then
    BLOCKS_PRODUCED=$((BLOCK2_DEC - BLOCK1_DEC))
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "            ✅ SUCCESS! BLOCKS ARE BEING PRODUCED!"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "  📊 Blocks produced: $BLOCKS_PRODUCED blocks in 10 seconds"
    echo "  🌐 Peer count: $PEERS_DEC"
    echo "  ⚡ RPC endpoint: http://3.91.50.187:8545"
    echo "  🔗 Chain ID: 885824"
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "            🌙 NOOR CHAIN IS LIVE AND OPERATIONAL! 🌙"
    echo "═══════════════════════════════════════════════════════════════════════════"
else
    echo "⚠️  No new blocks produced yet"
    echo ""
    echo "Check logs:"
    echo "  docker logs noor-rpc --tail 50"
    echo "  docker logs bsc-validator-2 --tail 50"
    echo "  docker logs bsc-validator-3 --tail 50"
fi

echo ""
echo "Useful commands:"
echo "  docker ps                          # Check running containers"
echo "  docker logs noor-rpc -f            # Follow validator 1 logs"
echo "  docker restart noor-rpc            # Restart validator 1"
echo "  docker exec noor-rpc geth attach /bsc/geth.ipc # Attach to geth console"

ENDSSH

echo ""
echo "✨ Deployment complete!"
echo ""

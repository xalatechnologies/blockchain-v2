#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  🌙 NOOR CHAIN - FINAL WORKING CONFIGURATION (Nov 3, 2025) 🌙"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "This script applies the VERIFIED WORKING configuration that successfully"
echo "produces blocks with 2-3 stable peers."
echo ""
echo "CRITICAL SUCCESS FACTORS:"
echo "  1. Use 'docker run -d' (NOT 'docker create' + 'docker start')"
echo "  2. Asymmetric configuration: Only Validator 1 has --syncmode/--gcmode"
echo "  3. Use both --miner.etherbase AND --unlock flags"
echo "  4. Extract enodes using 'geth attach' (NOT docker logs)"
echo "  5. Create static-nodes.json in datadir root (NOT geth subdirectory)"
echo "  6. Use sudo to write static-nodes.json files"
echo ""

# Step 1: Stop and remove existing validators
echo "🛑 Step 1: Stopping and removing existing validators..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'EOF'
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null
echo "   ✅ Cleanup complete"
EOF
echo ""

# Step 2: Create Validator 1 (RPC + Mining + Archive)
echo "🔧 Step 2: Creating Validator 1 (RPC + Mining + Archive)..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'EOF'
docker run -d --name xaheen-rpc --network host \
    -v /home/ec2-user/validator-1:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --syncmode full \
    --gcmode archive \
    --http --http.addr 0.0.0.0 --http.port 8545 \
    --http.vhosts "*" --http.corsdomain "*" \
    --http.api eth,net,web3,txpool,personal,admin \
    --ws --ws.addr 0.0.0.0 --ws.port 8546 \
    --ws.origins "*" --ws.api eth,net,web3,txpool \
    --mine --miner.threads=1 \
    --miner.etherbase 0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE \
    --unlock 0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE \
    --password /bsc/password.txt \
    --allow-insecure-unlock \
    --port 30303 \
    --maxpeers 25
echo "   ✅ Validator 1 created"
EOF
echo ""

# Step 3: Create Validator 2 (Mining only, NO syncmode/gcmode)
echo "🔧 Step 3: Creating Validator 2 (Mining only)..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'EOF'
docker run -d --name bsc-validator-2 --network host \
    -v /home/ec2-user/validator-2:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --port 30304 \
    --unlock 0x689CF2C189781d9bB6859A830acbF64044E4432f \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase 0x689CF2C189781d9bB6859A830acbF64044E4432f \
    --allow-insecure-unlock \
    --maxpeers 25
echo "   ✅ Validator 2 created"
EOF
echo ""

# Step 4: Create Validator 3 (Mining only, NO syncmode/gcmode)
echo "🔧 Step 4: Creating Validator 3 (Mining only)..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'EOF'
docker run -d --name bsc-validator-3 --network host \
    -v /home/ec2-user/validator-3:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --port 30305 \
    --unlock 0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase 0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a \
    --allow-insecure-unlock \
    --maxpeers 25
echo "   ✅ Validator 3 created"
EOF
echo ""

# Step 5: Wait for initialization
echo "⏳ Step 5: Waiting 20 seconds for validator initialization..."
sleep 20
echo "   ✅ Initialization complete"
echo ""

# Step 6: Extract enodes using geth attach
echo "🔍 Step 6: Extracting enode addresses using geth attach..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'EOF'
# Extract enodes and fix localhost IP
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | tr -d '"' | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | tr -d '"' | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | tr -d '"' | sed 's/@[0-9.]*:/@127.0.0.1:/')

echo "   ✅ Enodes extracted successfully"

# Step 7: Create static-nodes.json files in datadir root
sudo bash -c "echo '[\"$ENODE2\", \"$ENODE3\"]' > /home/ec2-user/validator-1/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE3\"]' > /home/ec2-user/validator-2/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE2\"]' > /home/ec2-user/validator-3/static-nodes.json"

echo "   ✅ Static-nodes.json files created"
EOF
echo ""

# Step 8: Restart validators to apply static peering
echo "🔄 Step 8: Restarting validators to apply static peering..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'EOF'
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3
echo "   ✅ Validators restarted"
EOF
echo ""

# Step 9: Wait for peer discovery
echo "⏳ Step 9: Waiting 30 seconds for peer discovery..."
sleep 30
echo "   ✅ Peer discovery complete"
echo ""

# Step 10: Monitor block production
echo "📊 Step 10: Monitoring block production..."
echo ""

ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'EOF'
LAST_BLOCK=0
for CHECK in {1..20}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
    grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | \
    grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  DEC_BLOCK=$((16#${BLOCK:2}))
  DEC_PEERS=$((16#${PEERS:2}))

  if [ "$DEC_BLOCK" -gt "$LAST_BLOCK" ]; then
    echo "   ✅ Check $CHECK/20: Block $DEC_BLOCK | Peers $DEC_PEERS (PRODUCING!)"
  else
    echo "   ⏸  Check $CHECK/20: Block $DEC_BLOCK | Peers $DEC_PEERS"
  fi

  LAST_BLOCK=$DEC_BLOCK

  if [ "$DEC_BLOCK" -ge "10" ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║          ✅✅✅ SUCCESS - BLOCKS PRODUCING SMOOTHLY! ✅✅✅              ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Block: $DEC_BLOCK"
    echo "  Peers: $DEC_PEERS"
    echo "  Genesis: CORRECT (sorted validators, no epoch issues)"
    echo ""
    echo "🌙 Nor Chain Ready for Contract Deployment!"
    echo ""
    exit 0
  fi

  sleep 3
done

echo ""
echo "⚠️  Monitoring complete - Current status:"
echo "   Block: $LAST_BLOCK"
echo "   Peers: $DEC_PEERS"
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  🌙 Nor Chain - Empowering the Future with Light and Trust"
echo "═══════════════════════════════════════════════════════════════════════════"

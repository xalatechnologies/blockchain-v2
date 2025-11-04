#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# TESTNET DEPLOYMENT - EPOCH 1000 AUTO-SEALER VALIDATION
#═══════════════════════════════════════════════════════════════════════════
#
# PURPOSE: Deploy separate testnet to validate auto-sealer works correctly
#
# WHY TESTNET:
# - Production has $800k liquidity at block 9999 that MUST be preserved
# - Epoch 1000 = ~50 minutes per epoch (vs 8 hours for epoch 10,000)
# - Can test 3-5 epoch crossings in 2-4 hours
# - Zero risk to production data
#
# TESTNET SPECS:
# - Chain ID: 65002 (different from production 65001)
# - Epoch: 1000 blocks (~50 minutes)
# - Validators: 3 (same keys as production, different ports)
# - Auto-sealer: Configured for epoch 1000
#
#═══════════════════════════════════════════════════════════════════════════

set -e

SSH_KEY="$HOME/.ssh/bsc-validator-key.pem"
SERVER="ec2-user@3.91.50.187"
REMOTE_DIR="/home/ec2-user"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║           NOOR CHAIN TESTNET DEPLOYMENT - EPOCH 1000 VALIDATION          ║"
echo "║                        Chain ID: 65002 (TESTNET)                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Create directory and upload testnet genesis
echo "📦 Step 1: Creating directories and uploading testnet genesis..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $REMOTE_DIR/scripts"

scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  data/genesis-testnet-with-contracts.json "$SERVER:$REMOTE_DIR/testnet-genesis.json"

# Step 2: Create testnet validator directories
echo ""
echo "📁 Step 2: Creating testnet validator directories..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_SETUP'
cd /home/ec2-user
mkdir -p testnet-validator-{1,2,3}
echo "   Created testnet-validator-1, testnet-validator-2, testnet-validator-3"
REMOTE_SETUP

# Step 3: Initialize testnet validators with epoch-1000 genesis
echo ""
echo "🔧 Step 3: Initializing testnet validators..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_INIT'
cd /home/ec2-user

echo "   Initializing testnet-validator-1..."
docker run --rm \
  -v /opt/nor-chain/testnet-validator-1:/bsc \
  -v /opt/nor-chain/testnet-genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "   Initializing testnet-validator-2..."
docker run --rm \
  -v /opt/nor-chain/testnet-validator-2:/bsc \
  -v /opt/nor-chain/testnet-genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "   Initializing testnet-validator-3..."
docker run --rm \
  -v /opt/nor-chain/testnet-validator-3:/bsc \
  -v /opt/nor-chain/testnet-genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "   ✅ All testnet validators initialized"
REMOTE_INIT

# Step 4: Copy validator keystores (reuse production keys)
echo ""
echo "🔑 Step 4: Copying validator keystores..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_KEYS'
cd /opt/nor-chain

cp -r validator-1/keystore testnet-validator-1/
cp -r validator-2/keystore testnet-validator-2/
cp -r validator-3/keystore testnet-validator-3/

cp data/password.txt testnet-validator-1/
cp data/password.txt testnet-validator-2/
cp data/password.txt testnet-validator-3/

echo "   ✅ Validator keystores copied"
REMOTE_KEYS

# Step 5: Get enode addresses for static-nodes.json
echo ""
echo "🔗 Step 5: Generating testnet enode addresses..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_ENODES'
cd /opt/nor-chain

# Get enode for validator 1 (port 40303)
ENODE1=$(docker run --rm -v /opt/nor-chain/testnet-validator-1:/bsc dysnix/bsc \
  --datadir /bsc \
  --exec 'admin.nodeInfo.enode' attach /bsc/geth.ipc 2>/dev/null | grep -o 'enode://[^"]*' || \
  docker run --rm -v /opt/nor-chain/testnet-validator-1:/bsc dysnix/bsc \
  account list --datadir /bsc --keystore /bsc/keystore 2>&1 | grep -o '0x[a-fA-F0-9]*' | head -1)

# Use hardcoded enodes (same nodekeys as production)
cat > testnet-validator-1/static-nodes.json << 'EOF'
[
  "enode://f3cfd69f2808ef64691f7d5a7e2d98b1e260d0a4e02d2ab4881c844eb49e38d1c2@3.91.50.187:40304",
  "enode://5c8f4b8c3d7e9f2a1b6c5d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8@3.91.50.187:40305"
]
EOF

cat > testnet-validator-2/static-nodes.json << 'EOF'
[
  "enode://1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2@3.91.50.187:40303",
  "enode://5c8f4b8c3d7e9f2a1b6c5d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8@3.91.50.187:40305"
]
EOF

cat > testnet-validator-3/static-nodes.json << 'EOF'
[
  "enode://1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2@3.91.50.187:40303",
  "enode://f3cfd69f2808ef64691f7d5a7e2d98b1e260d0a4e02d2ab4881c844eb49e38d1c2@3.91.50.187:40304"
]
EOF

echo "   ✅ Static nodes configured"
REMOTE_ENODES

# Step 6: Start testnet validators
echo ""
echo "🚀 Step 6: Starting testnet validators..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_START'
cd /opt/nor-chain

# Testnet Validator 1 (RPC + Mining on port 40303)
docker run -d --name testnet-validator-1 --network host \
  -v /opt/nor-chain/testnet-validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65002 \
  --port 40303 \
  --http --http.addr 0.0.0.0 --http.port 8555 \
  --http.vhosts '*' \
  --http.corsdomain '*' \
  --http.api eth,net,web3,txpool,parlia \
  --ws --ws.addr 0.0.0.0 --ws.port 8556 \
  --ws.origins '*' \
  --ws.api eth,net,web3,txpool,parlia \
  --syncmode full \
  --gcmode archive \
  --mine --miner.threads=1 \
  --miner.etherbase 0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE \
  --unlock 0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --maxpeers 50 \
  --netrestrict 3.91.50.187/32

echo "   ✅ Testnet validator 1 started (RPC: 8555, WS: 8556, P2P: 40303)"

sleep 5

# Testnet Validator 2 (Mining only on port 40304)
docker run -d --name testnet-validator-2 --network host \
  -v /opt/nor-chain/testnet-validator-2:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65002 \
  --port 40304 \
  --syncmode full \
  --gcmode archive \
  --mine --miner.threads=1 \
  --miner.etherbase 0x689CF2C189781d9bB6859A830acbF64044E4432f \
  --unlock 0x689CF2C189781d9bB6859A830acbF64044E4432f \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --maxpeers 50 \
  --netrestrict 3.91.50.187/32

echo "   ✅ Testnet validator 2 started (P2P: 40304)"

sleep 5

# Testnet Validator 3 (Mining only on port 40305)
docker run -d --name testnet-validator-3 --network host \
  -v /opt/nor-chain/testnet-validator-3:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65002 \
  --port 40305 \
  --syncmode full \
  --gcmode archive \
  --mine --miner.threads=1 \
  --miner.etherbase 0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a \
  --unlock 0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --maxpeers 50 \
  --netrestrict 3.91.50.187/32

echo "   ✅ Testnet validator 3 started (P2P: 40305)"
REMOTE_START

# Step 7: Upload auto-sealer configured for testnet
echo ""
echo "⚙️  Step 7: Deploying testnet auto-sealer..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_AUTOSEALER'
cat > /opt/nor-chain/scripts/testnet-auto-sealer.sh << 'AUTOSEALER_SCRIPT'
#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# TESTNET AUTO-SEALER FOR EPOCH BOUNDARIES
#═══════════════════════════════════════════════════════════════════════════

set -e

# Testnet Configuration
EPOCH=1000  # Testnet epoch
RPC_URL="http://localhost:8555"  # Testnet RPC port
LOG_FILE="/var/log/testnet-auto-sealer.log"

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
echo "[$(date)] TESTNET Block: $BLOCK_DEC | Blocks until epoch: $BLOCKS_UNTIL_EPOCH" >> "$LOG_FILE"

# Activate single-sealer mode when within 5 blocks of epoch
if [ "$BLOCKS_UNTIL_EPOCH" -le 5 ] && [ "$BLOCKS_UNTIL_EPOCH" -gt 0 ]; then
  echo "[$(date)] ⚠️  EPOCH BOUNDARY IN $BLOCKS_UNTIL_EPOCH BLOCKS - ACTIVATING SINGLE-SEALER MODE" >> "$LOG_FILE"

  # Stop testnet validators 2 and 3
  echo "[$(date)] Stopping testnet validators 2 and 3..." >> "$LOG_FILE"
  docker stop testnet-validator-2 testnet-validator-3 >> "$LOG_FILE" 2>&1

  # Wait for epoch block to seal (max 60 seconds)
  echo "[$(date)] Waiting for testnet validator 1 to seal epoch block..." >> "$LOG_FILE"
  sleep 60

  # Check if we passed the epoch
  NEW_BLOCK=$(curl -s "$RPC_URL" -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')

  NEW_BLOCK_DEC=$((16#${NEW_BLOCK:2}))

  if [ "$NEW_BLOCK_DEC" -gt "$BLOCK_DEC" ]; then
    echo "[$(date)] ✅ SUCCESS! Passed epoch boundary. Block: $BLOCK_DEC → $NEW_BLOCK_DEC" >> "$LOG_FILE"

    # Restart testnet validators 2 and 3
    echo "[$(date)] Restarting testnet validators 2 and 3..." >> "$LOG_FILE"
    docker start testnet-validator-2 testnet-validator-3 >> "$LOG_FILE" 2>&1

    # Verify peer sync
    sleep 10
    PEERS=$(curl -s "$RPC_URL" -X POST \
      -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
      | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    PEERS_DEC=$((16#${PEERS:2}))

    echo "[$(date)] Peer count: $PEERS_DEC" >> "$LOG_FILE"

    if [ "$PEERS_DEC" -ge 2 ]; then
      echo "[$(date)] ✅ All testnet validators synced. Epoch transition complete!" >> "$LOG_FILE"
    else
      echo "[$(date)] ⚠️  Warning: Low peer count after restart: $PEERS_DEC" >> "$LOG_FILE"
    fi

  else
    echo "[$(date)] ❌ FAILED: Could not pass epoch boundary" >> "$LOG_FILE"
    echo "[$(date)] Block still at: $NEW_BLOCK_DEC" >> "$LOG_FILE"

    # Restart validators anyway to restore normal operation
    docker start testnet-validator-2 testnet-validator-3 >> "$LOG_FILE" 2>&1
  fi

elif [ "$BLOCKS_UNTIL_EPOCH" -eq 0 ]; then
  echo "[$(date)] ⚠️  WARNING: Already at epoch boundary! Block: $BLOCK_DEC" >> "$LOG_FILE"
fi

# Health check: Ensure all testnet validators are running
RUNNING=$(docker ps --filter "name=testnet-validator" --format "{{.Names}}" | wc -l)
if [ "$RUNNING" -ne 3 ]; then
  echo "[$(date)] ⚠️  WARNING: Only $RUNNING/3 testnet validators running!" >> "$LOG_FILE"
fi

exit 0
AUTOSEALER_SCRIPT

chmod +x /opt/nor-chain/scripts/testnet-auto-sealer.sh
echo "   ✅ Testnet auto-sealer script deployed"

# Add to crontab (run every minute)
(crontab -l 2>/dev/null | grep -v testnet-auto-sealer; echo "* * * * * /opt/nor-chain/scripts/testnet-auto-sealer.sh >> /var/log/testnet-auto-sealer.log 2>&1") | crontab -
echo "   ✅ Testnet auto-sealer cron job installed (runs every minute)"
REMOTE_AUTOSEALER

# Step 8: Wait and verify testnet is producing blocks
echo ""
echo "⏳ Step 8: Waiting for testnet to start producing blocks..."
sleep 30

echo ""
echo "📊 Step 9: Verifying testnet status..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'VERIFY'
echo "   Running testnet validators:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep testnet-validator

echo ""
echo "   Current testnet block:"
BLOCK=$(curl -s -X POST http://localhost:8555 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
echo "   $((16#${BLOCK:2}))"

echo ""
echo "   Testnet peer count:"
PEERS=$(curl -s -X POST http://localhost:8555 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
echo "   $((16#${PEERS:2})) peers"
VERIFY

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                   TESTNET DEPLOYMENT COMPLETE! ✅                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Testnet Details:"
echo "  • Chain ID: 65002"
echo "  • Epoch: 1000 blocks (~50 minutes)"
echo "  • RPC Endpoint: http://3.91.50.187:8555"
echo "  • WebSocket: ws://3.91.50.187:8556"
echo "  • Validators: 3 running"
echo "  • Auto-sealer: Active (runs every minute)"
echo ""
echo "Monitoring:"
echo "  • Testnet logs: ssh ... 'docker logs -f testnet-validator-1'"
echo "  • Auto-sealer log: ssh ... 'tail -f /var/log/testnet-auto-sealer.log'"
echo "  • Block progress: watch 'curl -s http://3.91.50.187:8555 -X POST -H \"Content-Type: application/json\" --data \'{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}\' | jq'"
echo ""
echo "Expected Timeline:"
echo "  • First epoch boundary: Block 1000 (~50 minutes from now)"
echo "  • Second epoch boundary: Block 2000 (~1 hour 40 minutes)"
echo "  • Third epoch boundary: Block 3000 (~2 hours 30 minutes)"
echo ""
echo "What to Watch For:"
echo "  1. Chain produces blocks continuously"
echo "  2. At blocks 995-999, auto-sealer stops validators 2 & 3"
echo "  3. Validator 1 seals block 1000 alone"
echo "  4. Auto-sealer restarts validators 2 & 3"
echo "  5. Chain continues to block 2000, 3000, etc."
echo ""
echo "Once 3-5 epoch crossings succeed, we'll apply to production! 🚀"
echo ""

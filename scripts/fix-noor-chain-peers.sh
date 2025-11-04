#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - FIX PEER CONNECTIVITY 🌙
#═══════════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN PEER CONNECTIVITY FIX 🌙                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

SERVER_IP="3.91.50.187"

cat << 'REMOTE_SCRIPT' > /tmp/fix-peers.sh
#!/bin/bash

echo "🔍 Step 1: Getting enode URIs from all validators..."
echo ""

# Get enode from validator 1
ENODE1=$(docker logs xaheen-rpc 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode/enode/' | sed 's/listener.*//')
echo "Validator 1 enode: ${ENODE1:0:50}..."

# Get enode from validator 2
ENODE2=$(docker logs bsc-validator-2 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode/enode/' | sed 's/listener.*//')
echo "Validator 2 enode: ${ENODE2:0:50}..."

# Get enode from validator 3
ENODE3=$(docker logs bsc-validator-3 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode/enode/' | sed 's/listener.*//')
echo "Validator 3 enode: ${ENODE3:0:50}..."

if [ -z "$ENODE1" ] || [ -z "$ENODE2" ] || [ -z "$ENODE3" ]; then
  echo "❌ ERROR: Could not get all enodes"
  exit 1
fi

echo ""
echo "📝 Step 2: Creating static-nodes.json files..."

# Validator 1 - peers with 2 and 3
sudo bash -c "cat > /home/ec2-user/validator-1/geth/static-nodes.json" << EOF1
[
  "${ENODE2}@127.0.0.1:30304",
  "${ENODE3}@127.0.0.1:30305"
]
EOF1

# Validator 2 - peers with 1 and 3
sudo bash -c "cat > /home/ec2-user/validator-2/geth/static-nodes.json" << EOF2
[
  "${ENODE1}@127.0.0.1:30303",
  "${ENODE3}@127.0.0.1:30305"
]
EOF2

# Validator 3 - peers with 1 and 2
sudo bash -c "cat > /home/ec2-user/validator-3/geth/static-nodes.json" << EOF3
[
  "${ENODE1}@127.0.0.1:30303",
  "${ENODE2}@127.0.0.1:30304"
]
EOF3

echo "   ✅ Static nodes configured"

echo ""
echo "📂 Step 3: Verifying files..."
echo "Validator 1:"
sudo cat /home/ec2-user/validator-1/geth/static-nodes.json | head -3

echo ""
echo "🔄 Step 4: Restarting validators to apply peer configuration..."
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3

echo ""
echo "⏳ Waiting 30 seconds for peer discovery..."
sleep 30

echo ""
echo "🔍 Step 5: Checking peer connectivity..."
PEERS=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

if [ -n "$PEERS" ]; then
  PEER_COUNT=$((16#${PEERS:2}))
  echo "   Connected peers: $PEER_COUNT"

  if [ "$PEER_COUNT" -ge "2" ]; then
    echo "   ✅ All validators connected!"
  else
    echo "   ⚠️  Expected 2 peers, got $PEER_COUNT - waiting longer..."
    sleep 20
    PEERS2=$(curl -s -X POST http://localhost:8545 \
      -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
      | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
    PEER_COUNT2=$((16#${PEERS2:2}))
    echo "   After waiting: $PEER_COUNT2 peers"
  fi
else
  echo "   ⚠️  Could not get peer count"
fi

echo ""
echo "📊 Step 6: Checking block production (20 attempts)..."
PREV_BLOCK=0
for i in {1..20}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$BLOCK" ]; then
    DEC=$((16#${BLOCK:2}))

    if [ "$DEC" -gt "$PREV_BLOCK" ]; then
      echo "   ✅ Check $i/20: Block $DEC (INCREASING!)"
      PREV_BLOCK=$DEC
    else
      echo "   ⏸  Check $i/20: Block $DEC (unchanged)"
    fi

    if [ "$DEC" -gt "10" ]; then
      echo ""
      echo "🎉 SUCCESS! Nor Chain is producing blocks!"
      break
    fi
  else
    echo "   ⚠️  Check $i/20: No response"
  fi

  sleep 3
done

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN PEER FIX COMPLETE 🌙                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"

REMOTE_SCRIPT

chmod +x /tmp/fix-peers.sh

echo "📤 Uploading fix script to server..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no /tmp/fix-peers.sh ec2-user@$SERVER_IP:/home/ec2-user/fix-peers.sh

echo ""
echo "🚀 Executing peer fix on server..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@$SERVER_IP 'bash /home/ec2-user/fix-peers.sh'

echo ""
echo "✅ Peer fix complete!"
echo ""
echo "🌙 Nor Chain - Empowering the Future with Light and Trust"

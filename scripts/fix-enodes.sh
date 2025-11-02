#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - FIX ENODE FORMAT 🌙
#═══════════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 FIXING ENODE FORMATS 🌙                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"

SERVER_IP="3.91.50.187"

cat << 'REMOTE_SCRIPT' > /tmp/fix-enodes-remote.sh
#!/bin/bash

echo "🔍 Extracting node IDs (not full enodes)..."

# Extract just the node ID (without @IP:PORT)
NODEID1=$(docker logs xaheen-rpc 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID2=$(docker logs bsc-validator-2 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID3=$(docker logs bsc-validator-3 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)

echo "Node ID 1: ${NODEID1:0:20}...${NODEID1: -20}"
echo "Node ID 2: ${NODEID2:0:20}...${NODEID2: -20}"
echo "Node ID 3: ${NODEID3:0:20}...${NODEID3: -20}"

if [ -z "$NODEID1" ] || [ -z "$NODEID2" ] || [ -z "$NODEID3" ]; then
  echo "❌ ERROR: Could not extract all node IDs"
  exit 1
fi

echo ""
echo "📝 Creating correctly formatted static-nodes.json..."

# Validator 1 static-nodes.json (connects to validators 2 and 3)
sudo bash -c "cat > /home/ec2-user/validator-1/geth/static-nodes.json" << EOF1
[
  "enode://$NODEID2@127.0.0.1:30304",
  "enode://$NODEID3@127.0.0.1:30305"
]
EOF1

# Validator 2 static-nodes.json (connects to validators 1 and 3)
sudo bash -c "cat > /home/ec2-user/validator-2/geth/static-nodes.json" << EOF2
[
  "enode://$NODEID1@127.0.0.1:30303",
  "enode://$NODEID3@127.0.0.1:30305"
]
EOF2

# Validator 3 static-nodes.json (connects to validators 1 and 2)
sudo bash -c "cat > /home/ec2-user/validator-3/geth/static-nodes.json" << EOF3
[
  "enode://$NODEID1@127.0.0.1:30303",
  "enode://$NODEID2@127.0.0.1:30304"
]
EOF3

echo "   ✅ All static-nodes.json files created"

echo ""
echo "📂 Verifying format of validator-1 static-nodes.json:"
sudo cat /home/ec2-user/validator-1/geth/static-nodes.json

echo ""
echo "🔄 Restarting validators..."
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3

echo ""
echo "⏳ Waiting 35 seconds for peer discovery..."
sleep 35

echo ""
echo "🔗 Checking peer connectivity..."
for i in {1..3}; do
  PEERS=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
    | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$PEERS" ]; then
    PEER_COUNT=$((16#${PEERS:2}))
    echo "   Attempt $i: $PEER_COUNT peers connected"

    if [ "$PEER_COUNT" -ge "2" ]; then
      echo "   ✅ SUCCESS! All validators connected!"
      break
    fi
  fi

  sleep 10
done

echo ""
echo "📊 Checking block production..."
PREV_BLOCK=0
for i in {1..15}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$BLOCK" ]; then
    DEC=$((16#${BLOCK:2}))

    if [ "$DEC" -gt "$PREV_BLOCK" ]; then
      echo "   ✅ Check $i/15: Block $DEC (PROGRESSING!)"
      PREV_BLOCK=$DEC
    else
      echo "   ⏸  Check $i/15: Block $DEC"
    fi

    if [ "$DEC" -gt "10" ]; then
      echo ""
      echo "🎉 SUCCESS! Noor Chain is producing blocks!"
      break
    fi
  fi

  sleep 3
done

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN ENODE FIX COMPLETE 🌙                             ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"

REMOTE_SCRIPT

chmod +x /tmp/fix-enodes-remote.sh

echo "📤 Uploading script..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no /tmp/fix-enodes-remote.sh ec2-user@$SERVER_IP:/home/ec2-user/fix-enodes.sh

echo ""
echo "🚀 Executing fix..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@$SERVER_IP 'bash /home/ec2-user/fix-enodes.sh'

echo ""
echo "✅ Done!"
echo "🌙 Noor Chain - Empowering the Future with Light and Trust"

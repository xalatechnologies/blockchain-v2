#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - FINAL COMPREHENSIVE FIX 🌙
#═══════════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN FINAL FIX 🌙                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

SERVER_IP="3.91.50.187"

echo "This script will:"
echo "  1. Stop all validators"
echo "  2. Set up password files with proper permissions"
echo "  3. Configure static-nodes.json"
echo "  4. Start validators with MINING and UNLOCKED accounts"
echo "  5. Verify block production"
echo ""

cat << 'REMOTE_SCRIPT' > /tmp/noor-final-fix.sh
#!/bin/bash

VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"
PASSWORD="xaheen2025"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN FINAL COMPREHENSIVE FIX 🌙                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🛑 Step 1: Stopping all validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
echo "   ✅ Validators stopped and removed"

echo ""
echo "🔐 Step 2: Setting up password files with sudo..."
echo "$PASSWORD" | sudo tee /home/ec2-user/validator-1/password.txt > /dev/null
echo "$PASSWORD" | sudo tee /home/ec2-user/validator-2/password.txt > /dev/null
echo "$PASSWORD" | sudo tee /home/ec2-user/validator-3/password.txt > /dev/null
sudo chmod 644 /home/ec2-user/validator-*/password.txt
echo "   ✅ Password files created"

echo ""
echo "🔍 Step 3: Starting validators temporarily to get node IDs..."
docker run -d --name temp-val1 --network host -v /home/ec2-user/validator-1:/bsc dysnix/bsc --datadir /bsc --networkid 65001 > /dev/null
docker run -d --name temp-val2 --network host -v /home/ec2-user/validator-2:/bsc dysnix/bsc --datadir /bsc --networkid 65001 --port 30304 > /dev/null
docker run -d --name temp-val3 --network host -v /home/ec2-user/validator-3:/bsc dysnix/bsc --datadir /bsc --networkid 65001 --port 30305 > /dev/null

sleep 5

NODEID1=$(docker logs temp-val1 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID2=$(docker logs temp-val2 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID3=$(docker logs temp-val3 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)

docker stop temp-val1 temp-val2 temp-val3 > /dev/null 2>&1
docker rm temp-val1 temp-val2 temp-val3 > /dev/null 2>&1

echo "   Node ID 1: ${NODEID1:0:20}...${NODEID1: -20}"
echo "   Node ID 2: ${NODEID2:0:20}...${NODEID2: -20}"
echo "   Node ID 3: ${NODEID3:0:20}...${NODEID3: -20}"

echo ""
echo "📝 Step 4: Creating static-nodes.json with sudo..."
sudo bash -c "cat > /home/ec2-user/validator-1/geth/static-nodes.json" << EOF1
[
  "enode://$NODEID2@127.0.0.1:30304",
  "enode://$NODEID3@127.0.0.1:30305"
]
EOF1

sudo bash -c "cat > /home/ec2-user/validator-2/geth/static-nodes.json" << EOF2
[
  "enode://$NODEID1@127.0.0.1:30303",
  "enode://$NODEID3@127.0.0.1:30305"
]
EOF2

sudo bash -c "cat > /home/ec2-user/validator-3/geth/static-nodes.json" << EOF3
[
  "enode://$NODEID1@127.0.0.1:30303",
  "enode://$NODEID2@127.0.0.1:30304"
]
EOF3

echo "   ✅ Static nodes configured"

echo ""
echo "🚀 Step 5: Creating validators with MINING and UNLOCKING..."

# Validator 1 - RPC + Mining + Unlocked
docker create --name xaheen-rpc \
  --network host \
  -v /home/ec2-user/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --unlock $VALIDATOR1 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --cache 512 \
  --rpc.allow-unprotected-txs \
  --txlookuplimit 0 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.corsdomain "*" \
  --http.vhosts "*" \
  --http.api eth,net,web3,debug,txpool,admin \
  --ws --ws.addr 0.0.0.0 --ws.port 8546 \
  --ws.origins "*" \
  --ws.api eth,net,web3,debug,txpool \
  --gcmode archive \
  --port 30303 \
  --maxpeers 50 > /dev/null

# Validator 2 - Mining + Unlocked
docker create --name bsc-validator-2 \
  --network host \
  -v /home/ec2-user/validator-2:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --unlock $VALIDATOR2 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --cache 512 \
  --rpc.allow-unprotected-txs \
  --txlookuplimit 0 \
  --gcmode archive \
  --port 30304 \
  --maxpeers 50 > /dev/null

# Validator 3 - Mining + Unlocked
docker create --name bsc-validator-3 \
  --network host \
  -v /home/ec2-user/validator-3:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --unlock $VALIDATOR3 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --cache 512 \
  --rpc.allow-unprotected-txs \
  --txlookuplimit 0 \
  --gcmode archive \
  --port 30305 \
  --maxpeers 50 > /dev/null

echo "   ✅ All validators created with mining enabled"

echo ""
echo "▶️  Step 6: Starting all validators..."
docker start xaheen-rpc bsc-validator-2 bsc-validator-3

echo ""
echo "⏳ Waiting 40 seconds for initialization and peer discovery..."
sleep 40

echo ""
echo "🔗 Step 7: Checking peer connectivity..."
PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
PEER_COUNT=$((16#${PEERS:2}))
echo "   Connected peers: $PEER_COUNT"

if [ "$PEER_COUNT" -ge "2" ]; then
  echo "   ✅ All validators connected!"
else
  echo "   ⚠️  Expected 2 peers, got $PEER_COUNT"
  echo "   Waiting another 20 seconds..."
  sleep 20
fi

echo ""
echo "📊 Step 8: Monitoring block production (20 checks over 1 minute)..."
PREV_BLOCK=0
SUCCESS=false

for i in {1..20}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$BLOCK" ]; then
    DEC=$((16#${BLOCK:2}))

    if [ "$DEC" -gt "$PREV_BLOCK" ]; then
      echo "   ✅ Check $i/20: Block $DEC (INCREASING!)"
      PREV_BLOCK=$DEC
      if [ "$i" -gt "5" ]; then
        SUCCESS=true
      fi
    else
      echo "   ⏸  Check $i/20: Block $DEC"
    fi

    if [ "$DEC" -gt "15" ]; then
      echo ""
      echo "🎉🎉🎉 SUCCESS! Noor Chain is producing blocks! 🎉🎉🎉"
      SUCCESS=true
      break
    fi
  fi

  sleep 3
done

echo ""
if [ "$SUCCESS" = true ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          🎉 NOOR CHAIN IS ALIVE AND PRODUCING BLOCKS! 🎉               ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ⚠️  BLOCKS STILL NOT PROGRESSING ⚠️                             ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Troubleshooting steps:"
  echo "  1. Check validator logs: docker logs xaheen-rpc"
  echo "  2. Check if accounts are unlocked"
  echo "  3. Verify genesis hash matches across all validators"
  echo "  4. Check firewall settings for ports 30303-30305"
fi

echo ""
echo "📊 Final Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(NAMES|validator|xaheen)"

echo ""
echo "🌙 Noor Chain - Empowering the Future with Light and Trust"

REMOTE_SCRIPT

chmod +x /tmp/noor-final-fix.sh

echo "📤 Uploading script to server..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no /tmp/noor-final-fix.sh ec2-user@$SERVER_IP:/home/ec2-user/noor-final-fix.sh

echo ""
echo "🚀 Executing final fix on server..."
echo "   This will take about 90 seconds..."
echo ""

ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@$SERVER_IP 'bash /home/ec2-user/noor-final-fix.sh'

echo ""
echo "✅ Script execution complete!"
echo ""
echo "🌙 Noor Chain - Empowering the Future with Light and Trust"

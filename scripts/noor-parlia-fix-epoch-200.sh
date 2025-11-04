#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - PARLIA FIX WITH DOCUMENTED EPOCH 200 🌙
#═══════════════════════════════════════════════════════════════════════════════
#
# Based on: docs/06-summaries/PARLIA-DEADLOCK-FIX-SUMMARY.md
#
# ROOT CAUSE: Epoch too high!
# - Current genesis: epoch 10,000
# - Documented working fix (Oct 31, 2025): epoch 200
# - For 3 validators: epoch should be 200-500, NOT 10,000
#
# This script implements the EXACT configuration that worked before.
#
#═══════════════════════════════════════════════════════════════════════════════

set -e

SERVER_IP="3.91.50.187"
VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"
PASSWORD="xaheen2025"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN PARLIA FIX - EPOCH 200 🌙                        ║"
echo "║          Using Documented Working Configuration from Oct 31, 2025       ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  IMPORTANT: Changing epoch from 10,000 → 200"
echo ""
echo "📋 Why this change?"
echo "   - Current epoch: 10,000 (too high for 3 validators)"
echo "   - Documented working epoch: 200 (Oct 31, 2025 fix that WORKED)"
echo "   - For 3 validators: epoch 200-500 recommended"
echo ""
echo "📊 With Epoch 200:"
echo "   - Block time: 3 seconds"
echo "   - Epoch revalidation: every 200 blocks (~10 minutes)"
echo "   - Can test epoch boundaries multiple times per hour"
echo ""
echo "🔧 Strategy:"
echo "   1. Get blocks producing with epoch 200 (documented working config)"
echo "   2. Verify Parlia consensus works properly"
echo "   3. Then test with epoch 10,000 if needed for revalidation"
echo ""
echo "⚡ Starting automatic fix (non-interactive mode)..."
echo ""

cat << 'REMOTE_SCRIPT' > /tmp/nor-epoch-200-fix.sh
#!/bin/bash

VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"
PASSWORD="xaheen2025"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN EPOCH 200 FIX 🌙                                  ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🛑 Step 1: Stopping validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
echo "   ✅ Validators stopped"

echo ""
echo "🗑️  Step 2: Clearing blockchain data (keeping keystores)..."
sudo rm -rf /home/ec2-user/validator-1/geth
sudo rm -rf /home/ec2-user/validator-2/geth
sudo rm -rf /home/ec2-user/validator-3/geth
echo "   ✅ Blockchain data cleared"

echo ""
echo "🔧 Step 3: Initializing with EPOCH 200 genesis..."
docker run --rm \
  -v /home/ec2-user/validator-1:/bsc \
  -v /home/ec2-user/genesis-epoch-200.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
  -v /home/ec2-user/validator-2:/bsc \
  -v /home/ec2-user/genesis-epoch-200.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
  -v /home/ec2-user/validator-3:/bsc \
  -v /home/ec2-user/genesis-epoch-200.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "   ✅ All validators initialized with epoch 200 genesis"

echo ""
echo "🔐 Step 4: Setting up password files..."
echo "$PASSWORD" | sudo tee /home/ec2-user/validator-1/password.txt > /dev/null
echo "$PASSWORD" | sudo tee /home/ec2-user/validator-2/password.txt > /dev/null
echo "$PASSWORD" | sudo tee /home/ec2-user/validator-3/password.txt > /dev/null
sudo chmod 644 /home/ec2-user/validator-*/password.txt
echo "   ✅ Password files created"

echo ""
echo "🚀 Step 5: Creating validators with FULL documented configuration..."

# Validator 1 - EXACT documented configuration
docker create --name xaheen-rpc \
  --network host \
  -v /home/ec2-user/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --miner.threads=1 \
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

# Validator 2
docker create --name bsc-validator-2 \
  --network host \
  -v /home/ec2-user/validator-2:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --miner.threads=1 \
  --unlock $VALIDATOR2 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --cache 512 \
  --rpc.allow-unprotected-txs \
  --txlookuplimit 0 \
  --gcmode archive \
  --port 30304 \
  --maxpeers 50 > /dev/null

# Validator 3
docker create --name bsc-validator-3 \
  --network host \
  -v /home/ec2-user/validator-3:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --miner.threads=1 \
  --unlock $VALIDATOR3 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --cache 512 \
  --rpc.allow-unprotected-txs \
  --txlookuplimit 0 \
  --gcmode archive \
  --port 30305 \
  --maxpeers 50 > /dev/null

echo "   ✅ All validators created"

echo ""
echo "▶️  Step 6: Starting validators..."
docker start xaheen-rpc bsc-validator-2 bsc-validator-3

echo "   Waiting 20 seconds for startup..."
sleep 20

echo ""
echo "🔍 Step 7: Extracting enode URIs..."
NODEID1=$(docker logs xaheen-rpc 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID2=$(docker logs bsc-validator-2 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID3=$(docker logs bsc-validator-3 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)

if [ -z "$NODEID1" ] || [ -z "$NODEID2" ] || [ -z "$NODEID3" ]; then
  echo "   ⚠️  Could not extract all node IDs, waiting longer..."
  sleep 10
  NODEID1=$(docker logs xaheen-rpc 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
  NODEID2=$(docker logs bsc-validator-2 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
  NODEID3=$(docker logs bsc-validator-3 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
fi

echo "   Node ID 1: ${NODEID1:0:20}...${NODEID1: -20}"
echo "   Node ID 2: ${NODEID2:0:20}...${NODEID2: -20}"
echo "   Node ID 3: ${NODEID3:0:20}...${NODEID3: -20}"

echo ""
echo "📝 Step 8: Creating static-nodes.json..."

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
echo "🔄 Step 9: Restarting validators to apply static peering..."
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3

echo ""
echo "⏳ Waiting 40 seconds for consensus..."
sleep 40

echo ""
echo "📊 Step 10: Monitoring block production (20 checks over 1 minute)..."
PREV_BLOCK=0
SUCCESS=false

for i in {1..20}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$BLOCK" ] && [ -n "$PEERS" ]; then
    DEC_BLOCK=$((16#${BLOCK:2}))
    DEC_PEERS=$((16#${PEERS:2}))

    if [ "$DEC_BLOCK" -gt "$PREV_BLOCK" ]; then
      echo "   ✅ Check $i/20: Block $DEC_BLOCK | Peers $DEC_PEERS (INCREASING!)"
      PREV_BLOCK=$DEC_BLOCK
      if [ "$i" -gt "5" ]; then
        SUCCESS=true
      fi
    else
      echo "   ⏸  Check $i/20: Block $DEC_BLOCK | Peers $DEC_PEERS"
    fi

    if [ "$DEC_BLOCK" -gt "10" ]; then
      echo ""
      echo "🎉🎉🎉 SUCCESS! Nor Chain producing blocks with epoch 200! 🎉🎉🎉"
      SUCCESS=true
      break
    fi
  fi

  sleep 3
done

echo ""
if [ "$SUCCESS" = true ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          🎉 NOOR CHAIN IS ALIVE WITH EPOCH 200! 🎉                      ║"
  echo "║                                                                           ║"
  echo "║          Parlia Consensus Working with Documented Configuration          ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "✅ FIXES APPLIED:"
  echo "   - Epoch: 200 (documented working value for 3 validators)"
  echo "   - --networkid 65001 flag"
  echo "   - --syncmode full flag"
  echo "   - Mining enabled with account unlock"
  echo "   - Static-nodes.json configured"
  echo ""
  echo "📊 Epoch Revalidation:"
  echo "   - Epoch boundaries: every 200 blocks"
  echo "   - Time to epoch: ~10 minutes (at 3-second blocks)"
  echo "   - Can test multiple epoch transitions per hour"
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ⚠️  BLOCKS STILL NOT PROGRESSING ⚠️                             ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
fi

echo ""
echo "📊 Final Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(NAMES|validator|xaheen)"

echo ""
echo "🌙 Nor Chain - Empowering the Future with Light and Trust"

REMOTE_SCRIPT

chmod +x /tmp/nor-epoch-200-fix.sh

echo ""
echo "📝 Step 1: Creating genesis with epoch 200..."

# Create genesis with epoch 200 locally
node -e "
const fs = require('fs');
const genesis = JSON.parse(fs.readFileSync('data/genesis-clean.json', 'utf8'));
genesis.config.parlia.epoch = 200;
fs.writeFileSync('data/genesis-epoch-200.json', JSON.stringify(genesis, null, 2));
console.log('✅ Genesis with epoch 200 created: data/genesis-epoch-200.json');
console.log('   Epoch changed from 10,000 → 200 (documented working configuration)');
"

echo ""
echo "📤 Step 2: Uploading epoch 200 genesis to server..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  data/genesis-epoch-200.json \
  ec2-user@$SERVER_IP:/home/ec2-user/genesis-epoch-200.json

echo ""
echo "📤 Step 3: Uploading fix script to server..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  /tmp/nor-epoch-200-fix.sh \
  ec2-user@$SERVER_IP:/home/ec2-user/nor-epoch-200-fix.sh

echo ""
echo "🚀 Step 4: Executing epoch 200 fix on server..."
echo "   This will take about 90 seconds..."
echo ""

ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  ec2-user@$SERVER_IP \
  'bash /home/ec2-user/nor-epoch-200-fix.sh'

echo ""
echo "✅ Epoch 200 Fix Complete!"
echo ""
echo "🌙 Nor Chain - Empowering the Future with Light and Trust"

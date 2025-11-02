#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - APPLY EXACT DOCUMENTED WORKING CONFIGURATION 🌙
#═══════════════════════════════════════════════════════════════════════════════
#
# This applies the EXACT configuration from deploy-3-validators-fixed.sh
# Key differences from previous attempts:
# 1. Uses `docker run -d` instead of `docker create` + `docker start`
# 2. Gets enodes using `geth attach` instead of parsing docker logs
# 3. Validators 2 & 3 have NO --syncmode or --gcmode flags
# 4. Uses `--miner.etherbase` flag
# 5. NO `--snapshot=false` flag (not in documented working script)
#
#═══════════════════════════════════════════════════════════════════════════════

set -e

SERVER_IP="3.91.50.187"
VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN - EXACT DOCUMENTED FIX 🌙                         ║"
echo "║          Applying configuration from deploy-3-validators-fixed.sh        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔑 KEY DIFFERENCES FROM PREVIOUS ATTEMPTS:"
echo "   - Uses 'docker run -d' (not docker create + start)"
echo "   - Gets enodes via 'geth attach' (not docker logs)"
echo "   - Validators 2 & 3: NO --syncmode or --gcmode"
echo "   - Uses --miner.etherbase flag"
echo "   - NO --snapshot=false flag"
echo "   - Epoch: 10,000 blocks for revalidation testing"
echo ""

# Create genesis with epoch 10,000
echo "📝 Creating genesis with epoch 10,000..."
node -e "
const fs = require('fs');
const noorGenesis = JSON.parse(fs.readFileSync('data/genesis-clean.json', 'utf8'));
noorGenesis.config.parlia.epoch = 10000;
fs.writeFileSync('data/genesis-epoch-10k.json', JSON.stringify(noorGenesis, null, 2));
console.log('✅ Genesis with epoch 10,000 created');
"

echo "📤 Uploading genesis to server..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  data/genesis-epoch-10k.json \
  ec2-user@$SERVER_IP:/home/ec2-user/genesis-epoch-10k.json

cat << 'REMOTE_SCRIPT' > /tmp/noor-documented-fix.sh
#!/bin/bash

set -e

V1_ADDR="bb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
V2_ADDR="689CF2C189781d9bB6859A830acbF64044E4432f"
V3_ADDR="15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"

echo "🛑 Step 1: Stopping and removing validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo "🧹 Step 2: Clearing blockchain data (preserving keystores)..."
sudo rm -rf /home/ec2-user/validator-1/geth /home/ec2-user/validator-2/geth /home/ec2-user/validator-3/geth

echo "🔧 Step 3: Initializing with epoch 10,000 genesis..."
docker run --rm \
    -v /home/ec2-user/validator-1:/bsc \
    -v /home/ec2-user/genesis-epoch-10k.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v /home/ec2-user/validator-2:/bsc \
    -v /home/ec2-user/genesis-epoch-10k.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v /home/ec2-user/validator-3:/bsc \
    -v /home/ec2-user/genesis-epoch-10k.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

echo "🚀 Step 4: Starting validators with EXACT documented configuration..."

# Validator 1 - RPC + Mining (EXACT from documented script)
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
    --miner.etherbase 0x$V1_ADDR \
    --unlock 0x$V1_ADDR \
    --password /bsc/password.txt \
    --allow-insecure-unlock \
    --port 30303 \
    --maxpeers 25

# Validator 2 - Mining only (NO --syncmode, NO --gcmode per documented script)
docker run -d --name bsc-validator-2 --network host \
    -v /home/ec2-user/validator-2:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --port 30304 \
    --unlock 0x$V2_ADDR \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase 0x$V2_ADDR \
    --allow-insecure-unlock \
    --maxpeers 25

# Validator 3 - Mining only (NO --syncmode, NO --gcmode per documented script)
docker run -d --name bsc-validator-3 --network host \
    -v /home/ec2-user/validator-3:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --port 30305 \
    --unlock 0x$V3_ADDR \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase 0x$V3_ADDR \
    --allow-insecure-unlock \
    --maxpeers 25

echo ""
echo "⏳ Step 5: Waiting 15 seconds for validators to initialize..."
sleep 15

echo "🔍 Step 6: Getting enode addresses using geth attach (documented method)..."
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

echo "   Enode 1: $ENODE1"
echo "   Enode 2: $ENODE2"
echo "   Enode 3: $ENODE3"

echo "📝 Step 7: Creating static-nodes.json files (using sudo)..."
sudo bash -c "echo '[$ENODE2, $ENODE3]' > /home/ec2-user/validator-1/static-nodes.json"
sudo bash -c "echo '[$ENODE1, $ENODE3]' > /home/ec2-user/validator-2/static-nodes.json"
sudo bash -c "echo '[$ENODE1, $ENODE2]' > /home/ec2-user/validator-3/static-nodes.json"

echo "🔄 Step 8: Restarting validators to apply static-nodes.json..."
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3

echo "⏳ Waiting 15 seconds after restart..."
sleep 15

echo ""
echo "📊 Step 9: Monitoring block production (30 checks over 90 seconds)..."
SUCCESS=false
PREV_BLOCK=0

for i in {1..30}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  TIME=$(date +%H:%M:%S)

  if [ "$BLOCK" -gt "$PREV_BLOCK" ]; then
    echo "   ✅ [$TIME] Check $i/30: Block $BLOCK | Peers $PEERS (BLOCKS INCREASING!)"
    PREV_BLOCK=$BLOCK
    SUCCESS=true
  else
    echo "   ⏸  [$TIME] Check $i/30: Block $BLOCK | Peers $PEERS"
  fi

  if [ "$BLOCK" -gt "10" ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║          🎉🎉🎉 SUCCESS - NOOR CHAIN PRODUCING BLOCKS! 🎉🎉🎉           ║"
    echo "║                                                                           ║"
    echo "║          Epoch Revalidation: Every 10,000 blocks (~8.3 hours)            ║"
    echo "║          Configuration: EXACT documented working setup                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    exit 0
  fi

  sleep 3
done

echo ""
if [ "$SUCCESS" = true ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          🎉 BLOCKS ARE PRODUCING! 🎉                                     ║"
  echo "║                                                                           ║"
  echo "║          Epoch Revalidation: Every 10,000 blocks (~8.3 hours)            ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ⚠️  STILL NEEDS INVESTIGATION ⚠️                                ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "📋 Checking validator logs for errors..."
  docker logs xaheen-rpc 2>&1 | grep -E "(ERROR|WARN|Commit new mining|Signed recently|Looking for peers)" | tail -20
fi

REMOTE_SCRIPT

scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  /tmp/noor-documented-fix.sh \
  ec2-user@$SERVER_IP:/home/ec2-user/noor-documented-fix.sh

echo "🚀 Executing EXACT documented configuration..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  ec2-user@$SERVER_IP \
  'bash /home/ec2-user/noor-documented-fix.sh'

echo ""
echo "✅ Documented configuration applied!"

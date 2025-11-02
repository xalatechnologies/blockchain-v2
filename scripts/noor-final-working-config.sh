#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - FINAL WORKING CONFIGURATION 🌙
#═══════════════════════════════════════════════════════════════════════════════
#
# Based on FRESH_START_SUCCESS.md - The EXACT configuration that worked
# With epoch 10,000 for revalidation testing (per user request)
#
# Configuration from successful run (Nov 2, 2025, 5:03 PM):
# - Chain ID: 65001
# - Epoch: 10,000 (changed from 9,000,000 for testing)
# - Validators: 3 with known addresses and password
# - Flags: --mine, --unlock, --gcmode archive, --networkid, --syncmode full
#
#═══════════════════════════════════════════════════════════════════════════════

set -e

SERVER_IP="3.91.50.187"
VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"
PASSWORD="xaheen2025"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN - FINAL WORKING CONFIGURATION 🌙                  ║"
echo "║          Based on documented successful run + epoch 10,000               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   Chain ID: 65001"
echo "   Epoch: 10,000 blocks (~8.3 hours)"
echo "   Validators: 3"
echo "   Password: xaheen2025"
echo ""
echo "🔧 Key Flags from SUCCESS document:"
echo "   - --gcmode archive (CRITICAL for Parlia)"
echo "   - --networkid 65001"
echo "   - --syncmode full"
echo "   - --mine with account unlock"
echo ""

# Create genesis with epoch 10,000
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

cat << 'REMOTE_SCRIPT' > /tmp/noor-final-config.sh
#!/bin/bash

VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"
PASSWORD="xaheen2025"

echo "🛑 Step 1: Stopping and removing validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null

echo "🧹 Step 2: Clearing blockchain data (preserving keystores and nodekeys)..."
sudo rm -rf /home/ec2-user/validator-1/geth/chaindata /home/ec2-user/validator-1/geth/lightchaindata /home/ec2-user/validator-1/geth/triecache
sudo rm -rf /home/ec2-user/validator-2/geth/chaindata /home/ec2-user/validator-2/geth/lightchaindata /home/ec2-user/validator-2/geth/triecache
sudo rm -rf /home/ec2-user/validator-3/geth/chaindata /home/ec2-user/validator-3/geth/lightchaindata /home/ec2-user/validator-3/geth/triecache

echo "🔧 Step 3: Initializing with epoch 10,000 genesis..."
docker run --rm -v /home/ec2-user/validator-1:/bsc -v /home/ec2-user/genesis-epoch-10k.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v /home/ec2-user/validator-2:/bsc -v /home/ec2-user/genesis-epoch-10k.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v /home/ec2-user/validator-3:/bsc -v /home/ec2-user/genesis-epoch-10k.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json

echo "🚀 Step 4: Creating validators with EXACT working configuration..."

# Validator 1 - RPC endpoint with ALL flags from SUCCESS document
docker create --name xaheen-rpc \
  --network host \
  -v /home/ec2-user/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --gcmode archive \
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
  --gcmode archive \
  --mine \
  --miner.threads=1 \
  --unlock $VALIDATOR2 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --cache 512 \
  --rpc.allow-unprotected-txs \
  --txlookuplimit 0 \
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
  --gcmode archive \
  --mine \
  --miner.threads=1 \
  --unlock $VALIDATOR3 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --cache 512 \
  --rpc.allow-unprotected-txs \
  --txlookuplimit 0 \
  --port 30305 \
  --maxpeers 50 > /dev/null

echo "   ✅ All validators created with working configuration"

echo "▶️  Step 5: Starting validators..."
docker start xaheen-rpc bsc-validator-2 bsc-validator-3
sleep 25

echo "🔍 Step 6: Extracting enode URIs and configuring static peers..."
NODEID1=$(docker logs xaheen-rpc 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID2=$(docker logs bsc-validator-2 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)
NODEID3=$(docker logs bsc-validator-3 2>&1 | grep "self=enode" | tail -1 | sed 's/.*self=enode:\/\///' | cut -d'@' -f1)

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

echo "🔄 Step 7: Restarting validators to apply static peering..."
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3
sleep 45

echo "📊 Step 8: Monitoring block production (30 checks over 90 seconds)..."
SUCCESS=false
PREV_BLOCK=0

for i in {1..30}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$BLOCK" ] && [ -n "$PEERS" ]; then
    DEC_BLOCK=$((16#${BLOCK:2}))
    DEC_PEERS=$((16#${PEERS:2}))

    if [ "$DEC_BLOCK" -gt "$PREV_BLOCK" ]; then
      echo "   ✅ Check $i/30: Block $DEC_BLOCK | Peers $DEC_PEERS (BLOCKS INCREASING!)"
      PREV_BLOCK=$DEC_BLOCK
      SUCCESS=true
    else
      echo "   ⏸  Check $i/30: Block $DEC_BLOCK | Peers $DEC_PEERS"
    fi

    if [ "$DEC_BLOCK" -gt "10" ]; then
      echo ""
      echo "🎉 SUCCESS! Noor Chain producing blocks with epoch 10,000!"
      break
    fi
  fi

  sleep 3
done

echo ""
if [ "$SUCCESS" = true ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          🎉 NOOR CHAIN IS ALIVE! 🎉                                      ║"
  echo "║                                                                           ║"
  echo "║          Epoch Revalidation: Every 10,000 blocks (~8.3 hours)            ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ⚠️  NEEDS INVESTIGATION ⚠️                                      ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Checking for errors in validator logs..."
  docker logs xaheen-rpc 2>&1 | grep -E "(ERROR|WARN|peer)" | tail -10
fi

REMOTE_SCRIPT

scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  /tmp/noor-final-config.sh \
  ec2-user@$SERVER_IP:/home/ec2-user/noor-final-config.sh

echo "🚀 Executing final working configuration..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  ec2-user@$SERVER_IP \
  'bash /home/ec2-user/noor-final-config.sh'

echo ""
echo "✅ Configuration complete!"
echo "🌙 Noor Chain - Empowering the Future with Light and Trust"

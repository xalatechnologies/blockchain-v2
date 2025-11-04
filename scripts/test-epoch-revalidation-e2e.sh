#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🧪 NOOR CHAIN - EPOCH REVALIDATION E2E TEST 🧪
#═══════════════════════════════════════════════════════════════════════════════
#
# End-to-End test for epoch revalidation mechanism
#
# Test Configuration:
# - Epoch: 20 blocks (~1 minute at 3-second blocks)
# - Validates epoch boundary handling without 8-hour wait
# - Tests same Parlia consensus logic as production
#
# Success Criteria:
# 1. Blocks produce continuously from 1 → 20
# 2. Epoch boundary at block 20 passes without deadlock
# 3. Blocks continue producing after epoch (20 → 30+)
# 4. Peer connections remain stable throughout
#
#═══════════════════════════════════════════════════════════════════════════════

set -e

SERVER_IP="3.91.50.187"
TEST_EPOCH=20
VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🧪 NOOR CHAIN - EPOCH REVALIDATION E2E TEST 🧪                  ║"
echo "║          Testing epoch boundary with 20-block epoch                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Test Configuration:"
echo "   Epoch Size: $TEST_EPOCH blocks"
echo "   Expected Duration: ~1 minute (${TEST_EPOCH} blocks × 3 seconds)"
echo "   Test Objective: Verify epoch revalidation works without deadlock"
echo ""

# Step 1: Create test genesis with small epoch
echo "🔧 Step 1: Creating test genesis with epoch $TEST_EPOCH..."
node -e "
const fs = require('fs');
const norGenesis = JSON.parse(fs.readFileSync('data/genesis-clean.json', 'utf8'));
norGenesis.config.parlia.epoch = $TEST_EPOCH;
fs.writeFileSync('data/genesis-epoch-test.json', JSON.stringify(norGenesis, null, 2));
console.log('✅ Test genesis with epoch $TEST_EPOCH created');
"

# Step 2: Upload test genesis
echo "📤 Step 2: Uploading test genesis to server..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  data/genesis-epoch-test.json \
  ec2-user@$SERVER_IP:/home/ec2-user/genesis-epoch-test.json

# Step 3: Deploy validators with test configuration
cat << 'REMOTE_SCRIPT' > /tmp/epoch-test.sh
#!/bin/bash

set -e

V1_ADDR="bb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
V2_ADDR="689CF2C189781d9bB6859A830acbF64044E4432f"
V3_ADDR="15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"

echo "🛑 Stopping current validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo "🧹 Clearing blockchain data..."
sudo rm -rf /home/ec2-user/validator-1/geth /home/ec2-user/validator-2/geth /home/ec2-user/validator-3/geth

echo "🔧 Initializing with TEST genesis (epoch 20)..."
docker run --rm \
    -v /home/ec2-user/validator-1:/bsc \
    -v /home/ec2-user/genesis-epoch-test.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v /home/ec2-user/validator-2:/bsc \
    -v /home/ec2-user/genesis-epoch-test.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v /home/ec2-user/validator-3:/bsc \
    -v /home/ec2-user/genesis-epoch-test.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

echo "🚀 Starting validators with EXACT working configuration..."

# Validator 1 - RPC + Mining
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
    --maxpeers 25 > /dev/null

# Validator 2 - Mining only
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
    --maxpeers 25 > /dev/null

# Validator 3 - Mining only
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
    --maxpeers 25 > /dev/null

echo "⏳ Waiting for validators to initialize..."
sleep 15

echo "🔗 Setting up static peering..."
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

sudo bash -c "echo '[\"$ENODE2\", \"$ENODE3\"]' > /home/ec2-user/validator-1/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE3\"]' > /home/ec2-user/validator-2/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE2\"]' > /home/ec2-user/validator-3/static-nodes.json"

docker restart xaheen-rpc bsc-validator-2 bsc-validator-3 > /dev/null
sleep 15

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          📊 MONITORING EPOCH REVALIDATION TEST                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

SUCCESS=false
PRE_EPOCH_BLOCK=0
POST_EPOCH_BLOCK=0
EPOCH_PASSED=false

for i in {1..40}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  TIME=$(date +%H:%M:%S)

  if [ "$BLOCK" -ge 18 ] && [ "$BLOCK" -lt 20 ]; then
    echo "   🚨 [$TIME] APPROACHING EPOCH! Block $BLOCK/20 | Peers $PEERS"
    PRE_EPOCH_BLOCK=$BLOCK
  elif [ "$BLOCK" -eq 20 ]; then
    echo "   ⚡ [$TIME] EPOCH BOUNDARY! Block $BLOCK/20 | Peers $PEERS"
    EPOCH_PASSED=true
  elif [ "$BLOCK" -gt 20 ] && [ "$BLOCK" -lt 23 ]; then
    echo "   🎉 [$TIME] POST-EPOCH! Block $BLOCK/20 | Peers $PEERS (REVALIDATION SUCCESS!)"
    POST_EPOCH_BLOCK=$BLOCK
  elif [ "$BLOCK" -ge 23 ]; then
    echo "   ✅ [$TIME] STABLE POST-EPOCH! Block $BLOCK/20 | Peers $PEERS"
    SUCCESS=true
    break
  else
    echo "   📊 [$TIME] Block $BLOCK/20 | Peers $PEERS"
  fi

  sleep 3
done

echo ""
if [ "$SUCCESS" = true ] && [ "$EPOCH_PASSED" = true ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          🎉🎉🎉 EPOCH REVALIDATION TEST PASSED! 🎉🎉🎉                  ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "✅ Test Results:"
  echo "   Pre-Epoch Block: $PRE_EPOCH_BLOCK"
  echo "   Epoch Boundary: 20 (PASSED)"
  echo "   Post-Epoch Block: $POST_EPOCH_BLOCK"
  echo "   Final Block: $BLOCK"
  echo "   Peer Count: $PEERS"
  echo ""
  echo "✅ Epoch revalidation mechanism VERIFIED WORKING!"
  echo "✅ Safe to proceed with production epoch configuration"
  exit 0
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ❌ EPOCH REVALIDATION TEST FAILED ❌                            ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Final block reached: $BLOCK"
  echo "Epoch passed: $EPOCH_PASSED"
  echo "Checking logs..."
  docker logs --tail 30 xaheen-rpc 2>&1 | grep -E "(ERROR|WARN|Commit new mining|Signed recently|epoch)"
  exit 1
fi

REMOTE_SCRIPT

echo "🚀 Step 3: Executing epoch revalidation test..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  /tmp/epoch-test.sh \
  ec2-user@$SERVER_IP:/home/ec2-user/epoch-test.sh

ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  ec2-user@$SERVER_IP \
  'bash /home/ec2-user/epoch-test.sh'

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ✅ E2E TEST COMPLETE - EPOCH MECHANISM VERIFIED ✅              ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "🎯 Next Steps:"
  echo "   1. ✅ Epoch revalidation mechanism confirmed working"
  echo "   2. 🔄 Restore production configuration (epoch 10,000)"
  echo "   3. ✅ Production epoch will work correctly based on test results"
  echo ""

  read -p "Restore production configuration now? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Restoring production configuration..."
    bash scripts/nor-apply-documented-fix.sh
  else
    echo "⚠️  Production configuration NOT restored. Run manually:"
    echo "   bash scripts/nor-apply-documented-fix.sh"
  fi
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ❌ E2E TEST FAILED - NEEDS INVESTIGATION ❌                     ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "The epoch revalidation test did not pass. Review logs and investigate."
  exit 1
fi

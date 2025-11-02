#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - SINGLE VALIDATOR WORKAROUND 🌙
#═══════════════════════════════════════════════════════════════════════════════
#
# ROOT CAUSE: Snap protocol incompatibility preventing peer connectivity
# SOLUTION: Run SINGLE validator to bypass P2P networking entirely
#
# This allows:
# - Block production without peer dependencies
# - Epoch revalidation testing at 10,000 blocks
# - Full RPC functionality
# - Testing and development
#
# Trade-off: No fault tolerance (single point of failure)
#
#═══════════════════════════════════════════════════════════════════════════════

set -e

SERVER_IP="3.91.50.187"
VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN - SINGLE VALIDATOR MODE 🌙                        ║"
echo "║          Workaround for snap protocol P2P issues                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  IMPORTANT: This runs ONE validator only"
echo ""
echo "Why single validator?"
echo "   - Bypasses P2P snap protocol incompatibility"
echo "   - Allows block production and testing"
echo "   - Enables epoch revalidation testing"
echo "   - Trade-off: No fault tolerance"
echo ""

cat << 'REMOTE_SCRIPT' > /tmp/single-validator.sh
#!/bin/bash

VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"

echo "🛑 Stopping all validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null

echo "🧹 Clearing blockchain data (preserving keystore)..."
sudo rm -rf /home/ec2-user/validator-1/geth/chaindata /home/ec2-user/validator-1/geth/lightchaindata /home/ec2-user/validator-1/geth/triecache

echo "🔧 Initializing with epoch 10,000 genesis (single validator)..."
docker run --rm -v /home/ec2-user/validator-1:/bsc -v /home/ec2-user/genesis-epoch-10k.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json

echo "🚀 Creating SINGLE validator with full configuration..."
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
  --http.api eth,net,web3,debug,txpool,admin,personal,miner \
  --ws --ws.addr 0.0.0.0 --ws.port 8546 \
  --ws.origins "*" \
  --ws.api eth,net,web3,debug,txpool \
  --port 30303 \
  --maxpeers 0 \
  --nodiscover > /dev/null

echo "   ✅ Single validator created"

echo "▶️  Starting validator..."
docker start xaheen-rpc
sleep 25

echo "📊 Monitoring block production (20 checks over 60 seconds)..."
SUCCESS=false

for i in {1..20}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$BLOCK" ]; then
    DEC_BLOCK=$((16#${BLOCK:2}))
    DEC_PEERS=$((16#${PEERS:2}))

    if [ "$DEC_BLOCK" -gt "5" ]; then
      echo "   ✅ Check $i/20: Block $DEC_BLOCK | Peers $DEC_PEERS (PRODUCING!)"
      SUCCESS=true
    else
      echo "   ⏸  Check $i/20: Block $DEC_BLOCK | Peers $DEC_PEERS"
    fi

    if [ "$DEC_BLOCK" -gt "10" ]; then
      SUCCESS=true
      break
    fi
  fi

  sleep 3
done

echo ""
if [ "$SUCCESS" = true ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          🎉 SUCCESS - SINGLE VALIDATOR PRODUCING BLOCKS! 🎉              ║"
  echo "║                                                                           ║"
  echo "║          Epoch Revalidation: Every 10,000 blocks (~8.3 hours)            ║"
  echo "║          Mode: Single Validator (No P2P required)                        ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "✅ WORKAROUND SUCCESSFUL"
  echo "   - Blocks producing without P2P dependencies"
  echo "   - Can test epoch revalidation"
  echo "   - RPC fully functional"
  echo ""
  echo "⚠️  Note: Running single validator for testing"
  echo "   - No fault tolerance"
  echo "   - Suitable for development/testing"
  echo "   - For production, need to fix P2P snap protocol issue"
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║          ⚠️  SINGLE VALIDATOR ALSO NOT PRODUCING ⚠️                      ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Checking validator logs for errors..."
  docker logs xaheen-rpc 2>&1 | grep -E "(ERROR|WARN|Commit new mining work)" | tail -15
fi

REMOTE_SCRIPT

scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  /tmp/single-validator.sh \
  ec2-user@$SERVER_IP:/home/ec2-user/single-validator.sh

echo "🚀 Executing single validator mode..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  ec2-user@$SERVER_IP \
  'bash /home/ec2-user/single-validator.sh'

echo ""
echo "✅ Single validator test complete!"

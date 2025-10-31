#!/bin/bash
set -e

echo "🔧 FIXING EPOCH BOUNDARY ISSUE"
echo "Problem: Chain stuck at block 199 (epoch=200)"
echo "Solution: Redeploy with epoch=30000"
echo "========================================"
echo ""

# Upload new genesis
echo "📤 Uploading new genesis (epoch=30000)..."
scp -i bsc-validator-key.pem data/genesis-xaheen-epoch-30000.json ec2-user@3.91.50.187:~/blockchain-v2/data/

ssh -i bsc-validator-key.pem ec2-user@3.91.50.187 << 'EOF'
echo "🛑 Stopping all validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo "🧹 Clearing blockchain data..."
sudo rm -rf ~/blockchain-v2/validator-1/geth ~/blockchain-v2/validator-2/geth ~/blockchain-v2/validator-3/geth

echo "🔄 Reinitializing validators with new genesis..."
docker run --rm -v ~/blockchain-v2/validator-1:/bsc -v ~/blockchain-v2/data/genesis-xaheen-epoch-30000.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm -v ~/blockchain-v2/validator-2:/bsc -v ~/blockchain-v2/data/genesis-xaheen-epoch-30000.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm -v ~/blockchain-v2/validator-3:/bsc -v ~/blockchain-v2/data/genesis-xaheen-epoch-30000.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "✅ Reinitialization complete"
echo ""
echo "🚀 Starting validators..."

# Start Validator 1 (RPC + mining)
docker run -d --name xaheen-rpc --network host \
  -v ~/blockchain-v2/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api eth,net,web3,txpool,parlia \
  --ws --ws.addr 0.0.0.0 --ws.port 8546 \
  --ws.api eth,net,web3 \
  --mine --miner.threads=1 \
  --unlock 0xa3aac90d6505c2a57141eafda973222df91bbe1c \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --port 30303 \
  --maxpeers 25 \
  --syncmode full \
  --gcmode archive

echo "✅ Validator 1 started (RPC + mining)"

# Start Validator 2 (mining only)
docker run -d --name bsc-validator-2 --network host \
  -v ~/blockchain-v2/validator-2:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --mine --miner.threads=1 \
  --unlock 0x632b5acf4ffbbe8dae81df89754fb1b217924788 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --port 30304 \
  --maxpeers 25 \
  --syncmode full \
  --gcmode archive

echo "✅ Validator 2 started (mining)"

# Start Validator 3 (mining only)
docker run -d --name bsc-validator-3 --network host \
  -v ~/blockchain-v2/validator-3:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --mine --miner.threads=1 \
  --unlock 0xb3b4f4fb663d9c8c6ad57e30631ae1bb0e60c62b \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --port 30305 \
  --maxpeers 25 \
  --syncmode full \
  --gcmode archive

echo "✅ Validator 3 started (mining)"
echo ""
echo "⏳ Waiting 10 seconds for startup..."
sleep 10

echo "🔗 Connecting validators..."
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | tr -d '"')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | tr -d '"')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | tr -d '"')

# Fix enodes to use 127.0.0.1
ENODE1_LOCAL=$(echo $ENODE1 | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2_LOCAL=$(echo $ENODE2 | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3_LOCAL=$(echo $ENODE3 | sed 's/@[0-9.]*:/@127.0.0.1:/')

# Connect all validators
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.addPeer('$ENODE2_LOCAL')" 2>/dev/null
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.addPeer('$ENODE3_LOCAL')" 2>/dev/null
docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.addPeer('$ENODE1_LOCAL')" 2>/dev/null
docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.addPeer('$ENODE3_LOCAL')" 2>/dev/null
docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.addPeer('$ENODE1_LOCAL')" 2>/dev/null
docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.addPeer('$ENODE2_LOCAL')" 2>/dev/null

sleep 5

echo ""
echo "📊 VALIDATOR STATUS:"
echo -n "  V1 peers: "
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "net.peerCount" 2>/dev/null
echo -n "  V2 peers: "
docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "net.peerCount" 2>/dev/null
echo -n "  V3 peers: "
docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "net.peerCount" 2>/dev/null

echo ""
echo "📈 Monitoring blocks for 30 seconds..."
for i in {1..10}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | jq -r '.result' | xargs printf "%d\n" 2>/dev/null)
  echo "  $i. Block: $BLOCK"
  if [ "$BLOCK" -gt "5" ]; then
    echo ""
    echo "✅✅✅ CHAIN IS WORKING - BLOCKS PRODUCING!"
    echo "Epoch set to 30000 - will not hit boundary until block 30000"
    exit 0
  fi
  sleep 3
done

echo "⚠️  Blocks not advancing yet, check logs with: docker logs xaheen-rpc --tail 50"
EOF

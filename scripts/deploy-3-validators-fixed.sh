#!/bin/bash

set -e

echo "========================================="
echo "🔧 Deploying 3-Validator Fixed Genesis"
echo "========================================="
echo ""
echo "FIXES APPLIED:"
echo "  ✓ Properly formatted extraData (314 hex chars)"
echo "  ✓ Epoch: 200 (instead of 30000)"
echo "  ✓ 3 validators with 65-byte zero seal"
echo "  ✓ 4 embedded ERC20 tokens"
echo "  ✓ --networkid 65001 flag"
echo ""

# Upload fixed genesis
echo "1. Uploading genesis to server..."
scp -i bsc-validator-key.pem data/genesis-xaheen-3-validators.json ec2-user@3.91.50.187:~/blockchain-v2/data/

ssh -i bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'ENDSSH'
set -e

cd ~/blockchain-v2

echo "2. Stopping all validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo "3. Clearing old blockchain data..."
sudo rm -rf validator-1/geth validator-2/geth validator-3/geth

echo "4. Initializing all validators with fixed genesis..."
docker run --rm \
    -v ~/blockchain-v2/validator-1:/bsc \
    -v ~/blockchain-v2/data/genesis-xaheen-3-validators.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v ~/blockchain-v2/validator-2:/bsc \
    -v ~/blockchain-v2/data/genesis-xaheen-3-validators.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v ~/blockchain-v2/validator-3:/bsc \
    -v ~/blockchain-v2/data/genesis-xaheen-3-validators.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

echo "5. Getting validator addresses..."
V1_ADDR=$(cat validator-1/keystore/*.json | jq -r .address | head -1)
V2_ADDR=$(cat validator-2/keystore/*.json | jq -r .address | head -1)
V3_ADDR=$(cat validator-3/keystore/*.json | jq -r .address | head -1)

echo "   V1: $V1_ADDR"
echo "   V2: $V2_ADDR"
echo "   V3: $V3_ADDR"

echo "6. Creating static-nodes.json for persistent peering..."
# Get enodes after containers start - will do this after validators start

echo "7. Starting validator 1 (RPC + Mining)..."
docker run -d --name xaheen-rpc --network host \
    -v ~/blockchain-v2/validator-1:/bsc \
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

echo "8. Starting validator 2 (Mining only)..."
docker run -d --name bsc-validator-2 --network host \
    -v ~/blockchain-v2/validator-2:/bsc \
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

echo "9. Starting validator 3 (Mining only)..."
docker run -d --name bsc-validator-3 --network host \
    -v ~/blockchain-v2/validator-3:/bsc \
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
echo "10. Waiting 15 seconds for validators to initialize..."
sleep 15

echo "11. Getting enode addresses and creating static-nodes.json..."
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

echo "[$ENODE2, $ENODE3]" > validator-1/static-nodes.json
echo "[$ENODE1, $ENODE3]" > validator-2/static-nodes.json
echo "[$ENODE1, $ENODE2]" > validator-3/static-nodes.json

echo "12. Restarting validators to apply static-nodes.json..."
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3

sleep 10

echo ""
echo "13. Monitoring block production for 60 seconds..."
for i in {1..20}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  TIME=$(date +%H:%M:%S)

  echo "  [$TIME] Block: $BLOCK, Peers: $PEERS"

  if [ "$BLOCK" -gt "5" ]; then
    echo ""
    echo "🎉🎉🎉 CHAIN IS PRODUCING BLOCKS WITH 3 VALIDATORS!"
    echo ""
    echo "Verifying 4 embedded tokens..."

    for addr in "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05" "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D" "0x0cF8e180350253271f4b917CcFb0aCCc4862F262" "0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4"; do
      CODE=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$addr\",\"latest\"],\"id\":1}" | jq -r '.result')
      if [ "$CODE" != "0x" ] && [ ${#CODE} -gt 10 ]; then
        echo "  ✅ Token at $addr verified"
      fi
    done

    exit 0
  fi

  sleep 3
done

echo ""
echo "❌ Chain still at block $BLOCK after 60 seconds"
echo "Checking logs..."
docker logs xaheen-rpc 2>&1 | grep -E "Signed recently|Commit new mining|error|Error" | tail -20
ENDSSH

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="

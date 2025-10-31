#!/bin/bash

set -e

echo "========================================="
echo "🔧 Deploying FIXED Genesis V3"
echo "========================================="
echo ""
echo "ROOT CAUSE: Genesis had 3 validators in extraData causing Parlia deadlock"
echo "FIX: Using 1 validator in extraData + 4 embedded tokens"
echo ""

# Upload fixed genesis
echo "1. Uploading fixed genesis to server..."
scp -i bsc-validator-key.pem data/genesis-xaheen-fixed-v3.json ec2-user@3.91.50.187:~/blockchain-v2/data/

ssh -i bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'ENDSSH'
set -e

cd ~/blockchain-v2

echo "2. Stopping all validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo "3. Removing old blockchain data..."
sudo rm -rf validator-1/geth validator-2/geth validator-3/geth

echo "4. Reinitializing with FIXED genesis..."
docker run --rm \
    -v ~/blockchain-v2/validator-1:/bsc \
    -v ~/blockchain-v2/data/genesis-xaheen-fixed-v3.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v ~/blockchain-v2/validator-2:/bsc \
    -v ~/blockchain-v2/data/genesis-xaheen-fixed-v3.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

docker run --rm \
    -v ~/blockchain-v2/validator-3:/bsc \
    -v ~/blockchain-v2/data/genesis-xaheen-fixed-v3.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

echo "5. Getting validator addresses..."
V1_ADDR=$(cat validator-1/keystore/*.json | jq -r .address | head -1)
V2_ADDR=$(cat validator-2/keystore/*.json | jq -r .address | head -1)
V3_ADDR=$(cat validator-3/keystore/*.json | jq -r .address | head -1)

echo "   Validator 1: $V1_ADDR"
echo "   Validator 2: $V2_ADDR"
echo "   Validator 3: $V3_ADDR"

echo "6. Starting validator 1 (RPC) with --networkid 65001..."
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

echo "7. Starting validator 2 with --networkid 65001..."
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

echo "8. Starting validator 3 with --networkid 65001..."
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
echo "9. Waiting 20 seconds for chain to start..."
sleep 20

echo "10. Checking validator status..."
docker ps --format '{{.Names}}: {{.Status}}'

echo ""
echo "11. Monitoring block production for 30 seconds..."
for i in {1..10}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")

  echo "  $i. Block: $BLOCK, Peers: $PEERS"

  if [ "$BLOCK" -gt "5" ]; then
    echo ""
    echo "🎉🎉🎉 CHAIN IS PRODUCING BLOCKS!"
    echo ""
    echo "Verifying 4 embedded tokens..."

    for addr in "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05" "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D" "0x0cF8e180350253271f4b917CcFb0aCCc4862F262" "0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4"; do
      CODE=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$addr\",\"latest\"],\"id\":1}" | jq -r '.result')
      if [ "$CODE" != "0x" ] && [ ${#CODE} -gt 10 ]; then
        echo "  ✅ Token at $addr verified"
      else
        echo "  ❌ Token at $addr NOT FOUND!"
      fi
    done

    exit 0
  fi

  sleep 3
done

echo ""
echo "❌ Chain still at block $BLOCK after 30 seconds"
echo "Checking validator logs for errors..."
docker logs xaheen-rpc 2>&1 | tail -20
ENDSSH

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="

#!/bin/bash

ssh -i bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'ENDSSH'
set -e

echo "🔧 Adding --networkid 65001 flag to fix Parlia consensus..."
cd ~/blockchain-v2

# Stop all validators
echo "1. Stopping validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

# Get validator addresses
V1_ADDR=$(cat validator-1/keystore/*.json | jq -r .address | head -1)
V2_ADDR=$(cat validator-2/keystore/*.json | jq -r .address | head -1)
V3_ADDR=$(cat validator-3/keystore/*.json | jq -r .address | head -1)

echo "2. Starting validator 1 (RPC) with --networkid 65001..."
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

echo "3. Starting validator 2 with --networkid 65001..."
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

echo "4. Starting validator 3 with --networkid 65001..."
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
echo "5. Waiting 15 seconds for validators to initialize..."
sleep 15

echo ""
echo "6. Verifying static-nodes.json still in place..."
ls -la validator-*/static-nodes.json

echo ""
echo "7. Checking validator status..."
docker ps --format '{{.Names}}: {{.Status}}'

echo ""
echo "8. Monitoring block production for 30 seconds..."
for i in {1..10}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null || echo "0")
  MINING=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_mining","params":[],"id":1}' | jq -r '.result')

  echo "  $i. Block: $BLOCK, Peers: $PEERS, Mining: $MINING"

  if [ "$BLOCK" -gt "1" ]; then
    echo ""
    echo "🎉 SUCCESS! Chain is producing blocks!"
    break
  fi

  sleep 3
done

echo ""
echo "✅ Validators restarted with --networkid 65001"
ENDSSH

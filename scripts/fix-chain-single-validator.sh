#!/bin/bash

ssh -i bsc-validator-key.pem -o StrictHostKeyChecking=no ec2-user@3.91.50.187 << 'ENDSSH'
set -e

echo "🔄 Setting up SINGLE VALIDATOR for immediate trading..."

# Stop all validators
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

# Clear blockchain data
sudo rm -rf ~/blockchain-v2/validator-1/geth

# Reinitialize validator 1 only
docker run --rm \
    -v ~/blockchain-v2/validator-1:/bsc \
    -v ~/blockchain-v2/data/genesis-xaheen-v2.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

# Get validator address
V1_ADDR=$(cat ~/blockchain-v2/validator-1/keystore/*.json | jq -r .address | head -1)

# Start ONLY validator 1 with all features
docker run -d --name xaheen-rpc --network host \
    -v ~/blockchain-v2/validator-1:/bsc \
    dysnix/bsc \
    --datadir /bsc \
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
    --maxpeers 0

echo "✅ Single validator started"
echo "Waiting 15 seconds for chain to start producing blocks..."
sleep 15

echo ""
echo "📊 Status check:"
docker ps --format '{{.Names}}: {{.Status}}'

echo ""
echo "Block number check:"
for i in {1..10}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n" 2>/dev/null)
  echo "  Attempt $i: Block $BLOCK"
  if [ "$BLOCK" -gt "1" ]; then
    echo "  ✅ Chain is producing blocks!"
    break
  fi
  sleep 3
done

echo ""
echo "🎯 Single validator setup complete!"
ENDSSH

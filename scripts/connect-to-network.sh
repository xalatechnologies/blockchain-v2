#!/bin/bash

# Script to connect to the existing BitcoinBR network
set -euo pipefail

# Load environment variables
VALIDATOR_ADDRESS="0x81bDAf1ac2094D5133937B3361A38a4976E55acc"

echo "==> Connecting to existing BitcoinBR network"

# Create data directory
DATA_DIR="./data"
mkdir -p "$DATA_DIR/keystore"

# Check if we have a validator key
if [ ! -f "$DATA_DIR/password.txt" ] || [ ! "$(ls -A $DATA_DIR/keystore)" ]; then
    echo "No validator key found. You need to either:"
    echo "1. Import an existing key by setting IMPORT_KEY=true in migrate-to-bsc.sh"
    echo "2. Generate a new key by running migrate-to-bsc.sh"
    echo "3. Copy an existing keystore file to $DATA_DIR/keystore/"
    exit 1
fi

# Update docker-compose to use the existing network settings
cat > docker-compose.override.yml <<'EOF'
version: '3.8'

services:
  bsc-node:
    # Connect to existing network instead of creating a new one
    command: |
      --datadir /bsc
      --networkid 885824
      --port 30303
      --syncmode full
      --http
      --http.addr 0.0.0.0
      --http.port 8545
      --http.corsdomain="*"
      --http.api "eth,net,web3,personal,txpool,parlia"
      --ws
      --ws.addr 0.0.0.0
      --ws.port 8546
      --ws.api "eth,net,web3,txpool,parlia"
      --mine
      --miner.etherbase 0x81bDAf1ac2094D5133937B3361A38a4976E55acc
      --unlock 0x81bDAf1ac2094D5133937B3361A38a4976E55acc
      --password /bsc/password.txt
      --allow-insecure-unlock
      --miner.gaslimit 30000000
      --miner.gasprice 1000000000
      --txpool.globalslots 4096
      --lightkdf
      --verbosity 3
      --identity "xaheen-bsc-validator-1"
EOF

echo "Created docker-compose.override.yml to connect to existing network"

# Start the node
echo "==> Starting node to connect to existing network"
docker-compose up -d

echo "Node started. Check logs with: docker-compose logs -f"
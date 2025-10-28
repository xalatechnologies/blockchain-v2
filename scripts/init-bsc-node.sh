#!/bin/bash

# Initialize BSC node with genesis file
set -euo pipefail

echo "==> Initializing BSC node with genesis file"

# Check if genesis file exists
if [ ! -f "data/genesis.json" ]; then
  echo "Error: Genesis file not found at data/genesis.json"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker >/dev/null; then
  echo "Error: Docker is not installed"
  exit 1
fi

# Pull the BSC image if not present
echo "==> Pulling BSC Docker image"
docker pull dysnix/bsc:latest

# Initialize the BSC datadir with genesis
echo "==> Initializing BSC datadir with genesis"
docker run --rm -v "$(pwd)/data:/bsc" dysnix/bsc:latest \
  --datadir /bsc init /bsc/genesis.json

echo "==> BSC node initialized successfully"
echo "==> You can now start the node with:"
echo "   docker-compose up -d"
#!/bin/bash

# Script to check the existing RPC endpoint
RPC_ENDPOINT="https://rpc.bitcoinbr.tech"

echo "==> Checking RPC endpoint: $RPC_ENDPOINT"

# Check if RPC is accessible
echo "==> Testing basic connectivity..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \
  $RPC_ENDPOINT > /tmp/rpc_response.json

if [ $? -eq 0 ]; then
    echo "✓ RPC endpoint is accessible"
    CHAIN_ID=$(jq -r '.result' /tmp/rpc_response.json)
    echo "Chain ID: $CHAIN_ID"
else
    echo "✗ Failed to connect to RPC endpoint"
    exit 1
fi

# Check if we can get the latest block
echo "==> Getting latest block number..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $RPC_ENDPOINT > /tmp/block_response.json

if [ $? -eq 0 ]; then
    BLOCK_NUMBER_HEX=$(jq -r '.result' /tmp/block_response.json)
    BLOCK_NUMBER=$(printf "%d" $BLOCK_NUMBER_HEX)
    echo "✓ Latest block number: $BLOCK_NUMBER (hex: $BLOCK_NUMBER_HEX)"
else
    echo "✗ Failed to get latest block number"
fi

# Check BTCBR contract
BTCBR_ADDR="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo "==> Checking BTCBR contract at $BTCBR_ADDR..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["'"$BTCBR_ADDR"'", "latest"],"id":1}' \
  $RPC_ENDPOINT > /tmp/contract_response.json

if [ $? -eq 0 ]; then
    CODE_LENGTH=$(jq -r '.result | length' /tmp/contract_response.json)
    if [ "$CODE_LENGTH" -gt 100 ]; then
        echo "✓ BTCBR contract found (code length: $CODE_LENGTH characters)"
    else
        echo "✗ BTCBR contract not found or has no code"
    fi
else
    echo "✗ Failed to check BTCBR contract"
fi

# Check peers
echo "==> Checking peer count..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  $RPC_ENDPOINT > /tmp/peer_response.json

if [ $? -eq 0 ]; then
    PEER_COUNT_HEX=$(jq -r '.result' /tmp/peer_response.json)
    PEER_COUNT=$(printf "%d" $PEER_COUNT_HEX)
    echo "Peer count: $PEER_COUNT"
else
    echo "✗ Failed to get peer count"
fi

# Cleanup
rm -f /tmp/rpc_response.json /tmp/block_response.json /tmp/contract_response.json /tmp/peer_response.json

echo "==> RPC check complete"
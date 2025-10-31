#!/bin/bash

# Bridge Validator Service Startup Script

echo ""
echo "🚀 Starting Xaheen Bridge Validator Service..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env with required variables"
    exit 1
fi

# Check required environment variables
required_vars=(
    "BSC_MAINNET_RPC"
    "PRIVATE_CHAIN_RPC"
    "MAINNET_PRIVATE_KEY"
    "BNB_BRIDGE_BSC"
    "USDT_BRIDGE_BSC"
    "ETH_BRIDGE_BSC"
    "BNB_BRIDGE_XAHEEN"
    "USDT_BRIDGE_XAHEEN"
    "ETH_BRIDGE_XAHEEN"
    "WBNB_TOKEN_XAHEEN"
    "WUSDT_TOKEN_XAHEEN"
    "WETH_TOKEN_XAHEEN"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        echo "❌ Missing required variable: $var"
        exit 1
    fi
done

echo "✅ Environment variables verified"
echo ""

# Run validator service
echo "Starting validator service..."
echo "Press Ctrl+C to stop"
echo ""

node validator/bridge-validator.js

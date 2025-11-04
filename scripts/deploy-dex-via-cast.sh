#!/bin/bash

################################################################################
# NOOR CHAIN - DEPLOY DEX VIA CAST (FOUNDRY)
#
# Deploys compiled contract bytecode directly via RPC using cast
################################################################################

set -e

RPC="http://3.91.50.187:8545"
PRIVATE_KEY="0x3d5679f1148d19b440646957f146176c063a645dd44fc1b8f759fe613eae8edd"
DEPLOYER="0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C"
BTCBR="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "         🌙 NOOR CHAIN DEX DEPLOYMENT (via cast) 🌙"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "🔗 RPC: $RPC"
echo "👤 Deployer: $DEPLOYER"
echo ""

# Check deployer balance
echo "💰 Checking deployer balance..."
BALANCE=$(cast balance $DEPLOYER --rpc-url $RPC)
echo "   Balance: $(cast --to-unit $BALANCE ether) NOR"
echo ""

# Get current block
BLOCK=$(cast block-number --rpc-url $RPC)
echo "📊 Current block: $BLOCK"
echo ""

# Deploy WNOR
echo "📦 Step 1: Deploying WNOR..."
WNOR_ARTIFACT=".build/artifacts/contracts/dex/WNOR.sol/WNOR.json"

if [ ! -f "$WNOR_ARTIFACT" ]; then
    echo "❌ WNOR artifact not found. Running compile..."
    npx hardhat compile
fi

WNOR_BYTECODE=$(cat $WNOR_ARTIFACT | jq -r '.bytecode')
echo "   Deploying WNOR contract..."
WNOR_ADDR=$(cast send --rpc-url $RPC --private-key $PRIVATE_KEY --create $WNOR_BYTECODE --json | jq -r '.contractAddress')

if [ -z "$WNOR_ADDR" ] || [ "$WNOR_ADDR" == "null" ]; then
    echo "❌ WNOR deployment failed"
    exit 1
fi

echo "   ✅ WNOR deployed at: $WNOR_ADDR"
echo ""

# Deploy NorSwapFactory
echo "📦 Step 2: Deploying NorSwapFactory..."
FACTORY_ARTIFACT=".build/artifacts/contracts/dex/NorSwapFactory.sol/NorSwapFactory.json"
FACTORY_BYTECODE=$(cat $FACTORY_ARTIFACT | jq -r '.bytecode')

# Encode constructor args (feeToSetter = deployer)
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" $DEPLOYER)
FACTORY_DEPLOYMENT_DATA="${FACTORY_BYTECODE}${CONSTRUCTOR_ARGS:2}"

echo "   Deploying Factory contract..."
FACTORY_ADDR=$(cast send --rpc-url $RPC --private-key $PRIVATE_KEY --create $FACTORY_DEPLOYMENT_DATA --json | jq -r '.contractAddress')

if [ -z "$FACTORY_ADDR" ] || [ "$FACTORY_ADDR" == "null" ]; then
    echo "❌ Factory deployment failed"
    exit 1
fi

echo "   ✅ Factory deployed at: $FACTORY_ADDR"

# Get INIT_CODE_HASH
INIT_CODE_HASH=$(cast call $FACTORY_ADDR "INIT_CODE_PAIR_HASH()(bytes32)" --rpc-url $RPC)
echo "   📋 INIT_CODE_HASH: $INIT_CODE_HASH"
echo ""

# Deploy NorSwapRouter
echo "📦 Step 3: Deploying NorSwapRouter..."
ROUTER_ARTIFACT=".build/artifacts/contracts/dex/NorSwapRouter.sol/NorSwapRouter.json"
ROUTER_BYTECODE=$(cat $ROUTER_ARTIFACT | jq -r '.bytecode')

# Encode constructor args (factory, WNOR)
ROUTER_CONSTRUCTOR=$(cast abi-encode "constructor(address,address)" $FACTORY_ADDR $WNOR_ADDR)
ROUTER_DEPLOYMENT_DATA="${ROUTER_BYTECODE}${ROUTER_CONSTRUCTOR:2}"

echo "   Deploying Router contract..."
ROUTER_ADDR=$(cast send --rpc-url $RPC --private-key $PRIVATE_KEY --create $ROUTER_DEPLOYMENT_DATA --json | jq -r '.contractAddress')

if [ -z "$ROUTER_ADDR" ] || [ "$ROUTER_ADDR" == "null" ]; then
    echo "❌ Router deployment failed"
    exit 1
fi

echo "   ✅ Router deployed at: $ROUTER_ADDR"
echo ""

# Create BTCBR/WNOR Pair
echo "📦 Step 4: Creating BTCBR/WNOR trading pair..."
CREATE_PAIR_DATA=$(cast calldata "createPair(address,address)" $BTCBR $WNOR_ADDR)

cast send --rpc-url $RPC --private-key $PRIVATE_KEY $FACTORY_ADDR $CREATE_PAIR_DATA --json > /dev/null

# Get pair address
PAIR_ADDR=$(cast call $FACTORY_ADDR "getPair(address,address)(address)" $BTCBR $WNOR_ADDR --rpc-url $RPC)
echo "   ✅ BTCBR/WNOR Pair created at: $PAIR_ADDR"
echo ""

# Save deployment info
mkdir -p deployments
cat > deployments/nor-dex-deployment.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "chainId": 65001,
  "network": "Nor Chain",
  "rpc": "$RPC",
  "deployer": "$DEPLOYER",
  "contracts": {
    "BTCBR": "$BTCBR",
    "WNOR": "$WNOR_ADDR",
    "NorSwapFactory": "$FACTORY_ADDR",
    "NorSwapRouter": "$ROUTER_ADDR",
    "initCodeHash": "$INIT_CODE_HASH"
  },
  "pairs": [
    {
      "name": "BTCBR/WNOR",
      "address": "$PAIR_ADDR",
      "token0": "$BTCBR",
      "token1": "$WNOR_ADDR"
    }
  ]
}
EOF

echo "📝 Deployment info saved to deployments/nor-dex-deployment.json"
echo ""

echo "═══════════════════════════════════════════════════════════════════════════"
echo "                      🎉 DEPLOYMENT COMPLETE! 🎉"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Deployed Contracts:"
echo "   BTCBR Token:       $BTCBR"
echo "   WNOR:              $WNOR_ADDR"
echo "   NorSwap Factory:  $FACTORY_ADDR"
echo "   NorSwap Router:   $ROUTER_ADDR"
echo "   BTCBR/WNOR Pair:   $PAIR_ADDR"
echo ""
echo "🔗 Network: Nor Chain (Chain ID 65001)"
echo "🌐 RPC: $RPC"
echo ""
echo "📝 Next Steps:"
echo "   1. Add liquidity: npx hardhat run scripts/add-liquidity.js --network btcbr"
echo "   2. Deploy oracle contracts"
echo "   3. Deploy bridge contracts"
echo ""

#!/bin/bash

#
# Deploy Genesis to AWS Validators
#
# This script deploys the production genesis file to all AWS validators
#

set -e

echo "🚀 Deploying Genesis to AWS Validators"
echo "======================================"
echo ""

# Configuration
GENESIS_FILE="data/genesis-nor-complete-v2.json"
AWS_SERVER="3.91.50.187"
AWS_USER="${AWS_USER:-ec2-user}"
AWS_KEY="${AWS_KEY:-~/.ssh/bsc-validator-key.pem}"

# Validator configurations
VALIDATORS=(
  "bsc-validator-1"
  "bsc-validator-2"
  "bsc-validator-3"
)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if genesis file exists
if [ ! -f "$GENESIS_FILE" ]; then
    echo -e "${RED}❌${NC} Genesis file not found: $GENESIS_FILE"
    echo "Run: node scripts/generate-complete-nor-genesis.js"
    exit 1
fi

echo "📋 Configuration:"
echo "   Genesis file: $GENESIS_FILE"
echo "   AWS Server: $AWS_SERVER"
echo "   AWS User: $AWS_USER"
echo "   Validators: ${#VALIDATORS[@]}"
echo ""

# Validate genesis first
echo "🔍 Validating genesis before deployment..."
if [ -f "scripts/validate-production-genesis.sh" ]; then
    ./scripts/validate-production-genesis.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌${NC} Genesis validation failed. Fix issues before deploying."
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Validation script not found, skipping validation"
fi

echo ""
echo "📤 Step 1: Copy genesis file to AWS server..."
echo ""

# Copy genesis to AWS server
echo "   Copying $GENESIS_FILE to $AWS_USER@$AWS_SERVER..."
scp -i "$AWS_KEY" "$GENESIS_FILE" "$AWS_USER@$AWS_SERVER:/tmp/genesis.json"

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅${NC} Genesis file copied successfully"
else
    echo -e "   ${RED}❌${NC} Failed to copy genesis file"
    exit 1
fi

echo ""
echo "🛑 Step 2: Stop all validators..."
echo ""

# SSH command to stop validators
ssh -i "$AWS_KEY" "$AWS_USER@$AWS_SERVER" << 'EOF'
echo "Stopping validators..."
if docker ps | grep -q bsc-validator; then
    docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
    echo "✅ Docker validators stopped"
elif systemctl list-units | grep -q geth-validator; then
    sudo systemctl stop geth-validator-1 geth-validator-2 geth-validator-3 2>/dev/null || true
    echo "✅ Systemd validators stopped"
else
    echo "⚠️  No running validators found"
fi
sleep 5
EOF

echo ""
echo "💾 Step 3: Backup existing data..."
echo ""

# Backup existing blockchain data
ssh -i "$AWS_KEY" "$AWS_USER@$AWS_SERVER" << 'EOF'
BACKUP_DIR="/backup/blockchain-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Backing up validator data..."
for i in 1 2 3; do
    DATA_DIR="/data/validator-$i"
    if [ -d "$DATA_DIR" ]; then
        echo "   Backing up validator-$i..."
        cp -r "$DATA_DIR" "$BACKUP_DIR/validator-$i" 2>/dev/null || true
    fi
done

echo "✅ Backup created at: $BACKUP_DIR"
EOF

echo ""
echo "🗑️  Step 4: Clean old blockchain data..."
echo ""

# Clean old data (CAREFUL - this deletes old chain data)
echo -e "${YELLOW}⚠️  WARNING: This will delete existing blockchain data${NC}"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted by user"
    exit 1
fi

ssh -i "$AWS_KEY" "$AWS_USER@$AWS_SERVER" << 'EOF'
echo "Cleaning old blockchain data..."
for i in 1 2 3; do
    DATA_DIR="/data/validator-$i/geth"
    if [ -d "$DATA_DIR" ]; then
        echo "   Removing $DATA_DIR..."
        rm -rf "$DATA_DIR"
    fi
done
echo "✅ Old data removed"
EOF

echo ""
echo "🔧 Step 5: Initialize validators with new genesis..."
echo ""

# Initialize each validator
ssh -i "$AWS_KEY" "$AWS_USER@$AWS_SERVER" << 'EOF'
GENESIS_FILE="/tmp/genesis.json"

for i in 1 2 3; do
    DATA_DIR="/data/validator-$i"
    mkdir -p "$DATA_DIR"
    
    echo "Initializing validator-$i..."
    geth --datadir "$DATA_DIR" init "$GENESIS_FILE"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Validator-$i initialized"
    else
        echo "   ❌ Validator-$i initialization failed"
        exit 1
    fi
done

echo "✅ All validators initialized"
EOF

echo ""
echo "🚀 Step 6: Start validators..."
echo ""

# Start validators
echo "   Starting validator 1 first..."
ssh -i "$AWS_KEY" "$AWS_USER@$AWS_SERVER" << 'EOF'
# Start validator 1
if command -v docker &> /dev/null; then
    docker start bsc-validator-1
    sleep 10
    docker start bsc-validator-2
    sleep 10
    docker start bsc-validator-3
else
    sudo systemctl start geth-validator-1
    sleep 10
    sudo systemctl start geth-validator-2
    sleep 10
    sudo systemctl start geth-validator-3
fi

echo "✅ All validators started"
EOF

echo ""
echo "✅ Step 7: Verify deployment..."
echo ""

# Wait a bit for validators to start
sleep 15

# Verify chain is running
ssh -i "$AWS_KEY" "$AWS_USER@$AWS_SERVER" << 'EOF'
echo "Checking chain status..."
RPC_URL="http://localhost:8545"

# Check chain ID
CHAIN_ID=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ "$CHAIN_ID" = "0xfde9" ] || [ "$CHAIN_ID" = "0xFDE9" ]; then
    echo "   ✅ Chain ID correct: 65001"
else
    echo "   ⚠️  Chain ID: $CHAIN_ID (expected 0xfde9)"
fi

# Check block number
BLOCK=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$BLOCK" ]; then
    BLOCK_DEC=$((16#${BLOCK:2}))
    echo "   ✅ Current block: $BLOCK_DEC"
else
    echo "   ⚠️  Could not get block number"
fi

# Check BTCBR contract
BTCBR_CODE=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$BTCBR_CODE" ] && [ "$BTCBR_CODE" != "0x" ]; then
    CODE_LEN=$((${#BTCBR_CODE} - 2))
    echo "   ✅ BTCBR contract found: $CODE_LEN bytes"
else
    echo "   ⚠️  BTCBR contract not found"
fi
EOF

echo ""
echo "=========================================="
echo "✅ Deployment Complete"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Monitor block production (should be every 3 seconds)"
echo "   2. Verify all contracts are accessible"
echo "   3. Test DEX operations"
echo "   4. Set up epoch monitoring"
echo ""
echo "🔗 RPC Endpoint: http://$AWS_SERVER:8545"
echo ""


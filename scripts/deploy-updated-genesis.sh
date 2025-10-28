#!/bin/bash

# Deploy Updated Genesis with BTCBR Balance
# This script updates the AWS BSC node with the new genesis file containing BTCBR token balance

set -e

# Configuration
AWS_HOST="${AWS_HOST:-ec2-user@3.91.50.187}"
SSH_KEY="${SSH_KEY:-~/.ssh/btcbr-key.pem}"
LOCAL_GENESIS="data/genesis-updated.json"
REMOTE_GENESIS="/home/ec2-user/genesis-updated.json"
DATA_DIR="/data/bsc/data"

echo "==================================="
echo "Deploy Updated Genesis to AWS"
echo "==================================="
echo ""
echo "⚠️  WARNING: This will reset the blockchain!"
echo "   - All existing blocks will be deleted"
echo "   - Your wallet will have 21 septillion BTCBR tokens"
echo "   - You will still have 27.23 septillion native BNB"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "📤 Step 1: Uploading genesis file..."
scp -i "$SSH_KEY" "$LOCAL_GENESIS" "$AWS_HOST:$REMOTE_GENESIS"

echo ""
echo "🛑 Step 2: Stopping BSC node..."
ssh -i "$SSH_KEY" "$AWS_HOST" << 'EOF'
    cd /home/ec2-user/blockchain-v2
    docker-compose down || true
EOF

echo ""
echo "🗑️  Step 3: Removing old blockchain data..."
ssh -i "$SSH_KEY" "$AWS_HOST" << 'EOF'
    sudo rm -rf /data/bsc/data/geth
    echo "✅ Old data removed"
EOF

echo ""
echo "🔧 Step 4: Re-initializing with updated genesis..."
ssh -i "$SSH_KEY" "$AWS_HOST" << 'EOF'
    docker run --rm \
        -v /data/bsc/data:/data \
        -v /home/ec2-user/genesis-updated.json:/genesis.json \
        bnbchain/bsc:v1.4.15 \
        geth --datadir /data init /genesis.json
    
    echo "✅ Genesis initialized"
EOF

echo ""
echo "🚀 Step 5: Starting BSC node..."
ssh -i "$SSH_KEY" "$AWS_HOST" << 'EOF'
    cd /home/ec2-user/blockchain-v2
    docker-compose up -d
    echo "✅ BSC node started"
EOF

echo ""
echo "⏳ Step 6: Waiting for node to start (30 seconds)..."
sleep 30

echo ""
echo "🔍 Step 7: Verifying BTCBR balance..."
ssh -i "$SSH_KEY" "$AWS_HOST" << 'EOF'
    echo "Checking BTCBR balance for 0x81bDAf1ac2094D5133937B3361A38a4976E55acc..."
    
    curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{
            "jsonrpc": "2.0",
            "method": "eth_call",
            "params": [{
                "to": "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
                "data": "0x70a0823100000000000000000000000081bdaf1ac2094d5133937b3361a38a4976e55acc"
            }, "latest"],
            "id": 1
        }' | jq -r '.result' | {
            read balance_hex
            if [ "$balance_hex" = "0x43dacaf91c1a84ff08000000" ]; then
                echo "✅ BTCBR Balance: 21,000,000,000 BTCBR (21 septillion)"
            else
                echo "⚠️  Balance: $balance_hex"
            fi
        }
EOF

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "📊 Summary:"
echo "  - BTCBR Contract: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo "  - Your Wallet: 0x81bDAf1ac2094D5133937B3361A38a4976E55acc"
echo "  - BTCBR Balance: 21 septillion tokens"
echo "  - Native BNB: 27.23 septillion"
echo ""
echo "🔗 Add BTCBR to MetaMask:"
echo "  1. Token Address: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo "  2. Token Symbol: BTCBR"
echo "  3. Decimals: 18"
echo ""
echo "💡 Your BTCBR tokens should now appear in MetaMask!"

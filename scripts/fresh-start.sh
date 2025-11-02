#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# FRESH START - Clean Genesis Deployment
#═══════════════════════════════════════════════════════════════════════════
#
# This script performs a COMPLETE FRESH START of Xaheen Chain:
# - Stops all validators
# - Cleans all blockchain data
# - Deploys clean genesis with epoch 9,000,000
# - Re-initializes all validators
# - Starts fresh chain
#
# ⚠️  WARNING: This DELETES all old blockchain data!
#     NO contracts, NO liquidity, NO transaction history preserved.
#     This is a CLEAN START for playbook implementation.
#═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

SERVER="3.91.50.187"
SSH_KEY="~/.ssh/bsc-validator-key.pem"
GENESIS_FILE="./data/genesis-clean.json"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    FRESH START - Clean Genesis                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  CRITICAL WARNING: This will DELETE all blockchain data!"
echo "   - All contracts will be gone"
echo "   - All liquidity will be gone"
echo "   - All transaction history will be gone"
echo "   - This is a CLEAN START"
echo ""
echo "What this preserves:"
echo "   ✅ Chain ID 65001 (wallet compatibility)"
echo "   ✅ Validator keys (will be reused)"
echo "   ✅ Same network configuration"
echo ""
echo "What changes:"
echo "   🔥 Epoch: 9,000,000 (proper from day 1)"
echo "   🧹 Clean state (no contracts, no liquidity)"
echo "   🆕 Block 0 - fresh blockchain"
echo ""

read -p "Are you ABSOLUTELY sure you want to proceed? (type 'FRESH START' to confirm): " confirm

if [ "$confirm" != "FRESH START" ]; then
    echo "❌ Aborted - confirmation not received"
    exit 1
fi

echo ""
echo "✅ Confirmed - proceeding with fresh start"
echo ""

#═══════════════════════════════════════════════════════════════════════════
# PHASE 1: STOP ALL VALIDATORS
#═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                       PHASE 1: STOP VALIDATORS                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🛑 Stopping all validators..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$SERVER '
    echo "Stopping validators..."
    docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 || true
    echo "✅ All validators stopped"
'

echo ""

#═══════════════════════════════════════════════════════════════════════════
# PHASE 2: CLEAN ALL DATA
#═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                       PHASE 2: CLEAN ALL DATA                             ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🧹 Cleaning all blockchain data..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$SERVER '
    echo "Removing blockchain data (preserving keystore)..."

    # Remove geth data but keep keystore
    sudo rm -rf /home/ec2-user/validator-1/geth || true
    sudo rm -rf /home/ec2-user/validator-2/geth || true
    sudo rm -rf /home/ec2-user/validator-3/geth || true

    # Remove old genesis files
    sudo rm -f /home/ec2-user/genesis*.json || true

    echo "✅ All blockchain data cleaned"
    echo "✅ Keystore files preserved"
'

echo ""

#═══════════════════════════════════════════════════════════════════════════
# PHASE 3: UPLOAD CLEAN GENESIS
#═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                   PHASE 3: UPLOAD CLEAN GENESIS                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "$GENESIS_FILE" ]; then
    echo "❌ ERROR: Clean genesis file not found at $GENESIS_FILE"
    echo "   Run: node scripts/generate-clean-genesis.js first"
    exit 1
fi

echo "📤 Uploading clean genesis..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no $GENESIS_FILE ec2-user@$SERVER:/home/ec2-user/genesis.json

echo "✅ Clean genesis uploaded"
echo ""

#═══════════════════════════════════════════════════════════════════════════
# PHASE 4: RE-INITIALIZE ALL VALIDATORS
#═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                   PHASE 4: RE-INITIALIZE VALIDATORS                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🔄 Re-initializing all validators with clean genesis..."

ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$SERVER << 'ENDSSH'
    echo "Initializing validator 1..."
    docker run --rm \
        -v /home/ec2-user/validator-1:/bsc \
        -v /home/ec2-user/genesis.json:/genesis.json \
        dysnix/bsc \
        init --datadir /bsc /genesis.json

    echo ""
    echo "Initializing validator 2..."
    docker run --rm \
        -v /home/ec2-user/validator-2:/bsc \
        -v /home/ec2-user/genesis.json:/genesis.json \
        dysnix/bsc \
        init --datadir /bsc /genesis.json

    echo ""
    echo "Initializing validator 3..."
    docker run --rm \
        -v /home/ec2-user/validator-3:/bsc \
        -v /home/ec2-user/genesis.json:/genesis.json \
        dysnix/bsc \
        init --datadir /bsc /genesis.json

    echo ""
    echo "✅ All validators initialized with clean genesis"
ENDSSH

echo ""

#═══════════════════════════════════════════════════════════════════════════
# PHASE 5: START VALIDATORS
#═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                       PHASE 5: START VALIDATORS                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🚀 Starting validators..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$SERVER '
    docker start xaheen-rpc
    docker start bsc-validator-2
    docker start bsc-validator-3
    echo "✅ All validators started"
'

echo ""
echo "⏳ Waiting 30 seconds for startup and peer discovery..."
sleep 30

echo ""

#═══════════════════════════════════════════════════════════════════════════
# PHASE 6: VERIFY BLOCKCHAIN
#═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                       PHASE 6: VERIFY BLOCKCHAIN                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Checking blockchain status..."
echo ""

# Check block number (should be 0 or increasing)
echo "Block number:"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$SERVER '
    for i in {1..5}; do
        BLOCK=$(curl -s -X POST http://localhost:8545 \
            -H "Content-Type: application/json" \
            --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" \
            | grep -o "\"result\":\"[^\"]*\"" | cut -d":" -f2 | tr -d "\"")

        if [ -n "$BLOCK" ]; then
            DEC=$((16#${BLOCK:2}))
            echo "  Attempt $i: Block $DEC"
        else
            echo "  Attempt $i: No response"
        fi

        sleep 3
    done
'

echo ""

# Check validator status
echo "Validator status:"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$SERVER '
    docker ps --filter "name=validator" --format "{{.Names}}\t{{.Status}}"
'

echo ""

# Check peer count
echo "Peer count:"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$SERVER '
    PEERS=$(curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}" \
        | grep -o "\"result\":\"[^\"]*\"" | cut -d":" -f2 | tr -d "\"")

    if [ -n "$PEERS" ]; then
        DEC=$((16#${PEERS:2}))
        echo "  $DEC peers"
    else
        echo "  No response"
    fi
'

echo ""

#═══════════════════════════════════════════════════════════════════════════
# SUCCESS
#═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                      FRESH START COMPLETE! ✅                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Your blockchain is now running with:"
echo "   ✅ Clean genesis (epoch 9,000,000)"
echo "   ✅ Fresh start from block 0"
echo "   ✅ No old state, contracts, or liquidity"
echo "   ✅ Ready for playbook implementation"
echo ""
echo "📊 Verification checklist:"
echo "   1. Block number should be increasing (0, 1, 2, ...)"
echo "   2. Peer count should be 2 (3 validators - self)"
echo "   3. All validators should show 'Up' status"
echo ""
echo "📋 Next steps (Phase 1 of Master Plan):"
echo "   1. Deploy BTCBR token"
echo "   2. Deploy WXHT wrapper"
echo "   3. Deploy DEX (Factory, Router)"
echo "   4. Deploy FundUnit token standard"
echo "   5. Deploy Shariah Oracle"
echo "   6. Deploy XCC compliance framework"
echo "   7. Deploy NAV Oracle"
echo "   8. Deploy Zakat Engine"
echo ""
echo "📚 Documentation:"
echo "   - Epoch Strategy: docs/00-critical/EPOCH_STRATEGY.md"
echo "   - Master Plan: docs/08-strategy/XAHEEN_IMPLEMENTATION_MASTER_PLAN.md"
echo "   - Contract Deployment: Follow Phase 1 of master plan"
echo ""
echo "🌐 RPC Endpoint: https://rpc.xaheen.org"
echo "🔍 Explorer: (to be deployed)"
echo ""
echo "⏰ Next Epoch Boundary: Block 9,000,000 (~October 2026)"
echo "📅 First Alert: Block 8,999,800 (200 blocks before)"
echo ""

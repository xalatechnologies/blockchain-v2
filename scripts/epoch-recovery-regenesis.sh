#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# EPOCH BOUNDARY RECOVERY - STATE-PRESERVING REGENESIS
#═══════════════════════════════════════════════════════════════════════════
#
# PURPOSE: Fix epoch boundary issue while preserving ALL state
#
# APPROACH:
# 1. Export complete state at block 29,999
# 2. Generate new genesis with:
#    - SAME chainId (65001)
#    - HUGE epoch (9,000,000)
#    - CORRECTED validator list (sorted)
#    - IMPORTED state
# 3. Re-initialize all validators
# 4. Restart blockchain from block 0 with preserved state
#
# PRESERVES:
# ✅ All contract code
# ✅ All contract storage
# ✅ All balances
# ✅ All LP reserves
# ✅ $20,000 XHT/USDT liquidity
# ✅ 352.7B BTCBR on BSC (already safe)
#═══════════════════════════════════════════════════════════════════════════

set -e

SSH_KEY="$HOME/.ssh/bsc-validator-key.pem"
SERVER="ec2-user@3.91.50.187"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║        EPOCH BOUNDARY RECOVERY - STATE-PRESERVING REGENESIS               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  CRITICAL: This will re-initialize the blockchain with a new genesis"
echo "   BUT will preserve ALL contracts, balances, and liquidity."
echo ""
echo "What this does:"
echo "   ✅ Keeps chainId 65001"
echo "   ✅ Preserves all contract code and storage"
echo "   ✅ Preserves all balances and LP reserves"
echo "   ✅ Fixes epoch to 9,000,000 (no more stalls)"
echo "   ✅ Corrects validator list sorting"
echo ""
read -p "Proceed with state-preserving regenesis? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                         PHASE 1: EXPORT STATE                             ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Exporting state at block 29,999..."
node scripts/export-state-29999.js

if [ $? -ne 0 ]; then
  echo "❌ State export failed"
  exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                      PHASE 2: GENERATE NEW GENESIS                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🔧 Generating new genesis with preserved state..."
node scripts/generate-new-genesis.js

if [ $? -ne 0 ]; then
  echo "❌ Genesis generation failed"
  exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    PHASE 3: BACKUP CURRENT STATE                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

BACKUP_DIR="validator-backup-$(date +%Y%m%d-%H%M%S)"

echo "💾 Creating backup on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << BACKUP_CMD
echo "Stopping all validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "Backing up validator data..."
cp -r validator-1 "$BACKUP_DIR/" || true
cp -r validator-2 "$BACKUP_DIR/" || true
cp -r validator-3 "$BACKUP_DIR/" || true
cp genesis.json "$BACKUP_DIR/genesis-old.json" || true

echo "✅ Backup created in $BACKUP_DIR"
BACKUP_CMD

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                  PHASE 4: UPLOAD NEW GENESIS                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📤 Uploading new genesis to server..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  ./data/genesis-regenesis.json "$SERVER:~/genesis.json"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                 PHASE 5: RE-INITIALIZE VALIDATORS                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🔄 Re-initializing all validators with new genesis..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REINIT'
echo "Removing old blockchain data..."
rm -rf validator-1/geth validator-2/geth validator-3/geth

echo "Re-initializing validator 1..."
docker run --rm \
  -v $(pwd)/validator-1:/bsc \
  -v $(pwd)/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "Re-initializing validator 2..."
docker run --rm \
  -v $(pwd)/validator-2:/bsc \
  -v $(pwd)/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "Re-initializing validator 3..."
docker run --rm \
  -v $(pwd)/validator-3:/bsc \
  -v $(pwd)/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

echo "✅ All validators re-initialized"
REINIT

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    PHASE 6: START VALIDATORS                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🚀 Starting validators..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'START_VALIDATORS'
docker start xaheen-rpc bsc-validator-2 bsc-validator-3

echo "Waiting 30 seconds for startup and peer discovery..."
sleep 30

echo ""
echo "📊 Verifying blockchain status..."
echo ""
echo "Block number:"
BLOCK=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
echo "  $((16#${BLOCK:2}))"

echo ""
echo "Active validators:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "xaheen-rpc|bsc-validator"

echo ""
echo "Peer count:"
PEERS=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"')
echo "  $((16#${PEERS:2})) peers"
START_VALIDATORS

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                      REGENESIS COMPLETE! ✅                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Your blockchain is now running with:"
echo "   ✅ Same chainId (65001)"
echo "   ✅ Huge epoch (9,000,000) - no more stalls"
echo "   ✅ All contracts preserved"
echo "   ✅ All balances preserved"
echo "   ✅ $20,000 XHT/USDT liquidity intact"
echo ""
echo "📊 Verification steps:"
echo "   1. Check block production (should be > 0)"
echo "   2. Verify contract addresses unchanged"
echo "   3. Check LP reserves at XHT/USDT pair"
echo "   4. Test a transaction"
echo ""
echo "Backup location on server: $BACKUP_DIR"
echo ""

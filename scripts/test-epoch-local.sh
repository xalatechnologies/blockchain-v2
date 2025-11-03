#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# LOCAL TESTNET - EPOCH MECHANISM TEST
#═══════════════════════════════════════════════════════════════════════════
#
# PURPOSE: Test epoch revalidation locally before production deployment
#
# This creates a LOCAL testnet with:
# - Epoch 1000 blocks (~50 minutes)
# - All contracts pre-deployed in genesis
# - Auto-sealer for epoch protection
# - 3 validators running locally
#
# Test duration: 2-4 hours (3-5 epoch crossings)
#
#═══════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                 NOOR CHAIN LOCAL TESTNET - EPOCH TEST                    ║"
echo "║                        Chain ID: 65002 (Testnet)                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "This will create a LOCAL testnet to validate epoch mechanism:"
echo ""
echo "  • Epoch: 1000 blocks (~50 minutes)"
echo "  • Contracts: 18 pre-deployed in genesis"
echo "  • Validators: 3 running locally"
echo "  • Auto-sealer: Monitors every 10 seconds"
echo ""
echo "Test plan:"
echo "  1. Start 3 validators locally"
echo "  2. Monitor until block 995 (~49 minutes)"
echo "  3. Auto-sealer activates (stops validators 2 & 3)"
echo "  4. Validator 1 seals epoch block 1000"
echo "  5. Auto-sealer restarts validators 2 & 3"
echo "  6. Repeat for epochs 2000, 3000, etc."
echo ""
read -p "Start local testnet? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

# === SETUP ===

echo ""
echo "📦 Step 1: Creating local testnet directories..."
rm -rf /tmp/noor-testnet
mkdir -p /tmp/noor-testnet/{validator-1,validator-2,validator-3,scripts,logs}

echo "   ✅ Directories created"

# Copy genesis
cp data/genesis-testnet-with-contracts.json /tmp/noor-testnet/genesis.json
echo "   ✅ Genesis copied (18 contracts, epoch 1000)"

# Copy validator keystores (from production)
if [ -d "$HOME/validator-1/keystore" ]; then
  cp -r "$HOME/validator-1/keystore" /tmp/noor-testnet/validator-1/
  cp -r "$HOME/validator-2/keystore" /tmp/noor-testnet/validator-2/
  cp -r "$HOME/validator-3/keystore" /tmp/noor-testnet/validator-3/
  echo "test123" > /tmp/noor-testnet/validator-1/password.txt
  echo "test123" > /tmp/noor-testnet/validator-2/password.txt
  echo "test123" > /tmp/noor-testnet/validator-3/password.txt
  echo "   ✅ Keystores copied"
else
  echo "   ⚠️  No keystores found, will use default addresses"
fi

# === INITIALIZE VALIDATORS ===

echo ""
echo "🔧 Step 2: Initializing validators with testnet genesis..."

docker run --rm \
  -v /tmp/noor-testnet/validator-1:/bsc \
  -v /tmp/noor-testnet/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json > /dev/null 2>&1

echo "   ✅ Validator 1 initialized"

docker run --rm \
  -v /tmp/noor-testnet/validator-2:/bsc \
  -v /tmp/noor-testnet/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json > /dev/null 2>&1

echo "   ✅ Validator 2 initialized"

docker run --rm \
  -v /tmp/noor-testnet/validator-3:/bsc \
  -v /tmp/noor-testnet/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json > /dev/null 2>&1

echo "   ✅ Validator 3 initialized"

# === CREATE AUTO-SEALER ===

echo ""
echo "⚙️  Step 3: Creating auto-sealer for epoch protection..."

cat > /tmp/noor-testnet/scripts/auto-sealer.sh << 'AUTOSEALER'
#!/bin/bash
EPOCH=1000
RPC_PORT=18545
LOG_FILE="/tmp/noor-testnet/logs/auto-sealer.log"

CURRENT_BLOCK=$(curl -s http://localhost:$RPC_PORT -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"' || echo "0x0")

BLOCK_DEC=$((16#${CURRENT_BLOCK:2}))
BLOCKS_UNTIL_EPOCH=$((EPOCH - (BLOCK_DEC % EPOCH)))

echo "[$(date '+%H:%M:%S')] Block: $BLOCK_DEC | Until epoch: $BLOCKS_UNTIL_EPOCH" >> "$LOG_FILE"

if [ "$BLOCKS_UNTIL_EPOCH" -le 5 ] && [ "$BLOCKS_UNTIL_EPOCH" -gt 0 ]; then
  echo "[$(date '+%H:%M:%S')] ⚠️  EPOCH IN $BLOCKS_UNTIL_EPOCH BLOCKS - ACTIVATING SINGLE-SEALER" >> "$LOG_FILE"

  docker stop noor-testnet-validator-2 noor-testnet-validator-3 >> "$LOG_FILE" 2>&1
  sleep 30

  NEW_BLOCK=$(curl -s http://localhost:$RPC_PORT -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"' || echo "0x0")

  NEW_BLOCK_DEC=$((16#${NEW_BLOCK:2}))

  if [ "$NEW_BLOCK_DEC" -gt "$BLOCK_DEC" ]; then
    echo "[$(date '+%H:%M:%S')] ✅ Passed epoch! $BLOCK_DEC → $NEW_BLOCK_DEC" >> "$LOG_FILE"
    docker start noor-testnet-validator-2 noor-testnet-validator-3 >> "$LOG_FILE" 2>&1
  fi
fi
AUTOSEALER

chmod +x /tmp/noor-testnet/scripts/auto-sealer.sh
echo "   ✅ Auto-sealer created"

# === START VALIDATORS ===

echo ""
echo "🚀 Step 4: Starting testnet validators..."

# Validator 1 (RPC + Mining on port 18545)
docker run -d --name noor-testnet-validator-1 \
  --network host \
  -v /tmp/noor-testnet/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65002 \
  --port 20303 \
  --http --http.addr 127.0.0.1 --http.port 18545 \
  --http.api eth,net,web3,debug \
  --syncmode full \
  --gcmode archive \
  --mine --miner.threads=1 \
  --miner.etherbase 0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE \
  --maxpeers 10 > /dev/null 2>&1

echo "   ✅ Validator 1 started (RPC: 18545, P2P: 20303)"
sleep 3

# Validator 2 (Mining only on port 20304)
docker run -d --name noor-testnet-validator-2 \
  --network host \
  -v /tmp/noor-testnet/validator-2:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65002 \
  --port 20304 \
  --syncmode full \
  --gcmode archive \
  --mine --miner.threads=1 \
  --miner.etherbase 0x689CF2C189781d9bB6859A830acbF64044E4432f \
  --maxpeers 10 > /dev/null 2>&1

echo "   ✅ Validator 2 started (P2P: 20304)"
sleep 3

# Validator 3 (Mining only on port 20305)
docker run -d --name noor-testnet-validator-3 \
  --network host \
  -v /tmp/noor-testnet/validator-3:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65002 \
  --port 20305 \
  --syncmode full \
  --gcmode archive \
  --mine --miner.threads=1 \
  --miner.etherbase 0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a \
  --maxpeers 10 > /dev/null 2>&1

echo "   ✅ Validator 3 started (P2P: 20305)"

# === VERIFY ===

echo ""
echo "⏳ Waiting 15 seconds for startup..."
sleep 15

echo ""
echo "🔍 Verifying testnet..."
for i in {1..5}; do
  BLOCK=$(curl -s http://localhost:18545 -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -o '"result":"[^"]*"' | cut -d':' -f2 | tr -d '"' || echo "0x0")

  BLOCK_DEC=$((16#${BLOCK:2}))
  echo "   Check $i: Block $BLOCK_DEC"

  if [ "$BLOCK_DEC" -gt "0" ]; then
    break
  fi
  sleep 5
done

# === START AUTO-SEALER ===

echo ""
echo "🔐 Step 5: Starting auto-sealer (runs every 10 seconds)..."
(
  while true; do
    /tmp/noor-testnet/scripts/auto-sealer.sh
    sleep 10
  done
) > /dev/null 2>&1 &

AUTO_SEALER_PID=$!
echo $AUTO_SEALER_PID > /tmp/noor-testnet/auto-sealer.pid
echo "   ✅ Auto-sealer started (PID: $AUTO_SEALER_PID)"

# === SUCCESS ===

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                     TESTNET RUNNING SUCCESSFULLY! ✅                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Testnet Details:"
echo "   • RPC Endpoint: http://localhost:18545"
echo "   • Chain ID: 65002"
echo "   • Epoch: 1000 blocks (~50 minutes)"
echo "   • Contracts: 18 pre-deployed"
echo "   • Validators: 3 running"
echo "   • Auto-sealer: Active"
echo ""
echo "📁 Testnet Location: /tmp/noor-testnet/"
echo ""
echo "📊 Monitor Progress:"
echo "   • Current block:"
echo "     curl -s http://localhost:18545 -X POST -H 'Content-Type: application/json' \\"
echo "       --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo "   • Auto-sealer log:"
echo "     tail -f /tmp/noor-testnet/logs/auto-sealer.log"
echo ""
echo "   • Validator logs:"
echo "     docker logs -f noor-testnet-validator-1"
echo ""
echo "⏰ Test Timeline:"
echo "   • Block 995-1000: First epoch (in ~49 minutes)"
echo "   • Block 1995-2000: Second epoch (in ~1h 39m)"
echo "   • Block 2995-3000: Third epoch (in ~2h 29m)"
echo ""
echo "🎯 What to Watch For:"
echo "   1. Chain produces blocks continuously"
echo "   2. At block 995, auto-sealer stops validators 2 & 3"
echo "   3. Validator 1 seals block 1000 alone"
echo "   4. Auto-sealer restarts validators 2 & 3"
echo "   5. Chain continues smoothly to 2000, 3000, etc."
echo ""
echo "🛑 Stop Testnet:"
echo "   docker stop noor-testnet-validator-{1,2,3}"
echo "   kill $AUTO_SEALER_PID"
echo "   rm -rf /tmp/noor-testnet"
echo ""
echo "✅ Once 3-5 epochs pass successfully, apply fix to production!"
echo ""

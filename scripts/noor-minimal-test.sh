#!/bin/bash

# Minimal configuration test - strip down to ONLY essential flags
# to isolate the snap protocol issue

SERVER="3.91.50.187"
VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🔬 MINIMAL CONFIGURATION TEST 🔬                                 ║"
echo "║          Testing with ONLY essential flags to isolate snap issue         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

cat << 'REMOTE_SCRIPT' > /tmp/minimal-test.sh
#!/bin/bash

VALIDATOR1="0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE"
VALIDATOR2="0x689CF2C189781d9bB6859A830acbF64044E4432f"
VALIDATOR3="0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"

echo "🛑 Stopping validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null

echo "✅ Creating validators with MINIMAL flags (no gcmode, cache, etc)..."

# Validator 1 - MINIMAL flags only
docker create --name xaheen-rpc \
  --network host \
  -v /home/ec2-user/validator-1:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --unlock $VALIDATOR1 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api eth,net,web3 \
  --port 30303 > /dev/null

# Validator 2 - MINIMAL
docker create --name bsc-validator-2 \
  --network host \
  -v /home/ec2-user/validator-2:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --unlock $VALIDATOR2 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --port 30304 > /dev/null

# Validator 3 - MINIMAL
docker create --name bsc-validator-3 \
  --network host \
  -v /home/ec2-user/validator-3:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --mine \
  --unlock $VALIDATOR3 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --port 30305 > /dev/null

echo "✅ Validators created with minimal configuration"

echo "▶️  Starting validators..."
docker start xaheen-rpc bsc-validator-2 bsc-validator-3
sleep 30

echo ""
echo "📊 Monitoring (10 checks over 30 seconds)..."
for i in {1..10}; do
  BLOCK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')
  PEERS=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d":" -f2 | tr -d '"')

  if [ -n "$BLOCK" ] && [ -n "$PEERS" ]; then
    DEC_BLOCK=$((16#${BLOCK:2}))
    DEC_PEERS=$((16#${PEERS:2}))

    if [ "$DEC_BLOCK" -gt "1" ]; then
      echo "   ✅ Check $i/10: Block $DEC_BLOCK | Peers $DEC_PEERS (BLOCKS PRODUCING!)"
    else
      echo "   ⏸  Check $i/10: Block $DEC_BLOCK | Peers $DEC_PEERS"
    fi
  fi
  sleep 3
done

echo ""
echo "📋 Checking for snap protocol errors..."
docker logs xaheen-rpc 2>&1 | grep -i "snap" | tail -5

REMOTE_SCRIPT

scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  /tmp/minimal-test.sh \
  ec2-user@$SERVER:/home/ec2-user/minimal-test.sh

echo "🚀 Executing minimal configuration test..."
ssh -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no \
  ec2-user@$SERVER \
  'bash /home/ec2-user/minimal-test.sh'

echo ""
echo "✅ Minimal test complete"

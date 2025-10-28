#!/bin/bash
# Deploy fixed BTCBR genesis to server and reinitialize validators

set -e

SERVER="ubuntu@3.91.50.187"
GENESIS_FILE="data/genesis-btcbr-fixed.json"

echo "========================================="
echo "Deploying Fixed BTCBR Genesis"
echo "========================================="

# Check if genesis file exists
if [ ! -f "$GENESIS_FILE" ]; then
    echo "Error: Genesis file not found at $GENESIS_FILE"
    exit 1
fi

echo "1. Uploading fixed genesis to server..."
scp "$GENESIS_FILE" "$SERVER:~/bsc-production/config/genesis.json"

echo -e "\n2. Stopping all validators..."
ssh "$SERVER" << 'ENDSSH'
cd ~/bsc-production
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
ENDSSH

echo -e "\n3. Removing old blockchain data..."
ssh "$SERVER" << 'ENDSSH'
cd ~/bsc-production
rm -rf validator-1/geth validator-2/geth validator-3/geth
ENDSSH

echo -e "\n4. Reinitializing validators with fixed genesis..."
ssh "$SERVER" << 'ENDSSH'
cd ~/bsc-production
docker run --rm -v $(pwd)/validator-1:/bsc -v $(pwd)/config/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v $(pwd)/validator-2:/bsc -v $(pwd)/config/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v $(pwd)/validator-3:/bsc -v $(pwd)/config/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
ENDSSH

echo -e "\n5. Starting validator 1 (main RPC)..."
ssh "$SERVER" << 'ENDSSH'
cd ~/bsc-production
docker run -d \
  --name bsc-validator-1 \
  --network host \
  -v $(pwd)/validator-1:/bsc \
  -v $(pwd)/validator-1/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 885824 \
  --syncmode full \
  --gcmode archive \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api eth,net,web3,txpool \
  --http.corsdomain "*" \
  --http.vhosts "*" \
  --ws \
  --ws.addr 0.0.0.0 \
  --ws.port 8546 \
  --ws.origins "*" \
  --port 30303 \
  --password /password.txt \
  --unlock 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
  --mine \
  --miner.etherbase 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
  --allow-insecure-unlock \
  --maxpeers 25
ENDSSH

echo -e "\n6. Waiting for validator 1 to start..."
sleep 5

echo -e "\n7. Getting enode address from validator 1..."
ssh "$SERVER" << 'ENDSSH'
sleep 3
docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/' > /tmp/enode1.txt
cat /tmp/enode1.txt
ENDSSH

echo -e "\n8. Starting validators 2 and 3..."
ssh "$SERVER" << 'ENDSSH'
cd ~/bsc-production

# Start validator 2
docker run -d \
  --name bsc-validator-2 \
  --network host \
  -v $(pwd)/validator-2:/bsc \
  -v $(pwd)/validator-2/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 885824 \
  --port 30304 \
  --unlock 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
  --mine \
  --miner.etherbase 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
  --allow-insecure-unlock \
  --maxpeers 25

# Start validator 3
docker run -d \
  --name bsc-validator-3 \
  --network host \
  -v $(pwd)/validator-3:/bsc \
  -v $(pwd)/validator-3/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 885824 \
  --port 30305 \
  --unlock 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
  --mine \
  --miner.etherbase 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
  --allow-insecure-unlock \
  --maxpeers 25
ENDSSH

echo -e "\n9. Waiting for validators to start..."
sleep 10

echo -e "\n10. Getting all enode addresses..."
ssh "$SERVER" << 'ENDSSH'
echo "=== Enode Addresses ==="
docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1
docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1
docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1
ENDSSH

echo -e "\n11. Creating static-nodes.json files..."
ssh "$SERVER" << 'ENDSSH'
cd ~/bsc-production

# Extract enodes
ENODE1=$(docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
ENODE2=$(docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
ENODE3=$(docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')

# Create static-nodes.json for each validator
echo "[\"$ENODE2\", \"$ENODE3\"]" > validator-1/static-nodes.json
echo "[\"$ENODE1\", \"$ENODE3\"]" > validator-2/static-nodes.json
echo "[\"$ENODE1\", \"$ENODE2\"]" > validator-3/static-nodes.json
ENDSSH

echo -e "\n12. Restarting validators to apply static-nodes.json..."
ssh "$SERVER" << 'ENDSSH'
cd ~/bsc-production
docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3
ENDSSH

echo -e "\n13. Waiting for chain to start..."
sleep 15

echo -e "\n========================================="
echo "Verifying BTCBR Balances"
echo "========================================="

echo -e "\nChecking block number..."
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq

echo -e "\nChecking peer count..."
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq

echo -e "\nChecking your BTCBR balance..."
BALANCE=$(curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x70a08231000000000000000000000000dD779a290C937144F80Eb75b75d814c834536B1b"},"latest"],"id":1}' \
  | jq -r '.result')

echo "Raw balance: $BALANCE"

# Convert hex to decimal
python3 << EOF
balance_hex = "$BALANCE"
balance_int = int(balance_hex, 16)
balance_tokens = balance_int / (10**18)
print(f"\nYour BTCBR Balance: {balance_tokens:,.2f} tokens")
print(f"Raw amount: {balance_int:,}")
EOF

echo -e "\n========================================="
echo "Deployment Complete!"
echo "========================================="
echo "RPC Endpoint: http://3.91.50.187:8545"
echo "BTCBR Contract: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo "Your Wallet: 0xdD779a290C937144F80Eb75b75d814c834536B1b"

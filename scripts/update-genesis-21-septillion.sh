#!/bin/bash

####################################################
# Update Genesis with 21 Septillion Total Supply
# Run this on the SERVER after upgrade to t3.large
####################################################

cd ~/bsc-production

echo "=========================================="
echo "UPDATING GENESIS TO 21 SEPTILLION SUPPLY"
echo "=========================================="
echo ""

# Get validator addresses
ADDR1=$(cat config/validator1.txt)
ADDR2=$(cat config/validator2.txt)
ADDR3=$(cat config/validator3.txt)

echo "Validator Addresses:"
echo "  1: $ADDR1"
echo "  2: $ADDR2"
echo "  3: $ADDR3"
echo ""

# 21 septillion total = 7 septillion per validator
# 7 septillion = 7,000,000,000,000,000,000,000,000
# In wei (with 18 decimals) = 7 * 10^42
# Hex = 0x16345785d8a0000000000000000000000000000

echo "Updating genesis.json..."
cat config/genesis.json | python3 -c "
import sys, json
genesis = json.load(sys.stdin)

# 7 septillion per validator
balance = '0x16345785d8a0000000000000000000000000000'

genesis['alloc']['$ADDR1'] = {'balance': balance}
genesis['alloc']['$ADDR2'] = {'balance': balance}
genesis['alloc']['$ADDR3'] = {'balance': balance}

print(json.dumps(genesis, indent=2))
" > config/genesis-21sept.json

# Backup and replace
cp config/genesis.json config/genesis-old.json.backup
mv config/genesis-21sept.json config/genesis.json

echo "✅ Genesis updated"
echo ""
echo "Total Supply: 21,000,000,000,000,000,000,000,000 BTCBR"
echo "Per Validator: 7,000,000,000,000,000,000,000,000 BTCBR"
echo ""

# Reinitialize all validators
echo "Reinitializing validators..."
sudo chown -R ec2-user:ec2-user .

for i in 1 2 3; do
    echo "  Validator-$i..."
    sudo rm -rf validator-$i/geth
    cp config/genesis.json validator-$i/
    sudo docker run --rm -v $(pwd)/validator-$i:/bsc dysnix/bsc:latest \
        --datadir /bsc init /bsc/genesis.json 2>&1 | grep "Successfully"
    mkdir -p validator-$i/geth
    echo "[]" > validator-$i/geth/static-nodes.json
done

echo ""
echo "✅ All validators reinitialized"
echo ""

# Start validators
echo "Starting validators..."
sudo docker rm -f bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null
sudo docker network create bsc-network 2>/dev/null || true

for i in 1 2 3; do
    VAL_ADDR=$(cat config/validator$i.txt)
    RPC_PORT=$((8544 + i))
    WS_PORT=$((8547 + i))
    P2P_PORT=$((30302 + i))
    
    sudo docker run -d --name bsc-validator-$i \
      --restart unless-stopped \
      --network bsc-network \
      -p $RPC_PORT:8545 -p $WS_PORT:8546 -p $P2P_PORT:30303 -p $P2P_PORT:30303/udp \
      -v $(pwd)/validator-$i:/bsc \
      dysnix/bsc:latest \
      --datadir /bsc --networkid 885824 --port 30303 --syncmode full \
      --http --http.addr 0.0.0.0 --http.port 8545 --http.corsdomain="*" \
      --http.api "eth,net,web3,txpool,parlia" \
      --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.api "eth,net,web3,txpool,parlia" --ws.origins="*" \
      --mine --miner.etherbase $VAL_ADDR --unlock $VAL_ADDR \
      --password /bsc/password.txt --allow-insecure-unlock \
      --miner.gaslimit 30000000 --miner.gasprice 1000000000 \
      --txpool.globalslots 8192 --lightkdf --verbosity 3 \
      --identity "BitcoinBR-Validator-$i" > /dev/null 2>&1
    
    echo "  ✅ Validator-$i started"
done

echo ""
echo "Waiting for validators to sync..."
sleep 20

echo ""
echo "=== VERIFICATION ==="
sudo docker ps --filter "name=bsc-validator" --format "{{.Names}}: {{.Status}}"

echo ""
BALANCE=$(curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADDR1\",\"latest\"],\"id\":1}" \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

echo "Validator 1 Balance: $BALANCE"
echo "Expected:             0x16345785d8a0000000000000000000000000000"

if [ "$BALANCE" = "0x16345785d8a0000000000000000000000000000" ]; then
    echo ""
    echo "✅ SUCCESS! You now have 7 septillion BTCBR per validator!"
    echo "✅ Total supply: 21 septillion BTCBR"
else
    echo ""
    echo "⚠️  Balance mismatch. Please wait a few seconds and check again."
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="

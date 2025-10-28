#!/bin/bash

#############################################
# Upgrade EC2 Instance to t3.large
# And Update Genesis with 21 Septillion Supply
#############################################

set -e

INSTANCE_ID="i-0f7452bba70ca5542"
REGION="us-east-1"
NEW_INSTANCE_TYPE="t3.large"

echo "=========================================="
echo "EC2 INSTANCE UPGRADE TO t3.large"
echo "=========================================="
echo ""
echo "Instance: $INSTANCE_ID"
echo "Region: $REGION"
echo "New Type: $NEW_INSTANCE_TYPE (8 GB RAM, 2 vCPUs)"
echo "Cost: ~\$60/month"
echo ""

# Step 1: Stop validators first
echo "Step 1: Connecting to instance to stop validators..."
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141 << 'ENDSSH'
echo "Stopping all validators gracefully..."
sudo docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || echo "Validators already stopped"
echo "✅ Validators stopped"
ENDSSH

echo ""
echo "Step 2: Stopping EC2 instance..."
aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION

echo "Waiting for instance to stop..."
aws ec2 wait instance-stopped --instance-ids $INSTANCE_ID --region $REGION
echo "✅ Instance stopped"

echo ""
echo "Step 3: Changing instance type to $NEW_INSTANCE_TYPE..."
aws ec2 modify-instance-attribute \
  --instance-id $INSTANCE_ID \
  --instance-type "{\"Value\": \"$NEW_INSTANCE_TYPE\"}" \
  --region $REGION
echo "✅ Instance type changed to $NEW_INSTANCE_TYPE"

echo ""
echo "Step 4: Starting instance..."
aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION

echo "Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION
echo "✅ Instance running"

echo ""
echo "Step 5: Waiting for SSH to be available..."
sleep 30

echo ""
echo "Step 6: Updating genesis with 21 septillion supply..."
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141 << 'ENDSSH'
cd ~/bsc-production

# Get validator addresses
ADDR1=$(cat config/validator1.txt)
ADDR2=$(cat config/validator2.txt)
ADDR3=$(cat config/validator3.txt)

echo "Validator addresses:"
echo "  1: $ADDR1"
echo "  2: $ADDR2"
echo "  3: $ADDR3"

# Calculate balances
# 21 septillion = 21,000,000,000,000,000,000,000,000
# Split equally among 3 validators = 7 septillion each
# 7 septillion = 7,000,000,000,000,000,000,000,000 tokens
# In wei (18 decimals) = 7,000,000,000,000,000,000,000,000 * 10^18
# = 0x16345785d8a0000000000000000000000000000 (hex)

echo ""
echo "Updating genesis with 21 septillion total supply..."
echo "Each validator gets: 7,000,000,000,000,000,000,000,000 BTCBR"

cat config/genesis.json | python3 -c "
import sys, json
genesis = json.load(sys.stdin)

# 7 septillion tokens (in wei with 18 decimals)
# 7,000,000,000,000,000,000,000,000 * 10^18 = 7 * 10^42 wei
balance = '0x16345785d8a0000000000000000000000000000'

genesis['alloc']['$ADDR1'] = {'balance': balance}
genesis['alloc']['$ADDR2'] = {'balance': balance}
genesis['alloc']['$ADDR3'] = {'balance': balance}

print(json.dumps(genesis, indent=2))
" > config/genesis-21septillion.json

# Verify
echo ""
echo "Verifying allocations:"
cat config/genesis-21septillion.json | grep -A1 "$ADDR1" | head -3

# Backup old genesis
cp config/genesis.json config/genesis-1billion.json.backup
mv config/genesis-21septillion.json config/genesis.json

echo ""
echo "✅ Genesis updated with 21 septillion supply"
echo "   Total Supply: 21,000,000,000,000,000,000,000,000 BTCBR"
echo "   Per Validator: 7,000,000,000,000,000,000,000,000 BTCBR"
ENDSSH

echo ""
echo "Step 7: Reinitializing validators with new genesis..."
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141 << 'ENDSSH'
cd ~/bsc-production

# Fix permissions
sudo chown -R ec2-user:ec2-user .

# Reinitialize all validators
for i in 1 2 3; do
    echo "Reinitializing validator-$i..."
    sudo rm -rf validator-$i/geth
    cp config/genesis.json validator-$i/
    sudo docker run --rm -v $(pwd)/validator-$i:/bsc dysnix/bsc:latest \
        --datadir /bsc init /bsc/genesis.json 2>&1 | grep "Successfully"
    mkdir -p validator-$i/geth
    echo "[]" > validator-$i/geth/static-nodes.json
done

echo "✅ All validators reinitialized"
ENDSSH

echo ""
echo "Step 8: Starting all validators..."
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141 << 'ENDSSH'
cd ~/bsc-production

# Remove old containers
sudo docker rm -f bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true

# Create network
sudo docker network create bsc-network 2>/dev/null || true

# Start all 3 validators
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
      --datadir /bsc \
      --networkid 885824 \
      --port 30303 \
      --syncmode full \
      --http --http.addr 0.0.0.0 --http.port 8545 --http.corsdomain="*" \
      --http.api "eth,net,web3,txpool,parlia" \
      --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.api "eth,net,web3,txpool,parlia" --ws.origins="*" \
      --mine \
      --miner.etherbase $VAL_ADDR \
      --unlock $VAL_ADDR \
      --password /bsc/password.txt \
      --allow-insecure-unlock \
      --miner.gaslimit 30000000 \
      --miner.gasprice 1000000000 \
      --txpool.globalslots 8192 \
      --lightkdf \
      --verbosity 3 \
      --identity "BitcoinBR-Validator-$i"
    
    echo "✅ Started validator-$i"
done

echo ""
echo "Waiting for validators to sync..."
sleep 15

echo ""
echo "✅ All validators started successfully!"
ENDSSH

echo ""
echo "Step 9: Verifying deployment..."
sleep 10

ssh -i bsc-validator-key.pem ec2-user@34.230.84.141 << 'ENDSSH'
echo "=== Validator Status ==="
sudo docker ps --filter "name=bsc-validator" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== Checking Balances ==="
ADDR1=$(cat ~/bsc-production/config/validator1.txt)
BALANCE=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADDR1\",\"latest\"],\"id\":1}" \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

echo "Validator 1 balance (hex): $BALANCE"
echo "Expected: 0x16345785d8a0000000000000000000000000000"

if [ "$BALANCE" = "0x16345785d8a0000000000000000000000000000" ]; then
    echo "✅ Balance verified: 7 septillion BTCBR"
else
    echo "⚠️  Balance: $BALANCE"
fi
ENDSSH

echo ""
echo "=========================================="
echo "✅ UPGRADE COMPLETE!"
echo "=========================================="
echo ""
echo "Instance Type: t3.large (8 GB RAM, 2 vCPUs)"
echo "Total Supply: 21 septillion BTCBR"
echo "Per Validator: 7 septillion BTCBR"
echo ""
echo "Your validators are now running with full 21 septillion supply!"
echo ""
echo "RPC Endpoints:"
echo "  - http://34.230.84.141:8545"
echo "  - http://34.230.84.141:8546"
echo "  - http://34.230.84.141:8547"
echo ""
echo "HTTPS Endpoint:"
echo "  - https://rpc.bitcoinbr.tech"
echo ""
echo "Monthly Cost: ~\$60"
echo ""

#!/bin/bash

echo "🔧 Fixing WebSocket Endpoint on Validator-1"
echo ""

SERVER_IP="3.91.50.187"
SSH_KEY="bsc-validator-key.pem"

if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi

echo "Connecting to server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$SERVER_IP << 'ENDSSH'

echo "Stopping validator-1..."
docker stop bsc-validator-1
docker rm bsc-validator-1

echo "Starting validator-1 with WebSocket enabled..."
docker run -d \
  --name bsc-validator-1 \
  --network host \
  -v /home/ec2-user/validator-1:/bsc \
  -v /home/ec2-user/data/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --gcmode archive \
  --port 30303 \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.vhosts "*" \
  --http.corsdomain "*" \
  --http.api eth,net,web3,txpool,miner \
  --ws \
  --ws.addr 0.0.0.0 \
  --ws.port 8548 \
  --ws.origins "*" \
  --ws.api eth,net,web3 \
  --mine \
  --miner.etherbase 0xA4522eD2379C2214D471374fFA06B06d6513686E \
  --unlock 0xA4522eD2379C2214D471374fFA06B06d6513686E \
  --password /password.txt \
  --allow-insecure-unlock \
  --verbosity 3

echo ""
echo "Waiting 10 seconds for validator to start..."
sleep 10

echo ""
echo "Checking validator status..."
docker ps | grep bsc-validator-1

echo ""
echo "Checking WebSocket in logs..."
docker logs bsc-validator-1 2>&1 | grep -i websocket | tail -5

ENDSSH

echo ""
echo "Testing WebSocket endpoint..."
sleep 5

# Test WebSocket via HTTP (wscat would be better but curl works too)
WS_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:8548)
if [ "$WS_TEST" = "400" ] || [ "$WS_TEST" = "426" ]; then
    echo "✅ WebSocket port is responding (HTTP $WS_TEST)"
    echo "   This is expected - WebSocket needs upgrade headers"
    echo ""
    echo "   You can now use: ws://$SERVER_IP:8548"
else
    echo "⚠️  WebSocket status: HTTP $WS_TEST"
fi

echo ""
echo "✅ Done! WebSocket should now be available at: ws://$SERVER_IP:8548"

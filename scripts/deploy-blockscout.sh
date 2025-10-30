#!/bin/bash

echo "🔍 Deploying Blockscout Explorer for Xaheen Chain"
echo ""

SERVER_IP="3.91.50.187"
SSH_KEY="bsc-validator-key.pem"

if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi

echo "Connecting to server and deploying Blockscout..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$SERVER_IP << 'ENDSSH'

echo "Creating Blockscout directory..."
mkdir -p ~/blockscout
cd ~/blockscout

echo "Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14
    restart: always
    container_name: xaheen-postgres
    environment:
      POSTGRES_PASSWORD: xaheen_password
      POSTGRES_USER: xaheen
      POSTGRES_DB: blockscout
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  blockscout:
    image: blockscout/blockscout:latest
    restart: always
    container_name: xaheen-blockscout
    depends_on:
      - postgres
    environment:
      # Database
      DATABASE_URL: postgresql://xaheen:xaheen_password@postgres:5432/blockscout?ssl=false

      # Network
      ETHEREUM_JSONRPC_VARIANT: geth
      ETHEREUM_JSONRPC_HTTP_URL: http://3.91.50.187:8545
      ETHEREUM_JSONRPC_WS_URL: ws://3.91.50.187:8548
      ETHEREUM_JSONRPC_TRACE_URL: http://3.91.50.187:8545

      # Chain
      CHAIN_ID: 65001
      COIN: XHT
      SUBNETWORK: Xaheen Chain
      NETWORK: Xaheen

      # URLs
      BLOCKSCOUT_HOST: 3.91.50.187
      BLOCKSCOUT_PROTOCOL: http

      # Features
      DISPLAY_TOKEN_ICONS: "true"
      SHOW_PRICE_CHART: "false"
      SHOW_TXS_CHART: "true"

      # Branding
      LOGO: /images/xaheen_logo.svg
      LOGO_FOOTER: /images/xaheen_logo.svg

      # Security
      SECRET_KEY_BASE: $(openssl rand -base64 64 | tr -d '\n')

      # Other
      PORT: 4000
      ECTO_USE_SSL: "false"
      MIX_ENV: prod

    ports:
      - "4000:4000"
    command: >
      sh -c "
      bin/blockscout eval \"Elixir.Explorer.ReleaseTasks.create_and_migrate()\" &&
      bin/blockscout start
      "

volumes:
  postgres-data:
EOF

echo "Pulling Docker images..."
docker-compose pull

echo "Starting Blockscout..."
docker-compose up -d

echo ""
echo "Waiting 30 seconds for services to start..."
sleep 30

echo ""
echo "Checking container status..."
docker-compose ps

echo ""
echo "Checking Blockscout logs..."
docker-compose logs blockscout | tail -20

ENDSSH

echo ""
echo "Testing Blockscout endpoint..."
sleep 5

EXPLORER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:4000)
if [ "$EXPLORER_STATUS" = "200" ]; then
    echo "✅ Blockscout Explorer is running!"
    echo "   URL: http://$SERVER_IP:4000"
else
    echo "⚠️  Blockscout status: HTTP $EXPLORER_STATUS"
    echo "   Give it a few more minutes to fully start up"
    echo "   Check logs with: ssh -i $SSH_KEY ec2-user@$SERVER_IP 'cd ~/blockscout && docker-compose logs blockscout'"
fi

echo ""
echo "✅ Done! Blockscout deployment complete"
echo ""
echo "Access at: http://$SERVER_IP:4000"
echo "After DNS + SSL: https://explorer.xaheen.org"

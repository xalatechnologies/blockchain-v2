#!/bin/bash
#
# Deploy Blockscout Explorer on Server
# Run this script ON THE SERVER (3.91.50.187)
#

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}==>${NC} DAY 1: Deploying Block Explorer (Blockscout)"

# Configuration
NETWORK_NAME="BTCBR Chain"
CHAIN_ID=885824
EXPLORER_DOMAIN="explorer.bitcoinbr.tech"
SERVER_IP="3.91.50.187"

# Install Docker Compose
echo -e "${BLUE}==>${NC} Installing Docker Compose..."
sudo apt-get update -qq
sudo apt-get install -y docker-compose jq

# Create Blockscout directory
echo -e "${BLUE}==>${NC} Setting up Blockscout..."
mkdir -p ~/blockscout
cd ~/blockscout

# Download docker-compose for Blockscout
echo -e "${BLUE}==>${NC} Downloading Blockscout configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14
    restart: always
    container_name: postgres
    environment:
      POSTGRES_PASSWORD: changeme
      POSTGRES_USER: postgres
      POSTGRES_DB: blockscout
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  blockscout:
    image: blockscout/blockscout:latest
    restart: always
    container_name: blockscout
    depends_on:
      - postgres
    environment:
      NETWORK: BTCBR Chain
      SUBNETWORK: Mainnet
      CHAIN_ID: '885824'
      ETHEREUM_JSONRPC_VARIANT: geth
      ETHEREUM_JSONRPC_HTTP_URL: http://172.17.0.1:8545
      ETHEREUM_JSONRPC_WS_URL: ws://172.17.0.1:8546
      ETHEREUM_JSONRPC_TRACE_URL: http://172.17.0.1:8545
      COIN: BNB
      LOGO: /images/btcbr_logo.svg
      BLOCKSCOUT_HOST: explorer.bitcoinbr.tech
      BLOCKSCOUT_PROTOCOL: https
      DATABASE_URL: postgresql://postgres:changeme@postgres:5432/blockscout?ssl=false
      ECTO_USE_SSL: 'false'
      SECRET_KEY_BASE: 'CHANGE_ME_PLEASE_USE_STRONG_SECRET'
      PORT: 4000
    ports:
      - "4000:4000"

volumes:
  postgres-data:
EOF

# Generate strong secret key
SECRET_KEY=$(openssl rand -base64 64 | tr -d '\n')
sed -i "s/CHANGE_ME_PLEASE_USE_STRONG_SECRET/$SECRET_KEY/" docker-compose.yml

# Start Blockscout
echo -e "${BLUE}==>${NC} Starting Blockscout containers..."
sudo docker-compose down 2>/dev/null || true
sudo docker-compose up -d

# Wait for services
echo -e "${BLUE}==>${NC} Waiting for Blockscout to initialize..."
echo -e "${YELLOW}⚠${NC} This may take 5-10 minutes for first run..."
sleep 30

# Check status
echo -e "${BLUE}==>${NC} Checking container status..."
sudo docker-compose ps

# Test local access
echo -e "${BLUE}==>${NC} Testing local access..."
sleep 10
if curl -s http://localhost:4000 | grep -q "Blockscout"; then
    echo -e "${GREEN}✓${NC} Blockscout is running!"
else
    echo -e "${YELLOW}⚠${NC} Blockscout may still be initializing..."
    echo -e "${BLUE}==>${NC} Check logs: sudo docker-compose logs -f blockscout"
fi

# Configure NGINX
echo -e "${BLUE}==>${NC} Configuring NGINX for Explorer..."

sudo tee /etc/nginx/sites-available/explorer > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name explorer.bitcoinbr.tech;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
    }
}
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/explorer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}✓${NC} NGINX configured!"

# Get SSL certificate
echo -e "${BLUE}==>${NC} Obtaining SSL certificate for $EXPLORER_DOMAIN..."
echo -e "${YELLOW}⚠${NC} Make sure DNS is configured: $EXPLORER_DOMAIN A $SERVER_IP"
echo ""
echo "Checking DNS..."
if host explorer.bitcoinbr.tech | grep -q "$SERVER_IP"; then
    echo -e "${GREEN}✓${NC} DNS is configured correctly!"
    
    # Get SSL
    sudo certbot --nginx -d $EXPLORER_DOMAIN --non-interactive --agree-tos --email admin@bitcoinbr.tech || {
        echo -e "${YELLOW}⚠${NC} SSL certificate setup failed - you may need to run certbot manually"
        echo "Run: sudo certbot --nginx -d $EXPLORER_DOMAIN"
    }
else
    echo -e "${YELLOW}⚠${NC} DNS not configured yet!"
    echo "Please configure DNS: explorer.bitcoinbr.tech A $SERVER_IP"
    echo "Then run: sudo certbot --nginx -d $EXPLORER_DOMAIN"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Block Explorer Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Access Points:"
echo "  Local:  http://localhost:4000"
echo "  HTTP:   http://$SERVER_IP:4000"
echo "  Domain: http://$EXPLORER_DOMAIN (when DNS ready)"
echo "  HTTPS:  https://$EXPLORER_DOMAIN (when SSL ready)"
echo ""
echo "Next Steps:"
echo "  1. Wait for full blockchain indexing (~10-30 minutes)"
echo "  2. Verify token contract on explorer"
echo "  3. Proceed to Day 2: Bridge Deployment"
echo ""
echo "Useful Commands:"
echo "  View logs:    sudo docker-compose -f ~/blockscout/docker-compose.yml logs -f"
echo "  Restart:      sudo docker-compose -f ~/blockscout/docker-compose.yml restart"
echo "  Stop:         sudo docker-compose -f ~/blockscout/docker-compose.yml down"
echo ""

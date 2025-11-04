#!/bin/bash

###############################################################################
# Nor Chain - Production Public Deployment Script
#
# Deploys Nor Chain to production with public RPC access
# Competes directly with BNB Smart Chain
#
# Usage: ./scripts/deploy-production-public.sh [SERVER_IP] [DOMAIN]
#
# Example: ./scripts/deploy-production-public.sh 95.217.123.45 xaheen.org
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="${1:-}"
DOMAIN="${2:-xaheen.org}"
SSH_USER="root"
CHAIN_ID="65001"
NETWORK_ID="65001"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║          XAHEEN CHAIN - PRODUCTION DEPLOYMENT                  ║"
echo "║                                                                ║"
echo "║          Competing with BNB Smart Chain                        ║"
echo "║          Chain ID: 65001 (0xFDE9)                              ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Validation
if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Error: Server IP required${NC}"
    echo "Usage: $0 [SERVER_IP] [DOMAIN]"
    echo "Example: $0 95.217.123.45 xaheen.org"
    exit 1
fi

echo -e "${GREEN}✓ Configuration validated${NC}"
echo "  Server IP: $SERVER_IP"
echo "  Domain: $DOMAIN"
echo "  Chain ID: $CHAIN_ID"
echo ""

# Check SSH connectivity
echo -e "${YELLOW}→ Testing SSH connectivity...${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes $SSH_USER@$SERVER_IP echo "SSH OK" 2>&1 | grep -q "SSH OK"; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo "  Please ensure:"
    echo "  1. SSH key is added to server"
    echo "  2. Server IP is correct"
    echo "  3. Firewall allows SSH (port 22)"
    exit 1
fi

# Create deployment package
echo -e "${YELLOW}→ Creating deployment package...${NC}"
DEPLOY_DIR="/tmp/xaheen-deploy-$(date +%s)"
mkdir -p "$DEPLOY_DIR"

# Copy essential files
cp -r data/genesis-xaheen-65001.json "$DEPLOY_DIR/" 2>/dev/null || \
cp -r data/genesis.json "$DEPLOY_DIR/genesis-xaheen-65001.json" || {
    echo -e "${RED}✗ Genesis file not found${NC}"
    exit 1
}

# Copy validator keys if they exist
if [ -d "data/keystore" ]; then
    cp -r data/keystore "$DEPLOY_DIR/"
    echo -e "${GREEN}✓ Validator keys copied${NC}"
fi

# Copy password file if it exists
if [ -f "data/password.txt" ]; then
    cp data/password.txt "$DEPLOY_DIR/"
    echo -e "${GREEN}✓ Password file copied${NC}"
fi

echo -e "${GREEN}✓ Deployment package created${NC}"

# Create remote deployment script
cat > "$DEPLOY_DIR/remote-deploy.sh" << 'REMOTE_SCRIPT'
#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Nor Chain Production Deployment (Remote)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Update system
echo -e "${YELLOW}→ Updating system packages...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
echo -e "${GREEN}✓ System updated${NC}"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}→ Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}→ Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}→ Installing Nginx...${NC}"
    apt-get install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Install Certbot
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}→ Installing Certbot...${NC}"
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi

# Install other utilities
echo -e "${YELLOW}→ Installing utilities...${NC}"
apt-get install -y curl wget git htop netstat-nat ufw jq
echo -e "${GREEN}✓ Utilities installed${NC}"

# Configure firewall
echo -e "${YELLOW}→ Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 30303/tcp   # P2P
ufw allow 30303/udp   # P2P Discovery
ufw allow 30304/tcp   # P2P Validator 2
ufw allow 30305/tcp   # P2P Validator 3
echo -e "${GREEN}✓ Firewall configured${NC}"

# Create xaheen directory structure
echo -e "${YELLOW}→ Creating directory structure...${NC}"
mkdir -p /opt/xaheen/{validator-1,validator-2,validator-3,config,scripts,logs}
echo -e "${GREEN}✓ Directory structure created${NC}"

# Copy genesis file
echo -e "${YELLOW}→ Copying genesis file...${NC}"
cp /tmp/xaheen-deploy/genesis-xaheen-65001.json /opt/xaheen/config/genesis.json
echo -e "${GREEN}✓ Genesis file copied${NC}"

# Copy validator keys if present
if [ -d "/tmp/xaheen-deploy/keystore" ]; then
    echo -e "${YELLOW}→ Copying validator keys...${NC}"
    cp -r /tmp/xaheen-deploy/keystore/* /opt/xaheen/validator-1/ 2>/dev/null || true
    echo -e "${GREEN}✓ Validator keys copied${NC}"
fi

# Copy password file if present
if [ -f "/tmp/xaheen-deploy/password.txt" ]; then
    echo -e "${YELLOW}→ Copying password file...${NC}"
    cp /tmp/xaheen-deploy/password.txt /opt/xaheen/config/password.txt
    echo -e "${GREEN}✓ Password file copied${NC}"
fi

echo -e "${GREEN}✓ Remote deployment preparation complete${NC}"

REMOTE_SCRIPT

chmod +x "$DEPLOY_DIR/remote-deploy.sh"

# Transfer files to server
echo -e "${YELLOW}→ Transferring files to server...${NC}"
ssh $SSH_USER@$SERVER_IP "mkdir -p /tmp/xaheen-deploy"
scp -r "$DEPLOY_DIR"/* $SSH_USER@$SERVER_IP:/tmp/xaheen-deploy/
echo -e "${GREEN}✓ Files transferred${NC}"

# Execute remote deployment
echo -e "${YELLOW}→ Executing remote deployment...${NC}"
ssh $SSH_USER@$SERVER_IP "bash /tmp/xaheen-deploy/remote-deploy.sh"
echo -e "${GREEN}✓ Remote deployment complete${NC}"

# Initialize validators
echo -e "${YELLOW}→ Initializing Nor validators...${NC}"
ssh $SSH_USER@$SERVER_IP << 'EOF'
cd /opt/xaheen

# Pull BSC image
docker pull dysnix/bsc:latest

# Initialize validator 1
docker run --rm \
    -v /opt/xaheen/validator-1:/bsc \
    -v /opt/xaheen/config/genesis.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 2
docker run --rm \
    -v /opt/xaheen/validator-2:/bsc \
    -v /opt/xaheen/config/genesis.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 3
docker run --rm \
    -v /opt/xaheen/validator-3:/bsc \
    -v /opt/xaheen/config/genesis.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

echo "Validators initialized"
EOF
echo -e "${GREEN}✓ Validators initialized${NC}"

# Create systemd services for validators
echo -e "${YELLOW}→ Creating systemd services...${NC}"
ssh $SSH_USER@$SERVER_IP << 'EOF'
# Validator 1 service (RPC + P2P)
cat > /etc/systemd/system/xaheen-validator-1.service << 'SERVICE1'
[Unit]
Description=Nor Chain Validator 1 (RPC)
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStartPre=-/usr/bin/docker stop xaheen-validator-1
ExecStartPre=-/usr/bin/docker rm xaheen-validator-1
ExecStart=/usr/bin/docker run --rm --name xaheen-validator-1 \
    --network host \
    -v /opt/xaheen/validator-1:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --syncmode full \
    --gcmode archive \
    --http --http.addr 0.0.0.0 --http.port 8545 \
    --http.api eth,net,web3,txpool,parlia \
    --http.vhosts * \
    --http.corsdomain * \
    --ws --ws.addr 0.0.0.0 --ws.port 8546 \
    --ws.api eth,net,web3,txpool,parlia \
    --ws.origins * \
    --port 30303 \
    --maxpeers 100 \
    --mine --miner.etherbase 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
    --unlock 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
    --password /bsc/password.txt \
    --allow-insecure-unlock

[Install]
WantedBy=multi-user.target
SERVICE1

# Validator 2 service (P2P only)
cat > /etc/systemd/system/xaheen-validator-2.service << 'SERVICE2'
[Unit]
Description=Nor Chain Validator 2
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStartPre=-/usr/bin/docker stop xaheen-validator-2
ExecStartPre=-/usr/bin/docker rm xaheen-validator-2
ExecStart=/usr/bin/docker run --rm --name xaheen-validator-2 \
    --network host \
    -v /opt/xaheen/validator-2:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --syncmode full \
    --gcmode archive \
    --port 30304 \
    --maxpeers 100 \
    --mine --miner.etherbase 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
    --unlock 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
    --password /bsc/password.txt \
    --allow-insecure-unlock

[Install]
WantedBy=multi-user.target
SERVICE2

# Validator 3 service (P2P only)
cat > /etc/systemd/system/xaheen-validator-3.service << 'SERVICE3'
[Unit]
Description=Nor Chain Validator 3
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStartPre=-/usr/bin/docker stop xaheen-validator-3
ExecStartPre=-/usr/bin/docker rm xaheen-validator-3
ExecStart=/usr/bin/docker run --rm --name xaheen-validator-3 \
    --network host \
    -v /opt/xaheen/validator-3:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --syncmode full \
    --gcmode archive \
    --port 30305 \
    --maxpeers 100 \
    --mine --miner.etherbase 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
    --unlock 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
    --password /bsc/password.txt \
    --allow-insecure-unlock

[Install]
WantedBy=multi-user.target
SERVICE3

# Reload systemd
systemctl daemon-reload

# Enable services
systemctl enable xaheen-validator-1
systemctl enable xaheen-validator-2
systemctl enable xaheen-validator-3

echo "Systemd services created"
EOF
echo -e "${GREEN}✓ Systemd services created${NC}"

# Configure Nginx reverse proxy
echo -e "${YELLOW}→ Configuring Nginx reverse proxy...${NC}"
ssh $SSH_USER@$SERVER_IP "DOMAIN=$DOMAIN" << 'EOF'
# Create rate limiting zone
cat > /etc/nginx/conf.d/rate-limit.conf << 'RATELIMIT'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=50r/s;
RATELIMIT

# RPC endpoint configuration
cat > /etc/nginx/sites-available/xaheen-rpc << 'RPCONFIG'
upstream xaheen_rpc {
    server 127.0.0.1:8545;
    keepalive 32;
}

server {
    listen 80;
    server_name rpc.DOMAIN_PLACEHOLDER;

    # Redirect to HTTPS (will be configured after SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rpc.DOMAIN_PLACEHOLDER;

    # SSL certificates (placeholder - will be updated by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req zone=rpc_limit burst=20 nodelay;

    # Logging
    access_log /var/log/nginx/xaheen-rpc-access.log;
    error_log /var/log/nginx/xaheen-rpc-error.log;

    location / {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        # Handle OPTIONS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Proxy settings
        proxy_pass http://xaheen_rpc;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
RPCONFIG

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/xaheen-rpc

# WebSocket endpoint configuration
cat > /etc/nginx/sites-available/xaheen-ws << 'WSCONFIG'
upstream xaheen_ws {
    server 127.0.0.1:8546;
    keepalive 32;
}

server {
    listen 80;
    server_name ws.DOMAIN_PLACEHOLDER;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ws.DOMAIN_PLACEHOLDER;

    # SSL certificates (placeholder)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rate limiting
    limit_req zone=ws_limit burst=10 nodelay;

    # Logging
    access_log /var/log/nginx/xaheen-ws-access.log;
    error_log /var/log/nginx/xaheen-ws-error.log;

    location / {
        # WebSocket specific headers
        proxy_pass http://xaheen_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;

        # Timeouts (longer for WebSocket)
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
WSCONFIG

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/xaheen-ws

# Enable sites
ln -sf /etc/nginx/sites-available/xaheen-rpc /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/xaheen-ws /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo "Nginx configured"
EOF
echo -e "${GREEN}✓ Nginx configured${NC}"

# Start validators
echo -e "${YELLOW}→ Starting Nor validators...${NC}"
ssh $SSH_USER@$SERVER_IP << 'EOF'
systemctl start xaheen-validator-1
systemctl start xaheen-validator-2
systemctl start xaheen-validator-3

# Wait for startup
sleep 10

# Check status
systemctl status xaheen-validator-1 --no-pager
systemctl status xaheen-validator-2 --no-pager
systemctl status xaheen-validator-3 --no-pager

echo "Validators started"
EOF
echo -e "${GREEN}✓ Validators started${NC}"

# Test RPC endpoint
echo -e "${YELLOW}→ Testing RPC endpoint...${NC}"
sleep 5
CHAIN_ID_RESULT=$(ssh $SSH_USER@$SERVER_IP "curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}' | jq -r .result")

if [ "$CHAIN_ID_RESULT" == "0xfde9" ]; then
    echo -e "${GREEN}✓ RPC endpoint responding correctly${NC}"
    echo "  Chain ID: $CHAIN_ID_RESULT (65001)"
else
    echo -e "${RED}✗ RPC endpoint not responding correctly${NC}"
    echo "  Expected: 0xfde9, Got: $CHAIN_ID_RESULT"
fi

# Cleanup
rm -rf "$DEPLOY_DIR"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║          XAHEEN CHAIN DEPLOYMENT SUCCESSFUL!                   ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Configure DNS records for your domain ($DOMAIN):"
echo "   A     @           $SERVER_IP"
echo "   A     rpc         $SERVER_IP"
echo "   A     ws          $SERVER_IP"
echo "   A     explorer    $SERVER_IP"
echo ""
echo "2. Install SSL certificates (run on server):"
echo "   ssh $SSH_USER@$SERVER_IP"
echo "   certbot --nginx -d rpc.$DOMAIN"
echo "   certbot --nginx -d ws.$DOMAIN"
echo ""
echo "3. Test public endpoints:"
echo "   curl -X POST https://rpc.$DOMAIN \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}'"
echo ""
echo "4. Add to MetaMask:"
echo "   Chain ID: 65001"
echo "   RPC URL: https://rpc.$DOMAIN"
echo "   Currency: NOR"
echo ""
echo -e "${GREEN}Nor Chain is ready to compete with BNB Smart Chain! 🚀${NC}"
echo ""

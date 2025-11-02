#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
# 🌙 NOOR CHAIN - SSL CERTIFICATE SETUP 🌙
#═══════════════════════════════════════════════════════════════════════════════
#
# This script updates SSL certificates from xaheen.org to noorchain.org
#
# Prerequisites:
# - noorchain.org domain registered and DNS configured
# - DNS A records pointing to server IP
# - Certbot installed on server
#═══════════════════════════════════════════════════════════════════════════════

set -e

SERVER_IP="3.91.50.187"
NEW_DOMAIN="noorchain.org"
RPC_SUBDOMAIN="rpc.${NEW_DOMAIN}"
EXPLORER_SUBDOMAIN="explorer.${NEW_DOMAIN}"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN SSL CERTIFICATE SETUP 🌙                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  IMPORTANT: Before running this script, ensure:"
echo "   1. Domain 'noorchain.org' is registered"
echo "   2. DNS A records configured:"
echo "      - noorchain.org → $SERVER_IP"
echo "      - rpc.noorchain.org → $SERVER_IP"
echo "      - explorer.noorchain.org → $SERVER_IP"
echo "   3. DNS propagation completed (check with: dig rpc.noorchain.org)"
echo ""
read -p "Have you completed the DNS setup? (yes/no): " DNS_READY

if [ "$DNS_READY" != "yes" ]; then
  echo "❌ Please complete DNS setup first, then run this script again."
  exit 1
fi

cat << 'REMOTE_SCRIPT' > /tmp/setup-ssl-remote.sh
#!/bin/bash

NEW_DOMAIN="noorchain.org"
RPC_SUBDOMAIN="rpc.${NEW_DOMAIN}"
OLD_RPC="rpc.xaheen.org"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN SSL CERTIFICATE MIGRATION 🌙                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Step 1: Backing up current Nginx configuration..."
sudo cp /etc/nginx/sites-available/bsc-rpc /etc/nginx/sites-available/bsc-rpc.backup.$(date +%Y%m%d-%H%M%S)
echo "   ✅ Backup created"

echo ""
echo "📝 Step 2: Creating new Nginx configuration for Noor Chain..."

# Create new Nginx configuration for rpc.noorchain.org
sudo bash -c "cat > /etc/nginx/sites-available/noor-rpc" << 'EOF_NGINX'
upstream noor_rpc {
    server 127.0.0.1:8545;
}

# HTTP - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name rpc.noorchain.org;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name rpc.noorchain.org;

    # SSL certificates (will be created by Certbot)
    ssl_certificate /etc/letsencrypt/live/rpc.noorchain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.noorchain.org/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/rpc.noorchain.org/chain.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # RPC proxy
    location / {
        proxy_pass http://noor_rpc;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # CORS headers for Web3 clients
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range" always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "🌙 Noor Chain RPC - Healthy\n";
        add_header Content-Type text/plain;
    }
}

# WebSocket endpoint (ws.noorchain.org)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ws.noorchain.org;

    # SSL certificates (same as RPC)
    ssl_certificate /etc/letsencrypt/live/rpc.noorchain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.noorchain.org/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:8546;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
EOF_NGINX

echo "   ✅ Nginx configuration created"

echo ""
echo "🔗 Step 3: Enabling new Noor Chain site..."
sudo ln -sf /etc/nginx/sites-available/noor-rpc /etc/nginx/sites-enabled/noor-rpc
echo "   ✅ Site enabled"

echo ""
echo "🧪 Step 4: Testing Nginx configuration..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    echo "   Restoring backup..."
    sudo rm /etc/nginx/sites-enabled/noor-rpc
    exit 1
fi

echo "   ✅ Nginx configuration valid"

echo ""
echo "📜 Step 5: Obtaining SSL certificates with Certbot..."
echo "   Requesting certificate for rpc.noorchain.org..."

# Stop Nginx temporarily for standalone certificate issuance
sudo systemctl stop nginx

# Request certificate
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@noorchain.org \
    --domains rpc.noorchain.org \
    --rsa-key-size 4096

CERT_STATUS=$?

# Restart Nginx
sudo systemctl start nginx

if [ $CERT_STATUS -ne 0 ]; then
    echo "❌ Certificate issuance failed!"
    echo "   Please check:"
    echo "   1. DNS is properly configured and propagated"
    echo "   2. Port 80 is accessible from the internet"
    echo "   3. No firewall blocking Certbot"
    exit 1
fi

echo "   ✅ SSL certificate obtained successfully"

echo ""
echo "🔄 Step 6: Reloading Nginx with new configuration..."
sudo systemctl reload nginx

if [ $? -ne 0 ]; then
    echo "❌ Nginx reload failed!"
    sudo systemctl status nginx
    exit 1
fi

echo "   ✅ Nginx reloaded successfully"

echo ""
echo "📅 Step 7: Setting up automatic certificate renewal..."
sudo certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "   ✅ Certificate auto-renewal configured"
else
    echo "   ⚠️  Auto-renewal test failed - certificates may need manual renewal"
fi

echo ""
echo "🗑️  Step 8: Removing old xaheen.org configurations (optional)..."
echo "   Old configurations backed up in /etc/nginx/sites-available/"
echo "   To remove old xaheen.org certificates:"
echo "   sudo certbot delete --cert-name rpc.xaheen.org"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║          🌙 NOOR CHAIN SSL SETUP COMPLETE 🌙                             ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ RPC Endpoint: https://rpc.noorchain.org"
echo "✅ WebSocket: wss://ws.noorchain.org"
echo ""
echo "🧪 Test the endpoint:"
echo "   curl -s -X POST https://rpc.noorchain.org \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo "🌙 Noor Chain - Empowering the Future with Light and Trust"

REMOTE_SCRIPT

chmod +x /tmp/setup-ssl-remote.sh

echo ""
echo "📤 Uploading SSL setup script to server..."
scp -i ~/.ssh/bsc-validator-key.pem -o StrictHostKeyChecking=no /tmp/setup-ssl-remote.sh ec2-user@$SERVER_IP:/home/ec2-user/setup-noor-ssl.sh

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "The script has been uploaded to the server. To execute it:"
echo ""
echo "1. SSH into the server:"
echo "   ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@$SERVER_IP"
echo ""
echo "2. Run the SSL setup script:"
echo "   sudo bash /home/ec2-user/setup-noor-ssl.sh"
echo ""
echo "3. Verify the RPC endpoint:"
echo "   curl https://rpc.noorchain.org"
echo ""
echo "📝 Note: The script requires sudo access to:"
echo "   - Modify Nginx configuration"
echo "   - Run Certbot for SSL certificates"
echo "   - Restart Nginx service"
echo ""
echo "🌙 Noor Chain - Empowering the Future with Light and Trust"

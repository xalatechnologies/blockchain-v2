#!/bin/bash
# Setup NGINX with SSL for BSC RPC endpoint
# This script configures NGINX as a reverse proxy with Let's Encrypt SSL

set -euo pipefail

# Configuration
DOMAIN="rpc.bitcoinbr.tech"
EMAIL="admin@bitcoinbr.tech"
RPC_PORT="8545"
WS_PORT="8546"

echo "==> Setting up NGINX with SSL for ${DOMAIN}"

# Install NGINX and Certbot
echo "==> Installing NGINX and Certbot"
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Stop NGINX temporarily
echo "==> Stopping NGINX for certificate generation"
sudo systemctl stop nginx

# Obtain SSL certificate
echo "==> Obtaining SSL certificate from Let's Encrypt"
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  -d "${DOMAIN}"

# Create NGINX configuration
echo "==> Creating NGINX configuration"
sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null <<'EOF'
# NGINX configuration for BSC RPC endpoint

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=5r/s;

# Upstream for RPC
upstream bsc_rpc {
    server 127.0.0.1:8545;
    keepalive 32;
}

# Upstream for WebSocket
upstream bsc_ws {
    server 127.0.0.1:8546;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name rpc.bitcoinbr.tech;

    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server for RPC
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name rpc.bitcoinbr.tech;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/rpc.bitcoinbr.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.bitcoinbr.tech/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # HSTS (optional but recommended)
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/rpc.bitcoinbr.tech_access.log;
    error_log /var/log/nginx/rpc.bitcoinbr.tech_error.log;

    # WebSocket endpoint
    location /ws {
        limit_req zone=ws_limit burst=10 nodelay;
        
        proxy_pass http://bsc_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        
        # Disable buffering for WebSocket
        proxy_buffering off;
    }

    # JSON-RPC endpoint (default)
    location / {
        limit_req zone=rpc_limit burst=20 nodelay;
        
        # Only allow POST requests for RPC
        if ($request_method !~ ^(POST|OPTIONS)$ ) {
            return 405;
        }

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://bsc_rpc;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
echo "==> Enabling NGINX site"
sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
echo "==> Testing NGINX configuration"
sudo nginx -t

# Start NGINX
echo "==> Starting NGINX"
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup automatic certificate renewal
echo "==> Setting up automatic certificate renewal"
sudo tee /etc/cron.d/certbot-renew > /dev/null <<'CRON'
0 0,12 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'
CRON

# Configure firewall (if UFW is installed)
if command -v ufw >/dev/null 2>&1; then
    echo "==> Configuring firewall"
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
fi

echo ""
echo "=========================================="
echo "🎉 NGINX SSL Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "Your BSC RPC endpoint is now available at:"
echo "  - HTTPS RPC: https://${DOMAIN}"
echo "  - WebSocket: wss://${DOMAIN}/ws"
echo ""
echo "SSL certificate will auto-renew every 12 hours"
echo ""
echo "Test your endpoint:"
echo "  curl -X POST -H \"Content-Type: application/json\" \\"
echo "    --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' \\"
echo "    https://${DOMAIN}"
echo ""
echo "=========================================="

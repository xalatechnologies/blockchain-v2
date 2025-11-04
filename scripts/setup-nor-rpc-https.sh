#!/bin/bash

#
# Setup HTTPS for Nor Chain RPC Endpoint
# Configures Nginx with SSL for RPC access
#

set -e

# Configuration
DOMAIN="${DOMAIN:-rpc.norchain.org}"
RPC_PORT="${RPC_PORT:-8545}"
WS_PORT="${WS_PORT:-8546}"
AWS_SERVER="${AWS_SERVER:-3.91.50.187}"
AWS_USER="${AWS_USER:-ec2-user}"
SSH_KEY="${SSH_KEY:-~/.ssh/bsc-validator-key.pem}"

echo "🔒 Setting Up HTTPS for Nor Chain RPC"
echo "======================================"
echo ""
echo "Domain: $DOMAIN"
echo "RPC Port: $RPC_PORT"
echo "WS Port: $WS_PORT"
echo ""

# Expand SSH key path
SSH_KEY=$(eval echo "$SSH_KEY")

# Check if domain is provided or use IP
if [ "$DOMAIN" = "rpc.norchain.org" ] && [ "$DOMAIN" != "$(dig +short $DOMAIN | head -1)" ]; then
    echo "⚠️  Warning: Domain $DOMAIN may not point to $AWS_SERVER"
    echo "   Using IP-based setup instead"
    DOMAIN="$AWS_SERVER"
fi

echo "📤 Copying HTTPS setup script to server..."
scp -i "$SSH_KEY" "$0" "$AWS_USER@$AWS_SERVER:/tmp/setup-https.sh" || {
    echo "❌ Failed to copy script"
    exit 1
}

echo ""
echo "🚀 Executing HTTPS setup on server..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_SERVER" << EOF
set -e

DOMAIN="$DOMAIN"
RPC_PORT="$RPC_PORT"
WS_PORT="$WS_PORT"

echo "🔧 Setting up HTTPS configuration..."

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo yum install -y certbot python3-certbot-nginx 2>/dev/null || \
    sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx 2>/dev/null || \
    echo "⚠️  Certbot installation failed - manual SSL setup required"
fi

# Create nginx configuration
echo "📝 Creating Nginx configuration..."
sudo tee /etc/nginx/conf.d/nor-rpc.conf > /dev/null << NGINX_CONF
# Rate limiting
limit_req_zone \\\$binary_remote_addr zone=rpc_limit:10m rate=10r/s;
limit_req_zone \\\$binary_remote_addr zone=ws_limit:10m rate=5r/s;

# Upstream for RPC
upstream nor_rpc {
    server 127.0.0.1:${RPC_PORT};
    keepalive 32;
}

# Upstream for WebSocket
upstream nor_ws {
    server 127.0.0.1:${WS_PORT};
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\\\$server_name\\\$request_uri;
    }
}

# HTTPS server for RPC
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/nor-rpc_access.log;
    error_log /var/log/nginx/nor-rpc_error.log;

    # WebSocket endpoint
    location /ws {
        limit_req zone=ws_limit burst=10 nodelay;
        
        proxy_pass http://nor_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }

    # JSON-RPC endpoint
    location / {
        limit_req zone=rpc_limit burst=200 nodelay;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;

        # Handle preflight
        if (\\\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://nor_rpc;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONF

echo "✅ Nginx configuration created"

# Test nginx configuration
echo "🔍 Testing Nginx configuration..."
sudo nginx -t || {
    echo "❌ Nginx configuration test failed"
    exit 1
}

# Setup SSL certificate
if [ "\$DOMAIN" != "$AWS_SERVER" ] && [ -n "\$DOMAIN" ]; then
    echo "🔒 Setting up SSL certificate for \$DOMAIN..."
    
    # Create webroot if needed
    sudo mkdir -p /var/www/html
    
    # Get certificate (this will prompt for email if not automated)
    if sudo certbot --nginx -d "\$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null || \
       sudo certbot certonly --nginx -d "\$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null; then
        echo "✅ SSL certificate obtained"
    else
        echo "⚠️  SSL certificate setup failed"
        echo "   Using self-signed certificate for now..."
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/nor-rpc.key \
            -out /etc/nginx/ssl/nor-rpc.crt \
            -subj "/CN=\$DOMAIN" 2>/dev/null || true
        
        # Update config to use self-signed cert
        sudo sed -i 's|/etc/letsencrypt/live/\$DOMAIN|/etc/nginx/ssl/nor-rpc|g' /etc/nginx/conf.d/nor-rpc.conf || true
    fi
else
    echo "⚠️  Using IP address - SSL requires domain name"
    echo "   Setting up self-signed certificate..."
    sudo mkdir -p /etc/nginx/ssl
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nor-rpc.key \
        -out /etc/nginx/ssl/nor-rpc.crt \
        -subj "/CN=$AWS_SERVER" 2>/dev/null || true
    
    # Update config to use self-signed cert
    sudo sed -i "s|/etc/letsencrypt/live/\$DOMAIN|/etc/nginx/ssl/nor-rpc|g" /etc/nginx/conf.d/nor-rpc.conf || true
    sudo sed -i "s|ssl_certificate_key /etc/letsencrypt/live/\$DOMAIN/privkey.pem|ssl_certificate_key /etc/nginx/ssl/nor-rpc.key|g" /etc/nginx/conf.d/nor-rpc.conf || true
fi

# Reload nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx || sudo nginx -s reload

echo ""
echo "✅ HTTPS setup complete!"
echo ""
echo "📋 Testing HTTPS endpoint..."
sleep 2
curl -k -s -X POST https://localhost \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | head -1 || echo "HTTPS test may need a moment"

echo ""
echo "=========================================="
echo "✅ HTTPS Configuration Complete"
echo "=========================================="
echo ""
echo "📋 Access URLs:"
if [ "\$DOMAIN" != "$AWS_SERVER" ]; then
    echo "   HTTPS: https://\$DOMAIN"
    echo "   HTTP: http://\$DOMAIN (redirects to HTTPS)"
else
    echo "   HTTPS: https://$AWS_SERVER"
    echo "   HTTP: http://$AWS_SERVER (redirects to HTTPS)"
fi
echo ""
EOF

echo ""
echo "✅ HTTPS setup script executed on server"
echo ""
echo "📋 Next Steps:"
echo "   1. If using a domain, ensure DNS points to $AWS_SERVER"
echo "   2. Test HTTPS endpoint"
echo "   3. Verify SSL certificate is valid"
echo ""


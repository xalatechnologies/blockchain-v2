#!/bin/bash
# Fix HTTPS reverse proxy and P2P peering for BSC validators

set -e

KEY="/Volumes/Development/sahalat/blockchain-v2/bsc-validator-key.pem"
SERVER="ec2-user@3.91.50.187"

echo "========================================="
echo "Fix HTTPS & P2P for BSC Validators"
echo "========================================="

echo -e "\n1. Fixing NGINX upstream configuration..."
ssh -i "$KEY" "$SERVER" << 'ENDSSH'
# Update NGINX config to point to correct RPC port (8545 only)
sudo tee /etc/nginx/conf.d/bsc-rpc.conf > /dev/null << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=50r/s;

# Upstream for RPC (HTTP) - Only validator-1 has RPC enabled
upstream bsc_rpc {
    server 127.0.0.1:8545 max_fails=3 fail_timeout=30s;
    keepalive 96;
}

# Upstream for WebSocket
upstream bsc_ws {
    server 127.0.0.1:8546 max_fails=3 fail_timeout=30s;
    keepalive 48;
}

# HTTP server (redirect to HTTPS)
server {
    listen 80;
    server_name rpc.bitcoinbr.tech;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server with SSL
server {
    listen 443 ssl;
    http2 on;
    server_name rpc.bitcoinbr.tech;
    
    # SSL certificate
    ssl_certificate /etc/letsencrypt/live/rpc.bitcoinbr.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.bitcoinbr.tech/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
    
    # RPC endpoint
    location / {
        limit_req zone=rpc_limit burst=200 nodelay;
        
        proxy_pass http://bsc_rpc;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # WebSocket endpoint
    location /ws {
        limit_req zone=ws_limit burst=100 nodelay;
        
        proxy_pass http://bsc_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx
echo "✅ NGINX config updated and reloaded"
ENDSSH

echo -e "\n2. Setting up P2P static nodes..."
ssh -i "$KEY" "$SERVER" << 'ENDSSH'
cd ~/bsc-production

# Wait for validators to generate enode addresses
sleep 5

# Get enode addresses
ENODE1=$(docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
ENODE2=$(docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
ENODE3=$(docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')

if [ -z "$ENODE1" ] || [ -z "$ENODE2" ] || [ -z "$ENODE3" ]; then
    echo "⚠️  Warning: Could not get all enode addresses. Waiting longer..."
    sleep 10
    ENODE1=$(docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
    ENODE2=$(docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
    ENODE3=$(docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
fi

# Create static-nodes.json for each validator
echo "[\"$ENODE2\", \"$ENODE3\"]" > validator-1/static-nodes.json
echo "[\"$ENODE1\", \"$ENODE3\"]" > validator-2/static-nodes.json
echo "[\"$ENODE1\", \"$ENODE2\"]" > validator-3/static-nodes.json

echo "✅ Static nodes configured"
echo "Enode 1: $ENODE1"
echo "Enode 2: $ENODE2"
echo "Enode 3: $ENODE3"

# Restart validators to apply static nodes
docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3
echo "✅ Validators restarted"
ENDSSH

echo -e "\n3. Waiting for chain to start..."
sleep 30

echo -e "\n========================================="
echo "Testing HTTPS & P2P"
echo "========================================="

echo -e "\n1. HTTPS Endpoint:"
curl -s https://rpc.bitcoinbr.tech -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq

echo -e "\n2. P2P Peers:"
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq

echo -e "\n3. Block Number:"
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq

echo -e "\n4. Your Balances:"
echo "  Native BNB:"
curl -s https://rpc.bitcoinbr.tech -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xdD779a290C937144F80Eb75b75d814c834536B1b","latest"],"id":1}' | jq

echo "  BTCBR Tokens:"
curl -s https://rpc.bitcoinbr.tech -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x70a08231000000000000000000000000dD779a290C937144F80Eb75b75d814c834536B1b"},"latest"],"id":1}' | jq

echo -e "\n========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "HTTPS RPC: https://rpc.bitcoinbr.tech"
echo "HTTP RPC: http://3.91.50.187:8545"
echo "WebSocket: wss://rpc.bitcoinbr.tech/ws"
echo ""

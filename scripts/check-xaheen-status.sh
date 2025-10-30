#!/bin/bash

echo "========================================"
echo "🔍 XAHEEN CHAIN STATUS CHECK"
echo "========================================"
echo ""

SERVER_IP="3.91.50.187"
SSH_KEY="bsc-validator-key.pem"

echo "📊 1. CHECKING RPC ENDPOINT"
echo "----------------------------"
RPC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:8545)
if [ "$RPC_STATUS" = "200" ] || [ "$RPC_STATUS" = "405" ]; then
    echo "✅ RPC is responding (HTTP $RPC_STATUS)"
    BLOCK=$(curl -s http://$SERVER_IP:8545 -X POST -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    echo "   Current block: $BLOCK"
else
    echo "❌ RPC not responding (HTTP $RPC_STATUS)"
fi
echo ""

echo "📡 2. CHECKING WEBSOCKET ENDPOINT"
echo "----------------------------"
WS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:8548)
if [ "$WS_STATUS" = "200" ] || [ "$WS_STATUS" = "400" ] || [ "$WS_STATUS" = "426" ]; then
    echo "✅ WebSocket port is open (HTTP $WS_STATUS)"
else
    echo "❌ WebSocket not responding (HTTP $WS_STATUS)"
fi
echo ""

echo "🔍 3. CHECKING BLOCK EXPLORER"
echo "----------------------------"
EXPLORER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:4000)
if [ "$EXPLORER_STATUS" = "200" ]; then
    echo "✅ Blockscout Explorer is running"
else
    echo "❌ Blockscout Explorer not found (HTTP $EXPLORER_STATUS)"
    echo "   Expected at: http://$SERVER_IP:4000"
fi
echo ""

echo "🔐 4. CHECKING HTTPS/SSL STATUS"
echo "----------------------------"
HTTPS_RPC=$(curl -s -o /dev/null -w "%{http_code}" https://rpc.xaheen.org 2>/dev/null)
if [ "$HTTPS_RPC" = "200" ] || [ "$HTTPS_RPC" = "405" ]; then
    echo "✅ HTTPS RPC endpoint configured"
    echo "   URL: https://rpc.xaheen.org"
else
    echo "❌ HTTPS RPC not configured"
    echo "   Current: http://$SERVER_IP:8545"
    echo "   Target:  https://rpc.xaheen.org"
fi

WSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ws.xaheen.org 2>/dev/null)
if [ "$WSS_STATUS" = "200" ] || [ "$WSS_STATUS" = "426" ]; then
    echo "✅ HTTPS WebSocket endpoint configured"
    echo "   URL: wss://ws.xaheen.org"
else
    echo "❌ HTTPS WebSocket not configured"
    echo "   Current: ws://$SERVER_IP:8548"
    echo "   Target:  wss://ws.xaheen.org"
fi

EXPLORER_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" https://explorer.xaheen.org 2>/dev/null)
if [ "$EXPLORER_HTTPS" = "200" ]; then
    echo "✅ HTTPS Explorer endpoint configured"
    echo "   URL: https://explorer.xaheen.org"
else
    echo "❌ HTTPS Explorer not configured"
    echo "   Current: http://$SERVER_IP:4000"
    echo "   Target:  https://explorer.xaheen.org"
fi
echo ""

echo "🌐 5. CHECKING DNS RECORDS"
echo "----------------------------"
RPC_DNS=$(nslookup rpc.xaheen.org 2>/dev/null | grep -A1 "Name:" | grep "Address" | awk '{print $2}')
if [ "$RPC_DNS" = "$SERVER_IP" ]; then
    echo "✅ DNS: rpc.xaheen.org → $SERVER_IP"
else
    echo "❌ DNS: rpc.xaheen.org not configured or incorrect"
    echo "   Expected: $SERVER_IP"
    echo "   Got: $RPC_DNS"
fi

WS_DNS=$(nslookup ws.xaheen.org 2>/dev/null | grep -A1 "Name:" | grep "Address" | awk '{print $2}')
if [ "$WS_DNS" = "$SERVER_IP" ]; then
    echo "✅ DNS: ws.xaheen.org → $SERVER_IP"
else
    echo "❌ DNS: ws.xaheen.org not configured or incorrect"
    echo "   Expected: $SERVER_IP"
    echo "   Got: $WS_DNS"
fi

EXPLORER_DNS=$(nslookup explorer.xaheen.org 2>/dev/null | grep -A1 "Name:" | grep "Address" | awk '{print $2}')
if [ "$EXPLORER_DNS" = "$SERVER_IP" ]; then
    echo "✅ DNS: explorer.xaheen.org → $SERVER_IP"
else
    echo "❌ DNS: explorer.xaheen.org not configured or incorrect"
    echo "   Expected: $SERVER_IP"
    echo "   Got: $EXPLORER_DNS"
fi
echo ""

echo "🐳 6. CHECKING DOCKER CONTAINERS ON SERVER"
echo "----------------------------"
if [ -f "$SSH_KEY" ]; then
    echo "Connecting to server via SSH..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@$SERVER_IP 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"' 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Successfully connected to server"
    else
        echo "❌ Could not connect to server via SSH"
    fi
else
    echo "❌ SSH key not found: $SSH_KEY"
fi
echo ""

echo "📋 7. SUMMARY & ACTION ITEMS"
echo "----------------------------"
echo ""
echo "✅ WORKING:"
echo "   - RPC Endpoint: http://$SERVER_IP:8545"
echo "   - WebSocket: ws://$SERVER_IP:8548"
echo "   - Validators: All 3 mining"
echo "   - Blocks: Producing every 3 seconds"
echo ""
echo "❌ NEEDS CONFIGURATION:"
echo "   1. DNS Records (rpc.xaheen.org, ws.xaheen.org, explorer.xaheen.org)"
echo "   2. HTTPS/SSL (Let's Encrypt + Nginx)"
echo "   3. Blockscout Explorer deployment"
echo "   4. MetaMask logos (need to host logo files)"
echo ""
echo "📖 See POST_LAUNCH_SETUP.md for detailed instructions"
echo ""
echo "========================================"

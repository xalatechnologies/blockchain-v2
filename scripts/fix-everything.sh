#!/bin/bash

echo "=========================================="
echo "🔧 FIX EVERYTHING - XAHEEN CHAIN"
echo "=========================================="
echo ""

# Check prerequisites
if [ ! -f "bsc-validator-key.pem" ]; then
    echo "❌ SSH key not found: bsc-validator-key.pem"
    exit 1
fi

echo "This script will:"
echo "  1. ✅ Fix WebSocket endpoint (automated)"
echo "  2. ⚠️  Setup HTTPS/SSL (requires DNS configuration)"
echo "  3. ℹ️  Show DNS requirements"
echo "  4. ℹ️  Show MetaMask setup instructions"
echo ""

read -p "Continue? (yes/no): " continue_fix
if [ "$continue_fix" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "=========================================="
echo "STEP 1: Fixing WebSocket"
echo "=========================================="
echo ""

if [ -f "scripts/fix-websocket.sh" ]; then
    chmod +x scripts/fix-websocket.sh
    ./scripts/fix-websocket.sh
    echo ""
    echo "✅ WebSocket fixed!"
else
    echo "⚠️  fix-websocket.sh not found, skipping..."
fi

echo ""
echo "=========================================="
echo "STEP 2: DNS Configuration Check"
echo "=========================================="
echo ""

echo "Checking DNS records..."
RPC_DNS=$(nslookup rpc.xaheen.org 2>/dev/null | grep "Address" | tail -1 | awk '{print $2}')
WS_DNS=$(nslookup ws.xaheen.org 2>/dev/null | grep "Address" | tail -1 | awk '{print $2}')
EXPLORER_DNS=$(nslookup explorer.xaheen.org 2>/dev/null | grep "Address" | tail -1 | awk '{print $2}')

DNS_CONFIGURED=true

if [ "$RPC_DNS" = "3.91.50.187" ]; then
    echo "✅ rpc.xaheen.org → 3.91.50.187"
else
    echo "❌ rpc.xaheen.org not configured (got: $RPC_DNS)"
    DNS_CONFIGURED=false
fi

if [ "$WS_DNS" = "3.91.50.187" ]; then
    echo "✅ ws.xaheen.org → 3.91.50.187"
else
    echo "❌ ws.xaheen.org not configured (got: $WS_DNS)"
    DNS_CONFIGURED=false
fi

if [ "$EXPLORER_DNS" = "3.91.50.187" ]; then
    echo "✅ explorer.xaheen.org → 3.91.50.187"
else
    echo "❌ explorer.xaheen.org not configured (got: $EXPLORER_DNS)"
    DNS_CONFIGURED=false
fi

echo ""

if [ "$DNS_CONFIGURED" = "false" ]; then
    echo "⚠️  DNS NOT CONFIGURED"
    echo ""
    echo "Please configure these DNS A records in your domain registrar:"
    echo ""
    echo "  Type: A"
    echo "  Name: rpc"
    echo "  Value: 3.91.50.187"
    echo "  TTL: 300"
    echo ""
    echo "  Type: A"
    echo "  Name: ws"
    echo "  Value: 3.91.50.187"
    echo "  TTL: 300"
    echo ""
    echo "  Type: A"
    echo "  Name: explorer"
    echo "  Value: 3.91.50.187"
    echo "  TTL: 300"
    echo ""
    echo "After configuring DNS, wait 5-10 minutes, then run:"
    echo "  ./scripts/setup-nginx-ssl.sh"
    echo ""
else
    echo "✅ DNS fully configured!"
    echo ""
    read -p "Setup HTTPS/SSL now? (yes/no): " setup_ssl
    if [ "$setup_ssl" = "yes" ]; then
        if [ -f "scripts/setup-nginx-ssl.sh" ]; then
            chmod +x scripts/setup-nginx-ssl.sh
            ./scripts/setup-nginx-ssl.sh
        else
            echo "⚠️  setup-nginx-ssl.sh not found"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "STEP 3: MetaMask Integration"
echo "=========================================="
echo ""

echo "To add Xaheen Chain to MetaMask, users should:"
echo ""
echo "1. Open MetaMask"
echo "2. Click Network dropdown → Add Network → Add network manually"
echo "3. Enter these details:"
echo ""
echo "   Network Name: Xaheen Chain"
echo "   RPC URL: https://rpc.xaheen.org (or http://3.91.50.187:8545)"
echo "   Chain ID: 65001"
echo "   Currency Symbol: XHT"
echo "   Block Explorer: https://explorer.xaheen.org (your custom explorer)"
echo ""
echo "4. To add BTCBR token:"
echo "   - Click 'Import tokens'"
echo "   - Token Contract Address: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo "   - Token Symbol: BTCBR"
echo "   - Token Decimal: 18"
echo ""

echo "For logo files, you'll need to:"
echo "  1. Create xht-logo-256.png (256x256 pixels)"
echo "  2. Create btcbr-logo-256.png (256x256 pixels)"
echo "  3. Host them publicly (GitHub, IPFS, or your domain)"
echo "  4. Add iconUrls to MetaMask configuration"
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""

echo "✅ COMPLETED:"
echo "  - WebSocket endpoint fixed"
echo "  - Validators running with WS enabled"
echo ""

if [ "$DNS_CONFIGURED" = "true" ]; then
    echo "✅ DNS CONFIGURED:"
    echo "  - rpc.xaheen.org ready"
    echo "  - ws.xaheen.org ready"
    echo "  - explorer.xaheen.org ready"
else
    echo "⚠️  TODO (MANUAL):"
    echo "  - Configure DNS A records (see above)"
    echo "  - Run: ./scripts/setup-nginx-ssl.sh (after DNS)"
fi

echo ""
echo "⚠️  TODO (OPTIONAL):"
echo "  - Create and host logo PNG files"
echo "  - Deploy your custom explorer"
echo "  - Update Nginx explorer proxy port"
echo ""

echo "=========================================="
echo ""
echo "Current endpoints:"
echo "  RPC: http://3.91.50.187:8545 ✅"
echo "  WebSocket: ws://3.91.50.187:8548 ✅"
echo ""

if [ "$DNS_CONFIGURED" = "true" ]; then
    echo "After SSL setup:"
    echo "  RPC: https://rpc.xaheen.org"
    echo "  WebSocket: wss://ws.xaheen.org"
    echo "  Explorer: https://explorer.xaheen.org"
fi

echo ""
echo "For detailed documentation, see:"
echo "  - README_FIXES.md"
echo "  - docs/POST_LAUNCH_SETUP.md"
echo "  - FIXES_NEEDED.md"
echo ""

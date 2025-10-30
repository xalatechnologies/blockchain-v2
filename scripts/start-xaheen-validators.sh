#!/bin/bash

##############################################################################
# Start Xaheen Chain Validators
##############################################################################
#
# This script starts 3 validators for Xaheen Chain (Chain ID 65001)
#
# Prerequisites:
#   - Validators initialized with ./scripts/init-xaheen-validators.sh
#   - Docker installed and running
#
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║            Starting Xaheen Chain Validators                ║"
echo "║                                                            ║"
echo "║  Chain ID: 65001 | Network ID: 65001 | Native Token: XHT  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

cd "$PROJECT_DIR"

# Stop existing validators
echo -e "${YELLOW}[Step 1/4] Stopping existing validators...${NC}"
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3 2>/dev/null || true
echo -e "${GREEN}✓ Old validators stopped${NC}"

# Check if validators are initialized
echo -e "${YELLOW}[Step 2/4] Verifying validator initialization...${NC}"
if [ ! -d "validator-1/geth" ] || [ ! -d "validator-2/geth" ] || [ ! -d "validator-3/geth" ]; then
    echo -e "${RED}Error: Validators not initialized${NC}"
    echo "Please run: ./scripts/init-xaheen-validators.sh"
    exit 1
fi
echo -e "${GREEN}✓ Validators initialized${NC}"

# Get validator enodes (will be generated on first start)
echo -e "${YELLOW}[Step 3/4] Starting validators...${NC}"

# Start Validator 1 (RPC + P2P)
echo "Starting validator-1..."
docker run -d \
  --name bsc-validator-1 \
  --network host \
  -v "$(pwd)/validator-1:/bsc" \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --port 30303 \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api eth,net,web3,txpool,parlia \
  --ws \
  --ws.addr 0.0.0.0 \
  --ws.port 8546 \
  --ws.api eth,net,web3,txpool,parlia \
  --gcmode archive \
  --syncmode full \
  --allow-insecure-unlock \
  --nodiscover

echo -e "${GREEN}✓ Validator 1 started (ports: 8545 RPC, 8546 WS, 30303 P2P)${NC}"

# Start Validator 2 (P2P only)
echo "Starting validator-2..."
docker run -d \
  --name bsc-validator-2 \
  --network host \
  -v "$(pwd)/validator-2:/bsc" \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --port 30304 \
  --gcmode archive \
  --syncmode full \
  --nodiscover

echo -e "${GREEN}✓ Validator 2 started (port: 30304 P2P)${NC}"

# Start Validator 3 (P2P only)
echo "Starting validator-3..."
docker run -d \
  --name bsc-validator-3 \
  --network host \
  -v "$(pwd)/validator-3:/bsc" \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --port 30305 \
  --gcmode archive \
  --syncmode full \
  --nodiscover

echo -e "${GREEN}✓ Validator 3 started (port: 30305 P2P)${NC}"

# Wait for validators to start
echo ""
echo -e "${YELLOW}[Step 4/4] Waiting for validators to start (5 seconds)...${NC}"
sleep 5

# Check validator status
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Validator Status                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

docker ps --filter "name=bsc-validator" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Next Steps                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}1. Verify Chain ID (should be 0xFDE9 = 65001):${NC}"
echo "   curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}'"
echo ""
echo -e "${GREEN}2. Check block production:${NC}"
echo "   curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo -e "${GREEN}3. View validator logs:${NC}"
echo "   docker logs -f bsc-validator-1"
echo "   docker logs -f bsc-validator-2"
echo "   docker logs -f bsc-validator-3"
echo ""
echo -e "${GREEN}4. Check BTCBR contract:${NC}"
echo "   curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"0x0cF8e180350253271f4b917CcFb0aCCc4862F262\",\"latest\"],\"id\":1}'"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}║  Xaheen Chain - Where Intelligence Meets Blockchain  🧠⚡ ║${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}✅ All validators started successfully!${NC}"
echo ""

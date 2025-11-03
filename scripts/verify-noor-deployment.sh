#!/bin/bash

################################################################################
# NOOR CHAIN DEPLOYMENT VERIFICATION & NEXT STEPS
# 
# This script verifies the current deployment status and guides next steps
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

RPC_URL="http://3.91.50.187:8545"
BTCBR_CONTRACT="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"

print_header() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

################################################################################
# STEP 1: Block Production Verification
################################################################################

verify_block_production() {
    print_header "STEP 1: BLOCK PRODUCTION VERIFICATION"
    
    # Get initial block
    BLOCK1=$(curl -s -X POST $RPC_URL \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$BLOCK1" ]; then
        print_error "RPC not responding"
        return 1
    fi
    
    BLOCK1_DEC=$((16#${BLOCK1#0x}))
    print_step "Initial block: $BLOCK1_DEC"
    
    sleep 10
    
    # Get block after 10 seconds
    BLOCK2=$(curl -s -X POST $RPC_URL \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    BLOCK2_DEC=$((16#${BLOCK2#0x}))
    print_step "Current block: $BLOCK2_DEC"
    
    if [ "$BLOCK2_DEC" -gt "$BLOCK1_DEC" ]; then
        BLOCKS_PRODUCED=$((BLOCK2_DEC - BLOCK1_DEC))
        print_success "Blocks are being produced! ($BLOCKS_PRODUCED blocks in 10 seconds)"
        echo "  Expected: ~3 blocks (3-second block time)"
        return 0
    else
        print_error "No new blocks produced in 10 seconds"
        return 1
    fi
}

################################################################################
# STEP 2: Peer Connectivity Check
################################################################################

verify_peer_connectivity() {
    print_header "STEP 2: PEER CONNECTIVITY CHECK"
    
    PEER_COUNT=$(curl -s -X POST $RPC_URL \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$PEER_COUNT" ]; then
        PEERS_DEC=$((16#${PEER_COUNT#0x}))
        if [ "$PEERS_DEC" -ge 2 ]; then
            print_success "Peer connectivity: $PEERS_DEC peers (Expected: 2-3)"
        else
            print_warning "Low peer count: $PEERS_DEC (Expected: 2-3)"
        fi
    else
        print_error "Failed to get peer count"
    fi
}

################################################################################
# STEP 3: BTCBR Token Verification
################################################################################

verify_btcbr_token() {
    print_header "STEP 3: BTCBR TOKEN VERIFICATION"
    
    # Total Supply
    TOTAL_SUPPLY=$(curl -s -X POST $RPC_URL \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$BTCBR_CONTRACT\",\"data\":\"0x18160ddd\"},\"latest\"],\"id\":1}" | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOTAL_SUPPLY" ]; then
        print_success "BTCBR contract is accessible"
        echo "  Total Supply: $TOTAL_SUPPLY"
        echo "  Expected: 0x0000000000000000000000000000f11174133693f7744cb170dfb40000000000"
        
        if [ "$TOTAL_SUPPLY" == "0x0000000000000000000000000000f11174133693f7744cb170dfb40000000000" ]; then
            print_success "Total supply matches: 21 septillion ✓"
        else
            print_warning "Total supply differs from expected"
        fi
    else
        print_error "Failed to read BTCBR contract"
    fi
}

################################################################################
# STEP 4: Contract Deployment Readiness
################################################################################

check_contract_deployment_readiness() {
    print_header "STEP 4: CONTRACT DEPLOYMENT READINESS"
    
    print_step "Checking deployer wallet balance..."
    
    # Check if .env exists
    if [ -f .env ]; then
        print_success ".env file found"
        
        # Check for required keys
        if grep -q "PRIVATE_CHAIN_KEY" .env && grep -q "PRIVATE_CHAIN_RPC" .env; then
            print_success "Deployment keys configured"
        else
            print_warning "Missing PRIVATE_CHAIN_KEY or PRIVATE_CHAIN_RPC in .env"
        fi
    else
        print_warning ".env file not found - needed for contract deployments"
    fi
    
    # Check hardhat.config.js
    if [ -f hardhat.config.js ]; then
        print_success "Hardhat configuration found"
    else
        print_error "hardhat.config.js not found"
    fi
}

################################################################################
# STEP 5: Next Steps Checklist
################################################################################

display_next_steps() {
    print_header "NEXT STEPS ROADMAP"
    
    echo -e "${CYAN}📋 DEPLOYMENT CHECKLIST:${NC}"
    echo ""
    
    echo -e "${YELLOW}Phase 1: Core Contracts${NC}"
    echo "  ⏺ 1. Deploy NOR Token (native token)"
    echo "     → npx hardhat run scripts/deploy-nor-token.js --network btcbr"
    echo ""
    echo "  ⏺ 2. Deploy Wrapped NOR (WNOR)"
    echo "     → npx hardhat run scripts/deploy-wnor.js --network btcbr"
    echo ""
    
    echo -e "${YELLOW}Phase 2: DEX Infrastructure${NC}"
    echo "  ⏺ 3. Deploy NoorSwap Factory"
    echo "     → npx hardhat run scripts/deploy-noorswap-factory.js --network btcbr"
    echo ""
    echo "  ⏺ 4. Deploy NoorSwap Router"
    echo "     → npx hardhat run scripts/deploy-noorswap-router.js --network btcbr"
    echo ""
    echo "  ⏺ 5. Create initial liquidity pairs:"
    echo "     • NOR/BTCBR"
    echo "     • NOR/WNOR"
    echo "     → npx hardhat run scripts/add-initial-liquidity.js --network btcbr"
    echo ""
    
    echo -e "${YELLOW}Phase 3: Bridge Deployment${NC}"
    echo "  ⏺ 6. Deploy mainnet bridge (BSC → Noor Chain)"
    echo "     → npx hardhat run scripts/hardhat-deploy-mainnet.js --network bsc"
    echo ""
    echo "  ⏺ 7. Deploy private chain bridge (Noor Chain → BSC)"
    echo "     → npx hardhat run scripts/hardhat-deploy-private.js --network btcbr"
    echo ""
    echo "  ⏺ 8. Configure bridge validators"
    echo "     → npx hardhat run scripts/configure-bridge-validators.js --network btcbr"
    echo ""
    
    echo -e "${YELLOW}Phase 4: Liquidity Lock${NC}"
    echo "  ⏺ 9. Deploy liquidity lock contract"
    echo "     → npx hardhat run scripts/deploy-liquidity-lock.js --network btcbr"
    echo ""
    echo "  ⏺ 10. Lock \$800,000 worth of LP tokens"
    echo "     → npx hardhat run scripts/lock-liquidity.js --network btcbr"
    echo ""
    
    echo -e "${YELLOW}Phase 5: Stablecoins${NC}"
    echo "  ⏺ 11. Deploy Dirhamat (AED-backed stablecoin)"
    echo "     → npx hardhat run scripts/deploy-dirhamat.js --network btcbr"
    echo ""
    echo "  ⏺ 12. Deploy Digital KES (Kenyan Shilling)"
    echo "     → npx hardhat run scripts/deploy-digital-kes.js --network btcbr"
    echo ""
    echo "  ⏺ 13. Deploy NordCoin (Nordic currency)"
    echo "     → npx hardhat run scripts/deploy-nordcoin.js --network btcbr"
    echo ""
    
    echo -e "${YELLOW}Phase 6: Verification & Security${NC}"
    echo "  ⏺ 14. Run security audit on deployed contracts"
    echo "  ⏺ 15. Verify all contracts on block explorer"
    echo "  ⏺ 16. Test bridge transfers (mainnet ↔ private)"
    echo "  ⏺ 17. Test DEX swaps and liquidity provision"
    echo ""
    
    echo -e "${YELLOW}Phase 7: Infrastructure${NC}"
    echo "  ⏺ 18. Deploy Blockscout explorer"
    echo "     → cd infrastructure/ansible && ansible-playbook playbooks/deploy-explorer.yml"
    echo ""
    echo "  ⏺ 19. Configure DNS (rpc.noorchain.org)"
    echo "  ⏺ 20. Setup SSL/HTTPS with Let's Encrypt"
    echo "     → bash scripts/setup-nginx-ssl.sh"
    echo ""
    
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    print_header "🌙 NOOR CHAIN DEPLOYMENT VERIFICATION 🌙"
    
    # Run all verification steps
    verify_block_production
    BLOCK_STATUS=$?
    
    verify_peer_connectivity
    verify_btcbr_token
    check_contract_deployment_readiness
    
    echo ""
    display_next_steps
    
    echo ""
    if [ $BLOCK_STATUS -eq 0 ]; then
        print_success "✨ Noor Chain is operational and ready for contract deployments! ✨"
    else
        print_warning "⚠ Chain verification completed with warnings - review above"
    fi
    echo ""
}

main

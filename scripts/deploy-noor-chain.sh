#!/bin/bash

################################################################################
# NOOR CHAIN - CORRECTED BTCBR SUPPLY DEPLOYMENT SCRIPT
# 
# This script deploys the Noor Chain with the corrected BTCBR total supply
# of 21 septillion tokens (21 × 10^42 wei)
#
# Chain ID: 885824
# Network: BTCBR Private BSC
# Validators: 3 active validators
################################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
GENESIS_FILE="genesis-noor-corrected.json"
NETWORK_ID="885824"
CHAIN_ID="885824"

# Validator addresses (matching validators-info-v2.json and corrected genesis)
VALIDATOR_1="0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C"
VALIDATOR_2="0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788"
VALIDATOR_3="0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"

# BTCBR token contract
BTCBR_CONTRACT="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
USER_WALLET="0xdD779a290C937144F80Eb75b75d814c834536B1b"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
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
# Step 1: Pre-deployment Checks
################################################################################

install_geth() {
    print_header "📦 INSTALLING GETH BINARY"
    
    # Check if geth is already installed
    if [ -f ~/geth ] && [ -x ~/geth ]; then
        print_success "Geth binary already exists"
        return 0
    fi
    
    print_step "Downloading BSC geth binary..."
    
    # Download BSC geth (latest version)
    GETH_VERSION="1.4.15"  # Latest BSC version
    GETH_URL="https://github.com/bnb-chain/bsc/releases/download/v${GETH_VERSION}/geth_linux"
    
    if command -v wget &> /dev/null; then
        wget -O ~/geth "$GETH_URL" 2>&1 | tail -5
    elif command -v curl &> /dev/null; then
        curl -L -o ~/geth "$GETH_URL"
    else
        print_error "Neither wget nor curl is available"
        exit 1
    fi
    
    # Make it executable
    chmod +x ~/geth
    
    # Verify download
    if [ -f ~/geth ] && [ -x ~/geth ]; then
        print_success "Geth binary installed successfully"
        ~/geth version | head -3
    else
        print_error "Failed to install geth binary"
        exit 1
    fi
}

check_prerequisites() {
    print_header "🔍 PRE-DEPLOYMENT CHECKS"
    
    # Check if genesis file exists
    if [ ! -f "$GENESIS_FILE" ]; then
        print_error "Genesis file not found: $GENESIS_FILE"
        exit 1
    fi
    print_success "Genesis file found: $GENESIS_FILE"
    
    # Install geth if needed
    install_geth
    
    # Check validator directories
    for i in 1 2 3; do
        if [ ! -d ~/validator-$i ]; then
            print_warning "Validator-$i directory not found, will be created during init"
        else
            print_success "Validator-$i directory exists"
        fi
    done
}

################################################################################
# Step 2: Stop Running Validators
################################################################################

stop_validators() {
    print_header "⏹️  STOPPING RUNNING VALIDATORS"
    
    print_step "Killing all geth processes..."
    pkill -f geth || true
    sleep 5
    
    # Verify all processes are stopped
    if pgrep -f geth > /dev/null; then
        print_warning "Some geth processes still running, force killing..."
        pkill -9 -f geth || true
        sleep 3
    fi
    
    print_success "All validators stopped"
}

################################################################################
# Step 3: Backup Current Data
################################################################################

backup_data() {
    print_header "💾 BACKING UP CURRENT DATA"
    
    BACKUP_DIR=~/backups/pre-noor-$(date +%Y%m%d-%H%M%S)
    print_step "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    for i in 1 2 3; do
        if [ -d ~/validator-$i/geth ]; then
            print_step "Backing up validator-$i data..."
            cp -r ~/validator-$i "$BACKUP_DIR/" 2>/dev/null || true
            print_success "Validator-$i backed up"
        fi
    done
    
    print_success "Backup completed: $BACKUP_DIR"
}

################################################################################
# Step 4: Clean Old Chain Data
################################################################################

clean_chain_data() {
    print_header "🧹 CLEANING OLD CHAIN DATA"
    
    for i in 1 2 3; do
        print_step "Cleaning validator-$i chain data..."
        rm -rf ~/validator-$i/geth/chaindata
        rm -rf ~/validator-$i/geth/lightchaindata
        rm -rf ~/validator-$i/geth/nodes
        rm -rf ~/validator-$i/geth/LOCK
        print_success "Validator-$i cleaned"
    done
}

################################################################################
# Step 5: Initialize with New Genesis
################################################################################

initialize_genesis() {
    print_header "🚀 INITIALIZING WITH CORRECTED GENESIS"
    
    # Copy keystores to validator directories
    print_step "Setting up validator keystores..."
    
    # Validator 1
    if [ -f ~/validator-1-keystore.json ]; then
        mkdir -p ~/validator-1/keystore
        cp ~/validator-1-keystore.json ~/validator-1/keystore/
        echo "3d5679f1148d19b440646957f146176c063a645dd44fc1b8f759fe613eae8edd" > ~/validator-1/password.txt
        print_success "Validator 1 keystore configured"
    fi
    
    # Validator 2
    if [ -f ~/validator-2-keystore.json ]; then
        mkdir -p ~/validator-2/keystore
        cp ~/validator-2-keystore.json ~/validator-2/keystore/
        echo "1951ebbb13475ec4e85f7b4805217d73f5ce47fd514f7ccad06a7ee8de2d1fb9" > ~/validator-2/password.txt
        print_success "Validator 2 keystore configured"
    fi
    
    # Validator 3
    if [ -f ~/validator-3-keystore.json ]; then
        mkdir -p ~/validator-3/keystore
        cp ~/validator-3-keystore.json ~/validator-3/keystore/
        echo "5d63896daa81bbe7856a40d0592de750d211d10a19676ac0905198a498fb8d83" > ~/validator-3/password.txt
        print_success "Validator 3 keystore configured"
    fi
    
    for i in 1 2 3; do
        print_step "Initializing validator-$i..."
        ~/geth init --datadir ~/validator-$i ~/"$GENESIS_FILE"
        print_success "Validator-$i initialized"
    done
}

################################################################################
# Step 6: Start Validators
################################################################################

start_validators() {
    print_header "⚡ STARTING VALIDATORS"
    
    # Start Validator 1 (Primary with RPC)
    print_step "Starting Validator 1 (Primary with RPC on port 8545)..."
    nohup ~/geth \
        --datadir ~/validator-1 \
        --networkid $NETWORK_ID \
        --port 30303 \
        --http \
        --http.addr "0.0.0.0" \
        --http.port 8545 \
        --http.api "eth,net,web3,personal,admin,txpool,debug" \
        --http.corsdomain "*" \
        --ws \
        --ws.addr "0.0.0.0" \
        --ws.port 8546 \
        --ws.api "eth,net,web3,personal,admin,txpool,debug" \
        --ws.origins "*" \
        --unlock "$VALIDATOR_1" \
        --password ~/validator-1/password.txt \
        --mine \
        --miner.etherbase "$VALIDATOR_1" \
        --allow-insecure-unlock \
        --syncmode "full" \
        --maxpeers 50 \
        > ~/validator-1.log 2>&1 &
    sleep 3
    print_success "Validator 1 started (PID: $!)"
    
    # Start Validator 2
    print_step "Starting Validator 2 (Port 30304)..."
    nohup ~/geth \
        --datadir ~/validator-2 \
        --networkid $NETWORK_ID \
        --port 30304 \
        --unlock "$VALIDATOR_2" \
        --password ~/validator-2/password.txt \
        --mine \
        --miner.etherbase "$VALIDATOR_2" \
        --allow-insecure-unlock \
        --syncmode "full" \
        --maxpeers 50 \
        > ~/validator-2.log 2>&1 &
    sleep 3
    print_success "Validator 2 started (PID: $!)"
    
    # Start Validator 3
    print_step "Starting Validator 3 (Port 30305)..."
    nohup ~/geth \
        --datadir ~/validator-3 \
        --networkid $NETWORK_ID \
        --port 30305 \
        --unlock "$VALIDATOR_3" \
        --password ~/validator-3/password.txt \
        --mine \
        --miner.etherbase "$VALIDATOR_3" \
        --allow-insecure-unlock \
        --syncmode "full" \
        --maxpeers 50 \
        > ~/validator-3.log 2>&1 &
    sleep 3
    print_success "Validator 3 started (PID: $!)"
    
    print_success "All validators started successfully"
}

################################################################################
# Step 7: Verify Deployment
################################################################################

verify_deployment() {
    print_header "✅ VERIFYING DEPLOYMENT"
    
    # Wait for nodes to fully start
    print_step "Waiting 15 seconds for validators to initialize..."
    sleep 15
    
    # Check processes
    print_step "Checking validator processes..."
    PROCESS_COUNT=$(pgrep -f geth | wc -l)
    if [ "$PROCESS_COUNT" -eq 3 ]; then
        print_success "All 3 validators are running"
    else
        print_warning "Expected 3 validators, found $PROCESS_COUNT"
    fi
    
    # Check block number
    print_step "Checking block production..."
    BLOCK_NUMBER=$(curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$BLOCK_NUMBER" ]; then
        BLOCK_DEC=$((16#${BLOCK_NUMBER#0x}))
        print_success "RPC responding - Current block: $BLOCK_DEC"
    else
        print_error "Failed to get block number from RPC"
    fi
    
    # Check BTCBR balance
    print_step "Verifying BTCBR token balance for user wallet..."
    BALANCE_HEX=$(curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d "{
            \"jsonrpc\":\"2.0\",
            \"method\":\"eth_call\",
            \"params\":[{
                \"to\":\"$BTCBR_CONTRACT\",
                \"data\":\"0x70a08231000000000000000000000000${USER_WALLET#0x}\"
            },\"latest\"],
            \"id\":1
        }" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$BALANCE_HEX" ]; then
        print_success "BTCBR balance retrieved: $BALANCE_HEX"
        
        # Expected: 0x0000000000000000000000000000000000000000045fc35a71ee974000000000 (10.5 septillion)
        EXPECTED="0x0000000000000000000000000000000000000000045fc35a71ee974000000000"
        if [ "$BALANCE_HEX" = "$EXPECTED" ]; then
            print_success "✨ BTCBR balance is CORRECT: 10.5 septillion tokens"
        else
            print_warning "Balance differs from expected value"
            echo "  Expected: $EXPECTED"
            echo "  Got:      $BALANCE_HEX"
        fi
    else
        print_error "Failed to retrieve BTCBR balance"
    fi
    
    # Check peer count
    print_step "Checking peer connections..."
    PEER_COUNT=$(curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$PEER_COUNT" ]; then
        PEERS_DEC=$((16#${PEER_COUNT#0x}))
        print_success "Peer count: $PEERS_DEC"
    fi
}

################################################################################
# Step 8: Display Summary
################################################################################

display_summary() {
    print_header "🌙 NOOR CHAIN DEPLOYMENT COMPLETE 🌙"
    
    echo -e "${GREEN}Chain Configuration:${NC}"
    echo "  Network ID:      $NETWORK_ID"
    echo "  Chain ID:        $CHAIN_ID"
    echo "  Genesis:         $GENESIS_FILE"
    echo ""
    echo -e "${GREEN}RPC Endpoints:${NC}"
    echo "  HTTP RPC:        http://3.91.50.187:8545"
    echo "  WebSocket:       ws://3.91.50.187:8546"
    echo "  HTTPS RPC:       https://rpc.bitcoinbr.tech"
    echo "  WSS:             wss://rpc.bitcoinbr.tech/ws"
    echo ""
    echo -e "${GREEN}BTCBR Token:${NC}"
    echo "  Contract:        $BTCBR_CONTRACT"
    echo "  Total Supply:    21 septillion (21 × 10^42 wei)"
    echo "  User Balance:    10.5 septillion tokens"
    echo "  Validator Bal:   10.5 septillion tokens"
    echo ""
    echo -e "${GREEN}Validators:${NC}"
    echo "  Validator 1:     $VALIDATOR_1 (RPC enabled)"
    echo "  Validator 2:     $VALIDATOR_2"
    echo "  Validator 3:     $VALIDATOR_3"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  View logs:       tail -f ~/validator-1.log"
    echo "  Check processes: ps aux | grep geth"
    echo "  Stop all:        pkill -f geth"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✨ Noor Chain is now LIVE with corrected BTCBR supply! ✨${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "🌙 NOOR CHAIN DEPLOYMENT INITIATED 🌙"
    
    check_prerequisites
    stop_validators
    backup_data
    clean_chain_data
    initialize_genesis
    start_validators
    verify_deployment
    display_summary
}

# Run main function
main

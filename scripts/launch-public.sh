#!/bin/bash
#
# BTCBR Chain Public Launch - Automated Deployment Script
# Budget: $10,000 | Timeline: 7 days
#
# Usage: ./launch-public.sh [step]
# Example: ./launch-public.sh all
#          ./launch-public.sh explorer
#          ./launch-public.sh bridge
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHAIN_ID=885824
NETWORK_NAME="BTCBR Chain"
RPC_URL="https://rpc.bitcoinbr.tech"
HTTP_RPC="http://3.91.50.187:8545"
EXPLORER_DOMAIN="explorer.bitcoinbr.tech"
BTCBR_TOKEN="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
SERVER_IP="3.91.50.187"

# Budget tracking
TOTAL_BUDGET=10000
SPENT=0

echo_step() {
    echo -e "${BLUE}==>${NC} $1"
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

track_spending() {
    local amount=$1
    local description=$2
    SPENT=$((SPENT + amount))
    echo_step "Budget: Spent \$$amount on $description"
    echo_step "Total spent: \$$SPENT / \$$TOTAL_BUDGET"
    
    if [ $SPENT -gt $TOTAL_BUDGET ]; then
        echo_error "Budget exceeded! Stopping..."
        exit 1
    fi
}

# DAY 1: Infrastructure
deploy_explorer() {
    echo_step "DAY 1: Deploying Block Explorer (Blockscout)"
    
    # Check if running on server
    if [ "$(hostname -I | awk '{print $1}')" != "$SERVER_IP" ]; then
        echo_warning "This should be run on the server ($SERVER_IP)"
        echo_step "Run: ssh -i bsc-validator-key.pem ubuntu@$SERVER_IP"
        return 1
    fi
    
    # Install Docker Compose
    echo_step "Installing Docker Compose..."
    sudo apt-get update -qq
    sudo apt-get install -y docker-compose
    
    # Create Blockscout directory
    echo_step "Setting up Blockscout..."
    mkdir -p ~/blockscout
    cd ~/blockscout
    
    # Download docker-compose
    wget -q https://raw.githubusercontent.com/blockscout/blockscout/master/docker-compose/docker-compose.yml
    
    # Generate secret key
    SECRET_KEY=$(openssl rand -base64 64 | tr -d '\n')
    
    # Create environment file
    cat > .env << EOF
NETWORK_NAME=$NETWORK_NAME
SUBNETWORK=Mainnet
CHAIN_ID=$CHAIN_ID
ETHEREUM_JSONRPC_VARIANT=geth
ETHEREUM_JSONRPC_HTTP_URL=http://localhost:8545
ETHEREUM_JSONRPC_WS_URL=ws://localhost:8546
COIN=BNB
LOGO=/images/btcbr_logo.svg
BLOCKSCOUT_HOST=$EXPLORER_DOMAIN
BLOCKSCOUT_PROTOCOL=https
SECRET_KEY_BASE=$SECRET_KEY
DATABASE_URL=postgresql://postgres:changeme@postgres:5432/blockscout
ECTO_USE_SSL=false
EOF
    
    # Start Blockscout
    echo_step "Starting Blockscout containers..."
    docker-compose up -d
    
    # Wait for services
    echo_step "Waiting for Blockscout to initialize (this may take 5-10 minutes)..."
    sleep 60
    
    # Check status
    if docker-compose ps | grep -q "Up"; then
        echo_success "Blockscout is running!"
        echo_step "Accessible at: http://$SERVER_IP:4000"
    else
        echo_error "Blockscout failed to start"
        docker-compose logs
        return 1
    fi
    
    track_spending 0 "Block Explorer (self-hosted)"
}

configure_explorer_nginx() {
    echo_step "Configuring NGINX for Explorer..."
    
    # Create NGINX config
    sudo tee /etc/nginx/sites-available/explorer > /dev/null << 'EOF'
server {
    listen 80;
    server_name explorer.bitcoinbr.tech;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/explorer /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    # Get SSL certificate
    echo_step "Obtaining SSL certificate for $EXPLORER_DOMAIN..."
    echo_warning "Make sure DNS is configured: $EXPLORER_DOMAIN A $SERVER_IP"
    read -p "Press Enter when DNS is ready..."
    
    sudo certbot --nginx -d $EXPLORER_DOMAIN --non-interactive --agree-tos --email admin@bitcoinbr.tech
    
    echo_success "Explorer configured at: https://$EXPLORER_DOMAIN"
}

# DAY 2: Bridge Deployment
deploy_mainnet_bridge() {
    echo_step "DAY 2: Deploying Bridge to BSC Mainnet"
    
    # Check environment variables
    if [ -z "$MAINNET_PRIVATE_KEY" ]; then
        echo_error "MAINNET_PRIVATE_KEY not set"
        echo_step "Export your mainnet deployer private key:"
        echo_step "export MAINNET_PRIVATE_KEY='0x...'"
        return 1
    fi
    
    cd /Volumes/Development/sahalat/blockchain-v2
    
    # Deploy mainnet bridge
    echo_step "Deploying BTCBRBridgeMainnet..."
    node scripts/deploy-mainnet-bridge.js
    
    # Save address
    echo_step "Save the bridge address from output above"
    read -p "Enter MAINNET_BRIDGE_ADDRESS: " MAINNET_BRIDGE
    export MAINNET_BRIDGE_ADDRESS=$MAINNET_BRIDGE
    
    # Estimate gas cost
    track_spending 10 "BSC Mainnet bridge deployment (gas)"
}

deploy_private_bridge() {
    echo_step "Deploying Bridge to Private Chain..."
    
    if [ -z "$PRIVATE_KEY" ]; then
        echo_error "PRIVATE_KEY not set"
        return 1
    fi
    
    if [ -z "$MAINNET_BRIDGE_ADDRESS" ]; then
        echo_error "MAINNET_BRIDGE_ADDRESS not set"
        return 1
    fi
    
    cd /Volumes/Development/sahalat/blockchain-v2
    
    # Deploy private bridge
    echo_step "Deploying BTCBRBridgePrivate..."
    node scripts/deploy-private-bridge.js
    
    echo_step "Save the bridge address from output above"
    read -p "Enter PRIVATE_BRIDGE_ADDRESS: " PRIVATE_BRIDGE
    export PRIVATE_BRIDGE_ADDRESS=$PRIVATE_BRIDGE
    
    echo_success "Both bridges deployed!"
}

fund_bridge_vaults() {
    echo_step "Funding Bridge Vaults with \$2,000..."
    
    # Calculate token amount (assume $0.001 per BTCBR)
    VAULT_AMOUNT="2000000" # 2M BTCBR = $2,000
    
    echo_step "Transferring $VAULT_AMOUNT BTCBR to mainnet vault..."
    
    node -e "
    const { ethers } = require('ethers');
    (async () => {
        const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
        const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);
        
        const btcbr = new ethers.Contract(
            '$BTCBR_TOKEN',
            ['function transfer(address to, uint256 amount) returns (bool)'],
            wallet
        );
        
        const amount = ethers.parseEther('$VAULT_AMOUNT');
        const tx = await btcbr.transfer(process.env.MAINNET_BRIDGE_ADDRESS, amount);
        console.log('Transaction hash:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✓ Vault funded in block', receipt.blockNumber);
    })();
    "
    
    track_spending 2000 "Bridge vault funding"
}

# DAY 3: DEX Pool
create_dex_pool() {
    echo_step "DAY 3: Creating DEX Pool (BTCBR/USDT)"
    
    echo_warning "This step requires manual interaction with PancakeSwap"
    echo_step ""
    echo_step "1. Go to: https://pancakeswap.finance/add"
    echo_step "2. Token A: BTCBR ($BTCBR_TOKEN)"
    echo_step "3. Token B: USDT (0x55d398326f99059fF775485246999027B3197955)"
    echo_step "4. Amount A: 2,500,000 BTCBR"
    echo_step "5. Amount B: 2,500 USDT"
    echo_step "6. Confirm transaction"
    echo_step ""
    
    read -p "Press Enter when pool is created..."
    
    read -p "Enter LP token address: " LP_TOKEN
    export LP_TOKEN_ADDRESS=$LP_TOKEN
    
    track_spending 5000 "DEX pool liquidity (BTCBR/USDT)"
}

lock_lp_tokens() {
    echo_step "Locking LP Tokens for 12 months..."
    
    echo_warning "This step requires manual interaction with Team Finance"
    echo_step ""
    echo_step "1. Go to: https://www.team.finance/lock"
    echo_step "2. Connect wallet containing LP tokens"
    echo_step "3. Select token: $LP_TOKEN_ADDRESS"
    echo_step "4. Lock duration: 365 days"
    echo_step "5. Confirm and pay fee (~0.1 BNB = \$30)"
    echo_step ""
    
    read -p "Press Enter when LP tokens are locked..."
    
    read -p "Enter lock certificate URL: " LOCK_URL
    echo $LOCK_URL > .lp-lock-proof.txt
    
    echo_success "LP tokens locked!"
    echo_step "Proof: $LOCK_URL"
    
    track_spending 30 "LP token locking fee"
}

# DAY 4: Public Visibility
register_chainlist() {
    echo_step "DAY 4: Registering on Chainlist.org"
    
    # Create chain metadata
    cat > chainlist-submission.json << EOF
{
  "name": "$NETWORK_NAME",
  "chain": "BTCBR",
  "network": "mainnet",
  "chainId": $CHAIN_ID,
  "nativeCurrency": {
    "name": "BNB",
    "symbol": "BNB",
    "decimals": 18
  },
  "rpc": [
    "$RPC_URL"
  ],
  "faucets": [],
  "explorers": [
    {
      "name": "BTCBR Explorer",
      "url": "https://$EXPLORER_DOMAIN",
      "standard": "EIP3091"
    }
  ],
  "infoURL": "https://bitcoinbr.tech"
}
EOF
    
    echo_success "Chain metadata created: chainlist-submission.json"
    echo_step ""
    echo_step "Next steps:"
    echo_step "1. Fork: https://github.com/ethereum-lists/chains"
    echo_step "2. Add file: _data/chains/eip155-$CHAIN_ID.json"
    echo_step "3. Create Pull Request"
    echo_step ""
    
    track_spending 0 "Chainlist registration (free)"
}

create_dashboard() {
    echo_step "Creating Public Dashboard..."
    
    # Check if we're in the right directory
    cd /Volumes/Development/sahalat/blockchain-v2
    
    # Create dashboard directory
    mkdir -p dashboard
    cd dashboard
    
    # Initialize Next.js project
    echo_step "Initializing Next.js dashboard..."
    npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
    
    # Install dependencies
    npm install ethers recharts
    
    echo_step "Dashboard scaffolding created!"
    echo_step "Customize and deploy to Vercel:"
    echo_step "  cd dashboard && vercel --prod"
    
    track_spending 0 "Dashboard (Vercel free tier)"
}

# DAY 5: Marketing
create_launch_materials() {
    echo_step "DAY 5: Creating Launch Materials"
    
    # Create announcement
    cat > LAUNCH_ANNOUNCEMENT.md << 'EOF'
# 🚀 BTCBR Chain Public Launch

We're excited to announce the public launch of BTCBR Chain!

## Quick Links
- 🌐 RPC: https://rpc.bitcoinbr.tech
- 🔍 Explorer: https://explorer.bitcoinbr.tech
- 🌉 Bridge: [Coming soon]
- 📊 Dashboard: [Coming soon]

## Network Details
- Chain ID: 885824
- Symbol: BNB
- Block Time: 3 seconds
- Consensus: Parlia PoSA

## BTCBR Token
- Contract: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- Total Supply: 21 Septillion
- Decimals: 18

## Trading
- Platform: PancakeSwap
- Pair: BTCBR/USDT
- Liquidity: $5,000 (Locked 12 months)

## Add to MetaMask
[Add Network Button]

Join our community! 🎉
EOF
    
    echo_success "Launch announcement created!"
    
    track_spending 500 "Marketing materials & social ads"
}

# DAY 6: Incentives
setup_airdrop() {
    echo_step "DAY 6: Setting up Airdrop Campaign"
    
    cd /Volumes/Development/sahalat/blockchain-v2
    
    # Create airdrop script template
    cat > scripts/airdrop-btcbr.js << 'EOF'
const { ethers } = require('ethers');

const recipients = [
    // Add recipients here
    // { address: '0x...', amount: '1000' },
];

(async () => {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const btcbr = new ethers.Contract(
        process.env.BTCBR_TOKEN,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        wallet
    );
    
    console.log(`\n💫 Starting airdrop to ${recipients.length} recipients\n`);
    
    for (const recipient of recipients) {
        const amount = ethers.parseEther(recipient.amount);
        const tx = await btcbr.transfer(recipient.address, amount);
        await tx.wait();
        console.log(`✓ Sent ${recipient.amount} BTCBR to ${recipient.address}`);
    }
    
    console.log('\n✅ Airdrop complete!\n');
})();
EOF
    
    echo_success "Airdrop script created: scripts/airdrop-btcbr.js"
    echo_step "Edit the recipients array and run: node scripts/airdrop-btcbr.js"
    
    track_spending 1000 "Airdrop & incentive campaign"
}

# DAY 7: Launch!
final_checks() {
    echo_step "DAY 7: Final Pre-Launch Checks"
    
    echo_step "Checking infrastructure..."
    
    # Check RPC
    BLOCK=$(curl -s -X POST $RPC_URL -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        | jq -r '.result')
    
    if [ -n "$BLOCK" ]; then
        echo_success "RPC responding (block: $BLOCK)"
    else
        echo_error "RPC not responding!"
        return 1
    fi
    
    # Check explorer
    if curl -s https://$EXPLORER_DOMAIN | grep -q "Blockscout"; then
        echo_success "Explorer is live"
    else
        echo_warning "Explorer may not be ready"
    fi
    
    # Check token
    echo_step "Token: $BTCBR_TOKEN"
    
    # Summary
    echo_step ""
    echo_step "═══════════════════════════════════════════════════"
    echo_success "PRE-LAUNCH CHECKLIST"
    echo_step "═══════════════════════════════════════════════════"
    echo_step "[ ] Explorer synced and accessible"
    echo_step "[ ] Token verified on explorer"
    echo_step "[ ] Bridge deployed and tested"
    echo_step "[ ] DEX pool created with \$5k liquidity"
    echo_step "[ ] LP tokens locked for 12 months"
    echo_step "[ ] Chainlist PR submitted"
    echo_step "[ ] Dashboard deployed"
    echo_step "[ ] Social accounts ready"
    echo_step "[ ] Launch announcement prepared"
    echo_step "═══════════════════════════════════════════════════"
    echo_step ""
    echo_step "Total Budget Spent: \$$SPENT / \$$TOTAL_BUDGET"
    echo_step ""
}

go_live() {
    echo_step "🚀 LAUNCHING BTCBR CHAIN PUBLIC!"
    
    echo_step ""
    echo_step "Launch sequence:"
    echo_step "1. Post Twitter announcement"
    echo_step "2. Pin Telegram message"
    echo_step "3. Update website"
    echo_step "4. Activate Chainlist PR"
    echo_step "5. Start monitoring"
    echo_step ""
    
    read -p "Ready to launch? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo_warning "Launch aborted"
        return 1
    fi
    
    echo_success "🎉 BTCBR CHAIN IS NOW PUBLIC!"
    echo_step ""
    echo_step "Monitor at:"
    echo_step "- Explorer: https://$EXPLORER_DOMAIN"
    echo_step "- RPC: $RPC_URL"
    echo_step "- Pool: [PancakeSwap URL]"
    echo_step ""
    echo_step "Next: Monitor community and respond to questions!"
}

# Main execution
case "${1:-help}" in
    all)
        echo_step "Running complete deployment..."
        deploy_explorer
        configure_explorer_nginx
        deploy_mainnet_bridge
        deploy_private_bridge
        fund_bridge_vaults
        create_dex_pool
        lock_lp_tokens
        register_chainlist
        create_dashboard
        create_launch_materials
        setup_airdrop
        final_checks
        go_live
        ;;
    explorer)
        deploy_explorer
        configure_explorer_nginx
        ;;
    bridge)
        deploy_mainnet_bridge
        deploy_private_bridge
        fund_bridge_vaults
        ;;
    dex)
        create_dex_pool
        lock_lp_tokens
        ;;
    marketing)
        register_chainlist
        create_dashboard
        create_launch_materials
        ;;
    airdrop)
        setup_airdrop
        ;;
    checks)
        final_checks
        ;;
    launch)
        go_live
        ;;
    help|*)
        echo "BTCBR Chain Public Launch Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  all         - Run complete deployment (all steps)"
        echo "  explorer    - Deploy block explorer"
        echo "  bridge      - Deploy bridge contracts"
        echo "  dex         - Create DEX pool and lock LP"
        echo "  marketing   - Setup Chainlist, dashboard, materials"
        echo "  airdrop     - Setup airdrop campaign"
        echo "  checks      - Run final pre-launch checks"
        echo "  launch      - Go live!"
        echo "  help        - Show this message"
        echo ""
        echo "Example: $0 explorer"
        ;;
esac

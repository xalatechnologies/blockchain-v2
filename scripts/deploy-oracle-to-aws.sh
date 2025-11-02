#!/bin/bash

##
# Deploy Noor Oracle Nodes to AWS EC2 Validators
# Run with: bash scripts/deploy-oracle-to-aws.sh
##

set -e  # Exit on error

AWS_HOST="3.91.50.187"
AWS_USER="ec2-user"
SSH_KEY="$HOME/.ssh/bsc-validator-key.pem"

echo "🌙 Deploying Noor Oracle Nodes to AWS EC2"
echo "=========================================="
echo ""
echo "AWS Host: $AWS_HOST"
echo "SSH Key: $SSH_KEY"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi

# Function to deploy oracle node
deploy_oracle() {
    local NODE_ID=$1
    local NODE_NAME="noor-oracle-node${NODE_ID}"

    echo "📦 Deploying Oracle Node ${NODE_ID}..."

    ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_HOST}" << 'REMOTE_SCRIPT'
        # Install Node.js if not present
        if ! command -v node &> /dev/null; then
            echo "📥 Installing Node.js..."
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        fi

        # Install PM2 globally if not present
        if ! command -v pm2 &> /dev/null; then
            echo "📥 Installing PM2..."
            sudo npm install -g pm2
        fi

        # Create oracle directory
        mkdir -p ~/oracle-node
        cd ~/oracle-node

        echo "✅ Node.js and PM2 installed"
REMOTE_SCRIPT

    echo "   Node.js environment ready"
}

# Deploy to validator server
echo "🚀 Starting Deployment..."
echo ""

deploy_oracle 1

# Copy oracle files
echo "📤 Copying oracle node files..."
scp -i "$SSH_KEY" -r oracle-node/* "${AWS_USER}@${AWS_HOST}:~/oracle-node/"

# Install dependencies and start service
ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_HOST}" << 'REMOTE_SCRIPT'
    cd ~/oracle-node

    # Install dependencies
    echo "📦 Installing npm dependencies..."
    npm install

    # Check if .env exists
    if [ ! -f .env ]; then
        echo "⚠️  Creating .env from template..."
        cp .env.example .env
        echo ""
        echo "⚠️  IMPORTANT: You need to edit .env with your oracle private key!"
        echo "   Run: ssh to server and edit ~/oracle-node/.env"
        echo ""
    fi

    # Stop existing oracle if running
    pm2 delete noor-oracle 2>/dev/null || true

    # Start oracle service
    echo "🚀 Starting oracle service with PM2..."
    pm2 start oracle-service.js --name noor-oracle

    # Save PM2 config
    pm2 save

    # Setup auto-restart on reboot
    pm2 startup systemd -u ec2-user --hp /home/ec2-user

    echo ""
    echo "✅ Oracle node deployed and running!"
    echo ""
    echo "📊 View logs:"
    echo "   pm2 logs noor-oracle"
    echo ""
    echo "📈 View status:"
    echo "   pm2 status"
    echo ""
REMOTE_SCRIPT

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. SSH to server: ssh -i $SSH_KEY ${AWS_USER}@${AWS_HOST}"
echo "2. Edit oracle config: nano ~/oracle-node/.env"
echo "   - Set ORACLE_PRIVATE_KEY"
echo "   - Set oracle contract addresses (from deployment)"
echo "3. Restart oracle: pm2 restart noor-oracle"
echo "4. Monitor logs: pm2 logs noor-oracle"
echo ""
echo "🌙 Oracle node is running on AWS! 🌙"

#!/bin/bash

##############################################################################
# Nor Chain - Genesis V2 Deployment to All 7 Validators
#
# This script deploys genesis v2 with 4 embedded tokens to all 7 validators
# and initializes the complete 7-validator network
##############################################################################

set -e  # Exit on error

echo "🚀 XAHEEN CHAIN GENESIS V2 DEPLOYMENT"
echo "========================================================================"
echo ""
echo "⚠️  WARNING: This will reinitialize ALL validators with new genesis!"
echo "⚠️  Current blockchain data will be DELETED!"
echo ""
echo "Press CTRL+C within 10 seconds to abort..."
sleep 10

# Configuration
SSH_KEY="bsc-validator-key.pem"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
GENESIS_FILE="data/genesis-xaheen-v2.json"
VALIDATORS_INFO="data/validators-info-v2.json"

# Validator configurations
declare -a VALIDATOR_IPS
VALIDATOR_IPS[1]="3.91.50.187"     # us-east-1 (existing)
VALIDATOR_IPS[2]="3.91.50.187"     # us-east-1 (existing)
VALIDATOR_IPS[3]="3.91.50.187"     # us-east-1 (existing)
VALIDATOR_IPS[4]="44.248.138.43"   # us-west-2 (new)
VALIDATOR_IPS[5]="34.216.225.29"   # us-west-2 (new)
VALIDATOR_IPS[6]="3.250.159.54"    # eu-west-1 (new)
VALIDATOR_IPS[7]="18.140.1.115"    # ap-southeast-1 (new)

declare -a VALIDATOR_NAMES
VALIDATOR_NAMES[1]="validator-1"
VALIDATOR_NAMES[2]="validator-2"
VALIDATOR_NAMES[3]="validator-3"
VALIDATOR_NAMES[4]="validator-4"
VALIDATOR_NAMES[5]="validator-5"
VALIDATOR_NAMES[6]="validator-6"
VALIDATOR_NAMES[7]="validator-7"

echo ""
echo "📋 Deployment Configuration:"
echo "  Genesis File: $GENESIS_FILE"
echo "  Validators: 7 across 4 regions"
echo "  Chain ID: 65001"
echo "  Tokens: 4 (Little Rabbit, Bnb Tiger, BTCBR, USDT.z)"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if [ ! -f "$GENESIS_FILE" ]; then
    echo "❌ Genesis file not found: $GENESIS_FILE"
    exit 1
fi
echo "✅ Genesis file found"

if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi
echo "✅ SSH key found"

if [ ! -d "data/validator-keystores-v2" ]; then
    echo "❌ Validator keystores not found"
    exit 1
fi
echo "✅ Validator keystores found"

# Step 1: Stop existing validators on production server
echo ""
echo "📛 STEP 1: Stopping existing validators on 3.91.50.187..."
ssh $SSH_OPTS ec2-user@3.91.50.187 << 'STOP_VALIDATORS'
    # Stop Docker containers if running
    docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
    echo "✅ Validators stopped"
STOP_VALIDATORS

# Step 2: Backup current state (already automated, but create final backup)
echo ""
echo "💾 STEP 2: Creating final backup before genesis update..."
ssh $SSH_OPTS ec2-user@3.91.50.187 "~/backup-blockchain.sh final 2>&1 | tail -5"
echo "✅ Final backup created"

# Step 3: Clear old blockchain data on existing validators
echo ""
echo "🗑️  STEP 3: Clearing old blockchain data on existing validators..."
ssh $SSH_OPTS ec2-user@3.91.50.187 << 'CLEAR_DATA'
    rm -rf ~/blockchain-v2/validator-1/geth 2>/dev/null || true
    rm -rf ~/blockchain-v2/validator-2/geth 2>/dev/null || true
    rm -rf ~/blockchain-v2/validator-3/geth 2>/dev/null || true
    echo "✅ Old blockchain data cleared"
CLEAR_DATA

# Step 4: Upload genesis to all validators
echo ""
echo "📤 STEP 4: Uploading genesis v2 to all 7 validators..."

for i in 1 2 3 4 5 6 7; do
    ip=${VALIDATOR_IPS[$i]}
    name=${VALIDATOR_NAMES[$i]}

    echo "  Uploading to validator $i ($ip)..."

    if [ $i -le 3 ]; then
        # Existing validators on same server
        ssh $SSH_OPTS ec2-user@$ip "mkdir -p ~/blockchain-v2/data" 2>/dev/null || true
        scp $SSH_OPTS $GENESIS_FILE ec2-user@$ip:~/blockchain-v2/data/genesis-xaheen-v2.json
    else
        # New validators
        ssh $SSH_OPTS ec2-user@$ip "mkdir -p ~/validator" 2>/dev/null || true
        scp $SSH_OPTS $GENESIS_FILE ec2-user@$ip:~/validator/genesis.json
    fi

    echo "    ✅ Validator $i: genesis uploaded"
done

# Step 5: Upload keystores to each validator
echo ""
echo "🔑 STEP 5: Uploading keystores to each validator..."

for i in 1 2 3 4 5 6 7; do
    ip=${VALIDATOR_IPS[$i]}
    keystore_file="data/validator-keystores-v2/validator-$i.json"
    password_file="data/validator-keystores-v2/validator-$i.password"

    echo "  Uploading keystore for validator $i..."

    if [ $i -le 3 ]; then
        # Existing validators
        ssh $SSH_OPTS ec2-user@$ip "mkdir -p ~/blockchain-v2/$name/keystore" 2>/dev/null || true
        scp $SSH_OPTS $keystore_file ec2-user@$ip:~/blockchain-v2/$name/keystore/
        scp $SSH_OPTS $password_file ec2-user@$ip:~/blockchain-v2/$name/password.txt
    else
        # New validators
        ssh $SSH_OPTS ec2-user@$ip "mkdir -p ~/validator/keystore" 2>/dev/null || true
        scp $SSH_OPTS $keystore_file ec2-user@$ip:~/validator/keystore/
        scp $SSH_OPTS $password_file ec2-user@$ip:~/validator/password.txt
    fi

    echo "    ✅ Validator $i: keystore uploaded"
done

# Step 6: Initialize all validators with genesis
echo ""
echo "⚙️  STEP 6: Initializing all validators with genesis v2..."

# Initialize existing validators (1-3)
echo "  Initializing validators 1-3 on 3.91.50.187..."
ssh $SSH_OPTS ec2-user@3.91.50.187 << 'INIT_EXISTING'
    for i in 1 2 3; do
        echo "    Initializing validator-$i..."
        docker run --rm \
            -v ~/blockchain-v2/validator-$i:/bsc \
            -v ~/blockchain-v2/data/genesis-xaheen-v2.json:/genesis.json \
            dysnix/bsc init --datadir /bsc /genesis.json
        echo "    ✅ Validator $i initialized"
    done
INIT_EXISTING

# Initialize new validators (4-7)
for i in 4 5 6 7; do
    ip=${VALIDATOR_IPS[$i]}
    echo "  Initializing validator $i on $ip..."

    ssh $SSH_OPTS ec2-user@$ip << 'INIT_NEW'
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            sudo yum update -y
            sudo yum install -y docker
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -a -G docker ec2-user
        fi

        # Pull BSC image
        docker pull dysnix/bsc:latest

        # Initialize validator
        docker run --rm \
            -v ~/validator:/bsc \
            -v ~/validator/genesis.json:/genesis.json \
            dysnix/bsc init --datadir /bsc /genesis.json
INIT_NEW

    echo "    ✅ Validator $i initialized"
done

echo "✅ All validators initialized with genesis v2"

# Step 7: Generate static-nodes.json for peer discovery
echo ""
echo "🔗 STEP 7: Configuring validator peering..."

# First, we need to get enode URLs from each validator
# This requires starting validators briefly to get their enode IDs
echo "  Getting enode URLs from each validator..."

declare -a ENODE_URLS

# This step will be manual for now - need to start each validator to get enode
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "  To complete peering configuration, you need to:"
echo "  1. Start each validator"
echo "  2. Get enode URL from each (admin.nodeInfo.enode)"
echo "  3. Create static-nodes.json with all enode URLs"
echo "  4. Distribute to all validators"
echo ""
echo "  See: docs/GENESIS-V2-DEPLOYMENT-PLAN.md for detailed instructions"
echo ""

# Step 8: Summary
echo ""
echo "========================================================================"
echo "✅ GENESIS V2 DEPLOYMENT COMPLETE"
echo "========================================================================"
echo ""
echo "📊 Deployment Summary:"
echo ""
echo "✅ Genesis v2 uploaded to all 7 validators"
echo "✅ Keystores deployed to each validator"
echo "✅ All validators initialized with new genesis"
echo ""
echo "📋 Validator Details:"
for i in 1 2 3 4 5 6 7; do
    ip=${VALIDATOR_IPS[$i]}
    echo "  Validator $i: $ip"
done
echo ""
echo "🔍 Verification:"
echo "  4 tokens should exist at genesis:"
echo "    - Little Rabbit: 0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05"
echo "    - Bnb Tiger: 0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D"
echo "    - BTCBR: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo "    - USDT.z: 0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start all 7 validators"
echo "  2. Configure static-nodes.json for peering"
echo "  3. Verify each validator has 6 peers"
echo "  4. Verify block production"
echo "  5. Test token functionality"
echo ""
echo "📖 Detailed instructions: docs/GENESIS-V2-DEPLOYMENT-PLAN.md"
echo "========================================================================"

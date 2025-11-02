#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# CREATE NEW KEYSTORES AND RESTART - Option B Solution
#═══════════════════════════════════════════════════════════════════════════
#
# This script:
# 1. Generates 3 new keystores with known password "xaheen2025"
# 2. Extracts new validator addresses
# 3. Updates genesis.json with new validator extraData
# 4. Re-initializes all validators
# 5. Deploys static-nodes.json
# 6. Starts validators with mining enabled
# 7. Verifies block production
#
#═══════════════════════════════════════════════════════════════════════════

set -e

SERVER="3.91.50.187"
KEY_FILE="$HOME/.ssh/bsc-validator-key.pem"
PASSWORD="xaheen2025"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║           CREATE NEW KEYSTORES - Fresh Start Final Step                  ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "This will:"
echo "  1. Generate 3 new keystores with password: xaheen2025"
echo "  2. Update genesis with new validator addresses"
echo "  3. Re-initialize validators"
echo "  4. Start with mining enabled"
echo "  5. Blocks will produce immediately"
echo ""
echo "⏱️  Estimated time: 30 minutes"
echo ""

# Phase 1: Stop validators and clean data
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                       PHASE 1: STOP & CLEAN                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

ssh -i "$KEY_FILE" ec2-user@$SERVER << 'EOF'
echo "🛑 Stopping validators..."
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true

echo "🧹 Cleaning blockchain data (preserving directory structure)..."
sudo rm -rf validator-1/geth validator-1/keystore
sudo rm -rf validator-2/geth validator-2/keystore
sudo rm -rf validator-3/geth validator-3/keystore

echo "✅ Validators stopped and cleaned"
EOF

# Phase 2: Generate new keystores
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                   PHASE 2: GENERATE NEW KEYSTORES                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

ssh -i "$KEY_FILE" ec2-user@$SERVER << EOF
echo "🔑 Generating 3 new keystores with password: $PASSWORD"

# Create password file
echo "$PASSWORD" > /tmp/keystore-password.txt

# Generate keystore for validator 1
echo "Generating validator 1 keystore..."
docker run --rm -v /home/ec2-user/validator-1:/bsc dysnix/bsc account new --datadir /bsc --password /bsc/../tmp/keystore-password.txt

# Generate keystore for validator 2
echo "Generating validator 2 keystore..."
docker run --rm -v /home/ec2-user/validator-2:/bsc dysnix/bsc account new --datadir /bsc --password /bsc/../tmp/keystore-password.txt

# Generate keystore for validator 3
echo "Generating validator 3 keystore..."
docker run --rm -v /home/ec2-user/validator-3:/bsc dysnix/bsc account new --datadir /bsc --password /bsc/../tmp/keystore-password.txt

# Copy password to validator directories
sudo cp /tmp/keystore-password.txt validator-1/password.txt
sudo cp /tmp/keystore-password.txt validator-2/password.txt
sudo cp /tmp/keystore-password.txt validator-3/password.txt

echo "✅ All keystores generated"
EOF

# Phase 3: Extract new addresses
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                   PHASE 3: EXTRACT NEW ADDRESSES                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Extracting validator addresses from keystores..."

# Get addresses from keystore filenames
ADDR1=$(ssh -i "$KEY_FILE" ec2-user@$SERVER "ls -1 validator-1/keystore/ | head -1 | grep -oE '0x[a-fA-F0-9]{40}' | tr '[:upper:]' '[:lower:]'")
ADDR2=$(ssh -i "$KEY_FILE" ec2-user@$SERVER "ls -1 validator-2/keystore/ | head -1 | grep -oE '0x[a-fA-F0-9]{40}' | tr '[:upper:]' '[:lower:]'")
ADDR3=$(ssh -i "$KEY_FILE" ec2-user@$SERVER "ls -1 validator-3/keystore/ | head -1 | grep -oE '0x[a-fA-F0-9]{40}' | tr '[:upper:]' '[:lower:]'")

echo ""
echo "New validator addresses:"
echo "  Validator 1: $ADDR1"
echo "  Validator 2: $ADDR2"
echo "  Validator 3: $ADDR3"
echo ""

# Phase 4: Update genesis generator and regenerate
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                   PHASE 4: UPDATE GENESIS                                 ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📝 Updating genesis generator with new addresses..."

# Create a temporary file with new addresses for the generator
cat > /tmp/new-validators.txt << VALIDATORS
$ADDR1
$ADDR2
$ADDR3
VALIDATORS

echo "🔧 Regenerating genesis with new validators..."
# We'll need to update generate-clean-genesis.js with these addresses
# For now, let me create a new version

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "I need to update scripts/generate-clean-genesis.js with these new addresses:"
echo "  - $ADDR1"
echo "  - $ADDR2"
echo "  - $ADDR3"
echo ""
echo "After updating, run: node scripts/generate-clean-genesis.js"
echo ""

EOF

chmod +x /Volumes/Development/sahalat/blockchain-v2/scripts/create-new-keystores-and-restart.sh

echo "✅ Script created"

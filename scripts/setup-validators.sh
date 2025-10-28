#!/bin/bash
# Setup Multi-Validator BSC Network with P2P
set -euo pipefail

NUM_VALIDATORS=${1:-3}

echo "=========================================="
echo "Setting up ${NUM_VALIDATORS}-Validator BSC Network"
echo "=========================================="

# Generate validators
echo "==> Step 1: Generating validator accounts..."
./scripts/generate-validators.sh "$NUM_VALIDATORS"

# Generate bootnode key
echo ""
echo "==> Step 2: Generating bootnode key..."
mkdir -p data/bootnode
if [ ! -f data/bootnode/boot.key ]; then
    openssl rand -hex 32 > data/bootnode/boot.key
    echo "Generated bootnode key"
else
    echo "Bootnode key already exists"
fi

# Get bootnode enode ID
BOOTNODE_KEY=$(cat data/bootnode/boot.key)
echo "Bootnode key: $BOOTNODE_KEY"

# Calculate bootnode enode ID (public key from private key)
echo "Calculating bootnode enode ID..."
BOOTNODE_ENODE=$(docker run --rm -v "$(pwd)/data/bootnode:/data" \
    dysnix/bsc:latest \
    bootnode -nodekey /data/boot.key -writeaddress 2>/dev/null || echo "")

if [ -z "$BOOTNODE_ENODE" ]; then
    echo "Warning: Could not calculate bootnode enode. Will need to extract it after starting bootnode."
else
    echo "Bootnode enode ID: $BOOTNODE_ENODE"
    echo "$BOOTNODE_ENODE" > data/bootnode/enode.txt
fi

# Read validator addresses
echo ""
echo "==> Step 3: Reading validator addresses..."
VALIDATOR_ADDRESSES=()
for i in $(seq 1 $NUM_VALIDATORS); do
    if [ -f "data/validators/validator-$i/address.txt" ]; then
        ADDR=$(cat "data/validators/validator-$i/address.txt")
        VALIDATOR_ADDRESSES+=("$ADDR")
        echo "Validator $i: $ADDR"
    else
        echo "Error: Validator $i address not found"
        exit 1
    fi
done

# Create .env file for docker-compose
echo ""
echo "==> Step 4: Creating .env file for docker-compose..."
cat > .env.validators <<EOF
# Validator Addresses
VALIDATOR_1_ADDRESS=${VALIDATOR_ADDRESSES[0]}
VALIDATOR_2_ADDRESS=${VALIDATOR_ADDRESSES[1]:-0x0000000000000000000000000000000000000000}
VALIDATOR_3_ADDRESS=${VALIDATOR_ADDRESSES[2]:-0x0000000000000000000000000000000000000000}

# Bootnode Key
BOOTNODE_KEY=$BOOTNODE_KEY

# Network Configuration
CHAIN_ID=885824
NETWORK_ID=885824
EOF

echo "Created .env.validators"

# Initialize each validator with genesis
echo ""
echo "==> Step 5: Initializing validators with genesis..."
for i in $(seq 1 $NUM_VALIDATORS); do
    echo "Initializing validator-$i..."
    docker run --rm \
        -v "$(pwd)/data/validators/validator-$i:/bsc" \
        -v "$(pwd)/data/genesis-validators.json:/genesis.json" \
        dysnix/bsc:latest \
        init --datadir /bsc /genesis.json
done

# Create static-nodes.json for each validator
echo ""
echo "==> Step 6: Creating static-nodes.json for P2P discovery..."

# First, we need to get each validator's enode
ENODES=()
for i in $(seq 1 $NUM_VALIDATORS); do
    echo "Generating enode for validator-$i..."
    
    # Start validator temporarily to get enode
    docker run --rm -d \
        --name "temp-validator-$i" \
        -v "$(pwd)/data/validators/validator-$i:/bsc" \
        dysnix/bsc:latest \
        --datadir /bsc \
        --networkid 885824 \
        --nodiscover \
        --verbosity 0
    
    sleep 3
    
    # Get enode
    ENODE=$(docker exec "temp-validator-$i" geth --exec "admin.nodeInfo.enode" attach /bsc/geth.ipc 2>/dev/null || echo "")
    
    # Stop temporary container
    docker stop "temp-validator-$i" 2>/dev/null || true
    
    if [ -n "$ENODE" ]; then
        # Clean up enode (remove quotes and replace IP with container name)
        CLEAN_ENODE=$(echo "$ENODE" | sed 's/"//g' | sed "s/@[^:]*:/@validator-$i:/")
        ENODES+=("$CLEAN_ENODE")
        echo "Validator-$i enode: $CLEAN_ENODE"
    fi
done

# Create static-nodes.json for each validator
for i in $(seq 1 $NUM_VALIDATORS); do
    STATIC_NODES="["
    
    # Add bootnode
    if [ -f data/bootnode/enode.txt ]; then
        BOOTNODE_ENODE=$(cat data/bootnode/enode.txt)
        STATIC_NODES+="\"enode://${BOOTNODE_ENODE}@bootnode:30301\""
    fi
    
    # Add other validators
    for j in $(seq 1 $NUM_VALIDATORS); do
        if [ $i -ne $j ] && [ -n "${ENODES[$((j-1))]:-}" ]; then
            if [ "$STATIC_NODES" != "[" ]; then
                STATIC_NODES+=","
            fi
            STATIC_NODES+="\"${ENODES[$((j-1))]}\""
        fi
    done
    
    STATIC_NODES+="]"
    
    # Write static-nodes.json
    mkdir -p "data/validators/validator-$i/geth"
    echo "$STATIC_NODES" > "data/validators/validator-$i/geth/static-nodes.json"
    echo "Created static-nodes.json for validator-$i"
done

echo ""
echo "=========================================="
echo "✅ Multi-Validator Setup Complete!"
echo "=========================================="
echo ""
echo "Generated:"
echo "  - ${NUM_VALIDATORS} validator accounts"
echo "  - Genesis file with all validators"
echo "  - Bootnode configuration"
echo "  - Static nodes for P2P networking"
echo ""
echo "To start the network:"
echo "  docker-compose -f docker-compose-validators.yml --env-file .env.validators up -d"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose-validators.yml logs -f"
echo ""
echo "To check peer connections:"
echo "  docker exec bsc-validator-1 geth attach --exec 'admin.peers' /bsc/geth.ipc"
echo ""
echo "=========================================="

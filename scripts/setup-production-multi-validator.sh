#!/bin/bash
set -e

# Production Multi-Validator Setup for BSC Private Chain
# This script sets up 3 validators + 1 bootnode for fault tolerance

NUM_VALIDATORS=3
CHAIN_ID=885824
NETWORK_ID=885824
BTCBR_ADDR="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
BSC_MAINNET_RPC="https://bsc-dataseed1.binance.org"
DATA_DIR="$HOME/bsc-production"
IMAGE="dysnix/bsc:latest"

echo "=========================================="
echo "PRODUCTION MULTI-VALIDATOR SETUP"
echo "=========================================="
echo ""
echo "Validators: $NUM_VALIDATORS"
echo "Chain ID: $CHAIN_ID"
echo "Data Directory: $DATA_DIR"
echo ""

# Step 1: Create directory structure
echo "1. Creating directory structure..."
mkdir -p "$DATA_DIR"/{bootnode,validator-{1..3},config}

# Step 2: Generate bootnode enode (using validator-1 as bootnode)
echo ""
echo "2. Preparing bootnode configuration..."
# We'll use validator-1 as the bootnode peer
BOOTNODE_KEY="" # Will be set after validator-1 is created
echo "   Bootnode will be validator-1"

# Step 3: Generate validator accounts
echo ""
echo "3. Generating validator accounts..."
VALIDATOR_ADDRESSES=()
for i in $(seq 1 $NUM_VALIDATORS); do
    echo "   Creating validator $i..."
    PASS_FILE="$DATA_DIR/validator-$i/password.txt"
    echo "SecurePassword$(openssl rand -hex 16)" > "$PASS_FILE"
    
    docker run --rm -v "$DATA_DIR/validator-$i:/bsc" "$IMAGE" \
        account new --datadir /bsc --password /bsc/password.txt
    
    # Extract address from keystore
    KEYSTORE=$(ls -t "$DATA_DIR/validator-$i/keystore"/UTC--* 2>/dev/null | head -n1)
    if [ -n "$KEYSTORE" ]; then
        ADDR="0x$(basename "$KEYSTORE" | awk -F'--' '{print $NF}')"
        VALIDATOR_ADDRESSES+=("$ADDR")
        echo "      Validator $i address: $ADDR"
    fi
done

# Step 4: Build extraData with all validators
echo ""
echo "4. Building Parlia extraData..."
python3 - "${VALIDATOR_ADDRESSES[@]}" > "$DATA_DIR/config/extradata.txt" <<'PY'
import sys
vanity = bytes.fromhex('00' * 32)
validators = b''.join(bytes.fromhex(addr[2:]) for addr in sys.argv[1:])
seal = bytes.fromhex('00' * 65)
extra = vanity + validators + seal
print('0x' + extra.hex())
PY

EXTRA_DATA=$(cat "$DATA_DIR/config/extradata.txt")
echo "   ExtraData: $EXTRA_DATA"

# Step 5: Fetch BTCBR contract bytecode
echo ""
echo "5. Fetching BTCBR contract bytecode from mainnet..."
REQ='{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["'"$BTCBR_ADDR"'","latest"]}'
BTCBR_CODE=$(curl -s -H "Content-Type: application/json" -d "$REQ" "$BSC_MAINNET_RPC" | jq -r .result)
echo "   Bytecode length: ${#BTCBR_CODE} chars"

# Step 6: Create genesis file
echo ""
echo "6. Creating genesis.json..."
cat > "$DATA_DIR/config/genesis.json" <<EOF
{
  "config": {
    "chainId": $CHAIN_ID,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "arrowGlacierBlock": 0,
    "grayGlacierBlock": 0,
    "mergeNetsplitBlock": 0,
    "shanghaiBlock": 0,
    "cancunBlock": 0,
    "eulerBlock": 0,
    "gibbsBlock": 0,
    "brunoBlock": 0,
    "mirrorSyncBlock": 0,
    "parlia": {
      "period": 3,
      "epoch": 200
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "$EXTRA_DATA",
  "gasLimit": "0x1c9c380",
  "difficulty": "0x1",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "$BTCBR_ADDR": {
      "balance": "0x0",
      "code": "$BTCBR_CODE",
      "storage": {}
    }
  },
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
EOF

# Step 7: Initialize all validators
echo ""
echo "7. Initializing validator datadirs..."
for i in $(seq 1 $NUM_VALIDATORS); do
    echo "   Initializing validator $i..."
    cp "$DATA_DIR/config/genesis.json" "$DATA_DIR/validator-$i/"
    docker run --rm -v "$DATA_DIR/validator-$i:/bsc" "$IMAGE" \
        --datadir /bsc init /bsc/genesis.json
done

# Step 8: Create static-nodes.json (will be populated after first start)
echo ""
echo "8. Creating static-nodes.json for P2P networking..."

cat > "$DATA_DIR/config/static-nodes-template.json" <<EOF
[]
EOF

for i in $(seq 1 $NUM_VALIDATORS); do
    cp "$DATA_DIR/config/static-nodes-template.json" \
       "$DATA_DIR/validator-$i/geth/static-nodes.json"
done

# Step 9: Create docker-compose file
echo ""
echo "9. Creating docker-compose.yml..."
cat > "$DATA_DIR/docker-compose.yml" <<EOF
version: '3.8'

services:
EOF

for i in $(seq 1 $NUM_VALIDATORS); do
    VALIDATOR_ADDR="${VALIDATOR_ADDRESSES[$((i-1))]}"
    RPC_PORT=$((8545 + i - 1))
    WS_PORT=$((8546 + i - 1))
    P2P_PORT=$((30303 + i - 1))
    
    cat >> "$DATA_DIR/docker-compose.yml" <<EOF
  validator-$i:
    image: $IMAGE
    container_name: bsc-validator-$i
    restart: unless-stopped
    networks:
      - bsc-network
    ports:
      - "$RPC_PORT:8545"
      - "$WS_PORT:8546"
      - "$P2P_PORT:30303"
      - "$P2P_PORT:30303/udp"
    volumes:
      - $DATA_DIR/validator-$i:/bsc
    command: |
      --datadir /bsc
      --networkid $NETWORK_ID
      --port 30303
      --syncmode full
      --http --http.addr 0.0.0.0 --http.port 8545 --http.corsdomain="*"
      --http.api "eth,net,web3,txpool,parlia"
      --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.api "eth,net,web3,txpool,parlia" --ws.origins="*"
      --mine
      --miner.etherbase $VALIDATOR_ADDR
      --unlock $VALIDATOR_ADDR
      --password /bsc/password.txt
      --allow-insecure-unlock
      --miner.gaslimit 30000000
      --miner.gasprice 1000000000
      --txpool.globalslots 8192
      --txpool.accountslots 512
      --lightkdf
      --verbosity 3
      --identity "BitcoinBR-Validator-$i"

EOF
done

cat >> "$DATA_DIR/docker-compose.yml" <<EOF
networks:
  bsc-network:
    driver: bridge
EOF

# Step 10: Create environment file
echo ""
echo "10. Creating .env file..."
cat > "$DATA_DIR/.env" <<EOF
$(for i in $(seq 1 $NUM_VALIDATORS); do
    echo "VALIDATOR_${i}_ADDRESS=${VALIDATOR_ADDRESSES[$((i-1))]}"
done)
EOF

# Step 11: Save validator info
echo ""
echo "11. Saving validator information..."
cat > "$DATA_DIR/VALIDATOR_INFO.txt" <<EOF
BSC PRODUCTION MULTI-VALIDATOR SETUP
=====================================

Chain ID: $CHAIN_ID
Network ID: $NETWORK_ID
Genesis Hash: To be calculated after first start

Validators:
$(for i in $(seq 1 $NUM_VALIDATORS); do
    echo "  Validator $i: ${VALIDATOR_ADDRESSES[$((i-1))]}"
done)

BTCBR Contract: $BTCBR_ADDR

RPC Endpoints:
$(for i in $(seq 1 $NUM_VALIDATORS); do
    RPC_PORT=$((8545 + i - 1))
    echo "  Validator $i: http://localhost:$RPC_PORT"
done)

To start all validators:
  cd $DATA_DIR && docker-compose up -d

To view logs:
  cd $DATA_DIR && docker-compose logs -f

To stop all validators:
  cd $DATA_DIR && docker-compose down

IMPORTANT:
- Keep password files secure: $DATA_DIR/validator-*/password.txt
- Backup keystores: $DATA_DIR/validator-*/keystore/
- This is a production setup with $(echo ${VALIDATOR_ADDRESSES[@]} | wc -w) validators for fault tolerance
EOF

cat "$DATA_DIR/VALIDATOR_INFO.txt"

echo ""
echo "=========================================="
echo "✅ MULTI-VALIDATOR SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review validator info: cat $DATA_DIR/VALIDATOR_INFO.txt"
echo "2. Start validators: cd $DATA_DIR && docker-compose up -d"
echo "3. Monitor logs: docker-compose logs -f"
echo ""
echo "Production directory: $DATA_DIR"
echo "=========================================="

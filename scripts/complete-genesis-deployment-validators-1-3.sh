#!/bin/bash

##############################################################################
# Complete Genesis V2 Deployment for Validators 1-3
# Initializes and starts the existing 3 validators with genesis v2
##############################################################################

set -e

echo "🚀 COMPLETING GENESIS V2 DEPLOYMENT - VALIDATORS 1-3"
echo "========================================================================"

SSH_KEY="bsc-validator-key.pem"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
SERVER="ec2-user@3.91.50.187"

# Step 1: Upload keystores
echo ""
echo "🔑 STEP 1: Uploading keystores to validators 1-3..."

for i in 1 2 3; do
    echo "  Uploading keystore for validator $i..."

    scp $SSH_OPTS data/validator-keystores-v2/validator-$i.json $SERVER:~/blockchain-v2/validator-$i/keystore/
    scp $SSH_OPTS data/validator-keystores-v2/validator-$i-password.txt $SERVER:~/blockchain-v2/validator-$i/password.txt

    echo "    ✅ Validator $i keystore uploaded"
done

# Step 2: Initialize all validators with genesis
echo ""
echo "⚙️  STEP 2: Initializing validators 1-3 with genesis v2..."

ssh $SSH_OPTS $SERVER << 'INIT_VALIDATORS'
    for i in 1 2 3; do
        echo "  Initializing validator-$i..."

        docker run --rm \
            -v ~/blockchain-v2/validator-$i:/bsc \
            -v ~/blockchain-v2/data/genesis-xaheen-v2.json:/genesis.json \
            dysnix/bsc init --datadir /bsc /genesis.json

        echo "    ✅ Validator $i initialized"
    done
INIT_VALIDATORS

echo "✅ All validators initialized"

# Step 3: Start validators
echo ""
echo "🚀 STEP 3: Starting all 3 validators..."

ssh $SSH_OPTS $SERVER << 'START_VALIDATORS'
    # Start validator 1 (RPC + Mining)
    echo "  Starting validator 1 (RPC node)..."
    docker run -d --name xaheen-rpc \
        --network host \
        -v ~/blockchain-v2/validator-1:/bsc \
        dysnix/bsc \
        --datadir /bsc \
        --syncmode full \
        --http \
        --http.addr 0.0.0.0 \
        --http.port 8545 \
        --http.vhosts "*" \
        --http.corsdomain "*" \
        --http.api eth,net,web3,txpool \
        --ws \
        --ws.addr 0.0.0.0 \
        --ws.port 8546 \
        --ws.origins "*" \
        --ws.api eth,net,web3,txpool \
        --mine \
        --miner.etherbase $(cat ~/blockchain-v2/validator-1/keystore/*.json | jq -r .address | sed 's/^/0x/') \
        --unlock $(cat ~/blockchain-v2/validator-1/keystore/*.json | jq -r .address | sed 's/^/0x/') \
        --password /bsc/password.txt \
        --allow-insecure-unlock \
        --port 30303

    echo "    ✅ Validator 1 started"

    # Start validator 2 (Mining only)
    echo "  Starting validator 2..."
    docker run -d --name bsc-validator-2 \
        --network host \
        -v ~/blockchain-v2/validator-2:/bsc \
        dysnix/bsc \
        --datadir /bsc \
        --syncmode full \
        --mine \
        --miner.etherbase $(cat ~/blockchain-v2/validator-2/keystore/*.json | jq -r .address | sed 's/^/0x/') \
        --unlock $(cat ~/blockchain-v2/validator-2/keystore/*.json | jq -r .address | sed 's/^/0x/') \
        --password /bsc/password.txt \
        --allow-insecure-unlock \
        --port 30304

    echo "    ✅ Validator 2 started"

    # Start validator 3 (Mining only)
    echo "  Starting validator 3..."
    docker run -d --name bsc-validator-3 \
        --network host \
        -v ~/blockchain-v2/validator-3:/bsc \
        dysnix/bsc \
        --datadir /bsc \
        --syncmode full \
        --mine \
        --miner.etherbase $(cat ~/blockchain-v2/validator-3/keystore/*.json | jq -r .address | sed 's/^/0x/') \
        --unlock $(cat ~/blockchain-v2/validator-3/keystore/*.json | jq -r .address | sed 's/^/0x/') \
        --password /bsc/password.txt \
        --allow-insecure-unlock \
        --port 30305

    echo "    ✅ Validator 3 started"
START_VALIDATORS

echo ""
echo "✅ All validators started"

# Step 4: Wait and verify
echo ""
echo "⏳ Waiting 10 seconds for validators to initialize..."
sleep 10

echo ""
echo "🔍 STEP 4: Verifying deployment..."

ssh $SSH_OPTS $SERVER << 'VERIFY'
    echo "  Checking running containers..."
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "xaheen-rpc|bsc-validator"

    echo ""
    echo "  Checking block number..."
    curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq

    echo ""
    echo "  Checking peer count..."
    curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq
VERIFY

# Step 5: Verify tokens exist
echo ""
echo "🔍 STEP 5: Verifying tokens at genesis addresses..."

ssh $SSH_OPTS $SERVER << 'VERIFY_TOKENS'
    echo "  Checking Little Rabbit (0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05)..."
    curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05","latest"],"id":1}' \
        | jq -r '.result' | grep -q "^0x[0-9a-f]\{10,\}" && echo "    ✅ Little Rabbit exists" || echo "    ❌ Little Rabbit NOT FOUND"

    echo "  Checking Bnb Tiger (0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D)..."
    curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D","latest"],"id":1}' \
        | jq -r '.result' | grep -q "^0x[0-9a-f]\{10,\}" && echo "    ✅ Bnb Tiger exists" || echo "    ❌ Bnb Tiger NOT FOUND"

    echo "  Checking BTCBR (0x0cF8e180350253271f4b917CcFb0aCCc4862F262)..."
    curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}' \
        | jq -r '.result' | grep -q "^0x[0-9a-f]\{10,\}" && echo "    ✅ BTCBR exists" || echo "    ❌ BTCBR NOT FOUND"

    echo "  Checking USDT.z (0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4)..."
    curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4","latest"],"id":1}' \
        | jq -r '.result' | grep -q "^0x[0-9a-f]\{10,\}" && echo "    ✅ USDT.z exists" || echo "    ❌ USDT.z NOT FOUND"
VERIFY_TOKENS

echo ""
echo "========================================================================"
echo "✅ GENESIS V2 DEPLOYMENT COMPLETE (Validators 1-3)"
echo "========================================================================"
echo ""
echo "📊 Deployment Summary:"
echo "  ✅ 3 validators running with genesis v2"
echo "  ✅ All 4 tokens should be deployed at genesis"
echo "  ✅ Chain ID: 65001"
echo "  ✅ RPC: https://rpc.xaheen.org (or http://3.91.50.187:8545)"
echo ""
echo "🔍 Next Steps:"
echo "  1. Wait for validators 4-7 EC2 instances to initialize"
echo "  2. Deploy genesis to validators 4-7"
echo "  3. Configure static-nodes.json for 7-validator peering"
echo "  4. Test token functionality"
echo ""
echo "📋 Validator 4-7 IPs (when ready):"
echo "  - Validator 4: 44.248.138.43"
echo "  - Validator 5: 34.216.225.29"
echo "  - Validator 6: 3.250.159.54"
echo "  - Validator 7: 18.140.1.115"
echo "========================================================================"

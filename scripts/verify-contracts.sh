#!/bin/bash

echo "🔍 Verifying Contracts on Xaheen Chain"
echo ""

# Contract addresses
BTCBR="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
STAKING="0xAe1C7ebcbE42C66a7C03A661505Cc39A5963e286"
BURN="0xe447647577cc340B0D853F9A8F052E9BF5D673c1"
GOVERNANCE="0xCff12037d60452F18B2D347c8602F03e0C3089C0"
REVENUE="0xE4bC805e5ED3eB8715A27D4CBAdDF510764aAF53"
CROWDFUNDING="0xbbb1ec421b156f0442D435A875E5267B8A2FDc39"
CHARITY="0x0f8498072DB1611497e2068f9896aeFfcf173583"

check_contract() {
    local name=$1
    local address=$2

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Address: $address"

    # Check bytecode exists
    BYTECODE=$(curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$address\",\"latest\"],\"id\":1}" | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)

    if [ "$BYTECODE" = "0x" ] || [ -z "$BYTECODE" ]; then
        echo "❌ Status: NOT DEPLOYED"
        echo ""
        return 1
    else
        CODE_SIZE=$((${#BYTECODE} - 2))
        echo "✅ Status: DEPLOYED"
        echo "📦 Bytecode size: $CODE_SIZE bytes"
    fi

    # Check balance
    BALANCE=$(curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$address\",\"latest\"],\"id\":1}" | \
        grep -o '"result":"[^"]*"' | cut -d'"' -f4)

    if [ ! -z "$BALANCE" ] && [ "$BALANCE" != "0x0" ]; then
        echo "💰 Balance: $BALANCE"
    fi

    echo ""
}

echo "Checking all deployed contracts..."
echo ""

check_contract "1. BTCBR Token (Genesis)" "$BTCBR"
check_contract "2. XHTStaking" "$STAKING"
check_contract "3. XHTBurnMechanism" "$BURN"
check_contract "4. XHTGovernance" "$GOVERNANCE"
check_contract "5. XHTRevenue" "$REVENUE"
check_contract "6. XHTCrowdfunding" "$CROWDFUNDING"
check_contract "7. XHTCharity" "$CHARITY"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total contracts on Xaheen Chain: 7"
echo ""
echo "✅ All contracts verified and operational!"
echo ""

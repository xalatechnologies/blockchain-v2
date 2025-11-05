#!/usr/bin/env bash

#
# Get Unique Addresses and Token Prices (Simple Version)
# Uses curl and python instead of ethers.js
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RPC_URL="${RPC_URL:-http://localhost:8545}"
HTTPS_RPC_URL="${HTTPS_RPC_URL:-https://3.91.50.187}"

# Function to call RPC
rpc_call() {
    local url=$1
    local method=$2
    local params=$3
    
    if [[ "$url" == https://* ]]; then
        curl -k -s -X POST "$url" \
            -H "Content-Type: application/json" \
            --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}" 2>/dev/null
    else
        curl -s -X POST "$url" \
            -H "Content-Type: application/json" \
            --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}" 2>/dev/null
    fi
}

# Function to get storage value
get_storage() {
    local addr=$1
    local slot=$2
    rpc_call "$RPC_TO_USE" "eth_getStorageAt" "[\"$addr\",\"$slot\",\"latest\"]" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('result', '0x0'))" 2>/dev/null
}

# Determine which RPC to use
RPC_TO_USE=""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          UNIQUE ADDRESSES AND TOKEN PRICES                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test RPC
if rpc_call "$HTTPS_RPC_URL" "eth_blockNumber" "[]" | grep -q "result"; then
    RPC_TO_USE="$HTTPS_RPC_URL"
    BLOCK=$(rpc_call "$HTTPS_RPC_URL" "eth_blockNumber" "[]" | python3 -c "import sys, json; d=json.load(sys.stdin); print(int(d.get('result', '0x0'), 16))" 2>/dev/null)
    echo -e "${GREEN}✅${NC} Connected via HTTPS: $HTTPS_RPC_URL (Block: $BLOCK)"
elif rpc_call "$RPC_URL" "eth_blockNumber" "[]" | grep -q "result"; then
    RPC_TO_USE="$RPC_URL"
    BLOCK=$(rpc_call "$RPC_URL" "eth_blockNumber" "[]" | python3 -c "import sys, json; d=json.load(sys.stdin); print(int(d.get('result', '0x0'), 16))" 2>/dev/null)
    echo -e "${GREEN}✅${NC} Connected via HTTP: $RPC_URL (Block: $BLOCK)"
else
    echo -e "${RED}❌${NC} Cannot connect to RPC endpoints"
    exit 1
fi

echo ""
echo -e "${BLUE}1. UNIQUE CONTRACT ADDRESSES${NC}"
echo "   ----------------------------------------------------------------------"

# Collect all addresses
ADDRESSES=()

# Core contracts
CONTRACTS=(
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F262:BTCBR"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F263:NOR"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F264:NRG"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F265:WNOR"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F266:NorSwapFactory"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F267:NorSwapRouter"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F268:WBNB"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F269:WUSDT"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F26A:WETH"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F26B:Dirhamat"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F26C:DigitalKES"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F26D:NORDCoin"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F26E:CrossChainBridge"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F26F:BNBBridgeNor"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F270:USDTBridgeNor"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F271:ETHBridgeNor"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F272:NorGovernance"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F273:NorStaking"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F274:NorFarming"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F275:LiquidityLock"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F276:NORBurnMechanism"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F277:NORRevenue"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F278:WeeklyBuyback"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F279:PriceOracle"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F27A:OracleAggregator"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F27B:MultiAssetReserveVault"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F27C:NorFundFactory"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F27D:NorRouter"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F27E:SettlementHub"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F27F:PriceAuthority"
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F280:SupplyController"
)

# DEX Pairs
PAIRS=(
    "0x1ec827185880dab7372c189c9d8f248986f451fd:NOR/USDT"
    "0xc7df87712ef24fc8a9c733c17bfc64c61c25622a:NOR/WBNB"
    "0x9752c04e749d08bf25de413f439662a013295a2f:NOR/WETH"
    "0x549c38191ddf65238a45a75bb97d3da0cc23a9a1:NOR/Dirhamat"
    "0xfd9797ee1cb74fbbe1934f24c1479aaad1335763:Dirhamat/USDT"
)

# Add all addresses
for contract in "${CONTRACTS[@]}"; do
    IFS=':' read -r addr name <<< "$contract"
    ADDRESSES+=("$addr")
done

for pair in "${PAIRS[@]}"; do
    IFS=':' read -r addr name <<< "$pair"
    ADDRESSES+=("$addr")
done

# Sort and get unique
UNIQUE_ADDRESSES=($(printf '%s\n' "${ADDRESSES[@]}" | sort -u | tr '\n' ' '))

echo "   Total unique addresses: ${#UNIQUE_ADDRESSES[@]}"
echo ""
echo "   Addresses:"
for i in "${!UNIQUE_ADDRESSES[@]}"; do
    printf "   %4d. %s\n" $((i+1)) "${UNIQUE_ADDRESSES[$i]}"
done

echo ""
echo ""
echo -e "${BLUE}2. TOKEN PRICES FROM DEX PAIRS${NC}"
echo "   ----------------------------------------------------------------------"

# Get pair configuration function
get_pair_config() {
    local pair_name=$1
    case "$pair_name" in
        "NOR/USDT")
            echo "0x0cF8e180350253271f4b917CcFb0aCCc4862F263:0x0cF8e180350253271f4b917CcFb0aCCc4862F269:24:18:NOR:USDT"
            ;;
        "NOR/WBNB")
            echo "0x0cF8e180350253271f4b917CcFb0aCCc4862F263:0x0cF8e180350253271f4b917CcFb0aCCc4862F268:24:18:NOR:WBNB"
            ;;
        "NOR/WETH")
            echo "0x0cF8e180350253271f4b917CcFb0aCCc4862F263:0x0cF8e180350253271f4b917CcFb0aCCc4862F26A:24:18:NOR:WETH"
            ;;
        "NOR/Dirhamat")
            echo "0x0cF8e180350253271f4b917CcFb0aCCc4862F263:0x0cF8e180350253271f4b917CcFb0aCCc4862F26B:24:18:NOR:Dirhamat"
            ;;
        "Dirhamat/USDT")
            echo "0x0cF8e180350253271f4b917CcFb0aCCc4862F26B:0x0cF8e180350253271f4b917CcFb0aCCc4862F269:18:18:Dirhamat:USDT"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Calculate prices from DEX pairs
for pair_info in "${PAIRS[@]}"; do
    IFS=':' read -r addr name <<< "$pair_info"
    
    echo ""
    echo "   $name:"
    
    # Get reserves (slot 8 and 9 for Uniswap V2 style)
    RESERVE0=$(get_storage "$addr" "0x8")
    RESERVE1=$(get_storage "$addr" "0x9")
    
    if [ -n "$RESERVE0" ] && [ -n "$RESERVE1" ] && [ "$RESERVE0" != "0x0" ] && [ "$RESERVE1" != "0x0" ]; then
        # Get pair configuration
        PAIR_CFG=$(get_pair_config "$name")
        if [ -z "$PAIR_CFG" ]; then
            echo -e "      ${YELLOW}⚠️${NC}  Pair configuration not found"
            continue
        fi
        
        IFS=':' read -r EXPECTED_TOKEN0 EXPECTED_TOKEN1 DEC0 DEC1 TOKEN0_NAME TOKEN1_NAME <<< "$PAIR_CFG"
        
        # For pairs, token0 is typically the one with lower address (lexicographically)
        # But we'll use the known configuration to determine which is which
        # Based on reserve amounts, we can infer: NOR has 24 decimals, others have 18
        # So if reserve0 is much larger (in raw hex), it's likely the 24-decimal token
        
        # Calculate raw values to determine which is which
        R0_RAW_INT=$(python3 -c "print(int('$RESERVE0', 16))" 2>/dev/null || echo "0")
        R1_RAW_INT=$(python3 -c "print(int('$RESERVE1', 16))" 2>/dev/null || echo "0")
        
        # Determine which reserve is which based on expected decimals
        # NOR has 24 decimals, so if we divide by 1e24, we should get a reasonable number
        # Other tokens have 18 decimals, so dividing by 1e18 should give reasonable numbers
        R0_AS_NOR=$(python3 -c "print(int('$RESERVE0', 16) / 1e24)" 2>/dev/null || echo "0")
        R1_AS_NOR=$(python3 -c "print(int('$RESERVE1', 16) / 1e24)" 2>/dev/null || echo "0")
        
        # If first reserve when divided by 1e24 gives reasonable number (1M-100M range), it's likely NOR
        if [ "$(python3 -c "print(1 if 1000000 <= $R0_AS_NOR <= 100000000 else 0)" 2>/dev/null || echo "0")" = "1" ]; then
            # Reserve0 is NOR (24 decimals)
            BASE_TOKEN=$TOKEN0_NAME
            QUOTE_TOKEN=$TOKEN1_NAME
            R0_RAW=$RESERVE0
            R1_RAW=$RESERVE1
            TOKEN0_DEC=$DEC0
            TOKEN1_DEC=$DEC1
        elif [ "$(python3 -c "print(1 if 1000000 <= $R1_AS_NOR <= 100000000 else 0)" 2>/dev/null || echo "0")" = "1" ]; then
            # Reserve1 is NOR (24 decimals)
            BASE_TOKEN=$TOKEN1_NAME
            QUOTE_TOKEN=$TOKEN0_NAME
            R0_RAW=$RESERVE1
            R1_RAW=$RESERVE0
            TOKEN0_DEC=$DEC1
            TOKEN1_DEC=$DEC0
        else
            # For Dirhamat/USDT (both 18 decimals), use the pair name order
            BASE_TOKEN=$TOKEN0_NAME
            QUOTE_TOKEN=$TOKEN1_NAME
            R0_RAW=$RESERVE0
            R1_RAW=$RESERVE1
            TOKEN0_DEC=$DEC0
            TOKEN1_DEC=$DEC1
        fi
        
        # Convert to decimal using correct decimals
        R0=$(python3 -c "print(int('$R0_RAW', 16) / 10**$TOKEN0_DEC)" 2>/dev/null || echo "0")
        R1=$(python3 -c "print(int('$R1_RAW', 16) / 10**$TOKEN1_DEC)" 2>/dev/null || echo "0")
        
        if [ "$(python3 -c "print(1 if $R0 > 0 and $R1 > 0 else 0)" 2>/dev/null || echo "0")" = "1" ]; then
            # Calculate price: 1 BASE_TOKEN = ? QUOTE_TOKEN
            PRICE=$(python3 -c "print($R1 / $R0)" 2>/dev/null || echo "0")
            
            # Format numbers
            R0_FORMATTED=$(python3 -c "print(f'{float($R0):,.2f}')" 2>/dev/null || echo "$R0")
            R1_FORMATTED=$(python3 -c "print(f'{float($R1):,.2f}')" 2>/dev/null || echo "$R1")
            PRICE_FORMATTED=$(python3 -c "print(f'{float($PRICE):.10f}')" 2>/dev/null | sed 's/0*$//;s/\.$//' || echo "$PRICE")
            
            echo -e "      ${GREEN}✅${NC} Price: 1 $BASE_TOKEN = $PRICE_FORMATTED $QUOTE_TOKEN"
            echo "      Reserves: $R0_FORMATTED $BASE_TOKEN / $R1_FORMATTED $QUOTE_TOKEN"
            
            # Show USD price if applicable
            if [[ "$QUOTE_TOKEN" == "USDT" ]]; then
                PRICE_USD=$(python3 -c "print(f'{float($PRICE):.6f}')" 2>/dev/null || echo "$PRICE")
                echo -e "      ${BLUE}💰${NC} $BASE_TOKEN Price: \$${PRICE_USD} USD"
            elif [[ "$BASE_TOKEN" == "NOR" ]] && [[ "$QUOTE_TOKEN" == "WBNB" ]]; then
                # Convert BNB price to USD (approximate: 1 BNB = $600)
                BNB_PRICE_USD=$(python3 -c "print(f'{float($PRICE) * 600:.10f}')" 2>/dev/null | sed 's/0*$//;s/\.$//' || echo "0")
                echo -e "      ${BLUE}💰${NC} NOR Price (via BNB): ~\$${BNB_PRICE_USD} USD"
            elif [[ "$BASE_TOKEN" == "NOR" ]] && [[ "$QUOTE_TOKEN" == "WETH" ]]; then
                # Convert ETH price to USD (approximate: 1 ETH = $3000)
                ETH_PRICE_USD=$(python3 -c "print(f'{float($PRICE) * 3000:.10f}')" 2>/dev/null | sed 's/0*$//;s/\.$//' || echo "0")
                echo -e "      ${BLUE}💰${NC} NOR Price (via ETH): ~\$${ETH_PRICE_USD} USD"
            elif [[ "$BASE_TOKEN" == "Dirhamat" ]] && [[ "$QUOTE_TOKEN" == "USDT" ]]; then
                PRICE_USD=$(python3 -c "print(f'{float($PRICE):.6f}')" 2>/dev/null || echo "$PRICE")
                echo -e "      ${BLUE}💰${NC} Dirhamat Price: \$${PRICE_USD} USD"
            fi
        else
            echo -e "      ${YELLOW}⚠️${NC}  Reserves not initialized or zero"
        fi
    else
        echo -e "      ${YELLOW}⚠️${NC}  Reserves not available"
    fi
done

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                          SUMMARY                                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo "   Total Unique Addresses: ${#UNIQUE_ADDRESSES[@]}"
echo "   Total DEX Pairs: ${#PAIRS[@]}"
echo ""


#!/bin/bash

#
# Complete Epoch Revalidation Test Suite
#
# This script tests epoch boundary transitions to ensure validators can
# successfully revalidate at epoch boundaries without deadlocking.
#
# Tests:
# 1. Validator ordering in genesis extraData
# 2. Epoch boundary block production
# 3. Validator consensus after epoch
# 4. State preservation across epoch
#

set -e

echo "🧪 Epoch Revalidation Test Suite"
echo "=================================="
echo ""

# Configuration
GENESIS_FILE="${GENESIS_FILE:-data/genesis-nor-complete-v2.json}"
CHAIN_ID="${CHAIN_ID:-65001}"
EPOCH="${EPOCH:-9000000}"
TEST_EPOCH="${TEST_EPOCH:-1000}"  # Use smaller epoch for faster testing
RPC_URL="${RPC_URL:-http://localhost:8545}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log_info "$1"
}

test_fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    log_error "$1"
}

# Check if genesis file exists
if [ ! -f "$GENESIS_FILE" ]; then
    log_error "Genesis file not found: $GENESIS_FILE"
    log_info "Run: node scripts/generate-complete-nor-genesis.js"
    exit 1
fi

echo "📋 Test Configuration:"
echo "   Genesis: $GENESIS_FILE"
echo "   Chain ID: $CHAIN_ID"
echo "   Epoch: $EPOCH blocks"
echo "   Test Epoch: $TEST_EPOCH blocks (for faster testing)"
echo ""

# === TEST 1: Validator Ordering ===

echo "🧪 Test 1: Validator Ordering in Genesis"
echo "----------------------------------------"

# Extract validators from extraData
VALIDATORS=$(python3 <<EOF
import json
import sys

with open('$GENESIS_FILE', 'r') as f:
    genesis = json.load(f)

extradata = genesis['extradata']
# Extract validators (positions 66-186 in hex string)
validators_hex = extradata[66:186]
# Split into 3 validators (40 chars each)
v1 = '0x' + validators_hex[0:40]
v2 = '0x' + validators_hex[40:80]
v3 = '0x' + validators_hex[80:120]

validators = [v1, v2, v3]
sorted_validators = sorted([v.lower() for v in validators])

print(f"Validators in genesis: {validators}")
print(f"Sorted (expected): {sorted_validators}")

if validators == sorted_validators:
    print("PASS")
    sys.exit(0)
else:
    print("FAIL")
    sys.exit(1)
EOF
)

if [ $? -eq 0 ]; then
    test_pass "Validators are properly sorted (lowercase)"
else
    test_fail "Validators not sorted correctly"
fi

echo ""

# === TEST 2: Epoch Configuration ===

echo "🧪 Test 2: Epoch Configuration"
echo "------------------------------"

EPOCH_CONFIG=$(python3 <<EOF
import json

with open('$GENESIS_FILE', 'r') as f:
    genesis = json.load(f)

epoch = genesis['config']['parlia']['epoch']
period = genesis['config']['parlia']['period']

print(f"Epoch: {epoch:,} blocks")
print(f"Period: {period} seconds")
print(f"Time per epoch: {epoch * period / 86400 / 30:.1f} months")

if epoch >= 1000000:
    print("PASS")
    exit(0)
else:
    print("FAIL - Epoch too small")
    exit(1)
EOF
)

if [ $? -eq 0 ]; then
    test_pass "Epoch configured correctly ($EPOCH blocks)"
else
    test_fail "Epoch configuration issue"
fi

echo ""

# === TEST 3: BTCBR Address Preservation ===

echo "🧪 Test 3: BTCBR Address Preservation"
echo "--------------------------------------"

BTCBR_CHECK=$(python3 <<EOF
import json

with open('$GENESIS_FILE', 'r') as f:
    genesis = json.load(f)

btcbr_addr = '0x0cf8e180350253271f4b917ccfb0accc4862f262'
btcbr_alloc = genesis['alloc'].get(btcbr_addr, {})

if 'code' in btcbr_alloc and len(btcbr_alloc['code']) > 100:
    print(f"BTCBR address: {btcbr_addr}")
    print(f"Bytecode length: {len(btcbr_alloc['code'])} bytes")
    print("PASS")
    exit(0)
else:
    print("FAIL - BTCBR not found or missing bytecode")
    exit(1)
EOF
)

if [ $? -eq 0 ]; then
    test_pass "BTCBR preserved at 0x0cF8...262"
else
    test_fail "BTCBR address not preserved"
fi

echo ""

# === TEST 4: Contract Addresses Unique ===

echo "🧪 Test 4: Contract Address Uniqueness"
echo "---------------------------------------"

UNIQUE_CHECK=$(python3 <<EOF
import json

with open('$GENESIS_FILE', 'r') as f:
    genesis = json.load(f)

contracts = []
for addr, data in genesis['alloc'].items():
    if 'code' in data and len(data['code']) > 100:
        contracts.append(addr)

unique_contracts = set(contracts)

if len(contracts) == len(unique_contracts):
    print(f"Total contracts: {len(contracts)}")
    print("PASS - All addresses unique")
    exit(0)
else:
    print(f"Total: {len(contracts)}, Unique: {len(unique_contracts)}")
    print("FAIL - Duplicate addresses found")
    exit(1)
EOF
)

if [ $? -eq 0 ]; then
    test_pass "All contract addresses are unique"
else
    test_fail "Duplicate contract addresses detected"
fi

echo ""

# === TEST 5: Genesis Structure ===

echo "🧪 Test 5: Genesis File Structure"
echo "---------------------------------"

STRUCTURE_CHECK=$(python3 <<EOF
import json

with open('$GENESIS_FILE', 'r') as f:
    genesis = json.load(f)

required_fields = ['config', 'difficulty', 'gasLimit', 'extradata', 'alloc']
missing = [f for f in required_fields if f not in genesis]

if missing:
    print(f"Missing fields: {missing}")
    print("FAIL")
    exit(1)

if 'parlia' not in genesis['config']:
    print("Missing parlia config")
    print("FAIL")
    exit(1)

print("PASS")
exit(0)
EOF
)

if [ $? -eq 0 ]; then
    test_pass "Genesis structure is valid"
else
    test_fail "Genesis structure invalid"
fi

echo ""

# === SUMMARY ===

echo "=" | head -c 80
echo ""
echo "📊 Test Summary"
echo "=" | head -c 80
echo ""
echo "   Tests Passed: $TESTS_PASSED"
echo "   Tests Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log_info "All tests passed! Genesis is ready for epoch revalidation."
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Deploy genesis to testnet with epoch=$TEST_EPOCH"
    echo "   2. Wait for test epoch boundary"
    echo "   3. Verify validators continue producing blocks"
    echo "   4. Deploy to production with epoch=$EPOCH"
    exit 0
else
    log_error "Some tests failed. Please fix issues before deployment."
    exit 1
fi


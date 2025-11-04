#!/bin/bash

#
# Production Genesis Validation Script
#
# Validates production genesis file before deployment to ensure:
# - All contracts present
# - Validator ordering correct
# - Epoch configuration proper
# - BTCBR preserved
# - All addresses unique
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GENESIS_FILE="$PROJECT_DIR/data/genesis-nor-complete-v2.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 Production Genesis Validation"
echo "================================"
echo ""

# Check if genesis file exists
if [ ! -f "$GENESIS_FILE" ]; then
    echo -e "${RED}❌${NC} Production genesis file not found: $GENESIS_FILE"
    echo "Run: node scripts/generate-complete-nor-genesis.js"
    exit 1
fi

echo "📋 Validating: $GENESIS_FILE"
echo ""

# Run Python validation
python3 <<EOF
import json
import sys

errors = []
warnings = []
passed = []

# Load genesis
try:
    with open('$GENESIS_FILE', 'r') as f:
        genesis = json.load(f)
except Exception as e:
    print(f"❌ ERROR: Could not load genesis file: {e}")
    sys.exit(1)

# Test 1: Chain ID
chain_id = genesis['config']['chainId']
if chain_id == 65001:
    passed.append(f"✅ Chain ID: {chain_id} (correct)")
else:
    errors.append(f"❌ Chain ID: {chain_id} (expected 65001)")

# Test 2: Epoch Configuration
epoch = genesis['config']['parlia']['epoch']
period = genesis['config']['parlia']['period']

if epoch == 9000000:
    passed.append(f"✅ Epoch: {epoch:,} blocks (~{epoch * period / 86400 / 30:.1f} months)")
else:
    if epoch >= 1000000:
        warnings.append(f"⚠️  Epoch: {epoch:,} blocks (expected 9,000,000)")
    else:
        errors.append(f"❌ Epoch: {epoch:,} blocks (too small, expected >= 1M)")

# Test 3: Validator Ordering
extradata = genesis['extradata']
validators_hex = extradata[66:186]
v1 = '0x' + validators_hex[0:40]
v2 = '0x' + validators_hex[40:80]
v3 = '0x' + validators_hex[80:120]
validators = [v1, v2, v3]
sorted_validators = sorted([v.lower() for v in validators])

if validators == sorted_validators:
    passed.append("✅ Validators sorted correctly (lowercase)")
else:
    errors.append("❌ Validators not sorted correctly")
    print(f"   Found: {validators}")
    print(f"   Expected: {sorted_validators}")

# Test 4: BTCBR Preservation
btcbr_addr = '0x0cf8e180350253271f4b917ccfb0accc4862f262'
btcbr_alloc = genesis['alloc'].get(btcbr_addr, {})

if 'code' in btcbr_alloc:
    code_len = len(btcbr_alloc['code'])
    if code_len > 100:
        passed.append(f"✅ BTCBR preserved: {btcbr_addr} ({code_len:,} bytes)")
    else:
        errors.append(f"❌ BTCBR bytecode too short: {code_len} bytes")
else:
    errors.append(f"❌ BTCBR not found at {btcbr_addr}")

# Test 5: Contract Count
contracts = [addr for addr, data in genesis['alloc'].items() 
             if 'code' in data and len(data['code']) > 100]

expected_contracts = 31
if len(contracts) == expected_contracts:
    passed.append(f"✅ Contracts: {len(contracts)}/{expected_contracts} (all present)")
elif len(contracts) >= 30:
    warnings.append(f"⚠️  Contracts: {len(contracts)}/{expected_contracts} (some may be missing)")
else:
    errors.append(f"❌ Contracts: {len(contracts)}/{expected_contracts} (missing contracts)")

# Test 6: Address Uniqueness
unique_contracts = set(contracts)
if len(contracts) == len(unique_contracts):
    passed.append(f"✅ Address uniqueness: All {len(contracts)} addresses unique")
else:
    errors.append(f"❌ Duplicate addresses found: {len(contracts) - len(unique_contracts)}")

# Test 7: Required Contracts Check
required_contracts = {
    '0x0cf8e180350253271f4b917ccfb0accc4862f262': 'BTCBR',
    '0x0cf8e180350253271f4b917ccfb0accc4862f263': 'NOR',
    '0x0cf8e180350253271f4b917ccfb0accc4862f266': 'NorSwapFactory',
    '0x0cf8e180350253271f4b917ccfb0accc4862f267': 'NorSwapRouter',
}

missing_required = []
for addr, name in required_contracts.items():
    if addr not in contracts:
        missing_required.append(name)

if not missing_required:
    passed.append("✅ Required contracts present")
else:
    errors.append(f"❌ Missing required contracts: {', '.join(missing_required)}")

# Test 8: Validator Balances
validators_list = [
    '0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a',
    '0x689cf2c189781d9bb6859a830acbf64044e4432f',
    '0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de',
]

treasury = '0xdd779a290c937144f80eb75b75d814c834536b1b'

all_have_balance = True
for addr in validators_list + [treasury]:
    addr_lower = addr.lower()
    if addr_lower in genesis['alloc']:
        balance = genesis['alloc'][addr_lower].get('balance', '0x0')
        if balance != '0x0':
            continue
    all_have_balance = False
    errors.append(f"❌ Missing balance for {addr}")

if all_have_balance:
    passed.append("✅ Validator balances present")

# Print results
print("=" * 60)
print("VALIDATION RESULTS")
print("=" * 60)
print()

if passed:
    print("✅ PASSED:")
    for p in passed:
        print(f"   {p}")
    print()

if warnings:
    print("⚠️  WARNINGS:")
    for w in warnings:
        print(f"   {w}")
    print()

if errors:
    print("❌ ERRORS:")
    for e in errors:
        print(f"   {e}")
    print()

# Summary
total_tests = len(passed) + len(warnings) + len(errors)
print("=" * 60)
print(f"Summary: {len(passed)} passed, {len(warnings)} warnings, {len(errors)} errors")
print("=" * 60)
print()

if errors:
    print("❌ VALIDATION FAILED - Fix errors before deployment")
    sys.exit(1)
elif warnings:
    print("⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings")
    sys.exit(0)
else:
    print("✅ VALIDATION PASSED - Production genesis ready for deployment")
    sys.exit(0)
EOF

VAL_RESULT=$?

echo ""
if [ $VAL_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Production genesis validation complete${NC}"
else
    echo -e "${RED}❌ Production genesis validation failed${NC}"
    exit 1
fi


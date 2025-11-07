#!/bin/bash

# Automated Security Audit Script for NorTokenUltra
# Runs all free security tools and generates report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create audit output directory
AUDIT_DIR="audit-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${AUDIT_DIR}/${TIMESTAMP}"
mkdir -p "${REPORT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NorTokenUltra Security Audit${NC}"
echo -e "${BLUE}  Date: $(date)${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print section header
print_header() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check prerequisites
print_header "Checking Prerequisites"

MISSING_TOOLS=()

if ! command_exists npm; then
    MISSING_TOOLS+=("npm")
fi

if ! command_exists npx; then
    MISSING_TOOLS+=("npx")
fi

if ! command_exists slither; then
    print_warning "Slither not found. Install with: pip3 install slither-analyzer"
    MISSING_TOOLS+=("slither")
fi

if ! command_exists myth; then
    print_warning "Mythril not found. Install with: pip3 install mythril"
    MISSING_TOOLS+=("myth")
fi

if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then
    print_success "All tools available"
else
    print_warning "Missing tools: ${MISSING_TOOLS[*]}"
    print_warning "Will continue with available tools..."
fi

# Step 2: Compile contracts
print_header "Compiling Contracts"

echo "Running hardhat compile..."
npx hardhat compile > "${REPORT_DIR}/compile.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "Compilation successful"
else
    print_error "Compilation failed. Check ${REPORT_DIR}/compile.log"
    exit 1
fi

# Step 3: Run Solhint (always available via npm)
print_header "Running Solhint (Linter)"

echo "Checking code style and basic security..."
npx solhint 'contracts/**/*.sol' > "${REPORT_DIR}/solhint.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "Solhint: No issues found"
else
    print_warning "Solhint found issues. Check ${REPORT_DIR}/solhint.log"
fi

# Step 4: Run Slither (if available)
print_header "Running Slither (Static Analysis)"

if command_exists slither; then
    echo "Running Slither analysis..."
    slither . --print human-summary > "${REPORT_DIR}/slither-summary.log" 2>&1 || true
    slither . --detect reentrancy-eth,reentrancy-no-eth,reentrancy-benign > "${REPORT_DIR}/slither-reentrancy.log" 2>&1 || true
    slither . --detect arbitrary-send,controlled-delegatecall > "${REPORT_DIR}/slither-access.log" 2>&1 || true
    slither . --detect unchecked-transfer,unchecked-lowlevel > "${REPORT_DIR}/slither-unchecked.log" 2>&1 || true
    slither . --json="${REPORT_DIR}/slither-full.json" > "${REPORT_DIR}/slither-full.log" 2>&1 || true

    print_success "Slither analysis complete"
    echo "  Results saved to ${REPORT_DIR}/slither-*.log"
else
    print_warning "Slither not available. Skipping..."
fi

# Step 5: Run Mythril (if available)
print_header "Running Mythril (Symbolic Execution)"

if command_exists myth; then
    echo "Running Mythril analysis (this may take a few minutes)..."

    # Analyze main contract
    if [ -f "contracts/NorTokenUltra.sol" ]; then
        myth analyze contracts/NorTokenUltra.sol > "${REPORT_DIR}/mythril-nortoken.log" 2>&1 || true
        print_success "Mythril analysis complete for NorTokenUltra"
    fi

    # Analyze bridge if exists
    if [ -f "contracts/bridges/NorTokenBridgeHub.sol" ]; then
        myth analyze contracts/bridges/NorTokenBridgeHub.sol > "${REPORT_DIR}/mythril-bridge.log" 2>&1 || true
        print_success "Mythril analysis complete for Bridge"
    fi
else
    print_warning "Mythril not available. Skipping..."
fi

# Step 6: Run Hardhat Tests
print_header "Running Test Suite"

echo "Executing all tests..."
npx hardhat test > "${REPORT_DIR}/tests.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "All tests passed"
else
    print_error "Some tests failed. Check ${REPORT_DIR}/tests.log"
fi

# Step 7: Run Coverage
print_header "Analyzing Test Coverage"

echo "Generating coverage report..."
npx hardhat coverage > "${REPORT_DIR}/coverage.log" 2>&1 || true

if [ -d "coverage" ]; then
    # Extract coverage summary
    if [ -f "coverage/coverage-summary.json" ]; then
        print_success "Coverage report generated"
        echo ""
        node -e "
        const coverage = require('./coverage/coverage-summary.json');
        const total = coverage.total;
        console.log('  Lines:      ' + total.lines.pct + '%');
        console.log('  Statements: ' + total.statements.pct + '%');
        console.log('  Functions:  ' + total.functions.pct + '%');
        console.log('  Branches:   ' + total.branches.pct + '%');
        "

        # Copy coverage to report directory
        cp -r coverage "${REPORT_DIR}/"
    fi
else
    print_warning "Coverage report not generated"
fi

# Step 8: Check for common issues
print_header "Checking Common Vulnerabilities"

echo "Scanning for common patterns..."

# Check for floating pragma
FLOATING_PRAGMA=$(grep -r "pragma solidity \^" contracts/ 2>/dev/null | wc -l)
if [ $FLOATING_PRAGMA -gt 0 ]; then
    print_warning "Found floating pragma versions (^0.8.x)"
else
    print_success "No floating pragma versions"
fi

# Check for tx.origin
TX_ORIGIN=$(grep -r "tx.origin" contracts/ 2>/dev/null | wc -l)
if [ $TX_ORIGIN -gt 0 ]; then
    print_error "Found tx.origin usage (use msg.sender instead)"
else
    print_success "No tx.origin usage"
fi

# Check for block.timestamp
TIMESTAMP=$(grep -r "block.timestamp" contracts/ 2>/dev/null | wc -l)
if [ $TIMESTAMP -gt 0 ]; then
    print_warning "Found block.timestamp usage - verify it's safe"
else
    print_success "No block.timestamp usage"
fi

# Check for selfdestruct
SELFDESTRUCT=$(grep -r "selfdestruct" contracts/ 2>/dev/null | wc -l)
if [ $SELFDESTRUCT -gt 0 ]; then
    print_error "Found selfdestruct - review carefully"
else
    print_success "No selfdestruct usage"
fi

# Check for delegatecall
DELEGATECALL=$(grep -r "delegatecall" contracts/ 2>/dev/null | wc -l)
if [ $DELEGATECALL -gt 0 ]; then
    print_warning "Found delegatecall - ensure it's safe"
else
    print_success "No delegatecall usage"
fi

# Step 9: Generate Summary Report
print_header "Generating Summary Report"

SUMMARY_FILE="${REPORT_DIR}/AUDIT_SUMMARY.md"

cat > "${SUMMARY_FILE}" << EOF
# Security Audit Summary

**Date:** $(date)
**Project:** NorTokenUltra
**Auditor:** Automated Security Scan

---

## Tools Used

- ✅ Hardhat Compiler
- ✅ Solhint (Linter)
EOF

if command_exists slither; then
    echo "- ✅ Slither (Static Analysis)" >> "${SUMMARY_FILE}"
else
    echo "- ❌ Slither (Not Available)" >> "${SUMMARY_FILE}"
fi

if command_exists myth; then
    echo "- ✅ Mythril (Symbolic Execution)" >> "${SUMMARY_FILE}"
else
    echo "- ❌ Mythril (Not Available)" >> "${SUMMARY_FILE}"
fi

cat >> "${SUMMARY_FILE}" << EOF
- ✅ Hardhat Tests
- ✅ Coverage Analysis
- ✅ Manual Pattern Checks

---

## Test Results

EOF

# Add test results
if [ -f "${REPORT_DIR}/tests.log" ]; then
    echo "**Test Execution:**" >> "${SUMMARY_FILE}"
    grep -E "passing|failing" "${REPORT_DIR}/tests.log" | head -1 >> "${SUMMARY_FILE}" || echo "See tests.log for details" >> "${SUMMARY_FILE}"
    echo "" >> "${SUMMARY_FILE}"
fi

# Add coverage results
if [ -f "coverage/coverage-summary.json" ]; then
    echo "**Code Coverage:**" >> "${SUMMARY_FILE}"
    node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const total = coverage.total;
    console.log('- Lines: ' + total.lines.pct + '%');
    console.log('- Statements: ' + total.statements.pct + '%');
    console.log('- Functions: ' + total.functions.pct + '%');
    console.log('- Branches: ' + total.branches.pct + '%');
    " >> "${SUMMARY_FILE}"
    echo "" >> "${SUMMARY_FILE}"
fi

cat >> "${SUMMARY_FILE}" << EOF

---

## Common Vulnerability Checks

- Floating Pragma: $([ $FLOATING_PRAGMA -gt 0 ] && echo "⚠️  Found" || echo "✅ None")
- tx.origin Usage: $([ $TX_ORIGIN -gt 0 ] && echo "❌ Found" || echo "✅ None")
- block.timestamp: $([ $TIMESTAMP -gt 0 ] && echo "⚠️  Found (Review)" || echo "✅ None")
- selfdestruct: $([ $SELFDESTRUCT -gt 0 ] && echo "❌ Found" || echo "✅ None")
- delegatecall: $([ $DELEGATECALL -gt 0 ] && echo "⚠️  Found (Review)" || echo "✅ None")

---

## Detailed Reports

All detailed logs are available in: \`${REPORT_DIR}/\`

- \`compile.log\` - Compilation output
- \`solhint.log\` - Linter results
- \`slither-*.log\` - Static analysis (if available)
- \`mythril-*.log\` - Symbolic execution (if available)
- \`tests.log\` - Test execution results
- \`coverage.log\` - Coverage generation log
- \`coverage/\` - Full coverage report (open coverage/index.html)

---

## Next Steps

1. ✅ Review all warning messages in detailed logs
2. ✅ Fix any critical or high severity issues
3. ✅ Improve test coverage to 100% if not achieved
4. ✅ Run manual security checklist review
5. ✅ Get community review
6. ✅ Consider professional audit for mainnet

---

**Audit Complete!**

EOF

print_success "Summary report generated: ${SUMMARY_FILE}"

# Step 10: Final Summary
print_header "Audit Complete"

echo -e "All results saved to: ${GREEN}${REPORT_DIR}/${NC}\n"
echo "Key files:"
echo "  📄 ${SUMMARY_FILE}"
echo "  📄 ${REPORT_DIR}/tests.log"
echo "  📊 ${REPORT_DIR}/coverage/ (open index.html in browser)"
echo ""
echo "Next steps:"
echo "  1. Review ${SUMMARY_FILE}"
echo "  2. Check all *.log files for warnings"
echo "  3. Open coverage/index.html to see uncovered code"
echo "  4. Fix any issues found"
echo "  5. Run this script again to verify fixes"
echo ""

# Open summary in default editor if available
if command_exists open; then
    echo -e "${BLUE}Opening summary report...${NC}"
    open "${SUMMARY_FILE}"
elif command_exists xdg-open; then
    xdg-open "${SUMMARY_FILE}"
fi

print_success "Automated audit complete! 🎉"

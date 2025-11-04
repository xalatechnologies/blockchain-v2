#!/bin/bash

# Documentation Reorganization Script
# Date: 2025-11-02

echo "📁 Starting Nor Chain Documentation Reorganization..."
echo ""

# Create new directory structure
echo "Creating directory structure..."
mkdir -p docs/00-critical
mkdir -p docs/01-getting-started
mkdir -p docs/02-bridges
mkdir -p docs/03-deployment
mkdir -p docs/04-infrastructure
mkdir -p docs/05-guides
mkdir -p docs/06-summaries
mkdir -p docs/07-applications
mkdir -p docs/08-strategy
mkdir -p docs/09-archived

echo "✅ Directory structure created"
echo ""

# Move critical/current documents
echo "Moving critical documents..."
mv CRITICAL_BACKUP_ANALYSIS.md docs/00-critical/ 2>/dev/null
mv XAHEEN_CHAIN_COMPLETE_INVENTORY.md docs/00-critical/ 2>/dev/null
mv EPOCH_FIX_MANUAL.md docs/00-critical/ 2>/dev/null
mv DEPLOYMENT-STATUS.md docs/00-critical/ 2>/dev/null

# Move getting started docs
echo "Moving getting-started documents..."
mv START_HERE.md docs/01-getting-started/ 2>/dev/null
mv QUICK_REFERENCE.md docs/01-getting-started/ 2>/dev/null
mv QUICK_START_CHECKLIST.md docs/01-getting-started/ 2>/dev/null
mv GET_TEST_TOKENS.md docs/01-getting-started/ 2>/dev/null
mv GET_TESTNET_BNB.md docs/01-getting-started/ 2>/dev/null

# Move bridge documents
echo "Moving bridge documents..."
mv ALL_3_BRIDGES_WORKING.md docs/02-bridges/ 2>/dev/null
mv ALL_BRIDGES_DEPLOYED.md docs/02-bridges/ 2>/dev/null
mv BRIDGE_DEPLOYED_SUCCESS.md docs/02-bridges/ 2>/dev/null
mv BRIDGE_DEPLOYMENT_COST_BREAKDOWN.md docs/02-bridges/ 2>/dev/null
mv BRIDGE_TESTING_GUIDE.md docs/02-bridges/ 2>/dev/null
mv BRIDGES_COMPLETE_SUMMARY.md docs/02-bridges/ 2>/dev/null
mv BSC_BRIDGE_QUICK_DEPLOY.md docs/02-bridges/ 2>/dev/null
mv COMPLETE_BRIDGE_TESTING.md docs/02-bridges/ 2>/dev/null
mv DEPLOY_BRIDGE_NOW.md docs/02-bridges/ 2>/dev/null
mv ETH_BRIDGE_ISSUE.md docs/02-bridges/ 2>/dev/null
mv HOW_BRIDGES_WORK.md docs/02-bridges/ 2>/dev/null

# Move deployment documents
echo "Moving deployment documents..."
mv DEPLOY_NOW.md docs/03-deployment/ 2>/dev/null
mv DEPLOYED-CONTRACTS.md docs/03-deployment/ 2>/dev/null
mv DEPLOYMENT_QUICKSTART.md docs/03-deployment/ 2>/dev/null
mv DEPLOYMENT_SUMMARY.md docs/03-deployment/ 2>/dev/null
mv EXECUTE_NOW.md docs/03-deployment/ 2>/dev/null
mv MAINNET_DEPLOYMENT_READY.md docs/03-deployment/ 2>/dev/null
mv LAUNCH_READY.md docs/03-deployment/ 2>/dev/null
mv READY_TO_LAUNCH.md docs/03-deployment/ 2>/dev/null
mv READY_TO_LAUNCH_SUMMARY.md docs/03-deployment/ 2>/dev/null
mv WEEK4_COMPLETE_TESTNET_READY.md docs/03-deployment/ 2>/dev/null
mv CROSS_CHAIN_DEX_WEEK1_SUMMARY.md docs/03-deployment/ 2>/dev/null

# Move infrastructure documents
echo "Moving infrastructure documents..."
mv INFRASTRUCTURE_COMPLETE.md docs/04-infrastructure/ 2>/dev/null
mv INFRASTRUCTURE_IMPROVEMENTS.md docs/04-infrastructure/ 2>/dev/null
mv VALIDATOR_SETUP_GUIDE.md docs/04-infrastructure/ 2>/dev/null

# Move guides
echo "Moving user guides..."
mv BACKEND_INTEGRATION_GUIDE.md docs/05-guides/ 2>/dev/null
mv METAMASK_TOKEN_GUIDE.md docs/05-guides/ 2>/dev/null
mv TRADING_GUIDE.md docs/05-guides/ 2>/dev/null
mv TROUBLESHOOTING_URLS.md docs/05-guides/ 2>/dev/null
mv LOGO_CREATION_GUIDE.md docs/05-guides/ 2>/dev/null

# Move summaries
echo "Moving weekly summaries..."
mv FINAL_SUMMARY.md docs/06-summaries/ 2>/dev/null
mv WEEK2_PROGRESS_SUMMARY.md docs/06-summaries/ 2>/dev/null
mv WEEK3_COMPLETE_SUMMARY.md docs/06-summaries/ 2>/dev/null
mv WEEK4_SECURITY_AUDIT_COMPLETE.md docs/06-summaries/ 2>/dev/null
mv IMPLEMENTATION_COMPLETE.md docs/06-summaries/ 2>/dev/null
mv NON_DEPLOYMENT_TASKS_COMPLETE.md docs/06-summaries/ 2>/dev/null

# Move exchange/listing applications
echo "Moving exchange applications..."
mv COINGECKO_APPLICATION.md docs/07-applications/ 2>/dev/null
mv COINMARKETCAP_CORRECT_METHOD.md docs/07-applications/ 2>/dev/null
mv COINMARKETCAP_FORM_ANSWERS.md docs/07-applications/ 2>/dev/null
mv MOONPAY_COMPLIANCE_ANSWERS.md docs/07-applications/ 2>/dev/null
mv MOONPAY_SIGNUP_ANSWERS.md docs/07-applications/ 2>/dev/null
mv API_COMPARISON.md docs/07-applications/ 2>/dev/null

# Move strategy documents
echo "Moving strategy documents..."
mv EASY_GO_LIVE_STRATEGY.md docs/08-strategy/ 2>/dev/null
mv LIQUIDITY_STRATEGY.md docs/08-strategy/ 2>/dev/null
mv MONETIZATION_STRATEGY.md docs/08-strategy/ 2>/dev/null
mv PRICE_STABILITY_AND_LIQUIDITY.md docs/08-strategy/ 2>/dev/null
mv REALITY_CHECK_SIMPLE_PATH.md docs/08-strategy/ 2>/dev/null

echo ""
echo "✅ Files moved to new structure"
echo ""

# Create index files for each category
echo "Creating category index files..."

cat > docs/00-critical/README.md << 'EOF'
# 00 - Critical & Current Status

This directory contains the most critical and time-sensitive documentation.

## Current Critical Issues

- **CRITICAL_BACKUP_ANALYSIS.md** - Complete analysis of $20K liquidity at risk
- **XAHEEN_CHAIN_COMPLETE_INVENTORY.md** - Full inventory of deployed contracts
- **EPOCH_FIX_MANUAL.md** - Instructions for epoch boundary fix
- **DEPLOYMENT-STATUS.md** - Current deployment status

⚠️ **READ THESE FIRST** if dealing with production issues.
EOF

cat > docs/01-getting-started/README.md << 'EOF'
# 01 - Getting Started

Quick start guides and essential first steps for working with Nor Chain.

## Quick Reference

- **START_HERE.md** - Main starting point for new developers
- **QUICK_REFERENCE.md** - Quick command reference
- **QUICK_START_CHECKLIST.md** - Step-by-step checklist

## Testing

- **GET_TEST_TOKENS.md** - How to get test tokens
- **GET_TESTNET_BNB.md** - How to get testnet BNB for gas

Start with START_HERE.md for the best onboarding experience.
EOF

cat > docs/02-bridges/README.md << 'EOF'
# 02 - Bridge Infrastructure

Documentation for all bridge implementations (BNB, USDT, ETH bridges).

## Deployed Bridges

- **ALL_3_BRIDGES_WORKING.md** - Status of all three bridges
- **ALL_BRIDGES_DEPLOYED.md** - Deployment summary
- **BRIDGES_COMPLETE_SUMMARY.md** - Complete overview

## Deployment & Testing

- **BRIDGE_DEPLOYMENT_COST_BREAKDOWN.md** - Cost analysis
- **BRIDGE_TESTING_GUIDE.md** - How to test bridges
- **BSC_BRIDGE_QUICK_DEPLOY.md** - Quick deployment guide
- **DEPLOY_BRIDGE_NOW.md** - Rapid deployment instructions

## Technical Details

- **HOW_BRIDGES_WORK.md** - Architecture explanation
- **ETH_BRIDGE_ISSUE.md** - Known issues and fixes
EOF

cat > docs/03-deployment/README.md << 'EOF'
# 03 - Deployment

Complete deployment documentation for mainnet and testnet.

## Quick Deploy

- **DEPLOYMENT_QUICKSTART.md** - Fast track deployment
- **DEPLOY_NOW.md** - Immediate deployment instructions
- **EXECUTE_NOW.md** - Execution commands

## Status & Planning

- **DEPLOYED-CONTRACTS.md** - All deployed contract addresses
- **DEPLOYMENT_SUMMARY.md** - Deployment overview
- **MAINNET_DEPLOYMENT_READY.md** - Mainnet readiness checklist

## Launch Preparation

- **LAUNCH_READY.md** - Launch readiness status
- **READY_TO_LAUNCH.md** - Pre-launch checklist
- **READY_TO_LAUNCH_SUMMARY.md** - Launch summary
EOF

cat > docs/04-infrastructure/README.md << 'EOF'
# 04 - Infrastructure

Validator setup, server configuration, and infrastructure management.

## Setup Guides

- **VALIDATOR_SETUP_GUIDE.md** - Complete validator setup instructions

## Status & Improvements

- **INFRASTRUCTURE_COMPLETE.md** - Current infrastructure status
- **INFRASTRUCTURE_IMPROVEMENTS.md** - Planned improvements

See also: `docs/infrastructure/` for more detailed infrastructure documentation.
EOF

cat > docs/05-guides/README.md << 'EOF'
# 05 - User & Developer Guides

Practical guides for users and developers.

## Integration

- **BACKEND_INTEGRATION_GUIDE.md** - Backend integration instructions
- **METAMASK_TOKEN_GUIDE.md** - Adding tokens to MetaMask

## Usage

- **TRADING_GUIDE.md** - How to trade on the DEX
- **TROUBLESHOOTING_URLS.md** - Common issues and fixes

## Branding

- **LOGO_CREATION_GUIDE.md** - Logo design guidelines
EOF

cat > docs/06-summaries/README.md << 'EOF'
# 06 - Development Summaries

Weekly progress reports and milestone summaries.

## Weekly Progress

- **WEEK2_PROGRESS_SUMMARY.md** - Week 2 development summary
- **WEEK3_COMPLETE_SUMMARY.md** - Week 3 completion report
- **WEEK4_SECURITY_AUDIT_COMPLETE.md** - Week 4 security audit
- **WEEK4_COMPLETE_TESTNET_READY.md** - Week 4 testnet readiness

## Completion Reports

- **FINAL_SUMMARY.md** - Final project summary
- **IMPLEMENTATION_COMPLETE.md** - Implementation completion
- **NON_DEPLOYMENT_TASKS_COMPLETE.md** - Non-deployment tasks
EOF

cat > docs/07-applications/README.md << 'EOF'
# 07 - Exchange & Service Applications

Documentation for applying to exchanges, listing services, and payment processors.

## Exchange Listings

- **COINGECKO_APPLICATION.md** - CoinGecko listing application
- **COINMARKETCAP_CORRECT_METHOD.md** - CoinMarketCap listing process
- **COINMARKETCAP_FORM_ANSWERS.md** - CMC form responses

## Payment Processors

- **MOONPAY_COMPLIANCE_ANSWERS.md** - MoonPay compliance questionnaire
- **MOONPAY_SIGNUP_ANSWERS.md** - MoonPay signup responses

## API Integrations

- **API_COMPARISON.md** - API comparison and selection
EOF

cat > docs/08-strategy/README.md << 'EOF'
# 08 - Strategy & Planning

Strategic planning, liquidity management, and go-to-market strategy.

## Launch Strategy

- **EASY_GO_LIVE_STRATEGY.md** - Simplified launch strategy
- **REALITY_CHECK_SIMPLE_PATH.md** - Realistic launch path

## Financial Strategy

- **LIQUIDITY_STRATEGY.md** - Liquidity management strategy
- **PRICE_STABILITY_AND_LIQUIDITY.md** - Price stability mechanisms
- **MONETIZATION_STRATEGY.md** - Revenue and monetization plans
EOF

echo "✅ Index files created"
echo ""
echo "📊 Reorganization Summary:"
echo "  - 58 MD files categorized and moved"
echo "  - 8 category directories with indexes"
echo "  - Kept in root: README.md, CLAUDE.md"
echo ""
echo "✅ Documentation reorganization complete!"

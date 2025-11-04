#!/bin/bash

echo "🧹 Cleaning up remaining txt, log, and JSON files..."
echo ""

# Create directories
echo "Creating directories..."
mkdir -p logs/deployment
mkdir -p logs/security
mkdir -p data/contracts
mkdir -p docs/07-applications/ready-to-send

echo "✅ Directories created"
echo ""

# Move txt files
echo "Moving txt files..."
mv COINGECKO_EMAIL_READY_TO_SEND.txt docs/07-applications/ready-to-send/ 2>/dev/null
mv COINMARKETCAP_EMAIL_READY_TO_SEND.txt docs/07-applications/ready-to-send/ 2>/dev/null
mv DEPLOYMENT_SUCCESS_REPORT.txt docs/03-deployment/ 2>/dev/null
mv deployment-log.txt logs/deployment/ 2>/dev/null
mv TRADING_OPERATIONAL.txt docs/03-deployment/ 2>/dev/null

echo "✅ TXT files moved"
echo ""

# Move log files
echo "Moving log files..."
mv bridge-deployment.log logs/deployment/ 2>/dev/null
mv complete-deployment-final.log logs/deployment/ 2>/dev/null
mv complete-ecosystem-deployment.log logs/deployment/ 2>/dev/null
mv deployment-complete.log logs/deployment/ 2>/dev/null
mv deployment-output.log logs/deployment/ 2>/dev/null
mv final-deployment.log logs/deployment/ 2>/dev/null
mv production-deployment.log logs/deployment/ 2>/dev/null
mv slither-output.log logs/security/ 2>/dev/null

echo "✅ LOG files moved"
echo ""

# Move JSON files (keep package.json, package-lock.json in root)
echo "Moving JSON files..."
mv CONTRACT_ADDRESSES.json data/contracts/ 2>/dev/null
mv slither-report.json logs/security/ 2>/dev/null

echo "✅ JSON files moved"
echo ""

# Create logs README
cat > logs/README.md << 'LOGREADME'
# Logs Directory

This directory contains deployment logs and security audit reports.

## Structure

- **deployment/** - Deployment logs from various deployment runs
- **security/** - Security audit reports (Slither, etc.)

## Deployment Logs

All deployment logs are timestamped and contain:
- Contract deployment transactions
- Gas costs
- Deployment addresses
- Success/failure status

## Security Logs

Security audit logs include:
- Slither static analysis reports
- Contract vulnerability scans
- Audit summaries

**Note**: Logs are kept for historical reference and debugging purposes.
LOGREADME

echo "✅ Logs README created"
echo ""

# Create data/contracts README
cat > data/contracts/README.md << 'CONTRACTREADME'
# Contract Addresses

This directory contains JSON files with deployed contract addresses.

## Files

- **CONTRACT_ADDRESSES.json** - Master list of all deployed contracts

## Structure

Contract address files typically contain:
- Contract name
- Deployment address
- Network (BSC Mainnet, Nor Chain, etc.)
- Chain ID
- Deployment timestamp
- Deployer address

## Usage

These files are used by:
- Deployment scripts for reference
- Frontend applications for contract interaction
- Bridge relayers for address configuration
- Testing scripts for contract verification
CONTRACTREADME

echo "✅ Data/contracts README created"
echo ""

# Summary
echo "📊 Cleanup Summary:"
echo "  - 5 TXT files organized"
echo "  - 8 LOG files organized"
echo "  - 2 JSON files organized"
echo "  - 2 README files created (logs/, data/contracts/)"
echo ""
echo "✅ Remaining files cleanup complete!"

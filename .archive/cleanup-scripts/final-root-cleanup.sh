#!/bin/bash

echo "🧹 Final root directory cleanup..."
echo ""

# Create necessary directories
echo "Creating directories..."
mkdir -p config/docker
mkdir -p config/web
mkdir -p data/bytecode
mkdir -p scripts/maintenance
mkdir -p .archive/cleanup-scripts

echo "✅ Directories created"
echo ""

# Move configuration files
echo "Moving configuration files..."
mv docker-compose.yml config/docker/ 2>/dev/null
mv docker-compose-validators.yml config/docker/ 2>/dev/null
mv add-xaheen-to-metamask.html config/web/ 2>/dev/null

echo "✅ Configuration files moved"
echo ""

# Move data files
echo "Moving data files..."
mv btcbr_bytecode.hex data/bytecode/ 2>/dev/null

echo "✅ Data files moved"
echo ""

# Move maintenance scripts
echo "Moving maintenance scripts..."
mv fix-btcbr-storage.py scripts/maintenance/ 2>/dev/null

echo "✅ Maintenance scripts moved"
echo ""

# Archive cleanup scripts
echo "Archiving cleanup scripts..."
mv reorganize-docs.sh .archive/cleanup-scripts/ 2>/dev/null
mv cleanup-remaining-files.sh .archive/cleanup-scripts/ 2>/dev/null

echo "✅ Cleanup scripts archived"
echo ""

# Create config README
cat > config/README.md << 'CONFIGREADME'
# Configuration Files

This directory contains configuration files for various components.

## Structure

- **docker/** - Docker Compose configurations
- **web/** - Web interface files (MetaMask integration, etc.)

## Docker Configurations

- `docker-compose.yml` - Single validator setup
- `docker-compose-validators.yml` - Multi-validator setup

## Web Files

- `add-xaheen-to-metamask.html` - MetaMask integration page

## Usage

These files are referenced by deployment and setup scripts.
CONFIGREADME

echo "✅ Config README created"
echo ""

# Create data/bytecode README
cat > data/bytecode/README.md << 'BYTECODEREADME'
# Bytecode Directory

This directory contains compiled contract bytecode files.

## Files

- **btcbr_bytecode.hex** - BTCBR token bytecode for genesis

## Usage

Bytecode files are used:
- In genesis file generation
- For contract deployment verification
- As reference for contract initialization

**Note**: These are compiled Solidity contract bytecode in hexadecimal format.
BYTECODEREADME

echo "✅ Bytecode README created"
echo ""

# Summary
echo "📊 Final Cleanup Summary:"
echo "  - 3 Config files moved to config/"
echo "  - 1 Bytecode file moved to data/bytecode/"
echo "  - 1 Maintenance script moved to scripts/maintenance/"
echo "  - 2 Cleanup scripts archived"
echo "  - 2 README files created"
echo ""
echo "✅ Final root cleanup complete!"
echo ""
echo "⚠️  SECURITY NOTE:"
echo "  bsc-validator-key.pem should remain in root or be moved to ~/.ssh/"
echo "  This is your validator private key - keep it secure!"

# Validator Data Directories

This directory contains validator node data and keystores.

## Structure

- **validator-base/** - Base validator configuration
- **validator-1/** - Validator 1 blockchain data
- **validator-2/** - Validator 2 blockchain data
- **validator-3/** - Validator 3 blockchain data

## Contents

Each validator directory contains:
- `geth/` - Blockchain data (leveldb)
- `keystore/` - Validator private keys (⚠️ SECURE!)
- `password.txt` - Keystore password (⚠️ SECURE!)

## Security

⚠️ **CRITICAL**: These directories contain sensitive cryptographic keys!

- Never commit to git (gitignored)
- Backup securely
- Encrypt at rest
- Restrict file permissions

## Usage

Validators reference these directories:
```bash
# Docker volume mounts
-v $(pwd)/config/validators/validator-1:/bsc

# Direct path
--datadir config/validators/validator-1
```

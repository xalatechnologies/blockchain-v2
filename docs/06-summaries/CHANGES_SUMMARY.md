# Blockchain V2 - Configuration & Deployment Summary

## Overview
This document summarizes the updates made to the blockchain-v2 migration scripts and configuration files to align with the project requirements and AWS infrastructure.

## Key Changes Made

### 1. Chain ID and Network Configuration
- Updated CHAIN_ID and NETWORK_ID from 222222 to 1001 to match the Xaheen private chain configuration
- Updated NODE_NAME to "xaheen-bsc-validator-1" for better identification

### 2. BTCBR Contract Address
- Maintained the BTCBR contract address at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262 to ensure consistency with mainnet

### 3. AWS Infrastructure Alignment
- Updated documentation to include AWS-specific considerations:
  - EC2 instance requirements (8 cores, 64GB RAM)
  - Security group configurations for P2P and RPC endpoints
  - IAM roles for S3 access
  - Backup strategies using cloud storage

### 4. Docker Configuration
- Updated docker-compose.yml with the correct network ID (1001)
- Set the node identity to "xaheen-bsc-validator-1"
- Maintained port mappings for RPC (8545), WebSocket (8546), and P2P (30303)

### 5. Environment Variables
- Updated .env file with the correct CHAIN_ID and NETWORK_ID values
- Maintained all other configuration parameters

## Files Updated

1. **migrate-to-bsc.sh** - Main migration script with updated chain ID and network configuration
2. **docker-compose.yml** - Docker deployment configuration with correct network settings
3. **.env** - Environment variables with proper chain ID and network ID
4. **README.md** - Documentation updated with AWS infrastructure considerations

## Validation
All configuration files have been validated to ensure:
- Consistent chain ID (1001) across all components
- Proper BTCBR contract address preservation
- Correct port mappings for RPC, WebSocket, and P2P communication
- AWS infrastructure considerations included in documentation

## BTCBR Token Balance Addition (Latest Update)

### Problem
The BTCBR contract at `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` was deployed with correct metadata (name, symbol, decimals) but had no token balances initialized in the genesis file.

### Solution
Added storage slots to the genesis file to initialize:
- **Total Supply**: 21 septillion BTCBR tokens (21,000,000,000 × 10^18)
- **Your Balance**: Full 21 septillion BTCBR tokens to wallet `0x81bDAf1ac2094D5133937B3361A38a4976E55acc`

### Storage Slots Added
```json
"storage": {
  "0x5e6f73c6909b67d15952495f8d23f75f9cfa8c123ed7e6e3768232efacba5b97": "0x43dacaf91c1a84ff08000000",
  "0x0000000000000000000000000000000000000000000000000000000000000003": "0x43dacaf91c1a84ff08000000"
}
```

### Files Created
1. **scripts/add-btcbr-balance.js** - Script to calculate and add BTCBR balance to genesis
2. **scripts/deploy-updated-genesis.sh** - Automated deployment script for AWS

### Deployment Instructions

#### Option 1: Automated Deployment (Recommended)
```bash
# Set your SSH key path
export SSH_KEY=~/.ssh/your-key.pem

# Run deployment script
./scripts/deploy-updated-genesis.sh
```

#### Option 2: Manual Deployment
```bash
# 1. Copy genesis file to AWS
scp -i ~/.ssh/your-key.pem data/genesis-updated.json ubuntu@3.91.50.187:~/genesis-updated.json

# 2. SSH to AWS instance
ssh -i ~/.ssh/your-key.pem ubuntu@3.91.50.187

# 3. Stop BSC node
cd /home/ubuntu/blockchain-v2
docker-compose down

# 4. Remove old data
sudo rm -rf /data/bsc/data/geth

# 5. Re-initialize with new genesis
docker run --rm \
    -v /data/bsc/data:/data \
    -v /home/ubuntu/genesis-updated.json:/genesis.json \
    bnbchain/bsc:v1.4.15 \
    geth --datadir /data init /genesis.json

# 6. Restart node
docker-compose up -d
```

### Verification
After deployment, verify BTCBR balance:
```bash
curl -X POST http://3.91.50.187:8545 \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{
            "to": "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
            "data": "0x70a0823100000000000000000000000081bdaf1ac2094d5133937b3361a38a4976e55acc"
        }, "latest"],
        "id": 1
    }'
```

Expected result: `"result": "0x43dacaf91c1a84ff08000000"` (21 septillion)

### MetaMask Configuration
Add BTCBR token to MetaMask:
- **Token Address**: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
- **Token Symbol**: `BTCBR`
- **Decimals**: `18`

### Final State
- **Native BNB Balance**: 27.23 septillion (for gas fees)
- **BTCBR Token Balance**: 21 septillion (for transfers/trading)
- **Contract Metadata**: Correct (name, symbol, decimals)
- **Storage**: Properly initialized with balance mapping

## Next Steps
1. ✅ BTCBR balance added to genesis file
2. Deploy updated genesis to AWS using the deployment script
3. Verify BTCBR balance appears in MetaMask
4. Test token transfers and trading functionality
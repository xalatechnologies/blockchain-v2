# Chain ID Migration Guide: 885824 → 65001

This document provides a complete guide for migrating Xaheen Chain from chain ID 885824 to 65001.

## ⚠️ CRITICAL WARNING

**This is a breaking change that requires complete blockchain reinitialization.**

- All existing blockchain data will be incompatible
- All validators must be reinitialized
- Users must update their MetaMask configurations
- Bridge contracts may need redeployment (if already deployed)

## Overview

### What Changed
- **Old Chain ID**: 885824
- **New Chain ID**: 65001
- **Old Network ID**: 885824
- **New Network ID**: 65001

### What Stayed the Same
- Validator addresses and private keys
- BTCBR token contract address (will be redeployed at same address in genesis)
- RPC endpoints and port numbers
- All bridge contract code (but needs redeployment)
- Docker and infrastructure configuration

## Why Change Chain ID?

1. **Branding**: 65001 is more memorable and professional for Xaheen Chain
2. **Simplicity**: Cleaner number easier to remember than 885824
3. **Uniqueness**: Better positioning in the blockchain ecosystem
4. **Marketing**: Aligns with Xaheen Chain brand identity

## Migration Steps

### Phase 1: Backup Current State

⚠️ **DO THIS FIRST** - You cannot recover without backups!

```bash
# Backup current blockchain data
cd ~/bsc-production  # or wherever your nodes are
mkdir -p ../backups/chain-885824-backup-$(date +%Y%m%d)
cp -r validator-1/geth ../backups/chain-885824-backup-$(date +%Y%m%d)/
cp -r validator-2/geth ../backups/chain-885824-backup-$(date +%Y%m%d)/
cp -r validator-3/geth ../backups/chain-885824-backup-$(date +%Y%m%d)/

# Backup genesis file
cp config/genesis.json ../backups/chain-885824-backup-$(date +%Y%m%d)/genesis-old.json

# Backup validator keys (if not already backed up)
cp -r validator-1/keystore ../backups/validator-keys-backup-$(date +%Y%m%d)/
cp validator-1/password.txt ../backups/validator-keys-backup-$(date +%Y%m%d)/
```

### Phase 2: Update Genesis File

You need to regenerate the genesis file with the new chain ID:

```bash
# Option 1: Manual edit of existing genesis.json
# Edit config/genesis.json and change:
# "chainId": 885824  →  "chainId": 65001

# Option 2: Regenerate genesis using script
./scripts/generate-validators.sh
# Then manually update CHAIN_ID=65001 in the script before running
```

**Key Genesis Fields to Update:**

```json
{
  "config": {
    "chainId": 65001,  // Changed from 885824
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "ramanujanBlock": 0,
    "nielsBlock": 0,
    "parlia": {
      "period": 3,
      "epoch": 200
    }
  },
  // ... rest of genesis stays the same
}
```

### Phase 3: Stop All Validators

```bash
# Stop all running validators
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3

# Remove containers
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3

# Verify stopped
docker ps | grep bsc-validator
# Should return nothing
```

### Phase 4: Delete Old Blockchain Data

⚠️ **Make sure you have backups before running these commands!**

```bash
cd ~/bsc-production  # or your deployment directory

# Delete blockchain data (but keep keystore and config)
rm -rf validator-1/geth
rm -rf validator-2/geth
rm -rf validator-3/geth

# Delete static-nodes.json (will be regenerated)
rm -f validator-1/static-nodes.json
rm -f validator-2/static-nodes.json
rm -f validator-3/static-nodes.json

# Keep these files:
# - validator-*/keystore/*  (validator keys)
# - validator-*/password.txt
# - config/genesis.json (updated with new chain ID)
```

### Phase 5: Reinitialize Validators with New Chain ID

```bash
cd ~/bsc-production

# Initialize validator 1 with new genesis
docker run --rm \
  -v $(pwd)/validator-1:/bsc \
  -v $(pwd)/config/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 2
docker run --rm \
  -v $(pwd)/validator-2:/bsc \
  -v $(pwd)/config/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 3
docker run --rm \
  -v $(pwd)/validator-3:/bsc \
  -v $(pwd)/config/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Verify initialization
ls -la validator-1/geth
ls -la validator-2/geth
ls -la validator-3/geth
# Should see chaindata/ and lightchaindata/ directories
```

### Phase 6: Start Validator 1 (Primary)

```bash
docker run -d \
  --name bsc-validator-1 \
  --network host \
  -v $(pwd)/validator-1:/bsc \
  -v $(pwd)/validator-1/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --syncmode full \
  --gcmode archive \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api eth,net,web3,txpool \
  --http.corsdomain "*" \
  --http.vhosts "*" \
  --ws \
  --ws.addr 0.0.0.0 \
  --ws.port 8546 \
  --ws.origins "*" \
  --port 30303 \
  --password /password.txt \
  --unlock 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
  --mine \
  --miner.etherbase 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
  --allow-insecure-unlock \
  --maxpeers 25

# Wait for startup
sleep 10

# Check logs
docker logs bsc-validator-1

# Get enode address
docker logs bsc-validator-1 2>&1 | grep "enode://"
```

### Phase 7: Start Validators 2 and 3

```bash
# Start validator 2
docker run -d \
  --name bsc-validator-2 \
  --network host \
  -v $(pwd)/validator-2:/bsc \
  -v $(pwd)/validator-2/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --port 30304 \
  --password /password.txt \
  --unlock 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
  --mine \
  --miner.etherbase 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
  --allow-insecure-unlock \
  --maxpeers 25

# Start validator 3
docker run -d \
  --name bsc-validator-3 \
  --network host \
  -v $(pwd)/validator-3:/bsc \
  -v $(pwd)/validator-3/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 65001 \
  --port 30305 \
  --password /password.txt \
  --unlock 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
  --mine \
  --miner.etherbase 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
  --allow-insecure-unlock \
  --maxpeers 25

# Wait for startup
sleep 10

# Get all enode addresses
echo "=== Validator 1 Enode ==="
docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1

echo "=== Validator 2 Enode ==="
docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1

echo "=== Validator 3 Enode ==="
docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1
```

### Phase 8: Configure Static Nodes for Peering

```bash
# Extract enode addresses and create static-nodes.json for each validator
ENODE1=$(docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1 | sed 's/.*\(enode:\/\/[^@]*@[^?]*\).*/\1/' | sed 's/@[^:]*:/@127.0.0.1:/')
ENODE2=$(docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1 | sed 's/.*\(enode:\/\/[^@]*@[^?]*\).*/\1/' | sed 's/@[^:]*:/@127.0.0.1:/')
ENODE3=$(docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1 | sed 's/.*\(enode:\/\/[^@]*@[^?]*\).*/\1/' | sed 's/@[^:]*:/@127.0.0.1:/')

# Create static-nodes.json for each validator
echo "[$ENODE2, $ENODE3]" > validator-1/static-nodes.json
echo "[$ENODE1, $ENODE3]" > validator-2/static-nodes.json
echo "[$ENODE1, $ENODE2]" > validator-3/static-nodes.json

# Restart validators to apply peering
docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3

# Wait for restart
sleep 15
```

### Phase 9: Verification

```bash
# Test 1: Check chain ID via RPC
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Expected: {"jsonrpc":"2.0","id":1,"result":"0xfde9"}  (65001 in hex)

# Test 2: Check block number
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# Should return a block number (starts from 0 again)

# Test 3: Check peer count
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
# Expected: {"jsonrpc":"2.0","id":1,"result":"0x2"}  (2 peers)

# Test 4: Check network ID
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
# Expected: {"jsonrpc":"2.0","id":1,"result":"65001"}

# Test 5: Check BTCBR contract exists
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}'
# Should return contract bytecode (long hex string starting with 0x)

# Test 6: Check BTCBR balance
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x70a08231000000000000000000000000dD779a290C937144F80Eb75b75d814c834536B1b"},"latest"],"id":1}'
# Should return your initial BTCBR balance from genesis
```

### Phase 10: Update Bridge Contracts (If Already Deployed)

If you had bridge contracts deployed on the old chain (885824), you need to redeploy them:

```bash
# Redeploy bridges to new chain
cd /Volumes/Development/sahalat/blockchain-v2

# Deploy to BSC mainnet (if not already done)
npx hardhat run scripts/hardhat-deploy-mainnet.js --network bsc

# Deploy to new Xaheen Chain (chain ID 65001)
npx hardhat run scripts/hardhat-deploy-private.js --network btcbr

# Or use complete deployment script
./scripts/deploy-bridge-complete.sh
```

## User Migration

### MetaMask Configuration Update

Users need to update their MetaMask network configuration:

**Option 1: Delete and Re-add Network**

1. Open MetaMask
2. Go to Settings → Networks
3. Delete "Xaheen Chain" (or old BitcoinBR network)
4. Click "Add Network" → "Add a network manually"
5. Enter new configuration:
   - **Network Name**: Xaheen Chain
   - **RPC URL**: https://rpc.xaheen.org
   - **Chain ID**: 65001
   - **Currency Symbol**: XHT
   - **Block Explorer URL**: https://explorer.xaheen.org (or leave blank)
6. Click "Save"

**Option 2: Deep Link for Easy Addition**

Share this link with users:
```
https://chainlist.org/?search=65001
```

Or create a custom deep link (requires web interface):
```javascript
ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0xFDE9', // 65001 in hex
    chainName: 'Xaheen Chain',
    rpcUrls: ['https://rpc.xaheen.org'],
    nativeCurrency: {
      name: 'Xaheen Token',
      symbol: 'XHT',
      decimals: 18
    },
    blockExplorerUrls: ['https://explorer.xaheen.org']
  }]
});
```

### Wallet Balances

**Important**: All balances from the old chain (885824) are lost unless:
1. You preserved balances in the new genesis.json
2. Users had bridged assets that can be re-bridged

The main wallet should retain its BTCBR balance if properly configured in genesis.

## Troubleshooting

### Problem: Chain ID Mismatch Error

**Error**: "ChainId mismatch: expected 65001, got 885824"

**Solution**:
- Verify genesis.json has `"chainId": 65001`
- Ensure all validators were reinitialized with new genesis
- Check that old blockchain data was fully deleted
- Restart all validators

### Problem: Validators Not Peering

**Error**: Peer count is 0

**Solution**:
```bash
# Recreate static-nodes.json files
# Follow Phase 8 again
# Restart validators
docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3
```

### Problem: RPC Endpoint Returns Old Chain ID

**Error**: eth_chainId returns 0xd8440 (885824) instead of 0xfde9 (65001)

**Solution**:
- Old node is still running somewhere
- Check for cached genesis or old Docker containers
- Verify you're connecting to correct endpoint

### Problem: BTCBR Contract Not Found

**Error**: eth_getCode returns "0x" (no code)

**Solution**:
- Genesis file doesn't include BTCBR bytecode
- Need to redeploy BTCBR contract or regenerate genesis with contract code
- Check that genesis initialization completed successfully

## Rollback Plan (Emergency)

If something goes wrong and you need to rollback:

```bash
# Stop new validators
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3

# Delete new chain data
rm -rf validator-*/geth

# Restore old chain data
cp -r ../backups/chain-885824-backup-YYYYMMDD/geth validator-1/
cp -r ../backups/chain-885824-backup-YYYYMMDD/geth validator-2/
cp -r ../backups/chain-885824-backup-YYYYMMDD/geth validator-3/

# Restore old genesis
cp ../backups/chain-885824-backup-YYYYMMDD/genesis-old.json config/genesis.json

# Reinitialize with old chain ID (885824)
# Follow normal startup procedure with chain ID 885824
```

## Post-Migration Checklist

- [ ] All 3 validators running and mining
- [ ] Peer count = 2 for each validator
- [ ] Block number increasing
- [ ] Chain ID returns 65001 (0xfde9)
- [ ] Network ID returns 65001
- [ ] BTCBR contract deployed and accessible
- [ ] Main wallet has correct BTCBR balance
- [ ] RPC endpoint accessible at https://rpc.xaheen.org
- [ ] MetaMask configured with new chain ID
- [ ] Bridge contracts redeployed (if applicable)
- [ ] Documentation updated
- [ ] Users notified of chain ID change

## Timeline Recommendation

**Do NOT perform this migration on a live production network without proper planning!**

### Recommended Approach:

1. **Week 1**: Test migration on local development node
2. **Week 2**: Announce upcoming chain ID change to users
3. **Week 3**: Scheduled maintenance window for migration
4. **Week 4**: Monitor and support users with migration

### Maintenance Window:

- Schedule 2-4 hour downtime window
- Notify all users 7 days in advance
- Notify again 24 hours in advance
- Provide clear migration instructions
- Have support team ready

## Hex Conversions

For reference:

- **65001 in hex**: 0xFDE9
- **65001 in decimal**: 65001
- **Old 885824 in hex**: 0xD8440

## Summary

This migration changes the fundamental identity of your blockchain network. It's a significant change that requires:

1. ⚠️ Complete blockchain reinitialization
2. ⚠️ All validators must be updated
3. ⚠️ All users must update MetaMask
4. ⚠️ All deployed contracts become inaccessible (must redeploy)
5. ⚠️ All historical transactions are lost (unless genesis preserves balances)

**Benefits**:
- Cleaner, more memorable chain ID (65001)
- Better branding alignment with Xaheen Chain
- Professional identity in blockchain ecosystem

**Once completed, the old chain (885824) and new chain (65001) are completely separate networks.**

Good luck with your migration! 🚀

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Blockchain V2** is a private BNB Smart Chain (BSC/Parlia-PoSA) node implementation for the **Xaheen Chain** network with comprehensive bridge infrastructure for cross-chain token transfers.

**Key Details:**
- **Chain Name**: Xaheen Chain
- **Domain**: xaheen.org
- **Chain ID**: 65001
- **Network ID**: 65001
- **Native Token**: XHT (Xaheen Token)
- **Block Time**: 3 seconds (Parlia consensus)
- **BTCBR Contract**: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262 (bridged token from BSC mainnet)
- **RPC Endpoint**: https://rpc.xaheen.org (or https://rpc.bitcoinbr.tech during migration)
- **JSON-RPC Port**: 8545
- **WebSocket Port**: 8546
- **P2P Port**: 30303

## Architecture Overview

### Three-Layer Architecture

1. **Blockchain Layer** - Private BSC/Parlia network
   - Parlia PoSA consensus (Proof of Staked Authority)
   - Multi-validator setup (3 validators: ports 30303, 30304, 30305)
   - Docker-based validator deployment
   - Genesis configuration with pre-funded accounts and BTCBR contract bytecode

2. **Bridge Layer** - 22 different bridge implementations
   - **Production bridges** (6): Lock/Mint, Atomic Swap, Liquidity Pool, Timelock, NFT
   - **Experimental bridges** (8): Optimistic, ZK, Oracle, MEV, Prediction Market, Reversible, Streaming, Fractal
   - **Theoretical bridges** (8): Flash, Social, Game Theory, AI, Quantum, DNA, Telepathic, Multiverse
   - Multi-signature validation (2 of 3 validators required)
   - Transfer limits and fee structures (0.1% mainnet→private, 0.2% private→mainnet)

3. **Infrastructure Layer** - Ansible automation and AWS deployment
   - Automated infrastructure provisioning
   - Nginx SSL/HTTPS configuration
   - Multi-validator orchestration
   - Blockscout explorer integration

## Essential Commands

### Hardhat Development

```bash
# Compile all smart contracts
npx hardhat compile

# Deploy bridge to BSC mainnet
npx hardhat run scripts/hardhat-deploy-mainnet.js --network bsc

# Deploy bridge to private Xaheen Chain
npx hardhat run scripts/hardhat-deploy-private.js --network btcbr

# Deploy to BSC testnet (for testing)
npx hardhat run scripts/hardhat-deploy-mainnet.js --network bscTestnet

# Deploy to local development node
npx hardhat run scripts/deploy-*.js --network localhost
```

### Bridge Deployment

```bash
# Complete bridge deployment (mainnet + private chain)
./scripts/deploy-bridge-complete.sh

# Deploy all 22 bridge types
./scripts/deploy-all-bridges.sh

# Quick deployment script
./scripts/deploy-bridges-now.sh

# Day 2 bridge deployment (after initial setup)
node scripts/deploy-bridge-day2.js
```

### Node Operations

```bash
# Check RPC endpoint health
./scripts/check-rpc.sh

# Connect to existing Xaheen network
./scripts/connect-to-network.sh

# Initialize BSC node
./scripts/init-bsc-node.sh

# Migrate from Geth to BSC
./migrate-to-bsc.sh
```

### Infrastructure Management (Ansible)

```bash
cd infrastructure/ansible

# Deploy complete infrastructure
ansible-playbook playbooks/setup-all.yml

# Connect to existing network
ansible-playbook playbooks/connect-to-network.yml

# Deploy Blockscout explorer
ansible-playbook playbooks/deploy-explorer.yml

# Deploy BSC validator nodes
ansible-playbook playbooks/deploy-bsc.yml
```

### AWS Deployment

```bash
# Deploy to AWS
./scripts/aws-deploy.sh

# Setup SSL/HTTPS on production
./scripts/setup-nginx-ssl.sh

# Setup multi-validator configuration
./scripts/setup-production-multi-validator.sh

# Upgrade AWS instance to t3.large
./scripts/upgrade-to-t3-large.sh
```

### Validator Management

```bash
# Generate validator accounts
./scripts/generate-validators.sh

# Setup 3 validators
./scripts/setup-validators.sh

# Fix HTTPS and P2P connectivity
./scripts/fix-https-and-p2p.sh

# Fix SSH access issues
./scripts/fix-ssh-access.sh
```

### Smart Contract Interactions

```bash
# Send BTCBR tokens
node scripts/send-btcbr-now.js

# Transfer BTCBR
node scripts/transfer-btcbr.js

# Add BTCBR balance to account
node scripts/add-btcbr-balance.js

# Deploy mintable BTCBR contract
node scripts/deploy-mintable-btcbr.js

# Atomic swap helper
node scripts/atomic-swap-helper.js
```

## Critical Configuration Files

### Environment Variables (.env)

**REQUIRED** environment variables:
- `MAIN_WALLET_PRIVATE_KEY` - Main wallet private key for deployments
- `MAINNET_PRIVATE_KEY` - BSC mainnet deployer key (for bridge deployment)
- `PRIVATE_CHAIN_KEY` - Xaheen Chain deployer key
- `BSC_MAINNET_RPC` - BSC mainnet RPC URL
- `PRIVATE_CHAIN_RPC` - Xaheen Chain RPC URL (https://rpc.xaheen.org)
- `BSCSCAN_API_KEY` - For contract verification (optional)

**Network Configuration:**
- `VALIDATOR_ADDRESS` - Primary validator address
- `CHAIN_ID=65001` - Xaheen Chain ID
- `NETWORK_ID=65001` - Xaheen Chain network ID
- `BTCBR_ADDR=0x0cF8e180350253271f4b917CcFb0aCCc4862F262`

### Hardhat Configuration (hardhat.config.js)

Networks configured:
- `bsc` - BSC Mainnet (chainId: 56, gasPrice: 3 gwei)
- `bscTestnet` - BSC Testnet (chainId: 97, gasPrice: 10 gwei)
- `btcbr` - Xaheen Chain (chainId: 65001, gasPrice: 1 gwei)
- `localhost` - Local development (chainId: 65001)

Solidity version: **0.8.20** with optimizer enabled (200 runs)

## Bridge Architecture Details

### Primary Production Bridges

**1. BTCBRBridgeMainnet.sol** (Lock & Mint - Mainnet Side)
- Locks BTCBR tokens on BSC mainnet
- Emits deposit events for validators
- Multi-sig validation (2 of 3 validators)
- Transfer limits: 100 - 100,000 BTCBR per transfer
- Daily limit: 500,000 BTCBR per address
- Fee: 0.1% (minimum 10 BTCBR)

**2. BTCBRBridgePrivate.sol** (Lock & Mint - Private Side)
- Mints BTCBR on private chain when locked on mainnet
- Burns BTCBR on private chain for withdrawal
- Same multi-sig validation
- Fee: 0.2% for private→mainnet (minimum 20 BTCBR)
- Requires MINTER_ROLE on BTCBR contract

**3. AtomicSwap.sol** (HTLC - Trustless P2P)
- Hash Time-Locked Contracts for trustless swaps
- No third-party validators needed
- Uses cryptographic secrets and timelocks
- Fully decentralized

**4. LiquidityPoolBridge.sol** (AMM-based)
- Fast transfers using liquidity pools
- Similar to Uniswap/PancakeSwap mechanism
- Instant transfers when liquidity available
- LP providers earn fees

**5. NFTBridge.sol** (ERC721 Wrapper)
- Each bridge transfer becomes an NFT
- Tradeable bridge receipts
- Unique collectible aspect
- Can be used for proof-of-transfer

**6. TimelockBridge.sol** (Vesting)
- Time-locked token releases
- Useful for team vesting, gradual unlocks
- Configurable unlock schedules

### Validator Configuration

**Three validator addresses** (multi-sig 2-of-3):
1. `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD`
2. `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
3. `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`

Validators verify cross-chain transfers and co-sign transactions.

## Genesis Configuration

Genesis files are located in `data/`:
- Pre-funded accounts with BNB for gas
- BTCBR contract bytecode embedded at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- Validator extraData in Parlia format
- Initial supply: 10.5 septillion BTCBR for main wallet
- **Chain ID**: 65001 (must match in genesis.json)

**Important**: Genesis changes (including chain ID) require full node reinitialization:
```bash
# Stop nodes, delete blockchain data
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3
rm -rf validator-*/geth

# Reinitialize with new genesis
docker run --rm -v $(pwd)/validator-1:/bsc -v $(pwd)/config/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Restart validators
./scripts/setup-production-multi-validator.sh
```

## Docker Deployment

Validators run in Docker containers using `dysnix/bsc` image:
- Validator 1: RPC/WS exposed (ports 8545, 8546, 30303)
- Validator 2: P2P only (port 30304)
- Validator 3: P2P only (port 30305)

All validators use `--network host` for direct port access.

## Development Workflow

### Adding a New Bridge Type

1. Create contract in `contracts/bridges/production/` (or experimental/theoretical)
2. Add deployment script in `scripts/deploy-[bridge-name].js`
3. Configure Hardhat networks in `hardhat.config.js`
4. Set environment variables for private keys and RPC endpoints
5. Test on BSC testnet first: `--network bscTestnet`
6. Deploy to mainnet: `--network bsc`
7. Deploy to private chain: `--network btcbr`
8. Document in `docs/` folder

### Modifying Validator Configuration

1. Update validator addresses in bridge contracts
2. Regenerate genesis with new validators: `./scripts/generate-validators.sh`
3. Reinitialize all validator nodes (see Genesis Configuration section)
4. Update `.env` with new `VALIDATOR_ADDRESS`
5. Restart all validators and verify peer connections

### Testing RPC Connectivity

```bash
# Check block number
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check peer count
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Check BTCBR balance
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x70a08231000000000000000000000000[ADDRESS_WITHOUT_0x]"},"latest"],"id":1}'
```

## Important Security Considerations

1. **Private Keys**: NEVER commit `.env` files. Already in `.gitignore`.
2. **Validator Keys**: Stored in `data/keystore/` (gitignored)
3. **Password Files**: `data/password.txt` is gitignored
4. **Multi-sig**: Production bridges require 2-of-3 validator signatures
5. **Transfer Limits**: Enforced to prevent large unauthorized drains
6. **Emergency Pause**: Owner can pause all bridge transfers if needed

## Project Type and Module System

This project uses **ES modules** (`"type": "module"` in package.json).

**All JavaScript files use:**
- `import` / `export` syntax (NOT `require`)
- `.js` extension (NOT `.cjs` or `.mjs`)
- Top-level `await` is supported

Example:
```javascript
import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
```

## Common Issues and Solutions

### "Error: insufficient funds for gas"
- Ensure deployer wallet has BNB on the target network
- For mainnet: Need real BNB (~$10)
- For private chain: Use pre-funded accounts in genesis

### "Error: VM Exception while processing transaction: revert"
- Check if bridge has MINTER_ROLE on BTCBR contract
- Verify validator signatures are correct
- Check transfer amounts are within limits (100 - 100,000 BTCBR)

### "Error: network does not exist"
- Check `hardhat.config.js` network configuration
- Verify RPC URL is accessible
- Ensure private key is set in `.env`

### Validators not peering
- Check `static-nodes.json` files in each validator directory
- Verify enode addresses are correct (use `docker logs bsc-validator-X`)
- Ensure P2P ports (30303-30305) are open
- Restart validators after updating static-nodes.json

### Bridge deployment fails on private chain
1. Ensure BTCBR contract exists at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
2. Verify genesis file includes BTCBR bytecode
3. Check deployer has BNB for gas on private chain
4. Use `--network btcbr` flag with correct RPC URL

## Documentation Structure

Comprehensive docs in `docs/` folder:

**Bridge Documentation:**
- `QUICK_START.md` - Fast bridge deployment guide
- `BRIDGE_DEPLOYMENT_SIMPLE.md` - Detailed deployment walkthrough
- `ALL_BRIDGE_TYPES.md` - Complete index of 22 bridge types
- `BTCBR_BRIDGE_ARCHITECTURE.md` - Lock/Mint architecture
- `BRIDGE_TYPES_COMPARISON.md` - Feature comparison matrix
- `ATOMIC_SWAP_GUIDE.md` - HTLC implementation details
- `DAY2_BRIDGE_DEPLOYMENT.md` - Post-deployment operations

**Infrastructure Documentation:**
- `MAINNET_PRODUCTION_DEPLOYMENT.md` - Production deployment guide
- `MULTI_VALIDATOR_SETUP.md` - Validator configuration
- `NGINX_SSL_SETUP.md` - HTTPS/SSL setup
- `RPC_CONNECTION_GUIDE.md` - RPC connectivity
- `infrastructure.md` - Ansible automation overview

**Launch Documentation:**
- `PUBLIC_LAUNCH_CHECKLIST.md` - Pre-launch verification
- `LAUNCH_QUICK_REFERENCE.md` - Quick reference for launch day
- `DEPLOYMENT_COMPLETE.md` - Deployment status tracking

## Ansible Infrastructure Automation

Located in `infrastructure/ansible/`:

**Playbooks:**
- `setup-all.yml` - Complete infrastructure setup
- `deploy-bsc.yml` - BSC validator deployment
- `connect-to-network.yml` - Connect to existing network
- `deploy-explorer.yml` - Blockscout explorer deployment
- `setup-ssl.yml` - SSL/HTTPS configuration

**Inventory:**
- `inventory/hosts` - Server definitions and groups

**Variables:**
- `group_vars/` - Group-level configuration
- Environment-specific settings

## Dependencies

**Core:**
- `hardhat` ^3.0.9 - Ethereum development environment
- `ethers` ^6.15.0 - Ethereum library
- `@openzeppelin/contracts` ^4.9.6 - Secure smart contract library
- `web3` ^4.16.0 - Web3 JavaScript library
- `dotenv` ^17.2.3 - Environment variable management
- `solc` ^0.8.20 - Solidity compiler

**Hardhat Plugins:**
- `@nomicfoundation/hardhat-ethers` - Ethers.js integration
- `@nomicfoundation/hardhat-toolbox` - Essential tools bundle

## Quick Start for New Developers

1. **Clone and install dependencies:**
   ```bash
   cd /Volumes/Development/sahalat/blockchain-v2
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env  # If exists, otherwise create .env
   # Edit .env with your private keys and RPC URLs
   ```

3. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

4. **Test on BSC testnet first:**
   ```bash
   # Get testnet BNB from faucet: https://testnet.binance.org/faucet-smart
   npx hardhat run scripts/hardhat-deploy-mainnet.js --network bscTestnet
   ```

5. **Deploy to production:**
   ```bash
   # Mainnet + Private chain complete deployment
   ./scripts/deploy-bridge-complete.sh
   ```

6. **Verify deployment:**
   ```bash
   ./scripts/check-rpc.sh
   ```

## Key Differences from Standard BSC/Ethereum Projects

1. **Custom Genesis**: Pre-funded accounts and embedded BTCBR contract bytecode
2. **Parlia Consensus**: 3-second blocks, validator-based (not PoW)
3. **Multi-Chain Architecture**: Mainnet + Private chain bridging
4. **22 Bridge Types**: Far beyond typical single-bridge projects
5. **Docker-Based Validators**: All validators run in containers
6. **Static Peering**: Validators use static-nodes.json for P2P discovery
7. **ES Modules**: Import/export syntax, not CommonJS require

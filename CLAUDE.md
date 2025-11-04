# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nor Chain** (نور - "Light") is a next-generation Layer-1 blockchain engineered to illuminate the future of compliant finance with decentralized innovation. It merges a **regulated foundation**—aligned with NSM, ISO 27001, GDPR, and AAOIFI—with the openness and liquidity of public markets.

**Mission**: To empower the future of blockchain technology with light, trust, and inclusive innovation—enabling ethical, transparent financial systems across emerging economies through compliant, decentralized infrastructure.

**Vision**: A world where anyone can transact, invest, and build in a transparent halal-compliant environment illuminated by clarity, governed by verified institutions yet open to the public.

### Core Technical Specs

- **Chain Name**: Nor Chain
- **Domain**: norchain.org (migrating from xaheen.org)
- **Chain ID**: 65001 (0xFDE9) - **UNCHANGED**
- **Network ID**: 65001
- **Native Token**: NOR (Nor Token)
  - **Supply**: 21 billion (24 decimals)
  - **Use Cases**: Gas, staking, liquidity, governance, fund subscriptions
- **Block Time**: 3 seconds (Parlia PoSA consensus)
- **Epoch Length**: 10,000 blocks (~8.3 hours) - **TESTING CONFIGURATION FOR EPOCH REVALIDATION**
  - Production will use 9,000,000 blocks (~1.5 years)
- **Validators**: 3 active + 2 standby
- **Finality**: < 30 seconds
- **BTCBR Contract**: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262 (bridged token from BSC mainnet)
- **RPC Endpoint**: https://rpc.norchain.org (currently https://rpc.xaheen.org during migration)
- **JSON-RPC Port**: 8545
- **WebSocket Port**: 8546
- **P2P Port**: 30303

### Core Philosophy

1. **Ethical by Design** — No interest (riba), no gharar (excessive uncertainty), transparent risk-sharing
2. **Compliant by Default** — GDPR, AAOIFI, NSM, and ISO 27001 mapped into smart-contract templates
3. **Intelligent by Architecture** — AI-driven validators, liquidity, and compliance agents
4. **Inclusive by Access** — Publicly readable, permissionless use with verified-governance validators
5. **Sustainable by Operation** — Low-energy PoSA consensus + carbon-offset program

## Ecosystem Components

Nor Chain is the anchor of a complete financial and technological ecosystem:

| Component | Purpose | Status |
|-----------|---------|--------|
| **Nor Chain (L1)** | Core blockchain running PoSA consensus with 3s blocks and 9M-block epochs | ✅ Production |
| **Dirhamat** | AED/Gold-backed Shariah-compliant stable-asset | 🔄 Development |
| **Digital KES** | Stable digital Kenyan Shilling aligned with CBK sandbox | 🔄 Development |
| **NordCoin** | Nordic-compliant currency focused on ESG reporting and EU MiCA | 🔄 Development |
| **Nor Wallet** | Chrome Extension + Mobile wallet for cross-chain assets | 🔄 Development |
| **NorSwap (DEX)** | Native decentralized exchange with hybrid liquidity routing | ✅ Deployed |
| **Nor Bridge** | Cross-chain vault and router system (BSC, Polygon, Ethereum) | ✅ Deployed |
| **Nor Funds** | On-chain halal mutual and retirement funds | 🔄 Development |
| **Compliance Core (XCC)** | Smart-contract framework for AML/KYC/GDPR/AAOIFI rules | 🔄 Development |
| **Nor AI Agents** | Autonomous agents handling liquidity, compliance, and governance | 🔄 Development |

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

# Deploy bridge to private Nor Chain
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

# Connect to existing Nor Chain network
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

# Apply documented working configuration (RECOMMENDED)
./scripts/nor-apply-documented-fix.sh
```

### Working Validator Configuration (Nov 2, 2025)

**Status**: ✅ **VERIFIED WORKING** - Blocks producing with 2-3 stable peers

This is the EXACT configuration that successfully produces blocks. Key differences from other approaches:

#### Critical Success Factors

1. **Container Creation**: Use `docker run -d` (NOT `docker create` + `docker start`)
2. **Enode Discovery**: Use `geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode"` (NOT docker logs parsing)
3. **Asymmetric Configuration**: Only Validator 1 has `--syncmode full --gcmode archive`
4. **Miner Flags**: Use both `--miner.etherbase` AND `--unlock`
5. **Permissions**: Use `sudo` to write static-nodes.json files

#### Validator 1 (RPC + Mining)

```bash
docker run -d --name xaheen-rpc --network host \
    -v /home/ec2-user/validator-1:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --syncmode full \
    --gcmode archive \
    --http --http.addr 0.0.0.0 --http.port 8545 \
    --http.vhosts "*" --http.corsdomain "*" \
    --http.api eth,net,web3,txpool,personal,admin \
    --ws --ws.addr 0.0.0.0 --ws.port 8546 \
    --ws.origins "*" --ws.api eth,net,web3,txpool \
    --mine --miner.threads=1 \
    --miner.etherbase 0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE \
    --unlock 0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE \
    --password /bsc/password.txt \
    --allow-insecure-unlock \
    --port 30303 \
    --maxpeers 25
```

#### Validator 2 (Mining Only - NO --syncmode or --gcmode)

```bash
docker run -d --name bsc-validator-2 --network host \
    -v /home/ec2-user/validator-2:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --port 30304 \
    --unlock 0x689CF2C189781d9bB6859A830acbF64044E4432f \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase 0x689CF2C189781d9bB6859A830acbF64044E4432f \
    --allow-insecure-unlock \
    --maxpeers 25
```

#### Validator 3 (Mining Only - NO --syncmode or --gcmode)

```bash
docker run -d --name bsc-validator-3 --network host \
    -v /home/ec2-user/validator-3:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \
    --port 30305 \
    --unlock 0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a \
    --password /bsc/password.txt \
    --mine --miner.threads=1 \
    --miner.etherbase 0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a \
    --allow-insecure-unlock \
    --maxpeers 25
```

#### Static Peering Setup

```bash
# Get enodes using geth attach (CRITICAL - use this method, not docker logs)
ENODE1=$(docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE2=$(docker exec bsc-validator-2 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')
ENODE3=$(docker exec bsc-validator-3 geth attach /bsc/geth.ipc --exec "admin.nodeInfo.enode" 2>/dev/null | sed 's/@[0-9.]*:/@127.0.0.1:/')

# Create static-nodes.json files (use sudo for permissions)
sudo bash -c "echo '[\"$ENODE2\", \"$ENODE3\"]' > /home/ec2-user/validator-1/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE3\"]' > /home/ec2-user/validator-2/static-nodes.json"
sudo bash -c "echo '[\"$ENODE1\", \"$ENODE2\"]' > /home/ec2-user/validator-3/static-nodes.json"

# Restart validators to apply static peering
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3
```

**Expected Result**: Blocks producing with 2-3 stable peer connections within 20 seconds.

**Reference Documentation**: `/docs/00-critical/NOOR_CHAIN_SUCCESS_EPOCH_10K.md`

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
- `PRIVATE_CHAIN_KEY` - Nor Chain deployer key
- `BSC_MAINNET_RPC` - BSC mainnet RPC URL
- `PRIVATE_CHAIN_RPC` - Nor Chain RPC URL (https://rpc.norchain.org, currently https://rpc.xaheen.org)
- `BSCSCAN_API_KEY` - For contract verification (optional)

**Network Configuration:**
- `VALIDATOR_ADDRESS` - Primary validator address
- `CHAIN_ID=65001` - Nor Chain ID
- `NETWORK_ID=65001` - Nor Chain network ID
- `BTCBR_ADDR=0x0cF8e180350253271f4b917CcFb0aCCc4862F262`

### Hardhat Configuration (hardhat.config.js)

Networks configured:
- `bsc` - BSC Mainnet (chainId: 56, gasPrice: 3 gwei)
- `bscTestnet` - BSC Testnet (chainId: 97, gasPrice: 10 gwei)
- `btcbr` - Nor Chain (chainId: 65001, gasPrice: 1 gwei)
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

### Nor Chain Ultimate Genesis (Nov 3, 2025)

**Status**: ✅ **PRODUCTION READY** - Complete genesis with all contracts and sorted validators

The ultimate genesis includes:
- ✅ **Correctly sorted validators** (prevents ALL epoch issues forever)
- ✅ **NOR Token** (NOT NOR!) with reserved address
- ✅ **Sequential contract addresses** (F262-F269)
- ✅ **Pre-funded accounts** (100M NOR each for gas)
- ✅ **BTCBR integration** (existing bridge contract)
- ✅ **Future-proof architecture** (DEX, stablecoins, wrapped tokens)

#### Genesis Files

| File | Purpose | Status |
|------|---------|--------|
| **`data/genesis-nor-ultimate.json`** | Production ultimate genesis with all contracts | ✅ Ready |
| **`data/genesis-clean.json`** | Simple genesis with sorted validators only | ✅ Working |
| `data/genesis-production-ultimate.json` | Old version (has placeholder bytecode) | ⚠️ Deprecated |

#### Generate Ultimate Genesis

```bash
# Generate new ultimate genesis
node scripts/generate-nor-ultimate-genesis.js

# Verify genesis created
cat data/genesis-nor-ultimate.json | jq '.config.chainId, .config.parlia.epoch'
```

#### Reserved Contract Addresses (Sequential)

All contract addresses are **deterministic** and **sequential** starting from BTCBR:

```javascript
const BASE_ADDRESS = '0x0cF8e180350253271f4b917CcFb0aCCc4862F262';

// Sequential addresses (offset from base)
BTCBR:            0x0cF8e180350253271f4b917CcFb0aCCc4862F262  // +0 (existing)
NOR_TOKEN:        0x0cf8e180350253271f4b917ccfb0accc4862f263  // +1 (deploy next)
NOORSWAP_FACTORY: 0x0cf8e180350253271f4b917ccfb0accc4862f264  // +2
NOORSWAP_ROUTER:  0x0cf8e180350253271f4b917ccfb0accc4862f265  // +3
DIRHAMAT:         0x0cf8e180350253271f4b917ccfb0accc4862f266  // +4
DIGITAL_KES:      0x0cf8e180350253271f4b917ccfb0accc4862f267  // +5
NORDCOIN:         0x0cf8e180350253271f4b917ccfb0accc4862f268  // +6
WNOR:             0x0cf8e180350253271f4b917ccfb0accc4862f269  // +7
```

#### Deploy Ultimate Genesis to Production

```bash
# 1. Upload genesis to production server
scp -i ~/.ssh/bsc-validator-key.pem data/genesis-nor-ultimate.json ec2-user@3.91.50.187:/home/ec2-user/

# 2. Backup current chain data
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 \
  "tar -czf blockchain-backup-$(date +%Y%m%d).tar.gz validator-*"

# 3. Reinitialize all validators
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187 << 'EOF'
docker stop xaheen-rpc bsc-validator-2 bsc-validator-3
docker rm xaheen-rpc bsc-validator-2 bsc-validator-3
rm -rf validator-*/geth

# Reinit with new genesis
docker run --rm -v $(pwd)/validator-1:/bsc -v $(pwd)/genesis-nor-ultimate.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v $(pwd)/validator-2:/bsc -v $(pwd)/genesis-nor-ultimate.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
docker run --rm -v $(pwd)/validator-3:/bsc -v $(pwd)/genesis-nor-ultimate.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
EOF

# 4. Start validators with verified configuration
bash scripts/fix-static-nodes-properly.sh
```

#### Genesis Validator Ordering (CRITICAL!)

The **ONLY** critical requirement for epoch stability is **lexicographically sorted lowercase validators** in extradata:

```
✅ CORRECT (Sorted):
0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a
0x689cf2c189781d9bb6859a830acbf64044e4432f
0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de

❌ WRONG (Unsorted):
0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE  # Capital letters, wrong order
0x689CF2C189781d9bB6859A830acbF64044E4432f
0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a
```

**Why This Matters**: Parlia consensus revalidates the validator set at every epoch boundary. If validators aren't sorted, the revalidation fails and the chain deadlocks at blocks 10,000, 20,000, etc.

**Documentation**: See `NOOR_ULTIMATE_GENESIS_COMPLETE.md` for complete details.

### Legacy Genesis Files

Genesis files are located in `data/`:
- Pre-funded accounts with BNB for gas
- BTCBR contract bytecode embedded at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- Validator extraData in Parlia format
- Initial supply: 10.5 septillion BTCBR for main wallet
- **Chain ID**: 65001 (must match in genesis.json)

**Important**: Genesis changes (including chain ID) require full node reinitialization (see deployment steps above).

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

## Governance Framework

Nor Chain balances **institutional accountability** with **community participation**.

### Governance Layers

| Layer | Participants | Decision Scope |
|-------|--------------|----------------|
| **Council DAO** | 5 signers (UAE, Kenya, Nordic institutions, Nor Chain Foundation) | Protocol changes, validator on/offboarding, treasury |
| **Validator DAO** | All active validators + delegators | Consensus params, epoch policy |
| **Community DAO** | Token holders (staked NOR ≥ 10,000) | Grant funding, feature votes |
| **AI Advisory Layer** | Autonomous agents with read-only rights | Forecast models, risk alerts |

### Voting Mechanics
- Weighted 1 vote per NOR (staked)
- Minimum participation quorum 15%
- Council supermajority (3 of 5) for critical actions
- AI Advisors propose parameter tweaks → require DAO approval

## Compliance & Regulatory Alignment

### Compliance Core (XCC)

The Nor Chain Compliance Core is a modular smart-contract framework providing:

1. **KYC Registry**: Off-chain verification hash anchored on-chain
2. **AML Monitoring**: Integrates with Chainalysis/Elliptic feeds
3. **Jurisdiction Tagging**: Transactions carry region metadata for travel rule
4. **Freeze/Thaw**: Regulated token issuers can freeze illicit funds under court order
5. **Data Retention**: PII stored off-chain with hash link only; user can revoke consent

### Regulatory Standards

| Framework | Coverage | Nor Implementation |
|-----------|----------|----------------------|
| **UAE VARA/ADGM** | VASP licensing & stablecoin oversight | Dirhamat issuer licensed; audit proofs on-chain |
| **Kenya CBK/CMA** | Digital KES VASP + fund licensing | Sandbox pilot registered; AML module integrated |
| **EU GDPR/MiCA** | Data protection & crypto-asset issuance | XCC GDPR mode; MiCA e-money alignment |
| **AAOIFI** | Islamic finance Shariah standards | Shariah Oracle and SSB certification |
| **NSM Security** | Critical infrastructure baseline (Norway) | HSM, ISO 27001 ops, audited validators |

## AI Integration Layer

### AI Agents

AI agents operate as micro-services with read-only RPC access and on-chain reporting rights:

| Agent | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| **Validator Health Agent** | Predict node downtime | Block latency, ping metrics | Rotation alerts |
| **Liquidity Agent** | Balance DEX/bridge pools | TVL, price feeds | Swap recommendations |
| **Compliance AI** | Flag high-risk transactions | XCC logs, wallet scores | Risk scores |
| **NAV AI** | Reconcile fund NAV and market data | Oracle feeds | NAV variance alerts |
| **Governance AI** | Model impact of policy changes | DAO data | Forecast reports |

### Ethical AI Principles

1. **Transparency**: All model outputs are verifiable and open for review
2. **No autonomy over funds**: AI cannot sign financial transactions
3. **Privacy-by-design**: Complies with GDPR & AAOIFI ethics
4. **Explainability**: Every decision traceable to inputs
5. **Bias mitigation**: Regular audits using diverse datasets

## Halal Financial Products

Nor Funds enables creation and management of **Shariah-compliant investment vehicles**, positioning Nor Chain as the **financial backbone** for:
- **UAE & GCC Islamic banks** seeking Shariah-compliant tokenization
- **Fintechs** needing ready-made halal-compliant infrastructure
- **Real-estate developers** issuing tokenized ijārah or sukuk
- **Zakat & Charity organizations** tracking transparent distribution
- **Global investors** seeking ethical ESG-aligned returns

> "Nor Chain connects capital with conscience — illuminating finance with purpose and turning investment into impact."

### Fund Types

| Fund Type | Shariah Structure | Example Assets | Return Mechanism |
|-----------|------------------|----------------|------------------|
| **Gold Savings Fund** | Murābaḥah / Wakālah | Vaulted gold, Dirhamat | Gold appreciation, trade profit |
| **Sukuk Income Fund** | Muḍārabah | Investment-grade sukuk | Rental/lease income |
| **Halal Equity Index** | Wakālah | AAOIFI-screened equities | Dividends + capital gains |
| **Real Estate Ijārah** | Mushārakah / Ijārah | Income property | Rent distribution |
| **SME Partnership** | Mushārakah | Halal SMEs | Profit/loss share |
| **Liquidity Park** | Commodity Murābaḥah | Short-term trades | Markup profit |
| **Waqf Impact Fund** | Waqf / Tabarru' | Social projects | Capped-fee/impact KPIs |
| **Takaful Reserve Pool** | Tabarru' | Insurance operations | Cooperative risk-sharing |

### Business Integration Path (Institutional Partners)

**Step 1 – Institution On-boarding**: Partners complete compliance registration via XCC (AML/KYC + AAOIFI certification)

**Step 2 – Fund Deployment**: Each partner receives a **Fund Router** smart contract with branding & fee configuration

**Step 3 – Investor Access**: Nor Wallet & APIs expose subscription, NAV, and redemption flows

**Step 4 – Reporting & Governance**: Daily NAV + fatwa hashes published on-chain → regulator & auditor dashboards

### Industry-Specific Value Propositions

| Industry | Challenge | Nor Chain Solution |
|-----------|------------|----------------|
| **Banks** | Legacy core systems, lack of blockchain integration | Plug-and-play tokenization via Nor Chain API |
| **Real Estate** | Liquidity lock-in & fractional ownership barriers | On-chain Ijārah tokens + DEX liquidity |
| **Fintechs** | Compliance burden & slow licensing | Built-in AAOIFI & GDPR modules |
| **Charities** | Opaque fund flows & trust deficit | Transparent zakat & waqf tracking |
| **Governments** | Limited visibility on social impact | Real-time analytics via AI dashboards |

### Geographic Focus & Partnerships

| Region | Objective | Target Partners |
|--------|------------|-----------------|
| **UAE / GCC** | Gold & Dirhamat funds; sukuk tokenization | Islamic banks & ADGM/VARA-regulated entities |
| **Kenya / Africa** | Digital KES income funds; micro-finance | CBK sandbox institutions |
| **Nordics / EU** | ESG & NordCoin funds | Green investment groups |
| **Southeast Asia** | Takaful & SME funds (2026 expansion) | Malaysia & Indonesia Islamic banks |

### Ideal Partnership Profile

Nor Chain seeks partnerships with:
- Central banks & regulators
- Islamic financial institutions (banks, takaful companies)
- Fintech and payment companies
- Real-estate developers and REITs
- Zakat and charity foundations
- ESG and impact investment funds

**Why Partner with Nor Chain:**
- Shariah compliance & regulatory readiness out-of-the-box
- Rapid market entry with minimal technical overhead
- Global liquidity and transparent fund governance
- Demonstrable social impact and ESG alignment
- Illuminating finance with transparency, trust, and ethical innovation

**Contact**: partners@norchain.org | Website: norchain.org | Locations: Dubai | Oslo | Oman

### FundUnit Token Standard

Every investor position is represented by a **`FundUnit`** ERC-20-compatible token with:
- **KYC flag** (`isVerified`)
- **Transfer restriction hooks** per jurisdiction
- **NAV oracle binding** for valuation
- **Redemption lock** (`noticePeriod`, `gateLimit`)
- **Zakat metadata** (`purificationDue`, `charityTarget`)

### Zakat & Purification Engine
- Computes 2.5% annual zakat on eligible holdings
- Tracks incidental non-compliant income (purification)
- Auto-routes charity via CharityContract with public ledger

## Market Strategy & Launch Plan

### Launch Timeline (Indicative)

| Week | Milestone |
|------|-----------|
| 0 | Mainnet go-live + DEX pairs (NOR/USDT, Dirhamat/USDT) |
| 2 | Bridge activation to BSC & Polygon |
| 4 | $800,000 LP lock announcement + audit release |
| 6 | Gate.io or BitMart listing application |
| 8 | CMC & CoinGecko listing approval |
| 10 | Trust Wallet & MetaMask Chainlist integration |
| 12 | Press & community roadshow (MENA + Kenya) |

### Tokenomics

| Category | % | Vesting |
|----------|---|---------|
| Public Sale & Liquidity | 30 | Unlocked |
| Treasury & Grants | 25 | 24 mo linear |
| Team & Advisors | 15 | 18 mo cliff + 24 mo linear |
| Reserve (Treasury) | 20 | Locked 12 mo |
| Charity & Zakat Fund | 5 | Unlocked |
| Validators & Rewards | 5 | Dynamic epoch release |

## Roadmap (2025-2027)

| Quarter | Milestone |
|---------|-----------|
| Q1 2025 | Mainnet launch + DEX + Bridge activation |
| Q2 2025 | Halal Funds beta + AI agents v1 |
| Q3 2025 | First CEX listing + mobile wallet release |
| Q4 2025 | Public DAO launch + Compliance Dashboard |
| 2026 | CBDC pilot integration + Real-estate tokenization + Southeast Asia expansion (Malaysia & Indonesia) |
| 2027 | Global expansion + multi-region validator network |

## Key Differences from Standard BSC/Ethereum Projects

1. **Halal-Compliant Finance**: No interest (riba), no gharar, Shariah Oracle governance
2. **Hybrid Governance**: Institutional Council + Community DAO + AI Advisory Layer
3. **Compliance-Native**: GDPR, AAOIFI, NSM, MiCA built into smart contracts
4. **AI-Enhanced**: Autonomous agents for liquidity, compliance, and governance
5. **Multi-Asset Ecosystem**: Dirhamat, Digital KES, NordCoin, FundUnits beyond NOR
6. **Custom Genesis**: Pre-funded accounts and embedded BTCBR contract bytecode
7. **Parlia Consensus**: 9,000,000-block epochs (~1.5 years), 3-second blocks, validator-based (not PoW)
8. **Multi-Chain Architecture**: Mainnet + Private chain bridging with hub-and-spoke model
9. **22 Bridge Types**: Far beyond typical single-bridge projects
10. **Docker-Based Validators**: All validators run in containers with AI monitoring
11. **Static Peering**: Validators use static-nodes.json for P2P discovery
12. **ES Modules**: Import/export syntax, not CommonJS require

## Documentation & Playbook

For comprehensive vision, strategy, and technical details, see:
- **`docs/09-playbook/`** - Complete Nor Chain Playbook v3 (5 parts)
  - Part 1: Vision, Ecosystem & Philosophy
  - Part 2: Technical Foundations (Consensus → Cross-Chain DEX)
  - Part 3: Financial Products & Halal Funds
  - Part 4: Governance, Compliance & AI
  - Part 5: Market Strategy & Appendices

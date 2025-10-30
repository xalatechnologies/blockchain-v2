# Xaheen Chain - Where Intelligence Meets Blockchain 🧠⚡

**An intelligent, high-performance private blockchain network based on BNB Smart Chain (BSC/Parlia-PoSA) technology with comprehensive bridge infrastructure.**

## 🌟 Network Information

- **Chain Name**: Xaheen Chain
- **Domain**: xaheen.org
- **Chain ID**: 65001 (0xFDE9)
- **Network ID**: 65001
- **Native Token**: XHT (Xaheen Token)
- **Block Time**: 3 seconds
- **Consensus**: Parlia PoSA (Proof of Staked Authority)
- **Validators**: 3 validators (2-of-3 multi-sig)

## 🚀 Quick Start

**For deployment**, see: **[XAHEEN_DEPLOYMENT_READY.md](./XAHEEN_DEPLOYMENT_READY.md)**

### Add Xaheen Chain to MetaMask

1. Visit: `https://xaheen.org/add-to-metamask.html`
2. Or manually configure:
   ```
   Network Name:      Xaheen Chain
   RPC URL:           https://rpc.xaheen.org
   Chain ID:          65001
   Currency Symbol:   XHT
   Block Explorer:    https://explorer.xaheen.org
   ```

### Initialize Validators

```bash
# Initialize all 3 validators with Xaheen Chain genesis
./scripts/init-xaheen-validators.sh

# Start validators
./scripts/setup-production-multi-validator.sh

# Verify deployment
curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

## 📋 Project Overview

This directory contains the complete Xaheen Chain blockchain infrastructure including tools and scripts for deploying a private BNB Smart Chain (BSC/Parlia-PoSA) node with multi-validator support and comprehensive bridge architecture.

## Contents

- `migrate-to-bsc.sh` - One-shot migration script that:
  - Stops and backs up existing Geth data
  - Installs Docker, jq, and Python3 if missing
  - Manages validator accounts (import existing or create new)
  - Fetches BTCBR runtime bytecode from BSC mainnet
  - Generates Parlia genesis with validator in extraData
  - Initializes and starts a BSC node with mining enabled

- `scripts/` - Contains additional utility scripts:
  - `aws-deploy.sh` - AWS deployment script
  - `check-rpc.sh` - RPC endpoint validation script
  - `connect-to-network.sh` - Network connection script

- `infrastructure/` - Contains Ansible automation for infrastructure management:
  - `ansible/` - Ansible playbooks and configuration

## ✨ Key Features

- **Chain ID**: 65001 (Xaheen Chain) with XHT native token
- **3-Second Block Time**: Fast finality with Parlia PoSA consensus
- **Multi-Validator**: 3 validators with 2-of-3 multi-signature security
- **BTCBR Contract**: Deployed via genesis at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- **Bridge Infrastructure**: 22 different bridge implementations (6 production, 8 experimental, 8 theoretical)
- **Full EVM Compatibility**: Run any Ethereum smart contract
- **JSON-RPC & WebSocket**: Standard Ethereum API endpoints (8545, 8546)
- **Pre-Funded Accounts**: Genesis allocation for validators and operations

## 📦 Installation & Deployment

### Prerequisites

- Docker installed
- Node.js 16+ and npm
- Git

### Quick Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd blockchain-v2
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your private keys and configuration

# 3. Compile smart contracts
npm run compile

# 4. Initialize Xaheen Chain validators
./scripts/init-xaheen-validators.sh

# 5. Start validators
./scripts/setup-production-multi-validator.sh

# 6. Verify deployment
curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Expected: {"jsonrpc":"2.0","id":1,"result":"0xfde9"}
```

### Legacy Migration (Old Chain ID 885824)

If migrating from the old BitcoinBR network (Chain ID 885824):

1. See: **[docs/migration/CHAIN_ID_MIGRATION.md](./docs/migration/CHAIN_ID_MIGRATION.md)**
2. Backup existing data
3. Reinitialize with new genesis (Chain ID 65001)

## Docker Deployment

Alternatively, you can use the docker-compose setup:

1. Update the `.env` file with your validator address
2. Run `docker-compose up -d`

## Infrastructure Automation with Ansible

This project includes Ansible playbooks for infrastructure automation:

1. Navigate to the Ansible directory:
   ```bash
   cd infrastructure/ansible
   ```

2. Verify the inventory file at `inventory/hosts`

3. Run the setup playbook:
   ```bash
   ansible-playbook playbooks/setup-all.yml
   ```

4. Connect to the existing network:
   ```bash
   ansible-playbook playbooks/connect-to-network.yml
   ```

## AWS Infrastructure Considerations

When deploying on AWS, ensure you have:
- EC2 instance with sufficient resources (8 cores, 64GB RAM recommended)
- Security groups configured to allow:
  - SSH access (22/tcp) from your management IP
  - P2P networking (30303/tcp and 30303/udp)
  - RPC endpoints (8545/tcp for JSON-RPC, 8546/tcp for WebSocket)
- IAM roles for S3 access if using cloud storage for backups
- Proper backup strategies using S3 or other cloud storage solutions

## AWS Deployment

To deploy to AWS:

1. Configure your AWS credentials:
   ```bash
   aws configure
   ```

2. Run the AWS deployment script:
   ```bash
   ./scripts/aws-deploy.sh
   ```

## Connecting to Existing Network

To connect to the existing BitcoinBR network:

1. Ensure you have a validator key in the `data/keystore/` directory
2. Update the `.env` file with your validator address
3. Run the connection script:
   ```bash
   ./scripts/connect-to-network.sh
   ```

## RPC Endpoint Validation

To check the existing RPC endpoint:

```bash
./scripts/check-rpc.sh
```

## 📚 Documentation

**Complete documentation is organized in the [docs/](./docs/) folder.**

### Quick Links

- 📖 **[Documentation Index](./docs/README.md)** - Start here for all docs
- 🎨 **[Brand Guide](./docs/branding/XAHEEN_BRAND_GUIDE.md)** - Visual identity and branding
- 🔄 **[Chain ID Migration](./docs/migration/CHAIN_ID_MIGRATION.md)** - Migrate from 885824 to 65001
- 🌉 **[Bridge Quick Start](./docs/bridges/QUICK_START.md)** - Deploy bridges in 30 seconds
- 🏗️ **[Infrastructure Setup](./docs/infrastructure/MULTI_VALIDATOR_SETUP.md)** - Validator configuration
- 🚀 **[Launch Checklist](./docs/launch/PUBLIC_LAUNCH_CHECKLIST.md)** - Pre-launch verification

### Documentation Structure

```
docs/
├── branding/           # Visual identity, logos, brand guidelines
├── migration/          # Chain ID migration (885824 → 65001)
├── bridges/            # Bridge architecture and deployment (22 types)
├── infrastructure/     # Validators, RPC, SSL, deployment
├── launch/             # Public launch preparation
└── README.md          # Complete documentation index
```

See [DOCUMENTATION_STRUCTURE.md](./DOCUMENTATION_STRUCTURE.md) for complete file map.

## Next Steps

- Review [Brand Guidelines](./docs/branding/XAHEEN_BRAND_GUIDE.md)
- Complete [Chain ID Migration](./docs/migration/CHAIN_ID_MIGRATION.md)
- Deploy bridges using [Quick Start Guide](./docs/bridges/QUICK_START.md)
- Setup validators following [Infrastructure Guide](./docs/infrastructure/MULTI_VALIDATOR_SETUP.md)
- Prepare for launch with [Launch Checklist](./docs/launch/PUBLIC_LAUNCH_CHECKLIST.md)
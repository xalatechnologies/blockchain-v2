# Blockchain V2 - Private BNB Chain Migration

This directory contains the tools and scripts necessary to migrate from an AWS Geth node to a private BNB (BSC/Parlia-PoSA) node.

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

## Features

- Private BNB/Parlia chain with 3-second block times
- Chain ID: 885824 (BitcoinBR network)
- BTCBR contract deployed at the same address as BSC mainnet (0x0cF8e180350253271f4b917CcFb0aCCc4862F262)
- JSON-RPC (8545) and WS (8546) endpoints
- Clean path to add more validators

## Usage

1. Edit the variables at the top of `migrate-to-bsc.sh`:
   - CHAIN_ID (set to 885824 for BitcoinBR network)
   - NETWORK_ID (set to 885824)
   - Validator key source (import existing or create new)

2. Run the migration script:
   ```bash
   ./migrate-to-bsc.sh
   ```

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

## Next Steps

- Harden RPC by restricting to trusted IPs
- Add Blockscout explorer for browsing blocks/transactions/contracts
- Set up vault + wrapped token for bridging when ready
- Create snapshots of the data directory for backups
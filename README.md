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

## Features

- Private BNB/Parlia chain with 3-second block times
- Chain ID: 1001 (matching the Xaheen private chain configuration)
- BTCBR contract deployed at the same address as BSC mainnet (0x0cF8e180350253271f4b917CcFb0aCCc4862F262)
- JSON-RPC (8545) and WS (8546) endpoints
- Clean path to add more validators

## Usage

1. Edit the variables at the top of `migrate-to-bsc.sh`:
   - CHAIN_ID (set to 1001 to match Xaheen private chain)
   - NETWORK_ID (set to 1001)
   - Validator key source (import existing or create new)

2. Run the migration script:
   ```bash
   ./migrate-to-bsc.sh
   ```

## Docker Deployment

Alternatively, you can use the docker-compose setup:

1. Update the `.env` file with your validator address
2. Run `docker-compose up -d`

## AWS Infrastructure Considerations

When deploying on AWS, ensure you have:
- EC2 instance with sufficient resources (8 cores, 64GB RAM recommended)
- Security groups configured to allow:
  - SSH access (22/tcp) from your management IP
  - P2P networking (30303/tcp and 30303/udp)
  - RPC endpoints (8545/tcp for JSON-RPC, 8546/tcp for WebSocket)
- IAM roles for S3 access if using cloud storage for backups
- Proper backup strategies using S3 or other cloud storage solutions

## Next Steps

- Harden RPC by restricting to trusted IPs
- Add Blockscout explorer for browsing blocks/transactions/contracts
- Set up vault + wrapped token for bridging when ready
- Create snapshots of the data directory for backups
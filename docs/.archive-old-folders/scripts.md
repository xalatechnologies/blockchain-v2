# Scripts Documentation

This document provides an overview of the scripts available in the project.

## Main Scripts

### migrate-to-bsc.sh
The primary migration script that sets up a new BSC node with the following capabilities:
- Stops and backs up existing Geth data
- Installs Docker, jq, and Python3 if missing
- Manages validator accounts (import existing or create new)
- Fetches BTCBR runtime bytecode from BSC mainnet
- Generates Parlia genesis with validator in extraData
- Initializes and starts a BSC node with mining enabled

### setup.sh
Initial setup script that prepares the data directory and creates necessary files.

## Utility Scripts

All utility scripts are located in the `scripts/` directory.

### scripts/aws-deploy.sh
Automates the deployment of a BSC validator node to AWS with:
- Creation of EC2 instance with proper security groups
- Installation of required dependencies
- Deployment of the validator node

### scripts/check-rpc.sh
Validates connectivity to an existing RPC endpoint by:
- Testing basic connectivity
- Verifying chain ID and block height
- Checking BTCBR contract deployment
- Reporting peer count

### scripts/connect-to-network.sh
Connects a new node to the existing BitcoinBR network by:
- Verifying validator key availability
- Creating docker-compose override configuration
- Starting the node with proper network settings

## Usage Examples

### Run the main migration
```bash
./migrate-to-bsc.sh
```

### Check RPC endpoint
```bash
./scripts/check-rpc.sh
```

### Connect to existing network
```bash
./scripts/connect-to-network.sh
```

### Deploy to AWS
```bash
./scripts/aws-deploy.sh
```
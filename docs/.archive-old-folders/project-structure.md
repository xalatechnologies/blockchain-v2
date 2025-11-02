# Project Structure

This document describes the organization of the Blockchain V2 project.

## Directory Layout

```
.
├── data/                 # Persistent data storage
│   ├── keystore/         # Validator key storage
│   ├── password.txt      # Password for validator key
│   └── static-nodes.json # Static node configuration
├── docs/                 # Documentation files
│   └── project-structure.md
├── scripts/              # Utility scripts
│   ├── aws-deploy.sh     # AWS deployment script
│   ├── check-rpc.sh      # RPC endpoint validation
│   └── connect-to-network.sh # Network connection script
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── CHANGES_SUMMARY.md    # Summary of changes made
├── README.md             # Project overview
├── docker-compose.yml    # Docker service configuration
├── migrate-to-bsc.sh     # Main migration script
└── setup.sh              # Setup helper script
```

## Key Files

### Configuration Files
- `.env` - Environment variables for the project
- `docker-compose.yml` - Docker service definitions
- `data/password.txt` - Password for validator key encryption

### Scripts
- `migrate-to-bsc.sh` - Main migration script to set up a new BSC node
- `setup.sh` - Initial setup script
- `scripts/aws-deploy.sh` - AWS deployment automation
- `scripts/check-rpc.sh` - RPC endpoint validation
- `scripts/connect-to-network.sh` - Connect to existing network

### Data
- `data/keystore/` - Contains validator key files
- `data/static-nodes.json` - Static node configuration for peering

## Usage Patterns

### Initial Setup
```bash
./setup.sh
```

### Migration to BSC
```bash
./migrate-to-bsc.sh
```

### Docker Deployment
```bash
docker-compose up -d
```

### AWS Deployment
```bash
./scripts/aws-deploy.sh
```
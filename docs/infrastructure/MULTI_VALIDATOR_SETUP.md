# Multi-Validator BSC Network Setup

This guide explains how to set up a proper multi-validator BSC (Parlia-PoSA) network with peer-to-peer (P2P) networking.

## Why Multiple Validators?

A private BNB Chain using Parlia consensus requires multiple validators for:

1. **Security**: Multiple validators prevent single point of failure
2. **Consensus**: Parlia requires validator rotation for block production
3. **Fault Tolerance**: Network continues even if some validators go offline
4. **Decentralization**: Distributes control across multiple nodes

## Architecture

### Components

1. **Bootnode**
   - Facilitates peer discovery
   - Helps validators find each other
   - Does not participate in consensus

2. **Validators** (3+ recommended)
   - Produce blocks in rotation
   - Validate transactions
   - Maintain consensus
   - Connected via P2P network

3. **Static Nodes**
   - Permanent P2P connections between validators
   - Ensures network stability

### Network Topology

```
         ┌──────────────┐
         │   Bootnode   │
         └──────┬───────┘
                │
      ┌─────────┼─────────┐
      │         │         │
  ┌───▼───┐ ┌──▼────┐ ┌──▼────┐
  │ Val-1 ├─┤ Val-2 ├─┤ Val-3 │
  └───────┘ └───────┘ └───────┘
     │                    │
     └────────┬──────────┘
              │
          P2P Network
```

## Quick Setup

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM per validator
- Sufficient disk space (50GB+ recommended)

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
# Generate 3 validators (default)
./scripts/setup-validators.sh 3

# Start the network
docker-compose -f docker-compose-validators.yml --env-file .env.validators up -d
```

### Option 2: Manual Setup

1. **Generate Validators**
```bash
./scripts/generate-validators.sh 3
```

2. **Review Genesis File**
```bash
cat data/genesis-validators.json
```

3. **Initialize Validators**
```bash
for i in {1..3}; do
    docker run --rm \
        -v "$(pwd)/data/validators/validator-$i:/bsc" \
        -v "$(pwd)/data/genesis-validators.json:/genesis.json" \
        dysnix/bsc:latest \
        init --datadir /bsc /genesis.json
done
```

4. **Start Network**
```bash
docker-compose -f docker-compose-validators.yml --env-file .env.validators up -d
```

## Validator Configuration

### Genesis File

The genesis file (`data/genesis-validators.json`) contains:

- **config.parlia**: Parlia consensus parameters
  - `period`: Block time in seconds (3s)
  - `epoch`: Validator rotation epoch (200 blocks)
  
- **extraData**: Encoded validator addresses
  - 32 bytes: Vanity data
  - N × 20 bytes: Validator addresses
  - 65 bytes: Seal

- **alloc**: Pre-funded accounts
  - Each validator gets initial balance
  - BTCBR contract preloaded at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262

### P2P Configuration

Each validator maintains connections via:

1. **Bootnode**: For initial peer discovery
2. **Static Nodes**: Permanent connections to other validators

Static nodes configuration (`geth/static-nodes.json`):
```json
[
  "enode://<bootnode-id>@bootnode:30301",
  "enode://<validator-2-id>@validator-2:30303",
  "enode://<validator-3-id>@validator-3:30303"
]
```

## Verification

### Check Running Containers

```bash
docker-compose -f docker-compose-validators.yml ps
```

Expected output:
```
NAME               STATUS    PORTS
bsc-bootnode       Up        30301/tcp, 30301/udp
bsc-validator-1    Up        8545/tcp, 8546/tcp, 30303/tcp
bsc-validator-2    Up        8547/tcp, 8548/tcp, 30304/tcp
bsc-validator-3    Up        8549/tcp, 8550/tcp, 30305/tcp
```

### Check Peer Connections

```bash
# Validator 1
docker exec bsc-validator-1 geth attach --exec 'admin.peers.length' /bsc/geth.ipc

# Should return: 3 (bootnode + 2 other validators)
```

View detailed peer information:
```bash
docker exec bsc-validator-1 geth attach --exec 'admin.peers' /bsc/geth.ipc
```

### Check Block Production

```bash
# Check current block number
docker exec bsc-validator-1 geth attach --exec 'eth.blockNumber' /bsc/geth.ipc

# Check if mining
docker exec bsc-validator-1 geth attach --exec 'eth.mining' /bsc/geth.ipc

# Check validator address
docker exec bsc-validator-1 geth attach --exec 'eth.coinbase' /bsc/geth.ipc
```

### Check Network Sync

```bash
# Check sync status
docker exec bsc-validator-1 geth attach --exec 'eth.syncing' /bsc/geth.ipc

# Should return: false (not syncing, producing blocks)
```

## Monitoring

### View Logs

All validators:
```bash
docker-compose -f docker-compose-validators.yml logs -f
```

Specific validator:
```bash
docker logs -f bsc-validator-1
```

Bootnode:
```bash
docker logs -f bsc-bootnode
```

### Check Block Production Pattern

```bash
# Run this script to see which validator produced each block
docker exec bsc-validator-1 geth attach --exec '
for (var i = eth.blockNumber - 10; i <= eth.blockNumber; i++) {
  var block = eth.getBlock(i);
  console.log("Block", i, "miner:", block.miner);
}
' /bsc/geth.ipc
```

You should see blocks produced by different validators in rotation.

## Scaling

### Adding More Validators

1. **Stop the network**
```bash
docker-compose -f docker-compose-validators.yml down
```

2. **Generate new validators**
```bash
./scripts/generate-validators.sh 5  # Or desired number
```

3. **Update docker-compose-validators.yml**
   - Add new validator services
   - Update ports (8551, 8552, etc.)

4. **Reinitialize all validators**
```bash
for i in {1..5}; do
    docker run --rm \
        -v "$(pwd)/data/validators/validator-$i:/bsc" \
        -v "$(pwd)/data/genesis-validators.json:/genesis.json" \
        dysnix/bsc:latest \
        init --datadir /bsc /genesis.json
done
```

5. **Restart network**
```bash
docker-compose -f docker-compose-validators.yml --env-file .env.validators up -d
```

## RPC Endpoints

With multi-validator setup, you have multiple RPC endpoints:

- **Validator 1**: http://localhost:8545 (WebSocket: ws://localhost:8546)
- **Validator 2**: http://localhost:8547 (WebSocket: ws://localhost:8548)
- **Validator 3**: http://localhost:8549 (WebSocket: ws://localhost:8550)

### Load Balancing

For production, configure NGINX to load balance across validators:

```nginx
upstream bsc_validators {
    server 127.0.0.1:8545;
    server 127.0.0.1:8547;
    server 127.0.0.1:8549;
}

server {
    listen 443 ssl;
    server_name rpc.bitcoinbr.tech;
    
    location / {
        proxy_pass http://bsc_validators;
    }
}
```

## AWS Deployment

### Multi-Validator on Single Server

If deploying all validators on one AWS instance:

1. Ensure instance has sufficient resources:
   - **CPU**: 4+ vCPUs
   - **RAM**: 16GB+ (4GB per validator + bootnode)
   - **Disk**: 200GB+ SSD

2. Use docker-compose-validators.yml as-is

### Distributed Validators (Recommended)

For production, deploy each validator on separate AWS instances:

1. **Update Security Groups**
   - Allow P2P ports (30303-30305) between validators
   - Allow RPC access (8545-8550) as needed

2. **Update static-nodes.json**
   - Replace container names with actual IP addresses
   - Example: `enode://<id>@10.0.1.5:30303`

3. **Deploy Using Ansible**
```bash
cd infrastructure/ansible
ansible-playbook playbooks/deploy-validators.yml
```

## Troubleshooting

### Validators Not Connecting

Check network connectivity:
```bash
docker exec bsc-validator-1 geth attach --exec 'net.peerCount' /bsc/geth.ipc
```

If peer count is 0:
1. Check bootnode is running
2. Verify static-nodes.json is correct
3. Check firewall/security group rules

### Blocks Not Being Produced

1. **Check validator is unlocked**
```bash
docker logs bsc-validator-1 | grep -i unlock
```

2. **Verify mining is enabled**
```bash
docker exec bsc-validator-1 geth attach --exec 'miner.start()' /bsc/geth.ipc
```

3. **Check validator address in genesis**
```bash
# Extract validators from genesis extraData
cat data/genesis-validators.json | jq -r '.extraData'
```

### Out of Sync Issues

Force resync:
```bash
# Stop validator
docker-compose -f docker-compose-validators.yml stop validator-1

# Remove old data (keep keystore!)
rm -rf data/validators/validator-1/geth/chaindata

# Reinitialize
docker run --rm \
    -v "$(pwd)/data/validators/validator-1:/bsc" \
    -v "$(pwd)/data/genesis-validators.json:/genesis.json" \
    dysnix/bsc:latest \
    init --datadir /bsc /genesis.json

# Restart
docker-compose -f docker-compose-validators.yml up -d validator-1
```

## Best Practices

1. **Backup Validator Keys**
   - Regularly backup `data/validators/validator-*/keystore`
   - Store securely, encrypted

2. **Monitor Peer Count**
   - Should always be >= 2 (other validators + bootnode)
   - Set up alerts if peer count drops

3. **Monitor Block Production**
   - Track block production rate
   - Alert if no blocks produced in epoch period

4. **Secure RPC Access**
   - Use NGINX with SSL
   - Implement rate limiting
   - Restrict access via firewall

5. **Regular Updates**
   - Keep BSC client updated
   - Test updates on testnet first

6. **Disaster Recovery**
   - Document recovery procedures
   - Test validator replacement
   - Maintain backup validators

## Resources

- [BSC Documentation](https://docs.bnbchain.org/)
- [Parlia Consensus](https://docs.bnbchain.org/docs/learn/consensus)
- [Validator Guide](https://docs.bnbchain.org/docs/validator/overview)

# BSC Private Chain - Ansible Deployment

Automated deployment for BSC private chain with BTCBR token, native balances, P2P networking, and HTTPS endpoints.

## Prerequisites

1. **Ansible** installed on your local machine
2. **SSH Key**: `bsc-validator-key.pem` in workspace root or `~/.ssh/`
3. **AWS Access**: Security group configured for your IP
4. **DNS** (optional): `rpc.bitcoinbr.tech` pointing to `3.91.50.187`

## Quick Start

### 1. Test Connectivity

```bash
cd infrastructure/ansible
ansible bsc_validators -i inventory/hosts -m raw -a "echo 'Connection OK'"
```

### 2. Deploy Complete BSC Chain

This playbook deploys:
- ✅ Genesis with BTCBR token (10.5 septillion)
- ✅ Native BNB balances (1000 BNB per wallet)
- ✅ 3 validators with P2P networking
- ✅ Block production setup

```bash
ansible-playbook -i inventory/hosts playbooks/deploy-bsc-simple.yml
```

### 3. Setup HTTPS (Optional)

Requires DNS `rpc.bitcoinbr.tech` → `3.91.50.187`

```bash
ansible-playbook -i inventory/hosts playbooks/setup-nginx-bsc.yml
```

## Configuration

### Inventory

Edit `inventory/hosts` to change server details:

```ini
[bsc_validators]
bsc-main ansible_host=3.91.50.187 ansible_user=ec2-user ansible_ssh_private_key_file=/path/to/key.pem
```

### Variables

Edit `group_vars/bsc.yml` for:
- Chain ID
- Token balances
- Validator addresses
- Network ports

## Playbooks

### deploy-bsc-simple.yml

Main deployment playbook using `raw` module (Python 3.7 compatible):

```bash
ansible-playbook -i inventory/hosts playbooks/deploy-bsc-simple.yml
```

**What it does:**
1. Uploads genesis file with BTCBR and native BNB
2. Stops existing validators
3. Removes old blockchain data
4. Initializes 3 validators with genesis
5. Starts validators with correct parameters
6. Configures P2P static nodes
7. Verifies deployment (peers, blocks, balances)

**Duration:** ~1.5 minutes

### setup-nginx-bsc.yml

NGINX reverse proxy with SSL:

```bash
ansible-playbook -i inventory/hosts playbooks/setup-nginx-bsc.yml
```

**What it does:**
1. Installs NGINX and Certbot
2. Obtains Let's Encrypt SSL certificate
3. Configures reverse proxy with rate limiting
4. Sets up auto-renewal (every 12 hours)
5. Enables HTTPS and WSS endpoints

## Verification

After deployment, verify:

```bash
# Check peers (should be 2)
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Check native BNB (should be 1000 BNB = 0x3635c9adc5dea00000)
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xdD779a290C937144F80Eb75b75d814c834536B1b","latest"],"id":1}'

# Check BTCBR balance (should be 10.5 septillion)
curl -s http://3.91.50.187:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x70a08231000000000000000000000000dD779a290C937144F80Eb75b75d814c834536B1b"},"latest"],"id":1}'
```

## Troubleshooting

### SSH Connection Issues

If you get "Permission denied":

1. Check your IP is allowed in security group:
```bash
aws ec2 describe-security-groups --group-ids sg-05893730dea8a0a5f
```

2. Add your IP:
```bash
MY_IP=$(curl -4 -s ifconfig.me)
aws ec2 authorize-security-group-ingress \
  --group-id sg-05893730dea8a0a5f \
  --protocol tcp --port 22 --cidr $MY_IP/32
```

3. Or use the automated script:
```bash
../../scripts/fix-ssh-access.sh
```

### Python Version Issues

The playbooks use `raw` module to avoid Python compatibility issues. If you see Python errors, ensure:

```bash
# Test raw module works
ansible bsc_validators -i inventory/hosts -m raw -a "python3 --version"
```

### Block Production Not Starting

Wait 2-3 minutes for Parlia consensus to stabilize. Check validator logs:

```bash
ssh ec2-user@3.91.50.187 'docker logs -f bsc-validator-1'
```

## Network Information

After successful deployment:

| Parameter | Value |
|-----------|-------|
| **Chain ID** | 885824 |
| **Network Name** | BTCBR Private BSC |
| **HTTP RPC** | `http://3.91.50.187:8545` |
| **HTTPS RPC** | `https://rpc.bitcoinbr.tech` |
| **WebSocket** | `ws://3.91.50.187:8546` |
| **WSS** | `wss://rpc.bitcoinbr.tech/ws` |
| **Symbol** | BNB |
| **BTCBR Contract** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` |

## MetaMask Setup

1. **Add Network:**
   - Network Name: `BTCBR Private BSC`
   - RPC URL: `https://rpc.bitcoinbr.tech`
   - Chain ID: `885824`
   - Currency Symbol: `BNB`

2. **Add BTCBR Token:**
   - Token Address: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
   - Token Symbol: `BTCBR`
   - Decimals: `18`

3. **Import Wallet:**
   - Use your wallet's private key
   - You should see: 1000 BNB + 10.5 septillion BTCBR

## File Structure

```
infrastructure/ansible/
├── ansible.cfg              # Ansible configuration (Python 3.7 compatible)
├── inventory/
│   └── hosts               # Server inventory
├── group_vars/
│   ├── all.yml            # Legacy Cosmos config
│   └── bsc.yml            # BSC chain variables
├── playbooks/
│   ├── deploy-bsc-simple.yml     # ✅ Main deployment (use this)
│   ├── deploy-bsc-complete.yml   # Advanced (requires Python 3.8+)
│   ├── setup-nginx-bsc.yml       # HTTPS setup
│   └── setup-nginx-ssl.yml       # Legacy
└── README.md              # This file
```

## Maintenance

### Restart Validators

```bash
ansible bsc_validators -i inventory/hosts -m raw -a "docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3"
```

### Check Logs

```bash
ansible bsc_validators -i inventory/hosts -m raw -a "docker logs --tail 50 bsc-validator-1"
```

### Update Genesis

1. Edit `../../data/genesis-btcbr-fixed.json`
2. Re-run deployment:
```bash
ansible-playbook -i inventory/hosts playbooks/deploy-bsc-simple.yml
```

## Support

- Check validator logs for errors
- Ensure security group allows required ports (22, 8545, 8546, 30303-30305)
- Verify DNS points to correct IP (for HTTPS)
- Use `../../scripts/fix-ssh-access.sh` for automated SSH troubleshooting

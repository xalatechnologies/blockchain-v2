# 🚀 Xaheen Chain - Quick Start Guide

**Where Intelligence Meets Blockchain** 🧠⚡

---

## 📋 Network Details

| Parameter | Value |
|-----------|-------|
| **Chain Name** | Xaheen Chain |
| **Chain ID** | 65001 (0xFDE9) |
| **Network ID** | 65001 |
| **Native Token** | XHT (Xaheen Token) |
| **RPC URL** | https://rpc.xaheen.org |
| **WebSocket** | wss://ws.xaheen.org |
| **Block Explorer** | https://explorer.xaheen.org |
| **Block Time** | 3 seconds |
| **Consensus** | Parlia PoSA |

---

## ⚡ Quick Deploy (3 Steps)

### Step 1: Initialize Validators

```bash
./scripts/init-xaheen-validators.sh
```

**What it does:**
- Stops existing validators
- Backs up old chain data
- Initializes 3 validators with Chain ID 65001
- Verifies genesis file

### Step 2: Start Network

```bash
./scripts/setup-production-multi-validator.sh
```

**Validators start:**
- Validator 1: Ports 8545 (RPC), 8546 (WS), 30303 (P2P)
- Validator 2: Port 30304 (P2P)
- Validator 3: Port 30305 (P2P)

### Step 3: Verify Deployment

```bash
# Check Chain ID (should return 0xfde9)
curl -s http://localhost:8545 -X POST \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Check block production (should increase)
curl -s http://localhost:8545 -X POST \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check peer count (should be 2)
curl -s http://localhost:8545 -X POST \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
```

---

## 🌐 Add to MetaMask

### Automated (Recommended)

Visit: **https://xaheen.org/add-to-metamask.html**

Or open locally:
```bash
open add-xaheen-to-metamask.html
```

### Manual Configuration

1. Open MetaMask
2. Click "Add Network" or "Custom RPC"
3. Enter details:

```
Network Name:      Xaheen Chain
RPC URL:           https://rpc.xaheen.org
Chain ID:          65001
Currency Symbol:   XHT
Block Explorer:    https://explorer.xaheen.org
```

---

## 🔧 Development Setup

### Prerequisites

```bash
# Check Docker
docker --version

# Check Node.js (16+)
node --version

# Check npm
npm --version
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your private keys
nano .env
```

**Required variables:**
- `CHAIN_ID=65001`
- `NETWORK_ID=65001`
- `MAIN_WALLET_PRIVATE_KEY=your_key_here`

### Compile Contracts

```bash
npm run compile
```

---

## 📦 Bridge Deployment

### Deploy to BSC Mainnet

```bash
npm run deploy:mainnet
```

### Deploy to Xaheen Chain

```bash
npm run deploy:xaheen
```

### Deploy All Bridges

```bash
npm run deploy:bridges
```

---

## 🔐 Important Addresses

### BTCBR Contract

```
Address: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
Type:    ERC20 (Mintable)
Method:  Deployed via genesis
```

### Validators (2-of-3 Multi-sig)

```
Validator 1: 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD
Validator 2: 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3
Validator 3: 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5
```

### Pre-Funded Accounts (1000 XHT each)

```
EOA:         0x81bDAf1ac2094D5133937B3361A38a4976E55acc
Main Wallet: 0xdd779a290c937144f80eb75b75d814c834536b1b
+ All 3 validators
```

---

## 🛠️ Common Commands

### Check RPC Health

```bash
./scripts/check-rpc.sh
```

### View Validator Logs

```bash
# Validator 1
docker logs -f bsc-validator-1

# Validator 2
docker logs -f bsc-validator-2

# Validator 3
docker logs -f bsc-validator-3
```

### Stop Validators

```bash
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3
```

### Restart Validators

```bash
docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3
```

### Check BTCBR Contract

```bash
# Get contract code (should return long bytecode)
curl -s http://localhost:8545 -X POST \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}'

# Get token name (should return "BitcoinBR")
curl -s http://localhost:8545 -X POST \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x06fdde03"},"latest"],"id":1}'

# Get token symbol (should return "BTCBR")
curl -s http://localhost:8545 -X POST \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x95d89b41"},"latest"],"id":1}'
```

### Check Account Balance

```bash
# Replace ADDRESS with actual address (without 0x)
curl -s http://localhost:8545 -X POST \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xADDRESS","latest"],"id":1}'
```

---

## 📚 Documentation

### Essential Guides

| Document | Description |
|----------|-------------|
| **[XAHEEN_DEPLOYMENT_READY.md](./XAHEEN_DEPLOYMENT_READY.md)** | Complete deployment guide with verification |
| **[CLAUDE.md](./CLAUDE.md)** | Technical reference for developers |
| **[docs/README.md](./docs/README.md)** | Master documentation index |
| **[REBRANDING_COMPLETE.md](./REBRANDING_COMPLETE.md)** | Rebranding summary |

### Specialized Guides

| Document | Topic |
|----------|-------|
| **[docs/migration/CHAIN_ID_MIGRATION.md](./docs/migration/CHAIN_ID_MIGRATION.md)** | Migrating from old Chain ID |
| **[docs/branding/XAHEEN_BRAND_GUIDE.md](./docs/branding/XAHEEN_BRAND_GUIDE.md)** | Brand identity and design |
| **[docs/bridges/QUICK_START.md](./docs/bridges/QUICK_START.md)** | Bridge deployment |
| **[docs/infrastructure/MULTI_VALIDATOR_SETUP.md](./docs/infrastructure/MULTI_VALIDATOR_SETUP.md)** | Validator configuration |

---

## 🐛 Troubleshooting

### Validators Not Starting

```bash
# Check Docker
docker ps -a | grep bsc-validator

# Check logs for errors
docker logs bsc-validator-1

# Restart Docker daemon
sudo systemctl restart docker  # Linux
# or restart Docker Desktop      # Mac/Windows
```

### No Peer Connections

```bash
# Check static-nodes.json exists
ls -la validator-*/static-nodes.json

# Restart validators
docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3

# Check P2P ports are open
netstat -an | grep -E "30303|30304|30305"
```

### Wrong Chain ID

```bash
# Reinitialize with correct genesis
./scripts/init-xaheen-validators.sh

# Verify genesis file
grep -A 1 '"chainId"' data/genesis-xaheen-65001.json
```

### BTCBR Contract Not Found

```bash
# Contract should be in genesis
grep "0x0cF8e180350253271f4b917CcFb0aCCc4862F262" data/genesis-xaheen-65001.json

# If missing, reinitialize validators
./scripts/init-xaheen-validators.sh
```

---

## 🎯 Expected Results

### Successful Deployment

```json
// eth_chainId
{"jsonrpc":"2.0","id":1,"result":"0xfde9"}

// eth_blockNumber (increasing)
{"jsonrpc":"2.0","id":1,"result":"0x123"}

// net_peerCount (should be 2)
{"jsonrpc":"2.0","id":1,"result":"0x2"}
```

### Validator Status

```bash
$ docker ps | grep bsc-validator

bsc-validator-1    Up    0.0.0.0:8545->8545/tcp, 0.0.0.0:8546->8546/tcp
bsc-validator-2    Up    network host
bsc-validator-3    Up    network host
```

---

## 💡 Quick Tips

1. **Always check Chain ID first** after initialization:
   ```bash
   curl -s http://localhost:8545 -X POST -H 'Content-Type: application/json' \
     --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```

2. **Monitor block production**:
   ```bash
   watch -n 3 'curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}"'
   ```

3. **Keep validators updated**:
   ```bash
   docker pull dysnix/bsc
   ```

4. **Backup keystore files** regularly:
   ```bash
   tar -czf keystores-backup-$(date +%Y%m%d).tar.gz validator-*/keystore/
   ```

5. **Check disk space** (blockchain grows over time):
   ```bash
   du -sh validator-*/geth
   ```

---

## 🔗 Useful Links

### Documentation
- [Complete Deployment Guide](./XAHEEN_DEPLOYMENT_READY.md)
- [Technical Reference](./CLAUDE.md)
- [Brand Guide](./docs/branding/XAHEEN_BRAND_GUIDE.md)
- [Migration Guide](./docs/migration/CHAIN_ID_MIGRATION.md)

### Tools
- [MetaMask Integration](./add-xaheen-to-metamask.html)
- [Environment Template](./.env.example)
- [Validator Init Script](./scripts/init-xaheen-validators.sh)

### Network Endpoints (Production)
- RPC: https://rpc.xaheen.org
- WebSocket: wss://ws.xaheen.org
- Explorer: https://explorer.xaheen.org
- Docs: https://docs.xaheen.org

---

## 📞 Support

### Common Issues
- Check [XAHEEN_DEPLOYMENT_READY.md](./XAHEEN_DEPLOYMENT_READY.md) Troubleshooting section
- Review validator logs: `docker logs bsc-validator-X`
- Verify genesis file has Chain ID 65001

### For Help
- Review documentation in `docs/` folder
- Check existing issues and solutions
- Verify all prerequisites are met

---

## ✅ Deployment Checklist

Before going live:

- [ ] Chain ID verified as 65001 (0xFDE9)
- [ ] All 3 validators running
- [ ] Peer count = 2 for each validator
- [ ] Blocks being produced every 3 seconds
- [ ] BTCBR contract deployed at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- [ ] Pre-funded accounts have 1000 XHT
- [ ] RPC endpoint responding
- [ ] WebSocket endpoint responding
- [ ] MetaMask integration tested
- [ ] Block explorer configured

---

**Xaheen Chain - Where Intelligence Meets Blockchain!** 🧠⚡

**Chain ID**: 65001 | **Token**: XHT | **Block Time**: 3s

For detailed deployment instructions, see: **[XAHEEN_DEPLOYMENT_READY.md](./XAHEEN_DEPLOYMENT_READY.md)**

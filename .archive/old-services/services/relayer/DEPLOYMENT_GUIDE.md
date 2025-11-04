# Relayer Service Deployment Guide

Complete guide to deploying and running the Nor Bridge relayer service.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Overview

### What is the Relayer?

The relayer is a critical component of the Nor Bridge that:

1. **Monitors spoke chains** (BSC, Polygon, Ethereum) for Fill events
2. **Waits for confirmations** (15 blocks to prevent reorgs)
3. **Signs receipts** with relayer private key
4. **Forwards to SettlementHub** on Nor Chain for settlement
5. **Tracks status** and logs all activity

**Without the relayer, cross-chain settlements won't complete!**

### Architecture

```
[BSC] → Fill Event → [Relayer] → Receipt → [Nor Chain]
                         ↓
                    Monitors
                    Validates
                    Forwards
                    Tracks
```

---

## Prerequisites

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 2 GB
- Storage: 20 GB SSD
- Network: 10 Mbps

**Recommended**:
- CPU: 4 cores
- RAM: 4 GB
- Storage: 50 GB SSD
- Network: 100 Mbps

### Software Requirements

- **Node.js**: v18+ or v20+
- **npm**: v9+ or yarn
- **PM2**: For production process management
- **MongoDB**: Optional (for persistent storage)
- **Redis**: Optional (for caching)

### Wallet Requirements

**Relayer Wallet**:
- Funded with gas on **all chains**:
  - BSC Mainnet: ~0.1 BNB (for 1,000+ settlements)
  - Nor Chain: ~10 NOR (for gas)
  - Polygon: ~5 MATIC (if deployed)

**Security**:
- Use dedicated wallet (not your main wallet)
- Consider hardware wallet for production
- Never share private key

---

## Installation

### Step 1: Clone Repository

```bash
cd /Volumes/Development/sahalat/blockchain-v2
cd services/relayer
```

### Step 2: Install Dependencies

```bash
npm install
```

**Dependencies**:
- `ethers`: Ethereum library
- `web3`: Web3.js library
- `dotenv`: Environment variables
- `winston`: Logging
- `axios`: HTTP requests (for alerts)
- `express`: API server (optional)

### Step 3: Create Configuration

```bash
cp .env.example .env
```

**Edit `.env`** with your values (see Configuration section below).

---

## Configuration

### Step 1: Basic Configuration

Edit `.env`:

```bash
# Environment
NODE_ENV=testnet  # or 'mainnet' for production

# RPC Endpoints
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
XAHEEN_CHAIN_RPC=https://rpc.xaheen.org

# Relayer private key
RELAYER_PRIVATE_KEY=0x...your_private_key_here
```

### Step 2: Contract Addresses

**After testnet deployment**, update with deployed addresses:

```bash
# From deployment-testnet.json
HUB_SUPPLY_CONTROLLER=0x...
HUB_SETTLEMENT_HUB=0x...
HUB_PRICE_AUTHORITY=0x...

SPOKE_BSC_SETTLEMENT_INBOX=0x...
SPOKE_BSC_XAHEEN_ROUTER=0x...
SPOKE_BSC_WRAPPED_NOR=0x...
```

### Step 3: Monitoring Settings

```bash
# Confirmations
CONFIRMATIONS_REQUIRED=15  # 15 blocks for BSC mainnet (~45 sec)

# Polling
POLL_INTERVAL=5000  # Check every 5 seconds

# Gas settings
MAX_GAS_PRICE=20  # Maximum 20 Gwei
GAS_LIMIT=300000
```

### Step 4: Alerts (Recommended)

**Telegram Alerts**:

1. Create Telegram bot: https://t.me/BotFather
2. Get bot token
3. Get your chat ID: https://t.me/userinfobot

```bash
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_CHAT_ID=123456789
```

**Discord Alerts**:

1. Create Discord webhook in your server
2. Copy webhook URL

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Step 5: Optional Features

**Database (for production)**:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/xaheen-relayer

# Redis
REDIS_URL=redis://localhost:6379
```

**API Server**:

```bash
ENABLE_API=true
API_PORT=3000
API_KEY=your_secure_random_key
```

**Metrics**:

```bash
ENABLE_METRICS=true
METRICS_PORT=9090
```

---

## Testing

### Step 1: Dry Run Mode

Test without submitting real transactions:

```bash
# In .env
DRY_RUN=true
NODE_ENV=testnet
```

**Run relayer**:

```bash
npm start
```

**Expected output**:

```
[INFO] Relayer starting...
[INFO] Connected to BSC Testnet
[INFO] Connected to Nor Chain
[INFO] Relayer address: 0x...
[INFO] BSC balance: 0.05 BNB
[INFO] Nor balance: 10.5 NOR
[INFO] Monitoring SettlementInbox at 0x...
[INFO] Starting event listener...
[INFO] Relayer is running (DRY RUN MODE)
```

### Step 2: Test with Single Transfer

1. **Execute a test transfer** on the bridge UI
2. **Watch relayer logs**:

```
[INFO] New Fill event detected
[INFO] FillID: 0xabc...
[INFO] Trader: 0x...
[INFO] Amount: +1000 NOR
[INFO] Cash: 100 USDT
[INFO] Waiting for 15 confirmations...
[INFO] Confirmation 1/15
[INFO] Confirmation 2/15
...
[INFO] Confirmation 15/15 - CONFIRMED
[INFO] [DRY RUN] Would forward receipt to SettlementHub
[INFO] Receipt data: {...}
```

3. **Verify no errors** in logs

### Step 3: Test with Real Transaction

```bash
# In .env, disable dry run
DRY_RUN=false
```

**Restart relayer**:

```bash
npm start
```

**Execute test transfer** and watch for:

```
[INFO] Confirmation 15/15 - CONFIRMED
[INFO] Forwarding receipt to SettlementHub...
[INFO] Transaction hash: 0x...
[INFO] Waiting for settlement confirmation...
[INFO] Settlement SUCCESSFUL
[INFO] Gas used: 150,000
[INFO] Total cost: 0.003 BNB
```

### Step 4: Verify Settlement

Check on Nor Chain explorer:
- Transaction should show in SettlementHub
- Event: `FillAcknowledged`
- Status: Success

---

## Production Deployment

### Option 1: PM2 (Recommended)

**Install PM2**:

```bash
npm install -g pm2
```

**Create PM2 config** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'xaheen-relayer',
    script: './index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'mainnet'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

**Start relayer**:

```bash
pm2 start ecosystem.config.js
```

**Useful PM2 commands**:

```bash
pm2 list              # List processes
pm2 logs xaheen-relayer  # View logs
pm2 restart xaheen-relayer  # Restart
pm2 stop xaheen-relayer     # Stop
pm2 delete xaheen-relayer   # Delete
pm2 monit             # Monitor (live)
pm2 save              # Save config
pm2 startup           # Auto-start on boot
```

### Option 2: Systemd (Linux)

**Create service file** (`/etc/systemd/system/xaheen-relayer.service`):

```ini
[Unit]
Description=Nor Bridge Relayer
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/blockchain-v2/services/relayer
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=xaheen-relayer

[Install]
WantedBy=multi-user.target
```

**Enable and start**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable xaheen-relayer
sudo systemctl start xaheen-relayer
sudo systemctl status xaheen-relayer
```

**View logs**:

```bash
sudo journalctl -u xaheen-relayer -f
```

### Option 3: Docker

**Create Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "index.js"]
```

**Build and run**:

```bash
docker build -t xaheen-relayer .
docker run -d --name relayer --env-file .env xaheen-relayer
```

---

## Monitoring

### Metrics Dashboard

If `ENABLE_METRICS=true`:

**Access Prometheus metrics**:

```
http://localhost:9090/metrics
```

**Key metrics**:
- `relayer_events_processed_total`: Total events processed
- `relayer_settlements_successful`: Successful settlements
- `relayer_settlements_failed`: Failed settlements
- `relayer_gas_used_total`: Total gas consumed
- `relayer_balance_bnb`: Current BNB balance
- `relayer_balance_xht`: Current NOR balance

### API Endpoints

If `ENABLE_API=true`:

```bash
# Health check
curl http://localhost:3000/health

# Stats
curl http://localhost:3000/stats \
  -H "Authorization: Bearer YOUR_API_KEY"

# Recent events
curl http://localhost:3000/events?limit=10 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Alert Notifications

**Telegram alerts will be sent for**:
- Relayer started/stopped
- Low balance warning (< threshold)
- Settlement failures
- RPC connection errors
- Unexpected errors

**Example alert**:

```
🚨 ALERT: Low Balance

Chain: BSC Mainnet
Balance: 0.005 BNB
Threshold: 0.01 BNB
Action: Refill relayer wallet ASAP
```

### Log Monitoring

**Important log patterns to monitor**:

```bash
# Errors
tail -f logs/relayer.log | grep ERROR

# Failed settlements
tail -f logs/relayer.log | grep "Settlement FAILED"

# Low balance warnings
tail -f logs/relayer.log | grep "Low balance"
```

---

## Troubleshooting

### "Cannot connect to RPC"

**Problem**: RPC endpoint not responding

**Solutions**:

1. **Check RPC URL** in `.env`
2. **Try alternative RPC**:
   ```
   BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org
   ```
3. **Check internet connection**
4. **Verify RPC is operational** (try in browser)

### "Insufficient funds for gas"

**Problem**: Relayer wallet out of gas

**Solutions**:

1. **Check balance**:
   ```javascript
   const balance = await provider.getBalance(relayerAddress);
   console.log(ethers.formatEther(balance));
   ```

2. **Fund relayer wallet**:
   - BSC: Send BNB to relayer address
   - Nor: Send NOR to relayer address

3. **Increase MIN_BALANCE_ALERT** in `.env`

### "Settlement transaction failed"

**Problem**: SettlementHub rejected transaction

**Common causes**:

1. **Fill already processed** (duplicate)
   - Check fillId in SettlementHub
   - Relayer might have restarted mid-process

2. **Invalid signature**
   - Verify QUOTE_SIGNER_ADDRESS matches PriceAuthority
   - Check signature verification is enabled

3. **Out of gas**
   - Increase GAS_LIMIT in `.env`

4. **Nonce too low/high**
   - Relayer transaction nonce conflict
   - Restart relayer to reset nonce

### "Events not being detected"

**Problem**: No events showing in logs

**Solutions**:

1. **Verify contract address** in `.env`
2. **Check START_BLOCK** (make sure it's before your test transfer)
3. **Test event manually**:
   ```bash
   # In hardhat console
   const inbox = await ethers.getContractAt("SettlementInbox", ADDRESS);
   const events = await inbox.queryFilter(inbox.filters.Fill());
   console.log(events);
   ```

4. **Check RPC supports event filtering**

### "High gas costs"

**Problem**: Gas fees eating into profits

**Solutions**:

1. **Adjust MAX_GAS_PRICE**:
   ```
   MAX_GAS_PRICE=15  # Lower limit
   ```

2. **Enable AUTO_ADJUST_GAS**:
   ```
   AUTO_ADJUST_GAS=true
   ```

3. **Monitor gas prices**: https://bscscan.com/gastracker
4. **Batch settlements** (if possible in future upgrade)

---

## Maintenance

### Daily Tasks

**Check relayer status**:
```bash
pm2 status
pm2 logs xaheen-relayer --lines 50
```

**Check balances**:
```bash
# Via API
curl http://localhost:3000/stats

# Or check on explorer
# BSC: https://bscscan.com/address/[RELAYER_ADDRESS]
# Nor: https://explorer.xaheen.org/address/[RELAYER_ADDRESS]
```

**Review settlements**:
```bash
curl http://localhost:3000/events?limit=20
```

### Weekly Tasks

**Refill gas if needed**:
- Target: Keep >0.05 BNB, >5 NOR
- Set reminders for refills

**Review error logs**:
```bash
grep -i error logs/relayer.log | tail -50
```

**Check metrics trends**:
- Settlement success rate (should be >99%)
- Average gas usage
- Event processing latency

### Monthly Tasks

**Update dependencies**:
```bash
npm outdated
npm update
npm audit fix
```

**Backup logs**:
```bash
tar -czf logs-backup-$(date +%Y%m).tar.gz logs/
```

**Review and optimize**:
- Gas usage patterns
- RPC endpoint performance
- Alert thresholds
- Error patterns

---

## Security Checklist

### Before Production

- [ ] `.env` file is NOT committed to git
- [ ] `RELAYER_PRIVATE_KEY` is from dedicated wallet
- [ ] Wallet funded on all chains
- [ ] `VERIFY_SIGNATURES=true`
- [ ] Alerts configured (Telegram/Discord)
- [ ] `MIN_BALANCE_ALERT` thresholds set
- [ ] `MAX_TRANSFER_USD` limit set
- [ ] Tested on testnet first
- [ ] Logs directory created with proper permissions
- [ ] PM2 or systemd auto-restart configured
- [ ] Monitoring dashboard set up
- [ ] Backup relayer key securely stored
- [ ] Team members notified of deployment
- [ ] Incident response plan documented

---

## Performance Optimization

### Tips for High Volume

1. **Use WebSocket RPC** (faster than HTTP):
   ```
   BSC_MAINNET_WS=wss://bsc-ws-node.nariox.org:443
   ```

2. **Enable Redis caching**:
   ```
   REDIS_URL=redis://localhost:6379
   ```

3. **Increase BATCH_SIZE** for historical sync:
   ```
   BATCH_SIZE=500
   ```

4. **Use dedicated RPC node** (not public):
   - Consider running your own BSC node
   - Or use premium RPC service (QuickNode, Alchemy)

5. **Optimize gas**:
   ```
   AUTO_ADJUST_GAS=true
   MAX_GAS_PRICE=10
   ```

---

## Support

**Need help?**
- Telegram: https://t.me/xaheenchain
- Email: support@xaheen.org
- GitHub Issues: Create issue in repo

**Emergency contact**:
- For critical issues (mainnet down), contact team lead directly

---

*Last Updated: November 2025*
*Version: 1.0*

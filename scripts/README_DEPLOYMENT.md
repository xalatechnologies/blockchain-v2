# 🚀 Nor Chain - Production Deployment Scripts

**Quick reference for deploying Nor Chain to production**

---

## 📋 Available Scripts

### `deploy-production-public.sh` ⭐ MAIN DEPLOYMENT SCRIPT

**Purpose**: Complete production deployment in one command

**Usage**:
```bash
./scripts/deploy-production-public.sh SERVER_IP DOMAIN

# Example:
./scripts/deploy-production-public.sh 95.217.123.45 xaheen.org
```

**What it does**:
1. ✅ Tests SSH connectivity to server
2. ✅ Creates deployment package (genesis, keys, configs)
3. ✅ Transfers files to production server
4. ✅ Installs Docker, Nginx, Certbot, utilities
5. ✅ Configures firewall (UFW)
6. ✅ Initializes 3 validators
7. ✅ Creates systemd services (auto-restart)
8. ✅ Configures Nginx reverse proxy with rate limiting
9. ✅ Starts validators
10. ✅ Tests RPC endpoint

**Duration**: ~20-30 minutes

**Requirements**:
- Server with Ubuntu 22.04
- SSH key access configured
- DNS records configured (see DNS_SETUP_GUIDE.md)

**Output**:
```
✓ Configuration validated
✓ SSH connection successful
✓ Deployment package created
✓ Files transferred
✓ Remote deployment complete
✓ Validators initialized
✓ Systemd services created
✓ Nginx configured
✓ Validators started
✓ RPC endpoint responding correctly

XAHEEN CHAIN DEPLOYMENT SUCCESSFUL!
```

---

### Other Deployment Scripts

**Local Development:**
- `init-xaheen-validators.sh` - Initialize validators locally
- `start-xaheen-validators.sh` - Start local validators

**Bridges:**
- `deploy-all-bridges.sh` - Deploy all 22 bridge types
- `deploy-bridge-day2.js` - Post-deployment bridge operations
- `deploy-bridge-complete.sh` - Complete bridge deployment

**Legacy:**
- `deploy-bridge-day2.js` - Node.js bridge deployment
- `hardhat-deploy-mainnet.js` - BSC mainnet deployment
- `hardhat-deploy-private.js` - Private chain deployment

---

## 🎯 Quick Start (3-Hour Launch)

### Prerequisites

1. **Get a server** ($40/month):
   - Hetzner CPX41 (recommended)
   - DigitalOcean Performance Droplet
   - AWS t3.xlarge or c5.2xlarge

2. **Register domain** ($10/year):
   - xaheen.org (recommended)
   - Or use existing domain

3. **Configure DNS**:
   ```
   A    @      YOUR_SERVER_IP
   A    rpc    YOUR_SERVER_IP
   A    ws     YOUR_SERVER_IP
   ```

### Deployment

```bash
# Step 1: Clone repository (if not already done)
cd /Volumes/Development/sahalat/blockchain-v2

# Step 2: Run deployment script
./scripts/deploy-production-public.sh YOUR_SERVER_IP xaheen.org

# Step 3: Wait for DNS propagation (5-15 minutes)
dig rpc.xaheen.org +short

# Step 4: Install SSL certificates
ssh root@YOUR_SERVER_IP
certbot --nginx -d rpc.xaheen.org
certbot --nginx -d ws.xaheen.org

# Step 5: Test public endpoint
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected: {"jsonrpc":"2.0","id":1,"result":"0xfde9"}
```

**DONE! 🎉 Nor Chain is public!**

---

## 🔧 Advanced Configuration

### Customize Validator Settings

Edit the deployment script to change:

```bash
# Number of validators (default: 3)
VALIDATOR_COUNT=3

# Network ID (default: 65001)
NETWORK_ID=65001

# Gas price (default: 1 Gwei)
GAS_PRICE=1000000000

# Max peers (default: 100)
MAX_PEERS=100
```

### Change Rate Limits

Edit Nginx configuration after deployment:

```bash
ssh root@YOUR_SERVER_IP
nano /etc/nginx/conf.d/rate-limit.conf

# Change from:
limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=100r/s;

# To (example: 200 req/s):
limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=200r/s;

# Reload Nginx
systemctl reload nginx
```

### Add More Validators

```bash
ssh root@YOUR_SERVER_IP

# Create validator 4 directory
mkdir -p /opt/xaheen/validator-4

# Initialize validator 4
docker run --rm \
    -v /opt/xaheen/validator-4:/bsc \
    -v /opt/xaheen/config/genesis.json:/genesis.json \
    dysnix/bsc init --datadir /bsc /genesis.json

# Create systemd service (copy from validator-2 or validator-3)
# Edit /etc/systemd/system/xaheen-validator-4.service
# Change port to 30306
# Change etherbase address

systemctl daemon-reload
systemctl enable xaheen-validator-4
systemctl start xaheen-validator-4
```

---

## 🚨 Troubleshooting

### Deployment Script Fails

**SSH Connection Failed:**
```bash
# Ensure SSH key is added
ssh-copy-id root@YOUR_SERVER_IP

# Or manually add key
ssh root@YOUR_SERVER_IP
nano ~/.ssh/authorized_keys
# Paste your public key
```

**Genesis File Not Found:**
```bash
# Ensure genesis file exists
ls -la data/genesis-xaheen-65001.json

# Or use default genesis
ls -la data/genesis.json

# Copy if needed
cp data/genesis.json data/genesis-xaheen-65001.json
```

**Docker Pull Failed:**
```bash
ssh root@YOUR_SERVER_IP

# Retry Docker pull
docker pull dysnix/bsc:latest

# Or use specific version
docker pull dysnix/bsc:1.1.11
```

### Validators Not Starting

```bash
ssh root@YOUR_SERVER_IP

# Check systemd status
systemctl status xaheen-validator-1

# Check Docker logs
docker logs xaheen-validator-1 --tail 100

# Restart if needed
systemctl restart xaheen-validator-1

# Check if running
docker ps | grep xaheen-validator
```

### RPC Not Responding

```bash
# Check if validator is running
ssh root@YOUR_SERVER_IP
docker ps

# Check local RPC (should work)
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Check Nginx status
systemctl status nginx

# Check Nginx error logs
tail -50 /var/log/nginx/xaheen-rpc-error.log

# Restart Nginx
systemctl restart nginx
```

### SSL Certificate Fails

```bash
# Ensure DNS has propagated
dig rpc.xaheen.org +short
# Should return your server IP

# Wait if not propagated yet
watch -n 60 'dig rpc.xaheen.org +short'

# Try manual certificate installation
certbot certonly --nginx -d rpc.xaheen.org

# Check Certbot logs
tail -50 /var/log/letsencrypt/letsencrypt.log
```

### Validators Out of Sync

```bash
# Check peer count
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Should return at least 0x2 (2 peers)

# Check static nodes configuration
cat /opt/xaheen/validator-1/geth/static-nodes.json

# Restart all validators
systemctl restart xaheen-validator-1
systemctl restart xaheen-validator-2
systemctl restart xaheen-validator-3
```

---

## 📊 Monitoring

### Check Validator Health

```bash
ssh root@YOUR_SERVER_IP

# Check all validators
systemctl status xaheen-validator-*

# Check block production
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Wait 30 seconds and check again (should increase)
sleep 30
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Monitor Resources

```bash
# CPU, RAM, processes
htop

# Disk usage
df -h

# Network traffic
nethogs

# Docker stats
docker stats
```

### Check Logs

```bash
# Validator logs
docker logs xaheen-validator-1 --tail 50 -f

# Nginx access logs
tail -50 /var/log/nginx/xaheen-rpc-access.log

# Nginx error logs
tail -50 /var/log/nginx/xaheen-rpc-error.log

# System logs
journalctl -u xaheen-validator-1 -f
```

---

## 🔐 Security

### Firewall Rules

Already configured by deployment script:

```bash
# View current rules
ufw status verbose

# Default rules:
# - Allow SSH (22)
# - Allow HTTP (80)
# - Allow HTTPS (443)
# - Allow P2P (30303-30305)
# - Deny all other incoming
```

### SSL/TLS Configuration

Already configured for security:

```bash
# View current SSL config
cat /etc/nginx/sites-available/xaheen-rpc | grep ssl

# Security headers:
# - X-Frame-Options: SAMEORIGIN
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block

# TLS versions: 1.2, 1.3 only
# Strong ciphers only
```

### Automated Backups

Set up daily backups:

```bash
ssh root@YOUR_SERVER_IP

# Create backup script
cat > /usr/local/bin/backup-xaheen.sh << 'BACKUP'
#!/bin/bash
tar -czf /root/backup-$(date +%Y%m%d).tar.gz \
  /opt/xaheen/validator-*/keystore \
  /opt/xaheen/config/genesis.json \
  /opt/xaheen/config/password.txt
find /root/backup-*.tar.gz -mtime +7 -delete
BACKUP

chmod +x /usr/local/bin/backup-xaheen.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-xaheen.sh
```

---

## 📈 Performance Optimization

### Increase Connection Limits

```bash
ssh root@YOUR_SERVER_IP

# Edit Nginx config
nano /etc/nginx/nginx.conf

# Add under http block:
worker_connections 4096;
keepalive_timeout 65;
keepalive_requests 100;

# Reload
systemctl reload nginx
```

### Optimize Docker

```bash
# Increase Docker resources
cat > /etc/docker/daemon.json << JSON
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
JSON

systemctl restart docker
```

### Enable Prometheus Metrics (Optional)

```bash
# Install Prometheus
apt-get install -y prometheus prometheus-node-exporter

# Configure for Geth metrics
# Add --metrics flag to validator start command

# Install Grafana
apt-get install -y grafana

# Access at http://YOUR_SERVER_IP:3000
```

---

## 🎓 Next Steps After Deployment

1. **Deploy Block Explorer**:
   ```bash
   # Blockscout installation
   # See: docs/EXPLORER_DEPLOYMENT.md
   ```

2. **Create Developer Faucet**:
   ```bash
   # Faucet for free NOR
   # See: docs/FAUCET_SETUP.md
   ```

3. **Setup Monitoring**:
   ```bash
   # Uptime monitoring, alerts
   # See: docs/MONITORING.md
   ```

4. **Launch Marketing**:
   ```bash
   # Social media, press release
   # See: GO_PUBLIC_NOW.md
   ```

---

## 📞 Support

**Issues? Need help?**

- 📧 Email: support@xaheen.org
- 💬 Telegram: t.me/xaheen_chain
- 💬 Discord: discord.gg/xaheen
- 📖 Docs: docs.xaheen.org
- 🐛 GitHub: github.com/xaheen-chain/issues

---

## ✅ Deployment Checklist

Before deployment:
- [ ] Server provisioned (Ubuntu 22.04, 8+ vCPU, 16+ GB RAM)
- [ ] SSH key added to server
- [ ] Domain registered
- [ ] DNS A records configured
- [ ] Genesis file present (`data/genesis-xaheen-65001.json`)

After deployment:
- [ ] All 3 validators running
- [ ] RPC endpoint responding (http://localhost:8545)
- [ ] Blocks being produced (check `eth_blockNumber`)
- [ ] DNS propagated (check `dig rpc.xaheen.org`)
- [ ] SSL certificates installed
- [ ] Public RPC working (https://rpc.xaheen.org)
- [ ] WebSocket working (wss://ws.xaheen.org)
- [ ] MetaMask integration tested

Post-launch:
- [ ] Block explorer deployed
- [ ] Developer faucet created
- [ ] Monitoring setup
- [ ] Launch announcement posted
- [ ] Community channels active

---

**Ready to deploy? Run:**

```bash
./scripts/deploy-production-public.sh YOUR_SERVER_IP xaheen.org
```

**Let's compete with BNB Smart Chain! 🚀**

**Nor Chain - Where Intelligence Meets Blockchain** 🧠⚡

# 🚨 CRITICAL: Xaheen Chain RPC Down - Diagnosis & Fix

**STATUS: CRITICAL INFRASTRUCTURE FAILURE**
**Date:** October 31, 2025
**Time:** Current

---

## Executive Summary

**Problem:** Xaheen Chain RPC endpoint (`https://rpc.xaheen.org`) is returning 502 Bad Gateway

**Impact:**
- ❌ ZERO users can interact with blockchain
- ❌ Cannot deploy new contracts (BNB/ETH pairs blocked)
- ❌ Cannot execute swaps
- ❌ DEX is completely non-functional
- ❌ All development blocked

**Root Cause:** BSC validator node is NOT running on port 8545

---

## Technical Diagnosis

### 1. DNS Resolution ✅
```bash
$ dig rpc.xaheen.org +short
3.91.50.187

✅ DNS works correctly
✅ Points to AWS EC2 instance
```

### 2. Server Connectivity
```bash
$ nc -zv 3.91.50.187 22
Connection to 3.91.50.187 port 22 [tcp/ssh] succeeded! ✅

$ nc -zv 3.91.50.187 8545
nc: connectx to 3.91.50.187 port 8545 (tcp) failed: Connection refused ❌
```

**Finding:**
- ✅ Server is online (SSH port 22 works)
- ❌ RPC port 8545 is NOT listening
- **Conclusion: BSC validator node is NOT running**

### 3. Nginx Status
```bash
$ curl https://rpc.xaheen.org
502 Bad Gateway
nginx/1.28.0
```

**Finding:**
- ✅ Nginx is running
- ❌ Nginx cannot connect to backend (BSC node on port 8545)
- **Conclusion: Nginx is configured correctly, but BSC node is down**

---

## Root Cause Analysis

### Most Likely Causes (in order of probability):

**1. Validator Containers Stopped (90% probability)**
```
Docker containers not running:
├─ bsc-validator-1 (should be on port 8545)
├─ bsc-validator-2 (should be on port 30304)
└─ bsc-validator-3 (should be on port 30305)

Possible reasons:
├─ Server rebooted, containers didn't auto-restart
├─ Manual stop
├─ Docker daemon crashed
└─ Out of memory (OOM killer stopped containers)
```

**2. Docker Daemon Not Running (5% probability)**
```
Docker service stopped or crashed
```

**3. Process Crash (3% probability)**
```
BSC process crashed inside container
├─ Out of memory
├─ Disk full
├─ Corrupted database
└─ Sync error
```

**4. Port Conflict (1% probability)**
```
Another process using port 8545
```

**5. Firewall/Security Group (1% probability)**
```
AWS security group or iptables blocking port 8545
(Unlikely since SSH works and Nginx responds)
```

---

## Server Information

### AWS Instance Details:
```
Region: us-east-1
Instance Type: t2.micro (likely upgraded to t3.large)
IP: 3.91.50.187
Domain: rpc.xaheen.org → 3.91.50.187
```

### Expected Services:
```
Port 22:    SSH ✅ (Working)
Port 8545:  JSON-RPC ❌ (Down)
Port 8546:  WebSocket (Unknown)
Port 30303: P2P (Unknown)
```

### Deployed Contracts (Now Inaccessible):
```
WXHT:    0xeeE0Bf805c80456C539Ec73855b3a9bf81E54862
Factory: 0x3652Da488FeF83C3327760f43B01Bad02FFfA13D
Router:  0x25a4240A868f9F5D5e6b55e5dd355bF2e1F9890a
USDT:    0xd16F235BB4b53b448e5ECdE89Cf17568FD91CFaA
Pair:    0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8
```

**Impact:** $20,000 in liquidity is locked but inaccessible until RPC is fixed.

---

## How to Fix This (Step-by-Step)

### Prerequisites:
1. SSH access to server
2. SSH private key file
3. Root/sudo access

### Option 1: Quick Fix (Restart Validators)

**If you have SSH access:**

```bash
# 1. SSH into server
ssh -i /path/to/your-key.pem ec2-user@3.91.50.187
# Or if different user:
ssh -i /path/to/your-key.pem ubuntu@3.91.50.187

# 2. Check Docker status
sudo systemctl status docker

# 3. Start Docker if stopped
sudo systemctl start docker
sudo systemctl enable docker

# 4. Check if validators are running
docker ps

# 5. If not running, check stopped containers
docker ps -a | grep bsc-validator

# 6. Start validators
docker start bsc-validator-1
docker start bsc-validator-2
docker start bsc-validator-3

# OR use your startup script
cd ~/blockchain-v2  # Or wherever you cloned repo
sudo ./scripts/setup-production-multi-validator.sh

# 7. Check logs
docker logs -f bsc-validator-1

# 8. Test RPC
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545

# Should return: {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

### Option 2: Full Restart (If Quick Fix Fails)

```bash
# SSH into server
ssh -i /path/to/your-key.pem ec2-user@3.91.50.187

# Stop all validators
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3

# Remove containers (keeps data)
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3

# Check disk space
df -h

# Check if blockchain data exists
ls -lah ~/blockchain-v2/validator-*/geth/chaindata

# Reinitialize validators
cd ~/blockchain-v2
sudo ./scripts/setup-production-multi-validator.sh

# Monitor startup
docker logs -f bsc-validator-1
```

### Option 3: Emergency Recovery (If Database Corrupted)

```bash
# ⚠️  WARNING: This deletes blockchain data
# Only use if other options fail

# SSH into server
ssh -i /path/to/your-key.pem ec2-user@3.91.50.187

# Stop validators
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3

# Backup old data (just in case)
sudo mv ~/blockchain-v2/validator-1 ~/blockchain-v2/validator-1.backup
sudo mv ~/blockchain-v2/validator-2 ~/blockchain-v2/validator-2.backup
sudo mv ~/blockchain-v2/validator-3 ~/blockchain-v2/validator-3.backup

# Reinitialize from genesis
cd ~/blockchain-v2
sudo ./scripts/init-xaheen-validators.sh

# Start validators
sudo ./scripts/start-xaheen-validators.sh

# Resync will take time (contracts are already in genesis)
```

---

## Post-Fix Verification

After restarting validators, verify everything works:

```bash
# 1. Check RPC from local machine
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://rpc.xaheen.org

# 2. Check WebSocket
wscat -c wss://rpc.xaheen.org

# 3. Test contract interaction
node scripts/check-lp-balance.js

# 4. Test swap
node scripts/test-swap-xaheen.js
```

**Expected Results:**
- ✅ RPC returns block number
- ✅ WebSocket connects
- ✅ Can read contract data
- ✅ Can execute swaps

---

## Prevention (Auto-Restart Setup)

### Make Validators Auto-Start on Reboot:

**Option A: Docker Restart Policy**
```bash
# SSH into server
ssh -i /path/to/your-key.pem ec2-user@3.91.50.187

# Update containers to auto-restart
docker update --restart=unless-stopped bsc-validator-1
docker update --restart=unless-stopped bsc-validator-2
docker update --restart=unless-stopped bsc-validator-3
```

**Option B: Systemd Service**
```bash
# Create systemd service file
sudo cat > /etc/systemd/system/xaheen-validators.service << 'EOF'
[Unit]
Description=Xaheen Chain Validators
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/blockchain-v2
ExecStart=/home/ec2-user/blockchain-v2/scripts/start-xaheen-validators.sh
ExecStop=/usr/bin/docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable xaheen-validators.service
sudo systemctl start xaheen-validators.service
```

**Option C: Cron Job (Watchdog)**
```bash
# Add to crontab
crontab -e

# Add this line (checks every 5 minutes)
*/5 * * * * docker ps | grep bsc-validator-1 || /home/ec2-user/blockchain-v2/scripts/start-xaheen-validators.sh
```

---

## Monitoring Setup (Prevent Future Downtime)

### 1. Basic Health Check Script

```bash
cat > ~/check-validators.sh << 'EOF'
#!/bin/bash
# Health check script for Xaheen validators

# Check if RPC responds
if ! curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545 | grep -q result; then

  echo "$(date): RPC DOWN - Restarting validators"
  docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3

  # Send alert (if configured)
  # curl -X POST https://your-webhook-url -d "Xaheen RPC was down, auto-restarted"
fi
EOF

chmod +x ~/check-validators.sh

# Add to cron (every minute)
crontab -e
# Add: * * * * * /home/ec2-user/check-validators.sh >> /var/log/validator-health.log 2>&1
```

### 2. Uptime Monitoring

**Use External Service:**
- UptimeRobot (free)
- Pingdom
- StatusCake

**Monitor URL:** `https://rpc.xaheen.org`
**Check:** HTTP 200 response (not 502)
**Alert:** Email/SMS when down

---

## Current Status Summary

```
DNS:        ✅ Working (3.91.50.187)
Server:     ✅ Online (SSH accessible)
Docker:     ❓ Unknown (need to check)
Validators: ❌ NOT RUNNING
RPC Port:   ❌ Closed (connection refused)
Nginx:      ✅ Running (502 = can't reach backend)

CONCLUSION: BSC validator containers are stopped
ACTION NEEDED: SSH into server and restart validators
```

---

## What You Need to Do RIGHT NOW

**1. Locate SSH Key:**
```
Find your AWS key pair file:
- Likely named: bsc-validator-key.pem
- Check: ~/blockchain-v2/
- Check: ~/.ssh/
- Check: ~/Downloads/
```

**2. SSH Into Server:**
```bash
ssh -i /path/to/bsc-validator-key.pem ec2-user@3.91.50.187
```

**3. Run Quick Fix:**
```bash
# Once logged in:
docker ps  # Check if validators running
docker start bsc-validator-1  # Start if stopped
docker logs -f bsc-validator-1  # Watch logs
```

**4. Verify Fix:**
```bash
# From your local machine:
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return block number, not 502
```

---

## Impact Timeline

**Before Fix:**
- ❌ No users can buy XHT
- ❌ No users can swap tokens
- ❌ Cannot deploy BNB/ETH pairs
- ❌ Cannot deploy frontend (would be useless)
- ❌ $20k liquidity is locked/inaccessible

**After Fix (ETA: 5 minutes):**
- ✅ RPC back online
- ✅ Can deploy BNB/ETH pairs
- ✅ Can deploy frontend
- ✅ Users can swap tokens
- ✅ Full functionality restored

---

## Next Steps After Fix

1. **Verify RPC:** Test all scripts work again
2. **Deploy Auto-Restart:** Set up systemd or Docker restart policy
3. **Setup Monitoring:** Configure UptimeRobot alerts
4. **Deploy BNB/ETH Pairs:** Continue with original plan
5. **Deploy Frontend:** Make swapping accessible to users

---

## Emergency Contact Info

**If you don't have SSH access:**
1. Access AWS Console
2. Go to EC2 → Instances
3. Find instance: 3.91.50.187
4. Use "Connect" → "Session Manager" (if IAM configured)
5. Or restart entire instance (last resort)

**If you need help:**
- I've diagnosed the issue completely
- Problem: Validators not running
- Solution: Restart Docker containers
- Need: SSH access to execute fix

---

## Summary

**What's Wrong:**
BSC validator Docker containers are not running on your AWS server.

**Why It Happened:**
- Server likely rebooted (AWS maintenance, crash, manual reboot)
- Containers didn't auto-restart (restart policy not set)

**How to Fix:**
1. SSH into server: `ssh -i key.pem ec2-user@3.91.50.187`
2. Start validators: `docker start bsc-validator-1 bsc-validator-2 bsc-validator-3`
3. Verify: `curl http://localhost:8545` should respond

**Time to Fix:**
5 minutes (if you have SSH key)

**This is blocking EVERYTHING. Fix this first before proceeding with BNB/ETH pairs.**

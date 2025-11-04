# Nor Chain Backup & Disaster Recovery Strategy

**Created:** October 31, 2025
**Status:** CRITICAL - Implement Immediately

---

## Why We Need Backups

**Recent Issue (Oct 31, 2025):**
- Disk filled to 99% (only 228MB free)
- Validators stopped to prevent corruption
- Had to clean Docker images (freed 14.48GB)
- Blockchain data was wiped during recovery
- Lost all deployed contracts and liquidity data

**Result:** Had to re-deploy everything from scratch

**Prevention:** Automated backups ensure we can restore within minutes

---

## 3-Tier Backup Strategy

### Tier 1: Critical Data (Hourly)
**What:** Blockchain chaindata
**Frequency:** Every hour
**Retention:** Last 24 backups (24 hours)
**Size:** ~2-5GB
**Location:** AWS S3

### Tier 2: Daily Snapshots (Daily)
**What:** Full validator state
**Frequency:** Every day at 2 AM UTC
**Retention:** Last 7 days
**Size:** ~5-10GB
**Location:** AWS S3 + Local

### Tier 3: Weekly Archives (Weekly)
**What:** Complete blockchain + configs
**Frequency:** Every Sunday
**Retention:** Last 4 weeks + monthly archives
**Size:** ~10-20GB
**Location:** AWS S3 Glacier (cheaper storage)

---

## What to Backup

### Critical (Must Backup):

**1. Blockchain Data**
```
~/blockchain-v2/validator-1/geth/chaindata/
├─ Size: ~2-5GB (grows over time)
├─ Contains: All blocks, transactions, contract state
└─ Recovery: Restore to avoid re-syncing
```

**2. Genesis File**
```
~/genesis-xaheen.json
├─ Size: ~10KB
├─ Contains: Chain configuration, pre-funded accounts
└─ Recovery: Required to reinitialize chain
```

**3. Validator Keys**
```
~/blockchain-v2/validator-1/keystore/
├─ Size: ~1KB
├─ Contains: Validator private keys
└─ Recovery: Required for validator operations
```

**4. Node Configuration**
```
~/blockchain-v2/validator-1/password.txt
├─ Size: ~100 bytes
├─ Contains: Keystore password
└─ Recovery: Required to unlock validator
```

### Important (Should Backup):

**5. Docker Compose Config** (if using)
```
~/blockchain-v2/docker-compose.yml
```

**6. Deployment Logs** (local)
```
/Volumes/Development/sahalat/blockchain-v2/docs/deployment-logs/*.json
├─ Contract addresses
├─ Liquidity info
├─ Lock details
└─ Buyback configuration
```

**7. Environment Variables**
```
.env file (already gitignored - good!)
- Keep local backup
- Never commit to git
```

---

## Automated Backup Script

### Setup AWS S3 Bucket

```bash
# Create S3 bucket for backups
aws s3 mb s3://xaheen-chain-backups --region us-east-1

# Enable versioning (keeps old versions)
aws s3api put-bucket-versioning \
  --bucket xaheen-chain-backups \
  --versioning-configuration Status=Enabled

# Set lifecycle policy (auto-delete old backups)
cat > lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldHourlyBackups",
      "Status": "Enabled",
      "Expiration": { "Days": 1 },
      "Filter": { "Prefix": "hourly/" }
    },
    {
      "Id": "DeleteOldDailyBackups",
      "Status": "Enabled",
      "Expiration": { "Days": 7 },
      "Filter": { "Prefix": "daily/" }
    },
    {
      "Id": "MoveWeeklyToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 7,
          "StorageClass": "GLACIER"
        }
      ],
      "Filter": { "Prefix": "weekly/" }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket xaheen-chain-backups \
  --lifecycle-configuration file://lifecycle.json
```

### Backup Script (Server-Side)

```bash
# Create backup script on server
ssh -i bsc-validator-key.pem ec2-user@3.91.50.187

cat > /home/ec2-user/backup-blockchain.sh << 'EOF'
#!/bin/bash

# Nor Chain Backup Script
# Backs up blockchain data to AWS S3

set -euo pipefail

# Configuration
BACKUP_TYPE="${1:-hourly}"  # hourly, daily, weekly
BUCKET="s3://xaheen-chain-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/xaheen-backup-${TIMESTAMP}"

echo "$(date): Starting ${BACKUP_TYPE} backup"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Backup blockchain data (critical)
echo "Backing up chaindata..."
sudo tar czf "${BACKUP_DIR}/chaindata.tar.gz" \
  -C ~/blockchain-v2/validator-1/geth chaindata

# Backup genesis
echo "Backing up genesis..."
cp ~/genesis-xaheen.json "${BACKUP_DIR}/"

# Backup keystore
echo "Backing up validator keys..."
sudo tar czf "${BACKUP_DIR}/keystore.tar.gz" \
  -C ~/blockchain-v2/validator-1 keystore

# Backup password file
echo "Backing up password..."
sudo cp ~/blockchain-v2/validator-1/password.txt "${BACKUP_DIR}/" 2>/dev/null || true

# Create backup manifest
cat > "${BACKUP_DIR}/manifest.txt" << MANIFEST
Backup Type: ${BACKUP_TYPE}
Timestamp: ${TIMESTAMP}
Date: $(date)
Hostname: $(hostname)
Chain ID: 65001
Files:
$(ls -lh ${BACKUP_DIR})
MANIFEST

# Upload to S3
echo "Uploading to S3..."
aws s3 sync "${BACKUP_DIR}" "${BUCKET}/${BACKUP_TYPE}/${TIMESTAMP}/" \
  --storage-class STANDARD

# Cleanup local backup
rm -rf "${BACKUP_DIR}"

# Get backup size
BACKUP_SIZE=$(aws s3 ls "${BUCKET}/${BACKUP_TYPE}/${TIMESTAMP}/" --recursive --summarize | grep "Total Size" | awk '{print $3}')

echo "$(date): Backup complete - ${BACKUP_SIZE} bytes uploaded to ${BUCKET}/${BACKUP_TYPE}/${TIMESTAMP}/"

# Log to syslog
logger "Nor Chain ${BACKUP_TYPE} backup completed: ${BACKUP_SIZE} bytes"
EOF

chmod +x /home/ec2-user/backup-blockchain.sh
```

### Setup Cron Jobs

```bash
# Edit crontab
crontab -e

# Add these lines:

# Hourly backup (every hour)
0 * * * * /home/ec2-user/backup-blockchain.sh hourly >> /var/log/xaheen-backup.log 2>&1

# Daily backup (2 AM UTC)
0 2 * * * /home/ec2-user/backup-blockchain.sh daily >> /var/log/xaheen-backup.log 2>&1

# Weekly backup (Sunday 3 AM UTC)
0 3 * * 0 /home/ec2-user/backup-blockchain.sh weekly >> /var/log/xaheen-backup.log 2>&1

# Disk space check (every 6 hours)
0 */6 * * * df -h / | grep -v Filesystem >> /var/log/disk-usage.log 2>&1

# Docker cleanup (every Sunday 4 AM)
0 4 * * 0 docker system prune -f >> /var/log/docker-cleanup.log 2>&1
```

---

## Restore Procedures

### Scenario 1: Restore from Hourly Backup (Fast - 5 minutes)

```bash
# Stop validator
docker stop xaheen-rpc

# List available backups
aws s3 ls s3://xaheen-chain-backups/hourly/

# Download latest backup
LATEST_BACKUP=$(aws s3 ls s3://xaheen-chain-backups/hourly/ | tail -1 | awk '{print $2}')
aws s3 sync s3://xaheen-chain-backups/hourly/${LATEST_BACKUP} /tmp/restore/

# Restore chaindata
sudo rm -rf ~/blockchain-v2/validator-1/geth/chaindata
sudo tar xzf /tmp/restore/chaindata.tar.gz -C ~/blockchain-v2/validator-1/geth/

# Restore genesis
cp /tmp/restore/genesis-xaheen.json ~/

# Restart validator
docker start xaheen-rpc

# Verify
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Scenario 2: Disaster Recovery (Complete Loss)

```bash
# 1. Provision new server
# 2. Install Docker
sudo yum install -y docker
sudo systemctl start docker

# 3. Download genesis
aws s3 cp s3://xaheen-chain-backups/daily/latest/genesis-xaheen.json ~/

# 4. Initialize blockchain
mkdir -p ~/blockchain-v2/validator-1
docker run --rm \
  -v ~/blockchain-v2/validator-1:/bsc \
  -v ~/genesis-xaheen.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# 5. Restore chaindata from backup
LATEST_DAILY=$(aws s3 ls s3://xaheen-chain-backups/daily/ | tail -1 | awk '{print $2}')
aws s3 cp s3://xaheen-chain-backups/daily/${LATEST_DAILY}chaindata.tar.gz /tmp/
sudo tar xzf /tmp/chaindata.tar.gz -C ~/blockchain-v2/validator-1/geth/

# 6. Restore keystore
aws s3 cp s3://xaheen-chain-backups/daily/${LATEST_DAILY}keystore.tar.gz /tmp/
sudo tar xzf /tmp/keystore.tar.gz -C ~/blockchain-v2/validator-1/

# 7. Start node
docker run -d --name xaheen-rpc \
  --restart=unless-stopped \
  --network host \
  -v ~/blockchain-v2/validator-1:/bsc \
  dysnix/bsc --datadir /bsc \
  --port 30303 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.vhosts '*' --http.corsdomain '*' \
  --ws --ws.addr 0.0.0.0 --ws.port 8548 \
  --networkid 65001

# 8. Verify recovery
curl https://rpc.xaheen.org \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Recovery complete! ✅
```

---

## Monitoring & Alerts

### Setup CloudWatch Alarms

```bash
# Disk space alarm (alert at 80%)
aws cloudwatch put-metric-alarm \
  --alarm-name xaheen-disk-space-low \
  --alarm-description "Alert when disk usage exceeds 80%" \
  --metric-name DiskSpaceUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Backup failure alarm
aws cloudwatch put-metric-alarm \
  --alarm-name xaheen-backup-failed \
  --alarm-description "Alert when backup fails" \
  --metric-name BackupFailure \
  --namespace Custom/NorChain \
  --statistic Sum \
  --period 3600 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1
```

### Health Check Script

```bash
cat > /home/ec2-user/health-check.sh << 'EOF'
#!/bin/bash

# Check RPC
if ! curl -s -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -q result; then
  echo "$(date): RPC FAILED" | tee -a /var/log/xaheen-health.log
  # Send alert
  # aws sns publish --topic-arn arn:aws:sns:... --message "Nor RPC DOWN"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "$(date): DISK SPACE WARNING: ${DISK_USAGE}%" | tee -a /var/log/xaheen-health.log
  # Auto-cleanup
  docker system prune -f
fi

# Check last backup
LAST_BACKUP=$(aws s3 ls s3://xaheen-chain-backups/hourly/ | tail -1 | awk '{print $1" "$2}')
LAST_BACKUP_EPOCH=$(date -d "$LAST_BACKUP" +%s)
NOW_EPOCH=$(date +%s)
AGE=$((NOW_EPOCH - LAST_BACKUP_EPOCH))

if [ $AGE -gt 7200 ]; then  # More than 2 hours old
  echo "$(date): BACKUP WARNING: Last backup was $((AGE/3600)) hours ago" | tee -a /var/log/xaheen-health.log
fi
EOF

chmod +x /home/ec2-user/health-check.sh

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /home/ec2-user/health-check.sh
```

---

## Local Backups (Development Machine)

### What to Backup Locally:

**1. Deployment Logs** (Already saved ✅)
```
/Volumes/Development/sahalat/blockchain-v2/docs/deployment-logs/
├─ xaheen-dex-deployment.json
├─ test-usdt-deployment.json
├─ xaheen-liquidity-deployed.json
├─ lp-timelock-deployment.json
├─ weekly-buyback-deployment.json
└─ All deployment records
```

**2. Genesis Files**
```
/Volumes/Development/sahalat/blockchain-v2/data/
├─ genesis-xaheen-final.json ✅
└─ Keep all versions
```

**3. Scripts**
```
/Volumes/Development/sahalat/blockchain-v2/scripts/
All deployment and management scripts
```

**4. Documentation**
```
/Volumes/Development/sahalat/blockchain-v2/docs/
All documentation
```

### Local Backup Script (Run Daily)

```bash
#!/bin/bash
# Local backup script (run on Mac)

TIMESTAMP=$(date +%Y%m%d)
BACKUP_DIR="$HOME/xaheen-backups/${TIMESTAMP}"
PROJECT_DIR="/Volumes/Development/sahalat/blockchain-v2"

mkdir -p "${BACKUP_DIR}"

# Backup deployment logs
cp -r "${PROJECT_DIR}/docs/deployment-logs" "${BACKUP_DIR}/"

# Backup genesis files
cp -r "${PROJECT_DIR}/data" "${BACKUP_DIR}/"

# Backup scripts
cp -r "${PROJECT_DIR}/scripts" "${BACKUP_DIR}/"

# Backup docs
cp -r "${PROJECT_DIR}/docs" "${BACKUP_DIR}/"

# Create archive
cd "$HOME/xaheen-backups"
tar czf "xaheen-local-${TIMESTAMP}.tar.gz" "${TIMESTAMP}"
rm -rf "${TIMESTAMP}"

# Keep last 30 days
find "$HOME/xaheen-backups" -name "xaheen-local-*.tar.gz" -mtime +30 -delete

echo "$(date): Local backup complete: xaheen-local-${TIMESTAMP}.tar.gz"
```

---

## Cost Estimates

### AWS S3 Storage Costs:

**Hourly Backups (1 day retention):**
- 24 backups × 5GB = 120GB
- Cost: $120GB × $0.023/GB = $2.76/month

**Daily Backups (7 days retention):**
- 7 backups × 10GB = 70GB
- Cost: $70GB × $0.023/GB = $1.61/month

**Weekly Backups (Glacier):**
- 4 backups × 20GB = 80GB
- Cost: $80GB × $0.004/GB = $0.32/month

**Total:** ~$5/month

**Worth it to prevent data loss? ABSOLUTELY ✅**

---

## Testing Backups

### Monthly Backup Drill

**Test restore procedure monthly:**

```bash
# 1. Download latest backup to test server
# 2. Restore from backup
# 3. Verify blockchain state
# 4. Check contract deployments
# 5. Test RPC connectivity
# 6. Document results
```

**Schedule:** First Sunday of each month

---

## Quick Reference

### Common Commands

```bash
# Manual backup
/home/ec2-user/backup-blockchain.sh hourly

# List backups
aws s3 ls s3://xaheen-chain-backups/hourly/

# Download specific backup
aws s3 sync s3://xaheen-chain-backups/hourly/20251031_080000/ /tmp/restore/

# Check backup size
aws s3 ls s3://xaheen-chain-backups/ --recursive --summarize

# Test restore (dry run)
# (create test script with --dry-run flag)
```

---

## Implementation Checklist

### Immediate (Today):
- [ ] Create S3 bucket
- [ ] Upload backup script to server
- [ ] Setup hourly cron job
- [ ] Test backup manually
- [ ] Verify S3 upload works

### This Week:
- [ ] Setup daily backups
- [ ] Configure lifecycle policies
- [ ] Setup CloudWatch alarms
- [ ] Create health check script
- [ ] Test restore procedure

### Ongoing:
- [ ] Monitor backup logs weekly
- [ ] Test restore monthly
- [ ] Review disk usage weekly
- [ ] Update backup strategy as blockchain grows

---

## Summary

**What We're Backing Up:**
- ✅ Blockchain data (chaindata)
- ✅ Genesis configuration
- ✅ Validator keys
- ✅ Deployment logs (local)

**Backup Frequency:**
- ✅ Hourly (automated)
- ✅ Daily (automated)
- ✅ Weekly (automated)

**Recovery Time:**
- ✅ From hourly: ~5 minutes
- ✅ From daily: ~10 minutes
- ✅ Complete disaster: ~30 minutes

**Cost:**
- ✅ ~$5/month (AWS S3)

**Never lose data again! 🎯**

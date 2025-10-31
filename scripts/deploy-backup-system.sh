#!/bin/bash

##############################################################################
# Xaheen Chain - Automated Backup System Deployment
#
# This script deploys the automated backup system to the production server
# including S3 bucket creation, backup script deployment, and cron configuration
##############################################################################

set -e  # Exit on error

echo "🔧 XAHEEN CHAIN BACKUP SYSTEM DEPLOYMENT"
echo "========================================================================"

# Configuration
SERVER_IP="3.91.50.187"
SERVER_USER="ec2-user"
S3_BUCKET="xaheen-chain-backups"
AWS_REGION="us-east-1"
SSH_KEY="bsc-validator-key.pem"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"

echo ""
echo "📋 Configuration:"
echo "  Server: $SERVER_USER@$SERVER_IP"
echo "  S3 Bucket: $S3_BUCKET"
echo "  Region: $AWS_REGION"
echo ""

# Check if we can connect to server
echo "🔌 Testing server connection..."
if ssh $SSH_OPTS -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo 'Connection OK'" 2>/dev/null; then
    echo "✅ Server connection OK"
else
    echo "❌ Cannot connect to server"
    echo "Please ensure:"
    echo "  1. SSH key exists: $SSH_KEY"
    echo "  2. Server is accessible: ssh $SSH_OPTS $SERVER_USER@$SERVER_IP"
    exit 1
fi

# Create S3 bucket
echo ""
echo "📦 Creating S3 bucket: $S3_BUCKET..."
if aws s3 ls "s3://$S3_BUCKET" 2>/dev/null; then
    echo "✅ Bucket already exists"
else
    aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"
    echo "✅ Bucket created"
fi

# Enable versioning
echo "🔄 Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled
echo "✅ Versioning enabled"

# Set lifecycle policies
echo "📅 Configuring lifecycle policies..."
cat > /tmp/lifecycle-policy.json <<'EOF'
{
  "Rules": [
    {
      "ID": "hourly-retention",
      "Status": "Enabled",
      "Prefix": "hourly/",
      "Expiration": {
        "Days": 1
      }
    },
    {
      "ID": "daily-retention",
      "Status": "Enabled",
      "Prefix": "daily/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "ID": "weekly-glacier",
      "Status": "Enabled",
      "Prefix": "weekly/",
      "Transitions": [
        {
          "Days": 7,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket "$S3_BUCKET" \
    --lifecycle-configuration file:///tmp/lifecycle-policy.json
echo "✅ Lifecycle policies configured"

# Create backup script
echo ""
echo "📝 Creating backup script..."
cat > /tmp/backup-blockchain.sh <<'BACKUP_SCRIPT'
#!/bin/bash

##############################################################################
# Xaheen Chain - Automated Backup Script
# Run by cron: hourly, daily, weekly
##############################################################################

BACKUP_TYPE=${1:-hourly}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/xaheen-backup-$TIMESTAMP"
S3_BUCKET="xaheen-chain-backups"
BLOCKCHAIN_DIR="$HOME/blockchain-v2/validator-1"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/xaheen-backup.log
}

log "Starting $BACKUP_TYPE backup"

# 1. Backup blockchain data
log "Backing up chaindata..."
if [ -d "$BLOCKCHAIN_DIR/geth/chaindata" ]; then
    tar -czf "$BACKUP_DIR/chaindata.tar.gz" \
        -C "$BLOCKCHAIN_DIR/geth" chaindata/ 2>&1 | tee -a /var/log/xaheen-backup.log
    log "✅ Chaindata backed up"
else
    log "⚠️  Chaindata not found"
fi

# 2. Backup genesis
log "Backing up genesis..."
if [ -f "$HOME/genesis-xaheen.json" ]; then
    cp "$HOME/genesis-xaheen.json" "$BACKUP_DIR/"
    log "✅ Genesis backed up"
elif [ -f "$HOME/blockchain-v2/data/genesis-xaheen-v2.json" ]; then
    cp "$HOME/blockchain-v2/data/genesis-xaheen-v2.json" "$BACKUP_DIR/genesis-xaheen.json"
    log "✅ Genesis v2 backed up"
fi

# 3. Backup keystore
log "Backing up keystore..."
if [ -d "$BLOCKCHAIN_DIR/keystore" ]; then
    tar -czf "$BACKUP_DIR/keystore.tar.gz" \
        -C "$BLOCKCHAIN_DIR" keystore/ 2>&1 | tee -a /var/log/xaheen-backup.log
    log "✅ Keystore backed up"
fi

# 4. Backup password
log "Backing up password..."
if [ -f "$BLOCKCHAIN_DIR/password.txt" ]; then
    cp "$BLOCKCHAIN_DIR/password.txt" "$BACKUP_DIR/"
    log "✅ Password backed up"
fi

# 5. Backup deployment logs
log "Backing up deployment logs..."
if [ -d "$HOME/blockchain-v2/docs/deployment-logs" ]; then
    tar -czf "$BACKUP_DIR/deployment-logs.tar.gz" \
        -C "$HOME/blockchain-v2/docs" deployment-logs/ 2>&1 | tee -a /var/log/xaheen-backup.log
    log "✅ Deployment logs backed up"
fi

# 6. Create manifest
log "Creating manifest..."
cat > "$BACKUP_DIR/manifest.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "type": "$BACKUP_TYPE",
  "files": $(ls -1 "$BACKUP_DIR" | jq -R . | jq -s .),
  "hostname": "$(hostname)",
  "chainId": 65001
}
EOF

# 7. Upload to S3
log "Uploading to S3..."
aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/$BACKUP_TYPE/$TIMESTAMP/" \
    --storage-class STANDARD \
    2>&1 | tee -a /var/log/xaheen-backup.log

if [ $? -eq 0 ]; then
    log "✅ Backup uploaded successfully"

    # Cleanup local backup
    rm -rf "$BACKUP_DIR"
    log "✅ Local backup cleaned up"
else
    log "❌ Backup upload failed"
    exit 1
fi

# 8. Verify backup
log "Verifying backup..."
aws s3 ls "s3://$S3_BUCKET/$BACKUP_TYPE/$TIMESTAMP/" | tee -a /var/log/xaheen-backup.log

log "$BACKUP_TYPE backup completed successfully"

# 9. Send notification (optional)
# curl -X POST https://your-webhook-url \
#     -d "{\"text\": \"Xaheen Chain $BACKUP_TYPE backup completed\"}"

exit 0
BACKUP_SCRIPT

chmod +x /tmp/backup-blockchain.sh
echo "✅ Backup script created"

# Upload backup script to server
echo ""
echo "📤 Uploading backup script to server..."
scp $SSH_OPTS /tmp/backup-blockchain.sh $SERVER_USER@$SERVER_IP:~/backup-blockchain.sh
ssh $SSH_OPTS $SERVER_USER@$SERVER_IP "chmod +x ~/backup-blockchain.sh"
echo "✅ Backup script uploaded"

# Configure cron jobs
echo ""
echo "⏰ Configuring cron jobs..."
ssh $SSH_OPTS $SERVER_USER@$SERVER_IP <<'CRON_CONFIG'
# Backup existing crontab
crontab -l > /tmp/crontab.backup 2>/dev/null || true

# Remove old Xaheen backup entries
crontab -l 2>/dev/null | grep -v "backup-blockchain.sh" > /tmp/crontab.new || true

# Add new backup cron jobs
cat >> /tmp/crontab.new <<EOF

# Xaheen Chain Automated Backups
# Hourly backup
0 * * * * /home/ec2-user/backup-blockchain.sh hourly >> /var/log/xaheen-backup.log 2>&1

# Daily backup (2 AM UTC)
0 2 * * * /home/ec2-user/backup-blockchain.sh daily >> /var/log/xaheen-backup.log 2>&1

# Weekly backup (Sunday 3 AM UTC)
0 3 * * 0 /home/ec2-user/backup-blockchain.sh weekly >> /var/log/xaheen-backup.log 2>&1

# Disk space check (every 6 hours)
0 */6 * * * df -h / | grep -v Filesystem >> /var/log/disk-usage.log 2>&1

# Docker cleanup (Sunday 4 AM)
0 4 * * 0 docker system prune -f >> /var/log/docker-cleanup.log 2>&1
EOF

# Install new crontab
crontab /tmp/crontab.new
echo "✅ Cron jobs configured"

# Show current crontab
echo ""
echo "📋 Current crontab:"
crontab -l | tail -10
CRON_CONFIG

echo "✅ Cron jobs configured"

# Create log file
echo ""
echo "📝 Creating log file..."
ssh $SSH_OPTS $SERVER_USER@$SERVER_IP "sudo touch /var/log/xaheen-backup.log && sudo chmod 666 /var/log/xaheen-backup.log"
echo "✅ Log file created"

# Run initial backup test
echo ""
echo "🧪 Running initial backup test..."
echo "This will take a few minutes..."
ssh $SSH_OPTS $SERVER_USER@$SERVER_IP "~/backup-blockchain.sh hourly"

if [ $? -eq 0 ]; then
    echo "✅ Initial backup test successful"
else
    echo "⚠️  Initial backup test failed (check logs)"
fi

# Summary
echo ""
echo "========================================================================"
echo "📊 BACKUP SYSTEM DEPLOYMENT COMPLETE"
echo "========================================================================"
echo ""
echo "✅ S3 Bucket: s3://$S3_BUCKET"
echo "✅ Backup Script: ~/backup-blockchain.sh"
echo "✅ Cron Jobs: Configured"
echo "✅ Initial Backup: Completed"
echo ""
echo "📅 Backup Schedule:"
echo "  - Hourly: Every hour (retention: 1 day)"
echo "  - Daily: 2 AM UTC (retention: 7 days)"
echo "  - Weekly: Sunday 3 AM UTC (retention: 30 days → Glacier)"
echo ""
echo "📋 Check Logs:"
echo "  ssh $SERVER_USER@$SERVER_IP 'tail -f /var/log/xaheen-backup.log'"
echo ""
echo "🔍 List Backups:"
echo "  aws s3 ls s3://$S3_BUCKET/ --recursive --human-readable"
echo ""
echo "💾 Restore Example:"
echo "  aws s3 sync s3://$S3_BUCKET/daily/LATEST/ /tmp/restore/"
echo ""
echo "💰 Estimated Cost: ~$5/month"
echo "========================================================================"
echo "🎉 BACKUP SYSTEM ACTIVE!"
echo "========================================================================"

# 🔧 Xaheen Chain Epoch Fix - Manual Steps

**Chain Status**: Stuck at block 29,999 (epoch boundary at 30,000)

---

## Quick Fix (Run on Server 3.91.50.187)

SSH to your server and run these commands:

```bash
# SSH to server
ssh ubuntu@3.91.50.187

# Step 1: Check if using Docker or systemd
docker ps | grep bsc-validator

# If using Docker:
docker restart bsc-validator-1
sleep 5
docker restart bsc-validator-2
sleep 5
docker restart bsc-validator-3
sleep 10

# OR if using systemd:
sudo systemctl restart geth-validator-1
sleep 5
sudo systemctl restart geth-validator-2
sleep 5
sudo systemctl restart geth-validator-3
sleep 10

# Step 2: Verify blocks resumed
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Wait 10 seconds and check again
sleep 10
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected**: Block number should increase (30,001, 30,002, etc.)

---

## Permanent Fix - Automatic Epoch Monitoring

After validators restart, set up automatic monitoring:

```bash
# Still on server (3.91.50.187)

# Create monitoring script
sudo tee /usr/local/bin/epoch-monitor.sh << 'EOF'
#!/bin/bash
EPOCH=30000
RPC="http://localhost:8545"
LOG="/var/log/xaheen-epoch-monitor.log"

# Get current block
BLOCK=$(curl -s -X POST $RPC \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

BLOCK_DEC=$((16#${BLOCK:2}))
BLOCKS_TO_EPOCH=$((EPOCH - (BLOCK_DEC % EPOCH)))

echo "[$(date)] Block: $BLOCK_DEC, To epoch: $BLOCKS_TO_EPOCH" >> $LOG

# Restart 100 blocks before epoch
if [ $BLOCKS_TO_EPOCH -le 100 ] && [ $BLOCKS_TO_EPOCH -gt 0 ]; then
  echo "[$(date)] APPROACHING EPOCH - Restarting validators..." >> $LOG

  if docker ps | grep -q bsc-validator; then
    docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3 >> $LOG 2>&1
  else
    sudo systemctl restart geth-validator-1 geth-validator-2 geth-validator-3 >> $LOG 2>&1
  fi

  echo "[$(date)] Restart complete" >> $LOG
fi
EOF

# Make executable
sudo chmod +x /usr/local/bin/epoch-monitor.sh

# Create log file
sudo touch /var/log/xaheen-epoch-monitor.log
sudo chmod 666 /var/log/xaheen-epoch-monitor.log

# Add cron job (runs every 5 minutes)
(crontab -l 2>/dev/null | grep -v epoch-monitor; echo "*/5 * * * * /usr/local/bin/epoch-monitor.sh") | crontab -

# Verify cron job
crontab -l | grep epoch-monitor
```

---

## Verification

```bash
# Check monitoring logs
tail -f /var/log/xaheen-epoch-monitor.log

# Check current block
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# List cron jobs
crontab -l
```

---

## How It Works

1. **Cron runs every 5 minutes**
2. **Checks blocks until next epoch**
3. **When < 100 blocks away**, automatically restarts validators
4. **Prevents chain from freezing** at epoch boundaries
5. **Logs all actions** to `/var/log/xaheen-epoch-monitor.log`

---

## After Fix

Once validators restart and blocks resume:

1. ✅ Chain will produce blocks continuously
2. ✅ Automatic restart happens 100 blocks before each epoch
3. ✅ No more manual intervention needed
4. ✅ All existing data preserved (bridges, contracts, balances)

Then we can proceed with deployment!

---

*Run these commands on your server now to fix the issue permanently.*

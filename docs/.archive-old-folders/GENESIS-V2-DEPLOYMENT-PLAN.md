# Xaheen Chain Genesis V2 - Deployment Plan

**Date**: 2025-10-31
**Status**: Ready for Staging Test
**Version**: 2.0

---

## 🎯 Overview

Complete infrastructure overhaul with:
- ✅ 4 tokens embedded in genesis at exact addresses
- ✅ 7 validators for geographic redundancy
- ✅ Automated backup system designed
- ✅ Custom token configurations (21 septillion supplies)

---

## 📦 Token Configuration

All tokens embedded at genesis with deployer receiving full supply:

| Token | Address | Decimals | Supply | Notes |
|-------|---------|----------|--------|-------|
| **Little Rabbit (LTRBT)** | `0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05` | 18 | 21 septillion | Mirrored from BSC |
| **Bnb Tiger (BNBTiger)** | `0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D` | 24 | 21 septillion | Mirrored from BSC |
| **BTCBR** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` | 24 | 21 septillion | Mirrored from BSC |
| **USDT.z** | `0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4` | 18 | 21 septillion | BSC USDT → Xaheen |

**Deployer Address**: `0xdD779a290C937144F80Eb75b75d814c834536B1b`
**Native XHT Balance**: 21 billion XHT

---

## 👥 Validator Configuration

**7 Validators** with geographic distribution for fault tolerance:

| # | Address | Location | Region | Role |
|---|---------|----------|--------|------|
| 1 | `0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C` | Virginia | us-east-1 | RPC + Mining |
| 2 | `0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788` | Virginia | us-east-1 | Mining |
| 3 | `0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B` | Oregon | us-west-2 | Mining |
| 4 | `0x8b4b32C6853cdaeD42C88A7B4A1Cb4E4b002F294` | Oregon | us-west-2 | Mining |
| 5 | `0xeE95057aEe4F04Da10976b0DeB8dD74230CEC38d` | Ireland | eu-west-1 | Mining |
| 6 | `0x726bA3b10c9d57df9DED1b40B93e97A6D6206235` | Ireland | eu-west-1 | Mining |
| 7 | `0x76D4dE9f9324F3A6f411ca56aAB022c5856E24d9` | Singapore | ap-southeast-1 | Mining |

**Initial Balance**: 1,000 XHT each
**Fault Tolerance**: 2 validators can fail without network disruption
**Finality**: 21 seconds (7 validators × 3s blocks)

---

## ⚙️ Blockchain Configuration

- **Chain ID**: 65001 (Xaheen Chain)
- **Network ID**: 65001
- **Consensus**: Parlia PoSA (Proof of Staked Authority)
- **Block Time**: 3 seconds
- **Epoch**: 30,000 blocks (~25 hours)
- **Gas Limit**: 50,000,000
- **Genesis File**: `data/genesis-xaheen-v2.json`

---

## 📁 Generated Files

### Core Files
```
data/
├── genesis-xaheen-v2.json          # Main genesis file (deploy this)
├── validators-info-v2.json         # Validator metadata
├── bsc-token-data.json             # BSC token bytecode/metadata
└── validator-keystores-v2/         # 7 validator keystores + passwords
    ├── validator-1.json
    ├── validator-1-password.txt
    ├── validator-2.json
    ├── validator-2-password.txt
    └── ... (7 total)
```

### Deployment Scripts
```
scripts/
├── fetch-bsc-tokens.js              # Fetch token data from BSC
├── generate-xaheen-genesis-v2.js    # Generate genesis file
└── deploy-backup-system.sh          # Deploy automated backups
```

---

## 🚀 Deployment Phases

### Phase 1: Preparation ✅ COMPLETE

- [x] Fetch BSC token bytecode and metadata
- [x] Generate 7 validator keystores
- [x] Create genesis-xaheen-v2.json with all tokens
- [x] Design automated backup system

**Files Ready**:
- Genesis file with 4 tokens embedded
- 7 validator keystores
- Backup deployment script

---

### Phase 2: Staging Test 🔄 NEXT

**Objective**: Test new genesis on fresh instance before production

**Steps**:

1. **Provision staging server** (AWS EC2 t3.large)
   ```bash
   aws ec2 run-instances \
     --image-id ami-0c55b159cbfafe1f0 \
     --instance-type t3.large \
     --key-name your-key \
     --security-group-ids sg-xxxxx \
     --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=xaheen-staging}]'
   ```

2. **Install Docker & BSC node**
   ```bash
   ssh ec2-user@STAGING_IP
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   docker pull dysnix/bsc:latest
   ```

3. **Upload genesis and keystore**
   ```bash
   scp data/genesis-xaheen-v2.json ec2-user@STAGING_IP:~/genesis.json
   scp data/validator-keystores-v2/validator-1.json ec2-user@STAGING_IP:~/keystore.json
   scp data/validator-keystores-v2/validator-1-password.txt ec2-user@STAGING_IP:~/password.txt
   ```

4. **Initialize blockchain**
   ```bash
   docker run --rm \
     -v ~/:/bsc \
     -v ~/genesis.json:/genesis.json \
     dysnix/bsc init --datadir /bsc /genesis.json
   ```

5. **Start validator**
   ```bash
   docker run -d --name xaheen-staging \
     --network host \
     -v ~/:/bsc \
     dysnix/bsc \
     --datadir /bsc \
     --port 30303 \
     --http \
     --http.addr 0.0.0.0 \
     --http.port 8545 \
     --http.api eth,net,web3,txpool,parlia \
     --ws \
     --ws.addr 0.0.0.0 \
     --ws.port 8546 \
     --mine \
     --unlock 0 \
     --password /bsc/password.txt \
     --allow-insecure-unlock
   ```

6. **Verify tokens**
   ```bash
   # Check each token exists at specified address
   curl -X POST http://STAGING_IP:8545 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05","latest"],"id":1}'

   # Should return bytecode (not "0x")
   ```

7. **Test token functions**
   ```bash
   # Deploy test script to verify:
   # - Token balances
   # - Token transfers
   # - Decimals correct
   # - Total supply correct
   node scripts/verify-genesis-tokens.js
   ```

**Expected Results**:
- ✅ All 4 tokens deployed at correct addresses
- ✅ Deployer has full token supply
- ✅ Token transfers work correctly
- ✅ Blocks being produced every 3 seconds

**Duration**: 2-4 hours

---

### Phase 3: Production Backup ⏳ PENDING

**Objective**: Deploy automated backup system BEFORE genesis update

**Prerequisites**:
- AWS CLI configured with credentials
- SSH access to production server (3.91.50.187)

**Steps**:

1. **Deploy backup system**
   ```bash
   chmod +x scripts/deploy-backup-system.sh
   ./scripts/deploy-backup-system.sh
   ```

2. **Verify backup system**
   ```bash
   # Check S3 bucket created
   aws s3 ls s3://xaheen-chain-backups/

   # Check cron jobs configured
   ssh ec2-user@3.91.50.187 "crontab -l"

   # Check initial backup completed
   ssh ec2-user@3.91.50.187 "tail -50 /var/log/xaheen-backup.log"
   ```

3. **Test restore procedure**
   ```bash
   # Download latest backup
   aws s3 sync s3://xaheen-chain-backups/hourly/LATEST/ /tmp/test-restore/

   # Verify files present
   ls -lh /tmp/test-restore/
   ```

**Expected Results**:
- ✅ S3 bucket created with lifecycle policies
- ✅ Backup script deployed to server
- ✅ Cron jobs configured (hourly, daily, weekly)
- ✅ Initial backup completed successfully
- ✅ Restore procedure verified

**Duration**: 1-2 hours
**Cost**: $5/month recurring

---

### Phase 4: Production Genesis Update 🔴 CRITICAL

**⚠️ WARNING**: This requires full blockchain reinitialization. All existing data will be lost.

**Maintenance Window**: Schedule 2-hour window, notify users 48 hours in advance

**Pre-Deployment Checklist**:
- [ ] Staging test completed successfully
- [ ] Backup system active and verified
- [ ] Final backup of current blockchain data
- [ ] All contract addresses documented
- [ ] Rollback plan prepared
- [ ] User notification sent (48 hours notice)
- [ ] Maintenance window scheduled

**Steps**:

1. **Create final backup**
   ```bash
   ssh ec2-user@3.91.50.187
   ~/backup-blockchain.sh final
   ```

2. **Stop all blockchain services**
   ```bash
   docker stop xaheen-rpc bsc-validator-2 bsc-validator-3 2>/dev/null || true
   docker ps  # Verify all stopped
   ```

3. **Backup existing deployment logs**
   ```bash
   cd ~/blockchain-v2
   tar -czf ~/deployment-logs-backup.tar.gz docs/deployment-logs/
   ```

4. **Delete old blockchain data**
   ```bash
   rm -rf ~/blockchain-v2/validator-1/geth
   rm -rf ~/blockchain-v2/validator-2/geth
   rm -rf ~/blockchain-v2/validator-3/geth
   ```

5. **Upload new genesis**
   ```bash
   # From local machine
   scp data/genesis-xaheen-v2.json ec2-user@3.91.50.187:~/genesis-xaheen-v2.json
   ```

6. **Initialize with new genesis**
   ```bash
   docker run --rm \
     -v ~/blockchain-v2/validator-1:/bsc \
     -v ~/genesis-xaheen-v2.json:/genesis.json \
     dysnix/bsc init --datadir /bsc /genesis.json
   ```

7. **Upload validator 1 keystore**
   ```bash
   # From local machine
   scp data/validator-keystores-v2/validator-1.json \
     ec2-user@3.91.50.187:~/blockchain-v2/validator-1/keystore/

   scp data/validator-keystores-v2/validator-1-password.txt \
     ec2-user@3.91.50.187:~/blockchain-v2/validator-1/password.txt
   ```

8. **Start primary validator**
   ```bash
   docker run -d --name xaheen-rpc \
     --network host \
     --restart unless-stopped \
     -v ~/blockchain-v2/validator-1:/bsc \
     dysnix/bsc \
     --datadir /bsc \
     --port 30303 \
     --http \
     --http.addr 0.0.0.0 \
     --http.port 8545 \
     --http.api eth,net,web3,txpool,parlia \
     --ws \
     --ws.addr 0.0.0.0 \
     --ws.port 8546 \
     --mine \
     --unlock 0 \
     --password /bsc/password.txt \
     --allow-insecure-unlock \
     --gcmode archive \
     --syncmode full
   ```

9. **Verify block production**
   ```bash
   # Wait 10 seconds, then check block number
   sleep 10
   curl -X POST https://rpc.xaheen.org \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

   # Should return increasing block numbers
   ```

10. **Verify all tokens**
    ```bash
    # Check each token
    for addr in \
      "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05" \
      "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D" \
      "0x0cF8e180350253271f4b917CcFb0aCCc4862F262" \
      "0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4"
    do
      echo "Checking $addr"
      curl -s -X POST https://rpc.xaheen.org \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$addr\",\"latest\"],\"id\":1}" \
        | jq -r '.result' | head -c 20
      echo ""
    done
    ```

11. **Monitor for 1 hour**
    ```bash
    # Watch logs
    docker logs -f xaheen-rpc

    # Check block production every 30 seconds
    watch -n 30 'curl -s -X POST https://rpc.xaheen.org \
      -H "Content-Type: application/json" \
      -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" \
      | jq'
    ```

**Success Criteria**:
- ✅ Blocks being produced every 3 seconds
- ✅ All 4 tokens exist at specified addresses
- ✅ RPC responding to queries
- ✅ No errors in logs for 1 hour

**Rollback Plan** (if issues):
```bash
# Stop new validator
docker stop xaheen-rpc

# Restore old genesis
aws s3 cp s3://xaheen-chain-backups/final/TIMESTAMP/genesis.json ~/genesis-old.json

# Restore chaindata
aws s3 sync s3://xaheen-chain-backups/final/TIMESTAMP/ /tmp/restore/
tar -xzf /tmp/restore/chaindata.tar.gz -C ~/blockchain-v2/validator-1/geth/

# Restart old validator
docker start xaheen-rpc
```

**Duration**: 30 minutes downtime + 1 hour monitoring
**Risk**: HIGH - Complete data loss if backup fails

---

### Phase 5: Multi-Validator Deployment ⏳ PENDING

**Objective**: Scale from 1 to 7 validators for fault tolerance

**Prerequisites**:
- Production genesis update completed successfully
- Single validator stable for 24 hours
- 7 AWS EC2 instances provisioned

**Validator Distribution**:

**Region 1: US East (Virginia)** - 2 validators
```bash
# Validator 1 (existing RPC node)
# Already running at 3.91.50.187

# Validator 2
aws ec2 run-instances \
  --region us-east-1 \
  --instance-type t3.large \
  --image-id ami-0c55b159cbfafe1f0 \
  --key-name xaheen-validators \
  --security-groups sg-xaheen-validators \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=xaheen-validator-2}]'
```

**Region 2: US West (Oregon)** - 2 validators
```bash
# Validators 3 & 4
aws ec2 run-instances \
  --region us-west-2 \
  --instance-type t3.large \
  --count 2 \
  --image-id ami-0d70546e43a941d70 \
  --key-name xaheen-validators \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=xaheen-validator-3},{Key=Name,Value=xaheen-validator-4}]'
```

**Region 3: Europe (Ireland)** - 2 validators
```bash
# Validators 5 & 6
aws ec2 run-instances \
  --region eu-west-1 \
  --instance-type t3.large \
  --count 2 \
  --image-id ami-0d71ea30463e0ff8d \
  --key-name xaheen-validators \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=xaheen-validator-5},{Key=Name,Value=xaheen-validator-6}]'
```

**Region 4: Asia (Singapore)** - 1 validator
```bash
# Validator 7
aws ec2 run-instances \
  --region ap-southeast-1 \
  --instance-type t3.large \
  --image-id ami-0c802847a7dd848c0 \
  --key-name xaheen-validators \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=xaheen-validator-7}]'
```

**Deployment Script** (per validator):
```bash
# Upload to each validator
scp data/genesis-xaheen-v2.json ec2-user@VALIDATOR_IP:~/
scp data/validator-keystores-v2/validator-N.json ec2-user@VALIDATOR_IP:~/keystore.json
scp data/validator-keystores-v2/validator-N-password.txt ec2-user@VALIDATOR_IP:~/password.txt

# On each validator
ssh ec2-user@VALIDATOR_IP <<'EOF'
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Pull BSC image
docker pull dysnix/bsc:latest

# Initialize blockchain
mkdir -p ~/validator
docker run --rm \
  -v ~/validator:/bsc \
  -v ~/genesis-xaheen-v2.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json

# Copy keystore
mkdir -p ~/validator/keystore
cp ~/keystore.json ~/validator/keystore/
cp ~/password.txt ~/validator/

# Start validator
docker run -d --name xaheen-validator \
  --network host \
  --restart unless-stopped \
  -v ~/validator:/bsc \
  dysnix/bsc \
  --datadir /bsc \
  --port 30303 \
  --mine \
  --unlock 0 \
  --password /bsc/password.txt \
  --allow-insecure-unlock \
  --gcmode full \
  --syncmode snap
EOF
```

**Static Peers Configuration**:

After all validators are running, create `static-nodes.json` with enode URLs:

```json
[
  "enode://PUBKEY1@VALIDATOR1_IP:30303",
  "enode://PUBKEY2@VALIDATOR2_IP:30303",
  "enode://PUBKEY3@VALIDATOR3_IP:30303",
  "enode://PUBKEY4@VALIDATOR4_IP:30303",
  "enode://PUBKEY5@VALIDATOR5_IP:30303",
  "enode://PUBKEY6@VALIDATOR6_IP:30303",
  "enode://PUBKEY7@VALIDATOR7_IP:30303"
]
```

Upload to each validator:
```bash
scp static-nodes.json ec2-user@VALIDATOR_IP:~/validator/static-nodes.json
docker restart xaheen-validator
```

**Verification**:
```bash
# On each validator, check peer count
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Should return "0x6" (6 peers)
```

**Cost**: $770/month (7 × $110/month)
**Duration**: 6-8 hours
**Benefit**: 2 fault tolerance, 21s finality

---

## 💰 Cost Summary

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **1 Validator (current)** | $110 | RPC + Mining |
| **6 Additional Validators** | $660 | Mining only |
| **S3 Backups** | $5 | Hourly/daily/weekly |
| **Monitoring (CloudWatch)** | $12 | All validators |
| **Total** | **$787/month** | From $110/month |

**Cost Increase**: +$677/month (+616%)
**Value**: Fault tolerance, decentralization, 21s finality

---

## 📊 Performance Expectations

| Metric | Current (1 validator) | After (7 validators) |
|--------|----------------------|---------------------|
| **TPS** | ~3,000 | ~3,000 (same) |
| **Block Time** | 3 seconds | 3 seconds (same) |
| **Finality** | 3 seconds | 21 seconds |
| **Fault Tolerance** | 0 (any failure = down) | 2 (can lose 2 validators) |
| **Geographic Distribution** | 1 region | 4 regions |
| **Uptime** | ~99.5% | ~99.99% |

---

## 🔒 Security Considerations

**Validator Keystores**:
- ⚠️ **CRITICAL**: Store `data/validator-keystores-v2/` securely
- Each keystore is encrypted with password
- Passwords stored separately
- Never commit to git
- Backup to encrypted USB drive

**Genesis File**:
- Can be public (no secrets)
- Contains only contract bytecode and initial balances
- Chain ID prevents replay attacks from other networks

**Backup Encryption**:
- S3 bucket uses server-side encryption (SSE-S3)
- Consider enabling SSE-KMS for additional security
- Enable MFA Delete on bucket

---

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Update MetaMask/wallet configurations with new genesis
- [ ] Verify all tokens accessible in wallets
- [ ] Update frontend/dApp RPC endpoints
- [ ] Re-deploy DEX contracts (if not in genesis)
- [ ] Re-add liquidity to pools
- [ ] Update documentation with new addresses

### Short-term (Week 1)
- [ ] Monitor validator performance
- [ ] Test fault tolerance (stop 1 validator)
- [ ] Verify backups running correctly
- [ ] Update block explorer with new genesis
- [ ] Test restore procedure on staging

### Medium-term (Month 1)
- [ ] Implement monitoring dashboards
- [ ] Configure alert thresholds
- [ ] Setup on-call rotation
- [ ] Document runbooks for common issues
- [ ] Review and optimize costs

---

## 🚨 Emergency Contacts

**Blockchain Issues**:
- RPC down: Check validator logs, restart if needed
- Blocks stopped: Check validator unlock, password correct
- High CPU: Check disk space, reduce logging

**Backup Issues**:
- S3 upload fails: Check AWS credentials
- Restore needed: Run restore procedure documented above
- Disk full: Run Docker cleanup, expand EBS volume

---

## 📚 References

**Generated Files**:
- Genesis: `data/genesis-xaheen-v2.json`
- Validators: `data/validators-info-v2.json`
- Keystores: `data/validator-keystores-v2/`
- Token Data: `data/bsc-token-data.json`

**Scripts**:
- Genesis Generation: `scripts/generate-xaheen-genesis-v2.js`
- Backup Deployment: `scripts/deploy-backup-system.sh`
- Token Fetch: `scripts/fetch-bsc-tokens.js`

**Documentation**:
- Backup Strategy: `docs/BACKUP_STRATEGY.md`
- Multi-Validator Setup: `docs/MULTI_VALIDATOR_SETUP.md`

---

## ✅ Completion Checklist

### Phase 1: Preparation
- [x] Fetch BSC token bytecode
- [x] Generate 7 validators
- [x] Create genesis v2
- [x] Design backup system

### Phase 2: Staging Test
- [ ] Provision staging server
- [ ] Deploy genesis v2 to staging
- [ ] Verify all tokens
- [ ] Test token transfers
- [ ] Confirm block production

### Phase 3: Backup Deployment
- [ ] Deploy backup system to production
- [ ] Verify S3 bucket creation
- [ ] Test backup script
- [ ] Verify cron jobs
- [ ] Test restore procedure

### Phase 4: Production Update
- [ ] Schedule maintenance window
- [ ] Notify users (48 hours)
- [ ] Create final backup
- [ ] Deploy new genesis
- [ ] Verify token deployment
- [ ] Monitor for 24 hours

### Phase 5: Multi-Validator
- [ ] Provision 6 additional validators
- [ ] Deploy to 4 geographic regions
- [ ] Configure static peers
- [ ] Verify connectivity
- [ ] Test fault tolerance

---

**Last Updated**: 2025-10-31
**Next Review**: After staging test completion

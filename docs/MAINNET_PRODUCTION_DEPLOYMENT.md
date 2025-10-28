# BSC Private Chain - Mainnet Production Deployment Guide

## Overview

This guide covers deploying a production-ready BSC private chain with:
- **Multi-validator setup** (3 validators for fault tolerance)
- **NGINX reverse proxy** with SSL/TLS
- **Load balancing** across validators
- **Monitoring** and health checks
- **Security hardening**

---

## Prerequisites

### 1. DNS Configuration

**CRITICAL:** Before deploying NGINX with SSL, configure your DNS:

```bash
# Add A record:
rpc.bitcoinbr.tech  →  34.230.84.141
```

Verify DNS propagation:
```bash
dig +short rpc.bitcoinbr.tech
# Should return: 34.230.84.141
```

### 2. AWS Infrastructure

- **EC2 Instance:** i-0f7452bba70ca5542 (34.230.84.141)
- **Instance Type:** t2.micro (upgrade to t3.medium for production)
- **Security Groups:** Ports 22, 80, 443, 8545-8547, 8546-8548, 30303-30305 (TCP/UDP)

---

## Deployment Steps

### Step 1: Update DNS

1. Log into your DNS provider
2. Create/Update A record: `rpc.bitcoinbr.tech` → `34.230.84.141`
3. Wait for propagation (5-15 minutes)
4. Verify: `dig +short rpc.bitcoinbr.tech`

### Step 2: Deploy Multi-Validator Setup

SSH into your server:
```bash
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141
```

Stop current single validator:
```bash
cd ~/blockchain-v2
sudo docker stop bsc
sudo docker rm bsc
```

Run multi-validator setup:
```bash
cd ~/blockchain-v2
chmod +x scripts/setup-production-multi-validator.sh
./scripts/setup-production-multi-validator.sh
```

This will create:
- 1 bootnode for P2P discovery
- 3 validators for fault tolerance
- Shared genesis with all validators
- Static nodes configuration

Start the validators:
```bash
cd ~/bsc-production
docker-compose up -d
```

Verify all containers are running:
```bash
docker-compose ps
```

Expected output:
```
bsc-bootnode       Up
bsc-validator-1    Up
bsc-validator-2    Up
bsc-validator-3    Up
```

Check logs:
```bash
docker-compose logs -f validator-1
```

Look for: `🔨 mined potential block`

### Step 3: Deploy NGINX with SSL

Copy NGINX setup script to server:
```bash
# From local machine
scp -i bsc-validator-key.pem /tmp/setup-production-nginx.sh ec2-user@34.230.84.141:~/
```

Run NGINX setup on server:
```bash
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141
chmod +x ~/setup-production-nginx.sh
sudo ./setup-production-nginx.sh
```

This will:
- Install NGINX and Certbot
- Obtain Let's Encrypt SSL certificate
- Configure reverse proxy with load balancing
- Set up automatic certificate renewal
- Enable rate limiting and security headers

### Step 4: Update NGINX for Load Balancing

Modify NGINX config to load balance across all validators:

```bash
sudo vi /etc/nginx/conf.d/bsc-rpc.conf
```

Update upstream block:
```nginx
upstream bsc_rpc {
    least_conn;  # Load balance based on connections
    server 127.0.0.1:8545 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8546 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8547 max_fails=3 fail_timeout=30s;
    keepalive 96;
}

upstream bsc_ws {
    ip_hash;  # Sticky sessions for WebSocket
    server 127.0.0.1:8546 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8547 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8548 max_fails=3 fail_timeout=30s;
    keepalive 48;
}
```

Reload NGINX:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Verification & Testing

### 1. Test HTTPS RPC Endpoint

```bash
# From local machine
curl -k -X POST https://rpc.bitcoinbr.tech \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Expected:
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
```

### 2. Test WebSocket

```bash
wscat -c wss://rpc.bitcoinbr.tech/ws -x '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
```

### 3. Verify BTCBR Contract

```bash
curl -k -X POST https://rpc.bitcoinbr.tech \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}'
```

### 4. Check SSL Certificate

```bash
curl -vI https://rpc.bitcoinbr.tech 2>&1 | grep -E "subject|issuer|expire"
```

### 5. Monitor Validator Logs

```bash
cd ~/bsc-production
docker-compose logs -f --tail=100
```

### 6. Health Check

```bash
curl https://rpc.bitcoinbr.tech/health
# Should return: OK
```

---

## Production Hardening

### 1. Restrict RPC Access (Optional)

If you want to restrict RPC to specific IPs:

```bash
# Update AWS Security Group
aws ec2 authorize-security-group-ingress \
  --group-name bsc-validator-sg \
  --protocol tcp --port 8545 \
  --source-group YOUR_APP_SECURITY_GROUP_ID \
  --region us-east-1

# Remove public access
aws ec2 revoke-security-group-ingress \
  --group-name bsc-validator-sg \
  --protocol tcp --port 8545 \
  --cidr 0.0.0.0/0 \
  --region us-east-1
```

### 2. Enable CloudWatch Monitoring

```bash
# Install CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent

# Configure metrics collection
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 3. Set Up Automated Backups

```bash
# Create backup script
cat > ~/backup-validators.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/bsc-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup keystores and passwords
cp -r ~/bsc-production/validator-*/keystore "$BACKUP_DIR/"
cp ~/bsc-production/validator-*/password.txt "$BACKUP_DIR/"
cp ~/bsc-production/config/genesis.json "$BACKUP_DIR/"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR.tar.gz" s3://your-backup-bucket/
EOF

chmod +x ~/backup-validators.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /home/ec2-user/backup-validators.sh" | crontab -
```

### 4. Upgrade Instance Type

For production load, upgrade from t2.micro:

```bash
# From local machine
aws ec2 stop-instances --instance-ids i-0f7452bba70ca5542 --region us-east-1
aws ec2 modify-instance-attribute \
  --instance-id i-0f7452bba70ca5542 \
  --instance-type "{\"Value\": \"t3.medium\"}" \
  --region us-east-1
aws ec2 start-instances --instance-ids i-0f7452bba70ca5542 --region us-east-1
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check all validators are running
cd ~/bsc-production && docker-compose ps

# Check block production
curl -s https://rpc.bitcoinbr.tech \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}' | jq

# Check peer count
for port in 8545 8546 8547; do
  echo "Validator on port $port:"
  curl -s http://localhost:$port \
    -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"net_peerCount","id":1}' | jq -r .result
done

# Check NGINX logs
sudo tail -f /var/log/nginx/bsc-rpc-access.log
```

### Weekly Checks

```bash
# Review NGINX error logs
sudo grep -i error /var/log/nginx/bsc-rpc-error.log | tail -50

# Check disk usage
df -h

# Review validator logs for errors
cd ~/bsc-production
docker-compose logs --since 7d | grep -i error

# Verify SSL certificate expiry
sudo certbot certificates
```

### Certificate Renewal

Certificate auto-renews via cron. To manually renew:

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## Troubleshooting

### Validators Not Mining

```bash
# Check validator logs
cd ~/bsc-production
docker-compose logs validator-1 | grep -i "mined\|sealed"

# Verify validator is unlocked
docker-compose logs validator-1 | grep -i "unlock"

# Restart validator
docker-compose restart validator-1
```

### NGINX 502 Error

```bash
# Check if validators are running
docker-compose ps

# Test RPC directly
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'

# Check NGINX error logs
sudo tail -50 /var/log/nginx/bsc-rpc-error.log

# Restart NGINX
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test SSL
openssl s_client -connect rpc.bitcoinbr.tech:443 -servername rpc.bitcoinbr.tech

# Renew certificate
sudo certbot renew --dry-run
```

### High CPU Usage

```bash
# Check docker stats
docker stats

# Reduce verbosity
# Edit docker-compose.yml, change --verbosity 3 to --verbosity 2
cd ~/bsc-production
docker-compose down
docker-compose up -d
```

---

## Cost Optimization

### Current Costs (Estimated)

- **t2.micro instance:** ~$8.50/month
- **Data transfer:** ~$1-2/month
- **Total:** ~$10-12/month

### Production Costs (Recommended)

- **t3.medium instance:** ~$30/month
- **EBS storage (100GB):** ~$10/month
- **Data transfer:** ~$5-10/month
- **Total:** ~$45-50/month

### Savings Achieved

- **Removed redundant instances:** 7+ instances stopped
- **Removed unused ALB:** $16/month saved
- **Monthly savings:** ~$90-150/month

---

## Security Best Practices

1. **Keep keystores encrypted** - Never expose password files
2. **Restrict SSH access** - Use security groups to limit SSH to your IP
3. **Enable AWS CloudTrail** - Audit all AWS API calls
4. **Regular updates** - Keep Docker images and system packages updated
5. **Monitor logs** - Set up alerts for unusual activity
6. **Backup regularly** - Automate keystore and genesis backups
7. **Use HTTPS only** - Never expose plain HTTP RPC endpoints
8. **Rate limiting** - NGINX config includes rate limits (100 req/s)

---

## Support & Resources

- **BSC Documentation:** https://docs.bnbchain.org/
- **Parlia Consensus:** https://docs.bnbchain.org/docs/learn/consensus
- **NGINX Best Practices:** https://www.nginx.com/blog/
- **Let's Encrypt:** https://letsencrypt.org/docs/

---

## Quick Reference

### Key Files

```
~/bsc-production/
├── docker-compose.yml          # Multi-validator orchestration
├── .env                         # Environment variables
├── VALIDATOR_INFO.txt           # Validator addresses and info
├── bootnode/
│   └── boot.key                 # Bootnode key
├── validator-1/
│   ├── keystore/                # Validator 1 private key
│   ├── password.txt             # Validator 1 password
│   └── geth/                    # Blockchain data
├── validator-2/
│   └── ...
├── validator-3/
│   └── ...
└── config/
    └── genesis.json             # Genesis configuration
```

### Key Commands

```bash
# Start validators
cd ~/bsc-production && docker-compose up -d

# Stop validators
cd ~/bsc-production && docker-compose down

# View logs
cd ~/bsc-production && docker-compose logs -f

# Restart NGINX
sudo systemctl restart nginx

# Test RPC
curl https://rpc.bitcoinbr.tech -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'

# Check SSL
sudo certbot certificates

# View NGINX logs
sudo tail -f /var/log/nginx/bsc-rpc-access.log
```

---

## Mainnet Readiness Checklist

- [ ] DNS configured (rpc.bitcoinbr.tech → 34.230.84.141)
- [ ] Multi-validator setup deployed (3 validators)
- [ ] NGINX with SSL configured
- [ ] Load balancing enabled
- [ ] Rate limiting configured
- [ ] Security groups hardened
- [ ] Monitoring set up (CloudWatch)
- [ ] Backup automation configured
- [ ] SSL certificate auto-renewal tested
- [ ] All validators mining blocks
- [ ] BTCBR contract verified
- [ ] Health checks passing
- [ ] Production instance type (t3.medium+)
- [ ] Documentation reviewed
- [ ] Team trained on operations

---

**Status:** Ready for Mainnet Deployment 🚀

# 🚀 Nor Chain - Public Launch Execution Plan

**Status**: 🔴 READY TO EXECUTE
**Client Request**: Make Nor Chain publicly accessible
**Timeline**: 1-2 weeks for complete deployment

---

## 📋 Executive Summary

Your client wants public access to Nor Chain. This document provides the complete execution plan to take your local deployment public with production-grade infrastructure.

**Current Status**: ✅ Local deployment operational (Chain ID 65001)
**Target Status**: 🌐 Public RPC, Explorer, and Documentation accessible globally

---

## 🎯 Phase 1: Domain & DNS Setup (Day 1-2)

### Step 1.1: Register Domain

**Domain**: xaheen.org

**Recommended Registrars**:
- Namecheap: $8.88/year
- GoDaddy: $11.99/year
- Google Domains: $12/year

**Action**:
```bash
1. Visit namecheap.com or godaddy.com
2. Search for "xaheen.org"
3. Purchase for 1-3 years
4. Use privacy protection (included)
```

### Step 1.2: Configure DNS Records

**Required DNS Records**:

| Type | Name | Value | TTL | Priority |
|------|------|-------|-----|----------|
| A | @ | `YOUR_SERVER_IP` | 300 | - |
| A | rpc | `YOUR_SERVER_IP` | 300 | - |
| A | ws | `YOUR_SERVER_IP` | 300 | - |
| A | explorer | `YOUR_SERVER_IP` | 300 | - |
| A | docs | `YOUR_SERVER_IP` | 300 | - |
| A | bridge | `YOUR_SERVER_IP` | 300 | - |
| CNAME | www | xaheen.org | 300 | - |

**Setup Commands** (via Namecheap/GoDaddy dashboard):
1. Log into DNS management
2. Add each record above
3. Wait 5-15 minutes for propagation

**Verification**:
```bash
# Check DNS propagation
dig xaheen.org
dig rpc.xaheen.org
dig explorer.xaheen.org

# Should return your server IP
```

---

## 🖥️ Phase 2: Cloud Infrastructure (Day 2-4)

### Step 2.1: Choose Cloud Provider

**Recommended**: AWS, DigitalOcean, or Hetzner

**Cost Comparison** (Monthly):
- AWS t3.xlarge: ~$120/month
- DigitalOcean: ~$80/month (8GB RAM, 4 vCPU)
- Hetzner: ~$40/month (16GB RAM, 4 vCPU) - Best value

### Step 2.2: Provision Server

**Recommended Specs** (Hetzner CPX41):
- **CPU**: 8 vCPU
- **RAM**: 16 GB
- **Storage**: 240 GB NVMe SSD + 500 GB volume
- **Network**: 20 TB transfer
- **Cost**: ~$40/month

**Setup Script**:
```bash
# Create server via Hetzner Cloud Console
# Or use API:
curl -X POST https://api.hetzner.cloud/v1/servers \
  -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "xaheen-validator-1",
    "server_type": "cpx41",
    "image": "ubuntu-22.04",
    "location": "nbg1",
    "ssh_keys": ["YOUR_SSH_KEY_ID"]
  }'
```

### Step 2.3: Initial Server Configuration

**SSH into server**:
```bash
ssh root@YOUR_SERVER_IP
```

**Install prerequisites**:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install docker-compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install other tools
apt install -y git curl wget nginx certbot python3-certbot-nginx ufw

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8545/tcp
ufw allow 8546/tcp
ufw allow 30303/tcp
ufw allow 30303/udp
ufw enable
```

---

## 🔐 Phase 3: SSL Certificate Setup (Day 3)

### Step 3.1: Install Certbot

```bash
# Already installed in Phase 2
certbot --version
```

### Step 3.2: Obtain SSL Certificates

```bash
# For main domain
certbot certonly --nginx -d xaheen.org -d www.xaheen.org

# For RPC subdomain
certbot certonly --nginx -d rpc.xaheen.org

# For WebSocket
certbot certonly --nginx -d ws.xaheen.org

# For Explorer
certbot certonly --nginx -d explorer.xaheen.org

# For Docs
certbot certonly --nginx -d docs.xaheen.org

# For Bridge
certbot certonly --nginx -d bridge.xaheen.org
```

### Step 3.3: Configure Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Setup cron job for auto-renewal
crontab -e

# Add this line:
0 0 * * * certbot renew --quiet
```

---

## 🔗 Phase 4: Nginx Reverse Proxy (Day 3-4)

### Step 4.1: Configure Nginx for RPC

**Create**: `/etc/nginx/sites-available/xaheen-rpc`

```nginx
upstream xaheen_rpc {
    server 127.0.0.1:8545;
    keepalive 32;
}

server {
    listen 80;
    server_name rpc.xaheen.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rpc.xaheen.org;

    ssl_certificate /etc/letsencrypt/live/rpc.xaheen.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.xaheen.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=100r/s;
    limit_req zone=rpc_limit burst=200 nodelay;

    location / {
        proxy_pass http://xaheen_rpc;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Step 4.2: Configure Nginx for WebSocket

**Create**: `/etc/nginx/sites-available/xaheen-ws`

```nginx
upstream xaheen_ws {
    server 127.0.0.1:8546;
}

server {
    listen 80;
    server_name ws.xaheen.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ws.xaheen.org;

    ssl_certificate /etc/letsencrypt/live/ws.xaheen.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ws.xaheen.org/privkey.pem;

    location / {
        proxy_pass http://xaheen_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket timeout (keep connection alive)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Step 4.3: Enable Sites

```bash
# Create symbolic links
ln -s /etc/nginx/sites-available/xaheen-rpc /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/xaheen-ws /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## ⚙️ Phase 5: Deploy Production Validators (Day 4-6)

### Step 5.1: Clone Repository on Server

```bash
cd /root
git clone https://github.com/xaheen-chain/xaheen-node.git
cd xaheen-node
```

### Step 5.2: Transfer Genesis and Validator Data

**From local machine**:
```bash
# Copy genesis file
scp data/genesis-xaheen-65001.json root@YOUR_SERVER_IP:/root/xaheen-node/data/

# Copy validator directories (if keeping same validators)
scp -r validator-1 validator-2 validator-3 root@YOUR_SERVER_IP:/root/xaheen-node/
```

**Or reinitialize on server**:
```bash
# On server
./scripts/init-xaheen-validators.sh
```

### Step 5.3: Configure Environment

```bash
# Create .env file
cp .env.example .env
nano .env

# Set values:
CHAIN_ID=65001
NETWORK_ID=65001
CHAIN_NAME=Nor Chain
CHAIN_DOMAIN=xaheen.org
# ... other variables
```

### Step 5.4: Start Validators

```bash
# Update start script for production
nano scripts/start-xaheen-validators.sh

# Start validators
./scripts/start-xaheen-validators.sh

# Verify
docker ps | grep bsc-validator
```

### Step 5.5: Setup Systemd Service (Production)

**Create**: `/etc/systemd/system/xaheen-validator-1.service`

```ini
[Unit]
Description=Nor Chain Validator 1
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
WorkingDirectory=/root/xaheen-node
ExecStart=/usr/bin/docker start -a bsc-validator-1
ExecStop=/usr/bin/docker stop bsc-validator-1

[Install]
WantedBy=multi-user.target
```

**Enable services**:
```bash
systemctl enable xaheen-validator-1
systemctl start xaheen-validator-1
systemctl status xaheen-validator-1
```

---

## 🔍 Phase 6: Deploy Block Explorer (Day 6-8)

### Step 6.1: Install Blockscout Dependencies

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE blockscout;
CREATE USER blockscout WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE blockscout TO blockscout;
\q
```

### Step 6.2: Deploy Blockscout

**Using Docker**:
```bash
cd /root
git clone https://github.com/blockscout/blockscout.git
cd blockscout/docker-compose

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://blockscout:secure_password_here@localhost:5432/blockscout
ETHEREUM_JSONRPC_VARIANT=geth
ETHEREUM_JSONRPC_HTTP_URL=http://localhost:8545
ETHEREUM_JSONRPC_WS_URL=ws://localhost:8546
CHAIN_ID=65001
COIN=NOR
SUBNETWORK=Nor Chain
LOGO=/images/xaheen_logo.svg
EOF

# Start Blockscout
docker-compose up -d
```

### Step 6.3: Configure Nginx for Explorer

**Create**: `/etc/nginx/sites-available/xaheen-explorer`

```nginx
server {
    listen 80;
    server_name explorer.xaheen.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name explorer.xaheen.org;

    ssl_certificate /etc/letsencrypt/live/explorer.xaheen.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/explorer.xaheen.org/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/xaheen-explorer /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 📚 Phase 7: Deploy Documentation (Day 8-9)

### Step 7.1: Setup Documentation Site

**Using Docusaurus**:
```bash
cd /root
npx create-docusaurus@latest xaheen-docs classic

cd xaheen-docs

# Copy markdown docs
cp -r /root/xaheen-node/docs/* docs/

# Build
npm run build

# Setup nginx
```

**Nginx config**: `/etc/nginx/sites-available/xaheen-docs`

```nginx
server {
    listen 80;
    server_name docs.xaheen.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name docs.xaheen.org;

    ssl_certificate /etc/letsencrypt/live/docs.xaheen.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/docs.xaheen.org/privkey.pem;

    root /root/xaheen-docs/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🧪 Phase 8: Testing & Verification (Day 9-10)

### Step 8.1: Test RPC Endpoint

```bash
# From external machine
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected: {"jsonrpc":"2.0","id":1,"result":"0xfde9"}
```

### Step 8.2: Test WebSocket

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('wss://ws.xaheen.org');

ws.on('open', () => {
  console.log('Connected!');
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_subscribe',
    params: ['newHeads'],
    id: 1
  }));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});
```

### Step 8.3: Test MetaMask Integration

1. Open MetaMask
2. Add Network manually:
   - Network Name: Nor Chain
   - RPC URL: https://rpc.xaheen.org
   - Chain ID: 65001
   - Currency Symbol: NOR
   - Explorer: https://explorer.xaheen.org
3. Verify connection
4. Check balance

### Step 8.4: Load Testing

```bash
# Install Apache Bench
apt install apache2-utils

# Test RPC endpoint
ab -n 1000 -c 100 -p rpc_request.json -T application/json https://rpc.xaheen.org/

# Where rpc_request.json contains:
# {"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
```

---

## 📊 Phase 9: Monitoring Setup (Day 10-11)

### Step 9.1: Install Prometheus

```bash
cd /root
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Configure prometheus.yml
cat > prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'xaheen-validator'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
EOF

# Start Prometheus
./prometheus --config.file=prometheus.yml &
```

### Step 9.2: Install Grafana

```bash
apt-get install -y apt-transport-https software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
apt-get update
apt-get install grafana

systemctl enable grafana-server
systemctl start grafana-server
```

**Access**: http://YOUR_SERVER_IP:3000 (admin/admin)

### Step 9.3: Setup Alerts

**AlertManager config**:
```yaml
route:
  receiver: 'email-notifications'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'admin@xaheen.org'
        from: 'alerts@xaheen.org'
        smarthost: smtp.gmail.com:587
        auth_username: 'alerts@xaheen.org'
        auth_password: 'YOUR_PASSWORD'
```

---

## 🚀 Phase 10: Public Launch (Day 12-14)

### Step 10.1: Update Documentation

**Update all docs with public URLs**:
- Replace `localhost:8545` → `https://rpc.xaheen.org`
- Replace `localhost:8546` → `wss://ws.xaheen.org`
- Update QUICK_CONNECT.md
- Update XAHEEN_RPC_CONNECTION_PARAMETERS.md

### Step 10.2: Create Landing Page

**Create**: `/var/www/xaheen.org/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Nor Chain - Where Intelligence Meets Blockchain</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400 min-h-screen">
    <div class="container mx-auto px-4 py-16">
        <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
            <div class="text-center mb-8">
                <h1 class="text-5xl font-bold text-blue-900 mb-4">Nor Chain</h1>
                <p class="text-2xl text-blue-600">Where Intelligence Meets Blockchain 🧠⚡</p>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mb-8">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h3 class="text-xl font-bold mb-2">Network Details</h3>
                    <p><strong>Chain ID:</strong> 65001</p>
                    <p><strong>Native Token:</strong> NOR</p>
                    <p><strong>Block Time:</strong> 3 seconds</p>
                </div>

                <div class="bg-cyan-50 p-6 rounded-lg">
                    <h3 class="text-xl font-bold mb-2">Endpoints</h3>
                    <p><strong>RPC:</strong> rpc.xaheen.org</p>
                    <p><strong>Explorer:</strong> explorer.xaheen.org</p>
                    <p><strong>Docs:</strong> docs.xaheen.org</p>
                </div>
            </div>

            <div class="text-center">
                <a href="/add-to-metamask.html" class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 inline-block">
                    Add to MetaMask
                </a>
            </div>
        </div>
    </div>
</body>
</html>
```

### Step 10.3: Announce Launch

**Send to client**:
```
🎉 Nor Chain is now PUBLIC! 🎉

✅ RPC Endpoint: https://rpc.xaheen.org
✅ WebSocket: wss://ws.xaheen.org
✅ Chain ID: 65001 (0xFDE9)
✅ Explorer: https://explorer.xaheen.org
✅ Documentation: https://docs.xaheen.org

🔗 Quick Connect: https://xaheen.org/add-to-metamask.html

Test it now:
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

Expected: {"jsonrpc":"2.0","id":1,"result":"0xfde9"}
```

---

## 💰 Cost Breakdown

### Initial Setup (One-Time)
- Domain (xaheen.org): $10/year
- **Total First Year**: $10

### Monthly Recurring
- Server (Hetzner CPX41): $40/month
- Bandwidth: Included
- SSL: Free (Let's Encrypt)
- **Total Monthly**: ~$40

### Annual Cost
- **Total**: ~$490/year ($40/mo + $10 domain)

---

## ⚠️ Critical Pre-Launch Checklist

- [ ] Domain registered and DNS configured
- [ ] SSL certificates installed for all subdomains
- [ ] Server hardened (firewall, fail2ban, SSH keys)
- [ ] Validators running and synced
- [ ] RPC endpoint responding via HTTPS
- [ ] WebSocket endpoint working
- [ ] Block explorer accessible
- [ ] Documentation site live
- [ ] MetaMask integration tested
- [ ] Load testing completed
- [ ] Monitoring and alerts configured
- [ ] Backup system in place
- [ ] Genesis hash verified: `0x677806..842d4a`
- [ ] Chain ID verified: `65001` (0xFDE9)

---

## 🆘 Quick Deployment (If Time-Critical)

**If client needs it NOW**, use this fastest path:

### Option A: Use Existing Server (2-3 hours)

```bash
# 1. Point DNS to your current server IP
# 2. Install Nginx + Certbot (30 min)
apt install nginx certbot python3-certbot-nginx -y

# 3. Get SSL certs (10 min)
certbot --nginx -d rpc.xaheen.org -d ws.xaheen.org

# 4. Configure Nginx reverse proxy (20 min)
# Use configs from Phase 4

# 5. Update firewall (5 min)
ufw allow 80/tcp
ufw allow 443/tcp

# 6. Test (15 min)
curl https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# 7. Send client the URLs (5 min)
```

**Total Time**: 2-3 hours to public RPC access

### Option B: Cloud Provider Quick Deploy (4-6 hours)

Use DigitalOcean 1-Click App + Nginx configs above

---

## 📞 Next Steps

**Immediate Action Required**:

1. **Register Domain**: Go to namecheap.com and register xaheen.org (~10 min)
2. **Provision Server**: Sign up for Hetzner Cloud and create CPX41 instance (~15 min)
3. **Point DNS**: Configure A records to server IP (~10 min + 15min propagation)
4. **Deploy Stack**: Follow phases above or use Quick Deployment

**Send me**:
- Server IP address (when ready)
- Domain confirmation (when registered)

I'll provide specific commands for your exact setup!

---

## 🎯 What Client Gets

After deployment:

✅ **Public RPC**: `https://rpc.xaheen.org`
✅ **WebSocket**: `wss://ws.xaheen.org`
✅ **Block Explorer**: `https://explorer.xaheen.org`
✅ **Documentation**: `https://docs.xaheen.org`
✅ **Chain ID**: 65001
✅ **SSL Secured**: All endpoints HTTPS
✅ **Archive Node**: Full history access
✅ **24/7 Uptime**: Production monitoring

**Ready for dApp development, MetaMask integration, and public use!**

---

**© 2025 Nor Technologies**

**Where Intelligence Meets Blockchain** 🧠⚡

# 🔧 URL Troubleshooting Guide

## Which URL Failed? Let's Fix It!

---

## 1. CoinGecko Application URL

### ❌ If This Failed:
```
https://www.coingecko.com/en/request/form
```

### ✅ Try These Instead:

**Option A: Direct Link**
```
https://support.coingecko.com/hc/en-us/requests/new
```

**Option B: Email Application**
```
Email: hello@coingecko.com

Subject: Token Listing Request - Nor Token (NOR)

Body:
Hello,

I would like to request a listing for:

Token Name: Nor Token
Symbol: NOR
Contract Address: 0x26c0eaF731885b14c031cc50dB79b36458E0b355
Blockchain: Nor Chain (Custom EVM Chain)
Chain ID: 65001
RPC: https://rpc.xaheen.org
Explorer: https://explorer.xaheen.org
Website: https://xaheen.org
Twitter: [if you have]

Thank you!
```

---

## 2. CoinMarketCap Application URL

### ❌ If This Failed:
```
https://coinmarketcap.com/request/
```

### ✅ Try These Instead:

**Option A: New Application Form**
```
https://support.coinmarketcap.com/hc/en-us/requests/new?ticket_form_id=360000591272
```

**Option B: Email Application**
```
Email: listings@coinmarketcap.com

Subject: New Cryptocurrency Listing Request - NOR

Body:
Project Name: Nor Chain
Ticker: NOR
Contract Address: 0x26c0eaF731885b14c031cc50dB79b36458E0b355
Blockchain: Nor Chain
Website: https://xaheen.org
Explorer: https://explorer.xaheen.org
Whitepaper: [if you have]
```

---

## 3. Your Website URLs

### ❌ If These Failed:

```
https://xaheen.org
https://explorer.xaheen.org
https://docs.xaheen.org
```

### ✅ Quick Checks:

**Test 1: DNS Resolution**
```bash
# Check if domain resolves
nslookup xaheen.org

# Or
dig xaheen.org
```

**Test 2: Server Status**
```bash
# Check if server responds
curl -I https://xaheen.org

# Check without SSL
curl -I http://xaheen.org
```

**Test 3: SSL Certificate**
```bash
# Check SSL
curl -v https://xaheen.org 2>&1 | grep -i ssl

# Or
openssl s_client -connect xaheen.org:443
```

---

## 4. RPC Endpoint

### ❌ If This Failed:
```
https://rpc.xaheen.org
```

### ✅ Check RPC Health:

```bash
# Test RPC endpoint
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return something like:
# {"jsonrpc":"2.0","id":1,"result":"0x1234"}
```

**If RPC is down, use direct IP:**
```javascript
// Use IP instead
const provider = new ethers.JsonRpcProvider('http://3.91.50.187:8545');
```

---

## 5. MoonPay Signup URL

### ❌ If This Failed:
```
https://www.moonpay.com/dashboard/getting-started
```

### ✅ Try These Instead:

**Option A: Main Dashboard**
```
https://www.moonpay.com/dashboard
```

**Option B: Direct Signup**
```
https://www.moonpay.com/signup
```

**Option C: Contact Sales**
```
Email: sales@moonpay.com
Subject: Business Account Inquiry
```

---

## 6. API Endpoints

### ❌ If API Calls Failed:

**CoinGecko API:**
```bash
# Test if API works
curl 'https://api.coingecko.com/api/v3/ping'

# Should return: {"gecko_says":"(V3) To the Moon!"}
```

**Your RPC API:**
```bash
# Test your chain
curl -X POST http://3.91.50.187:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "SSL Certificate Error"

**Symptoms:**
- `ERR_CERT_AUTHORITY_INVALID`
- `SSL connection error`

**Fix:**
```bash
# Option A: Access via HTTP temporarily
http://xaheen.org (instead of https://)

# Option B: Fix SSL certificate
# If using Let's Encrypt:
sudo certbot renew
sudo systemctl reload nginx

# Option C: Use IP address
http://3.91.50.187:8545
```

---

### Issue 2: "DNS Not Found"

**Symptoms:**
- `ERR_NAME_NOT_RESOLVED`
- `Could not resolve host`

**Fix:**
```bash
# Check DNS settings
# Your domain registrar should point to:
# A Record: xaheen.org → [Your Server IP]
# A Record: *.xaheen.org → [Your Server IP]

# Temporary: Use IP address
http://[YOUR_SERVER_IP]
```

---

### Issue 3: "Connection Timeout"

**Symptoms:**
- Request hangs forever
- Gateway timeout

**Fix:**
```bash
# Check if server is running
ssh user@yourserver
systemctl status nginx
systemctl status docker

# Restart services
sudo systemctl restart nginx
docker restart xaheen-rpc

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

### Issue 4: "404 Not Found"

**Symptoms:**
- Page doesn't exist
- 404 error

**Fix:**
```bash
# Check file exists
ls -la /var/www/html/

# Upload files if missing
scp frontend/*.html user@server:/var/www/html/

# Check nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🎯 Quick Diagnostics

**Run these to identify the problem:**

```bash
# 1. Test basic connectivity
ping xaheen.org

# 2. Test HTTP
curl -I http://xaheen.org

# 3. Test HTTPS
curl -I https://xaheen.org

# 4. Test RPC
curl -X POST http://3.91.50.187:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 5. Check DNS
nslookup xaheen.org

# 6. Check ports
telnet xaheen.org 80
telnet xaheen.org 443
```

---

## 📋 Alternative URLs (If Main Ones Don't Work)

### For Listings:

**CoinGecko:**
- Main: https://www.coingecko.com
- Support: https://support.coingecko.com
- Email: hello@coingecko.com
- Telegram: @coingecko

**CoinMarketCap:**
- Main: https://coinmarketcap.com
- Support: https://support.coinmarketcap.com
- Email: listings@coinmarketcap.com
- Form: https://coinmarketcap.com/new-cryptocurrency/

---

## 🆘 Emergency Access

**If ALL URLs fail, you can:**

### 1. Use Direct IP Addresses
```javascript
// Instead of RPC URL
const provider = new ethers.JsonRpcProvider('http://3.91.50.187:8545');
```

### 2. Apply via Email
```
CoinGecko: hello@coingecko.com
CoinMarketCap: listings@coinmarketcap.com
```

### 3. Check Server Status
```bash
# SSH into your server
ssh user@3.91.50.187

# Check services
systemctl status nginx
docker ps
```

---

## 🔍 What Specific URL Failed?

**Tell me which one and I'll help:**

1. **CoinGecko application?** → Use email instead
2. **CoinMarketCap application?** → Use email instead
3. **xaheen.org website?** → Check DNS/SSL
4. **RPC endpoint?** → Use IP address
5. **MoonPay signup?** → Try alternatives
6. **API calls?** → Check endpoints

**Reply with the error message and I'll give you the exact fix!** 🔧

---

## 💡 Pro Tip: Immediate Workaround

**While fixing URLs, you can:**

```bash
# 1. Apply via email (works 100%)
Email CoinGecko: hello@coingecko.com
Email CoinMarketCap: listings@coinmarketcap.com

# 2. Use IP instead of domain
http://3.91.50.187:8545 (RPC)
http://[YOUR_IP] (website)

# 3. Skip problematic URLs
Focus on what works:
- Your DEX is operational ✅
- RPC via IP works ✅
- Can deploy bridge ✅
```

---

**What exactly failed? I'll help you fix it!** 🚀

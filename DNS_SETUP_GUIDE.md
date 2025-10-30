# 🌐 Xaheen Chain - DNS Setup Guide

**Quick DNS configuration for public launch**

---

## Required DNS Records

Configure these DNS records at your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):

### For domain: **xaheen.org**

Replace `YOUR_SERVER_IP` with your actual server IP address.

```
Type    Name        Value               TTL
────────────────────────────────────────────────
A       @           YOUR_SERVER_IP      300
A       rpc         YOUR_SERVER_IP      300
A       ws          YOUR_SERVER_IP      300
A       explorer    YOUR_SERVER_IP      300
A       docs        YOUR_SERVER_IP      300
A       bridge      YOUR_SERVER_IP      300
A       status      YOUR_SERVER_IP      300
A       www         YOUR_SERVER_IP      300
```

---

## DNS Provider Instructions

### Namecheap

1. Log in to Namecheap
2. Go to Domain List → Manage → Advanced DNS
3. Add each A Record:
   - **Type**: A Record
   - **Host**: (use values from table above: @, rpc, ws, etc.)
   - **Value**: YOUR_SERVER_IP
   - **TTL**: Automatic (or 5 min)

### GoDaddy

1. Log in to GoDaddy
2. My Products → DNS
3. Click "Add" for each record:
   - **Type**: A
   - **Name**: (use values from table)
   - **Value**: YOUR_SERVER_IP
   - **TTL**: 1/2 Hour

### Cloudflare (Recommended for DDoS protection)

1. Log in to Cloudflare
2. Select your domain
3. DNS tab → Add record
4. For each A record:
   - **Type**: A
   - **Name**: (@ for root, rpc, ws, etc.)
   - **IPv4 address**: YOUR_SERVER_IP
   - **Proxy status**: ⚠️ DNS only (orange cloud OFF) for RPC/WS
   - **TTL**: Auto

**Important**: For `rpc` and `ws` subdomains, disable Cloudflare proxy (gray cloud) to allow direct WebSocket connections.

### Google Domains

1. Log in to Google Domains
2. DNS → Custom records
3. Add each record:
   - **Host name**: (@ for root, rpc, ws, etc.)
   - **Type**: A
   - **TTL**: 5m
   - **Data**: YOUR_SERVER_IP

---

## Verification

After adding DNS records, wait 5-15 minutes, then verify:

```bash
# Check root domain
dig xaheen.org +short
# Should return: YOUR_SERVER_IP

# Check RPC subdomain
dig rpc.xaheen.org +short
# Should return: YOUR_SERVER_IP

# Check WebSocket subdomain
dig ws.xaheen.org +short
# Should return: YOUR_SERVER_IP

# Check all at once
for sub in @ rpc ws explorer docs bridge status www; do
  if [ "$sub" = "@" ]; then
    echo "Root domain (xaheen.org):"
    dig xaheen.org +short
  else
    echo "$sub.xaheen.org:"
    dig $sub.xaheen.org +short
  fi
done
```

---

## SSL Certificate Installation

**After DNS propagates** (5-15 minutes), install SSL certificates:

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install certificates for RPC endpoint
certbot --nginx -d rpc.xaheen.org --non-interactive --agree-tos -m admin@xaheen.org

# Install certificates for WebSocket endpoint
certbot --nginx -d ws.xaheen.org --non-interactive --agree-tos -m admin@xaheen.org

# Install certificates for explorer (if deploying full infrastructure)
certbot --nginx -d explorer.xaheen.org --non-interactive --agree-tos -m admin@xaheen.org

# Install certificates for root domain
certbot --nginx -d xaheen.org -d www.xaheen.org --non-interactive --agree-tos -m admin@xaheen.org

# Verify SSL
certbot certificates

# Test auto-renewal
certbot renew --dry-run
```

---

## Test Public Endpoints

```bash
# Test HTTPS RPC endpoint
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected response:
{"jsonrpc":"2.0","id":1,"result":"0xfde9"}

# Test WebSocket endpoint
wscat -c wss://ws.xaheen.org
# Then send:
{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}
```

---

## Troubleshooting

### DNS not resolving

```bash
# Check if DNS has propagated globally
https://dnschecker.org/#A/rpc.xaheen.org

# Clear local DNS cache (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Clear local DNS cache (Linux)
sudo systemd-resolve --flush-caches

# Clear local DNS cache (Windows)
ipconfig /flushdns
```

### SSL certificate fails

```bash
# Make sure DNS is fully propagated first
dig rpc.xaheen.org +short

# Check Nginx configuration
nginx -t

# Check if port 80 is accessible
curl -I http://rpc.xaheen.org

# Check Certbot logs
tail -50 /var/log/letsencrypt/letsencrypt.log
```

### RPC not accessible

```bash
# On server, check if RPC is running
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Check Nginx error logs
tail -50 /var/log/nginx/xaheen-rpc-error.log

# Check validator status
systemctl status xaheen-validator-1

# Check Docker logs
docker logs xaheen-validator-1 --tail 50
```

---

## Quick Setup Checklist

- [ ] Register domain (xaheen.org) - $10/year
- [ ] Add 8 DNS A records (see table above)
- [ ] Wait 5-15 minutes for DNS propagation
- [ ] Verify DNS with `dig` commands
- [ ] Install SSL certificates with Certbot
- [ ] Test HTTPS endpoints
- [ ] Test WebSocket endpoint
- [ ] Add network to MetaMask
- [ ] Announce launch! 🚀

---

## Recommended: Cloudflare Setup (Optional)

For DDoS protection and CDN benefits:

1. Sign up at Cloudflare.com
2. Add your domain
3. Update nameservers at your registrar to Cloudflare's nameservers
4. Add DNS records as above
5. **Important**: Set RPC and WS to "DNS only" (gray cloud, not orange)
6. Enable "Under Attack Mode" if needed for DDoS protection

---

## Timeline

| Step | Duration | Total Elapsed |
|------|----------|---------------|
| Register domain | 5 minutes | 0:05 |
| Add DNS records | 5 minutes | 0:10 |
| DNS propagation | 5-15 minutes | 0:25 |
| SSL installation | 5 minutes | 0:30 |
| Testing | 5 minutes | 0:35 |
| **Total** | **~35 minutes** | **Public Live!** ✅ |

---

**Ready to go public? Follow this guide step by step! 🌐**

**Where Intelligence Meets Blockchain** 🧠⚡

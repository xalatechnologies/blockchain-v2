# NGINX SSL Configuration for BSC RPC

This guide explains how to configure NGINX with SSL/TLS to expose your BSC RPC endpoint securely at `https://rpc.bitcoinbr.tech`.

## Prerequisites

1. **Domain Name**: Ensure `rpc.bitcoinbr.tech` is pointing to your server's public IP address
2. **Port 80 and 443**: Must be open in your firewall/security groups
3. **BSC Node Running**: The BSC node should be running on ports 8545 (RPC) and 8546 (WebSocket)

## Setup Methods

### Method 1: Using the Automated Script (Recommended)

The easiest way to set up NGINX with SSL is to use the provided script:

```bash
# On your AWS instance
cd ~/blockchain-v2
sudo ./scripts/setup-nginx-ssl.sh
```

This script will:
- Install NGINX and Certbot
- Obtain SSL certificate from Let's Encrypt
- Configure NGINX as a reverse proxy
- Set up automatic certificate renewal
- Configure firewall rules

### Method 2: Using Ansible

If you prefer using Ansible for infrastructure automation:

```bash
# From your local machine
cd infrastructure/ansible
ansible-playbook playbooks/setup-nginx-ssl.yml
```

## Configuration Details

### NGINX Features

The configuration includes:

1. **SSL/TLS Configuration**
   - TLS 1.2 and 1.3 support
   - Modern cipher suites
   - HSTS enabled for security
   - Automatic HTTP to HTTPS redirect

2. **Rate Limiting**
   - RPC requests: 10 requests/second (burst 20)
   - WebSocket connections: 5 requests/second (burst 10)

3. **CORS Support**
   - Allows cross-origin requests for web3 applications
   - Proper preflight request handling

4. **Security Headers**
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Strict-Transport-Security (HSTS)

5. **Endpoints**
   - `/` - JSON-RPC over HTTPS
   - `/ws` - WebSocket over WSS
   - `/health` - Health check endpoint

### Automatic Certificate Renewal

SSL certificates are automatically renewed every 12 hours by a cron job:

```bash
# Check renewal cron job
cat /etc/cron.d/certbot-renew
```

To manually renew certificates:

```bash
sudo certbot renew --quiet --post-hook 'systemctl reload nginx'
```

## Testing the Setup

### Test HTTP to HTTPS Redirect

```bash
curl -I http://rpc.bitcoinbr.tech
# Should return 301 redirect to HTTPS
```

### Test JSON-RPC over HTTPS

```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://rpc.bitcoinbr.tech
```

Expected response:
```json
{"jsonrpc":"2.0","id":1,"result":"0xXXXX"}
```

### Test WebSocket Connection

Using `wscat` (install with `npm install -g wscat`):

```bash
wscat -c wss://rpc.bitcoinbr.tech/ws
```

Then send a JSON-RPC request:
```json
{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
```

### Test Health Check

```bash
curl https://rpc.bitcoinbr.tech/health
# Should return: OK
```

## Monitoring and Logs

### NGINX Logs

View access logs:
```bash
sudo tail -f /var/log/nginx/rpc.bitcoinbr.tech_access.log
```

View error logs:
```bash
sudo tail -f /var/log/nginx/rpc.bitcoinbr.tech_error.log
```

### NGINX Status

Check NGINX status:
```bash
sudo systemctl status nginx
```

Reload configuration:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Troubleshooting

### Certificate Issues

Check certificate status:
```bash
sudo certbot certificates
```

Test certificate renewal:
```bash
sudo certbot renew --dry-run
```

### NGINX Configuration Issues

Test configuration syntax:
```bash
sudo nginx -t
```

View configuration:
```bash
cat /etc/nginx/sites-available/rpc.bitcoinbr.tech
```

### Connection Issues

Check if ports are open:
```bash
sudo netstat -tlnp | grep -E ':(80|443|8545|8546)'
```

Check firewall rules:
```bash
sudo ufw status
```

## Security Considerations

1. **Rate Limiting**: Adjust rate limits in NGINX configuration based on your needs
2. **IP Whitelisting**: Consider restricting access to specific IP addresses if needed
3. **DDoS Protection**: Consider using CloudFlare or AWS Shield for additional protection
4. **Monitoring**: Set up monitoring and alerting for your RPC endpoint
5. **Backup**: Regularly backup your SSL certificates and NGINX configuration

## DNS Configuration

Ensure your DNS records are correctly configured:

```
Type: A
Name: rpc.bitcoinbr.tech
Value: <Your AWS Instance Public IP>
TTL: 300
```

## Using with Web3 Applications

### JavaScript/TypeScript

```javascript
import Web3 from 'web3';

const web3 = new Web3('https://rpc.bitcoinbr.tech');

// Get block number
const blockNumber = await web3.eth.getBlockNumber();
console.log('Current block:', blockNumber);

// Using WebSocket
const wsWeb3 = new Web3('wss://rpc.bitcoinbr.tech/ws');
```

### Python

```python
from web3 import Web3

# HTTP connection
w3 = Web3(Web3.HTTPProvider('https://rpc.bitcoinbr.tech'))

# WebSocket connection
ws_w3 = Web3(Web3.WebsocketProvider('wss://rpc.bitcoinbr.tech/ws'))

print(f"Current block: {w3.eth.block_number}")
```

### MetaMask Configuration

Add custom network in MetaMask:
- **Network Name**: Bitcoin BR Network
- **RPC URL**: https://rpc.bitcoinbr.tech
- **Chain ID**: 885824
- **Currency Symbol**: BNB
- **Block Explorer URL**: (if available)

## Maintenance

### Update NGINX Configuration

1. Edit the configuration:
```bash
sudo nano /etc/nginx/sites-available/rpc.bitcoinbr.tech
```

2. Test configuration:
```bash
sudo nginx -t
```

3. Reload NGINX:
```bash
sudo systemctl reload nginx
```

### Certificate Management

View certificate details:
```bash
sudo openssl x509 -in /etc/letsencrypt/live/rpc.bitcoinbr.tech/fullchain.pem -text -noout
```

Check expiration date:
```bash
sudo certbot certificates
```

## Additional Resources

- [NGINX Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [BSC Documentation](https://docs.bnbchain.org/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)

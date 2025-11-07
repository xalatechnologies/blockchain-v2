# Nor Chain Explorer API - Deployment Guide

## Quick Start

```bash
cd services/explorer-api
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the API
pm2 start src/index.js --name norchain-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**PM2 Commands**:
```bash
pm2 status              # Check status
pm2 logs norchain-api    # View logs
pm2 restart norchain-api # Restart
pm2 stop norchain-api    # Stop
pm2 delete norchain-api  # Remove
```

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "src/index.js"]
```

Build and run:

```bash
docker build -t norchain-api .
docker run -d \
  --name norchain-api \
  -p 3000:3000 \
  --env-file .env \
  norchain-api
```

### Option 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - RPC_URL=https://rpc.xaheen.org
      - CHAIN_ID=65001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run:

```bash
docker-compose up -d
```

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/norchain-api`:

```nginx
server {
    listen 80;
    server_name api.norchain.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/norchain-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS Setup

Using Let's Encrypt:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.norchain.org
```

## Environment Variables

Production `.env`:

```env
# Server
PORT=3000
NODE_ENV=production

# RPC
RPC_URL=https://rpc.xaheen.org
WS_URL=wss://rpc.xaheen.org/ws
CHAIN_ID=65001

# Cache
ENABLE_CACHE=true
CACHE_TTL=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# API Keys (optional)
API_KEY_ENABLED=false
API_KEYS=key1,key2,key3

# CORS
CORS_ORIGIN=https://explorer.norchain.org

# Logging
LOG_LEVEL=info
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "norchain-explorer-api",
  "version": "1.0.0"
}
```

### Logs

**PM2**:
```bash
pm2 logs norchain-api
```

**Docker**:
```bash
docker logs -f norchain-api
```

**Systemd** (if using systemd service):
```bash
journalctl -u norchain-api -f
```

## Performance Tuning

### Increase Node.js Memory

```bash
NODE_OPTIONS="--max-old-space-size=4096" pm2 start src/index.js
```

### Enable Clustering

Create `cluster.js`:

```javascript
import cluster from 'cluster';
import os from 'os';
import app from './src/index.js';

if (cluster.isMaster) {
  const numWorkers = os.cpus().length;
  console.log(`Master ${process.pid} starting ${numWorkers} workers...`);
  
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  // Worker process
  app.listen(process.env.PORT || 3000);
}
```

### Redis Caching (Future)

For distributed caching across multiple instances:

```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or cloud load balancer
2. **Multiple Instances**: Run multiple API instances
3. **Shared Cache**: Use Redis for distributed caching
4. **Database**: Add database for transaction indexing

### Vertical Scaling

1. **More CPU**: For compute-intensive operations
2. **More RAM**: For caching and in-memory operations
3. **SSD Storage**: For faster database queries

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use API keys for sensitive endpoints
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable firewall rules
- [ ] Set up monitoring and alerts
- [ ] Regular backups (if using database)
- [ ] Enable logging and audit trails

## Troubleshooting

### API Not Responding

1. Check if process is running:
   ```bash
   pm2 status
   # or
   docker ps
   ```

2. Check logs:
   ```bash
   pm2 logs norchain-api
   ```

3. Check RPC connection:
   ```bash
   curl -X POST https://rpc.xaheen.org \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

### High Memory Usage

1. Reduce cache TTL
2. Limit concurrent requests
3. Increase server RAM
4. Enable garbage collection tuning

### Rate Limit Issues

1. Increase `RATE_LIMIT_MAX_REQUESTS` in `.env`
2. Use API keys for higher limits
3. Implement request queuing

## Backup and Recovery

### Configuration Backup

```bash
# Backup .env
cp .env .env.backup

# Backup PM2 config
pm2 save
```

### Database Backup (if using database)

```bash
# PostgreSQL
pg_dump -U user -d database > backup.sql

# MongoDB
mongodump --out /backup
```

## Updates and Maintenance

### Update Dependencies

```bash
npm update
npm audit fix
```

### Deploy New Version

```bash
git pull
npm install
pm2 restart norchain-api
# or
docker-compose restart
```

### Rollback

```bash
git checkout <previous-version>
npm install
pm2 restart norchain-api
```

## Support

For deployment issues:
- Check logs first
- Review configuration
- Test RPC connection
- Verify environment variables
- Check firewall/security groups


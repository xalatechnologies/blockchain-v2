# Production Deployment Guide

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

### Manual Deployment

```bash
# Install dependencies
npm ci --only=production

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start with PM2
npm install -g pm2
pm2 start src/index.js --name norchain-api
pm2 save
pm2 startup
```

---

## 📋 Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose (optional)
- PM2 (for process management)
- Nginx (for reverse proxy)

---

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# RPC
RPC_URL=https://rpc.xaheen.org
WS_URL=wss://rpc.xaheen.org/ws
CHAIN_ID=65001

# API
API_PREFIX=/api
ENABLE_CACHE=true
CACHE_TTL=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Security
API_KEY_ENABLED=true
API_KEYS=your-key-1,your-key-2

# CORS
CORS_ORIGIN=https://yourdomain.com

# Monitoring
LOG_LEVEL=info
```

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t norchain-api:latest .
```

### Run Container

```bash
docker run -d \
  --name norchain-api \
  -p 3000:3000 \
  -e RPC_URL=https://rpc.xaheen.org \
  -e CHAIN_ID=65001 \
  -e API_KEY_ENABLED=true \
  -e API_KEYS=your-key \
  norchain-api:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Scale API instances
docker-compose up -d --scale api=3
```

---

## 🔄 Process Management (PM2)

### Basic Setup

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/index.js --name norchain-api

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'norchain-api',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Start with ecosystem:
```bash
pm2 start ecosystem.config.js
```

---

## 🌐 Nginx Reverse Proxy

### Nginx Configuration

```nginx
upstream norchain_api {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name api.norchain.org;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.norchain.org;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.norchain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.norchain.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy Settings
    location / {
        proxy_pass http://norchain_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check (bypass rate limiting)
    location /health {
        proxy_pass http://norchain_api;
        access_log off;
    }
}
```

---

## ☸️ Kubernetes Deployment

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: norchain-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: norchain-api
  template:
    metadata:
      labels:
        app: norchain-api
    spec:
      containers:
      - name: api
        image: norchain-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: RPC_URL
          value: "https://rpc.xaheen.org"
        - name: CHAIN_ID
          value: "65001"
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: norchain-api-service
spec:
  selector:
    app: norchain-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## 📊 Monitoring

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# Liveness probe (Kubernetes)
curl http://localhost:3000/health/live

# Readiness probe (Kubernetes)
curl http://localhost:3000/health/ready

# Prometheus metrics
curl http://localhost:3000/health/metrics
```

### Logging

Logs are written to:
- Console (stdout/stderr)
- PM2 logs (if using PM2)
- Docker logs (if using Docker)

### Metrics

Prometheus-compatible metrics available at `/health/metrics`:
- Request count
- Error rate
- Response times
- Memory usage
- CPU usage

---

## 🔒 Security Checklist

- [ ] Enable API key authentication
- [ ] Configure CORS properly
- [ ] Use HTTPS (SSL/TLS)
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use non-root user in Docker
- [ ] Enable request logging
- [ ] Set up monitoring alerts

---

## 🚨 Troubleshooting

### API Not Responding

1. Check health endpoint: `curl http://localhost:3000/health`
2. Check logs: `docker logs norchain-api` or `pm2 logs`
3. Verify RPC connection
4. Check port binding

### High Memory Usage

1. Reduce cache TTL
2. Limit concurrent requests
3. Scale horizontally
4. Check for memory leaks

### Rate Limit Issues

1. Increase rate limits in config
2. Use API keys for higher limits
3. Implement request queuing
4. Add Redis for distributed rate limiting

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Docker Compose
docker-compose up -d --scale api=5

# PM2 Cluster Mode
pm2 start src/index.js -i max

# Kubernetes
kubectl scale deployment norchain-api --replicas=5
```

### Load Balancing

Use Nginx or cloud load balancer:
- Round-robin
- Least connections
- IP hash (for sticky sessions)

---

## 🔄 Updates & Rollbacks

### Update Process

```bash
# Pull latest code
git pull

# Build new image
docker build -t norchain-api:v1.1.0 .

# Rolling update (zero downtime)
docker-compose up -d --no-deps --build api
```

### Rollback

```bash
# Revert to previous version
docker-compose up -d --no-deps api:previous-version
```

---

## 📞 Support

- **Documentation**: https://docs.norchain.org/api
- **Issues**: https://github.com/nor-chain/issues
- **Email**: devops@norchain.org

---

**Last Updated**: 2025-11-07


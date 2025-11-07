# 🚀 Quick Start Guide

Get the Nor Chain Explorer API running in 5 minutes!

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

## Installation

```bash
# 1. Navigate to directory
cd services/explorer-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your RPC URL

# 4. Start development server
npm run dev
```

API will be available at: `http://localhost:3000/api`

## Test It

```bash
# Health check
curl http://localhost:3000/health

# Get balance
curl "http://localhost:3000/api/account/balance?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"

# Network stats
curl http://localhost:3000/api/stats/networkstats
```

## Interactive Tools

- **Swagger UI**: http://localhost:3000/api-docs
- **GraphQL Playground**: http://localhost:3000/api/graphql
- **API Playground**: http://localhost:3000/api/playground

## Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Security audit
npm run security:audit
```

## Production Deployment

### Docker

```bash
docker-compose up -d
```

### PM2

```bash
pm2 start ecosystem.config.js
```

## Next Steps

1. Read [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. Check [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
3. Review [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
4. Explore [COMPLETE_API_REFERENCE.md](./COMPLETE_API_REFERENCE.md)

## Need Help?

- 📚 Documentation: https://docs.norchain.org/api
- 💬 Discord: https://discord.gg/norchain
- 📧 Email: support@norchain.org

---

**Ready to build!** 🎉

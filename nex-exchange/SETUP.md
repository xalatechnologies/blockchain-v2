# NEX Exchange - Complete Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd nex-exchange
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
# RPC Endpoints
NEXT_PUBLIC_NORCHAIN_RPC=https://rpc.norchain.org
NEXT_PUBLIC_NORCHAIN_WS=wss://ws.norchain.org:8546
NEXT_PUBLIC_CHAIN_ID=65001

# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/nex

# Redis Cache (OPTIONAL)
REDIS_URL=redis://localhost:6379

# NEXRouter Contract (after deployment)
NEXT_PUBLIC_NEX_ROUTER_ADDRESS=0x...
```

### 3. Setup Database

**Option A: PostgreSQL (Local)**

```bash
# Create database
createdb nex

# Run schema
npm run db:setup

# Seed initial data (optional)
npm run db:seed
```

**Option B: Supabase (Cloud)**

1. Create project at https://supabase.com
2. Get connection string from Settings → Database
3. Set `DATABASE_URL` in `.env.local`
4. Run schema:
   ```bash
   npm run db:setup
   ```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup

### Schema

The database schema includes:

- **users** - User accounts and KYC status
- **limit_orders** - Pending limit orders
- **stop_loss_orders** - Active stop-loss orders
- **dca_schedules** - DCA execution schedules
- **trades** - Trade history
- **portfolio_snapshots** - Portfolio analytics
- **price_history** - Price charts data

### Commands

```bash
# Setup database (creates schema)
npm run db:setup

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

## Connection Configuration

### RPC Endpoints

**HTTP RPC** (Transactions, Queries):
- Endpoint: `https://rpc.norchain.org`
- Used for: Sending transactions, querying balances, contract calls

**WebSocket RPC** (Real-time):
- Endpoint: `wss://ws.norchain.org:8546`
- Used for: Real-time balance updates, event subscriptions, block monitoring

### Connection Types

1. **Direct RPC** (Recommended)
   - Lower latency
   - Full control
   - No API dependency

2. **API Routes** (Caching Layer)
   - Price aggregation
   - Quote caching
   - Rate limiting

## Testing

### Run Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# E2E tests (requires dev server)
npm run test:e2e

# Performance tests
npm run test:performance

# Security tests
npm run test:security

# All tests
npm run test:all
```

### Test Coverage

Target: **100% coverage**
- Branches: 100%
- Functions: 100%
- Lines: 100%
- Statements: 100%

## Production Deployment

### 1. Build

```bash
npm run build
```

### 2. Environment Variables

Set in production environment:
- `DATABASE_URL`
- `NEXT_PUBLIC_NORCHAIN_RPC`
- `NEXT_PUBLIC_NORCHAIN_WS`
- `REDIS_URL` (optional)

### 3. Database Migration

```bash
npm run db:migrate
```

### 4. Deploy

**Vercel**:
```bash
vercel --prod
```

**Docker**:
```bash
docker build -t nex-exchange .
docker run -p 3000:3000 nex-exchange
```

## Architecture

### Connection Flow

```
User Browser
    ↓
Wagmi (WebSocket) → NorChain RPC
    ↓
Next.js API Routes
    ↓
HTTP RPC → NorChain
    ↓
Database (PostgreSQL)
    ↓
Cache (Redis/Memory)
```

### Storage

- **Database**: PostgreSQL/Supabase (REQUIRED)
- **Cache**: Redis/Memory (OPTIONAL)

## Troubleshooting

### Database Connection Failed

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Verify environment variable
echo $DATABASE_URL
```

### RPC Connection Failed

```bash
# Test HTTP RPC
curl -X POST https://rpc.norchain.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test WebSocket (requires wscat)
wscat -c wss://ws.norchain.org:8546
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Check test environment
npm test -- --verbose
```

## Health Checks

### Database Health

```bash
curl http://localhost:3000/api/db/health
```

### Cache Stats

```bash
curl http://localhost:3000/api/cache/stats
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment
3. ✅ Setup database
4. ✅ Run tests
5. ⏳ Deploy NEXRouter contract
6. ⏳ Configure contract addresses
7. ⏳ Deploy to production

---

**Status**: ✅ **SETUP COMPLETE - READY FOR DEVELOPMENT**


# NEX Exchange - Connection & Storage Guide

## Connection Strategy

### ✅ Direct RPC Connection (Recommended)

**Why Direct RPC?**
- ✅ Lower latency (no API layer)
- ✅ Full control over requests
- ✅ No API dependency
- ✅ Real-time WebSocket support

### Connection Types

#### 1. HTTP RPC (Primary)
- **Endpoint**: `https://rpc.norchain.org`
- **Use Cases**:
  - Transaction sending
  - Balance queries
  - Contract calls
  - Block data queries
- **Implementation**: `src/lib/rpc-provider.ts` → `getHttpProvider()`

#### 2. WebSocket RPC (Real-time)
- **Endpoint**: `wss://ws.norchain.org:8546`
- **Use Cases**:
  - Real-time balance updates
  - Transaction status monitoring
  - Event subscriptions (swaps, orders)
  - Block monitoring
- **Implementation**: `src/lib/rpc-provider.ts` → `getWsProvider()`

#### 3. API Routes (Caching Layer)
- **Purpose**: Caching, rate limiting, aggregation
- **Not Required**: Blockchain operations work without API
- **Benefits**: Faster responses, reduced RPC calls

## Storage Requirements

### ✅ Database (PostgreSQL/Supabase) - REQUIRED

**Why Database?**
- Limit orders need persistence (off-chain)
- Stop-loss orders need monitoring
- DCA schedules need execution tracking
- Trade history for analytics
- Portfolio snapshots

**Setup**:

1. **Create Database**:
```sql
CREATE DATABASE nex;
```

2. **Run Schema**:
```bash
psql nex < src/lib/db/schema.sql
```

Or use Supabase:
- Create project
- Run SQL from `src/lib/db/schema.sql`

3. **Configure Environment**:
```env
DATABASE_URL=postgresql://user:password@host:5432/nex
```

**Tables**:
- `users` - User accounts and KYC
- `limit_orders` - Pending limit orders
- `stop_loss_orders` - Active stop-loss orders
- `dca_schedules` - DCA execution schedules
- `trades` - Trade history
- `portfolio_snapshots` - Portfolio analytics
- `price_history` - Price charts data

### ✅ Cache (Redis/Memory) - OPTIONAL but RECOMMENDED

**Why Cache?**
- Reduce RPC calls (rate limiting)
- Faster response times
- Lower costs

**Setup**:

**Memory Cache** (Development - Automatic):
- Uses `node-cache`
- No setup required
- TTL: 60 seconds default

**Redis Cache** (Production - Optional):
```env
REDIS_URL=redis://localhost:6379
```

Or use Upstash Redis:
```env
REDIS_URL=redis://default:password@host:port
```

## Configuration

### Environment Variables

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

## Implementation Details

### RPC Provider (`src/lib/rpc-provider.ts`)

```typescript
import { getHttpProvider, getWsProvider, subscribeToBlocks } from "@/lib/rpc-provider";

// HTTP for transactions
const provider = getHttpProvider();
const tx = await provider.sendTransaction(signedTx);

// WebSocket for real-time
const unsubscribe = await subscribeToBlocks((blockNumber) => {
  console.log("New block:", blockNumber);
});
```

### Database Client (`src/lib/db/client.ts`)

```typescript
import { query, queryOne, transaction } from "@/lib/db/client";

// Query
const orders = await query("SELECT * FROM limit_orders WHERE user_address = $1", [address]);

// Single row
const order = await queryOne("SELECT * FROM limit_orders WHERE id = $1", [id]);

// Transaction
await transaction(async (client) => {
  await client.query("INSERT INTO orders ...");
  await client.query("UPDATE balances ...");
});
```

### Cache (`src/lib/cache.ts`)

```typescript
import { getCache, setCache } from "@/lib/cache";

// Get from cache
const cached = await getCache<Quote>("quote:key");

// Set cache
await setCache("quote:key", quote, 10); // 10 second TTL
```

## Connection Flow

```
User Browser
    ↓
Wagmi (WebSocket) → NorChain RPC (wss://ws.norchain.org:8546)
    - Real-time balance updates
    - Transaction status
    ↓
Next.js API Routes
    ↓
HTTP RPC → NorChain (https://rpc.norchain.org)
    - Price aggregation
    - Quote calculation
    ↓
Database (PostgreSQL)
    - Orders
    - Trade history
    ↓
Cache (Redis/Memory)
    - Price quotes
    - Token prices
```

## When to Use What

| Operation | Connection Type | Why |
|-----------|----------------|-----|
| Send transaction | HTTP RPC | Direct, immediate |
| Check balance | WebSocket | Real-time updates |
| Get quote | API Route | Aggregation + cache |
| Place limit order | API Route → Database | Off-chain storage |
| Monitor events | WebSocket | Real-time |
| Trade history | Database | Persistence |

## Testing

### Database Health Check

```bash
curl http://localhost:3000/api/db/health
```

### RPC Connection Test

```typescript
import { getCurrentBlockNumber } from "@/lib/rpc-provider";
const blockNumber = await getCurrentBlockNumber();
console.log("Current block:", blockNumber);
```

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` is set correctly
- Verify database is running
- Check firewall/network access

### RPC Connection Failed
- Verify RPC endpoint is accessible
- Check WebSocket endpoint (port 8546)
- Verify chain ID matches (65001)

### Cache Not Working
- Memory cache works automatically
- Redis: Check `REDIS_URL` is set
- Check Redis is running (if using)

## Production Checklist

- [ ] Database created and schema applied
- [ ] `DATABASE_URL` configured
- [ ] RPC endpoints verified
- [ ] WebSocket endpoint accessible
- [ ] Redis configured (optional)
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Health checks working

---

**Status**: ✅ **CONNECTION & STORAGE SETUP COMPLETE**


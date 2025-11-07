# NEX Exchange - Architecture Overview

## Connection Strategy

### RPC vs WebSocket vs API

**Direct RPC Connection** (Primary):
- **HTTP RPC**: Used for transactions, queries, and one-time operations
- **WebSocket RPC**: Used for real-time subscriptions (blocks, events, logs)
- **Why Direct**: Lower latency, no API dependency, full control

**API Layer** (Secondary):
- Our Next.js API routes act as a caching/proxy layer
- Rate limiting and request aggregation
- Not required for blockchain operations, but improves UX

### Connection Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Wagmi (WebSocket) → NorChain RPC (wss://...)    │   │
│  │  - Real-time balance updates                       │   │
│  │  - Transaction status                              │   │
│  │  - Event subscriptions                             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Backend)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  HTTP RPC → NorChain (https://rpc.norchain.org) │   │
│  │  - Price aggregation                               │   │
│  │  - Quote calculation                               │   │
│  │  - Order management                                │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  WebSocket → NorChain (wss://ws.norchain.org)   │   │
│  │  - Block subscriptions                             │   │
│  │  - Event monitoring                               │   │
│  │  - Order execution triggers                        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL/Supabase)             │
│  - Limit orders                                         │
│  - Stop-loss orders                                     │
│  - DCA schedules                                        │
│  - Trade history                                        │
│  - Portfolio snapshots                                  │
│  - Price history                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Cache Layer (Redis/Memory)                 │
│  - Price quotes (10s TTL)                              │
│  - Token prices (30s TTL)                               │
│  - Rate limiting                                        │
└─────────────────────────────────────────────────────────┘
```

## Storage Requirements

### Database (PostgreSQL/Supabase) - REQUIRED

**Why Database?**
- Limit orders need persistence (not on-chain)
- Stop-loss orders need monitoring
- DCA schedules need execution tracking
- Trade history for analytics
- Portfolio snapshots for performance tracking

**Tables**:
- `users` - User accounts and KYC status
- `limit_orders` - Pending limit orders
- `stop_loss_orders` - Active stop-loss orders
- `dca_schedules` - DCA execution schedules
- `trades` - Trade history
- `portfolio_snapshots` - Portfolio analytics
- `price_history` - Price charts data

### Cache (Redis/Memory) - OPTIONAL but RECOMMENDED

**Why Cache?**
- Reduce RPC calls (rate limiting)
- Faster response times
- Lower costs

**Cache Keys**:
- `quote:{tokenIn}:{tokenOut}:{amount}` - Swap quotes
- `price:{token}` - Token prices
- `ratelimit:{endpoint}:{ip}` - Rate limiting

## Connection Configuration

### Environment Variables

```env
# RPC Endpoints
NEXT_PUBLIC_NORCHAIN_RPC=https://rpc.norchain.org
NEXT_PUBLIC_NORCHAIN_WS=wss://ws.norchain.org:8546

# Database
DATABASE_URL=postgresql://user:pass@host:5432/nex

# Cache (optional)
REDIS_URL=redis://localhost:6379
```

### When to Use What

**Direct RPC (HTTP)**:
- ✅ Transaction sending
- ✅ Balance queries
- ✅ Contract calls
- ✅ Block data

**WebSocket**:
- ✅ Real-time balance updates
- ✅ Transaction status monitoring
- ✅ Event subscriptions (swaps, orders)
- ✅ Block monitoring

**API Routes**:
- ✅ Price aggregation (multiple DEXs)
- ✅ Quote caching
- ✅ Rate limiting
- ✅ Order management

**Database**:
- ✅ Limit orders (off-chain)
- ✅ Stop-loss orders
- ✅ DCA schedules
- ✅ Trade history
- ✅ Analytics

## Implementation

### RPC Provider (`src/lib/rpc-provider.ts`)
- Singleton HTTP provider
- Singleton WebSocket provider
- Block subscriptions
- Event subscriptions

### Database Client (`src/lib/db/client.ts`)
- PostgreSQL connection pool
- Query helpers
- Transaction support
- Health checks

### Cache Layer (`src/lib/cache.ts`)
- Memory cache (dev)
- Redis cache (prod)
- TTL management
- Cache statistics

## Performance Considerations

1. **RPC Rate Limiting**: Use cache to reduce RPC calls
2. **WebSocket Connections**: Reuse connections, handle reconnection
3. **Database Queries**: Use indexes, connection pooling
4. **Cache Strategy**: Short TTL for volatile data, longer for stable data

## Security

1. **RPC Endpoints**: Use HTTPS/WSS only
2. **Database**: Use connection pooling, parameterized queries
3. **Cache**: No sensitive data in cache
4. **Rate Limiting**: Per-IP, per-endpoint limits


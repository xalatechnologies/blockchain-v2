# Architecture Overview

## Current Architecture (RPC-Only)

```
Client Request
    ↓
API Server
    ↓
RPC Node (Direct Query)
    ↓
Response
```

**Limitations**:
- ❌ Slow for complex queries (scanning blocks)
- ❌ No transaction history indexing
- ❌ No token holder tracking
- ❌ No analytics/statistics
- ❌ No API usage tracking
- ❌ Rate limiting only in-memory

## Recommended Architecture (With Database)

```
Client Request
    ↓
API Server
    ↓
┌─────────────┬──────────────┐
│   Cache     │   Database    │
│   (Redis)   │  (PostgreSQL) │
└─────────────┴──────────────┘
    ↓ (if not cached)
RPC Node (for real-time data)
    ↓
Response
```

**Benefits**:
- ✅ Fast queries (indexed data)
- ✅ Transaction history
- ✅ Token holder tracking
- ✅ Analytics & statistics
- ✅ API usage tracking
- ✅ Distributed rate limiting

---

## Database Schema Design

### Tables Needed

1. **blocks** - Block data
2. **transactions** - Transaction data
3. **transaction_logs** - Event logs
4. **token_transfers** - ERC-20 transfers
5. **nft_transfers** - ERC-721 transfers
6. **token_holders** - Token holder balances
7. **contracts** - Contract information
8. **api_usage** - API usage tracking
9. **rate_limits** - Rate limiting data

---

## Indexer Service

A background service that:
- Syncs blocks from RPC
- Indexes transactions
- Tracks token transfers
- Updates token holder balances
- Maintains statistics


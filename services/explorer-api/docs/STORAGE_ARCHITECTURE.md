# Storage Architecture

## Why We Need Storage

### RPC Limitations

The RPC node provides **real-time blockchain state**, but:

❌ **Slow for complex queries**
- Getting transaction history requires scanning blocks
- Token transfers require filtering event logs
- Can take 5-10 seconds for large ranges

❌ **No indexing**
- No way to quickly find transactions by address
- No token holder tracking
- No analytics/statistics

❌ **No history**
- RPC only knows current state
- Historical queries are expensive
- No way to track changes over time

❌ **No API features**
- Can't track API usage
- Can't do distributed rate limiting
- Can't cache effectively

---

## Solution: Database + Indexer

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    RPC Node                              │
│  • Current blockchain state                             │
│  • Real-time data                                        │
│  • All historical blocks                                 │
└───────────────┬─────────────────────────────────────────┘
                │
                ↓ (Indexer syncs)
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                        │
│  • Indexed blocks                                        │
│  • Indexed transactions                                  │
│  • Token transfers                                       │
│  • Token holders                                         │
│  • Fast queries                                          │
└───────────────┬─────────────────────────────────────────┘
                │
                ↓ (Queries)
┌─────────────────────────────────────────────────────────┐
│              API Server                                 │
│  • Fast responses                                        │
│  • Complex queries                                       │
│  • Analytics                                             │
└───────────────┬─────────────────────────────────────────┘
                │
                ↓ (Cache)
┌─────────────────────────────────────────────────────────┐
│              Redis Cache                                │
│  • Hot data caching                                      │
│  • Rate limiting                                         │
│  • Session data                                          │
└─────────────────────────────────────────────────────────┘
```

---

## What Gets Stored

### PostgreSQL Tables

1. **blocks** - All blocks
   - Number, hash, timestamp
   - Gas usage, miner
   - Transaction count

2. **transactions** - All transactions
   - Hash, block number
   - From/to addresses
   - Value, gas, status

3. **transaction_logs** - Event logs
   - Contract events
   - Indexed for fast filtering

4. **token_transfers** - ERC-20 transfers
   - Token address
   - From/to addresses
   - Amount, timestamp

5. **nft_transfers** - ERC-721 transfers
   - Contract address
   - Token ID
   - From/to addresses

6. **token_holders** - Current balances
   - Token address
   - Holder address
   - Balance
   - Updated in real-time

7. **contracts** - Contract info
   - Address, bytecode
   - Verified source code
   - ABI

8. **api_usage** - API tracking
   - Endpoint calls
   - Response times
   - Error rates

9. **rate_limits** - Distributed rate limiting
   - Per IP/key tracking
   - Window-based limits

10. **statistics** - Cached stats
    - Network statistics
    - Token statistics
    - Pre-calculated metrics

---

## Indexer Service

### What It Does

The indexer runs as a background service:

1. **Syncs Blocks**
   - Watches for new blocks
   - Indexes block data
   - Updates statistics

2. **Indexes Transactions**
   - Stores transaction data
   - Links to blocks
   - Tracks status

3. **Processes Events**
   - Extracts Transfer events
   - Updates token transfers
   - Updates token holder balances

4. **Maintains Statistics**
   - Token holder counts
   - Transfer volumes
   - Network metrics

### How It Works

```javascript
// Indexer loop
while (running) {
  currentBlock = getCurrentBlockFromRPC();
  lastSynced = getLastSyncedFromDB();
  
  for (block = lastSynced + 1; block <= currentBlock; block++) {
    blockData = getBlockFromRPC(block);
    saveBlockToDB(blockData);
    
    for (tx of blockData.transactions) {
      txData = getTransactionFromRPC(tx);
      saveTransactionToDB(txData);
      
      for (log of txData.logs) {
        if (isTransferEvent(log)) {
          saveTokenTransfer(log);
          updateTokenHolderBalance(log);
        }
      }
    }
  }
  
  sleep(3 seconds);
}
```

---

## Ledger System

### What Is a Ledger?

A **ledger** is an accounting-style view of blockchain data:

- **Debits** - Outgoing transactions
- **Credits** - Incoming transactions
- **Balance Changes** - Net effect
- **History** - Complete transaction history

### Ledger Features

1. **Account Ledger**
   - All transactions affecting an address
   - Debit/credit classification
   - Balance changes

2. **Token Ledger**
   - Token-specific transactions
   - Transfer history
   - Balance tracking

3. **Account Statement**
   - Date-range queries
   - Like bank statements
   - Complete history

4. **Transaction Flow**
   - Money flow analysis
   - Multi-asset tracking
   - Flow visualization

---

## Performance Comparison

### Without Database (RPC Only)

| Query | Time | Notes |
|-------|------|-------|
| Transaction list | 5-10s | Must scan blocks |
| Token transfers | 3-5s | Must filter logs |
| Token holders | N/A | Not possible |
| Balance history | N/A | Not possible |
| Analytics | N/A | Not possible |

### With Database (Indexed)

| Query | Time | Notes |
|-------|------|-------|
| Transaction list | < 100ms | Indexed query |
| Token transfers | < 50ms | Pre-indexed |
| Token holders | < 200ms | Pre-calculated |
| Balance history | < 300ms | Aggregated |
| Analytics | < 500ms | Cached |

**Performance Improvement: 50-100x faster!**

---

## Storage Requirements

### Estimated Sizes

**Per Block:**
- Block data: ~500 bytes
- Transactions: ~200 bytes each
- Logs: ~300 bytes each

**Per 1M Blocks:**
- Blocks: ~500 MB
- Transactions: ~200 MB (1M txs)
- Logs: ~300 MB (1M logs)
- **Total: ~1 GB**

**For 10M Blocks:**
- **Total: ~10 GB**

### Optimization

1. **Partitioning** - Partition by block number
2. **Archiving** - Archive old data
3. **Compression** - Compress old blocks
4. **Read Replicas** - Scale reads

---

## Setup Options

### Option 1: RPC Only (Current)
- ✅ Simple setup
- ✅ No database needed
- ❌ Slow queries
- ❌ Limited features

### Option 2: Database + Indexer (Recommended)
- ✅ Fast queries
- ✅ Full features
- ✅ Analytics
- ❌ More complex setup

### Option 3: Hybrid
- Use RPC for real-time
- Use DB for historical
- Best of both worlds

---

## Migration Path

### Phase 1: RPC Only (Current)
- Basic API functionality
- Direct RPC queries
- Simple caching

### Phase 2: Add Database
- Set up PostgreSQL
- Run indexer
- Enable database queries

### Phase 3: Optimize
- Add Redis caching
- Optimize queries
- Add read replicas

---

## Recommendations

### For Development
- ✅ RPC only is fine
- ✅ Simple and fast to set up

### For Production
- ✅ **Use database + indexer**
- ✅ Much faster queries
- ✅ Better user experience
- ✅ Enables analytics

---

**Next Steps**: See `DATABASE_SETUP.md` for setup instructions.


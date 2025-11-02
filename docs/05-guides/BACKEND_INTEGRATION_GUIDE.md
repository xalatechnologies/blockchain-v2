# Backend Integration Guide: Xaheen Bridge Relayer

Guide to integrating the bridge relayer and monitoring services into your existing `xaheen-sdk` backend.

---

## Overview

### Current Architecture

**Your Backend (`/Volumes/Development/sahalat/private server/xaheen-sdk`)**:
```
xaheen-sdk/
├── apps/
│   ├── api/          ← Add relayer service here
│   ├── landing/      ← Bridge UI (separate codebase)
│   ├── wallet-extension/
│   └── web/
├── infrastructure/
├── monitoring/
└── docker-compose.yml
```

**Blockchain V2 (Bridge Contracts)**:
```
blockchain-v2/
├── contracts/        ← Bridge smart contracts
├── scripts/          ← Deployment scripts
├── services/
│   ├── relayer/      ← Move to xaheen-sdk/apps/api/src/services/
│   └── arbitrage-bot/
└── public/           ← Delete (using apps/landing instead)
```

### Integration Strategy

**Move these to xaheen-sdk:**
1. Relayer service → `apps/api/src/services/relayer.service.ts`
2. Bridge monitoring → `apps/api/src/routes/bridge.ts`
3. Database schema → `apps/api/src/db/schema/bridge.ts`
4. Environment config → Add to `apps/api/.env.example`

---

## Step 1: Add Relayer Service

### 1.1 Create Relayer Service

**File**: `apps/api/src/services/relayer.service.ts`

```typescript
/**
 * Xaheen Bridge Relayer Service
 *
 * Monitors spoke chains for Fill events and forwards to hub for settlement
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { db } from '../db';
import { bridgeTransfers } from '../db/schema/bridge';

interface RelayerConfig {
  spokeChains: {
    chainId: number;
    name: string;
    rpcUrl: string;
    settlementInbox: string;
  }[];
  hubChain: {
    chainId: number;
    rpcUrl: string;
    settlementHub: string;
    supplyController: string;
  };
  relayerPrivateKey: string;
  confirmationsRequired: number;
  pollInterval: number;
}

export class RelayerService {
  private config: RelayerConfig;
  private hubProvider: ethers.JsonRpcProvider;
  private hubWallet: ethers.Wallet;
  private spokeListeners: Map<number, ethers.Contract> = new Map();
  private isRunning: boolean = false;

  constructor(config: RelayerConfig) {
    this.config = config;
    this.hubProvider = new ethers.JsonRpcProvider(config.hubChain.rpcUrl);
    this.hubWallet = new ethers.Wallet(config.relayerPrivateKey, this.hubProvider);
  }

  /**
   * Start relayer - monitor all spoke chains
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Relayer already running');
      return;
    }

    logger.info('Starting Xaheen Bridge Relayer...');
    this.isRunning = true;

    // Initialize spoke chain listeners
    for (const spoke of this.config.spokeChains) {
      await this.initializeSpokeListener(spoke);
    }

    logger.info(`Relayer monitoring ${this.config.spokeChains.length} spoke chains`);
  }

  /**
   * Initialize event listener for a spoke chain
   */
  private async initializeSpokeListener(spoke: RelayerConfig['spokeChains'][0]): Promise<void> {
    const provider = new ethers.JsonRpcProvider(spoke.rpcUrl);

    // SettlementInbox ABI (minimal for Fill event)
    const abi = [
      'event Fill(bytes32 indexed fillId, address indexed trader, int256 xhtDelta, uint256 cashDelta, uint256 nonce, uint256 timestamp)'
    ];

    const inbox = new ethers.Contract(spoke.settlementInbox, abi, provider);
    this.spokeListeners.set(spoke.chainId, inbox);

    // Listen for Fill events
    inbox.on('Fill', async (fillId, trader, xhtDelta, cashDelta, nonce, timestamp, event) => {
      await this.handleFillEvent({
        fillId,
        trader,
        xhtDelta,
        cashDelta,
        nonce,
        timestamp,
        chainId: spoke.chainId,
        chainName: spoke.name,
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    logger.info(`Listening for Fill events on ${spoke.name} (${spoke.chainId})`);
  }

  /**
   * Handle Fill event from spoke chain
   */
  private async handleFillEvent(event: any): Promise<void> {
    logger.info(`New Fill event detected on ${event.chainName}`, {
      fillId: event.fillId,
      trader: event.trader,
      xhtDelta: event.xhtDelta.toString(),
      cashDelta: event.cashDelta.toString(),
    });

    try {
      // Save to database
      await db.insert(bridgeTransfers).values({
        fillId: event.fillId,
        chainId: event.chainId,
        trader: event.trader,
        xhtDelta: event.xhtDelta.toString(),
        cashDelta: event.cashDelta.toString(),
        nonce: event.nonce,
        status: 'pending',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        createdAt: new Date(),
      });

      // Wait for confirmations
      await this.waitForConfirmations(event.chainId, event.blockNumber);

      // Forward to hub
      await this.forwardToHub(event);

      // Update status
      await db.update(bridgeTransfers)
        .set({ status: 'confirmed' })
        .where({ fillId: event.fillId });

      logger.info(`Successfully forwarded Fill ${event.fillId} to hub`);
    } catch (error) {
      logger.error(`Failed to process Fill event ${event.fillId}:`, error);

      // Update status to failed
      await db.update(bridgeTransfers)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
        .where({ fillId: event.fillId });
    }
  }

  /**
   * Wait for required block confirmations
   */
  private async waitForConfirmations(chainId: number, blockNumber: number): Promise<void> {
    const spoke = this.config.spokeChains.find(s => s.chainId === chainId);
    if (!spoke) throw new Error(`Unknown chain ID: ${chainId}`);

    const provider = new ethers.JsonRpcProvider(spoke.rpcUrl);

    let confirmedBlocks = 0;
    while (confirmedBlocks < this.config.confirmationsRequired) {
      const currentBlock = await provider.getBlockNumber();
      confirmedBlocks = currentBlock - blockNumber;

      if (confirmedBlocks < this.config.confirmationsRequired) {
        logger.debug(`Confirmations: ${confirmedBlocks}/${this.config.confirmationsRequired}`);
        await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
      }
    }

    logger.info(`Block ${blockNumber} on ${spoke.name} confirmed (${confirmedBlocks} confirmations)`);
  }

  /**
   * Forward Fill receipt to SettlementHub on hub chain
   */
  private async forwardToHub(event: any): Promise<void> {
    // SettlementHub ABI (minimal for acknowledgeFill)
    const abi = [
      'function acknowledgeFill(bytes32 fillId, uint256 spokeChainId, address trader, int256 xhtDelta, uint256 cashDelta, uint256 nonce, bytes signature) external'
    ];

    const hub = new ethers.Contract(this.config.hubChain.settlementHub, abi, this.hubWallet);

    // Create signature (in production, this would be signed by validators)
    const messageHash = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint256', 'address', 'int256', 'uint256', 'uint256'],
      [event.fillId, event.chainId, event.trader, event.xhtDelta, event.cashDelta, event.nonce]
    );

    const signature = await this.hubWallet.signMessage(ethers.getBytes(messageHash));

    // Submit to hub
    const tx = await hub.acknowledgeFill(
      event.fillId,
      event.chainId,
      event.trader,
      event.xhtDelta,
      event.cashDelta,
      event.nonce,
      signature
    );

    logger.info(`Submitted Fill ${event.fillId} to hub, tx: ${tx.hash}`);
    await tx.wait();
    logger.info(`Fill ${event.fillId} settled on hub`);
  }

  /**
   * Stop relayer
   */
  async stop(): Promise<void> {
    logger.info('Stopping relayer...');
    this.isRunning = false;

    // Remove all listeners
    for (const [chainId, inbox] of this.spokeListeners) {
      inbox.removeAllListeners();
    }

    this.spokeListeners.clear();
    logger.info('Relayer stopped');
  }

  /**
   * Get relayer stats
   */
  async getStats() {
    const stats = await db.select()
      .from(bridgeTransfers)
      .groupBy('status');

    return {
      totalTransfers: stats.reduce((sum, s) => sum + s.count, 0),
      pending: stats.find(s => s.status === 'pending')?.count || 0,
      confirmed: stats.find(s => s.status === 'confirmed')?.count || 0,
      failed: stats.find(s => s.status === 'failed')?.count || 0,
    };
  }
}

// Export singleton instance
export const relayerService = new RelayerService({
  spokeChains: [
    {
      chainId: 56,
      name: 'BSC Mainnet',
      rpcUrl: process.env.BSC_MAINNET_RPC!,
      settlementInbox: process.env.SPOKE_BSC_SETTLEMENT_INBOX!,
    },
  ],
  hubChain: {
    chainId: 65001,
    rpcUrl: process.env.XAHEEN_CHAIN_RPC!,
    settlementHub: process.env.HUB_SETTLEMENT_HUB!,
    supplyController: process.env.HUB_SUPPLY_CONTROLLER!,
  },
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY!,
  confirmationsRequired: parseInt(process.env.CONFIRMATIONS_REQUIRED || '15'),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '5000'),
});
```

### 1.2 Create Database Schema

**File**: `apps/api/src/db/schema/bridge.ts`

```typescript
import { pgTable, varchar, bigint, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const bridgeTransfers = pgTable('bridge_transfers', {
  id: varchar('id', { length: 66 }).primaryKey(), // fillId as hex
  fillId: varchar('fill_id', { length: 66 }).notNull().unique(),
  chainId: integer('chain_id').notNull(),
  trader: varchar('trader', { length: 42 }).notNull(),
  xhtDelta: varchar('xht_delta').notNull(), // BigInt as string
  cashDelta: varchar('cash_delta').notNull(), // BigInt as string
  nonce: bigint('nonce', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'confirmed', 'failed'
  blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),
  hubTransactionHash: varchar('hub_transaction_hash', { length: 66 }),
  errorMessage: varchar('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  chainIdIdx: index('chain_id_idx').on(table.chainId),
  traderIdx: index('trader_idx').on(table.trader),
  statusIdx: index('status_idx').on(table.status),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));
```

---

## Step 2: Add Bridge API Routes

**File**: `apps/api/src/routes/bridge.ts`

```typescript
import { Router } from 'express';
import { relayerService } from '../services/relayer.service';
import { db } from '../db';
import { bridgeTransfers } from '../db/schema/bridge';
import { desc, eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/bridge/stats
 * Get relayer statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await relayerService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/bridge/transfers
 * Get recent bridge transfers
 */
router.get('/transfers', async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, trader } = req.query;

    let query = db.select().from(bridgeTransfers);

    if (status) {
      query = query.where(eq(bridgeTransfers.status, status as string));
    }

    if (trader) {
      query = query.where(eq(bridgeTransfers.trader, trader as string));
    }

    const transfers = await query
      .orderBy(desc(bridgeTransfers.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

/**
 * GET /api/bridge/transfers/:fillId
 * Get specific transfer by fillId
 */
router.get('/transfers/:fillId', async (req, res) => {
  try {
    const { fillId } = req.params;

    const transfer = await db.select()
      .from(bridgeTransfers)
      .where(eq(bridgeTransfers.fillId, fillId))
      .limit(1);

    if (transfer.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.json(transfer[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfer' });
  }
});

export default router;
```

---

## Step 3: Update Environment Configuration

**File**: `apps/api/.env.example` (append these)

```bash
# ============================================
# XAHEEN BRIDGE CONFIGURATION
# ============================================

# Relayer Configuration
RELAYER_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000

# Hub Chain (Xaheen)
XAHEEN_CHAIN_RPC=https://rpc.xaheen.org
HUB_SETTLEMENT_HUB=UPDATE_AFTER_DEPLOYMENT
HUB_SUPPLY_CONTROLLER=UPDATE_AFTER_DEPLOYMENT
HUB_PRICE_AUTHORITY=UPDATE_AFTER_DEPLOYMENT

# Spoke Chains
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org
SPOKE_BSC_SETTLEMENT_INBOX=UPDATE_AFTER_DEPLOYMENT
SPOKE_BSC_XAHEEN_ROUTER=UPDATE_AFTER_DEPLOYMENT
SPOKE_BSC_WRAPPED_XHT=UPDATE_AFTER_DEPLOYMENT

# Relayer Settings
CONFIRMATIONS_REQUIRED=15
POLL_INTERVAL=5000
MAX_GAS_PRICE=20
```

---

## Step 4: Initialize Relayer in Main App

**File**: `apps/api/src/index.ts` (add to your main app)

```typescript
import { relayerService } from './services/relayer.service';
import bridgeRoutes from './routes/bridge';

// ... existing imports and setup ...

// Add bridge routes
app.use('/api/bridge', bridgeRoutes);

// Start relayer on app startup
async function startServices() {
  try {
    // Start relayer
    await relayerService.start();
    logger.info('Bridge relayer started');
  } catch (error) {
    logger.error('Failed to start relayer:', error);
  }
}

// Call on server start
startServices();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await relayerService.stop();
  process.exit(0);
});
```

---

## Step 5: Run Database Migration

```bash
cd apps/api

# Generate migration
npm run db:generate

# Run migration
npm run db:migrate
```

---

## Step 6: Deploy

### Development

```bash
cd apps/api
npm run dev
```

### Production (Docker)

Update `docker-compose.yml`:

```yaml
services:
  api:
    build: ./apps/api
    environment:
      - RELAYER_PRIVATE_KEY=${RELAYER_PRIVATE_KEY}
      - XAHEEN_CHAIN_RPC=${XAHEEN_CHAIN_RPC}
      - BSC_MAINNET_RPC=${BSC_MAINNET_RPC}
      # ... other bridge env vars
    ports:
      - "3000:3000"
    restart: unless-stopped
```

**Deploy**:

```bash
docker-compose up -d api
docker-compose logs -f api
```

---

## Step 7: Monitoring

### API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Bridge stats
curl http://localhost:3000/api/bridge/stats

# Recent transfers
curl http://localhost:3000/api/bridge/transfers?limit=10

# Specific transfer
curl http://localhost:3000/api/bridge/transfers/0xabc...
```

### Logs

```bash
# Docker
docker-compose logs -f api

# PM2 (if using)
pm2 logs api

# Direct
npm run dev  # Watch mode with logs
```

---

## Architecture Benefits

**Why integrate into xaheen-sdk backend?**

1. ✅ **Centralized**: All services in one repo
2. ✅ **Shared Infrastructure**: Database, logging, monitoring
3. ✅ **API Integration**: Bridge stats exposed via existing API
4. ✅ **Docker Deploy**: Single docker-compose for all services
5. ✅ **Type Safety**: TypeScript across all services
6. ✅ **Database**: Persist transfers in PostgreSQL
7. ✅ **Monitoring**: Integrated with existing monitoring
8. ✅ **Authentication**: Use existing auth middleware

---

## Next Steps

1. [ ] Move relayer.service.ts to `apps/api/src/services/`
2. [ ] Add bridge.ts schema to `apps/api/src/db/schema/`
3. [ ] Add bridge.ts routes to `apps/api/src/routes/`
4. [ ] Update `.env.example` with bridge config
5. [ ] Run database migrations
6. [ ] Deploy to testnet
7. [ ] Test with real transfers
8. [ ] Add monitoring dashboards
9. [ ] Deploy to production

---

**REMEMBER**: "We want to monetize our blockchain"

The relayer is critical for bridge revenue. Every successful settlement = fees earned.

---

*Integration Guide Version: 1.0*
*Last Updated: November 2025*

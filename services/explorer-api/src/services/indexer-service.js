#!/usr/bin/env node
/**
 * Blockchain Indexer Service
 * Standalone service to sync blockchain data to database
 * Run: node src/services/indexer-service.js
 */

import BlockchainIndexer from './indexer.js';
import dotenv from 'dotenv';

dotenv.config();

const indexer = new BlockchainIndexer({
  syncInterval: parseInt(process.env.INDEXER_SYNC_INTERVAL) || 3000,
  batchSize: parseInt(process.env.INDEXER_BATCH_SIZE) || 100
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down indexer...');
  await indexer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down indexer...');
  await indexer.stop();
  process.exit(0);
});

// Start indexer
indexer.start().catch(error => {
  console.error('Failed to start indexer:', error);
  process.exit(1);
});


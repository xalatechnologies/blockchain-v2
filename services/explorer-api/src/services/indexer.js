/**
 * Blockchain Indexer Service
 * Syncs blockchain data from RPC to database for fast queries
 */

import { getProvider } from '../utils/provider.js';
import { ethers } from 'ethers';
import pg from 'pg';

const { Pool } = pg;

// ERC-20 Transfer event signature
const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

class BlockchainIndexer {
  constructor(config = {}) {
    this.provider = getProvider();
    this.dbPool = config.dbPool || null;
    this.isRunning = false;
    this.currentBlock = 0;
    this.lastSyncedBlock = 0;
    this.syncInterval = config.syncInterval || 3000; // 3 seconds
    this.batchSize = config.batchSize || 100;
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
    if (!this.dbPool) {
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'norchain_explorer',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      this.dbPool = new Pool(dbConfig);
      
      // Test connection
      try {
        await this.dbPool.query('SELECT NOW()');
        console.log('✅ Database connected');
      } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
      }
    }
  }

  /**
   * Get last synced block from database
   */
  async getLastSyncedBlock() {
    if (!this.dbPool) return 0;

    try {
      const result = await this.dbPool.query(
        'SELECT last_synced_block FROM sync_status ORDER BY id DESC LIMIT 1'
      );
      
      if (result.rows.length > 0) {
        return parseInt(result.rows[0].last_synced_block) || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting last synced block:', error.message);
      return 0;
    }
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(blockNumber, isSyncing = false, errors = 0) {
    if (!this.dbPool) return;

    try {
      await this.dbPool.query(
        `INSERT INTO sync_status (last_synced_block, is_syncing, sync_errors)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [blockNumber, isSyncing, errors]
      );
    } catch (error) {
      console.error('Error updating sync status:', error.message);
    }
  }

  /**
   * Index a single block
   */
  async indexBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block) return;

      // Insert block
      await this.dbPool.query(
        `INSERT INTO blocks (number, hash, parent_hash, timestamp, gas_limit, gas_used, miner, transactions_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (number) DO UPDATE SET
           hash = EXCLUDED.hash,
           gas_used = EXCLUDED.gas_used,
           transactions_count = EXCLUDED.transactions_count,
           updated_at = CURRENT_TIMESTAMP`,
        [
          block.number,
          block.hash,
          block.parentHash,
          block.timestamp,
          block.gasLimit.toString(),
          block.gasUsed.toString(),
          block.miner || block.author || '0x0000000000000000000000000000000000000000',
          block.transactions ? block.transactions.length : 0
        ]
      );

      // Index transactions
      if (block.transactions && block.transactions.length > 0) {
        for (const txHash of block.transactions) {
          if (typeof txHash === 'string') {
            await this.indexTransaction(txHash, block);
          }
        }
      }

      this.lastSyncedBlock = blockNumber;
      await this.updateSyncStatus(blockNumber, false, 0);

      return true;
    } catch (error) {
      console.error(`Error indexing block ${blockNumber}:`, error.message);
      await this.updateSyncStatus(blockNumber, false, 1);
      return false;
    }
  }

  /**
   * Index a transaction
   */
  async indexTransaction(txHash, block) {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      if (!tx || !receipt) return;

      // Insert transaction
      await this.dbPool.query(
        `INSERT INTO transactions (
          hash, block_number, block_hash, transaction_index, from_address, to_address,
          value, gas, gas_price, gas_used, nonce, input_data, status, contract_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (hash) DO UPDATE SET
          gas_used = EXCLUDED.gas_used,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP`,
        [
          tx.hash,
          tx.blockNumber,
          receipt.blockHash,
          receipt.index,
          tx.from,
          tx.to,
          tx.value.toString(),
          tx.gas.toString(),
          tx.gasPrice ? tx.gasPrice.toString() : null,
          receipt.gasUsed.toString(),
          tx.nonce,
          tx.data,
          receipt.status,
          receipt.contractAddress
        ]
      );

      // Index logs
      if (receipt.logs && receipt.logs.length > 0) {
        for (let i = 0; i < receipt.logs.length; i++) {
          await this.indexLog(receipt.logs[i], tx.hash, block.number, i);
        }
      }

      return true;
    } catch (error) {
      console.error(`Error indexing transaction ${txHash}:`, error.message);
      return false;
    }
  }

  /**
   * Index an event log
   */
  async indexLog(log, txHash, blockNumber, logIndex) {
    try {
      // Insert log
      await this.dbPool.query(
        `INSERT INTO transaction_logs (
          transaction_hash, block_number, log_index, address, topic0, topic1, topic2, topic3, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
        [
          txHash,
          blockNumber,
          logIndex,
          log.address,
          log.topics[0] || null,
          log.topics[1] || null,
          log.topics[2] || null,
          log.topics[3] || null,
          log.data
        ]
      );

      // Check if it's a Transfer event (ERC-20 or ERC-721)
      if (log.topics[0] === TRANSFER_TOPIC && log.topics.length >= 3) {
        await this.indexTokenTransfer(log, txHash, blockNumber, logIndex);
      }

      return true;
    } catch (error) {
      console.error(`Error indexing log:`, error.message);
      return false;
    }
  }

  /**
   * Index token transfer (ERC-20)
   */
  async indexTokenTransfer(log, txHash, blockNumber, logIndex) {
    try {
      const fromAddress = '0x' + log.topics[1].slice(26);
      const toAddress = '0x' + log.topics[2].slice(26);
      
      // Decode value
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], log.data);
      const value = decoded[0].toString();

      const block = await this.provider.getBlock(blockNumber);

      // Insert token transfer
      await this.dbPool.query(
        `INSERT INTO token_transfers (
          transaction_hash, log_index, block_number, timestamp, token_address,
          from_address, to_address, value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING`,
        [
          txHash,
          logIndex,
          blockNumber,
          block.timestamp,
          log.address,
          fromAddress,
          toAddress,
          value
        ]
      );

      // Update token holder balances
      await this.updateTokenHolderBalance(log.address, fromAddress, blockNumber, block.timestamp, false);
      await this.updateTokenHolderBalance(log.address, toAddress, blockNumber, block.timestamp, true);

      return true;
    } catch (error) {
      console.error(`Error indexing token transfer:`, error.message);
      return false;
    }
  }

  /**
   * Update token holder balance
   */
  async updateTokenHolderBalance(tokenAddress, holderAddress, blockNumber, timestamp, isIncoming) {
    try {
      // Get current balance from blockchain
      const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await tokenContract.balanceOf(holderAddress).catch(() => BigInt(0));

      // Upsert token holder
      await this.dbPool.query(
        `INSERT INTO token_holders (token_address, holder_address, balance, last_transfer_block, last_transfer_timestamp)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (token_address, holder_address) DO UPDATE SET
           balance = EXCLUDED.balance,
           last_transfer_block = EXCLUDED.last_transfer_block,
           last_transfer_timestamp = EXCLUDED.last_transfer_timestamp,
           updated_at = CURRENT_TIMESTAMP`,
        [
          tokenAddress,
          holderAddress,
          balance.toString(),
          blockNumber,
          timestamp
        ]
      );
    } catch (error) {
      // Token might not be ERC-20, skip
    }
  }

  /**
   * Sync blocks from last synced to current
   */
  async syncBlocks() {
    if (!this.dbPool) {
      console.warn('Database not initialized, skipping sync');
      return;
    }

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const lastSynced = await this.getLastSyncedBlock();
      const startBlock = lastSynced + 1;
      const endBlock = Math.min(startBlock + this.batchSize - 1, currentBlock);

      if (startBlock > currentBlock) {
        // Already synced
        return;
      }

      console.log(`📦 Syncing blocks ${startBlock} to ${endBlock}...`);

      await this.updateSyncStatus(startBlock, true, 0);

      for (let blockNum = startBlock; blockNum <= endBlock; blockNum++) {
        await this.indexBlock(blockNum);
      }

      console.log(`✅ Synced blocks ${startBlock} to ${endBlock}`);
    } catch (error) {
      console.error('Error syncing blocks:', error.message);
    }
  }

  /**
   * Start indexing service
   */
  async start() {
    if (this.isRunning) {
      console.warn('Indexer already running');
      return;
    }

    await this.initializeDatabase();
    this.isRunning = true;

    console.log('🚀 Starting blockchain indexer...');

    // Initial sync
    await this.syncBlocks();

    // Periodic sync
    this.syncIntervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.syncBlocks();
      }
    }, this.syncInterval);

    console.log('✅ Indexer started');
  }

  /**
   * Stop indexing service
   */
  async stop() {
    this.isRunning = false;
    
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    if (this.dbPool) {
      await this.dbPool.end();
    }

    console.log('🛑 Indexer stopped');
  }

  /**
   * Get sync status
   */
  async getStatus() {
    const currentBlock = await this.provider.getBlockNumber();
    const lastSynced = await this.getLastSyncedBlock();
    const behind = currentBlock - lastSynced;

    return {
      isRunning: this.isRunning,
      currentBlock,
      lastSyncedBlock: lastSynced,
      blocksBehind: behind,
      syncProgress: currentBlock > 0 ? ((lastSynced / currentBlock) * 100).toFixed(2) + '%' : '0%'
    };
  }
}

export default BlockchainIndexer;


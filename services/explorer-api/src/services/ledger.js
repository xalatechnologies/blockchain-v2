/**
 * Ledger Service
 * Provides ledger/accounting view of blockchain data
 */

import { query } from '../db/connection.js';

class LedgerService {
  /**
   * Get account ledger (all transactions affecting an address)
   */
  async getAccountLedger(address, options = {}) {
    const {
      startBlock = 0,
      endBlock = null,
      page = 1,
      limit = 50,
      sort = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const order = sort === 'desc' ? 'DESC' : 'ASC';

    const endBlockClause = endBlock ? 'AND t.block_number <= $3' : '';
    const params = endBlock 
      ? [address, startBlock, endBlock, limit, offset]
      : [address, startBlock, limit, offset];

    const sql = `
      SELECT 
        t.hash,
        t.block_number,
        t.transaction_index,
        t.from_address,
        t.to_address,
        t.value,
        t.gas_used,
        t.status,
        b.timestamp,
        CASE 
          WHEN t.from_address = $1 THEN 'debit'
          WHEN t.to_address = $1 THEN 'credit'
          ELSE 'internal'
        END as type,
        CASE 
          WHEN t.from_address = $1 THEN -t.value
          WHEN t.to_address = $1 THEN t.value
          ELSE 0
        END as balance_change
      FROM transactions t
      JOIN blocks b ON t.block_number = b.number
      WHERE (t.from_address = $1 OR t.to_address = $1)
        AND t.block_number >= $2
        ${endBlockClause}
      ORDER BY t.block_number ${order}, t.transaction_index ${order}
      LIMIT $${endBlock ? 4 : 3} OFFSET $${endBlock ? 5 : 4}
    `;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get account balance history
   */
  async getBalanceHistory(address, options = {}) {
    const {
      startBlock = 0,
      endBlock = null,
      interval = 'block' // 'block', 'hour', 'day'
    } = options;

    // This would calculate balance at each interval
    // For now, return balance changes grouped by interval
    const sql = `
      SELECT 
        DATE_TRUNC('${interval}', TO_TIMESTAMP(b.timestamp)) as period,
        SUM(CASE WHEN t.to_address = $1 THEN t.value ELSE 0 END) as credits,
        SUM(CASE WHEN t.from_address = $1 THEN t.value ELSE 0 END) as debits,
        COUNT(*) as transaction_count
      FROM transactions t
      JOIN blocks b ON t.block_number = b.number
      WHERE (t.from_address = $1 OR t.to_address = $1)
        AND t.block_number >= $2
        ${endBlock ? 'AND t.block_number <= $3' : ''}
      GROUP BY period
      ORDER BY period DESC
    `;

    const params = endBlock ? [address, startBlock, endBlock] : [address, startBlock];
    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get token ledger for an address
   */
  async getTokenLedger(address, tokenAddress, options = {}) {
    const {
      startBlock = 0,
      endBlock = null,
      page = 1,
      limit = 50
    } = options;

    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        tt.transaction_hash,
        tt.block_number,
        tt.timestamp,
        tt.from_address,
        tt.to_address,
        tt.value,
        CASE 
          WHEN tt.from_address = $1 THEN 'outgoing'
          WHEN tt.to_address = $1 THEN 'incoming'
        END as direction,
        CASE 
          WHEN tt.from_address = $1 THEN -tt.value
          WHEN tt.to_address = $1 THEN tt.value
        END as balance_change
      FROM token_transfers tt
      WHERE tt.token_address = $2
        AND (tt.from_address = $1 OR tt.to_address = $1)
        AND tt.block_number >= $3
        ${endBlock ? 'AND tt.block_number <= $4' : ''}
      ORDER BY tt.block_number DESC, tt.timestamp DESC
      LIMIT $${endBlock ? 5 : 4} OFFSET $${endBlock ? 6 : 5}
    `;

    const params = endBlock 
      ? [address, tokenAddress, startBlock, endBlock, limit, offset]
      : [address, tokenAddress, startBlock, limit, offset];

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get account statement (like a bank statement)
   */
  async getAccountStatement(address, startDate, endDate) {
    const sql = `
      SELECT 
        t.hash as transaction_hash,
        t.block_number,
        b.timestamp,
        t.from_address,
        t.to_address,
        t.value,
        t.status,
        CASE 
          WHEN t.from_address = $1 THEN 'Sent'
          WHEN t.to_address = $1 THEN 'Received'
          ELSE 'Internal'
        END as type,
        CASE 
          WHEN t.from_address = $1 THEN -t.value
          WHEN t.to_address = $1 THEN t.value
          ELSE 0
        END as amount
      FROM transactions t
      JOIN blocks b ON t.block_number = b.number
      WHERE (t.from_address = $1 OR t.to_address = $1)
        AND b.timestamp >= $2
        AND b.timestamp <= $3
      ORDER BY b.timestamp DESC, t.transaction_index DESC
    `;

    const result = await query(sql, [address, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get token holder rankings
   */
  async getTokenHolderRankings(tokenAddress, limit = 100) {
    const sql = `
      SELECT 
        holder_address,
        balance,
        last_transfer_timestamp,
        ROW_NUMBER() OVER (ORDER BY balance DESC) as rank
      FROM token_holders
      WHERE token_address = $1
        AND balance > 0
      ORDER BY balance DESC
      LIMIT $2
    `;

    const result = await query(sql, [tokenAddress, limit]);
    return result.rows;
  }

  /**
   * Get transaction flow (money flow analysis)
   */
  async getTransactionFlow(txHash) {
    const sql = `
      WITH tx_data AS (
        SELECT 
          t.hash,
          t.from_address,
          t.to_address,
          t.value,
          t.block_number,
          b.timestamp
        FROM transactions t
        JOIN blocks b ON t.block_number = b.number
        WHERE t.hash = $1
      ),
      token_flows AS (
        SELECT 
          tt.transaction_hash,
          tt.from_address,
          tt.to_address,
          tt.value,
          tt.token_address
        FROM token_transfers tt
        WHERE tt.transaction_hash = $1
      )
      SELECT 
        'native' as asset_type,
        NULL as token_address,
        from_address,
        to_address,
        value,
        block_number,
        timestamp
      FROM tx_data
      UNION ALL
      SELECT 
        'token' as asset_type,
        token_address,
        from_address,
        to_address,
        value,
        NULL as block_number,
        NULL as timestamp
      FROM token_flows
    `;

    const result = await query(sql, [txHash]);
    return result.rows;
  }
}

export default new LedgerService();


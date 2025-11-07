import { query, queryOne, transaction } from "./client";

export interface LimitOrder {
  id: string;
  user_id: string | null;
  user_address: string;
  token_in: string;
  token_out: string;
  amount_in: string;
  amount_out_min: string;
  price_limit: string;
  chain_id: number;
  status: "pending" | "filled" | "cancelled" | "expired";
  tx_hash: string | null;
  filled_amount: string;
  created_at: Date;
  expires_at: Date | null;
  filled_at: Date | null;
}

export interface StopLossOrder {
  id: string;
  user_id: string | null;
  user_address: string;
  token_in: string;
  token_out: string;
  amount: string;
  stop_price: string;
  chain_id: number;
  status: "active" | "triggered" | "cancelled";
  tx_hash: string | null;
  triggered_at: Date | null;
  created_at: Date;
}

export interface DCASchedule {
  id: string;
  user_id: string | null;
  user_address: string;
  token_in: string;
  token_out: string;
  amount_per_order: string;
  frequency: "daily" | "weekly" | "monthly";
  chain_id: number;
  status: "active" | "paused" | "completed" | "cancelled";
  start_date: Date;
  end_date: Date | null;
  next_execution: Date;
  total_executed: number;
  total_spent: string;
  created_at: Date;
}

/**
 * Create a limit order
 */
export async function createLimitOrder(
  order: Omit<LimitOrder, "id" | "created_at" | "filled_amount" | "status">
): Promise<LimitOrder> {
  const result = await queryOne<LimitOrder>(
    `INSERT INTO limit_orders (
      user_address, token_in, token_out, amount_in, amount_out_min,
      price_limit, chain_id, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      order.user_address,
      order.token_in,
      order.token_out,
      order.amount_in,
      order.amount_out_min,
      order.price_limit,
      order.chain_id,
      order.expires_at || null,
    ]
  );

  if (!result) {
    throw new Error("Failed to create limit order");
  }

  return result;
}

/**
 * Get limit orders for a user
 */
export async function getLimitOrders(
  userAddress: string,
  status?: LimitOrder["status"]
): Promise<LimitOrder[]> {
  if (status) {
    return query<LimitOrder>(
      `SELECT * FROM limit_orders 
       WHERE user_address = $1 AND status = $2 
       ORDER BY created_at DESC`,
      [userAddress, status]
    );
  }
  return query<LimitOrder>(
    `SELECT * FROM limit_orders 
     WHERE user_address = $1 
     ORDER BY created_at DESC`,
    [userAddress]
  );
}

/**
 * Update limit order status
 */
export async function updateLimitOrderStatus(
  orderId: string,
  status: LimitOrder["status"],
  txHash?: string,
  filledAmount?: string
): Promise<void> {
  await query(
    `UPDATE limit_orders 
     SET status = $1, tx_hash = COALESCE($2, tx_hash), 
         filled_amount = COALESCE($3, filled_amount),
         filled_at = CASE WHEN $1 = 'filled' THEN NOW() ELSE filled_at END
     WHERE id = $4`,
    [status, txHash || null, filledAmount || null, orderId]
  );
}

/**
 * Create stop-loss order
 */
export async function createStopLossOrder(
  order: Omit<StopLossOrder, "id" | "created_at" | "status">
): Promise<StopLossOrder> {
  const result = await queryOne<StopLossOrder>(
    `INSERT INTO stop_loss_orders (
      user_address, token_in, token_out, amount, stop_price, chain_id
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      order.user_address,
      order.token_in,
      order.token_out,
      order.amount,
      order.stop_price,
      order.chain_id,
    ]
  );

  if (!result) {
    throw new Error("Failed to create stop-loss order");
  }

  return result;
}

/**
 * Get stop-loss orders for a user
 */
export async function getStopLossOrders(
  userAddress: string
): Promise<StopLossOrder[]> {
  return query<StopLossOrder>(
    `SELECT * FROM stop_loss_orders 
     WHERE user_address = $1 
     ORDER BY created_at DESC`,
    [userAddress]
  );
}

/**
 * Create DCA schedule
 */
export async function createDCASchedule(
  schedule: Omit<DCASchedule, "id" | "created_at" | "total_executed" | "total_spent" | "status">
): Promise<DCASchedule> {
  const result = await queryOne<DCASchedule>(
    `INSERT INTO dca_schedules (
      user_address, token_in, token_out, amount_per_order,
      frequency, chain_id, start_date, end_date, next_execution
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      schedule.user_address,
      schedule.token_in,
      schedule.token_out,
      schedule.amount_per_order,
      schedule.frequency,
      schedule.chain_id,
      schedule.start_date,
      schedule.end_date || null,
      schedule.next_execution,
    ]
  );

  if (!result) {
    throw new Error("Failed to create DCA schedule");
  }

  return result;
}

/**
 * Get DCA schedules for a user
 */
export async function getDCASchedules(
  userAddress: string
): Promise<DCASchedule[]> {
  return query<DCASchedule>(
    `SELECT * FROM dca_schedules 
     WHERE user_address = $1 
     ORDER BY created_at DESC`,
    [userAddress]
  );
}

/**
 * Get pending limit orders that need execution
 */
export async function getPendingLimitOrders(): Promise<LimitOrder[]> {
  return query<LimitOrder>(
    `SELECT * FROM limit_orders 
     WHERE status = 'pending' 
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at ASC`
  );
}

/**
 * Get active stop-loss orders
 */
export async function getActiveStopLossOrders(): Promise<StopLossOrder[]> {
  return query<StopLossOrder>(
    `SELECT * FROM stop_loss_orders 
     WHERE status = 'active'`
  );
}

/**
 * Get DCA schedules ready for execution
 */
export async function getReadyDCASchedules(): Promise<DCASchedule[]> {
  return query<DCASchedule>(
    `SELECT * FROM dca_schedules 
     WHERE status = 'active' 
       AND next_execution <= NOW()
       AND (end_date IS NULL OR end_date > NOW())`
  );
}


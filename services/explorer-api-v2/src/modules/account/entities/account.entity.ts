// This is a virtual entity for account aggregation
// Actual data comes from transactions table
export interface AccountSummary {
  address: string;
  balance: string;
  transactionCount: number;
  tokenCount: number;
  firstTransactionBlock?: number;
  lastTransactionBlock?: number;
}


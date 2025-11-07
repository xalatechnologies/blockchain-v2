-- NEX Exchange Database Schema
-- PostgreSQL/Supabase compatible

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for KYC, preferences, etc.)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE NOT NULL,
  email TEXT,
  kyc_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Limit orders
CREATE TABLE IF NOT EXISTS limit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_in NUMERIC(78, 0) NOT NULL, -- Support 24 decimals
  amount_out_min NUMERIC(78, 0) NOT NULL,
  price_limit NUMERIC(78, 0) NOT NULL,
  chain_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, filled, cancelled, expired
  tx_hash TEXT,
  filled_amount NUMERIC(78, 0) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  filled_at TIMESTAMP WITH TIME ZONE
);

-- Stop-loss orders
CREATE TABLE IF NOT EXISTS stop_loss_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  stop_price NUMERIC(78, 0) NOT NULL,
  chain_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- active, triggered, cancelled
  tx_hash TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DCA schedules
CREATE TABLE IF NOT EXISTS dca_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_per_order NUMERIC(78, 0) NOT NULL,
  frequency TEXT NOT NULL, -- daily, weekly, monthly
  chain_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- active, paused, completed, cancelled
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  next_execution TIMESTAMP WITH TIME ZONE NOT NULL,
  total_executed INTEGER DEFAULT 0,
  total_spent NUMERIC(78, 0) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade history
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_in NUMERIC(78, 0) NOT NULL,
  amount_out NUMERIC(78, 0) NOT NULL,
  price NUMERIC(78, 0) NOT NULL,
  chain_id INTEGER NOT NULL,
  dex_name TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  gas_used BIGINT,
  gas_price BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio snapshots (for analytics)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  balance NUMERIC(78, 0) NOT NULL,
  value_usd NUMERIC(20, 2),
  chain_id INTEGER NOT NULL,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price history (for charts)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_address TEXT NOT NULL,
  price_usd NUMERIC(20, 8) NOT NULL,
  volume_24h NUMERIC(20, 2),
  liquidity NUMERIC(20, 2),
  chain_id INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_limit_orders_user ON limit_orders(user_address);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);
CREATE INDEX IF NOT EXISTS idx_limit_orders_expires ON limit_orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_stop_loss_user ON stop_loss_orders(user_address);
CREATE INDEX IF NOT EXISTS idx_stop_loss_status ON stop_loss_orders(status);
CREATE INDEX IF NOT EXISTS idx_dca_user ON dca_schedules(user_address);
CREATE INDEX IF NOT EXISTS idx_dca_next_execution ON dca_schedules(next_execution);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_address);
CREATE INDEX IF NOT EXISTS idx_trades_tx_hash ON trades(tx_hash);
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_snapshots(user_address);
CREATE INDEX IF NOT EXISTS idx_price_history_token ON price_history(token_address);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


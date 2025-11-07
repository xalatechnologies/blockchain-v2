-- Nor Chain Explorer API Database Schema
-- PostgreSQL Database Schema for Blockchain Indexing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id BIGSERIAL PRIMARY KEY,
    number BIGINT UNIQUE NOT NULL,
    hash VARCHAR(66) UNIQUE NOT NULL,
    parent_hash VARCHAR(66) NOT NULL,
    timestamp BIGINT NOT NULL,
    gas_limit BIGINT NOT NULL,
    gas_used BIGINT NOT NULL,
    miner VARCHAR(42),
    difficulty VARCHAR(78),
    extra_data TEXT,
    transactions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blocks_number ON blocks(number);
CREATE INDEX idx_blocks_hash ON blocks(hash);
CREATE INDEX idx_blocks_timestamp ON blocks(timestamp);
CREATE INDEX idx_blocks_miner ON blocks(miner);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    transaction_index INTEGER NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value NUMERIC(78, 0) NOT NULL DEFAULT 0,
    gas BIGINT NOT NULL,
    gas_price NUMERIC(78, 0),
    gas_used BIGINT,
    nonce BIGINT NOT NULL,
    input_data TEXT,
    status INTEGER, -- 1 = success, 0 = failed
    contract_address VARCHAR(42), -- If contract creation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_number) REFERENCES blocks(number) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_hash ON transactions(hash);
CREATE INDEX idx_transactions_block_number ON transactions(block_number);
CREATE INDEX idx_transactions_from ON transactions(from_address);
CREATE INDEX idx_transactions_to ON transactions(to_address);
CREATE INDEX idx_transactions_block_from ON transactions(block_number, from_address);
CREATE INDEX idx_transactions_block_to ON transactions(block_number, to_address);

-- Transaction logs (events)
CREATE TABLE IF NOT EXISTS transaction_logs (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    address VARCHAR(42) NOT NULL,
    topic0 VARCHAR(66), -- Event signature
    topic1 VARCHAR(66),
    topic2 VARCHAR(66),
    topic3 VARCHAR(66),
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_hash) REFERENCES transactions(hash) ON DELETE CASCADE,
    FOREIGN KEY (block_number) REFERENCES blocks(number) ON DELETE CASCADE,
    UNIQUE(transaction_hash, log_index)
);

CREATE INDEX idx_logs_transaction ON transaction_logs(transaction_hash);
CREATE INDEX idx_logs_block ON transaction_logs(block_number);
CREATE INDEX idx_logs_address ON transaction_logs(address);
CREATE INDEX idx_logs_topic0 ON transaction_logs(topic0);
CREATE INDEX idx_logs_address_topic0 ON transaction_logs(address, topic0);

-- Token transfers (ERC-20)
CREATE TABLE IF NOT EXISTS token_transfers (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    token_address VARCHAR(42) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value NUMERIC(78, 0) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_hash) REFERENCES transactions(hash) ON DELETE CASCADE,
    FOREIGN KEY (block_number) REFERENCES blocks(number) ON DELETE CASCADE
);

CREATE INDEX idx_token_transfers_token ON token_transfers(token_address);
CREATE INDEX idx_token_transfers_from ON token_transfers(from_address);
CREATE INDEX idx_token_transfers_to ON token_transfers(to_address);
CREATE INDEX idx_token_transfers_block ON token_transfers(block_number);
CREATE INDEX idx_token_transfers_token_from ON token_transfers(token_address, from_address);
CREATE INDEX idx_token_transfers_token_to ON token_transfers(token_address, to_address);

-- NFT transfers (ERC-721)
CREATE TABLE IF NOT EXISTS nft_transfers (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    token_id NUMERIC(78, 0) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_hash) REFERENCES transactions(hash) ON DELETE CASCADE,
    FOREIGN KEY (block_number) REFERENCES blocks(number) ON DELETE CASCADE
);

CREATE INDEX idx_nft_transfers_contract ON nft_transfers(contract_address);
CREATE INDEX idx_nft_transfers_from ON nft_transfers(from_address);
CREATE INDEX idx_nft_transfers_to ON nft_transfers(to_address);
CREATE INDEX idx_nft_transfers_token_id ON nft_transfers(contract_address, token_id);

-- Token holders (current balances)
CREATE TABLE IF NOT EXISTS token_holders (
    id BIGSERIAL PRIMARY KEY,
    token_address VARCHAR(42) NOT NULL,
    holder_address VARCHAR(42) NOT NULL,
    balance NUMERIC(78, 0) NOT NULL DEFAULT 0,
    last_transfer_block BIGINT,
    last_transfer_timestamp BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token_address, holder_address)
);

CREATE INDEX idx_token_holders_token ON token_holders(token_address);
CREATE INDEX idx_token_holders_holder ON token_holders(holder_address);
CREATE INDEX idx_token_holders_balance ON token_holders(token_address, balance DESC);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    creation_transaction_hash VARCHAR(66),
    creation_block_number BIGINT,
    bytecode TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    source_code TEXT,
    abi JSONB,
    compiler_version VARCHAR(50),
    contract_name VARCHAR(255),
    optimization_used BOOLEAN DEFAULT FALSE,
    runs INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_address ON contracts(address);
CREATE INDEX idx_contracts_verified ON contracts(is_verified);

-- Token metadata cache
CREATE TABLE IF NOT EXISTS token_metadata (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255),
    symbol VARCHAR(50),
    decimals INTEGER DEFAULT 18,
    total_supply NUMERIC(78, 0),
    token_type VARCHAR(20), -- ERC20, ERC721, ERC1155
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_metadata_address ON token_metadata(address);
CREATE INDEX idx_token_metadata_symbol ON token_metadata(symbol);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id BIGSERIAL PRIMARY KEY,
    api_key VARCHAR(255),
    ip_address VARCHAR(45),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_usage_api_key ON api_usage(api_key);
CREATE INDEX idx_api_usage_ip ON api_usage(ip_address);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_created ON api_usage(created_at);

-- Rate limiting (distributed)
CREATE TABLE IF NOT EXISTS rate_limits (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP or API key
    endpoint VARCHAR(255),
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- Statistics cache
CREATE TABLE IF NOT EXISTS statistics (
    id BIGSERIAL PRIMARY KEY,
    stat_key VARCHAR(100) UNIQUE NOT NULL,
    stat_value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_statistics_key ON statistics(stat_key);

-- Sync status
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    last_synced_block BIGINT NOT NULL,
    last_synced_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_syncing BOOLEAN DEFAULT FALSE,
    sync_errors INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_holders_updated_at BEFORE UPDATE ON token_holders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE OR REPLACE VIEW address_transactions AS
SELECT 
    t.hash,
    t.block_number,
    t.from_address,
    t.to_address,
    t.value,
    t.gas_used,
    t.status,
    b.timestamp,
    CASE 
        WHEN t.from_address = :address THEN 'outgoing'
        WHEN t.to_address = :address THEN 'incoming'
        ELSE 'internal'
    END as direction
FROM transactions t
JOIN blocks b ON t.block_number = b.number
WHERE t.from_address = :address OR t.to_address = :address;

CREATE OR REPLACE VIEW token_holder_rankings AS
SELECT 
    token_address,
    holder_address,
    balance,
    ROW_NUMBER() OVER (PARTITION BY token_address ORDER BY balance DESC) as rank
FROM token_holders
WHERE balance > 0;


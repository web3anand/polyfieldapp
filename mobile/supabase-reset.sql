-- Reset Database: Drop all tables and recreate from scratch
-- Run this in your Supabase SQL Editor

-- Drop all tables (CASCADE removes dependent objects like triggers)
DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the update function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now run the full schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  address TEXT PRIMARY KEY,
  proxy_wallet_address TEXT,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  total_trades INTEGER DEFAULT 0,
  total_volume NUMERIC(20, 2) DEFAULT 0,
  win_rate NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Markets table
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  question TEXT,
  condition_id TEXT UNIQUE NOT NULL,
  token_id TEXT,
  yes_token_id TEXT,
  no_token_id TEXT,
  category TEXT,
  end_date TEXT,
  image_url TEXT,
  liquidity NUMERIC(20, 2),
  volume TEXT,
  participants INTEGER DEFAULT 0,
  yes_price NUMERIC(10, 8),
  no_price NUMERIC(10, 8),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL REFERENCES users(address) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  shares NUMERIC(20, 8) NOT NULL,
  invested NUMERIC(20, 2) NOT NULL,
  current_value NUMERIC(20, 2) NOT NULL,
  current_price NUMERIC(10, 8) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  closed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets/Trades table
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL REFERENCES users(address) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  amount NUMERIC(20, 2) NOT NULL,
  price NUMERIC(10, 8) NOT NULL,
  shares NUMERIC(20, 8) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')) DEFAULT 'pending',
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_markets_condition_id ON markets(condition_id);
CREATE INDEX idx_markets_active ON markets(active);
CREATE INDEX idx_markets_liquidity ON markets(liquidity DESC);
CREATE INDEX idx_positions_user ON positions(user_address);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_market ON positions(market_id);
CREATE INDEX idx_bets_user ON bets(user_address);
CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_status ON bets(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at
  BEFORE UPDATE ON bets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- IMPORTANT: Keep RLS disabled since we're using Privy authentication
-- (not Supabase Auth, so auth.uid() won't work)

COMMENT ON TABLE users IS 'User profiles and wallet addresses';
COMMENT ON TABLE markets IS 'Polymarket prediction markets cache';
COMMENT ON TABLE positions IS 'User positions in markets (open/closed)';
COMMENT ON TABLE bets IS 'Trade history and pending orders';

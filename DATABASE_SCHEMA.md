# Database Schema

## Supabase Tables

### `markets` Table

```sql
CREATE TABLE markets (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  liquidity NUMERIC DEFAULT 0,
  odds JSONB NOT NULL, -- { yes: number, no: number }
  sport TEXT,
  end_date TIMESTAMP,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_markets_active ON markets(active);
CREATE INDEX idx_markets_sport ON markets(sport);
CREATE INDEX idx_markets_created ON markets(created_at DESC);
```

### `bets` Table

```sql
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  market_id TEXT NOT NULL,
  outcome TEXT NOT NULL, -- 'YES' or 'NO'
  amount TEXT NOT NULL,
  odds NUMERIC NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (market_id) REFERENCES markets(id)
);

CREATE INDEX idx_bets_user ON bets(user_address);
CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_created ON bets(created_at DESC);
```

### `users` Table

```sql
CREATE TABLE users (
  address TEXT PRIMARY KEY,
  proxy_wallet_address TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_proxy ON users(proxy_wallet_address);
```

### `market_cache` Table (Optional - for caching Polymarket data)

```sql
CREATE TABLE market_cache (
  market_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_cache_expires ON market_cache(expires_at);
```


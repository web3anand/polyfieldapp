# Backend Integration Guide

This guide explains how to integrate the backend services with the existing UI components.

## 📁 File Structure

```
src/
├── lib/
│   ├── pm.ts                    # Polymarket core functions
│   ├── supabase.ts              # Database operations
│   ├── polymarketWebSocket.ts   # Real-time price updates
│   ├── privy-config.ts          # Authentication config
│   └── proxy-wallet.ts          # Proxy wallet management
├── hooks/
│   ├── usePolymarketProxyEnhanced.ts  # Proxy wallet hook
│   ├── useMarkets.ts            # Markets data hook
│   ├── usePositions.ts          # Positions hook
│   └── useHistory.ts            # History hook
├── services/
│   ├── api.ts                   # Base API client
│   └── marketsService.ts        # Markets service integration
└── utils/
    └── formatting.ts            # Formatting utilities
```

## 🔌 Integration Steps

### 1. Update Markets Hook

The `useMarkets` hook should use the Polymarket service:

```typescript
// src/hooks/useMarkets.ts
import { getMarkets, getTrendingMarketsService } from '../services/marketsService';

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use Polymarket service instead of API client
      const data = await getMarkets(100, 0);
      setMarkets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  };

  return { markets, loading, error, refetch: fetchMarkets };
}
```

### 2. Initialize Supabase

Add to your app initialization:

```typescript
// src/main.tsx or App.tsx
import { initSupabase } from './lib/supabase';

// Initialize Supabase when app starts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  initSupabase(supabaseUrl, supabaseKey);
}
```

### 3. WebSocket Integration

Add real-time price updates to MarketCard:

```typescript
// src/components/MarketCard.tsx
import { useEffect, useState } from 'react';
import { polymarketWS } from '../lib/polymarketWebSocket';

export function MarketCard({ market, onBet }: MarketCardProps) {
  const [liveOdds, setLiveOdds] = useState({
    yes: market.yesPrice,
    no: market.noPrice,
  });

  useEffect(() => {
    // Subscribe to price updates
    const unsubscribe = polymarketWS.subscribe(
      market.id,
      (yesPrice, noPrice) => {
        setLiveOdds({
          yes: Math.round(yesPrice * 100),
          no: Math.round(noPrice * 100),
        });
      }
    );

    return () => unsubscribe();
  }, [market.id]);

  // Use liveOdds instead of market.yesPrice/market.noPrice
}
```

### 4. Betting Integration

Update BetSheet component to use proxy wallet:

```typescript
// src/components/BetSheet.tsx
import { usePolymarketProxyEnhanced } from '../hooks/usePolymarketProxyEnhanced';
import { saveBet } from '../lib/supabase';

export function BetSheet({ market, onClose }: BetSheetProps) {
  const {
    isInitialized,
    initializeProxy,
    placeBet: placeBetWithProxy,
    balance,
  } = usePolymarketProxyEnhanced();

  const handlePlaceBet = async () => {
    try {
      // 1. Ensure proxy wallet is initialized
      if (!isInitialized) {
        await initializeProxy(walletClient, userAddress);
      }

      // 2. Place bet
      const result = await placeBetWithProxy(
        market.tokenId,
        betSide === 'yes' ? 'BUY' : 'SELL',
        amount,
        price
      );

      // 3. Save to database
      await saveBet({
        user_address: userAddress,
        market_id: market.id,
        outcome: betSide === 'yes' ? 'YES' : 'NO',
        amount,
        odds: price,
        transaction_hash: result.hash,
      });

      // 4. Show success
      toast.success('Bet placed successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to place bet');
    }
  };
}
```

## 🔧 Environment Variables

Update your `.env` file:

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Privy
VITE_PRIVY_APP_ID=your_privy_app_id

# Polymarket (optional)
VITE_POLYMARKET_API_KEY=your_api_key

# Blockchain
VITE_CHAIN_ID=137
VITE_RPC_URL=https://polygon-rpc.com
```

## 📊 Data Flow

### Markets Flow:
1. UI calls `useMarkets()` hook
2. Hook calls `getMarkets()` from `marketsService.ts`
3. Service checks database cache first
4. If cache miss, fetches from Polymarket API
5. Caches results in database
6. Returns formatted markets to UI

### Betting Flow:
1. User clicks "Place Bet"
2. Check wallet connection (Privy)
3. Initialize proxy wallet (if needed)
4. Place bet via Polymarket Builder (gasless)
5. Save bet to database
6. Update UI with new bet

### Price Updates Flow:
1. MarketCard subscribes to WebSocket
2. WebSocket receives price updates
3. Updates local state
4. UI re-renders with new prices

## 🚀 Next Steps

1. **Install Dependencies:**
   ```bash
   npm install @supabase/supabase-js @privy-io/react-auth wagmi viem
   ```

2. **Set up Supabase:**
   - Create Supabase project
   - Run database migrations (see DATABASE_SCHEMA.md)
   - Add credentials to `.env`

3. **Set up Privy:**
   - Create Privy account
   - Get App ID
   - Add to `.env`

4. **Test Integration:**
   - Markets should load from Polymarket
   - Prices should update in real-time
   - Bets should save to database

## 📝 Notes

- All UI components remain unchanged
- Backend functions are ready but need SDK integration
- WebSocket will work once Polymarket WebSocket is connected
- Database functions work once Supabase is initialized


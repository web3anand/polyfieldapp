# Polymarket CLOB API - Usage Examples

## Quick Start

### 1. Using the Unified Hook

```typescript
import { useClobClient } from './hooks/useClobClient';

function TradingComponent() {
  const clob = useClobClient();
  const { address } = useWallet();
  
  // Set up authentication (choose one)
  useEffect(() => {
    // Option A: L1 Auth (Private Key)
    // Note: In production, get private key securely from Privy or user's wallet
    // clob.setL1Auth(privateKey);
    
    // Option B: L2 Auth (API Key)
    // clob.setL2Auth(apiKey, passphrase);
  }, []);
  
  // Enable WebSocket for real-time updates
  useEffect(() => {
    if (clob.isAuthenticated) {
      clob.enableWebSocket(true);
    }
  }, [clob.isAuthenticated]);
  
  // Place an order
  const handlePlaceOrder = async () => {
    try {
      const order = await clob.placeOrder({
        tokenId: '0x123...', // Token ID for YES or NO
        side: 'BUY',
        size: '100', // Shares as string
        price: 0.65, // Price (0-1)
        orderType: 'LIMIT',
      });
      console.log('Order placed:', order);
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };
  
  return (
    <button onClick={handlePlaceOrder}>
      Place Order
    </button>
  );
}
```

### 2. Get Order Book

```typescript
import { useOrderBook } from './hooks/useOrderBook';
import type { Market } from './types';

function MarketDetails({ market }: { market: Market }) {
  const { orderBook, loading, error } = useOrderBook(market);
  
  if (loading) return <div>Loading order book...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!orderBook) return <div>No order book data</div>;
  
  return (
    <div>
      <h3>YES Orders</h3>
      <div>Bids: {orderBook.yes.bids.length}</div>
      <div>Asks: {orderBook.yes.asks.length}</div>
      
      <h3>NO Orders</h3>
      <div>Bids: {orderBook.no.bids.length}</div>
      <div>Asks: {orderBook.no.asks.length}</div>
    </div>
  );
}
```

### 3. Get Real-time Prices

```typescript
import { useMarketPrices } from './hooks/useMarketPrices';
import type { Market } from './types';

function PriceDisplay({ market }: { market: Market }) {
  const { yesPrice, noPrice, isConnected } = useMarketPrices(market);
  
  return (
    <div>
      <div>YES: {yesPrice}¢ {isConnected && '●'}</div>
      <div>NO: {noPrice}¢ {isConnected && '●'}</div>
      {!isConnected && <small>Using polling (WebSocket unavailable)</small>}
    </div>
  );
}
```

### 4. Direct API Usage

```typescript
import { 
  getOrderBook, 
  getMarkets, 
  placeOrder,
  getUserOrders 
} from './services/clobApi';
import { generateL1Auth } from './services/clobAuth';

// Get markets (no auth required)
const markets = await getMarkets();

// Get order book (no auth required, but needs token ID)
const orderBook = await getOrderBook(tokenId);

// Place order (requires auth)
const authHeaders = await generateL1Auth(privateKey, 'message');
const order = await placeOrder({
  tokenId: '0x123...',
  side: 'BUY',
  size: '100',
  price: 0.65,
}, authHeaders);

// Get user orders (requires auth)
const orders = await getUserOrders(userAddress, authHeaders);
```

### 5. WebSocket Configuration

```typescript
import { polymarketWS } from './lib/polymarketWebSocket';
import { generateL1Auth } from './services/clobAuth';

// Configure WebSocket authentication
const authHeaders = await generateL1Auth(privateKey, 'ws-auth');
polymarketWS.setAuth({
  channel: 'MARKET',
  auth: authHeaders,
  asset_ids: ['token_id_1', 'token_id_2'], // Token IDs to subscribe to
});

// Or for USER channel (order updates)
polymarketWS.setAuth({
  channel: 'USER',
  auth: authHeaders,
  markets: ['condition_id_1', 'condition_id_2'], // Condition IDs
});
```

### 6. Token ID Mapping

```typescript
import { getTokenIdFromMarket } from './utils/tokenMapping';
import type { Market } from './types';

function useMarketTokenIds(market: Market) {
  const yesTokenId = getTokenIdFromMarket(market, 'yes');
  const noTokenId = getTokenIdFromMarket(market, 'no');
  
  return { yesTokenId, noTokenId };
}

// Usage
const { yesTokenId, noTokenId } = useMarketTokenIds(market);
if (yesTokenId) {
  const orderBook = await getOrderBook(yesTokenId);
}
```

## Integration with Privy Wallet

### Getting Private Key from Privy

```typescript
import { useWallets } from '@privy-io/react-auth';

function usePrivyAuth() {
  const { wallets } = useWallets();
  const wallet = wallets?.[0];
  
  // Note: Privy embedded wallets may not expose private keys directly
  // You may need to use Privy's signing methods instead
  // Or use L2 authentication (API key) instead
  
  // For L1 auth, you'd typically:
  // 1. Export private key from user's external wallet (MetaMask, etc.)
  // 2. Or use Privy's embedded wallet signing capabilities
  // 3. Or use L2 API key authentication (recommended for embedded wallets)
}
```

### Recommended: Use L2 Authentication

For Privy embedded wallets, L2 authentication (API key) is recommended:

```typescript
// Get API key from Polymarket Builder Program
const apiKey = 'your-api-key';
const passphrase = 'your-passphrase';

const clob = useClobClient();
clob.setL2Auth(apiKey, passphrase);
```

## Backend Proxy Example

Your backend should proxy requests like this:

```typescript
// Express.js example
app.get('/api/clob/markets', async (req, res) => {
  const response = await fetch('https://clob.polymarket.com/markets', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  res.json(data);
});

app.post('/api/clob/orders', async (req, res) => {
  // Forward auth headers from client
  const authHeaders = {
    'POLY_API_KEY': req.headers['poly-api-key'],
    'POLY_PASSPHRASE': req.headers['poly-passphrase'],
    'POLY_SIGNATURE': req.headers['poly-signature'],
  };
  
  const response = await fetch('https://clob.polymarket.com/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(req.body),
  });
  
  const data = await response.json();
  res.json(data);
});
```

## Complete Trading Flow

```typescript
import { useClobClient } from './hooks/useClobClient';
import { useWallet } from './hooks/useWallet';
import { getTokenIdFromMarket } from './utils/tokenMapping';

function TradingFlow({ market }: { market: Market }) {
  const clob = useClobClient();
  const { address } = useWallet();
  const [amount, setAmount] = useState('100');
  const [price, setPrice] = useState(0.65);
  
  const handleTrade = async () => {
    try {
      // 1. Ensure authenticated
      if (!clob.isAuthenticated) {
        // Show auth setup UI
        return;
      }
      
      // 2. Get token ID
      const tokenId = getTokenIdFromMarket(market, 'yes');
      if (!tokenId) {
        throw new Error('Token ID not available');
      }
      
      // 3. Place order
      const order = await clob.placeOrder({
        tokenId,
        side: 'BUY',
        size: amount,
        price,
        orderType: 'LIMIT',
        conditionId: market.conditionId,
        outcomeIndex: 0, // 0 for YES, 1 for NO
      });
      
      console.log('Order placed:', order);
      
      // 4. Monitor order status (via WebSocket or polling)
      // WebSocket will send updates if configured
      
    } catch (error: any) {
      console.error('Trading error:', error);
    }
  };
  
  return (
    <div>
      <input 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
        placeholder="Amount"
      />
      <input 
        type="number" 
        value={price} 
        onChange={(e) => setPrice(parseFloat(e.target.value))} 
        placeholder="Price"
        min="0"
        max="1"
        step="0.01"
      />
      <button onClick={handleTrade}>
        Place Order
      </button>
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const order = await clob.placeOrder(params);
} catch (error: any) {
  if (error.message.includes('Authentication required')) {
    // Show auth setup UI
  } else if (error.message.includes('Backend proxy not available')) {
    // Show backend setup message
  } else if (error.message.includes('Token ID not available')) {
    // Market data incomplete, try refreshing
  } else {
    // Generic error
    console.error('Trading error:', error);
  }
}
```


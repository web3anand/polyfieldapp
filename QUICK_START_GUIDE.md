# 🚀 Quick Start Guide - New Features

## 1. Builder Attribution (Already Active!)

Your orders are now automatically attributed to your Builder API key. No code changes needed!

**Setup (Already Done):**
```bash
# .env file
VITE_BUILDER_API_KEY=your_key
VITE_BUILDER_SECRET=your_secret
VITE_BUILDER_PASSPHRASE=your_passphrase
```

**Verify it's working:**
1. Place an order
2. Check your Builder dashboard: https://builders.polymarket.com/
3. Your volume should appear on the leaderboard

---

## 2. Batch Price Fetching

### Option A: Use the Hook (Recommended)
```typescript
import { useBatchPrices } from './hooks/useBatchPrices';

function MarketsList() {
  const { markets } = useMarkets();
  const { prices, loading } = useBatchPrices(markets, {
    pollingInterval: 30000, // 30 seconds
    enabled: true,
  });

  return markets.map(market => {
    const priceData = prices.get(market.id);
    return (
      <MarketCard
        {...market}
        yesPrice={priceData?.yesPrice || market.yesPrice}
        noPrice={priceData?.noPrice || market.noPrice}
      />
    );
  });
}
```

### Option B: Direct API Call
```typescript
import { getBatchPrices } from './services/clobApi';

const tokenIds = markets.map(m => m.yesTokenId).filter(Boolean);
const prices = await getBatchPrices(tokenIds);
// Returns: [{ token_id: '123...', price: '0.55' }, ...]
```

---

## 3. Order Pre-flight Check

```typescript
import { isOrderScoring } from './services/clobApi';

async function handlePlaceOrder(order) {
  // Check if order will match
  const { scoring } = await isOrderScoring(
    order.tokenId,
    order.price,
    order.side,
    order.size
  );

  if (!scoring) {
    // Show warning
    const confirmed = confirm(
      'This order is unlikely to fill at the current price. Continue anyway?'
    );
    if (!confirmed) return;
  }

  // Place order
  await placeOrder(order, authHeaders);
}
```

---

## 4. Emergency Cancel All Orders

### Cancel All Orders
```typescript
import { cancelAllOrders } from './services/clobApi';

function EmergencyExitButton() {
  const { authHeaders } = useClobClient();
  
  const handleCancelAll = async () => {
    if (!confirm('Cancel ALL open orders?')) return;
    
    try {
      await cancelAllOrders(authHeaders);
      toast.success('All orders cancelled');
    } catch (error) {
      toast.error('Failed to cancel orders');
    }
  };

  return (
    <button onClick={handleCancelAll} className="btn-danger">
      🚨 Cancel All Orders
    </button>
  );
}
```

### Cancel Orders for Specific Market
```typescript
import { cancelMarketOrders } from './services/clobApi';

function MarketActions({ market }) {
  const { authHeaders } = useClobClient();
  
  const handleCancelMarketOrders = async () => {
    try {
      await cancelMarketOrders(market.yesTokenId, authHeaders);
      toast.success('Market orders cancelled');
    } catch (error) {
      toast.error('Failed to cancel orders');
    }
  };

  return (
    <button onClick={handleCancelMarketOrders}>
      Cancel Orders
    </button>
  );
}
```

---

## 5. USDC Approval Management

### Check and Approve USDC
```typescript
import { useBalanceAllowance } from './hooks/useBalanceAllowance';

function TradingForm() {
  const { authHeaders } = useClobClient();
  const { info, approveUSDC, loading, updating } = useBalanceAllowance(authHeaders);

  // Show approval prompt if needed
  if (!loading && !info?.allowanceSufficient) {
    return (
      <div className="approval-prompt">
        <h3>Approve USDC for Trading</h3>
        <p>Balance: ${info?.balance || '0'} USDC</p>
        <p>You need to approve USDC before placing orders.</p>
        <button 
          onClick={approveUSDC} 
          disabled={updating}
        >
          {updating ? 'Approving...' : 'Approve USDC'}
        </button>
      </div>
    );
  }

  // Show trading form
  return <OrderForm />;
}
```

### Direct API Usage
```typescript
import { getBalanceAllowance, updateBalanceAllowance } from './services/clobApi';

// Check allowance
const info = await getBalanceAllowance('COLLATERAL', authHeaders);
console.log('Balance:', info.balance);
console.log('Allowance sufficient:', info.allowance_sufficient);

// Approve USDC
if (!info.allowance_sufficient) {
  await updateBalanceAllowance('COLLATERAL', authHeaders);
}
```

---

## 6. Historical Price Charts

```typescript
import { getPricesHistory } from './services/clobApi';

function PriceChart({ market }) {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    async function loadHistory() {
      const data = await getPricesHistory(
        market.yesTokenId,
        '1d',  // interval: '1h', '6h', '1d', '1w', 'max'
        1      // fidelity: data points per interval
      );
      setHistory(data);
    }
    loadHistory();
  }, [market]);

  return (
    <LineChart data={history.map(d => ({
      x: new Date(d.timestamp * 1000),
      y: parseFloat(d.price) * 100,
    }))} />
  );
}
```

---

## Complete Trading Flow Example

```typescript
import { useState } from 'react';
import { useClobClient } from './hooks/useClobClient';
import { useBalanceAllowance } from './hooks/useBalanceAllowance';
import { isOrderScoring, placeOrder } from './services/clobApi';

function TradingInterface({ market }) {
  const { authHeaders } = useClobClient();
  const { info, approveUSDC } = useBalanceAllowance(authHeaders);
  const [orderParams, setOrderParams] = useState({
    side: 'BUY',
    price: 0.5,
    size: '100',
  });

  const handlePlaceOrder = async () => {
    // 1. Check USDC approval
    if (!info?.allowanceSufficient) {
      const confirmed = confirm('Approve USDC first?');
      if (confirmed) {
        await approveUSDC();
      } else {
        return;
      }
    }

    // 2. Pre-flight check
    const { scoring } = await isOrderScoring(
      market.yesTokenId,
      orderParams.price,
      orderParams.side,
      orderParams.size
    );

    if (!scoring) {
      const confirmed = confirm('Order unlikely to fill. Continue?');
      if (!confirmed) return;
    }

    // 3. Place order (Builder headers automatically added)
    try {
      const response = await placeOrder({
        tokenId: market.yesTokenId,
        side: orderParams.side,
        size: orderParams.size,
        price: orderParams.price,
      }, authHeaders);
      
      toast.success(`Order placed: ${response.id}`);
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h3>{market.title}</h3>
      
      {/* Order Form */}
      <select value={orderParams.side} onChange={e => setOrderParams({...orderParams, side: e.target.value})}>
        <option value="BUY">Buy YES</option>
        <option value="SELL">Sell YES</option>
      </select>
      
      <input 
        type="number" 
        step="0.01"
        value={orderParams.price}
        onChange={e => setOrderParams({...orderParams, price: parseFloat(e.target.value)})}
        placeholder="Price (0-1)"
      />
      
      <input 
        type="number"
        value={orderParams.size}
        onChange={e => setOrderParams({...orderParams, size: e.target.value})}
        placeholder="Size (shares)"
      />
      
      <button onClick={handlePlaceOrder}>
        Place Order
      </button>
    </div>
  );
}
```

---

## Testing Your Implementation

### 1. Test Builder Attribution
```bash
# Place an order
# Check: https://builders.polymarket.com/
# Your API key should show volume
```

### 2. Test Batch Prices
```typescript
// Open browser console
import { getBatchPrices } from './services/clobApi';

// Fetch 10 prices
const tokens = [/* 10 token IDs */];
const prices = await getBatchPrices(tokens);
console.log(prices);
// Should return all 10 prices in ~100ms
```

### 3. Test Order Scoring
```typescript
// Open browser console
import { isOrderScoring } from './services/clobApi';

// Test unrealistic price (should return false)
const result = await isOrderScoring(
  'token_id_here',
  0.01,  // Very low price
  'BUY',
  '1000000'  // Large size
);
console.log(result.scoring); // Should be false
```

### 4. Test Cancel All
```typescript
// Place 2-3 test orders
// Then:
await cancelAllOrders(authHeaders);
// Check orders page - should be empty
```

### 5. Test USDC Approval
```typescript
const info = await getBalanceAllowance('COLLATERAL', authHeaders);
console.log('Allowance sufficient:', info.allowance_sufficient);

if (!info.allowance_sufficient) {
  await updateBalanceAllowance('COLLATERAL', authHeaders);
  // Sign the message in your wallet
  // Check again - should now be true
}
```

---

## Troubleshooting

### Builder Headers Not Working
```bash
# Check env vars are set:
echo $VITE_BUILDER_API_KEY
echo $VITE_BUILDER_SECRET
echo $VITE_BUILDER_PASSPHRASE

# Restart dev server after changing .env
npm run dev
```

### Batch Prices Not Fetching
```typescript
// Make sure markets have token IDs
console.log(market.yesTokenId); // Should not be undefined

// If undefined, need to derive token IDs from condition ID
```

### Order Scoring Returns True for Everything
```typescript
// This is normal for:
// 1. Realistic prices (market price ± 10%)
// 2. Normal sizes (< 10% of liquidity)
// 3. Active markets with good liquidity

// Test with extreme values to see false:
await isOrderScoring(tokenId, 0.01, 'BUY', '999999');
```

### Cancel All Not Working
```typescript
// Check:
// 1. Auth headers are valid
// 2. Backend proxy is running
// 3. You have open orders to cancel

// Check open orders first:
const orders = await getUserOrders(address, authHeaders);
console.log('Open orders:', orders.length);
```

---

## Performance Tips

### 1. Use Batch APIs When Possible
```typescript
// ❌ BAD: Individual calls
for (const market of markets) {
  const price = await getPrice(market.tokenId);
}

// ✅ GOOD: Batch call
const prices = await getBatchPrices(markets.map(m => m.tokenId));
```

### 2. Cache Balance/Allowance Info
```typescript
// Use the hook - it caches automatically
const { info } = useBalanceAllowance(authHeaders);

// Don't call getBalanceAllowance repeatedly
```

### 3. Pre-flight Check Only on Submit
```typescript
// ❌ BAD: Check on every input change
useEffect(() => {
  isOrderScoring(tokenId, price, side, size);
}, [price, size]);

// ✅ GOOD: Check only on submit
const handleSubmit = async () => {
  await isOrderScoring(tokenId, price, side, size);
  await placeOrder(...);
};
```

---

## Rate Limits to Remember

| Operation | Limit | Notes |
|-----------|-------|-------|
| Place order | 40/s sustained | Use POST /order for single orders |
| Batch prices | 80/s | 100 tokens per request |
| Cancel all | 5/s sustained | Emergency use only |
| Balance check | 125/s | Cache the result |
| Order scoring | 300/s | Check before submit, not on input |

---

## What's Next?

### Immediate:
- ✅ Builder headers working
- ✅ Batch APIs available
- ✅ Order scoring implemented
- ✅ Cancel all ready
- ✅ Balance/allowance hooks ready

### Next Steps:
1. Create portfolio UI to display holdings
2. Implement request queue for rate limiting
3. Add optimistic UI updates
4. WebSocket order notifications

---

**🎉 You're ready to build a super-fast Polymarket trading app!**

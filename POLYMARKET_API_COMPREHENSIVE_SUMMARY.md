# 🚀 Polymarket API Comprehensive Summary & Implementation Plan

**Goal:** Build a "perfect trading app" that acts as a "home app for Polymarket" with super-fast order placement

---

## 📊 Rate Limits Summary

### Critical Trading Endpoints (For Fast Order Placement)
| Endpoint | Burst Limit | Sustained Limit | Strategy |
|----------|-------------|-----------------|----------|
| **POST /order** | 240/s (2400 per 10s) | **40/s** (24000 per 10min) | ✅ **Primary endpoint for single orders** |
| **POST /orders** | 80/s (800 per 10s) | **20/s** (12000 per 10min) | Use for batch orders |
| **DELETE /order** | 240/s (2400 per 10s) | **40/s** (24000 per 10min) | Fast cancellation |
| **DELETE /orders** | 80/s (800 per 10s) | **20/s** (12000 per 10min) | Batch cancellation |
| **DELETE /cancel-all** | 20/s (200 per 10s) | **5/s** (3000 per 10min) | Emergency cancel |
| **DELETE /cancel-market-orders** | 80/s (800 per 10s) | **20/s** (12000 per 10min) | Cancel by market |

**💡 Key Insight:** For **super fast trading**, use `POST /order` (single order endpoint) which allows **240 orders/second burst** and **40 orders/second sustained**. This is significantly faster than competitors!

### Market Data Endpoints (Current Usage)
| Endpoint | Rate Limit | Current Usage | Status |
|----------|------------|---------------|--------|
| **GET /markets** | 250/s (per 10s) | ✅ Every 5 minutes | Optimal |
| **GET /book** | 200/s (per 10s) | ✅ On-demand | Optimal |
| **GET /price** | 200/s (per 10s) | ✅ Via WebSocket fallback | Optimal |
| **GET /books** | 80/s (per 10s) | ❌ Not used | Consider for batch |
| **GET /prices** | 80/s (per 10s) | ❌ Not used | Consider for batch |

### User Data Endpoints
| Endpoint | Rate Limit | Notes |
|----------|------------|-------|
| **GET /data/orders** (user orders) | 300/s (per 10s) | Ledger endpoint |
| **GET /data/trades** (user trades) | 300/s (per 10s) | Ledger endpoint |
| **GET /notifications** | 125/s (per 10s) | Real-time updates |
| **GET /balance-allowance** | 125/s (per 10s) | Check approvals |
| **UPDATE /balance-allowance** | 20/s (per 10s) | Set approvals |

### Authentication & Builder Endpoints
| Endpoint | Rate Limit | Purpose |
|----------|------------|---------|
| **POST /auth/api-key** | 50/s (per 10s) | Create API keys |
| **POST /auth/builder-api-key** | 50/s (per 10s) | Builder Program keys |
| **GET /builder/trades** | N/A | Builder attribution tracking |
| **POST /relayer/submit** | **15/min** | ⚠️ Gasless transactions (very limited!) |

### Data API (User Holdings, History)
| Endpoint | Rate Limit | Purpose |
|----------|------------|---------|
| **Data API (General)** | 200/s (per 10s) | User data, holdings |
| **Data API /trades** | 75/s (per 10s) | Historical trades |

---

## 🛠️ Currently Implemented Endpoints

### ✅ **Working & Optimized**
1. **`GET /markets`** - Fetch all markets (500 markets, every 5 minutes)
2. **`GET /book`** - Order book for token (on-demand)
3. **`GET /price`** - Last trade price (via WebSocket fallback, 30s polling)
4. **`POST /order`** - Place single order (requires auth)
5. **`DELETE /order`** - Cancel single order (requires auth)
6. **`GET /data/orders`** - User's open orders (requires auth)
7. **`GET /data/trades`** - User's trade history (requires auth)
8. **WebSocket** - Real-time price updates (`wss://ws-subscriptions-clob.polymarket.com/ws/`)

### ⚠️ **Partially Implemented**
- **Builder Program Authentication** - Config exists but headers not added to requests
- **Gasless Transactions** - RelayerClient created but not integrated into UI
- **Safe Wallet Deployment** - Function exists but no UI trigger

### ❌ **Not Implemented**
1. **Batch Operations:**
   - `POST /orders` - Place multiple orders at once (20/s sustained)
   - `DELETE /orders` - Cancel multiple orders (20/s sustained)
   - `DELETE /cancel-market-orders` - Cancel all orders for a market
   - `DELETE /cancel-all` - Cancel all user orders
   - `GET /books` - Get multiple order books (batch)
   - `GET /prices` - Get multiple prices (batch)

2. **Advanced Market Data:**
   - `GET /midpoint` - Mid-price for token
   - `GET /spread` - Bid-ask spread
   - `GET /prices-history` - Historical price data
   - `GET /simplified-markets` - Lighter market data
   - `GET /market/{conditionId}` - Single market details

3. **User Portfolio:**
   - `GET /balance-allowance` - Check USDC/CTF approvals
   - `UPDATE /balance-allowance` - Set approvals (via signature)
   - Holdings from Data API (separate endpoint)

4. **Notifications:**
   - `GET /notifications` - Order status updates
   - `DROP /notifications` - Mark notifications as read

5. **Rewards & Leaderboard:**
   - `GET /rewards/user` - User earnings
   - `GET /rewards/markets/current` - Active reward markets
   - Builder leaderboard endpoints

6. **Order Scoring:**
   - `POST /order-scoring` - Check if order will match
   - `POST /orders-scoring` - Batch scoring check

---

## 🚀 Implementation Roadmap for "Perfect Trading App"

### **Priority 1: Super Fast Order Placement** 🏎️

#### A. Optimize Order Submission
**Current:** Individual `POST /order` calls with basic error handling  
**Needed:**
1. **Request Queue Manager**
   ```typescript
   // Priority queue for order operations
   class OrderQueue {
     private queue: PriorityQueue<OrderRequest>;
     private rateLimit = 40; // orders/second sustained
     
     async submitOrder(order: Order, priority: 'high' | 'normal' = 'normal') {
       // Add to queue with priority
       // Process respecting rate limits
       // Return promise that resolves when order is submitted
     }
   }
   ```

2. **Optimistic UI Updates**
   ```typescript
   // Show order as "pending" immediately
   // Update state before API confirmation
   // Roll back if API fails
   ```

3. **Connection Pooling**
   - Maintain persistent HTTP connections to `clob.polymarket.com`
   - Reduce latency from connection overhead

4. **WebSocket Order Updates**
   - Subscribe to order status notifications
   - Avoid polling `/data/orders` repeatedly
   - Instant feedback on fills/rejections

**Expected Improvement:** 50-200ms faster order submission

#### B. Add Builder Attribution (Required for Fast Orders)
**Why:** Builder Program provides priority routing and attribution benefits

```typescript
// Add to all order requests
import { injectBuilderHeaders } from '@polymarket/builder-signing-sdk';

const headers = await createL2Headers(/* ... */);
const builderHeaders = await injectBuilderHeaders(
  headers,
  { method: 'POST', requestPath: '/order', body: orderPayload },
  builderConfig
);
```

**Status:** ❌ Config exists but not used in requests  
**Priority:** **HIGH** - Implement immediately

#### C. Implement Batch Order Submission
**When to use:** 
- Multiple orders for same market (ladder orders)
- Portfolio rebalancing
- Stop-loss + take-profit combos

```typescript
// Use POST /orders (20/s instead of 40/s, but sends multiple orders)
await clobClient.postOrders([
  { order: buyOrder1, orderType: OrderType.GTC },
  { order: buyOrder2, orderType: OrderType.GTC },
  { order: sellOrder1, orderType: OrderType.GTC },
]);
```

**Status:** ❌ Not implemented  
**Priority:** **MEDIUM** - Useful for advanced traders

---

### **Priority 2: Missing Critical Features** 🔧

#### A. Batch Order Cancellation
**Why:** Users need to quickly exit positions or clear stale orders

```typescript
// Cancel all orders for a specific market
await clobClient.cancelMarketOrders({
  asset_id: tokenId, // or use market: conditionId
});

// Cancel all orders (emergency)
await clobClient.cancelAll();
```

**Status:** ❌ Not implemented  
**Priority:** **HIGH** - Essential for risk management

#### B. Order Scoring (Pre-flight Check)
**Why:** Know if order will match BEFORE submitting (avoid wasted gas/time)

```typescript
// Check if order will match
const scoring = await clobClient.isOrderScoring({
  token_id: tokenId,
  price: 0.55,
  side: 'BUY',
  size: 100,
});

if (!scoring.will_match) {
  // Show warning: "Order unlikely to fill"
}
```

**Status:** ❌ Not implemented  
**Priority:** **HIGH** - Improves UX, prevents failed orders

#### C. Balance & Allowance Management
**Why:** Users need to approve USDC before trading (UX friction)

```typescript
// Check if user has approved USDC for trading
const allowance = await clobClient.getBalanceAllowance({
  asset_type: 'COLLATERAL', // USDC
});

if (!allowance.allowance_sufficient) {
  // Prompt user to approve (via Privy signature, not transaction)
  await clobClient.updateBalanceAllowance({ /* ... */ });
}
```

**Status:** ❌ Not implemented  
**Priority:** **HIGH** - Required for gasless trading flow

---

### **Priority 3: Enhanced Market Data** 📈

#### A. Historical Price Data
**Why:** Show price charts, calculate volatility, detect trends

```typescript
// Get 24h price history
const history = await clobClient.getPricesHistory({
  token_id: tokenId,
  interval: PriceHistoryInterval.ONE_HOUR,
  fidelity: 1, // data points per interval
});
```

**Rate Limit:** 100/s (per 10s)  
**Status:** ❌ Not implemented  
**Priority:** **MEDIUM** - Nice to have for charts

#### B. Batch Price Fetching
**Why:** Current implementation fetches 500 markets individually (inefficient)

```typescript
// Fetch multiple prices in one request
const prices = await clobClient.getPrices([
  { token_id: token1 },
  { token_id: token2 },
  // ... up to 100 tokens
]);
```

**Optimization:** Reduces 500 requests → 5 requests  
**Status:** ❌ Not implemented  
**Priority:** **HIGH** - Significantly reduces API load

#### C. Market Metadata
**Why:** Get tick size, negRisk status, fee rates per market

```typescript
// Get tick size for a token (required for order creation)
const tickSize = await clobClient.getTickSize(tokenId);

// Get negRisk status (affects order creation)
const negRisk = await clobClient.getNegRisk(tokenId);

// Get fee rate
const feeRate = await clobClient.getFeeRate(tokenId);
```

**Status:** ❌ Not cached or pre-fetched  
**Priority:** **MEDIUM** - Improve order creation flow

---

### **Priority 4: User Portfolio & Tracking** 📊

#### A. Holdings & PnL
**Why:** Show user's positions and profit/loss

```typescript
// Get user holdings (from Data API)
const holdings = await dataApi.getUserHoldings(address);

// Get user PnL (from User PNL API)
const pnl = await pnlApi.getUserPnL(address);
```

**Rate Limit:** 
- Data API: 200/s (per 10s)
- PnL API: 100/s (per 10s)

**Status:** ⚠️ `getUserHoldings()` exists but not displayed  
**Priority:** **HIGH** - Core feature for trading app

#### B. Trade History with Pagination
**Why:** Show all user trades (not just recent)

```typescript
// Current: Fetches all pages automatically (slow)
const trades = await clobClient.getTrades({ maker_address: address });

// Better: Paginated fetching
const { trades, next_cursor } = await clobClient.getTradesPaginated({
  maker_address: address,
});
```

**Status:** ⚠️ Implemented but not optimized  
**Priority:** **MEDIUM** - Improve performance for active traders

#### C. Notifications
**Why:** Real-time order status updates (filled, cancelled, rejected)

```typescript
// Get notifications
const notifications = await clobClient.getNotifications();

// Mark as read
await clobClient.dropNotifications({ ids: [notif1, notif2] });
```

**Rate Limit:** 125/s (per 10s)  
**Status:** ❌ Not implemented  
**Priority:** **LOW** - WebSocket provides similar functionality

---

### **Priority 5: Builder Program Integration** 🏆

#### A. Add Builder Headers to All Orders
**Impact:** Order attribution, leaderboard tracking, potential benefits

```typescript
// Current: Missing builder headers
// Needed: Inject builder auth into all trading requests

const l2Headers = await createL2Headers(/* ... */);
const finalHeaders = await this._generateBuilderHeaders(l2Headers, {
  method: 'POST',
  requestPath: '/order',
  body: orderPayload,
});
```

**Status:** ⚠️ Function exists but not called  
**Priority:** **HIGH** - Required for full Builder integration

#### B. Builder Stats Dashboard
**Why:** Show user's volume, rank, rewards

```typescript
// Get builder trades (attributed to your API key)
const trades = await clobClient.getBuilderTrades({
  maker_address: address,
});

// Get rewards data
const rewards = await clobClient.getRewardPercentages();
const earnings = await clobClient.getEarningsForUserForDay('2025-01-20');
```

**Status:** ❌ Not implemented  
**Priority:** **LOW** - Nice to have for competitive traders

#### C. Builder API Key Management UI
**Why:** Let users create/revoke Builder API keys from app

```typescript
// Create builder API key
const key = await clobClient.createBuilderApiKey();

// List existing keys
const keys = await clobClient.getBuilderApiKeys();

// Revoke key
await clobClient.revokeBuilderApiKey();
```

**Status:** ❌ Not implemented  
**Priority:** **LOW** - Advanced feature

---

### **Priority 6: Advanced Order Types** 📈

#### A. Market Orders (FOK/FAK)
**Why:** Fill-or-Kill (FOK) and Fill-and-Kill (FAK) for immediate execution

```typescript
// Current: Only GTC (Good-Til-Cancelled) supported in UI
// Needed: Market order UI

await clobClient.createAndPostMarketOrder(
  {
    tokenID: token,
    side: Side.BUY,
    amount: 100, // USDC to spend
    price: 0.6, // Max price willing to pay
  },
  { tickSize: '0.01', negRisk: false },
  OrderType.FOK, // Fill entire amount or cancel
);
```

**Status:** ⚠️ Backend supports, UI doesn't  
**Priority:** **MEDIUM** - Popular with active traders

#### B. Stop-Loss / Take-Profit
**Why:** Automated risk management

**Note:** NOT supported by CLOB API directly (no conditional orders)  
**Solution:** Implement client-side monitoring + automatic order submission

```typescript
// Monitor price and submit order when condition met
if (currentPrice <= stopLossPrice) {
  await clobClient.postOrder(sellOrder);
}
```

**Status:** ❌ Not implemented  
**Priority:** **LOW** - Requires continuous monitoring

---

## 📋 Implementation Checklist

### **Immediate (Sprint 1)** 🔴
- [ ] **Add Builder headers to all order requests** (1-2 hours)
- [ ] **Implement batch price fetching (`GET /prices`)** (2-3 hours)
- [ ] **Add order scoring pre-flight check** (2-3 hours)
- [ ] **Implement balance/allowance check UI** (3-4 hours)
- [ ] **Add batch order cancellation** (`cancelAll`, `cancelMarketOrders`) (1-2 hours)
- [ ] **Display user holdings (portfolio)** (3-4 hours)

**Total:** ~15-20 hours  
**Impact:** Massive improvement in speed, UX, and completeness

### **Short-term (Sprint 2)** 🟠
- [ ] **Request queue manager for rate limiting** (4-6 hours)
- [ ] **Optimistic UI updates for orders** (3-4 hours)
- [ ] **WebSocket order status notifications** (2-3 hours)
- [ ] **Historical price data for charts** (4-5 hours)
- [ ] **Market order UI (FOK/FAK)** (3-4 hours)
- [ ] **Paginated trade history** (2-3 hours)

**Total:** ~18-25 hours  
**Impact:** "Super fast" order placement achieved

### **Medium-term (Sprint 3)** 🟡
- [ ] **Builder stats dashboard** (6-8 hours)
- [ ] **Rewards & leaderboard integration** (4-6 hours)
- [ ] **Advanced order batching UI** (5-7 hours)
- [ ] **Market metadata caching (tick size, negRisk)** (3-4 hours)
- [ ] **Notifications panel** (4-5 hours)

**Total:** ~22-30 hours  
**Impact:** Full-featured trading app

### **Long-term (Sprint 4+)** 🟢
- [ ] **Builder API key management UI** (4-6 hours)
- [ ] **Client-side stop-loss monitoring** (6-8 hours)
- [ ] **Connection pooling optimization** (4-6 hours)
- [ ] **Safe wallet deployment UI** (5-7 hours)
- [ ] **Multi-wallet support** (6-8 hours)

**Total:** ~25-35 hours  
**Impact:** Power user features

---

## 🎯 Quick Wins (Do These First!)

### 1. **Add Builder Headers** (30 min)
```typescript
// In useClobClient.ts or clobApi.ts
import { injectBuilderHeaders } from '@polymarket/builder-signing-sdk';
import { builderConfig } from '../config/builderConfig';

// Before submitting order:
if (builderConfig.apiKey) {
  headers = await injectBuilderHeaders(headers, headerArgs, builderConfig);
}
```

### 2. **Batch Price Fetching** (1 hour)
```typescript
// In useMarkets.ts - replace individual price fetches
const tokenIds = markets.map(m => ({ token_id: m.tokenId }));
const prices = await clobClient.getPrices(tokenIds);
```

### 3. **Order Pre-flight Check** (1 hour)
```typescript
// Before submitting order, check if it will match
const willMatch = await clobClient.isOrderScoring({
  token_id: params.tokenID,
  price: params.price,
  side: params.side,
  size: params.size,
});

if (!willMatch.scoring) {
  showWarning('Order unlikely to fill at this price');
}
```

### 4. **Cancel All Orders Button** (30 min)
```typescript
// Add to trading UI
<Button onClick={() => clobClient.cancelAll()}>
  Cancel All Orders
</Button>
```

---

## ⚠️ Critical Considerations

### Rate Limit Strategy
- **Order Submission:** Use `POST /order` (40/s sustained) for single orders
- **Batch Operations:** Use `POST /orders` (20/s sustained) for 3+ orders at once
- **Price Updates:** Use `GET /prices` batch endpoint (80/s) instead of individual calls
- **Gasless Transactions:** Relayer limit is **15/min** - use sparingly!

### WebSocket vs Polling
- **WebSocket:** Use for real-time price updates (no rate limits)
- **Polling:** Fallback only (current 30s interval is good)
- **Status:** Current implementation is optimal

### Authentication Flow
- **Privy:** Handles wallet connection (seamless for users) ✅
- **L1 Auth:** Never expose private keys (Privy handles this) ✅
- **L2 Auth:** Builder API keys stored in env vars (secure) ✅
- **Status:** Current implementation is secure

### Error Handling
**Missing:**
- Rate limit detection (HTTP 429)
- Exponential backoff for retries
- Request queuing when rate limited

**Needed:**
```typescript
class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Rate limit exceeded');
  }
}

// In API client
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  throw new RateLimitError(parseInt(retryAfter || '10'));
}
```

---

## 🏁 Summary

### **What's Working** ✅
- Basic market data fetching (optimized)
- Real-time price updates via WebSocket
- Order placement (single orders)
- User order history
- Privy wallet integration (secure, seamless)
- Builder SDK installed and configured

### **What's Missing** ❌
- **Builder headers on order requests** (critical!)
- Batch operations (prices, orders, cancellations)
- Order pre-flight checks (scoring)
- Balance/allowance management
- User holdings/portfolio display
- Historical price data
- Rate limit handling
- Request queuing

### **How to Achieve "Super Fast" Trading** 🚀
1. ✅ Use WebSocket for real-time prices (done)
2. ❌ Add Builder attribution headers (do now!)
3. ❌ Implement request queue with rate limiting (sprint 2)
4. ❌ Optimistic UI updates (sprint 2)
5. ❌ Batch operations where possible (sprint 1)
6. ✅ Use `POST /order` endpoint (40/s sustained) (done)

### **Recommended Next Steps**
1. **Today:** Add Builder headers to orders (30 min)
2. **Today:** Implement batch price fetching (1 hour)
3. **Today:** Add order pre-flight check (1 hour)
4. **This Week:** Implement Sprint 1 checklist (15-20 hours)
5. **Next Week:** Start Sprint 2 for "super fast" orders

---

## 📚 Resources

- **API Docs:** https://docs.polymarket.com/developers
- **Rate Limits:** https://docs.polymarket.com/quickstart/introduction/rate-limits
- **CLOB Client:** https://github.com/Polymarket/clob-client
- **Builder SDK:** https://github.com/Polymarket/builder-signing-sdk
- **Privy Docs:** https://docs.privy.io/

---

**Last Updated:** 2025-01-20  
**Version:** 1.0

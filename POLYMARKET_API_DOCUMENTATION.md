# Polymarket API Documentation - Complete Reference

**Source**: https://docs.polymarket.com/quickstart/introduction/main

**Last Updated**: Based on test results and documentation review

## 📚 API Structure Overview

Polymarket provides multiple API endpoints for different functionalities:

### 1. **Gamma API** (Market Data)
- **Base URL**: `https://gamma-api.polymarket.com`
- **Purpose**: Fetch market data, events, sports, tags
- **Endpoints**:
  - `/markets` - List all markets
  - `/markets/:id` - Get specific market
  - `/events` - Get events
  - `/sports` - Get sports categories
  - `/tags` - Get tags
  - `/series` - Get series
  - `/comments` - Get comments
  - `/search` - Search markets
  - `/health` - Health check

### 2. **CLOB API** (Trading)
- **Base URL**: `https://clob.polymarket.com`
- **Purpose**: Place orders, manage trades, get orderbook
- **Endpoints**:
  - `/book?token_id={tokenId}` - Get order book
  - `/orders` - Place/get orders
  - `/orders/:id` - Get/cancel specific order
  - `/trades` - Get trades
- **Authentication**: Required (API key or wallet signature)

### 3. **Data API**
- **Base URL**: `https://data-api.polymarket.com`
- **Purpose**: Additional data endpoints
- **Endpoints**: Various data endpoints

### 4. **WebSocket** (Real-time)
- **Base URL**: `wss://ws-subscriptions-clob.polymarket.com/ws`
- **Purpose**: Real-time price updates, order updates
- **Channels**:
  - `market:{conditionId}` - Market price updates
  - `user:{address}` - User order updates

## 🔑 Key Concepts

### Market Structure
Based on API response, a market object contains:
```typescript
{
  id: string;                    // Market ID
  question: string;              // Market question
  conditionId: string;           // Condition ID
  slug: string;                  // URL slug
  outcomes: string | string[];   // ["Yes", "No"] or JSON string
  active: boolean;               // Is market active
  closed: boolean;               // Is market closed
  endDate: string;                // ISO date string
  startDate: string;             // ISO date string
  image: string;                 // Market image URL
  description: string;           // Market description
  liquidityAmm: number;          // AMM liquidity
  liquidityClob: number;        // CLOB liquidity
  bestBid: number;               // Best bid price (0-1)
  bestAsk: number;               // Best ask price (0-1)
  volume24hrClob: number;       // 24hr volume
  events: Array<{               // Related events
    id: string;
    title: string;
    ticker: string;
    // ... more event fields
  }>;
  // ... more fields
}
```

### Price Format
- Prices are in decimal format (0.0 to 1.0)
- YES price = best bid or outcome[0].price
- NO price = 1 - best ask or outcome[1].price
- Convert to cents: `price * 100`

### Liquidity
- Total liquidity = `liquidityAmm + liquidityClob`
- Format: `$Xk` for thousands, `$XM` for millions

## 📋 API Endpoints Details

### Gamma API - Markets Endpoint

**GET** `/markets`

**Query Parameters:**
- `limit` (number): Number of markets to return (default: varies)
- `offset` (number): Pagination offset (default: 0)
- `active` (boolean): Filter active markets (default: true)
- `closed` (boolean): Filter closed markets (default: false)
- `sport` (string): Filter by sport
- `tag` (string): Filter by tag
- `event` (string): Filter by event ID

**Response Format:**
Returns an **array** of market objects directly (not wrapped in an object).

**Example Response:**
```json
[
  {
    "id": "502517",
    "question": "ARCH Will the match be a draw?",
    "conditionId": "",
    "slug": "will-the-match-be-a-draw-romania-ukraine",
    "outcomes": "[\"Yes\", \"No\"]",
    "active": true,
    "closed": false,
    "endDate": "2024-06-17T12:00:00Z",
    "startDate": "2024-06-17T03:51:23.112Z",
    "liquidityAmm": 0,
    "liquidityClob": 0,
    "bestBid": 0,
    "bestAsk": 1,
    "volume24hrClob": 0,
    "events": [
      {
        "id": "11120",
        "ticker": "arch-euro-2024-romania-vs-ukraine",
        "title": "ARch Euro 2024: Romania vs. Ukraine",
        "endDate": "2024-06-17T12:00:00Z"
      }
    ],
    "competitive": 0,
    "archived": false,
    "restricted": true,
    "approved": true
  }
]
```

**Important Notes:**
- Response is a direct array (not `{ markets: [...] }`)
- `outcomes` is a **JSON string** that needs parsing: `JSON.parse(market.outcomes)`
- Prices (`bestBid`, `bestAsk`) are decimals (0-1), convert to cents: `price * 100`
- Total liquidity = `liquidityAmm + liquidityClob`
- Filter by `active: true` and `closed: false` for active markets

### CLOB API - Order Book

**GET** `/book?token_id={tokenId}`

**Response:**
- Order book with bids and asks
- Price levels and sizes

### CLOB API - Place Order

**POST** `/orders`

**Body:**
```json
{
  "token_id": "string",
  "side": "BUY" | "SELL",
  "size": "string",
  "price": number,
  "user": "0x..."
}
```

## 🔐 Authentication

### For CLOB API (Trading)
1. **API Key** - Get from Polymarket Builder Program
2. **Wallet Signature** - Sign message with wallet
3. **Headers**: `Authorization: Bearer {token}` or signed message

### For Gamma API (Market Data)
- **Public endpoints** - No authentication needed
- **CORS**: May be restricted in browsers (requires proxy)

## ⚡ Rate Limits

- Check documentation for specific rate limits
- Implement rate limiting in your backend
- Use caching when possible

## 🛠️ Official SDKs

### TypeScript/JavaScript
```bash
npm install @polymarket/clob-client
```

**Usage:**
```typescript
import { ClobClient } from '@polymarket/clob-client';

const client = new ClobClient({
  network: 'polygon',
  apiKey: 'your-api-key'
});
```

### Python
```bash
pip install py-clob-client
```

## 📖 Additional Resources

- [Polymarket Docs](https://docs.polymarket.com/)
- [CLOB Client (TypeScript)](https://github.com/Polymarket/clob-client)
- [CLOB Client (Python)](https://github.com/Polymarket/py-clob-client)
- [Builder Program](https://docs.polymarket.com/builders/introduction)
- [API Status](https://status.polymarket.com/)

## ⚠️ Important Notes

### 1. CORS Restrictions
- **Test Result**: ✅ Direct API access works from Node.js
- **Browser**: ⚠️ May be blocked by CORS in browsers
- **Solution**: Try direct API first, fallback to backend proxy if CORS blocks

### 2. Response Formats
- **Markets endpoint**: Returns **array directly** (not wrapped object)
- **Outcomes field**: JSON **string** that needs parsing: `JSON.parse(market.outcomes)`
- **Dates**: ISO format strings (e.g., `"2024-06-17T12:00:00Z"`)
- **Prices**: Decimal format (0.0 to 1.0), convert to cents: `Math.round(price * 100)`

### 3. Price Calculation
```typescript
// Method 1: Use bestBid/bestAsk (if available)
const yesPrice = market.bestBid || 0.5;  // YES price
const noPrice = 1 - (market.bestAsk || 0.5);  // NO price

// Method 2: Parse from outcomes (if prices in outcomes array)
const outcomes = JSON.parse(market.outcomes);
const yesPrice = outcomes[0]?.price || 0.5;
const noPrice = outcomes[1]?.price || 0.5;

// Convert to cents for display
const yesPriceCents = Math.round(yesPrice * 100);
const noPriceCents = Math.round(noPrice * 100);
```

### 4. Liquidity Calculation
```typescript
// Total liquidity = AMM + CLOB
const totalLiquidity = (market.liquidityAmm || 0) + (market.liquidityClob || 0);

// Format for display
function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1000000) return `$${(liquidity / 1000000).toFixed(1)}M`;
  if (liquidity >= 1000) return `$${(liquidity / 1000).toFixed(0)}k`;
  return `$${liquidity.toFixed(0)}`;
}
```

### 5. Market Filtering
```typescript
// Filter active, non-closed markets
const activeMarkets = markets.filter(m => 
  m.active === true && 
  m.closed === false &&
  new Date(m.endDate) > new Date()  // Not expired
);
```

### 6. Category Extraction
```typescript
// Extract category from event title
function getCategory(market: PolymarketMarket): string {
  const eventTitle = market.events?.[0]?.title?.toLowerCase() || '';
  if (eventTitle.includes('football')) return 'Football';
  if (eventTitle.includes('basketball')) return 'Basketball';
  if (eventTitle.includes('baseball')) return 'Baseball';
  if (eventTitle.includes('soccer')) return 'Soccer';
  if (eventTitle.includes('tennis')) return 'Tennis';
  if (eventTitle.includes('hockey')) return 'Hockey';
  if (eventTitle.includes('mma')) return 'MMA';
  if (eventTitle.includes('boxing')) return 'Boxing';
  if (eventTitle.includes('cricket')) return 'Cricket';
  return 'Football'; // Default
}
```

## 🎯 Implementation Checklist

- [x] Direct API access tested (works from Node.js)
- [x] Response structure documented
- [x] Data transformation implemented
- [ ] CORS testing in browser (may need proxy)
- [ ] Error handling for API failures
- [ ] Rate limiting implementation
- [ ] Caching strategy


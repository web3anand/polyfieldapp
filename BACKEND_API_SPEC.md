# Backend API Specification

## Overview

Your backend should proxy all Polymarket API requests to avoid CORS issues. This document specifies the API endpoints your backend needs to implement.

## Required Backend Endpoints

### 1. GET /api/markets

**Description:** Get list of active markets from Polymarket

**Query Parameters:**
- `limit` (number, optional): Number of markets to return (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)
- `sport` (string, optional): Filter by sport category
- `search` (string, optional): Search query

**Backend Implementation:**
```typescript
// Your backend should:
// 1. Receive request from frontend
// 2. Proxy to: https://gamma-api.polymarket.com/markets?limit={limit}&offset={offset}&active=true&closed=false
// 3. Transform Polymarket response to your Market format
// 4. Return to frontend

GET /api/markets
Response: {
  markets: Market[],
  hasMore: boolean,
  total: number
}
```

### 2. GET /api/markets/trending

**Description:** Get trending markets (sorted by liquidity)

**Query Parameters:**
- `count` (number, optional): Number of trending markets (default: 10)

**Backend Implementation:**
```typescript
// 1. Fetch markets from Polymarket
// 2. Sort by liquidity
// 3. Filter out settled markets
// 4. Return top N markets

GET /api/markets/trending
Response: {
  markets: Market[]
}
```

### 3. GET /api/markets/:id

**Description:** Get single market details

**Backend Implementation:**
```typescript
GET /api/markets/:id
Response: {
  market: Market,
  orderBook: OrderBook
}
```

### 4. GET /api/positions

**Description:** Get user's active positions

**Headers:**
- `Authorization: Bearer <token>` (if using auth)

**Backend Implementation:**
```typescript
// 1. Get user address from auth token
// 2. Query database for user's positions
// 3. Get current prices from Polymarket
// 4. Calculate P&L

GET /api/positions
Response: {
  positions: Position[]
}
```

### 5. POST /api/positions

**Description:** Place a new bet/position

**Body:**
```json
{
  "marketId": "string",
  "tokenId": "string",
  "side": "BUY" | "SELL",
  "amount": "string",
  "price": number
}
```

**Backend Implementation:**
```typescript
// 1. Validate request
// 2. Check user balance
// 3. Place order via Polymarket CLOB API
// 4. Save to database
// 5. Return transaction hash

POST /api/positions
Response: {
  success: boolean,
  transactionHash: string,
  positionId: string
}
```

### 6. GET /api/positions/closed

**Description:** Get user's closed positions

**Backend Implementation:**
```typescript
GET /api/positions/closed
Response: {
  positions: ClosedPosition[]
}
```

### 7. GET /api/transactions

**Description:** Get user's transaction history

**Backend Implementation:**
```typescript
GET /api/transactions
Response: {
  transactions: Transaction[]
}
```

### 8. GET /api/trades/history

**Description:** Get user's trade history

**Backend Implementation:**
```typescript
GET /api/trades/history
Response: {
  trades: Trade[]
}
```

## Polymarket API Endpoints to Proxy

### Gamma API (Market Data)
- `GET https://gamma-api.polymarket.com/markets` - List markets
- `GET https://gamma-api.polymarket.com/markets/:id` - Get market
- `GET https://gamma-api.polymarket.com/events` - Get events
- `GET https://gamma-api.polymarket.com/sports` - Get sports

### CLOB API (Trading)
- `GET https://clob.polymarket.com/book?token_id={tokenId}` - Get order book
- `POST https://clob.polymarket.com/orders` - Place order
- `GET https://clob.polymarket.com/orders` - Get user orders
- `DELETE https://clob.polymarket.com/orders/:id` - Cancel order

### Data API
- `GET https://data-api.polymarket.com/...` - Various data endpoints

## CORS Headers

Your backend should set these headers when proxying:

```typescript
res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

## Authentication

If using authentication, your backend should:
1. Validate JWT tokens
2. Extract user address from token
3. Use user address for database queries

## Example Backend Proxy (Node.js/Express)

```typescript
// Example: /api/markets endpoint
app.get('/api/markets', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    // Proxy to Polymarket
    const response = await fetch(
      `https://gamma-api.polymarket.com/markets?limit=${limit}&offset=${offset}&active=true&closed=false`
    );
    
    const data = await response.json();
    
    // Transform to your format
    const markets = data.map(transformMarket);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ markets, hasMore: data.length === limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Rate Limiting

Polymarket has rate limits. Your backend should:
- Implement rate limiting
- Cache responses when possible
- Use exponential backoff for retries

## References

- [Polymarket API Docs](https://docs.polymarket.com/)
- [CLOB API](https://docs.polymarket.com/clob/)
- [Gamma API](https://docs.polymarket.com/gamma/)


# Polymarket Integration Guide

Based on [Polymarket Documentation](https://docs.polymarket.com/quickstart/introduction/main)

## 🔑 Key Understanding

### CORS Restriction
**Polymarket API has CORS restrictions** - direct browser calls will fail. You **MUST** use a backend proxy.

### Solution Architecture
```
Frontend (React) 
    ↓
Backend Proxy (Your Server)
    ↓
Polymarket API (gamma-api.polymarket.com)
```

## 📚 Polymarket API Structure

### 1. Gamma API (Market Data)
**Base URL:** `https://gamma-api.polymarket.com`

**Endpoints:**
- `GET /markets` - List all markets
- `GET /markets/:id` - Get market details
- `GET /events` - Get events
- `GET /sports` - Get sports categories

**Response Format:**
```json
[
  {
    "id": "string",
    "question": "string",
    "conditionId": "string",
    "tokenId": "string",
    "liquidity": number,
    "outcomes": [
      { "price": 0.68, "side": "YES" },
      { "price": 0.32, "side": "NO" }
    ],
    "category": "string",
    "endDate": "ISO string"
  }
]
```

### 2. CLOB API (Trading)
**Base URL:** `https://clob.polymarket.com`

**Endpoints:**
- `GET /book?token_id={tokenId}` - Get order book
- `POST /orders` - Place order
- `GET /orders` - Get user orders
- `DELETE /orders/:id` - Cancel order

**Authentication:** Required (API key or wallet signature)

### 3. WebSocket (Real-time)
**Base URL:** `wss://ws-subscriptions-clob.polymarket.com/ws`

**Channels:**
- `market:{conditionId}` - Market price updates
- `user:{address}` - User order updates

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

## 🔐 Authentication

### For CLOB API (Trading)
1. **API Key** - Get from Polymarket Builder Program
2. **Wallet Signature** - Sign message with wallet

### For Gamma API (Market Data)
- **Public endpoints** - No authentication needed
- **CORS restrictions** - Requires backend proxy

## 📋 Backend Implementation Requirements

Your backend must implement these proxy endpoints:

### 1. Markets Proxy
```typescript
// Backend: GET /api/markets
app.get('/api/markets', async (req, res) => {
  const { limit, offset } = req.query;
  
  // Proxy to Polymarket
  const response = await fetch(
    `https://gamma-api.polymarket.com/markets?limit=${limit}&offset=${offset}&active=true`
  );
  
  const data = await response.json();
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ markets: data });
});
```

### 2. Trading Proxy (with Auth)
```typescript
// Backend: POST /api/orders
app.post('/api/orders', authenticate, async (req, res) => {
  const { tokenId, side, amount, price } = req.body;
  const userAddress = req.user.address;
  
  // Use Polymarket CLOB client
  const client = new ClobClient({ apiKey: process.env.POLYMARKET_API_KEY });
  
  const order = await client.createOrder({
    tokenId,
    side,
    size: amount,
    price,
    userAddress
  });
  
  res.json({ success: true, orderId: order.id });
});
```

## 🎯 Integration Steps

### Step 1: Install Polymarket SDK (Backend)
```bash
npm install @polymarket/clob-client
```

### Step 2: Set Up Backend Proxy
- Create Express/FastAPI server
- Implement proxy endpoints (see BACKEND_API_SPEC.md)
- Set CORS headers
- Handle authentication

### Step 3: Configure Frontend
- Update `VITE_API_BASE_URL` to your backend URL
- Frontend will automatically use proxy

### Step 4: Test Integration
- Backend proxies requests
- Frontend receives data
- No CORS errors

## 📖 Resources

- [Polymarket Docs](https://docs.polymarket.com/)
- [CLOB Client (TypeScript)](https://github.com/Polymarket/clob-client)
- [CLOB Client (Python)](https://github.com/Polymarket/py-clob-client)
- [Builder Program](https://docs.polymarket.com/builders/introduction)
- [API Status](https://status.polymarket.com/)

## ⚠️ Important Notes

1. **CORS is Required**: All Polymarket API calls must go through backend
2. **API Keys**: Required for trading operations (CLOB API)
3. **Rate Limits**: Polymarket has rate limits - implement caching
4. **WebSocket**: Use for real-time updates (also requires backend proxy for auth)

## 🚀 Quick Start

1. **Backend Setup:**
   ```bash
   # Install SDK
   npm install @polymarket/clob-client
   
   # Create proxy endpoints
   # See BACKEND_API_SPEC.md for details
   ```

2. **Frontend Setup:**
   ```bash
   # Already done! Just update .env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Test:**
   - Start backend server
   - Frontend will automatically use proxy
   - Markets will load!


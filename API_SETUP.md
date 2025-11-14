# API Setup - Vercel Serverless Functions

## Overview

This app now includes Vercel serverless functions to handle backend API requests. These functions proxy the Polymarket API to avoid CORS issues and provide placeholder endpoints for user-specific data.

## Created API Endpoints

### 1. **GET /api/** (Health Check)
- **File**: `api/index.ts`
- **Purpose**: API status and available endpoints
- **Response**: 
  ```json
  {
    "status": "ok",
    "message": "PolyField API is running",
    "version": "1.0.0",
    "endpoints": { ... }
  }
  ```

### 2. **GET /api/markets** (Polymarket Proxy)
- **File**: `api/markets.ts`
- **Purpose**: Fetches markets from Polymarket API
- **Query Params**: 
  - `limit` (default: 100)
  - `offset` (default: 0)
- **Response**: Polymarket markets data (proxied)
- **Status**: ✅ **FULLY FUNCTIONAL** - Proxies real Polymarket data

### 3. **GET /api/positions** (User Positions)
- **File**: `api/positions.ts`
- **Purpose**: Returns user's open positions
- **Response**: Empty array (placeholder)
- **Status**: 🚧 **PLACEHOLDER** - Returns empty data (requires auth)

### 4. **GET /api/positions/closed** (Closed Positions)
- **File**: `api/positions/closed.ts`
- **Purpose**: Returns user's closed positions
- **Response**: Empty array (placeholder)
- **Status**: 🚧 **PLACEHOLDER** - Returns empty data (requires auth)

### 5. **GET /api/trades/history** (Trade History)
- **File**: `api/trades/history.ts`
- **Purpose**: Returns user's trade history
- **Response**: Empty array (placeholder)
- **Status**: 🚧 **PLACEHOLDER** - Returns empty data (requires auth)

### 6. **GET /api/transactions** (Transactions)
- **File**: `api/transactions.ts`
- **Purpose**: Returns user transactions
- **Response**: Empty array (placeholder)
- **Status**: 🚧 **PLACEHOLDER** - Returns empty data (requires auth)

## Deployment

### Vercel Configuration

The `vercel.json` has been updated with:

1. **API Rewrites**: Routes `/api/*` to serverless functions
2. **CORS Headers**: Allows cross-origin requests
3. **Build Configuration**: Builds both frontend and API

### Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel --prod
```

Vercel will automatically:
- Build the frontend (`npm run build`)
- Deploy the `dist` folder
- Deploy API functions from the `api` folder
- Configure routes and headers from `vercel.json`

## Testing API Endpoints

After deployment, test the endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/

# Fetch markets
curl https://your-app.vercel.app/api/markets?limit=10

# Check positions (will return empty for now)
curl https://your-app.vercel.app/api/positions
```

## How It Works

### Frontend → API Flow

1. **Frontend calls** `/api/markets`
2. **Vercel routes** to `api/markets.ts` serverless function
3. **Function proxies** request to `https://gamma-api.polymarket.com/markets`
4. **Returns data** to frontend (with CORS headers)

### Benefits

✅ **No CORS issues** - Backend proxy bypasses browser CORS restrictions
✅ **Serverless** - No server maintenance, scales automatically
✅ **Fast** - Edge functions deploy globally
✅ **Secure** - Can add authentication before proxying

## Next Steps (User Data Endpoints)

The placeholder endpoints (`positions`, `trades`, `transactions`) need to be implemented with:

1. **Authentication**: Verify user's wallet/Privy session
2. **Database**: Store user positions and trades
3. **Polymarket Integration**: Fetch real user data from Polymarket API with auth

For now, they return empty arrays so the app doesn't crash.

## Error Handling

All endpoints include:
- ✅ CORS headers
- ✅ Error responses with messages
- ✅ 404/405 status codes for invalid requests
- ✅ Logging for debugging

## File Structure

```
/workspace/
├── api/                      # Vercel serverless functions
│   ├── index.ts             # Health check
│   ├── markets.ts           # Markets proxy (WORKING)
│   ├── positions.ts         # Positions (placeholder)
│   ├── transactions.ts      # Transactions (placeholder)
│   ├── positions/
│   │   └── closed.ts        # Closed positions (placeholder)
│   └── trades/
│       └── history.ts       # Trade history (placeholder)
├── dist/                    # Built frontend
├── src/                     # Frontend source
└── vercel.json              # Vercel configuration
```

## Summary

✅ **Fixed 404 errors** - Created all missing API endpoints
✅ **Markets endpoint working** - Proxies real Polymarket data  
🚧 **User endpoints stubbed** - Return empty data (ready for implementation)
✅ **Ready to deploy** - Just push to Vercel!

The 404 errors will be gone once deployed to Vercel! 🚀

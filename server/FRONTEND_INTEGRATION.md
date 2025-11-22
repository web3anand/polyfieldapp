# Frontend Integration Guide

How to connect your frontend to the backend server.

## 🔧 Frontend Configuration

### 1. Update Environment Variables

In your frontend `.env` file:

```env
# Development (local backend)
VITE_API_BASE_URL=http://localhost:3000

# Production (VPS backend)
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. Update clobApi.ts

The frontend `src/services/clobApi.ts` already supports backend proxy. Make sure it's configured correctly:

```typescript
// In clobApi.ts, it should use:
const { env } = await import('../config/env');

// Backend proxy URL
if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
  // Use backend proxy
  const response = await fetch(
    `${env.apiBaseUrl}/api/clob/book?token_id=${tokenId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
```

### 3. Authentication Headers

When making authenticated requests, the frontend should send headers like:

```typescript
// L2 Authentication
headers: {
  'Content-Type': 'application/json',
  'poly-api-key': apiKey,
  'poly-passphrase': passphrase,
  'poly-signature': signature,
}

// L1 Authentication
headers: {
  'Content-Type': 'application/json',
  'poly-address': address,
  'poly-signature': signature,
  'poly-timestamp': timestamp,
  'poly-nonce': nonce,
}
```

## 📡 API Endpoints

### Market Data (No Auth Required)

```typescript
// Get markets
GET ${VITE_API_BASE_URL}/api/clob/markets
GET ${VITE_API_BASE_URL}/api/clob/markets?condition_id=xxx

// Get order book
GET ${VITE_API_BASE_URL}/api/clob/book?token_id=xxx

// Get trades
GET ${VITE_API_BASE_URL}/api/clob/trades?token_id=xxx&limit=100
```

### Trading (Auth Required)

```typescript
// Place order
POST ${VITE_API_BASE_URL}/api/clob/orders
Headers: { poly-api-key, poly-passphrase, poly-signature }
Body: { tokenId, side, size, price, orderType, ... }

// Cancel order
DELETE ${VITE_API_BASE_URL}/api/clob/orders/:orderId
Headers: { poly-api-key, poly-passphrase, poly-signature }

// Get user orders
GET ${VITE_API_BASE_URL}/api/clob/orders?user=0x...
Headers: { poly-api-key, poly-passphrase, poly-signature }
```

### User Data (Auth Required)

```typescript
// Get holdings
GET ${VITE_API_BASE_URL}/api/data/holdings?user=0x...
Headers: { poly-api-key, poly-passphrase, poly-signature }
```

## ✅ Testing

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

### 2. Test CLOB API Connection

```bash
curl http://localhost:3000/health/clob
```

### 3. Test Markets Endpoint

```bash
curl http://localhost:3000/api/clob/markets
```

## 🔒 CORS Configuration

Make sure your backend `.env` includes your frontend URL:

```env
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

## 🐛 Troubleshooting

### CORS Errors

- Check `ALLOWED_ORIGINS` in backend `.env`
- Verify frontend URL matches exactly (including http/https)
- Check browser console for specific CORS error

### 404 Errors

- Verify `VITE_API_BASE_URL` is set correctly
- Check backend is running on correct port
- Test with `curl` first

### Authentication Errors

- Verify auth headers are being sent
- Check header names match exactly (case-sensitive)
- Test with Postman/curl first


# WebSocket Authentication Setup ✅

## Overview

The WebSocket now automatically uses your Builder API credentials when available.

## How It Works

### 1. Authentication Flow

```
User logs in with Privy
    ↓
useWebSocketAuth hook detects authentication
    ↓
Retrieves Builder credentials from env vars
    ↓
Sets WebSocket authentication
    ↓
WebSocket reconnects with auth headers
    ↓
Real-time price updates! 🎉
```

### 2. Builder Credentials

Add to `.env`:
```bash
VITE_BUILDER_API_KEY=your_api_key_here
VITE_BUILDER_SECRET=your_secret_here
VITE_BUILDER_PASSPHRASE=your_passphrase_here
```

**Get credentials at:** https://polymarket.com/settings?tab=builder

### 3. Graceful Degradation

**Without Credentials:**
- WebSocket attempts connection
- Server rejects (code 1006)
- App stops retry attempts
- Prices show from initial HTTP fetch
- App still fully functional!

**With Credentials:**
- WebSocket connects with auth
- Real-time price updates
- Full live functionality

## Files Changed

1. **`client/src/lib/polymarketWebSocket.ts`**
   - Updated auth format to match Polymarket API
   - Added graceful failure handling
   - Reduced console spam

2. **`client/src/hooks/useWebSocketAuth.ts`** (NEW)
   - Automatically sets up WebSocket auth
   - Triggers when user authenticates

3. **`client/src/components/AppWithAuth.tsx`**
   - Integrated `useWebSocketAuth` hook
   - Runs on component mount

## Testing

### Without Builder Credentials
```bash
# Start app without .env
npm run dev
```

**Expected:**
```
✅ Polymarket WebSocket connected
ℹ️ WebSocket connection error. This is expected if authentication is required.
🔌 WebSocket closed. Code: 1006, Reason: none
ℹ️ WebSocket connection rejected. Likely requires authentication.
   App will continue to work without real-time updates.
```

### With Builder Credentials
```bash
# Add to .env
VITE_BUILDER_API_KEY=your_key
VITE_BUILDER_SECRET=your_secret
VITE_BUILDER_PASSPHRASE=your_passphrase

# Start app
npm run dev
```

**Expected:**
```
✅ Polymarket WebSocket connected
🔐 Setting up WebSocket authentication...
📡 Sending authenticated subscription...
📨 WebSocket message: { event_type: "book", ... }
```

## Console Messages Explained

| Message | Meaning |
|---------|---------|
| ✅ Polymarket WebSocket connected | WebSocket handshake successful |
| 🔐 Setting up WebSocket authentication... | Found Builder credentials, applying to WebSocket |
| 📡 Sending authenticated subscription... | Subscribing to markets with auth |
| 📨 WebSocket message: ... | Receiving real-time data |
| 🔌 WebSocket closed. Code: 1006 | Connection rejected (likely needs auth) |
| ℹ️ App will continue to work... | Graceful degradation active |

## Architecture

### WebSocket Singleton
```typescript
// lib/polymarketWebSocket.ts
export const polymarketWS = new PolymarketWebSocket();
```

One WebSocket instance shared across entire app.

### Authentication Hook
```typescript
// hooks/useWebSocketAuth.ts
export function useWebSocketAuth() {
  const { authenticated, address } = useWallet();
  
  useEffect(() => {
    if (authenticated && address) {
      const credentials = getBuilderCredentials();
      if (credentials) {
        polymarketWS.setAuth(
          credentials.apiKey,
          credentials.secret,
          credentials.passphrase
        );
      }
    }
  }, [authenticated, address]);
}
```

### Integration
```typescript
// components/AppWithAuth.tsx
function AppWithPrivy() {
  useWebSocketAuth();  // ✅ Auto-setup on mount
  // ... rest of component
}
```

## Troubleshooting

### WebSocket keeps failing
**Cause:** No Builder credentials configured

**Solution:** 
1. Get credentials: https://polymarket.com/settings?tab=builder
2. Add to `.env`
3. Restart dev server

### Real-time updates not working
**Check:**
1. Is WebSocket connected? Check console for ✅
2. Are credentials valid? Check Builder dashboard
3. Is user authenticated? Check Privy state

### Console spam
**Fixed!** WebSocket now:
- ✅ Logs once per error type
- ✅ Stops retrying without auth
- ✅ Clear, helpful messages

## Next Steps

### Get Builder Credentials
1. Go to https://polymarket.com/settings?tab=builder
2. Click "Generate API Key"
3. Save credentials securely
4. Add to `.env`
5. Restart app

### Verify Real-time Updates
1. Open two browser windows side by side
2. Watch same market in both
3. Prices should update simultaneously
4. Look for 📨 WebSocket message logs

---

**Status:** WebSocket authentication fully integrated! 🎉

App works without credentials (initial prices) and adds real-time updates when credentials are provided.

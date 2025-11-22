# 🚀 Deployment & Testing Checklist

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Copy `.env.example` to `.env` in mobile folder
- [ ] Add Privy App ID to `EXPO_PUBLIC_PRIVY_APP_ID`
- [ ] Add Privy Client ID to `EXPO_PUBLIC_PRIVY_CLIENT_ID`
- [ ] Verify Etherscan API key: `6BCHGFTTXTE7ESGQ6JQWAAGVMBFKGZSKD2`
- [ ] Confirm Polygon chain ID: `137`
- [ ] Confirm USDC address: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

### Mobile App
- [ ] Run `cd mobile && npm install`
- [ ] Run `npm start` to start Expo
- [ ] Scan QR code with Expo Go app
- [ ] App loads without errors

### Backend (Optional - for production)
- [ ] Deploy to Vercel: `vercel deploy`
- [ ] Note your Vercel URL
- [ ] Update mobile `.env` with `EXPO_PUBLIC_API_BASE_URL=https://your-app.vercel.app`
- [ ] Test backend endpoint: `curl https://your-app.vercel.app/api/orders`

---

## ✅ Testing Checklist

### 1. Authentication
- [ ] Open app
- [ ] Click "Login"
- [ ] Login with Email works
- [ ] Login with Google works (if enabled)
- [ ] Login with Twitter works (if enabled)
- [ ] Embedded wallet created automatically
- [ ] Can see wallet address in Profile

### 2. Balance Fetching
- [ ] Navigate to any market
- [ ] Click "Buy YES" or "Buy NO"
- [ ] BetScreen opens
- [ ] Balance section shows "Available Balance: $X.XX USDC"
- [ ] Balance is not "$0.00" (if you have USDC)
- [ ] Loading indicator appears briefly while fetching

### 3. Balance Validation
- [ ] Enter amount larger than balance
- [ ] Click "Place Order"
- [ ] See "Insufficient Balance" error
- [ ] Error toast shows correct amounts
- [ ] Button re-enables after error

### 4. Order Placement (Test Order)
- [ ] Enter small amount (e.g., $1)
- [ ] Ensure amount is less than balance
- [ ] Click "Place Order"
- [ ] Button shows "Placing Order..." with spinner
- [ ] Button is disabled during placement
- [ ] After ~2-5 seconds:
  - [ ] Success toast appears "Order Placed! 🎉"
  - [ ] Automatically navigates back to markets
  - [ ] No errors in console

### 5. Error Handling
- [ ] Turn off internet
- [ ] Try to place order
- [ ] See "Order Failed" error
- [ ] Turn internet back on
- [ ] Order works again

### 6. Edge Cases
- [ ] Enter $0 amount
- [ ] See "Invalid Amount" error
- [ ] Enter negative amount
- [ ] See validation error
- [ ] Enter amount with letters
- [ ] Handled gracefully

---

## 🔍 API Testing

### Etherscan API

Test balance fetching:
```bash
curl "https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&address=0xYOUR_ADDRESS&tag=latest&apikey=6BCHGFTTXTE7ESGQ6JQWAAGVMBFKGZSKD2"
```

Expected response:
```json
{
  "status": "1",
  "message": "OK",
  "result": "1000000"
}
```

### Polymarket CLOB API

Test order book:
```bash
curl "https://clob.polymarket.com/book?token_id=YOUR_TOKEN_ID"
```

Expected response:
```json
{
  "asset_id": "...",
  "bids": [...],
  "asks": [...],
  "timestamp": 1234567890
}
```

### Your Backend API

Test orders endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "123456",
    "side": "BUY",
    "size": "10",
    "price": 0.68,
    "userAddress": "0xYOUR_ADDRESS"
  }'
```

Expected response:
```json
{
  "success": true,
  "order": {...}
}
```

---

## 🐛 Troubleshooting

### Balance Shows $0.00

**Causes:**
- No USDC in wallet
- Wrong wallet address
- API key invalid
- Network error

**Solutions:**
1. Check wallet on Polygonscan
2. Verify Etherscan API key
3. Check network connection
4. Look for console errors

**Test:**
```typescript
import { getUSDCBalance } from './src/services/etherscan';
const balance = await getUSDCBalance('0xYOUR_ADDRESS');
console.log('Balance:', balance);
```

### "Wallet Provider Not Available"

**Causes:**
- Not logged in
- Privy not initialized
- Embedded wallet not created

**Solutions:**
1. Ensure user logged in
2. Check Privy configuration
3. Restart app
4. Check console for Privy errors

### "Failed to Place Order"

**Causes:**
- Backend not deployed
- Wrong API URL
- Network error
- Invalid parameters

**Solutions:**
1. Check `EXPO_PUBLIC_API_BASE_URL` in .env
2. Test backend URL in browser
3. Check Vercel logs
4. Verify order parameters

**Debug:**
```typescript
console.log('API URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
console.log('Order params:', orderParams);
```

### Order Stuck "Placing Order..."

**Causes:**
- Network timeout
- Backend error
- CLOB API down

**Solutions:**
1. Check network connection
2. Check backend logs
3. Try again in 30 seconds
4. Check Polymarket status

---

## 📊 Performance Verification

### Expected Timings
- Balance fetch: ~1-2 seconds
- Order placement: ~3-5 seconds
- API response: ~500ms-1s
- WebSocket price updates: Real-time

### Check Performance
- [ ] Balance loads within 2 seconds
- [ ] No lag when typing amount
- [ ] Order submits within 5 seconds
- [ ] No memory leaks (check with React DevTools)
- [ ] Smooth animations

---

## 🔒 Security Verification

### API Keys
- [ ] No API keys in source code
- [ ] All keys in .env file
- [ ] .env file in .gitignore
- [ ] .env never committed to git

### Wallet Security
- [ ] Private keys managed by Privy
- [ ] No private keys in app code
- [ ] Wallet backup enabled (iCloud/Google Drive)
- [ ] Recovery tested

### Network Security
- [ ] All API calls use HTTPS
- [ ] No HTTP endpoints
- [ ] CORS configured correctly
- [ ] API endpoints validated

---

## 📱 Device Testing

### iOS
- [ ] Test on iPhone (iOS 14+)
- [ ] Test with camera (QR code)
- [ ] Test with Expo Go app
- [ ] Test iCloud wallet backup

### Android
- [ ] Test on Android device (Android 8+)
- [ ] Test with Expo Go app
- [ ] Test Google Drive wallet backup

### Both Platforms
- [ ] Portrait mode works
- [ ] Landscape mode works (if supported)
- [ ] Keyboard doesn't hide inputs
- [ ] Touch targets are large enough
- [ ] No UI elements cut off

---

## 🚀 Production Deployment

### Pre-Production
- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Environment variables set
- [ ] Backend deployed

### Build App
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

### Post-Deployment
- [ ] Test on production backend
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Gather user feedback
- [ ] Monitor transaction success rate

---

## 📈 Monitoring & Analytics

### What to Monitor
- [ ] Order success rate
- [ ] Balance fetch errors
- [ ] API response times
- [ ] User session duration
- [ ] Crash rate

### Tools to Use
- [ ] Sentry for error tracking
- [ ] Google Analytics for usage
- [ ] Vercel Analytics for backend
- [ ] Console for debugging

---

## 🎯 Success Criteria

Your implementation is successful when:

1. ✅ **Balance shows correctly**
   - Real USDC from blockchain
   - Updates on mount
   - Shows within 2 seconds

2. ✅ **Orders place successfully**
   - Button shows loading state
   - Success toast appears
   - Navigation works
   - No errors in console

3. ✅ **Error handling works**
   - Insufficient balance caught
   - Network errors handled
   - User-friendly messages
   - App doesn't crash

4. ✅ **Security is maintained**
   - No API keys exposed
   - Wallet keys secure
   - HTTPS only
   - Validation working

5. ✅ **UX is polished**
   - Loading states clear
   - Feedback immediate
   - No confusion
   - Smooth transitions

---

## ✨ Final Checklist

- [ ] All code compiles without errors
- [ ] All tests passing
- [ ] Documentation complete
- [ ] .env configured
- [ ] Backend deployed (if needed)
- [ ] App tested on device
- [ ] Ready for users! 🎉

---

## 🎊 Congratulations!

If all items are checked, your Polymarket trading app is **PRODUCTION READY**! 🚀

**You can now trade on Polymarket with real USDC!**

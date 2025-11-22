# API Reference - Quick Guide

## Environment Variables

```bash
# Etherscan (Polygonscan) API
EXPO_PUBLIC_ETHERSCAN_API_KEY=6BCHGFTTXTE7ESGQ6JQWAAGVMBFKGZSKD2

# Polygon Configuration
EXPO_PUBLIC_CHAIN_ID=137
EXPO_PUBLIC_CHAIN_NAME=Polygon
EXPO_PUBLIC_USDC_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174

# Polymarket
EXPO_PUBLIC_POLYMARKET_CLOB_URL=https://clob.polymarket.com
EXPO_PUBLIC_POLYMARKET_DATA_URL=https://data-api.polymarket.com
```

## Etherscan API (Polygonscan)

### Get USDC Balance
```typescript
import { getUSDCBalance } from './services/etherscan';

const balance = await getUSDCBalance('0xYourAddress');
console.log(balance.formatted); // "123.45"
```

### Get MATIC Balance
```typescript
import { getMaticBalance } from './services/etherscan';

const balance = await getMaticBalance('0xYourAddress');
console.log(balance); // "2.5000"
```

### Check if Enough USDC
```typescript
import { hasEnoughUSDC } from './services/etherscan';

const check = await hasEnoughUSDC('0xYourAddress', 50);
console.log(check.sufficient); // true/false
console.log(check.balance); // "100.00"
console.log(check.required); // "50.00"
```

### Get Transaction History
```typescript
import { getTransactionHistory } from './services/etherscan';

const txs = await getTransactionHistory('0xYourAddress', 10);
// Returns array of transactions
```

### Get Token Transfers
```typescript
import { getTokenTransfers } from './services/etherscan';

const transfers = await getTokenTransfers('0xYourAddress');
// Returns USDC transfer history
```

## Polymarket Trading API

### Place Order
```typescript
import { placeOrder } from './services/polymarketTrading';

const result = await placeOrder({
  tokenId: '123456',
  side: 'BUY', // or 'SELL'
  size: '10', // Amount in USDC
  price: 0.68, // Price (0-1)
  userAddress: '0xYourAddress',
}, privateKey);

if (result.success) {
  console.log('Order ID:', result.orderId);
}
```

### Get Order Book
```typescript
import { getOrderBook } from './services/polymarketTrading';

const book = await getOrderBook('tokenId');
console.log('Bids:', book.bids);
console.log('Asks:', book.asks);
```

### Get Best Price
```typescript
import { getBestPrice } from './services/polymarketTrading';

const price = await getBestPrice('tokenId', 'BUY');
console.log('Best buy price:', price);
```

### Get User Orders
```typescript
import { getUserOrders } from './services/polymarketTrading';

const orders = await getUserOrders('0xYourAddress');
// Returns array of open orders
```

### Cancel Order
```typescript
import { cancelOrder } from './services/polymarketTrading';

const result = await cancelOrder('orderId', '0xYourAddress');
if (result.success) {
  console.log('Order cancelled');
}
```

## Backend API Endpoint

### POST /api/orders

**Request:**
```json
{
  "tokenId": "123456",
  "side": "BUY",
  "size": "10",
  "price": 0.68,
  "userAddress": "0x..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "orderId": "abc123",
  "transactionHash": "0x...",
  "status": "submitted"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Insufficient balance"
}
```

## Usage in BetScreen

```typescript
// 1. Get user's wallet
const wallet = user?.linked_accounts?.find(
  (a) => a.type === 'wallet' && 'wallet_client_type' in a && a.wallet_client_type === 'privy'
);

// 2. Check balance
const balanceCheck = await hasEnoughUSDC(wallet.address, parseFloat(amount));
if (!balanceCheck.sufficient) {
  toast.error('Insufficient Balance');
  return;
}

// 3. Place order
const response = await fetch(`${API_BASE_URL}/api/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenId: market.yesTokenId,
    side: 'BUY',
    size: amount,
    price: effectivePrice,
    userAddress: wallet.address,
  }),
});

// 4. Handle response
const result = await response.json();
if (result.success) {
  toast.success('Order Placed!');
}
```

## Polygon Network Details

- **Chain ID**: 137
- **Currency**: MATIC
- **RPC URL**: https://polygon-rpc.com
- **Explorer**: https://polygonscan.com
- **USDC Contract**: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
- **USDC Decimals**: 6

## Rate Limits

### Etherscan (Polygonscan)
- **Free Tier**: 5 calls/second
- **Standard**: 100,000 calls/day
- **Key**: 6BCHGFTTXTE7ESGQ6JQWAAGVMBFKGZSKD2

### Polymarket CLOB
- **Public endpoints**: Unlimited
- **Authenticated endpoints**: Rate limited per API key

## Error Codes

### Etherscan
- `status: "0"` - Error occurred
- `status: "1"` - Success

### Polymarket
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid signature)
- `429` - Rate limit exceeded
- `500` - Server error

## Testing Checklist

- [ ] Balance fetching works
- [ ] Balance displays in BetScreen
- [ ] Order placement validates balance
- [ ] Order submission shows loading state
- [ ] Success toast appears
- [ ] Error handling works
- [ ] Backend API responds
- [ ] Transaction confirms on-chain

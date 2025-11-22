# Order Placement Setup Guide

## Backend Server Configuration

The backend server now handles complete order placement with server-side signing. This is more secure than client-side signing as private keys never leave the server.

## Required Setup

### 1. Create a Trading Wallet

You need a Polygon wallet that the server will use to place orders:

```bash
# Option A: Create new wallet
# Use any wallet tool (MetaMask, ethers.js, etc.)
# Save the private key securely

# Option B: Use existing wallet
# Export private key from MetaMask or other wallet
```

### 2. Fund the Wallet

The wallet needs USDC on Polygon network:

- **Minimum**: $10 USDC (for testing)
- **Recommended**: $100+ USDC (for production)
- **Network**: Polygon (Chain ID: 137)
- **Token**: USDC (Native: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`)

**How to fund:**
1. Bridge USDC to Polygon using [Polygon Bridge](https://wallet.polygon.technology/bridge)
2. Or buy USDC directly on Polygon via exchanges
3. Send to your trading wallet address

### 3. Approve USDC Spending

The CTF Exchange contract needs approval to spend USDC:

**Contract Address**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`

**Using Ethers.js:**
```javascript
const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

const usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const ctfExchange = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

const erc20Abi = [
  'function approve(address spender, uint256 amount) returns (bool)'
];

const usdc = new ethers.Contract(usdcAddress, erc20Abi, wallet);
const amount = ethers.utils.parseUnits('1000000', 6); // Approve 1M USDC
await usdc.approve(ctfExchange, amount);
```

**Using Polygonscan:**
1. Go to [USDC Contract on Polygonscan](https://polygonscan.com/address/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359#writeContract)
2. Connect your wallet
3. Call `approve()` with:
   - `spender`: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
   - `amount`: `1000000000000` (1M USDC with 6 decimals)

### 4. Configure Environment Variables

**Local Development** (`server/.env`):
```bash
POLYMARKET_PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
```

**Production VPS** (`server/.env.production`):
```bash
POLYMARKET_PRIVATE_KEY=your_wallet_private_key_without_0x_prefix

# Optional: L2 API credentials for better rate limits
POLYMARKET_API_KEY=your_api_key
POLYMARKET_SECRET=your_secret
POLYMARKET_PASSPHRASE=your_passphrase
```

⚠️ **SECURITY WARNING**: Never commit private keys to git! Ensure `.env` files are in `.gitignore`.

### 5. Deploy to VPS

**Option A: Manual Deployment**
```bash
# SSH to VPS
ssh user@207.246.126.234

# Navigate to server directory
cd ~/polyfield/server

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build TypeScript
npm run build

# Update environment variables
nano .env.production
# Add POLYMARKET_PRIVATE_KEY

# Restart with PM2
pm2 restart ecosystem.config.js
```

**Option B: Automated Script**
```bash
# From your local machine
cd server
./deploy-vps.sh
```

## Testing Order Placement

### 1. Check Server Status

```bash
curl http://207.246.126.234:3000/health
```

### 2. Test Order Endpoint

```bash
curl -X POST http://207.246.126.234:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "769236939244...",
    "side": "BUY",
    "size": "1.0",
    "price": 0.52,
    "userAddress": "0x1877575e745cf9bCc42BFb34192b0cC5fCC22296"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": "0x123...",
  "message": "Order placed successfully",
  "txHash": "0xabc..."
}
```

### 3. Test from Mobile App

1. Ensure mobile app `.env.local` has correct API URL:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://207.246.126.234:3000
   ```

2. Restart mobile app:
   ```bash
   cd mobile
   npx expo start --clear
   ```

3. Place a test order in the app

## How It Works

### Order Flow

1. **Mobile App** → Sends order parameters to backend
2. **Backend Server** → Creates unsigned order object
3. **Backend Server** → Signs order with private key (EIP-712)
4. **Backend Server** → Submits signed order to Polymarket CLOB API
5. **Backend Server** → Returns order ID and transaction hash
6. **Mobile App** → Saves trade to Supabase database

### Security

- Private key stored only on backend server
- Never transmitted to mobile app or client
- EIP-712 signature ensures order integrity
- L2 API authentication (optional) for better rate limits

## Troubleshooting

### "Server not configured for trading"
- Private key not set in `.env` file
- Solution: Add `POLYMARKET_PRIVATE_KEY` to server environment

### "Insufficient balance"
- Trading wallet doesn't have enough USDC
- Solution: Fund wallet with USDC on Polygon

### "Approval required"
- USDC spending not approved for CTF Exchange
- Solution: Approve USDC spending (see step 3 above)

### "Invalid signature"
- Private key format incorrect
- Solution: Ensure private key is without `0x` prefix

### "Rate limited"
- Too many requests without L2 API credentials
- Solution: Add optional API credentials to `.env`

## Next Steps

1. ✅ Configure trading wallet
2. ✅ Fund with USDC
3. ✅ Approve USDC spending
4. ✅ Add private key to server
5. ✅ Deploy to VPS
6. ✅ Test order placement
7. ✅ Monitor orders in Polymarket UI

## Additional Resources

- [Polymarket API Docs](https://docs.polymarket.com/)
- [CLOB API Reference](https://docs.polymarket.com/api/clob)
- [Polygon Bridge](https://wallet.polygon.technology/bridge)
- [Polygonscan](https://polygonscan.com/)

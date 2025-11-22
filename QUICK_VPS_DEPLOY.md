# Quick VPS Deployment Guide

## Step 1: Push Code to GitHub

```powershell
# From your local machine
cd "c:\new poly app"

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Add order placement API with server-side signing"

# Push to GitHub
git push origin main
```

## Step 2: Deploy to VPS

```bash
# SSH into your VPS
ssh user@207.246.126.234

# Navigate to project
cd ~/polyfieldapp

# Pull latest code
git pull origin main

# Install new dependencies
cd server
npm install

# Build TypeScript
npm run build

# Update environment file
nano .env
```

## Step 3: Configure Environment on VPS

Add to `/root/polyfieldapp/server/.env`:

```bash
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=*

CLOB_API_URL=https://clob.polymarket.com
GAMMA_API_URL=https://gamma-api.polymarket.com

# CRITICAL: Add your trading wallet private key
POLYMARKET_PRIVATE_KEY=your_wallet_private_key_here

# Your existing API credentials (optional but helpful)
POLYMARKET_API_KEY=019a5422-b3c5-7314-97ef-20364f6312b2
POLYMARKET_SECRET=0PAmQZLyDSXoAHDn_ZkNKDZ8h-Bs4wyTARVSuDsTlEM=
POLYMARKET_PASSPHRASE=8eb7fea96133db4a25539e08df35e600895b5531e8bb91eff1aded18f5a267d0
```

**IMPORTANT:** You need to create a Polygon wallet and add its private key!

## Step 4: Restart Server

```bash
# Restart PM2
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs --lines 50
```

## Step 5: Test

```bash
# Test health endpoint
curl http://207.246.126.234:3000/health

# Test orders endpoint (should return error about private key if not set)
curl -X POST http://207.246.126.234:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"tokenId":"test","side":"BUY","size":"1","price":0.5,"userAddress":"0x123"}'
```

## Quick Setup for Trading Wallet

### Option 1: Use MetaMask
1. Create new account in MetaMask
2. Switch to Polygon network
3. Export private key (Settings → Security & Privacy → Show Private Key)
4. Send $10+ USDC to this address
5. Approve USDC: https://polygonscan.com/address/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359#writeContract

### Option 2: Use ethers.js
```javascript
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

## If You Don't Have SSH Access

Alternative: **Use local server for testing**

```powershell
# Update mobile app to use local server
cd "c:\new poly app\mobile"
# Edit .env.local:
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.3:3000

# Restart mobile app
npx expo start --clear
```

Then test orders locally first before deploying to VPS.

## Troubleshooting

### "Not Found" Error
- VPS doesn't have updated code
- Solution: Deploy to VPS (steps above)

### "Server not configured for trading"
- Private key not set
- Solution: Add `POLYMARKET_PRIVATE_KEY` to VPS .env

### "Insufficient balance"
- Wallet has no USDC
- Solution: Send USDC to wallet address

### "Approval required"
- USDC not approved
- Solution: Approve USDC spending on Polygonscan

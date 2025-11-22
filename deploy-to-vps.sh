#!/bin/bash

# PolyField VPS Deployment Script
# This script will deploy the backend server to your VPS

set -e

echo "🚀 PolyField VPS Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VPS_HOST="207.246.126.234"
VPS_USER="linuxuser"
VPS_PASSWORD='M6]c@47MFZfqG)vy'
APP_DIR="/home/linuxuser/polyfield"
SERVER_DIR="$APP_DIR/server"

echo "📦 Step 1: Creating deployment package..."
cd server
npm run build

echo "📤 Step 2: Connecting to VPS and setting up..."

# SSH commands to run on VPS
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'

echo "🧹 Cleaning VPS (removing old files)..."
cd ~ || exit
rm -rf polyfield
rm -rf node_modules
rm -rf .npm
pm2 delete all || true
pm2 save --force

echo "📁 Creating directories..."
mkdir -p ~/polyfield/server

echo "✅ VPS cleaned and ready"

ENDSSH

echo "📤 Step 3: Uploading server files..."
cd ..
sshpass -p "$VPS_PASSWORD" scp -r -o StrictHostKeyChecking=no \
  server/package.json \
  server/package-lock.json \
  server/ecosystem.config.js \
  server/dist \
  server/src \
  $VPS_USER@$VPS_HOST:~/polyfield/server/

echo "⚙️ Step 4: Installing and starting services..."

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'

cd ~/polyfield/server

echo "📦 Installing Node.js dependencies..."
npm install --production

echo "🔧 Creating .env file..."
cat > .env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://polyfield.app,https://www.polyfield.app,exp://192.168.1.0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Polymarket CLOB API
CLOB_API_URL=https://clob.polymarket.com
GAMMA_API_URL=https://gamma-api.polymarket.com

# Optional: Add any API keys here
# POLYMARKET_API_KEY=your_key_here
EOF

echo "🚀 Starting server with PM2..."
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Server started!"
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "🔍 Server logs (last 20 lines):"
pm2 logs --lines 20 --nostream

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Server URL: http://$VPS_HOST:3000"
echo "🔍 Health Check: http://$VPS_HOST:3000/health"
echo ""
echo "📝 Useful Commands:"
echo "  View logs:    ssh $VPS_USER@$VPS_HOST 'pm2 logs'"
echo "  Restart:      ssh $VPS_USER@$VPS_HOST 'pm2 restart all'"
echo "  Stop:         ssh $VPS_USER@$VPS_HOST 'pm2 stop all'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#!/bin/bash

# ==========================================
# PolyField Trading App - VPS Deployment Script
# Ultra-fast setup for 24/7 backend server
# ==========================================

echo "🚀 PolyField VPS Deployment - Starting..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="polyfield-api"
DOMAIN="api.polyfield.com"  # Change this to your domain
GIT_REPO="https://github.com/web3anand/polyfieldapp.git"
NODE_VERSION="20"

# ==========================================
# Step 1: System Update
# ==========================================
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential

# ==========================================
# Step 2: Install Node.js 20
# ==========================================
echo -e "${BLUE}📦 Installing Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

echo -e "${GREEN}✅ Node.js installed:${NC}"
node --version
npm --version

# ==========================================
# Step 3: Install PM2 Process Manager
# ==========================================
echo -e "${BLUE}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# ==========================================
# Step 4: Clone Repository
# ==========================================
echo -e "${BLUE}📥 Cloning repository...${NC}"
cd ~
if [ -d "polyfieldapp" ]; then
  echo "Repository already exists, pulling latest changes..."
  cd polyfieldapp
  git pull origin main
else
  git clone $GIT_REPO
  cd polyfieldapp
fi

# ==========================================
# Step 5: Install Backend Dependencies
# ==========================================
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd server
npm install --production

# ==========================================
# Step 6: Environment Setup
# ==========================================
echo -e "${BLUE}⚙️  Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
  cat > .env << EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Origins
ALLOWED_ORIGINS=https://polyfield.app,https://www.polyfield.app

# Polymarket APIs
CLOB_API_URL=https://clob.polymarket.com
GAMMA_API_URL=https://gamma-api.polymarket.com

# Trading Credentials (REQUIRED for order placement)
# 1. Create Polygon wallet
# 2. Fund with USDC ($10+ recommended)
# 3. Approve USDC to CTF Exchange: 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E
# 4. Add private key below (without 0x prefix)
POLYMARKET_PRIVATE_KEY=

# Optional L2 API credentials (better rate limits)
POLYMARKET_API_KEY=
POLYMARKET_SECRET=
POLYMARKET_PASSPHRASE=
EOF
  echo -e "${YELLOW}⚠️  Created .env file - UPDATE WITH YOUR TRADING CREDENTIALS${NC}"
  echo -e "${YELLOW}   See ORDER_PLACEMENT_SETUP.md for detailed instructions${NC}"
  echo "Edit with: nano ~/polyfieldapp/server/.env"
else
  echo "✅ .env file already exists"
fi

# ==========================================
# Step 7: Build TypeScript
# ==========================================
echo -e "${BLUE}🔨 Building TypeScript...${NC}"
npm run build

# ==========================================
# Step 8: Start Server with PM2
# ==========================================
echo -e "${BLUE}🚀 Starting server with PM2...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save

# ==========================================
# Step 9: Setup PM2 Startup Script
# ==========================================
echo -e "${BLUE}⚙️  Configuring PM2 to start on boot...${NC}"
pm2 startup
echo -e "${YELLOW}⚠️  Run the command above if shown${NC}"

# ==========================================
# Step 10: Install Nginx
# ==========================================
echo -e "${BLUE}📦 Installing Nginx...${NC}"
sudo apt-get install -y nginx

# ==========================================
# Step 11: Configure Nginx Reverse Proxy
# ==========================================
echo -e "${BLUE}⚙️  Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Forward real IP
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
    }

    # Health check endpoint (no auth)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
echo -e "${BLUE}🧪 Testing Nginx configuration...${NC}"
sudo nginx -t

# Restart Nginx
echo -e "${BLUE}🔄 Restarting Nginx...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

# ==========================================
# Step 12: Install SSL Certificate
# ==========================================
echo -e "${BLUE}🔒 Installing SSL certificate...${NC}"
sudo apt-get install -y certbot python3-certbot-nginx

echo -e "${YELLOW}⚠️  To enable HTTPS, run:${NC}"
echo "sudo certbot --nginx -d $DOMAIN"
echo ""

# ==========================================
# Step 13: Setup Firewall
# ==========================================
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# ==========================================
# Step 14: Setup Log Rotation
# ==========================================
echo -e "${BLUE}📝 Setting up log rotation...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# ==========================================
# Step 15: Display Status
# ==========================================
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Server Status:${NC}"
pm2 status
echo ""
echo -e "${BLUE}Server URL:${NC} http://$DOMAIN"
echo -e "${BLUE}Health Check:${NC} http://$DOMAIN/health"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Setup trading wallet (REQUIRED for order placement)"
echo "   - See: ~/polyfieldapp/ORDER_PLACEMENT_SETUP.md"
echo "   - Fund wallet with USDC on Polygon"
echo "   - Approve USDC spending"
echo ""
echo "2. Update server/.env with trading credentials"
echo "   nano ~/polyfieldapp/server/.env"
echo "   Add: POLYMARKET_PRIVATE_KEY=your_key_here"
echo ""
echo "3. Restart server:"
echo "   pm2 restart all"
echo ""
echo "4. Enable HTTPS:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "5. Test API:"
echo "   curl http://$DOMAIN/health"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  pm2 status          - Check server status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart server"
echo "  pm2 stop all        - Stop server"
echo "  pm2 monit           - Monitor resources"
echo ""
echo -e "${GREEN}Server is now running 24/7! 🚀${NC}"

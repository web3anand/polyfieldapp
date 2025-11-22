#!/bin/bash
# Run this script on your VPS after uploading the server files

set -e

echo "🚀 PolyField VPS Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update system
echo "📦 Updating system..."
sudo apt update
sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Clean old deployments
echo "🧹 Cleaning old files..."
cd ~
rm -rf polyfield
pm2 delete all || true

# Create directories
echo "📁 Creating directories..."
mkdir -p ~/polyfield/server
cd ~/polyfield/server

echo ""
echo "✅ VPS is ready!"
echo ""
echo "Next steps:"
echo "1. Upload your server files to ~/polyfield/server/"
echo "2. Run: cd ~/polyfield/server && npm install"
echo "3. Create .env file with your configuration"
echo "4. Run: pm2 start ecosystem.config.js"
echo "5. Run: pm2 save && pm2 startup"
echo ""
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"

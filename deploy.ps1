# Deploy to VPS - Quick Script
# Run this after pushing to GitHub

Write-Host "🚀 Deploying to VPS..." -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "207.246.126.234"
$VPS_USER = "linuxuser"

Write-Host "Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. SSH to VPS: ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "2. Pull code: cd ~/polyfieldapp; git pull origin main" -ForegroundColor White
Write-Host "3. Install deps: cd server; npm install" -ForegroundColor White
Write-Host "4. Build: npm run build" -ForegroundColor White
Write-Host "5. Add private key to .env" -ForegroundColor White
Write-Host "6. Restart: pm2 restart all" -ForegroundColor White
Write-Host ""

Write-Host "Copy these commands:" -ForegroundColor Green
Write-Host ""
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Then run on VPS:" -ForegroundColor Cyan
@"
cd ~/polyfieldapp
git pull origin main
cd server
npm install
npm run build
nano .env
# Add: POLYMARKET_PRIVATE_KEY=your_wallet_private_key
pm2 restart all
pm2 logs
"@ | Write-Host -ForegroundColor White

Write-Host ""
Write-Host "WARNING: Don't forget to:" -ForegroundColor Yellow
Write-Host "  1. Create a Polygon wallet" -ForegroundColor White
Write-Host "  2. Fund it with 10+ USDC" -ForegroundColor White
Write-Host "  3. Approve USDC spending (see ORDER_PLACEMENT_SETUP.md)" -ForegroundColor White
Write-Host "  4. Add private key to VPS .env file" -ForegroundColor White
Write-Host ""
Write-Host "Full guide: ORDER_PLACEMENT_SETUP.md" -ForegroundColor Cyan

# PolyField VPS Deployment Script (PowerShell)
# This script will deploy the backend server to your VPS

$ErrorActionPreference = "Stop"

Write-Host "🚀 PolyField VPS Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$VPS_HOST = "207.246.126.234"
$VPS_USER = "linuxuser"
$VPS_PASSWORD = 'M6]c@47MFZfqG)vy'
$APP_DIR = "/home/linuxuser/polyfield"
$SERVER_DIR = "$APP_DIR/server"

# Build the server
Write-Host "📦 Building server..." -ForegroundColor Yellow
Set-Location server
npm run build
Set-Location ..

Write-Host "`n✅ Server built successfully!" -ForegroundColor Green
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📝 Next Steps (Manual):" -ForegroundColor Yellow
Write-Host "`n1. Upload files to VPS using WinSCP or FileZilla:" -ForegroundColor White
Write-Host "   Host: $VPS_HOST" -ForegroundColor Gray
Write-Host "   User: $VPS_USER" -ForegroundColor Gray
Write-Host "   Password: $VPS_PASSWORD" -ForegroundColor Gray
Write-Host "   Upload folder: server/* to ~/polyfield/server/" -ForegroundColor Gray

Write-Host "`n2. Or use this SSH command in PowerShell:" -ForegroundColor White
Write-Host @"
ssh $VPS_USER@$VPS_HOST
# Then run these commands:
cd ~
rm -rf polyfield
mkdir -p polyfield/server
exit
"@ -ForegroundColor Gray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Or I can guide you through automated deployment with plink/pscp" -ForegroundColor Yellow

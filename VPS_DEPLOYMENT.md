# 🚀 PolyField VPS Deployment Guide

## VPS Details
- **Host**: 207.246.126.234
- **User**: linuxuser
- **Location**: New Jersey

## Quick Deployment Steps

### Method 1: Using SSH (Recommended)

1. **Connect to VPS**
```bash
ssh linuxuser@207.246.126.234
```

2. **Run setup script**
```bash
curl -o setup.sh https://raw.githubusercontent.com/yourusername/polyfieldapp/main/vps-setup.sh
chmod +x setup.sh
./setup.sh
```

3. **Upload server files from your local machine**
```powershell
# From Windows (in project root)
cd "c:\new poly app"
scp -r server/* linuxuser@207.246.126.234:~/polyfield/server/
```

4. **On VPS, install and start**
```bash
cd ~/polyfield/server
npm install --production
cp .env.production .env
npm run build
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup
```

### Method 2: Manual Setup

1. **Connect via SSH or use WinSCP/FileZilla**
   - Host: 207.246.126.234
   - User: linuxuser
   - Password: M6]c@47MFZfqG)vy
   - Port: 22

2. **On VPS, install requirements**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create directory
mkdir -p ~/polyfield/server
```

3. **Upload these files to ~/polyfield/server/**
   - server/package.json
   - server/package-lock.json
   - server/ecosystem.config.js
   - server/.env.production (rename to .env)
   - server/dist/ (entire folder)
   - server/src/ (entire folder)

4. **Start the server**
```bash
cd ~/polyfield/server
npm install --production
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup
```

## Verify Deployment

1. **Check server status**
```bash
pm2 list
pm2 logs
```

2. **Test endpoints**
```bash
curl http://207.246.126.234:3000/health
curl http://207.246.126.234:3000/
```

3. **From your browser**
   - http://207.246.126.234:3000
   - http://207.246.126.234:3000/health

## Update Mobile App Configuration

Update your mobile app to use the VPS backend:

**File**: `mobile/.env.local`
```env
EXPO_PUBLIC_API_URL=http://207.246.126.234:3000
```

Or in your app code:
```typescript
const API_BASE_URL = 'http://207.246.126.234:3000';
```

## Useful PM2 Commands

```bash
# View logs
pm2 logs

# Restart server
pm2 restart all

# Stop server
pm2 stop all

# Start server
pm2 start all

# Monitor
pm2 monit

# Delete all
pm2 delete all
```

## Open Firewall Ports

If the server isn't accessible, open port 3000:

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
sudo ufw status
```

## Troubleshooting

### Server not starting
```bash
cd ~/polyfield/server
pm2 logs --err
npm run build  # Rebuild if needed
pm2 restart all
```

### Cannot connect from mobile app
1. Check firewall: `sudo ufw status`
2. Check server is running: `pm2 list`
3. Test locally on VPS: `curl http://localhost:3000/health`
4. Check CORS settings in .env

### Out of memory
```bash
# Restart PM2
pm2 restart all
# Or increase memory limit
pm2 start ecosystem.config.js --max-memory-restart 500M
```

## SSL/HTTPS Setup (Optional - for production)

1. **Get a domain name** (e.g., api.polyfield.app)
2. **Point domain to** 207.246.126.234
3. **Install Nginx and Certbot**
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

4. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/polyfield
```

Add:
```nginx
server {
    server_name api.polyfield.app;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable and get SSL**
```bash
sudo ln -s /etc/nginx/sites-available/polyfield /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.polyfield.app
sudo systemctl restart nginx
```

## Environment Variables

Edit `.env` on VPS to customize:

```bash
nano ~/polyfield/server/.env
```

Key settings:
- `PORT` - Server port (default: 3000)
- `ALLOWED_ORIGINS` - CORS allowed origins (* for all)
- `RATE_LIMIT_MAX_REQUESTS` - API rate limit

After changes:
```bash
pm2 restart all
```

## Next Steps

✅ Server is deployed
✅ Update mobile app to use: `http://207.246.126.234:3000`
✅ Test all endpoints
✅ (Optional) Set up domain and SSL
✅ Monitor with `pm2 monit`

# VPS Deployment Guide

Complete guide for deploying PolyField Backend on a VPS.

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ (or similar Linux distribution)
- Node.js 20+ installed
- Domain name (optional, for SSL)
- SSH access to VPS

## 🚀 Step-by-Step Deployment

### 1. Connect to VPS

```bash
ssh user@your-vps-ip
```

### 2. Install Node.js

```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Clone/Upload Server Code

**Option A: Git Clone**
```bash
cd /var/www
git clone your-repo-url polyfield-backend
cd polyfield-backend/server
```

**Option B: Upload Files**
```bash
# Use SCP or SFTP to upload server folder
scp -r server/ user@your-vps-ip:/var/www/polyfield-backend/
```

### 4. Install Dependencies

```bash
cd /var/www/polyfield-backend/server
npm install --production
```

### 5. Configure Environment

Create `.env` file:
```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 6. Install PM2

```bash
sudo npm install -g pm2
```

### 7. Start Server with PM2

```bash
npm run pm2:start
```

### 8. Configure PM2 Auto-Start

```bash
pm2 save
pm2 startup
# Run the command it outputs (usually sudo env PATH=...)
```

### 9. Verify Server is Running

```bash
pm2 status
pm2 logs polyfield-backend
curl http://localhost:3000/health
```

## 🔒 Security Setup

### 1. Configure Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend (or use Nginx proxy)
sudo ufw enable
```

### 2. Set Up Nginx Reverse Proxy (Recommended)

**Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

**Create Config:**
```bash
sudo nano /etc/nginx/sites-available/polyfield-backend
```

Add:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/polyfield-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## 🔄 Update Frontend Configuration

Update your frontend `.env`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

Or if using direct IP:
```env
VITE_API_BASE_URL=http://your-vps-ip:3000
```

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit              # Real-time dashboard
pm2 logs               # View logs
pm2 status             # Check status
```

### System Monitoring
```bash
# CPU and Memory
htop

# Disk Space
df -h

# Network
netstat -tulpn
```

## 🔧 Maintenance

### Update Server Code
```bash
cd /var/www/polyfield-backend/server
git pull
npm install --production
pm2 restart polyfield-backend
```

### View Logs
```bash
# PM2 logs
pm2 logs polyfield-backend --lines 100

# System logs
sudo journalctl -u polyfield-backend -f
```

### Restart Server
```bash
pm2 restart polyfield-backend
# or
npm run pm2:restart
```

## 🐛 Troubleshooting

### Server Not Starting
```bash
# Check PM2 logs
pm2 logs polyfield-backend

# Check if port is in use
sudo lsof -i :3000

# Check Node.js version
node --version
```

### CORS Errors
- Verify `ALLOWED_ORIGINS` in `.env` includes your frontend URL
- Check Nginx headers if using reverse proxy

### High Memory Usage
```bash
# Restart PM2
pm2 restart polyfield-backend

# Check memory
pm2 monit
```

## 📈 Scaling

### Increase PM2 Instances
Edit `ecosystem.config.js`:
```js
instances: 4, // Increase from 2 to 4
```

Restart:
```bash
pm2 delete polyfield-backend
npm run pm2:start
```

### Load Balancer
Use Nginx as load balancer for multiple instances:
```nginx
upstream backend {
    least_conn;
    server localhost:3000;
    server localhost:3001;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

## ✅ Checklist

- [ ] Node.js installed
- [ ] Server code uploaded
- [ ] Dependencies installed
- [ ] `.env` configured
- [ ] PM2 installed and running
- [ ] Firewall configured
- [ ] Nginx reverse proxy (optional)
- [ ] SSL certificate (optional)
- [ ] Frontend configured with backend URL
- [ ] Health check working
- [ ] PM2 auto-start configured

## 🎉 Done!

Your backend is now running securely on your VPS!

Test it:
```bash
curl https://api.yourdomain.com/health
```


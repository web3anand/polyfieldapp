# PolyField Backend Server

Secure backend proxy for Polymarket CLOB API. Deploy on VPS for production use.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:
```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Run Production Server

```bash
npm start
```

## 📦 Production Deployment (VPS)

### Option 1: PM2 (Recommended)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2:**
   ```bash
   npm run pm2:start
   ```

3. **Useful PM2 commands:**
   ```bash
   npm run pm2:stop      # Stop server
   npm run pm2:restart   # Restart server
   pm2 logs              # View logs
   pm2 monit             # Monitor
   ```

4. **Save PM2 configuration:**
   ```bash
   pm2 save
   pm2 startup           # Auto-start on system reboot
   ```

### Option 2: Systemd Service

Create `/etc/systemd/system/polyfield-backend.service`:

```ini
[Unit]
Description=PolyField Backend Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/server
ExecStart=/usr/bin/node /path/to/server/src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable polyfield-backend
sudo systemctl start polyfield-backend
sudo systemctl status polyfield-backend
```

### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

Build and run:
```bash
docker build -t polyfield-backend .
docker run -d -p 3000:3000 --env-file .env polyfield-backend
```

## 🔒 Security Features

- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Configurable allowed origins
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **Request Validation** - Input sanitization
- ✅ **Error Handling** - Secure error messages

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health
- `GET /health/clob` - CLOB API connectivity

### CLOB API (Proxied)
- `GET /api/clob/markets` - Get markets
- `GET /api/clob/book?token_id={id}` - Get order book
- `GET /api/clob/trades?token_id={id}` - Get trades
- `POST /api/clob/orders` - Place order (requires auth)
- `DELETE /api/clob/orders/:id` - Cancel order (requires auth)
- `GET /api/clob/orders?user={address}` - Get user orders (requires auth)

### Data API (Proxied)
- `GET /api/data/holdings?user={address}` - Get holdings (requires auth)

## 🔐 Authentication

The server forwards authentication headers from the client to Polymarket:

**L2 Authentication (API Key):**
- `POLY_API_KEY`
- `POLY_PASSPHRASE`
- `POLY_SIGNATURE`

**L1 Authentication (Private Key):**
- `POLY_ADDRESS`
- `POLY_SIGNATURE`
- `POLY_TIMESTAMP`
- `POLY_NONCE`

## 🌐 CORS Configuration

Add your frontend URLs to `ALLOWED_ORIGINS` in `.env`:

```env
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
```

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit              # Real-time monitoring
pm2 logs               # View logs
pm2 status             # Check status
```

### Health Checks
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/clob
```

## 🔧 Nginx Reverse Proxy (Optional)

If using Nginx, add to `/etc/nginx/sites-available/polyfield-backend`:

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

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/polyfield-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `localhost` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### PM2 Issues
```bash
pm2 delete all
pm2 kill
pm2 start ecosystem.config.js
```

### Check Logs
```bash
# PM2 logs
pm2 logs polyfield-backend

# Systemd logs
sudo journalctl -u polyfield-backend -f
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Polymarket CLOB API](https://docs.polymarket.com/developers/CLOB/introduction)


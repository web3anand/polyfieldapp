# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create `.env` file:
```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### 5. Test It

```bash
curl http://localhost:3000/health
```

## 📝 Environment Variables

Minimum required in `.env`:

```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

## ✅ That's It!

Your backend server is now running! 🎉

See [README.md](./README.md) for full documentation.


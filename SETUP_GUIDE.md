# PolyField Setup Guide

Complete setup guide for the reorganized monorepo structure.

## 📋 Prerequisites

- Node.js 20+
- npm 9+
- Git

## 🚀 Initial Setup

### 1. Install Root Dependencies

```bash
npm install
```

This installs workspace dependencies and `concurrently` for running multiple processes.

### 2. Install Client Dependencies

```bash
cd client
npm install
cd ..
```

### 3. Install Server Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Install Shared Dependencies

```bash
cd shared
npm install
cd ..
```

**Or use the workspace command:**
```bash
npm run install:all
```

## ⚙️ Configuration

### Client Configuration

Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_PRIVY_APP_ID=your_privy_app_id
```

### Server Configuration

Create `server/.env`:
```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 🏃 Development

### Run Everything

```bash
# Start both client and server
npm run dev:all
```

### Run Individually

```bash
# Client only (port 3001)
npm run dev

# Server only (port 3000)
npm run dev:server
```

## 📦 Build

```bash
# Build everything
npm run build

# Build individually
npm run build:client
npm run build:server
```

## 📱 Mobile App Setup

### Option 1: React Native CLI

```bash
cd mobile
npx react-native init PolyFieldMobile --template react-native-template-typescript
```

### Option 2: Expo (Recommended)

```bash
cd mobile
npx create-expo-app PolyFieldMobile --template
```

## 🗂️ Project Structure

```
polyfield-app/
├── client/          # React web app
├── server/          # Express backend
├── mobile/          # React Native app
├── shared/          # Shared types
└── api/             # Vercel functions
```

## ✅ Verification

1. **Client**: Visit `http://localhost:3001`
2. **Server**: Visit `http://localhost:3000/health`
3. **Both**: Run `npm run dev:all` and verify both start

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process
lsof -i :3000  # or :3001

# Kill process
kill -9 <PID>
```

### Module Not Found
```bash
# Reinstall dependencies
npm run install:all
```

### TypeScript Errors
```bash
# Type check
cd client && npm run type-check
cd server && npm run type-check
```

## 📚 Next Steps

1. Configure environment variables
2. Set up Privy authentication
3. Deploy server to VPS
4. Set up mobile app
5. Configure CORS for production

See individual README files:
- [Client README](./client/README.md)
- [Server README](./server/README.md)
- [Mobile README](./mobile/README.md)


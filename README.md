# PolyField - Polymarket Prediction Platform

A full-stack prediction platform for Polymarket with web client, mobile app support, and secure Express backend.

## 🏗️ Project Structure

```
polyfield-app/
├── client/              # React Web Client (Vite + TypeScript)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── server/              # Express Backend (TypeScript)
│   ├── src/
│   │   ├── routes/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/              # React Native Mobile App (Future)
│   ├── android/
│   ├── ios/
│   └── src/
│
├── shared/              # Shared types and utilities
│   └── types/
│
└── package.json         # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
# Install all dependencies (root, client, server)
npm run install:all

# Or install individually
npm install                    # Root workspace
cd client && npm install       # Client dependencies
cd server && npm install       # Server dependencies
```

### Development

```bash
# Run client only (frontend)
npm run dev

# Run server only (backend)
npm run dev:server

# Run both client and server
npm run dev:all
```

### Production Build

```bash
# Build everything
npm run build

# Build individually
npm run build:client
npm run build:server
```

## 📱 Mobile App Development

The project is structured to support React Native mobile apps:

- **Web Client** (`client/`) - React web app
- **Mobile App** (`mobile/`) - React Native (to be set up)
- **Shared Code** (`shared/`) - Common types and utilities

### Setting Up React Native

```bash
cd mobile
npx react-native init PolyFieldMobile --template react-native-template-typescript
```

## 🔧 Configuration

### Client Configuration

Edit `client/.env` (already created, just add your Privy App ID):
```env
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_API_BASE_URL=http://localhost:3000
```

### Server Configuration

Edit `server/.env` (already created):
```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📚 Documentation

- [Client README](./client/README.md) - Web client documentation
- [Server README](./server/README.md) - Backend server documentation
- [Mobile Setup](./mobile/README.md) - Mobile app setup (coming soon)
- [Integration Guide](./POLYMARKET_INTEGRATION_COMPLETE.md) - Polymarket API integration
- [Usage Examples](./USAGE_EXAMPLES.md) - Code examples

## 🛠️ Tech Stack

### Client
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Privy** - Authentication
- **Framer Motion** - Animations

### Server
- **Express** - Web framework
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Helmet** - Security
- **CORS** - Cross-origin support

### Mobile (Future)
- **React Native** - Mobile framework
- **TypeScript** - Type safety
- Shared codebase with web client

## 📦 Workspaces

This project uses npm workspaces for monorepo management:

- `client` - Web application
- `server` - Backend API server

## 🔐 Security

- Authentication via Privy
- Secure API key handling on backend
- CORS protection
- Rate limiting
- Helmet security headers

## 📄 License

MIT

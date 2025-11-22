# PolyField - Complete Project Structure

## 📁 Monorepo Structure

```
polyfield-app/
│
├── 📱 client/                    # React Web Client
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API services
│   │   ├── lib/                # Libraries
│   │   ├── config/             # Configuration
│   │   ├── utils/              # Utilities
│   │   └── types.ts            # Re-exports shared types
│   ├── public/                  # Static assets
│   ├── index.html              # HTML entry
│   ├── package.json            # Client dependencies
│   ├── vite.config.ts          # Vite config
│   ├── tsconfig.json           # TypeScript config
│   └── tailwind.config.js      # Tailwind config
│
├── 🖥️ server/                   # Express Backend (TypeScript)
│   ├── src/
│   │   ├── routes/             # API routes
│   │   │   ├── clob.ts         # CLOB API routes
│   │   │   ├── data.ts         # Data API routes
│   │   │   └── health.ts       # Health check
│   │   └── index.ts            # Server entry
│   ├── package.json            # Server dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── ecosystem.config.js     # PM2 config
│   └── .env                    # Environment variables (gitignored)
│
├── 📱 mobile/                   # React Native Mobile App
│   ├── android/                 # Android native code
│   ├── ios/                     # iOS native code
│   ├── src/                     # React Native source
│   └── README.md                # Mobile setup guide
│
├── 🔗 shared/                   # Shared Code
│   ├── types/
│   │   └── index.ts            # Shared TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── ☁️ api/                      # Vercel Serverless Functions
│   └── polymarket-proxy.ts     # Polymarket API proxy
│
├── 📄 Root Files
│   ├── package.json             # Workspace root
│   ├── README.md                # Main documentation
│   ├── .gitignore              # Git ignore rules
│   └── vercel.json              # Vercel config
│
└── 📚 Documentation
    ├── POLYMARKET_INTEGRATION_COMPLETE.md
    ├── USAGE_EXAMPLES.md
    ├── PRIVY_ORIGIN_SETUP.md
    └── PROJECT_STRUCTURE_FINAL.md (this file)
```

## 🎯 Purpose of Each Directory

### `client/` - Web Application
- **Purpose**: React web client for browsers
- **Tech**: React 18, Vite, TypeScript, Tailwind CSS
- **Port**: 3001 (development)
- **Build**: `npm run build` → `dist/`

### `server/` - Backend API
- **Purpose**: Express server for secure API proxying
- **Tech**: Express, TypeScript, Axios
- **Port**: 3000 (default)
- **Build**: `npm run build` → `dist/`
- **Deploy**: VPS with PM2 or Docker

### `mobile/` - Mobile App
- **Purpose**: React Native app for Android/iOS
- **Tech**: React Native, TypeScript
- **Status**: Ready for setup
- **Setup**: See `mobile/README.md`

### `shared/` - Shared Code
- **Purpose**: Types and utilities shared between client/server/mobile
- **Tech**: TypeScript
- **Usage**: Import from `@shared/types`

### `api/` - Vercel Functions
- **Purpose**: Serverless functions for Vercel deployment
- **Tech**: TypeScript, Vercel Runtime
- **Use Case**: Alternative to Express server

## 🚀 Development Workflow

### 1. Install All Dependencies
```bash
npm run install:all
```

### 2. Start Development
```bash
# Start both client and server
npm run dev:all

# Or individually
npm run dev          # Client only
npm run dev:server   # Server only
```

### 3. Build for Production
```bash
npm run build        # Build everything
npm run build:client # Client only
npm run build:server # Server only
```

## 📱 Mobile App Development

### Setup React Native
```bash
cd mobile
npx react-native init PolyFieldMobile --template react-native-template-typescript
```

### Or Use Expo (Recommended)
```bash
cd mobile
npx create-expo-app PolyFieldMobile --template
```

### Share Code with Web
- Use `shared/types` for type definitions
- Share API service logic
- Reuse hooks where possible

## 🔧 Configuration

### Client Environment
`client/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_PRIVY_APP_ID=your_privy_app_id
```

### Server Environment
`server/.env`:
```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## 📦 Workspace Management

This project uses **npm workspaces**:

```json
{
  "workspaces": ["client", "server"]
}
```

Benefits:
- Single `node_modules` at root
- Shared dependencies
- Unified scripts
- Easier dependency management

## 🔐 Security Architecture

```
┌─────────────┐
│   Client    │ (Browser/Mobile)
│  (React)    │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Server    │ (Express on VPS)
│  (Proxy)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Polymarket  │ (CLOB API)
│    API      │
└─────────────┘
```

**Security Features:**
- ✅ API keys stored on server only
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Authentication via Privy

## 📊 Deployment

### Client (Web)
- **Vercel**: Automatic from `client/` directory
- **Netlify**: Configure build command
- **Static Hosting**: Upload `client/dist/`

### Server (Backend)
- **VPS**: Use PM2 (see `server/DEPLOYMENT.md`)
- **Docker**: Containerize Express app
- **Railway/Render**: Platform-as-a-Service

### Mobile
- **Android**: Build APK/AAB, upload to Play Store
- **iOS**: Build via Xcode, upload to App Store
- **Expo**: Use EAS Build service

## ✅ Checklist

- [x] Client organized in `client/`
- [x] Server organized in `server/`
- [x] Shared types in `shared/`
- [x] Mobile structure ready
- [x] Workspace configuration
- [x] Documentation updated
- [x] No duplicates
- [x] Express backend ready

## 🎉 Ready for Development!

The project is now properly organized and ready for:
- ✅ Web development
- ✅ Mobile app development (React Native)
- ✅ Backend deployment (Express on VPS)
- ✅ Shared code reuse


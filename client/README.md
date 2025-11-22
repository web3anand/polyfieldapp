# PolyField Web Client

React web application built with Vite and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
client/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── lib/            # Libraries and utilities
│   ├── config/         # Configuration
│   ├── utils/          # Utility functions
│   └── types.ts        # TypeScript types (uses shared)
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
└── package.json
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file (just `.env`, no need for `.env.example` or `.env.local`):

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_PRIVY_APP_ID=your_privy_app_id
```

### Vite Configuration

- Port: `3001` (configurable in `vite.config.ts`)
- Proxy: Configured for `/api` and `/polymarket-api`

## 🔗 API Integration

The client connects to:
- **Backend Server**: `http://localhost:3000` (development)
- **Polymarket API**: Via backend proxy or direct (with CORS handling)

## 📦 Key Dependencies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Privy** - Authentication
- **Framer Motion** - Animations

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS
- **Custom CSS** - In `src/index.css`
- **Theme Variables** - CSS custom properties

## 🔐 Authentication

Uses Privy for wallet and email authentication:

```typescript
import { usePrivy } from '@privy-io/react-auth';

const { authenticated, login, logout } = usePrivy();
```

## 📱 Mobile Responsive

The app is designed to be mobile-responsive and can be converted to React Native for native mobile apps.


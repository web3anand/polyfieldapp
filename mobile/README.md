# Polymarket Mobile App

React Native mobile app for Polymarket prediction markets, built with Expo.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and set EXPO_PUBLIC_API_BASE_URL to your backend URL
```

### Run the App

```bash
# Start Expo development server
npm start

# Or run directly on platform
npm run android  # Android
npm run ios      # iOS (macOS only)
npm run web      # Web browser
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

## 📁 Project Structure

```
mobile/
├── App.tsx                     # Entry point with polyfills
├── src/
│   ├── screens/                # App screens
│   │   ├── MarketsScreen.tsx   # Markets list
│   │   ├── PortfolioScreen.tsx # User portfolio
│   │   └── ProfileScreen.tsx   # User profile
│   ├── navigation/             # Navigation setup
│   │   └── AppNavigator.tsx    # Bottom tab navigator
│   ├── services/               # API services
│   │   ├── clobApi.ts          # CLOB trading API
│   │   └── polymarketProxy.ts  # Markets data API
│   ├── lib/                    # Libraries
│   │   └── polymarketWebSocket.ts  # Real-time prices
│   ├── hooks/                  # React hooks
│   ├── components/             # Reusable components
│   ├── utils/                  # Utility functions
│   └── types/                  # TypeScript types
├── package.json
└── app.json                    # Expo configuration
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
# Required: Backend API URL
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000  # Or your Vercel URL

# Optional: Builder API (for order attribution)
EXPO_PUBLIC_BUILDER_API_KEY=your_api_key
EXPO_PUBLIC_BUILDER_SECRET=your_secret
EXPO_PUBLIC_BUILDER_PASSPHRASE=your_passphrase
```

### Backend Setup

The mobile app requires a backend server for:
- Fetching markets (proxies Polymarket API)
- Placing orders (CLOB API)
- WebSocket authentication (real-time prices)

Start the backend server:

```bash
cd ../server
npm install
npm run dev
```

## 🎨 Features

### Current Features

- ✅ Market list with real-time prices
- ✅ Bottom tab navigation
- ✅ Pull-to-refresh markets
- ✅ Category filters
- ✅ Price display (YES/NO)

### Coming Soon

- 🔜 Market detail screen
- 🔜 Place orders (buy/sell)
- 🔜 Wallet integration (Privy)
- 🔜 Portfolio tracking
- 🔜 Real-time price updates (WebSocket)
- 🔜 Push notifications
- 🔜 Dark mode

## 📱 Testing

### On Device (Recommended)

1. Install Expo Go on your phone
2. Run `npm start`
3. Scan QR code with camera (iOS) or Expo Go (Android)

### On Simulator/Emulator

**iOS Simulator (macOS only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

## 🛠 Development

### Adding New Screens

1. Create screen in `src/screens/YourScreen.tsx`
2. Add to `AppNavigator.tsx`
3. Add icon from `@expo/vector-icons`

### Adding New Services

1. Create service in `src/services/yourService.ts`
2. Export functions
3. Use in screens via hooks

### Styling

Using React Native StyleSheet for styling:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
```

## 📦 Dependencies

### Core

- **expo**: ~52.0.26 - Expo framework
- **react-native**: 0.76.6 - React Native
- **@react-navigation**: Navigation library
- **react-native-paper**: Material Design components

### Crypto/Web3

- **ethers**: ^6.13.5 - Ethereum library
- **@ethersproject/shims**: Polyfills for React Native
- **react-native-get-random-values**: Crypto.getRandomValues() polyfill

### Authentication

- **@privy-io/expo**: Wallet authentication (to be implemented)

## 🚀 Deployment

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Submit to Stores

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

## 🐛 Troubleshooting

### "Unable to resolve module"

```bash
npm install
npx expo start --clear
```

### WebSocket not connecting

- Check `EXPO_PUBLIC_API_BASE_URL` in `.env`
- Ensure backend server is running
- WebSocket requires authentication (Builder API credentials)

### Build errors

```bash
rm -rf node_modules
npm install
```

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Polymarket API Docs](https://docs.polymarket.com/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test on device
4. Submit PR

## 📄 License

MIT

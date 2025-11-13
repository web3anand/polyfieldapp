# Deployment Guide

## 🚀 Production Deployment Plan

This document outlines the steps to deploy the Polymarket Mobile App to Play Store and App Store.

---

## 📋 Prerequisites

### For Android (Play Store)
- [ ] Android Studio installed
- [ ] Java JDK 11+ installed
- [ ] Android SDK configured
- [ ] Google Play Developer account ($25 one-time fee)
- [ ] Keystore for signing APK/AAB

### For iOS (App Store)
- [ ] macOS with Xcode installed
- [ ] Apple Developer account ($99/year)
- [ ] CocoaPods installed
- [ ] Provisioning profiles configured

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│   Mobile App (Capacitor)            │
│   - Android (Play Store)            │
│   - iOS (App Store)                 │
└──────────────┬───────────────────────┘
               │
               │ HTTPS/API Calls
               │
┌──────────────▼───────────────────────┐
│   Backend Services (Docker)           │
│   - Main API Service                │
│   - External API 1                  │
│   - External API 2                  │
│   - Database                        │
└─────────────────────────────────────┘
```

---

## 📦 Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap init
```

**Configuration:**
- App ID: `com.polyfield.app` (or your package name)
- App Name: `Polymarket Mobile`
- Web Dir: `build`

---

## 📱 Step 2: Android Setup

### 2.1 Add Android Platform
```bash
npm run build
npx cap add android
npx cap sync
```

### 2.2 Configure Android
- Edit `android/app/build.gradle`
- Set `applicationId`, `versionCode`, `versionName`
- Configure signing configs

### 2.3 Build APK/AAB
```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (recommended)
```

### 2.4 Generate Keystore
```bash
keytool -genkey -v -keystore polyfield-release.keystore -alias polyfield -keyalg RSA -keysize 2048 -validity 10000
```

---

## 🍎 Step 3: iOS Setup

### 3.1 Add iOS Platform
```bash
npm run build
npx cap add ios
npx cap sync
```

### 3.2 Open in Xcode
```bash
npx cap open ios
```

### 3.3 Configure in Xcode
- Set Bundle Identifier
- Configure Signing & Capabilities
- Set App Icons and Launch Screen
- Build and test on simulator/device

---

## 🔧 Step 4: Environment Configuration

### 4.1 Create Environment Files

**`.env.development`**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

**`.env.production`**
```env
VITE_API_BASE_URL=https://api.polyfield.com
VITE_ENV=production
```

### 4.2 Update Capacitor Config

**`capacitor.config.ts`**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.polyfield.app',
  appName: 'Polymarket Mobile',
  webDir: 'build',
  server: {
    // For development
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
  },
};

export default config;
```

---

## 🐳 Step 5: Docker Setup (Backend)

### 5.1 Create Docker Compose

**`docker-compose.yml`**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/polyfield
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=polyfield
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 5.2 Build and Run
```bash
docker-compose up -d
```

---

## 🚢 Step 6: CI/CD Pipeline

### 6.1 GitHub Actions Example

**`.github/workflows/deploy.yml`**
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '11'
      - name: Install dependencies
        run: npm ci
      - name: Build web app
        run: npm run build
      - name: Build Android
        run: |
          cd android
          ./gradlew bundleRelease
      - name: Upload AAB
        uses: actions/upload-artifact@v3
        with:
          name: app-release.aab
          path: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📤 Step 7: Play Store Submission

1. **Create App Listing**
   - App name, description, screenshots
   - Privacy policy URL
   - App icon (512x512)
   - Feature graphic (1024x500)

2. **Upload AAB**
   - Go to Google Play Console
   - Create new release
   - Upload AAB file
   - Fill release notes

3. **Content Rating**
   - Complete content rating questionnaire

4. **Submit for Review**
   - Review all sections
   - Submit for review

---

## 📤 Step 8: App Store Submission

1. **App Store Connect**
   - Create new app
   - Fill app information
   - Upload screenshots
   - Set pricing

2. **Archive and Upload**
   - Open Xcode
   - Product → Archive
   - Distribute App
   - Upload to App Store Connect

3. **Submit for Review**
   - Complete app information
   - Submit for review

---

## 🔐 Step 9: Security Checklist

- [ ] API endpoints use HTTPS
- [ ] Environment variables secured
- [ ] API keys stored securely
- [ ] OAuth/authentication implemented
- [ ] Data encryption in transit
- [ ] Certificate pinning (optional)

---

## 📊 Step 10: Monitoring

- [ ] Set up error tracking (Sentry, Bugsnag)
- [ ] Analytics (Google Analytics, Mixpanel)
- [ ] Performance monitoring
- [ ] Crash reporting

---

## 🎯 Next Steps

1. ✅ App running locally
2. ⏳ Set up Capacitor
3. ⏳ Configure Android/iOS
4. ⏳ Integrate backend APIs
5. ⏳ Set up Docker for backend
6. ⏳ Configure CI/CD
7. ⏳ Build and test on devices
8. ⏳ Submit to stores

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/ios/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)


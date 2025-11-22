# Google Play Store Deployment Guide

## Prerequisites
- Google Play Console account ($25 one-time fee)
- All app assets ready (icons, screenshots, descriptions)

## Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

## Step 2: Login to Expo
```bash
eas login
```
Enter your Expo account credentials.

## Step 3: Configure Project for Build
Already configured! Files updated:
- ✅ `app.json` - Added Android versionCode and permissions
- ✅ `eas.json` - Created with build profiles

## Step 4: Build APK (For Testing)
```bash
# Build APK for local testing
eas build --platform android --profile preview
```
This will:
- Build on Expo servers
- Take 10-20 minutes
- Provide download link when done

## Step 5: Build AAB (For Play Store)
```bash
# Build production AAB for Google Play
eas build --platform android --profile production
```

## Step 6: Prepare Store Assets

### Required Images:
1. **App Icon**: 512x512px PNG (already at `./assets/icon.png`)
2. **Feature Graphic**: 1024x500px JPG/PNG
3. **Screenshots**: 
   - Minimum 2 required
   - Recommended 4-8 screenshots
   - Size: 1080x1920px (portrait) or 1920x1080px (landscape)
4. **Promotional Graphics** (optional):
   - Promo Graphic: 180x120px
   - TV Banner: 1280x720px

### Required Text:
1. **App Name**: PolyField (max 50 chars)
2. **Short Description**: Max 80 characters
   ```
   Prediction markets app - Trade on real-world events with crypto
   ```
3. **Full Description**: Max 4000 characters
   ```
   PolyField is a decentralized prediction markets platform powered by Polymarket. 
   Trade on real-world events, sports, politics, and more using cryptocurrency.

   Features:
   • Real-time market prices and charts
   • Live WebSocket updates
   • Embedded crypto wallet
   • Trade YES/NO on various markets
   • View your portfolio and positions
   • Secure authentication with Privy

   Trade on:
   - Sports outcomes
   - Political events
   - Economic indicators
   - Entertainment awards
   - And much more!

   Built on blockchain technology for transparency and decentralization.
   ```

4. **Privacy Policy URL**: (Required - create one or use template)
5. **Category**: Finance or Entertainment

## Step 7: Google Play Console Setup

### Create Application:
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: **PolyField**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
   - Accept declarations

### Store Presence Setup:
1. **App details**:
   - App name, short & full descriptions
   - App icon (512x512px)
   - Feature graphic (1024x500px)

2. **Graphics**:
   - Upload screenshots (2-8 required)
   - Phone screenshots: 1080x1920px

3. **Categorization**:
   - App category: Finance
   - Content rating: Complete questionnaire
   - Target audience: 18+

4. **Contact details**:
   - Email, phone (optional)
   - Website (optional)
   - Privacy policy URL (required)

### Production Release:
1. Go to "Production" → "Create new release"
2. Upload your AAB file
3. Release name: `1.0.0`
4. Release notes:
   ```
   Initial release of PolyField
   - Browse prediction markets
   - Real-time price charts
   - Place trades with crypto wallet
   - Track your portfolio
   ```
5. Click "Review release"
6. Click "Start rollout to Production"

## Step 8: Review Process
- Google reviews your app (1-7 days typically)
- You'll receive email when approved
- App goes live automatically after approval

## Commands Reference

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Check build status
eas build:list

# Build APK for testing
eas build --platform android --profile preview

# Build AAB for production
eas build --platform android --profile production

# Download build
eas build:download --platform android

# View build logs
eas build:view
```

## Updating Your App

When releasing updates:

1. Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2  // Increment this!
    }
  }
}
```

2. Build new AAB:
```bash
eas build --platform android --profile production
```

3. Upload to Play Console under "Production" → "Create new release"

## Important Notes

- **versionCode** must increment with each release (1, 2, 3...)
- **version** is display version (1.0.0, 1.1.0, 2.0.0...)
- APK for testing, AAB for production
- First build takes longest (15-20 min)
- Subsequent builds are faster
- Keep your signing credentials safe!

## Privacy Policy Template

You need a privacy policy URL. Basic template:

```markdown
# Privacy Policy for PolyField

## Data Collection
We collect minimal data required for app functionality:
- Wallet address for authentication
- Transaction history for portfolio display
- App usage analytics (optional)

## Third-Party Services
- Privy: Authentication and wallet management
- Polymarket: Market data and trading
- Supabase: User profile storage

## Data Security
All data is encrypted and securely stored. We never share personal information.

## Contact
Email: your-email@example.com
```

Host this on GitHub Pages or your website.

## Troubleshooting

### Build fails?
```bash
# Clear cache and retry
eas build --platform android --profile production --clear-cache
```

### Need to regenerate credentials?
```bash
eas credentials
```

### Local build instead of cloud?
```bash
npx expo run:android --variant release
```

## Next Steps After Approval

1. Monitor reviews and ratings
2. Respond to user feedback
3. Track analytics in Play Console
4. Plan updates based on user needs
5. Consider iOS App Store release with similar process

---

**Ready to build?** Run:
```bash
eas build --platform android --profile production
```

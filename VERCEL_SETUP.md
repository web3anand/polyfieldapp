# Vercel Environment Variables Setup

## How to Set Environment Variables in Vercel

Environment variables in Vercel are **NOT** set in `vercel.json`. They must be configured in the Vercel dashboard.

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to your Vercel project**:
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings**:
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add the environment variable**:
   - **Key**: `VITE_PRIVY_APP_ID`
   - **Value**: `cmhxczt420087lb0d07g6zoxs` (or your own Privy App ID)
   - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"

4. **Redeploy**:
   - Go to "Deployments" tab
   - Click the three dots (•••) on the latest deployment
   - Click "Redeploy"
   - **Important**: Check "Use existing Build Cache" to speed up the build

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run in project directory)
vercel link

# Add environment variable
vercel env add VITE_PRIVY_APP_ID

# When prompted:
# - Enter value: cmhxczt420087lb0d07g6zoxs
# - Select environments: Production, Preview, Development (space to select, enter to confirm)

# Redeploy
vercel --prod
```

### Required Environment Variable

| Variable | Description | Required | Default Value |
|----------|-------------|----------|---------------|
| `VITE_PRIVY_APP_ID` | Privy authentication app ID | **Yes** | `cmhxczt420087lb0d07g6zoxs` |

### Optional Environment Variables

| Variable | Description | Required | Default Value |
|----------|-------------|----------|---------------|
| `VITE_API_BASE_URL` | Backend API URL | No | (empty - uses Polymarket API directly) |
| `VITE_API_TIMEOUT` | API timeout in ms | No | `30000` |
| `VITE_APP_NAME` | App name | No | `Polymarket Mobile` |
| `VITE_APP_VERSION` | App version | No | `0.1.0` |
| `VITE_ENV` | Environment name | No | `production` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | No | `false` |
| `VITE_ENABLE_ERROR_TRACKING` | Enable error tracking | No | `false` |

## Troubleshooting

### Issue: "VITE_PRIVY_APP_ID is not configured"

**Solution**: The environment variable is not set in Vercel. Follow the steps above to add it.

### Issue: Changes not reflecting after adding env var

**Solution**: 
1. Environment variables are only applied during **build time** for Vite apps
2. You **must redeploy** after adding/changing environment variables
3. In Vercel dashboard: Deployments → Latest deployment → Three dots (•••) → Redeploy

### Issue: Still seeing the error after redeploying

**Solution**:
1. Verify the environment variable is set correctly:
   - Go to Settings → Environment Variables
   - Check that `VITE_PRIVY_APP_ID` exists and has a value
   - Check that it's enabled for "Production" environment
2. Make sure you're redeploying the correct branch (usually `main`)
3. Clear Vercel build cache:
   - When redeploying, **uncheck** "Use existing Build Cache"

## Get Your Own Privy App ID

If you want to use your own Privy account instead of the default:

1. Visit https://dashboard.privy.io/
2. Create an account or log in
3. Create a new app
4. Copy your App ID
5. Update the environment variable in Vercel with your new App ID
6. Redeploy

## Verifying Environment Variables

To verify your environment variables are working:

1. Check the build logs in Vercel:
   - Go to Deployments
   - Click on your deployment
   - Look for "✅ Privy App ID configured:" in the build logs

2. Check the runtime:
   - Visit your deployed app
   - Open browser console (F12)
   - You should see: "✅ Privy App ID configured: cmhxczt420087lb0d07g6zoxs"

## Quick Fix Summary

**Fastest way to fix the "Authentication Required" error:**

```bash
# 1. Via Vercel Dashboard
Settings → Environment Variables → Add Variable
Key: VITE_PRIVY_APP_ID
Value: cmhxczt420087lb0d07g6zoxs
Environments: All
Click Save

# 2. Redeploy
Deployments → Latest → Redeploy (without build cache)

# Done! ✅
```

Your app should now work with authentication enabled.

# Fix Privy Origin Mismatch Error

## Issue
You're seeing this error in the console:
```
origins don't match https://auth.privy.io https://polyfieldapp.vercel.app
```

This happens because your Vercel deployment URL is not added to the Privy dashboard's allowed origins.

## Solution

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Select your app (App ID: `cmhxczt420087lb0d07g6zoxs`)
3. Navigate to **Settings** → **App Settings** → **Allowed Origins**
4. Add your Vercel deployment URLs:
   - `https://polyfieldapp.vercel.app`
   - `https://polyfieldapp-*.vercel.app` (for preview deployments)
   - Or add `*.vercel.app` to allow all Vercel preview deployments
5. Save the changes

## Alternative: Use Wildcard

If you want to allow all Vercel preview deployments automatically, you can add:
- `https://*.vercel.app`

This will allow any Vercel deployment URL to work with Privy authentication.

## After Adding Origins

1. The changes take effect immediately (no need to redeploy)
2. Refresh your app and try logging in again
3. The origin mismatch error should be resolved

## Note

The error doesn't prevent the app from working, but it may cause authentication issues. It's recommended to add your production domain to the allowed origins list.


# Privy Origin Configuration

## Issue
You're seeing this error in the console:
```
origins don't match https://polyfieldapp.vercel.app https://auth.privy.io
```

This happens because your deployed app URL (`https://polyfieldapp.vercel.app`) is not in Privy's allowed origins list.

## Solution

1. **Go to Privy Dashboard**
   - Visit: https://dashboard.privy.io/
   - Log in with your Privy account

2. **Navigate to Your App**
   - Select your app (App ID: `cmhxczt420087lb0d07g6zoxs`)

3. **Add Allowed Origins**
   - Go to **Settings** → **Allowed Origins** (or **App Settings** → **Allowed Origins**)
   - Add the following origins:
     - `https://polyfieldapp.vercel.app` (production)
     - `https://*.vercel.app` (optional - allows all Vercel preview deployments)
     - `http://localhost:5173` (Vite default port)
     - `http://localhost:3001` (current client port)
     - `http://localhost:3000` (if you use this port locally)

4. **Save Changes**
   - Click **Save** or **Update**

5. **Wait a Few Minutes**
   - Changes may take 1-2 minutes to propagate

6. **Refresh Your App**
   - Clear browser cache and refresh `https://polyfieldapp.vercel.app`

## Verification

After adding the origins, the error should disappear. You should see successful authentication without origin mismatch warnings.

## Notes

- **Production URL**: Always add your production domain
- **Preview Deployments**: Adding `https://*.vercel.app` allows all Vercel preview URLs to work
- **Local Development**: Make sure localhost origins are added for development


# Privy Troubleshooting Guide

## Issue: Origin Mismatch Errors Persist After Adding Origin

If you've added the origin to Privy dashboard but still see errors, try these steps:

### 1. Verify Exact Origin Format

The origin must match **exactly**. Check:

```javascript
// In browser console, run:
console.log(window.location.origin);
```

Common mistakes:
- ❌ `http://localhost:3001/` (trailing slash)
- ✅ `http://localhost:3001` (no trailing slash)
- ❌ `localhost:3001` (missing protocol)
- ✅ `http://localhost:3001` (with protocol)

### 2. Verify App ID

Make sure you're using the correct App ID in Privy dashboard:

```javascript
// Check what App ID your app is using:
// Look in browser console for: "📍 Privy App ID: ..."
```

The App ID should match what's in your Privy dashboard.

### 3. Clear Browser Cache

1. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear Cache**: 
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Or use Incognito/Private mode to test

### 4. Wait for Propagation

Privy changes can take 1-2 minutes to propagate. After adding the origin:
1. Wait 2 minutes
2. Hard refresh the page
3. Check if errors are gone

### 5. Verify in Privy Dashboard

1. Go to https://dashboard.privy.io/
2. Select your app
3. Go to **Settings** → **Allowed Origins**
4. Verify the origin is listed **exactly** as shown in console
5. Make sure you clicked **Save** after adding

### 6. Check Network Tab

1. Open browser DevTools → Network tab
2. Look for requests to `auth.privy.io`
3. Check if they're failing with CORS errors
4. Check response headers for origin validation

### 7. Try Different Browser

Sometimes browser extensions or settings can interfere:
- Try Incognito/Private mode
- Try a different browser
- Disable browser extensions temporarily

### 8. Verify Privy SDK Version

Make sure you're using a compatible version:

```bash
npm list @privy-io/react-auth
```

Check Privy docs for latest version: https://docs.privy.io/

### 9. Check Console for Specific Errors

Look for:
- CORS errors
- Network errors
- Authentication errors
- Any error messages from Privy SDK

### 10. Contact Privy Support

If none of the above works:
- Check Privy status: https://status.privy.io/
- Contact Privy support with:
  - Your App ID
  - The exact origin you're using
  - Screenshot of allowed origins in dashboard
  - Browser console errors

## Common Issues

### Issue: Button Not Showing

**Symptoms**: No login button appears, stuck on "Initializing..."

**Causes**:
1. Privy not ready (origin mismatch)
2. Network issues
3. Wrong App ID

**Solution**: Check console logs for `[LoadingScreen]` or `[AppWithPrivy]` messages

### Issue: Origin Mismatch After Adding

**Symptoms**: Still seeing "origins don't match" errors

**Causes**:
1. Origin format mismatch (trailing slash, wrong protocol)
2. Wrong App ID
3. Browser cache
4. Changes not propagated yet

**Solution**: Follow steps 1-4 above

### Issue: Login Modal Not Opening

**Symptoms**: Button shows but clicking does nothing

**Causes**:
1. Privy not fully initialized
2. JavaScript errors blocking execution
3. Browser blocking popups

**Solution**: 
- Check console for errors
- Allow popups for localhost
- Try clicking button again after a few seconds

## Debug Commands

Run these in browser console to debug:

```javascript
// Check current origin
console.log('Origin:', window.location.origin);

// Check if Privy is ready (if you can access it)
// This requires Privy SDK to be loaded
```

## Still Having Issues?

1. Check browser console for detailed error messages
2. Check Network tab for failed requests
3. Verify Privy dashboard settings match exactly
4. Try in Incognito mode
5. Contact Privy support with all the above information









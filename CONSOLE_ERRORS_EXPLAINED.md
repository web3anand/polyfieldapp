# Console Errors Explained

## ✅ Harmless Errors (Can Be Ignored)

### 1. CSP Reports to Datadog
```
POST https://csp-report.browser-intake-datadoghq.com/... net::ERR_BLOCKED_BY_CLIENT
```
**What it is**: Browser extensions (ad blockers, privacy tools) blocking CSP violation reports to Datadog.  
**Impact**: None - these are just analytics reports being blocked.  
**Action**: None needed - this is expected behavior.

### 2. Wallet Extension Errors
```
Pocket Universe is running!
Backpack couldn't override `window.ethereum`.
Chrome Version Cannot read properties of null
```
**What it is**: Browser wallet extensions (MetaMask, Backpack, Pocket Universe) trying to inject into the page.  
**Impact**: None - these are just extension notifications.  
**Action**: ✅ **Automatically suppressed** - The app now filters out these harmless warnings. They're normal when multiple wallet extensions are installed.

### 3. JSON Parse Error (Privy)
```
Uncaught (in promise) SyntaxError: Unexpected token 's', "setImmedia"... is not valid JSON
```
**What it is**: Privy's embedded wallets trying to parse a response that's not JSON (likely a function name).  
**Impact**: Minimal - Privy should handle this gracefully.  
**Action**: Can be ignored unless authentication is actually broken.

## ⚠️ Action Required

### Privy Origin Mismatch
```
origins don't match http://localhost:3002 https://auth.privy.io
origins don't match https://auth.privy.io http://localhost:3002
```

**What it is**: Browser extensions and Privy iframe communication causing harmless cross-origin messages.

**Impact**: None - these are expected during authentication flow and now automatically filtered.

**Status**: ✅ **Automatically suppressed** - The app filters these harmless warnings. They occur when:
- Browser extensions inject content scripts
- Privy's authentication iframe communicates with the main page
- Multiple tabs/windows are open

**When to worry**: Only if authentication actually fails (can't log in). Otherwise, these can be safely ignored.

**For Production**: Make sure to add your production domain to Privy's allowed origins at [Privy Dashboard](https://dashboard.privy.io/).

**Note**: The app automatically detects your current origin and logs it with setup instructions on startup.

## 📊 Error Summary

| Error | Type | Action Required |
|-------|------|----------------|
| CSP Reports | Harmless | None |
| Wallet Extensions | Harmless | None |
| JSON Parse (Privy) | Minor | Monitor only |
| Origin Mismatch | **Action Required** | Add origin to Privy dashboard |

## 🔍 How to Verify

After adding the origin to Privy:
1. Clear browser cache
2. Refresh the page
3. Check console - origin mismatch errors should be gone
4. Try logging in - should work without errors

## 💡 Development Tip

If you want to suppress harmless console errors in development, you can filter them in browser DevTools:
- Chrome: Right-click console → "Hide network messages"
- Or use console filters to hide specific error types



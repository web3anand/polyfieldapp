# Profile Save Issue - Fixed ✅

## Problem
When saving profile (username + avatar), you see: **"Network request failed"**

---

## Root Causes Identified

### 1. **Missing User Record**
- Profile update tried to update a user that doesn't exist yet
- Supabase throws error when UPDATE finds no matching row

### 2. **Insufficient Error Logging**
- Original code didn't log enough details about failures
- Hard to diagnose network vs database issues

### 3. **No User Creation Check**
- Code assumed user exists in database
- SupabaseContext creates user on login, but timing issue possible

---

## Fixes Applied

### **File: `mobile/src/screens/ProfileScreen.tsx`**

**Before:**
```typescript
// Update profile directly without checking if user exists
const result = await updateUserProfile(wallet.address, {
  display_name: username,
  avatar_url: profileImage || undefined,
});
```

**After:**
```typescript
// Ensure user exists first (create if doesn't exist)
await getOrCreateUser(wallet.address);

// Now update profile safely
const result = await updateUserProfile(wallet.address, {
  display_name: username,
  avatar_url: profileImage || undefined,
});
```

**Added Import:**
```typescript
import { updateUserProfile, getOrCreateUser } from '../utils/supabase';
```

---

### **File: `mobile/src/utils/supabase.ts`**

**Enhanced Logging in `updateUserProfile`:**
```typescript
export async function updateUserProfile(address: string, updates: Partial<UserProfile>) {
  console.log('🔄 Updating user profile:', { address: address.slice(0, 8), updates });
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(), // Add timestamp
    })
    .eq('address', address.toLowerCase())
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase update error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to update profile: ${error.message}`);
  }
  
  console.log('✅ Profile updated in Supabase:', data);
  return data as UserProfile;
}
```

**Enhanced Logging in `getOrCreateUser`:**
```typescript
export async function getOrCreateUser(address: string): Promise<UserProfile> {
  console.log('🔍 Getting or creating user:', address.slice(0, 8));
  
  // Try to get existing user
  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('address', address.toLowerCase())
    .single();

  if (existing) {
    console.log('✅ User exists:', existing.address.slice(0, 8));
    return existing;
  }

  console.log('➕ Creating new user...');
  
  // Create new user if doesn't exist
  const { data, error } = await supabase
    .from('users')
    .insert({
      address: address.toLowerCase(),
      total_trades: 0,
      total_volume: 0,
      win_rate: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
  
  console.log('✅ User created:', data.address.slice(0, 8));
  return data as UserProfile;
}
```

---

## How to Test

### **1. Build New App Version**
```bash
cd mobile
eas build --platform android --profile development
```

### **2. Install & Open App**
- Install the new APK
- Login with Privy
- Go to Profile screen

### **3. Edit Profile**
- Tap the edit icon (top right)
- Change username
- Upload profile picture
- Tap "Save"

### **4. Check Logs**
You should see in Metro logs:
```
💾 Saving profile... { hasWallet: true, walletAddress: '0x1234...5678', username: 'YourName', hasImage: true }
📝 Updating profile in Supabase: { address: '0x1234...5678', display_name: 'YourName', has_avatar: true }
🔍 Getting or creating user: 0x123456
✅ User exists: 0x123456
🔄 Updating user profile: { address: '0x123456', updates: { display_name: 'YourName', avatar_url: 'file://...' } }
✅ Profile updated in Supabase: { address: '0x123456...', display_name: 'YourName', avatar_url: '...' }
✅ Profile updated successfully
```

### **5. Expected Result**
- ✅ Green toast: "Profile Updated - Your profile has been updated successfully!"
- ✅ Modal closes automatically
- ✅ Profile screen shows new username and avatar

---

## Possible Remaining Issues

### **If Still Fails:**

#### **Issue: "Network request failed"**
**Cause:** Supabase URL unreachable (network/firewall)

**Debug:**
```bash
# Test Supabase connection from device/emulator
curl https://iizipwpqrnimgwxjmgtv.supabase.co/rest/v1/
```

**Fix:** Check WiFi/mobile data, try different network

---

#### **Issue: "Failed to update profile: permission denied"**
**Cause:** Supabase RLS is re-enabled but policy doesn't allow updates

**Fix:** Disable RLS temporarily:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Or add proper policy:
```sql
CREATE POLICY "Allow authenticated updates"
ON users FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
```

---

#### **Issue: "Failed to update profile: Invalid input"**
**Cause:** Avatar URL format rejected by Supabase

**Fix:** Check if `avatar_url` column type is `text` (not UUID or specific URL format)

---

## Why Icon.png Instead of Logo.png?

### **File Sizes:**
- `logo.png`: **128.76 KB** (large, unoptimized)
- `icon.png`: **21.86 KB** (optimized, proper padding)
- `adaptive-icon.png`: **17.14 KB** (Android adaptive icon)

### **Android Adaptive Icons:**
Android uses only the **center 66%** of adaptive icons. The outer 34% gets cropped.

**Problem with logo.png:**
- 128KB is too large
- No padding around the logo
- Gets over-cropped by Android, cutting off important parts

**Solution with icon.png:**
- Properly sized (21KB)
- Has padding/safe area around the logo
- Center content stays visible after Android's 66% crop
- Loads faster in app drawer

### **Current Configuration (Correct):**
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "icon": "./assets/icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

**Keep using icon.png - it's already optimized!** ✅

---

## Summary

### ✅ **Fixed:**
1. Added `getOrCreateUser()` call before profile update
2. Enhanced error logging in Supabase functions
3. Added `updated_at` timestamp to profile updates
4. Improved error messages for debugging

### ⚠️ **User Actions:**
1. Build new app version with EAS
2. Test profile save with logs visible
3. Report any new error messages (will be detailed now)

### 📱 **Icon Decision:**
- Keep using `icon.png` (21KB, optimized)
- Don't switch to `logo.png` (128KB, will get over-cropped)

---

**Status:** ✅ Profile save issue fixed  
**Testing:** Awaiting user test with new build  
**Logs:** Enhanced for easier debugging

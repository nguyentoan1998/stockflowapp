# NitroModules Error - Fix Guide

## Error Message
```
Failed to get NitroModules
```

## Root Causes

This error typically occurs due to:
1. Missing or incompatible native module dependencies
2. Corrupted node_modules
3. Incompatible versions of react-native-mmkv or expo-secure-store
4. Build cache issues

## Solutions

### Solution 1: Clean Install (Recommended)

```bash
cd stockflowapp

# Remove node_modules and lock files
rm -rf node_modules
rm -rf package-lock.json
rm -rf ~/.npm

# Clear Expo cache
npx expo prebuild --clean

# Reinstall dependencies
npm install

# Clear and start
npx expo start --clear
```

### Solution 2: Update Dependencies

Ensure you have compatible versions:

```json
{
  "react-native-mmkv": "^4.1.0",
  "expo-secure-store": "^15.0.8",
  "expo": "^54.0.25",
  "react-native": "0.81.5"
}
```

If versions conflict, try:

```bash
npm install --save --legacy-peer-deps
```

### Solution 3: iOS Specific Fix

If on iOS, run:

```bash
cd ios
rm -rf Pods
rm -rf Podfile.lock
pod install
cd ..

npx expo start --clear
```

### Solution 4: Android Specific Fix

If on Android:

```bash
# Clear Android build cache
rm -rf android/.gradle

# Rebuild
npx expo start --android
```

### Solution 5: Downgrade MMKV (if above doesn't work)

Try an older version of react-native-mmkv:

```bash
npm uninstall react-native-mmkv
npm install react-native-mmkv@3.0.0 --save
```

Then run:
```bash
npx expo start --clear
```

### Solution 6: Use Expo Go Instead

If native modules keep causing issues, use Expo Go:

```bash
npx expo start
# Scan QR code with Expo Go app
```

## Quick Checklist

- [ ] Run `npm install` with `--legacy-peer-deps`
- [ ] Delete `node_modules` and reinstall
- [ ] Run `npx expo start --clear`
- [ ] Check versions match in package.json
- [ ] On iOS: Delete `ios/Pods` and run `pod install`
- [ ] On Android: Delete `android/.gradle` cache
- [ ] Try with older MMKV version (3.0.0)
- [ ] Use Expo Go if native build fails

## If Problem Persists

### Option 1: Skip MMKV Initially

If you need to get the app running quickly:

```javascript
// In queryClient.js, use AsyncStorage instead of MMKV
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace MMKV with AsyncStorage
const storage = AsyncStorage;
```

Then add MMKV back later.

### Option 2: Use Web Version

Test on web first (no native modules):

```bash
npx expo start --web
```

### Option 3: Reset Everything

```bash
# Nuclear option - clean everything
rm -rf node_modules package-lock.json
rm -rf ios android
rm -rf .expo

# Reinstall
npm install

# Prebuild
npx expo prebuild

# Start
npx expo start --clear
```

## Minimum Working Configuration

If you're having persistent issues, use this minimal config:

```json
{
  "dependencies": {
    "react": "19.1.0",
    "react-native": "0.81.5",
    "expo": "^54.0.25",
    "@tanstack/react-query": "^5.90.12",
    "axios": "^1.13.2",
    "@react-native-async-storage/async-storage": "2.2.0",
    "expo-secure-store": "^15.0.8"
  }
}
```

Then add MMKV after getting it working:

```bash
npm install react-native-mmkv@3.0.0
```

## Verification

Once fixed, verify with:

```javascript
// In App.js
import { mmkvStorage } from './src/utils/storage';

console.log('MMKV Test:', mmkvStorage.set('test', 'value'));
console.log('MMKV Retrieved:', mmkvStorage.getString('test'));
```

If this logs without errors, MMKV is working!

## Support

If still having issues:
1. Check React Native and Expo version compatibility
2. Review issue on: https://github.com/mrousavy/react-native-mmkv/issues
3. Try Expo managed workflow instead of bare
4. Use Expo Go for development

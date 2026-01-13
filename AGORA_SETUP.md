# Agora SDK Setup Guide

## Problem
The `react-native-agora` package requires native code and **cannot work with Expo Go**. You need to create a development build.

## Solution: Use Expo Dev Client

### Step 1: Install Dependencies
```bash
cd metll-app-frontend
npm install
```

### Step 2: Create Development Build

#### Option A: Local Build (Recommended for Testing)
```bash
# For Android
npx expo prebuild
npx expo run:android

# For iOS (Mac only)
npx expo prebuild
npx expo run:ios
```

#### Option B: EAS Build (Cloud Build)
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build development client
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

### Step 3: Install the Development Build
- **Android**: Download the APK from EAS or install from `android/app/build/outputs/apk/debug/`
- **iOS**: Install via TestFlight or Xcode

### Step 4: Start Development Server
```bash
npx expo start --dev-client
```

### Step 5: Connect to the Dev Client
- Open the development build app (not Expo Go)
- Scan the QR code or enter the URL manually
- The app will load with native modules working

## Important Notes

1. **You cannot use Expo Go** - Native modules require a custom development build
2. **First build takes time** - The initial build compiles native code (10-20 minutes)
3. **Subsequent builds are faster** - Only changed code is rebuilt
4. **Development builds expire** - Rebuild every 30 days (or use EAS Build)

## Troubleshooting

### "Agora SDK not available" Error
- Make sure you're using the development build, not Expo Go
- Rebuild the app: `npx expo run:android` or `npx expo run:ios`
- Clear cache: `npx expo start --clear`

### Build Errors
- Make sure you have Android Studio / Xcode installed
- Check that all dependencies are installed: `npm install`
- Try: `npx expo prebuild --clean`

### Audio Still Not Working
- Check backend `.env` has `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`
- Verify permissions are granted in app settings
- Check console logs for Agora initialization errors

## Alternative: Use Expo-Compatible Solution

If you want to avoid native builds, consider:
- **WebRTC via Expo**: Use `expo-av` for basic audio (limited)
- **Twilio Voice**: Has Expo support but requires backend setup
- **Socket.io + Web Audio**: Custom solution (complex)

For production-quality calls, Agora with development builds is recommended.


# Fix: "No Usable Data Found" When Scanning QR Code on iOS

## Problem
When you scan the Expo QR code with iOS Camera, you see "No usable data found" because:
- Your app uses `expo-dev-client` (required for native modules like Agora)
- iOS Camera expects Expo Go, but your app needs a **development build**
- You need to install a custom development build app first

## Solution: Build and Install Development Build

### Step 1: Build Development Build for iOS

**Option A: Local Build (Fastest, requires Mac + Xcode)**
```bash
cd metll-app-frontend
npx expo prebuild
npx expo run:ios --device
```

This will:
- Build the app with native modules
- Install it directly on your connected iPhone
- Takes 10-20 minutes first time

**Option B: EAS Build (Cloud Build, works from any computer)**
```bash
cd metll-app-frontend
npx eas-cli build --profile development --platform ios
```

Then:
1. Wait for build to complete (~20-30 minutes)
2. Download the `.ipa` file from Expo dashboard
3. Install via TestFlight or Xcode

### Step 2: Start Development Server

After building, start the dev server:
```bash
cd metll-app-frontend
npx expo start --dev-client
```

### Step 3: Connect from Development Build App

**Important:** Don't use iOS Camera app!

Instead:
1. **Open the development build app** you just installed (not Expo Go)
2. **Shake your device** or tap the menu button
3. **Tap "Enter URL manually"** or **Scan QR code** (from within the dev build app)
4. The app will connect and load your code

## Why This Happens

- ✅ **Expo Go**: Can scan QR codes from Camera app, but **cannot run native modules**
- ✅ **Development Build**: Can run native modules, but **needs to be built first**
- ❌ **Your app**: Uses `react-native-agora` → Requires development build → Cannot use Expo Go

## Quick Test

To verify your development build works:
```bash
# Start dev server
npx expo start --dev-client

# In the terminal, you'll see:
# "Metro waiting on exp://..."
# 
# Open the development build app on your phone
# It should automatically connect or show a connection screen
```

## Alternative: Use Tunnel Mode

If you're testing remotely:
```bash
npx expo start --dev-client --tunnel
```

Then share the URL manually or scan from within the dev build app.

## Troubleshooting

### "App won't connect"
- Make sure you're using the **development build app**, not Expo Go
- Check that phone and computer are on same WiFi (or use tunnel mode)
- Try manually entering the URL shown in terminal

### "Build fails"
- Make sure Xcode is installed (for local builds)
- Check Apple Developer account is set up
- Try: `npx expo prebuild --clean`

### "Still seeing 'No usable data found'"
- This is normal! iOS Camera can't open development builds
- You **must** use the development build app to scan, not Camera app

# Building iOS App for MetLL

## Important: iOS vs Android

- **APK** = Android only (won't work on iOS)
- **IPA** = iOS format (for iPhone/iPad)
- **Simulator builds** = For testing on Mac only
- **Device builds** = For installing on real iPhone/iPad

---

## Method 1: Build iOS App with EAS Build

### Prerequisites

1. **Apple Developer Account** (Required for device builds)
   - Free account: Can test on your own device
   - Paid account ($99/year): For App Store distribution
   - Sign up at: https://developer.apple.com

2. **Expo Account** (Already covered)

### Step 1: Login to Expo

```bash
cd mobile-app
npx eas-cli login
```

### Step 2: Build for iOS

**For Testing on Your iPhone (Ad Hoc Distribution):**
```bash
npx eas-cli build --platform ios --profile preview
```

**For App Store Submission:**
```bash
npx eas-cli build --platform ios --profile production
```

**Or use npm scripts:**
```bash
npm run build:ios
```

### Step 3: Download and Install

1. Build completes (~20-30 minutes)
2. Download the `.ipa` file from Expo dashboard
3. Install on iPhone using:
   - **TestFlight** (recommended for testing)
   - **Xcode** (for direct install)
   - **AltStore** or **Sideloadly** (for non-developer accounts)

---

## Method 2: Build for iOS Simulator (Mac Only)

If you want to test on iOS Simulator on your Mac:

```bash
npx eas-cli build --platform ios --profile preview --local
```

Or modify `eas.json` to include simulator builds.

---

## Method 3: Using TestFlight (Recommended for Testing)

TestFlight is Apple's official beta testing platform:

### Step 1: Build for App Store

```bash
npx eas-cli build --platform ios --profile production
```

### Step 2: Submit to TestFlight

```bash
npx eas-cli submit --platform ios
```

### Step 3: Distribute via TestFlight

1. Go to App Store Connect
2. Add testers
3. They install TestFlight app
4. They get your app for testing

---

## iOS Build Requirements

### Free Apple Developer Account
- ✅ Can build and test on your own device
- ✅ Can use TestFlight (limited to 100 testers)
- ❌ Cannot publish to App Store
- ❌ Limited to 3 apps

### Paid Apple Developer Account ($99/year)
- ✅ Everything in free account
- ✅ Publish to App Store
- ✅ Unlimited apps
- ✅ Advanced features

---

## Quick Comparison

| Platform | File Format | Install Method | Cost |
|----------|------------|----------------|------|
| **Android** | APK | Direct install | Free |
| **iOS (Device)** | IPA | TestFlight/Xcode | Free/Paid account |
| **iOS (Simulator)** | App | Xcode only | Free (Mac only) |

---

## Building for Both Platforms

Build both Android and iOS at once:

```bash
npx eas-cli build --platform all --profile preview
```

Or use the npm script:
```bash
npm run build:all
```

---

## iOS-Specific Configuration

Your `app.json` already has iOS configuration:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.metll.app"
}
```

This is all you need! EAS will handle the rest.

---

## Common iOS Build Issues

### "No Apple Developer Account"
- Sign up at https://developer.apple.com
- Free account works for testing on your device

### "Bundle Identifier already exists"
- Change `bundleIdentifier` in `app.json`
- Use something unique like `com.yourname.metll`

### "Provisioning Profile Error"
- EAS handles this automatically
- Just make sure you're logged into Apple Developer account

### "Code Signing Failed"
- Make sure you have a valid Apple Developer account
- EAS will guide you through setup

---

## Testing on iPhone Without Developer Account

If you don't have an Apple Developer account yet:

1. **Use Expo Go** (Development only):
   ```bash
   npm start
   ```
   Then scan QR code with Expo Go app on iPhone

2. **Use Simulator** (Mac only):
   ```bash
   npm run ios
   ```

3. **Get Free Developer Account**:
   - Go to https://developer.apple.com
   - Sign up with your Apple ID (free)
   - Can test on your own device

---

## Recommended Workflow

1. **Development**: Use Expo Go on both Android and iOS
2. **Testing**: Build APK for Android, build IPA for iOS
3. **Distribution**: 
   - Android: Share APK directly
   - iOS: Use TestFlight or App Store

---

## Quick Commands

```bash
# Build iOS app
cd mobile-app
npx eas-cli build --platform ios --profile preview

# Build both platforms
npx eas-cli build --platform all --profile preview

# Submit iOS to App Store
npx eas-cli submit --platform ios
```

---

## Summary

- ✅ **Android**: APK works on Android devices
- ✅ **iOS**: IPA works on iPhone/iPad (requires Apple Developer account)
- ✅ **Both**: Can build for both platforms with same codebase
- ✅ **EAS Build**: Handles iOS code signing automatically

The same codebase works for both platforms! Just build for the platform you need.


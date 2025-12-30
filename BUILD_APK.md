# Building Android APK for MetLL

This guide will help you create a downloadable APK file for Android.

## Method 1: Using EAS Build (Recommended - Cloud Build)

EAS Build is Expo's cloud-based build service. It's the easiest and most reliable method.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

Or using pnpm:
```bash
pnpm add -g eas-cli
```

### Step 2: Create Expo Account (If You Don't Have One)

**Option A: Create via Website (Recommended)**
1. Go to https://expo.dev/signup
2. Sign up with email, GitHub, or Google
3. Verify your email if required

**Option B: Create via CLI**
- When you run `npx eas-cli login`, it will prompt you to create an account

### Step 3: Login to Expo

```bash
npx eas-cli login
```

You'll be prompted to enter your email and password, or authenticate via browser.

### Step 4: Configure EAS Build

The `eas.json` file is already created. You can customize it if needed.

### Step 5: Build APK

Navigate to the mobile-app directory:
```bash
cd mobile-app
```

Build a preview APK (for testing):
```bash
eas build --platform android --profile preview
```

Or build a production APK:
```bash
eas build --platform android --profile production
```

### Step 6: Download APK

1. The build will start on Expo's servers
2. You'll get a URL to track the build progress
3. Once complete, you can download the APK from the Expo dashboard
4. The APK will be available at: https://expo.dev/accounts/[your-account]/builds

### Build Time
- First build: ~15-20 minutes
- Subsequent builds: ~10-15 minutes

---

## Method 2: Local Build (Advanced)

If you want to build locally without using EAS:

### Prerequisites
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed

### Step 1: Install Dependencies

```bash
cd mobile-app
npm install
# or
pnpm install
```

### Step 2: Generate Native Code

```bash
npx expo prebuild --platform android
```

### Step 3: Build APK Locally

```bash
cd android
./gradlew assembleRelease
```

The APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 4: Sign the APK (Optional but Recommended)

For production, you should sign your APK. Create a keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Then configure signing in `android/app/build.gradle`.

---

## Method 3: Using Expo Go (Development Only)

For quick testing, you can use Expo Go app:
1. Install Expo Go from Play Store
2. Run `npm start` or `pnpm start`
3. Scan QR code with Expo Go app

**Note:** This is for development only. For distribution, use Method 1 or 2.

---

## Troubleshooting

### Build Fails
- Check that all dependencies are installed
- Ensure `app.json` has correct Android package name
- Verify you're logged into EAS: `eas whoami`

### APK Too Large
- Use `expo-optimize` to reduce bundle size
- Enable ProGuard/R8 in Android build settings

### Permission Issues
- Ensure all required permissions are in `app.json`
- Check AndroidManifest.xml after prebuild

---

## Next Steps After Building

1. **Test the APK** on a physical device or emulator
2. **Share the APK** via:
   - Direct download link
   - Google Drive/Dropbox
   - Internal distribution
   - Play Store (requires AAB format, not APK)

3. **For Play Store**: Build an AAB instead:
   ```bash
   eas build --platform android --profile production
   ```
   Then in `eas.json`, change `buildType` to `"app-bundle"`

---

## Quick Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK
cd mobile-app
eas build --platform android --profile preview

# Check build status
eas build:list
```

---

## Important Notes

- **First build** requires setting up your Expo account
- **APK size** will be ~30-50MB for a typical React Native app
- **Build time** varies based on server load
- **Free tier** of EAS Build has limits, but sufficient for most projects

For more information, visit: https://docs.expo.dev/build/introduction/


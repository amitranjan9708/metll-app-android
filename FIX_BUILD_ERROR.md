# Fixing EAS Build Errors

Your build failed during the "Install dependencies" phase. Here are common fixes:

## Step 1: Check Build Logs

First, check the detailed logs:
1. Go to: https://expo.dev/accounts/amit97084/projects/metll-mobile/builds/27a2583a-e36f-49a5-a448-e0a41b97fc55
2. Click on the failed build
3. Check the "Install dependencies" phase logs
4. Look for specific error messages

## Common Fixes

### Fix 1: Clean Dependencies and Rebuild

```bash
cd mobile-app

# Remove node_modules and lock files
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f yarn.lock

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Try building again
npx eas-cli build --platform android --profile preview
```

### Fix 2: Check Node Version

EAS Build uses Node 18 by default. Make sure your dependencies are compatible:

```bash
# Check your local Node version
node --version

# If you're using Node 20+, you might need to specify Node 18 in eas.json
```

### Fix 3: Update eas.json with Node Version

Add Node version specification to `eas.json`:

```json
{
  "build": {
    "preview": {
      "node": "18.x.x",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Fix 4: Check for Problematic Dependencies

Some packages might cause issues. Check if you have:
- Conflicting React versions
- Missing peer dependencies
- Incompatible package versions

### Fix 5: Use Yarn Instead of npm

Sometimes switching package managers helps:

```bash
# Install yarn if you don't have it
npm install -g yarn

# Remove node_modules
rm -rf node_modules

# Install with yarn
yarn install

# Build again
npx eas-cli build --platform android --profile preview
```

### Fix 6: Check package.json for Issues

Make sure:
- All dependencies have valid versions
- No syntax errors in package.json
- Required dependencies are listed (not just devDependencies)

### Fix 7: Add .npmrc File

Create `.npmrc` in mobile-app directory:

```
legacy-peer-deps=true
```

This can help with peer dependency conflicts.

### Fix 8: Check for Missing Files

Ensure these files exist:
- `package.json` ✓
- `app.json` ✓
- `babel.config.js` ✓
- `tsconfig.json` (if using TypeScript) ✓

## Quick Diagnostic Commands

```bash
cd mobile-app

# Check for syntax errors
node -e "JSON.parse(require('fs').readFileSync('package.json'))"

# Check installed packages
npm list --depth=0

# Verify Expo SDK version
npx expo --version
```

## Most Likely Solutions

Based on the error, try these in order:

1. **Clean install** (Fix 1) - Most common solution
2. **Add .npmrc** (Fix 7) - Fixes peer dependency issues
3. **Check build logs** (Step 1) - Find the exact error

## If Build Still Fails

1. Check the detailed logs in Expo dashboard
2. Look for specific package errors
3. Try removing problematic dependencies temporarily
4. Check Expo SDK compatibility with your packages

## Alternative: Build Locally

If cloud build keeps failing, try local build:

```bash
cd mobile-app
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`


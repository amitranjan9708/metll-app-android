# Setting Up Expo Account for Building APK

## Step 1: Create Expo Account

You have two options:

### Option A: Create Account via Website (Recommended)
1. Go to https://expo.dev/signup
2. Sign up with:
   - Email and password, OR
   - GitHub account, OR
   - Google account
3. Verify your email if required

### Option B: Create Account via CLI
When you run `npx eas-cli login`, it will prompt you to create an account if you don't have one.

---

## Step 2: Login via CLI

After creating your account, login:

```bash
cd mobile-app
npx eas-cli login
```

You'll be prompted to:
1. Enter your email
2. Enter your password
3. Or open a browser to authenticate

---

## Step 3: Verify Login

Check if you're logged in:

```bash
npx eas-cli whoami
```

This will show your Expo username if you're logged in.

---

## Step 4: Build Your APK

Once logged in, you can build:

```bash
# Build preview APK (for testing)
npx eas-cli build --platform android --profile preview

# Or use the npm script
npm run build:android
```

---

## What Happens During Build

1. **First time**: EAS will ask you some questions:
   - Do you want to set up credentials? (Choose "Yes" for automatic setup)
   - Do you want to use Expo's managed workflow? (Choose "Yes")

2. **Build starts**: Your code is uploaded to Expo's servers

3. **Build progress**: You'll see a URL to track the build:
   ```
   https://expo.dev/accounts/[your-username]/builds/[build-id]
   ```

4. **Download**: Once complete (15-20 minutes), download the APK from the dashboard

---

## Free Tier Limits

The free tier includes:
- ✅ Unlimited builds
- ✅ Builds for Android and iOS
- ✅ APK and AAB formats
- ✅ Build history
- ⚠️ Builds may be queued during peak times

This is more than enough for development and testing!

---

## Quick Start Commands

```bash
# 1. Navigate to mobile-app directory
cd mobile-app

# 2. Login (will prompt to create account if needed)
npx eas-cli login

# 3. Verify login
npx eas-cli whoami

# 4. Build APK
npx eas-cli build --platform android --profile preview

# 5. Check build status
npx eas-cli build:list
```

---

## Troubleshooting

### "You are not logged in"
- Run `npx eas-cli login` again
- Make sure you've verified your email

### "Account not found"
- Double-check your email/password
- Try resetting password at https://expo.dev/forgot-password

### Build fails
- Check that `app.json` has correct package name
- Ensure all dependencies are installed: `npm install`
- Check the build logs in the Expo dashboard

---

## Next Steps After Account Creation

1. ✅ Create account at https://expo.dev/signup
2. ✅ Login: `npx eas-cli login`
3. ✅ Build APK: `npx eas-cli build --platform android --profile preview`
4. ✅ Download APK from Expo dashboard
5. ✅ Install on Android device and test!

That's it! The account creation is free and takes less than 2 minutes.


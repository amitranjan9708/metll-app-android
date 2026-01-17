# Solutions Without Building (or Build Once Only)

## Problem
iOS blocks installing external apps, but you need to test your app with native modules (Agora calling).

## Solution 1: Use Tunnel Mode + Manual URL Entry (No Build Needed!)

**This is the easiest - no build required!**

```bash
cd metll-app-frontend
npx expo start --dev-client --tunnel
```

Then:
1. **Copy the URL** shown in terminal (looks like `exp://u.expo.dev/...`)
2. **Open Expo Go app** on your iPhone (yes, Expo Go!)
3. **Tap "Enter URL manually"** at the bottom
4. **Paste the URL** and connect

**Note:** This works with Expo Go, but calling features won't work (Agora requires dev build). Everything else will work fine!

---

## Solution 2: Build Once with EAS (Free, Install via Link)

**You only build ONCE, then install via link (no App Store needed):**

### Step 1: Build Development Build (One Time)
```bash
cd metll-app-frontend
npx eas-cli build --profile development --platform ios
```

This takes ~20-30 minutes, but you only do it once.

### Step 2: Install via Link (No App Store!)
After build completes:
1. Expo will give you a **download link**
2. Open the link on your iPhone
3. Tap "Install" - iOS will allow it (development builds are allowed)
4. Trust the developer in Settings → General → Device Management

### Step 3: Use It Forever
After installing once:
```bash
npx expo start --dev-client
```

Then:
- Open the **development build app** (not Expo Go)
- Scan QR code or enter URL manually
- Works with all native modules including Agora!

**You only build once, then use it for months!**

---

## Solution 3: Use TestFlight (Free, Still Requires One Build)

1. Build once: `npx eas-cli build --profile preview --platform ios`
2. Submit to TestFlight (free, no App Store review needed)
3. Install via TestFlight app (Apple's official beta testing)
4. Use for 90 days, then rebuild

---

## Solution 4: Test Without Calling Features (Use Expo Go)

If you just want to test UI/features without calling:

### Temporarily Remove Native Modules
```bash
# Comment out Agora imports in your code
# Then use Expo Go normally:
npx expo start
# Scan QR code with iOS Camera - works!
```

**Note:** Calling won't work, but everything else will.

---

## Recommended: Solution 2 (Build Once)

**Why this is best:**
- ✅ Build once, use for months
- ✅ All features work (including calling)
- ✅ Install via link (no App Store)
- ✅ Free (uses Expo's free tier)
- ✅ Can scan QR codes normally after first install

**The build is a one-time setup, not something you do every time!**

---

## Quick Comparison

| Solution | Build Required? | Calling Works? | QR Code Works? |
|----------|----------------|----------------|----------------|
| Tunnel + Manual URL | ❌ No | ❌ No (Expo Go) | ❌ No (manual entry) |
| EAS Dev Build (once) | ✅ Once | ✅ Yes | ✅ Yes |
| TestFlight | ✅ Once | ✅ Yes | ✅ Yes |
| Remove Native Modules | ❌ No | ❌ No | ✅ Yes |

---

## My Recommendation

**Use Solution 2** - Build once with EAS development profile:
1. Takes 20-30 minutes one time
2. Install via link (no App Store restrictions)
3. Then you can scan QR codes normally forever
4. All features work including calling

The "iOS blocks external apps" only applies to random APKs. EAS development builds are signed and can be installed via link - Apple allows this for development purposes.

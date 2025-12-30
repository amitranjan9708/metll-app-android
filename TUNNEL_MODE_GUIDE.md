# How to Use Tunnel Mode

## What is Tunnel Mode?

Tunnel mode uses Expo's servers to create a connection between your phone and computer. This means:
- ✅ Works even if your phone and computer are on different networks
- ✅ Works through firewalls and VPNs
- ✅ More reliable for testing on physical devices
- ⚠️ Slightly slower than LAN mode (but usually fine)

## Quick Start

### Method 1: Using npm script (Easiest)

```bash
cd mobile-app
npm run start:tunnel
```

### Method 2: Using npx directly

```bash
cd mobile-app
npx expo start --tunnel
```

### Method 3: Clear cache and start tunnel

If you're having issues, clear cache first:

```bash
cd mobile-app
npm run start:tunnel:clear
```

Or manually:
```bash
cd mobile-app
npx expo start --tunnel --clear
```

## Step-by-Step Instructions

1. **Navigate to your project:**
   ```bash
   cd mobile-app
   ```

2. **Start Expo in tunnel mode:**
   ```bash
   npm run start:tunnel
   ```
   
   Or:
   ```bash
   npx expo start --tunnel
   ```

3. **Wait for the QR code to appear:**
   - You'll see a message like: "Tunnel ready"
   - A QR code will appear in your terminal
   - The URL will show `exp://` or `https://exp.host/...`

4. **Scan the QR code:**
   - **Android**: Open Expo Go app → Tap "Scan QR code"
   - **iOS**: Use Camera app to scan (it will open Expo Go automatically)

5. **Wait for the app to load:**
   - First time may take 30-60 seconds
   - You'll see "Building JavaScript bundle" in Expo Go

## Troubleshooting Tunnel Mode

### Issue: "ngrok not found" or "Tunnel connection failed"

**Solution:** Install ngrok (required for tunnel mode)

```bash
# Install ngrok globally
npm install -g ngrok

# Or using Homebrew (macOS)
brew install ngrok
```

Then try again:
```bash
npm run start:tunnel
```

### Issue: "Tunnel timeout" or "Connection lost"

**Solutions:**
1. **Check your internet connection** - Tunnel mode requires stable internet
2. **Try clearing cache:**
   ```bash
   npm run start:tunnel:clear
   ```
3. **Restart Expo:**
   - Stop the server (Ctrl+C)
   - Start again: `npm run start:tunnel`

### Issue: Still not connecting

**Try these alternatives:**

1. **Use LAN mode instead** (if on same network):
   ```bash
   npm start
   ```

2. **Use USB connection** (Android only):
   ```bash
   # Enable USB debugging on your phone
   # Connect via USB
   npm start
   # Then press 'a' in terminal
   ```

3. **Check firewall settings:**
   - Make sure your firewall isn't blocking Expo
   - Tunnel mode should work through firewalls, but check if needed

## Comparison: Tunnel vs LAN Mode

| Feature | Tunnel Mode | LAN Mode |
|---------|-------------|----------|
| **Network** | Works on different networks | Same WiFi required |
| **Speed** | Slightly slower | Faster |
| **Reliability** | Very reliable | Can have issues with some routers |
| **Setup** | Requires ngrok | No extra setup |
| **Use Case** | Testing on physical devices, different networks | Local development, same network |

## When to Use Tunnel Mode

✅ **Use tunnel mode when:**
- Your phone and computer are on different networks
- LAN mode isn't working
- You're testing on a physical device away from your computer
- You're behind a firewall or VPN

❌ **Use LAN mode when:**
- Both devices are on the same WiFi
- You want faster reload times
- You're doing local development

## Available Scripts

I've added these scripts to `package.json`:

- `npm start` - Normal mode (LAN)
- `npm run start:tunnel` - Tunnel mode
- `npm run start:clear` - Normal mode with cleared cache
- `npm run start:tunnel:clear` - Tunnel mode with cleared cache

## Tips

1. **First time setup:** Tunnel mode may ask you to sign in to Expo account (free)
2. **Faster reloads:** After initial load, hot reload works quickly
3. **Multiple devices:** You can scan the same QR code on multiple devices
4. **Save the URL:** The tunnel URL stays the same during your session

## Need Help?

If tunnel mode still doesn't work:
1. Check the terminal for error messages
2. Make sure ngrok is installed: `ngrok version`
3. Try LAN mode if on same network: `npm start`
4. Check Expo Go app version (update if needed)


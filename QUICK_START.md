# Quick Start - Skip Tunnel Mode

## 🎯 Easiest Way: Use LAN Mode

**If your phone and computer are on the same WiFi network:**

```bash
cd mobile-app
npm start
```

Then:
1. Open Expo Go app on your phone
2. Scan the QR code that appears
3. Done! ✅

**No ngrok, no tunnel mode, no extra setup needed!**

---

## When You Need Tunnel Mode

Only use tunnel mode if:
- ❌ Phone and computer are on different WiFi networks
- ❌ LAN mode isn't working
- ❌ You're testing away from your computer

**Otherwise, just use `npm start` (LAN mode) - it's simpler and faster!**

---

## Current Issue

You're getting an npm permission error. To fix it for tunnel mode:

1. **Fix npm permissions** (see FIX_NGROK.md)
2. **Or use LAN mode** (recommended if on same network)

---

## Troubleshooting LAN Mode

If LAN mode doesn't work:

1. **Check WiFi**: Make sure both devices are on the same network
2. **Check firewall**: Temporarily disable firewall to test
3. **Try different network**: Some routers block local connections
4. **Use USB** (Android only):
   ```bash
   # Enable USB debugging on phone
   # Connect via USB
   npm start
   # Press 'a' in terminal
   ```


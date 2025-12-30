# Troubleshooting Guide

## QR Code Scan Issues on Android

### Issue: "Something went wrong" when scanning QR code

**Common Causes & Solutions:**

1. **Missing Assets (FIXED)**
   - ✅ Assets are now optional in app.json
   - The app will work without icon/splash images

2. **Network Connection**
   - Make sure your phone and computer are on the same WiFi network
   - Try using tunnel mode: `expo start --tunnel`
   - Or use LAN mode: `expo start --lan`

3. **Expo Go Version**
   - Update Expo Go app to the latest version
   - Uninstall and reinstall Expo Go if needed

4. **Clear Cache**
   ```bash
   cd mobile-app
   npm start -- --clear
   ```

5. **Check Terminal for Errors**
   - Look at the terminal where `npm start` is running
   - Check for any red error messages
   - Common errors:
     - Module not found
     - Syntax errors
     - Missing dependencies

6. **Restart Everything**
   ```bash
   # Stop the server (Ctrl+C)
   # Clear cache and restart
   cd mobile-app
   rm -rf node_modules/.cache
   npm start -- --clear
   ```

7. **Check Device Logs**
   - In Expo Go, shake your device
   - Select "Show Dev Menu"
   - Check "Show Error" or "Show Logs"

8. **Try Tunnel Mode**
   ```bash
   cd mobile-app
   npx expo start --tunnel
   ```
   This uses Expo's servers to connect, works even on different networks

9. **Verify Dependencies**
   ```bash
   cd mobile-app
   rm -rf node_modules
   npm install
   npm start
   ```

10. **Check App Entry Point**
    - Verify `package.json` has: `"main": "node_modules/expo/AppEntry.js"`
    - Verify `App.tsx` exists and exports default component

## Common Runtime Errors

### "Unable to resolve module"
- Clear cache: `npm start -- --clear`
- Reinstall: `rm -rf node_modules && npm install`

### "Cannot read property of undefined"
- Check if all context providers are properly set up
- Verify imports are correct

### Navigation errors
- Make sure `react-native-screens` and `react-native-gesture-handler` are installed
- Check that navigation is wrapped in NavigationContainer

## Still Not Working?

1. **Check the exact error message** in:
   - Terminal output
   - Expo Go error screen (shake device → Show Error)
   - Device logs

2. **Try on iOS** to see if it's Android-specific

3. **Check Expo SDK version compatibility**
   - Current: Expo SDK 51
   - Make sure all packages are compatible

4. **Create a minimal test**
   - Temporarily simplify App.tsx to just return a View with Text
   - If that works, the issue is in your code
   - If that fails, it's a setup issue


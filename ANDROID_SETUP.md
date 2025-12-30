# Android Studio Setup Guide for MetLL Mobile App

## Step 1: Install Android Studio

1. **Download Android Studio:**
   - Visit: https://developer.android.com/studio
   - Download for macOS
   - Install the .dmg file

2. **Install Android Studio:**
   - Open the downloaded .dmg
   - Drag Android Studio to Applications
   - Launch Android Studio

3. **First Time Setup:**
   - Choose "Standard" installation
   - Let it download Android SDK components (this may take a while)
   - Accept all licenses when prompted

## Step 2: Install Android SDK Components

1. **Open SDK Manager:**
   - In Android Studio: `Tools` → `SDK Manager`
   - Or: `Android Studio` → `Preferences` → `Appearance & Behavior` → `System Settings` → `Android SDK`

2. **Install Required Components:**
   - **SDK Platforms Tab:**
     - Check "Android 13.0 (Tiramisu)" or latest
     - Check "Android 12.0 (S)" 
     - Check "Show Package Details" and install "Google APIs"
   
   - **SDK Tools Tab:**
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android SDK Platform-Tools
     - Android Emulator
     - Google Play services
     - Intel x86 Emulator Accelerator (HAXM installer) - for better performance

3. **Click "Apply"** and let it install

## Step 3: Create Android Virtual Device (AVD)

1. **Open AVD Manager:**
   - In Android Studio: `Tools` → `AVD Manager`
   - Or click the device icon in the toolbar

2. **Create Virtual Device:**
   - Click "Create Virtual Device"
   - Choose a device (e.g., "Pixel 5")
   - Click "Next"
   - Select a system image (e.g., "Tiramisu" API 33)
   - Click "Download" if needed, then "Next"
   - Click "Finish"

## Step 4: Set Environment Variables

Add these to your `~/.zshrc` file:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

## Step 5: Verify Installation

Run these commands to verify:

```bash
# Check Android SDK path
echo $ANDROID_HOME

# Check adb (Android Debug Bridge)
adb version

# List available emulators
emulator -list-avds
```

## Step 6: Test with Expo

1. **Start Android Emulator:**
   - Open Android Studio
   - Go to `Tools` → `AVD Manager`
   - Click the ▶️ play button next to your device

2. **Or start from terminal:**
   ```bash
   emulator -avd <your_avd_name>
   ```

3. **Run Expo:**
   ```bash
   cd mobile-app
   npm start
   # Then press 'a' to open on Android
   ```

## Troubleshooting

### Issue: "adb: command not found"
- Make sure you've added Android SDK to PATH
- Restart terminal after adding to ~/.zshrc
- Run: `source ~/.zshrc`

### Issue: "ANDROID_HOME not set"
- Verify Android SDK location: Usually `~/Library/Android/sdk`
- Check in Android Studio: `Preferences` → `Appearance & Behavior` → `System Settings` → `Android SDK`
- Update the path in ~/.zshrc if different

### Issue: Emulator is slow
- Enable HAXM (Intel) or Hypervisor (Apple Silicon)
- In AVD Manager, edit device → Show Advanced Settings → Graphics: "Hardware - GLES 2.0"

### Issue: "HAXM not installed" (Intel Macs)
- Download from: https://github.com/intel/haxm/releases
- Or install via Android Studio SDK Manager

## Quick Commands Reference

```bash
# List all emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_33

# Check if emulator is running
adb devices

# Restart adb server
adb kill-server
adb start-server
```


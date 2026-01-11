#!/bin/bash

# Simple log viewer - shows all errors and crashes
# Works even if you don't have the app package name

echo "🔍 Viewing Android Error Logs"
echo "=============================="
echo ""

# Find adb
if command -v adb &> /dev/null; then
    ADB="adb"
elif [ -f "$HOME/Library/Android/sdk/platform-tools/adb" ]; then
    ADB="$HOME/Library/Android/sdk/platform-tools/adb"
elif [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
    ADB="$ANDROID_HOME/platform-tools/adb"
else
    echo "Install Android platform-tools first:"
    echo "brew install --cask android-platform-tools"
    exit 1
fi

# Check device
if ! $ADB devices | grep -q "device$"; then
    echo "Connect your Android device and enable USB debugging"
    $ADB devices
    exit 1
fi

echo "Showing errors and crashes (Ctrl+C to stop)..."
echo ""

# Clear and show filtered logs
$ADB logcat -c
$ADB logcat *:E AndroidRuntime:E *:F | grep -v "chatty"





#!/bin/bash

# Local APK Build Script
# This builds the APK completely offline on your machine

set -e

# Set production API URL
export EXPO_PUBLIC_API_URL="https://metll-backend-1.onrender.com/api"

echo "🔨 Building APK Locally (Offline)"
echo "=================================="
echo "🌐 API URL: $EXPO_PUBLIC_API_URL"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the mobile-app directory."
    exit 1
fi

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check for Java
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install JDK 17 or higher."
    echo "   Install via: brew install openjdk@17"
    exit 1
fi
echo "✅ Java found: $(java -version 2>&1 | head -n 1)"

# Check for Android SDK
if [ -z "$ANDROID_HOME" ] && [ ! -d "$HOME/Library/Android/sdk" ]; then
    echo "⚠️  ANDROID_HOME not set. Checking default location..."
    if [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        echo "✅ Found Android SDK at: $ANDROID_HOME"
    else
        echo "❌ Android SDK not found. Please install Android Studio."
        echo "   Download from: https://developer.android.com/studio"
        exit 1
    fi
else
    if [ -z "$ANDROID_HOME" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
    fi
    echo "✅ Android SDK found at: $ANDROID_HOME"
fi

# Check for Gradle (will be in android folder after prebuild)
echo "✅ Prerequisites check complete"
echo ""

# Step 2: Install dependencies
echo "📦 Installing npm dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 3: Generate native Android code
echo "🔧 Generating native Android code..."
if [ -d "android" ]; then
    echo "⚠️  Android folder exists. Removing it to regenerate..."
    rm -rf android
fi

npx expo prebuild --platform android --clean
echo "✅ Native code generated"
echo ""

# Step 4: Create local.properties file for Gradle
echo "📝 Creating local.properties file..."
cd android

# Create local.properties with SDK location
if [ -z "$ANDROID_HOME" ]; then
    ANDROID_HOME="$HOME/Library/Android/sdk"
fi

echo "sdk.dir=$ANDROID_HOME" > local.properties
echo "✅ Created local.properties with SDK location: $ANDROID_HOME"
echo ""

# Step 5: Build APK
echo "🏗️  Building APK (this may take 5-10 minutes)..."

# Make gradlew executable
chmod +x gradlew

# Build release APK
./gradlew assembleRelease

cd ..

# Step 6: Find and display APK location
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ APK built successfully!"
    echo "📱 APK Location: $APK_PATH"
    echo "📦 APK Size: $APK_SIZE"
    echo ""
    echo "To install on Android device:"
    echo "1. Transfer the APK to your Android device"
    echo "2. Enable 'Install from Unknown Sources' in Settings"
    echo "3. Tap the APK file to install"
    echo ""
    
    # Try to open the folder
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open android/app/build/outputs/apk/release/
    fi
else
    echo "❌ APK not found at expected location: $APK_PATH"
    exit 1
fi


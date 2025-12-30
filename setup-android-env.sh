#!/bin/bash

# Android Studio Environment Setup Script
# Run this after installing Android Studio

echo "🔧 Setting up Android SDK environment variables..."

# Check if Android SDK exists
ANDROID_SDK_PATH="$HOME/Library/Android/sdk"

if [ ! -d "$ANDROID_SDK_PATH" ]; then
    echo "❌ Android SDK not found at $ANDROID_SDK_PATH"
    echo ""
    echo "Please:"
    echo "1. Install Android Studio from https://developer.android.com/studio"
    echo "2. Open Android Studio and complete the setup wizard"
    echo "3. Go to Tools → SDK Manager and install Android SDK"
    echo "4. Run this script again"
    exit 1
fi

echo "✅ Android SDK found at $ANDROID_SDK_PATH"

# Check if already configured
if grep -q "ANDROID_HOME" ~/.zshrc 2>/dev/null; then
    echo "⚠️  Android environment variables already exist in ~/.zshrc"
    echo "Would you like to update them? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Skipping configuration..."
        exit 0
    fi
    # Remove old Android config
    sed -i.bak '/# Android SDK configuration/,/export PATH=\$PATH:\$ANDROID_HOME\/tools\/bin/d' ~/.zshrc
fi

# Add Android SDK configuration to ~/.zshrc
echo "" >> ~/.zshrc
echo "# Android SDK configuration" >> ~/.zshrc
echo "export ANDROID_HOME=\$HOME/Library/Android/sdk" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> ~/.zshrc

echo "✅ Android SDK environment variables added to ~/.zshrc"
echo ""
echo "📝 Next steps:"
echo "1. Reload your shell: source ~/.zshrc"
echo "2. Verify installation: adb version"
echo "3. Start Android emulator from Android Studio"
echo "4. Run: cd mobile-app && npm start"
echo "5. Press 'a' to open on Android emulator"


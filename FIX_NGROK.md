# Fixing ngrok Installation Error

## The Problem
Expo is trying to install `@expo/ngrok` globally but failing due to permission issues with npm.

## ⚡ Quick Fix: Use LAN Mode Instead

**If your phone and computer are on the same WiFi, use LAN mode (no ngrok needed):**

```bash
cd mobile-app
npm start
```

Then scan the QR code with Expo Go. This works without any additional setup!

---

## Solutions for Tunnel Mode (If Needed)

### Solution 1: Fix npm Permissions First

Your npm has permission issues. Fix them first:

```bash
# Create a directory for global packages
mkdir -p ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your PATH (add this to ~/.zshrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Verify it worked
npm config get prefix
# Should show: /Users/amitranjan/.npm-global

# Now try installing ngrok
npm install -g @expo/ngrok
```

Then try tunnel mode:
```bash
cd mobile-app
npm run start:tunnel
```

### Solution 2: Fix npm Permissions

If you want to install globally, fix npm permissions:

```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your PATH (add this to ~/.zshrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Now try installing
npm install -g @expo/ngrok
```

### Solution 3: Use sudo (Not Recommended, but works)

```bash
sudo npm install -g @expo/ngrok
```

⚠️ **Warning:** Using sudo with npm can cause security issues. Only use if other methods don't work.

### Solution 4: Use LAN Mode Instead

If tunnel mode keeps failing, use LAN mode (works if phone and computer are on same WiFi):

```bash
cd mobile-app
npm start
```

Then make sure your phone is on the same WiFi network and scan the QR code.

### Solution 5: Install ngrok via Homebrew (Alternative)

```bash
# Install ngrok via Homebrew
brew install ngrok

# Then try tunnel mode
cd mobile-app
npm run start:tunnel
```

## Quick Fix (Recommended)

Run these commands:

```bash
cd mobile-app
npm install @expo/ngrok --save-dev
npm run start:tunnel
```

This installs ngrok locally in your project, avoiding permission issues.


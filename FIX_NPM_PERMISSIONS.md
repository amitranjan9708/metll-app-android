# Fixing npm Permission Issues

You're getting a permission error when trying to install EAS CLI globally. Here are several solutions:

## Solution 1: Use npx (No Installation Needed) ✅ RECOMMENDED

You don't need to install EAS CLI globally! Just use `npx`:

```bash
cd mobile-app
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Or use the npm scripts I've added:
```bash
npm run build:android
```

This is the easiest and doesn't require any permission changes.

---

## Solution 2: Fix npm Permissions (Proper Way)

### Option A: Change npm's default directory

```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your PATH (add this to ~/.zshrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc

# Reload your shell
source ~/.zshrc

# Now install EAS CLI
npm install -g eas-cli
```

### Option B: Use Homebrew to install Node (if you have Homebrew)

```bash
brew install node
npm install -g eas-cli
```

---

## Solution 3: Use pnpm (Alternative Package Manager)

pnpm handles permissions better:

```bash
# Install pnpm
npm install -g pnpm

# Install EAS CLI
pnpm add -g eas-cli
```

---

## Solution 4: Use sudo (Quick but Not Recommended)

```bash
sudo npm install -g eas-cli
```

⚠️ **Warning**: Using sudo can cause other permission issues later. Only use if other methods don't work.

---

## Recommended: Just Use npx

The easiest solution is to **not install globally** and use `npx` instead:

```bash
# Login (first time only)
cd mobile-app
npx eas-cli login

# Build APK
npx eas-cli build --platform android --profile preview

# Or use the npm script
npm run build:android
```

This works exactly the same way but doesn't require global installation!

---

## Quick Start (Using npx)

```bash
cd mobile-app

# 1. Login to Expo
npx eas-cli login

# 2. Build APK
npx eas-cli build --platform android --profile preview

# 3. Check build status
npx eas-cli build:list
```

That's it! No permission issues, no global installs needed.


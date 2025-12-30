# MetLL Mobile App - Setup Guide

## Quick Start

1. **Install dependencies:**
```bash
cd mobile-app
npm install
# or
pnpm install
```

2. **Start the development server:**
```bash
npm start
# or
expo start
```

3. **Run on your device:**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Physical Device**: Install Expo Go app and scan the QR code

## Features Implemented

### ✅ Registration Flow
- Name, Email, Phone input
- OTP verification (use `1111` for testing)
- Navigation to onboarding after verification

### ✅ Onboarding Flow
- Photo upload (camera or gallery)
- School details (name, location, city, state, class, section - optional)
- College details (name, department, location)
- Office details (name, location, department, designation)
- Home location (current and past - optional)
- At least one of school/college/office required
- Progress indicator

### ✅ Main App Features
- **Home Screen**: Confession type selection (school/college/office/home)
- **Confession Flow**: 
  - Enter crush details based on type
  - Search for matching people
  - Show photos for confirmation
  - Save confession (with or without selection)
- **Live Matching**: 
  - Location-based matching (100m radius)
  - Map view with nearby people
  - Tap to confess in real-time
- **Settings**: Profile view, logout, app settings

## Theme

The app uses the exact same theme as the landing page:
- **Primary**: #5A6FA3
- **Primary Light**: #A4B8E7  
- **Text**: #311717
- **Background**: #A4B8E7
- **White**: #FFFFFF

## Mock Data

- **OTP**: Use `1111` for testing
- **Matching Users**: Mocked with sample data
- **Confessions**: Stored locally (will need backend integration)
- **Location**: Uses Expo Location API

## Project Structure

```
mobile-app/
├── App.tsx                 # Main entry point
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── OTPInput.tsx
│   │   ├── ImagePicker.tsx
│   │   └── Card.tsx
│   ├── screens/            # App screens
│   │   ├── RegisterScreen.tsx
│   │   ├── OTPScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LiveMatchingScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/         # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── context/            # React Context
│   │   └── AuthContext.tsx
│   ├── theme/              # Theme configuration
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   └── types/              # TypeScript types
│       └── index.ts
└── assets/                 # Images and assets
```

## Next Steps

1. **Install dependencies** and test the app
2. **Add assets**: Create icon.png, splash.png, etc.
3. **Backend Integration**: Connect to your API
4. **Real OTP**: Integrate with SMS service
5. **Real Matching**: Connect to backend matching algorithm
6. **Push Notifications**: Add notification support
7. **Image Upload**: Connect to image storage service

## Testing

- Registration: Enter any name, email, and phone
- OTP: Enter `1111` to proceed
- Onboarding: Complete at least one section (school/college/office)
- Confession: Test all confession types
- Live Matching: Enable location permission to see mock nearby people

## Notes

- All data is currently mocked and stored locally
- Location permissions required for live matching
- Camera/gallery permissions required for photo upload
- The app follows the same design language as the landing page


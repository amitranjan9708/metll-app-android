# MetLL Mobile App

React Native Expo mobile application for MetLL - an anonymous confession and matching dating app.

## Features

- User Registration with OTP verification (mock OTP: 1111)
- Comprehensive Onboarding (photo, school/college/office details, home location)
- Confession Flow (school/college/office/home based)
- Live Matching (location-based real-time matching)
- User Settings & Profile Management

## Setup

1. Install dependencies:
```bash
cd mobile-app
npm install
# or
pnpm install
```

2. Start the development server:
```bash
npm start
# or
expo start
```

3. Run on device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
mobile-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # App screens
│   ├── navigation/    # Navigation setup
│   ├── context/        # React Context (Auth)
│   ├── theme/          # Theme configuration
│   └── types/          # TypeScript types
├── App.tsx            # Main app entry point
├── app.json           # Expo configuration
└── package.json       # Dependencies
```

## Theme

The app uses the same theme as the landing page:
- Primary: #5A6FA3
- Primary Light: #A4B8E7
- Text: #311717
- Background: #A4B8E7

## Testing

- OTP Code: Use `1111` for testing
- All confessions are mocked and stored locally
- Location permissions required for live matching

## Platform Support

- iOS
- Android


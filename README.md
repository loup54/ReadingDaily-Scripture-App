# ReadingDaily Scripture App

A Catholic liturgical readings app built with React Native and Expo, featuring daily USCCB readings, AI-powered pronunciation practice, word-level highlighting, and multi-language support.

## 📱 Features

### Core Features
- **Daily Catholic Readings**: Automatically scraped from USCCB (28-day window)
- **Push Notifications**: Daily reading reminders at customizable times
- **Audio Playback**: Text-to-speech with synchronized word-level highlighting
- **Pronunciation Practice**: AI-powered feedback using Azure Speech Services
- **Word Translation**: Tap any word for instant translation (18 languages)
- **Progress Tracking**: Streaks, badges, and reading history
- **Onboarding Tutorial**: First-time user walkthrough of key features
- **Offline Mode**: Download readings for offline access
- **Dark Mode**: Full dark mode support with theme customization

### Languages Supported
English, Spanish, French, German, Italian, Portuguese, Russian, Chinese (Simplified & Traditional), Japanese, Korean, Arabic, Hindi, Vietnamese, Thai, Polish, Dutch, Turkish

## 🚀 Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Firebase Cloud Functions (TypeScript)
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe, Apple IAP, Google Play Billing
- **AI Services**:
  - Azure Speech (Pronunciation Assessment)
  - Google Cloud TTS (Audio Generation)
  - Google Cloud Speech-to-Text (Transcription)

## 📦 Project Structure

```
ReadingDaily-Scripture-App/
├── app/                    # Expo Router app directory
├── src/
│   ├── components/        # Reusable components
│   ├── screens/          # Screen components
│   ├── services/         # Business logic & API services
│   ├── stores/           # Zustand state management
│   ├── hooks/            # Custom React hooks
│   ├── constants/        # Colors, typography, spacing
│   ├── types/            # TypeScript type definitions
│   └── locales/          # i18n translation files
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   │   ├── readingScrapers.ts   # USCCB scraper functions
│   │   ├── highlighting.ts      # Word-level audio timing
│   │   ├── scheduledTasks.ts    # Cron jobs
│   │   └── scrapers/           # Reading scraper modules
└── assets/               # Images, fonts, legal docs
```

## 🛠 Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- EAS CLI (for builds)
- Firebase CLI
- Xcode (for iOS development)

### Environment Variables

Create `.env` file with:

```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Azure Speech
EXPO_PUBLIC_AZURE_SPEECH_KEY=
EXPO_PUBLIC_AZURE_SPEECH_REGION=

# Google Cloud
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# IAP Product IDs
EXPO_PUBLIC_APPLE_IAP_PRODUCT_ID=
EXPO_PUBLIC_GOOGLE_PLAY_PRODUCT_ID=
```

### Installation

```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android
npx expo run:android
```

### Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 🔧 Development

### Key Commands

```bash
# Development
npx expo start                    # Start Metro bundler
npx expo run:ios                  # Build and run on iOS
npx expo run:android              # Build and run on Android

# TypeScript
npx tsc --noEmit                  # Type check

# Building
eas build --platform ios          # Build for iOS
eas build --platform android      # Build for Android

# Cloud Functions
cd functions
npm run build                     # Compile TypeScript
firebase deploy                   # Deploy all functions
firebase functions:log            # View logs
```

### Testing

```bash
# Run tests
npm test

# Test pronunciation practice
# Note: Requires physical device (iOS simulator cannot record audio)
npx expo run:ios --device
```

## 📚 Cloud Functions

### Deployed Functions

1. **Reading Scrapers**
   - `scheduledReadingScraper`: Daily scrape at 1 AM UTC (28-day window)
   - `manualReadingScrape`: Manual trigger endpoint
   - `usccbHealthCheck`: Scraper health monitoring

2. **Audio Highlighting**
   - `synthesizeReading`: Generate TTS audio with word timing
   - `highlightingHealthCheck`: Service health check

3. **Scheduled Tasks**
   - `scheduledDailySynthesis`: Daily audio generation
   - `scheduledWeeklyCatchup`: Weekly backfill

## 🎯 Current Status (2026-01-12)

### ✅ Completed
- [x] USCCB Reading Scraper deployed to Firebase
- [x] Firestore populated with 28 days of readings
- [x] Pronunciation practice microphone permission fix
- [x] Sign-in functionality working
- [x] Reading display with highlighting
- [x] Cloud Functions tested and operational
- [x] Onboarding tutorial for new users
- [x] Push notifications for daily reminders
- [x] Build 75 deployed to TestFlight (6 testers)

### 🔄 In Progress
- [ ] iOS tester feedback collection
- [ ] Performance optimization (bundle size, image caching)

### 📋 Upcoming
- [ ] Android/Google Play Store deployment
- [ ] Production App Store submission
- [ ] Multi-language scraper support

## 📖 Documentation

- [Firebase Deployment Guide](FIREBASE_DEPLOYMENT_GUIDE.md)
- [Cloud Functions Guide](CLOUD_FUNCTIONS_GUIDE.md)
- [Project Status](current-status.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contributing

This is a personal project currently not accepting external contributions.

## 📄 License

Copyright © 2025 OurEng Ltd. All rights reserved.

## 🔗 Links

- Website: https://www.ourengltd.best
- App Store: [Coming Soon]
- Privacy Policy: See `src/assets/legal-documents/privacy-policy.md`
- Terms of Service: See `src/assets/legal-documents/terms-of-service.md`

## 🐛 Known Issues

- Pronunciation practice requires physical device testing (iOS Simulator cannot record audio)
- USCCB scraper limited to English readings only
- Multi-mass solemnities (Christmas, Easter) use Day Mass by default

## 🎨 Design

- **Brand Colors**: Purple gradient primary (#6B46C1 → #9333EA)
- **Typography**: System fonts with careful hierarchy
- **Icons**: Ionicons from Expo
- **Theme**: Light/Dark mode support

---

**Developed by OurEng Ltd** | www.ourengltd.best

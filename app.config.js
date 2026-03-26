const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  expo: {
    name: "ReadingDaily Scripture App",
    slug: "readingdaily-scripture-app",
    scheme: "readingdaily",
    version: "1.1.31",
    runtimeVersion: "1.1.31",
    updates: {
      url: "https://u.expo.dev/0c4f39f5-184d-4af5-8dca-2cc4d52675e6",
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0
    },
    icon: "./assets/icon.png",
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#7C3AED"
    },
    ios: {
      bundleIdentifier: "com.readingdaily.scripture",
      buildNumber: "158",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#7C3AED"
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription: "This app needs microphone access to practice pronunciation of sacred scripture readings.",
        NSUserNotificationsUsageDescription: "This app needs permission to send you daily reading reminders to help you maintain your spiritual practice."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#7C3AED"
      },
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#7C3AED"
      },
      package: "com.readingdaily.scripture",
      versionCode: 25,
      permissions: ["android.permission.RECORD_AUDIO"]
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1",
            flipper: false
          },
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            useNextNotificationChannelOnAndroid: true
          }
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#7C3AED",
          mode: "production"
        }
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: "ourenglishbest",
          project: "react-native"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "0c4f39f5-184d-4af5-8dca-2cc4d52675e6"
      },
      // Keys embedded here for local Xcode builds (EAS builds use dashboard env vars)
      FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      GOOGLE_CLOUD_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY,
      AZURE_SPEECH_KEY: process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY,
      AZURE_SPEECH_REGION: process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION,
    }
  }
};

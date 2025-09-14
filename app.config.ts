import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Harmony Hub',
  slug: 'harmony-hub',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.harmonyhub.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.harmonyhub.app',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    // Firebase configuration - these will be overridden by environment variables
    firebaseApiKey: process.env.FIREBASE_API_KEY || 'YOUR_API_KEY',
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
    firebaseAppId: process.env.FIREBASE_APP_ID || 'YOUR_APP_ID',

    // API Keys for external services
    ticketmasterApiKey: process.env.TICKETMASTER_API_KEY || '',
    musicbrainzApiKey: process.env.MUSICBRAINZ_API_KEY || '',
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',

    // Environment
    environment: process.env.NODE_ENV || 'development',
  },
};

export default config;

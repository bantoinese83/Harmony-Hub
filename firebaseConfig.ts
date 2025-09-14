import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || 'YOUR_API_KEY',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || 'YOUR_AUTH_DOMAIN',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || 'YOUR_PROJECT_ID',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || 'YOUR_MESSAGING_SENDER_ID',
  appId: Constants.expoConfig?.extra?.firebaseAppId || 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  // If initializeAuth fails, fall back to getAuth
  // This can happen if auth is already initialized
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.warn('Firebase Auth initialization error:', error);
    // Fallback to getAuth for any other errors
    auth = getAuth(app);
  }
}

// Initialize Firestore with better error handling
let db: Firestore;
try {
  db = getFirestore(app);

  // Configure Firestore settings for better stability
  // Note: settings() is deprecated in v9+, using new approach
  console.log('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
  throw error;
}

// Initialize Analytics (only in supported environments)
let analytics = null;
const initializeAnalytics = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
    } else {
      console.log('Firebase Analytics not supported in this environment');
    }
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
    // Don't throw here as analytics is not critical
  }
};

// Initialize analytics asynchronously
initializeAnalytics();

export { auth, db, analytics };

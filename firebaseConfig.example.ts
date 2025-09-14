import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration template
// Copy this file to firebaseConfig.ts and fill in your actual values
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.FIREBASE_APP_ID || 'YOUR_APP_ID',
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
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
  } else {
    console.warn('Firebase Auth initialization error:', error);
    // Fallback to getAuth for any other errors
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
  }
}

// Initialize Firestore with better error handling
let db;
try {
  const { getFirestore } = require('firebase/firestore');
  db = getFirestore(app);
  console.log('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
  throw error;
}

export { auth, db };

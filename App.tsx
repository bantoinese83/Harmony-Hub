import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary, { setupGlobalErrorHandling } from './components/ErrorBoundary';
import { ToastManager } from './components/Toast';

// Setup global error handling
setupGlobalErrorHandling();

export default function App() {
  const [fontsLoaded] = useFonts({
    // System fonts are loaded by default on both platforms
    // Additional custom fonts can be added here if needed
  });

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppNavigator />
          <ToastManager />
          <StatusBar style="auto" />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

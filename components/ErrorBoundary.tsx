import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LogBox } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you might want to send this to an error reporting service
    // Example: Sentry, Bugsnag, Firebase Crashlytics, etc.
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We're sorry, but something unexpected happened. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
export const ErrorFallback: React.FC<{ error?: Error; retry?: () => void }> = ({
  error,
  retry,
}) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>😵</Text>
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>
      {error?.message || 'An unexpected error occurred'}
    </Text>
    {retry && (
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  // Ignore specific logs in development
  if (__DEV__) {
    try {
      LogBox.ignoreLogs([
        'Possible Unhandled Promise Rejection',
        'Non-serializable values were found in the navigation state',
        'VirtualizedLists should never be nested',
      ]);
    } catch (error) {
      console.warn('LogBox not available:', error);
    }
  }

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (error: any) => {
    console.error('Unhandled promise rejection:', error);
    // In production, send to error reporting service
  };

  // Handle unhandled errors
  const handleUnhandledError = (error: any) => {
    console.error('Unhandled error:', error);
    // In production, send to error reporting service
  };

  if (typeof global !== 'undefined' && global.process && global.process.on) {
    global.process.on('unhandledRejection', handleUnhandledRejection);
    global.process.on('uncaughtException', handleUnhandledError);
  }

  // Handle React Native errors
  if (__DEV__) {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('Warning:')) {
        return; // Ignore warnings in development
      }
      originalConsoleError.apply(console, args);
    };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ErrorBoundary;

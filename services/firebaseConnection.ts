import { db } from '../firebaseConfig';
import { connectFirestoreEmulator, getFirestore, enableNetwork, disableNetwork, waitForPendingWrites } from 'firebase/firestore';
import Constants from 'expo-constants';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

class FirebaseConnectionManager {
  private connectionState: ConnectionState = 'connecting';
  private retryQueue: Array<() => Promise<any>> = [];
  private isRetrying = false;
  private maxRetries = 3;
  private retryDelay = 1000;
  private connectionListeners: Array<(state: ConnectionState) => void> = [];

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Wait for Firebase to be ready
      await this.waitForFirebaseReady();

      // Check if we should use emulator (only for explicit development)
      const isDevelopment = Constants.expoConfig?.extra?.environment === 'development';
      const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';

      if (isDevelopment && useEmulator) {
        try {
          // Try to connect to emulator only if explicitly requested
          connectFirestoreEmulator(db, 'localhost', 8080);
          console.log('🔧 Connected to Firestore emulator (development mode)');
        } catch (error) {
          // Emulator not available, continue with production
          console.log('⚠️  Firestore emulator not available, using production Firebase');
        }
      } else {
        console.log('🔥 Connected to production Firebase backend');
      }

      this.setConnectionState('connected');
      this.processRetryQueue();
    } catch (error) {
      console.error('Firebase connection initialization failed:', error);
      this.setConnectionState('error');
    }
  }

  private async waitForFirebaseReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        try {
          // Simple operation to check if Firestore is ready
          getFirestore();
          resolve();
        } catch (error) {
          // Wait a bit and try again
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.connectionListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });

    if (state === 'connected') {
      console.log('Firebase connection established');
    } else if (state === 'disconnected') {
      console.warn('Firebase connection lost');
    } else if (state === 'error') {
      console.error('Firebase connection error');
    }
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public onConnectionStateChange(listener: (state: ConnectionState) => void) {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Firebase operation'
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (this.connectionState === 'connected') {
          const result = await operation();
          return result;
        } else {
          // If not connected, add to retry queue
          return new Promise((resolve, reject) => {
            this.retryQueue.push(async () => {
              try {
                const result = await operation();
                resolve(result);
              } catch (error) {
                reject(error);
              }
            });
          });
        }
      } catch (error: any) {
        lastError = error;

        // Check if it's a network-related error
        if (this.isNetworkError(error)) {
          console.warn(`${operationName} failed (attempt ${attempt}/${this.maxRetries}):`, error.message);

          if (attempt < this.maxRetries) {
            // Wait before retrying
            await this.delay(this.retryDelay * attempt);
            continue;
          }
        } else {
          // Non-network error, don't retry
          throw error;
        }
      }
    }

    throw lastError;
  }

  private isNetworkError(error: any): boolean {
    const networkErrorCodes = [
      'unavailable',
      'deadline-exceeded',
      'cancelled',
      'failed-precondition'
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';

    return networkErrorCodes.some(code => errorCode.includes(code)) ||
           errorMessage.includes('offline') ||
           errorMessage.includes('network') ||
           errorMessage.includes('connection');
  }

  private async processRetryQueue() {
    if (this.isRetrying || this.connectionState !== 'connected') {
      return;
    }

    this.isRetrying = true;

    while (this.retryQueue.length > 0 && this.connectionState === 'connected') {
      const operation = this.retryQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Retry operation failed:', error);
        }
      }
    }

    this.isRetrying = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async disconnect() {
    try {
      await disableNetwork(db);
      this.setConnectionState('disconnected');
    } catch (error) {
      console.error('Error disconnecting Firebase:', error);
    }
  }

  public async reconnect() {
    try {
      await enableNetwork(db);
      this.setConnectionState('connected');
      this.processRetryQueue();
    } catch (error) {
      console.error('Error reconnecting Firebase:', error);
      this.setConnectionState('error');
    }
  }
}

// Create singleton instance
export const firebaseConnectionManager = new FirebaseConnectionManager();

// Export convenience functions
export const getConnectionState = () => firebaseConnectionManager.getConnectionState();
export const onConnectionStateChange = (listener: (state: ConnectionState) => void) =>
  firebaseConnectionManager.onConnectionStateChange(listener);
export const executeWithRetry = <T>(
  operation: () => Promise<T>,
  operationName?: string
) => firebaseConnectionManager.executeWithRetry(operation, operationName);

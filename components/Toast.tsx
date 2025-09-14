import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../types/theme';
import { Check, X, AlertTriangle, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onHide, duration = 3000 }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: theme.colors.success };
      case 'error':
        return { backgroundColor: theme.colors.error };
      case 'warning':
        return { backgroundColor: theme.colors.warning };
      case 'info':
      default:
        return { backgroundColor: theme.colors.info };
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'success':
        return [theme.colors.success, '#51CF66'];
      case 'error':
        return [theme.colors.error, '#FF6B6B'];
      case 'warning':
        return [theme.colors.warning, '#FFD43B'];
      case 'info':
      default:
        return [theme.colors.info, '#74C0FC'];
    }
  };

  const getIcon = () => {
    const iconSize = theme.typography.fontSize.md;
    const iconColor = theme.colors.surface;

    switch (type) {
      case 'success':
        return <Check size={iconSize} color={iconColor} />;
      case 'error':
        return <X size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          ...theme.shadows.lg,
        },
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Toast Manager Component
export const ToastManager: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
      const id = Date.now().toString();
      const toast: ToastMessage = { id, message, type, duration };

      setToasts(prev => [...prev, toast]);

      // Auto remove after duration
      setTimeout(() => {
        removeToast(id);
      }, duration || 3000);
    };

    const removeToast = (id: string) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Make functions globally available
    (global as any).showToast = showToast;
    (global as any).removeToast = removeToast;

    return () => {
      delete (global as any).showToast;
      delete (global as any).removeToast;
    };
  }, []);

  const handleToastHide = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onHide={() => handleToastHide(toast.id)}
          duration={toast.duration}
        />
      ))}
    </View>
  );
};

// Global toast functions
export const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
  if ((global as any).showToast) {
    (global as any).showToast(message, type, duration);
  }
};

export const showSuccessToast = (message: string, duration?: number) => {
  showToast(message, 'success', duration);
};

export const showErrorToast = (message: string, duration?: number) => {
  showToast(message, 'error', duration);
};

export const showWarningToast = (message: string, duration?: number) => {
  showToast(message, 'warning', duration);
};

export const showInfoToast = (message: string, duration?: number) => {
  showToast(message, 'info', duration);
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  container: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
  },
  icon: {
    fontSize: theme.typography.fontSize.lg,
    marginRight: theme.spacing.md,
  },
  message: {
    flex: 1,
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium as any,
    lineHeight: theme.typography.lineHeight.normal,
  },
  closeButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  closeIcon: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold as any,
  },
});

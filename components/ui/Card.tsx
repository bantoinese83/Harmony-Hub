import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../types/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = 'md',
  borderRadius = 'md',
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: getBorderRadius(),
      ...getPaddingStyle(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          ...theme.shadows.md,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceVariant,
        };
      case 'gradient':
        return {
          ...baseStyle,
          ...theme.shadows.lg,
        };
      default:
        return baseStyle;
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: theme.spacing.sm };
      case 'lg':
        return { padding: theme.spacing.lg };
      case 'md':
      default:
        return { padding: theme.spacing.md };
    }
  };

  const getBorderRadius = (): number => {
    switch (borderRadius) {
      case 'sm':
        return theme.borderRadius.sm;
      case 'lg':
        return theme.borderRadius.lg;
      case 'xl':
        return theme.borderRadius.xl;
      case 'md':
      default:
        return theme.borderRadius.md;
    }
  };

  const CardContent = () => (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[getCardStyle(), style]}
        >
          {children}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={style}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../types/theme';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      ...(disabled && { opacity: 0.6 }),
      ...getSizeStyle(),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
          ...theme.shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary,
          ...theme.shadows.sm,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.outline,
        };
      case 'ghost':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          width: 32,
          height: 32,
        };
      case 'lg':
        return {
          width: 48,
          height: 48,
        };
      case 'md':
      default:
        return {
          width: 40,
          height: 40,
        };
    }
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return theme.colors.surface;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
        />
      ) : (
        React.cloneElement(icon as React.ReactElement, {
          color: getIconColor(),
        })
      )}
    </TouchableOpacity>
  );
};

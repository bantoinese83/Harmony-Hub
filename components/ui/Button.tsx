import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../types/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...getSizeStyle(),
      ...(fullWidth && { width: '100%' }),
      ...(disabled && { opacity: 0.6 }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
          ...theme.shadows.md,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary,
          ...theme.shadows.md,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
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

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: 36,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
          minHeight: 52,
        };
      case 'md':
      default:
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          minHeight: 44,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: theme.typography.fontWeight.medium as any,
      textAlign: 'center',
    };

    switch (size) {
      case 'sm':
        baseTextStyle.fontSize = theme.typography.fontSize.sm;
        break;
      case 'lg':
        baseTextStyle.fontSize = theme.typography.fontSize.lg;
        break;
      case 'md':
      default:
        baseTextStyle.fontSize = theme.typography.fontSize.md;
        break;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'gradient':
        baseTextStyle.color = theme.colors.surface;
        break;
      case 'outline':
        baseTextStyle.color = theme.colors.primary;
        break;
      case 'ghost':
        baseTextStyle.color = theme.colors.primary;
        break;
      default:
        baseTextStyle.color = theme.colors.text;
    }

    return baseTextStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator
            size="small"
            color={
              variant === 'outline' || variant === 'ghost'
                ? theme.colors.primary
                : theme.colors.surface
            }
            style={{ marginRight: loading ? theme.spacing.sm : 0 }}
          />
          <Text style={[getTextStyle(), textStyle]}>Loading...</Text>
        </>
      );
    }

    return <Text style={[getTextStyle(), textStyle]}>{title}</Text>;
  };

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={disabled || loading ? undefined : onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
      >
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {renderContent()}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

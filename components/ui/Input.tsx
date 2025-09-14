import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { theme } from '../../types/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: 'outlined' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  variant = 'outlined',
  size = 'md',
  style,
  ...props
}, ref) => {
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: theme.spacing.md,
    };

    return { ...baseStyle, ...containerStyle };
  };

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      ...getSizeStyle(),
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1.5,
          borderColor: error ? theme.colors.error : theme.colors.outline,
          backgroundColor: theme.colors.surface,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceVariant,
          borderBottomWidth: 2,
          borderBottomColor: error ? theme.colors.error : theme.colors.outline,
        };
      case 'underlined':
        return {
          ...baseStyle,
          borderBottomWidth: 2,
          borderBottomColor: error ? theme.colors.error : theme.colors.primary,
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
          minHeight: 40,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          minHeight: 56,
        };
      case 'md':
      default:
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          minHeight: 48,
        };
    }
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      fontWeight: theme.typography.fontWeight.regular as any,
    };

    return { ...baseStyle, ...inputStyle };
  };

  const getLabelStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium as any,
      color: error ? theme.colors.error : theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    };

    return { ...baseStyle, ...labelStyle };
  };

  const getHelperTextStyle = (): TextStyle => ({
    fontSize: theme.typography.fontSize.xs,
    color: error ? theme.colors.error : theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  });

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}

      <View style={getInputContainerStyle()}>
        {leftIcon && <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[getInputStyle(), style]}
          placeholderTextColor={theme.colors.textTertiary}
          {...props}
        />

        {rightIcon && <View style={{ marginLeft: theme.spacing.sm }}>{rightIcon}</View>}
      </View>

      {(error || helperText) && (
        <Text style={getHelperTextStyle()}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

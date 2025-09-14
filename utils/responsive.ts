import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const baseWidth = 375;
const baseHeight = 812;

// Responsive utility functions
export const responsive = {
  // Scale width based on screen width
  width: (size: number): number => {
    const scale = screenWidth / baseWidth;
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  },

  // Scale height based on screen height
  height: (size: number): number => {
    const scale = screenHeight / baseHeight;
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  },

  // Scale font size with moderate scaling
  fontSize: (size: number): number => {
    const scale = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);
    const fontSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(fontSize));
  },

  // Get moderate scale for general elements
  moderateScale: (size: number, factor = 0.5): number => {
    const scale = screenWidth / baseWidth;
    const moderateScale = 1 + (scale - 1) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(size * moderateScale));
  },
};

// Device type detection
export const device = {
  isSmallDevice: screenWidth < 375,
  isLargeDevice: screenWidth > 414,
  isTablet: screenWidth >= 768,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  screenWidth,
  screenHeight,
};

// Spacing utilities for consistent spacing across devices
export const spacing = {
  xs: responsive.moderateScale(4),
  sm: responsive.moderateScale(8),
  md: responsive.moderateScale(16),
  lg: responsive.moderateScale(24),
  xl: responsive.moderateScale(32),
  xxl: responsive.moderateScale(48),
};

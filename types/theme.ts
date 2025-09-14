// Theme Types and Constants for Harmony Hub
export interface Theme {
  colors: {
    // Primary Brand Colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;

    // Semantic Colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Neutral Colors
    background: string;
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;

    // Text Colors
    text: string;
    textSecondary: string;
    textTertiary: string;

    // Special Colors for Music Theme
    music: string;
    musicLight: string;
    gradientStart: string;
    gradientEnd: string;
  };

  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };

  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };

  typography: {
    fonts: {
      primary: string;
      secondary: string;
      mono: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    fontWeight: {
      light: string;
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
    letterSpacing: {
      tight: number;
      normal: number;
      wide: number;
    };
  };

  shadows: {
    sm: object;
    md: object;
    lg: object;
    xl: object;
  };
}

// Harmony Hub Theme - Modern, Minimal, Cool & Fun
export const theme: Theme = {
  colors: {
    // Vibrant primary colors with music theme
    primary: '#FF6B6B', // Vibrant coral red
    primaryLight: '#FF8E8E',
    primaryDark: '#E55A5A',
    secondary: '#4ECDC4', // Turquoise for contrast
    secondaryLight: '#6DD5CD',
    accent: '#FFE66D', // Bright yellow accent

    // Semantic colors
    success: '#51CF66',
    warning: '#FFD43B',
    error: '#FF6B6B',
    info: '#74C0FC',

    // Neutral colors - clean and modern
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#6B7280',
    outline: '#E5E7EB',
    outlineVariant: '#D1D5DB',

    // Text hierarchy
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    // Music-themed colors
    music: '#8B5CF6', // Purple for music elements
    musicLight: '#A78BFA',
    gradientStart: '#FF6B6B',
    gradientEnd: '#4ECDC4',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    fonts: {
      primary: {
        ios: 'System',
        android: 'System',
        default: 'System',
      },
      secondary: {
        ios: 'System',
        android: 'System',
        default: 'System',
      },
      mono: {
        ios: 'Courier New',
        android: 'monospace',
        default: 'monospace',
      },
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
  },
};

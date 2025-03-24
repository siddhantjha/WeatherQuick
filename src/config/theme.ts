// Define colors based on our documentation
export const colors = {
  // Primary colors
  primary: '#1E90FF', // Sky Blue
  secondary: '#FFD700', // Sunshine Yellow
  background: '#E0E0E0', // Cloud Gray
  
  // Functional colors
  success: '#4CAF50', // Success Green
  warning: '#FF9800', // Alert Orange
  error: '#F44336', // Error Red
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#9E9E9E',
  
  // Weather condition colors
  sunny: '#FFB300',
  cloudy: '#90A4AE',
  rainy: '#42A5F5',
  stormy: '#5C6BC0',
  snowy: '#ECEFF1',
  foggy: '#B0BEC5',
  
  // UI elements
  cardBackground: '#FFFFFF',
  divider: '#EEEEEE',
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    h1: 24,
    h2: 20,
    h3: 16,
    body: 14,
    caption: 12,
    small: 10,
  },
  lineHeight: {
    h1: 32,
    h2: 28,
    h3: 24,
    body: 20,
    caption: 16,
    small: 14,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 999,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Screen-specific theme for weather conditions
export const weatherThemes = {
  clear: {
    primaryColor: colors.sunny,
    backgroundColor: '#FDF6E3',
    textColor: colors.textPrimary,
    gradientColors: ['#FDF6E3', '#FFB300'],
  },
  clouds: {
    primaryColor: colors.cloudy,
    backgroundColor: '#ECEFF1',
    textColor: colors.textPrimary,
    gradientColors: ['#ECEFF1', '#90A4AE'],
  },
  rain: {
    primaryColor: colors.rainy,
    backgroundColor: '#E1F5FE',
    textColor: colors.textPrimary,
    gradientColors: ['#E1F5FE', '#42A5F5'],
  },
  thunderstorm: {
    primaryColor: colors.stormy,
    backgroundColor: '#E8EAF6',
    textColor: colors.textPrimary,
    gradientColors: ['#E8EAF6', '#5C6BC0'],
  },
  snow: {
    primaryColor: colors.snowy,
    backgroundColor: '#FFFFFF',
    textColor: colors.textPrimary,
    gradientColors: ['#FFFFFF', '#ECEFF1'],
  },
  mist: {
    primaryColor: colors.foggy,
    backgroundColor: '#ECEFF1',
    textColor: colors.textPrimary,
    gradientColors: ['#ECEFF1', '#B0BEC5'],
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  weatherThemes,
}; 
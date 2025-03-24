import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from './useSubscription';
import { SubscriptionTier } from '../services/SubscriptionService';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  white: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  isPremium: boolean;
}

interface ThemeContextType {
  currentTheme: string;
  themes: Record<string, Theme>;
  colors: ThemeColors;
  isDark: boolean;
  changeTheme: (themeId: string) => void;
  resetToDefault: () => void;
}

const defaultColors: ThemeColors = {
  primary: '#4A90E2',
  primaryLight: '#D4E6FC',
  secondary: '#50C878',
  secondaryLight: '#D4F7E2',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#777777',
  border: '#E1E1E1',
  success: '#5CB85C',
  warning: '#F0AD4E',
  error: '#D9534F',
  white: '#FFFFFF',
};

const darkColors: ThemeColors = {
  primary: '#4A90E2',
  primaryLight: '#1F3A5F',
  secondary: '#50C878',
  secondaryLight: '#1F3D2F',
  background: '#121212',
  card: '#1E1E1E',
  text: '#E1E1E1',
  textSecondary: '#A0A0A0',
  border: '#2C2C2C',
  success: '#5CB85C',
  warning: '#F0AD4E',
  error: '#D9534F',
  white: '#FFFFFF',
};

const nightBlueColors: ThemeColors = {
  primary: '#738FFF',
  primaryLight: '#1A2847',
  secondary: '#50C8C8',
  secondaryLight: '#1A3F3F',
  background: '#0A1929',
  card: '#152A3A',
  text: '#E1E9F2',
  textSecondary: '#A0B0C8',
  border: '#233C52',
  success: '#5CB8A7',
  warning: '#F0C86A',
  error: '#D9756F',
  white: '#FFFFFF',
};

const sunsetOrangeColors: ThemeColors = {
  primary: '#FF7B54',
  primaryLight: '#FFE3D8',
  secondary: '#FFB26B',
  secondaryLight: '#FFE9D5',
  background: '#FFF5E0',
  card: '#FFFFFF',
  text: '#4D3C2E',
  textSecondary: '#8D7D6D',
  border: '#FFD8BE',
  success: '#7EBD7E',
  warning: '#FFB26B',
  error: '#E77474',
  white: '#FFFFFF',
};

const forestGreenColors: ThemeColors = {
  primary: '#2C5F2D',
  primaryLight: '#B3D2B4',
  secondary: '#97BC62',
  secondaryLight: '#E2EDD2',
  background: '#F8FBF4',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#777777',
  border: '#D2E1C5',
  success: '#5CB85C',
  warning: '#D4AC0D',
  error: '#D9534F',
  white: '#FFFFFF',
};

const royalPurpleColors: ThemeColors = {
  primary: '#6A0DAD',
  primaryLight: '#D5B8E7',
  secondary: '#9A4EAE',
  secondaryLight: '#E2D0EB',
  background: '#F9F4FB',
  card: '#FFFFFF',
  text: '#2D1A33',
  textSecondary: '#6B5475',
  border: '#E0CBF0',
  success: '#5CB85C',
  warning: '#F0AD4E',
  error: '#D9534F',
  white: '#FFFFFF',
};

// Define all available themes
const availableThemes: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Default',
    colors: defaultColors,
    isPremium: false,
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    colors: darkColors,
    isPremium: true,
  },
  night: {
    id: 'night',
    name: 'Night Blue',
    colors: nightBlueColors,
    isPremium: true,
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: sunsetOrangeColors,
    isPremium: true,
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    colors: forestGreenColors,
    isPremium: true,
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    colors: royalPurpleColors,
    isPremium: true,
  },
};

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'default',
  themes: availableThemes,
  colors: defaultColors,
  isDark: false,
  changeTheme: () => {},
  resetToDefault: () => {},
});

const THEME_STORAGE_KEY = '@WeatherQuick:theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const { tier } = useSubscription();
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [isDark, setIsDark] = useState<boolean>(false);

  // Load saved theme on app start
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          // Only apply premium themes if user has premium subscription
          const themeIsPremium = availableThemes[savedTheme]?.isPremium;
          if (!themeIsPremium || tier === SubscriptionTier.PREMIUM) {
            applyTheme(savedTheme);
          } else {
            // Fallback to default if user lost premium access
            applyTheme('default');
          }
        } else if (systemColorScheme === 'dark') {
          // Apply dark theme based on system preference if user has premium
          if (tier === SubscriptionTier.PREMIUM) {
            applyTheme('dark');
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadSavedTheme();
  }, [tier]);

  // Listen to system color scheme changes
  useEffect(() => {
    // Only automatically switch to dark mode if user has premium and is using default theme
    if (
      tier === SubscriptionTier.PREMIUM &&
      (currentTheme === 'default' || currentTheme === 'dark')
    ) {
      applyTheme(systemColorScheme === 'dark' ? 'dark' : 'default');
    }
  }, [systemColorScheme, tier]);

  const applyTheme = (themeId: string) => {
    const theme = availableThemes[themeId];
    if (theme) {
      setCurrentTheme(themeId);
      setColors(theme.colors);
      setIsDark(
        themeId === 'dark' || 
        themeId === 'night' || 
        theme.colors.background.startsWith('#0') || 
        theme.colors.background.startsWith('#1')
      );
    }
  };

  const changeTheme = async (themeId: string) => {
    // Check if theme exists
    if (!availableThemes[themeId]) {
      console.error(`Theme ${themeId} not found`);
      return;
    }

    // Check if premium theme and user has premium
    if (availableThemes[themeId].isPremium && tier !== SubscriptionTier.PREMIUM) {
      console.error('Premium theme selected without premium subscription');
      return;
    }

    applyTheme(themeId);

    // Save to persistent storage
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const resetToDefault = async () => {
    applyTheme('default');
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting theme:', error);
    }
  };

  const value = {
    currentTheme,
    themes: availableThemes,
    colors,
    isDark,
    changeTheme,
    resetToDefault,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext);
}; 
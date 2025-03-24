import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Accessibility settings interface
export interface AccessibilitySettings {
  // Font scaling
  fontScaleEnabled: boolean;
  customFontScale: number;
  
  // Contrast settings
  highContrastEnabled: boolean;
  
  // Reduced motion
  reduceMotion: boolean;
  
  // Screen reader feedback
  enhancedScreenReaderFeedback: boolean;
  
  // Touch accommodations
  touchAccommodationsEnabled: boolean;
  touchAccommodationTimeout: number; // In milliseconds
}

// Accessibility context
interface AccessibilityContextProps {
  settings: AccessibilitySettings;
  isScreenReaderEnabled: boolean;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => Promise<void>;
  applyFontScale: (fontSize: number) => number;
  announceForAccessibility: (message: string) => void;
}

// Default settings
const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontScaleEnabled: true,
  customFontScale: 1.0,
  highContrastEnabled: false,
  reduceMotion: false,
  enhancedScreenReaderFeedback: true,
  touchAccommodationsEnabled: false,
  touchAccommodationTimeout: 0.5 * 1000, // 500ms
};

// Storage key
const ACCESSIBILITY_STORAGE_KEY = 'weatherquick_accessibility_settings';

// Context creation
const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load saved settings and check screen reader status
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load accessibility settings from storage
        const savedSettings = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        
        // Check if screen reader is enabled
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(screenReaderEnabled);
        
        // Listen for screen reader changes
        const listener = AccessibilityInfo.addEventListener(
          'screenReaderChanged',
          handleScreenReaderToggled
        );
        
        setIsLoaded(true);
        
        // Cleanup listener
        return () => {
          if (Platform.OS === 'ios' || parseInt(Platform.Version as string, 10) >= 29) {
            listener.remove();
          } else {
            // For older Android
            AccessibilityInfo.removeEventListener?.(
              'screenReaderChanged',
              handleScreenReaderToggled
            );
          }
        };
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Handle screen reader status changes
  const handleScreenReaderToggled = (isEnabled: boolean) => {
    setIsScreenReaderEnabled(isEnabled);
  };

  // Update settings
  const updateSettings = async (newSettings: Partial<AccessibilitySettings>): Promise<void> => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save to storage
      await AsyncStorage.setItem(
        ACCESSIBILITY_STORAGE_KEY,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  // Apply font scaling to a font size
  const applyFontScale = (fontSize: number): number => {
    if (!settings.fontScaleEnabled) return fontSize;
    
    return fontSize * settings.customFontScale;
  };

  // Announce a message for screen readers
  const announceForAccessibility = (message: string) => {
    if (isScreenReaderEnabled || settings.enhancedScreenReaderFeedback) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  // Only render children when settings are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        isScreenReaderEnabled,
        updateSettings,
        applyFontScale,
        announceForAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook for using accessibility settings
export const useAccessibility = (): AccessibilityContextProps => {
  const context = useContext(AccessibilityContext);
  
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  
  return context;
};

export default AccessibilityProvider; 
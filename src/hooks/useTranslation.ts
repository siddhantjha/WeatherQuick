import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations, { 
  Translations, 
  AVAILABLE_LANGUAGES, 
  DEFAULT_LANGUAGE,
  getInitialLanguage
} from '../i18n/translations';

// Define the context shape
interface TranslationContextType {
  t: (key: keyof Translations) => string;
  currentLanguage: string;
  availableLanguages: typeof AVAILABLE_LANGUAGES;
  changeLanguage: (lang: string) => Promise<void>;
}

// Create context with default values
const TranslationContext = createContext<TranslationContextType>({
  t: (key) => key as string,
  currentLanguage: DEFAULT_LANGUAGE,
  availableLanguages: AVAILABLE_LANGUAGES,
  changeLanguage: async () => {},
});

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'weatherquick_language';

// Provider component
export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // Try to load from storage first
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        
        // If no saved preference, use device language or default
        const initialLanguage = savedLanguage || getInitialLanguage();
        
        setCurrentLanguage(initialLanguage);
      } catch (error) {
        console.error('Failed to load language preference:', error);
        setCurrentLanguage(DEFAULT_LANGUAGE);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  // Translation function
  const t = useCallback((key: keyof Translations): string => {
    // Get the translations for current language or fallback to default
    const languageTranslations = translations[currentLanguage] || translations[DEFAULT_LANGUAGE];
    
    // Return the translation or the key if not found
    return languageTranslations[key] || key as string;
  }, [currentLanguage]);

  // Change language function
  const changeLanguage = useCallback(async (lang: string): Promise<void> => {
    if (Object.keys(AVAILABLE_LANGUAGES).includes(lang)) {
      try {
        // Save to storage
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        
        // Update state
        setCurrentLanguage(lang);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    } else {
      console.warn(`Language ${lang} is not supported`);
    }
  }, []);

  // Context value
  const value = {
    t,
    currentLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
    changeLanguage,
  };

  // Only render children when language is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook for using translations
export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  return context;
};

export default useTranslation; 
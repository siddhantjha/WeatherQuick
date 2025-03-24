import { Platform, NativeModules } from 'react-native';

// Get device language
const getDeviceLanguage = (): string => {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0]
      : NativeModules.I18nManager.localeIdentifier;

  // Convert to standard format (e.g., 'en-US' to 'en')
  return deviceLanguage.split(/[-_]/)[0].toLowerCase();
};

// Available languages
export const AVAILABLE_LANGUAGES = {
  en: 'English',
  es: 'Español', // Spanish
  fr: 'Français', // French
  de: 'Deutsch', // German
  zh: '中文', // Chinese
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Get initial language - use device language if supported, otherwise default
export const getInitialLanguage = (): string => {
  const deviceLang = getDeviceLanguage();
  return Object.keys(AVAILABLE_LANGUAGES).includes(deviceLang)
    ? deviceLang
    : DEFAULT_LANGUAGE;
};

// Translation keys by language
export interface Translations {
  // Auth screens
  login: string;
  register: string;
  email: string;
  password: string;
  forgotPassword: string;
  signIn: string;
  signUp: string;
  resetPassword: string;
  
  // Main screens
  home: string;
  weather: string;
  forecast: string;
  locations: string;
  profile: string;
  settings: string;
  
  // Weather terms
  currentWeather: string;
  hourlyForecast: string;
  dailyForecast: string;
  feels_like: string;
  humidity: string;
  wind: string;
  pressure: string;
  visibility: string;
  uvIndex: string;
  precipitation: string;
  
  // Location features
  currentLocation: string;
  searchLocations: string;
  addLocation: string;
  removeLocation: string;
  setAsDefault: string;
  
  // Settings options
  units: string;
  metric: string;
  imperial: string;
  language: string;
  darkMode: string;
  notifications: string;
  
  // Subscription
  subscription: string;
  premium: string;
  subscribeToPremium: string;
  restorePurchases: string;
  monthlySubscription: string;
  yearlySubscription: string;
  
  // Alerts and messages
  locationPermissionRequired: string;
  locationPermissionDenied: string;
  errorOccurred: string;
  tryAgain: string;
  locationLimit: string;
  
  // Onboarding
  welcome: string;
  skip: string;
  next: string;
  getStarted: string;
  
  // Widgets
  widgets: string;
  addWidget: string;
}

// English translations
const en: Translations = {
  // Auth screens
  login: 'Login',
  register: 'Register',
  email: 'Email',
  password: 'Password',
  forgotPassword: 'Forgot Password?',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  resetPassword: 'Reset Password',
  
  // Main screens
  home: 'Home',
  weather: 'Weather',
  forecast: 'Forecast',
  locations: 'Locations',
  profile: 'Profile',
  settings: 'Settings',
  
  // Weather terms
  currentWeather: 'Current Weather',
  hourlyForecast: 'Hourly Forecast',
  dailyForecast: 'Daily Forecast',
  feels_like: 'Feels like',
  humidity: 'Humidity',
  wind: 'Wind',
  pressure: 'Pressure',
  visibility: 'Visibility',
  uvIndex: 'UV Index',
  precipitation: 'Precipitation',
  
  // Location features
  currentLocation: 'Current Location',
  searchLocations: 'Search Locations',
  addLocation: 'Add Location',
  removeLocation: 'Remove Location',
  setAsDefault: 'Set as Default',
  
  // Settings options
  units: 'Units',
  metric: 'Metric (°C)',
  imperial: 'Imperial (°F)',
  language: 'Language',
  darkMode: 'Dark Mode',
  notifications: 'Notifications',
  
  // Subscription
  subscription: 'Subscription',
  premium: 'Premium',
  subscribeToPremium: 'Subscribe to Premium',
  restorePurchases: 'Restore Purchases',
  monthlySubscription: 'Monthly Subscription',
  yearlySubscription: 'Yearly Subscription',
  
  // Alerts and messages
  locationPermissionRequired: 'Location permission is required',
  locationPermissionDenied: 'Location permission was denied',
  errorOccurred: 'An error occurred',
  tryAgain: 'Try Again',
  locationLimit: 'You have reached the maximum number of locations for a free account',
  
  // Onboarding
  welcome: 'Welcome to WeatherQuick',
  skip: 'Skip',
  next: 'Next',
  getStarted: 'Get Started',
  
  // Widgets
  widgets: 'Widgets',
  addWidget: 'Add Widget'
};

// Spanish translations
const es: Translations = {
  // Auth screens
  login: 'Iniciar Sesión',
  register: 'Registrarse',
  email: 'Correo electrónico',
  password: 'Contraseña',
  forgotPassword: '¿Olvidó su contraseña?',
  signIn: 'Ingresar',
  signUp: 'Registrarse',
  resetPassword: 'Restablecer contraseña',
  
  // Main screens
  home: 'Inicio',
  weather: 'Clima',
  forecast: 'Pronóstico',
  locations: 'Ubicaciones',
  profile: 'Perfil',
  settings: 'Configuración',
  
  // Weather terms
  currentWeather: 'Clima Actual',
  hourlyForecast: 'Pronóstico por Hora',
  dailyForecast: 'Pronóstico Diario',
  feels_like: 'Sensación térmica',
  humidity: 'Humedad',
  wind: 'Viento',
  pressure: 'Presión',
  visibility: 'Visibilidad',
  uvIndex: 'Índice UV',
  precipitation: 'Precipitación',
  
  // Location features
  currentLocation: 'Ubicación Actual',
  searchLocations: 'Buscar Ubicaciones',
  addLocation: 'Añadir Ubicación',
  removeLocation: 'Eliminar Ubicación',
  setAsDefault: 'Establecer como Predeterminada',
  
  // Settings options
  units: 'Unidades',
  metric: 'Métrico (°C)',
  imperial: 'Imperial (°F)',
  language: 'Idioma',
  darkMode: 'Modo Oscuro',
  notifications: 'Notificaciones',
  
  // Subscription
  subscription: 'Suscripción',
  premium: 'Premium',
  subscribeToPremium: 'Suscribirse a Premium',
  restorePurchases: 'Restaurar Compras',
  monthlySubscription: 'Suscripción Mensual',
  yearlySubscription: 'Suscripción Anual',
  
  // Alerts and messages
  locationPermissionRequired: 'Se requiere permiso de ubicación',
  locationPermissionDenied: 'El permiso de ubicación fue denegado',
  errorOccurred: 'Ha ocurrido un error',
  tryAgain: 'Intentar de nuevo',
  locationLimit: 'Ha alcanzado el número máximo de ubicaciones para una cuenta gratuita',
  
  // Onboarding
  welcome: 'Bienvenido a WeatherQuick',
  skip: 'Omitir',
  next: 'Siguiente',
  getStarted: 'Comenzar',
  
  // Widgets
  widgets: 'Widgets',
  addWidget: 'Añadir Widget'
};

// Available translations object
export const translations: Record<string, Translations> = {
  en,
  es,
};

// Default export
export default translations; 
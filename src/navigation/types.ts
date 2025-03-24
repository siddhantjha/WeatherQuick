import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Navigator params
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator params
export type MainTabParamList = {
  Home: undefined;
  Forecast: undefined;
  Locations: undefined;
  Settings: undefined;
};

// Home Stack params
export type HomeStackParamList = {
  CurrentWeather: undefined;
  WeatherDetail: { locationId: string };
};

// Locations Stack params
export type LocationsStackParamList = {
  LocationsList: undefined;
  AddLocation: undefined;
  EditLocation: { locationId: string };
};

// Settings Stack params
export type SettingsStackParamList = {
  SettingsMain: undefined;
  NotificationSettings: undefined;
  SubscriptionSettings: undefined;
  Account: undefined;
  About: undefined;
};

// Root Navigator params
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Onboarding: undefined;
}; 
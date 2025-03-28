import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main app screens
import WeatherHomeScreen from '../screens/WeatherHomeScreen';
import LocationManagementScreen from '../screens/LocationManagementScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import WeatherMapScreen from '../screens/WeatherMapScreen';
import WeatherComparisonScreen from '../screens/WeatherComparisonScreen';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../styles/colors';

// Create stack navigators
const AuthStack = createNativeStackNavigator();
const WeatherStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const RecommendationsStack = createNativeStackNavigator();
const MapsStack = createNativeStackNavigator();
const ComparisonStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Weather Navigator
const WeatherNavigator = () => {
  return (
    <WeatherStack.Navigator>
      <WeatherStack.Screen
        name="WeatherHome"
        component={WeatherHomeScreen}
        options={{ headerShown: false }}
      />
      <WeatherStack.Screen
        name="LocationManagement"
        component={LocationManagementScreen}
        options={{ headerShown: false }}
      />
      <WeatherStack.Screen
        name="WeatherComparison"
        component={ComparisonNavigator}
        options={{ headerShown: false }}
      />
    </WeatherStack.Navigator>
  );
};

// Settings Navigator
const SettingsNavigator = () => {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </SettingsStack.Navigator>
  );
};

// Recommendations Navigator
const RecommendationsNavigator = () => {
  return (
    <RecommendationsStack.Navigator>
      <RecommendationsStack.Screen
        name="RecommendationsHome"
        component={RecommendationsScreen}
        options={{ headerShown: false }}
      />
    </RecommendationsStack.Navigator>
  );
};

// Maps Navigator
const MapsNavigator = () => {
  return (
    <MapsStack.Navigator>
      <MapsStack.Screen
        name="WeatherMap"
        component={WeatherMapScreen}
        options={{ headerShown: false }}
      />
    </MapsStack.Navigator>
  );
};

// Comparison Navigator
const ComparisonNavigator = () => {
  return (
    <ComparisonStack.Navigator>
      <ComparisonStack.Screen
        name="WeatherComparison"
        component={WeatherComparisonScreen}
        options={{ headerShown: false }}
      />
    </ComparisonStack.Navigator>
  );
};

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Weather') {
            iconName = focused ? 'cloud' : 'cloud-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Recommendations') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Maps') {
            iconName = focused ? 'map' : 'map-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Weather" component={WeatherNavigator} />
      <Tab.Screen name="Recommendations" component={RecommendationsNavigator} />
      <Tab.Screen name="Maps" component={MapsNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();
  
  // Show loading
  if (loading) {
    return null; // or a loading screen
  }

  return (
    <NavigationContainer>
      {user ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 
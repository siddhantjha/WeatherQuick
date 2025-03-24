import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ThemeScreen from '../screens/ThemeScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import BackupRestoreScreen from '../screens/BackupRestoreScreen';
import { useTheme } from '../hooks/useTheme';

const Stack = createStackNavigator();

const SettingsNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: 'bold',
        },
        headerTintColor: colors.primary,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="Theme"
        component={ThemeScreen}
        options={{ title: 'Theme & Appearance' }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Premium Subscription' }}
      />
      <Stack.Screen
        name="BackupRestore"
        component={BackupRestoreScreen}
        options={{ title: 'Backup & Restore' }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator; 
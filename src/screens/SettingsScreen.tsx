import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { weatherService, Unit } from '../services/WeatherService';
import { colors } from '../styles/colors';

type RootStackParamList = {
  BackupRestore: undefined;
};

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, isAuthenticated, signOut } = useAuth();
  const [temperatureUnit, setTemperatureUnit] = useState<Unit>(
    weatherService.getTemperatureUnit() === '°C' ? 'metric' : 'imperial'
  );
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Handle unit change
  const handleUnitChange = (unit: Unit) => {
    setTemperatureUnit(unit);
    weatherService.setUnit(unit);
    // In a real app, save to Supabase or local storage
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.email}</Text>
              <Text style={styles.planInfo}>Free Plan</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Display settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Temperature Unit</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentedButton,
                  temperatureUnit === 'metric' && styles.segmentedButtonActive,
                ]}
                onPress={() => handleUnitChange('metric')}
              >
                <Text
                  style={[
                    styles.segmentedButtonText,
                    temperatureUnit === 'metric' && styles.segmentedButtonTextActive,
                  ]}
                >
                  °C
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentedButton,
                  temperatureUnit === 'imperial' && styles.segmentedButtonActive,
                ]}
                onPress={() => handleUnitChange('imperial')}
              >
                <Text
                  style={[
                    styles.segmentedButtonText,
                    temperatureUnit === 'imperial' && styles.segmentedButtonTextActive,
                  ]}
                >
                  °F
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Weather Alerts</Text>
            <Switch
              value={alertsEnabled}
              onValueChange={setAlertsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => navigation.navigate('BackupRestore')}
            disabled={!isAuthenticated}
          >
            <View style={styles.linkItemContent}>
              <Ionicons 
                name="cloud-outline" 
                size={24} 
                color={isAuthenticated ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.linkText, 
                { color: isAuthenticated ? colors.text : colors.textSecondary }
              ]}>
                Backup & Restore
              </Text>
              {!isAuthenticated && (
                <Text style={styles.loginRequiredText}>Login required</Text>
              )}
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isAuthenticated ? colors.textSecondary : colors.border} 
            />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Open Source Licenses</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>WeatherQuick v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  planInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  segmentedButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  segmentedButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentedButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  segmentedButtonTextActive: {
    color: colors.white,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  loginRequiredText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  versionInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default SettingsScreen; 
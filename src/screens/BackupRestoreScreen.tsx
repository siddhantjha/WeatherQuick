import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useBackup, BackupType } from '../hooks/useBackup';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

interface BackupOptionProps {
  type: BackupType;
  title: string;
  description: string;
  onPress: (type: BackupType) => void;
  isPremium?: boolean;
  disabled?: boolean;
}

const BackupOption: React.FC<BackupOptionProps> = ({
  type,
  title,
  description,
  onPress,
  isPremium = false,
  disabled = false
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        { backgroundColor: colors.cardBackground },
        disabled && { opacity: 0.6 }
      ]}
      onPress={() => onPress(type)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={`Create a backup of your ${title.toLowerCase()}`}
    >
      <View style={styles.optionHeader}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        {isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.premium }]}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>
      <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
      <View style={styles.optionIconContainer}>
        <Ionicons 
          name="cloud-upload-outline" 
          size={24} 
          color={colors.primary} 
        />
      </View>
    </TouchableOpacity>
  );
};

const BackupRestoreScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, subscription } = useAuth();
  const { 
    createBackup, 
    restoreBackup, 
    isCreating, 
    isRestoring, 
    result, 
    clearResult 
  } = useBackup();
  const [showOptions, setShowOptions] = useState(false);
  
  const isPremium = subscription?.status === 'active';
  
  const handleBackup = async (type: BackupType) => {
    // Check if premium features are being used by non-premium users
    if ((type !== 'all' && type !== 'preferences' && type !== 'locations') && !isPremium) {
      Alert.alert(
        'Premium Feature',
        'This backup option is only available to premium users. Would you like to upgrade?',
        [
          { text: 'No Thanks', style: 'cancel' },
          { 
            text: 'Upgrade',
            onPress: () => {
              // Navigate to subscription screen
              // This would be handled by your navigation system
            }
          }
        ]
      );
      return;
    }
    
    try {
      await createBackup(type);
    } catch (error) {
      Alert.alert('Backup Error', 'Failed to create backup. Please try again.');
    }
  };
  
  const handleRestore = async () => {
    try {
      await restoreBackup();
    } catch (error) {
      Alert.alert('Restore Error', 'Failed to restore backup. Please try again.');
    }
  };
  
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBarStyle} />
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.notLoggedInText, { color: colors.text }]}>
            Please log in to use backup and restore features
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => {
              // Navigate to login screen
              // This would be handled by your navigation system
            }}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <ScrollView>
        <View style={styles.header}>
          <Ionicons
            name="cloud-done-outline"
            size={40}
            color={colors.primary}
            style={styles.headerIcon}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Backup and Restore
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Save and restore your WeatherQuick data
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Backup Options
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Create a backup of your data to restore later or transfer to another device.
          </Text>
          
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: colors.primary }]}
            onPress={() => handleBackup('all')}
            disabled={isCreating || isRestoring}
          >
            {isCreating ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.buttonText} />
                <Text style={[styles.mainButtonText, { color: colors.buttonText }]}>
                  Backup All Data
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
              {showOptions ? 'Hide Options' : 'Show Specific Backup Options'}
            </Text>
            <Ionicons
              name={showOptions ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
          
          {showOptions && (
            <View style={styles.optionsContainer}>
              <BackupOption
                type="preferences"
                title="User Preferences"
                description="Backup your app preferences, theme selections, and notification settings."
                onPress={handleBackup}
                disabled={isCreating || isRestoring}
              />
              
              <BackupOption
                type="locations"
                title="Saved Locations"
                description="Backup your saved locations and favorite places."
                onPress={handleBackup}
                disabled={isCreating || isRestoring}
              />
              
              <BackupOption
                type="subscription"
                title="Subscription Status"
                description="Backup your premium subscription information."
                onPress={handleBackup}
                isPremium={true}
                disabled={isCreating || isRestoring || !isPremium}
              />
              
              <BackupOption
                type="recommendations"
                title="Recommendation History"
                description="Backup your weather recommendations history."
                onPress={handleBackup}
                isPremium={true}
                disabled={isCreating || isRestoring || !isPremium}
              />
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Restore from Backup
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Restore your previously backed up data from a file.
          </Text>
          
          <TouchableOpacity
            style={[
              styles.mainButton,
              { backgroundColor: colors.secondary }
            ]}
            onPress={handleRestore}
            disabled={isCreating || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={20} color={colors.buttonText} />
                <Text style={[styles.mainButtonText, { color: colors.buttonText }]}>
                  Restore from Backup
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.warning, { color: colors.error }]}>
            Warning: Restoring from a backup will replace your current data.
          </Text>
        </View>
        
        {result && (
          <View 
            style={[
              styles.resultContainer,
              { 
                backgroundColor: result.success ? colors.successLight : colors.errorLight,
                borderColor: result.success ? colors.success : colors.error
              }
            ]}
          >
            <View style={styles.resultHeader}>
              <Ionicons
                name={result.success ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={24}
                color={result.success ? colors.success : colors.error}
              />
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {result.success ? 'Success' : 'Error'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={clearResult}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.resultMessage, { color: colors.text }]}>
              {result.message}
            </Text>
            {result.errors && result.errors.length > 0 && (
              <View style={styles.errorsContainer}>
                {result.errors.map((error, index) => (
                  <Text 
                    key={index}
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  toggleButtonText: {
    fontSize: 14,
    marginRight: 5,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  optionIconContainer: {
    alignItems: 'flex-end',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  warning: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  resultContainer: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 10,
  },
  errorsContainer: {
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 2,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BackupRestoreScreen; 
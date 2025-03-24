import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export enum BackupContentType {
  ALL = 'all',
  PREFERENCES = 'preferences',
  LOCATIONS = 'locations',
  SUBSCRIPTION = 'subscription',
  RECOMMENDATIONS = 'recommendations'
}

interface BackupMetadata {
  appVersion: string;
  backupVersion: string;
  createdAt: string;
  userId: string;
  contentType: BackupContentType;
  contents: string[];
}

interface BackupData {
  metadata: BackupMetadata;
  preferences?: Record<string, any>;
  locations?: Array<any>;
  subscription?: Record<string, any>;
  recommendations?: Array<any>;
  asyncStorage?: Record<string, string>;
}

/**
 * Service for backing up and restoring user data
 */
export class BackupService {
  private appVersion: string = '1.0.0';
  private backupVersion: string = '1.0';
  private userId: string | null = null;
  
  /**
   * Set the user ID for the backup service
   */
  setUserId(userId: string | null) {
    this.userId = userId;
  }
  
  /**
   * Set the app version
   */
  setAppVersion(version: string) {
    this.appVersion = version;
  }

  /**
   * Create backup metadata
   */
  private createBackupMetadata(contentType: BackupContentType, contents: string[]): BackupMetadata {
    if (!this.userId) {
      throw new Error('User ID not set. Cannot create backup.');
    }
    
    return {
      appVersion: this.appVersion,
      backupVersion: this.backupVersion,
      createdAt: new Date().toISOString(),
      userId: this.userId,
      contentType,
      contents
    };
  }

  /**
   * Fetch user preferences from Supabase
   */
  private async fetchUserPreferences(): Promise<Record<string, any> | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId);
        
      if (error) {
        console.error('Error fetching user preferences:', error);
        return null;
      }
      
      return { preferences: data || [] };
    } catch (err) {
      console.error('Error in fetchUserPreferences:', err);
      return null;
    }
  }

  /**
   * Fetch saved locations from Supabase
   */
  private async fetchSavedLocations(): Promise<Array<any> | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', this.userId);
        
      if (error) {
        console.error('Error fetching saved locations:', error);
        return null;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error in fetchSavedLocations:', err);
      return null;
    }
  }

  /**
   * Fetch subscription data from Supabase
   */
  private async fetchSubscriptionData(): Promise<Record<string, any> | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', this.userId)
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is the error code for no rows returned
        console.error('Error fetching subscription data:', error);
        return null;
      }
      
      return data || {};
    } catch (err) {
      console.error('Error in fetchSubscriptionData:', err);
      return null;
    }
  }

  /**
   * Fetch recommendation history from Supabase
   */
  private async fetchRecommendationHistory(): Promise<Array<any> | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('recommendation_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false })
        .limit(100); // Limit to most recent 100 recommendations
        
      if (error) {
        console.error('Error fetching recommendation history:', error);
        return null;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error in fetchRecommendationHistory:', err);
      return null;
    }
  }

  /**
   * Fetch AsyncStorage data
   */
  private async fetchAsyncStorageData(): Promise<Record<string, string> | null> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      
      const asyncStorageData: Record<string, string> = {};
      result.forEach(([key, value]) => {
        if (value !== null) {
          asyncStorageData[key] = value;
        }
      });
      
      return asyncStorageData;
    } catch (err) {
      console.error('Error fetching AsyncStorage data:', err);
      return null;
    }
  }

  /**
   * Create a backup file
   */
  async createBackup(contentType: BackupContentType = BackupContentType.ALL): Promise<string | null> {
    if (!this.userId) {
      throw new Error('User ID not set. Cannot create backup.');
    }
    
    try {
      const backup: BackupData = {
        metadata: this.createBackupMetadata(contentType, []),
      };
      
      const contents: string[] = [];
      
      // Fetch data based on content type
      if (contentType === BackupContentType.ALL || contentType === BackupContentType.PREFERENCES) {
        backup.preferences = await this.fetchUserPreferences();
        if (backup.preferences) contents.push('preferences');
      }
      
      if (contentType === BackupContentType.ALL || contentType === BackupContentType.LOCATIONS) {
        backup.locations = await this.fetchSavedLocations();
        if (backup.locations) contents.push('locations');
      }
      
      if (contentType === BackupContentType.ALL || contentType === BackupContentType.SUBSCRIPTION) {
        backup.subscription = await this.fetchSubscriptionData();
        if (backup.subscription) contents.push('subscription');
      }
      
      if (contentType === BackupContentType.ALL || contentType === BackupContentType.RECOMMENDATIONS) {
        backup.recommendations = await this.fetchRecommendationHistory();
        if (backup.recommendations) contents.push('recommendations');
      }
      
      // Always include AsyncStorage for app settings
      backup.asyncStorage = await this.fetchAsyncStorageData();
      if (backup.asyncStorage) contents.push('asyncStorage');
      
      // Update metadata with contents
      backup.metadata.contents = contents;
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `weatherquick-backup-${contentType}-${timestamp}.json`;
      
      // Save backup to file
      const backupString = JSON.stringify(backup, null, 2);
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, backupString);
      
      return filePath;
    } catch (err) {
      console.error('Error creating backup:', err);
      return null;
    }
  }

  /**
   * Share a backup file
   */
  async shareBackup(contentType: BackupContentType = BackupContentType.ALL): Promise<boolean> {
    try {
      const backupPath = await this.createBackup(contentType);
      
      if (!backupPath) {
        throw new Error('Failed to create backup file');
      }
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(backupPath, {
          mimeType: 'application/json',
          dialogTitle: 'Share Backup File'
        });
        return true;
      } else {
        console.error('Sharing is not available on this device');
        return false;
      }
    } catch (err) {
      console.error('Error sharing backup:', err);
      return false;
    }
  }

  /**
   * Pick a backup file to restore
   */
  async pickBackupFile(): Promise<string | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        return result.uri;
      } else {
        return null;
      }
    } catch (err) {
      console.error('Error picking backup file:', err);
      return null;
    }
  }

  /**
   * Validate a backup file
   */
  async validateBackupFile(filePath: string): Promise<BackupData | null> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const backup = JSON.parse(fileContent) as BackupData;
      
      // Validate backup metadata
      if (!backup.metadata || !backup.metadata.backupVersion || !backup.metadata.userId) {
        throw new Error('Invalid backup file format');
      }
      
      // Check backup version compatibility
      if (backup.metadata.backupVersion !== this.backupVersion) {
        console.warn(`Backup version mismatch. Expected ${this.backupVersion}, got ${backup.metadata.backupVersion}`);
        // Could throw an error here if we want to prevent restoring incompatible backups
      }
      
      return backup;
    } catch (err) {
      console.error('Error validating backup file:', err);
      return null;
    }
  }

  /**
   * Restore user preferences from backup
   */
  private async restoreUserPreferences(preferences: Record<string, any>): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // First delete existing preferences
      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', this.userId);
        
      if (deleteError) {
        console.error('Error deleting existing preferences:', deleteError);
        return false;
      }
      
      // Insert new preferences
      if (preferences.preferences && preferences.preferences.length > 0) {
        const newPreferences = preferences.preferences.map((pref: any) => ({
          ...pref,
          user_id: this.userId,
          id: undefined, // Let Supabase generate a new ID
          updated_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert(newPreferences);
          
        if (insertError) {
          console.error('Error inserting restored preferences:', insertError);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error in restoreUserPreferences:', err);
      return false;
    }
  }

  /**
   * Restore saved locations from backup
   */
  private async restoreSavedLocations(locations: Array<any>): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // First delete existing locations
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('user_id', this.userId);
        
      if (deleteError) {
        console.error('Error deleting existing locations:', deleteError);
        return false;
      }
      
      // Insert new locations
      if (locations.length > 0) {
        const newLocations = locations.map((loc: any) => ({
          ...loc,
          user_id: this.userId,
          updated_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('locations')
          .insert(newLocations);
          
        if (insertError) {
          console.error('Error inserting restored locations:', insertError);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error in restoreSavedLocations:', err);
      return false;
    }
  }

  /**
   * Restore subscription data from backup
   */
  private async restoreSubscriptionData(subscription: Record<string, any>): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // First delete existing subscription
      const { error: deleteError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', this.userId);
        
      if (deleteError) {
        console.error('Error deleting existing subscription:', deleteError);
        return false;
      }
      
      // Insert new subscription if it exists
      if (Object.keys(subscription).length > 0) {
        const newSubscription = {
          ...subscription,
          user_id: this.userId,
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert(newSubscription);
          
        if (insertError) {
          console.error('Error inserting restored subscription:', insertError);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error in restoreSubscriptionData:', err);
      return false;
    }
  }

  /**
   * Restore recommendation history from backup
   */
  private async restoreRecommendationHistory(recommendations: Array<any>): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // First delete existing recommendation history
      const { error: deleteError } = await supabase
        .from('recommendation_history')
        .delete()
        .eq('user_id', this.userId);
        
      if (deleteError) {
        console.error('Error deleting existing recommendation history:', deleteError);
        return false;
      }
      
      // Insert new recommendation history
      if (recommendations.length > 0) {
        const newRecommendations = recommendations.map((rec: any) => ({
          ...rec,
          user_id: this.userId,
        }));
        
        const { error: insertError } = await supabase
          .from('recommendation_history')
          .insert(newRecommendations);
          
        if (insertError) {
          console.error('Error inserting restored recommendation history:', insertError);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error in restoreRecommendationHistory:', err);
      return false;
    }
  }

  /**
   * Restore AsyncStorage data from backup
   */
  private async restoreAsyncStorageData(asyncStorage: Record<string, string>): Promise<boolean> {
    try {
      // Clear existing AsyncStorage data first (except for auth-related items)
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => !key.includes('auth') && !key.includes('token'));
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
      // Restore AsyncStorage data
      const pairs = Object.entries(asyncStorage)
        .filter(([key]) => !key.includes('auth') && !key.includes('token'));
      
      if (pairs.length > 0) {
        await AsyncStorage.multiSet(pairs);
      }
      
      return true;
    } catch (err) {
      console.error('Error in restoreAsyncStorageData:', err);
      return false;
    }
  }

  /**
   * Restore data from a backup file
   */
  async restoreFromFile(filePath: string): Promise<{
    success: boolean;
    restoredItems: string[];
    errors?: string[];
  }> {
    if (!this.userId) {
      throw new Error('User ID not set. Cannot restore backup.');
    }
    
    try {
      const backup = await this.validateBackupFile(filePath);
      
      if (!backup) {
        throw new Error('Invalid backup file');
      }
      
      const restoredItems: string[] = [];
      const errors: string[] = [];
      
      // Restore data based on available content
      if (backup.preferences && backup.metadata.contents.includes('preferences')) {
        const success = await this.restoreUserPreferences(backup.preferences);
        if (success) {
          restoredItems.push('preferences');
        } else {
          errors.push('Failed to restore preferences');
        }
      }
      
      if (backup.locations && backup.metadata.contents.includes('locations')) {
        const success = await this.restoreSavedLocations(backup.locations);
        if (success) {
          restoredItems.push('locations');
        } else {
          errors.push('Failed to restore locations');
        }
      }
      
      if (backup.subscription && backup.metadata.contents.includes('subscription')) {
        const success = await this.restoreSubscriptionData(backup.subscription);
        if (success) {
          restoredItems.push('subscription');
        } else {
          errors.push('Failed to restore subscription');
        }
      }
      
      if (backup.recommendations && backup.metadata.contents.includes('recommendations')) {
        const success = await this.restoreRecommendationHistory(backup.recommendations);
        if (success) {
          restoredItems.push('recommendations');
        } else {
          errors.push('Failed to restore recommendation history');
        }
      }
      
      if (backup.asyncStorage && backup.metadata.contents.includes('asyncStorage')) {
        const success = await this.restoreAsyncStorageData(backup.asyncStorage);
        if (success) {
          restoredItems.push('asyncStorage');
        } else {
          errors.push('Failed to restore app settings');
        }
      }
      
      return {
        success: restoredItems.length > 0,
        restoredItems,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (err) {
      console.error('Error restoring from backup:', err);
      return {
        success: false,
        restoredItems: [],
        errors: [(err as Error).message]
      };
    }
  }
}

// Export singleton instance
export const backupService = new BackupService(); 
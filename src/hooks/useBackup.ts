import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { backupService, BackupContentType } from '../services/BackupService';
import { useAuth } from './useAuth';

/**
 * Types of data that can be backed up
 */
export type BackupType = 'all' | 'preferences' | 'locations' | 'subscription' | 'recommendations';

/**
 * Result of a backup or restore operation
 */
export interface BackupResult {
  success: boolean;
  message: string;
  items?: string[];
  errors?: string[];
}

/**
 * Hook for using the BackupService
 */
export const useBackup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [result, setResult] = useState<BackupResult | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    // Set the user ID in the backup service whenever the user changes
    backupService.setUserId(user?.id || null);
  }, [user]);
  
  /**
   * Map a BackupType to a BackupContentType
   */
  const mapBackupType = (type: BackupType): BackupContentType => {
    switch (type) {
      case 'all':
        return BackupContentType.ALL;
      case 'preferences':
        return BackupContentType.PREFERENCES;
      case 'locations':
        return BackupContentType.LOCATIONS;
      case 'subscription':
        return BackupContentType.SUBSCRIPTION;
      case 'recommendations':
        return BackupContentType.RECOMMENDATIONS;
      default:
        return BackupContentType.ALL;
    }
  };
  
  /**
   * Create and share a backup file
   */
  const createBackup = async (type: BackupType = 'all'): Promise<BackupResult> => {
    if (!user) {
      return {
        success: false,
        message: 'You need to be logged in to create a backup'
      };
    }
    
    setIsCreating(true);
    setResult(null);
    
    try {
      const contentType = mapBackupType(type);
      const success = await backupService.shareBackup(contentType);
      
      const result: BackupResult = {
        success,
        message: success 
          ? 'Backup created and shared successfully' 
          : 'Failed to create or share backup',
        items: success ? [type] : undefined
      };
      
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Unknown error occurred';
      const result: BackupResult = {
        success: false,
        message: `Error creating backup: ${errorMessage}`,
        errors: [errorMessage]
      };
      
      setResult(result);
      return result;
    } finally {
      setIsCreating(false);
    }
  };
  
  /**
   * Pick and restore a backup file
   */
  const restoreBackup = async (): Promise<BackupResult> => {
    if (!user) {
      return {
        success: false,
        message: 'You need to be logged in to restore a backup'
      };
    }
    
    setIsRestoring(true);
    setResult(null);
    
    try {
      // Pick a backup file
      const filePath = await backupService.pickBackupFile();
      
      if (!filePath) {
        const result: BackupResult = {
          success: false,
          message: 'No backup file selected'
        };
        
        setResult(result);
        return result;
      }
      
      // Show confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Restore Backup',
          'Are you sure you want to restore from this backup? This will overwrite your current data.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                const result: BackupResult = {
                  success: false,
                  message: 'Restore cancelled by user'
                };
                
                setResult(result);
                setIsRestoring(false);
                resolve(result);
              }
            },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                try {
                  // Restore from backup file
                  const restoreResult = await backupService.restoreFromFile(filePath);
                  
                  const result: BackupResult = {
                    success: restoreResult.success,
                    message: restoreResult.success
                      ? `Backup restored successfully. Restored items: ${restoreResult.restoredItems.join(', ')}`
                      : 'Failed to restore backup',
                    items: restoreResult.restoredItems,
                    errors: restoreResult.errors
                  };
                  
                  setResult(result);
                  
                  // Show success or error message
                  Alert.alert(
                    restoreResult.success ? 'Restore Successful' : 'Restore Failed',
                    result.message,
                    [{ text: 'OK' }]
                  );
                  
                  resolve(result);
                } catch (err) {
                  const errorMessage = (err as Error).message || 'Unknown error occurred';
                  const result: BackupResult = {
                    success: false,
                    message: `Error restoring backup: ${errorMessage}`,
                    errors: [errorMessage]
                  };
                  
                  setResult(result);
                  
                  // Show error message
                  Alert.alert('Restore Failed', result.message, [{ text: 'OK' }]);
                  
                  resolve(result);
                } finally {
                  setIsRestoring(false);
                }
              }
            }
          ]
        );
      });
    } catch (err) {
      const errorMessage = (err as Error).message || 'Unknown error occurred';
      const result: BackupResult = {
        success: false,
        message: `Error restoring backup: ${errorMessage}`,
        errors: [errorMessage]
      };
      
      setResult(result);
      setIsRestoring(false);
      return result;
    }
  };
  
  return {
    createBackup,
    restoreBackup,
    isCreating,
    isRestoring,
    result,
    clearResult: () => setResult(null)
  };
}; 
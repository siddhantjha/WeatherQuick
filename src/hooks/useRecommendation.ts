import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  RecommendationService, 
  RecommendationType, 
  ActivityRecommendation,
  ClothingRecommendation,
  TransportationRecommendation,
  HealthAdvisory
} from '../services/RecommendationService';

/**
 * Hook for using weather-based recommendations
 */
export const useRecommendation = () => {
  const { user } = useAuth();
  const [service, setService] = useState<RecommendationService>(
    new RecommendationService(user?.id || null)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update service when user changes
  useEffect(() => {
    service.setUserId(user?.id || null);
    
    // Load user preferences when user is available
    if (user?.id) {
      setIsLoading(true);
      service.loadUserPreferences()
        .then(() => setIsLoading(false))
        .catch(err => {
          console.error('Error loading user preferences:', err);
          setError('Failed to load user preferences');
          setIsLoading(false);
        });
    }
  }, [user]);

  /**
   * Get activity recommendations for the given weather data
   */
  const getActivityRecommendations = (weather: any): ActivityRecommendation[] => {
    try {
      return service.getActivityRecommendations(weather);
    } catch (err) {
      console.error('Error getting activity recommendations:', err);
      setError('Failed to get activity recommendations');
      return [];
    }
  };

  /**
   * Get clothing recommendations for the given weather data
   */
  const getClothingRecommendations = (weather: any): ClothingRecommendation[] => {
    try {
      return service.getClothingRecommendations(weather);
    } catch (err) {
      console.error('Error getting clothing recommendations:', err);
      setError('Failed to get clothing recommendations');
      return [];
    }
  };

  /**
   * Get transportation recommendations for the given weather data
   */
  const getTransportationRecommendations = (weather: any): TransportationRecommendation[] => {
    try {
      return service.getTransportationRecommendations(weather);
    } catch (err) {
      console.error('Error getting transportation recommendations:', err);
      setError('Failed to get transportation recommendations');
      return [];
    }
  };

  /**
   * Get health advisories for the given weather data
   */
  const getHealthAdvisories = (weather: any): HealthAdvisory[] => {
    try {
      return service.getHealthAdvisories(weather);
    } catch (err) {
      console.error('Error getting health advisories:', err);
      setError('Failed to get health advisories');
      return [];
    }
  };

  /**
   * Save a user preference
   */
  const saveUserPreference = async (key: string, value: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.saveUserPreference(key, value);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error saving user preference:', err);
      setError('Failed to save user preference');
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Record that a recommendation was shown to the user
   */
  const recordRecommendationShown = async (
    recommendationId: string,
    type: RecommendationType,
    locationId: string,
    weatherCondition: string,
    temperature: number
  ): Promise<boolean> => {
    try {
      return await service.recordRecommendationShown(
        recommendationId, 
        type, 
        locationId, 
        weatherCondition, 
        temperature
      );
    } catch (err) {
      console.error('Error recording recommendation view:', err);
      return false;
    }
  };

  /**
   * Record user feedback about a recommendation
   */
  const saveUserFeedback = async (recommendationId: string, helpful: boolean): Promise<boolean> => {
    try {
      return await service.saveUserFeedback(recommendationId, helpful);
    } catch (err) {
      console.error('Error saving recommendation feedback:', err);
      return false;
    }
  };

  /**
   * Get recommendation history for the current user
   */
  const getRecommendationHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await service.getRecommendationHistory();
      setIsLoading(false);
      return history;
    } catch (err) {
      console.error('Error getting recommendation history:', err);
      setError('Failed to get recommendation history');
      setIsLoading(false);
      return [];
    }
  };

  return {
    getActivityRecommendations,
    getClothingRecommendations,
    getTransportationRecommendations,
    getHealthAdvisories,
    saveUserPreference,
    recordRecommendationShown,
    saveUserFeedback,
    getRecommendationHistory,
    isLoading,
    error
  };
}; 
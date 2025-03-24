import { useState } from 'react';
import { sharingService, SharingService } from '../services/SharingService';
import { RecommendationType } from '../services/RecommendationService';

/**
 * Hook for using the SharingService
 */
export const useSharing = () => {
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Share current weather information as text
   */
  const shareWeather = async (
    locationName: string,
    temperature: number,
    condition: string,
    feelsLike: number,
    humidity: number,
    windSpeed: number,
    appName?: string
  ): Promise<boolean> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await sharingService.shareWeather(
        locationName,
        temperature,
        condition,
        feelsLike,
        humidity,
        windSpeed,
        appName
      );
      
      setIsSharing(false);
      return result;
    } catch (err) {
      console.error('Error in shareWeather:', err);
      setError('Failed to share weather information');
      setIsSharing(false);
      return false;
    }
  };

  /**
   * Share a daily forecast as text
   */
  const shareForecast = async (
    locationName: string,
    days: Array<{
      date: string;
      temperatureMax: number;
      temperatureMin: number;
      condition: string;
      precipitation: number;
    }>,
    appName?: string
  ): Promise<boolean> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await sharingService.shareForecast(
        locationName,
        days,
        appName
      );
      
      setIsSharing(false);
      return result;
    } catch (err) {
      console.error('Error in shareForecast:', err);
      setError('Failed to share forecast information');
      setIsSharing(false);
      return false;
    }
  };

  /**
   * Share a recommendation
   */
  const shareRecommendation = async (
    type: RecommendationType,
    title: string,
    description: string,
    locationName: string,
    condition: string,
    temperature: number,
    appName?: string
  ): Promise<boolean> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await sharingService.shareRecommendation(
        type,
        title,
        description,
        locationName,
        condition,
        temperature,
        appName
      );
      
      setIsSharing(false);
      return result;
    } catch (err) {
      console.error('Error in shareRecommendation:', err);
      setError('Failed to share recommendation');
      setIsSharing(false);
      return false;
    }
  };

  /**
   * Share multiple recommendations
   */
  const shareRecommendations = async (
    items: Array<{
      type: RecommendationType;
      title: string;
      description: string;
    }>,
    locationName: string,
    condition: string,
    temperature: number,
    appName?: string
  ): Promise<boolean> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await sharingService.shareRecommendations(
        items,
        locationName,
        condition,
        temperature,
        appName
      );
      
      setIsSharing(false);
      return result;
    } catch (err) {
      console.error('Error in shareRecommendations:', err);
      setError('Failed to share recommendations');
      setIsSharing(false);
      return false;
    }
  };

  /**
   * Share a screenshot as an image
   */
  const shareScreenshot = async (
    viewRef: any,
    fileName?: string
  ): Promise<boolean> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await sharingService.shareScreenshot(viewRef, fileName);
      
      setIsSharing(false);
      return result;
    } catch (err) {
      console.error('Error in shareScreenshot:', err);
      setError('Failed to share screenshot');
      setIsSharing(false);
      return false;
    }
  };

  /**
   * Save a screenshot to the device's media library
   */
  const saveScreenshot = async (
    viewRef: any,
    fileName?: string
  ): Promise<boolean> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await sharingService.saveScreenshot(viewRef, fileName);
      
      setIsSharing(false);
      return result;
    } catch (err) {
      console.error('Error in saveScreenshot:', err);
      setError('Failed to save screenshot');
      setIsSharing(false);
      return false;
    }
  };

  /**
   * Export weather data as a JSON file and share it
   */
  const exportWeatherData = async (
    data: any,
    fileName?: string
  ): Promise<boolean> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await sharingService.exportWeatherData(data, fileName);
      
      setIsSharing(false);
      return result;
    } catch (err) {
      console.error('Error in exportWeatherData:', err);
      setError('Failed to export weather data');
      setIsSharing(false);
      return false;
    }
  };

  return {
    isSharing,
    error,
    shareWeather,
    shareForecast,
    shareRecommendation,
    shareRecommendations,
    shareScreenshot,
    saveScreenshot,
    exportWeatherData
  };
}; 
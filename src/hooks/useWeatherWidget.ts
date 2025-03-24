import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useWeatherService } from './useWeatherService';
import { useLocationService } from './useLocationService';
import { useSubscription } from './useSubscription';

export interface WidgetWeatherData {
  locationName: string;
  temperature: number;
  condition: string;
  conditionIcon: string;
  highTemp: number;
  lowTemp: number;
  precipitation: number;
  updatedAt: Date;
}

export interface UseWeatherWidgetResult {
  widgetData: WidgetWeatherData[];
  isLoading: boolean;
  error: string | null;
  refreshWidgets: () => Promise<void>;
}

export const useWeatherWidget = (): UseWeatherWidgetResult => {
  const [widgetData, setWidgetData] = useState<WidgetWeatherData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getWeatherForLocation, getWeatherIcon } = useWeatherService();
  const { savedLocations, defaultLocation } = useLocationService();
  const { isPremium } = useSubscription();
  
  // Define the maximum number of widgets based on subscription
  const maxWidgets = isPremium ? 5 : 2;
  
  const loadWidgetData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prioritize default location and limit by maxWidgets
      const locationsToShow = savedLocations
        .sort((a, b) => {
          // Put default location first
          if (a.id === defaultLocation?.id) return -1;
          if (b.id === defaultLocation?.id) return 1;
          return 0;
        })
        .slice(0, maxWidgets);
      
      // If no locations, set empty array and return
      if (locationsToShow.length === 0) {
        setWidgetData([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch weather data for each location
      const weatherPromises = locationsToShow.map(async (location) => {
        const weather = await getWeatherForLocation(location.latitude, location.longitude);
        
        if (!weather) {
          throw new Error(`Failed to fetch weather for ${location.name}`);
        }
        
        // Format data for widget consumption
        return {
          locationName: location.name,
          temperature: weather.current.temp,
          condition: weather.current.weather[0].main,
          conditionIcon: getWeatherIcon(weather.current.weather[0].icon),
          highTemp: weather.daily[0].temp.max,
          lowTemp: weather.daily[0].temp.min,
          precipitation: Math.round(weather.daily[0].pop * 100), // Convert to percentage
          updatedAt: new Date(),
        };
      });
      
      const widgetResults = await Promise.all(weatherPromises);
      setWidgetData(widgetResults);
    } catch (err) {
      console.error('Error loading widget data:', err);
      setError('Failed to load weather widgets. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load widget data on mount and when dependencies change
  useEffect(() => {
    loadWidgetData();
  }, [savedLocations, defaultLocation, isPremium]);
  
  // Function to manually refresh widget data
  const refreshWidgets = async () => {
    await loadWidgetData();
  };
  
  return {
    widgetData,
    isLoading,
    error,
    refreshWidgets,
  };
}; 
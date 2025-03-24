import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { RecommendationType } from './RecommendationService';

/**
 * SharingService provides functionality to share weather data, 
 * forecast information, and recommendations with others
 */
export class SharingService {
  /**
   * Share current weather information as text
   */
  async shareWeather(
    locationName: string,
    temperature: number,
    condition: string,
    feelsLike: number,
    humidity: number,
    windSpeed: number,
    appName: string = 'WeatherQuick'
  ): Promise<boolean> {
    try {
      const message = `Current weather in ${locationName}:\n`
        + `🌡️ ${Math.round(temperature)}°C, ${condition}\n`
        + `🔆 Feels like: ${Math.round(feelsLike)}°C\n`
        + `💧 Humidity: ${humidity}%\n`
        + `💨 Wind: ${windSpeed} km/h\n\n`
        + `Shared from ${appName}`;

      const result = await Share.share({
        message,
        title: `Weather in ${locationName}`,
      });

      return result.action !== Share.dismissedAction;
    } catch (error) {
      console.error('Error sharing weather:', error);
      return false;
    }
  }

  /**
   * Share a daily forecast as text
   */
  async shareForecast(
    locationName: string,
    days: Array<{
      date: string;
      temperatureMax: number;
      temperatureMin: number;
      condition: string;
      precipitation: number;
    }>,
    appName: string = 'WeatherQuick'
  ): Promise<boolean> {
    try {
      let message = `Weather forecast for ${locationName}:\n\n`;

      days.forEach(day => {
        message += `📅 ${day.date}:\n`
          + `🌡️ ${Math.round(day.temperatureMin)}°C to ${Math.round(day.temperatureMax)}°C\n`
          + `🌤️ ${day.condition}\n`
          + `🌧️ Precipitation: ${day.precipitation}mm\n\n`;
      });

      message += `Shared from ${appName}`;

      const result = await Share.share({
        message,
        title: `${days.length}-day forecast for ${locationName}`,
      });

      return result.action !== Share.dismissedAction;
    } catch (error) {
      console.error('Error sharing forecast:', error);
      return false;
    }
  }

  /**
   * Share a recommendation
   */
  async shareRecommendation(
    type: RecommendationType,
    title: string,
    description: string,
    locationName: string,
    condition: string,
    temperature: number,
    appName: string = 'WeatherQuick'
  ): Promise<boolean> {
    try {
      let emoji = '🌤️';
      switch (type) {
        case RecommendationType.ACTIVITY:
          emoji = '🚵';
          break;
        case RecommendationType.CLOTHING:
          emoji = '👕';
          break;
        case RecommendationType.TRANSPORTATION:
          emoji = '🚗';
          break;
        case RecommendationType.HEALTH:
          emoji = '🏥';
          break;
      }

      const message = `${emoji} ${title}\n\n`
        + `${description}\n\n`
        + `Based on current weather in ${locationName}:\n`
        + `🌡️ ${Math.round(temperature)}°C, ${condition}\n\n`
        + `Shared from ${appName}`;

      const result = await Share.share({
        message,
        title: title,
      });

      return result.action !== Share.dismissedAction;
    } catch (error) {
      console.error('Error sharing recommendation:', error);
      return false;
    }
  }

  /**
   * Share multiple recommendations
   */
  async shareRecommendations(
    items: Array<{
      type: RecommendationType;
      title: string;
      description: string;
    }>,
    locationName: string,
    condition: string,
    temperature: number,
    appName: string = 'WeatherQuick'
  ): Promise<boolean> {
    try {
      let message = `Recommendations for ${locationName} (${Math.round(temperature)}°C, ${condition}):\n\n`;

      items.forEach(item => {
        let emoji = '🌤️';
        switch (item.type) {
          case RecommendationType.ACTIVITY:
            emoji = '🚵';
            break;
          case RecommendationType.CLOTHING:
            emoji = '👕';
            break;
          case RecommendationType.TRANSPORTATION:
            emoji = '🚗';
            break;
          case RecommendationType.HEALTH:
            emoji = '🏥';
            break;
        }

        message += `${emoji} ${item.title}\n${item.description}\n\n`;
      });

      message += `Shared from ${appName}`;

      const result = await Share.share({
        message,
        title: `Weather Recommendations for ${locationName}`,
      });

      return result.action !== Share.dismissedAction;
    } catch (error) {
      console.error('Error sharing recommendations:', error);
      return false;
    }
  }

  /**
   * Share a screenshot as an image
   */
  async shareScreenshot(
    viewRef: any,
    fileName: string = 'weather-screenshot.png'
  ): Promise<boolean> {
    try {
      // Capture the view as an image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
      });

      // Check if sharing is available (iOS simulator might not support this)
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri);
        return true;
      } else {
        // Fallback for platforms where direct sharing isn't available
        const result = await Share.share({
          url: uri,
          title: 'Share Weather Screenshot',
        });
        return result.action !== Share.dismissedAction;
      }
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      return false;
    }
  }

  /**
   * Save a screenshot to the device's media library
   */
  async saveScreenshot(
    viewRef: any,
    fileName: string = 'weather-screenshot.png'
  ): Promise<boolean> {
    try {
      // Request permission to access the media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Media library permission not granted');
        return false;
      }

      // Capture the view as an image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      // Clean up temporary file if needed
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return !!asset;
    } catch (error) {
      console.error('Error saving screenshot:', error);
      return false;
    }
  }

  /**
   * Export weather data as a JSON file and share it
   */
  async exportWeatherData(
    data: any,
    fileName: string = 'weather-data.json'
  ): Promise<boolean> {
    try {
      // Convert data to JSON string
      const jsonString = JSON.stringify(data, null, 2);
      
      // Get temporary file path
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      // Write data to file
      await FileSystem.writeAsStringAsync(filePath, jsonString);
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(filePath);
        return true;
      } else {
        console.error('Sharing is not available on this device');
        return false;
      }
    } catch (error) {
      console.error('Error exporting weather data:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const sharingService = new SharingService(); 
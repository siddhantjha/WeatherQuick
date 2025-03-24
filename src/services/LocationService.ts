import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { OPENWEATHERMAP_API_KEY } from '../api/environment';
import { supabase } from '../api/supabase';
import { getUserLocations, addUserLocation, setDefaultLocation } from '../api/supabase/database';

export interface Location {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

// Request location permissions
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const granted = await Geolocation.requestAuthorization('whenInUse');
    return granted === 'granted';
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'WeatherQuick needs access to your location to show local weather.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  }

  return false;
};

// Get current location
export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    console.log('Location permission not granted');
    return null;
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Error getting current location:', error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  });
};

// Get location name using reverse geocoding from OpenWeatherMap
export const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const { name, country, state } = data[0];
      return state ? `${name}, ${state}` : `${name}, ${country}`;
    }
    
    return 'Unknown Location';
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Unknown Location';
  }
};

// Search for locations using OpenWeatherMap Geocoding API
export const searchLocations = async (query: string): Promise<Location[]> => {
  try {
    if (!query || query.length < 3) {
      return [];
    }
    
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHERMAP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data: GeocodingResult[] = await response.json();
    
    return data.map(item => ({
      name: item.state ? `${item.name}, ${item.state}, ${item.country}` : `${item.name}, ${item.country}`,
      latitude: item.lat,
      longitude: item.lon,
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

// Save user's current location to Supabase
export const saveCurrentLocation = async (userId: string): Promise<{ success: boolean; message?: string; locationId?: string }> => {
  try {
    const currentLocation = await getCurrentLocation();
    
    if (!currentLocation) {
      return { success: false, message: 'Unable to get current location' };
    }
    
    const locationName = await getLocationName(currentLocation.latitude, currentLocation.longitude);
    
    // Check if user already has this location
    const existingLocations = await getUserLocations(userId);
    const duplicateLocation = existingLocations.find(
      loc => Math.abs(loc.latitude - currentLocation.latitude) < 0.01 &&
             Math.abs(loc.longitude - currentLocation.longitude) < 0.01
    );
    
    if (duplicateLocation) {
      return { success: true, message: 'Location already saved', locationId: duplicateLocation.id };
    }
    
    // Save new location to Supabase
    const result = await addUserLocation({
      user_id: userId,
      name: locationName,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      is_default: existingLocations.length === 0, // Make default if first location
      position: existingLocations.length,
    });
    
    if (result.success && result.id) {
      // If this is the first location, set it as default
      if (existingLocations.length === 0) {
        await setDefaultLocation(result.id, userId);
      }
      
      return { success: true, locationId: result.id };
    } else {
      return { success: false, message: result.error?.toString() || 'Failed to save location' };
    }
  } catch (error) {
    console.error('Error saving current location:', error);
    return { success: false, message: 'Error saving current location' };
  }
};

// Save a searched location to Supabase
export const saveSearchedLocation = async (
  userId: string,
  location: Location
): Promise<{ success: boolean; message?: string; locationId?: string }> => {
  try {
    // Check if user already has this location
    const existingLocations = await getUserLocations(userId);
    const duplicateLocation = existingLocations.find(
      loc => Math.abs(loc.latitude - location.latitude) < 0.01 &&
             Math.abs(loc.longitude - location.longitude) < 0.01
    );
    
    if (duplicateLocation) {
      return { success: true, message: 'Location already saved', locationId: duplicateLocation.id };
    }
    
    // Save new location to Supabase
    const result = await addUserLocation({
      user_id: userId,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      is_default: existingLocations.length === 0, // Make default if first location
      position: existingLocations.length,
    });
    
    if (result.success && result.id) {
      // If this is the first location, set it as default
      if (existingLocations.length === 0) {
        await setDefaultLocation(result.id, userId);
      }
      
      return { success: true, locationId: result.id };
    } else {
      return { success: false, message: result.error?.toString() || 'Failed to save location' };
    }
  } catch (error) {
    console.error('Error saving searched location:', error);
    return { success: false, message: 'Error saving location' };
  }
}; 
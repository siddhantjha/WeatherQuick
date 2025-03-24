import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { weatherService, WeatherData } from '../services/WeatherService';
import { getUserLocations, getDefaultLocation } from '../api/supabase/database';
import { saveCurrentLocation } from '../services/LocationService';
import { colors } from '../styles/colors';

// Format timestamp to readable time
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format timestamp to day name
const formatDay = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString([], { weekday: 'short' });
};

const WeatherHomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Fetch user's locations from Supabase
  const fetchLocations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get all user locations
      const locationData = await getUserLocations(user.id);
      setLocations(locationData);
      
      // If no locations exist, try to add the current location
      if (locationData.length === 0) {
        setCurrentLocationLoading(true);
        const result = await saveCurrentLocation(user.id);
        if (result.success && result.locationId) {
          // Refresh the locations list
          const updatedLocations = await getUserLocations(user.id);
          setLocations(updatedLocations);
          setSelectedLocationId(result.locationId);
        }
        setCurrentLocationLoading(false);
      } else {
        // Get default location or first location in the list
        const defaultLocation = await getDefaultLocation(user.id);
        if (defaultLocation) {
          setSelectedLocationId(defaultLocation.id);
        } else if (locationData.length > 0) {
          setSelectedLocationId(locationData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load your locations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch weather data for a specific location
  const fetchWeatherForLocation = async (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;
    
    try {
      const data = await weatherService.getWeather(
        location.latitude,
        location.longitude,
        location.name
      );
      
      setWeatherData(prev => ({
        ...prev,
        [locationId]: data
      }));
    } catch (error) {
      console.error(`Error fetching weather for ${location.name}:`, error);
    }
  };

  // Fetch weather data for all locations
  const fetchAllWeatherData = async () => {
    if (locations.length === 0) return;
    
    const promises = locations.map(location => 
      weatherService.getWeather(
        location.latitude,
        location.longitude,
        location.name
      ).then(data => ({ [location.id]: data }))
    );
    
    try {
      const results = await Promise.all(promises);
      const combinedData = results.reduce((acc, curr) => ({...acc, ...curr}), {});
      setWeatherData(combinedData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      Alert.alert('Error', 'Failed to load weather data');
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLocations(), fetchAllWeatherData()]);
    setRefreshing(false);
  };

  // Load data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLocations();
      return () => {};
    }, [fetchLocations])
  );

  // Fetch weather when locations change
  useEffect(() => {
    if (locations.length > 0) {
      fetchAllWeatherData();
    }
  }, [locations]);

  // Fetch weather for selected location
  useEffect(() => {
    if (selectedLocationId) {
      fetchWeatherForLocation(selectedLocationId);
    }
  }, [selectedLocationId]);

  // Get weather data for the selected location
  const selectedLocationWeather = selectedLocationId ? weatherData[selectedLocationId] : null;

  // Navigate to location management screen
  const handleManageLocations = () => {
    navigation.navigate('LocationManagement' as never);
  };

  // Handle location selection
  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId);
  };

  // Render loading state
  if (loading || currentLocationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {currentLocationLoading 
            ? 'Getting your current location...' 
            : 'Loading weather data...'}
        </Text>
      </View>
    );
  }

  // Render empty state
  if (locations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weather</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleManageLocations}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No locations added</Text>
          <Text style={styles.emptySubtext}>
            Add locations to see weather forecasts
          </Text>
          <TouchableOpacity
            style={styles.addLocationButton}
            onPress={handleManageLocations}
          >
            <Text style={styles.addLocationButtonText}>Add Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weather</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleManageLocations}
          >
            <Ionicons name="location-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Location selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.locationSelector}
        >
          {locations.map(location => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationItem,
                selectedLocationId === location.id && styles.selectedLocationItem,
              ]}
              onPress={() => handleSelectLocation(location.id)}
            >
              <Text
                style={[
                  styles.locationName,
                  selectedLocationId === location.id && styles.selectedLocationName,
                ]}
                numberOfLines={1}
              >
                {location.name}
              </Text>
              {location.is_default && (
                <View style={styles.defaultBadge} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Current weather */}
        {selectedLocationWeather ? (
          <View style={styles.currentWeather}>
            <Text style={styles.locationTitle}>
              {selectedLocationWeather.location.name}
            </Text>
            
            <View style={styles.weatherMain}>
              <Text style={styles.temperature}>
                {Math.round(selectedLocationWeather.current.temperature)}
                {weatherService.getTemperatureUnit()}
              </Text>
              
              <View style={styles.weatherIconContainer}>
                <Image
                  source={{ uri: weatherService.getIconUrl(selectedLocationWeather.current.icon, '4x') }}
                  style={styles.weatherIcon}
                />
                <Text style={styles.weatherCondition}>
                  {selectedLocationWeather.current.condition}
                </Text>
              </View>
            </View>
            
            <Text style={styles.weatherDescription}>
              {selectedLocationWeather.current.description}
            </Text>
            
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetail}>
                <Ionicons name="thermometer-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.weatherDetailText}>
                  Feels like {Math.round(selectedLocationWeather.current.feelsLike)}
                  {weatherService.getTemperatureUnit()}
                </Text>
              </View>
              
              <View style={styles.weatherDetail}>
                <Ionicons name="water-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.weatherDetailText}>
                  Humidity {selectedLocationWeather.current.humidity}%
                </Text>
              </View>
              
              <View style={styles.weatherDetail}>
                <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.weatherDetailText}>
                  Pressure {selectedLocationWeather.current.pressure} hPa
                </Text>
              </View>
              
              <View style={styles.weatherDetail}>
                <Ionicons name="md-arrow-forward" size={20} color={colors.textSecondary} 
                  style={{ transform: [{ rotate: `${selectedLocationWeather.current.windDirection}deg` }] }}
                />
                <Text style={styles.weatherDetailText}>
                  Wind {selectedLocationWeather.current.windSpeed} {weatherService.getSpeedUnit()}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.loadingWeather}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading weather data...</Text>
          </View>
        )}

        {/* Hourly forecast */}
        {selectedLocationWeather && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hourly Forecast</Text>
            </View>
            
            <FlatList
              data={selectedLocationWeather.hourly.slice(0, 24)}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hourlyList}
              keyExtractor={(item) => `hourly-${item.time}`}
              renderItem={({ item }) => (
                <View style={styles.hourlyItem}>
                  <Text style={styles.hourlyTime}>{formatTime(item.time)}</Text>
                  <Image
                    source={{ uri: weatherService.getIconUrl(item.icon) }}
                    style={styles.hourlyIcon}
                  />
                  <Text style={styles.hourlyTemp}>
                    {Math.round(item.temperature)}
                    {weatherService.getTemperatureUnit()}
                  </Text>
                </View>
              )}
            />
            
            {/* Daily forecast */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>7-Day Forecast</Text>
            </View>
            
            <View style={styles.dailyContainer}>
              {selectedLocationWeather.daily.map((day, index) => (
                <View key={`daily-${day.date}`} style={styles.dailyItem}>
                  <Text style={styles.dailyDay}>
                    {index === 0 ? 'Today' : formatDay(day.date)}
                  </Text>
                  
                  <Image
                    source={{ uri: weatherService.getIconUrl(day.icon) }}
                    style={styles.dailyIcon}
                  />
                  
                  <View style={styles.dailyTempContainer}>
                    <Text style={styles.dailyTempMax}>
                      {Math.round(day.tempMax)}°
                    </Text>
                    <Text style={styles.dailyTempMin}>
                      {Math.round(day.tempMin)}°
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Weather alerts */}
            {selectedLocationWeather.alerts && selectedLocationWeather.alerts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Weather Alerts</Text>
                </View>
                
                {selectedLocationWeather.alerts.map((alert, index) => (
                  <View key={`alert-${index}`} style={styles.alertItem}>
                    <View style={styles.alertHeader}>
                      <Ionicons name="warning-outline" size={20} color={colors.warning} />
                      <Text style={styles.alertTitle}>{alert.event}</Text>
                    </View>
                    <Text style={styles.alertSender}>
                      Source: {alert.senderName}
                    </Text>
                    <Text style={styles.alertTime}>
                      Until: {new Date(alert.end * 1000).toLocaleString()}
                    </Text>
                    <Text style={styles.alertDescription} numberOfLines={3}>
                      {alert.description}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
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
  locationButton: {
    padding: 8,
  },
  locationSelector: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  locationItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.card,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLocationItem: {
    backgroundColor: colors.primary,
  },
  locationName: {
    fontSize: 14,
    color: colors.text,
    maxWidth: 150,
  },
  selectedLocationName: {
    color: colors.white,
  },
  defaultBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 4,
  },
  currentWeather: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
  },
  weatherIconContainer: {
    alignItems: 'center',
    marginLeft: 16,
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  weatherCondition: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  weatherDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: '45%',
  },
  weatherDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  hourlyList: {
    paddingHorizontal: 8,
  },
  hourlyItem: {
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: colors.card,
    borderRadius: 12,
    width: 80,
  },
  hourlyTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hourlyIcon: {
    width: 40,
    height: 40,
  },
  hourlyTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  dailyContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    padding: 8,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dailyDay: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dailyIcon: {
    width: 40,
    height: 40,
  },
  dailyTempContainer: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'flex-end',
  },
  dailyTempMax: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  dailyTempMin: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  alertItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  alertSender: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingWeather: {
    padding: 32,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addLocationButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addLocationButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WeatherHomeScreen; 
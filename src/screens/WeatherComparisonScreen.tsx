import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationService } from '../hooks/useLocationService';
import { useWeatherService } from '../hooks/useWeatherService';
import { useSubscription } from '../hooks/useSubscription';
import { colors } from '../styles/colors';

// Weather parameters for comparison
type ComparisonParameter = {
  id: string;
  name: string;
  icon: string;
  property: string;
  unit: string;
  isPremium?: boolean;
  formatValue?: (value: any) => string;
};

const WeatherComparisonScreen: React.FC = () => {
  const { savedLocations } = useLocationService();
  const { getWeatherForLocation } = useWeatherService();
  const { isPremium } = useSubscription();
  
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationWeatherData, setLocationWeatherData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeParameter, setActiveParameter] = useState<string>('temperature');
  
  // Available comparison parameters
  const comparisonParameters: ComparisonParameter[] = [
    {
      id: 'temperature',
      name: 'Temperature',
      icon: 'thermometer',
      property: 'current.temperature',
      unit: '°C',
      formatValue: (value) => Math.round(value).toString()
    },
    {
      id: 'feels_like',
      name: 'Feels Like',
      icon: 'body',
      property: 'current.feels_like',
      unit: '°C',
      formatValue: (value) => Math.round(value).toString()
    },
    {
      id: 'humidity',
      name: 'Humidity',
      icon: 'water',
      property: 'current.humidity',
      unit: '%',
    },
    {
      id: 'wind_speed',
      name: 'Wind Speed',
      icon: 'speedometer',
      property: 'current.wind_speed',
      unit: 'km/h',
    },
    {
      id: 'precipitation',
      name: 'Precipitation',
      icon: 'rainy',
      property: 'current.precipitation',
      unit: 'mm',
      isPremium: true,
    },
    {
      id: 'uv_index',
      name: 'UV Index',
      icon: 'sunny',
      property: 'current.uv_index',
      unit: '',
      isPremium: true,
    },
    {
      id: 'visibility',
      name: 'Visibility',
      icon: 'eye',
      property: 'current.visibility',
      unit: 'km',
      isPremium: true,
      formatValue: (value) => (value / 1000).toFixed(1),
    },
    {
      id: 'pressure',
      name: 'Pressure',
      icon: 'stats-chart',
      property: 'current.pressure',
      unit: 'hPa',
      isPremium: true,
    },
  ];
  
  // Filter parameters based on subscription status
  const availableParameters = comparisonParameters.filter(
    param => !param.isPremium || isPremium
  );
  
  // Fetch weather data for selected locations
  const fetchWeatherData = async () => {
    if (selectedLocations.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const weatherData: Record<string, any> = {};
      
      for (const locationId of selectedLocations) {
        const location = savedLocations.find(loc => loc.id === locationId);
        if (location) {
          const data = await getWeatherForLocation(
            location.latitude,
            location.longitude
          );
          
          if (data) {
            weatherData[locationId] = data;
          }
        }
      }
      
      setLocationWeatherData(weatherData);
    } catch (err) {
      console.error('Error fetching weather data for comparison:', err);
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle location selection for comparison
  const toggleLocationSelection = (locationId: string) => {
    if (selectedLocations.includes(locationId)) {
      setSelectedLocations(selectedLocations.filter(id => id !== locationId));
    } else {
      // Limit to 5 locations for free users, 10 for premium
      const maxLocations = isPremium ? 10 : 3;
      
      if (selectedLocations.length >= maxLocations) {
        Alert.alert(
          isPremium ? 'Maximum Locations' : 'Premium Feature',
          isPremium 
            ? 'You can compare up to 10 locations at once.'
            : 'Free users can compare up to 3 locations. Upgrade to Premium to compare up to 10 locations.',
          isPremium 
            ? [{ text: 'OK' }]
            : [
                { text: 'OK' },
                { 
                  text: 'Upgrade to Premium', 
                  onPress: () => {
                    // Navigate to subscription screen
                    // navigation.navigate('SubscriptionSettings');
                  } 
                }
              ]
        );
        return;
      }
      
      setSelectedLocations([...selectedLocations, locationId]);
    }
  };
  
  // Update weather data when selected locations change
  useEffect(() => {
    fetchWeatherData();
  }, [selectedLocations]);
  
  // Get the value of a weather parameter for a location
  const getParameterValue = (locationId: string, paramId: string) => {
    const parameter = comparisonParameters.find(p => p.id === paramId);
    
    if (!parameter || !locationWeatherData[locationId]) {
      return 'N/A';
    }
    
    // Access nested properties using property path
    const propertyPath = parameter.property.split('.');
    let value = locationWeatherData[locationId];
    
    for (const prop of propertyPath) {
      if (value && value[prop] !== undefined) {
        value = value[prop];
      } else {
        return 'N/A';
      }
    }
    
    // Format value if formatter is provided
    if (parameter.formatValue) {
      return parameter.formatValue(value);
    }
    
    return value.toString();
  };
  
  // Find the best and worst values for a parameter
  const findExtremeValues = (paramId: string) => {
    const parameter = comparisonParameters.find(p => p.id === paramId);
    if (!parameter) return { max: null, min: null };
    
    const values: { locationId: string; value: number }[] = [];
    
    selectedLocations.forEach(locationId => {
      const value = getParameterValue(locationId, paramId);
      if (value !== 'N/A') {
        values.push({ locationId, value: parseFloat(value) });
      }
    });
    
    if (values.length === 0) return { max: null, min: null };
    
    // For temperature and feels_like, higher is better
    // For precipitation, lower is better
    // For UV index, lower is better
    // For visibility, higher is better
    // For others, it depends on preference
    
    const shouldInvert = ['precipitation', 'uv_index'].includes(paramId);
    
    const sorted = values.sort((a, b) => shouldInvert 
      ? a.value - b.value 
      : b.value - a.value
    );
    
    return {
      max: sorted[0]?.locationId,
      min: sorted[sorted.length - 1]?.locationId
    };
  };
  
  // Render the parameter selection tabs
  const renderParameterTabs = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.parameterScrollView}
        contentContainerStyle={styles.parameterTabsContainer}
      >
        {availableParameters.map(param => (
          <TouchableOpacity
            key={param.id}
            style={[
              styles.parameterTab,
              activeParameter === param.id && styles.activeParameterTab
            ]}
            onPress={() => setActiveParameter(param.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeParameter === param.id }}
          >
            <Ionicons 
              name={param.icon as any} 
              size={18} 
              color={activeParameter === param.id ? colors.white : colors.text} 
            />
            <Text 
              style={[
                styles.parameterTabText,
                activeParameter === param.id && styles.activeParameterTabText
              ]}
            >
              {param.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Render the location selection list
  const renderLocationSelection = () => {
    if (savedLocations.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            No saved locations found. Add locations to compare weather.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.locationSelectionContainer}>
        <Text style={styles.sectionTitle}>Select Locations to Compare</Text>
        
        <View style={styles.locationList}>
          {savedLocations.map(location => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationItem,
                selectedLocations.includes(location.id) && styles.selectedLocationItem
              ]}
              onPress={() => toggleLocationSelection(location.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedLocations.includes(location.id) }}
            >
              <Ionicons 
                name={selectedLocations.includes(location.id) ? 'checkbox' : 'square-outline'} 
                size={22} 
                color={selectedLocations.includes(location.id) ? colors.primary : colors.textSecondary} 
                style={styles.locationCheckbox}
              />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{location.name}</Text>
                {location.address && (
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {location.address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {!isPremium && (
          <View style={styles.premiumBanner}>
            <Ionicons name="lock-closed" size={16} color={colors.white} />
            <Text style={styles.premiumBannerText}>
              Upgrade to Premium to compare up to 10 locations and see more parameters!
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render the comparison results
  const renderComparisonResults = () => {
    if (selectedLocations.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            Select locations above to compare weather data.
          </Text>
        </View>
      );
    }
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchWeatherData}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    const activeParam = comparisonParameters.find(p => p.id === activeParameter);
    const { max, min } = findExtremeValues(activeParameter);
    
    return (
      <View style={styles.comparisonResultsContainer}>
        <View style={styles.comparisonHeader}>
          <Text style={styles.comparisonTitle}>
            {activeParam?.name} Comparison
          </Text>
          <Text style={styles.comparisonSubtitle}>
            {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
        
        <View style={styles.comparisonContent}>
          {selectedLocations.map(locationId => {
            const location = savedLocations.find(loc => loc.id === locationId);
            const weatherData = locationWeatherData[locationId];
            if (!location || !weatherData) return null;
            
            const value = getParameterValue(locationId, activeParameter);
            const isBest = locationId === max;
            const isWorst = locationId === min;
            
            return (
              <View 
                key={locationId}
                style={[
                  styles.comparisonItem,
                  isBest && styles.bestComparisonItem,
                  isWorst && styles.worstComparisonItem
                ]}
              >
                <View style={styles.comparisonLocationInfo}>
                  <Text style={styles.comparisonLocationName}>{location.name}</Text>
                  <Text style={styles.comparisonLocationCondition}>
                    {weatherData.current.condition.text}
                  </Text>
                </View>
                
                <View style={styles.comparisonValueContainer}>
                  <Text style={styles.comparisonValue}>
                    {value}
                    <Text style={styles.comparisonUnit}>{activeParam?.unit}</Text>
                  </Text>
                  
                  {isBest && selectedLocations.length > 1 && (
                    <View style={styles.comparisonBadge}>
                      <Ionicons name="trophy" size={12} color={colors.success} />
                      <Text style={styles.comparisonBadgeText}>Best</Text>
                    </View>
                  )}
                  
                  {isWorst && selectedLocations.length > 1 && (
                    <View style={[styles.comparisonBadge, styles.worstBadge]}>
                      <Ionicons name="arrow-down" size={12} color={colors.error} />
                      <Text style={[styles.comparisonBadgeText, styles.worstBadgeText]}>Worst</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather Comparison</Text>
        <Text style={styles.subtitle}>Compare weather between your saved locations</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderLocationSelection()}
        
        {selectedLocations.length > 0 && (
          <>
            {renderParameterTabs()}
            {renderComparisonResults()}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  locationSelectionContainer: {
    padding: 16,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationList: {
    marginBottom: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  selectedLocationItem: {
    backgroundColor: `${colors.primary}10`, // 10% opacity
    borderColor: colors.primary,
    borderWidth: 1,
  },
  locationCheckbox: {
    marginRight: 10,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  locationAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  premiumBannerText: {
    color: colors.white,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  parameterScrollView: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  parameterTabsContainer: {
    paddingBottom: 8,
  },
  parameterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.background,
  },
  activeParameterTab: {
    backgroundColor: colors.primary,
  },
  parameterTabText: {
    fontSize: 14,
    marginLeft: 4,
    color: colors.text,
  },
  activeParameterTabText: {
    color: colors.white,
    fontWeight: '500',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  comparisonResultsContainer: {
    backgroundColor: colors.card,
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  comparisonContent: {
    padding: 8,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: colors.background,
  },
  bestComparisonItem: {
    backgroundColor: `${colors.success}15`, // 15% opacity
  },
  worstComparisonItem: {
    backgroundColor: `${colors.error}10`, // 10% opacity
  },
  comparisonLocationInfo: {
    flex: 1,
  },
  comparisonLocationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  comparisonLocationCondition: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  comparisonValueContainer: {
    alignItems: 'flex-end',
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  comparisonUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`, // 20% opacity
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  comparisonBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 2,
  },
  worstBadge: {
    backgroundColor: `${colors.error}20`, // 20% opacity
  },
  worstBadgeText: {
    color: colors.error,
  },
});

export default WeatherComparisonScreen; 
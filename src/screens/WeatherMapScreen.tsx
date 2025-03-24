import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, UrlTile, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../hooks/useSubscription';
import { useLocationService } from '../hooks/useLocationService';
import { colors } from '../styles/colors';

// Weather map layers
type MapLayer = {
  id: string;
  name: string;
  url: string;
  description: string;
  isPremium: boolean;
  icon: string;
};

const WeatherMapScreen: React.FC = () => {
  const { savedLocations, defaultLocation } = useLocationService();
  const { isPremium } = useSubscription();
  const mapRef = useRef<MapView>(null);
  
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState<boolean>(true);
  
  // Available map layers
  const mapLayers: MapLayer[] = [
    {
      id: 'temperature',
      name: 'Temperature',
      url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
      description: 'Current temperature layer',
      isPremium: false,
      icon: 'thermometer',
    },
    {
      id: 'precipitation',
      name: 'Precipitation',
      url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
      description: 'Current precipitation layer',
      isPremium: false,
      icon: 'rainy',
    },
    {
      id: 'clouds',
      name: 'Clouds',
      url: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
      description: 'Cloud coverage layer',
      isPremium: false,
      icon: 'cloud',
    },
    {
      id: 'wind',
      name: 'Wind Speed',
      url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
      description: 'Wind speed and direction',
      isPremium: true,
      icon: 'compass',
    },
    {
      id: 'pressure',
      name: 'Pressure',
      url: 'https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
      description: 'Atmospheric pressure layer',
      isPremium: true,
      icon: 'speedometer',
    },
  ];
  
  // Filter available layers based on subscription status
  const availableLayers = mapLayers.filter(layer => !layer.isPremium || isPremium);
  
  // Initialize with default layer
  useEffect(() => {
    if (availableLayers.length > 0 && !activeLayer) {
      setActiveLayer(availableLayers[0].id);
    }
  }, [availableLayers]);
  
  // Center map on default location when first loaded
  useEffect(() => {
    if (defaultLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  }, [defaultLocation]);
  
  // Get current active layer object
  const getActiveLayer = () => {
    return mapLayers.find(layer => layer.id === activeLayer);
  };
  
  // Change the active map layer
  const handleLayerChange = (layerId: string) => {
    const layer = mapLayers.find(l => l.id === layerId);
    
    if (layer?.isPremium && !isPremium) {
      Alert.alert(
        'Premium Feature',
        'This weather map layer is only available to premium subscribers. Would you like to upgrade?',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            // Navigate to subscription screen
            // navigation.navigate('Settings', { screen: 'SubscriptionSettings' });
          }}
        ]
      );
      return;
    }
    
    setActiveLayer(layerId);
  };
  
  // Toggle showing of saved locations on the map
  const toggleLocations = () => {
    setShowLocations(!showLocations);
  };
  
  // Center the map on user's default location
  const centerOnDefaultLocation = () => {
    if (defaultLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  };
  
  // Render map controls
  const renderMapControls = () => {
    return (
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnDefaultLocation}
          accessibilityLabel="Center on your location"
          accessibilityRole="button"
        >
          <Ionicons name="locate" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleLocations}
          accessibilityLabel={`${showLocations ? 'Hide' : 'Show'} saved locations`}
          accessibilityRole="button"
        >
          <Ionicons 
            name={showLocations ? "pin" : "pin-outline"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render layer selector
  const renderLayerSelector = () => {
    return (
      <View style={styles.layerSelectorContainer}>
        <Text style={styles.layerTitle}>Weather Layers</Text>
        <View style={styles.layerButtonsContainer}>
          {availableLayers.map(layer => (
            <TouchableOpacity
              key={layer.id}
              style={[
                styles.layerButton,
                activeLayer === layer.id && styles.activeLayerButton
              ]}
              onPress={() => handleLayerChange(layer.id)}
              accessibilityLabel={layer.name}
              accessibilityRole="button"
              accessibilityState={{ selected: activeLayer === layer.id }}
            >
              <Ionicons 
                name={layer.icon as any} 
                size={18} 
                color={activeLayer === layer.id ? colors.white : colors.text} 
              />
              <Text 
                style={[
                  styles.layerButtonText,
                  activeLayer === layer.id && styles.activeLayerButtonText
                ]}
              >
                {layer.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {!isPremium && (
          <View style={styles.premiumBanner}>
            <Ionicons name="lock-closed" size={16} color={colors.white} />
            <Text style={styles.premiumBannerText}>
              Upgrade to Premium for more weather map layers!
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Main render
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading weather map...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setError(null)}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const activeLayerObject = getActiveLayer();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather Map</Text>
        {activeLayerObject && (
          <Text style={styles.subtitle}>{activeLayerObject.description}</Text>
        )}
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: defaultLocation?.latitude || 37.7749,
            longitude: defaultLocation?.longitude || -122.4194,
            latitudeDelta: 10,
            longitudeDelta: 10,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={true}
          loadingEnabled={true}
          loadingIndicatorColor={colors.primary}
          loadingBackgroundColor={colors.background}
        >
          {/* Weather Tile Layer */}
          {activeLayerObject && (
            <UrlTile 
              urlTemplate={activeLayerObject.url}
              zIndex={1}
              opacity={0.6}
            />
          )}
          
          {/* Saved Location Markers */}
          {showLocations && savedLocations.map(location => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.name}
              description={location.address || ''}
              pinColor={location.id === defaultLocation?.id ? colors.primary : colors.secondary}
            />
          ))}
        </MapView>
        
        {renderMapControls()}
      </View>
      
      {renderLayerSelector()}
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
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  layerSelectorContainer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  layerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  layerButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  activeLayerButton: {
    backgroundColor: colors.primary,
  },
  layerButtonText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
  },
  activeLayerButtonText: {
    color: colors.white,
    fontWeight: '600',
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
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
});

export default WeatherMapScreen; 
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useAuth } from '../hooks/useAuth';
import {
  getUserLocations,
  updateLocationOrder,
  setDefaultLocation,
  deleteUserLocation,
} from '../api/supabase/database';
import { 
  getCurrentLocation, 
  getLocationName, 
  saveCurrentLocation,
  searchLocations,
  saveSearchedLocation,
  Location,
} from '../services/LocationService';
import { colors } from '../styles/colors';

const LocationManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingCurrentLocation, setAddingCurrentLocation] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch user locations from Supabase
  const fetchLocations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getUserLocations(user.id);
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load your saved locations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [fetchLocations])
  );

  // Update location order in Supabase
  const handleLocationOrderChange = async (newOrder: any[]) => {
    if (!user?.id) return;
    setLocations(newOrder);
    
    const locationIds = newOrder.map(location => location.id);
    try {
      await updateLocationOrder(user.id, locationIds);
    } catch (error) {
      console.error('Error updating location order:', error);
      Alert.alert('Error', 'Failed to update location order');
    }
  };

  // Set a location as default
  const handleSetDefaultLocation = async (locationId: string) => {
    if (!user?.id) return;
    try {
      const success = await setDefaultLocation(locationId, user.id);
      if (success) {
        // Update local state to reflect the change
        setLocations(prevLocations => 
          prevLocations.map(loc => ({
            ...loc,
            is_default: loc.id === locationId
          }))
        );
        Alert.alert('Success', 'Default location updated');
      } else {
        Alert.alert('Error', 'Failed to update default location');
      }
    } catch (error) {
      console.error('Error setting default location:', error);
      Alert.alert('Error', 'Failed to update default location');
    }
  };

  // Delete a location
  const handleDeleteLocation = async (locationId: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteUserLocation(locationId);
              if (success) {
                setLocations(prevLocations => 
                  prevLocations.filter(loc => loc.id !== locationId)
                );
              } else {
                Alert.alert('Error', 'Failed to delete location');
              }
            } catch (error) {
              console.error('Error deleting location:', error);
              Alert.alert('Error', 'Failed to delete location');
            }
          }
        }
      ]
    );
  };

  // Add current location
  const handleAddCurrentLocation = async () => {
    if (!user?.id) return;
    setAddingCurrentLocation(true);
    try {
      const result = await saveCurrentLocation(user.id);
      
      if (result.success) {
        Alert.alert('Success', 'Current location added');
        fetchLocations();
      } else {
        Alert.alert('Error', result.message || 'Failed to add current location');
      }
    } catch (error) {
      console.error('Error adding current location:', error);
      Alert.alert('Error', 'Failed to add current location');
    } finally {
      setAddingCurrentLocation(false);
    }
  };

  // Search for locations
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setSearching(true);
    setShowSearchResults(true);
    try {
      const results = await searchLocations(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Add a location from search results
  const handleAddSearchedLocation = async (location: Location) => {
    if (!user?.id) return;
    try {
      const result = await saveSearchedLocation(user.id, location);
      
      if (result.success) {
        Alert.alert('Success', 'Location added');
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
        fetchLocations();
      } else {
        Alert.alert('Error', result.message || 'Failed to add location');
      }
    } catch (error) {
      console.error('Error adding searched location:', error);
      Alert.alert('Error', 'Failed to add location');
    }
  };

  const renderLocationItem = ({ item, drag, isActive }: RenderItemParams<any>) => (
    <TouchableOpacity
      style={[
        styles.locationItem,
        isActive && styles.activeLocationItem,
      ]}
      onLongPress={drag}
    >
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationCoords}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
        {item.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <View style={styles.locationActions}>
        {!item.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefaultLocation(item.id)}
          >
            <Ionicons name="star-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteLocation(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
        <Ionicons name="menu" size={24} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderSearchResultItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleAddSearchedLocation(item)}
    >
      <Text style={styles.searchResultName}>{item.name}</Text>
      <Text style={styles.searchResultCoords}>
        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
      </Text>
      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Locations</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.currentLocationButton,
            addingCurrentLocation && styles.disabledButton,
          ]}
          onPress={handleAddCurrentLocation}
          disabled={addingCurrentLocation}
        >
          {addingCurrentLocation ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="locate" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {showSearchResults ? (
        <View style={styles.searchResultsContainer}>
          {searching ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResultItem}
              keyExtractor={(item, index) => `search-${item.name}-${index}`}
              contentContainerStyle={styles.searchResultsList}
            />
          ) : (
            <Text style={styles.noResultsText}>No locations found</Text>
          )}
        </View>
      ) : (
        <>
          {loading ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : locations.length > 0 ? (
            <DraggableFlatList
              data={locations}
              renderItem={renderLocationItem}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => handleLocationOrderChange(data)}
              contentContainerStyle={styles.locationsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No saved locations</Text>
              <Text style={styles.emptySubtext}>
                Add your current location or search for places to save
              </Text>
            </View>
          )}
          
          {locations.length > 0 && locations.length < 3 && (
            <Text style={styles.limitText}>
              {3 - locations.length} more location{locations.length === 2 ? '' : 's'} available (Free tier)
            </Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  locationsList: {
    paddingHorizontal: 16,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeLocationItem: {
    backgroundColor: colors.cardActive,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  defaultText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
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
  },
  loadingIndicator: {
    flex: 1,
    alignSelf: 'center',
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsList: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  searchResultName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  searchResultCoords: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 32,
    color: colors.textSecondary,
    fontSize: 16,
  },
  limitText: {
    textAlign: 'center',
    margin: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default LocationManagementScreen; 
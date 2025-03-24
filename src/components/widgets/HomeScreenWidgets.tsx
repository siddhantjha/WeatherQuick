import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import WeatherWidget from './WeatherWidget';
import { useWeatherWidget } from '../../hooks/useWeatherWidget';
import { useSettings } from '../../hooks/useSettings';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

interface HomeScreenWidgetsProps {
  showTitle?: boolean;
}

const HomeScreenWidgets: React.FC<HomeScreenWidgetsProps> = ({ 
  showTitle = true,
}) => {
  const { widgetData, isLoading, error, refreshWidgets } = useWeatherWidget();
  const { settings } = useSettings();
  const navigation = useNavigation();
  
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshWidgets();
    setRefreshing(false);
  }, [refreshWidgets]);

  const handleAddLocation = () => {
    navigation.navigate('LocationManagement' as never);
  };

  // No locations case
  if (!isLoading && widgetData.length === 0) {
    return (
      <View style={styles.container}>
        {showTitle && <Text style={styles.sectionTitle}>My Weather</Text>}
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No locations added</Text>
          <Text style={styles.emptyText}>
            Add locations to see weather information on your home screen
          </Text>
          <View style={styles.addButtonContainer}>
            <Text style={styles.addButtonText} onPress={handleAddLocation}>
              Add Location
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.sectionTitle}>My Weather</Text>}
      
      {isLoading && widgetData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading widgets...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Text 
            style={styles.retryText}
            onPress={refreshWidgets}
          >
            Tap to retry
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Primary (main) widget - first location */}
          {widgetData.length > 0 && (
            <WeatherWidget
              data={widgetData[0]}
              isPrimary={true}
              useMetric={settings.useMetric}
              style={styles.primaryWidget}
            />
          )}
          
          {/* Secondary widgets - smaller size */}
          <View style={styles.secondaryWidgetsContainer}>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryWidgetsScroll}
            >
              {widgetData.slice(1).map((data, index) => (
                <WeatherWidget
                  key={`secondary-widget-${index}`}
                  data={data}
                  isPrimary={false}
                  useMetric={settings.useMetric}
                />
              ))}
              
              {/* Add location button */}
              <View 
                style={styles.addLocationWidget}
                onTouchEnd={handleAddLocation}
              >
                <Ionicons name="add-circle" size={32} color={colors.primary} />
                <Text style={styles.addLocationText}>Add Location</Text>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    backgroundColor: colors.errorBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  errorText: {
    marginTop: 12,
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  addButtonContainer: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  primaryWidget: {
    width: width - 32,
  },
  secondaryWidgetsContainer: {
    marginTop: 16,
  },
  secondaryWidgetsScroll: {
    paddingRight: 16,
  },
  addLocationWidget: {
    width: 100,
    height: 130,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addLocationText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: colors.primary,
  },
});

export default HomeScreenWidgets; 
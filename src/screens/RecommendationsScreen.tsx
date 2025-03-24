import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRecommendation } from '../hooks/useRecommendation';
import { useLocationService } from '../hooks/useLocationService';
import { useWeatherService } from '../hooks/useWeatherService';
import { useSubscription } from '../hooks/useSubscription';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import { 
  ActivityRecommendation, 
  ClothingRecommendation,
  TransportationRecommendation,
  HealthAdvisory,
  RecommendationType
} from '../services/RecommendationService';
import { colors } from '../styles/colors';

type RecommendationTab = 'activity' | 'clothing' | 'transportation' | 'health';

const RecommendationsScreen: React.FC = () => {
  // Get necessary services and data
  const { defaultLocation } = useLocationService();
  const { getWeatherForLocation } = useWeatherService();
  const { isPremium } = useSubscription();
  const {
    getActivityRecommendations,
    getClothingRecommendations,
    getTransportationRecommendations,
    getHealthAdvisories,
  } = useRecommendation();
  
  // State for weather data and recommendations
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RecommendationTab>('activity');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // State for recommendations
  const [activityRecommendations, setActivityRecommendations] = useState<ActivityRecommendation[]>([]);
  const [clothingRecommendations, setClothingRecommendations] = useState<ClothingRecommendation[]>([]);
  const [transportationRecommendations, setTransportationRecommendations] = useState<TransportationRecommendation[]>([]);
  const [healthAdvisories, setHealthAdvisories] = useState<HealthAdvisory[]>([]);
  
  // Fetch weather data and recommendations
  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!defaultLocation) {
      setIsLoading(false);
      setError('No default location set. Please set a default location to get recommendations.');
      return;
    }
    
    try {
      // Get weather data for the current location
      const weather = await getWeatherForLocation(
        defaultLocation.latitude,
        defaultLocation.longitude
      );
      
      if (!weather) {
        throw new Error('Failed to fetch weather data');
      }
      
      setWeatherData(weather);
      
      // Get recommendations based on weather data
      setActivityRecommendations(getActivityRecommendations(weather));
      setClothingRecommendations(getClothingRecommendations(weather));
      setTransportationRecommendations(getTransportationRecommendations(weather));
      setHealthAdvisories(getHealthAdvisories(weather));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh recommendations
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
  };
  
  // Fetch recommendations when screen comes into focus or default location changes
  useFocusEffect(
    React.useCallback(() => {
      fetchRecommendations();
    }, [defaultLocation])
  );
  
  // Render tab bar
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
        onPress={() => setActiveTab('activity')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'activity' }}
      >
        <Ionicons 
          name="bicycle" 
          size={22} 
          color={activeTab === 'activity' ? colors.primary : colors.textSecondary} 
        />
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'activity' && styles.activeTabText
          ]}
        >
          Activities
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'clothing' && styles.activeTab]}
        onPress={() => setActiveTab('clothing')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'clothing' }}
      >
        <Ionicons 
          name="shirt" 
          size={22} 
          color={activeTab === 'clothing' ? colors.primary : colors.textSecondary} 
        />
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'clothing' && styles.activeTabText
          ]}
        >
          Clothing
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'transportation' && styles.activeTab]}
        onPress={() => setActiveTab('transportation')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'transportation' }}
      >
        <Ionicons 
          name="car" 
          size={22} 
          color={activeTab === 'transportation' ? colors.primary : colors.textSecondary} 
        />
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'transportation' && styles.activeTabText
          ]}
        >
          Transport
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'health' && styles.activeTab]}
        onPress={() => setActiveTab('health')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'health' }}
      >
        <Ionicons 
          name="medkit" 
          size={22} 
          color={activeTab === 'health' ? colors.primary : colors.textSecondary} 
        />
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'health' && styles.activeTabText
          ]}
        >
          Health
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render recommendation content based on active tab
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
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
            onPress={fetchRecommendations}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!weatherData || !weatherData.location) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.warning} />
          <Text style={styles.errorText}>No weather data available</Text>
        </View>
      );
    }
    
    // Limit non-premium users to 2 recommendations per category
    const maxRecommendations = isPremium ? 10 : 2;
    
    switch (activeTab) {
      case 'activity':
        return renderActivityRecommendations(maxRecommendations);
      case 'clothing':
        return renderClothingRecommendations(maxRecommendations);
      case 'transportation':
        return renderTransportationRecommendations(maxRecommendations);
      case 'health':
        return renderHealthAdvisories();
      default:
        return null;
    }
  };
  
  // Render activity recommendations
  const renderActivityRecommendations = (maxItems: number) => {
    const limitedItems = isPremium 
      ? activityRecommendations 
      : activityRecommendations.slice(0, maxItems);
    
    if (limitedItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activity recommendations available</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        <FlatList
          data={limitedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecommendationCard
              id={item.id}
              title={item.activity}
              description={item.description}
              icon={item.icon}
              type={RecommendationType.ACTIVITY}
              suitability={item.suitability}
              locationId={defaultLocation?.id || ''}
              weatherCondition={weatherData.current.condition}
              temperature={weatherData.current.temperature}
            />
          )}
          contentContainerStyle={styles.recommendationList}
          showsVerticalScrollIndicator={false}
        />
        
        {!isPremium && activityRecommendations.length > maxItems && (
          <View style={styles.premiumBanner}>
            <Ionicons name="lock-closed" size={20} color={colors.white} />
            <Text style={styles.premiumBannerText}>
              Upgrade to Premium for {activityRecommendations.length - maxItems} more activity recommendations!
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render clothing recommendations
  const renderClothingRecommendations = (maxItems: number) => {
    const limitedItems = isPremium 
      ? clothingRecommendations 
      : clothingRecommendations.slice(0, maxItems);
    
    if (limitedItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No clothing recommendations available</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        <FlatList
          data={limitedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecommendationCard
              id={item.id}
              title={item.item}
              description={item.description}
              icon={item.icon}
              type={RecommendationType.CLOTHING}
              isEssential={item.essential}
              locationId={defaultLocation?.id || ''}
              weatherCondition={weatherData.current.condition}
              temperature={weatherData.current.temperature}
            />
          )}
          contentContainerStyle={styles.recommendationList}
          showsVerticalScrollIndicator={false}
        />
        
        {!isPremium && clothingRecommendations.length > maxItems && (
          <View style={styles.premiumBanner}>
            <Ionicons name="lock-closed" size={20} color={colors.white} />
            <Text style={styles.premiumBannerText}>
              Upgrade to Premium for {clothingRecommendations.length - maxItems} more clothing recommendations!
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render transportation recommendations
  const renderTransportationRecommendations = (maxItems: number) => {
    const limitedItems = isPremium 
      ? transportationRecommendations 
      : transportationRecommendations.slice(0, maxItems);
    
    if (limitedItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transportation recommendations available</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        <FlatList
          data={limitedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecommendationCard
              id={item.id}
              title={item.mode}
              description={item.description}
              icon={item.icon}
              type={RecommendationType.TRANSPORTATION}
              suitability={item.suitability}
              locationId={defaultLocation?.id || ''}
              weatherCondition={weatherData.current.condition}
              temperature={weatherData.current.temperature}
            />
          )}
          contentContainerStyle={styles.recommendationList}
          showsVerticalScrollIndicator={false}
        />
        
        {!isPremium && transportationRecommendations.length > maxItems && (
          <View style={styles.premiumBanner}>
            <Ionicons name="lock-closed" size={20} color={colors.white} />
            <Text style={styles.premiumBannerText}>
              Upgrade to Premium for {transportationRecommendations.length - maxItems} more transportation options!
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render health advisories
  const renderHealthAdvisories = () => {
    // Health advisories are available to all users regardless of subscription status
    if (healthAdvisories.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No health advisories for current weather conditions</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        <FlatList
          data={healthAdvisories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecommendationCard
              id={item.id}
              title={item.title}
              description={item.description}
              icon={item.icon}
              type={RecommendationType.HEALTH}
              locationId={defaultLocation?.id || ''}
              weatherCondition={weatherData.current.condition}
              temperature={weatherData.current.temperature}
            />
          )}
          contentContainerStyle={styles.recommendationList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Weather Recommendations</Text>
          {weatherData && weatherData.location && (
            <Text style={styles.subtitle}>
              For {weatherData.location.name} • {Math.round(weatherData.current.temperature)}°
            </Text>
          )}
        </View>
        
        {renderTabBar()}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recommendationList: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  premiumBannerText: {
    color: colors.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default RecommendationsScreen; 
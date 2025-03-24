import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { useSubscription } from '../../hooks/useSubscription';

interface WeatherData {
  locationName: string;
  temperature: number;
  condition: string;
  conditionIcon: string;
  highTemp: number;
  lowTemp: number;
  precipitation: number;
  updatedAt: Date;
}

interface WeatherWidgetProps {
  data: WeatherData;
  isPrimary?: boolean;
  style?: ViewStyle;
  useMetric?: boolean;
  onPress?: () => void;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  data,
  isPrimary = false,
  style,
  useMetric = true,
  onPress,
}) => {
  const navigation = useNavigation();
  const { isPremium } = useSubscription();
  
  const formatTemperature = (temp: number): string => {
    return `${Math.round(temp)}${useMetric ? '°C' : '°F'}`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPrecipitationText = (precipitation: number): string => {
    if (precipitation < 10) return 'Low';
    if (precipitation < 40) return 'Moderate';
    return 'High';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to weather detail screen
      navigation.navigate('WeatherDetail' as never, { locationName: data.locationName } as never);
    }
  };

  // Select widget layout based on primary status
  if (isPrimary) {
    return (
      <TouchableOpacity
        style={[styles.primaryContainer, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.primaryHeader}>
          <Text style={styles.locationName}>{data.locationName}</Text>
          <Text style={styles.updatedTime}>Updated {formatTime(data.updatedAt)}</Text>
        </View>
        
        <View style={styles.primaryContent}>
          <View style={styles.currentWeather}>
            <Image
              source={{ uri: data.conditionIcon }}
              style={styles.primaryWeatherIcon}
            />
            <Text style={styles.primaryTemperature}>
              {formatTemperature(data.temperature)}
            </Text>
          </View>
          
          <View style={styles.weatherDetails}>
            <Text style={styles.condition}>{data.condition}</Text>
            <View style={styles.highLowContainer}>
              <View style={styles.highLowItem}>
                <Ionicons name="arrow-up" size={16} color={colors.error} />
                <Text style={styles.highLowText}>{formatTemperature(data.highTemp)}</Text>
              </View>
              <View style={styles.highLowItem}>
                <Ionicons name="arrow-down" size={16} color={colors.primary} />
                <Text style={styles.highLowText}>{formatTemperature(data.lowTemp)}</Text>
              </View>
            </View>
            
            <View style={styles.precipContainer}>
              <Ionicons name="water" size={16} color={colors.primary} />
              <Text style={styles.precipText}>
                {getPrecipitationText(data.precipitation)} ({data.precipitation}%)
              </Text>
            </View>
          </View>
        </View>
        
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="flash" size={12} color={colors.white} />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Secondary (smaller) widget
  return (
    <TouchableOpacity
      style={[styles.secondaryContainer, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.secondaryHeader}>
        <Text style={styles.secondaryLocationName} numberOfLines={1}>
          {data.locationName}
        </Text>
      </View>
      
      <View style={styles.secondaryContent}>
        <Image
          source={{ uri: data.conditionIcon }}
          style={styles.secondaryWeatherIcon}
        />
        <Text style={styles.secondaryTemperature}>
          {formatTemperature(data.temperature)}
        </Text>
      </View>
      
      <View style={styles.secondaryFooter}>
        <View style={styles.secondaryHighLow}>
          <Ionicons name="arrow-up" size={12} color={colors.error} />
          <Text style={styles.secondaryHighLowText}>
            {formatTemperature(data.highTemp)}
          </Text>
          <Ionicons name="arrow-down" size={12} color={colors.primary} />
          <Text style={styles.secondaryHighLowText}>
            {formatTemperature(data.lowTemp)}
          </Text>
        </View>
      </View>
      
      {isPremium && (
        <View style={styles.secondaryPremiumBadge}>
          <Ionicons name="flash" size={10} color={colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Primary (large) widget styles
  primaryContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    marginBottom: 16,
  },
  primaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  updatedTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  primaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentWeather: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 24,
  },
  primaryWeatherIcon: {
    width: 64,
    height: 64,
    marginBottom: 4,
  },
  primaryTemperature: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  weatherDetails: {
    flex: 1,
  },
  condition: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  highLowContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  highLowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  highLowText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
  precipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  precipText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  
  // Secondary (small) widget styles
  secondaryContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    width: 110,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
    marginRight: 12,
  },
  secondaryHeader: {
    marginBottom: 8,
  },
  secondaryLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryWeatherIcon: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  secondaryTemperature: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  secondaryFooter: {
    alignItems: 'center',
  },
  secondaryHighLow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryHighLowText: {
    fontSize: 12,
    color: colors.text,
    marginRight: 6,
    marginLeft: 2,
  },
  secondaryPremiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WeatherWidget; 
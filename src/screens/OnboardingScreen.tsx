import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  image: any;
  backgroundColor: string;
  textColor: string;
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'Welcome to WeatherQuick',
    description: 'Your fast and intuitive weather app, designed to make checking the weather simple and actionable.',
    image: require('../../assets/onboarding-1.png'),
    backgroundColor: '#4A90E2',
    textColor: '#FFFFFF',
  },
  {
    id: '2',
    title: 'Location-Based Weather',
    description: 'Get accurate weather forecasts for your current location and save multiple locations for quick access.',
    image: require('../../assets/onboarding-2.png'),
    backgroundColor: '#50C878',
    textColor: '#FFFFFF',
  },
  {
    id: '3',
    title: 'Detailed Forecasts',
    description: 'View hourly and daily forecasts with all the details you need to plan your day or week ahead.',
    image: require('../../assets/onboarding-3.png'),
    backgroundColor: '#FFA500',
    textColor: '#FFFFFF',
  },
  {
    id: '4',
    title: 'Weather Alerts',
    description: 'Receive important weather notifications and stay informed about changing conditions.',
    image: require('../../assets/onboarding-4.png'),
    backgroundColor: '#FF6347',
    textColor: '#FFFFFF',
  },
  {
    id: '5',
    title: 'Premium Features',
    description: 'Upgrade to Premium for extended forecasts, detailed weather data, custom themes, and more!',
    image: require('../../assets/onboarding-5.png'),
    backgroundColor: '#9370DB',
    textColor: '#FFFFFF',
  },
];

const ONBOARDING_COMPLETE_KEY = '@WeatherQuick:onboardingComplete';

const OnboardingScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    return (
      <View
        style={[
          styles.slide, 
          { backgroundColor: item.backgroundColor, width }
        ]}
      >
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
          <Text style={[styles.description, { color: item.textColor }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderNextButton = () => {
    const isLastSlide = currentIndex === onboardingData.length - 1;
    
    return (
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          if (isLastSlide) {
            completeOnboarding();
          } else {
            flatListRef.current?.scrollToIndex({
              index: currentIndex + 1,
              animated: true,
            });
          }
        }}
      >
        <Text style={styles.buttonText}>
          {isLastSlide ? 'Get Started' : 'Next'}
        </Text>
        <Ionicons 
          name={isLastSlide ? 'checkmark-circle-outline' : 'arrow-forward'} 
          size={20} 
          color={colors.white} 
          style={styles.buttonIcon}
        />
      </TouchableOpacity>
    );
  };

  const renderSkipButton = () => {
    const isLastSlide = currentIndex === onboardingData.length - 1;
    
    if (isLastSlide) {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={completeOnboarding}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={`dot-${i}`}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
                i === currentIndex && styles.activeDot,
              ]}
            />
          );
        })}
      </View>
    );
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      // Navigate to the main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={onboardingData[currentIndex].backgroundColor}
        barStyle="light-content"
      />
      
      <View style={styles.skipButtonContainer}>
        {renderSkipButton()}
      </View>
      
      <FlatList
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={flatListRef}
        scrollEventThrottle={32}
      />
      
      {renderPagination()}
      
      <View style={styles.buttonContainer}>
        {renderNextButton()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 0.4,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 64,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.white,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginVertical: 10,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  skipButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 1,
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen; 
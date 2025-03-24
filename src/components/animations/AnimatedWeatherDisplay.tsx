import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Text,
  ViewStyle,
  useWindowDimensions,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../AccessibilityManager';
import { colors } from '../../styles/colors';

type WeatherCondition = 
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'mist'
  | 'fog'
  | 'haze'
  | 'dust'
  | 'sand'
  | 'ash'
  | 'squall'
  | 'tornado';

interface AnimatedWeatherDisplayProps {
  condition: WeatherCondition;
  temperature: number;
  time?: 'day' | 'night';
  style?: ViewStyle;
  useMetric?: boolean;
}

// Define image assets based on weather condition
const getWeatherAssets = (condition: WeatherCondition, time: 'day' | 'night'): {
  background: string[];
  icon: ImageSourcePropType;
  animation: 'none' | 'rain' | 'snow' | 'clouds' | 'mist' | 'stars' | 'lightning';
} => {
  const isDaytime = time === 'day';
  
  switch (condition) {
    case 'clear':
      return {
        background: isDaytime 
          ? ['#4A90E2', '#87CEFA'] 
          : ['#0C1445', '#2E3B7C'],
        icon: isDaytime 
          ? require('../../assets/weather/clear-day.png') 
          : require('../../assets/weather/clear-night.png'),
        animation: isDaytime ? 'none' : 'stars',
      };
    
    case 'clouds':
      return {
        background: isDaytime 
          ? ['#62717B', '#B8C3CB'] 
          : ['#2D3A4B', '#4A5B6D'],
        icon: isDaytime 
          ? require('../../assets/weather/cloudy-day.png') 
          : require('../../assets/weather/cloudy-night.png'),
        animation: 'clouds',
      };
    
    case 'rain':
    case 'drizzle':
      return {
        background: isDaytime 
          ? ['#57575D', '#98989F'] 
          : ['#262630', '#474755'],
        icon: require('../../assets/weather/rainy.png'),
        animation: 'rain',
      };
    
    case 'thunderstorm':
      return {
        background: ['#2E2D3A', '#4A4960'],
        icon: require('../../assets/weather/thunderstorm.png'),
        animation: 'lightning',
      };
    
    case 'snow':
      return {
        background: isDaytime 
          ? ['#BBC4CE', '#E2EAEF'] 
          : ['#2F3A4A', '#5B6C87'],
        icon: require('../../assets/weather/snowy.png'),
        animation: 'snow',
      };
    
    case 'mist':
    case 'fog':
    case 'haze':
      return {
        background: isDaytime 
          ? ['#A3A9AF', '#C7CDD1'] 
          : ['#484B51', '#696D73'],
        icon: require('../../assets/weather/foggy.png'),
        animation: 'mist',
      };
    
    default:
      return {
        background: isDaytime 
          ? ['#4A90E2', '#87CEFA'] 
          : ['#0C1445', '#2E3B7C'],
        icon: isDaytime 
          ? require('../../assets/weather/clear-day.png') 
          : require('../../assets/weather/clear-night.png'),
        animation: 'none',
      };
  }
};

const AnimatedWeatherDisplay: React.FC<AnimatedWeatherDisplayProps> = ({
  condition,
  temperature,
  time = 'day',
  style,
  useMetric = true,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { settings } = useAccessibility();
  const { reduceMotion } = settings;
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  
  // Get assets for this weather condition
  const assets = getWeatherAssets(condition, time);
  
  // Format temperature display with appropriate unit
  const formattedTemperature = `${Math.round(temperature)}${useMetric ? '°C' : '°F'}`;
  
  // Start animations when component mounts
  useEffect(() => {
    if (reduceMotion) {
      // If reduce motion is enabled, just show the content without animations
      fadeIn.setValue(1);
      iconScale.setValue(1);
      particleOpacity.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(particleOpacity, {
        toValue: 1,
        duration: 1500,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, iconScale, particleOpacity, reduceMotion]);
  
  // Rain animation particles
  const renderRaindrops = () => {
    if (reduceMotion) return null;
    
    const raindrops = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      const startPositionX = Math.random() * windowWidth;
      const startDelay = Math.random() * 2000;
      const duration = 1500 + Math.random() * 1000;
      
      const animatedY = useRef(new Animated.Value(-20)).current;
      const animatedX = useRef(new Animated.Value(startPositionX)).current;
      
      useEffect(() => {
        const animate = () => {
          animatedY.setValue(-20);
          animatedX.setValue(startPositionX);
          
          Animated.timing(animatedY, {
            toValue: windowHeight + 20,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
            delay: startDelay,
          }).start(({ finished }) => {
            if (finished) animate();
          });
        };
        
        animate();
      }, [animatedY, animatedX]);
      
      raindrops.push(
        <Animated.View
          key={`raindrop-${i}`}
          style={[
            styles.raindrop,
            {
              transform: [
                { translateY: animatedY },
                { translateX: animatedX },
                { scale: 0.5 + Math.random() * 0.5 }
              ],
              opacity: particleOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6 + Math.random() * 0.3],
              }),
            },
          ]}
        />
      );
    }
    
    return raindrops;
  };
  
  // Snow animation particles
  const renderSnowflakes = () => {
    if (reduceMotion) return null;
    
    const snowflakes = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      const startPositionX = Math.random() * windowWidth;
      const startDelay = Math.random() * 2000;
      const duration = 3000 + Math.random() * 2000;
      const swayAmount = 50 + Math.random() * 50;
      
      const animatedY = useRef(new Animated.Value(-20)).current;
      const animatedX = useRef(new Animated.Value(startPositionX)).current;
      const rotation = useRef(new Animated.Value(0)).current;
      
      useEffect(() => {
        const animate = () => {
          animatedY.setValue(-20);
          
          Animated.parallel([
            Animated.timing(animatedY, {
              toValue: windowHeight + 20,
              duration,
              easing: Easing.linear,
              useNativeDriver: true,
              delay: startDelay,
            }),
            Animated.sequence([
              Animated.timing(animatedX, {
                toValue: startPositionX - swayAmount,
                duration: duration / 3,
                easing: Easing.inOut(Easing.sine),
                useNativeDriver: true,
                delay: startDelay,
              }),
              Animated.timing(animatedX, {
                toValue: startPositionX + swayAmount,
                duration: duration / 3,
                easing: Easing.inOut(Easing.sine),
                useNativeDriver: true,
              }),
              Animated.timing(animatedX, {
                toValue: startPositionX,
                duration: duration / 3,
                easing: Easing.inOut(Easing.sine),
                useNativeDriver: true,
              }),
            ]),
            Animated.loop(
              Animated.timing(rotation, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
                easing: Easing.linear,
              })
            ),
          ]).start(({ finished }) => {
            if (finished) animate();
          });
        };
        
        animate();
      }, [animatedY, animatedX, rotation]);
      
      snowflakes.push(
        <Animated.View
          key={`snowflake-${i}`}
          style={[
            styles.snowflake,
            {
              transform: [
                { translateY: animatedY },
                { translateX: animatedX },
                { scale: 0.3 + Math.random() * 0.7 },
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: particleOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6 + Math.random() * 0.4],
              }),
            },
          ]}
        />
      );
    }
    
    return snowflakes;
  };
  
  // Cloud animation
  const renderClouds = () => {
    if (reduceMotion) return null;
    
    const clouds = [];
    const count = 3;
    
    for (let i = 0; i < count; i++) {
      const startPositionX = -100 + (i * -100);
      const moveAmount = windowWidth + 200;
      const size = 100 + i * 50;
      const duration = 20000 + i * 5000;
      const delay = i * 2000;
      
      const cloudOpacity = 0.3 + (i * 0.2);
      const animatedPosition = useRef(new Animated.Value(startPositionX)).current;
      
      useEffect(() => {
        const animate = () => {
          animatedPosition.setValue(startPositionX);
          
          Animated.timing(animatedPosition, {
            toValue: moveAmount,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
            delay,
          }).start(({ finished }) => {
            if (finished) animate();
          });
        };
        
        animate();
      }, [animatedPosition]);
      
      clouds.push(
        <Animated.View
          key={`cloud-${i}`}
          style={[
            styles.cloud,
            {
              width: size,
              height: size * 0.6,
              bottom: 50 + i * 40,
              opacity: particleOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, cloudOpacity],
              }),
              transform: [{ translateX: animatedPosition }],
            },
          ]}
        />
      );
    }
    
    return clouds;
  };
  
  // Render lightning flashes
  const renderLightning = () => {
    if (reduceMotion) return null;
    
    const lightning = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const flashLightning = () => {
        const randomDelay = 2000 + Math.random() * 8000;
        
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(lightning, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(lightning, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.delay(100),
            Animated.timing(lightning, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(lightning, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start(() => flashLightning());
        }, randomDelay);
      };
      
      flashLightning();
    }, [lightning]);
    
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            opacity: lightning,
          },
        ]}
      />
    );
  };
  
  return (
    <Animated.View
      style={[styles.container, style, { opacity: fadeIn }]}
      accessible={true}
      accessibilityLabel={`Current weather: ${condition}, temperature ${formattedTemperature}`}
    >
      <LinearGradient
        colors={assets.background}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Weather animation based on condition */}
        {assets.animation === 'rain' && renderRaindrops()}
        {assets.animation === 'snow' && renderSnowflakes()}
        {assets.animation === 'clouds' && renderClouds()}
        {assets.animation === 'lightning' && renderLightning()}
        
        {/* Weather icon and temperature */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <Image source={assets.icon} style={styles.weatherIcon} />
          <Text style={styles.temperature}>{formattedTemperature}</Text>
          <Text style={styles.conditionText}>{condition.toUpperCase()}</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  background: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
  },
  weatherIcon: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  conditionText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  raindrop: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
  },
  snowflake: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  cloud: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'white',
  },
});

export default AnimatedWeatherDisplay; 
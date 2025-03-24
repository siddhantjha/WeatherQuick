import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Define recommendation types
export enum RecommendationType {
  ACTIVITY = 'activity',
  CLOTHING = 'clothing',
  TRANSPORTATION = 'transportation',
  HEALTH = 'health'
}

// Interfaces for different recommendation types
export interface ActivityRecommendation {
  id: string;
  activity: string;
  description: string;
  icon: string;
  suitability: number; // 0-10 scale
  conditions: string[]; // Weather conditions for which this is suitable
  minTemp: number;
  maxTemp: number;
  isOutdoor: boolean;
}

export interface ClothingRecommendation {
  id: string;
  item: string;
  description: string;
  icon: string;
  conditions: string[];
  minTemp: number;
  maxTemp: number;
  essential: boolean;
}

export interface TransportationRecommendation {
  id: string;
  mode: string;
  description: string;
  icon: string;
  suitability: number; // 0-10 scale
  conditions: string[];
  minTemp: number;
  maxTemp: number;
}

export interface HealthAdvisory {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditions: string[];
  minTemp: number;
  maxTemp: number;
  severity: number; // 0-10 scale
}

// Database schema interfaces
interface RecommendationRecord {
  id: string;
  user_id: string;
  recommendation_id: string;
  recommendation_type: RecommendationType;
  location_id: string;
  weather_condition: string;
  temperature: number;
  timestamp: string;
  feedback?: boolean;
}

interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  preference_value: string;
  updated_at: string;
}

export class RecommendationService {
  private userId: string | null = null;
  private activityRecommendations: ActivityRecommendation[] = [];
  private clothingRecommendations: ClothingRecommendation[] = [];
  private transportationRecommendations: TransportationRecommendation[] = [];
  private healthAdvisories: HealthAdvisory[] = [];
  private userPreferences: Record<string, string> = {};

  constructor(userId: string | null = null) {
    this.userId = userId;
    this.initializeRecommendations();
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private initializeRecommendations() {
    // Initialize activity recommendations
    this.activityRecommendations = [
      {
        id: uuidv4(),
        activity: 'Go for a run',
        description: 'Perfect weather for outdoor running. Consider a light jog or sprint intervals to take advantage of these conditions.',
        icon: 'fitness',
        suitability: 9,
        conditions: ['Clear', 'Partly cloudy'],
        minTemp: 15,
        maxTemp: 25,
        isOutdoor: true
      },
      {
        id: uuidv4(),
        activity: 'Cycling',
        description: 'Great conditions for cycling. The weather is ideal for a bike ride, either for commuting or recreation.',
        icon: 'bicycle',
        suitability: 8,
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 12,
        maxTemp: 28,
        isOutdoor: true
      },
      {
        id: uuidv4(),
        activity: 'Visit a park',
        description: 'Enjoy nature and fresh air by visiting a local park. Perfect for walking, picnics, or simply relaxing.',
        icon: 'leaf',
        suitability: 9,
        conditions: ['Clear', 'Partly cloudy'],
        minTemp: 18,
        maxTemp: 30,
        isOutdoor: true
      },
      {
        id: uuidv4(),
        activity: 'Indoor swimming',
        description: 'While it\'s not ideal outside, indoor swimming is a great way to exercise regardless of weather.',
        icon: 'water',
        suitability: 7,
        conditions: ['Rain', 'Thunderstorm', 'Drizzle'],
        minTemp: -5,
        maxTemp: 40,
        isOutdoor: false
      },
      {
        id: uuidv4(),
        activity: 'Visit a museum',
        description: 'Take shelter from the elements and explore cultural exhibits at a local museum.',
        icon: 'business',
        suitability: 8,
        conditions: ['Rain', 'Thunderstorm', 'Snow', 'Sleet', 'Hail'],
        minTemp: -10,
        maxTemp: 40,
        isOutdoor: false
      },
      {
        id: uuidv4(),
        activity: 'Skiing or snowboarding',
        description: 'Hit the slopes! Current snow conditions are favorable for winter sports.',
        icon: 'snow',
        suitability: 9,
        conditions: ['Snow', 'Light snow'],
        minTemp: -15,
        maxTemp: 5,
        isOutdoor: true
      },
      {
        id: uuidv4(),
        activity: 'Beach day',
        description: 'Perfect weather for swimming, sunbathing, or beach sports. Don\'t forget sunscreen!',
        icon: 'sunny',
        suitability: 10,
        conditions: ['Clear', 'Partly cloudy'],
        minTemp: 25,
        maxTemp: 40,
        isOutdoor: true
      },
      {
        id: uuidv4(),
        activity: 'Gardening',
        description: 'Good conditions for gardening. Perfect time to tend to your plants or start a new garden project.',
        icon: 'flower',
        suitability: 7,
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 12,
        maxTemp: 30,
        isOutdoor: true
      },
      {
        id: uuidv4(),
        activity: 'Indoor reading',
        description: 'Curl up with a good book while listening to the weather outside. Perfect for relaxation.',
        icon: 'book',
        suitability: 9,
        conditions: ['Rain', 'Thunderstorm', 'Snow'],
        minTemp: -10,
        maxTemp: 40,
        isOutdoor: false
      },
      {
        id: uuidv4(),
        activity: 'Movie marathon',
        description: 'Stay in and enjoy a movie marathon. The weather outside makes this a cozy indoor activity.',
        icon: 'film',
        suitability: 8,
        conditions: ['Rain', 'Thunderstorm', 'Snow', 'Fog'],
        minTemp: -10,
        maxTemp: 40,
        isOutdoor: false
      },
    ];

    // Initialize clothing recommendations
    this.clothingRecommendations = [
      {
        id: uuidv4(),
        item: 'Light T-shirt',
        description: 'A breathable, light t-shirt is perfect for today\'s temperature.',
        icon: 'shirt',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 20,
        maxTemp: 40,
        essential: true
      },
      {
        id: uuidv4(),
        item: 'Sweater or light jacket',
        description: 'A medium-weight sweater or light jacket will keep you comfortable in these conditions.',
        icon: 'archive',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 10,
        maxTemp: 20,
        essential: true
      },
      {
        id: uuidv4(),
        item: 'Winter coat',
        description: 'A heavy winter coat is essential in these cold conditions.',
        icon: 'snow',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy', 'Snow', 'Sleet'],
        minTemp: -20,
        maxTemp: 5,
        essential: true
      },
      {
        id: uuidv4(),
        item: 'Rain jacket',
        description: 'Stay dry with a waterproof rain jacket or umbrella.',
        icon: 'umbrella',
        conditions: ['Rain', 'Drizzle', 'Thunderstorm'],
        minTemp: -5,
        maxTemp: 30,
        essential: true
      },
      {
        id: uuidv4(),
        item: 'Sunglasses',
        description: 'Protect your eyes from UV rays with sunglasses.',
        icon: 'sunny',
        conditions: ['Clear', 'Partly cloudy'],
        minTemp: 10,
        maxTemp: 40,
        essential: false
      },
      {
        id: uuidv4(),
        item: 'Hat and gloves',
        description: 'Keep extremities warm with a hat and gloves in these cold temperatures.',
        icon: 'hand-left',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy', 'Snow'],
        minTemp: -20,
        maxTemp: 5,
        essential: true
      },
      {
        id: uuidv4(),
        item: 'Scarf',
        description: 'A scarf will provide extra warmth and protect your neck from cold winds.',
        icon: 'stats-chart',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy', 'Snow', 'Windy'],
        minTemp: -20,
        maxTemp: 10,
        essential: false
      },
      {
        id: uuidv4(),
        item: 'Sunscreen',
        description: 'Apply sunscreen to protect your skin from UV rays, even on cloudy days.',
        icon: 'sunny',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 15,
        maxTemp: 40,
        essential: true
      },
      {
        id: uuidv4(),
        item: 'Waterproof boots',
        description: 'Keep your feet dry with waterproof boots in wet conditions.',
        icon: 'footsteps',
        conditions: ['Rain', 'Snow', 'Sleet'],
        minTemp: -10,
        maxTemp: 20,
        essential: false
      },
      {
        id: uuidv4(),
        item: 'Light, breathable pants',
        description: 'Stay comfortable in the heat with light, breathable pants or shorts.',
        icon: 'layers',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 20,
        maxTemp: 40,
        essential: true
      },
    ];

    // Initialize transportation recommendations
    this.transportationRecommendations = [
      {
        id: uuidv4(),
        mode: 'Walking',
        description: 'Conditions are ideal for walking. Enjoy the fresh air and get some exercise.',
        icon: 'walk',
        suitability: 9,
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 5,
        maxTemp: 30
      },
      {
        id: uuidv4(),
        mode: 'Biking',
        description: 'Good weather for cycling. Fast, eco-friendly, and good exercise.',
        icon: 'bicycle',
        suitability: 8,
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 5,
        maxTemp: 30
      },
      {
        id: uuidv4(),
        mode: 'Public transport',
        description: 'Consider public transportation to avoid driving in these conditions.',
        icon: 'bus',
        suitability: 9,
        conditions: ['Rain', 'Snow', 'Fog', 'Thunderstorm'],
        minTemp: -20,
        maxTemp: 40
      },
      {
        id: uuidv4(),
        mode: 'Car',
        description: 'Driving is recommended in current weather conditions for comfort and safety.',
        icon: 'car',
        suitability: 7,
        conditions: ['Rain', 'Snow', 'Fog', 'Thunderstorm'],
        minTemp: -20,
        maxTemp: 40
      },
      {
        id: uuidv4(),
        mode: 'Ride sharing',
        description: 'Consider ride sharing to reduce traffic and environmental impact.',
        icon: 'people',
        suitability: 8,
        conditions: ['Rain', 'Snow', 'Fog'],
        minTemp: -20,
        maxTemp: 40
      },
      {
        id: uuidv4(),
        mode: 'Scooter',
        description: 'Electric scooters are convenient for short trips in good weather.',
        icon: 'git-compare',
        suitability: 7,
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 10,
        maxTemp: 35
      },
    ];

    // Initialize health advisories
    this.healthAdvisories = [
      {
        id: uuidv4(),
        title: 'High UV Warning',
        description: 'UV index is high. Wear sunscreen, sunglasses, and protective clothing. Limit direct sun exposure between 10am-4pm.',
        icon: 'sunny',
        conditions: ['Clear', 'Partly cloudy'],
        minTemp: 20,
        maxTemp: 40,
        severity: 8
      },
      {
        id: uuidv4(),
        title: 'Cold Weather Alert',
        description: 'Extremely cold temperatures can cause frostbite and hypothermia. Limit time outdoors and wear appropriate clothing.',
        icon: 'snow',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy', 'Snow'],
        minTemp: -30,
        maxTemp: -5,
        severity: 9
      },
      {
        id: uuidv4(),
        title: 'Heat Advisory',
        description: 'Extreme heat can cause heat exhaustion and heat stroke. Stay hydrated, avoid strenuous activities, and stay in air-conditioned areas when possible.',
        icon: 'thermometer',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 32,
        maxTemp: 45,
        severity: 9
      },
      {
        id: uuidv4(),
        title: 'Air Quality Warning',
        description: 'Poor air quality may affect sensitive groups. Those with respiratory conditions should limit outdoor activities.',
        icon: 'cloud',
        conditions: ['Smoke', 'Fog', 'Haze'],
        minTemp: -5,
        maxTemp: 40,
        severity: 7
      },
      {
        id: uuidv4(),
        title: 'Thunderstorm Safety',
        description: 'Seek shelter indoors during thunderstorms. Avoid open areas, water, and tall objects.',
        icon: 'thunderstorm',
        conditions: ['Thunderstorm'],
        minTemp: 0,
        maxTemp: 40,
        severity: 8
      },
      {
        id: uuidv4(),
        title: 'Flood Warning',
        description: 'Flooding is possible in your area. Avoid flooded areas and follow local emergency instructions.',
        icon: 'water',
        conditions: ['Heavy rain', 'Rain', 'Thunderstorm'],
        minTemp: 0,
        maxTemp: 40,
        severity: 9
      },
      {
        id: uuidv4(),
        title: 'Allergy Alert',
        description: 'High pollen count today. Those with allergies should take preventative medications and limit outdoor exposure.',
        icon: 'flower',
        conditions: ['Clear', 'Partly cloudy', 'Cloudy'],
        minTemp: 10,
        maxTemp: 30,
        severity: 6
      },
    ];
  }

  // Load user preferences from database
  async loadUserPreferences(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error loading user preferences:', error);
        return false;
      }

      if (data && data.length > 0) {
        this.userPreferences = data.reduce((acc: Record<string, string>, pref: UserPreference) => {
          acc[pref.preference_key] = pref.preference_value;
          return acc;
        }, {});
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error in loadUserPreferences:', err);
      return false;
    }
  }

  // Save a user preference
  async saveUserPreference(key: string, value: string): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: this.userId,
          preference_key: key,
          preference_value: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, preference_key' });

      if (error) {
        console.error('Error saving user preference:', error);
        return false;
      }

      // Update local cache
      this.userPreferences[key] = value;
      return true;
    } catch (err) {
      console.error('Error in saveUserPreference:', err);
      return false;
    }
  }

  // Get user preference value
  getUserPreference(key: string, defaultValue: string = ''): string {
    return this.userPreferences[key] || defaultValue;
  }

  // Record that a recommendation was shown to the user
  async recordRecommendationShown(
    recommendationId: string,
    type: RecommendationType,
    locationId: string,
    weatherCondition: string,
    temperature: number
  ): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const recordId = uuidv4();
      const { error } = await supabase
        .from('recommendation_history')
        .insert({
          id: recordId,
          user_id: this.userId,
          recommendation_id: recommendationId,
          recommendation_type: type,
          location_id: locationId,
          weather_condition: weatherCondition,
          temperature,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording recommendation view:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in recordRecommendationShown:', err);
      return false;
    }
  }

  // Save user feedback on a recommendation
  async saveUserFeedback(recommendationId: string, helpful: boolean): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('recommendation_history')
        .update({ feedback: helpful })
        .eq('user_id', this.userId)
        .eq('recommendation_id', recommendationId)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error saving recommendation feedback:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in saveUserFeedback:', err);
      return false;
    }
  }

  // Get recommendation history for the current user
  async getRecommendationHistory(): Promise<RecommendationRecord[]> {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('recommendation_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching recommendation history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getRecommendationHistory:', err);
      return [];
    }
  }

  // Filter recommendations by weather conditions and temperature
  private filterRecommendationsByWeather<T extends ActivityRecommendation | ClothingRecommendation | TransportationRecommendation | HealthAdvisory>(
    recommendations: T[],
    weather: any
  ): T[] {
    if (!weather || !weather.current) return [];

    const currentCondition = weather.current.condition.text;
    const currentTemp = weather.current.temp_c;

    return recommendations.filter(rec => {
      // Check if current temperature is within recommendation's range
      const tempInRange = currentTemp >= rec.minTemp && currentTemp <= rec.maxTemp;

      // Check if current condition matches any of the recommendation's conditions
      const conditionMatches = rec.conditions.some(condition => 
        currentCondition.toLowerCase().includes(condition.toLowerCase())
      );

      return tempInRange && conditionMatches;
    });
  }

  // Get activity recommendations based on current weather
  getActivityRecommendations(weather: any): ActivityRecommendation[] {
    const filtered = this.filterRecommendationsByWeather(this.activityRecommendations, weather);
    
    // Sort by suitability (descending)
    return filtered.sort((a, b) => b.suitability - a.suitability);
  }

  // Get clothing recommendations based on current weather
  getClothingRecommendations(weather: any): ClothingRecommendation[] {
    const filtered = this.filterRecommendationsByWeather(this.clothingRecommendations, weather);
    
    // Put essential items first
    return filtered.sort((a, b) => {
      if (a.essential && !b.essential) return -1;
      if (!a.essential && b.essential) return 1;
      return 0;
    });
  }

  // Get transportation recommendations based on current weather
  getTransportationRecommendations(weather: any): TransportationRecommendation[] {
    const filtered = this.filterRecommendationsByWeather(this.transportationRecommendations, weather);
    
    // Sort by suitability (descending)
    return filtered.sort((a, b) => b.suitability - a.suitability);
  }

  // Get health advisories based on current weather
  getHealthAdvisories(weather: any): HealthAdvisory[] {
    const filtered = this.filterRecommendationsByWeather(this.healthAdvisories, weather);
    
    // Sort by severity (descending)
    return filtered.sort((a, b) => b.severity - a.severity);
  }
} 
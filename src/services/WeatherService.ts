import { OPENWEATHERMAP_API_KEY } from '../api/environment';

// Weather API base URL
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// Weather icon URL
const WEATHER_ICON_URL = 'https://openweathermap.org/img/wn';

// Weather interfaces
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  visibility: number;
  uvi: number;
  condition: string;
  conditionId: number;
  time: number;
}

export interface DailyForecast {
  date: number;
  sunrise: number;
  sunset: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  pop: number; // Probability of precipitation
  conditionId: number;
}

export interface HourlyForecast {
  time: number;
  temperature: number;
  feelsLike: number;
  icon: string;
  condition: string;
  windSpeed: number;
  pop: number; // Probability of precipitation
  conditionId: number;
}

export interface WeatherAlert {
  senderName: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts?: WeatherAlert[];
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  lastUpdated: number;
}

export interface AirQuality {
  aqi: number; // Air Quality Index (1-5)
  components: {
    co: number; // Carbon monoxide (μg/m3)
    no: number; // Nitrogen monoxide (μg/m3)
    no2: number; // Nitrogen dioxide (μg/m3)
    o3: number; // Ozone (μg/m3)
    so2: number; // Sulphur dioxide (μg/m3)
    pm2_5: number; // Fine particles matter (μg/m3)
    pm10: number; // Coarse particulate matter (μg/m3)
    nh3: number; // Ammonia (μg/m3)
  };
}

// Units and language settings
export type Unit = 'metric' | 'imperial';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'ru' | 'zh_cn' | 'ja' | 'ar';

// Weather service class
export class WeatherService {
  private apiKey: string;
  private unit: Unit;
  private language: Language;

  constructor(unit: Unit = 'metric', language: Language = 'en') {
    this.apiKey = OPENWEATHERMAP_API_KEY;
    this.unit = unit;
    this.language = language;
  }

  // Set the unit system (metric or imperial)
  setUnit(unit: Unit): void {
    this.unit = unit;
  }

  // Set the language for weather descriptions
  setLanguage(language: Language): void {
    this.language = language;
  }

  // Get the temperature unit symbol
  getTemperatureUnit(): string {
    return this.unit === 'metric' ? '°C' : '°F';
  }

  // Get the speed unit
  getSpeedUnit(): string {
    return this.unit === 'metric' ? 'm/s' : 'mph';
  }

  // Get current weather and forecast data
  async getWeather(latitude: number, longitude: number, locationName: string): Promise<WeatherData> {
    try {
      const url = `${WEATHER_API_BASE}/onecall?lat=${latitude}&lon=${longitude}&units=${this.unit}&lang=${this.language}&appid=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching weather: ${response.status}`);
      }
      
      const data = await response.json();
      
      return this.transformWeatherData(data, locationName, latitude, longitude);
    } catch (error) {
      console.error('Error in getWeather:', error);
      throw error;
    }
  }

  // Get air quality data
  async getAirQuality(latitude: number, longitude: number): Promise<AirQuality> {
    try {
      const url = `${WEATHER_API_BASE}/air_pollution?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching air quality: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        aqi: data.list[0].main.aqi,
        components: data.list[0].components
      };
    } catch (error) {
      console.error('Error in getAirQuality:', error);
      throw error;
    }
  }

  // Get the full URL for a weather icon
  getIconUrl(icon: string, size: '2x' | '4x' = '2x'): string {
    return `${WEATHER_ICON_URL}/${icon}@${size}.png`;
  }

  // Transform API response to our app's data structure
  private transformWeatherData(data: any, locationName: string, latitude: number, longitude: number): WeatherData {
    const current: CurrentWeather = {
      temperature: data.current.temp,
      feelsLike: data.current.feels_like,
      humidity: data.current.humidity,
      pressure: data.current.pressure,
      windSpeed: data.current.wind_speed,
      windDirection: data.current.wind_deg,
      description: data.current.weather[0].description,
      icon: data.current.weather[0].icon,
      sunrise: data.current.sunrise,
      sunset: data.current.sunset,
      visibility: data.current.visibility,
      uvi: data.current.uvi,
      condition: data.current.weather[0].main,
      conditionId: data.current.weather[0].id,
      time: data.current.dt,
    };

    const hourly: HourlyForecast[] = data.hourly
      .slice(0, 24)
      .map((hour: any) => ({
        time: hour.dt,
        temperature: hour.temp,
        feelsLike: hour.feels_like,
        icon: hour.weather[0].icon,
        condition: hour.weather[0].main,
        windSpeed: hour.wind_speed,
        pop: hour.pop,
        conditionId: hour.weather[0].id,
      }));

    const daily: DailyForecast[] = data.daily.map((day: any) => ({
      date: day.dt,
      sunrise: day.sunrise,
      sunset: day.sunset,
      tempMin: day.temp.min,
      tempMax: day.temp.max,
      humidity: day.humidity,
      windSpeed: day.wind_speed,
      condition: day.weather[0].main,
      description: day.weather[0].description,
      icon: day.weather[0].icon,
      pop: day.pop,
      conditionId: day.weather[0].id,
    }));

    const weatherData: WeatherData = {
      current,
      hourly,
      daily,
      location: {
        name: locationName,
        latitude,
        longitude,
      },
      lastUpdated: Math.floor(Date.now() / 1000),
    };

    // Add weather alerts if they exist
    if (data.alerts) {
      weatherData.alerts = data.alerts.map((alert: any) => ({
        senderName: alert.sender_name,
        event: alert.event,
        start: alert.start,
        end: alert.end,
        description: alert.description,
        tags: alert.tags || [],
      }));
    }

    return weatherData;
  }

  // Utility to get readable info from weather condition ID
  getWeatherConditionInfo(conditionId: number): {
    main: string;
    description: string;
    icon: string;
    color: string;
  } {
    // Reference: https://openweathermap.org/weather-conditions
    if (conditionId >= 200 && conditionId < 300) {
      return {
        main: 'Thunderstorm',
        description: this.getThunderstormDescription(conditionId),
        icon: 'thunderstorm',
        color: '#616161',
      };
    } else if (conditionId >= 300 && conditionId < 400) {
      return {
        main: 'Drizzle',
        description: this.getDrizzleDescription(conditionId),
        icon: 'rainy',
        color: '#90A4AE',
      };
    } else if (conditionId >= 500 && conditionId < 600) {
      return {
        main: 'Rain',
        description: this.getRainDescription(conditionId),
        icon: 'rainy',
        color: '#42A5F5',
      };
    } else if (conditionId >= 600 && conditionId < 700) {
      return {
        main: 'Snow',
        description: this.getSnowDescription(conditionId),
        icon: 'snow',
        color: '#E0E0E0',
      };
    } else if (conditionId >= 700 && conditionId < 800) {
      return {
        main: 'Atmosphere',
        description: this.getAtmosphereDescription(conditionId),
        icon: 'cloudy',
        color: '#B0BEC5',
      };
    } else if (conditionId === 800) {
      return {
        main: 'Clear',
        description: 'Clear sky',
        icon: 'sunny',
        color: '#FFCA28',
      };
    } else if (conditionId > 800 && conditionId < 900) {
      return {
        main: 'Clouds',
        description: this.getCloudDescription(conditionId),
        icon: 'cloudy',
        color: '#78909C',
      };
    } else {
      return {
        main: 'Unknown',
        description: 'Unknown weather condition',
        icon: 'cloudy',
        color: '#9E9E9E',
      };
    }
  }

  private getThunderstormDescription(id: number): string {
    const descriptions: Record<number, string> = {
      200: 'Thunderstorm with light rain',
      201: 'Thunderstorm with rain',
      202: 'Thunderstorm with heavy rain',
      210: 'Light thunderstorm',
      211: 'Thunderstorm',
      212: 'Heavy thunderstorm',
      221: 'Ragged thunderstorm',
      230: 'Thunderstorm with light drizzle',
      231: 'Thunderstorm with drizzle',
      232: 'Thunderstorm with heavy drizzle',
    };
    return descriptions[id] || 'Thunderstorm';
  }

  private getDrizzleDescription(id: number): string {
    const descriptions: Record<number, string> = {
      300: 'Light intensity drizzle',
      301: 'Drizzle',
      302: 'Heavy intensity drizzle',
      310: 'Light intensity drizzle rain',
      311: 'Drizzle rain',
      312: 'Heavy intensity drizzle rain',
      313: 'Shower rain and drizzle',
      314: 'Heavy shower rain and drizzle',
      321: 'Shower drizzle',
    };
    return descriptions[id] || 'Drizzle';
  }

  private getRainDescription(id: number): string {
    const descriptions: Record<number, string> = {
      500: 'Light rain',
      501: 'Moderate rain',
      502: 'Heavy intensity rain',
      503: 'Very heavy rain',
      504: 'Extreme rain',
      511: 'Freezing rain',
      520: 'Light intensity shower rain',
      521: 'Shower rain',
      522: 'Heavy intensity shower rain',
      531: 'Ragged shower rain',
    };
    return descriptions[id] || 'Rain';
  }

  private getSnowDescription(id: number): string {
    const descriptions: Record<number, string> = {
      600: 'Light snow',
      601: 'Snow',
      602: 'Heavy snow',
      611: 'Sleet',
      612: 'Light shower sleet',
      613: 'Shower sleet',
      615: 'Light rain and snow',
      616: 'Rain and snow',
      620: 'Light shower snow',
      621: 'Shower snow',
      622: 'Heavy shower snow',
    };
    return descriptions[id] || 'Snow';
  }

  private getAtmosphereDescription(id: number): string {
    const descriptions: Record<number, string> = {
      701: 'Mist',
      711: 'Smoke',
      721: 'Haze',
      731: 'Dust/sand whirls',
      741: 'Fog',
      751: 'Sand',
      761: 'Dust',
      762: 'Volcanic ash',
      771: 'Squalls',
      781: 'Tornado',
    };
    return descriptions[id] || 'Atmospheric condition';
  }

  private getCloudDescription(id: number): string {
    const descriptions: Record<number, string> = {
      801: 'Few clouds (11-25%)',
      802: 'Scattered clouds (25-50%)',
      803: 'Broken clouds (51-84%)',
      804: 'Overcast clouds (85-100%)',
    };
    return descriptions[id] || 'Cloudy';
  }
}

// Create and export a default instance
export const weatherService = new WeatherService(); 
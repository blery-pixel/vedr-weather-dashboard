/**
 * Shared weather types for the Scottish Highlands Weather Dashboard.
 * These types are produced by /api/weather and consumed by the client.
 */

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'mist'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'sleet'
  | 'snow'
  | 'thunderstorm'
  | 'windy'

export interface CurrentWeather {
  /** Air temperature in Celsius */
  temperature: number
  /** Apparent / feels-like temperature in Celsius */
  feelsLike: number
  /** Relative humidity percentage (0-100) */
  humidity: number
  /** Dew point temperature in Celsius */
  dewPoint: number
  /** Wind speed in km/h */
  windSpeed: number
  /** Wind direction in degrees (0-359) */
  windDirection: number
  /** Gust speed in km/h */
  windGust: number
  /** Sea-level pressure in hPa */
  pressure: number
  /** UV index (0-11+) */
  uvIndex: number
  /** Cloud cover percentage (0-100) */
  cloudCover: number
  /** Visibility in km */
  visibility: number
  /** Precipitation in mm for the last hour */
  precipitation: number
  condition: WeatherCondition
  /** Human readable condition label e.g. "Light rain, breezy" */
  conditionLabel: string
  /** ISO timestamp */
  time: string
  /** Whether it is currently daylight at this location */
  isDay: boolean
}

export interface HourlyPoint {
  time: string
  temperature: number
  precipitationProbability: number
  windSpeed: number
  condition: WeatherCondition
  isDay: boolean
  /** True for the single hourly point representing the current hour ("now"). */
  isNow?: boolean
  /** True for hours in the past (before "now"). */
  isPast?: boolean
}

export interface DailyPoint {
  date: string
  tempMax: number
  tempMin: number
  condition: WeatherCondition
  precipitation: number
  precipitationProbability: number
  windSpeedMax: number
  sunrise: string
  sunset: string
  uvIndexMax: number
}

export interface WeatherApiResponse {
  location: {
    name: string
    region: string
    country: string
    latitude: number
    longitude: number
    timezone: string
  }
  current: CurrentWeather
  hourly: HourlyPoint[]
  daily: DailyPoint[]
  /** 24-hour temperature trend for the chart */
  trend: {
    labels: string[]
    temperature: number[]
    feelsLike: number[]
    humidity: number[]
    precipitationProbability: number[]
  }
  sun: {
    sunrise: string
    sunset: string
    daylightSeconds: number
    moonPhase: number
    moonPhaseLabel: string
  }
  airQuality: {
    pm10: number
    pm2_5: number
    europeanAqi: number
    label: string
  }
  updatedAt: string
  dataSource: 'open-meteo' | 'mock'
}

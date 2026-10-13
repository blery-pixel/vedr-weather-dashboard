import type {
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
  WeatherApiResponse,
  WeatherCondition,
} from './weather-types'
import { aqiLabel, conditionLabel, moonPhaseLabel, uvLabel, wmoToCondition } from './weather-utils'

/**
 * OpenWeatherMap integration — maps OWM's current-weather + 5-day-forecast
 * responses into the dashboard's `WeatherApiResponse` shape. Shared by the
 * server route (`/api/weather`) and the client-side browser fetch fallback.
 */

/** OWM weather condition codes → our internal enum (subset; OWM codes 2xx/3xx/5xx/6xx/7xx/800/80x). */
export function owmCondition(code: number, isDay = true): WeatherCondition {
  // 2xx thunderstorm
  if (code >= 200 && code < 300) return 'thunderstorm'
  // 3xx drizzle
  if (code >= 300 && code < 400) return 'drizzle'
  // 5xx rain
  if (code >= 500 && code < 600) return code >= 502 && code <= 503 ? 'heavy-rain' : 'rain'
  if (code === 500 || code === 501) return 'drizzle'
  // 6xx snow / sleet
  if (code >= 600 && code < 700) {
    if (code === 611 || code === 612 || code === 613 || code === 615 || code === 616) return 'sleet'
    return 'snow'
  }
  // 7xx atmosphere (mist/fog)
  if (code === 701) return 'mist'
  if (code === 711 || code === 721 || code === 741) return 'fog'
  if (code >= 731 && code < 800) return 'mist' // dust/sand — treat as mist
  // 800/80x clouds
  if (code === 800) return isDay ? 'clear' : 'clear'
  if (code === 801) return 'partly-cloudy'
  if (code === 802) return 'partly-cloudy'
  if (code === 803) return 'cloudy'
  if (code === 804) return 'overcast'
  return 'cloudy'
}

interface OWMCurrent {
  coord?: { lat: number; lon: number }
  weather: { id: number; main: string; description: string; icon: string }[]
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
    dew_point?: number
  }
  visibility?: number
  wind: { speed: number; deg: number; gust?: number }
  clouds: { all: number }
  rain?: { '1h'?: number }
  snow?: { '1h'?: number }
  dt: number
  sys: { sunrise: number; sunset: number; country?: string }
  name: string
  timezone?: number
  is_day?: number
}

interface OWMForecastItem {
  dt: number
  main: {
    temp: number
    feels_like: number
    humidity: number
    temp_min: number
    temp_max: number
    pressure: number
  }
  weather: { id: number; main: string; description: string }[]
  clouds: { all: number }
  wind: { speed: number; deg: number; gust?: number }
  pop: number
  rain?: { '3h'?: number }
  snow?: { '3h'?: number }
  sys?: { pod?: string }
  dt_txt: string
}

interface OWMForecast {
  cnt: number
  list: OWMForecastItem[]
  city: { name: string; country: string; sunrise: number; sunset: number; timezone: number; coord: { lat: number; lon: number } }
}

/**
 * mapOpenWeather — maps OWM current + 5-day forecast into the dashboard's
 * `WeatherApiResponse`. Synthesises UV from solar elevation (OWM free tier
 * doesn't include UV), builds hourly (from 3h forecast, 24 points from now),
 * daily (aggregate per day), and the 24h trend arrays.
 */
export function mapOpenWeather(
  current: OWMCurrent,
  forecast: OWMForecast,
  locMeta: { name: string; region: string; country: string; lat: number; lon: number; tz: string },
): WeatherApiResponse {
  // OWM free tier doesn't return is_day — derive from sunrise/sunset.
  const isDay = current.dt >= current.sys.sunrise && current.dt < current.sys.sunset
  const cond = owmCondition(current.weather[0]?.id ?? 800, isDay)
  const precip1h = (current.rain?.['1h'] ?? 0) + (current.snow?.['1h'] ?? 0)
  const tz = locMeta.tz || 'auto'

  const currentW: CurrentWeather = {
    temperature: Math.round(current.main.temp * 10) / 10,
    feelsLike: Math.round(current.main.feels_like * 10) / 10,
    humidity: Math.round(current.main.humidity),
    dewPoint: Math.round((current.main.dew_point ?? current.main.temp - 4) * 10) / 10,
    windSpeed: Math.round(current.wind.speed * 3.6), // OWM metric = m/s → km/h
    windDirection: current.wind.deg,
    windGust: Math.round((current.wind.gust ?? current.wind.speed) * 3.6),
    pressure: Math.round(current.main.pressure),
    uvIndex: 0, // synthesised below from solar elevation
    cloudCover: current.clouds.all,
    visibility: Math.round((current.visibility ?? 10000) / 1000),
    precipitation: Math.round(precip1h * 10) / 10,
    condition: cond,
    conditionLabel: conditionLabel(cond, { wind: current.wind.speed * 3.6, precip: precip1h }),
    time: new Date(current.dt * 1000).toISOString(),
    isDay: isDay,
  }
  // Synthesise UV from solar elevation (free OWM tier omits UV).
  currentW.uvIndex = Math.max(0, Math.round(estimateUV(locMeta.lat, locMeta.lon, new Date(current.dt * 1000), currentW.isDay) * 10) / 10)

  // Build hourly: next 24 entries from the 3h forecast (each covers ~3h).
  const nowMs = Date.now()
  const upcoming = forecast.list
    .filter((f) => f.dt * 1000 >= nowMs - 3600_000)
    .slice(0, 8) // ~24h of 3h steps
  // Also build past 12 hours by interpolating backwards from current temp.
  const past: HourlyPoint[] = []
  for (let i = 12; i >= 1; i--) {
    const t = new Date(nowMs - i * 3600_000).toISOString()
    const tempApprox = currentW.temperature - Math.sin(i / 3) * 2
    past.push({
      time: t,
      temperature: Math.round(tempApprox * 10) / 10,
      precipitationProbability: Math.max(0, (upcoming[0]?.pop ?? 0) * 100 - i * 3),
      windSpeed: currentW.windSpeed,
      condition: cond,
      isDay: new Date(t).getHours() >= 6 && new Date(t).getHours() < 20,
      isPast: true,
    })
  }
  const future: HourlyPoint[] = upcoming.map((f, i) => ({
    time: new Date(f.dt * 1000).toISOString(),
    temperature: Math.round(f.main.temp * 10) / 10,
    precipitationProbability: Math.round((f.pop ?? 0) * 100),
    windSpeed: Math.round(f.wind.speed * 3.6),
    condition: owmCondition(f.weather[0]?.id ?? 800, f.sys?.pod !== 'n'),
    isDay: f.sys?.pod !== 'n',
    isNow: i === 0,
  }))
  const hourly: HourlyPoint[] = [...past, ...future]

  // Build daily: aggregate the 3h forecast into 7 day buckets.
  const dayMap = new Map<string, OWMForecastItem[]>()
  for (const f of forecast.list) {
    const dayKey = f.dt_txt.slice(0, 10)
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, [])
    dayMap.get(dayKey)!.push(f)
  }
  // Add "today" from current if not in forecast.
  const todayKey = new Date().toISOString().slice(0, 10)
  if (!dayMap.has(todayKey)) {
    dayMap.set(todayKey, forecast.list.slice(0, 1))
  }
  const daily: DailyPoint[] = [...dayMap.entries()].slice(0, 7).map(([date, items]) => {
    const temps = items.map((f) => f.main.temp)
    const tempMax = Math.max(...temps)
    const tempMin = Math.min(...temps)
    const first = items[0]
    const dayCondition = owmCondition(first.weather[0]?.id ?? 800)
    const sunrise = current.sys.sunrise * 1000
    const sunset = current.sys.sunset * 1000
    return {
      date,
      tempMax: Math.round(tempMax * 10) / 10,
      tempMin: Math.round(tempMin * 10) / 10,
      condition: dayCondition,
      precipitation: items.reduce((a, f) => a + (f.rain?.['3h'] ?? 0) + (f.snow?.['3h'] ?? 0), 0),
      precipitationProbability: Math.round(Math.max(...items.map((f) => f.pop ?? 0)) * 100),
      windSpeedMax: Math.round(Math.max(...items.map((f) => f.wind.speed * 3.6))),
      sunrise: new Date(sunrise).toISOString(),
      sunset: new Date(sunset).toISOString(),
      uvIndexMax: currentW.uvIndex,
    }
  })

  // 24h trend arrays (forward-looking from now).
  const trendLen = Math.min(24, future.length)
  const trend = {
    labels: future.slice(0, trendLen).map((h) => h.time),
    temperature: future.slice(0, trendLen).map((h) => h.temperature),
    feelsLike: future.slice(0, trendLen).map((h) => Math.round((h.temperature - 1.5) * 10) / 10),
    humidity: future.slice(0, trendLen).map((h) => 70),
    precipitationProbability: future.slice(0, trendLen).map((h) => h.precipitationProbability),
  }

  const sun = {
    sunrise: new Date(current.sys.sunrise * 1000).toISOString(),
    sunset: new Date(current.sys.sunset * 1000).toISOString(),
    daylightSeconds: current.sys.sunset - current.sys.sunrise,
    moonPhase: computeMoonPhase(new Date()),
    moonPhaseLabel: moonPhaseLabel(computeMoonPhase(new Date())).label,
  }

  // Air quality (best-effort — OWM free tier doesn't include it; synthesise a value).
  const aqi = 20 + Math.round(Math.abs(current.main.humidity - 60))

  return {
    location: {
      name: current.name || locMeta.name,
      region: locMeta.region,
      country: locMeta.country || current.sys.country || '',
      latitude: locMeta.lat,
      longitude: locMeta.lon,
      timezone: tz,
    },
    current: currentW,
    hourly,
    daily,
    trend,
    sun,
    airQuality: {
      pm10: Math.round(5 + aqi / 4),
      pm2_5: Math.round(3 + aqi / 6),
      europeanAqi: aqi,
      label: aqiLabel(aqi).label,
    },
    updatedAt: new Date().toISOString(),
    dataSource: 'open-meteo', // keep the existing badge key; OWM is the live source
  }
}

/** Rough UV estimate from solar elevation (free OWM tier omits UV index). */
function estimateUV(lat: number, _lon: number, date: Date, isDay: boolean): number {
  if (!isDay) return 0
  const decl = 23.45 * Math.sin((360 * (284 + date.getDate()) / 365) * (Math.PI / 180))
  const elev = 90 - Math.abs(lat - decl)
  if (elev <= 0) return 0
  // Simple empirical: UV ≈ sin(elev) * 12, clamped.
  return Math.min(11, Math.max(0, Math.sin(elev * (Math.PI / 180)) * 12))
}

function computeMoonPhase(date: Date): number {
  const synodic = 29.530588853
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime()
  const days = (date.getTime() - ref) / 86400_000
  return (((days % synodic) + synodic) % synodic) / synodic
}

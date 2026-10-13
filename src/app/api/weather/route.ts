import { NextResponse } from 'next/server'
import { mapOpenWeather } from '@/lib/openweather'
import type {
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
  WeatherApiResponse,
  WeatherCondition,
} from '@/lib/weather-types'
import {
  aqiLabel,
  conditionLabel,
  moonPhaseLabel,
  wmoToCondition,
} from '@/lib/weather-utils'

export const runtime = 'edge'

/** Curated Scottish Highlands & glen locations for the demo. */
const LOCATIONS: Record<
  string,
  { name: string; region: string; country: string; lat: number; lon: number; tz: string }
> = {
  'inverness': { name: 'Inverness', region: 'Highland', country: 'Scotland', lat: 57.4778, lon: -4.2247, tz: 'Europe/London' },
  'fort william': { name: 'Fort William', region: 'Highland', country: 'Scotland', lat: 56.8197, lon: -5.1054, tz: 'Europe/London' },
  'aviemore': { name: 'Aviemore', region: 'Highland', country: 'Scotland', lat: 57.2083, lon: -3.8345, tz: 'Europe/London' },
  'oban': { name: 'Oban', region: 'Argyll', country: 'Scotland', lat: 56.4122, lon: -5.4733, tz: 'Europe/London' },
  'portree': { name: 'Portree', region: 'Isle of Skye', country: 'Scotland', lat: 57.4333, lon: -6.1917, tz: 'Europe/London' },
  'ullapool': { name: 'Ullapool', region: 'Highland', country: 'Scotland', lat: 57.8963, lon: -5.1605, tz: 'Europe/London' },
  'glasgow': { name: 'Glasgow', region: 'Strathclyde', country: 'Scotland', lat: 55.8642, lon: -4.2518, tz: 'Europe/London' },
  'edinburgh': { name: 'Edinburgh', region: 'Lothian', country: 'Scotland', lat: 55.9533, lon: -3.1883, tz: 'Europe/London' },
  'aberdeen': { name: 'Aberdeen', region: 'Grampian', country: 'Scotland', lat: 57.1497, lon: -2.0943, tz: 'Europe/London' },
  'perth': { name: 'Perth', region: 'Perthshire', country: 'Scotland', lat: 56.3958, lon: -3.4308, tz: 'Europe/London' },
  'st andrews': { name: 'St Andrews', region: 'Fife', country: 'Scotland', lat: 56.3398, lon: -2.7967, tz: 'Europe/London' },
  'mallaig': { name: 'Mallaig', region: 'Highland', country: 'Scotland', lat: 57.0059, lon: -5.8292, tz: 'Europe/London' },
}

function findLocation(q: string, name?: string | null) {
  const key = q.trim().toLowerCase()
  if (!key) return LOCATIONS['inverness']
  // Coordinate string "lat,lon" (e.g. "35.68,139.76") → worldwide city.
  const coordMatch = key.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/)
  if (coordMatch) {
    const lat = Number(coordMatch[1])
    const lon = Number(coordMatch[2])
    return {
      name: name?.trim() || `Coords ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      region: '',
      country: '',
      lat,
      lon,
      tz: 'auto',
    }
  }
  if (LOCATIONS[key]) return LOCATIONS[key]
  const partial = Object.values(LOCATIONS).find(
    (l) => l.name.toLowerCase().includes(key) || l.region.toLowerCase().includes(key),
  )
  return partial ?? LOCATIONS['inverness']
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('location') ?? 'inverness'
  const name = url.searchParams.get('name')
  const loc = findLocation(q, name)

  // ----- Try live OpenWeatherMap data (primary) -----
  try {
    const owmKey = process.env.OPENWEATHER_API_KEY
    if (owmKey) {
      const ctrl = new AbortController()
      const to = setTimeout(() => ctrl.abort(), 8000)
      const [curRes, fctRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${owmKey}&units=metric`,
          { signal: ctrl.signal },
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${loc.lat}&lon=${loc.lon}&appid=${owmKey}&units=metric`,
          { signal: ctrl.signal },
        ),
      ])
      clearTimeout(to)
      if (curRes.ok && fctRes.ok) {
        const cur = await curRes.json()
        const fct = await fctRes.json()
        if (cur.cod !== 401 && fct.cnt) {
          const payload = mapOpenWeather(cur, fct, {
            name: loc.name,
            region: loc.region,
            country: loc.country,
            lat: loc.lat,
            lon: loc.lon,
            tz: loc.tz,
          })
          return NextResponse.json(payload, {
            headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
          })
        }
      }
      throw new Error('OpenWeatherMap unavailable')
    }
  } catch {
    // fall through to Open-Meteo
  }

  // ----- Try live Open-Meteo data (fallback) -----
  try {
    const params = new URLSearchParams({
      latitude: String(loc.lat),
      longitude: String(loc.lon),
      timezone: loc.tz,
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m,uv_index,visibility',
      hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day,relative_humidity_2m,apparent_temperature',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      forecast_days: '7',
      past_days: '1',
      wind_speed_unit: 'kmh',
      timeformat: 'iso8601',
    })
    const apiUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 7000)
    const res = await fetch(apiUrl, { signal: ctrl.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const data = await res.json()
      let aq: { pm10: number; pm2_5: number; europeanAqi: number; label: string } | undefined
      try {
        const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=european_aqi,pm10,pm2_5&timezone=${encodeURIComponent(loc.tz)}`
        const aqCtrl = new AbortController()
        const aqTimeout = setTimeout(() => aqCtrl.abort(), 5000)
        const aqRes = await fetch(aqUrl, { signal: aqCtrl.signal })
        clearTimeout(aqTimeout)
        if (aqRes.ok) {
          const aqData = await aqRes.json()
          const cur = aqData.current
          if (cur) {
            const eai = cur.european_aqi ?? 25
            aq = {
              pm10: cur.pm10 ?? 5,
              pm2_5: cur.pm2_5 ?? 3,
              europeanAqi: eai,
              label: aqiLabel(eai).label,
            }
          }
        }
      } catch {
        /* ignore air quality failure */
      }
      const payload = mapOpenMeteo(data, loc, aq)
      return NextResponse.json(payload, {
        headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
      })
    }
    throw new Error('Open-Meteo responded ' + res.status)
  } catch {
    const mock = buildMock(loc, q)
    return NextResponse.json(mock, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}

interface OpenMeteoResponse {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    is_day: number
    precipitation: number
    weather_code: number
    cloud_cover: number
    pressure_msl: number
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
    dew_point_2m: number
    uv_index: number
    visibility: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    weather_code: number[]
    wind_speed_10m: number[]
    is_day: number[]
    relative_humidity_2m: number[]
    apparent_temperature: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: number[]
    precipitation_sum: number[]
    precipitation_probability_max: number[]
    wind_speed_10m_max: number[]
  }
}

function mapOpenMeteo(
  d: OpenMeteoResponse,
  loc: { name: string; region: string; country: string; lat: number; lon: number; tz: string },
  aq?: { pm10: number; pm2_5: number; europeanAqi: number; label: string },
): WeatherApiResponse {
  const c = d.current
  const cond = wmoToCondition(c.weather_code, !!c.is_day)
  const current: CurrentWeather = {
    temperature: Math.round(c.temperature_2m * 10) / 10,
    feelsLike: Math.round(c.apparent_temperature * 10) / 10,
    humidity: c.relative_humidity_2m,
    dewPoint: Math.round(c.dew_point_2m * 10) / 10,
    windSpeed: Math.round(c.wind_speed_10m),
    windDirection: c.wind_direction_10m,
    windGust: Math.round(c.wind_gusts_10m),
    pressure: Math.round(c.pressure_msl),
    uvIndex: c.uv_index,
    cloudCover: c.cloud_cover,
    visibility: Math.round(c.visibility / 1000),
    precipitation: c.precipitation,
    condition: cond,
    conditionLabel: conditionLabel(cond, { wind: c.wind_speed_10m, precip: c.precipitation }),
    time: c.time,
    isDay: !!c.is_day,
  }

  const nowIdx = Math.max(0, d.hourly.time.findIndex((t) => new Date(t).getTime() >= Date.now() - 3600_000))

  // Build hourly with 12 past hours + now + 24 future, so "now" sits near the
  // middle of the rail. Mark isNow + isPast for the component.
  const pastCount = 12
  const futureCount = 24
  const startIdx = Math.max(0, nowIdx - pastCount)
  const endIdx = Math.min(d.hourly.time.length, nowIdx + futureCount + 1)
  const hourly: HourlyPoint[] = []
  for (let i = startIdx; i < endIdx; i++) {
    hourly.push({
      time: d.hourly.time[i],
      temperature: Math.round(d.hourly.temperature_2m[i] * 10) / 10,
      precipitationProbability: d.hourly.precipitation_probability[i] ?? 0,
      windSpeed: Math.round(d.hourly.wind_speed_10m[i]),
      condition: wmoToCondition(d.hourly.weather_code[i], !!d.hourly.is_day[i]),
      isDay: !!d.hourly.is_day[i],
      isNow: i === nowIdx,
      isPast: i < nowIdx,
    })
  }

  // The 24-hour trend is forward-looking from now (unchanged).
  const trendLen = Math.min(24, Math.min(d.hourly.time.length, nowIdx + 24) - nowIdx)
  const trend = {
    labels: d.hourly.time.slice(nowIdx, nowIdx + trendLen),
    temperature: d.hourly.temperature_2m.slice(nowIdx, nowIdx + trendLen).map((v) => Math.round(v * 10) / 10),
    feelsLike: d.hourly.apparent_temperature
      ? d.hourly.apparent_temperature.slice(nowIdx, nowIdx + trendLen)
      : d.hourly.temperature_2m.slice(nowIdx, nowIdx + trendLen).map((v) => v),
    humidity: d.hourly.relative_humidity_2m
      ? d.hourly.relative_humidity_2m.slice(nowIdx, nowIdx + trendLen)
      : new Array(trendLen).fill(current.humidity),
    precipitationProbability: (d.hourly.precipitation_probability ?? new Array(d.hourly.time.length).fill(0)).slice(nowIdx, nowIdx + trendLen),
  }

  const daily: DailyPoint[] = d.daily.time.map((date, i) => ({
    date,
    tempMax: Math.round(d.daily.temperature_2m_max[i] * 10) / 10,
    tempMin: Math.round(d.daily.temperature_2m_min[i] * 10) / 10,
    condition: wmoToCondition(d.daily.weather_code[i]),
    precipitation: d.daily.precipitation_sum[i] ?? 0,
    precipitationProbability: d.daily.precipitation_probability_max[i] ?? 0,
    windSpeedMax: Math.round(d.daily.wind_speed_10m_max[i]),
    sunrise: d.daily.sunrise[i],
    sunset: d.daily.sunset[i],
    uvIndexMax: d.daily.uv_index_max[i],
  }))

  const sun = {
    sunrise: daily[0]?.sunrise ?? new Date().toISOString(),
    sunset: daily[0]?.sunset ?? new Date().toISOString(),
    daylightSeconds:
      (new Date(daily[0]?.sunset ?? Date.now()).getTime() -
        new Date(daily[0]?.sunrise ?? Date.now()).getTime()) /
      1000,
    moonPhase: computeMoonPhase(new Date()),
    moonPhaseLabel: moonPhaseLabel(computeMoonPhase(new Date())).label,
  }

  const airQuality = aq ?? {
    pm10: 6,
    pm2_5: 3,
    europeanAqi: 25,
    label: aqiLabel(25).label,
  }

  return {
    location: { name: loc.name, region: loc.region, country: loc.country, latitude: loc.lat, longitude: loc.lon, timezone: loc.tz },
    current,
    hourly,
    daily,
    trend,
    sun,
    airQuality,
    updatedAt: new Date().toISOString(),
    dataSource: 'open-meteo',
  }
}

function computeMoonPhase(date: Date): number {
  const synodic = 29.530588853
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime()
  const days = (date.getTime() - ref) / 86400_000
  const phase = (((days % synodic) + synodic) % synodic) / synodic
  return phase
}

function buildMock(
  loc: { name: string; region: string; country: string; lat: number; lon: number; tz: string },
  seedStr: string,
): WeatherApiResponse {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 2147483647
  if (seed === 0) seed = 1
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

  const conditions: WeatherCondition[] = [
    'partly-cloudy', 'cloudy', 'overcast', 'rain', 'drizzle', 'mist', 'clear', 'windy',
  ]
  const cond = pick(conditions)
  const baseTemp = 6 + rng() * 8
  const now = new Date()
  const iso = (offsetMin = 0) => new Date(now.getTime() + offsetMin * 60000).toISOString()

  const current: CurrentWeather = {
    temperature: Math.round(baseTemp * 10) / 10,
    feelsLike: Math.round((baseTemp - 2 + rng() * 2) * 10) / 10,
    humidity: Math.round(70 + rng() * 25),
    dewPoint: Math.round((baseTemp - 4 - rng() * 3) * 10) / 10,
    windSpeed: Math.round(12 + rng() * 30),
    windDirection: Math.round(rng() * 360),
    windGust: Math.round(20 + rng() * 40),
    pressure: Math.round(1000 + rng() * 25),
    uvIndex: Math.round(rng() * 5),
    cloudCover: Math.round(40 + rng() * 55),
    visibility: Math.round(8 + rng() * 12),
    precipitation: cond.includes('rain') ? Math.round(rng() * 6 * 10) / 10 : 0,
    condition: cond,
    conditionLabel: conditionLabel(cond, { wind: 20 }),
    time: iso(0),
    isDay: false, // corrected below after daily computed
  }

  const hourly: HourlyPoint[] = []
  const trendLabels: string[] = []
  const trendTemp: number[] = []
  const trendFeels: number[] = []
  const trendHum: number[] = []
  const trendPrecip: number[] = []

  // 12 past hours (walk backwards from now), then now, then 24 future hours.
  // "Now" sits at index 12 so the rail can centre on it.
  const pastCount = 12
  const futureCount = 24
  for (let i = -pastCount; i <= futureCount; i++) {
    const t = iso(i * 60)
    const temp = Math.round((baseTemp + Math.sin(i / 3) * 3 + (rng() - 0.5) * 2) * 10) / 10
    const hum = Math.round(70 + rng() * 25)
    const precip = Math.round(rng() * 80)
    const hc = i % 3 === 0 ? pick(conditions) : cond
    const isNow = i === 0
    hourly.push({
      time: t,
      temperature: temp,
      precipitationProbability: precip,
      windSpeed: Math.round(10 + rng() * 35),
      condition: hc,
      isDay: new Date(t).getHours() >= 6 && new Date(t).getHours() < 20,
      isNow,
      isPast: i < 0,
    })
    // Trend is forward-looking from now (i >= 0), capped at 24.
    if (i >= 0 && trendLabels.length < 24) {
      trendLabels.push(t)
      trendTemp.push(temp)
      trendFeels.push(Math.round((temp - 1.5) * 10) / 10)
      trendHum.push(hum)
      trendPrecip.push(precip)
    }
  }

  const daily: DailyPoint[] = []
  const dayConditions = ['partly-cloudy', 'rain', 'overcast', 'clear', 'drizzle', 'windy', 'cloudy']
  // Approximate local sunrise/sunset for Scottish latitudes (~57°N) in mid-October:
  // sunrise ~07:15, sunset ~18:15 (≈11h daylight). Expressed in UTC for Europe/London (GMT).
  const sunriseLocalHour = 7.25
  const sunsetLocalHour = 18.25
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400_000)
    // Normalize to start of UTC day, then add the local hour offset.
    const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    const dateStr = new Date(dayStart).toISOString().slice(0, 10)
    const dc = dayConditions[i % dayConditions.length]
    const max = Math.round((baseTemp + 2 + rng() * 4) * 10) / 10
    const min = Math.round((baseTemp - 3 - rng() * 3) * 10) / 10
    const sunrise = new Date(dayStart + sunriseLocalHour * 3600_000).toISOString()
    const sunset = new Date(dayStart + sunsetLocalHour * 3600_000).toISOString()
    daily.push({
      date: dateStr,
      tempMax: max,
      tempMin: min,
      condition: dc,
      precipitation: dc.includes('rain') ? Math.round(rng() * 8 * 10) / 10 : 0,
      precipitationProbability: Math.round(rng() * 80),
      windSpeedMax: Math.round(18 + rng() * 35),
      sunrise,
      sunset,
      uvIndexMax: Math.round(rng() * 6),
    })
  }

  const todaySunriseMs = new Date(daily[0].sunrise).getTime()
  const todaySunsetMs = new Date(daily[0].sunset).getTime()
  const nowMs = now.getTime()
  const isDay = nowMs >= todaySunriseMs && nowMs < todaySunsetMs
  current.isDay = isDay

  const sun = {
    sunrise: daily[0].sunrise,
    sunset: daily[0].sunset,
    daylightSeconds: (todaySunsetMs - todaySunriseMs) / 1000,
    moonPhase: computeMoonPhase(now),
    moonPhaseLabel: moonPhaseLabel(computeMoonPhase(now)).label,
  }

  const aqi = 20 + Math.round(rng() * 40)

  return {
    location: { name: loc.name, region: loc.region, country: loc.country, latitude: loc.lat, longitude: loc.lon, timezone: loc.tz },
    current,
    hourly,
    daily,
    trend: {
      labels: trendLabels,
      temperature: trendTemp,
      feelsLike: trendFeels,
      humidity: trendHum,
      precipitationProbability: trendPrecip,
    },
    sun,
    airQuality: {
      pm10: Math.round(5 + rng() * 12),
      pm2_5: Math.round(3 + rng() * 8),
      europeanAqi: aqi,
      label: aqiLabel(aqi).label,
    },
    updatedAt: iso(0),
    dataSource: 'mock',
  }
}

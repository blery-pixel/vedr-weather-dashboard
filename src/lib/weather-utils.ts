import type { WeatherCondition } from './weather-types'

/**
 * Map Open-Meteo weather codes (WMO) to our internal condition enum.
 * Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
export function wmoToCondition(code: number, isDay = true): WeatherCondition {
  switch (code) {
    case 0:
      return 'clear'
    case 1:
      return 'partly-cloudy'
    case 2:
      return 'partly-cloudy'
    case 3:
      return 'overcast'
    case 45:
    case 48:
      return isDay ? 'fog' : 'fog'
    case 51:
    case 53:
    case 55:
      return 'drizzle'
    case 56:
    case 57:
      return 'sleet'
    case 61:
    case 63:
      return 'rain'
    case 65:
      return 'heavy-rain'
    case 66:
    case 67:
      return 'sleet'
    case 71:
    case 73:
    case 75:
      return 'snow'
    case 77:
      return 'snow'
    case 80:
    case 81:
      return 'rain'
    case 82:
      return 'heavy-rain'
    case 85:
    case 86:
      return 'snow'
    case 95:
    case 96:
    case 99:
      return 'thunderstorm'
    default:
      return 'cloudy'
  }
}

export function conditionLabel(c: WeatherCondition, extras?: { wind?: number; precip?: number }): string {
  const labels: Record<WeatherCondition, string> = {
    clear: 'Clear sky',
    'partly-cloudy': 'Partly cloudy',
    cloudy: 'Cloudy',
    overcast: 'Overcast',
    mist: 'Misty',
    fog: 'Fog',
    drizzle: 'Light drizzle',
    rain: 'Rain',
    'heavy-rain': 'Heavy rain',
    sleet: 'Sleet',
    snow: 'Snow',
    thunderstorm: 'Thunderstorm',
    windy: 'Windy',
  }
  let base = labels[c] ?? 'Unknown'
  if (extras?.wind && extras.wind >= 35) base += ', breezy'
  if (extras?.precip && extras.precip >= 5) base = 'Wet, ' + base.toLowerCase()
  return base
}

/** Convert wind direction in degrees to a 16-point compass label. */
export function windDirLabel(deg: number): string {
  const dirs = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ]
  const idx = Math.round(deg / 22.5) % 16
  return dirs[idx]
}

/** Convert UV index to a categorical label. */
export function uvLabel(uv: number): { label: string; tone: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme' } {
  if (uv < 3) return { label: 'Low', tone: 'low' }
  if (uv < 6) return { label: 'Moderate', tone: 'moderate' }
  if (uv < 8) return { label: 'High', tone: 'high' }
  if (uv < 11) return { label: 'Very High', tone: 'very-high' }
  return { label: 'Extreme', tone: 'extreme' }
}

/** European AQI label. */
export function aqiLabel(v: number): { label: string; tone: 'good' | 'fair' | 'moderate' | 'poor' | 'very-poor' } {
  if (v <= 20) return { label: 'Good', tone: 'good' }
  if (v <= 40) return { label: 'Fair', tone: 'fair' }
  if (v <= 60) return { label: 'Moderate', tone: 'moderate' }
  if (v <= 80) return { label: 'Poor', tone: 'poor' }
  return { label: 'Very Poor', tone: 'very-poor' }
}

/** Moon phase from a 0..1 value to a descriptive label + emoji. */
export function moonPhaseLabel(p: number): { label: string; icon: string } {
  if (p < 0.03 || p > 0.97) return { label: 'New Moon', icon: '🌑' }
  if (p < 0.22) return { label: 'Waxing Crescent', icon: '🌒' }
  if (p < 0.28) return { label: 'First Quarter', icon: '🌓' }
  if (p < 0.47) return { label: 'Waxing Gibbous', icon: '🌔' }
  if (p < 0.53) return { label: 'Full Moon', icon: '🌕' }
  if (p < 0.72) return { label: 'Waning Gibbous', icon: '🌖' }
  if (p < 0.78) return { label: 'Last Quarter', icon: '🌗' }
  return { label: 'Waning Crescent', icon: '🌘' }
}

/** Format an ISO string into a short "HH:MM" 24h time. */
export function fmtTime(iso: string, timeZone?: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    }).format(d)
  } catch {
    return '--:--'
  }
}

/** Format an ISO date into a short weekday e.g. "Mon". */
export function fmtWeekday(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(new Date(iso))
  } catch {
    return '--'
  }
}

/** Format an ISO date into "14 Mar" style. */
export function fmtDayMonth(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(iso))
  } catch {
    return '--'
  }
}

/** Convert seconds of daylight to "Xh Ym" string. */
export function fmtDaylight(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export function compassDeg(deg: number): string {
  return `${Math.round(deg)}° ${windDirLabel(deg)}`
}

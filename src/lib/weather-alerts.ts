import type { CurrentWeather, WeatherCondition } from '@/lib/weather-types'

export type AlertLevel = 'info' | 'warning' | 'severe'
export type AlertKind =
  | 'storm'
  | 'high-wind'
  | 'heavy-rain'
  | 'snow'
  | 'fog'
  | 'uv-extreme'
  | 'cold'
  | 'heat'
  | 'low-pressure'

export interface WeatherAlert {
  level: AlertLevel
  kind: AlertKind
  title: string
  detail: string
}

/**
 * deriveAlerts — inspects current conditions and returns any active weather
 * alerts (severe > warning > info order). Returns an empty array if all clear.
 */
export function deriveAlerts(c: CurrentWeather): WeatherAlert[] {
  const alerts: WeatherAlert[] = []

  // Storm
  if (c.condition === 'thunderstorm') {
    alerts.push({
      level: 'severe',
      kind: 'storm',
      title: 'Thunderstorm warning',
      detail: 'Lightning detected — avoid exposed summits and high ground.',
    })
  }

  // High wind (Beaufort: ≥ 50 km/h strong, ≥ 75 very strong)
  if (c.windGust >= 75) {
    alerts.push({
      level: 'severe',
      kind: 'high-wind',
      title: 'Very high winds',
      detail: `Gusts to ${Math.round(c.windGust)} km/h. Travel disruption likely.`,
    })
  } else if (c.windSpeed >= 50 || c.windGust >= 60) {
    alerts.push({
      level: 'warning',
      kind: 'high-wind',
      title: 'Strong winds',
      detail: `Sustained ${Math.round(c.windSpeed)} km/h, gusting ${Math.round(c.windGust)} km/h.`,
    })
  }

  // Heavy rain
  if (c.condition === 'heavy-rain' || c.precipitation > 5) {
    alerts.push({
      level: 'warning',
      kind: 'heavy-rain',
      title: 'Heavy rainfall',
      detail: `${c.precipitation.toFixed(1)} mm in the last hour — risk of localised flooding.`,
    })
  }

  // Snow
  if (c.condition === 'snow' || c.condition === 'sleet') {
    alerts.push({
      level: 'warning',
      kind: 'snow',
      title: c.condition === 'sleet' ? 'Sleet expected' : 'Snowfall',
      detail: 'Roads may be icy — drive with care on high routes.',
    })
  }

  // Fog / mist
  if (c.condition === 'fog' || c.visibility < 4) {
    alerts.push({
      level: 'warning',
      kind: 'fog',
      title: c.condition === 'fog' ? 'Dense fog' : 'Poor visibility',
      detail: `Visibility ${Math.round(c.visibility)} km — take care on unlit roads.`,
    })
  }

  // UV extreme
  if (c.uvIndex >= 8) {
    alerts.push({
      level: 'warning',
      kind: 'uv-extreme',
      title: 'Very high UV',
      detail: `UV index ${c.uvIndex.toFixed(1)} — sun cream and shade essential above the treeline.`,
    })
  }

  // Extreme cold
  if (c.temperature <= -5) {
    alerts.push({
      level: 'warning',
      kind: 'cold',
      title: 'Bitter cold',
      detail: `Air temperature ${Math.round(c.temperature)}° — risk of frostbite on exposed skin.`,
    })
  }

  // Heat (rare for Scotland but possible)
  if (c.temperature >= 28) {
    alerts.push({
      level: 'warning',
      kind: 'heat',
      title: 'Unusual heat',
      detail: `${Math.round(c.temperature)}° — carry extra water on the hills.`,
    })
  }

  // Low pressure (unsettled)
  if (c.pressure <= 1000) {
    alerts.push({
      level: 'info',
      kind: 'low-pressure',
      title: 'Falling pressure',
      detail: `Pressure ${Math.round(c.pressure)} hPa — changeable weather approaching.`,
    })
  }

  // Sort: severe first, then warning, then info
  const order: Record<AlertLevel, number> = { severe: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => order[a.level] - order[b.level])
  return alerts
}

export function alertTone(kind: AlertKind): 'amber' | 'heather' | 'loch' | 'red' {
  switch (kind) {
    case 'storm':
    case 'high-wind':
      return 'red'
    case 'heavy-rain':
    case 'snow':
    case 'fog':
      return 'heather'
    case 'uv-extreme':
    case 'heat':
      return 'amber'
    case 'cold':
      return 'loch'
    case 'low-pressure':
      return 'loch'
    default:
      return 'amber'
  }
}

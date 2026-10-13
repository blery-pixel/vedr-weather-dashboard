import type { WeatherApiResponse, WeatherCondition } from '@/lib/weather-types'
import { fmtTime, fmtWeekday, windDirLabel } from '@/lib/weather-utils'

export interface StoryBeat {
  /** ISO time or date for the beat */
  when: string
  /** Short human label e.g. "Now", "16:00", "Tonight", "Tomorrow" */
  whenLabel: string
  /** Icon glyph — lucide icon name key */
  icon: 'sun' | 'moon' | 'cloud' | 'rain' | 'wind' | 'snow' | 'storm' | 'fog' | 'temp-up' | 'temp-down'
  /** Headline sentence */
  headline: string
  /** Optional detail sentence */
  detail?: string
  /** Tone for the accent dot */
  tone: 'amber' | 'loch' | 'heather' | 'green'
}

/**
 * buildStory — generates a 4-6 beat "your day" narrative timeline from the
 * weather data: now, next notable change, tonight, tomorrow, end-of-week.
 */
export function buildStory(data: WeatherApiResponse): StoryBeat[] {
  const beats: StoryBeat[] = []
  const c = data.current
  const tz = data.location.timezone
  const now = Date.now()

  // Beat 1 — Now
  const feelWord =
    c.temperature >= 18 ? 'mild'
      : c.temperature >= 12 ? 'cool'
        : c.temperature >= 6 ? 'bracing'
          : 'cold'
  beats.push({
    when: c.time,
    whenLabel: 'Now',
    icon: conditionToIcon(c.condition, c.isDay),
    headline: `${feelWord.charAt(0).toUpperCase() + feelWord.slice(1)} & ${c.conditionLabel.toLowerCase()}`,
    detail: `${Math.round(c.windSpeed)} km/h ${windDirLabel(c.windDirection)} wind, ${Math.round(c.humidity)}% humidity`,
    tone: c.condition.includes('rain') ? 'loch' : c.isDay ? 'amber' : 'heather',
  })

  // Beat 2 — Next notable change (find the biggest temp swing in next 12h)
  const next12 = data.hourly.slice(0, 12)
  let biggestSwingIdx = -1
  let biggestSwing = 0
  for (let i = 1; i < next12.length; i++) {
    const swing = Math.abs(next12[i].temperature - c.temperature)
    if (swing > biggestSwing && swing >= 3) {
      biggestSwing = swing
      biggestSwingIdx = i
    }
  }
  if (biggestSwingIdx > 0) {
    const h = next12[biggestSwingIdx]
    const warming = h.temperature > c.temperature
    beats.push({
      when: h.time,
      whenLabel: fmtTime(h.time, tz),
      icon: warming ? 'temp-up' : 'temp-down',
      headline: `${warming ? 'Warmer' : 'Cooler'} by ${Math.round(Math.abs(h.temperature - c.temperature))}°`,
      detail: `${h.precipitationProbability}% precip chance, ${conditionLabel(h.condition)}`,
      tone: warming ? 'amber' : 'loch',
    })
  }

  // Beat 3 — Highest precip chance in next 12h (if > 30%)
  let peakPrecipIdx = -1
  let peakPrecip = 30
  for (let i = 0; i < next12.length; i++) {
    if (next12[i].precipitationProbability > peakPrecip) {
      peakPrecip = next12[i].precipitationProbability
      peakPrecipIdx = i
    }
  }
  if (peakPrecipIdx >= 0) {
    const h = next12[peakPrecipIdx]
    beats.push({
      when: h.time,
      whenLabel: fmtTime(h.time, tz),
      icon: 'rain',
      headline: `${peakPrecip}% rain chance`,
      detail: peakPrecip >= 70 ? 'Pack waterproofs' : 'Light showers possible',
      tone: 'loch',
    })
  }

  // Beat 4 — Tonight (sunset)
  const sunsetMs = new Date(data.sun.sunset).getTime()
  if (sunsetMs > now) {
    const afterSunset = next12.find((h) => new Date(h.time).getTime() > sunsetMs)
    beats.push({
      when: data.sun.sunset,
      whenLabel: 'Tonight',
      icon: 'moon',
      headline: `Sunset at ${fmtTime(data.sun.sunset, tz)}`,
      detail: afterSunset
        ? `Overnight ~${Math.round(afterSunset.temperature)}°, ${afterSunset.precipitationProbability}% rain`
        : `${Math.floor(data.sun.daylightSeconds / 3600)}h ${Math.round((data.sun.daylightSeconds % 3600) / 60)}m of daylight`,
      tone: 'heather',
    })
  }

  // Beat 5 — Tomorrow
  if (data.daily[1]) {
    const d = data.daily[1]
    beats.push({
      when: d.date,
      whenLabel: fmtWeekday(d.date),
      icon: conditionToIcon(d.condition, true),
      headline: `${Math.round(d.tempMax)}° / ${Math.round(d.tempMin)}°, ${conditionLabel(d.condition)}`,
      detail: `${d.precipitationProbability}% rain, gusts to ${d.windSpeedMax} km/h`,
      tone: d.precipitationProbability >= 50 ? 'loch' : 'green',
    })
  }

  // Beat 6 — End of week
  if (data.daily[6]) {
    const d = data.daily[6]
    beats.push({
      when: d.date,
      whenLabel: fmtWeekday(d.date),
      icon: conditionToIcon(d.condition, true),
      headline: `${Math.round(d.tempMax)}° / ${Math.round(d.tempMin)}°`,
      detail: `${conditionLabel(d.condition)}, ${d.precipitationProbability}% rain`,
      tone: 'green',
    })
  }

  // Cap at 6 beats
  return beats.slice(0, 6)
}

function conditionToIcon(c: WeatherCondition, isDay: boolean): StoryBeat['icon'] {
  if (isDay && c === 'clear') return 'sun'
  if (!isDay && (c === 'clear' || c === 'partly-cloudy')) return 'moon'
  if (c === 'rain' || c === 'drizzle' || c === 'heavy-rain' || c === 'sleet') return 'rain'
  if (c === 'snow') return 'snow'
  if (c === 'thunderstorm') return 'storm'
  if (c === 'mist' || c === 'fog') return 'fog'
  if (c === 'windy') return 'wind'
  if (c === 'overcast' || c === 'cloudy') return 'cloud'
  if (isDay) return 'sun'
  return 'moon'
}

function conditionLabel(c: WeatherCondition): string {
  const m: Record<WeatherCondition, string> = {
    clear: 'clear skies',
    'partly-cloudy': 'partly cloudy',
    cloudy: 'cloudy',
    overcast: 'overcast',
    mist: 'misty',
    fog: 'foggy',
    drizzle: 'drizzle',
    rain: 'rain',
    'heavy-rain': 'heavy rain',
    sleet: 'sleet',
    snow: 'snow',
    thunderstorm: 'thunderstorms',
    windy: 'windy',
  }
  return m[c] ?? 'changeable'
}

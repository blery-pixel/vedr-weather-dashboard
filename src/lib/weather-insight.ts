import type { CurrentWeather, WeatherApiResponse } from '@/lib/weather-types'
import { uvLabel, windDirLabel } from '@/lib/weather-utils'

/**
 * Build a short, natural-language "Highlands briefing" from the current
 * conditions. Returns 2-3 sentences describing the feel, risk, and advice.
 */
export function buildInsight(data: WeatherApiResponse): {
  title: string
  body: string
  tags: { label: string; tone: 'amber' | 'loch' | 'heather' | 'green' }[]
} {
  const c = data.current
  const tags: { label: string; tone: 'amber' | 'loch' | 'heather' | 'green' }[] = []
  const sentences: string[] = []

  // Opener — temperature feel
  const feel =
    c.temperature >= 18
      ? 'unseasonably mild'
      : c.temperature >= 12
        ? 'pleasantly cool'
        : c.temperature >= 6
          ? 'bracing'
          : c.temperature >= 0
            ? 'cold'
            : 'bitterly cold'
  sentences.push(
    `${data.location.name} sits at ${Math.round(c.temperature)}° — ${feel} with ${c.conditionLabel.toLowerCase()}.`,
  )

  // Wind
  if (c.windSpeed >= 45 || c.windGust >= 65) {
    sentences.push(
      `Strong winds from the ${windDirLabel(c.windDirection)} (${Math.round(c.windSpeed)} km/h, gusting ${Math.round(c.windGust)}) will make it feel closer to ${Math.round(c.feelsLike)}°.`,
    )
    tags.push({ label: 'High wind', tone: 'amber' })
  } else if (c.windSpeed >= 25) {
    sentences.push(
      `A fresh ${windDirLabel(c.windDirection)} breeze (${Math.round(c.windSpeed)} km/h) drops the feels-like to ${Math.round(c.feelsLike)}°.`,
    )
    tags.push({ label: 'Breezy', tone: 'loch' })
  }

  // Precipitation
  if (c.precipitation > 0) {
    if (c.condition === 'heavy-rain' || c.precipitation > 4) {
      sentences.push('Heavy rain is falling — waterproofs essential if heading to the glens.')
      tags.push({ label: 'Heavy rain', tone: 'heather' })
    } else if (c.condition === 'rain' || c.condition === 'drizzle') {
      sentences.push('Light rain is settling in; expect slick paths.')
      tags.push({ label: 'Rain', tone: 'loch' })
    }
  }

  // Mist / fog
  if (c.condition === 'mist' || c.condition === 'fog') {
    sentences.push('Visibility is reduced by mist rolling off the loch.')
    tags.push({ label: 'Low visibility', tone: 'loch' })
  }

  // Humidity
  if (c.humidity >= 85 && c.condition !== 'fog' && c.condition !== 'mist') {
    sentences.push('The air is saturated — expect a damp chill.')
    tags.push({ label: 'Humid', tone: 'loch' })
  }

  // UV
  const uv = uvLabel(c.uvIndex)
  if (c.uvIndex >= 6) {
    sentences.push(`UV is ${uv.label.toLowerCase()} (${c.uvIndex.toFixed(1)}); shade and sun cream advised on the summits.`)
    tags.push({ label: `UV ${uv.label}`, tone: 'amber' })
  } else if (c.uvIndex >= 3) {
    tags.push({ label: `UV ${uv.label}`, tone: 'amber' })
  }

  // Pressure trend (static here — no prior reading to compare)
  if (c.pressure >= 1022) {
    tags.push({ label: 'Settled', tone: 'green' })
  } else if (c.pressure <= 1004) {
    sentences.push('Falling pressure suggests changeable weather approaching from the Atlantic.')
    tags.push({ label: 'Unsettled', tone: 'heather' })
  }

  // Daylight
  if (!c.isDay) {
    sentences.push('Night has fallen over the glens — take care on unlit single-track roads.')
  }

  const title = insightTitle(c)
  return {
    title,
    body: sentences.join(' '),
    tags: dedupeTags(tags),
  }
}

function insightTitle(c: CurrentWeather): string {
  if (c.condition === 'thunderstorm') return 'Storm watch'
  if (c.condition === 'heavy-rain') return 'Soaked glens'
  if (c.condition === 'snow') return 'Snow on the hills'
  if (c.condition === 'fog' || c.condition === 'mist') return 'Misty over the loch'
  if (c.windSpeed >= 45) return 'Windy on the summits'
  if (c.condition === 'clear' && c.isDay) return 'A fine Highland day'
  if (c.condition === 'clear' && !c.isDay) return 'A clear, starry night'
  if (c.condition === 'rain' || c.condition === 'drizzle') return 'Dreich afternoon'
  if (c.condition === 'overcast') return 'Grey skies over the strath'
  return 'Highland briefing'
}

function dedupeTags(tags: { label: string; tone: 'amber' | 'loch' | 'heather' | 'green' }[]) {
  const seen = new Set<string>()
  const out: { label: string; tone: 'amber' | 'loch' | 'heather' | 'green' }[] = []
  for (const t of tags) {
    if (seen.has(t.label)) continue
    seen.add(t.label)
    out.push(t)
  }
  return out.slice(0, 5)
}

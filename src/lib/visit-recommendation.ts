import type { WeatherApiResponse, DailyPoint } from '@/lib/weather-types'

export interface DayScore {
  date: string
  dayLabel: string
  score: number // 0..100
  grade: 'excellent' | 'good' | 'fair' | 'poor'
  reasons: string[]
  tempMax: number
  tempMin: number
  precipProb: number
  windMax: number
  condition: DailyPoint['condition']
}

/**
 * scoreDay — scores a single day 0..100 for outdoor Highland activities
 * (hillwalking/sightseeing). Combines temperature comfort, precipitation
 * risk, and wind severity.
 */
function scoreDay(d: DailyPoint): DayScore {
  const reasons: string[] = []
  let score = 50

  // Temperature comfort — ideal ~12-18°C
  const t = (d.tempMax + d.tempMin) / 2
  if (t >= 12 && t <= 18) {
    score += 22
    reasons.push('Ideal daytime temperatures')
  } else if (t >= 8 && t <= 22) {
    score += 12
    reasons.push('Comfortable temperatures')
  } else if (t < 2) {
    score -= 15
    reasons.push('Bitterly cold')
  } else if (t > 24) {
    score -= 5
    reasons.push('Unusually warm')
  } else {
    reasons.push('Cool but manageable')
  }

  // Precipitation
  if (d.precipitationProbability < 20) {
    score += 18
    reasons.push('Low rain chance')
  } else if (d.precipitationProbability < 40) {
    score += 8
    reasons.push('Mostly dry')
  } else if (d.precipitationProbability < 60) {
    score -= 5
    reasons.push('Possible showers')
  } else {
    score -= 18
    reasons.push('High rain chance')
  }

  // Wind
  if (d.windSpeedMax < 20) {
    score += 12
    reasons.push('Calm winds')
  } else if (d.windSpeedMax < 35) {
    score += 2
  } else if (d.windSpeedMax < 50) {
    score -= 8
    reasons.push('Breezy on the summits')
  } else {
    score -= 22
    reasons.push('Strong winds — avoid heights')
  }

  // Condition bonus
  if (d.condition === 'clear' || d.condition === 'partly-cloudy') {
    score += 6
  } else if (d.condition === 'thunderstorm' || d.condition === 'heavy-rain') {
    score -= 8
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const grade: DayScore['grade'] =
    score >= 75 ? 'excellent' : score >= 55 ? 'good' : score >= 35 ? 'fair' : 'poor'

  return {
    date: d.date,
    dayLabel: '',
    score,
    grade,
    reasons,
    tempMax: d.tempMax,
    tempMin: d.tempMin,
    precipProb: d.precipitationProbability,
    windMax: d.windSpeedMax,
    condition: d.condition,
  }
}

/**
 * buildVisitRecommendation — scores each of the next 7 days + identifies the
 * single best day to visit. Returns the per-day scores + the recommendation.
 */
export function buildVisitRecommendation(data: WeatherApiResponse): {
  days: DayScore[]
  bestDay: DayScore | null
  headline: string
  detail: string
  tone: 'amber' | 'loch' | 'heather' | 'green'
} {
  const days = data.daily.slice(0, 7).map((d, i) => {
    const s = scoreDay(d)
    s.dayLabel = i === 0 ? 'Today' : new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })
    return s
  })

  const bestDay = days.reduce((best, d) => (d.score > (best?.score ?? -1) ? d : best), null as DayScore | null)

  let headline = 'Checking the week…'
  let detail = ''
  let tone: 'amber' | 'loch' | 'heather' | 'green' = 'loch'

  if (bestDay) {
    if (bestDay.grade === 'excellent') {
      headline = `${bestDay.dayLabel} is the pick`
      detail = `Score ${bestDay.score}/100 — ${bestDay.reasons.join(', ').toLowerCase()}.`
      tone = 'green'
    } else if (bestDay.grade === 'good') {
      headline = `${bestDay.dayLabel} looks best`
      detail = `Score ${bestDay.score}/100 — ${bestDay.reasons.join(', ').toLowerCase()}.`
      tone = 'amber'
    } else if (bestDay.grade === 'fair') {
      headline = `${bestDay.dayLabel} is the least dire`
      detail = `Score ${bestDay.score}/100. Conditions are marginal all week — pack waterproofs.`
      tone = 'loch'
    } else {
      headline = 'A dreich week ahead'
      detail = `Best day (${bestDay.dayLabel}) still scores only ${bestDay.score}/100. Consider staying by the fire.`
      tone = 'heather'
    }
  }

  return { days, bestDay, headline, detail, tone }
}

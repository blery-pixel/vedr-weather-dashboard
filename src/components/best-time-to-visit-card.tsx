'use client'

import * as React from 'react'
import { CalendarCheck, Award } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { WeatherIcon } from '@/components/weather-icon'
import { buildVisitRecommendation } from '@/lib/visit-recommendation'
import { usePreferences, fmtTemp } from '@/lib/use-preferences'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

const gradeTone: Record<string, string> = {
  excellent: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40',
  good: 'bg-scot-amber/15 text-scot-amber border-scot-amber/40',
  fair: 'bg-scot-loch/15 text-scot-loch border-scot-loch/40',
  poor: 'bg-scot-heather/15 text-scot-heather border-scot-heather/40',
}

const headlineTone: Record<string, string> = {
  green: 'text-emerald-500',
  amber: 'text-scot-amber',
  loch: 'text-scot-loch',
  heather: 'text-scot-heather',
}

/**
 * BestTimeToVisitCard — scores each of the next 7 days for outdoor Highland
 * activities (temp comfort + precip risk + wind) and recommends the best day.
 */
export function BestTimeToVisitCard({ data }: { data: WeatherApiResponse }) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const rec = React.useMemo(() => buildVisitRecommendation(data), [data])

  return (
    <GlassCard className="fade-up p-5" aria-label="Best time to visit recommendation">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Hillwalker's Almanac</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Best day to roam</h3>
          </div>
        </div>
        {rec.bestDay && (
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold', gradeTone[rec.bestDay.grade])}>
            <Award className="h-3 w-3" aria-hidden />
            {rec.bestDay.dayLabel} · {rec.bestDay.score}/100
          </span>
        )}
      </div>

      {/* Recommendation headline */}
      <div className="mb-4 rounded-lg border border-border/40 bg-card/30 p-3 backdrop-blur-md">
        <div className={cn('text-base font-bold', headlineTone[rec.tone])}>{rec.headline}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{rec.detail}</p>
      </div>

      {/* 7-day score bars */}
      <div className="grid grid-cols-7 gap-1.5">
        {rec.days.map((d, i) => {
          const isBest = rec.bestDay?.date === d.date
          return (
            <div
              key={d.date}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-1.5',
                isBest ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border/40 bg-card/30',
              )}
            >
              <span className={cn('text-[0.6rem] font-semibold', isBest ? 'text-emerald-500' : 'text-muted-foreground')}>
                {d.dayLabel}
              </span>
              <WeatherIcon condition={d.condition} className="h-4 w-4" />
              {/* Score ring */}
              <div className="relative flex h-10 w-10 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke={d.score >= 75 ? '#10b981' : d.score >= 55 ? '#E68A2E' : d.score >= 35 ? '#788A87' : '#6B4E5B'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(d.score / 100) * 2 * Math.PI * 15} 9999`}
                  />
                </svg>
                <span className="absolute text-[0.6rem] font-bold tabular-nums text-foreground">{d.score}</span>
              </div>
              <span className="text-[0.55rem] text-muted-foreground tabular-nums">
                {fmtTemp(d.tempMax, tempUnit)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Best-day reasons */}
      {rec.bestDay && rec.bestDay.reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
          {rec.bestDay.reasons.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-card/30 px-2 py-0.5 text-[0.65rem] text-muted-foreground"
            >
              {r}
            </span>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

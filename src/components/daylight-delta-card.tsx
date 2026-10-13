'use client'

import * as React from 'react'
import { Sun, TrendingUp, TrendingDown } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { fmtDaylight } from '@/lib/weather-utils'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

/**
 * DaylightDeltaCard — shows today's daylight length, the delta vs yesterday,
 * and a 7-day mini bar chart of daylight minutes so the user can see the
 * days lengthening (spring) or shortening (autumn).
 */
export function DaylightDeltaCard({ data }: { data: WeatherApiResponse }) {
  const days = data.daily.slice(0, 7)

  // Compute daylight seconds per day
  const daylightSecs = days.map((d) => {
    const sr = new Date(d.sunrise).getTime()
    const ss = new Date(d.sunset).getTime()
    return Math.max(0, (ss - sr) / 1000)
  })

  const today = daylightSecs[0] ?? 0
  const yesterday = daylightSecs[1] ?? today
  const deltaSec = today - yesterday
  const deltaMin = Math.round(deltaSec / 60)
  const lengthening = deltaMin > 0

  // Mini bar chart — normalise to the min/max across the week
  const min = Math.min(...daylightSecs)
  const max = Math.max(...daylightSecs)
  const range = Math.max(1, max - min)

  return (
    <GlassCard className="fade-up p-5" aria-label="Daylight delta almanac">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-amber/15 text-scot-amber">
            <Sun className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Daylight Almanac</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Day length trend</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {lengthening ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden />
          ) : (
            <TrendingDown className="h-4 w-4 text-scot-heather" aria-hidden />
          )}
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              lengthening ? 'text-emerald-500' : 'text-scot-heather',
            )}
          >
            {lengthening ? '+' : ''}{deltaMin}m
          </span>
        </div>
      </div>

      {/* Today's daylight big readout */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {fmtDaylight(today)}
        </span>
        <span className="text-xs text-muted-foreground">today</span>
      </div>

      {/* 7-day mini bar chart */}
      <div className="flex h-16 items-end gap-1.5" aria-hidden>
        {daylightSecs.map((sec, i) => {
          const h = 12 + ((sec - min) / range) * 48
          const isToday = i === 0
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1"
              title={`Day ${i === 0 ? '(today)' : i}: ${fmtDaylight(sec)}`}
            >
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  isToday ? 'bg-scot-amber/80' : 'bg-scot-amber/25',
                )}
                style={{ height: `${h}px` }}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-[0.65rem] text-muted-foreground">
        <span>{lengthening ? 'Days are lengthening' : 'Days are shortening'}</span>
        <span className="tabular-nums">range {fmtDaylight(max - min + min)} → {fmtDaylight(max)}</span>
      </div>
    </GlassCard>
  )
}

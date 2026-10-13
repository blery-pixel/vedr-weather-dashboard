'use client'

import * as React from 'react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { WeatherIcon } from '@/components/weather-icon'
import { fmtWeekday, fmtDayMonth } from '@/lib/weather-utils'
import type { DailyPoint, WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'
import { fmtTemp, usePreferences } from '@/lib/use-preferences'

export function WeeklyForecast({ data }: { data: WeatherApiResponse }) {
  const days = data.daily.slice(0, 7)
  // global min/max across the week for the bar scaling
  const weekMin = Math.min(...days.map((d) => d.tempMin))
  const weekMax = Math.max(...days.map((d) => d.tempMax))
  const range = Math.max(1, weekMax - weekMin)

  return (
    <GlassCard className="fade-up flex h-full flex-col p-5" aria-label="Seven day forecast">
      <div className="mb-3">
        <CardLabel>7-day outlook</CardLabel>
        <h3 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Across the glens
        </h3>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-border/30" role="list">
        {days.map((d, i) => (
          <DayRow
            key={d.date}
            day={d}
            isToday={i === 0}
            weekMin={weekMin}
            range={range}
          />
        ))}
      </ul>
    </GlassCard>
  )
}

function DayRow({
  day,
  isToday,
  weekMin,
  range,
}: {
  day: DailyPoint
  isToday: boolean
  weekMin: number
  range: number
}) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const leftPct = ((day.tempMin - weekMin) / range) * 100
  const widthPct = ((day.tempMax - day.tempMin) / range) * 100

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="w-16 shrink-0">
        <div className={cn('text-sm font-medium', isToday ? 'text-scot-amber' : 'text-foreground')}>
          {isToday ? 'Today' : fmtWeekday(day.date)}
        </div>
        <div className="text-[0.65rem] text-muted-foreground">{fmtDayMonth(day.date)}</div>
      </div>

      <div className="flex w-10 shrink-0 justify-center">
        <WeatherIcon condition={day.condition} className="h-5 w-5" />
      </div>

      <div className="flex w-12 shrink-0 items-center gap-1 text-xs text-scot-loch">
        {day.precipitationProbability > 0 && (
          <>
            <span aria-hidden>•</span>
            <span className="tabular-nums">{day.precipitationProbability}%</span>
          </>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <span className="w-9 text-right text-xs font-medium text-muted-foreground tabular-nums">
          {fmtTemp(day.tempMin, tempUnit)}
        </span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
          <div
            className="absolute h-full rounded-full bg-gradient-to-r from-scot-loch/70 via-scot-amber to-scot-amber-glow"
            style={{ left: `${leftPct}%`, width: `${Math.max(6, widthPct)}%` }}
            aria-hidden
          />
        </div>
        <span className="w-9 text-left text-xs font-semibold text-foreground tabular-nums">
          {fmtTemp(day.tempMax, tempUnit)}
        </span>
      </div>
    </li>
  )
}

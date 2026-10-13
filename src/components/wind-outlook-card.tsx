'use client'

import * as React from 'react'
import { Wind } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { fmtWeekday } from '@/lib/weather-utils'
import { usePreferences, fmtSpeed, speedUnitLabel } from '@/lib/use-preferences'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

/**
 * WindOutlookCard — a 7-day max wind-speed bar chart. Each day is a vertical
 * bar tone-mapped by Beaufort scale (calm green → fresh amber → strong heather
 * → gale red). Shows the peak gust day + a verdict.
 */
export function WindOutlookCard({ data }: { data: WeatherApiResponse }) {
  const speedUnit = usePreferences((s) => s.speedUnit)
  const days = data.daily.slice(0, 7)

  const peak = Math.max(...days.map((d) => d.windSpeedMax))
  const peakDay = days.find((d) => d.windSpeedMax === peak)
  const peakDayLabel = peakDay ? (days.indexOf(peakDay) === 0 ? 'Today' : fmtWeekday(peakDay.date)) : ''

  const verdict =
    peak >= 60 ? 'Gale-force gusts midweek'
      : peak >= 45 ? 'Strong winds ahead'
        : peak >= 30 ? 'Fresh breezes'
          : 'Calm week ahead'

  const tone = peak >= 60 ? 'text-red-500' : peak >= 45 ? 'text-scot-heather' : peak >= 30 ? 'text-scot-amber' : 'text-emerald-500'

  const beaufortTone = (kmh: number) =>
    kmh >= 60 ? 'bg-red-500/70'
      : kmh >= 45 ? 'bg-scot-heather/70'
        : kmh >= 30 ? 'bg-scot-amber/60'
          : kmh >= 15 ? 'bg-scot-loch/50'
            : 'bg-emerald-500/40'

  return (
    <GlassCard className="fade-up p-5" aria-label="Seven-day wind speed outlook">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-amber/15 text-scot-amber">
            <Wind className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Wind Outlook</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Gusts across the week</h3>
          </div>
        </div>
        <div className="text-right">
          <div className={cn('text-sm font-semibold', tone)}>{verdict}</div>
          <div className="text-[0.65rem] text-muted-foreground">peak {fmtSpeed(peak, speedUnit)} {speedUnitLabel(speedUnit)} · {peakDayLabel}</div>
        </div>
      </div>

      {/* 7-day bar chart */}
      <div className="flex items-end gap-2" role="list" aria-label="Daily maximum wind speed">
        {days.map((d, i) => {
          const isPeak = d.windSpeedMax === peak
          const h = Math.max(8, (d.windSpeedMax / Math.max(peak, 1)) * 100)
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5" role="listitem">
              <span className="text-[0.65rem] font-bold text-foreground tabular-nums">
                {fmtSpeed(d.windSpeedMax, speedUnit)}
              </span>
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className={cn('w-full max-w-[2.5rem] rounded-t transition-all', beaufortTone(d.windSpeedMax), isPeak && 'ring-2 ring-red-500/40')}
                  style={{ height: `${h}%` }}
                  title={`${i === 0 ? 'Today' : fmtWeekday(d.date)}: ${fmtSpeed(d.windSpeedMax, speedUnit)} ${speedUnitLabel(speedUnit)}`}
                  aria-hidden
                />
              </div>
              <span className={cn('text-[0.6rem] font-medium', isPeak ? 'text-red-500' : 'text-muted-foreground')}>
                {i === 0 ? 'Today' : fmtWeekday(d.date).slice(0, 3)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Beaufort legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-[0.65rem] text-muted-foreground">
        <span>Beaufort scale</span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500/40" aria-hidden />Calm</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-scot-loch/50" aria-hidden />Light</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-scot-amber/60" aria-hidden />Fresh</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-scot-heather/70" aria-hidden />Strong</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500/70" aria-hidden />Gale</span>
        </div>
      </div>
    </GlassCard>
  )
}

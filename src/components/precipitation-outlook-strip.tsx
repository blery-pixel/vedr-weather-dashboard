'use client'

import * as React from 'react'
import { CloudRain, Umbrella } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { WeatherIcon } from '@/components/weather-icon'
import { fmtWeekday } from '@/lib/weather-utils'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

/**
 * PrecipitationOutlookStrip — 7-day precipitation outlook in a compact
 * strip mirroring the Solar Almanac. Each day shows the precip probability
 * as a vertical bar + a wet/dry verdict, with today highlighted.
 */
export function PrecipitationOutlookStrip({ data }: { data: WeatherApiResponse }) {
  const days = data.daily.slice(0, 7)

  const peak = Math.max(0, ...days.map((d) => d.precipitationProbability))
  const wetDays = days.filter((d) => d.precipitationProbability >= 50).length
  const verdict =
    wetDays >= 4 ? 'A unsettled week ahead' : wetDays >= 2 ? 'Mixed conditions' : wetDays >= 1 ? 'Occasional showers' : 'Mostly dry week'

  return (
    <GlassCard className="fade-up p-5" aria-label="Seven-day precipitation outlook">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-heather/15 text-scot-heather">
            <Umbrella className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Precipitation Outlook</CardLabel>
            <h3 className="text-3xl font-semibold tracking-tight text-foreground">Rain across the week</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">{verdict}</div>
          <div className="text-[0.65rem] text-muted-foreground">peak {peak}% · {wetDays} wet day{wetDays === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d, i) => {
          const prob = d.precipitationProbability
          const tone =
            prob >= 70 ? 'bg-scot-heather/70'
              : prob >= 50 ? 'bg-scot-loch/60'
                : prob >= 25 ? 'bg-scot-amber/40'
                  : 'bg-emerald-500/30'
          const iconTone =
            prob >= 70 ? 'text-scot-heather'
              : prob >= 50 ? 'text-scot-loch'
                : prob >= 25 ? 'text-scot-amber'
                  : 'text-emerald-500'
          return (
            <div
              key={d.date}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border border-border/40 bg-card/30 p-1.5 backdrop-blur-sm',
                i === 0 && 'border-scot-amber/40 bg-scot-amber/5',
              )}
            >
              <span className={cn('text-[0.65rem] font-semibold', i === 0 ? 'text-scot-amber' : 'text-muted-foreground')}>
                {i === 0 ? 'Today' : fmtWeekday(d.date).slice(0, 3)}
              </span>

              {/* Mini precip bar */}
              <div className="relative my-1 h-12 w-full">
                <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-center">
                  <div
                    className={cn('w-2.5 rounded-t', tone)}
                    style={{ height: `${Math.max(6, prob)}%` }}
                    aria-hidden
                  />
                </div>
                <span className="absolute inset-x-0 top-1.5 text-center text-[0.6rem] font-bold text-foreground tabular-nums">
                  {prob}%
                </span>
              </div>

              <WeatherIcon condition={d.condition} className={cn('h-4 w-4', iconTone)} />

              <span className="text-[0.55rem] text-muted-foreground tabular-nums">
                {d.precipitation > 0 ? `${d.precipitation.toFixed(1)}mm` : '—'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[0.65rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CloudRain className="h-3 w-3 text-scot-loch" aria-hidden />
          Bars show daily precipitation probability
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500/30" aria-hidden />Dry</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-scot-loch/60" aria-hidden />Showers</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-scot-heather/70" aria-hidden />Wet</span>
        </span>
      </div>
    </GlassCard>
  )
}

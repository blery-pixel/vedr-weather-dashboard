'use client'

import * as React from 'react'
import { Sunrise, Sunset } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { WeatherIcon } from '@/components/weather-icon'
import { fmtTime, fmtWeekday } from '@/lib/weather-utils'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

export function SunAlmanacStrip({ data }: { data: WeatherApiResponse }) {
  const days = data.daily.slice(0, 7)
  const tz = data.location.timezone

  return (
    <GlassCard className="fade-up p-5" aria-label="Seven-day sunrise and sunset almanac">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <CardLabel>Solar Almanac</CardLabel>
          <h3 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Sun across the week
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[0.65rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Sunrise className="h-3.5 w-3.5 text-scot-amber" aria-hidden /> Rise
          </span>
          <span className="inline-flex items-center gap-1">
            <Sunset className="h-3.5 w-3.5 text-scot-heather" aria-hidden /> Set
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d, i) => {
          const sunrise = new Date(d.sunrise).getTime()
          const sunset = new Date(d.sunset).getTime()
          const total = Math.max(1, sunset - sunrise)
          const now = Date.now()
          const progress =
            i === 0
              ? Math.min(1, Math.max(0, (now - sunrise) / total))
              : 0.5
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

              {/* Mini sun arc */}
              <div className="relative my-1 h-8 w-full">
                <svg viewBox="0 0 40 32" className="h-full w-full" aria-hidden>
                  <path
                    d="M 2 28 Q 20 -6 38 28"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.30}
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                  <line x1="0" y1="28" x2="40" y2="28" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />
                  {i === 0 && (
                    <circle
                      cx={2 + progress * 36}
                      cy={28 - Math.sin(progress * Math.PI) * 24}
                      r={2.2}
                      fill="#E68A2E"
                    />
                  )}
                </svg>
              </div>

              <div className="flex w-full flex-col items-center gap-0.5">
                <span className="flex items-center gap-0.5 text-[0.6rem] font-medium text-foreground tabular-nums">
                  {fmtTime(d.sunrise, tz)}
                </span>
                <span className="text-[0.55rem] text-muted-foreground tabular-nums">
                  {fmtTime(d.sunset, tz)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[0.65rem] text-muted-foreground">
        <span>Daylight gain over 7 days is small at this latitude.</span>
        <span className="tabular-nums">{data.sun.daylightSeconds ? `${Math.floor(data.sun.daylightSeconds / 3600)}h ${Math.round((data.sun.daylightSeconds % 3600) / 60)}m` : ''}</span>
      </div>
    </GlassCard>
  )
}

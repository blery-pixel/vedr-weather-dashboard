'use client'

import * as React from 'react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { SunTimeIcon } from '@/components/weather-icon'
import { fmtDaylight, fmtTime, moonPhaseLabel } from '@/lib/weather-utils'
import { useCountdown, fmtCountdown } from '@/hooks/use-countdown'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

export function SunMoonCard({ data }: { data: WeatherApiResponse }) {
  const { sun, current, location } = data
  const tz = location.timezone
  const now = Date.now()
  const sunriseMs = new Date(sun.sunrise).getTime()
  const sunsetMs = new Date(sun.sunset).getTime()
  const totalDay = Math.max(1, sunsetMs - sunriseMs)
  const elapsed = Math.min(totalDay, Math.max(0, now - sunriseMs))
  const progress = current.isDay ? (elapsed / totalDay) * 100 : 0

  const moon = moonPhaseLabel(sun.moonPhase)

  // Live countdowns — to the next sunrise or sunset depending on day/night.
  const isDaylight = current.isDay
  const nextTarget = isDaylight ? sun.sunset : sun.sunrise
  const countdown = useCountdown(nextTarget, 60_000)
  const countdownLabel = isDaylight ? 'Sunset in' : 'Sunrise in'

  return (
    <GlassCard className="fade-up p-5" aria-label="Sun and moon">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <CardLabel>Solar & Lunar</CardLabel>
          <h3 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Daylight cycle</h3>
        </div>
        {/* Live countdown chip */}
        <div
          className={cn(
            'flex flex-col items-end rounded-md border px-2.5 py-1 backdrop-blur-md',
            isDaylight
              ? 'border-scot-amber/40 bg-scot-amber/10'
              : 'border-scot-loch/40 bg-scot-loch/10',
          )}
          title={`${countdownLabel} ${fmtCountdown(countdown)}`}
        >
          <span className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">
            {countdownLabel}
          </span>
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              isDaylight ? 'text-scot-amber' : 'text-scot-loch',
            )}
          >
            {fmtCountdown(countdown)}
          </span>
        </div>
      </div>

      {/* Arc sunrise-sunset visualization */}
      <div className="relative mx-auto mb-4 h-24 w-full max-w-xs">
        <svg viewBox="0 0 200 80" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="sunArcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6B4E5B" />
              <stop offset="50%" stopColor="#E68A2E" />
              <stop offset="100%" stopColor="#6B4E5B" />
            </linearGradient>
          </defs>
          <path
            d="M 10 70 Q 100 -20 190 70"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.30}
            strokeWidth={2}
            strokeDasharray="3 4"
          />
          <path
            d="M 10 70 Q 100 -20 190 70"
            fill="none"
            stroke="url(#sunArcGrad)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="282"
            strokeDashoffset={282 - (282 * progress) / 100}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
          {/* horizon line */}
          <line x1="0" y1="70" x2="200" y2="70" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />
        </svg>
        {/* Sun marker */}
        {isDaylight && (
          <div
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-scot-amber shadow-[0_0_12px_2px_rgba(230,138,46,0.6)]"
            style={{
              left: `${10 + (progress / 100) * 180}%`,
              top: `${70 - Math.sin((progress / 100) * Math.PI) * 60}%`,
            }}
            aria-hidden
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SunTimeIcon kind="sunrise" className="h-4 w-4" />
          <div>
            <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Sunrise</div>
            <div className="text-sm font-semibold text-foreground tabular-nums">
              {fmtTime(sun.sunrise, tz)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Sunset</div>
            <div className="text-sm font-semibold text-foreground tabular-nums">
              {fmtTime(sun.sunset, tz)}
            </div>
          </div>
          <SunTimeIcon kind="sunset" className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
        <div>
          <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Daylight</div>
          <div className="text-sm font-semibold text-scot-amber tabular-nums">
            {fmtDaylight(sun.daylightSeconds)}
          </div>
        </div>
        <div>
          <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Moon phase</div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span aria-hidden className="text-base">{moon.icon}</span>
            <span className="truncate">{moon.label}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

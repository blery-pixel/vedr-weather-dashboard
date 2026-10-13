'use client'

import * as React from 'react'
import { CloudRain, Radar } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { fmtTime } from '@/lib/weather-utils'
import { cn } from '@/lib/utils'

/**
 * PrecipitationRadarCard — next-12-hour precipitation probability as a
 * compact "radar sweep" style bar ring + a dry/wet verdict. Purely visual
 * (no chart lib); uses the hourly probability array.
 */
export function PrecipitationRadarCard({ data }: { data: WeatherApiResponse }) {
  const hours = data.hourly.slice(0, 12)
  const tz = data.location.timezone
  const maxProb = Math.max(0, ...hours.map((h) => h.precipitationProbability))
  const avgProb = Math.round(
    hours.reduce((a, h) => a + h.precipitationProbability, 0) / Math.max(1, hours.length),
  )

  const verdict =
    maxProb >= 70 ? 'High chance of rain' : maxProb >= 40 ? 'Showers likely' : maxProb >= 20 ? 'Possible drizzle' : 'Dry ahead'
  const verdictTone =
    maxProb >= 70 ? 'text-scot-heather' : maxProb >= 40 ? 'text-scot-amber' : maxProb >= 20 ? 'text-scot-loch' : 'text-emerald-500'

  return (
    <GlassCard className="fade-up p-5" aria-label="Precipitation radar next 12 hours">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-heather/15 text-scot-heather">
            <Radar className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Precipitation Radar</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Next 12 hours</h3>
          </div>
        </div>
        <div className="text-right">
          <div className={cn('text-sm font-semibold', verdictTone)}>{verdict}</div>
          <div className="text-[0.65rem] text-muted-foreground">peak {maxProb}% · avg {avgProb}%</div>
        </div>
      </div>

      {/* Radar sweep ring */}
      <div className="relative mx-auto mb-4 h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
          {/* concentric rings */}
          {[48, 36, 24, 12].map((r) => (
            <circle key={r} cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={1} />
          ))}
          {/* crosshair */}
          <line x1="60" y1="6" x2="60" y2="114" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
          <line x1="6" y1="60" x2="114" y2="60" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
          {/* probability wedges — each hour is a 30° slice */}
          {hours.map((h, i) => {
            const startAngle = (i / 12) * 360 - 90
            const endAngle = ((i + 1) / 12) * 360 - 90
            const r = 48
            const x1 = 60 + r * Math.cos((startAngle * Math.PI) / 180)
            const y1 = 60 + r * Math.sin((startAngle * Math.PI) / 180)
            const x2 = 60 + r * Math.cos((endAngle * Math.PI) / 180)
            const y2 = 60 + r * Math.sin((endAngle * Math.PI) / 180)
            const largeArc = endAngle - startAngle > 180 ? 1 : 0
            const opacity = (h.precipitationProbability / 100) * 0.85
            const color = h.precipitationProbability >= 60 ? '#6B4E5B' : h.precipitationProbability >= 30 ? '#788A87' : '#4a9e6e'
            return (
              <path
                key={i}
                d={`M 60 60 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
                fill={color}
                fillOpacity={opacity}
                stroke="none"
              />
            )
          })}
          {/* center dot */}
          <circle cx="60" cy="60" r="4" fill="var(--background)" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <CloudRain className="h-5 w-5 text-scot-loch" aria-hidden />
          <span className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{maxProb}%</span>
          <span className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">peak</span>
        </div>
      </div>

      {/* Hourly probability bars */}
      <div className="flex items-end gap-1" role="list" aria-label="Hourly precipitation probability">
        {hours.map((h, i) => (
          <div key={h.time} className="flex flex-1 flex-col items-center gap-1" role="listitem">
            <div className="flex h-12 w-full items-end justify-center">
              <div
                className={cn(
                  'w-full rounded-t',
                  h.precipitationProbability >= 60
                    ? 'bg-scot-heather/70'
                    : h.precipitationProbability >= 30
                      ? 'bg-scot-loch/60'
                      : 'bg-emerald-500/40',
                )}
                style={{ height: `${Math.max(6, h.precipitationProbability)}%` }}
                title={`${fmtTime(h.time, tz)} · ${h.precipitationProbability}%`}
                aria-hidden
              />
            </div>
            <span className="text-[0.55rem] text-muted-foreground tabular-nums">
              {i === 0 ? 'now' : fmtTime(h.time, tz).slice(0, 2)}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

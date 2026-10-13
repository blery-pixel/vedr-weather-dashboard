'use client'

import * as React from 'react'
import { Wind, Gauge } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { windDirLabel } from '@/lib/weather-utils'
import { usePreferences, fmtSpeed, speedUnitLabel } from '@/lib/use-preferences'
import { cn } from '@/lib/utils'

/**
 * WindDialCard — a polar/radar dial showing wind direction with a rotating
 * arrow + gust vs sustained speed rings. Read as a compass: the arrow points
 * the direction the wind is blowing *from*.
 */
export function WindDialCard({ data }: { data: WeatherApiResponse }) {
  const speedUnit = usePreferences((s) => s.speedUnit)
  const c = data.current
  const deg = c.windDirection
  const sustained = fmtSpeed(c.windSpeed, speedUnit)
  const gust = fmtSpeed(c.windGust, speedUnit)
  const maxScale = Math.max(60, Math.ceil((Number(gust) + 5) / 10) * 10)
  const sustainedPct = (Number(sustained) / maxScale) * 100
  const gustPct = (Number(gust) / maxScale) * 100

  // Compass: arrow points "from" the wind direction. Rotate so N is up.
  // SVG rotate is clockwise from 3-o'clock (east), so we rotate by deg - 90
  // to align a horizontal arrow to the cardinal direction.
  const arrowRotation = deg

  return (
    <GlassCard className="fade-up p-5" aria-label="Wind direction and gust dial">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-amber/15 text-scot-amber">
            <Wind className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Wind & Gust</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Compass dial</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-foreground tabular-nums">{sustained} <span className="text-xs font-normal text-muted-foreground">{speedUnitLabel(speedUnit)}</span></div>
          <div className="text-[0.65rem] text-muted-foreground">{windDirLabel(deg)} · {Math.round(deg)}°</div>
        </div>
      </div>

      {/* Polar dial */}
      <div className="relative mx-auto mb-4 h-44 w-44">
        <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden>
          {/* Outer ring */}
          <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
          <circle cx="80" cy="80" r="58" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} strokeDasharray="2 3" />
          <circle cx="80" cy="80" r="42" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} strokeDasharray="2 3" />
          <circle cx="80" cy="80" r="26" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} strokeDasharray="2 3" />

          {/* Sustained-speed ring (amber) */}
          <circle
            cx="80" cy="80" r="74"
            fill="none"
            stroke="#E68A2E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity={0.65}
            strokeDasharray={`${(sustainedPct / 100) * 2 * Math.PI * 74} 9999`}
            transform="rotate(-90 80 80)"
          />
          {/* Gust-speed ring (heather, dashed outer) */}
          <circle
            cx="80" cy="80" r="68"
            fill="none"
            stroke="#6B4E5B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity={0.7}
            strokeDasharray={`${(gustPct / 100) * 2 * Math.PI * 68} 9999`}
            strokeDashoffset="0"
            transform="rotate(-90 80 80)"
            style={{ strokeDasharray: `${(gustPct / 100) * 2 * Math.PI * 68} 9999` }}
          />

          {/* Cardinal letters */}
          <text x="80" y="16" textAnchor="middle" fontSize="11" fontFamily="Norse, serif" fontWeight="700" fill="currentColor" fillOpacity={0.6}>N</text>
          <text x="80" y="152" textAnchor="middle" fontSize="11" fontFamily="Norse, serif" fontWeight="700" fill="currentColor" fillOpacity={0.6}>S</text>
          <text x="150" y="83" textAnchor="middle" fontSize="11" fontFamily="Norse, serif" fontWeight="700" fill="currentColor" fillOpacity={0.6}>E</text>
          <text x="10" y="83" textAnchor="middle" fontSize="11" fontFamily="Norse, serif" fontWeight="700" fill="currentColor" fillOpacity={0.6}>W</text>

          {/* Tick marks every 30° */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180)
            const x1 = 80 + 70 * Math.cos(a)
            const y1 = 80 + 70 * Math.sin(a)
            const x2 = 80 + 66 * Math.cos(a)
            const y2 = 80 + 66 * Math.sin(a)
            return (
              <line key={i} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke="currentColor" strokeOpacity={0.18} strokeWidth={1} />
            )
          })}

          {/* Direction arrow — points "from" the wind direction */}
          <g transform={`rotate(${arrowRotation} 80 80)`} style={{ transition: 'transform 0.6s ease' }}>
            <path d="M 80 24 L 86 44 L 80 40 L 74 44 Z" fill="#E68A2E" />
            <line x1="80" y1="40" x2="80" y2="64" stroke="#E68A2E" strokeWidth="2" strokeLinecap="round" />
            <circle cx="80" cy="80" r="3.5" fill="#E68A2E" />
            <circle cx="80" cy="80" r="6" fill="none" stroke="#E68A2E" strokeOpacity={0.4} strokeWidth={1} />
          </g>
        </svg>
        {/* Center readout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-6">
          <span className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">From</span>
          <span className="text-sm font-bold text-foreground">{windDirLabel(deg)}</span>
        </div>
      </div>

      {/* Sustained vs gust legend */}
      <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-scot-amber" aria-hidden />
          <div>
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Sustained</div>
            <div className="text-xs font-semibold text-foreground tabular-nums">{sustained} {speedUnitLabel(speedUnit)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-scot-heather" aria-hidden />
          <div>
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Gusts</div>
            <div className="text-xs font-semibold text-foreground tabular-nums">{gust} {speedUnitLabel(speedUnit)}</div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

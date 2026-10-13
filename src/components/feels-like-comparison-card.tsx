'use client'

import * as React from 'react'
import { Thermometer, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { usePreferences, fmtTemp } from '@/lib/use-preferences'
import { cn } from '@/lib/utils'

/**
 * FeelsLikeComparisonCard — a compact dual-line mini chart comparing the
 * actual temperature against the feels-like temperature over 24 hours, with
 * a verdict on whether wind/humidity is making it feel cooler or warmer.
 */
export function FeelsLikeComparisonCard({ data }: { data: WeatherApiResponse }) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const toDisplay = (c: number) => (tempUnit === 'f' ? (c * 9) / 5 + 32 : c)

  const actual = data.trend.temperature.map(toDisplay)
  const feels = data.trend.feelsLike.map(toDisplay)
  const c = data.current
  const delta = Math.round((toDisplay(c.feelsLike) - toDisplay(c.temperature)) * 10) / 10

  // Peak difference across the day
  const diffs = actual.map((a, i) => feels[i] - a)
  const maxDiff = Math.max(...diffs.map(Math.abs))
  const feelsCooler = delta < -0.5
  const feelsWarmer = delta > 0.5

  const verdict = feelsCooler
    ? 'Wind & humidity make it feel cooler'
    : feelsWarmer
      ? 'Humidity traps warmth — feels milder'
      : 'Feels close to actual'
  const verdictTone = feelsCooler ? 'text-scot-loch' : feelsWarmer ? 'text-scot-amber' : 'text-emerald-500'

  // Build the SVG paths
  const w = 280
  const h = 80
  const pad = 4
  const all = [...actual, ...feels]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = max - min || 1
  const stepX = (w - pad * 2) / Math.max(1, actual.length - 1)
  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = pad + i * stepX
        const y = pad + (h - pad * 2) * (1 - (v - min) / range)
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  const actualPath = toPath(actual)
  const feelsPath = toPath(feels)

  return (
    <GlassCard className="fade-up p-5" aria-label="Feels-like vs actual comparison">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-loch/15 text-scot-loch">
            <Thermometer className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Feels-like vs Actual</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Perceived comfort</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {feelsCooler ? (
            <TrendingDown className="h-4 w-4 text-scot-loch" aria-hidden />
          ) : feelsWarmer ? (
            <TrendingUp className="h-4 w-4 text-scot-amber" aria-hidden />
          ) : (
            <Minus className="h-4 w-4 text-emerald-500" aria-hidden />
          )}
          <span className={cn('text-sm font-semibold tabular-nums', verdictTone)}>
            {delta > 0 ? '+' : ''}{delta}°
          </span>
        </div>
      </div>

      {/* Dual-line mini chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="flc-actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E68A2E" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#E68A2E" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* actual area */}
          <path d={`${actualPath} L ${(w - pad).toFixed(2)} ${h - pad} L ${pad} ${h - pad} Z`} fill="url(#flc-actual)" />
          {/* actual line */}
          <path d={actualPath} fill="none" stroke="#E68A2E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* feels-like dashed line */}
          <path
            d={feelsPath}
            fill="none"
            stroke="#788A87"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 3"
          />
        </svg>
        <div className="mt-2 flex items-center justify-center gap-4 text-[0.7rem]">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-scot-amber" aria-hidden /> Actual
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-0.5 w-4 rounded-full bg-scot-loch" aria-hidden /> Feels like
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/40 pt-3 text-center">
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Now</div>
          <div className="text-sm font-semibold text-foreground tabular-nums">
            {fmtTemp(c.temperature, tempUnit)} / {fmtTemp(c.feelsLike, tempUnit)}
          </div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Peak gap</div>
          <div className="text-sm font-semibold text-foreground tabular-nums">{maxDiff.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Verdict</div>
          <div className={cn('text-xs font-semibold', verdictTone)}>{verdict}</div>
        </div>
      </div>
    </GlassCard>
  )
}

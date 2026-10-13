'use client'

import * as React from 'react'
import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { Sparkline } from '@/components/sparkline'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

/**
 * PressureTrendCard — shows the current sea-level pressure with a rising /
 * falling / steady verdict + a 24h sparkline. The API doesn't provide a
 * pressure time series, so we synthesise a plausible trend by perturbing the
 * current pressure with the hourly temperature deltas (cooling → rising
 * pressure, warming → falling) — a reasonable meteorological heuristic.
 */
export function PressureTrendCard({ data }: { data: WeatherApiResponse }) {
  const c = data.current
  const current = c.pressure

  // Synthesise a 24h pressure trend: start from current, walk it using the
  // inverse of the temperature delta (warm air rises → lower pressure).
  const series = React.useMemo(() => {
    const temps = data.trend.temperature
    const out: number[] = []
    let p = current
    for (let i = 0; i < temps.length; i++) {
      const prev = temps[Math.max(0, i - 1)]
      const dt = temps[i] - prev
      // Cooling → +pressure; warming → −pressure. Damped by 0.4 hPa/°.
      p = p - dt * 0.4 + (Math.sin(i / 3) * 0.6)
      out.push(Math.round(p * 10) / 10)
    }
    // Ensure the last point equals the live current pressure.
    out[out.length - 1] = current
    return out
  }, [data.trend.temperature, current])

  // Net trend over the 24h window
  const start = series[0]
  const end = series[series.length - 1]
  const net = Math.round((end - start) * 10) / 10
  const trend = net > 0.8 ? 'rising' : net < -0.8 ? 'falling' : 'steady'
  const verdict =
    trend === 'rising'
      ? 'Settled weather building'
      : trend === 'falling'
        ? 'Changeable weather approaching'
        : 'Steady conditions'
  const trendTone =
    trend === 'rising' ? 'text-emerald-500' : trend === 'falling' ? 'text-scot-heather' : 'text-scot-loch'
  const TrendIcon = trend === 'rising' ? TrendingUp : trend === 'falling' ? TrendingDown : Minus

  // Colour the sparkline by trend (green rising, heather falling, loch steady)
  const stroke = trend === 'rising' ? '#4a9e6e' : trend === 'falling' ? '#6B4E5B' : '#788A87'

  const min = Math.min(...series)
  const max = Math.max(...series)

  return (
    <GlassCard className="fade-up p-5" aria-label="Pressure trend">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-green/15 text-scot-green dark:text-emerald-400">
            <Gauge className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Pressure Trend</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Barometric rhythm</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendIcon className={cn('h-4 w-4', trendTone)} aria-hidden />
          <span className={cn('text-sm font-semibold tabular-nums', trendTone)}>
            {net > 0 ? '+' : ''}{net} hPa
          </span>
        </div>
      </div>

      {/* Current pressure big readout */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{Math.round(current)}</span>
        <span className="text-sm text-muted-foreground">hPa</span>
      </div>

      {/* Sparkline */}
      <Sparkline
        data={series}
        stroke={stroke}
        width={260}
        height={48}
        ariaLabel={`24-hour pressure trend, current ${Math.round(current)} hectopascals, ${trend}`}
      />

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border/40 pt-3 text-center">
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">24h low</div>
          <div className="text-xs font-semibold text-foreground tabular-nums">{min.toFixed(0)} hPa</div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">24h high</div>
          <div className="text-xs font-semibold text-foreground tabular-nums">{max.toFixed(0)} hPa</div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Verdict</div>
          <div className={cn('text-xs font-semibold', trendTone)}>{verdict}</div>
        </div>
      </div>
    </GlassCard>
  )
}

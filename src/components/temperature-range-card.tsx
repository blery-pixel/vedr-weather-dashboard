'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { fmtWeekday } from '@/lib/weather-utils'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { usePreferences, tempUnitLabel } from '@/lib/use-preferences'

/**
 * TemperatureRangeCard — a 7-day min/max envelope band chart. The amber
 * area fills between the daily low and high, with a dashed midline. Gives
 * a clear at-a-glance view of the week's temperature rhythm.
 */
export function TemperatureRangeCard({ data }: { data: WeatherApiResponse }) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const toDisplay = React.useCallback(
    (c: number) => (tempUnit === 'f' ? (c * 9) / 5 + 32 : c),
    [tempUnit],
  )

  const series = React.useMemo(
    () =>
      data.daily.slice(0, 7).map((d, i) => ({
        day: i === 0 ? 'Today' : fmtWeekday(d.date).slice(0, 3),
        min: Math.round(toDisplay(d.tempMin) * 10) / 10,
        max: Math.round(toDisplay(d.tempMax) * 10) / 10,
        mid: Math.round(((toDisplay(d.tempMin) + toDisplay(d.tempMax)) / 2) * 10) / 10,
      })),
    [data, toDisplay],
  )

  const weekMin = Math.min(...series.map((s) => s.min))
  const weekMax = Math.max(...series.map((s) => s.max))
  const range = weekMax - weekMin

  return (
    <GlassCard className="fade-up p-5" aria-label="Seven-day temperature range band">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-amber/15 text-scot-amber">
            <TrendingUp className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Weekly Range</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Temperature envelope</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground tabular-nums">
            {Math.round(weekMin)}° → {Math.round(weekMax)}°
          </div>
          <div className="text-[0.65rem] text-muted-foreground">range {Math.round(range)}° {tempUnitLabel(tempUnit)}</div>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rangeBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E68A2E" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#788A87" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#A0B0BA" strokeOpacity={0.2} vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#A0B0BA"
              strokeOpacity={0.6}
              tick={{ fill: '#C3D2DA', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#A0B0BA"
              strokeOpacity={0.6}
              tick={{ fill: '#C3D2DA', fontSize: 12 }}
              width={40}
              axisLine={false}
              tickLine={false}
              unit="°"
              domain={[Math.floor(weekMin - 1), Math.ceil(weekMax + 1)]}
              allowDecimals={false}
            />
            <Tooltip content={<RangeTooltip unit={tempUnitLabel(tempUnit)} />} cursor={{ stroke: '#E68A2E', strokeOpacity: 0.3, strokeDasharray: '3 3' }} />
            {/* The band: Area from min to max using a computed range via two areas */}
            <Area
              type="monotone"
              dataKey="max"
              stroke="#E68A2E"
              strokeWidth={2}
              fill="url(#rangeBand)"
              isAnimationActive
              animationDuration={700}
              name="High"
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="#788A87"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="var(--background)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={700}
              name="Low"
            />
            <Line
              type="monotone"
              dataKey="mid"
              stroke="#6B4E5B"
              strokeWidth={1}
              strokeOpacity={0.5}
              dot={false}
              isAnimationActive
              animationDuration={700}
              name="Mid"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 text-[0.7rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-scot-amber" aria-hidden /> High
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-scot-loch" aria-hidden /> Low
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-scot-heather/50" aria-hidden /> Mid
        </span>
      </div>
    </GlassCard>
  )
}

function RangeTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  // Recharts sends each Area/Line separately; merge by name
  const byName: Record<string, number> = {}
  for (const p of payload) {
    if (p.value != null) byName[p.name] = p.value
  }
  return (
    <div className="rounded-md border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <div className="mb-1 font-medium text-foreground">{label}</div>
      {byName.High != null && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-scot-amber" aria-hidden />
          <span className="text-muted-foreground">High</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{Math.round(byName.High)}{unit}</span>
        </div>
      )}
      {byName.Mid != null && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-scot-heather/50" aria-hidden />
          <span className="text-muted-foreground">Mid</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{Math.round(byName.Mid)}{unit}</span>
        </div>
      )}
      {byName.Low != null && (
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-2 rounded-full bg-scot-loch" aria-hidden />
          <span className="text-muted-foreground">Low</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{Math.round(byName.Low)}{unit}</span>
        </div>
      )}
    </div>
  )
}

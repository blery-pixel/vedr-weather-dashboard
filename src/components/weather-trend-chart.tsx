'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  LineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ComposedChart,
} from 'recharts'
import { CardLabel, GlassCard } from '@/components/glass-card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { fmtTime } from '@/lib/weather-utils'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { tempUnitLabel, usePreferences } from '@/lib/use-preferences'

export type TrendTab = 'temp' | 'humidity' | 'precip'

export function WeatherTrendChart({
  data,
  tab,
  onTabChange,
}: {
  data: WeatherApiResponse
  tab?: TrendTab
  onTabChange?: (t: TrendTab) => void
}) {
  const t = data.trend
  const tz = data.location.timezone
  const tempUnit = usePreferences((s) => s.tempUnit)
  const toDisplay = (c: number) => (tempUnit === 'f' ? (c * 9) / 5 + 32 : c)
  const series = t.labels.map((iso, i) => ({
    time: fmtTime(iso, tz),
    temp: Math.round(toDisplay(t.temperature[i]) * 10) / 10,
    feels: Math.round(toDisplay(t.feelsLike[i]) * 10) / 10,
    humidity: t.humidity[i],
    precip: t.precipitationProbability[i],
  }))
  const nowLabel = series[0]?.time
  const tempUnitSuffix = tempUnit === 'f' ? '°F' : '°C'

  return (
    <GlassCard className="fade-up p-5" tabIndex={0} aria-label="24-hour weather trend chart">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardLabel>24-Hour Trend</CardLabel>
          <h3 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Highland forecast rhythm
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-scot-amber" aria-hidden /> Temperature
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-scot-green" aria-hidden /> Feels like
          </span>
        </div>
      </div>

      <Tabs value={tab ?? 'temp'} onValueChange={(v) => onTabChange?.(v as TrendTab)}>
        <TabsList className="mb-4 h-9 bg-muted/40">
          <TabsTrigger value="temp" className="text-xs gap-1">
            Temperature
            <kbd className="hidden h-4 w-4 items-center justify-center rounded border border-border/50 bg-muted/60 text-[0.55rem] font-semibold text-muted-foreground sm:inline-flex" aria-hidden>1</kbd>
          </TabsTrigger>
          <TabsTrigger value="humidity" className="text-xs gap-1">
            Humidity
            <kbd className="hidden h-4 w-4 items-center justify-center rounded border border-border/50 bg-muted/60 text-[0.55rem] font-semibold text-muted-foreground sm:inline-flex" aria-hidden>2</kbd>
          </TabsTrigger>
          <TabsTrigger value="precip" className="text-xs gap-1">
            Precipitation
            <kbd className="hidden h-4 w-4 items-center justify-center rounded border border-border/50 bg-muted/60 text-[0.55rem] font-semibold text-muted-foreground sm:inline-flex" aria-hidden>3</kbd>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="temp" className="mt-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E68A2E" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#E68A2E" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="feelsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1C3125" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1C3125" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#A0B0BA" strokeOpacity={0.2} vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#A0B0BA"
                  strokeOpacity={0.6}
                  tick={{ fill: '#C3D2DA', fontSize: 12 }}
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#A0B0BA"
                  strokeOpacity={0.6}
                  tick={{ fill: '#C3D2DA', fontSize: 12 }}
                  width={42}
                  axisLine={false}
                  tickLine={false}
                  unit={tempUnit === 'f' ? '°' : '°'}
                />
                <Tooltip content={<TrendTooltip unit={tempUnitSuffix} />} cursor={{ stroke: '#E68A2E', strokeOpacity: 0.4, strokeDasharray: '3 3' }} />
                {nowLabel && (
                  <ReferenceLine x={nowLabel} stroke="#E68A2E" strokeOpacity={0.55} strokeWidth={1.5} label={{ value: 'Now', fill: '#E68A2E', fontSize: 10, position: 'insideTopLeft' }} />
                )}
                <Area
                  type="monotone"
                  dataKey="feels"
                  stroke="#1C3125"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill="url(#feelsGrad)"
                  isAnimationActive
                  animationDuration={700}
                  name="Feels like"
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#E68A2E"
                  strokeWidth={2.5}
                  fill="url(#tempGrad)"
                  isAnimationActive
                  animationDuration={700}
                  name="Temperature"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="humidity" className="mt-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#A0B0BA" strokeOpacity={0.2} vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#A0B0BA"
                  strokeOpacity={0.6}
                  tick={{ fill: '#C3D2DA', fontSize: 12 }}
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#A0B0BA"
                  strokeOpacity={0.6}
                  tick={{ fill: '#C3D2DA', fontSize: 12 }}
                  width={44}
                  domain={[0, 100]}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendTooltip unit="%" />} cursor={{ stroke: '#788A87', strokeOpacity: 0.4, strokeDasharray: '3 3' }} />
                {nowLabel && (
                  <ReferenceLine x={nowLabel} stroke="#E68A2E" strokeOpacity={0.55} strokeWidth={1.5} label={{ value: 'Now', fill: '#E68A2E', fontSize: 10, position: 'insideTopLeft' }} />
                )}
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#788A87"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive
                  animationDuration={700}
                  name="Humidity"
                />
                <ReferenceLine y={80} stroke="#6B4E5B" strokeOpacity={0.5} strokeDasharray="4 3" label={{ value: 'Saturation', fill: '#6B4E5B', fontSize: 10, position: 'insideTopRight' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="precip" className="mt-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#A0B0BA" strokeOpacity={0.2} vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#A0B0BA"
                  strokeOpacity={0.6}
                  tick={{ fill: '#C3D2DA', fontSize: 12 }}
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#A0B0BA"
                  strokeOpacity={0.6}
                  tick={{ fill: '#C3D2DA', fontSize: 12 }}
                  width={44}
                  domain={[0, 100]}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendTooltip unit="%" />} cursor={{ fill: '#E68A2E', fillOpacity: 0.06 }} />
                {nowLabel && (
                  <ReferenceLine x={nowLabel} stroke="#E68A2E" strokeOpacity={0.55} strokeWidth={1.5} label={{ value: 'Now', fill: '#E68A2E', fontSize: 10, position: 'insideTopLeft' }} />
                )}
                <Bar
                  dataKey="precip"
                  fill="#6B4E5B"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive
                  animationDuration={700}
                  name="Precip. chance"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </GlassCard>
  )
}

function TrendTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <div className="mb-1 font-medium text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.stroke || p.fill }}
            aria-hidden
          />
          <span>{p.name}</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">
            {Array.isArray(p.value) ? p.value[0] : p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  )
}

'use client'

import * as React from 'react'
import {
  Cloud,
  CloudRain,
  Eye,
  Gauge,
  Sun,
  Droplets,
  Wind,
  Compass,
  type LucideIcon,
} from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { uvLabel } from '@/lib/weather-utils'
import { cn } from '@/lib/utils'
import type { CurrentWeather } from '@/lib/weather-types'
import {
  fmtDist,
  fmtSpeed,
  fmtTemp,
  distUnitLabel,
  speedUnitLabel,
  tempUnitLabel,
  usePreferences,
} from '@/lib/use-preferences'

interface MetricDef {
  key: string
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  hint?: string
  /** 0-100 fill for the progress bar / gauge */
  fill?: number
  /** Color tone for the indicator */
  tone?: 'green' | 'amber' | 'loch' | 'heather'
  extra?: React.ReactNode
}

export function WeatherMetricsGrid({ current }: { current: CurrentWeather }) {
  const uv = uvLabel(current.uvIndex)
  const tempUnit = usePreferences((s) => s.tempUnit)
  const speedUnit = usePreferences((s) => s.speedUnit)
  const distanceUnit = usePreferences((s) => s.distanceUnit)
  const metrics: MetricDef[] = [
    {
      key: 'humidity',
      icon: Droplets,
      label: 'Humidity',
      value: `${Math.round(current.humidity)}`,
      unit: '%',
      hint: current.humidity > 80 ? 'Saturated air' : current.humidity < 40 ? 'Dry' : 'Comfortable',
      fill: current.humidity,
      tone: 'loch',
    },
    {
      key: 'wind',
      icon: Wind,
      label: 'Wind',
      value: fmtSpeed(current.windSpeed, speedUnit),
      unit: speedUnitLabel(speedUnit),
      hint: `Gusts ${fmtSpeed(current.windGust, speedUnit)} ${speedUnitLabel(speedUnit)}`,
      tone: 'amber',
      extra: <WindCompass deg={current.windDirection} label={compass16(current.windDirection)} />,
    },
    {
      key: 'pressure',
      icon: Gauge,
      label: 'Pressure',
      value: `${Math.round(current.pressure)}`,
      unit: 'hPa',
      hint:
        current.pressure >= 1020 ? 'High — settled' : current.pressure <= 1005 ? 'Low — unsettled' : 'Fair',
      tone: 'green',
      extra: <PressureGauge hPa={current.pressure} />,
    },
    {
      key: 'uv',
      icon: Sun,
      label: 'UV Index',
      value: current.uvIndex.toFixed(1),
      unit: '/11',
      hint: uv.label,
      fill: Math.min(100, (current.uvIndex / 11) * 100),
      tone: 'amber',
    },
    {
      key: 'cloud',
      icon: Cloud,
      label: 'Cloud Cover',
      value: `${Math.round(current.cloudCover)}`,
      unit: '%',
      hint:
        current.cloudCover > 80 ? 'Overcast' : current.cloudCover > 40 ? 'Partly cloudy' : 'Mostly clear',
      fill: current.cloudCover,
      tone: 'loch',
    },
    {
      key: 'visibility',
      icon: Eye,
      label: 'Visibility',
      value: fmtDist(current.visibility, distanceUnit),
      unit: distUnitLabel(distanceUnit),
      hint: current.visibility >= 15 ? 'Excellent' : current.visibility >= 8 ? 'Good' : 'Hazy',
      fill: Math.min(100, (current.visibility / 20) * 100),
      tone: 'green',
    },
    {
      key: 'dewpoint',
      icon: CloudRain,
      label: 'Dew Point',
      value: fmtTemp(current.dewPoint, tempUnit, 0).replace('°', ''),
      unit: tempUnitLabel(tempUnit),
      hint: current.dewPoint >= 16 ? 'Muggy' : current.dewPoint <= 10 ? 'Crisp' : 'Cool',
      fill: Math.max(0, Math.min(100, ((current.dewPoint + 10) / 30) * 100)),
      tone: 'heather',
    },
    {
      key: 'precip',
      icon: CloudRain,
      label: 'Precipitation',
      value: current.precipitation.toFixed(1),
      unit: 'mm',
      hint: current.precipitation > 0 ? 'Active rainfall' : 'None in last hour',
      fill: Math.min(100, current.precipitation * 16),
      tone: 'loch',
    },
  ]

  return (
    <section aria-label="Weather metrics grid" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Atmospheric Metrics
        </h2>
        <span className="text-xs text-muted-foreground">Current observation</span>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} delay={i * 40} />
        ))}
      </div>
    </section>
  )
}

function compass16(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

const toneMap = {
  green: 'from-scot-green to-scot-green/50 text-scot-amber',
  amber: 'from-scot-amber to-scot-amber/50 text-scot-amber',
  loch: 'from-scot-loch to-scot-loch/50 text-scot-loch',
  heather: 'from-scot-heather to-scot-heather/50 text-scot-heather',
} as const

function MetricCard({ metric, delay }: { metric: MetricDef; delay: number }) {
  const Icon = metric.icon
  return (
    <GlassCard
      className="fade-up flex flex-col p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <CardLabel>{metric.label}</CardLabel>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-norse text-3xl tracking-tight text-foreground tabular-nums">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-sm font-medium text-muted-foreground">{metric.unit}</span>
        )}
      </div>

      {metric.fill != null && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/80 ring-1 ring-inset ring-white/5">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r',
              toneMap[metric.tone ?? 'loch'],
            )}
            style={{ width: `${Math.max(4, Math.min(100, metric.fill))}%` }}
            aria-hidden
          />
        </div>
      )}

      {metric.extra && <div className="mt-3">{metric.extra}</div>}

      <div className="mt-2 text-xs text-muted-foreground">
        {metric.hint}
      </div>
    </GlassCard>
  )
}

function WindCompass({ deg, label }: { deg: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-12 w-12 rounded-full border border-border/60 bg-card/50">
        {/* cardinal marks */}
        <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[0.5rem] font-semibold text-muted-foreground">N</span>
        <span className="absolute left-1/2 bottom-1 -translate-x-1/2 text-[0.5rem] font-semibold text-muted-foreground">S</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[0.5rem] font-semibold text-muted-foreground">W</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[0.5rem] font-semibold text-muted-foreground">E</span>
        {/* pointer */}
        <span
          className="absolute left-1/2 top-1/2 h-4 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full bg-scot-amber"
          style={{ transform: `translate(-50%, -100%) rotate(${deg + 180}deg)` }}
          aria-hidden
        />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-scot-amber" aria-hidden />
      </div>
      <div className="flex flex-col text-xs">
        <span className="font-semibold text-foreground">{compass16(deg)}</span>
        <span className="text-muted-foreground">{Math.round(deg)}°</span>
      </div>
    </div>
  )
}

function PressureGauge({ hPa }: { hPa: number }) {
  // 970 - 1050 range
  const min = 970
  const max = 1050
  const pct = Math.max(0, Math.min(100, ((hPa - min) / (max - min)) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-scot-heather/40 via-muted/40 to-scot-amber/40">
        <div
          className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-foreground shadow"
          style={{ left: `calc(${pct}% - 2px)` }}
          aria-hidden
        />
      </div>
      <span className="text-[0.65rem] text-muted-foreground">{min}–{max}</span>
    </div>
  )
}

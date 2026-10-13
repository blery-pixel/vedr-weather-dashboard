'use client'

import * as React from 'react'
import { Droplets, Gauge, Wind, ArrowUp, ArrowDown, MapPin, Thermometer } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { WeatherIcon } from '@/components/weather-icon'
import { Sparkline } from '@/components/sparkline'
import type { WeatherApiResponse, WeatherCondition } from '@/lib/weather-types'
import { compassDeg, fmtTime, windDirLabel } from '@/lib/weather-utils'
import { cn } from '@/lib/utils'
import {
  fmtTemp,
  fmtSpeed,
  speedUnitLabel,
  tempUnitLabel,
  usePreferences,
} from '@/lib/use-preferences'

export function CurrentWeatherHero({
  data,
  high,
  low,
}: {
  data: WeatherApiResponse
  high?: number
  low?: number
}) {
  const c = data.current
  const loc = data.location
  const tempUnit = usePreferences((s) => s.tempUnit)
  const speedUnit = usePreferences((s) => s.speedUnit)
  const displayTemp = tempUnit === 'f' ? Math.round((c.temperature * 9) / 5 + 32) : Math.round(c.temperature)
  const isNeg = displayTemp < 0
  const absWhole = Math.abs(displayTemp)

  // Condition-driven accent — drives the radial glow behind the weather icon.
  const accent = conditionAccent(c.condition)

  // 24h sparkline data (converted to the user's temp unit)
  const toDisplay = (cv: number) => (tempUnit === 'f' ? (cv * 9) / 5 + 32 : cv)
  const sparkData = data.trend.temperature.map(toDisplay)

  // Feels-like delta vs actual
  const delta = Math.round((c.feelsLike - c.temperature) * 10) / 10
  const deltaAbs = Math.abs(delta)

  return (
    <GlassCard
      glow
      className="fade-up relative overflow-hidden"
      role="region"
      aria-label="Current weather summary"
    >
      {/* Condition-tinted ambient wash across the whole card */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: `linear-gradient(135deg, ${accent}14 0%, transparent 45%, ${accent}08 100%)` }}
        aria-hidden
      />
      {/* Tartan edge stripe */}
      <div className="relative h-1.5 w-full bg-gradient-to-r from-scot-green via-scot-amber to-scot-heather" aria-hidden />

      <div className="relative grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        {/* Left — location + temperature */}
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4 text-scot-amber" aria-hidden />
              <span className="truncate">
                {loc.name}
                <span className="mx-1 text-muted-foreground">·</span>
                <span className="text-muted-foreground">{loc.region}, {loc.country}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {fmtTime(c.time)} · {c.isDay ? 'Daylight' : 'Night'} · {data.dataSource === 'mock' ? 'Atmospheric simulation' : 'Live observation'}
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="relative float-soft flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/5 to-transparent ring-1 ring-inset ring-white/10 sm:h-28 sm:w-28">
              <div
                className="pointer-events-none absolute inset-[-30%] rounded-full blur-md"
                style={{ background: `radial-gradient(circle at center, ${accent}55 0%, ${accent}00 65%)` }}
                aria-hidden
              />
              <WeatherIcon condition={c.condition} isDay={c.isDay} animated className="relative h-16 w-16 sm:h-20 sm:20" />
            </div>
            <div className="flex items-start">
              {isNeg && <span className="font-norse mt-3 text-3xl text-foreground sm:text-4xl">−</span>}
              <span className="font-norse text-7xl leading-none tracking-tighter text-foreground tabular-nums sm:text-8xl">
                {absWhole}
              </span>
              <span className="font-norse mt-2 text-2xl text-muted-foreground sm:text-3xl">°</span>
              <span className="font-norse ml-1 mt-1 text-2xl text-scot-amber sm:text-3xl">{tempUnit === 'f' ? 'F' : 'C'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-norse text-lg text-foreground">{c.conditionLabel}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Thermometer className="h-4 w-4 text-scot-loch" aria-hidden />
              Feels {fmtTemp(c.feelsLike, tempUnit)}
              {deltaAbs >= 1 && (
                <span
                  className={cn(
                    'ml-1 inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[0.65rem] font-semibold',
                    delta < 0
                      ? 'border-scot-loch/40 bg-scot-loch/10 text-scot-loch'
                      : 'border-scot-amber/40 bg-scot-amber/10 text-scot-amber',
                  )}
                  title={`Feels ${delta < 0 ? 'cooler' : 'warmer'} than actual by ${deltaAbs}°`}
                >
                  {delta < 0 ? '−' : '+'}{deltaAbs}°
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowUp className="h-4 w-4 text-scot-amber" aria-hidden />
              {fmtTemp(high ?? c.temperature, tempUnit)}
              <ArrowDown className="ml-1 h-4 w-4 text-scot-loch" aria-hidden />
              {fmtTemp(low ?? c.temperature, tempUnit)}
            </span>
          </div>

          {/* 24h temperature sparkline */}
          <div className="flex items-center gap-3 border-t border-border/30 pt-3">
            <Sparkline
              data={sparkData}
              stroke={accent}
              width={240}
              height={40}
              ariaLabel={`24-hour temperature trend, current ${displayTemp} degrees`}
            />
            <div className="flex flex-col text-[0.65rem] text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">24h trend</span>
              <span className="tabular-nums">
                {fmtTemp(Math.min(...sparkData), tempUnit)} → {fmtTemp(Math.max(...sparkData), tempUnit)}
              </span>
            </div>
          </div>
        </div>

        {/* Right — key metric mini-cards */}
        <div className="grid grid-cols-2 gap-3 self-stretch sm:grid-cols-2 lg:grid-cols-2">
          <MiniMetric
            icon={<Droplets className="h-4 w-4" />}
            label="Humidity"
            value={`${Math.round(c.humidity)}%`}
            hint={`Dew ${fmtTemp(c.dewPoint, tempUnit)}`}
          />
          <MiniMetric
            icon={<Wind className="h-4 w-4" />}
            label="Wind"
            value={fmtSpeed(c.windSpeed, speedUnit)}
            unit={speedUnitLabel(speedUnit)}
            hint={compassDeg(c.windDirection)}
            directionDeg={c.windDirection}
          />
          <MiniMetric
            icon={<Gauge className="h-4 w-4" />}
            label="Pressure"
            value={`${Math.round(c.pressure)}`}
            unit="hPa"
            hint={c.pressure >= 1020 ? 'High' : c.pressure <= 1005 ? 'Low' : 'Steady'}
          />
          <MiniMetric
            icon={<Droplets className="h-4 w-4" />}
            label="Precip."
            value={`${c.precipitation.toFixed(1)}`}
            unit="mm"
            hint="last hour"
          />
        </div>
      </div>
    </GlassCard>
  )
}

function MiniMetric({
  icon,
  label,
  value,
  unit,
  hint,
  directionDeg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  hint?: string
  directionDeg?: number
}) {
  return (
    <div className="relative flex flex-col justify-between rounded-lg border border-border/40 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-scot-amber/30 hover:bg-card/60">
      <div className="flex items-center justify-between gap-2">
        <CardLabel>{label}</CardLabel>
        <span className="text-scot-loch">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-norse text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {directionDeg != null && (
          <span
            className="inline-flex h-4 w-4 items-center justify-center text-scot-amber"
            style={{ transform: `rotate(${directionDeg}deg)` }}
            aria-hidden
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="truncate">{hint}</span>
      </div>
    </div>
  )
}

/** Hex accent colour per condition — used for the radial glow behind the hero icon.
 * Nordic palette: gold/bronze for sun, fjord-blue for rain/snow, moss for fair. */
function conditionAccent(c: WeatherCondition): string {
  switch (c) {
    case 'clear':
      return '#B87943'      /* Ember Bronze — gold for sunshine */
    case 'partly-cloudy':
      return '#D5C5A1'      /* Ancient Parchment */
    case 'rain':
    case 'heavy-rain':
    case 'drizzle':
      return '#7899AB'      /* Fjord Blue — blue for rain */
    case 'snow':
    case 'sleet':
      return '#9AB8C9'      /* pale fjord blue for snow */
    case 'thunderstorm':
      return '#B85450'      /* red for severe weather */
    case 'mist':
    case 'fog':
      return '#AABBC2'      /* Mist Grey */
    case 'windy':
      return '#7899AB'      /* Fjord Blue */
    default:
      return '#78917D'      /* Moss Green — nature / clear */
  }
}

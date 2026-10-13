'use client'

import * as React from 'react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { aqiLabel } from '@/lib/weather-utils'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

const toneClasses: Record<string, string> = {
  good: 'from-emerald-500/70 to-emerald-500/20 text-emerald-500',
  fair: 'from-scot-amber/70 to-scot-amber/20 text-scot-amber',
  moderate: 'from-amber-500/70 to-amber-500/20 text-amber-500',
  poor: 'from-orange-600/70 to-orange-600/20 text-orange-600',
  'very-poor': 'from-red-600/70 to-red-600/20 text-red-600',
}

export function AirQualityCard({ data }: { data: WeatherApiResponse }) {
  const aq = data.airQuality
  const info = aqiLabel(aq.europeanAqi)
  const pct = Math.min(100, (aq.europeanAqi / 100) * 100)
  const tone = info.tone

  return (
    <GlassCard className="fade-up p-5" aria-label="Air quality">
      <div className="mb-3">
        <CardLabel>Air Quality</CardLabel>
        <h3 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Highland breeze</h3>
      </div>

      <div className="flex items-end gap-3">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br',
            toneClasses[tone] ?? toneClasses.fair,
          )}
        >
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {Math.round(aq.europeanAqi)}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-foreground">{info.label}</div>
          <div className="text-xs text-muted-foreground">European AQI (0–100)</div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r', toneClasses[tone] ?? toneClasses.fair)}
          style={{ width: `${Math.max(4, pct)}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-3 text-sm">
        <div>
          <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">PM2.5</div>
          <div className="font-semibold text-foreground tabular-nums">{aq.pm2_5.toFixed(1)} µg/m³</div>
        </div>
        <div>
          <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">PM10</div>
          <div className="font-semibold text-foreground tabular-nums">{aq.pm10.toFixed(1)} µg/m³</div>
        </div>
      </div>
    </GlassCard>
  )
}

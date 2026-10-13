'use client'

import * as React from 'react'
import {
  AlertTriangle,
  Wind,
  CloudRain,
  Snowflake,
  CloudFog,
  Sun,
  ThermometerSnowflake,
  ThermometerSun,
  Gauge,
  type LucideIcon,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WeatherAlert, AlertKind } from '@/lib/weather-alerts'
import { deriveAlerts } from '@/lib/weather-alerts'
import type { CurrentWeather } from '@/lib/weather-types'

const kindIcon: Record<AlertKind, LucideIcon> = {
  storm: AlertTriangle,
  'high-wind': Wind,
  'heavy-rain': CloudRain,
  snow: Snowflake,
  fog: CloudFog,
  'uv-extreme': Sun,
  cold: ThermometerSnowflake,
  heat: ThermometerSun,
  'low-pressure': Gauge,
}

const levelStyles: Record<
  WeatherAlert['level'],
  { container: string; icon: string; chip: string }
> = {
  severe: {
    container: 'border-red-500/40 bg-red-500/10',
    icon: 'text-red-500',
    chip: 'bg-red-500/20 text-red-500',
  },
  warning: {
    container: 'border-scot-amber/40 bg-scot-amber/10',
    icon: 'text-scot-amber',
    chip: 'bg-scot-amber/20 text-scot-amber',
  },
  info: {
    container: 'border-scot-loch/40 bg-scot-loch/10',
    icon: 'text-scot-loch',
    chip: 'bg-scot-loch/20 text-scot-loch',
  },
}

/**
 * WeatherAlertBanner — shows active weather alerts (storm / high-wind / heavy
 * rain / snow / fog / extreme UV / cold / heat / low pressure) above the hero.
 * Dismissible per-alert (state lives in localStorage so dismissals persist).
 */
export function WeatherAlertBanner({ current }: { current: CurrentWeather }) {
  const alerts = React.useMemo(() => deriveAlerts(current), [current])
  const [dismissed, setDismissed] = React.useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = window.localStorage.getItem('ceilidh-weather-dismissed-alerts')
      if (!raw) return new Set()
      const parsed = JSON.parse(raw)
      // Auto-expire dismissals older than 6 hours
      const now = Date.now()
      const valid = (parsed as [string, number][]).filter(
        ([, ts]) => now - ts < 6 * 3600_000,
      )
      return new Set(valid.map(([k]) => k))
    } catch {
      return new Set()
    }
  })

  const visible = alerts.filter((a) => !dismissed.has(a.kind))

  const dismiss = (kind: string) => {
    const next = new Set(dismissed)
    next.add(kind)
    setDismissed(next)
    if (typeof window !== 'undefined') {
      const raw = JSON.stringify([...next].map((k) => [k, Date.now()]))
      window.localStorage.setItem('ceilidh-weather-dismissed-alerts', raw)
    }
  }

  if (visible.length === 0) return null

  return (
    <div className="space-y-2" role="region" aria-label="Active weather alerts">
      {visible.map((a) => {
        const Icon = kindIcon[a.kind]
        const s = levelStyles[a.level]
        return (
          <div
            key={a.kind}
            role="alert"
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 backdrop-blur-md',
              s.container,
            )}
          >
            <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', s.icon)}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{a.title}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider', s.chip)}>
                  {a.level}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
            </div>
            <button
              onClick={() => dismiss(a.kind)}
              aria-label={`Dismiss ${a.title} alert`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}

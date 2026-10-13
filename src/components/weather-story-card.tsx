'use client'

import * as React from 'react'
import {
  Sun, Moon, Cloud, CloudRain, Wind, Snowflake, CloudLightning, CloudFog,
  ThermometerSun, ThermometerSnowflake, type LucideIcon,
} from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { buildStory, type StoryBeat } from '@/lib/weather-story'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

const iconMap: Record<StoryBeat['icon'], LucideIcon> = {
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  rain: CloudRain,
  wind: Wind,
  snow: Snowflake,
  storm: CloudLightning,
  fog: CloudFog,
  'temp-up': ThermometerSun,
  'temp-down': ThermometerSnowflake,
}

const toneClasses: Record<StoryBeat['tone'], string> = {
  amber: 'border-scot-amber/50 bg-scot-amber/20 text-scot-amber',
  loch: 'border-scot-loch/50 bg-scot-loch/20 text-scot-loch',
  heather: 'border-scot-heather/50 bg-scot-heather/25 text-scot-heather',
  green: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-500',
}

export function WeatherStoryCard({ data }: { data: WeatherApiResponse }) {
  const beats = React.useMemo(() => buildStory(data), [data])

  return (
    <GlassCard className="fade-up p-5" aria-label="Weather story timeline">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-green/15 text-scot-green dark:text-emerald-400">
            <Sun className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Your Day</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Weather story</h3>
          </div>
        </div>
        <span className="text-[0.65rem] text-muted-foreground">{beats.length} beats</span>
      </div>

      {/* Vertical timeline */}
      <ol className="relative space-y-8 border-l border-border/40 pl-9" role="list">
        {beats.map((b, i) => {
          const Icon = iconMap[b.icon]
          return (
            <li key={i} className="relative">
              {/* Dot + icon on the timeline */}
              <span
                className={cn(
                  'absolute -left-[2.375rem] flex h-8 w-8 items-center justify-center rounded-full border',
                  toneClasses[b.tone],
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {b.whenLabel}
                </span>
                {i === 0 && (
                  <span className={cn('rounded-full border px-2 py-0.5 text-[0.55rem] font-semibold', toneClasses[b.tone])}>
                    Current
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm font-medium text-foreground">{b.headline}</p>
              {b.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">{b.detail}</p>
              )}
            </li>
          )
        })}
      </ol>
    </GlassCard>
  )
}

import * as React from 'react'
import { Cloud, CloudDrizzle, CloudFog, CloudRain, CloudRainWind, CloudSnow, Cloudy, Moon, Snowflake, Sun, CloudLightning, Wind, Sunrise, Sunset, CloudSun, CloudMoon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WeatherCondition } from '@/lib/weather-types'

const map: Record<WeatherCondition, { day: LucideIcon; night: LucideIcon; className: string }> = {
  clear: { day: Sun, night: Moon, className: 'text-scot-amber' },
  'partly-cloudy': { day: CloudSun, night: CloudMoon, className: 'text-scot-amber' },
  cloudy: { day: Cloudy, night: Cloudy, className: 'text-scot-loch' },
  overcast: { day: Cloud, night: Cloud, className: 'text-scot-loch' },
  mist: { day: CloudFog, night: CloudFog, className: 'text-scot-loch' },
  fog: { day: CloudFog, night: CloudFog, className: 'text-scot-loch' },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle, className: 'text-scot-loch' },
  rain: { day: CloudRain, night: CloudRain, className: 'text-scot-loch' },
  'heavy-rain': { day: CloudRainWind, night: CloudRainWind, className: 'text-scot-loch' },
  sleet: { day: CloudSnow, night: CloudSnow, className: 'text-scot-loch' },
  snow: { day: Snowflake, night: Snowflake, className: 'text-scot-loch' },
  thunderstorm: { day: CloudLightning, night: CloudLightning, className: 'text-scot-amber' },
  windy: { day: Wind, night: Wind, className: 'text-scot-loch' },
}

export function WeatherIcon({
  condition,
  isDay = true,
  className,
  animated = false,
}: {
  condition: WeatherCondition
  isDay?: boolean
  className?: string
  animated?: boolean
}) {
  const entry = map[condition] ?? map.cloudy
  const Icon = isDay ? entry.day : entry.night
  return (
    <Icon
      className={cn(entry.className, animated && condition === 'clear' && isDay && 'pulse-amber', className)}
      aria-hidden
    />
  )
}

export function SunTimeIcon({ kind, className }: { kind: 'sunrise' | 'sunset'; className?: string }) {
  const Icon = kind === 'sunrise' ? Sunrise : Sunset
  return <Icon className={cn('text-scot-amber', className)} aria-hidden />
}

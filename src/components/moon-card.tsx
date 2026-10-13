'use client'

import * as React from 'react'
import { Moon, ArrowUp } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { fmtElevation, moonIllumination, moonRiseSet } from '@/lib/astronomy'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { LOCATION_COORDS } from '@/hooks/use-geolocation'
import { fmtTime } from '@/lib/weather-utils'
import { cn } from '@/lib/utils'

/**
 * MoonCard — shows the current moon phase + illumination %, an approximate
 * moonrise/moonset, and the moon's current altitude (a rough estimate derived
 * from the lunar transit time). Cultural moon-phase label from the API.
 */
export function MoonCard({ data }: { data: WeatherApiResponse }) {
  const loc = data.location
  const coords = LOCATION_COORDS[loc.name.toLowerCase()]
  const lat = coords?.lat ?? loc.latitude
  const lon = coords?.lon ?? loc.longitude
  const sun = data.sun

  // Recompute every 60s
  const [, force] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => {
    const id = setInterval(force, 60_000)
    return () => clearInterval(id)
  }, [])

  const now = new Date()
  const illum = moonIllumination(now)
  const { rise, set } = moonRiseSet(lat, lon, now)

  // Crude altitude estimate: the moon transits ~6h after moonrise; compute
  // the fraction of the semi-diurnal arc elapsed since rise.
  const riseMs = rise ? new Date(rise).getTime() : 0
  const elapsedHrs = rise ? (now.getTime() - riseMs) / 3600000 : 0
  // Sinusoidal altitude: 0 at rise, peak at 6h, 0 at 12h (set)
  const altFrac = Math.sin(Math.max(0, Math.min(12, elapsedHrs)) / 12 * Math.PI)
  // Peak altitude depends on lunar declination — approximate with latitude complement
  const peakAlt = Math.max(5, 75 - Math.abs(lat - 20))
  const altitude = altFrac * peakAlt

  const phaseLabel = sun.moonPhaseLabel
  const phaseIcon = moonEmoji(sun.moonPhase)

  return (
    <GlassCard className="fade-up p-5" aria-label="Moon phase and altitude">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-heather/15 text-scot-heather">
            <Moon className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Lunar Position</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{phaseLabel}</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-foreground">{Math.round(illum * 100)}%</div>
          <div className="text-[0.65rem] text-muted-foreground">illuminated</div>
        </div>
      </div>

      {/* Moon visual */}
      <div className="relative mx-auto mb-4 h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          {/* Dark moon disc */}
          <circle cx="50" cy="50" r="42" fill="#1a2721" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />
          {/* Illuminated portion — approximate with a clip */}
          <defs>
            <clipPath id="moonClip">
              <circle cx="50" cy="50" r="42" />
            </clipPath>
          </defs>
          <g clipPath="url(#moonClip)">
            {/* The illuminated fraction shifts left/right depending on phase */}
            {sun.moonPhase < 0.5 ? (
              <rect x={50 - (illum * 84)} y="0" width={illum * 84} height="100" fill="#e6eae8" />
            ) : (
              <rect x="50" y="0" width={illum * 84} height="100" fill="#e6eae8" />
            )}
          </g>
          {/* Craters (decorative) */}
          <circle cx="38" cy="40" r="4" fill="currentColor" fillOpacity={0.08} />
          <circle cx="60" cy="58" r="5" fill="currentColor" fillOpacity={0.08} />
          <circle cx="52" cy="32" r="2.5" fill="currentColor" fillOpacity={0.08} />
        </svg>
        <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl" aria-hidden>
          {phaseIcon}
        </span>
      </div>

      {/* Altitude + rise/set grid */}
      <div className="grid grid-cols-3 gap-3 border-t border-border/40 pt-3">
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Altitude</div>
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground tabular-nums">
            <ArrowUp
              className="h-3 w-3 text-scot-heather"
              style={{ transform: `rotate(${45}deg)` }}
              aria-hidden
            />
            {fmtElevation(altitude)}
          </div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Moonrise</div>
          <div className="text-sm font-semibold text-foreground tabular-nums">
            {rise ? fmtTime(rise, loc.timezone) : '—'}
          </div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Moonset</div>
          <div className="text-sm font-semibold text-foreground tabular-nums">
            {set ? fmtTime(set, loc.timezone) : '—'}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

function moonEmoji(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return '🌑'
  if (phase < 0.22) return '🌒'
  if (phase < 0.28) return '🌓'
  if (phase < 0.47) return '🌔'
  if (phase < 0.53) return '🌕'
  if (phase < 0.72) return '🌖'
  if (phase < 0.78) return '🌗'
  return '🌘'
}

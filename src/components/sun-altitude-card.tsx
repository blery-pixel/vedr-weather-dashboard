'use client'

import * as React from 'react'
import { Sun, ArrowUp } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { fmtElevation, solarElevation } from '@/lib/astronomy'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { LOCATION_COORDS } from '@/hooks/use-geolocation'
import { cn } from '@/lib/utils'

/**
 * SunAltitudeCard — shows the current solar elevation angle (degrees above
 * the horizon) with a live arc + a day arc showing where the sun is on its
 * east-to-west journey. Updates every minute.
 */
export function SunAltitudeCard({ data }: { data: WeatherApiResponse }) {
  const loc = data.location
  const coords = LOCATION_COORDS[loc.name.toLowerCase()]
  const lat = coords?.lat ?? loc.latitude
  const lon = coords?.lon ?? loc.longitude

  // Recompute every 60s
  const [, force] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => {
    const id = setInterval(force, 60_000)
    return () => clearInterval(id)
  }, [])

  const { elevation, azimuth } = solarElevation(lat, lon, new Date())
  const isUp = elevation > 0

  // Map elevation onto the arc: -10° (below horizon) → 0%, 90° (zenith) → 100%
  const elevPct = Math.max(0, Math.min(100, ((elevation + 10) / 100) * 100))
  // Azimuth: 0=N, 90=E, 180=S, 270=W → map onto arc left(0°=E sunrise) → right(180°=W sunset)
  const azPct = ((azimuth + 360) % 360) / 360 * 100

  const verdict = !isUp
    ? 'Below the horizon'
    : elevation >= 60
      ? 'High in the sky'
      : elevation >= 30
        ? 'Well above the horizon'
        : elevation >= 10
          ? 'Low on the horizon'
          : 'Just above the horizon'

  const tone = !isUp ? 'text-scot-heather' : elevation >= 30 ? 'text-scot-amber' : 'text-scot-amber'

  return (
    <GlassCard className="fade-up p-5" aria-label="Sun position and altitude">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-amber/15 text-scot-amber">
            <Sun className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Solar Position</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Sun altitude</h3>
          </div>
        </div>
        <div className="text-right">
          <div className={cn('text-2xl font-bold tabular-nums', tone)}>{fmtElevation(elevation)}</div>
          <div className="text-[0.65rem] text-muted-foreground">azimuth {Math.round(((azimuth + 360) % 360))}°</div>
        </div>
      </div>

      {/* Horizon arc with sun marker */}
      <div className="relative mx-auto mb-3 h-20 w-full max-w-[260px]">
        <svg viewBox="0 0 260 80" className="h-full w-full" aria-hidden>
          {/* Horizon line */}
          <line x1="0" y1="60" x2="260" y2="60" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />
          {/* East→West arc */}
          <path
            d="M 10 60 Q 130 -10 250 60"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1.5}
            strokeDasharray="2 3"
          />
          {/* Sky shading under the arc when sun is up */}
          {isUp && (
            <path
              d="M 10 60 Q 130 -10 250 60 L 250 60 L 10 60 Z"
              fill="url(#sunSkyGrad)"
            />
          )}
          <defs>
            <linearGradient id="sunSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E68A2E" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#E68A2E" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Sun marker (only when above horizon) */}
          {isUp && (
            <>
              {/* azimuth → x, elevation → y */}
              <circle
                cx={10 + (azPct / 100) * 240}
                cy={60 - Math.sin((elevPct / 100) * Math.PI) * 50}
                r={5}
                fill="#E68A2E"
              />
              <circle
                cx={10 + (azPct / 100) * 240}
                cy={60 - Math.sin((elevPct / 100) * Math.PI) * 50}
                r={9}
                fill="#E68A2E"
                fillOpacity={0.2}
              />
            </>
          )}
          {/* Compass labels */}
          <text x="10" y="74" fontSize="8" fill="currentColor" fillOpacity={0.5} textAnchor="middle">E</text>
          <text x="250" y="74" fontSize="8" fill="currentColor" fillOpacity={0.5} textAnchor="middle">W</text>
          <text x="130" y="74" fontSize="8" fill="currentColor" fillOpacity={0.5} textAnchor="middle">S</text>
        </svg>
        {/* Under-horizon moon-phase-style indicator when sun is down */}
        {!isUp && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-6">
            <span className="text-xs text-muted-foreground">Sun is below the horizon</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Status</div>
          <div className={cn('text-xs font-semibold', tone)}>{verdict}</div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Direction</div>
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <ArrowUp
              className="h-3 w-3 text-scot-amber"
              style={{ transform: `rotate(${(azimuth + 180) % 360}deg)` }}
              aria-hidden
            />
            {azimuthToCompass(azimuth)}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

function azimuthToCompass(az: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const a = ((az % 360) + 360) % 360
  return dirs[Math.round(a / 22.5) % 16]
}

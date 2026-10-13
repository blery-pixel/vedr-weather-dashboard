'use client'

import * as React from 'react'
import { MapPin, Navigation, Globe, Clock } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { LOCATION_COORDS } from '@/hooks/use-geolocation'
import { cn } from '@/lib/utils'

/**
 * LocationCoordinatesCard — shows the geographic coordinates, a stylised
 * SVG map of Scotland with the active location pinned (and other glens as
 * faint dots), plus timezone + hemisphere detail.
 */
export function LocationCoordinatesCard({ data }: { data: WeatherApiResponse }) {
  const loc = data.location
  const active = LOCATION_COORDS[loc.name.toLowerCase()]
  const lat = active?.lat ?? loc.latitude
  const lon = active?.lon ?? loc.longitude

  // Normalise all coords onto the SVG viewBox (Scotland bbox approx):
  // lat 54.5–58.7 (N), lon -8.0 to -1.5 (W).
  const minLat = 54.4
  const maxLat = 58.8
  const minLon = -8.2
  const maxLon = -1.3
  const toX = (lo: number) => 10 + ((lo - minLon) / (maxLon - minLon)) * 130
  const toY = (la: number) => 10 + ((maxLat - la) / (maxLat - minLat)) * 130

  const allCoords = Object.entries(LOCATION_COORDS)

  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`

  // Hemisphere
  const hemisphere = lat >= 0 ? 'Northern' : 'Southern'
  const tz = loc.timezone || 'Europe/London'

  return (
    <GlassCard className="fade-up p-5" aria-label="Location coordinates and map">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-green/15 text-scot-green dark:text-emerald-400">
          <Navigation className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <CardLabel>Geographic Position</CardLabel>
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            {loc.name} on the map
          </h3>
        </div>
      </div>

      {/* Stylised Scotland map */}
      <div className="relative mx-auto mb-4 w-full max-w-[180px]">
        <svg viewBox="0 0 150 150" className="w-full" aria-hidden>
          {/* Landmass blob — rough Scotland silhouette */}
          <path
            d="M 38 28 Q 52 18 70 20 Q 88 16 100 28 Q 112 34 118 50 Q 122 64 116 78 Q 112 96 100 108 Q 88 122 72 126 Q 56 128 44 118 Q 30 108 26 92 Q 22 74 26 58 Q 30 42 38 28 Z"
            fill="var(--card)"
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={1.2}
          />
          {/* Inner loch hint */}
          <path
            d="M 58 60 Q 66 56 74 60 Q 78 66 74 72 Q 66 74 60 70 Z"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={0.8}
          />
          {/* Other glens as faint dots */}
          {allCoords.map(([name, c]) => {
            if (name === loc.name.toLowerCase()) return null
            return (
              <circle
                key={name}
                cx={toX(c.lon)}
                cy={toY(c.lat)}
                r={1.8}
                fill="currentColor"
                fillOpacity={0.25}
              />
            )
          })}
          {/* Active location pin */}
          <g>
            <circle cx={toX(lon)} cy={toY(lat)} r={8} fill="#E68A2E" fillOpacity={0.18} />
            <circle cx={toX(lon)} cy={toY(lat)} r={4.5} fill="#E68A2E" />
            <circle cx={toX(lon)} cy={toY(lat)} r={2} fill="var(--background)" />
          </g>
        </svg>
        {/* Pulse ring around the pin */}
        <span
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${(toX(lon) / 150) * 100}%`,
            top: `${(toY(lat) / 150) * 100}%`,
            width: '16px',
            height: '16px',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(230,138,46,0.3)',
            animation: 'cw-pin-pulse 2.5s ease-out infinite',
          }}
          aria-hidden
        />
        <style>{`
          @keyframes cw-pin-pulse {
            0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Coordinates grid */}
      <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-scot-amber" aria-hidden />
          <div>
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Latitude</div>
            <div className="text-xs font-semibold text-foreground tabular-nums">{latStr}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 shrink-0 text-scot-loch" aria-hidden />
          <div>
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Longitude</div>
            <div className="text-xs font-semibold text-foreground tabular-nums">{lonStr}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 shrink-0 text-scot-heather" aria-hidden />
          <div>
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Hemisphere</div>
            <div className="text-xs font-semibold text-foreground">{hemisphere}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
          <div>
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Timezone</div>
            <div className="text-xs font-semibold text-foreground">{tz}</div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

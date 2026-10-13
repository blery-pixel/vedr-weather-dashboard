'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { Sun, ShieldAlert } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { fmtTime, uvLabel } from '@/lib/weather-utils'
import { solarElevation } from '@/lib/astronomy'
import { LOCATION_COORDS } from '@/hooks/use-geolocation'
import type { WeatherApiResponse } from '@/lib/weather-types'

/**
 * UVForecastCard — a 24-hour UV-index forecast curve. The API doesn't provide
 * a per-hour UV series, so we derive it from the solar elevation angle (UV is
 * roughly proportional to sin(elevation) when the sun is up, clamped at 0 at
 * night) scaled to the daily UV max from the API. Includes risk-band shading
 * (low/moderate/high/very-high/extreme) + sun-protection guidance.
 */
export function UVForecastCard({ data }: { data: WeatherApiResponse }) {
  const loc = data.location
  const coords = LOCATION_COORDS[loc.name.toLowerCase()]
  const lat = coords?.lat ?? loc.latitude
  const lon = coords?.lon ?? loc.longitude

  const dailyMaxUV = data.daily[0]?.uvIndexMax ?? data.current.uvIndex
  // Peak sin(elevation) at solar noon ≈ depends on latitude; we scale so the
  // max derived UV matches the API's daily UV max.
  const peakSin = Math.max(0.05, Math.sin(Math.max(0, 90 - Math.abs(lat - 20)) * (Math.PI / 180)))

  const series = React.useMemo(() => {
    return data.hourly.slice(0, 24).map((h) => {
      const { elevation } = solarElevation(lat, lon, new Date(h.time))
      // UV ≈ 0 below horizon; scales with sin(elevation) above
      const sinE = Math.max(0, Math.sin(elevation * (Math.PI / 180)))
      const derived = Math.max(0, (sinE / peakSin) * dailyMaxUV * 1.05)
      return {
        time: fmtTime(h.time, loc.timezone),
        uv: Math.round(derived * 10) / 10,
      }
    })
  }, [data.hourly, lat, lon, loc.timezone, peakSin, dailyMaxUV])

  const currentUV = data.current.uvIndex
  const uv = uvLabel(currentUV)
  const peakToday = Math.max(...series.map((s) => s.uv))
  const peakTime = series.find((s) => s.uv === peakToday)?.time

  const guidance =
    currentUV >= 8 ? 'Sun cream, shade, and sunglasses essential'
      : currentUV >= 6 ? 'Sun cream advised on exposed skin'
        : currentUV >= 3 ? 'Moderate risk — protect midday'
          : 'Low risk — no protection needed'

  return (
    <GlassCard className="fade-up p-5" aria-label="24-hour UV index forecast">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-amber/15 text-scot-amber">
            <Sun className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>UV Forecast</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Sunburn risk curve</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground tabular-nums">{currentUV.toFixed(1)}</div>
          <div className="text-[0.65rem] text-muted-foreground">now · {uv.label.toLowerCase()}</div>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="uvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E68A2E" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#E68A2E" stopOpacity={0.04} />
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
              width={36}
              domain={[0, 11]}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<UVTooltip />} cursor={{ stroke: '#E68A2E', strokeOpacity: 0.4, strokeDasharray: '3 3' }} />
            {/* Risk-band reference lines */}
            <ReferenceLine y={3} stroke="#4a9e6e" strokeOpacity={0.4} strokeDasharray="3 3" />
            <ReferenceLine y={6} stroke="#E68A2E" strokeOpacity={0.4} strokeDasharray="3 3" />
            <ReferenceLine y={8} stroke="#6B4E5B" strokeOpacity={0.4} strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="uv"
              stroke="#E68A2E"
              strokeWidth={2.5}
              fill="url(#uvGrad)"
              isAnimationActive
              animationDuration={700}
              name="UV index"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Guidance + peak */}
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-scot-amber" aria-hidden />
          <div>
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Guidance</div>
            <div className="text-xs font-medium text-foreground">{guidance}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Peak today</div>
          <div className="text-xs font-semibold text-foreground tabular-nums">
            {peakToday.toFixed(1)} at {peakTime}
          </div>
        </div>
      </div>

      {/* Risk-band legend */}
      <div className="mt-2 flex items-center justify-center gap-2 text-[0.6rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-emerald-500/40" aria-hidden />Low (0-2)</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-scot-amber/60" aria-hidden />Mod (3-5)</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-scot-amber" aria-hidden />High (6-7)</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-scot-heather" aria-hidden />V.High (8-10)</span>
      </div>
    </GlassCard>
  )
}

function UVTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const uv = payload[0]?.value as number
  const risk = uv >= 8 ? 'Very High' : uv >= 6 ? 'High' : uv >= 3 ? 'Moderate' : 'Low'
  const tone = uv >= 8 ? 'text-scot-heather' : uv >= 6 ? 'text-scot-amber' : uv >= 3 ? 'text-scot-amber' : 'text-emerald-500'
  return (
    <div className="rounded-md border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <div className="mb-1 font-medium text-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-scot-amber" aria-hidden />
        <span className="text-muted-foreground">UV index</span>
        <span className="ml-auto font-semibold text-foreground tabular-nums">{uv.toFixed(1)}</span>
      </div>
      <div className={`mt-0.5 text-right text-[0.65rem] font-semibold ${tone}`}>{risk} risk</div>
    </div>
  )
}

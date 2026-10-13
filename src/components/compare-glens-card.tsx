'use client'

import * as React from 'react'
import { ArrowUpDown, MapPin, Loader2 } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { WeatherIcon } from '@/components/weather-icon'
import { usePreferences, fmtTemp } from '@/lib/use-preferences'
import type { WeatherApiResponse, CurrentWeather } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

interface GlenRow {
  value: string
  label: string
  region: string
  current?: CurrentWeather
  loading?: boolean
}

/**
 * CompareGlensCard — fetches current weather for the user's favourite glens
 * (or a curated default set if none) and shows them in a compact comparison
 * table sortable by temperature. Clicking a row switches the dashboard.
 */
export function CompareGlensCard({
  favourites,
  defaultGlens,
  onPick,
  activeLocation,
}: {
  favourites: { value: string; label: string; region: string }[]
  defaultGlens: { value: string; label: string; region: string }[]
  onPick: (value: string) => void
  activeLocation: string
}) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const list = React.useMemo(
    () => (favourites.length > 0 ? favourites : defaultGlens.slice(0, 6)),
    [favourites, defaultGlens],
  )

  const [rows, setRows] = React.useState<GlenRow[]>(
    list.map((l) => ({ value: l.value, label: l.label, region: l.region, loading: true })),
  )
  const [sortDesc, setSortDesc] = React.useState(true)

  // Fetch current weather for each glen (parallel, best-effort).
  const favKey = favourites.map((f) => f.value).join(',')
  const defKey = defaultGlens.map((d) => d.value).join(',')
  React.useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    setRows(list.map((l) => ({ value: l.value, label: l.label, region: l.region, loading: true })))
    Promise.all(
      list.map(async (l) => {
        try {
          const res = await fetch(`/api/weather?location=${encodeURIComponent(l.value)}`, {
            signal: ctrl.signal,
            cache: 'no-store',
          })
          if (!res.ok) throw new Error('fail')
          const json: WeatherApiResponse = await res.json()
          return { value: l.value, label: l.label, region: l.region, current: json.current, loading: false }
        } catch {
          return { value: l.value, label: l.label, region: l.region, loading: false }
        }
      }),
    ).then((result) => {
      if (!cancelled) setRows(result)
    })
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [favKey, defKey])

  const sorted = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = a.current?.temperature ?? -999
      const tb = b.current?.temperature ?? -999
      return sortDesc ? tb - ta : ta - tb
    })
  }, [rows, sortDesc])

  return (
    <GlassCard className="fade-up p-5" aria-label="Compare glens">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-heather/15 text-scot-heather">
            <ArrowUpDown className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Glen Comparison</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {favourites.length > 0 ? 'Across your favourites' : 'Across the Highlands'}
            </h3>
          </div>
        </div>
        <button
          onClick={() => setSortDesc((d) => !d)}
          className="flex items-center gap-1 rounded-md border border-border/40 bg-card/30 px-2 py-1 text-[0.65rem] font-medium text-muted-foreground transition hover:border-scot-amber/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          aria-label={`Sort by temperature ${sortDesc ? 'ascending' : 'descending'}`}
        >
          {sortDesc ? 'Warmest first' : 'Coolest first'}
        </button>
      </div>

      <ul className="space-y-1" role="list">
        {sorted.map((r) => {
          const temp = r.current ? fmtTemp(r.current.temperature, tempUnit) : '—'
          const isActive = r.value === activeLocation
          return (
            <li key={r.value}>
              <button
                onClick={() => onPick(r.value)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  isActive ? 'bg-scot-amber/10 ring-1 ring-inset ring-scot-amber/40' : 'hover:bg-card/50',
                )}
              >
                {r.loading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                ) : r.current ? (
                  <WeatherIcon condition={r.current.condition} isDay={r.current.isDay} className="h-4 w-4 shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="flex-1 truncate">
                  <span className={cn('text-sm font-medium', isActive ? 'text-scot-amber' : 'text-foreground')}>{r.label}</span>
                  <span className="ml-1.5 text-[0.65rem] text-muted-foreground">{r.region}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {r.loading ? '…' : temp}
                </span>
                {r.current && (
                  <span className="hidden w-10 text-right text-[0.65rem] text-muted-foreground tabular-nums sm:block">
                    {Math.round(r.current.humidity)}%
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </GlassCard>
  )
}

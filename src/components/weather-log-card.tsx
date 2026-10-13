'use client'

import * as React from 'react'
import { History, Trash2, TrendingUp } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { Sparkline } from '@/components/sparkline'
import { useWeatherLog } from '@/lib/use-weather-log'
import { usePreferences, fmtTemp } from '@/lib/use-preferences'
import { fmtTime, fmtDayMonth } from '@/lib/weather-utils'
import { cn } from '@/lib/utils'

/**
 * WeatherLogCard — shows the user's persisted observation history (most
 * recent first) + a mini temperature-trend sparkline across all entries.
 * Logs are auto-captured when the dashboard loads weather data.
 */
export function WeatherLogCard({ activeLocation }: { activeLocation: string }) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const entries = useWeatherLog((s) => s.entries)
  const clear = useWeatherLog((s) => s.clear)

  const toDisplay = (c: number) => (tempUnit === 'f' ? (c * 9) / 5 + 32 : c)

  // Group entries by location for display
  const locationEntries = React.useMemo(
    () => entries.filter((e) => e.location === activeLocation),
    [entries, activeLocation],
  )

  const tempSeries = locationEntries.map((e) => toDisplay(e.temperature))

  return (
    <GlassCard className="fade-up p-5" aria-label="Weather observation log">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-loch/15 text-scot-loch">
            <History className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Observation Log</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {activeLocation.charAt(0).toUpperCase() + activeLocation.slice(1)} history
            </h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-foreground tabular-nums">{locationEntries.length}</div>
          <div className="text-[0.65rem] text-muted-foreground">entries</div>
        </div>
      </div>

      {locationEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <History className="h-8 w-8 text-muted-foreground/40" aria-hidden />
          <p className="text-xs text-muted-foreground">
            No log entries yet for {activeLocation}.
          </p>
          <p className="text-[0.65rem] text-muted-foreground">
            Conditions are recorded automatically each time you view a location.
          </p>
        </div>
      ) : (
        <>
          {/* Temp trend sparkline */}
          {tempSeries.length >= 2 && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-3">
              <Sparkline
                data={tempSeries}
                stroke="#E68A2E"
                width={160}
                height={36}
                showDot={false}
                ariaLabel={`Temperature trend across ${tempSeries.length} logged observations`}
              />
              <div className="flex flex-col text-[0.65rem] text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  Trend
                </span>
                <span className="tabular-nums">
                  {fmtTemp(Math.min(...tempSeries), tempUnit)} → {fmtTemp(Math.max(...tempSeries), tempUnit)}
                </span>
              </div>
            </div>
          )}

          {/* Log entries list */}
          <div className="scroll-thin max-h-48 space-y-1 overflow-y-auto pr-1" role="list">
            {[...locationEntries].reverse().map((e, i) => (
              <div
                key={`${e.ts}-${i}`}
                className="flex items-center gap-2 rounded-md border border-border/30 bg-card/20 px-2.5 py-1.5"
                role="listitem"
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    e.condition.includes('rain') ? 'bg-scot-loch'
                      : e.condition.includes('snow') ? 'bg-scot-heather'
                        : 'bg-scot-amber',
                  )}
                  aria-hidden
                />
                <div className="flex-1 text-xs">
                  <span className="font-medium text-foreground tabular-nums">{fmtTemp(e.temperature, tempUnit)}</span>
                  <span className="ml-1.5 text-muted-foreground">{e.condition}</span>
                </div>
                <div className="text-right text-[0.6rem] text-muted-foreground">
                  <div className="tabular-nums">{fmtDayMonth(e.ts)} {fmtTime(e.ts)}</div>
                  <div className="text-muted-foreground">{Math.round(e.humidity)}% · {Math.round(e.windSpeed)} km/h</div>
                </div>
              </div>
            ))}
          </div>

          {entries.length > 0 && (
            <button
              onClick={() => {
                clear()
              }}
              className="mt-3 flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[0.65rem] font-medium text-red-500 transition hover:bg-red-500/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              Clear all logs ({entries.length})
            </button>
          )}
        </>
      )}
    </GlassCard>
  )
}

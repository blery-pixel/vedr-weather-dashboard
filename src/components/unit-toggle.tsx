'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  usePreferences,
  type TempUnit,
  type SpeedUnit,
  type DistanceUnit,
} from '@/lib/use-preferences'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * UnitToggle — compact segmented control for temperature + speed units.
 * Two tiny pill groups; reflects the user's persisted preference and
 * updates the whole dashboard instantly via the Zustand store.
 */
export function UnitToggle() {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const speedUnit = usePreferences((s) => s.speedUnit)
  const distanceUnit = usePreferences((s) => s.distanceUnit)
  const setTempUnit = usePreferences((s) => s.setTempUnit)
  const setSpeedUnit = usePreferences((s) => s.setSpeedUnit)
  const setDistanceUnit = usePreferences((s) => s.setDistanceUnit)

  return (
    <TooltipProvider delayDuration={400}>
      <div className="hidden items-center gap-1.5 lg:flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="group"
              aria-label="Temperature unit"
              className="flex h-7 items-center rounded-md border border-border/40 bg-card/30 p-0.5 backdrop-blur-md"
            >
              {(['c', 'f'] as TempUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setTempUnit(u)}
                  aria-pressed={tempUnit === u}
                  aria-label={`Show temperature in degrees ${u === 'c' ? 'Celsius' : 'Fahrenheit'}`}
                  className={cn(
                    'h-6 w-6 rounded text-[0.7rem] font-semibold uppercase transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                    tempUnit === u
                      ? 'bg-scot-amber/20 text-scot-amber'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {u === 'c' ? '°C' : '°F'}
                </button>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Temperature unit
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="group"
              aria-label="Wind speed unit"
              className="flex h-7 items-center rounded-md border border-border/40 bg-card/30 p-0.5 backdrop-blur-md"
            >
              {(['kmh', 'mph'] as SpeedUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSpeedUnit(u)}
                  aria-pressed={speedUnit === u}
                  aria-label={`Show wind speed in ${u === 'kmh' ? 'kilometres per hour' : 'miles per hour'}`}
                  className={cn(
                    'flex h-6 items-center rounded px-1.5 text-[0.65rem] font-semibold uppercase transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                    speedUnit === u
                      ? 'bg-scot-amber/20 text-scot-amber'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {u === 'kmh' ? 'km/h' : 'mph'}
                </button>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Wind speed unit
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="group"
              aria-label="Distance unit"
              className="flex h-7 items-center rounded-md border border-border/40 bg-card/30 p-0.5 backdrop-blur-md"
            >
              {(['km', 'mi'] as DistanceUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setDistanceUnit(u)}
                  aria-pressed={distanceUnit === u}
                  aria-label={`Show distance in ${u === 'km' ? 'kilometres' : 'miles'}`}
                  className={cn(
                    'h-6 w-7 rounded text-[0.65rem] font-semibold uppercase transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                    distanceUnit === u
                      ? 'bg-scot-amber/20 text-scot-amber'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Distance unit
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

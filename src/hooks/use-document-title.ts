'use client'

import * as React from 'react'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { fmtTemp } from '@/lib/use-preferences'

/**
 * useDocumentTitle — keeps the browser tab title in sync with the current
 * weather, so a glance at the tab tells you the condition + temperature +
 * location. e.g. "11° light drizzle · Inverness — Veðr".
 */
export function useWeatherDocumentTitle(data: WeatherApiResponse | null) {
  const tempUnit = useTempUnit()
  React.useEffect(() => {
    if (!data) return
    const t = fmtTemp(data.current.temperature, tempUnit)
    const cond = data.current.conditionLabel.toLowerCase()
    const loc = data.location.name
    document.title = `${t} ${cond} · ${loc} — Veðr`
    return () => {
      document.title = 'Veðr — Weather Dashboard'
    }
  }, [data, tempUnit])
}

// Local selector import to avoid circular dep with the full store module.
import { usePreferences } from '@/lib/use-preferences'
function useTempUnit() {
  return usePreferences((s) => s.tempUnit)
}

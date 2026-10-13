'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WeatherLogEntry {
  /** ISO timestamp of the log */
  ts: string
  location: string
  temperature: number
  condition: string
  windSpeed: number
  humidity: number
}

export interface WeatherLogState {
  entries: WeatherLogEntry[]
  addEntry: (entry: WeatherLogEntry) => void
  clear: () => void
  /** Keep only the most recent N entries (default 200) */
  prune: (max?: number) => void
}

/**
 * useWeatherLog — a persisted store of weather observations, so the user can
 * track conditions over time. Capped at 200 entries (FIFO).
 */
export const useWeatherLog = create<WeatherLogState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) => {
        const next = [...get().entries, entry]
        // FIFO cap at 200
        if (next.length > 200) next.splice(0, next.length - 200)
        set({ entries: next })
      },
      clear: () => set({ entries: [] }),
      prune: (max = 200) => {
        const next = get().entries.slice(-max)
        set({ entries: next })
      },
    }),
    {
      name: 'ceilidh-weather-log',
      version: 1,
      // SSR/HYDRATION: skip automatic synchronous hydration (see
      // use-preferences.ts for the full rationale). Rehydrated manually
      // via PreferencesHydrator in layout.tsx.
      skipHydration: true,
    },
  ),
)

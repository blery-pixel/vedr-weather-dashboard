'use client'

import * as React from 'react'
import { usePreferences } from '@/lib/use-preferences'
import { useWeatherLog } from '@/lib/use-weather-log'

/**
 * StoreHydrator — manually rehydrates the persisted Zustand stores
 * (usePreferences + useWeatherLog) AFTER the initial client render.
 *
 * WHY: both stores use `persist` with `skipHydration: true`. This means
 * the stores do NOT automatically read from localStorage on creation.
 * Instead, the server AND the client's first render both use the default
 * state (empty favourites, no locationMeta, etc.) — so the hydration
 * matches. Then this component calls `rehydrate()` in a useEffect,
 * which reads localStorage and updates the store, triggering a normal
 * re-render (no hydration mismatch).
 *
 * If we DIDN'T set `skipHydration: true`, the client's first render
 * would read localStorage synchronously during store creation, getting
 * potentially different state than the server (which can't read
 * localStorage) → hydration mismatch.
 */
export function StoreHydrator({ children }: { children: React.ReactNode }) {
  // Rehydrate both stores once on mount.
  React.useEffect(() => {
    // `persist` API: `usePreferences.persist.rehydrate()` returns a Promise.
    // We don't need to await it — the store updates synchronously for
    // sync storage (localStorage) and triggers a re-render.
    void usePreferences.persist.rehydrate()
    void useWeatherLog.persist.rehydrate()
  }, [])

  return <>{children}</>
}

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TempUnit = 'c' | 'f'
export type SpeedUnit = 'kmh' | 'mph'
export type DistanceUnit = 'km' | 'mi'

export interface LocationMeta {
  value: string
  label: string
  region: string
  country?: string
  lat?: number
  lon?: number
}

export interface PreferencesState {
  tempUnit: TempUnit
  speedUnit: SpeedUnit
  distanceUnit: DistanceUnit
  favourites: string[]
  /** Cache of metadata for every location the user has selected (so worldwide
   * coordinate-backed cities keep their display labels across reloads). */
  locationMeta: Record<string, LocationMeta>
  setTempUnit: (u: TempUnit) => void
  setSpeedUnit: (u: SpeedUnit) => void
  setDistanceUnit: (u: DistanceUnit) => void
  toggleFavourite: (value: string) => void
  isFavourite: (value: string) => boolean
  recordLocationMeta: (meta: LocationMeta) => void
  getLocationMeta: (value: string) => LocationMeta | undefined
  clearFavourites: () => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      tempUnit: 'c',
      speedUnit: 'kmh',
      distanceUnit: 'km',
      favourites: [],
      locationMeta: {},
      setTempUnit: (tempUnit) => set({ tempUnit }),
      setSpeedUnit: (speedUnit) => set({ speedUnit }),
      setDistanceUnit: (distanceUnit) => set({ distanceUnit }),
      toggleFavourite: (value) => {
        const cur = get().favourites
        const next = cur.includes(value)
          ? cur.filter((v) => v !== value)
          : [...cur, value]
        set({ favourites: next })
      },
      isFavourite: (value) => get().favourites.includes(value),
      recordLocationMeta: (meta) => {
        const cur = get().locationMeta
        if (cur[meta.value]?.label === meta.label && cur[meta.value]?.region === meta.region) return
        set({ locationMeta: { ...cur, [meta.value]: meta } })
      },
      getLocationMeta: (value) => get().locationMeta[value],
      clearFavourites: () => set({ favourites: [] }),
    }),
    {
      name: 'ceilidh-weather-prefs',
      version: 1,
      // SSR/HYDRATION: skip automatic synchronous hydration. Without this,
      // the client's first render reads localStorage (which the server can't
      // access) → the client renders with hydrated state while the server
      // rendered with defaults → hydration mismatch. We rehydrate manually
      // in a useEffect via PreferencesHydrator (see motion-config-provider area).
      skipHydration: true,
    },
  ),
)

/* ===================== Unit converters ===================== */

export function toTempF(c: number): number {
  return (c * 9) / 5 + 32
}

export function toSpeedMph(kmh: number): number {
  return kmh * 0.621371
}

export function toDistMi(km: number): number {
  return km * 0.621371
}

/** Format a temperature honouring the user's preferred unit. */
export function fmtTemp(c: number, unit: TempUnit, digits = 0): string {
  const v = unit === 'f' ? toTempF(c) : c
  return `${v.toFixed(digits)}°`
}

/** Format speed honouring the user's preferred unit. */
export function fmtSpeed(kmh: number, unit: SpeedUnit): string {
  const v = unit === 'mph' ? toSpeedMph(kmh) : kmh
  return `${Math.round(v)}`
}

/** Format distance honouring the user's preferred unit. */
export function fmtDist(km: number, unit: DistanceUnit): string {
  const v = unit === 'mi' ? toDistMi(km) : km
  return `${v.toFixed(unit === 'mi' ? 1 : 0)}`
}

export function tempUnitLabel(u: TempUnit): string {
  return u === 'f' ? '°F' : '°C'
}

export function speedUnitLabel(u: SpeedUnit): string {
  return u === 'mph' ? 'mph' : 'km/h'
}

export function distUnitLabel(u: DistanceUnit): string {
  return u === 'mi' ? 'mi' : 'km'
}

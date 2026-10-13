'use client'

import * as React from 'react'
import type { LocationOption } from '@/components/weather-header'

/** Geographic coordinates for each Scottish location (for nearest-match). */
export const LOCATION_COORDS: Record<string, { lat: number; lon: number }> = {
  'inverness': { lat: 57.4778, lon: -4.2247 },
  'fort william': { lat: 56.8197, lon: -5.1054 },
  'aviemore': { lat: 57.2083, lon: -3.8345 },
  'oban': { lat: 56.4122, lon: -5.4733 },
  'portree': { lat: 57.4333, lon: -6.1917 },
  'ullapool': { lat: 57.8963, lon: -5.1605 },
  'glasgow': { lat: 55.8642, lon: -4.2518 },
  'edinburgh': { lat: 55.9533, lon: -3.1883 },
  'aberdeen': { lat: 57.1497, lon: -2.0943 },
  'perth': { lat: 56.3958, lon: -3.4308 },
  'st andrews': { lat: 56.3398, lon: -2.7967 },
  'mallaig': { lat: 57.0059, lon: -5.8292 },
}

/** Haversine distance in km between two coordinates. */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Find the closest location value from a lat/lon pair. */
export function nearestLocation(lat: number, lon: number, locations: LocationOption[]): string {
  let best = locations[0]?.value ?? 'inverness'
  let bestD = Infinity
  for (const l of locations) {
    const c = LOCATION_COORDS[l.value]
    if (!c) continue
    const d = haversine(lat, lon, c.lat, c.lon)
    if (d < bestD) {
      bestD = d
      best = l.value
    }
  }
  return best
}

export interface GeoState {
  loading: boolean
  error: string | null
  coords: { lat: number; lon: number } | null
}

/** Hook that requests the user's geolocation on demand. */
export function useGeolocation() {
  const [state, setState] = React.useState<GeoState>({
    loading: false,
    error: null,
    coords: null,
  })

  const request = React.useCallback((): Promise<{ lat: number; lon: number } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setState({ loading: false, error: 'Geolocation not supported on this device', coords: null })
        resolve(null)
        return
      }
      setState({ loading: true, error: null, coords: null })
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          setState({ loading: false, error: null, coords })
          resolve(coords)
        },
        (err) => {
          const msg =
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied'
              : err.code === err.POSITION_UNAVAILABLE
                ? 'Position unavailable'
                : err.code === err.TIMEOUT
                  ? 'Location request timed out'
                  : 'Could not get location'
          setState({ loading: false, error: msg, coords: null })
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      )
    })
  }, [])

  return { ...state, request }
}

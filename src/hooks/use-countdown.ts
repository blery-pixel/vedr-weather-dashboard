'use client'

import * as React from 'react'

/**
 * useCountdown — returns a live countdown to a target ISO timestamp.
 * Re-renders every `intervalMs` (default 60s) so the countdown stays fresh.
 * Returns null if the target is in the past.
 *
 * Returned shape: { hours, minutes, seconds, totalSeconds, past: boolean }
 */
export function useCountdown(
  targetIso: string | undefined | null,
  intervalMs = 60_000,
): {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  past: boolean
} | null {
  const [, force] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    if (!targetIso) return
    const id = setInterval(force, intervalMs)
    return () => clearInterval(id)
  }, [targetIso, intervalMs])

  if (!targetIso) return null
  const target = new Date(targetIso).getTime()
  const diff = target - Date.now()
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, past: true }
  }
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { hours, minutes, seconds, totalSeconds, past: false }
}

/** Format a countdown as "2h 14m" or "14m" or "47s". */
export function fmtCountdown(c: ReturnType<typeof useCountdown>): string {
  if (!c) return '—'
  if (c.past) return 'now'
  if (c.hours > 0) return `${c.hours}h ${c.minutes}m`
  if (c.minutes > 0) return `${c.minutes}m`
  return `${c.seconds}s`
}

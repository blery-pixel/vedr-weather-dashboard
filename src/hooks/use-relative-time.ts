'use client'

import * as React from 'react'

/**
 * useRelativeTime — returns a human-readable "N min ago" / "just now" string
 * for a given ISO timestamp, re-rendering every `intervalMs` so it stays live.
 */
export function useRelativeTime(
  iso: string | undefined | null,
  intervalMs = 30_000,
): string {
  const [, force] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    if (!iso) return
    const id = setInterval(force, intervalMs)
    return () => clearInterval(id)
  }, [iso, intervalMs])

  if (!iso) return '—'
  return relativeTime(iso)
}

/** Pure formatter (no re-render) — exported for one-off use. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const sec = Math.floor(diff / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  return `${day} d ago`
}

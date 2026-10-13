'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRelativeTime } from '@/hooks/use-relative-time'
import { fmtTime } from '@/lib/weather-utils'

/**
 * LastRefreshedBadge — shows the last data refresh time as "HH:MM · N min ago",
 * re-rendering every 30s so the relative time stays live. Sits in the header.
 */
export function LastRefreshedBadge({
  updatedAt,
  loading,
  dataSource,
  className,
}: {
  updatedAt?: string
  loading?: boolean
  dataSource?: 'open-meteo' | 'mock'
  className?: string
}) {
  const ago = useRelativeTime(updatedAt, 30_000)

  return (
    <div
      className={cn(
        'hidden items-center gap-2 rounded-md border border-border/40 bg-card/30 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur-md md:flex',
        className,
      )}
      title={`Last data refresh${updatedAt ? ` · ${fmtTime(updatedAt)}` : ''}`}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          loading ? 'animate-pulse bg-scot-amber' : 'bg-emerald-500/80',
        )}
        aria-hidden
      />
      <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <span className="tabular-nums">
        {updatedAt ? fmtTime(updatedAt) : '—'}
        <span className="mx-1 text-muted-foreground/50">·</span>
        <span className="text-muted-foreground/90">{ago}</span>
      </span>
      {dataSource && (
        <span className="ml-0.5 rounded-sm bg-muted/40 px-1 text-[0.6rem] uppercase tracking-wider text-muted-foreground">
          {dataSource === 'mock' ? 'sim' : 'live'}
        </span>
      )}
    </div>
  )
}

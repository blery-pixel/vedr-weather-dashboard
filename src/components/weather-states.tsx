import * as React from 'react'
import { GlassCard } from '@/components/glass-card'
import { cn } from '@/lib/utils'
import { AlertTriangle, CloudOff, RotateCcw, Search } from 'lucide-react'

/** Generic pulsing skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/60',
        className,
      )}
      aria-hidden
    />
  )
}

/** Full dashboard loading layout — mirrors the real layout with skeletons. */
export function DashboardLoading() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading weather data…</span>
      {/* Hero skeleton */}
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-44" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-28" />
            ))}
          </div>
        </div>
      </GlassCard>
      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GlassCard key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-2 w-full" />
            </div>
          </GlassCard>
        ))}
      </div>
      {/* Chart + forecast skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-48 w-full" />
        </GlassCard>
        <GlassCard className="p-5">
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

/** Error state with retry CTA. */
export function DashboardError({
  message,
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 p-8 text-center">
      <GlassCard className="w-full p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">
          The glens are shrouded in mist
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {message ??
            'We could not fetch the weather right now. The signal across the moor may be patchy — please try again.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Retry
          </button>
        )}
      </GlassCard>
    </div>
  )
}

/** Empty state — e.g. when no location matches. */
export function DashboardEmpty({ query }: { query?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 p-8 text-center">
      <GlassCard className="w-full p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-scot-loch">
          <Search className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">No glen found</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {query
            ? `No Scottish location matched “${query}”. Try Inverness, Fort William, Aviemore, Oban, Portree or Glasgow.`
            : 'Type a Scottish Highland town to begin forecasting.'}
        </p>
      </GlassCard>
    </div>
  )
}

/** Inline cloud-off pill used in cards when metric is unavailable. */
export function MetricUnavailable({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CloudOff className="h-3.5 w-3.5" aria-hidden />
      {label ?? 'N/A'}
    </span>
  )
}

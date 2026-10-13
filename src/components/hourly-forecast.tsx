'use client'

import * as React from 'react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { WeatherIcon } from '@/components/weather-icon'
import { fmtTime } from '@/lib/weather-utils'
import type { HourlyPoint, WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'
import { fmtTemp, usePreferences } from '@/lib/use-preferences'

export interface HourlyForecastHandle {
  scroll: (dir: 1 | -1) => void
}

export const HourlyForecast = React.forwardRef<
  HourlyForecastHandle,
  { data: WeatherApiResponse }
>(function HourlyForecast({ data }, ref) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const nowRef = React.useRef<HTMLDivElement>(null)
  // Use the full rail: 12 past hours + now + 24 future.
  const hours = data.hourly
  // Stable signature so the centre effect re-runs when the data changes.
  const nowSig = hours.find((h) => h.isNow)?.time ?? ''

  const doScroll = React.useCallback((dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }, [])

  // Auto-center on the "now" card whenever the data changes (so the instant
  // hour sits in the middle of the rail on load). Deferred to next frame so
  // the rail's layout (clientWidth / offsets) is ready before we scroll.
  React.useEffect(() => {
    if (!nowSig) return
    const rail = scrollRef.current
    const nowEl = nowRef.current
    if (!rail || !nowEl) return
    const centre = () => {
      const r = scrollRef.current
      const n = nowRef.current
      if (!r || !n) return
      const target = n.offsetLeft - r.clientWidth / 2 + n.clientWidth / 2
      r.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
    }
    // rAF ensures layout is measured; a short timeout also helps the smooth
    // scroll settle after the entrance animation.
    const raf = requestAnimationFrame(() => setTimeout(centre, 60))
    return () => cancelAnimationFrame(raf)
  }, [nowSig])

  React.useImperativeHandle(ref, () => ({ scroll: doScroll }), [doScroll])

  return (
    <GlassCard className="fade-up p-5" aria-label="Hourly forecast timeline">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <CardLabel>12h past · now · 24h ahead</CardLabel>
          <h3 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Hourly forecast
          </h3>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <button
            onClick={() => doScroll(-1)}
            aria-label="Scroll hours left"
            className="text-click text-xs"
          >
            ‹ Prev
          </button>
          <button
            onClick={() => doScroll(1)}
            aria-label="Scroll hours right"
            className="text-click text-xs"
          >
            Next ›
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="scroll-thin -mx-2 flex gap-2 overflow-x-auto px-2 pb-2"
        tabIndex={0}
        aria-label="Hourly forecast list, horizontally scrollable, centred on the current hour"
      >
        {hours.map((h, i) => (
          <HourCard
            key={h.time}
            hour={h}
            index={i}
            tz={data.location.timezone}
            nowRef={h.isNow ? nowRef : undefined}
          />
        ))}
      </div>
    </GlassCard>
  )
})

function HourCard({
  hour,
  index,
  tz,
  nowRef,
}: {
  hour: HourlyPoint
  index: number
  tz: string
  nowRef?: React.RefObject<HTMLDivElement>
}) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const tempColor =
    hour.temperature >= 15
      ? 'text-scot-amber'
      : hour.temperature >= 5
        ? 'text-foreground'
        : 'text-scot-loch'
  return (
    <div
      ref={nowRef ?? undefined}
      className={cn(
        'relative flex w-[5.5rem] shrink-0 flex-col items-center gap-1.5 rounded-lg border bg-card/30 p-3 backdrop-blur-sm transition hover:border-scot-amber/40 hover:bg-accent/10',
        hour.isNow
          ? 'border-scot-amber/60 bg-scot-amber/15 ring-1 ring-inset ring-scot-amber/40'
          : hour.isPast
            ? 'border-border/30 opacity-55'
            : 'border-border/40',
      )}
      style={{ animationDelay: `${Math.min(index, 24) * 25}ms` }}
    >
      <span className="text-[0.7rem] font-medium text-muted-foreground tabular-nums">
        {fmtTime(hour.time, tz)}
      </span>
      <WeatherIcon condition={hour.condition} isDay={hour.isDay} className="h-7 w-7" />
      <span className={cn('font-norse text-lg font-semibold tabular-nums', hour.isNow ? 'text-scot-amber' : tempColor)}>
        {fmtTemp(hour.temperature, tempUnit)}
      </span>
      <span className="flex items-center gap-0.5 text-[0.65rem] text-scot-loch">
        <span className="inline-block h-1 w-1 rounded-full bg-scot-loch/70" aria-hidden />
        {hour.precipitationProbability}%
      </span>
    </div>
  )
}

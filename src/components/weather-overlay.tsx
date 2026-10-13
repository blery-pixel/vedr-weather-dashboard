'use client'

import * as React from 'react'
import type { WeatherCondition } from '@/lib/weather-types'

export type OverlayMode = 'auto' | 'aurora' | 'rain' | 'snow' | 'mist' | 'none'

/**
 * WeatherOverlay — condition-reactive particle layer that sits above the
 * tartan background but below content. Purely decorative (aria-hidden).
 *
 * Renders rain streaks, snowflakes, drifting fog bands, or — on clear/partly
 * cloudy nights — a subtle aurora-borealis glow. Respects
 * `prefers-reduced-motion`.
 *
 * `override` lets the user cycle modes for demo (via the `o` shortcut):
 * 'auto' = condition-driven, others force a specific layer.
 */
export function WeatherOverlay({
  condition,
  isDay,
  intensity = 1,
  override = 'auto',
}: {
  condition: WeatherCondition
  isDay?: boolean
  /** 0..1 — scales particle count for intensity (e.g. heavy rain → more) */
  intensity?: number
  override?: OverlayMode
}) {
  const reduce = usePrefersReducedMotion()
  if (reduce) return null
  if (override === 'none') return null

  // Forced modes
  if (override === 'aurora') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
        <AuroraLayer />
      </div>
    )
  }
  if (override === 'rain') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
        <RainLayer count={Math.round(60 * intensity)} heavy={intensity > 1.2} isDay={isDay} />
      </div>
    )
  }
  if (override === 'snow') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
        <SnowLayer count={Math.round(50 * intensity)} />
      </div>
    )
  }
  if (override === 'mist') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
        <MistLayer isDay={isDay} />
      </div>
    )
  }

  // Auto mode — condition-driven
  const kind = particleKind(condition)
  const showAurora = !isDay && (condition === 'clear' || condition === 'partly-cloudy' || condition === 'windy')

  if (!kind && !showAurora) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden"
    >
      {showAurora && <AuroraLayer />}
      {kind === 'rain' && <RainLayer count={Math.round(60 * intensity)} heavy={intensity > 1.2} isDay={isDay} />}
      {kind === 'snow' && <SnowLayer count={Math.round(50 * intensity)} />}
      {kind === 'mist' && <MistLayer isDay={isDay} />}
      {kind === 'storm' && <RainLayer count={Math.round(80 * intensity)} heavy isDay={isDay} />}
    </div>
  )
}

function particleKind(c: WeatherCondition): 'rain' | 'snow' | 'mist' | 'storm' | null {
  switch (c) {
    case 'drizzle':
    case 'rain':
      return 'rain'
    case 'heavy-rain':
      return 'rain'
    case 'sleet':
    case 'snow':
      return 'snow'
    case 'mist':
    case 'fog':
      return 'mist'
    case 'thunderstorm':
      return 'storm'
    default:
      return null
  }
}

/* ---------- Aurora / Borealis (clear night) ---------- */
function AuroraLayer() {
  return (
    <>
      <style>{`
        @keyframes cw-aurora-shift {
          0%   { transform: translateX(-8%) translateY(0) skewX(-4deg); opacity: 0.35; }
          50%  { transform: translateX(8%)  translateY(-10px) skewX(4deg); opacity: 0.6; }
          100% { transform: translateX(-8%) translateY(0) skewX(-4deg); opacity: 0.35; }
        }
        @keyframes cw-aurora-shift-2 {
          0%   { transform: translateX(6%) translateY(-6px) skewX(3deg); opacity: 0.3; }
          50%  { transform: translateX(-6%) translateY(6px) skewX(-3deg); opacity: 0.55; }
          100% { transform: translateX(6%) translateY(-6px) skewX(3deg); opacity: 0.3; }
        }
      `}</style>
      {/* Green-amber aurora curtain */}
      <div
        className="absolute inset-x-0 top-0 h-[55vh]"
        style={{
          background:
            'linear-gradient(180deg, rgba(120,145,125,0.0) 0%, rgba(120,145,125,0.16) 30%, rgba(184,121,67,0.12) 60%, transparent 100%)',
          filter: 'blur(28px)',
          animation: 'cw-aurora-shift 16s ease-in-out infinite',
        }}
      />
      {/* Heather-purple secondary curtain */}
      <div
        className="absolute inset-x-0 top-[8vh] h-[45vh]"
        style={{
          background:
            'linear-gradient(180deg, rgba(107,127,139,0.0) 0%, rgba(107,127,139,0.16) 40%, rgba(120,145,125,0.10) 70%, transparent 100%)',
          filter: 'blur(32px)',
          animation: 'cw-aurora-shift-2 22s ease-in-out infinite',
        }}
      />
      {/* Star field for clear nights */}
      <StarField />
    </>
  )
}

function StarField() {
  const stars = React.useMemo(() => {
    const arr: { left: number; top: number; delay: number; dur: number; size: number }[] = []
    for (let i = 0; i < 60; i++) {
      arr.push({
        left: Math.random() * 100,
        top: Math.random() * 65,
        delay: Math.random() * 4,
        dur: 2.5 + Math.random() * 3,
        size: 1 + Math.random() * 1.6,
      })
    }
    return arr
  }, [])
  return (
    <>
      <style>{`
        @keyframes cw-star-twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.9; }
        }
      `}</style>
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background: 'rgba(243,240,232,0.9)',
            boxShadow: '0 0 4px rgba(243,240,232,0.5)',
            animation: `cw-star-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </>
  )
}

/* ---------- Rain ---------- */
function RainLayer({ count, heavy, isDay }: { count: number; heavy?: boolean; isDay?: boolean }) {
  const drops = React.useMemo(() => {
    const arr: { left: number; delay: number; dur: number; len: number; op: number }[] = []
    for (let i = 0; i < count; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 2.2,
        dur: 0.6 + Math.random() * 0.8,
        len: heavy ? 22 + Math.random() * 24 : 12 + Math.random() * 16,
        op: 0.18 + Math.random() * 0.25,
      })
    }
    return arr
  }, [count, heavy])

  const color = isDay ? 'rgba(120,153,171,0.6)' : 'rgba(170,187,194,0.55)'

  return (
    <>
      <style>{`
        @keyframes cw-rain-fall {
          0% { transform: translateY(-20vh); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translateY(120vh); opacity: 0.3; }
        }
      `}</style>
      {drops.map((d, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${d.left}%`,
            width: '1px',
            height: `${d.len}px`,
            background: `linear-gradient(to bottom, transparent, ${color})`,
            opacity: d.op,
            transform: 'translateY(-20vh)',
            animation: `cw-rain-fall ${d.dur}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
    </>
  )
}

/* ---------- Snow ---------- */
function SnowLayer({ count }: { count: number }) {
  const flakes = React.useMemo(() => {
    const arr: { left: number; delay: number; dur: number; size: number; op: number; sway: number }[] = []
    for (let i = 0; i < count; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        dur: 6 + Math.random() * 7,
        size: 3 + Math.random() * 4,
        op: 0.5 + Math.random() * 0.4,
        sway: 14 + Math.random() * 24,
      })
    }
    return arr
  }, [count])

  return (
    <>
      <style>{`
        @keyframes cw-snow-fall {
          0% { transform: translate(0, -10vh); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translate(var(--sway), 50vh); }
          100% { transform: translate(0, 110vh); opacity: 0; }
        }
      `}</style>
      {flakes.map((f, i) => (
        <span
          key={i}
          style={
            {
              position: 'absolute',
              top: 0,
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              borderRadius: '50%',
              background: 'rgba(243,240,232,0.85)',
              boxShadow: '0 0 4px rgba(243,240,232,0.6)',
              opacity: f.op,
              '--sway': `${f.sway}px`,
              animation: `cw-snow-fall ${f.dur}s ease-in-out ${f.delay}s infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}

/* ---------- Mist / Fog ---------- */
function MistLayer({ isDay }: { isDay?: boolean }) {
  const tone = isDay ? 'rgba(243,240,232,0.20)' : 'rgba(120,153,171,0.20)'
  return (
    <>
      <style>{`
        @keyframes cw-mist-drift {
          0% { transform: translateX(-30%); }
          50% { transform: translateX(30%); }
          100% { transform: translateX(-30%); }
        }
      `}</style>
      {[
        { top: '18%', h: 120, dur: 26, delay: 0, op: 0.9 },
        { top: '42%', h: 160, dur: 34, delay: -8, op: 0.7 },
        { top: '68%', h: 140, dur: 30, delay: -14, op: 0.8 },
      ].map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: m.top,
            left: '-30%',
            width: '160%',
            height: m.h,
            background: `radial-gradient(ellipse at center, ${tone} 0%, transparent 70%)`,
            opacity: m.op,
            animation: `cw-mist-drift ${m.dur}s ease-in-out ${m.delay}s infinite`,
          }}
        />
      ))}
    </>
  )
}

/* ---------- Helpers ---------- */
function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduce(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduce
}

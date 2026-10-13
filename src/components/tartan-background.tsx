'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * NordicBackground — fixed decorative background evoking Nordic fjords, stormy
 * seas, and ancient runestones. Combines:
 *  - a Midnight Fjord → Dark Nordic Slate vertical gradient
 *  - an Ember Bronze radial glow (distant fire / low sun, top-right)
 *  - a Fjord Blue radial glow (cold water, bottom-left)
 *  - a subtle runestone grid + Norse-rune watermark overlay
 *  - drifting mist layers
 *  - a vignette for readability
 *
 * Purely decorative: aria-hidden, pointer-events-none. Respects
 * prefers-reduced-motion (parallax disabled).
 */
export function TartanBackground({ className }: { className?: string }) {
  const reduce = usePrefersReducedMotion()
  const scrollY = useScrollY(reduce ? 0 : 0.18)

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden',
        className,
      )}
    >
      {/* Base gradient — Midnight Fjord → Dark Nordic Slate */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #101B22 0%, #15262F 50%, #1B2B35 100%)',
        }}
      />
      {/* Ember Bronze radial glow top-right (distant fire / low sun) — parallax */}
      <div
        className="absolute -top-40 -right-40 h-[34rem] w-[34rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(184,121,67,0.16) 0%, transparent 70%)',
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />
      {/* Fjord Blue radial glow bottom-left (cold water) — parallax */}
      <div
        className="absolute -bottom-40 -left-40 h-[32rem] w-[32rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(120,153,171,0.14) 0%, transparent 70%)',
          transform: `translateY(${-scrollY * 0.3}px)`,
        }}
      />
      {/* Runestone grid — subtle carved-stone crosshatch */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(213,197,161,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(213,197,161,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          transform: `translateY(${scrollY * 0.12}px)`,
        }}
      />
      {/* Norse-rune watermark overlay — faint repeated ᚠ ᚢ ᚦ ᚨ glyphs */}
      <div
        className="absolute inset-0 select-none"
        style={{
          fontFamily: 'serif',
          fontSize: '4rem',
          color: 'rgba(213,197,161,0.04)',
          lineHeight: '5rem',
          overflow: 'hidden',
          wordBreak: 'break-all',
          padding: '2rem',
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i}>ᚠᚢᚦᚨᚱᚲᚷᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞ</span>
        ))}
      </div>
      {/* Drifting mist layers — parallax */}
      <div
        className="mist-layer absolute inset-x-0 top-1/4 h-48"
        style={{ transform: `translateY(${scrollY * 0.25}px)` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(170,187,194,0.16) 0%, transparent 70%)',
          }}
        />
      </div>
      <div
        className="mist-layer absolute inset-x-0 top-2/3 h-40"
        style={{ animationDelay: '-6s', transform: `translateY(${scrollY * 0.4}px)` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(170,187,194,0.12) 0%, transparent 70%)',
          }}
        />
      </div>
      {/* Vignette to keep content readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.40) 100%)',
        }}
      />
    </div>
  )
}

/** Track window scrollY with rAF throttling. Returns 0 if reduced-motion. */
function useScrollY(speed: number): number {
  const [y, setY] = React.useState(0)
  React.useEffect(() => {
    if (speed === 0) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setY(window.scrollY * speed))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [speed])
  return y
}

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

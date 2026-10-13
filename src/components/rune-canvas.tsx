'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

/**
 * RuneCanvas — a background layer of small Elder Futhark Norse runes that
 * drift VERY slowly (like floating in space).
 *
 * Theme-aware color:
 *   • Dark theme  → light bronze (rgba(212, 167, 106, α))
 *   • Light theme → dark red    (rgba(170, 35, 35, α))
 *
 * Interaction: clicking a rune triggers an explosion — the rune bursts
 * into ~18 small "flying stone" particles that scatter outward with
 * physics (velocity + gravity + rotation + fade), then the rune respawns
 * at a new random location. The animation runs in an infinite loop.
 */

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛟ', 'ᛞ']

interface ThemeColors {
  runeRgb: string
  stoneRgb: string
  alphaMin: number
  alphaMax: number
  hoverAlphaBoost: number
  glowAlpha: number
  hoverGlowAlpha: number
}

const THEME_COLORS: Record<string, ThemeColors> = {
  dark: {
    runeRgb: '212, 167, 106',     // light bronze
    stoneRgb: '212, 167, 106',
    alphaMin: 0.15,
    alphaMax: 0.35,
    hoverAlphaBoost: 0.25,
    glowAlpha: 0.3,
    hoverGlowAlpha: 0.6,
  },
  light: {
    runeRgb: '170, 35, 35',       // dark red
    stoneRgb: '170, 35, 35',
    alphaMin: 0.30,
    alphaMax: 0.60,
    hoverAlphaBoost: 0.20,
    glowAlpha: 0.35,
    hoverGlowAlpha: 0.65,
  },
}

const RUNE_COUNT = 50
const STONES_PER_EXPLOSION = 18
const EXPLOSION_LIFETIME = 1400 // ms

interface RuneParticle {
  el: HTMLSpanElement | null
  x: number
  y: number
  char: string
  size: number
  alpha: number
  vx: number
  vy: number
  vr: number
  rot: number
}

interface StoneParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vr: number
  life: number
  rgb: string
}

export function RuneCanvas({ className = '' }: { className?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const runesRef = React.useRef<RuneParticle[]>([])
  const stonesRef = React.useRef<StoneParticle[]>([])
  const rafRef = React.useRef<number | null>(null)
  const lastTimeRef = React.useRef<number>(0)
  const colorsRef = React.useRef<ThemeColors>(THEME_COLORS.dark!)

  const { resolvedTheme } = useTheme()

  // Update colors when theme changes
  React.useEffect(() => {
    const colors = THEME_COLORS[resolvedTheme ?? 'dark'] ?? THEME_COLORS.dark!
    colorsRef.current = colors
    // Update all existing rune spans with the new color
    for (const p of runesRef.current) {
      if (!p.el) continue
      p.alpha = colors.alphaMin + Math.random() * (colors.alphaMax - colors.alphaMin)
      const color = `rgba(${colors.runeRgb}, ${p.alpha})`
      p.el.style.color = color
      p.el.style.textShadow = `0 0 8px rgba(${colors.runeRgb}, ${colors.glowAlpha})`
      // Update the mouseenter/leave handlers with the new color
      // (We can't easily remove old listeners, so we store the color on the element's dataset)
      p.el.dataset.runeAlpha = String(p.alpha)
    }
  }, [resolvedTheme])

  React.useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const makeRune = (i: number): RuneParticle => {
      const colors = colorsRef.current
      const w = window.innerWidth
      const h = window.innerHeight
      return {
        el: null,
        x: Math.random() * w,
        y: Math.random() * h,
        char: RUNES[i % RUNES.length]!,
        size: 14 + Math.random() * 18,
        alpha: colors.alphaMin + Math.random() * (colors.alphaMax - colors.alphaMin),
        // Drift upward (bottom → top), very slow — "like floating in space".
        // vx: tiny horizontal drift (almost none)
        vx: (Math.random() - 0.5) * 0.008,
        // vy: negative = upward. 0.05–0.12 px/frame ≈ 3–7 px/sec.
        // On an 852px screen, a rune takes ~2–5 minutes to travel bottom→top.
        vy: -(0.05 + Math.random() * 0.07),
        vr: (Math.random() - 0.5) * 0.0008,
        rot: Math.random() * Math.PI * 2,
      }
    }

    runesRef.current = Array.from({ length: RUNE_COUNT }, (_, i) => makeRune(i))

    // Create DOM elements for each rune
    runesRef.current.forEach((p) => {
      const colors = colorsRef.current
      const span = document.createElement('span')
      span.textContent = p.char
      span.style.cssText = `
        position: absolute;
        font-family: serif;
        font-weight: 700;
        font-size: ${p.size}px;
        color: rgba(${colors.runeRgb}, ${p.alpha});
        user-select: none;
        pointer-events: auto;
        cursor: pointer;
        will-change: transform;
        line-height: 1;
        text-shadow: 0 0 8px rgba(${colors.runeRgb}, ${colors.glowAlpha});
        transition: color 0.2s ease, text-shadow 0.2s ease;
      `
      const updateHover = (hover: boolean) => {
        const c = colorsRef.current
        const a = Math.min(parseFloat(span.dataset.runeAlpha || String(p.alpha)) + (hover ? c.hoverAlphaBoost : 0), 0.85)
        span.style.color = `rgba(${c.runeRgb}, ${a})`
        span.style.textShadow = `0 0 ${hover ? 14 : 8}px rgba(${c.runeRgb}, ${hover ? c.hoverGlowAlpha : c.glowAlpha})`
      }
      span.dataset.runeAlpha = String(p.alpha)
      span.addEventListener('mouseenter', () => updateHover(true))
      span.addEventListener('mouseleave', () => updateHover(false))
      span.addEventListener('click', (e) => {
        e.stopPropagation()
        explode(p)
      })
      container.appendChild(span)
      p.el = span
    })

    const explode = (rune: RuneParticle) => {
      const colors = colorsRef.current
      // Spawn stones
      for (let i = 0; i < STONES_PER_EXPLOSION; i++) {
        const angle = (Math.PI * 2 * i) / STONES_PER_EXPLOSION + (Math.random() - 0.5) * 0.6
        const speed = 1.5 + Math.random() * 3.5
        stonesRef.current.push({
          x: rune.x,
          y: rune.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          size: 2 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3,
          life: 1,
          rgb: colors.stoneRgb,
        })
      }
      // Respawn the rune at a new location with a new character + upward velocity
      const c = colorsRef.current
      rune.x = Math.random() * window.innerWidth
      rune.y = Math.random() * window.innerHeight
      rune.char = RUNES[Math.floor(Math.random() * RUNES.length)]!
      rune.alpha = c.alphaMin + Math.random() * (c.alphaMax - c.alphaMin)
      rune.vx = (Math.random() - 0.5) * 0.008
      rune.vy = -(0.05 + Math.random() * 0.07)
      if (rune.el) {
        rune.el.textContent = rune.char
        rune.el.dataset.runeAlpha = String(rune.alpha)
        rune.el.style.color = `rgba(${c.runeRgb}, ${rune.alpha})`
        rune.el.style.textShadow = `0 0 8px rgba(${c.runeRgb}, ${c.glowAlpha})`
      }
    }

    const tick = (now: number) => {
      const dt = lastTimeRef.current ? Math.min((now - lastTimeRef.current) / 16.67, 3) : 1
      lastTimeRef.current = now

      // Drift runes
      if (!reduced) {
        for (const p of runesRef.current) {
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.rot += p.vr * dt
          if (p.x < -p.size) p.x = window.innerWidth + p.size
          if (p.x > window.innerWidth + p.size) p.x = -p.size
          if (p.y < -p.size) p.y = window.innerHeight + p.size
          if (p.y > window.innerHeight + p.size) p.y = -p.size
          if (p.el) {
            p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}rad)`
          }
        }
      } else {
        for (const p of runesRef.current) {
          if (p.el && !p.el.style.transform) {
            p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}rad)`
          }
        }
      }

      // Update + render stones
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const stones = stonesRef.current
      for (let i = stones.length - 1; i >= 0; i--) {
        const s = stones[i]!
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vy += 0.04 * dt
        s.vx *= 0.99
        s.rot += s.vr * dt
        s.life -= dt / (EXPLOSION_LIFETIME / 16.67)
        if (s.life <= 0) {
          stones.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rot)
        ctx.fillStyle = `rgba(${s.rgb}, ${Math.max(0, s.life)})`
        const sz = s.size
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz)
        ctx.strokeStyle = `rgba(${s.rgb}, ${Math.max(0, s.life * 0.5)})`
        ctx.lineWidth = 0.5
        ctx.strokeRect(-sz / 2, -sz / 2, sz, sz)
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    const onVis = () => {
      if (document.hidden && rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        lastTimeRef.current = 0
      } else if (!document.hidden && !rafRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      runesRef.current.forEach((p) => p.el?.remove())
      runesRef.current = []
      stonesRef.current = []
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ zIndex: 0 }}
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />
    </div>
  )
}

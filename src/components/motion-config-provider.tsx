'use client'

import * as React from 'react'
import { MotionConfig } from 'framer-motion'

/**
 * MotionConfigProvider — wraps the app in framer-motion's `<MotionConfig>`
 * with `reducedMotion="user"`. This makes EVERY framer-motion animation
 * in the tree automatically respect the user's `prefers-reduced-motion`
 * OS / browser setting (WCAG 2.1 SC 2.3.3 — Animation from Interactions).
 *
 * When reduced motion is preferred, framer-motion:
 *   - skips transform-based animations (translate / rotate / scale),
 *   - keeps opacity-only transitions (which aren't "motion"),
 *   - disables stagger sequencing.
 *
 * This is the recommended global approach per the framer-motion docs,
 * replacing the per-component `useReducedMotion()` polling pattern.
 *
 * NOTE: this only affects framer-motion animations. CSS keyframe animations
 * (`.mist-layer`, `.pulse-amber`, sheet slide-ins, etc.) are handled by the
 * `@media (prefers-reduced-motion: reduce)` block in globals.css.
 */
export function MotionConfigProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'tween' }}>
      {children}
    </MotionConfig>
  )
}

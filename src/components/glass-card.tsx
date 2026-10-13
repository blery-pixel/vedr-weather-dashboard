import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * GlassCard — glassmorphic card overlay with Scottish Highlands palette.
 * Uses backdrop blur + translucent surfaces for the atmospheric look.
 */
export function GlassCard({
  className,
  children,
  glow = false,
  as: Comp = 'div',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean
  as?: React.ElementType
}) {
  return (
    <Comp
      className={cn(
        'glass-card relative flex h-full flex-col overflow-hidden rounded-xl',
        glow && 'amber-glow',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

/**
 * CardLabel — small uppercase tracking-wide label for the metric cards.
 * Uses the default sans-serif bold (Geist 700) rather than the decorative
 * Norse-Bold runic face — feels like a "normal bold font" for clarity.
 *
 * Note on contrast: light-theme `--muted-foreground` was darkened from
 * #6B7F8B (3.28:1 — failed WCAG AA) to #475461 (≈6.5:1 — passes AA +
 * approaches AAA) in globals.css. CardLabel inherits this token, so
 * the small gray titles now meet WCAG 1.4.3 in both themes.
 */
export function CardLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Sparkline — tiny inline SVG line chart for embedding in tight spaces
 * (e.g. the hero's 24h temperature trail). No axes, no tooltip — just the
 * shape with an optional gradient fill and a "now" dot.
 */
export function Sparkline({
  data,
  width = 220,
  height = 44,
  stroke = '#E68A2E',
  fill = true,
  showDot = true,
  className,
  ariaLabel,
}: {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: boolean
  showDot?: boolean
  className?: string
  ariaLabel?: string
}) {
  const id = React.useId()
  if (!data.length) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const w = width
  const h = height
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1)

  const points = data.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (h - pad * 2) * (1 - (v - min) / range)
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${h - pad} L ${points[0][0].toFixed(2)} ${h - pad} Z`

  const last = points[points.length - 1]

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={ariaLabel ?? '24-hour temperature sparkline'}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#spark-${id})`} stroke="none" />}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <>
          <circle cx={last[0]} cy={last[1]} r={2.75} fill={stroke} />
          <circle cx={last[0]} cy={last[1]} r={5} fill={stroke} fillOpacity={0.18} />
        </>
      )}
    </svg>
  )
}

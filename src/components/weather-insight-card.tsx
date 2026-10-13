'use client'

import * as React from 'react'
import { Sparkles, Wind, Droplets, Sun, AlertTriangle, Printer } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import { buildInsight } from '@/lib/weather-insight'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

const toneClasses: Record<string, string> = {
  amber: 'border-scot-amber/40 bg-scot-amber/10 text-scot-amber',
  loch: 'border-scot-loch/40 bg-scot-loch/10 text-scot-loch',
  heather: 'border-scot-heather/40 bg-scot-heather/15 text-scot-heather',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
}

export function WeatherInsightCard({ data }: { data: WeatherApiResponse }) {
  const insight = React.useMemo(() => buildInsight(data), [data])

  return (
    <GlassCard className="fade-up relative overflow-hidden p-5" aria-label="Weather insight briefing">
      {/* Amber radial glow in the corner */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(230,138,46,0.18) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-amber/15 text-scot-amber">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardLabel>Highland Briefing</CardLabel>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                {insight.title}
              </h3>
            </div>
          </div>
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-border/40 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-scot-amber"
                  onClick={() => {
                    // Open a clean printable window with just the briefing.
                    const w = window.open('', '_blank', 'width=520,height=720')
                    if (!w) return
                    w.document.write(`<!doctype html><html><head><title>${insight.title} — ${data.location.name}</title>
                      <style>
                        body{font-family:Georgia,'Times New Roman',serif;max-width:42rem;margin:3rem auto;padding:0 1.5rem;color:#1a2721;background:#f4f6f5}
                        h1{font-size:1.5rem;margin:0 0 .25rem;color:#1C3125}
                        .meta{color:#788A87;font-size:.8rem;margin-bottom:1.5rem}
                        p{line-height:1.6;font-size:1rem}
                        .tags{margin-top:1.5rem;display:flex;gap:.5rem;flex-wrap:wrap}
                        .tag{border:1px solid #788A87;border-radius:999px;padding:.25rem .75rem;font-size:.75rem;color:#1C3125}
                        .accent{height:4px;background:linear-gradient(90deg,#1C3125,#E68A2E,#6B4E5B);margin-bottom:1.5rem;border-radius:2px}
                        footer{margin-top:2.5rem;font-size:.7rem;color:#788A87;border-top:1px solid #e6eae8;padding-top:.75rem}
                      </style></head><body>
                      <div class="accent"></div>
                      <h1>${insight.title}</h1>
                      <div class="meta">${data.location.name}, ${data.location.region} · ${new Date(data.current.time).toLocaleString('en-GB')}</div>
                      <p>${insight.body}</p>
                      <div class="tags">${insight.tags.map((t) => `<span class="tag">${t.label}</span>`).join('')}</div>
                      <footer>Veðr · Weather Dashboard · ${data.dataSource === 'open-meteo' ? 'Live (Open-Meteo)' : 'Atmospheric simulation'}</footer>
                      </body></html>`)
                    w.document.close()
                    w.focus()
                    setTimeout(() => w.print(), 350)
                  }}
                  aria-label="Print or export briefing as PDF"
                >
                  <Printer className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Print / export PDF
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {insight.body}
        </p>

        {insight.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {insight.tags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold',
                  toneClasses[tag.tone] ?? toneClasses.loch,
                )}
              >
                {tag.tone === 'amber' && <AlertTriangle className="h-3 w-3" aria-hidden />}
                {tag.tone === 'loch' && <Droplets className="h-3 w-3" aria-hidden />}
                {tag.tone === 'green' && <Sun className="h-3 w-3" aria-hidden />}
                {tag.tone === 'heather' && <Wind className="h-3 w-3" aria-hidden />}
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  )
}

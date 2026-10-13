'use client'

import * as React from 'react'
import { BookOpen, Volume2 } from 'lucide-react'
import { GlassCard, CardLabel } from '@/components/glass-card'
import type { WeatherCondition } from '@/lib/weather-types'
import { cn } from '@/lib/utils'

interface GlossaryEntry {
  term: string
  ipa: string
  meaning: string
  conditions: WeatherCondition[]
  tone: 'amber' | 'loch' | 'heather' | 'green'
}

const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'Dreich',
    ipa: '/driːç/',
    meaning: 'Dark, wet, dreary — the archetypal Scottish weather day. Bleak and damp.',
    conditions: ['rain', 'drizzle', 'overcast', 'heavy-rain'],
    tone: 'loch',
  },
  {
    term: 'Haar',
    ipa: '/hɑːr/',
    meaning: 'A cold sea-fog that creeps in from the North Sea along the east coast.',
    conditions: ['fog', 'mist'],
    tone: 'loch',
  },
  {
    term: 'Smirr',
    ipa: '/smɪr/',
    meaning: 'Fine, drifting rain or mist — so light you barely feel it, but soaks you through.',
    conditions: ['drizzle', 'mist'],
    tone: 'loch',
  },
  {
    term: 'Plowtery',
    ipa: '/ˈplʌʊtəri/',
    meaning: 'Of weather: showery, unsettled, fitfully wet — on-and-off all day.',
    conditions: ['rain', 'drizzle'],
    tone: 'loch',
  },
  {
    term: 'Gowan',
    ipa: '/ˈɡʌʊən/',
    meaning: 'A wild daisy on the hill — a sign of fair, mild weather on the strath.',
    conditions: ['clear', 'partly-cloudy'],
    tone: 'amber',
  },
  {
    term: 'Braw',
    ipa: '/brɑː/',
    meaning: 'Fine, splendid, beautiful — "a braw bricht moonlicht nicht" for a clear night.',
    conditions: ['clear'],
    tone: 'amber',
  },
  {
    term: 'Snell',
    ipa: '/snɛl/',
    meaning: 'Bitingly cold, piercing — a snell wind cuts right through to the bone.',
    conditions: ['snow', 'sleet'],
    tone: 'heather',
  },
  {
    term: 'Flindrikin',
    ipa: '/ˈflɪndrɪkɪn/',
    meaning: 'A light, brief shower — over before you can fetch your waterproof.',
    conditions: ['drizzle', 'rain'],
    tone: 'loch',
  },
  {
    term: 'Blinter',
    ipa: '/ˈblɪntər/',
    meaning: 'A fleeting gleam of sunshine between the clouds — blink and you miss it.',
    conditions: ['partly-cloudy', 'cloudy'],
    tone: 'amber',
  },
  {
    term: 'Gorblin',
    ipa: '/ˈɡɔːrblɪn/',
    meaning: 'A short-lived storm — a brief, fierce blow that passes quickly.',
    conditions: ['thunderstorm'],
    tone: 'heather',
  },
]

const toneClasses: Record<string, string> = {
  amber: 'border-scot-amber/40 bg-scot-amber/10 text-scot-amber',
  loch: 'border-scot-loch/40 bg-scot-loch/10 text-scot-loch',
  heather: 'border-scot-heather/40 bg-scot-heather/15 text-scot-heather',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
}

/**
 * ScottishGlossaryCard — a cultural glossary of Scots weather terms, with the
 * ones matching the current condition highlighted. Adds Highland atmosphere +
 * educational depth. Each entry shows the term, IPA pronunciation, meaning,
 * and a speak-aloud button (Web Speech API).
 */
export function ScottishGlossaryCard({ condition }: { condition: WeatherCondition }) {
  const [speaking, setSpeaking] = React.useState<string | null>(null)

  const speak = (entry: GlossaryEntry) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(entry.term)
    u.lang = 'en-GB'
    u.rate = 0.85
    u.onend = () => setSpeaking(null)
    setSpeaking(entry.term)
    window.speechSynthesis.speak(u)
  }

  return (
    <GlassCard className="fade-up p-5" aria-label="Scottish weather glossary">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-scot-heather/15 text-scot-heather">
            <BookOpen className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardLabel>Leid o' the Glens</CardLabel>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Scots weather tongue</h3>
          </div>
        </div>
        <span className="text-[0.65rem] text-muted-foreground">{GLOSSARY.length} terms</span>
      </div>

      <ul className="space-y-1.5" role="list">
        {GLOSSARY.map((g) => {
          const active = g.conditions.includes(condition)
          return (
            <li
              key={g.term}
              className={cn(
                'flex items-start gap-2.5 rounded-md border px-3 py-2 transition',
                active ? toneClasses[g.tone] : 'border-transparent bg-card/30',
              )}
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn('text-sm font-bold', active ? '' : 'text-foreground')}>{g.term}</span>
                  <span className="text-[0.65rem] text-muted-foreground tabular-nums">{g.ipa}</span>
                  {active && (
                    <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider">
                      Now
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{g.meaning}</p>
              </div>
              <button
                onClick={() => speak(g)}
                aria-label={`Pronounce ${g.term}`}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  speaking === g.term ? 'text-scot-amber' : 'text-muted-foreground',
                )}
              >
                <Volume2 className={cn('h-3.5 w-3.5', speaking === g.term && 'animate-pulse')} aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 border-t border-border/40 pt-2 text-[0.65rem] text-muted-foreground">
        Tap the speaker to hear each word. Terms matching the current condition are highlighted.
      </p>
    </GlassCard>
  )
}

'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Settings, Thermometer, Wind, Ruler, Star, Trash2, Accessibility } from 'lucide-react'
import {
  usePreferences,
  type TempUnit,
  type SpeedUnit,
  type DistanceUnit,
} from '@/lib/use-preferences'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

/**
 * SettingsSheet — a slide-in panel for user preferences: temperature / wind /
 * distance units, theme, reduced-motion readout, and a "clear favourites"
 * action. Reflects + mutates the persisted Zustand store.
 *
 * Uses the `.solid-panel` class (opaque background) instead of `.glass-card`
 * (translucent) so the panel content remains readable when overlaid on the
 * busy dashboard — earlier regression: buttons were nearly invisible due to
 * stacked transparency (glass-card 55% + bg-card/30 + border-border/40).
 */
export function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const tempUnit = usePreferences((s) => s.tempUnit)
  const speedUnit = usePreferences((s) => s.speedUnit)
  const distanceUnit = usePreferences((s) => s.distanceUnit)
  const setTempUnit = usePreferences((s) => s.setTempUnit)
  const setSpeedUnit = usePreferences((s) => s.setSpeedUnit)
  const setDistanceUnit = usePreferences((s) => s.setDistanceUnit)
  const favourites = usePreferences((s) => s.favourites)
  const clearFavourites = usePreferences((s) => s.clearFavourites)

  const { theme, setTheme } = useTheme()

  const [reduceMotion, setReduceMotion] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="solid-panel w-full overflow-y-auto border-border p-0 sm:max-w-md">
        <div className="h-1.5 w-full bg-gradient-to-r from-scot-green via-scot-amber to-scot-heather" aria-hidden />
        <SheetHeader className="space-y-2 p-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Settings className="h-5 w-5 text-scot-amber" aria-hidden />
            Dashboard Settings
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Preferences persist to your browser. Tune units, theme, and accessibility.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5 pt-1">
          {/* Temperature unit */}
          <SettingGroup icon={<Thermometer className="h-4 w-4" />} label="Temperature">
            <SegmentedControl<TempUnit>
              value={tempUnit}
              onChange={setTempUnit}
              options={[
                { value: 'c', label: '°C' },
                { value: 'f', label: '°F' },
              ]}
            />
          </SettingGroup>

          {/* Wind unit */}
          <SettingGroup icon={<Wind className="h-4 w-4" />} label="Wind speed">
            <SegmentedControl<SpeedUnit>
              value={speedUnit}
              onChange={setSpeedUnit}
              options={[
                { value: 'kmh', label: 'km/h' },
                { value: 'mph', label: 'mph' },
              ]}
            />
          </SettingGroup>

          {/* Distance unit */}
          <SettingGroup icon={<Ruler className="h-4 w-4" />} label="Distance">
            <SegmentedControl<DistanceUnit>
              value={distanceUnit}
              onChange={setDistanceUnit}
              options={[
                { value: 'km', label: 'km' },
                { value: 'mi', label: 'mi' },
              ]}
            />
          </SettingGroup>

          {/* Theme */}
          <SettingGroup icon={<Settings className="h-4 w-4" />} label="Theme">
            <SegmentedControl<string>
              value={theme ?? 'dark'}
              onChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </SettingGroup>

          {/* Accessibility — reduced motion readout */}
          <SettingGroup icon={<Accessibility className="h-4 w-4" />} label="Accessibility">
            <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
              <span className="text-card-foreground/80">Reduced motion</span>
              <span className={cn('font-semibold', reduceMotion ? 'text-emerald-500' : 'text-muted-foreground')}>
                {reduceMotion ? 'On (animations disabled)' : 'Off (system default)'}
              </span>
            </div>
            <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
              Toggle via your OS accessibility settings. All particle + parallax effects respect this preference.
            </p>
          </SettingGroup>

          {/* Favourites management */}
          <SettingGroup icon={<Star className="h-4 w-4" />} label={`Favourites (${favourites.length})`}>
            {favourites.length > 0 ? (
              <button
                onClick={() => clearFavourites()}
                className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/15 px-3 py-2 text-xs font-semibold text-destructive shadow-sm transition hover:bg-destructive/25 hover:border-destructive/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Clear all favourites
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">No favourites yet. Press F on any location to add it.</p>
            )}
          </SettingGroup>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SettingGroup({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-scot-loch">{icon}</span>
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

/**
 * SegmentedControl — accessible radiogroup pattern (WAI-ARIA APG).
 *
 * Keyboard navigation (roving tabindex + arrow keys):
 *   - Tab into the group → the selected option receives focus.
 *   - ArrowLeft / ArrowUp → move focus to the previous option (wrap to end).
 *   - ArrowRight / ArrowDown → move focus to the next option (wrap to start).
 *   - Home / End → first / last option.
 *   - Enter / Space (browser-default for <button>) → activate the focused option.
 *
 * Only the selected option has tabIndex={0}; others have tabIndex={-1} so
 * the whole group is a single tab stop (per the ARIA radiogroup pattern).
 * Previously all buttons were independently tabbable — a keyboard
 * accessibility regression flagged in the audit.
 */
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const focusOption = (i: number) => {
    const idx = (i + options.length) % options.length
    refs.current[idx]?.focus()
    onChange(options[idx].value)
  }

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        focusOption(i - 1)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        focusOption(i + 1)
        break
      case 'Home':
        e.preventDefault()
        focusOption(0)
        break
      case 'End':
        e.preventDefault()
        focusOption(options.length - 1)
        break
      default:
        // letter / number → ARIA APG allows type-ahead, omitted for brevity
        break
    }
  }

  return (
    <div
      role="radiogroup"
      className="flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-sm"
    >
      {options.map((o, i) => {
        const selected = value === o.value
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el }}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onFocus={() => {
              // Activating focus on a non-selected option also selects it
              // (per ARIA APG radiogroup pattern — "focus also selects").
              if (!selected) onChange(o.value)
            }}
            className={cn(
              'flex-1 rounded px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              selected
                ? 'bg-scot-amber text-scot-amber-foreground shadow-sm'
                : 'text-card-foreground/70 hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

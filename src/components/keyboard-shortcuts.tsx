'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

export interface ShortcutDef {
  keys: string[]
  label: string
  group: string
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: ['/'], label: 'Focus location search', group: 'Navigation' },
  { keys: ['N'], label: 'Next glen', group: 'Navigation' },
  { keys: ['P'], label: 'Previous glen', group: 'Navigation' },
  { keys: ['T'], label: 'Toggle dark / light theme', group: 'Navigation' },
  { keys: ['R'], label: 'Refresh weather data', group: 'Navigation' },
  { keys: ['L'], label: 'Use my location', group: 'Navigation' },
  { keys: ['F'], label: 'Add / remove favourite', group: 'Navigation' },
  { keys: [','], label: 'Open settings', group: 'Navigation' },
  { keys: ['?'], label: 'Show this shortcuts dialog', group: 'Navigation' },
  { keys: ['1', '2', '3'], label: 'Switch trend chart tab', group: 'Charts' },
  { keys: ['←', '→'], label: 'Scroll hourly forecast', group: 'Charts' },
  { keys: ['Esc'], label: 'Close dialog / popover', group: 'General' },
]

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const groups = React.useMemo(() => {
    const m = new Map<string, ShortcutDef[]>()
    for (const s of SHORTCUTS) {
      if (!m.has(s.group)) m.set(s.group, [])
      m.get(s.group)!.push(s)
    }
    return [...m.entries()]
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="solid-panel max-w-md gap-0 border-border p-0 sm:rounded-xl">
        <div className="h-1 w-full bg-gradient-to-r from-scot-green via-scot-amber to-scot-heather" aria-hidden />
        <DialogHeader className="space-y-2 p-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Keyboard className="h-5 w-5 text-scot-amber" aria-hidden />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Navigate the dashboard hands-free. Shortcuts are ignored while typing in the search box.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5 pt-1">
          {groups.map(([group, defs]) => (
            <div key={group}>
              <h3 className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group}
              </h3>
              <ul className="space-y-1.5">
                {defs.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground">{s.label}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 text-[0.7rem] font-semibold text-foreground shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook that registers a global keydown listener for the dashboard shortcuts.
 * Ignores key events when the target is an editable input / textarea / select
 * or inside a contenteditable element (so the search box still works normally).
 */
export function useKeyboardShortcuts(handlers: {
  onSearch?: () => void
  onToggleTheme?: () => void
  onRefresh?: () => void
  onLocate?: () => void
  onToggleFavourite?: () => void
  onShowShortcuts?: () => void
  onTab?: (idx: number) => void
  onScrollHours?: (dir: 1 | -1) => void
  onNextLocation?: () => void
  onPrevLocation?: () => void
  onOpenSettings?: () => void
}) {
  React.useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null
      if (!node) return false
      const tag = node.tagName
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        node.isContentEditable ||
        node.getAttribute('role') === 'combobox' ||
        node.getAttribute('role') === 'textbox'
      )
    }

    const onKey = (e: KeyboardEvent) => {
      // Esc always allowed
      if (e.key === 'Escape') return
      if (isEditable(e.target)) return
      // Ignore modifier combos (so browser shortcuts still work)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const k = e.key.toLowerCase()
      switch (k) {
        case '/':
          e.preventDefault()
          handlers.onSearch?.()
          break
        case 'n':
          e.preventDefault()
          handlers.onNextLocation?.()
          break
        case 'p':
          e.preventDefault()
          handlers.onPrevLocation?.()
          break
        case ',':
          e.preventDefault()
          handlers.onOpenSettings?.()
          break
        case 't':
          e.preventDefault()
          handlers.onToggleTheme?.()
          break
        case 'r':
          e.preventDefault()
          handlers.onRefresh?.()
          break
        case 'l':
          e.preventDefault()
          handlers.onLocate?.()
          break
        case 'f':
          e.preventDefault()
          handlers.onToggleFavourite?.()
          break
        case '?':
          e.preventDefault()
          handlers.onShowShortcuts?.()
          break
        case '1':
          handlers.onTab?.(0)
          break
        case '2':
          handlers.onTab?.(1)
          break
        case '3':
          handlers.onTab?.(2)
          break
        case 'arrowleft':
          e.preventDefault()
          handlers.onScrollHours?.(-1)
          break
        case 'arrowright':
          e.preventDefault()
          handlers.onScrollHours?.(1)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers])
}

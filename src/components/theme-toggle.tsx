'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Mountain } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const current = mounted ? (resolvedTheme ?? theme) : 'dark'
  const isDark = current === 'dark'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative h-10 w-10 overflow-hidden border-border/60 bg-card/40 backdrop-blur-md hover:bg-accent/20 hover:text-accent-foreground"
    >
      {!mounted ? (
        <Mountain className="h-[1.15rem] w-[1.15rem] text-scot-loch" />
      ) : isDark ? (
        <Sun
          className="h-[1.15rem] w-[1.15rem] text-scot-amber transition-all duration-300"
          aria-hidden
        />
      ) : (
        <Moon
          className="h-[1.15rem] w-[1.15rem] text-scot-green transition-all duration-300"
          aria-hidden
        />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

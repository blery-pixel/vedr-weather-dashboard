'use client'

import * as React from 'react'
import {
  Check,
  ChevronsUpDown,
  MapPin,
  RefreshCw,
  LocateFixed,
  Star,
  StarOff,
  Keyboard,
  Share2,
  Check as CheckIcon,
  Settings,
  Globe,
  Menu,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ThemeToggle } from '@/components/theme-toggle'
import { UnitToggle } from '@/components/unit-toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { fmtTime } from '@/lib/weather-utils'
import { usePreferences } from '@/lib/use-preferences'

export interface LocationOption {
  value: string
  label: string
  region: string
  /** Present for worldwide (coordinate-backed) locations. */
  lat?: number
  lon?: number
  country?: string
}

export function WeatherHeader({
  locations,
  currentLocation,
  currentLocationLabel,
  currentLocationRegion,
  onLocationChange,
  onRefresh,
  onLocate,
  onShare,
  onShowShortcuts,
  onOpenSettings,
  locating,
  updatedAt,
  dataSource,
  loading,
  comboboxRef,
}: {
  locations: LocationOption[]
  currentLocation: string
  /** Display label for the active location (may be a worldwide city not in `locations`). */
  currentLocationLabel?: string
  /** Display region/country for the active location. */
  currentLocationRegion?: string
  onLocationChange: (value: string) => void
  onRefresh?: () => void
  onLocate?: () => void
  onShare?: () => void
  onShowShortcuts?: () => void
  onOpenSettings?: () => void
  locating?: boolean
  updatedAt?: string
  dataSource?: 'open-meteo' | 'mock'
  loading?: boolean
  comboboxRef?: React.RefObject<HTMLButtonElement>
}) {
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const isDark = mounted ? (resolvedTheme === 'dark') : true
  const active = locations.find((l) => l.value === currentLocation)
  // The displayed label/region: prefer the explicit props (covers worldwide
  // cities), else fall back to the static `locations` lookup.
  const activeLabel = currentLocationLabel ?? active?.label
  const activeRegion = currentLocationRegion ?? active?.region
  const favourites = usePreferences((s) => s.favourites)
  const toggleFav = usePreferences((s) => s.toggleFavourite)
  const recordMeta = usePreferences((s) => s.recordLocationMeta)
  const locationMeta = usePreferences((s) => s.locationMeta)
  const isFav = favourites.includes(currentLocation)
  // Resolve favourite LocationOptions from the meta cache (covers worldwide
  // coordinate-backed favourites whose labels aren't in the static list).
  const favLocations: LocationOption[] = React.useMemo(
    () =>
      favourites
        .map((v) => {
          const m = locationMeta[v]
          if (m) return { value: m.value, label: m.label, region: m.region, country: m.country, lat: m.lat, lon: m.lon }
          const known = locations.find((l) => l.value === v)
          return known ?? null
        })
        .filter(Boolean) as LocationOption[],
    [favourites, locationMeta, locations],
  )

  // ---- Debounced worldwide geocode search (client-side → Open-Meteo) ----
  // The browser fetches the Open-Meteo geocoding API directly (the server
  // runtime in some sandboxes can't reach external APIs). Falls back to the
  // /api/geocode route (which returns the curated Scottish defaults).
  const [search, setSearch] = React.useState('')
  const [results, setResults] = React.useState<LocationOption[]>([])
  const [searching, setSearching] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    const q = search.trim()
    if (!q) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      const ctrl = new AbortController()
      const to = setTimeout(() => ctrl.abort(), 6000)
      try {
        // Try the Open-Meteo geocoding API directly from the browser first
        // (supports CORS, worldwide coverage).
        let res: Response | null = null
        try {
          res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=12&language=en&format=json`,
            { signal: ctrl.signal },
          )
        } catch {
          res = null
        }
        if (!res || !res.ok) {
          // Fallback to the server route (curated Scottish defaults).
          res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        }
        clearTimeout(to)
        if (!cancelled && res.ok) {
          const data = await res.json()
          const raw: any[] = data.results ?? []
          // Server fallback returns GeocodeResult with lat/lon; the direct
          // Open-Meteo response uses latitude/longitude. Normalise both.
          const normalised: LocationOption[] = raw.map((r) => ({
            value: r.value ?? `${r.latitude},${r.longitude}`,
            label: r.label ?? r.name,
            region: r.region ?? r.admin1 ?? r.admin2 ?? '',
            country: r.country ?? '',
            lat: r.lat ?? r.latitude,
            lon: r.lon ?? r.longitude,
          }))
          // Prefer Scottish defaults whose label matches (so 'inverness' uses
          // the named-key version, not the coordinate version). Dedupe
          // worldwide results against those defaults by label.
          const matchingDefaults = locations.filter(
            (d) =>
              d.label.toLowerCase().includes(q.toLowerCase()) ||
              d.region.toLowerCase().includes(q.toLowerCase()),
          )
          const seenDefaults = new Set(matchingDefaults.map((d) => d.label.toLowerCase()))
          const merged = [...matchingDefaults, ...normalised.filter((r) => !seenDefaults.has(r.label.toLowerCase()))]
          if (!cancelled) setResults(merged.slice(0, 12))
        }
      } catch {
        /* keep previous results */
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 280)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [search, open, locations])

  // Record the selected location's metadata so favourites + URL sync work for
  // worldwide coordinate-backed cities.
  const pick = (loc: LocationOption) => {
    recordMeta({
      value: loc.value,
      label: loc.label,
      region: loc.region,
      country: loc.country,
      lat: loc.lat,
      lon: loc.lon,
    })
    onLocationChange(loc.value)
    setOpen(false)
  }

  const handleShare = () => {
    if (onShare) {
      onShare()
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55"
      role="banner"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8">
        {/* Brand — word-only button, no logo. No full-reload (preserves the
         * Norse font styling + state); scrolls to top instead. */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
          className="font-norse group flex shrink-0 items-center rounded-md px-2.5 py-1 text-2xl tracking-tight text-foreground transition-colors hover:text-scot-amber focus-visible:text-scot-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Veðr — home"
        >
          Veðr
        </button>

        {/* Location combobox */}
        <div className="relative min-w-0 flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={comboboxRef}
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label="Select location (press slash to focus)"
                className="h-10 w-full justify-between gap-2 border-border/50 bg-card/40 px-3 font-normal backdrop-blur-md hover:bg-accent/15 focus-visible:ring-2 focus-visible:ring-scot-amber/60 sm:max-w-xs"
              >
                <span className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 shrink-0 text-scot-amber" aria-hidden />
                  <span className="truncate text-sm">
                    {activeLabel ? `${activeLabel}${activeRegion ? `, ${activeRegion}` : ''}` : 'Select location…'}
                  </span>
                  {isFav && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-scot-amber text-scot-amber" aria-hidden />
                  )}
                </span>
                <kbd
                  className="font-norse hidden h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 text-[0.6rem] font-medium text-muted-foreground sm:flex"
                  aria-hidden
                >
                  /
                </kbd>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search any city worldwide…"
                  className="h-9"
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList className="max-h-80">
                  {searching && (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      Searching the globe…
                    </div>
                  )}
                  {!searching && search.trim() && results.length === 0 && (
                    <CommandEmpty>No location found — try another spelling.</CommandEmpty>
                  )}

                  {/* Empty state — prompt to start typing for worldwide search */}
                  {!searching && !search.trim() && favLocations.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
                      <Globe className="h-8 w-8 text-scot-amber/60" aria-hidden />
                      <p className="text-sm font-medium text-foreground">Search any city worldwide</p>
                      <p className="text-xs text-muted-foreground">
                        Start typing to find weather for any location on Earth — cities, towns, coordinates.
                      </p>
                    </div>
                  )}

                  {/* Favourites (only when not searching, to reduce clutter) */}
                  {!search.trim() && favLocations.length > 0 && (
                    <>
                      <CommandGroup heading="Favourites">
                        {favLocations.map((loc) => (
                          <CommandItem
                            key={`fav-${loc.value}`}
                            value={`${loc.label} ${loc.region} ${loc.country ?? ''}`}
                            onSelect={() => pick(loc)}
                            className="gap-2"
                          >
                            <Star className="h-3.5 w-3.5 shrink-0 fill-scot-amber text-scot-amber" aria-hidden />
                            <span className="flex-1 truncate">{loc.label}</span>
                            <span className="text-xs text-muted-foreground">{loc.region || loc.country}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {/* Worldwide search results */}
                  {!searching && search.trim() && results.length > 0 && (
                    <CommandGroup heading="Worldwide results">
                      {results.map((loc) => (
                        <CommandItem
                          key={`geo-${loc.value}`}
                          value={`${loc.label} ${loc.region} ${loc.country ?? ''}`}
                          onSelect={() => pick(loc)}
                          className="group/item gap-2"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0 text-scot-loch" aria-hidden />
                          <span className="flex-1 truncate">{loc.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {[loc.region, loc.country].filter(Boolean).join(', ')}
                          </span>
                          <button
                            type="button"
                            aria-label={
                              favourites.includes(loc.value)
                                ? `Remove ${loc.label} from favourites`
                                : `Add ${loc.label} to favourites`
                            }
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              pick(loc)
                              toggleFav(loc.value)
                            }}
                            className="ml-1 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-accent/15 hover:text-scot-amber focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                            tabIndex={-1}
                          >
                            {favourites.includes(loc.value) ? (
                              <Star className="h-3.5 w-3.5 fill-scot-amber text-scot-amber" aria-hidden />
                            ) : (
                              <StarOff className="h-3.5 w-3.5 opacity-0 transition group-hover/item:opacity-100" aria-hidden />
                            )}
                          </button>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <UnitToggle />

          <div
            className="hidden items-center gap-2 rounded-md border border-border/40 bg-card/30 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur-md md:flex"
            title="Last data refresh"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                loading ? 'animate-pulse bg-scot-amber' : 'bg-emerald-500/80',
              )}
              aria-hidden
            />
            <span>
              {updatedAt ? fmtTime(updatedAt) : '—'}
              {dataSource && (
                <span className="ml-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  · {dataSource === 'mock' ? 'sim' : 'live'}
                </span>
              )}
            </span>
          </div>

          {/* Favourite toggle for current location */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-border/50 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-scot-amber"
                  onClick={() => toggleFav(currentLocation)}
                  aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                  aria-pressed={isFav}
                >
                  <Star
                    className={cn(
                      'h-[1.1rem] w-[1.1rem] transition',
                      isFav && 'fill-scot-amber text-scot-amber',
                    )}
                    aria-hidden
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isFav ? 'Remove from favourites' : 'Add to favourites'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Geolocation */}
          {onLocate && (
            <TooltipProvider delayDuration={400}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden h-10 w-10 border-border/50 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-scot-amber md:inline-flex"
                    onClick={onLocate}
                    aria-label="Use my location"
                    disabled={locating}
                  >
                    <LocateFixed className={cn('h-[1.1rem] w-[1.1rem]', locating && 'animate-spin')} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Use my location
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="hidden h-10 w-10 border-border/50 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-accent-foreground md:inline-flex"
              onClick={onRefresh}
              aria-label="Refresh weather data (press R)"
              disabled={loading}
            >
              <RefreshCw className={cn('h-[1.1rem] w-[1.1rem]', loading && 'animate-spin')} aria-hidden />
            </Button>
          )}

          {/* Share link */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="hidden h-10 w-10 border-border/50 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-accent-foreground lg:inline-flex"
                  onClick={handleShare}
                  aria-label="Copy shareable link to this location"
                >
                  {copied ? (
                    <CheckIcon className="h-[1.1rem] w-[1.1rem] text-emerald-500" aria-hidden />
                  ) : (
                    <Share2 className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {copied ? 'Link copied!' : 'Copy shareable link'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Shortcuts help */}
          {onShowShortcuts && (
            <TooltipProvider delayDuration={400}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden h-10 w-10 border-border/50 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-accent-foreground lg:inline-flex"
                    onClick={onShowShortcuts}
                    aria-label="Keyboard shortcuts (press question mark)"
                  >
                    <Keyboard className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Shortcuts ?
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Settings */}
          {onOpenSettings && (
            <TooltipProvider delayDuration={400}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden h-10 w-10 border-border/50 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-accent-foreground md:inline-flex"
                    onClick={onOpenSettings}
                    aria-label="Open settings"
                  >
                    <Settings className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Settings
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Mobile hamburger — visible only on mobile (sm:hidden).
              Consolidates secondary buttons (Locate, Refresh, Settings, etc.)
              so the header doesn't overflow on narrow viewports. */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-border/50 bg-card/40 backdrop-blur-md hover:bg-accent/15 hover:text-accent-foreground md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-[1.1rem] w-[1.1rem]" aria-hidden />
          </Button>

          {/* Theme toggle — hidden on mobile (inside hamburger menu instead) */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu Sheet — slide-in panel with secondary actions */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="solid-panel w-full border-border p-0 sm:max-w-xs">
          <div className="h-1.5 w-full bg-gradient-to-r from-scot-green via-scot-amber to-scot-heather" aria-hidden />
          <SheetHeader className="space-y-2 p-5 pb-3">
            <SheetTitle className="flex items-center gap-2 text-xl tracking-tight">
              <Menu className="h-5 w-5 text-scot-amber" aria-hidden />
              Menu
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Quick actions + settings
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-1.5 p-5 pt-1">
            {onLocate && (
              <button
                onClick={() => { onLocate(); setMobileMenuOpen(false) }}
                disabled={locating}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <LocateFixed className={cn('h-4 w-4 shrink-0 text-scot-amber', locating && 'animate-spin')} aria-hidden />
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            )}
            {onRefresh && (
              <button
                onClick={() => { onRefresh(); setMobileMenuOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <RefreshCw className={cn('h-4 w-4 shrink-0 text-scot-amber', loading && 'animate-spin')} aria-hidden />
                Refresh weather
              </button>
            )}
            {onShare && (
              <button
                onClick={() => { handleShare(); setMobileMenuOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {copied ? <CheckIcon className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden /> : <Share2 className="h-4 w-4 shrink-0 text-scot-amber" aria-hidden />}
                {copied ? 'Link copied!' : 'Copy shareable link'}
              </button>
            )}
            {onShowShortcuts && (
              <button
                onClick={() => { onShowShortcuts(); setMobileMenuOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Keyboard className="h-4 w-4 shrink-0 text-scot-amber" aria-hidden />
                Keyboard shortcuts
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={() => { onOpenSettings(); setMobileMenuOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Settings className="h-4 w-4 shrink-0 text-scot-amber" aria-hidden />
                Settings
              </button>
            )}
            {/* Theme toggle */}
            <button
              onClick={() => { setTheme(isDark ? 'light' : 'dark'); }}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {isDark ? (
                <Sun className="h-4 w-4 shrink-0 text-scot-amber" aria-hidden />
              ) : (
                <Moon className="h-4 w-4 shrink-0 text-scot-green" aria-hidden />
              )}
              {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Favourites chip strip (or empty-state hint) */}
      {favLocations.length > 0 ? (
        <div className="border-t border-border/30 bg-background/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            <span className="flex shrink-0 items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              <Star className="h-3 w-3 text-scot-amber" aria-hidden />
              Favourites
            </span>
            <div className="flex items-center gap-1.5">
              {favLocations.map((loc) => (
                <button
                  key={`chip-${loc.value}`}
                  onClick={() => onLocationChange(loc.value)}
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    loc.value === currentLocation
                      ? 'border-scot-amber/50 bg-scot-amber/15 text-scot-amber'
                      : 'border-border/50 bg-card/40 text-muted-foreground hover:border-scot-amber/40 hover:text-foreground',
                  )}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/20 bg-background/30 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-1.5 sm:px-6 lg:px-8">
            <span className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
              <Star className="h-3 w-3 text-scot-amber" aria-hidden />
              No favourites yet — tap the
              <Star className="h-3 w-3 text-scot-amber" aria-hidden />
              or press{' '}
              <kbd className="rounded border border-border/50 bg-muted/40 px-1 text-[0.6rem] font-semibold text-foreground">F</kbd>
              {' '}to add {active?.label ?? 'this location'}.
            </span>
          </div>
        </div>
      )}
    </header>
  )
}

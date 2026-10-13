'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

import { WeatherHeader, type LocationOption } from '@/components/weather-header'
import { CurrentWeatherHero } from '@/components/current-weather-hero'
import { WeatherMetricsGrid } from '@/components/weather-metrics-grid'
import { WeatherTrendChart, type TrendTab } from '@/components/weather-trend-chart'
import { HourlyForecast, type HourlyForecastHandle } from '@/components/hourly-forecast'
import { WeeklyForecast } from '@/components/weekly-forecast'
import { SunMoonCard } from '@/components/sun-moon-card'
import { AirQualityCard } from '@/components/air-quality-card'
import {
  KeyboardShortcutsDialog,
  useKeyboardShortcuts,
} from '@/components/keyboard-shortcuts'
import {
  DashboardLoading,
  DashboardError,
} from '@/components/weather-states'
import { WeatherInsightCard } from '@/components/weather-insight-card'
import { SunAlmanacStrip } from '@/components/sun-almanac-strip'
import { PrecipitationRadarCard } from '@/components/precipitation-radar-card'
import { FeelsLikeComparisonCard } from '@/components/feels-like-comparison-card'
import { LocationCoordinatesCard } from '@/components/location-coordinates-card'
import { PrecipitationOutlookStrip } from '@/components/precipitation-outlook-strip'
import { WindDialCard } from '@/components/wind-dial-card'
import { WeatherStoryCard } from '@/components/weather-story-card'
import { WeatherAlertBanner } from '@/components/weather-alert-banner'
import { PressureTrendCard } from '@/components/pressure-trend-card'
import { CompareGlensCard } from '@/components/compare-glens-card'
import { DaylightDeltaCard } from '@/components/daylight-delta-card'
import { TemperatureRangeCard } from '@/components/temperature-range-card'
import { SunAltitudeCard } from '@/components/sun-altitude-card'
import { ScottishGlossaryCard } from '@/components/scottish-glossary-card'
import { BestTimeToVisitCard } from '@/components/best-time-to-visit-card'
import { MoonCard } from '@/components/moon-card'
import { WindOutlookCard } from '@/components/wind-outlook-card'
import { UVForecastCard } from '@/components/uv-forecast-card'
import { WeatherLogCard } from '@/components/weather-log-card'
import { SettingsSheet } from '@/components/settings-sheet'
import { StaggerGroup, StaggerItem } from '@/components/motion'
import { LastRefreshedBadge } from '@/components/last-refreshed-badge'
import { RuneCanvas } from '@/components/rune-canvas'
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion'
import type { WeatherApiResponse } from '@/lib/weather-types'
import { usePreferences } from '@/lib/use-preferences'
import { useWeatherLog } from '@/lib/use-weather-log'
import { mapOpenWeather } from '@/lib/openweather'
import { useGeolocation, nearestLocation, LOCATION_COORDS } from '@/hooks/use-geolocation'
import { useWeatherDocumentTitle } from '@/hooks/use-document-title'

/** Link an outer AbortSignal to an inner controller so aborting either
 * one aborts the combined fetch. */
function linkAbort(outer: AbortSignal | undefined, ctrl: AbortController) {
  if (!outer) return
  if (outer.aborted) { ctrl.abort(); return }
  outer.addEventListener('abort', () => ctrl.abort(), { once: true })
}

const LOCATIONS: LocationOption[] = [
  { value: 'inverness', label: 'Inverness', region: 'Highland' },
  { value: 'fort william', label: 'Fort William', region: 'Highland' },
  { value: 'aviemore', label: 'Aviemore', region: 'Highland' },
  { value: 'oban', label: 'Oban', region: 'Argyll' },
  { value: 'portree', label: 'Portree', region: 'Isle of Skye' },
  { value: 'ullapool', label: 'Ullapool', region: 'Highland' },
  { value: 'glasgow', label: 'Glasgow', region: 'Strathclyde' },
  { value: 'edinburgh', label: 'Edinburgh', region: 'Lothian' },
  { value: 'aberdeen', label: 'Aberdeen', region: 'Grampian' },
  { value: 'perth', label: 'Perth', region: 'Perthshire' },
  { value: 'st andrews', label: 'St Andrews', region: 'Fife' },
  { value: 'mallaig', label: 'Mallaig', region: 'Highland' },
]

/* ===================== Veðr wordmark — draggable letters =====================
   The "Veðr" page title banner. Each letter is independently draggable +
   independently turns dark blood red on contact. On hover, a very small
   rotational vibration plays. The red persists through hover / drag / the
   3s post-drop hold / the 2s return animation, and only reverts to the
   original foreground colour once that specific letter is back at its
   origin (x=0, y=0). Siblings are unaffected.
   Respects prefers-reduced-motion: vibration disabled, instant return. */

const VEDR_RED = '#4E0E04'
const VEDR_RED_GLOW = '0 0 14px rgba(120, 20, 8, 0.6)'
const VEDR_NO_GLOW = '0 0 0px rgba(0, 0, 0, 0)'

function VeðrTitle({ letters, originalColor }: { letters: string[]; originalColor: string }) {
  return (
    <h1
      className="font-norse text-6xl tracking-tight text-foreground sm:text-8xl sm:text-9xl"
      aria-label="Veðr"
    >
      {letters.map((char, i) => (
        <DraggableLetter key={i} char={char} originalColor={originalColor} />
      ))}
    </h1>
  )
}

function DraggableLetter({ char, originalColor }: { char: string; originalColor: string }) {
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const controlsRef = React.useRef<{ stop: () => void } | null>(null)

  const stateRef = React.useRef({ hovered: false, dragging: false, holding: false, returning: false })
  const [isRed, setIsRed] = React.useState(false)

  const setState = React.useCallback((partial: Partial<{ hovered: boolean; dragging: boolean; holding: boolean; returning: boolean }>) => {
    Object.assign(stateRef.current, partial)
    const s = stateRef.current
    setIsRed(s.hovered || s.dragging || s.holding || s.returning)
  }, [])

  const startReturn = React.useCallback(() => {
    controlsRef.current?.stop()
    setState({ holding: false, returning: true })
    const onComplete = () => setState({ returning: false })
    if (reduceMotion) {
      x.set(0); y.set(0); onComplete(); return
    }
    const cx = animate(x, 0, { duration: 2, ease: [0.42, 0, 0.58, 1], onComplete })
    const cy = animate(y, 0, { duration: 2, ease: [0.42, 0, 0.58, 1], onComplete })
    controlsRef.current = { stop: () => { cx.stop(); cy.stop() } }
  }, [x, y, setState, reduceMotion])

  const handleDragEnd = React.useCallback(() => {
    controlsRef.current?.stop()
    if (timerRef.current) clearTimeout(timerRef.current)
    setState({ holding: true })
    timerRef.current = setTimeout(startReturn, 3000)
  }, [startReturn, setState])

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    controlsRef.current?.stop()
  }, [])

  return (
    <motion.span
      drag
      dragMomentum={false}
      dragElastic={0}
      style={{ x, y, display: 'inline-block', touchAction: 'none' }}
      whileDrag={{ scale: 1.12, cursor: 'grabbing', zIndex: 50 }}
      whileHover={reduceMotion ? { scale: 1.05 } : {
        scale: 1.05,
        rotate: [0, 0.8, -0.8, 0.5, -0.5, 0],
        transition: {
          scale: { duration: 0.2, ease: 'easeOut' },
          rotate: { duration: 0.45, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' },
        },
      }}
      onHoverStart={() => setState({ hovered: true })}
      onHoverEnd={() => setState({ hovered: false })}
      onDragStart={() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        controlsRef.current?.stop()
        setState({ dragging: true, holding: false, returning: false })
      }}
      onDragEnd={() => {
        setState({ dragging: false })
        handleDragEnd()
      }}
      animate={{
        color: isRed ? VEDR_RED : originalColor,
        textShadow: isRed ? VEDR_RED_GLOW : VEDR_NO_GLOW,
      }}
      transition={{ color: { duration: 0.3 }, textShadow: { duration: 0.3 } }}
      className="cursor-grab select-none"
    >
      {char}
    </motion.span>
  )
}

export default function Home() {
  // Initialize location from ?location= query param (deep-linkable), default
  // inverness. Supports both named Scottish locations and worldwide
  // "lat,lon" coordinate strings (with ?name= for the display label).
  //
  // SSR/HYDRATION: the initial state is ALWAYS 'inverness' on both server
  // and client — we do NOT read window.location.search in the initializer
  // (that would make the server render 'inverness' while the client renders
  // the URL-param location, causing a hydration mismatch like
  //   server: "Inverness, Highland"  vs  client: "Select location…"
  // when the URL is /?location=33.44976,-7.65239). The URL ?location=
  // is read in a useEffect below, AFTER hydration, so the first client
  // render matches the server — then we switch to the deep-linked location.
  const [location, setLocationState] = React.useState<string>('inverness')

  // After hydration, read the URL ?location= param (deep-link support).
  // Runs only on the client (useEffect doesn't fire during SSR), so it's
  // safe to access window here.
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('location')
    if (!q) return
    const lower = q.toLowerCase()
    if (LOCATIONS.some((l) => l.value === lower)) {
      setLocationState(lower)
    } else if (/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(q)) {
      // Accept a coordinate string "lat,lon".
      setLocationState(q)
    }
    // If q is a named location not in LOCATIONS, or an invalid format,
    // leave the default 'inverness' (the URL param is effectively ignored).
  }, [])
  const [data, setData] = React.useState<WeatherApiResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  // Persist the trend-chart tab so reloads preserve the user's view.
  // SSR/HYDRATION: initialize with 'temp' (same on server + client) and
  // restore the saved value in a useEffect to avoid a hydration mismatch
  // (the server can't read localStorage).
  const [trendTab, setTrendTab] = React.useState<TrendTab>('temp')
  React.useEffect(() => {
    const saved = window.localStorage.getItem('ceilidh-weather-trend-tab')
    if (saved === 'humidity' || saved === 'precip') {
      setTrendTab(saved as TrendTab)
    }
  }, [])
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  // Persist trendTab to localStorage on change.
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ceilidh-weather-trend-tab', trendTab)
    }
  }, [trendTab])

  // setLocation wrapper that syncs the ?location= (+ ?name= + ?region= for
  // worldwide coordinate cities) query param to the URL so the dashboard is
  // deep-linkable / shareable + back-forward friendly.
  const setLocation = React.useCallback((loc: string) => {
    setLocationState(loc)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('location', loc)
      // For worldwide coordinate cities, attach the display name + region so
      // a reload can show the right label even without the meta cache.
      const meta = window.localStorage.getItem('ceilidh-weather-prefs')
      if (meta && /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(loc)) {
        try {
          const parsed = JSON.parse(meta)
          const m = parsed?.state?.locationMeta?.[loc]
          if (m?.label) url.searchParams.set('name', m.label)
          else url.searchParams.delete('name')
          if (m?.region) url.searchParams.set('region', m.region)
          else url.searchParams.delete('region')
        } catch {
          /* ignore */
        }
      } else {
        url.searchParams.delete('name')
        url.searchParams.delete('region')
      }
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const comboboxRef = React.useRef<HTMLButtonElement>(null)
  const hourlyRef = React.useRef<HourlyForecastHandle>(null)
  const { setTheme, resolvedTheme } = useTheme()
  const geo = useGeolocation()

  // ---- Live time for the title banner ----
  // SSR-safe: initialise with empty strings on the server, hydrate from
  // the client clock in a useEffect (avoids hydration mismatch — the
  // server can't know the user's local time).
  const [titleTime, setTitleTime] = React.useState('')
  const [titleDate, setTitleDate] = React.useState('')
  React.useEffect(() => {
    const fmtTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const fmtDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
    const update = () => {
      const now = new Date()
      setTitleTime(fmtTime.format(now))
      setTitleDate(fmtDate.format(now))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  const originalColor = (resolvedTheme ?? 'dark') === 'dark' ? '#F3F0E8' : '#1A1A1A'

  const toggleFav = usePreferences((s) => s.toggleFavourite)
  const isFav = usePreferences((s) => s.favourites.includes(location))
  const favouriteValues = usePreferences((s) => s.favourites)
  const locationMeta = usePreferences((s) => s.locationMeta)
  const recordMeta = usePreferences((s) => s.recordLocationMeta)
  // The active location's display label/region: prefer the store cache
  // (covers worldwide coordinate cities), else the static LOCATIONS lookup,
  // else the URL ?name=/?region= params (for first-load deep-links).
  const knownLoc = LOCATIONS.find((l) => l.value === location)
  const meta = locationMeta[location]
  const activeLabel = meta?.label ?? knownLoc?.label ?? undefined
  const activeRegion = meta?.region ?? knownLoc?.region ?? undefined

  // On first mount, if the URL carries a ?name= for a coordinate location but
  // the meta cache doesn't have it yet, hydrate the cache so the header shows
  // the right label immediately.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (!/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(location)) return
    if (meta) return
    const params = new URLSearchParams(window.location.search)
    const name = params.get('name')
    if (!name) return
    recordMeta({
      value: location,
      label: name,
      region: params.get('region') ?? '',
    })
  }, [location, meta, recordMeta])

  // Map favourite values → location option objects for the CompareGlensCard.
  const favouriteLocs = React.useMemo(
    () =>
      favouriteValues
        .map((v) => {
          const m = locationMeta[v]
          if (m) return { value: m.value, label: m.label, region: m.region, country: m.country, lat: m.lat, lon: m.lon }
          return LOCATIONS.find((l) => l.value === v) ?? null
        })
        .filter(Boolean) as LocationOption[],
    [favouriteValues, locationMeta],
  )
  const logEntry = useWeatherLog((s) => s.addEntry)

  const fetchData = React.useCallback(
    async (loc: string, signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const isCoord = /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(loc)
        const name = isCoord ? (usePreferences.getState().locationMeta[loc]?.label ?? '') : ''
        const region = isCoord ? (usePreferences.getState().locationMeta[loc]?.region ?? '') : ''

        // 1) Client-side OpenWeatherMap fetch (browser → OWM directly, like
        //    the geocode — works in the sandbox preview once the key activates).
        const owmKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
        if (owmKey) {
          // Resolve coords + region for the location (named Scottish town OR "lat,lon").
          let lat = 57.4778
          let lon = -4.2247
          let knownRegion = region
          let knownCountry = ''
          if (isCoord) {
            const [la, lo] = loc.split(',')
            lat = Number(la)
            lon = Number(lo)
          } else {
            const coords = LOCATION_COORDS[loc]
            if (coords) { lat = coords.lat; lon = coords.lon }
            const known = LOCATIONS.find((l) => l.value === loc)
            if (known) knownRegion = known.region
          }
          try {
            const ctrl = new AbortController()
            const to = setTimeout(() => ctrl.abort(), 8000)
            linkAbort(signal, ctrl)
            const [curRes, fctRes] = await Promise.all([
              fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owmKey}&units=metric`, { signal: ctrl.signal }),
              fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${owmKey}&units=metric`, { signal: ctrl.signal }),
            ])
            clearTimeout(to)
            if (curRes.ok && fctRes.ok) {
              const cur = await curRes.json()
              const fct = await fctRes.json()
              if (cur.cod !== 401 && fct.cnt) {
                const payload = mapOpenWeather(cur, fct, {
                  name: name || cur.name || loc,
                  region: knownRegion,
                  country: cur.sys?.country || knownCountry,
                  lat,
                  lon,
                  tz: 'auto',
                })
                if (!signal?.aborted) setData(payload)
                return
              }
            }
          } catch {
            // fall through to server route
          }
        }

        // 2) Server route fallback (/api/weather tries OWM server-side →
        //    Open-Meteo → mock).
        const params = new URLSearchParams()
        params.set('location', loc)
        if (name) params.set('name', name)
        if (region) params.set('region', region)
        const res = await fetch(`/api/weather?${params.toString()}`, {
          signal,
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`Server responded ${res.status}`)
        const json: WeatherApiResponse = await res.json()
        if (!signal?.aborted) {
          setData(json)
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message ?? 'Failed to load weather')
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [],
  )

  React.useEffect(() => {
    const ctrl = new AbortController()
    fetchData(location, ctrl.signal)
    return () => ctrl.abort()
  }, [location, fetchData])

  // Keep the browser tab title in sync with the current weather.
  useWeatherDocumentTitle(data)

  // Auto-capture weather observations into the persisted log (throttled to
  // at most one entry per location per 10 minutes to avoid flooding).
  React.useEffect(() => {
    if (!data) return
    const key = `ceilidh-weather-last-log-${data.location.name.toLowerCase()}`
    const now = Date.now()
    const lastStr = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    const last = lastStr ? Number(lastStr) : 0
    if (now - last < 10 * 60_000) return // 10-min throttle
    window.localStorage.setItem(key, String(now))
    logEntry({
      ts: new Date().toISOString(),
      location: data.location.name.toLowerCase(),
      temperature: data.current.temperature,
      condition: data.current.condition,
      windSpeed: data.current.windSpeed,
      humidity: data.current.humidity,
    })
  }, [data, logEntry])

  // Stable handlers object for the keyboard hook
  const handlers = React.useMemo(
    () => ({
      onSearch: () => comboboxRef.current?.focus(),
      onToggleTheme: () => {
        const next = (resolvedTheme ?? 'dark') === 'dark' ? 'light' : 'dark'
        setTheme(next)
        toast.success(`Switched to ${next} mode`, { duration: 1800 })
      },
      onRefresh: () => {
        fetchData(location)
        toast.success('Refreshing weather…', { duration: 1500 })
      },
      onLocate: () => {
        void (async () => {
          const c = await geo.request()
          if (!c) {
            toast.error('Could not get your location', {
              description: geo.error ?? undefined,
            })
            return
          }
          // Use the user's real coordinates anywhere on Earth (rounded to 4dp).
          const value = `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`
          recordMeta({
            value,
            label: 'My location',
            region: `${c.lat.toFixed(2)}°, ${c.lon.toFixed(2)}°`,
            lat: c.lat,
            lon: c.lon,
          })
          setLocation(value)
          toast.success('Centred on your current position', {
            description: `${c.lat.toFixed(2)}°, ${c.lon.toFixed(2)}°`,
          })
        })()
      },
      onToggleFavourite: () => {
        toggleFav(location)
        toast.success(
          isFav ? 'Removed from favourites' : 'Added to favourites',
          { duration: 1500 },
        )
      },
      onShowShortcuts: () => setShortcutsOpen(true),
      onTab: (idx: number) => setTrendTab((['temp', 'humidity', 'precip'] as const)[idx]),
      onScrollHours: (dir: 1 | -1) => hourlyRef.current?.scroll(dir),
      onNextLocation: () => {
        const idx = LOCATIONS.findIndex((l) => l.value === location)
        const next = LOCATIONS[(idx + 1) % LOCATIONS.length]
        setLocation(next.value)
        toast.success(`Now showing ${next.label}`, { duration: 1500 })
      },
      onPrevLocation: () => {
        const idx = LOCATIONS.findIndex((l) => l.value === location)
        const prev = LOCATIONS[(idx - 1 + LOCATIONS.length) % LOCATIONS.length]
        setLocation(prev.value)
        toast.success(`Now showing ${prev.label}`, { duration: 1500 })
      },
      onOpenSettings: () => setSettingsOpen(true),
    }),
    [fetchData, geo, isFav, location, resolvedTheme, setTheme, toggleFav, recordMeta],
  )
  useKeyboardShortcuts(handlers)

  // toast on location change (skip initial mount)
  const firstRun = React.useRef(true)
  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const loc = LOCATIONS.find((l) => l.value === location)
    if (loc) toast.success(`Now showing ${loc.label}`, { duration: 1500 })
  }, [location])

  const today = data?.daily?.[0]
  const high = today?.tempMax
  const low = today?.tempMin
  // activeLoc covers the 12 Scottish defaults; for worldwide coordinate
  // cities we derive label/region from the meta cache (set by the combobox).
  const activeLoc = knownLoc ?? (meta ? { value: meta.value, label: meta.label, region: meta.region } : undefined)

  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      <RuneCanvas />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <WeatherHeader
        locations={LOCATIONS}
        currentLocation={location}
        currentLocationLabel={activeLabel}
        currentLocationRegion={activeRegion}
        onLocationChange={setLocation}
        onRefresh={() => {
          fetchData(location)
          toast.success('Refreshing weather…', { duration: 1500 })
        }}
        onLocate={handlers.onLocate}
        onShare={() => {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => toast.success('Shareable link copied', { duration: 1800 }))
              .catch(() => toast.error('Could not copy link'))
          }
        }}
        onShowShortcuts={() => setShortcutsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        locating={geo.loading}
        updatedAt={data?.updatedAt}
        dataSource={data?.dataSource}
        loading={loading}
        comboboxRef={comboboxRef}
      />

      <main
        id="main"
        className="flex-1"
        aria-live="polite"
        aria-busy={loading}
      >
        {/* Page title banner — "Veðr" wordmark (draggable letters) + live time.
            Hidden while loading / on error so the skeleton gets full focus. */}
        {data && !loading && !error && (
          <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <VeðrTitle letters={['V', 'e', 'ð', 'r']} originalColor={originalColor} />
              <div className="flex flex-col items-center gap-0.5">
                <div className="font-norse text-3xl tabular-nums text-black dark:text-scot-amber-glow sm:text-4xl">
                  {titleTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  {titleDate}{activeLoc ? ` · ${activeLoc.label}${activeLoc.region ? ', ' + activeLoc.region : ''}` : ''}
                </div>
              </div>
            </div>
            {/* Thin divider rune */}
            <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-border/60 to-transparent" aria-hidden />
          </div>
        )}

        {/* Favourites quick hint when none yet */}
        {data && activeLoc && !loading && (
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/30 px-3 py-1 backdrop-blur-md">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${data.dataSource === 'open-meteo' ? 'bg-emerald-500/80' : 'bg-scot-amber'}`}
                  aria-hidden
                />
                {data.dataSource === 'open-meteo' ? 'Live observation' : 'Atmospheric simulation'} · {activeLoc.label}, {activeLoc.region}
              </span>
              <LastRefreshedBadge
                updatedAt={data.updatedAt}
                loading={loading}
                dataSource={data.dataSource}
                className="border-0 bg-transparent p-0 md:flex"
              />
              <span className="text-muted-foreground">
                Press <kbd className="rounded border border-border/60 bg-muted/40 px-1 text-[0.6rem] font-semibold">?</kbd> for shortcuts
              </span>
            </div>
          </div>
        )}

        {loading && !data ? (
          <DashboardLoading />
        ) : error ? (
          <DashboardError message={error} onRetry={() => fetchData(location)} />
        ) : data ? (
          <StaggerGroup className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
            {/* Weather alert banner (only renders if there are active alerts) */}
            <WeatherAlertBanner current={data.current} />
            <StaggerItem>
              <CurrentWeatherHero data={data} high={high} low={low} />
            </StaggerItem>
            <StaggerItem>
              <WeatherMetricsGrid current={data.current} />
            </StaggerItem>
            <StaggerItem>
              <HourlyForecast ref={hourlyRef} data={data} />
            </StaggerItem>
            <StaggerItem>
              <WeatherInsightCard data={data} />
            </StaggerItem>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <StaggerItem className="h-full">
                  <WeatherTrendChart
                    data={data}
                    tab={trendTab}
                    onTabChange={setTrendTab}
                  />
                </StaggerItem>
              </div>
              <div className="lg:col-span-1">
                <StaggerItem className="h-full">
                  <WeeklyForecast data={data} />
                </StaggerItem>
              </div>
            </div>

            <StaggerItem>
              <SunAlmanacStrip data={data} />
            </StaggerItem>

            <StaggerItem>
              <PrecipitationOutlookStrip data={data} />
            </StaggerItem>

            <div className="grid gap-5 sm:grid-cols-2 items-stretch">
              <StaggerItem>
                <SunMoonCard data={data} />
              </StaggerItem>
              <StaggerItem>
                <AirQualityCard data={data} />
              </StaggerItem>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 items-stretch">
              <StaggerItem>
                <FeelsLikeComparisonCard data={data} />
              </StaggerItem>
              <StaggerItem>
                <PrecipitationRadarCard data={data} />
              </StaggerItem>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 items-stretch">
              <StaggerItem>
                <WindDialCard data={data} />
              </StaggerItem>
              <StaggerItem>
                <WeatherStoryCard data={data} />
              </StaggerItem>
            </div>

            <StaggerItem>
              <TemperatureRangeCard data={data} />
            </StaggerItem>

            <div className="grid gap-5 sm:grid-cols-2 items-stretch">
              <StaggerItem>
                <PressureTrendCard data={data} />
              </StaggerItem>
              <StaggerItem>
                <DaylightDeltaCard data={data} />
              </StaggerItem>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 items-stretch">
              <StaggerItem>
                <SunAltitudeCard data={data} />
              </StaggerItem>
              <StaggerItem>
                <ScottishGlossaryCard condition={data.current.condition} />
              </StaggerItem>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 items-stretch">
              <StaggerItem>
                <MoonCard data={data} />
              </StaggerItem>
              <StaggerItem>
                <BestTimeToVisitCard data={data} />
              </StaggerItem>
            </div>

            <StaggerItem>
              <WindOutlookCard data={data} />
            </StaggerItem>

            <div className="grid gap-5 sm:grid-cols-2 items-stretch">
              <StaggerItem>
                <UVForecastCard data={data} />
              </StaggerItem>
              <StaggerItem>
                <WeatherLogCard activeLocation={location} />
              </StaggerItem>
            </div>

            <StaggerItem>
              <CompareGlensCard
                favourites={favouriteLocs}
                defaultGlens={LOCATIONS}
                onPick={setLocation}
                activeLocation={location}
              />
            </StaggerItem>

            <StaggerItem>
              <LocationCoordinatesCard data={data} />
            </StaggerItem>
          </StaggerGroup>
        ) : null}
      </main>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

      <footer
        className="mt-auto border-t border-border/40 bg-background/60 backdrop-blur-md"
        role="contentinfo"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-scot-amber" aria-hidden />
            <span>
              <span className="font-norse font-medium text-foreground">Veðr</span> · Weather Dashboard
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

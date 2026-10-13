import { NextResponse } from 'next/server'

// Node.js runtime — the edge runtime in this sandbox can't reach external
// APIs, but the Node runtime can.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface GeocodeResult {
  value: string
  label: string
  region: string
  country: string
  countryCode: string
  lat: number
  lon: number
  timezone: string
}

/** Curated default Scottish Highlands & glens (shown when the query is empty). */
const DEFAULTS: GeocodeResult[] = [
  { value: 'inverness', label: 'Inverness', region: 'Highland', country: 'Scotland', countryCode: 'GB', lat: 57.4778, lon: -4.2247, timezone: 'Europe/London' },
  { value: 'fort william', label: 'Fort William', region: 'Highland', country: 'Scotland', countryCode: 'GB', lat: 56.8197, lon: -5.1054, timezone: 'Europe/London' },
  { value: 'aviemore', label: 'Aviemore', region: 'Highland', country: 'Scotland', countryCode: 'GB', lat: 57.2083, lon: -3.8345, timezone: 'Europe/London' },
  { value: 'oban', label: 'Oban', region: 'Argyll', country: 'Scotland', countryCode: 'GB', lat: 56.4122, lon: -5.4733, timezone: 'Europe/London' },
  { value: 'portree', label: 'Portree', region: 'Isle of Skye', country: 'Scotland', countryCode: 'GB', lat: 57.4333, lon: -6.1917, timezone: 'Europe/London' },
  { value: 'ullapool', label: 'Ullapool', region: 'Highland', country: 'Scotland', countryCode: 'GB', lat: 57.8963, lon: -5.1605, timezone: 'Europe/London' },
  { value: 'glasgow', label: 'Glasgow', region: 'Strathclyde', country: 'Scotland', countryCode: 'GB', lat: 55.8642, lon: -4.2518, timezone: 'Europe/London' },
  { value: 'edinburgh', label: 'Edinburgh', region: 'Lothian', country: 'Scotland', countryCode: 'GB', lat: 55.9533, lon: -3.1883, timezone: 'Europe/London' },
  { value: 'aberdeen', label: 'Aberdeen', region: 'Grampian', country: 'Scotland', countryCode: 'GB', lat: 57.1497, lon: -2.0943, timezone: 'Europe/London' },
  { value: 'perth', label: 'Perth', region: 'Perthshire', country: 'Scotland', countryCode: 'GB', lat: 56.3958, lon: -3.4308, timezone: 'Europe/London' },
  { value: 'st andrews', label: 'St Andrews', region: 'Fife', country: 'Scotland', countryCode: 'GB', lat: 56.3398, lon: -2.7967, timezone: 'Europe/London' },
  { value: 'mallaig', label: 'Mallaig', region: 'Highland', country: 'Scotland', countryCode: 'GB', lat: 57.0059, lon: -5.8292, timezone: 'Europe/London' },
]

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const count = Math.min(20, Number(url.searchParams.get('count') ?? 12))

  // Empty query → return the curated Scottish defaults.
  if (!q) {
    return NextResponse.json({ results: DEFAULTS, source: 'defaults' })
  }

  // Try the Open-Meteo geocoding API (free, no key) for worldwide cities.
  try {
    const params = new URLSearchParams({
      name: q,
      count: String(count),
      language: 'en',
      format: 'json',
    })
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
      signal: ctrl.signal,
    })
    clearTimeout(timeout)
    if (res.ok) {
      const data = await res.json()
      const raw: any[] = data.results ?? []
      const results: GeocodeResult[] = raw.map((r) => ({
        value: `${r.latitude},${r.longitude}`,
        label: r.name,
        region: r.admin1 ?? r.admin2 ?? '',
        country: r.country ?? '',
        countryCode: r.country_code ?? '',
        lat: r.latitude,
        lon: r.longitude,
        timezone: r.timezone ?? 'auto',
      }))
      // Merge in any Scottish defaults whose label matches the query (so the
      // named-key version is preferred over the coordinate version).
      const matchingDefaults = DEFAULTS.filter(
        (d) =>
          d.label.toLowerCase().includes(q.toLowerCase()) ||
          d.region.toLowerCase().includes(q.toLowerCase()),
      )
      const seen = new Set(results.map((r) => r.label.toLowerCase()))
      const merged = [...matchingDefaults, ...results.filter((r) => !seen.has(r.label.toLowerCase()))]
      return NextResponse.json({ results: merged.slice(0, count), source: 'open-meteo' })
    }
    throw new Error('geocoding responded ' + res.status)
  } catch {
    // Fall back to filtering the defaults (offline / unreachable).
    const lower = q.toLowerCase()
    const results = DEFAULTS.filter(
      (d) => d.label.toLowerCase().includes(lower) || d.region.toLowerCase().includes(lower),
    )
    return NextResponse.json({ results, source: 'defaults' })
  }
}

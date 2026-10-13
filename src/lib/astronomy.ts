/**
 * Solar + lunar astronomical helpers.
 * All angles in degrees; distances in km.
 */

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

/** Julian Day from a Date (fractional). */
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

/**
 * Solar elevation angle (degrees above horizon) for a given lat/lon/time.
 * Simplified NOAA solar position algorithm. Returns negative when sun is
 * below the horizon (night).
 */
export function solarElevation(
  lat: number,
  lon: number,
  date: Date,
): { elevation: number; azimuth: number } {
  const jd = julianDay(date)
  const n = jd - 2451545.0 // days since J2000

  // Mean solar longitude
  const L = (280.460 + 0.9856474 * n) % 360
  // Mean anomaly
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG
  // Ecliptic longitude
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG
  // Obliquity
  const epsilon = (23.439 - 0.0000004 * n) * DEG
  // Right ascension + declination
  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))
  const dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda))

  // Greenwich hour angle of the mean sun
  const GMST = (18.697374558 + 24.06570382441908 * n) % 24
  const LST = (GMST * 15 + lon) % 360
  const H = (LST - ra * RAD) * DEG

  const latRad = lat * DEG
  const elev = Math.asin(
    Math.sin(latRad) * Math.sin(dec) +
      Math.cos(latRad) * Math.cos(dec) * Math.cos(H),
  )
  const azim = Math.atan2(
    -Math.sin(H),
    Math.cos(latRad) * Math.tan(dec) - Math.sin(latRad) * Math.cos(H),
  )

  return { elevation: elev * RAD, azimuth: azim * RAD }
}

/**
 * Moon illumination fraction (0..1) from a Date — independent of the phase
 * value provided by the API. Uses a simple synodic-month approximation.
 */
export function moonIllumination(date: Date): number {
  const synodic = 29.530588853
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime()
  const days = (date.getTime() - ref) / 86400000
  const phase = (((days % synodic) + synodic) % synodic) / synodic
  // Convert phase to illumination using the standard formula
  return (1 - Math.cos(phase * 2 * Math.PI)) / 2
}

/** Approximate moonrise/moonset (UTC) for a given lat/lon on a given date. */
export function moonRiseSet(
  lat: number,
  lon: number,
  date: Date,
): { rise: string | null; set: string | null } {
  // Simple approximation: moon transits ~50 min later each day; compute
  // transit time from the synodic phase offset relative to solar noon.
  const synodic = 29.530588853
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime()
  const days = (date.getTime() - ref) / 86400000
  const phase = (((days % synodic) + synodic) % synodic) / synodic
  // Solar noon at this longitude (UTC):
  const solarNoonUTC = 12 - lon / 15
  // Moon transit offset from solar noon: roughly (phase * 24) - 12 hours,
  // but constrained to [-12, 12].
  let offset = (phase * 24) - 12
  if (offset > 12) offset -= 24
  if (offset < -12) offset += 24
  const moonTransitUTC = (solarNoonUTC + offset + 24) % 24

  // Rise = transit - ~6h, set = transit + ~6h (rough lunar semi-diurnal tide)
  const toISO = (h: number) => {
    const d = new Date(date)
    d.setUTCHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0)
    return d.toISOString()
  }
  return {
    rise: toISO((moonTransitUTC - 6 + 24) % 24),
    set: toISO((moonTransitUTC + 6) % 24),
  }
}

/** Format an elevation/altitude nicely. */
export function fmtElevation(deg: number): string {
  const v = Math.abs(deg)
  return `${deg < 0 ? '−' : ''}${v.toFixed(1)}°`
}

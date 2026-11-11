// Cálculos de ubicación de los campus (en el teléfono, sin llamar a ningún servicio).
// El backend repite la misma validación: el punto de entrega tiene que estar dentro del campus.

export interface LatLng { lat: number; lng: number }

export interface GeoCampus {
  id: number
  latitud: number | null
  longitud: number | null
  radio_entrega_m: number
}

const EARTH_RADIUS_M = 6371000
const rad = (deg: number) => (deg * Math.PI) / 180

/** Distancia en metros entre dos puntos (fórmula del haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export const campusCenter = (c: GeoCampus): LatLng | null =>
  c.latitud !== null && c.longitud !== null ? { lat: Number(c.latitud), lng: Number(c.longitud) } : null

/** ¿El punto está dentro del área de entrega del campus? */
export function isInsideCampus(campus: GeoCampus, point: LatLng): boolean {
  const center = campusCenter(campus)
  return center !== null && distanceMeters(center, point) <= campus.radio_entrega_m
}

/** El campus más cercano a un punto, con su distancia y si el punto está dentro. */
export function nearestCampus<T extends GeoCampus>(campuses: T[], point: LatLng): { campus: T; meters: number; inside: boolean } | null {
  let best: { campus: T; meters: number; inside: boolean } | null = null
  for (const campus of campuses) {
    const center = campusCenter(campus)
    if (!center) continue
    const meters = distanceMeters(center, point)
    if (!best || meters < best.meters) best = { campus, meters, inside: meters <= campus.radio_entrega_m }
  }
  return best
}

export const formatDistance = (meters: number) =>
  meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`

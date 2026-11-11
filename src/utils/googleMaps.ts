// Carga del SDK de Google Maps para JavaScript (web y la app Android, que corre en un WebView).
// - La clave del navegador es pública por diseño: se protege restringiéndola por sitio web/app en
//   Google Cloud (ver docs/hackathon/MAPAS.md), nunca con secretos.
// - Se usa el canal "beta" porque los mapas 3D (maps3d) todavía están en vista previa.
// - Sin clave, la app sigue funcionando: las vistas muestran una alternativa sin mapa.

/* eslint-disable @typescript-eslint/no-explicit-any */
export type GoogleMaps = any

const KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
export const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '').trim() || 'DEMO_MAP_ID'

/** Centro de El Salvador y vista inicial del país. */
export const EL_SALVADOR = { lat: 13.6929, lng: -89.2182 }

let loading: Promise<GoogleMaps> | null = null

export const hasMapsKey = () => KEY !== ''

/** Carga el SDK una sola vez y devuelve `google.maps`. */
export function loadGoogleMaps(): Promise<GoogleMaps> {
  if (!hasMapsKey()) return Promise.reject(new Error('maps_key_missing'))
  const w = window as any
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google.maps)
  if (loading) return loading

  loading = new Promise((resolve, reject) => {
    const callback = '__lauMapsReady'
    w[callback] = () => resolve(w.google.maps)
    const params = new URLSearchParams({
      key: KEY,
      v: 'beta',
      loading: 'async',
      language: 'es',
      region: 'SV',
      callback,
    })
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.async = true
    script.onerror = () => {
      loading = null
      reject(new Error('maps_load_failed'))
    }
    document.head.appendChild(script)
  })
  return loading
}

/** Importa una librería del SDK (maps, marker, maps3d, geometry…). */
export async function importLibrary<T = any>(name: 'maps' | 'marker' | 'maps3d' | 'geometry' | 'core'): Promise<T> {
  const maps = await loadGoogleMaps()
  return maps.importLibrary(name) as Promise<T>
}

/** ¿El dispositivo puede dibujar el mapa 3D (WebGL2)? */
export function supportsWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

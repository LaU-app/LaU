// Ubicación del estudiante (GPS) con el plugin oficial @capacitor/geolocation.
// En Android pide el permiso nativo; en la web usa la geolocalización del navegador.
// La ubicación solo se usa en el teléfono (para saber en qué campus estás): no se envía al servidor.
import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import type { LatLng } from './campusGeo'

export function useGeolocation() {
  const position = ref<(LatLng & { accuracy: number }) | null>(null)
  const locating = ref(false)
  const error = ref('')

  async function locate(): Promise<(LatLng & { accuracy: number }) | null> {
    locating.value = true
    error.value = ''
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Geolocation.checkPermissions()
        if (status.location !== 'granted') {
          const asked = await Geolocation.requestPermissions({ permissions: ['location'] })
          if (asked.location !== 'granted') {
            error.value = 'Activá el permiso de ubicación para saber en qué campus estás.'
            return null
          }
        }
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 })
      position.value = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
      return position.value
    } catch (e) {
      const message = String((e as Error)?.message || '')
      error.value = /denied|permission/i.test(message)
        ? 'Activá el permiso de ubicación para saber en qué campus estás.'
        : 'No pudimos obtener tu ubicación. Revisá que el GPS esté encendido.'
      return null
    } finally {
      locating.value = false
    }
  }

  return { position, locating, error, locate }
}

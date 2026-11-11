<template>
  <section class="delivery-card study-card" :style="{ '--campus': tone }" aria-label="Lugar de entrega">
    <!-- Mapa vivo: edificios en 3D y la cámara girando despacio alrededor del punto de entrega -->
    <div class="dm-stage" :class="{ ready: mapReady }">
      <div ref="mapEl" class="dm-map" aria-hidden="true"/>
      <div v-if="!mapReady" class="dm-fallback" aria-hidden="true">
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="dm-grid" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
              <path d="M22 0H0V22" fill="none" stroke="currentColor" stroke-opacity=".12"/>
            </pattern>
          </defs>
          <rect width="320" height="160" fill="url(#dm-grid)"/>
          <circle class="dm-ring" cx="160" cy="84" r="54"/>
          <circle class="dm-ring delay" cx="160" cy="84" r="54"/>
        </svg>
      </div>
      <span class="dm-pin" aria-hidden="true"><i/><ion-icon :icon="locationSharp"/></span>
      <span class="dm-area">{{ areaLabel }}</span>
      <button v-if="mapReady && !reduceMotion" class="dm-spin" :aria-label="spinning ? 'Detener giro' : 'Girar vista'" @click="toggleSpin">
        <ion-icon :icon="spinning ? pauseOutline : syncOutline"/>
      </button>
    </div>

    <div class="dm-body">
      <div class="dm-title">
        <span class="dm-badge">{{ badge }}</span>
        <div>
          <b>Entrega en {{ campusName }}</b>
          <small>{{ place }}</small>
        </div>
      </div>

      <p v-if="distance" class="dm-distance" :class="{ inside: distance.inside }" role="status">
        <ion-icon :icon="distance.inside ? checkmarkCircleOutline : walkOutline"/>
        {{ distance.inside ? 'Estás dentro del campus' : `Estás a ${distance.label}` }}<span v-if="distance.walk"> · {{ distance.walk }} a pie</span>
      </p>
      <p v-else-if="geoError" class="dm-distance warn" role="status">{{ geoError }}</p>

      <div class="dm-actions">
        <a v-if="directionsUrl" class="dm-action primary" :href="directionsUrl" target="_blank" rel="noopener noreferrer">
          <ion-icon :icon="navigateOutline"/>Cómo llegar
        </a>
        <button v-if="center" class="dm-action" :disabled="locating" @click="measure">
          <ion-icon :icon="locating ? hourglassOutline : locateOutline"/>{{ locating ? 'Ubicando…' : '¿Qué tan lejos?' }}
        </button>
        <button class="dm-action" @click="openCampusMap"><ion-icon :icon="mapOutline"/>Mapa</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import {
  locationSharp, navigateOutline, locateOutline, mapOutline, walkOutline, checkmarkCircleOutline,
  hourglassOutline, syncOutline, pauseOutline,
} from 'ionicons/icons'
import { MAP_ID, hasMapsKey, importLibrary } from '@/utils/googleMaps'
import { distanceMeters, type LatLng } from '@/utils/campusGeo'
import { useGeolocation } from '@/utils/useGeolocation'
import type { ProductCampus } from '@/types/marketplace'

const props = defineProps<{
  campus: ProductCampus
  point?: LatLng | null
  deliveryPoint?: string | null
}>()

const router = useRouter()
const mapEl = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const spinning = ref(true)
const map = shallowRef<any>(null)
const { locate, locating, error: geoError } = useGeolocation()
const me = ref<LatLng | null>(null)
const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
let frame = 0
let observer: IntersectionObserver | null = null
let visible = true

const tone = computed(() => props.campus.color_primario || '#7c3aed')
const campusName = computed(() => (props.campus.siglas && props.campus.siglas.length <= 10 ? props.campus.siglas : props.campus.nombre))
// Siglas del campus; si no tiene, iniciales de las palabras importantes ("Universidad de El Salvador" → UES).
const badge = computed(() => {
  const siglas = props.campus.siglas?.trim()
  if (siglas && siglas.length <= 6) return siglas.toUpperCase()
  const initials = props.campus.nombre.split(/[\s-]+/)
    .filter(word => word && !/^(de|del|la|las|el|los|y)$/i.test(word))
    .map(word => word.charAt(0)).join('')
  return initials.slice(0, 4).toUpperCase() || 'U'
})
const campusCenter = computed<LatLng | null>(() =>
  props.campus.latitud != null && props.campus.longitud != null ? { lat: Number(props.campus.latitud), lng: Number(props.campus.longitud) } : null)
// Punto exacto si el vendedor lo marcó; si no, el centro del campus.
const center = computed<LatLng | null>(() => props.point ?? campusCenter.value)
const exact = computed(() => !!props.point)
const place = computed(() => props.deliveryPoint || (exact.value ? 'Punto exacto marcado por el vendedor' : 'Dentro del campus'))
const areaLabel = computed(() => exact.value ? 'Punto exacto' : `Área de ${props.campus.radio_entrega_m} m`)
const directionsUrl = computed(() => center.value
  ? `https://www.google.com/maps/dir/?api=1&destination=${center.value.lat},${center.value.lng}&travelmode=walking`
  : null)

const distance = computed(() => {
  if (!me.value || !center.value) return null
  const meters = distanceMeters(me.value, center.value)
  const inside = campusCenter.value ? distanceMeters(me.value, campusCenter.value) <= props.campus.radio_entrega_m + 60 : false
  const label = meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`
  // A pie, ~80 m por minuto; solo tiene sentido para distancias cortas.
  const minutes = Math.round(meters / 80)
  const walk = meters < 4000 && !inside ? `${Math.max(1, minutes)} min` : ''
  return { inside, label, walk }
})

async function measure() {
  const pos = await locate()
  if (pos) me.value = { lat: pos.lat, lng: pos.lng }
}

function openCampusMap() {
  void router.push({ path: '/tabs/marketplace/mapa', query: { campus: String(props.campus.id) } })
}

/** La cámara orbita despacio (solo mientras la tarjeta se ve en pantalla). */
function orbit() {
  cancelAnimationFrame(frame)
  let last = performance.now()
  const tick = (now: number) => {
    if (map.value && spinning.value && visible) {
      const heading = ((map.value.getHeading?.() ?? 0) + (now - last) * 0.006) % 360
      map.value.moveCamera?.({ heading })
    }
    last = now
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

function toggleSpin() {
  spinning.value = !spinning.value
}

async function initMap() {
  if (!hasMapsKey() || !center.value || !mapEl.value) return
  try {
    const { Map, Circle } = await importLibrary('maps')
    if (!mapEl.value) return
    const dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')
    const instance = new Map(mapEl.value, {
      center: center.value,
      zoom: exact.value ? 18.3 : Math.max(16.4, Math.min(18, 17.7 - Math.log2(props.campus.radio_entrega_m / 250))),
      tilt: 62,
      heading: 25,
      mapId: MAP_ID,
      colorScheme: dark ? 'DARK' : 'LIGHT',
      disableDefaultUI: true,
      gestureHandling: 'none',
      keyboardShortcuts: false,
      clickableIcons: false,
      renderingType: 'VECTOR',
    })
    if (campusCenter.value) {
      new Circle({
        map: instance,
        center: campusCenter.value,
        radius: props.campus.radio_entrega_m,
        strokeColor: tone.value,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: tone.value,
        fillOpacity: 0.12,
        clickable: false,
      })
    }
    map.value = instance
    instance.addListener?.('tilesloaded', () => { mapReady.value = true })
    // Si los mosaicos tardan, igual se muestra el mapa al rato.
    setTimeout(() => { if (map.value) mapReady.value = true }, 2500)
    if (!reduceMotion) orbit()
  } catch {
    mapReady.value = false
  }
}

onMounted(() => {
  if (mapEl.value && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting })
    observer.observe(mapEl.value)
  }
  void initMap()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  map.value = null
})
</script>

<style scoped>
.delivery-card { padding: 0; overflow: hidden; border-radius: 26px; display: grid; }
.dm-stage { position: relative; height: 190px; overflow: hidden; color: var(--campus);
  background: radial-gradient(120% 90% at 50% 60%, color-mix(in srgb, var(--campus) 26%, transparent), transparent 70%), var(--study-bg); }
.dm-map { position: absolute; inset: 0; opacity: 0; transition: opacity .8s ease; }
.dm-stage.ready .dm-map { opacity: 1; }
/* Degradado inferior: el mapa se funde con la tarjeta. */
.dm-stage::after { content: ''; position: absolute; inset: auto 0 0; height: 56px; pointer-events: none;
  background: linear-gradient(to bottom, transparent, var(--study-surface)); }
.dm-fallback { position: absolute; inset: 0; }
.dm-fallback svg { width: 100%; height: 100%; }
.dm-ring { fill: color-mix(in srgb, var(--campus) 14%, transparent); stroke: var(--campus); stroke-width: 2; transform-origin: 160px 84px; animation: dm-pulse 2.8s ease-out infinite; }
.dm-ring.delay { animation-delay: 1.4s; fill: none; }
@keyframes dm-pulse { from { transform: scale(.35); opacity: 1; } to { transform: scale(1.35); opacity: 0; } }
.dm-pin { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -88%); display: grid; place-items: center; pointer-events: none; z-index: 2; }
.dm-pin ion-icon { font-size: 42px; color: var(--campus); filter: drop-shadow(0 6px 10px rgba(0, 0, 0, .35)); animation: dm-bob 2.4s ease-in-out infinite; }
.dm-pin i { position: absolute; bottom: -4px; width: 16px; height: 6px; border-radius: 50%; background: rgba(0, 0, 0, .28); filter: blur(2px); }
@keyframes dm-bob { 50% { transform: translateY(-5px); } }
.dm-area { position: absolute; left: 14px; top: 14px; z-index: 2; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
  color: #fff; background: color-mix(in srgb, var(--campus) 82%, #000); box-shadow: 0 6px 16px -8px rgba(0, 0, 0, .5); }
.dm-spin { position: absolute; right: 12px; top: 12px; z-index: 2; width: 34px; height: 34px; border: 0; border-radius: 50%; display: grid; place-items: center;
  background: color-mix(in srgb, var(--study-surface) 88%, transparent); color: var(--study-text); backdrop-filter: blur(8px); font-size: 16px; }
.dm-body { display: grid; gap: 12px; padding: 4px 16px 16px; position: relative; z-index: 1; }
.dm-title { display: flex; align-items: center; gap: 12px; }
.dm-title > div { display: grid; gap: 2px; min-width: 0; }
.dm-title b { font-size: 16px; line-height: 21px; letter-spacing: -.01em; }
.dm-title small { font-size: 13px; color: var(--study-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dm-badge { width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0; display: grid; place-items: center; font-size: 11px; font-weight: 900; letter-spacing: .02em;
  color: #fff; background: linear-gradient(140deg, var(--campus), color-mix(in srgb, var(--campus) 55%, #000)); box-shadow: 0 8px 18px -10px var(--campus); }
.dm-distance { display: flex; align-items: center; gap: 6px; margin: 0; padding: 9px 12px; border-radius: 14px; font-size: 13px; font-weight: 600;
  background: var(--study-bg); color: var(--study-text); }
.dm-distance ion-icon { font-size: 17px; color: var(--campus); }
.dm-distance.inside { background: var(--study-green-soft); color: var(--study-green-ink); }
.dm-distance.inside ion-icon { color: var(--study-green-ink); }
.dm-distance.warn { color: var(--study-orange); font-weight: 500; }
.dm-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.dm-action { flex: 1 1 auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 999px;
  border: 1px solid var(--study-border); background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; white-space: nowrap; }
.dm-action ion-icon { font-size: 16px; }
.dm-action.primary { border-color: transparent; background: var(--campus); color: #fff; }
.dm-action:disabled { opacity: .6; }
@media (prefers-reduced-motion: reduce) {
  .dm-ring, .dm-pin ion-icon { animation: none; }
}
</style>

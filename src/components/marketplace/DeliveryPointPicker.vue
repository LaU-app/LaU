<template>
  <div class="dpp">
    <p v-if="!campus" class="dpp-hint"><ion-icon :icon="schoolOutline" aria-hidden="true"/>Elegí el campus primero.</p>
    <p v-else-if="!center" class="dpp-hint"><ion-icon :icon="mapOutline" aria-hidden="true"/>Este campus todavía no está en el mapa. Describí el punto de entrega abajo.</p>
    <p v-else-if="status === 'off'" class="dpp-hint"><ion-icon :icon="mapOutline" aria-hidden="true"/>El mapa no está disponible. Describí el punto de entrega abajo.</p>

    <template v-else>
      <div class="dpp-map" :class="{ 'is-disabled': disabled }">
        <div ref="host" class="dpp-canvas" role="application" :aria-label="`Mapa de ${label} para marcar el punto de entrega`"/>
        <div v-if="status === 'loading'" class="dpp-loading" aria-hidden="true"/>
        <span v-else-if="!modelValue && !disabled" class="dpp-tip">Tocá dentro del área para marcar el punto</span>
      </div>

      <p v-if="message" class="dpp-msg" role="alert"><ion-icon :icon="alertCircleOutline" aria-hidden="true"/>{{ message }}</p>

      <div class="dpp-actions">
        <button type="button" class="dpp-btn" :disabled="disabled || locating" @click="useMyLocation">
          <ion-icon :icon="locateOutline" aria-hidden="true"/>{{ locating ? 'Buscando…' : 'Usar mi ubicación' }}
        </button>
        <button v-if="modelValue" type="button" class="dpp-btn is-ghost" :disabled="disabled" @click="clear">
          <ion-icon :icon="closeOutline" aria-hidden="true"/>Quitar punto
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
// Punto de entrega dentro del campus: el pin solo se acepta dentro del área de entrega.
// El backend repite la validación; acá solo se evita que el estudiante elija un punto inválido.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { alertCircleOutline, closeOutline, locateOutline, mapOutline, schoolOutline } from 'ionicons/icons'
import { MAP_ID, hasMapsKey, importLibrary } from '@/utils/googleMaps'
import { campusCenter, distanceMeters, formatDistance, isInsideCampus, type LatLng } from '@/utils/campusGeo'
import { useGeolocation } from '@/utils/useGeolocation'
import { campusLabel, type Campus } from '@/services/campusService'

const props = withDefaults(defineProps<{
  campus: Campus | null
  modelValue: { lat: number; lng: number } | null
  disabled?: boolean
}>(), { disabled: false })
const emit = defineEmits<{ 'update:modelValue': [value: { lat: number; lng: number } | null] }>()

const PIN_COLOR = '#7b32d9'

const host = ref<HTMLDivElement | null>(null)
const status = ref<'loading' | 'ready' | 'off'>(hasMapsKey() ? 'loading' : 'off')
const message = ref('')
const { locating, error: geoError, locate } = useGeolocation()

const center = computed(() => (props.campus ? campusCenter(props.campus) : null))
const label = computed(() => campusLabel(props.campus))
const radius = computed(() => Math.max(50, Number(props.campus?.radio_entrega_m) || 300))
const areaColor = computed(() => {
  const raw = (props.campus?.color_primario || '').trim()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : PIN_COLOR
})
const outsideText = () => `El punto de entrega tiene que estar dentro de ${label.value}.`

let map: any = null
let circle: any = null
let marker: any = null
let markerLib: any = null
let listeners: any[] = []
let observer: ResizeObserver | null = null
let pendingEl: HTMLElement | null = null
let disposed = false

function toLatLng(p: any): LatLng | null {
  if (!p) return null
  const lat = typeof p.lat === 'function' ? p.lat() : p.lat
  const lng = typeof p.lng === 'function' ? p.lng() : p.lng
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

const isInside = (point: LatLng) => !!props.campus && isInsideCampus(props.campus, point)

/* ---------- Mapa ---------- */

// En la hoja del formulario el contenedor empieza sin tamaño: se espera a que lo tenga.
function watchSize(el: HTMLElement) {
  observer?.disconnect()
  observer = null
  const tryInit = () => {
    if (map || pendingEl === el || disposed || el.clientWidth < 10 || el.clientHeight < 10) return false
    void initMap(el)
    return true
  }
  if (typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(() => { tryInit() })
    observer.observe(el)
  } else {
    let tries = 0
    const tick = () => { if (!tryInit() && !map && !disposed && tries++ < 60) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }
}

async function initMap(el: HTMLElement) {
  pendingEl = el
  status.value = 'loading'
  try {
    const [mapsLib, mkLib] = await Promise.all([importLibrary('maps'), importLibrary('marker')])
    if (disposed || host.value !== el || !center.value) return
    markerLib = mkLib
    map = new mapsLib.Map(el, {
      center: center.value,
      zoom: 17,
      mapId: MAP_ID,
      mapTypeId: 'hybrid',
      tilt: 0,
      disableDefaultUI: true,
      // En un formulario con scroll, un dedo desplaza la hoja y dos mueven el mapa.
      gestureHandling: 'cooperative',
      clickableIcons: false,
      keyboardShortcuts: false,
    })
    circle = new mapsLib.Circle({
      map, center: center.value, radius: radius.value, clickable: false,
      strokeColor: '#ffffff', strokeOpacity: 0.95, strokeWeight: 2,
      fillColor: areaColor.value, fillOpacity: 0.22,
    })
    listeners.push(map.addListener('click', (event: any) => onTap(toLatLng(event?.latLng))))
    syncMarker()
    status.value = 'ready'
    observer?.disconnect()
    observer = null
  } catch {
    if (!disposed) {
      teardown()
      status.value = 'off'
    }
  } finally {
    if (pendingEl === el) pendingEl = null
  }
}

function makePin(): HTMLElement | undefined {
  const Pin = markerLib?.PinElement
  if (typeof Pin !== 'function') return undefined
  try {
    const pin = new Pin({ background: PIN_COLOR, borderColor: '#ffffff', glyphColor: '#ffffff', scale: 1.15 })
    const node = pin instanceof HTMLElement ? pin : pin?.element
    return node instanceof HTMLElement ? node : undefined
  } catch {
    return undefined
  }
}

function syncMarker() {
  if (!map || !markerLib) return
  const value = props.modelValue
  if (!value) {
    removeMarker()
    return
  }
  if (marker) {
    marker.position = value
    return
  }
  const content = makePin()
  marker = new markerLib.AdvancedMarkerElement({
    map, position: value, title: 'Punto de entrega', gmpDraggable: !props.disabled, zIndex: 10,
    ...(content ? { content } : {}),
  })
  const drag = marker.addListener('dragend', (event: any) => onDragEnd(event))
  listeners.push(drag)
}

function removeMarker() {
  if (!marker) return
  marker.map = null
  marker = null
}

function teardown() {
  observer?.disconnect()
  observer = null
  listeners.forEach((l) => { try { l?.remove?.() } catch { /* ya removido */ } })
  listeners = []
  removeMarker()
  try { circle?.setMap(null) } catch { /* sin círculo */ }
  circle = null
  map = null
}

/* ---------- Acciones ---------- */

function onTap(point: LatLng | null) {
  if (props.disabled || !point) return
  if (isInside(point)) {
    message.value = ''
    emit('update:modelValue', point)
  } else {
    message.value = outsideText()
  }
}

function onDragEnd(event: any) {
  const point = toLatLng(event?.latLng) ?? toLatLng(marker?.position)
  if (point && isInside(point)) {
    message.value = ''
    emit('update:modelValue', point)
    return
  }
  // Fuera del campus: el pin vuelve a donde estaba.
  message.value = outsideText()
  if (marker && props.modelValue) marker.position = props.modelValue
}

async function useMyLocation() {
  message.value = ''
  const position = await locate()
  if (!position) {
    message.value = geoError.value
    return
  }
  const point = { lat: position.lat, lng: position.lng }
  if (!center.value) return
  if (isInside(point)) {
    emit('update:modelValue', point)
    map?.panTo?.(point)
  } else {
    message.value = `Estás a ${formatDistance(distanceMeters(center.value, point))} de ${label.value}.`
  }
}

function clear() {
  message.value = ''
  emit('update:modelValue', null)
}

/* ---------- Reacciones ---------- */

watch(host, (el, previous) => {
  if (previous && previous !== el) teardown()
  if (el && status.value !== 'off') watchSize(el)
}, { flush: 'post' })

// Cambió el campus o su área: se recentra el mapa.
watch(() => `${center.value?.lat}|${center.value?.lng}|${radius.value}|${areaColor.value}`, () => {
  message.value = ''
  if (!map || !center.value) return
  map.setCenter(center.value)
  map.setZoom(17)
  circle?.setOptions({ center: center.value, radius: radius.value, fillColor: areaColor.value })
})

// Un punto que ya no está dentro del campus elegido se quita (el backend lo rechazaría).
watch(() => props.campus?.id ?? null, (id, previousId) => {
  const value = props.modelValue
  if (!value || id === null || !props.campus) return
  const changedCampus = previousId !== undefined && previousId !== null && previousId !== id
  if (center.value ? !isInside(value) : changedCampus) emit('update:modelValue', null)
}, { immediate: true })

watch(() => props.modelValue, syncMarker, { deep: true })

watch(() => props.disabled, (disabled) => {
  if (marker) marker.gmpDraggable = !disabled
})

onBeforeUnmount(() => {
  disposed = true
  teardown()
})
</script>

<style scoped>
.dpp { display: grid; gap: 10px; }
.dpp-hint { display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 12px 14px; border: 1px dashed var(--study-border, rgba(20,20,22,.08)); border-radius: 16px; background: var(--study-bg, #f7f7f4); color: var(--study-muted, #6e6d7a); font-size: 12px; line-height: 18px; }
.dpp-hint ion-icon { flex-shrink: 0; margin-top: 1px; font-size: 16px; color: var(--study-purple, #7b32d9); }
.dpp-map { position: relative; height: 220px; overflow: hidden; isolation: isolate; border: 1px solid var(--study-border, rgba(20,20,22,.08)); border-radius: 18px; background: var(--study-track, #efede7); }
.dpp-canvas { position: absolute; inset: 0; }
.dpp-loading { position: absolute; inset: 0; z-index: 1; background: var(--study-track, #efede7); animation: dpp-pulse 1.4s ease-in-out infinite; pointer-events: none; }
.dpp-tip { position: absolute; left: 50%; bottom: 10px; z-index: 1; max-width: calc(100% - 20px); padding: 6px 12px; border-radius: 999px; background: rgba(20,20,22,.72); color: #fff; font-size: 11px; font-weight: 700; line-height: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transform: translateX(-50%); pointer-events: none; }
.dpp-map.is-disabled { opacity: .7; }
.dpp-msg { display: flex; align-items: flex-start; gap: 6px; margin: 0; color: var(--study-orange, #f97316); font-size: 12px; font-weight: 600; line-height: 17px; }
.dpp-msg ion-icon { flex-shrink: 0; margin-top: 1px; font-size: 15px; }
.dpp-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.dpp-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 8px 14px; border: 1px solid var(--study-border, rgba(20,20,22,.08)); border-radius: 999px; background: var(--study-surface, #fff); color: var(--study-text, #141416); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.dpp-btn ion-icon { font-size: 17px; color: var(--study-purple, #7b32d9); }
.dpp-btn.is-ghost { background: transparent; color: var(--study-muted, #6e6d7a); }
.dpp-btn.is-ghost ion-icon { color: inherit; }
.dpp-btn:disabled { opacity: .5; cursor: default; }
@keyframes dpp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
@media (prefers-reduced-motion: reduce) { .dpp-loading { animation: none; } }
</style>

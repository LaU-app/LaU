<template>
  <div class="campus-map3d" :class="`is-${state}`" role="region" aria-label="Mapa de campus">
    <div ref="host" class="campus-map3d-host"/>
    <div v-if="state === 'loading'" class="campus-map3d-veil" aria-hidden="true"><span/></div>
    <div v-else-if="state === 'off'" class="campus-map3d-off">
      <ion-icon :icon="mapOutline" aria-hidden="true"/>
      <span>Mapa no disponible</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
// Mapa de los campus. Dos estilos:
// - "estructuras" (por defecto): mapa vectorial inclinado; los edificios se ven como bloques 3D lisos.
// - "satelite": 3D fotorrealista (Map3DElement, vista previa de Google), con relieve.
// Las APIs de Google cambian entre versiones: cada propiedad se revisa antes de usarla y cualquier
// fallo termina en el mapa 2D o en "unavailable", nunca en una pantalla rota.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { mapOutline } from 'ionicons/icons'
import { EL_SALVADOR, MAP_ID, hasMapsKey, importLibrary, loadGoogleMaps, supportsWebGL2 } from '@/utils/googleMaps'
import { campusCenter, nearestCampus, type LatLng } from '@/utils/campusGeo'
import { campusLabel, type Campus } from '@/services/campusService'

const props = withDefaults(defineProps<{
  campuses: Campus[]
  selectedId: number | null
  me?: { lat: number; lng: number } | null
  mode?: 'estructuras' | 'satelite'
}>(), { me: null, mode: 'estructuras' })
const emit = defineEmits<{ select: [id: number]; ready: [mode: '3d' | '2d']; unavailable: [] }>()

type Entry = { dispose: () => void; highlight?: (on: boolean) => void }
type Camera3D = { center: LatLng & { altitude: number }; range: number; tilt: number; heading: number }
type Camera2D = { center: LatLng; zoom: number; tilt: number; heading: number }

// Vista inicial: todo El Salvador, inclinado (el centro va un poco al sur porque la cámara mira al norte).
const SV_BOUNDS = { north: 14.46, south: 13.14, west: -90.14, east: -87.68 }
const SV_OVERVIEW = { lat: 13.62, lng: -88.92 }
const FALLBACK_COLOR = '#7b32d9'
const ME_COLOR = '#2853e0'

const host = ref<HTMLDivElement | null>(null)
const state = ref<'loading' | '3d' | '2d' | 'off'>('loading')
const reduceMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const located = computed(() => props.campuses.filter((c) => campusCenter(c) !== null))
// Solo se vuelve a dibujar cuando cambia algo que se ve en el mapa.
const signature = computed(() => located.value
  .map((c) => [c.id, c.latitud, c.longitud, c.radio_entrega_m, c.color_primario, c.products_count ?? 0, c.siglas, c.nombre].join(':'))
  .join('|'))

let map3d: any = null
let map2d: any = null
let lib3d: any = null
let mapsLib: any = null
let markerLib: any = null
let entries = new Map<number, Entry>()
let meEntry: Entry | null = null
let cleanups: Array<() => void> = []
let timers: ReturnType<typeof setTimeout>[] = []
let frame = 0
let disposed = false
let starting = false
let lastSelect = { id: 0, at: 0 }

/* ---------- Utilidades ---------- */

/** Asigna una propiedad solo si existe en esta versión del SDK. */
function assign(target: any, key: string, value: unknown): boolean {
  try {
    if (target && key in target) {
      target[key] = value
      return true
    }
  } catch { /* la versión cargada no acepta este valor */ }
  return false
}

function safeRemove(node: any) {
  try { node?.remove?.() } catch { /* ya no está en el mapa */ }
}

const radiusOf = (c: Campus) => Math.max(50, Number(c.radio_entrega_m) || 300)

function colorOf(c: Campus) {
  const raw = (c.color_primario || '').trim()
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw
  if (/^#[0-9a-f]{3}$/i.test(raw)) return '#' + raw.slice(1).split('').map((x) => x + x).join('')
  return FALLBACK_COLOR
}

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** Convierte LatLng (métodos), LatLngAltitude (getters) o literales a { lat, lng }. */
function toLatLng(p: any): LatLng | null {
  if (!p) return null
  const lat = typeof p.lat === 'function' ? p.lat() : p.lat
  const lng = typeof p.lng === 'function' ? p.lng() : p.lng
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

/** Círculo aproximado (polígono) para el área de entrega en 3D. */
function ring(center: LatLng, meters: number, steps = 48) {
  const dLat = meters / 111320
  const dLng = meters / (111320 * Math.cos((center.lat * Math.PI) / 180))
  const points: Array<LatLng & { altitude: number }> = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI
    points.push({ lat: center.lat + dLat * Math.sin(a), lng: center.lng + dLng * Math.cos(a), altitude: 0 })
  }
  return points
}

const markerLabel = (c: Campus) => ((c.products_count ?? 0) > 0 ? `${campusLabel(c)} · ${c.products_count}` : campusLabel(c))

// Zoom 2D según el radio: el área completa cabe en un teléfono.
const zoomFor = (radius: number) => Math.max(16.5, Math.min(18.5, 17.6 - Math.log2(radius / 250)))

function overviewRange() {
  const box = host.value?.getBoundingClientRect()
  const aspect = box && box.height > 0 ? box.width / box.height : 1
  return aspect >= 1.2 ? 330000 : aspect >= 0.8 ? 420000 : 560000
}

function emitSelect(id: number) {
  // El marcador y el mapa pueden avisar el mismo toque: se emite una sola vez.
  const now = Date.now()
  if (lastSelect.id === id && now - lastSelect.at < 400) return
  lastSelect = { id, at: now }
  emit('select', id)
}

function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}

function appendPin(target: any, color: string, scale: number) {
  const Pin = markerLib?.PinElement
  if (typeof Pin !== 'function') return
  try {
    const pin = new Pin({ background: color, borderColor: '#ffffff', glyphColor: '#ffffff', scale })
    const node = pin instanceof HTMLElement ? pin : pin?.element
    if (node instanceof Node) target.append(node)
  } catch { /* se usa el pin por defecto */ }
}

/* ---------- Arranque ---------- */

function goOff() {
  state.value = 'off'
  emit('unavailable')
}

async function start() {
  if (starting || map3d || map2d || disposed) return
  if (!hasMapsKey() || !located.value.length || !host.value) {
    goOff()
    return
  }
  starting = true
  state.value = 'loading'
  try {
    await loadGoogleMaps()
    if (disposed) return
    let ok3d = false
    if (props.mode === 'satelite' && supportsWebGL2()) {
      try { ok3d = await start3D() } catch { ok3d = false }
    }
    if (ok3d || disposed) return
    teardown()
    await start2D()
  } catch {
    if (!disposed) {
      teardown()
      goOff()
    }
  } finally {
    starting = false
  }
}

async function start3D(): Promise<boolean> {
  const lib = await importLibrary('maps3d')
  const Map3D = lib?.Map3DElement
  if (disposed || !host.value || typeof Map3D !== 'function') return false
  markerLib = await importLibrary('marker').catch(() => null)
  if (disposed || !host.value) return false

  const el: any = new Map3D()
  el.style.cssText = 'display:block;width:100%;height:100%'
  el.center = { ...SV_OVERVIEW, altitude: 0 }
  el.range = overviewRange()
  el.tilt = 48
  el.heading = 0
  // Sin "mode" las versiones recientes no dibujan nada.
  assign(el, 'mode', lib.MapMode?.HYBRID ?? 'HYBRID')
  if (!assign(el, 'defaultUIHidden', true)) assign(el, 'defaultUIDisabled', true)
  assign(el, 'gestureHandling', lib.GestureHandling?.GREEDY ?? 'GREEDY')

  const onError = () => { if (map3d === el) void fallbackTo2D() }
  // Toque sobre el área de un campus (también sirve si no hay marcadores interactivos).
  const onClick = (event: any) => {
    if (event?.target !== el) return
    const point = toLatLng(event.position)
    const hit = point ? nearestCampus(located.value, point) : null
    if (hit?.inside) emitSelect(hit.campus.id)
  }
  el.addEventListener('gmp-error', onError)
  el.addEventListener('gmp-click', onClick)
  cleanups.push(() => {
    el.removeEventListener('gmp-error', onError)
    el.removeEventListener('gmp-click', onClick)
  })

  host.value.appendChild(el)
  map3d = el
  lib3d = lib
  drawAll()
  drawMe()
  state.value = '3d'
  emit('ready', '3d')
  introFlight()
  return true
}

async function start2D() {
  const [maps, marker] = await Promise.all([importLibrary('maps'), importLibrary('marker')])
  if (disposed || !host.value) return
  const core = await importLibrary('core').catch(() => null)
  if (disposed || !host.value) return
  mapsLib = maps
  markerLib = marker

  const canvas = document.createElement('div')
  canvas.style.cssText = 'width:100%;height:100%'
  host.value.appendChild(canvas)
  const dark = document.documentElement.classList.contains('ion-palette-dark')
  map2d = new maps.Map(canvas, {
    center: EL_SALVADOR,
    zoom: 8,
    mapId: MAP_ID,
    tilt: 45,
    heading: 0,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
    renderingType: maps.RenderingType?.VECTOR,
    colorScheme: dark ? core?.ColorScheme?.DARK : core?.ColorScheme?.LIGHT,
  })
  map2d.fitBounds(SV_BOUNDS, 24)
  drawAll()
  drawMe()
  state.value = '2d'
  emit('ready', '2d')
  introFlight()
}

async function fallbackTo2D() {
  teardown()
  try {
    await start2D()
  } catch {
    if (!disposed) {
      teardown()
      goOff()
    }
  }
}

// Primero se ve el país; luego la cámara vuela al campus elegido.
function introFlight() {
  if (props.selectedId === null) return
  later(() => { if (props.selectedId !== null) flyTo(props.selectedId) }, reduceMotion ? 0 : 1100)
}

/* ---------- Campus ---------- */

function drawAll() {
  entries.forEach((e) => e.dispose())
  entries = new Map()
  for (const c of located.value) drawCampus(c)
}

function drawCampus(c: Campus) {
  entries.get(c.id)?.dispose()
  const entry = map3d ? drawCampus3D(c) : map2d ? drawCampus2D(c) : null
  if (entry) entries.set(c.id, entry)
  else entries.delete(c.id)
}

function refresh(id: number | null | undefined) {
  if (id === null || id === undefined) return
  const entry = entries.get(id)
  if (entry?.highlight) {
    entry.highlight(props.selectedId === id)
    return
  }
  const campus = located.value.find((c) => c.id === id)
  if (campus) drawCampus(campus)
}

function drawCampus3D(c: Campus): Entry | null {
  const center = campusCenter(c)
  if (!center || !map3d || !lib3d) return null
  const selected = props.selectedId === c.id
  const color = colorOf(c)
  const parts: any[] = []

  // Área de entrega pegada al terreno.
  if (typeof lib3d.Polygon3DElement === 'function') {
    try {
      const area = new lib3d.Polygon3DElement()
      const path = ring(center, radiusOf(c))
      if (!assign(area, 'path', path)) assign(area, 'outerCoordinates', path)
      assign(area, 'altitudeMode', 'CLAMP_TO_GROUND')
      assign(area, 'fillColor', rgba(color, selected ? 0.34 : 0.18))
      assign(area, 'strokeColor', selected ? '#ffffff' : rgba(color, 0.9))
      assign(area, 'strokeWidth', selected ? 4 : 2)
      assign(area, 'drawsOccludedSegments', true)
      map3d.append(area)
      parts.push(area)
    } catch { /* sin área en esta versión */ }
  }

  const MarkerClass = lib3d.Marker3DInteractiveElement ?? lib3d.Marker3DElement
  if (typeof MarkerClass === 'function') {
    try {
      const marker = new MarkerClass()
      assign(marker, 'position', { ...center, altitude: selected ? 90 : 50 })
      assign(marker, 'altitudeMode', 'RELATIVE_TO_GROUND')
      assign(marker, 'extruded', true)
      assign(marker, 'label', markerLabel(c))
      assign(marker, 'title', c.nombre)
      assign(marker, 'drawsWhenOccluded', true)
      assign(marker, 'sizePreserved', true)
      assign(marker, 'zIndex', selected ? 10 : 1)
      appendPin(marker, color, selected ? 1.35 : 1)
      const onClick = () => emitSelect(c.id)
      marker.addEventListener('gmp-click', onClick)
      map3d.append(marker)
      parts.push(marker)
    } catch { /* el área sigue respondiendo al toque */ }
  }

  if (!parts.length) return null
  return { dispose: () => parts.forEach(safeRemove) }
}

function markerClick(marker: any, fn: () => void): () => void {
  if ('gmpClickable' in marker) {
    marker.gmpClickable = true
    marker.addEventListener('gmp-click', fn)
    return () => marker.removeEventListener('gmp-click', fn)
  }
  const listener = marker.addListener?.('click', fn)
  return () => listener?.remove?.()
}

function drawCampus2D(c: Campus): Entry | null {
  const center = campusCenter(c)
  if (!center || !map2d || !mapsLib || !markerLib) return null
  const selected = props.selectedId === c.id
  const color = colorOf(c)
  const select = () => emitSelect(c.id)

  const circle = new mapsLib.Circle({
    map: map2d, center, radius: radiusOf(c), clickable: true,
    strokeColor: color, strokeOpacity: 0.95, strokeWeight: selected ? 3 : 2,
    fillColor: color, fillOpacity: selected ? 0.26 : 0.12, zIndex: selected ? 2 : 1,
  })
  const circleListener = circle.addListener('click', select)

  // Etiqueta: punto de color + siglas + productos (textContent, nunca HTML del servidor).
  const pill = document.createElement('div')
  pill.className = selected ? 'cm-pin is-selected' : 'cm-pin'
  const dot = document.createElement('i')
  dot.style.background = color
  const name = document.createElement('b')
  name.textContent = campusLabel(c)
  pill.append(dot, name)
  if ((c.products_count ?? 0) > 0) {
    const count = document.createElement('small')
    count.textContent = String(c.products_count)
    pill.append(count)
  }

  const marker = new markerLib.AdvancedMarkerElement({ map: map2d, position: center, content: pill, title: c.nombre, zIndex: selected ? 10 : 1 })
  const offClick = markerClick(marker, select)

  return {
    dispose: () => {
      circleListener?.remove?.()
      offClick()
      circle.setMap(null)
      marker.map = null
    },
    highlight: (on) => {
      pill.classList.toggle('is-selected', on)
      circle.setOptions({ fillOpacity: on ? 0.26 : 0.12, strokeWeight: on ? 3 : 2, zIndex: on ? 2 : 1 })
      marker.zIndex = on ? 10 : 1
    },
  }
}

/* ---------- Estudiante ---------- */

function drawMe() {
  meEntry?.dispose()
  meEntry = null
  const me = props.me
  if (!me || !Number.isFinite(me.lat) || !Number.isFinite(me.lng)) return
  meEntry = map3d ? drawMe3D(me) : map2d ? drawMe2D(me) : null
}

function drawMe3D(me: LatLng): Entry | null {
  const MarkerClass = lib3d?.Marker3DElement
  if (typeof MarkerClass !== 'function' || !map3d) return null
  try {
    const marker = new MarkerClass()
    assign(marker, 'position', { ...me, altitude: 25 })
    assign(marker, 'altitudeMode', 'RELATIVE_TO_GROUND')
    assign(marker, 'extruded', true)
    assign(marker, 'label', 'Estás aquí')
    assign(marker, 'drawsWhenOccluded', true)
    assign(marker, 'zIndex', 20)
    appendPin(marker, ME_COLOR, 1)
    map3d.append(marker)
    return { dispose: () => safeRemove(marker) }
  } catch {
    return null
  }
}

function drawMe2D(me: LatLng): Entry | null {
  if (!map2d || !markerLib) return null
  const dot = document.createElement('div')
  dot.className = 'cm-me'
  const marker = new markerLib.AdvancedMarkerElement({ map: map2d, position: me, content: dot, title: 'Estás aquí', zIndex: 20 })
  return { dispose: () => { marker.map = null } }
}

/* ---------- Cámara ---------- */

function camera3D(endCamera: Camera3D, durationMillis: number) {
  const el = map3d
  if (!el) return
  try { el.stopCameraAnimation?.() } catch { /* sin animación activa */ }
  if (!reduceMotion && typeof el.flyCameraTo === 'function') {
    try {
      el.flyCameraTo({ endCamera, durationMillis })
      return
    } catch { /* se mueve sin animación */ }
  }
  assign(el, 'center', endCamera.center)
  assign(el, 'range', endCamera.range)
  assign(el, 'tilt', endCamera.tilt)
  assign(el, 'heading', endCamera.heading)
}

function camera2D(target: Camera2D) {
  const map = map2d
  if (!map) return
  cancelAnimationFrame(frame)
  if (typeof map.moveCamera !== 'function') {
    map.setCenter(target.center)
    map.setZoom(target.zoom)
    return
  }
  // La tarjeta del campus tapa la parte de abajo: al llegar, el punto sube a la zona visible.
  const settle = () => { if (map === map2d) map.panBy?.(0, Math.round((host.value?.clientHeight ?? 0) * 0.14)) }
  if (reduceMotion) {
    map.moveCamera(target)
    settle()
    return
  }
  const from = {
    center: toLatLng(map.getCenter?.()) ?? target.center,
    zoom: Number(map.getZoom?.() ?? target.zoom),
    tilt: Number(map.getTilt?.() ?? 0),
    heading: Number(map.getHeading?.() ?? 0),
  }
  const startedAt = performance.now()
  const duration = 1400
  const mix = (a: number, b: number, k: number) => a + (b - a) * k
  const step = (now: number) => {
    if (map !== map2d) return
    const t = Math.min(1, (now - startedAt) / duration)
    const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    map.moveCamera({
      center: { lat: mix(from.center.lat, target.center.lat, k), lng: mix(from.center.lng, target.center.lng, k) },
      zoom: mix(from.zoom, target.zoom, k),
      tilt: mix(from.tilt, target.tilt, k),
      heading: mix(from.heading, target.heading, k),
    })
    if (t < 1) frame = requestAnimationFrame(step)
    else settle()
  }
  frame = requestAnimationFrame(step)
}

function flyTo(id: number) {
  const campus = located.value.find((c) => c.id === id)
  const center = campus ? campusCenter(campus) : null
  if (!campus || !center) return
  const radius = radiusOf(campus)
  // En satélite la cámara mira de frente (poca inclinación): con mucha inclinación el punto se desplaza
  // porque el relieve de El Salvador está a cientos de metros sobre el nivel del mar.
  if (map3d) camera3D({ center: { ...center, altitude: 0 }, range: Math.min(4000, Math.max(500, radius * 4.5)), tilt: 25, heading: 0 }, 2200)
  else if (map2d) camera2D({ center, zoom: zoomFor(radius), tilt: 60, heading: 20 })
}

/** Lleva la cámara a un punto (por ejemplo, la ubicación del estudiante). */
function flyToPoint(point: LatLng) {
  if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lng)) return
  if (map3d) camera3D({ center: { ...point, altitude: 0 }, range: 900, tilt: 20, heading: 0 }, 1800)
  else if (map2d) camera2D({ center: point, zoom: 17.5, tilt: 55, heading: 0 })
}

function flyHome() {
  if (map3d) camera3D({ center: { ...SV_OVERVIEW, altitude: 0 }, range: overviewRange(), tilt: 48, heading: 0 }, 2200)
  else if (map2d) {
    cancelAnimationFrame(frame)
    map2d.fitBounds(SV_BOUNDS, 24)
  }
}

/* ---------- Ciclo de vida ---------- */

function teardown() {
  cancelAnimationFrame(frame)
  timers.forEach(clearTimeout)
  timers = []
  entries.forEach((e) => e.dispose())
  entries = new Map()
  meEntry?.dispose()
  meEntry = null
  cleanups.forEach((fn) => { try { fn() } catch { /* ya limpio */ } })
  cleanups = []
  if (map3d) {
    try { map3d.stopCameraAnimation?.() } catch { /* sin animación */ }
    safeRemove(map3d)
    map3d = null
  }
  if (map2d) {
    try { (window as any).google?.maps?.event?.clearInstanceListeners?.(map2d) } catch { /* sin listeners */ }
    map2d = null
  }
  if (host.value) host.value.textContent = ''
}

watch(() => props.selectedId, (id, previous) => {
  if (!map3d && !map2d) return
  refresh(previous)
  refresh(id)
  if (id !== null) flyTo(id)
  else flyHome()
})

watch(signature, () => {
  if (map3d || map2d) {
    if (!located.value.length) {
      teardown()
      goOff()
      return
    }
    drawAll()
  } else if (state.value === 'off' && located.value.length && hasMapsKey()) {
    void start()
  }
})

watch(() => props.me, drawMe, { deep: true })

// Cambiar de estilo (estructuras ↔ satélite) vuelve a crear el mapa en el campus elegido.
watch(() => props.mode, () => {
  teardown()
  state.value = 'loading'
  void start()
})

onMounted(() => { void start() })
onBeforeUnmount(() => {
  disposed = true
  teardown()
})

defineExpose({ flyTo, flyToPoint })
</script>

<style scoped>
.campus-map3d { position: relative; width: 100%; height: 100%; min-height: 200px; overflow: hidden; background: var(--study-track, #efede7); }
.campus-map3d-host { position: absolute; inset: 0; }
.campus-map3d-veil { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; background: linear-gradient(160deg, var(--study-purple-soft, rgba(123,50,217,.08)), var(--study-blue-soft, rgba(40,83,224,.08))); }
.campus-map3d-veil span { width: 30px; height: 30px; border-radius: 50%; border: 3px solid var(--study-border, rgba(20,20,22,.08)); border-top-color: var(--study-purple, #7b32d9); animation: cm-spin .9s linear infinite; }
.campus-map3d-off { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--study-muted, #6e6d7a); font-size: 13px; font-weight: 600; }
.campus-map3d-off ion-icon { font-size: 26px; color: var(--study-faint, #9e9ea7); }

/* Contenido de los marcadores 2D (lo crea el SDK dentro del mapa). */
.campus-map3d :deep(.cm-pin) { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px 6px 8px; margin-bottom: 6px; border-radius: 999px; border: 1px solid var(--study-border, rgba(20,20,22,.08)); background: var(--study-surface, #fff); color: var(--study-text, #141416); box-shadow: 0 6px 16px -6px rgba(20,20,22,.45); font: 700 12px/16px 'Study Jakarta', system-ui, sans-serif; white-space: nowrap; cursor: pointer; transform-origin: 50% 100%; transition: transform .2s ease, background-color .2s ease, color .2s ease; }
.campus-map3d :deep(.cm-pin)::after { content: ''; position: absolute; left: 50%; bottom: -5px; width: 9px; height: 9px; background: inherit; border-right: 1px solid var(--study-border, rgba(20,20,22,.08)); border-bottom: 1px solid var(--study-border, rgba(20,20,22,.08)); transform: translateX(-50%) rotate(45deg); }
.campus-map3d :deep(.cm-pin i) { width: 10px; height: 10px; flex-shrink: 0; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.9); }
.campus-map3d :deep(.cm-pin small) { padding: 1px 6px; border-radius: 999px; background: var(--study-track, #efede7); color: var(--study-muted, #6e6d7a); font-size: 10px; font-weight: 700; }
.campus-map3d :deep(.cm-pin.is-selected) { background: var(--study-cta, #141416); color: var(--study-on-cta, #fff); border-color: transparent; transform: scale(1.12); }
.campus-map3d :deep(.cm-pin.is-selected small) { background: rgba(255,255,255,.18); color: inherit; }
.campus-map3d :deep(.cm-me) { width: 18px; height: 18px; border-radius: 50%; background: #2853e0; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(40,83,224,.22), 0 2px 6px rgba(0,0,0,.3); animation: cm-halo 2s ease-out infinite; }

@keyframes cm-spin { to { transform: rotate(360deg); } }
@keyframes cm-halo { 0% { box-shadow: 0 0 0 0 rgba(40,83,224,.35), 0 2px 6px rgba(0,0,0,.3); } 100% { box-shadow: 0 0 0 14px rgba(40,83,224,0), 0 2px 6px rgba(0,0,0,.3); } }
@media (prefers-reduced-motion: reduce) {
  .campus-map3d-veil span, .campus-map3d :deep(.cm-me) { animation: none; }
  .campus-map3d :deep(.cm-pin) { transition: none; }
}
</style>

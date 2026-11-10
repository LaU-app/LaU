<template>
  <ion-page class="study-ui market-ui admin-page">
    <ion-header class="ion-no-border admin-header">
      <ion-toolbar>
        <div class="admin-bar">
          <img src="/LaU.png" alt="" class="admin-brand"/>
          <div class="admin-title">
            <b>Panel de LaU</b>
            <span>Campus y entregas</span>
          </div>
          <nav class="admin-nav" aria-label="Secciones del panel">
            <router-link to="/equipo/comercios" replace>Comercios</router-link>
            <router-link to="/equipo/campus" replace class="is-current">Campus</router-link>
            <router-link to="/equipo/ferias" replace>Ferias</router-link>
          </nav>
          <div class="admin-session">
            <span v-if="admin" class="admin-name" :title="admin.email">{{ admin.name }}</span>
            <button type="button" class="admin-logout" :disabled="loggingOut" aria-label="Cerrar sesión" @click="logout">
              <ion-icon :icon="logOutOutline" aria-hidden="true"/><span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content/></ion-refresher>
      <main class="study-shell admin-shell">
        <div class="admin-intro">
          <div>
            <h1>Campus</h1>
            <p class="study-muted">Cada producto se entrega dentro de un campus. Ubicá cada universidad y su área de entrega.</p>
          </div>
          <span v-if="campuses.length" class="admin-stat"><ion-icon :icon="locationOutline" aria-hidden="true"/><b>{{ locatedCount }}</b> de {{ campuses.length }} ubicados</span>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load()">Reintentar</button></p>

        <div class="campus-layout">
          <section class="campus-list-col" aria-label="Lista de campus">
            <div v-if="campuses.length > 6" class="market-search admin-search">
              <label>
                <ion-icon :icon="searchOutline" aria-hidden="true"/>
                <input
                  v-model="search"
                  type="search"
                  enterKeyHint="search"
                  autocomplete="off"
                  placeholder="Nombre o siglas"
                  aria-label="Buscar campus"
                />
                <button v-if="search" type="button" class="search-clear" aria-label="Borrar búsqueda" @click="search = ''"><ion-icon :icon="closeCircle"/></button>
              </label>
            </div>

            <!-- Primera carga -->
            <ul v-if="loading && !loaded" class="row-skeleton" aria-hidden="true">
              <li v-for="n in 6" :key="n"><i class="sk-mark"/><span><i/><i/><i/></span></li>
            </ul>

            <div v-else-if="loaded && !campuses.length && !error" class="study-empty study-card admin-empty">
              <span class="study-symbol tone-blue"><ion-icon :icon="schoolOutline"/></span>
              <h2>Aún no hay campus</h2>
              <p>Cuando haya universidades registradas, aparecerán aquí.</p>
            </div>

            <div v-else-if="loaded && !filtered.length && search" class="study-empty study-card admin-empty">
              <span class="study-symbol tone-blue"><ion-icon :icon="searchOutline"/></span>
              <h2>Sin resultados</h2>
              <p>Probá con otro nombre o siglas.</p>
              <button class="study-link" @click="search = ''">Limpiar búsqueda</button>
            </div>

            <ul v-else-if="filtered.length" class="campus-list" :class="{ refreshing: loading }" :aria-busy="loading">
              <li v-for="campus in filtered" :key="campus.id">
                <button
                  type="button"
                  class="campus-row"
                  :class="{ selected: campus.id === selectedId }"
                  :aria-pressed="campus.id === selectedId"
                  @click="select(campus)"
                >
                  <span class="campus-mark"><ion-icon :icon="schoolOutline" aria-hidden="true"/></span>
                  <span class="campus-main">
                    <b>{{ campus.siglas || campus.nombre }}</b>
                    <span v-if="campus.siglas" class="campus-name">{{ campus.nombre }}</span>
                    <span class="campus-meta">
                      <span class="loc-status" :class="isLocated(campus) ? 'is-ok' : 'is-missing'">{{ isLocated(campus) ? 'Ubicado' : 'Sin ubicación' }}</span>
                      <span><ion-icon :icon="radioButtonOnOutline" aria-hidden="true"/>{{ formatDistance(campus.radio_entrega_m) }}</span>
                      <span><ion-icon :icon="cubeOutline" aria-hidden="true"/>{{ productsLabel(campus.products_count) }}</span>
                    </span>
                  </span>
                  <ion-icon :icon="chevronForwardOutline" class="campus-chevron" aria-hidden="true"/>
                </button>
              </li>
            </ul>

            <p v-if="loaded" class="campus-note">
              <ion-icon :icon="terminalOutline" aria-hidden="true"/>
              <span>Para ubicar todas automáticamente: <code>php artisan lau:ubicar-universidades</code> (en el servidor).</span>
            </p>
          </section>

          <section v-if="selected" ref="editorEl" class="campus-editor study-card" aria-labelledby="campus-editor-title">
            <header class="editor-head">
              <div>
                <h2 id="campus-editor-title">{{ selected.siglas || selected.nombre }}</h2>
                <p v-if="selected.siglas" class="study-muted">{{ selected.nombre }}</p>
              </div>
              <button type="button" class="study-icon-button editor-close" aria-label="Cerrar" :disabled="saving" @click="closeEditor">
                <ion-icon :icon="closeOutline"/>
              </button>
            </header>

            <div v-if="mapsEnabled" v-show="mapState !== 'error'" class="campus-map-wrap">
              <div ref="mapEl" class="campus-map" aria-label="Mapa del campus"/>
              <div v-if="mapState === 'loading'" class="map-overlay"><ion-spinner name="crescent"/><span>Cargando mapa…</span></div>
            </div>
            <p v-if="mapState === 'ready'" class="map-hint">
              <ion-icon :icon="informationCircleOutline" aria-hidden="true"/>{{ point ? 'Tocá el mapa o arrastrá el pin para mover el centro.' : 'Tocá el mapa para ubicar el centro del campus.' }}
            </p>
            <p v-else-if="mapState === 'error'" class="map-hint is-warning">
              <ion-icon :icon="alertCircleOutline" aria-hidden="true"/>
              <span>El mapa no cargó. Escribí la latitud y la longitud. <button type="button" class="study-link" @click="retryMap">Reintentar</button></span>
            </p>
            <p v-else-if="!mapsEnabled" class="map-hint">
              <ion-icon :icon="informationCircleOutline" aria-hidden="true"/>El mapa no está disponible. Escribí la latitud y la longitud.
            </p>

            <div class="field">
              <div class="field-row">
                <label for="campus-radius">Área de entrega</label>
                <output for="campus-radius">{{ formatDistance(radius) }}</output>
              </div>
              <input
                id="campus-radius"
                v-model.number="radius"
                type="range"
                :min="RADIUS_MIN"
                :max="RADIUS_MAX"
                step="50"
                :disabled="saving"
              />
              <small class="hint">Radio desde el centro: de 100 m a 2 km.</small>
            </div>

            <div class="coords">
              <label class="field">
                <span>Latitud</span>
                <input
                  v-model="latText"
                  type="number"
                  step="0.000001"
                  placeholder="13.700000"
                  autocomplete="off"
                  :aria-invalid="!!coordsWarning"
                  :disabled="saving"
                  @change="onCoordsChange"
                />
              </label>
              <label class="field">
                <span>Longitud</span>
                <input
                  v-model="lngText"
                  type="number"
                  step="0.000001"
                  placeholder="-89.200000"
                  autocomplete="off"
                  :aria-invalid="!!coordsWarning"
                  :disabled="saving"
                  @change="onCoordsChange"
                />
              </label>
            </div>
            <small v-if="coordsWarning" class="field-err" role="alert">{{ coordsWarning }}</small>

            <label class="field">
              <span>Dirección (opcional)</span>
              <input v-model="direccion" type="text" maxlength="255" autocomplete="off" placeholder="Calle, colonia y municipio" :disabled="saving"/>
            </label>

            <p v-if="formError" class="form-error" role="alert"><ion-icon :icon="alertCircleOutline" aria-hidden="true"/>{{ formError }}</p>

            <div class="editor-actions">
              <button type="button" class="study-button" :disabled="saving" @click="save">
                <ion-spinner v-if="saving" name="crescent"/><ion-icon v-else :icon="saveOutline"/>
                {{ saving ? 'Guardando…' : 'Guardar ubicación' }}
              </button>
              <a v-if="point" class="study-link maps-link" :href="mapsUrl" target="_blank" rel="noopener noreferrer">
                <ion-icon :icon="openOutline" aria-hidden="true"/>Ver en Google Maps
              </a>
            </div>
          </section>

          <div v-else-if="campuses.length" class="editor-placeholder study-card">
            <span class="study-symbol tone-blue"><ion-icon :icon="mapOutline"/></span>
            <p>Elegí un campus de la lista para ubicarlo en el mapa.</p>
          </div>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
  toastController, onIonViewWillEnter,
} from '@ionic/vue'
import {
  logOutOutline, locationOutline, searchOutline, closeCircle, schoolOutline, radioButtonOnOutline, cubeOutline,
  chevronForwardOutline, terminalOutline, closeOutline, informationCircleOutline, alertCircleOutline, saveOutline,
  openOutline, mapOutline,
} from 'ionicons/icons'
import { AdminService, adminErrorMessage, type AdminCampus } from '@/services/adminService'
import { EL_SALVADOR, MAP_ID, hasMapsKey, importLibrary } from '@/utils/googleMaps'
import { campusCenter, formatDistance, type LatLng } from '@/utils/campusGeo'
import '@/theme/study.css'
import '@/theme/marketplace.css'

/* eslint-disable @typescript-eslint/no-explicit-any */

const RADIUS_MIN = 100
const RADIUS_MAX = 2000
const DEFAULT_RADIUS = 600
// Límites de El Salvador (el backend valida lo mismo).
const LAT_RANGE = [13.0, 14.5] as const
const LNG_RANGE = [-90.2, -87.6] as const

type MapState = 'idle' | 'loading' | 'ready' | 'error'

const router = useRouter()
const route = useRoute()
const admin = ref(AdminService.admin())
const loggingOut = ref(false)

const campuses = ref<AdminCampus[]>([])
const loading = ref(true)
const loaded = ref(false)
const error = ref('')
const search = ref('')

// Editor
const selectedId = ref<number | null>(null)
// type="number" + v-model entrega número o texto según lo que se escriba.
const latText = ref<string | number>('')
const lngText = ref<string | number>('')
const radius = ref(DEFAULT_RADIUS)
const direccion = ref('')
const formError = ref('')
const saving = ref(false)
const editorEl = ref<HTMLElement | null>(null)

// Mapa (objetos del SDK de Google: sin tipos)
const mapsEnabled = hasMapsKey()
const mapEl = ref<HTMLElement | null>(null)
const mapState = ref<MapState>('idle')
let map: any = null
let marker: any = null
let circle: any = null
let mapToken = 0

const selected = computed(() => campuses.value.find(c => c.id === selectedId.value) ?? null)
const isLocated = (c: AdminCampus) => campusCenter(c) !== null
const locatedCount = computed(() => campuses.value.filter(isLocated).length)

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const filtered = computed(() => {
  const q = normalize(search.value.trim())
  const list = [...campuses.value].sort((a, b) => (a.siglas || a.nombre).localeCompare(b.siglas || b.nombre, 'es'))
  return q ? list.filter(c => normalize(`${c.siglas ?? ''} ${c.nombre}`).includes(q)) : list
})

const productsLabel = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`

function parseCoord(value: string | number): number | null {
  const text = String(value ?? '').trim().replace(',', '.')
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

const inRange = (n: number, [min, max]: readonly [number, number]) => n >= min && n <= max

/** Punto escrito o elegido en el mapa (cualquier lugar del mundo; El Salvador se valida al guardar). */
const point = computed<LatLng | null>(() => {
  const lat = parseCoord(latText.value)
  const lng = parseCoord(lngText.value)
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
})

const coordsWarning = computed(() => {
  const p = point.value
  if (!p) return ''
  if (!inRange(p.lat, LAT_RANGE)) return 'La latitud tiene que estar entre 13.0 y 14.5 (El Salvador).'
  if (!inRange(p.lng, LNG_RANGE)) return 'La longitud tiene que estar entre -90.2 y -87.6 (El Salvador).'
  return ''
})

const mapsUrl = computed(() => {
  const p = point.value
  return p ? `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(6)},${p.lng.toFixed(6)}` : ''
})

const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status

function toLogin() {
  void router.replace({ path: '/equipo/login', query: { next: route.fullPath } })
}

async function toast(message: string, color: 'success' | 'warning' | 'danger') {
  const t = await toastController.create({ message, color, position: 'top', duration: color === 'success' ? 2800 : 5000 })
  await t.present()
}

// Contador de peticiones: solo la última respuesta actualiza la lista.
let request = 0

async function load(): Promise<void> {
  const id = ++request
  loading.value = true
  error.value = ''
  try {
    const list = await AdminService.campuses()
    if (id !== request) return
    campuses.value = Array.isArray(list) ? list : []
    loaded.value = true
    if (selectedId.value !== null && !selected.value) closeEditor()
  } catch (e) {
    if (id !== request) return
    if (statusOf(e) === 401) return toLogin()
    error.value = adminErrorMessage(e, 'No pudimos cargar los campus.')
  } finally {
    if (id === request) loading.value = false
  }
}

async function refresh(event: CustomEvent) {
  await load()
  await (event.target as HTMLIonRefresherElement).complete()
}

// ── Editor ────────────────────────────────────────────────────────────
const clampRadius = (value: number) =>
  Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, Number.isFinite(value) && value > 0 ? value : DEFAULT_RADIUS))

function fillForm(campus: AdminCampus) {
  const center = campusCenter(campus)
  latText.value = center ? center.lat.toFixed(6) : ''
  lngText.value = center ? center.lng.toFixed(6) : ''
  radius.value = clampRadius(Number(campus.radio_entrega_m))
  direccion.value = campus.direccion ?? ''
  formError.value = ''
}

// Con la columna fija (escritorio alto) el editor ya está a la vista; si no, se desplaza hasta él.
const editorIsSticky = () => window.matchMedia('(min-width: 900px) and (min-height: 820px)').matches

async function select(campus: AdminCampus) {
  if (saving.value) return
  // Volver a tocar el mismo campus no descarta lo que se está editando.
  if (selectedId.value !== campus.id) {
    selectedId.value = campus.id
    fillForm(campus)
    await nextTick()
    centerMap(true)
  }
  if (!editorIsSticky()) editorEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function closeEditor() {
  if (saving.value) return
  selectedId.value = null
  formError.value = ''
}

function setPoint(p: LatLng) {
  latText.value = p.lat.toFixed(6)
  lngText.value = p.lng.toFixed(6)
  formError.value = ''
}

function onCoordsChange() {
  formError.value = ''
  centerMap(false)
}

function validate(): string | null {
  const lat = parseCoord(latText.value)
  const lng = parseCoord(lngText.value)
  if (lat === null && lng === null) return 'Ubicá el campus en el mapa o escribí la latitud y la longitud.'
  if (lat === null) return 'Escribí la latitud (por ejemplo, 13.700000).'
  if (lng === null) return 'Escribí la longitud (por ejemplo, -89.200000).'
  if (!inRange(lat, LAT_RANGE)) return 'La latitud tiene que estar entre 13.0 y 14.5 (El Salvador).'
  if (!inRange(lng, LNG_RANGE)) return 'La longitud tiene que estar entre -90.2 y -87.6 (El Salvador).'
  if (!(radius.value >= RADIUS_MIN && radius.value <= RADIUS_MAX)) return 'El área de entrega tiene que estar entre 100 m y 2 km.'
  return null
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6

async function save() {
  const campus = selected.value
  if (!campus || saving.value) return
  const invalid = validate()
  if (invalid) {
    formError.value = invalid
    return
  }
  formError.value = ''
  saving.value = true
  try {
    const result = await AdminService.updateCampusLocation(campus.id, {
      latitud: round6(parseCoord(latText.value) as number),
      longitud: round6(parseCoord(lngText.value) as number),
      radio_entrega_m: Math.round(radius.value),
      direccion: direccion.value.trim() || null,
    })
    if (result?.data) {
      campuses.value = campuses.value.map(c => (c.id === result.data.id ? { ...c, ...result.data } : c))
      if (selectedId.value === result.data.id) fillForm(result.data)
    }
    await toast(result?.message || 'Ubicación guardada.', 'success')
  } catch (e) {
    const status = statusOf(e)
    if (status === 401) return toLogin()
    const message = adminErrorMessage(e, 'No se pudo guardar la ubicación.')
    if (status === 422) formError.value = message
    await toast(message, 'danger')
  } finally {
    saving.value = false
  }
}

// ── Mapa 2D (satélite con nombres) ───────────────────────────────────
const readLatLng = (value: any): LatLng | null => {
  if (!value) return null
  const lat = typeof value.lat === 'function' ? value.lat() : value.lat
  const lng = typeof value.lng === 'function' ? value.lng() : value.lng
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

async function initMap(el: HTMLElement) {
  if (!mapsEnabled) return
  const token = ++mapToken
  mapState.value = 'loading'
  try {
    const [mapsLib, markerLib] = await Promise.all([importLibrary('maps'), importLibrary('marker')])
    if (token !== mapToken || mapEl.value !== el) return
    const center = point.value
    map = new mapsLib.Map(el, {
      center: center ?? EL_SALVADOR,
      zoom: center ? 16 : 9,
      mapId: MAP_ID,
      mapTypeId: 'hybrid',
      tilt: 0,
      clickableIcons: false,
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true,
    })
    circle = new mapsLib.Circle({
      strokeColor: '#2853e0',
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: '#2853e0',
      fillOpacity: 0.16,
      clickable: false,
    })
    marker = new markerLib.AdvancedMarkerElement({ gmpDraggable: true, title: 'Centro del campus' })
    // Mientras se arrastra solo se mueve el círculo; al soltar se actualizan los campos.
    marker.addListener('drag', () => {
      const p = readLatLng(marker?.position)
      if (p) circle?.setCenter(p)
    })
    marker.addListener('dragend', () => {
      const p = readLatLng(marker?.position)
      if (p) setPoint(p)
    })
    map.addListener('click', (event: any) => {
      const p = readLatLng(event?.latLng)
      if (!p || saving.value) return
      const firstPin = !point.value
      setPoint(p)
      if (firstPin || (map.getZoom() ?? 0) < 14) {
        map.panTo(p)
        map.setZoom(16)
      }
    })
    mapState.value = 'ready'
    syncOverlays()
  } catch {
    if (token === mapToken) mapState.value = 'error'
  }
}

function teardownMap() {
  mapToken++
  if (marker) marker.map = null
  circle?.setMap(null)
  map = null
  marker = null
  circle = null
  if (mapState.value !== 'error') mapState.value = 'idle'
}

function retryMap() {
  teardownMap()
  if (mapEl.value) void initMap(mapEl.value)
}

/** Pin y círculo siguen a los campos (única fuente de verdad). */
function syncOverlays() {
  if (!map || !marker || !circle) return
  const p = point.value
  marker.position = p
  marker.map = p ? map : null
  circle.setOptions({ center: p ?? EL_SALVADOR, radius: radius.value, map: p ? map : null })
}

function centerMap(reset: boolean) {
  if (!map) return
  const p = point.value
  if (p) {
    if (reset) {
      map.setCenter(p)
      map.setZoom(16)
    } else {
      map.panTo(p)
    }
  } else if (reset) {
    map.setCenter(EL_SALVADOR)
    map.setZoom(9)
  }
}

watch(mapEl, el => {
  if (el) void initMap(el)
  else teardownMap()
}, { flush: 'post' })

watch([point, radius], syncOverlays)

// ── Sesión ────────────────────────────────────────────────────────────
async function logout() {
  loggingOut.value = true
  try {
    await AdminService.logout()
    await router.replace('/equipo/login')
  } finally {
    loggingOut.value = false
  }
}

let firstEnter = true
onMounted(() => { void load() })
onIonViewWillEnter(() => {
  admin.value = AdminService.admin()
  if (firstEnter) { firstEnter = false; return }
  if (!saving.value) void load()
})
onBeforeUnmount(teardownMap)
</script>

<style scoped>
/* Colores propios del panel (se suman a los tokens de study.css) */
.admin-page { --admin-amber: #a15c07; --admin-amber-soft: rgba(245, 158, 11, .14); --admin-red: #c92a2a; --admin-red-soft: rgba(224, 49, 49, .09); }
.ion-palette-dark .admin-page { --admin-amber: #fbbf24; --admin-amber-soft: rgba(251, 191, 36, .13); --admin-red: #ff8787; --admin-red-soft: rgba(255, 135, 135, .12); color-scheme: dark; }

/* Cabecera */
.admin-header { border-bottom: 1px solid var(--study-border); }
.admin-header ion-toolbar { --background: var(--study-bg); --color: var(--study-text); --border-width: 0; --min-height: 64px; --padding-start: 16px; --padding-end: 16px; }
.admin-bar { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 1040px; margin: 0 auto; }
.admin-brand { height: 30px; width: auto; flex-shrink: 0; }
.admin-title { flex: 1; min-width: 0; display: grid; }
.admin-title b { font-size: 16px; line-height: 20px; font-weight: 800; letter-spacing: -.01em; }
.admin-title span { font-size: 12px; line-height: 16px; color: var(--study-muted); }
.admin-title b, .admin-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-session { display: flex; align-items: center; gap: 10px; min-width: 0; }
.admin-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--study-muted); }
.admin-logout { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 38px; padding: 0 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-text); font-size: 13px; font-weight: 600; box-shadow: var(--study-shadow); }
.admin-logout ion-icon { font-size: 17px; }
/* Secciones del panel: segunda fila en teléfono, en la barra en pantallas grandes */
.admin-bar { flex-wrap: wrap; }
.admin-nav { order: 3; flex: 1 0 100%; display: flex; gap: 2px; padding: 3px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-tray); }
.admin-nav a { flex: 1; display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 6px 14px; border-radius: 999px; color: var(--study-muted); font-size: 13px; font-weight: 600; line-height: 18px; white-space: nowrap; transition: background-color .2s ease, color .2s ease; }
.admin-nav a:hover { color: var(--study-text); }
.admin-nav a.is-current { background: var(--study-surface); color: var(--study-text); box-shadow: var(--study-shadow); }

/* Contenido */
.admin-shell.study-shell { max-width: 1040px; padding: 20px 16px 40px; }
.admin-intro { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 16px; margin-bottom: 16px; }
.admin-intro p { margin-top: 4px; max-width: 560px; font-size: 14px; line-height: 20px; }
.admin-stat { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-muted); font-size: 13px; box-shadow: var(--study-shadow); }
.admin-stat b { color: var(--study-text); font-size: 14px; }
.admin-stat ion-icon { color: var(--study-green-ink); font-size: 16px; }

.admin-search { margin: 0 0 12px; }
.admin-search input::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }
.search-clear { display: grid; place-items: center; padding: 4px; border: 0; background: none; }
.market-search .search-clear ion-icon { color: var(--study-faint); }

.campus-layout { display: grid; gap: 16px; }
.campus-list-col { min-width: 0; }

/* Lista */
.campus-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; transition: opacity .2s ease; }
.campus-list.refreshing { opacity: .55; }
.campus-row {
  width: 100%; display: grid; grid-template-columns: 44px minmax(0, 1fr) 18px; column-gap: 12px; align-items: center;
  padding: 12px 14px; border: 1px solid var(--study-border); border-radius: 20px; background: var(--study-surface);
  color: var(--study-text); text-align: left; box-shadow: var(--study-shadow); animation: study-arrive .25s both;
}
.campus-row:hover { border-color: color-mix(in srgb, var(--study-text) 18%, transparent); }
.campus-row.selected { border-color: var(--study-text); box-shadow: 0 0 0 1px var(--study-text); }
.campus-mark { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--study-track); color: var(--study-muted); font-size: 20px; }
.campus-main { min-width: 0; display: grid; gap: 2px; }
.campus-main > b { font-size: 15px; line-height: 20px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.campus-name { font-size: 12px; line-height: 17px; color: var(--study-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.campus-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin-top: 5px; font-size: 11px; line-height: 16px; color: var(--study-muted); }
.campus-meta > span:not(.loc-status) { display: inline-flex; align-items: center; gap: 4px; }
.campus-meta ion-icon { font-size: 13px; color: var(--study-faint); }
.campus-chevron { color: var(--study-faint); font-size: 18px; }
.loc-status { display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border-radius: 999px; font-size: 11px; line-height: 16px; font-weight: 700; white-space: nowrap; }
.loc-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.loc-status.is-ok { background: var(--study-green-soft); color: var(--study-green-ink); }
.loc-status.is-missing { background: var(--admin-amber-soft); color: var(--admin-amber); }

.campus-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; padding: 12px 14px; border: 1px dashed var(--study-border); border-radius: 16px; font-size: 12px; line-height: 18px; color: var(--study-muted); }
.campus-note ion-icon { font-size: 16px; margin-top: 1px; color: var(--study-faint); }
.campus-note code { padding: 1px 6px; border-radius: 6px; background: var(--study-track); color: var(--study-text); font-size: 11.5px; overflow-wrap: anywhere; }

/* Editor */
.campus-editor { display: grid; gap: 14px; padding: 18px; border-radius: 22px; min-width: 0; scroll-margin-top: 12px; animation: study-arrive .25s both; }
.editor-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.editor-head > div { min-width: 0; }
.editor-head h2 { overflow-wrap: anywhere; }
.editor-head .study-muted { margin-top: 2px; font-size: 13px; line-height: 18px; }
.editor-close { width: 36px; height: 36px; font-size: 18px; }

.campus-map-wrap { position: relative; margin: 0 -4px; }
.campus-map { width: 100%; height: 300px; border-radius: 18px; overflow: hidden; background: var(--study-track); border: 1px solid var(--study-border); }
.map-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 18px; background: var(--study-track); color: var(--study-muted); font-size: 13px; font-weight: 600; }
.map-overlay ion-spinner { width: 20px; height: 20px; color: var(--study-muted); }
.map-hint { display: flex; align-items: flex-start; gap: 6px; margin-top: -4px; font-size: 12px; line-height: 18px; color: var(--study-muted); }
.map-hint ion-icon { font-size: 15px; margin-top: 1px; color: var(--study-faint); }
.map-hint.is-warning { padding: 10px 12px; margin-top: 0; border-radius: 14px; background: var(--admin-amber-soft); color: var(--admin-amber); }
.map-hint.is-warning ion-icon { color: currentColor; }
.map-hint .study-link { min-height: 0; padding: 0; margin-left: 4px; color: inherit; text-decoration: underline; }

.field { display: grid; gap: 6px; min-width: 0; font-size: 12px; font-weight: 600; color: var(--study-muted); }
.field input:not([type="range"]) { width: 100%; min-height: 46px; padding: 11px 14px; border: 1px solid var(--study-border); border-radius: 14px; background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 14px; font-weight: 500; line-height: 20px; }
.field input::placeholder { color: var(--study-faint); }
.field input:focus { outline: 2px solid var(--study-text); outline-offset: 1px; }
.field input[aria-invalid="true"] { border-color: var(--admin-red); }
.field input:disabled { opacity: .7; }
.field .hint { font-weight: 500; color: var(--study-faint); }
.field-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.field-row output { font-size: 15px; font-weight: 800; color: var(--study-text); }
.field input[type="range"] { width: 100%; height: 28px; margin: 0; accent-color: var(--study-blue); cursor: pointer; }
.coords { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.field-err { margin-top: -6px; font-size: 12px; line-height: 17px; font-weight: 600; color: var(--admin-red); }

.form-error { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-radius: 14px; background: var(--admin-red-soft); color: var(--admin-red); font-size: 13px; line-height: 19px; font-weight: 600; }
.form-error ion-icon { flex-shrink: 0; font-size: 18px; margin-top: 1px; }
.editor-actions { display: grid; gap: 4px; justify-items: center; }
.editor-actions .study-button { min-height: 50px; font-size: 14px; }
.editor-actions ion-spinner { width: 18px; height: 18px; color: currentColor; }
.study-ui .maps-link { color: var(--study-blue); font-size: 13px; }

.editor-placeholder { display: none; }

/* Vacío y carga */
.admin-empty { padding: 32px 20px; }
.row-skeleton { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.row-skeleton li { display: flex; gap: 12px; padding: 14px; border: 1px solid var(--study-border); border-radius: 20px; background: var(--study-surface); animation: admin-pulse 1.4s ease-in-out infinite; }
.row-skeleton .sk-mark { width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px; background: var(--study-track); }
.row-skeleton span { flex: 1; display: grid; gap: 8px; align-content: center; }
.row-skeleton span i { display: block; height: 10px; border-radius: 999px; background: var(--study-track); width: 35%; }
.row-skeleton span i:nth-child(2) { width: 70%; }
.row-skeleton span i:nth-child(3) { width: 50%; }
@keyframes admin-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

@media (max-width: 560px) {
  .admin-name { max-width: 110px; }
  .admin-logout { width: 38px; padding: 0; }
  .admin-logout span { display: none; }
}
@media (max-width: 380px) {
  .admin-name { max-width: 72px; }
}
@media (max-width: 899px) {
  .admin-bar { padding: 10px 0; }
}
@media (min-width: 720px) {
  .admin-shell.study-shell { padding: 28px 24px 48px; }
}
@media (min-width: 900px) {
  .admin-nav { order: 0; flex: 0 0 auto; }
  .admin-nav a { flex: 0 0 auto; }
  .campus-layout { grid-template-columns: minmax(0, 380px) minmax(0, 1fr); align-items: start; gap: 20px; }
  .campus-editor { padding: 20px; }
  .campus-map { height: 320px; }
  .editor-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 280px; padding: 28px; border-style: dashed; text-align: center; font-size: 14px; line-height: 20px; color: var(--study-muted); box-shadow: none; }
}
@media (min-width: 900px) and (min-height: 820px) {
  .campus-editor, .editor-placeholder { position: sticky; top: 20px; }
}
</style>

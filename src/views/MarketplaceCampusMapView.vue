<template>
  <ion-page class="study-ui market-ui campus-map-page">
    <ion-content :scroll-y="!mapOn">
      <div class="campus-page" :class="mapOn ? 'has-map' : 'no-map'">
        <div v-if="mapOn && data" class="map-stage">
          <CampusMap3D ref="mapRef" :campuses="data.campuses" :selected-id="selectedId" :me="me"
            @select="select" @ready="(mode) => (mapState = mode)" @unavailable="mapState = 'off'"/>
        </div>

        <div class="campus-ui">
          <header class="campus-top">
            <button type="button" class="campus-back" aria-label="Volver al Marketplace" @click="router.push('/tabs/marketplace')">
              <ion-icon :icon="arrowBackOutline"/>
            </button>
            <h1>Campus</h1>
          </header>

          <template v-if="!data">
            <template v-if="loading">
              <div class="campus-skeleton" aria-hidden="true">
                <div class="sk-chips"><i v-for="n in 4" :key="n"/></div>
                <i class="sk-map"/>
                <i class="sk-card"/>
              </div>
              <p class="sr-only" role="status">Cargando campus…</p>
            </template>
            <div v-else class="study-empty campus-error" role="alert">
              <span class="study-symbol tone-orange"><ion-icon :icon="cloudOfflineOutline"/></span>
              <h2>No pudimos cargar los campus</h2>
              <p>{{ error }}</p>
              <button type="button" class="study-link" @click="load">Reintentar</button>
            </div>
          </template>

          <template v-else>
            <nav ref="chipsEl" class="campus-chips" aria-label="Elegí un campus">
              <button v-for="campus in campuses" :key="campus.id" type="button" :data-id="campus.id"
                :aria-pressed="selectedId === campus.id" :class="{ selected: selectedId === campus.id }" @click="select(campus.id)">
                <i :style="{ background: dotColor(campus) }"/>{{ campusLabel(campus) }}
              </button>
            </nav>

            <p v-if="!mapOn" class="map-off"><ion-icon :icon="mapOutline"/>Mapa no disponible</p>

            <div class="campus-spacer"/>

            <div class="campus-bottom">
              <div class="geo-row">
                <p v-if="geoError" class="geo-chip is-error" role="alert"><ion-icon :icon="alertCircleOutline"/>{{ geoError }}</p>
                <button v-else-if="geoNote" type="button" class="geo-chip" :class="{ 'is-inside': geoNote.inside }" @click="select(geoNote.campusId)">
                  <ion-icon :icon="geoNote.inside ? checkmarkCircle : navigateOutline"/>{{ geoNote.text }}
                </button>
                <button type="button" class="locate-btn" :disabled="locating" @click="whereAmI">
                  <ion-icon :icon="locateOutline"/>{{ locating ? 'Buscando…' : '¿Dónde estoy?' }}
                </button>
              </div>

              <article v-if="selected" :key="selected.id" class="campus-card study-card" aria-live="polite">
                <header class="campus-card-head">
                  <i class="campus-dot" :style="{ background: dotColor(selected) }"/>
                  <div>
                    <h2>{{ selected.nombre }}</h2>
                    <span v-if="selected.siglas" class="study-muted">{{ selected.siglas }}</span>
                  </div>
                  <span v-if="isMine" class="mine-badge">Tu campus</span>
                  <button type="button" class="card-close" aria-label="Cerrar" @click="selectedId = null"><ion-icon :icon="closeOutline"/></button>
                </header>

                <p class="campus-stats">{{ statsText(selected) }}</p>
                <p v-if="selected.direccion" class="campus-address"><ion-icon :icon="locationOutline"/>{{ selected.direccion }}</p>

                <ul v-if="ferias.length" class="campus-ferias" aria-label="Ferias">
                  <li v-for="feria in ferias" :key="feria.id">
                    <span class="feria-icon"><ion-icon :icon="calendarOutline"/></span>
                    <div>
                      <b>{{ feria.titulo }}</b>
                      <small>{{ feriaWhen(feria) }}<template v-if="feria.lugar"> · {{ feria.lugar }}</template></small>
                    </div>
                    <span v-if="feria.en_curso" class="live-badge">En curso</span>
                  </li>
                </ul>

                <p class="campus-rule"><ion-icon :icon="shieldCheckmarkOutline"/>Las entregas son dentro del campus</p>

                <button type="button" class="study-button campus-cta" @click="goProducts">
                  <ion-icon :icon="storefrontOutline"/>Ver productos de este campus
                </button>
              </article>

              <p v-else class="campus-card campus-hint study-card">
                <ion-icon :icon="schoolOutline"/>{{ campuses.length ? 'Tocá un campus para ver qué se vende ahí.' : 'Todavía no hay campus disponibles.' }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  arrowBackOutline, locateOutline, closeOutline, locationOutline, calendarOutline, storefrontOutline, mapOutline,
  schoolOutline, navigateOutline, checkmarkCircle, shieldCheckmarkOutline, cloudOfflineOutline, alertCircleOutline,
} from 'ionicons/icons'
import CampusMap3D from '@/components/marketplace/CampusMap3D.vue'
import campusService, { campusLabel, type Campus, type CampusMap, type Feria } from '@/services/campusService'
import { CheckoutError } from '@/services/paypalCheckoutService'
import { formatDistance, nearestCampus, type LatLng } from '@/utils/campusGeo'
import { hasMapsKey, loadGoogleMaps } from '@/utils/googleMaps'
import { useGeolocation } from '@/utils/useGeolocation'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const route = useRoute()

const data = ref<CampusMap | null>(null)
const loading = ref(true)
const error = ref('')
const selectedId = ref<number | null>(null)
const mapState = ref<'pending' | '3d' | '2d' | 'off'>(hasMapsKey() ? 'pending' : 'off')
const mapRef = ref<InstanceType<typeof CampusMap3D> | null>(null)
const chipsEl = ref<HTMLElement | null>(null)
const me = ref<LatLng | null>(null)
const geoNote = ref<{ text: string; inside: boolean; campusId: number } | null>(null)
const { locating, error: geoError, locate } = useGeolocation()
const reduceMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const mapOn = computed(() => data.value !== null && mapState.value !== 'off')

// Tu campus primero; los demás por nombre corto.
const campuses = computed(() => {
  const mine = data.value?.my_campus_id ?? null
  return [...(data.value?.campuses ?? [])].sort((a, b) =>
    Number(b.id === mine) - Number(a.id === mine) || campusLabel(a).localeCompare(campusLabel(b), 'es'))
})
const selected = computed(() => data.value?.campuses.find((c) => c.id === selectedId.value) ?? null)
const isMine = computed(() => selected.value !== null && selected.value.id === data.value?.my_campus_id)

/* ---------- Datos ---------- */

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await campusService.map()
    const list = Array.isArray(result?.campuses) ? result.campuses : []
    data.value = { campuses: list, my_campus_id: result?.my_campus_id ?? null }
    // ?campus=ID (desde otra pantalla) o tu campus.
    const fromQuery = Number(route.query.campus)
    const initial = list.find((c) => c.id === fromQuery) ?? list.find((c) => c.id === data.value?.my_campus_id) ?? null
    if (!list.some((c) => c.id === selectedId.value)) selectedId.value = initial?.id ?? null
  } catch (e) {
    error.value = e instanceof CheckoutError && e.message ? e.message : 'Revisá tu conexión e intentá de nuevo.'
  } finally {
    loading.value = false
  }
}

/* ---------- Selección ---------- */

function select(id: number) {
  if (selectedId.value === id) mapRef.value?.flyTo(id)
  else selectedId.value = id
  void nextTick(() => {
    chipsEl.value?.querySelector<HTMLElement>(`[data-id="${id}"]`)
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
  })
}

function goProducts() {
  if (!selected.value) return
  router.push({ path: '/tabs/marketplace', query: { campus: String(selected.value.id) } })
}

async function whereAmI() {
  geoNote.value = null
  const position = await locate()
  if (!position || !data.value) return
  me.value = { lat: position.lat, lng: position.lng }
  const near = nearestCampus(data.value.campuses, position)
  if (!near) {
    geoError.value = 'Todavía no hay campus en el mapa.'
    return
  }
  const name = campusLabel(near.campus)
  if (near.inside) {
    select(near.campus.id)
    geoNote.value = { text: `Estás en ${name}`, inside: true, campusId: near.campus.id }
  } else {
    geoNote.value = { text: `Estás a ${formatDistance(near.meters)} de ${name}`, inside: false, campusId: near.campus.id }
  }
}

/* ---------- Formato ---------- */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const dotColor = (c: Campus) => (c.color_primario && HEX.test(c.color_primario.trim()) ? c.color_primario.trim() : 'var(--study-purple)')

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const statsText = (c: Campus) =>
  `${plural(c.products_count ?? 0, 'producto', 'productos')} · ${plural(c.stores_count ?? 0, 'comercio verificado', 'comercios verificados')}`

// Laravel puede mandar "2026-11-12 09:00:00": Safari no lo entiende sin la "T".
const parseDate = (s: string) => new Date(/^\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(' ', 'T') : s)
const DATE_FMT: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }
const TIME_FMT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }

function feriaWhen(f: Feria) {
  const start = parseDate(f.inicia_en)
  const end = parseDate(f.termina_en)
  if (Number.isNaN(start.getTime())) return ''
  const from = start.toLocaleString('es-SV', DATE_FMT)
  if (Number.isNaN(end.getTime())) return from
  const to = start.toDateString() === end.toDateString() ? end.toLocaleTimeString('es-SV', TIME_FMT) : end.toLocaleString('es-SV', DATE_FMT)
  return `${from} – ${to}`
}

// Ferias en curso primero, luego las próximas (máximo 3).
const ferias = computed(() => {
  const now = Date.now()
  return (selected.value?.ferias ?? [])
    .filter((f) => f.en_curso || parseDate(f.termina_en).getTime() >= now)
    .sort((a, b) => Number(b.en_curso) - Number(a.en_curso) || parseDate(a.inicia_en).getTime() - parseDate(b.inicia_en).getTime())
    .slice(0, 3)
})

onMounted(() => {
  // El SDK de mapas se descarga mientras llegan los campus.
  if (hasMapsKey()) loadGoogleMaps().catch(() => undefined)
  void load()
})
</script>

<style scoped>
.campus-map-page ion-content { --padding-top: 0px; --padding-bottom: 0px; --padding-start: 0px; --padding-end: 0px; }

/* ---------- Estructura: mapa a pantalla completa en teléfono ---------- */
.campus-page { position: relative; min-height: 100%; }
.campus-page.has-map { height: 100%; overflow: hidden; }
.map-stage { position: absolute; inset: 0; background: var(--study-track); }
.campus-ui { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 560px; margin: 0 auto; padding: calc(var(--ion-safe-area-top, 0px) + 14px) 16px calc(var(--lau-nav-space, 0px) + 16px); }
.campus-spacer { display: none; }
/* Sobre el mapa solo reciben toques los controles; el resto deja pasar los gestos al mapa. */
.has-map .campus-ui { position: absolute; inset: 0; max-width: none; pointer-events: none; }
.has-map .campus-bottom, .has-map .geo-row { pointer-events: none; }
.has-map :is(.campus-top, .campus-chips, .geo-row > *, .campus-card) { pointer-events: auto; }
.has-map .campus-spacer { display: block; flex: 1; min-height: 0; }

/* ---------- Cabecera ---------- */
.campus-top { align-self: flex-start; display: flex; align-items: center; gap: 2px; padding: 4px 18px 4px 4px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); box-shadow: 0 6px 18px -8px rgba(20,20,22,.35); }
.study-ui .campus-top h1 { font-size: 17px; line-height: 22px; letter-spacing: -.01em; font-weight: 800; }
.campus-back { display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; background: transparent; color: var(--study-text); font-size: 20px; }

/* ---------- Chips de campus ---------- */
.campus-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 2px 16px 6px; scroll-padding-inline: 16px; }
.campus-chips::-webkit-scrollbar { display: none; }
.campus-chips button { display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0; min-height: 38px; padding: 8px 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-text); font-size: 13px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 14px -6px rgba(20,20,22,.3); }
.campus-chips button i { width: 9px; height: 9px; flex-shrink: 0; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.85); }
.campus-chips button.selected { background: var(--study-cta); border-color: var(--study-cta); color: var(--study-on-cta); }
/* Sin mapa, los campus siguen en una sola fila deslizable: la tarjeta del campus queda a la vista. */
.no-map .campus-chips { margin: 0 -16px; padding: 2px 16px 8px; }
.no-map .campus-chips button { box-shadow: var(--study-shadow); }
.map-off { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--study-tray); color: var(--study-muted); font-size: 12px; font-weight: 600; }
.map-off ion-icon { font-size: 15px; }

/* ---------- ¿Dónde estoy? ---------- */
.campus-bottom { display: grid; gap: 10px; }
.geo-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.geo-chip { display: inline-flex; align-items: center; gap: 6px; min-width: 0; margin: 0; padding: 8px 12px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-text); font-size: 12px; font-weight: 700; line-height: 16px; text-align: left; box-shadow: 0 6px 16px -8px rgba(20,20,22,.35); }
.geo-chip ion-icon { font-size: 16px; color: var(--study-blue); }
.geo-chip.is-inside ion-icon { color: var(--study-green-ink); }
.geo-chip.is-error { border-radius: 16px; color: var(--study-orange); font-weight: 600; }
.geo-chip.is-error ion-icon { color: var(--study-orange); }
.locate-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; min-height: 44px; padding: 10px 16px; border: 0; border-radius: 999px; background: var(--study-cta); color: var(--study-on-cta); font-size: 13px; font-weight: 700; box-shadow: 0 8px 20px -8px rgba(20,20,22,.55); }
.locate-btn ion-icon { font-size: 18px; }

/* ---------- Tarjeta del campus ---------- */
.campus-card { display: grid; gap: 12px; margin: 0; padding: 18px; border-radius: 24px; }
.has-map .campus-card { max-height: min(46vh, 400px); overflow-y: auto; overscroll-behavior: contain; box-shadow: 0 16px 36px -12px rgba(20,20,22,.4); animation: campus-up .28s cubic-bezier(.2,.8,.2,1) both; }
.campus-card-head { display: flex; align-items: center; gap: 10px; }
.campus-card-head > div { flex: 1; min-width: 0; display: grid; gap: 1px; }
.study-ui .campus-card-head h2 { font-size: 17px; line-height: 22px; overflow-wrap: anywhere; }
.campus-dot { width: 14px; height: 14px; flex-shrink: 0; border-radius: 50%; box-shadow: 0 0 0 3px var(--study-surface), 0 0 0 4px var(--study-border); }
.mine-badge { flex-shrink: 0; padding: 4px 10px; border-radius: 999px; background: var(--study-green-soft); color: var(--study-green-ink); font-size: 11px; font-weight: 700; white-space: nowrap; }
.card-close { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; border-radius: 50%; background: var(--study-bg); color: var(--study-muted); font-size: 18px; }
.campus-stats { font-size: 13px; font-weight: 700; line-height: 18px; }
.campus-address, .campus-rule { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; line-height: 18px; color: var(--study-muted); }
.campus-address ion-icon, .campus-rule ion-icon { flex-shrink: 0; margin-top: 1px; font-size: 15px; }
.campus-rule ion-icon { color: var(--study-green-ink); }
.campus-ferias { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.campus-ferias li { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px; background: var(--study-bg); }
.campus-ferias li > div { flex: 1; min-width: 0; display: grid; gap: 2px; }
.campus-ferias b { font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
.campus-ferias small { font-size: 11px; line-height: 16px; color: var(--study-muted); }
.feria-icon { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 10px; background: var(--study-purple-soft); color: var(--study-purple); font-size: 16px; }
.live-badge { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; padding: 3px 9px; border-radius: 999px; background: var(--study-green-soft); color: var(--study-green-ink); font-size: 11px; font-weight: 700; white-space: nowrap; }
.live-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--study-green); animation: campus-live 1.6s ease-in-out infinite; }
.campus-cta { min-height: 48px; font-size: 14px; }
.campus-hint { display: flex; align-items: center; gap: 10px; padding: 14px 16px; font-size: 13px; line-height: 19px; color: var(--study-muted); }
.campus-hint ion-icon { font-size: 20px; color: var(--study-purple); }

/* ---------- Carga y error ---------- */
.campus-skeleton { display: grid; gap: 12px; }
.sk-chips { display: flex; gap: 8px; overflow: hidden; }
.sk-chips i, .sk-map, .sk-card { display: block; background: var(--study-track); animation: campus-pulse 1.4s ease-in-out infinite; }
.sk-chips i { width: 72px; height: 38px; flex-shrink: 0; border-radius: 999px; }
.sk-map { height: min(52vh, 460px); border-radius: 28px; }
.sk-card { height: 150px; border-radius: 24px; }
.campus-error { margin-top: 12px; border: 1px solid var(--study-border); border-radius: 24px; background: var(--study-surface); }

@keyframes campus-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
@keyframes campus-up { from { opacity: 0; transform: translateY(12px); } }
@keyframes campus-live { 50% { opacity: .35; } }

/* ---------- Escritorio: mapa en tarjeta y panel lateral ---------- */
@media (min-width: 960px) {
  .campus-page.has-map { display: grid; grid-template-columns: minmax(0, 1fr) 380px; grid-template-rows: minmax(0, 1fr); gap: 20px; max-width: 1320px; margin: 0 auto; padding: calc(var(--ion-safe-area-top, 0px) + 20px) 24px calc(var(--lau-nav-space, 0px) + 20px); }
  .has-map .map-stage { position: relative; inset: auto; overflow: hidden; border: 1px solid var(--study-border); border-radius: 28px; box-shadow: 0 18px 40px -20px rgba(20,20,22,.35); }
  .has-map .campus-ui { position: relative; inset: auto; padding: 0 4px 4px; overflow-y: auto; pointer-events: auto; }
  .has-map .campus-bottom, .has-map .geo-row { pointer-events: auto; }
  .has-map .campus-spacer { display: none; }
  .has-map .campus-chips { flex-wrap: wrap; overflow: visible; margin: 0; padding: 0; }
  .has-map .campus-card { max-height: none; overflow: visible; box-shadow: var(--study-shadow); }
  .has-map .campus-top, .has-map .campus-chips button, .has-map .geo-chip { box-shadow: var(--study-shadow); }
}

@media (max-width: 374px) {
  .campus-ui { padding-left: 12px; padding-right: 12px; }
  .campus-chips { margin: 0 -12px; padding-left: 12px; padding-right: 12px; }
  .locate-btn { padding: 10px 12px; font-size: 12px; }
  .campus-card { padding: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .has-map .campus-card, .live-badge::before, .sk-chips i, .sk-map, .sk-card { animation: none; }
}
</style>

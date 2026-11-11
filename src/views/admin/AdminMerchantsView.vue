<template>
  <ion-page class="study-ui market-ui admin-page">
    <ion-header class="ion-no-border admin-header">
      <ion-toolbar>
        <div class="admin-bar">
          <img src="/LaU.png" alt="" class="admin-brand"/>
          <div class="admin-title">
            <b>Panel de LaU</b>
            <span>Comercios verificados</span>
          </div>
          <nav class="admin-nav" aria-label="Secciones del panel">
            <router-link to="/equipo/comercios" replace class="is-current">Comercios</router-link>
            <router-link to="/equipo/campus" replace>Campus</router-link>
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

    <ion-content ref="content">
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content/></ion-refresher>
      <main class="study-shell admin-shell">
        <div class="admin-intro">
          <div>
            <h1>Comercios</h1>
            <p class="study-muted">Revisá las solicitudes de verificación.</p>
          </div>
          <span v-if="data" class="paypal-stat"><ion-icon :icon="logoPaypal" aria-hidden="true"/><b>{{ data.with_paypal }}</b> con PayPal activo</span>
        </div>

        <div class="market-search admin-search">
          <label>
            <ion-icon :icon="searchOutline" aria-hidden="true"/>
            <input
              v-model="search"
              type="search"
              enterKeyHint="search"
              autocomplete="off"
              placeholder="Razón social, NIT o tienda"
              aria-label="Buscar comercios"
              @keydown.enter.prevent="applySearch()"
            />
            <button v-if="search" type="button" class="search-clear" aria-label="Borrar búsqueda" @click="clearSearch"><ion-icon :icon="closeCircle"/></button>
          </label>
        </div>

        <div class="status-chips" role="group" aria-label="Filtrar por estado">
          <button
            v-for="option in FILTERS"
            :key="option.value || 'all'"
            type="button"
            :class="{ selected: filter === option.value }"
            :aria-pressed="filter === option.value"
            @click="setFilter(option.value)"
          >
            {{ option.label }}<span v-if="data" class="chip-count">{{ countFor(option.value) }}</span>
          </button>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load()">Reintentar</button></p>

        <!-- Primera carga -->
        <ul v-if="loading && !data" class="merchant-skeleton" aria-hidden="true">
          <li v-for="n in 5" :key="n"><i class="sk-logo"/><span><i/><i/><i/></span></li>
        </ul>

        <div v-else-if="data && !data.items.length" class="study-empty study-card admin-empty">
          <span class="study-symbol tone-blue"><ion-icon :icon="hasFilters ? searchOutline : fileTrayOutline"/></span>
          <h2>{{ hasFilters ? 'Sin resultados' : 'Aún no hay solicitudes' }}</h2>
          <p>{{ hasFilters ? 'Probá con otro estado o búsqueda.' : 'Cuando un comercio envíe sus datos, aparecerá aquí.' }}</p>
          <button v-if="hasFilters" class="study-link" @click="clearFilters">Limpiar filtros</button>
        </div>

        <ul v-else-if="data" class="merchant-list" :class="{ refreshing: loading }" :aria-busy="loading">
          <li v-for="item in data.items" :key="item.id">
            <button type="button" class="merchant-row" @click="open(item)">
              <span class="merchant-logo">
                <img v-if="item.store?.logo_url && !brokenLogos.has(item.id)" :src="item.store.logo_url" alt="" loading="lazy" @error="brokenLogos.add(item.id)"/>
                <b v-else>{{ initials(item.store?.name || item.legal_name) }}</b>
              </span>
              <span class="merchant-main">
                <b>{{ item.store?.name || item.legal_name }}</b>
                <span class="merchant-legal">{{ item.legal_name }} · NIT {{ item.nit }}</span>
                <span class="merchant-meta">
                  <span v-if="item.store?.owner"><ion-icon :icon="personOutline" aria-hidden="true"/>{{ item.store.owner.name }}</span>
                  <span><ion-icon :icon="calendarOutline" aria-hidden="true"/>{{ formatDate(item.submitted_at) }}</span>
                </span>
              </span>
              <span class="merchant-badges">
                <span class="admin-status" :class="`is-${item.status}`">{{ item.status_label || STATUS_LABELS[item.status] }}</span>
                <span v-if="item.store?.paypal_status === 'enabled'" class="paypal-badge is-enabled"><ion-icon :icon="logoPaypal" aria-hidden="true"/>PayPal activo</span>
                <span v-else-if="item.store?.paypal_status === 'pending'" class="paypal-badge is-pending"><ion-icon :icon="logoPaypal" aria-hidden="true"/>PayPal pendiente</span>
                <span v-if="item.pending_gateways" class="paypal-badge is-pending">{{ item.pending_gateways }} pasarela{{ item.pending_gateways === 1 ? '' : 's' }} por revisar</span>
              </span>
              <ion-icon :icon="chevronForwardOutline" class="merchant-chevron" aria-hidden="true"/>
            </button>
          </li>
        </ul>

        <nav v-if="data && data.last_page > 1" class="admin-pager" aria-label="Páginas">
          <button type="button" class="study-icon-button" :disabled="loading || data.page <= 1" aria-label="Página anterior" @click="goTo(data.page - 1)">
            <ion-icon :icon="chevronBackOutline"/>
          </button>
          <span>Página <b>{{ data.page }}</b> de {{ data.last_page }}</span>
          <button type="button" class="study-icon-button" :disabled="loading || data.page >= data.last_page" aria-label="Página siguiente" @click="goTo(data.page + 1)">
            <ion-icon :icon="chevronForwardOutline"/>
          </button>
        </nav>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonIcon, IonRefresher, IonRefresherContent, onIonViewWillEnter,
} from '@ionic/vue'
import {
  logOutOutline, logoPaypal, searchOutline, closeCircle, personOutline, calendarOutline,
  chevronForwardOutline, chevronBackOutline, fileTrayOutline,
} from 'ionicons/icons'
import {
  AdminService, adminErrorMessage, type MerchantList, type MerchantSummary, type VerificationStatus,
} from '@/services/adminService'
import '@/theme/study.css'
import '@/theme/marketplace.css'

// 'pagos': negocios con pasarelas pedidas que esperan revisión (aparte de la verificación).
type Filter = VerificationStatus | 'pagos' | ''

const STATUS_LABELS: Record<VerificationStatus, string> = {
  submitted: 'En revisión', approved: 'Aprobada', rejected: 'Requiere cambios', suspended: 'Suspendida',
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'submitted', label: 'En revisión' },
  { value: 'rejected', label: 'Requiere cambios' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'suspended', label: 'Suspendidas' },
  { value: 'pagos', label: 'Pagos en línea' },
]

const router = useRouter()
const route = useRoute()
const admin = ref(AdminService.admin())
const loggingOut = ref(false)

const data = ref<MerchantList | null>(null)
const loading = ref(true)
const error = ref('')
const filter = ref<Filter>('')
const search = ref('')
const query = ref('') // búsqueda ya aplicada (tras el debounce)
const page = ref(1)
const brokenLogos = reactive(new Set<number>())
const content = ref<{ $el: HTMLIonContentElement } | null>(null)

const hasFilters = computed(() => filter.value !== '' || query.value !== '')

function countFor(value: Filter): number {
  const counts = data.value?.counts
  if (!counts) return 0
  return value ? counts[value] ?? 0 : Object.entries(counts).reduce((sum, [key, n]) => key === 'pagos' ? sum : sum + (n || 0), 0)
}

const initials = (name?: string | null) =>
  (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('') || 'LaU'

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'

const isUnauthorized = (e: unknown) => (e as { response?: { status?: number } })?.response?.status === 401

function toLogin() {
  void router.replace({ path: '/equipo/login', query: { next: route.fullPath } })
}

// Contador de peticiones: solo la última respuesta actualiza la lista.
let request = 0

async function load(): Promise<void> {
  const id = ++request
  loading.value = true
  error.value = ''
  try {
    const result = await AdminService.merchants({ estado: filter.value, q: query.value, page: page.value })
    if (id !== request) return
    // La página quedó fuera de rango (p. ej. tras aprobar el último de la página): se vuelve a la última.
    if (!result.items.length && result.page > 1 && result.page > result.last_page) {
      page.value = Math.max(1, result.last_page)
      return load()
    }
    data.value = result
  } catch (e) {
    if (id !== request) return
    if (isUnauthorized(e)) return toLogin()
    error.value = adminErrorMessage(e, 'No pudimos cargar los comercios.')
  } finally {
    if (id === request) loading.value = false
  }
}

function setFilter(value: Filter) {
  if (filter.value === value) return
  filter.value = value
  page.value = 1
  void load()
}

// Búsqueda con debounce de 350 ms; Enter la aplica de inmediato.
let debounce: ReturnType<typeof setTimeout> | undefined
watch(search, value => {
  clearTimeout(debounce)
  debounce = setTimeout(() => applySearch(value), 350)
})

function applySearch(value = search.value) {
  clearTimeout(debounce)
  const next = value.trim()
  if (next === query.value) return
  query.value = next
  page.value = 1
  void load()
}

function clearSearch() {
  search.value = ''
  applySearch('')
}

function clearFilters() {
  search.value = ''
  query.value = ''
  filter.value = ''
  page.value = 1
  void load()
}

function goTo(next: number) {
  page.value = next
  void load()
  void content.value?.$el?.scrollToTop(250)
}

const open = (item: MerchantSummary) => router.push(`/equipo/comercios/${item.id}`)

async function refresh(event: CustomEvent) {
  await load()
  await (event.target as HTMLIonRefresherElement).complete()
}

async function logout() {
  loggingOut.value = true
  try {
    await AdminService.logout()
    await router.replace('/equipo/login')
  } finally {
    loggingOut.value = false
  }
}

// Ionic conserva la página: al volver del detalle se recarga para reflejar la decisión.
let firstEnter = true
onMounted(() => { void load() })
onIonViewWillEnter(() => {
  admin.value = AdminService.admin()
  if (firstEnter) { firstEnter = false; return }
  void load()
})
onBeforeUnmount(() => clearTimeout(debounce))
</script>

<style scoped>
/* Colores propios del panel (se suman a los tokens de study.css) */
.admin-page { --admin-amber: #a15c07; --admin-amber-soft: rgba(245, 158, 11, .14); --admin-red: #c92a2a; --admin-red-soft: rgba(224, 49, 49, .09); }
.ion-palette-dark .admin-page { --admin-amber: #fbbf24; --admin-amber-soft: rgba(251, 191, 36, .13); --admin-red: #ff8787; --admin-red-soft: rgba(255, 135, 135, .12); }

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
@media (max-width: 899px) { .admin-bar { padding: 10px 0; } }
@media (min-width: 900px) { .admin-nav { order: 0; flex: 0 0 auto; } .admin-nav a { flex: 0 0 auto; } }

/* Contenido */
.admin-shell.study-shell { max-width: 1040px; padding: 20px 16px 40px; }
.admin-intro { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 16px; margin-bottom: 16px; }
.admin-intro p { margin-top: 4px; font-size: 14px; line-height: 20px; }
.paypal-stat { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-muted); font-size: 13px; box-shadow: var(--study-shadow); }
.paypal-stat b { color: var(--study-text); font-size: 14px; }
.paypal-stat ion-icon { color: var(--study-blue); font-size: 16px; }

.admin-search { margin: 0 0 12px; }
.admin-search input::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }
.search-clear { display: grid; place-items: center; padding: 4px; border: 0; background: none; }
.market-search .search-clear ion-icon { color: var(--study-faint); }

.status-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px 18px; padding: 2px 16px 4px; }
.status-chips::-webkit-scrollbar { display: none; }
.status-chips button { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; white-space: nowrap; min-height: 38px; padding: 8px 12px 8px 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-muted); font-size: 13px; font-weight: 600; box-shadow: var(--study-shadow); }
.status-chips button.selected { background: var(--study-cta); border-color: var(--study-cta); color: var(--study-on-cta); }
.chip-count { min-width: 22px; padding: 1px 7px; border-radius: 999px; background: var(--study-track); color: var(--study-text); font-size: 11px; line-height: 16px; font-weight: 700; text-align: center; }
.selected .chip-count { background: rgba(255, 255, 255, .18); color: inherit; }

/* Lista */
.merchant-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; transition: opacity .2s ease; }
.merchant-list.refreshing { opacity: .55; }
.merchant-row {
  width: 100%; display: grid; grid-template-columns: 48px minmax(0, 1fr) 18px;
  grid-template-areas: "logo main chev" "logo badges chev"; column-gap: 12px; row-gap: 8px; align-items: center;
  padding: 14px; border: 1px solid var(--study-border); border-radius: 20px; background: var(--study-surface);
  color: var(--study-text); text-align: left; box-shadow: var(--study-shadow); animation: study-arrive .25s both;
}
.merchant-row:hover { border-color: color-mix(in srgb, var(--study-text) 18%, transparent); }
.merchant-logo { grid-area: logo; align-self: start; width: 48px; height: 48px; border-radius: 14px; overflow: hidden; display: grid; place-items: center; background: var(--study-track); color: var(--study-muted); }
.merchant-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.merchant-logo b { font-size: 15px; font-weight: 800; letter-spacing: .02em; }
.merchant-main { grid-area: main; min-width: 0; display: grid; gap: 3px; }
.merchant-main > b { font-size: 15px; line-height: 20px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.merchant-legal { font-size: 12px; line-height: 17px; color: var(--study-muted); overflow-wrap: anywhere; }
.merchant-meta { display: flex; flex-wrap: wrap; gap: 2px 12px; font-size: 11px; line-height: 16px; color: var(--study-muted); }
.merchant-meta > span { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
.merchant-meta ion-icon { font-size: 13px; color: var(--study-faint); }
.merchant-badges { grid-area: badges; display: flex; flex-wrap: wrap; gap: 6px; }
.merchant-chevron { grid-area: chev; color: var(--study-faint); font-size: 18px; }

/* Distintivos de estado y de PayPal */
.admin-status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: var(--study-track); color: var(--study-muted); font-size: 11px; line-height: 16px; font-weight: 700; white-space: nowrap; }
.admin-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.admin-status.is-submitted { background: var(--admin-amber-soft); color: var(--admin-amber); }
.admin-status.is-approved { background: var(--study-green-soft); color: var(--study-green-ink); }
.admin-status.is-rejected { background: var(--admin-red-soft); color: var(--admin-red); }
.paypal-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; font-size: 11px; line-height: 16px; font-weight: 800; white-space: nowrap; }
.paypal-badge ion-icon { font-size: 12px; }
.paypal-badge.is-enabled { background: #ffc439; color: #003087; }
.paypal-badge.is-pending { background: var(--study-bg); color: var(--study-muted); border: 1px solid var(--study-border); font-weight: 700; }

/* Vacío, carga y páginas */
.admin-empty { padding: 32px 20px; }
.merchant-skeleton { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.merchant-skeleton li { display: flex; gap: 12px; padding: 14px; border: 1px solid var(--study-border); border-radius: 20px; background: var(--study-surface); animation: admin-pulse 1.4s ease-in-out infinite; }
.merchant-skeleton .sk-logo { width: 48px; height: 48px; flex-shrink: 0; border-radius: 14px; background: var(--study-track); }
.merchant-skeleton span { flex: 1; display: grid; gap: 8px; align-content: center; }
.merchant-skeleton span i { display: block; height: 10px; border-radius: 999px; background: var(--study-track); width: 45%; }
.merchant-skeleton span i:nth-child(2) { width: 75%; }
.merchant-skeleton span i:nth-child(3) { width: 30%; }
@keyframes admin-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
.admin-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 20px; font-size: 13px; color: var(--study-muted); }
.admin-pager b { color: var(--study-text); }

@media (max-width: 560px) {
  .admin-name { max-width: 110px; }
  .admin-logout { width: 38px; padding: 0; }
  .admin-logout span { display: none; }
}
@media (max-width: 380px) {
  .admin-name { max-width: 72px; }
}
@media (min-width: 720px) {
  .admin-shell.study-shell { padding: 28px 24px 48px; }
  .status-chips { flex-wrap: wrap; overflow: visible; margin: 0 0 20px; padding: 0; }
  .merchant-row { grid-template-columns: 52px minmax(0, 1fr) auto 18px; grid-template-areas: "logo main badges chev"; padding: 16px 18px; }
  .merchant-logo { align-self: center; width: 52px; height: 52px; }
  .merchant-badges { flex-direction: column; align-items: flex-end; }
}
</style>

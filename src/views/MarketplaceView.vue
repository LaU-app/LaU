<template>
  <ion-page class="study-ui market-ui marketplace-page">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content/></ion-refresher>
      <main class="study-shell study-body">
        <div class="market-welcome">
          <h1>{{ greeting }}</h1>
          <!-- Al escribir se filtra el catálogo; al buscar (Enter o ✨) la IA evalúa lo que necesitás. -->
          <form class="market-search" role="search" @submit.prevent="smartSearch()">
            <label class="smart-search-box" :class="{ 'ai-busy': ai.status === 'thinking' }">
              <ion-icon :icon="searchOutline"/>
              <span class="sr-only">Buscá o describí lo que necesitás</span>
              <input ref="searchInput" v-model="search" type="search" placeholder="Buscá o describí lo que necesitás…" enterkeyhint="search"/>
              <button type="submit" class="ai-trigger" :disabled="search.trim().length < 3 || ai.status === 'thinking'" aria-label="Buscar con inteligencia artificial">
                <ion-icon :icon="sparkles"/>
              </button>
            </label>
            <button type="button" class="market-filter-btn" aria-label="Ordenar resultados" @click="openSort"><ion-icon :icon="swapVerticalOutline"/></button>
          </form>
        </div>

        <SmartSearchResults v-if="ai.status !== 'idle'" :status="ai.status" :plan="ai.plan" :error="ai.error"
          @dismiss="dismissSmartSearch" @retry="smartSearch(ai.query)" @open="openById" @buy="buy"/>

        <button class="market-entry study-card" @click="router.push('/tabs/marketplace/empresa')">
          <span class="study-symbol tone-green"><ion-icon :icon="shieldCheckmarkOutline"/></span>
          <span><b>¿Tenés un negocio?</b><small class="study-muted">Tienda, verificación y pagos en línea</small></span>
          <ion-icon :icon="chevronForwardOutline" aria-hidden="true"/>
        </button>

        <!-- Campus de entrega: todo se entrega dentro de un campus -->
        <div class="campus-bar">
          <button type="button" class="campus-chip" @click="chooseCampus">
            <ion-icon :icon="schoolOutline"/>
            <span>{{ currentCampus ? campusLabel(currentCampus) : 'Todos los campus' }}</span>
            <small v-if="currentCampus && currentCampus.id === myCampusId">tu campus</small>
            <ion-icon class="chev" :icon="chevronDownOutline"/>
          </button>
          <button type="button" class="campus-map-btn" @click="router.push('/tabs/marketplace/mapa')">
            <ion-icon :icon="mapOutline"/>Mapa
          </button>
        </div>

        <CategoryScroller v-model:selected="category"/>

        <div class="section-title">
          <h2>{{ search.trim() ? 'Resultados' : category ? 'En esta categoría' : 'Lo más reciente' }}</h2>
          <span v-if="total !== null" class="total-chip">{{ total }}</span>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load()">Reintentar</button></p>

        <div v-if="loading && !products.length" class="product-skeleton" aria-hidden="true"><i v-for="n in 6" :key="n"/></div>

        <div v-else-if="!products.length && !error" class="study-empty">
          <span class="study-symbol tone-blue"><ion-icon :icon="storefrontOutline"/></span>
          <h2>{{ search || category ? 'Nada por aquí' : currentCampus ? `Todavía no hay nada en ${campusLabel(currentCampus)}` : 'Todavía no hay nada a la venta' }}</h2>
          <p>{{ search || category ? 'Probá con otra búsqueda o categoría.' : 'Sé el primero en publicar algo para tu campus.' }}</p>
          <button class="study-link" @click="search || category || currentCampus ? clearFilters() : publish()">
            {{ search || category || currentCampus ? 'Ver todos los campus' : 'Publicar algo' }}
          </button>
        </div>

        <div v-else class="product-grid">
          <ProductCard v-for="product in products" :key="product.id" :product="product" @open="open" @add="add"/>
        </div>

        <ion-infinite-scroll :disabled="page >= lastPage" threshold="120px" @ionInfinite="more">
          <ion-infinite-scroll-content loading-text="Cargando más…"/>
        </ion-infinite-scroll>
      </main>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="market-fab">
        <ion-fab-button aria-label="Publicar un producto" @click="publish"><ion-icon :icon="addOutline"/></ion-fab-button>
      </ion-fab>
    </ion-content>

    <ion-modal :is-open="checkout !== null" :initial-breakpoint="1" :breakpoints="[0, 1]" @didDismiss="checkout = null">
      <PayPalCheckoutSheet v-if="checkout" :product-id="checkout.productId" :decision-id="checkout.decisionId"
        @close="checkout = null" @orders="goToOrders"/>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonContent, IonIcon, IonRefresher, IonRefresherContent, IonInfiniteScroll,
  IonInfiniteScrollContent, IonFab, IonFabButton, IonModal, actionSheetController, toastController,
} from '@ionic/vue'
import {
  searchOutline, swapVerticalOutline, storefrontOutline, addOutline, shieldCheckmarkOutline, chevronForwardOutline, sparkles,
  schoolOutline, chevronDownOutline, mapOutline,
} from 'ionicons/icons'
import campusService, { campusLabel, type Campus } from '@/services/campusService'
import AppHeader from '@/components/AppHeader.vue'
import SmartSearchResults from '@/components/marketplace/SmartSearchResults.vue'
import PayPalCheckoutSheet from '@/components/marketplace/PayPalCheckoutSheet.vue'
import smartShoppingService, { type SmartPlan } from '@/services/smartShoppingService'
import { CheckoutError } from '@/services/paypalCheckoutService'
import CategoryScroller from '@/components/marketplace/CategoryScroller.vue'
import ProductCard from '@/components/marketplace/ProductCard.vue'
import MarketplaceBottomNav from '@/components/marketplace/MarketplaceBottomNav.vue'
import { openProductForm } from '@/utils/productForm'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { useDarkMode } from '@/utils/useDarkMode'
import { useStudyScreen } from '@/utils/useStudyScreen'
import { cart } from '@/utils/useCart'
import type { Product } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const products = ref<Product[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const category = ref<string | null>(null)
const sort = ref<{ sort_by: 'created_at' | 'price'; sort_order: 'asc' | 'desc' }>({ sort_by: 'created_at', sort_order: 'desc' })
const page = ref(1)
const lastPage = ref(1)
const total = ref<number | null>(null)

// Búsqueda inteligente: al buscar, la IA evalúa productos de comercios verificados y su
// resultado aparece arriba de los resultados normales del catálogo.
const route = useRoute()
const searchInput = ref<HTMLInputElement | null>(null)
const ai = reactive<{ status: 'idle' | 'thinking' | 'done' | 'error'; query: string; plan: SmartPlan | null; error: string }>({
  status: 'idle', query: '', plan: null, error: '',
})
const checkout = ref<{ productId: number; decisionId: number } | null>(null)
let aiRequest = 0

async function smartSearch(text?: string) {
  const query = (text ?? search.value).trim()
  if (query.length < 3) return
  searchInput.value?.blur()
  const id = ++aiRequest
  Object.assign(ai, { status: 'thinking', query, plan: null, error: '' })
  try {
    const plan = await smartShoppingService.plan(query)
    if (id === aiRequest) Object.assign(ai, { status: 'done', plan })
  } catch (e) {
    if (id === aiRequest) Object.assign(ai, { status: 'error', error: e instanceof CheckoutError ? e.message : 'No pudimos completar la búsqueda.' })
  }
}

function dismissSmartSearch() {
  aiRequest++
  Object.assign(ai, { status: 'idle', plan: null, error: '' })
}

const buy = (productId: number, decisionId: number) => { checkout.value = { productId, decisionId } }
function goToOrders() {
  checkout.value = null
  router.push('/tabs/marketplace/orders')
}

onMounted(() => {
  // Enlaces con ?q= (p. ej. desde la ruta anterior del asistente) inician la búsqueda inteligente.
  const q = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  if (q.length >= 3) {
    search.value = q
    void smartSearch(q)
  }
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días, ¿qué buscás?'
  if (hour < 19) return 'Buenas tardes, ¿qué buscás?'
  return 'Buenas noches, ¿qué buscás?'
})

let request = 0
let debounce: ReturnType<typeof setTimeout> | undefined

async function load(append = false) {
  const id = ++request
  loading.value = true
  error.value = ''
  try {
    const result = await marketplaceService.products({
      search: search.value || undefined,
      category: category.value || undefined,
      universidad_id: campusId.value ?? undefined,
      page: append ? page.value + 1 : 1,
      ...sort.value,
    })
    if (id !== request) return
    products.value = append ? [...products.value, ...result.data] : result.data
    page.value = result.current_page
    lastPage.value = result.last_page
    total.value = result.total
  } catch (e) {
    if (id === request) error.value = marketplaceError(e, 'No pudimos cargar el marketplace.')
  } finally {
    if (id === request) loading.value = false
  }
}

async function more(event: CustomEvent) {
  await load(true)
  await (event.target as HTMLIonInfiniteScrollElement).complete()
}

async function refresh(event: CustomEvent) {
  await load()
  await (event.target as HTMLIonRefresherElement).complete()
}

const clearFilters = () => { search.value = ''; category.value = null; campusId.value = null }

// Campus: en LaU todo se entrega dentro de un campus. Por defecto se ve el campus del estudiante.
const campuses = ref<Campus[]>([])
const myCampusId = ref<number | null>(null)
const campusId = ref<number | null>(null)
const currentCampus = computed(() => campuses.value.find(c => c.id === campusId.value) ?? null)
const campusFromRoute = () => {
  const value = Number(route.query.campus)
  return Number.isInteger(value) && value > 0 ? value : null
}

async function loadCampuses() {
  try {
    const map = await campusService.map()
    campuses.value = map.campuses
    myCampusId.value = map.my_campus_id
    const initial = campusFromRoute() ?? map.my_campus_id
    if (initial !== campusId.value) campusId.value = initial
  } catch { /* sin campus se muestra todo el catálogo */ }
}

async function chooseCampus() {
  const sheet = await actionSheetController.create({
    header: 'Campus de entrega',
    buttons: [
      ...campuses.value.map(c => ({
        text: `${campusLabel(c)}${c.id === myCampusId.value ? ' · tu campus' : ''}${c.products_count ? ` (${c.products_count})` : ''}`,
        handler: () => { campusId.value = c.id },
      })),
      { text: 'Todos los campus', handler: () => { campusId.value = null } },
      { text: 'Ver en el mapa', handler: () => { router.push('/tabs/marketplace/mapa') } },
      { text: 'Cancelar', role: 'cancel' },
    ],
  })
  await sheet.present()
}
const open = (product: Product) => router.push(`/tabs/marketplace/product/${product.id}`)
const openById = (id: number) => router.push(`/tabs/marketplace/product/${id}`)

async function add(product: Product) {
  const added = await cart.add(product)
  const toast = await toastController.create({
    message: added ? `"${product.name}" va en tu carrito.` : 'Ya tenés todo el stock disponible en el carrito.',
    duration: 1800,
    position: 'top',
    color: added ? undefined : 'warning',
  })
  await toast.present()
}

async function publish() {
  const { data } = await openProductForm()
  if (data?.created) await load()
}

async function openSort() {
  const sheet = await actionSheetController.create({
    header: 'Ordenar por',
    buttons: [
      { text: 'Más recientes', handler: () => { sort.value = { sort_by: 'created_at', sort_order: 'desc' } } },
      { text: 'Precio: menor a mayor', handler: () => { sort.value = { sort_by: 'price', sort_order: 'asc' } } },
      { text: 'Precio: mayor a menor', handler: () => { sort.value = { sort_by: 'price', sort_order: 'desc' } } },
      { text: 'Cancelar', role: 'cancel' },
    ],
  })
  await sheet.present()
}

watch(search, (value) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { void load() }, 350)
  // Al borrar la búsqueda desaparece también la sección inteligente.
  if (!value.trim() && ai.status !== 'idle') dismissSmartSearch()
})
watch([category, sort, campusId], () => { void load() })
// Desde el mapa: /tabs/marketplace?campus=ID (la vista sigue montada en las pestañas).
watch(() => route.query.campus, () => {
  const fromRoute = campusFromRoute()
  if (fromRoute) campusId.value = fromRoute
})
void loadCampuses()

useStudyScreen(load, ['marketplace'])
</script>

<style scoped>
/*
 * El FAB vive en el ion-content, debajo del menú flotante (z-index 910). Se coloca
 * encima de él con el espacio compartido --lau-nav-space (alto + separación + safe area,
 * variables.css), que vale 0 cuando Ionic oculta el menú por el teclado.
 */
.marketplace-page { --market-fab-size: 56px; --market-fab-gap: 16px; }
.campus-bar { display: flex; gap: 8px; margin: 0 0 12px; }
.campus-chip, .campus-map-btn { display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--study-border); background: var(--study-surface); color: var(--study-text); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.campus-chip { flex: 1; min-width: 0; }
.campus-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.campus-chip > ion-icon:first-child, .campus-map-btn ion-icon { color: var(--study-purple); font-size: 17px; flex-shrink: 0; }
.campus-chip small { padding: 2px 8px; border-radius: 999px; background: var(--study-purple-soft); color: var(--study-purple); font-size: 11px; font-weight: 700; flex-shrink: 0; }
.campus-chip .chev { margin-left: auto; color: var(--study-faint); font-size: 15px; }
.market-fab {
  bottom: calc(var(--lau-nav-space, 0px) + var(--market-fab-gap));
  right: calc(15px + var(--ion-safe-area-right, 0px));
}
.market-fab ion-fab-button {
  --background: var(--study-cta); --background-activated: var(--study-cta); --color: var(--study-on-cta);
  --box-shadow: 0 6px 18px -4px rgba(20,20,22,.35);
  width: var(--market-fab-size); height: var(--market-fab-size);
  transition: transform .15s ease;
}
.market-fab ion-fab-button.ion-activated { transform: scale(.92); }
/* La última tarjeta y el infinite scroll siempre quedan por encima del FAB y del menú */
.marketplace-page ion-content { --padding-bottom: calc(var(--lau-nav-space, 0px) + var(--market-fab-gap) * 2 + var(--market-fab-size)); }
.marketplace-page .study-shell.study-body { padding-bottom: 0; }
@media (prefers-reduced-motion: reduce) { .market-fab ion-fab-button { transition: none; } }
/* Acceso para comercios verificados con PayPal */
.market-entry { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin-bottom: 20px; border-radius: 20px; color: var(--study-text); text-align: left; font: inherit; cursor: pointer; }
/* Botón del asistente dentro de la búsqueda */
/* Buscador inteligente: brillo al enfocar y borde animado mientras la IA busca */
.smart-search-box { position: relative; transition: border-color .3s ease, box-shadow .3s ease; }
.smart-search-box:focus-within { border-color: var(--study-purple) !important; box-shadow: 0 0 0 4px var(--study-purple-soft) !important; }
.smart-search-box.ai-busy::before { content: ''; position: absolute; inset: -1.5px; border-radius: inherit; padding: 1.5px; pointer-events: none;
  background: linear-gradient(90deg, #8b45ec, #2853e0, #76d26b, #8b45ec); background-size: 300% 100%; animation: search-glow 2s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
@keyframes search-glow { to { background-position: 300% 0; } }
.ai-trigger { width: 36px; height: 36px; margin: 6px -8px 6px 0; border: 0; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; cursor: pointer;
  background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 17px; box-shadow: 0 6px 16px -8px rgba(91, 33, 182, .8); transition: transform .2s ease, opacity .2s ease; }
.ai-trigger ion-icon { color: #fff !important; }
.ai-trigger:disabled { opacity: .45; cursor: default; box-shadow: none; }
.ai-trigger:not(:disabled):active { transform: scale(.92); }
.ai-busy .ai-trigger ion-icon { animation: search-twinkle 1.2s ease-in-out infinite; }
@keyframes search-twinkle { 50% { transform: scale(.8) rotate(12deg); } }
@media (prefers-reduced-motion: reduce) { .smart-search-box.ai-busy::before, .ai-busy .ai-trigger ion-icon { animation: none; } }
.market-entry > span:nth-child(2) { flex: 1; min-width: 0; display: grid; gap: 2px; }
.market-entry b { font-size: 14px; line-height: 18px; }
.market-entry > ion-icon { color: var(--study-faint); font-size: 18px; }
</style>

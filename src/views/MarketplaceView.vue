<template>
  <ion-page class="study-ui market-ui marketplace-page">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content/></ion-refresher>
      <main class="study-shell study-body">
        <div class="market-welcome">
          <h1>{{ greeting }}</h1>
          <div class="market-search">
            <label>
              <ion-icon :icon="searchOutline"/>
              <span class="sr-only">Buscar productos</span>
              <input v-model="search" type="search" placeholder="Libros, calculadora, apuntes…" enterkeyhint="search"/>
              <!-- El asistente vive dentro de la búsqueda: lo escrito pasa a ser su primera consulta. -->
              <button type="button" class="agent-trigger" aria-label="Pedile al asistente que encuentre lo que necesitás" @click.prevent="openAgent">
                <span class="agent-trigger-orb" aria-hidden="true"/>
                <span>Asistente</span>
              </button>
            </label>
            <button class="market-filter-btn" aria-label="Ordenar resultados" @click="openSort"><ion-icon :icon="swapVerticalOutline"/></button>
          </div>
        </div>

        <button class="market-entry study-card" @click="router.push('/tabs/marketplace/empresa')">
          <span class="study-symbol tone-green"><ion-icon :icon="shieldCheckmarkOutline"/></span>
          <span><b>¿Tenés un comercio?</b><small class="study-muted">Verificalo en LaU y cobrá con PayPal</small></span>
          <ion-icon :icon="chevronForwardOutline" aria-hidden="true"/>
        </button>

        <CategoryScroller v-model:selected="category"/>

        <div class="section-title">
          <h2>{{ category ? 'En esta categoría' : 'Lo más reciente' }}</h2>
          <span v-if="total !== null" class="total-chip">{{ total }}</span>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load()">Reintentar</button></p>

        <div v-if="loading && !products.length" class="product-skeleton" aria-hidden="true"><i v-for="n in 6" :key="n"/></div>

        <div v-else-if="!products.length && !error" class="study-empty">
          <span class="study-symbol tone-blue"><ion-icon :icon="storefrontOutline"/></span>
          <h2>{{ search || category ? 'Nada por aquí' : 'Todavía no hay nada a la venta' }}</h2>
          <p>{{ search || category ? 'Probá con otra búsqueda o categoría.' : 'Sé el primero en publicar algo para tu campus.' }}</p>
          <button class="study-link" @click="search || category ? clearFilters() : publish()">
            {{ search || category ? 'Ver todo' : 'Publicar algo' }}
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

    <ion-modal class="agent-modal" :is-open="agentOpen" @willDismiss="agentClosing = true" @didDismiss="onAgentDismissed">
      <ShoppingAgent v-if="agentOpen" :initial-query="agentQuery" @close="closeAgent"/>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonContent, IonIcon, IonRefresher, IonRefresherContent, IonInfiniteScroll,
  IonInfiniteScrollContent, IonFab, IonFabButton, IonModal, actionSheetController, toastController,
} from '@ionic/vue'
import { searchOutline, swapVerticalOutline, storefrontOutline, addOutline, shieldCheckmarkOutline, chevronForwardOutline } from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import ShoppingAgent from '@/components/marketplace/ShoppingAgent.vue'
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

// Asistente de compras: se abre desde la búsqueda con lo que el estudiante ya escribió.
const agentOpen = ref(false)
const agentQuery = ref('')
// Si se reabre mientras termina la animación de cierre, se espera a que termine.
let agentClosing = false
let agentReopen = false
function openAgent() {
  agentQuery.value = search.value.trim()
  if (agentClosing) agentReopen = true
  else agentOpen.value = true
}
function closeAgent() {
  agentClosing = true
  agentOpen.value = false
}
function onAgentDismissed() {
  agentClosing = false
  agentOpen.value = false
  if (agentReopen) {
    agentReopen = false
    agentOpen.value = true
  }
}

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

const clearFilters = () => { search.value = ''; category.value = null }
const open = (product: Product) => router.push(`/tabs/marketplace/product/${product.id}`)

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

watch(search, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { void load() }, 350)
})
watch([category, sort], () => { void load() })

useStudyScreen(load, ['marketplace'])
</script>

<style scoped>
/*
 * El FAB vive en el ion-content, debajo del menú flotante (z-index 910). Se coloca
 * encima de él con el espacio compartido --lau-nav-space (alto + separación + safe area,
 * variables.css), que vale 0 cuando Ionic oculta el menú por el teclado.
 */
.marketplace-page { --market-fab-size: 56px; --market-fab-gap: 16px; }
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
.agent-trigger { position: relative; display: inline-flex; align-items: center; gap: 7px; margin: 5px -9px 5px 0; padding: 0 13px 0 6px; height: 38px; border: 0; border-radius: 999px; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 16px -8px rgba(91, 33, 182, .8); transition: transform .2s ease; }
.agent-trigger::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); transform: translateX(-120%); animation: agent-shine 4s ease-in-out infinite 1.2s; }
.agent-trigger:active { transform: scale(.95); }
.agent-trigger-orb { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: radial-gradient(circle at 32% 30%, #fff 0%, #e9d5ff 22%, #a875f5 55%, #6d28d9 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.4); animation: agent-breathe 2.8s ease-in-out infinite; }
@keyframes agent-shine { 0%, 60% { transform: translateX(-120%); } 85%, 100% { transform: translateX(120%); } }
@keyframes agent-breathe { 50% { transform: scale(.86); } }
@media (prefers-reduced-motion: reduce) { .agent-trigger::after, .agent-trigger-orb { animation: none; } }
.market-entry > span:nth-child(2) { flex: 1; min-width: 0; display: grid; gap: 2px; }
.market-entry b { font-size: 14px; line-height: 18px; }
.market-entry > ion-icon { color: var(--study-faint); font-size: 18px; }
</style>

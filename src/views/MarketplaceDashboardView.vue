<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content/></ion-refresher>
      <main class="study-shell study-body">
        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load">Reintentar</button></p>
        <p v-if="loading && !data" class="study-empty" role="status">Cargando tu panel…</p>

        <template v-if="data">
          <!-- Sin tienda: panel personal. Cualquier estudiante puede vender a su nombre; la tienda
               con nombre propio es para comercios verificados (necesaria para cobrar con PayPal). -->
          <template v-if="!data.store">
            <header class="store-hero study-card">
              <span class="store-logo personal">
                <img v-if="me?.imagen_url && !avatarFailed" :src="me.imagen_url" alt="" @error="avatarFailed = true"/>
                <b v-else>{{ initials }}</b>
              </span>
              <div>
                <span class="eyebrow">TU PANEL DE VENTAS</span>
                <h1>{{ me?.name || 'Tu panel' }}</h1>
                <p>Vendés como estudiante, a tu nombre.</p>
              </div>
            </header>

            <div class="hero-actions">
              <button class="study-button secondary-button" @click="publish"><ion-icon :icon="addOutline"/>Publicar producto</button>
              <button class="study-button secondary-button" :disabled="!me?.username" @click="router.push(`/tabs/perfil/${me?.username}`)"><ion-icon :icon="eyeOutline"/>Mi perfil</button>
            </div>

            <button class="verify-card study-card" @click="router.push('/tabs/marketplace/empresa')">
              <span class="study-symbol tone-purple"><ion-icon :icon="ribbonOutline"/></span>
              <span>
                <b>¿Tenés un negocio inscrito?</b>
                <small class="study-muted">Verificalo en LaU. Los pagos en línea son opcionales.</small>
              </span>
              <ion-icon :icon="arrowForwardOutline" aria-hidden="true"/>
            </button>
          </template>

          <template v-else>
            <header class="store-hero study-card">
              <span class="store-logo">
                <img v-if="data.store.logo_url" :src="data.store.logo_url" :alt="data.store.name"/>
                <ion-icon v-else :icon="storefrontOutline"/>
              </span>
              <div>
                <span class="eyebrow">TU EMPRENDIMIENTO</span>
                <h1>{{ data.store.name }}</h1>
                <p v-if="data.store.description">{{ data.store.description }}</p>
              </div>
            </header>

            <div class="hero-actions">
              <button class="study-button secondary-button" @click="openWizard(data.store)"><ion-icon :icon="createOutline"/>Editar perfil</button>
              <button class="study-button secondary-button" @click="router.push(`/tabs/marketplace/store/${data.store.slug}`)"><ion-icon :icon="eyeOutline"/>Ver vitrina</button>
            </div>

            <button class="verify-card study-card" @click="router.push('/tabs/marketplace/empresa')">
              <span class="study-symbol" :class="data.store.accepts_paypal ? 'tone-green' : 'tone-purple'">
                <ion-icon :icon="data.store.accepts_paypal ? shieldCheckmarkOutline : ribbonOutline"/>
              </span>
              <span>
                <b>{{ data.store.accepts_paypal ? 'Negocio verificado · cobrás con PayPal' : data.store.is_verified ? 'Negocio verificado' : 'Tu negocio en LaU' }}</b>
                <small class="study-muted">{{ data.store.accepts_paypal ? 'Tus productos muestran el distintivo de LaU.' : data.store.is_verified ? 'Si querés, pedí pagos en línea.' : 'Verificación legal y pagos en línea, cuando estés listo.' }}</small>
              </span>
              <ion-icon :icon="arrowForwardOutline" aria-hidden="true"/>
            </button>
          </template>

          <!-- Métricas, acciones y pedidos: iguales para el panel personal y el de tienda. -->
          <template v-if="data">
            <!-- El hero del mockup era una tarjeta morada a sangre; aquí es la misma
                 today-card del módulo de Estudio: número grande en negro. -->
            <div class="today-card study-card">
              <div class="today-heading">
                <span class="eyebrow">ENTREGADO ESTE MES</span>
                <span v-if="data.metrics.change_percent !== null" class="neutral-chip">
                  <ion-icon :icon="data.metrics.change_percent >= 0 ? trendingUpOutline : trendingDownOutline"/>
                  {{ data.metrics.change_percent > 0 ? '+' : '' }}{{ data.metrics.change_percent }}%
                </span>
              </div>
              <div class="today-value"><strong>${{ data.metrics.delivered_this_month.toFixed(2) }}</strong></div>
              <p><ion-icon :icon="checkmarkCircleOutline"/>{{ data.metrics.delivered_total }} entrega{{ data.metrics.delivered_total === 1 ? '' : 's' }} en total</p>
              <div v-if="data.metrics.delivered_previous_month > 0" class="today-track">
                <span :style="{ width: monthProgress + '%' }"/>
              </div>
            </div>

            <div class="study-metrics">
              <div class="study-card">
                <span class="study-symbol tone-orange"><ion-icon :icon="timeOutline"/></span>
                <b>{{ data.metrics.pending_orders }}</b>
                <span>PENDIENTES</span>
              </div>
              <div class="study-card">
                <span class="study-symbol tone-blue"><ion-icon :icon="cubeOutline"/></span>
                <b>{{ data.metrics.published_products }}</b>
                <span>PUBLICADOS</span>
              </div>
              <div class="study-card">
                <span class="study-symbol tone-green"><ion-icon :icon="checkmarkDoneOutline"/></span>
                <b>{{ data.metrics.delivered_total }}</b>
                <span>ENTREGADOS</span>
              </div>
            </div>

            <div class="section-title"><h2>Acciones rápidas</h2></div>
            <div class="quick-actions">
              <button class="quick-action" @click="publish"><span class="study-symbol tone-purple"><ion-icon :icon="addOutline"/></span><b>Añadir producto</b><span class="round-arrow"><ion-icon :icon="arrowForwardOutline"/></span></button>
              <button class="quick-action" @click="router.push('/tabs/marketplace/orders')"><span class="study-symbol tone-blue"><ion-icon :icon="receiptOutline"/></span><b>Ver apartados</b><span class="round-arrow"><ion-icon :icon="arrowForwardOutline"/></span></button>
            </div>

            <template v-if="data.recent_orders.length">
              <div class="section-title"><h2>Apartados recientes</h2><button class="study-link" @click="router.push('/tabs/marketplace/orders')">Ver todo</button></div>
              <ol class="study-history">
                <li v-for="order in data.recent_orders" :key="order.id">
                  <StudyAvatar :src="order.buyer?.imagen_url" :name="order.buyer?.name"/>
                  <div>
                    <b>{{ order.buyer?.name ?? 'Estudiante' }}</b>
                    <span>{{ order.items.length }} artículo{{ order.items.length === 1 ? '' : 's' }} · {{ studyDate(order.created_at) }}</span>
                  </div>
                  <div class="history-right">
                    <strong>${{ Number(order.total).toFixed(2) }}</strong>
                    <span class="status-chip" :class="statusClass(order.status)"><i/>{{ STATUS[order.status] }}</span>
                  </div>
                </li>
              </ol>
            </template>

            <template v-if="data.low_stock.length">
              <div class="section-title"><h2>Poco stock</h2></div>
              <ol class="study-history">
                <li v-for="product in data.low_stock" :key="product.id" @click="router.push(`/tabs/marketplace/product/${product.id}`)">
                  <span class="store-logo small">
                    <img v-if="product.images[0]" :src="product.images[0].url" :alt="product.name"/>
                    <ion-icon v-else :icon="imageOutline"/>
                  </span>
                  <div>
                    <b>{{ product.name }}</b>
                    <div class="dash-progress"><span :style="{ width: Math.min(100, product.stock * 20) + '%' }"/></div>
                    <small>{{ product.stock === 0 ? 'Sin stock' : `${product.stock} unidad${product.stock === 1 ? '' : 'es'} restante${product.stock === 1 ? '' : 's'}` }}</small>
                  </div>
                </li>
              </ol>
            </template>
          </template>
        </template>
      </main>
    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, IonRefresher, IonRefresherContent, modalController } from '@ionic/vue'
import {
  storefrontOutline, addOutline, createOutline, eyeOutline, trendingUpOutline, trendingDownOutline,
  checkmarkCircleOutline, checkmarkDoneOutline, timeOutline, cubeOutline, receiptOutline,
  arrowForwardOutline, imageOutline, shieldCheckmarkOutline, ribbonOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import StudyAvatar from '@/components/study/StudyAvatar.vue'
import { AuthService } from '@/services/auth'
import MarketplaceBottomNav from '@/components/marketplace/MarketplaceBottomNav.vue'
import StoreWizardModal from '@/components/marketplace/StoreWizardModal.vue'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { useDarkMode } from '@/utils/useDarkMode'
import { useStudyScreen } from '@/utils/useStudyScreen'
import { openProductForm } from '@/utils/productForm'
import { studyDate } from '@/utils/studyPresentation'
import type { Store, StoreDashboard } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
// Datos del estudiante para el panel personal (sin tienda): su nombre es el de su panel.
const me = AuthService.getUser() as { name?: string; username?: string; imagen_url?: string | null } | null
const avatarFailed = ref(false)
const initials = computed(() => (me?.name ?? 'Tú').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join(''))
const { isDarkMode, toggleDarkMode } = useDarkMode()

const STATUS: Record<string, string> = { pending: 'Pendiente', delivered: 'Entregado', cancelled: 'Cancelado' }
const statusClass = (value: string) => value === 'delivered' ? 'status-completed' : value === 'pending' ? 'status-in_progress' : ''

const data = ref<StoreDashboard | null>(null)
const loading = ref(true)
const error = ref('')

const monthProgress = computed(() => {
  const metrics = data.value?.metrics
  if (!metrics || metrics.delivered_previous_month <= 0) return 0
  return Math.min(100, (metrics.delivered_this_month / metrics.delivered_previous_month) * 100)
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await marketplaceService.dashboard()
  } catch (e) {
    error.value = marketplaceError(e, 'No pudimos cargar tu panel.')
  } finally {
    loading.value = false
  }
}

async function refresh(event: CustomEvent) {
  await load()
  await (event.target as HTMLIonRefresherElement).complete()
}

async function openWizard(store?: Store | null) {
  const modal = await modalController.create({
    component: StoreWizardModal,
    componentProps: { store: store ?? null },
  })
  await modal.present()
  const { data: result } = await modal.onDidDismiss()
  if (result?.saved) await load()
}

async function publish() {
  const { data: result } = await openProductForm()
  if (result?.created) await load()
}

useStudyScreen(load, ['marketplace'])
</script>

<style scoped>
.hero-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
.hero-actions .study-button { min-height: 46px; font-size: 13px; }
.create-store { max-width: 260px; margin-top: 8px; }
.verify-card { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin-bottom: 24px; border-radius: 20px; color: var(--study-text); text-align: left; font: inherit; cursor: pointer; }
.verify-card > span:nth-child(2) { flex: 1; min-width: 0; display: grid; gap: 2px; }
.verify-card b { font-size: 14px; line-height: 18px; }
.verify-card > ion-icon { color: var(--study-faint); font-size: 18px; }
.history-right { flex: 0 0 auto !important; display: grid !important; gap: 5px; justify-items: end; text-align: right; }
.history-right .status-chip { font-size: 10px; padding: 2px 8px; }
.store-logo.small { width: 44px; height: 44px; border-radius: 12px; font-size: 18px; }
/* Panel personal: la foto del estudiante ocupa el lugar del logo */
.store-logo.personal { border-radius: 50%; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; }
.store-logo.personal img { width: 100%; height: 100%; object-fit: cover; }
.store-logo.personal b { font-size: 22px; font-weight: 800; letter-spacing: .02em; }
.study-history li > div:not(.history-right) { display: grid; gap: 5px; }
</style>

<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <main class="study-shell study-body">
        <div class="market-welcome">
          <span class="eyebrow"><i/>TUS APARTADOS</span>
          <h1>{{ tab === 'purchases' ? 'Lo que apartaste' : 'Lo que te apartaron' }}</h1>
        </div>

        <div class="period-selector orders-tabs" role="group" aria-label="Tipo">
          <button :aria-pressed="tab === 'purchases'" :class="{ selected: tab === 'purchases' }" @click="tab = 'purchases'">Mis compras</button>
          <button :aria-pressed="tab === 'sales'" :class="{ selected: tab === 'sales' }" @click="tab = 'sales'">Mis ventas</button>
        </div>

        <div class="period-selector status-tabs" role="group" aria-label="Estado">
          <button v-for="option in statuses" :key="option.value ?? 'all'" :aria-pressed="status === option.value" :class="{ selected: status === option.value }" @click="status = option.value">{{ option.label }}</button>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load()">Reintentar</button></p>
        <p v-if="loading && !orders.length" class="study-empty" role="status">Cargando…</p>

        <div v-else-if="!orders.length && !error" class="study-empty">
          <span class="study-symbol tone-blue"><ion-icon :icon="receiptOutline"/></span>
          <h2>{{ tab === 'purchases' ? 'No has apartado nada' : 'Todavía no te apartan nada' }}</h2>
          <p>{{ tab === 'purchases' ? 'Lo que apartes aparecerá acá.' : 'Publicá algo y aparecerá acá cuando alguien lo aparte.' }}</p>
          <button class="study-link" @click="router.push('/tabs/marketplace')">Ir al marketplace</button>
        </div>

        <article v-for="order in orders" :key="order.id" class="order-card study-card">
          <header class="order-head">
            <div>
              <span class="eyebrow">{{ order.code }}</span>
              <h3>${{ Number(order.total).toFixed(2) }}</h3>
              <span class="study-muted">{{ counterpartLabel(order) }} · {{ studyDate(order.created_at) }}</span>
            </div>
            <div class="order-chips">
              <span class="status-chip" :class="statusClass(order.status)"><i/>{{ STATUS[order.status] }}</span>
              <span v-if="isPaid(order)" class="paid-chip"><ion-icon :icon="logoPaypal"/>Pagado</span>
            </div>
          </header>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.product_name"/>
              <div><b>{{ item.product_name }}</b><small>{{ item.quantity }} × ${{ Number(item.unit_price).toFixed(2) }}</small></div>
              <span>${{ item.subtotal.toFixed(2) }}</span>
            </div>
          </div>

          <p v-if="order.meeting_point" class="order-meta"><ion-icon :icon="locationOutline"/>{{ order.meeting_point }}</p>
          <p v-if="order.note" class="order-meta"><ion-icon :icon="chatboxOutline"/>{{ order.note }}</p>
          <p v-if="order.status === 'cancelled' && order.cancel_reason" class="order-meta"><ion-icon :icon="alertCircleOutline"/>{{ order.cancel_reason }}</p>

          <footer class="order-foot">
            <button v-if="tab === 'sales' && order.status === 'pending'" class="study-button" :disabled="busy === order.id" @click="deliver(order)">
              <ion-icon :icon="checkmarkCircleOutline"/>Marcar como entregado
            </button>
            <button v-else-if="order.status === 'pending' && !isPaid(order)" class="study-button secondary-button" :disabled="busy === order.id" @click="cancel(order)">
              <ion-icon :icon="closeCircleOutline"/>Cancelar apartado
            </button>
            <button v-else-if="order.status === 'pending'" class="study-button secondary-button" @click="openChat(order)">
              <ion-icon :icon="chatbubbleEllipsesOutline"/>Coordinar entrega
            </button>
            <button v-else class="study-button secondary-button" @click="openChat(order)">
              <ion-icon :icon="chatbubbleEllipsesOutline"/>Abrir chat
            </button>
            <button v-if="order.status === 'pending'" class="order-icon-btn" aria-label="Abrir chat" @click="openChat(order)"><ion-icon :icon="chatbubbleEllipsesOutline"/></button>
            <button v-if="tab === 'sales' && order.status === 'pending' && !isPaid(order)" class="order-icon-btn" aria-label="Cancelar apartado" @click="cancel(order)"><ion-icon :icon="closeCircleOutline"/></button>
          </footer>
        </article>

        <button v-if="page < lastPage" class="study-link load-more" :disabled="loading" @click="load(true)">Ver más</button>
      </main>
    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, alertController, toastController } from '@ionic/vue'
import {
  receiptOutline, locationOutline, chatboxOutline, alertCircleOutline,
  checkmarkCircleOutline, closeCircleOutline, chatbubbleEllipsesOutline, logoPaypal,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import MarketplaceBottomNav from '@/components/marketplace/MarketplaceBottomNav.vue'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { useDarkMode } from '@/utils/useDarkMode'
import { useStudyScreen } from '@/utils/useStudyScreen'
import { studyDate } from '@/utils/studyPresentation'
import type { Order } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const STATUS: Record<string, string> = { pending: 'Pendiente', delivered: 'Entregado', cancelled: 'Cancelado' }
const statuses = [
  { label: 'Todos', value: undefined as string | undefined },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Entregados', value: 'delivered' },
  { label: 'Cancelados', value: 'cancelled' },
]

const tab = ref<'purchases' | 'sales'>('purchases')
const status = ref<string | undefined>(undefined)
const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')
const busy = ref<number | null>(null)
const page = ref(1)
const lastPage = ref(1)

// Pagado en línea con PayPal: ya no se cancela como un apartado (requeriría un reembolso).
const isPaid = (order: Order) => order.payment_status === 'paid'
const statusClass = (value: string) => value === 'delivered' ? 'status-completed' : value === 'pending' ? 'status-in_progress' : ''
const counterpartLabel = (order: Order) => tab.value === 'purchases'
  ? `Vendé: ${order.seller?.name ?? 'vendedor'}`.replace('Vendé:', 'Vende:')
  : `Compra: ${order.buyer?.name ?? 'comprador'}`

let request = 0

async function load(append = false) {
  const id = ++request
  loading.value = true
  error.value = ''
  try {
    const fetcher = tab.value === 'purchases' ? marketplaceService.purchases : marketplaceService.sales
    const result = await fetcher(append ? page.value + 1 : 1, status.value)
    if (id !== request) return
    orders.value = append ? [...orders.value, ...result.data] : result.data
    page.value = result.current_page
    lastPage.value = result.last_page
  } catch (e) {
    if (id === request) error.value = marketplaceError(e, 'No pudimos cargar tus apartados.')
  } finally {
    if (id === request) loading.value = false
  }
}

function replace(updated: Order) {
  const index = orders.value.findIndex(order => order.id === updated.id)
  if (index >= 0) orders.value[index] = updated
}

async function deliver(order: Order) {
  const alert = await alertController.create({
    header: '¿Ya lo entregaste?',
    message: `Se marcará el apartado ${order.code} como entregado.`,
    buttons: [
      { text: 'Todavía no', role: 'cancel' },
      { text: 'Sí, entregado', handler: () => { void run(order, () => marketplaceService.deliverOrder(order.id), 'Apartado entregado.') } },
    ],
  })
  await alert.present()
}

async function cancel(order: Order) {
  const alert = await alertController.create({
    header: '¿Cancelar el apartado?',
    message: 'El stock vuelve a quedar disponible.',
    inputs: [{ name: 'reason', type: 'text', placeholder: 'Motivo (opcional)', attributes: { maxlength: 255 } }],
    buttons: [
      { text: 'Conservar', role: 'cancel' },
      { text: 'Cancelar apartado', role: 'destructive', handler: data => { void run(order, () => marketplaceService.cancelOrder(order.id, data?.reason), 'Apartado cancelado.') } },
    ],
  })
  await alert.present()
}

async function run(order: Order, action: () => Promise<Order>, message: string) {
  busy.value = order.id
  try {
    replace(await action())
    await (await toastController.create({ message, duration: 2000, position: 'top' })).present()
  } catch (e) {
    await (await toastController.create({ message: marketplaceError(e), duration: 2600, position: 'top', color: 'danger' })).present()
    await load()
  } finally {
    busy.value = null
  }
}

const openChat = (order: Order) => router.push(`/chat/${tab.value === 'purchases' ? order.seller_id : order.buyer_id}`)

watch([tab, status], () => { void load() })
useStudyScreen(load, ['marketplace'])
</script>

<style scoped>
.order-chips { display: grid; gap: 6px; justify-items: end; }
.paid-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; background: #ffc439; color: #003087; font-size: 11px; font-weight: 800; }
.orders-tabs { width: 100%; margin-bottom: 10px; }
.orders-tabs button { flex: 1; }
.status-tabs { width: 100%; margin-bottom: 20px; overflow-x: auto; scrollbar-width: none; }
.status-tabs::-webkit-scrollbar { display: none; }
.status-tabs button { flex-shrink: 0; font-size: 11px; padding: 8px 12px; }
.order-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-size: 12px; line-height: 17px; color: var(--study-muted); }
.order-meta ion-icon { font-size: 15px; flex-shrink: 0; }
</style>

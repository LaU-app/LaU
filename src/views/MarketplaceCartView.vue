<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <main class="study-shell study-body">
        <div class="detail-toolbar">
          <button class="study-icon-button" aria-label="Volver" @click="router.back()"><ion-icon :icon="arrowBackOutline"/></button>
          <div><button v-if="!cart.isEmpty.value" class="study-icon-button" aria-label="Vaciar carrito" @click="confirmClear"><ion-icon :icon="trashOutline"/></button></div>
        </div>

        <div class="market-welcome">
          <h1>{{ cart.isEmpty.value ? 'Todavía está vacío' : `${cart.count.value} artículo${cart.count.value === 1 ? '' : 's'}` }}</h1>
        </div>

        <div v-if="cart.isEmpty.value" class="study-empty">
          <span class="study-symbol tone-blue"><ion-icon :icon="cartOutline"/></span>
          <h2>Nada apartado todavía</h2>
          <p>Cuando encuentres algo que te sirva, agregalo aquí.</p>
          <button class="study-link" @click="router.push('/tabs/marketplace')">Seguir explorando</button>
        </div>

        <template v-else>
          <p v-if="cart.busy.value" class="study-notice" role="status">Revisando precios y stock…</p>
          <div v-for="issue in cart.issues" :key="issue.product_id + issue.type" class="cart-issue">
            <ion-icon :icon="alertCircleOutline"/>{{ issue.message }}
          </div>

          <!-- Agrupado por vendedor: las tiendas con PayPal se pagan en línea; el resto se aparta. -->
          <section v-for="group in cart.bySeller.value" :key="group.seller_id" class="cart-group" :class="{ 'is-paypal': group.accepts_paypal }">
            <div class="cart-group-head">
              <span v-if="group.store_logo_url" class="group-logo"><img :src="group.store_logo_url" alt=""/></span>
              <ion-icon v-else :icon="group.store_id ? storefrontOutline : personOutline"/>
              <span class="group-name">{{ group.seller_name }}</span>
              <span class="pay-chip" :class="group.accepts_paypal ? 'chip-paypal' : 'chip-person'">
                <ion-icon :icon="group.accepts_paypal ? logoPaypal : handLeftOutline"/>{{ group.accepts_paypal ? 'PayPal' : 'Pagás al recibir' }}
              </span>
            </div>
            <TransitionGroup name="study-view">
              <article v-for="item in group.items" :key="item.product_id" class="cart-row study-card">
                <div class="cart-thumb">
                  <img v-if="item.image_url" :src="item.image_url" :alt="item.name" @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"/>
                  <span v-else><ion-icon :icon="imageOutline"/></span>
                </div>
                <div class="cart-info">
                  <b>{{ item.name }}</b>
                  <span v-if="item.delivery_point" class="product-meta"><ion-icon :icon="locationOutline"/>{{ item.delivery_point }}</span>
                  <div class="cart-line">
                    <b>${{ (item.price * item.quantity).toFixed(2) }}</b>
                    <span class="stepper">
                      <button :aria-label="`Quitar una unidad de ${item.name}`" @click="cart.decrement(item.product_id)">−</button>
                      <output>{{ item.quantity }}</output>
                      <button :disabled="item.quantity >= item.stock" :aria-label="`Agregar una unidad de ${item.name}`" @click="cart.increment(item.product_id)">+</button>
                    </span>
                    <button class="cart-remove" :aria-label="`Quitar ${item.name}`" @click="cart.remove(item.product_id)"><ion-icon :icon="closeOutline"/></button>
                  </div>
                </div>
              </article>
            </TransitionGroup>
            <button v-if="group.accepts_paypal" class="paypal-group-btn" :disabled="cart.busy.value || confirming" @click="payGroup(group)">
              <ion-icon :icon="logoPaypal"/>
              <span>Pagar ${{ group.subtotal.toFixed(2) }} con PayPal</span>
            </button>
          </section>

          <div v-if="reserveGroups.length" class="task-field study-card">
            <span>PUNTO DE ENCUENTRO</span>
            <input v-model="meetingPoint" maxlength="160" placeholder="¿Dónde se ven?" :disabled="confirming"/>
            <div class="quick-chips">
              <button v-for="place in quickPlaces" :key="place" type="button" :class="{selected:meetingPoint===place}" @click="meetingPoint = meetingPoint === place ? '' : place">{{ place }}</button>
            </div>
          </div>

          <template v-if="reserveGroups.length">
            <label class="task-field study-card">
              <span>NOTA PARA EL VENDEDOR <small>Opcional</small></span>
              <textarea v-model="note" rows="2" maxlength="500" placeholder="Ej. Paso por la biblioteca a las 3." :disabled="confirming"/>
            </label>

            <div class="cart-summary study-card">
              <dl>
                <div v-if="paypalGroups.length"><dt>Con PayPal (arriba)</dt><dd>${{ paypalTotal.toFixed(2) }}</dd></div>
                <div><dt>Apartados a crear</dt><dd>{{ reserveGroups.length }}</dd></div>
                <div class="cart-total"><dt>Pagás al recibir</dt><dd>${{ reserveTotal.toFixed(2) }}</dd></div>
              </dl>
            </div>
          </template>

          <p v-if="error" class="study-error" role="alert">{{ error }}</p>

          <template v-if="reserveGroups.length">
            <button class="study-button" :disabled="confirming || cart.busy.value" @click="confirm">
              <ion-icon v-if="!confirming" :icon="checkmarkCircleOutline"/>{{ confirming ? 'Apartando…' : paypalGroups.length ? 'Apartar el resto' : 'Apartar' }}
            </button>
            <p class="cart-legend"><ion-icon :icon="informationCircleOutline"/>Lo apartado no se cobra aquí: coordinás la entrega con cada vendedor por el chat de LaU.</p>
          </template>
          <p v-else class="cart-legend"><ion-icon :icon="lockClosedOutline"/>Pagás en PayPal. LaU valida precio y comercio antes de cobrar.</p>
        </template>
      </main>
    </ion-content>

    <ion-modal :is-open="!!payingGroup" :initial-breakpoint="1" :breakpoints="[0, 1]" @didDismiss="closePayment">
      <PayPalCheckoutSheet v-if="payingGroup" :items="payingLines"
        @close="closePayment" @paid="onPaid" @orders="goToOrders"/>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, IonModal, alertController, toastController } from '@ionic/vue'
import {
  arrowBackOutline, trashOutline, cartOutline, imageOutline, locationOutline, closeOutline,
  alertCircleOutline, personOutline, checkmarkCircleOutline, informationCircleOutline,
  storefrontOutline, logoPaypal, handLeftOutline, lockClosedOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import PayPalCheckoutSheet from '@/components/marketplace/PayPalCheckoutSheet.vue'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { useDarkMode } from '@/utils/useDarkMode'
import { cart, type CartGroup } from '@/utils/useCart'
import type { PayPalCapture } from '@/services/paypalCheckoutService'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const meetingPoint = ref('')
const note = ref('')
const confirming = ref(false)
const error = ref('')

const quickPlaces = ['Biblioteca Central', 'Cafetería', 'Entrada principal', 'Edificio de Ingeniería']

// Tiendas que cobran con PayPal: un pago por tienda. El resto se aparta (se paga al recibir).
const paypalGroups = computed(() => cart.bySeller.value.filter(group => group.accepts_paypal))
const reserveGroups = computed(() => cart.bySeller.value.filter(group => !group.accepts_paypal))
const paypalTotal = computed(() => paypalGroups.value.reduce((total, group) => total + group.subtotal, 0))
const reserveTotal = computed(() => reserveGroups.value.reduce((total, group) => total + group.subtotal, 0))

const payingGroup = ref<CartGroup | null>(null)
const payingLines = computed(() => payingGroup.value?.items.map(item => ({ product_id: item.product_id, quantity: item.quantity })) ?? [])
let paidGroup = false

async function payGroup(group: CartGroup) {
  error.value = ''
  const issues = await cart.revalidate()
  if (issues?.some(issue => group.items.some(item => item.product_id === issue.product_id))) {
    error.value = 'Revisá los avisos de arriba antes de pagar.'
    return
  }
  // Tras revalidar, el grupo se vuelve a leer por si cambió la tienda o el método de pago.
  const fresh = cart.bySeller.value.find(entry => entry.seller_id === group.seller_id)
  if (!fresh?.accepts_paypal) {
    error.value = 'Esta tienda ya no cobra con PayPal. Podés apartar sus productos.'
    return
  }
  paidGroup = false
  payingGroup.value = fresh
}

/** PayPal confirmó el pago: esos productos salen del carrito. */
async function onPaid(_capture: PayPalCapture) {
  paidGroup = true
  for (const item of payingGroup.value?.items ?? []) await cart.remove(item.product_id)
}

function closePayment() {
  payingGroup.value = null
  if (paidGroup && cart.isEmpty.value) router.replace('/marketplace/orders')
}

function goToOrders() {
  payingGroup.value = null
  router.replace('/marketplace/orders')
}

async function confirmClear() {
  const alert = await alertController.create({
    header: '¿Vaciar el carrito?',
    message: 'Se quitarán todos los artículos.',
    buttons: [{ text: 'Conservar', role: 'cancel' }, { text: 'Vaciar', role: 'destructive', handler: () => { void cart.clear() } }],
  })
  await alert.present()
}

async function confirm() {
  if (confirming.value) return
  confirming.value = true
  error.value = ''

  try {
    // Última revalidación antes de mandar: si algo cambió, se avisa y no se aparta.
    const issues = await cart.revalidate()
    if (issues?.length) {
      error.value = 'Revisá los avisos de arriba antes de apartar.'
      return
    }

    // Solo se apartan los productos de vendedores sin PayPal; los de PayPal se pagan arriba.
    const reserved = reserveGroups.value.flatMap(group => group.items)
    if (!reserved.length) return
    const orders = await marketplaceService.createOrders({
      uuid_cliente: crypto.randomUUID(),
      items: reserved.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
      meeting_point: meetingPoint.value.trim() || null,
      note: note.value.trim() || null,
    })

    for (const item of reserved) await cart.remove(item.product_id)
    await (await toastController.create({
      message: orders.length > 1 ? `Listo: ${orders.length} apartados creados.` : 'Listo. Coordiná la entrega con el vendedor.',
      duration: 2600, position: 'top',
    })).present()
    // Si quedan tiendas con PayPal por pagar, el estudiante se queda en el carrito.
    if (cart.isEmpty.value) router.replace('/marketplace/orders')
  } catch (e) {
    error.value = marketplaceError(e, 'No pudimos completar el apartado.')
    await cart.revalidate()
  } finally {
    confirming.value = false
  }
}

onMounted(async () => {
  await cart.initialize()
  await cart.revalidate()
})
</script>

<style scoped>
.cart-legend { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 11px; line-height: 16px; color: var(--study-muted); }
.cart-legend ion-icon { font-size: 16px; flex-shrink: 0; }
.cart-group-head { display: flex; align-items: center; gap: 8px; }
.group-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.group-logo { width: 22px; height: 22px; border-radius: 7px; overflow: hidden; flex-shrink: 0; background: var(--study-track); }
.group-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pay-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0; text-transform: none; white-space: nowrap; }
.pay-chip ion-icon { font-size: 13px; }
.chip-paypal { background: #ffc43922; color: #1b4b9b; }
.chip-person { background: var(--study-track); color: var(--study-muted); }
:global(.dark) .chip-paypal { background: #ffc4391f; color: #ffd36b; }
/* Botón de pago de la tienda: mismos colores que el botón dorado de PayPal. */
.paypal-group-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 48px; margin-top: 4px; border: 0; border-radius: 999px; background: #ffc439; color: #111; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer; transition: transform .15s ease, filter .15s ease; }
.paypal-group-btn ion-icon { font-size: 20px; color: #003087; }
.paypal-group-btn:active { transform: scale(.98); }
.paypal-group-btn:hover { filter: brightness(.97); }
.paypal-group-btn:disabled { opacity: .6; cursor: default; }
</style>

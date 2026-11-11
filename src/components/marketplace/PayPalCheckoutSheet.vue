<template>
  <div class="study-ui market-ui checkout-sheet">
    <header class="sheet-head">
      <h2>{{ phase === 'completed' ? 'Pago completado' : 'Confirmar compra' }}</h2>
      <button class="study-icon-button" aria-label="Cerrar" :disabled="phase === 'processing'" @click="$emit('close')"><ion-icon :icon="closeOutline"/></button>
    </header>

    <div class="sheet-body">
      <p v-if="quoteError" class="study-error" role="alert">{{ quoteError }} <button class="study-link" @click="loadQuote">Reintentar</button></p>
      <div v-if="!quote && !quoteError" class="sheet-skeleton" aria-hidden="true"><i/><i/></div>
      <p v-if="!quote && !quoteError" class="sr-only" role="status">Preparando el resumen…</p>

      <template v-if="quote">
        <!-- Resumen calculado por el backend: comercio, producto, precio, moneda y total -->
        <section class="summary study-card" aria-label="Resumen de la compra">
          <div class="summary-store">
            <span class="store-logo"><img v-if="quote.store.logo_url" :src="quote.store.logo_url" alt=""/><ion-icon v-else :icon="storefrontOutline"/></span>
            <div>
              <b>{{ quote.store.name }}</b>
              <VerifiedBadge paypal/>
            </div>
          </div>
          <template v-if="isCart">
            <div v-for="item in quote.items" :key="item.product_id" class="summary-product">
              <span class="thumb"><img v-if="item.image_url" :src="item.image_url" alt=""/><ion-icon v-else :icon="cubeOutline"/></span>
              <span class="line-name">{{ item.name }}<small>{{ item.quantity }} × ${{ item.unit_price }}</small></span>
              <b>${{ item.subtotal }}</b>
            </div>
          </template>
          <div v-else class="summary-product">
            <span class="thumb"><img v-if="quote.product.image_url" :src="quote.product.image_url" alt=""/><ion-icon v-else :icon="cubeOutline"/></span>
            <span>{{ quote.product.name }}</span>
          </div>
          <dl class="summary-lines">
            <template v-if="!isCart">
              <div><dt>Precio unitario</dt><dd>${{ quote.unit_price }}</dd></div>
              <div><dt>Cantidad</dt><dd>{{ quote.quantity }}</dd></div>
            </template>
            <div class="total"><dt>Total</dt><dd>${{ quote.total }} <small>{{ quote.currency }}</small></dd></div>
          </dl>
        </section>

        <template v-if="phase !== 'completed'">
          <label class="confirm-row" :class="{ checked: confirmed }">
            <input v-model="confirmed" type="checkbox" :disabled="phase === 'processing'"/>
            <span>Confirmo que quiero comprar <b>{{ isCart ? `${quote.items?.length} productos` : quote.product.name }}</b> a <b>{{ quote.store.name }}</b> por <b>${{ quote.total }} {{ quote.currency }}</b>.</span>
          </label>

          <div v-if="phase !== 'idle' || buttonsReady" class="checkout-status" :class="`is-${phase}`" role="status" aria-live="polite">
            <span class="study-symbol" :class="statusView.tone">
              <ion-spinner v-if="statusView.busy" name="crescent"/>
              <ion-icon v-else :icon="statusView.icon"/>
            </span>
            <div><b>{{ statusView.title }}</b><span class="study-muted">{{ statusView.text }}</span></div>
          </div>

          <p v-if="!confirmed" class="study-muted hint">Marcá la confirmación para habilitar el pago con PayPal.</p>
          <div v-show="confirmed && phase !== 'processing'" ref="buttonsEl" class="paypal-buttons"/>
          <p v-if="sdkLoading && confirmed" class="study-muted" role="status">Cargando PayPal…</p>
          <button v-if="phase === 'error' && !buttonsReady && confirmed" class="study-link" @click="setupButtons">Reintentar</button>
        </template>

        <template v-else-if="capture">
          <div class="checkout-status is-completed" role="status">
            <span class="study-symbol tone-green"><ion-icon :icon="checkmarkCircleOutline"/></span>
            <div><b>¡Listo! PayPal confirmó tu pago.</b><span class="study-muted">{{ capture.store }} ya tiene tu pedido. Coordiná la entrega desde Mis compras.</span></div>
          </div>
          <dl class="receipt">
            <div><dt>Pedido LaU</dt><dd><code>{{ capture.order_code }}</code></dd></div>
            <div><dt>Monto</dt><dd>${{ capture.amount }} {{ capture.currency }}</dd></div>
            <div><dt>Comercio</dt><dd>{{ capture.store }}</dd></div>
            <div><dt>PayPal Order ID</dt><dd><code>{{ maskId(capture.order_id) }}</code></dd></div>
            <div><dt>Capture ID</dt><dd><code>{{ maskId(capture.capture_id) }}</code></dd></div>
          </dl>
          <button class="study-button" @click="$emit('orders')"><ion-icon :icon="receiptOutline"/>Ver mis compras</button>
        </template>

        <p class="study-muted footnote"><ion-icon :icon="lockClosedOutline"/>Pagás en PayPal: LaU no ve ni guarda los datos de tu cuenta o tarjeta. El precio y el comercio los valida LaU antes de cobrar.</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  closeOutline, storefrontOutline, cubeOutline, lockClosedOutline, logoPaypal, checkmarkCircleOutline,
  closeCircleOutline, alertCircleOutline, timeOutline, receiptOutline,
} from 'ionicons/icons'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import { loadPayPalSdk, paypalClientId, type PayPalButtons, type PayPalButtonsActions } from '@/utils/paypalSdk'
import paypalCheckoutService, {
  CheckoutError, maskId, newAttemptId, type CheckoutLine, type CheckoutQuote, type PayPalCapture,
} from '@/services/paypalCheckoutService'

type Phase = 'idle' | 'preparing' | 'awaiting' | 'processing' | 'completed' | 'cancelled' | 'error'

// Un producto (productId + quantity) o el carrito de un comercio (items): siempre un solo pago.
const props = defineProps<{ productId?: number; quantity?: number; decisionId?: number | null; items?: CheckoutLine[] }>()
const isCart = computed(() => (props.items?.length ?? 0) > 1)
const emit = defineEmits<{ close: []; orders: []; paid: [capture: PayPalCapture] }>()

const quote = ref<CheckoutQuote | null>(null)
const quoteError = ref('')
const confirmed = ref(false)
const phase = ref<Phase>('idle')
const errorMessage = ref('')
const capture = ref<PayPalCapture | null>(null)
const sdkLoading = ref(false)
const buttonsReady = ref(false)
const buttonsEl = ref<HTMLElement | null>(null)
let buttons: PayPalButtons | null = null

const STATUS: Record<Phase, { title: string; text: string; icon: string; tone: string; busy?: boolean }> = {
  idle: { title: 'Listo para pagar', text: 'Pagá con tu cuenta de PayPal.', icon: logoPaypal, tone: 'tone-blue' },
  preparing: { title: 'Preparando pago…', text: 'Creando tu orden en PayPal.', icon: logoPaypal, tone: 'tone-blue', busy: true },
  awaiting: { title: 'Esperando aprobación', text: 'Aprobá el pago en la ventana de PayPal.', icon: timeOutline, tone: 'tone-orange', busy: true },
  processing: { title: 'Procesando…', text: 'LaU está verificando y confirmando el pago con PayPal.', icon: logoPaypal, tone: 'tone-purple', busy: true },
  completed: { title: 'Pago completado', text: 'PayPal confirmó tu pago.', icon: checkmarkCircleOutline, tone: 'tone-green' },
  cancelled: { title: 'Pago cancelado', text: 'Cerraste PayPal sin pagar. No se cobró nada; podés intentarlo de nuevo.', icon: closeCircleOutline, tone: 'tone-orange' },
  error: { title: 'No se pudo completar', text: '', icon: alertCircleOutline, tone: 'tone-orange' },
}

const statusView = computed(() => phase.value === 'error'
  ? { ...STATUS.error, text: errorMessage.value || 'Algo salió mal. Intentá de nuevo.' }
  : STATUS[phase.value])

function fail(error: unknown) {
  errorMessage.value = error instanceof CheckoutError ? error.message : 'Algo salió mal con el pago. Intentá de nuevo.'
  phase.value = 'error'
}

async function loadQuote() {
  quoteError.value = ''
  quote.value = null
  try {
    quote.value = props.items?.length
      ? await paypalCheckoutService.quoteItems(props.items)
      : await paypalCheckoutService.quote(props.productId!, props.quantity ?? 1)
  } catch (error) {
    quoteError.value = error instanceof CheckoutError ? error.message : 'No pudimos preparar el pago.'
  }
}

async function setupButtons() {
  const clientId = paypalClientId()
  if (!quote.value || buttonsReady.value) return
  if (!clientId) {
    fail(new CheckoutError('not_configured', 'El pago con PayPal no está disponible en este momento.'))
    return
  }

  sdkLoading.value = true
  try {
    const paypal = await loadPayPalSdk({ clientId, merchantId: quote.value.merchant_id, currency: quote.value.currency })
    await nextTick()
    if (!buttonsEl.value) throw new Error('sin contenedor')
    buttons = paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal', height: 48 },
      createOrder,
      onApprove,
      onCancel: () => { phase.value = 'cancelled' },
      onError: () => {
        // createOrder/onApprove ya dejaron un mensaje propio; esto cubre errores internos del SDK.
        if (phase.value !== 'error') fail(new CheckoutError('paypal_sdk', 'PayPal no pudo continuar. Intentá de nuevo.'))
      },
    })
    if (!buttons.isEligible()) throw new Error('not eligible')
    await buttons.render(buttonsEl.value)
    buttonsReady.value = true
    if (phase.value === 'error') phase.value = 'idle'
  } catch {
    buttons = null
    fail(new CheckoutError('sdk', 'No pudimos cargar el botón de PayPal. Revisá tu conexión e intentá de nuevo.'))
  } finally {
    sdkLoading.value = false
  }
}

async function createOrder(): Promise<string> {
  phase.value = 'preparing'
  try {
    const order = props.items?.length
      ? await paypalCheckoutService.createOrderItems(props.items, newAttemptId())
      : await paypalCheckoutService.createOrder(props.productId!, props.quantity ?? 1, newAttemptId(), props.decisionId)
    // El total que cobra PayPal debe ser exactamente el que el estudiante confirmó.
    if (order.total !== quote.value?.total || order.currency !== quote.value?.currency) {
      throw new CheckoutError('amount_changed', 'El precio cambió desde que lo confirmaste. Revisá el resumen e intentá de nuevo.')
    }
    phase.value = 'awaiting'
    return order.order_id
  } catch (error) {
    fail(error)
    if (error instanceof CheckoutError && error.code === 'amount_changed') void loadQuote()
    throw error
  }
}

async function onApprove(data: { orderID: string }, actions: PayPalButtonsActions) {
  phase.value = 'processing'
  try {
    // Solo se muestra como completado lo que el backend confirmó con PayPal.
    capture.value = await paypalCheckoutService.capture(data.orderID)
    phase.value = 'completed'
    emit('paid', capture.value)
  } catch (error) {
    if (error instanceof CheckoutError && error.code === 'instrument_declined') {
      phase.value = 'awaiting'
      return actions.restart()
    }
    fail(error)
  }
}

// El botón de PayPal aparece solo después de la confirmación explícita.
watch(confirmed, (value) => { if (value) void setupButtons() })

onMounted(loadQuote)
onBeforeUnmount(() => { buttons?.close().catch(() => undefined) })
</script>

<style scoped>
.checkout-sheet { display: flex; flex-direction: column; height: 100%; background: var(--study-bg); color: var(--study-text); }
.sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px 8px; }
.sheet-head h2 { font-size: 20px; font-weight: 800; letter-spacing: -.02em; }
.sheet-body { flex: 1; overflow-y: auto; display: grid; align-content: start; gap: 14px; padding: 8px 20px calc(24px + env(safe-area-inset-bottom)); }
.summary { display: grid; gap: 14px; padding: 18px; border-radius: 22px; }
.summary-store { display: flex; align-items: center; gap: 12px; }
.summary-store > div { display: grid; gap: 4px; min-width: 0; }
.summary-store b { font-size: 15px; }
.summary-store .store-logo { width: 46px; height: 46px; border-radius: 14px; color: var(--study-purple); background: var(--study-purple-soft); font-size: 20px; }
.summary-product { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: var(--study-bg); font-weight: 600; font-size: 14px; }
.summary-product .thumb { width: 44px; height: 44px; border-radius: 12px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: var(--study-track); color: var(--study-faint); }
.summary-product img { width: 100%; height: 100%; object-fit: cover; }
.summary-product .line-name { flex: 1; min-width: 0; display: grid; gap: 2px; }
.summary-product .line-name small { color: var(--study-muted); font-weight: 500; font-size: 12px; }
.summary-product > b { font-size: 14px; }
.summary-lines { display: grid; gap: 8px; margin: 0; font-size: 14px; }
.summary-lines div { display: flex; justify-content: space-between; gap: 12px; }
.summary-lines dt { color: var(--study-muted); }
.summary-lines dd { margin: 0; font-weight: 600; }
.summary-lines .total { padding-top: 10px; border-top: 1px dashed var(--study-border); font-size: 16px; }
.summary-lines .total dd { font-size: 22px; font-weight: 800; letter-spacing: -.02em; }
.summary-lines .total small { font-size: 12px; color: var(--study-muted); font-weight: 600; }
.confirm-row { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 18px; border: 1.5px solid var(--study-border); background: var(--study-surface); font-size: 14px; line-height: 20px; cursor: pointer; transition: border-color .2s ease; }
.confirm-row.checked { border-color: var(--study-green); }
.confirm-row input { width: 20px; height: 20px; margin-top: 1px; accent-color: var(--study-green-ink); flex-shrink: 0; }
.hint { text-align: center; }
.checkout-status { display: flex; align-items: center; gap: 12px; }
.checkout-status > div { display: grid; gap: 2px; min-width: 0; }
.checkout-status b { font-size: 15px; line-height: 20px; }
.checkout-status ion-spinner { width: 20px; height: 20px; color: currentColor; }
/* El iframe de PayPal es "light": así no aparece con fondo blanco en modo oscuro. */
.paypal-buttons { min-height: 48px; width: 100%; color-scheme: light; }
.receipt { display: grid; gap: 10px; margin: 0; padding: 16px; border-radius: 16px; background: var(--study-green-soft); }
.receipt div { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
.receipt dt { color: var(--study-muted); }
.receipt dd { margin: 0; font-weight: 700; text-align: right; overflow-wrap: anywhere; }
.receipt code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .04em; }
.footnote { display: flex; gap: 6px; align-items: flex-start; }
.footnote ion-icon { flex-shrink: 0; margin-top: 3px; }
.sheet-skeleton { display: grid; gap: 12px; }
.sheet-skeleton i { display: block; height: 120px; border-radius: 22px; background: var(--study-track); animation: sheet-pulse 1.2s ease-in-out infinite alternate; }
.sheet-skeleton i + i { height: 56px; }
@keyframes sheet-pulse { to { opacity: .55; } }
@media (prefers-reduced-motion: reduce) { .sheet-skeleton i { animation: none; } }
</style>

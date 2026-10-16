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
          <span class="eyebrow"><i/>TU CARRITO</span>
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

          <!-- Agrupado por vendedor: se ve de antemano que saldrán N apartados. -->
          <section v-for="group in cart.bySeller.value" :key="group.seller_id" class="cart-group">
            <div class="cart-group-head"><ion-icon :icon="personOutline"/>{{ group.seller_name }}</div>
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
          </section>

          <div class="task-field study-card">
            <span>PUNTO DE ENCUENTRO</span>
            <input v-model="meetingPoint" maxlength="160" placeholder="¿Dónde se ven?" :disabled="confirming"/>
            <div class="quick-chips">
              <button v-for="place in quickPlaces" :key="place" type="button" :class="{selected:meetingPoint===place}" @click="meetingPoint = meetingPoint === place ? '' : place">{{ place }}</button>
            </div>
          </div>

          <label class="task-field study-card">
            <span>NOTA PARA EL VENDEDOR <small>Opcional</small></span>
            <textarea v-model="note" rows="2" maxlength="500" placeholder="Ej. Paso por la biblioteca a las 3." :disabled="confirming"/>
          </label>

          <div class="cart-summary study-card">
            <dl>
              <div><dt>Subtotal</dt><dd>${{ cart.subtotal.value.toFixed(2) }}</dd></div>
              <div><dt>Apartados a crear</dt><dd>{{ cart.bySeller.value.length }}</dd></div>
              <div class="cart-total"><dt>Total</dt><dd>${{ cart.subtotal.value.toFixed(2) }}</dd></div>
            </dl>
          </div>

          <p v-if="error" class="study-error" role="alert">{{ error }}</p>

          <button class="study-button" :disabled="confirming || cart.busy.value" @click="confirm">
            <ion-icon v-if="!confirming" :icon="checkmarkCircleOutline"/>{{ confirming ? 'Apartando…' : 'Apartar' }}
          </button>
          <p class="cart-legend"><ion-icon :icon="informationCircleOutline"/>No se cobra nada aquí: coordinás la entrega con cada vendedor por el chat de LaU.</p>
        </template>
      </main>
    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, alertController, toastController } from '@ionic/vue'
import {
  arrowBackOutline, trashOutline, cartOutline, imageOutline, locationOutline, closeOutline,
  alertCircleOutline, personOutline, checkmarkCircleOutline, informationCircleOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import MarketplaceBottomNav from '@/components/marketplace/MarketplaceBottomNav.vue'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { useDarkMode } from '@/utils/useDarkMode'
import { cart } from '@/utils/useCart'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const meetingPoint = ref('')
const note = ref('')
const confirming = ref(false)
const error = ref('')

const quickPlaces = ['Biblioteca Central', 'Cafetería', 'Entrada principal', 'Edificio de Ingeniería']

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

    const orders = await marketplaceService.createOrders({
      uuid_cliente: crypto.randomUUID(),
      items: cart.items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
      meeting_point: meetingPoint.value.trim() || null,
      note: note.value.trim() || null,
    })

    await cart.clear()
    await (await toastController.create({
      message: orders.length > 1 ? `Listo: ${orders.length} apartados creados.` : 'Listo. Coordiná la entrega con el vendedor.',
      duration: 2600, position: 'top',
    })).present()
    router.replace('/marketplace/orders')
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
</style>

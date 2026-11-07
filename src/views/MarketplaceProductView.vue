<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <main class="study-shell study-body">
        <div class="detail-toolbar">
          <button class="study-icon-button" aria-label="Volver" @click="router.back()"><ion-icon :icon="arrowBackOutline"/></button>
          <div>
            <button v-if="mine" class="study-icon-button" aria-label="Editar producto" @click="edit"><ion-icon :icon="createOutline"/></button>
            <button class="study-icon-button" aria-label="Compartir" @click="share"><ion-icon :icon="shareOutline"/></button>
          </div>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load">Reintentar</button></p>
        <p v-if="loading" class="study-empty" role="status">Cargando producto…</p>

        <template v-if="product">
          <div class="product-gallery">
            <img v-if="current && !broken" :src="current.url" :alt="product.name" @error="broken = true"/>
            <span v-else class="gallery-empty"><ion-icon :icon="imageOutline"/></span>
            <template v-if="product.images.length > 1">
              <button class="gallery-nav prev" aria-label="Foto anterior" @click="step(-1)"><ion-icon :icon="chevronBackOutline"/></button>
              <button class="gallery-nav next" aria-label="Foto siguiente" @click="step(1)"><ion-icon :icon="chevronForwardOutline"/></button>
              <span class="gallery-count">{{ index + 1 }} / {{ product.images.length }}</span>
            </template>
          </div>

          <div class="product-headline">
            <h1>{{ product.name }}</h1>
            <span class="neutral-chip"><ion-icon :icon="cubeOutline"/>{{ product.stock }}</span>
          </div>
          <div class="product-detail-price">${{ price }}</div>

          <div class="product-chips">
            <span v-if="product.category" class="status-chip"><i/>{{ product.category.name }}</span>
            <span v-if="conditionLabel" class="status-chip"><i class="dot-green"/>{{ conditionLabel }}</span>
            <span v-if="product.delivery_point" class="status-chip"><i class="dot-orange"/>{{ product.delivery_point }}</span>
          </div>

          <button v-if="product.store" class="seller-card study-card" @click="router.push(`/tabs/marketplace/store/${product.store.slug}`)">
            <span class="store-logo"><img v-if="product.store.logo_url" :src="product.store.logo_url" :alt="product.store.name"/><ion-icon v-else :icon="storefrontOutline"/></span>
            <div><b>{{ product.store.name }}</b><span class="study-muted">Ver la tienda</span></div>
            <span class="round-arrow"><ion-icon :icon="arrowForwardOutline"/></span>
          </button>
          <div v-else-if="product.user" class="seller-card study-card">
            <StudyAvatar :src="product.user.imagen_url" :name="product.user.name"/>
            <div><b>{{ product.user.name }}</b><span class="study-muted">@{{ product.user.username }}</span></div>
          </div>

          <section v-if="product.description" class="product-section">
            <h2>Descripción</h2>
            <p>{{ product.description }}</p>
          </section>

          <div class="product-cta-bar">
            <button v-if="!mine" class="study-button" :disabled="!product.is_available || busy" @click="add">
              <ion-icon :icon="inCart ? checkmarkOutline : cartOutline"/>
              {{ !product.is_available ? 'Agotado' : inCart ? 'En tu carrito' : 'Agregar al carrito' }}
            </button>
            <p v-else class="study-muted mine-note">Este producto es tuyo.</p>
            <button v-if="!mine && product.user" class="order-icon-btn" aria-label="Escribir al vendedor" @click="chat">
              <ion-icon :icon="chatbubbleEllipsesOutline"/>
            </button>
          </div>
        </template>
      </main>
    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, toastController } from '@ionic/vue'
import { Share } from '@capacitor/share'
import {
  arrowBackOutline, arrowForwardOutline, createOutline, shareOutline, imageOutline, cubeOutline,
  chevronBackOutline, chevronForwardOutline, cartOutline, checkmarkOutline, storefrontOutline, chatbubbleEllipsesOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import StudyAvatar from '@/components/study/StudyAvatar.vue'
import MarketplaceBottomNav from '@/components/marketplace/MarketplaceBottomNav.vue'
import { openProductForm } from '@/utils/productForm'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { useDarkMode } from '@/utils/useDarkMode'
import { cart } from '@/utils/useCart'
import { AuthService } from '@/services/auth'
import type { Product } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const route = useRoute()
const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const product = ref<Product | null>(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const index = ref(0)
const broken = ref(false)

const CONDITIONS: Record<string, string> = {
  nuevo: 'Nuevo', como_nuevo: 'Como nuevo', buen_estado: 'Buen estado', aceptable: 'Aceptable',
}

const current = computed(() => product.value?.images?.[index.value] ?? null)
const price = computed(() => Number(product.value?.price ?? 0).toFixed(2))
const conditionLabel = computed(() => product.value?.condition ? CONDITIONS[product.value.condition] : null)
const mine = computed(() => product.value?.user_id === AuthService.getUser()?.id)
const inCart = computed(() => !!product.value && cart.has(product.value.id))

function step(direction: number) {
  const total = product.value?.images.length ?? 0
  if (!total) return
  index.value = (index.value + direction + total) % total
  broken.value = false
}

async function load() {
  loading.value = true
  error.value = ''
  index.value = 0
  broken.value = false
  try {
    product.value = await marketplaceService.product(Number(route.params.id))
  } catch (e) {
    error.value = marketplaceError(e, 'No pudimos abrir este producto.')
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!product.value) return
  busy.value = true
  const added = await cart.add(product.value)
  busy.value = false
  await (await toastController.create({
    message: added ? 'Agregado a tu carrito.' : 'Ya tenés todo el stock disponible en el carrito.',
    duration: 1800, position: 'top', color: added ? undefined : 'warning',
  })).present()
}

/** El chat real de LaU sustituye al chat simulado del prototipo. */
const chat = () => router.push(`/chat/${product.value?.user_id}`)

async function share() {
  try {
    await Share.share({ title: product.value?.name, text: `Mirá esto en Marketplace LaU: ${product.value?.name}`, url: window.location.href })
  } catch { /* el usuario canceló */ }
}

async function edit() {
  const { data } = await openProductForm(product.value)
  if (data?.updated) await load()
}

watch(() => route.params.id, load, { immediate: true })
</script>

<style scoped>
.mine-note { flex: 1; text-align: center; }
</style>

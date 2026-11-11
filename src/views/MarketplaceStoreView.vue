<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <main class="study-shell study-body">
        <div class="detail-toolbar">
          <button class="study-icon-button" aria-label="Volver" @click="router.back()"><ion-icon :icon="arrowBackOutline"/></button>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load">Reintentar</button></p>
        <p v-if="loading" class="study-empty" role="status">Cargando tienda…</p>

        <template v-if="store">
          <header class="store-hero study-card">
            <span class="store-logo">
              <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name"/>
              <ion-icon v-else :icon="storefrontOutline"/>
            </span>
            <div>
              <span class="eyebrow">{{ store.is_verified ? 'NEGOCIO VERIFICADO' : 'EMPRENDIMIENTO LaU' }}</span>
              <h1>{{ store.name }}</h1>
              <VerifiedBadge v-if="store.is_verified" :paypal="store.accepts_paypal"/>
              <p v-if="store.description">{{ store.description }}</p>
            </div>
          </header>

          <div class="store-links">
            <span v-if="store.category" class="status-chip"><i/>{{ store.category.name }}</span>
            <a v-if="store.instagram" class="status-chip" :href="instagramUrl" target="_blank" rel="noopener"><ion-icon :icon="logoInstagram"/>{{ store.instagram }}</a>
            <a v-if="store.whatsapp" class="status-chip" :href="whatsappUrl" target="_blank" rel="noopener"><ion-icon :icon="logoWhatsapp"/>WhatsApp</a>
          </div>

          <button v-if="store.user" class="seller-card study-card" @click="router.push(`/chat/${store.user.id}`)">
            <StudyAvatar :src="store.user.imagen_url" :name="store.user.name"/>
            <div><b>{{ store.user.name }}</b><span class="study-muted">Escribile por el chat de LaU</span></div>
            <span class="round-arrow"><ion-icon :icon="chatbubbleEllipsesOutline"/></span>
          </button>

          <div class="section-title"><h2>En venta</h2><span v-if="total" class="total-chip">{{ total }}</span></div>

          <div v-if="!products.length" class="study-empty">
            <span class="study-symbol tone-blue"><ion-icon :icon="cubeOutline"/></span>
            <h2>Todavía no hay productos</h2>
            <p>Esta tienda aún no tiene nada publicado.</p>
          </div>

          <div v-else class="product-grid">
            <ProductCard v-for="product in products" :key="product.id" :product="product" @open="open" @add="add"/>
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
import {
  arrowBackOutline, storefrontOutline, logoInstagram, logoWhatsapp,
  chatbubbleEllipsesOutline, cubeOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import StudyAvatar from '@/components/study/StudyAvatar.vue'
import ProductCard from '@/components/marketplace/ProductCard.vue'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import MarketplaceBottomNav from '@/components/marketplace/MarketplaceBottomNav.vue'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { useDarkMode } from '@/utils/useDarkMode'
import { cart } from '@/utils/useCart'
import type { Product, Store } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const route = useRoute()
const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const store = ref<Store | null>(null)
const products = ref<Product[]>([])
const total = ref(0)
const loading = ref(true)
const error = ref('')

const instagramUrl = computed(() => {
  const handle = (store.value?.instagram ?? '').replace('@', '').trim()
  return handle.startsWith('http') ? handle : `https://instagram.com/${handle}`
})
const whatsappUrl = computed(() => `https://wa.me/${(store.value?.whatsapp ?? '').replace(/[^0-9]/g, '')}`)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await marketplaceService.store(String(route.params.slug))
    store.value = result.store
    products.value = result.products.data
    total.value = result.products.total
  } catch (e) {
    error.value = marketplaceError(e, 'No pudimos abrir esta tienda.')
  } finally {
    loading.value = false
  }
}

const open = (product: Product) => router.push(`/tabs/marketplace/product/${product.id}`)

async function add(product: Product) {
  const added = await cart.add(product)
  await (await toastController.create({
    message: added ? `"${product.name}" va en tu carrito.` : 'Ya tenés todo el stock disponible en el carrito.',
    duration: 1800, position: 'top', color: added ? undefined : 'warning',
  })).present()
}

watch(() => route.params.slug, load, { immediate: true })
</script>

<style scoped>
.store-links { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.store-links a { text-decoration: none; }
.store-links ion-icon { font-size: 14px; }
</style>

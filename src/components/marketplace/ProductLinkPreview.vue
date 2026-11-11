<template>
  <div class="product-preview" :class="[variant, { loading: !product && !failed }]">
    <button type="button" class="preview-main" :disabled="!product" @click="product && $emit('open', product.id)">
      <span class="preview-thumb">
        <img v-if="cover" :src="cover" :alt="product?.name" loading="lazy"/>
        <ion-icon v-else :icon="failed ? alertCircleOutline : pricetagOutline"/>
      </span>
      <span class="preview-info">
        <template v-if="product">
          <b>{{ product.name }}</b>
          <span class="preview-meta">
            <strong>${{ Number(product.price).toFixed(2) }}</strong>
            <span v-if="product.store">· {{ product.store.name }}</span>
            <VerifiedBadge v-if="product.store?.is_verified" compact :paypal="product.store.accepts_paypal"/>
          </span>
        </template>
        <template v-else-if="failed"><b>Producto no disponible</b><span class="preview-meta">Puede que lo hayan quitado del Marketplace.</span></template>
        <template v-else><i class="skeleton wide"/><i class="skeleton"/></template>
      </span>
    </button>
    <button v-if="removable" type="button" class="preview-remove" aria-label="Quitar producto del mensaje" @click="$emit('remove')">
      <ion-icon :icon="closeOutline"/>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { alertCircleOutline, closeOutline, pricetagOutline } from 'ionicons/icons'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import marketplaceService from '@/services/marketplaceService'
import type { Product } from '@/types/marketplace'

const props = withDefaults(defineProps<{ productId: number; variant?: 'composer' | 'bubble'; removable?: boolean }>(), {
  variant: 'bubble',
  removable: false,
})
defineEmits<{ open: [id: number]; remove: [] }>()

// Una sola petición por producto aunque aparezca en varios mensajes.
const cache = (globalThis as any).__lauProductPreviewCache ??= new Map<number, Promise<Product | null>>()

const product = ref<Product | null>(null)
const failed = ref(false)
const cover = computed(() => product.value?.images?.[0]?.url ?? null)

watch(() => props.productId, async (id) => {
  product.value = null
  failed.value = false
  if (!cache.has(id)) cache.set(id, marketplaceService.product(id).catch(() => null))
  const result = await cache.get(id)
  if (id !== props.productId) return
  product.value = result
  failed.value = !result
}, { immediate: true })
</script>

<style scoped>
.product-preview { display: flex; align-items: stretch; gap: 6px; border-radius: 16px; overflow: hidden; }
.preview-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 8px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.preview-main:disabled { cursor: default; }
.preview-thumb { width: 48px; height: 48px; border-radius: 12px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: rgba(127, 127, 127, .18); font-size: 20px; opacity: .9; }
.preview-thumb img { width: 100%; height: 100%; object-fit: cover; }
.preview-info { flex: 1; min-width: 0; display: grid; gap: 3px; }
.preview-info b { font-size: 13px; line-height: 17px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.preview-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 12px; opacity: .8; }
.preview-meta strong { font-weight: 800; opacity: 1; }
.preview-remove { width: 36px; border: 0; background: transparent; color: inherit; display: grid; place-items: center; font-size: 18px; cursor: pointer; opacity: .7; }
.skeleton { display: block; height: 10px; width: 50%; border-radius: 6px; background: rgba(127, 127, 127, .25); animation: preview-pulse 1s ease-in-out infinite alternate; }
.skeleton.wide { width: 85%; }
@keyframes preview-pulse { to { opacity: .45; } }

/* Encima del campo de escritura: tarjeta con borde de acento */
.composer { margin: 0 0 8px; background: var(--ion-card-background, rgba(255, 255, 255, .9)); border: 1px solid rgba(123, 50, 217, .35); border-left: 4px solid #7b32d9; color: var(--ion-text-color, #1f2937); animation: preview-in .3s cubic-bezier(.2, .8, .2, 1) both; }
/* Dentro de la burbuja del mensaje: se adapta al color de la burbuja */
.bubble { margin-bottom: 6px; background: rgba(127, 127, 127, .14); }
@keyframes preview-in { from { opacity: 0; transform: translateY(8px); } }
@media (prefers-reduced-motion: reduce) { .composer, .skeleton { animation: none; } }
</style>

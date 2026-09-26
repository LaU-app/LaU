<template>
  <article class="product-card study-card" :class="{'is-out':!product.is_available}" @click="$emit('open',product)">
    <div class="product-thumb">
      <!-- Si el archivo ya no está en disco, se cae al placeholder en vez de
           dejar que el navegador pinte el alt y desmaquete la tarjeta. -->
      <img v-if="cover && !broken" :src="cover" :alt="product.name" loading="lazy" @error="broken = true"/>
      <span v-else class="product-thumb-empty"><ion-icon :icon="imageOutline"/></span>
      <span v-if="!product.is_available" class="product-flag">Agotado</span>
      <span v-else-if="isNew" class="product-flag">Nuevo</span>
    </div>
    <div class="product-body">
      <h3>{{ product.name }}</h3>
      <span v-if="product.delivery_point" class="product-meta"><ion-icon :icon="locationOutline"/>{{ product.delivery_point }}</span>
      <span v-else-if="product.category" class="product-meta"><ion-icon :icon="pricetagOutline"/>{{ product.category.name }}</span>
      <div class="product-foot">
        <b class="product-price">${{ price }}</b>
        <button class="product-add" :disabled="!product.is_available || inCart" :aria-label="inCart ? 'Ya está en tu carrito' : 'Agregar ' + product.name + ' al carrito'" @click.stop="$emit('add',product)">
          <ion-icon :icon="inCart ? checkmarkOutline : addOutline"/>
        </button>
      </div>
    </div>
  </article>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { addOutline, checkmarkOutline, imageOutline, locationOutline, pricetagOutline } from 'ionicons/icons'
import { cart } from '@/utils/useCart'
import type { Product } from '@/types/marketplace'
const props=defineProps<{product:Product}>()
defineEmits(['open','add'])
const cover=computed(()=>props.product.images?.[0]?.url ?? null)
const broken=ref(false)
watch(cover,()=>{broken.value=false})
const price=computed(()=>Number(props.product.price).toFixed(2))
const inCart=computed(()=>cart.has(props.product.id))
// "Nuevo" = publicado en las últimas 24 h. Dato real, no un adorno.
const isNew=computed(()=>Date.now()-new Date(props.product.created_at).getTime()<86400000)
</script>

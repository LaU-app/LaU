<template>
  <div v-if="loading" class="category-skeleton" aria-hidden="true"><i v-for="n in 4" :key="n"/></div>
  <div v-else-if="categories.length" class="category-scroller" role="group" aria-label="Categorías">
    <!-- El prototipo no tenía "Todas": había que volver a tocar la activa para limpiar el filtro. -->
    <button :class="{selected:!selected}" :aria-pressed="!selected" @click="select(null)">
      <ion-icon :icon="appsOutline"/>Todas
    </button>
    <button v-for="category in categories" :key="category.id" :class="{selected:selected===category.slug}" :aria-pressed="selected===category.slug" @click="select(category.slug)">
      <ion-icon :icon="categoryIcon(category.icon)"/>{{ category.name }}
    </button>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { appsOutline } from 'ionicons/icons'
import { categoryIcon } from '@/utils/categoryIcon'
import marketplaceService from '@/services/marketplaceService'
import type { ProductCategory } from '@/types/marketplace'

const props = defineProps<{ selected: string | null }>()
const emit = defineEmits<{ (event: 'update:selected', slug: string | null): void }>()

const categories = ref<ProductCategory[]>([])
const loading = ref(true)

const select = (slug: string | null) => emit('update:selected', props.selected === slug ? null : slug)

onMounted(async () => {
  try { categories.value = await marketplaceService.categories() }
  catch { /* Sin categorías el catálogo sigue siendo usable. */ }
  finally { loading.value = false }
})
</script>

<template>
  <!-- Acceso directo al asistente (enlaces y notificaciones). El acceso habitual es desde la búsqueda del Marketplace. -->
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <div class="agent-page">
      <ShoppingAgent page :initial-query="initialQuery"/>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonPage } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import ShoppingAgent from '@/components/marketplace/ShoppingAgent.vue'
import { useDarkMode } from '@/utils/useDarkMode'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const route = useRoute()
const { isDarkMode, toggleDarkMode } = useDarkMode()
const initialQuery = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
</script>

<style scoped>
.agent-page { flex: 1; min-height: 0; display: flex; flex-direction: column; max-width: 720px; width: 100%; margin: 0 auto; }
</style>

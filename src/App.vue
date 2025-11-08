<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useDarkMode } from '@/utils/useDarkMode';

// Inicializar modo oscuro globalmente
const { initDarkMode } = useDarkMode();

onMounted(() => {
  initDarkMode();
});
</script>

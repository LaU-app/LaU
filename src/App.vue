<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useDarkMode } from '@/utils/useDarkMode';
import { useSyncQueue } from '@/utils/useSyncQueue';
import { AuthService } from '@/services/auth';

// Inicializar modo oscuro globalmente
const { initDarkMode } = useDarkMode();

// Inicializar sincronización automática
const { startAutoSync } = useSyncQueue();

onMounted(() => {
  initDarkMode();

  // Solo iniciar sincronización si el usuario está autenticado
  if (AuthService.isAuthenticated()) {
    startAutoSync();
  }
});
</script>

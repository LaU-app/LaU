<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, useBackButton, useIonRouter } from '@ionic/vue';
import { onMounted } from 'vue';
import { useDarkMode } from '@/utils/useDarkMode';
import { useSyncQueue } from '@/utils/useSyncQueue';
import { AuthService } from '@/services/auth';
import { App } from '@capacitor/app';
import { useRoute } from 'vue-router';

const ionRouter = useIonRouter();
const route = useRoute();

// ÚNICO LUGAR DE CONTROL
useBackButton(10, (processNextHandler) => {
  // Lista de páginas donde el botón DEBE cerrar la app
  const exitPages = ['Welcome', 'Login', 'Home']; 
  
  // Nombre actual (puede venir undefined, así que aseguramos que sea string)
  const currentName = (route.name || '') as string;
  const currentPath = route.path;

  console.log('Botón atrás presionado. Ruta:', currentPath, 'Nombre:', currentName);

  // Verificamos si estamos en una página de salida
  if (exitPages.includes(currentName) || currentPath === '/welcome') {
    console.log('Cerrando aplicación...');
    App.exitApp();
  } 
  else {
    console.log('Navegando hacia atrás...');
    if (ionRouter.canGoBack()) {
      ionRouter.back();
    } else {
      processNextHandler();
    }
  }
});

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

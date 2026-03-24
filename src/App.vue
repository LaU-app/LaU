<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet, useBackButton, useIonRouter } from '@ionic/vue';
import { onMounted } from 'vue';
import { useDarkMode } from '@/utils/useDarkMode';
import { useSyncQueue } from '@/utils/useSyncQueue';
import { AuthService } from '@/services/auth';
import { App } from '@capacitor/app';
import { useRoute, useRouter } from 'vue-router';
import { StatusBar } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

StatusBar.setOverlaysWebView({ overlay: true });

const ionRouter = useIonRouter();
const route = useRoute();
const router = useRouter();

// ✨ 2. EL GUARDIÁN DEL MENÚ ✨
router.afterEach((to) => {
  // Si la ruta a la que vamos NO es el detalle de un post...
  if (!to.path.includes('/post/')) {
    // Forzamos a que el menú y el degradado reaparezcan
    setTimeout(() => {
      try {
        const tabBar = document.querySelector('ion-tab-bar.floating-tabs');
        const tabGradient = document.querySelector('.tabs-gradient-mask');
        
        if (tabBar) tabBar.style.display = 'flex';
        if (tabGradient) tabGradient.style.display = 'block';
      } catch (e) {
        console.warn('Error al restaurar menú', e);
      }
    }, 50);
  }
});

// ÚNICO LUGAR DE CONTROL
useBackButton(10, (processNextHandler) => {
  // Lista de páginas donde el botón DEBE cerrar la app
  const exitPages = ['Welcome', 'Login', 'Home']; 
  
  // Nombre actual (puede venir undefined, así que aseguramos que sea string)
  const currentName = route.name || '';
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
  
  if (AuthService.isAuthenticated()) {
    startAutoSync();
  }

  // ✨ NUEVO: CONFIGURACIÓN DEL TECLADO ✨
  if (window.Capacitor?.isNativePlatform()) {
    // Evita que el teclado empuje toda la pantalla hacia arriba
    Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });
    // Opcional: Esto ayuda en iOS a tener una mejor experiencia
    Keyboard.setScroll({ isDisabled: true }); 
  }

  // Escuchar cuando la app se abre desde un enlace externo
    App.addListener('appUrlOpen', (event) => {
        // Ejemplo de event.url: https://lauapp-81f4d.web.app/tabs/post/28
        const urlDomain = 'https://lauapp-81f4d.web.app';
        
        if (event.url.includes(urlDomain)) {
            // Extraemos solo la ruta (ej: /tabs/post/28)
            const path = event.url.split(urlDomain).pop();
            
            if (path) {
                // Le decimos a Vue Router que navegue a esa pantalla
                router.push(path);
            }
        }
    });

    // ✨ EL TRUCO NINJA: Escuchar cuando el usuario sale de la app ✨
  App.addListener('appStateChange', async (state) => {
    // Si state.isActive es falso, significa que la app se minimizó o se usó exitApp()
    if (!state.isActive) {
      const pendingId = localStorage.getItem('pending_update_id');
      
      // Si hay una actualización esperando, la aplicamos silenciosamente
      if (pendingId) {
        console.log('Aplicando actualización mientras el usuario no mira...');
        try {
          await CapacitorUpdater.set({ id: pendingId });
          // Borramos el ID para no volver a instalarla
          localStorage.removeItem('pending_update_id'); 
        } catch (e) {
          console.error('Error aplicando update en background', e);
        }
      }
    }
  });
});

</script>

<style scoped>
ion-input, 
ion-textarea, 
ion-searchbar {
    caret-color: var(--ion-text-color) !important;
}

/* Rompemos el Shadow DOM para asegurar que afecte al campo nativo por dentro */
ion-input::part(native),
ion-textarea::part(native),
ion-searchbar::part(search-input) {
    caret-color: var(--ion-text-color) !important;
}
</style>
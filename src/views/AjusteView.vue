<template>
  <ion-page>
    <ion-header class="ion-no-border pt-safe-top">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" @click="goBack" color="dark">
            <ion-icon slot="icon-only" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Ajustes</ion-title>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar placeholder="Buscar ajuste"></ion-searchbar>
        </ion-toolbar>
      </ion-header>

      <div class="section-title">GENERAL</div>
      <ion-list :inset="true">
        <ion-item>
          <div slot="start" class="icon-box bg-purple">
            <ion-icon :icon="moonOutline"></ion-icon>
          </div>
          <ion-label>Apariencia</ion-label>
          <ion-toggle slot="end" mode="ios" :checked="isDarkMode" @ionChange="handleToggleChange"></ion-toggle>
        </ion-item>

        <ion-item>
          <div slot="start" class="icon-box bg-blue">
            <Blur color="currentColor" />
          </div>
          <ion-label>
            <h2>Modo Ambiente - BETA</h2>
            <p>Colores dinámicos basados en fotos (usalo si tu celular lo soporta)</p>
          </ion-label>
          <ion-toggle slot="end" mode="ios" :checked="isAmbientMode" @ionChange="toggleAmbientMode"></ion-toggle>
        </ion-item>

        <ion-item>
          <div slot="start" class="icon-box bg-indigo">
            <ion-icon :icon="colorWandOutline"></ion-icon>
          </div>
          <ion-label>
            <h2>Menú de Cristal (iOS)</h2>
            <p>Efecto translúcido flotante en la barra inferior</p>
          </ion-label>
          <ion-toggle slot="end" mode="ios" :checked="isGlassMode" @ionChange="toggleGlassMode"></ion-toggle>
        </ion-item>

      </ion-list>

      <div class="section-title">NOTIFICACIONES</div>
      <ion-list :inset="true">
        <ion-item>
          <div slot="start" class="icon-box bg-red">
            <ion-icon :icon="notificationsOutline"></ion-icon>
          </div>
          <ion-label>Notificaciones Push</ion-label>
          <ion-toggle slot="end" mode="ios" :checked="isPushEnabled" @ionChange="handlePushToggle"></ion-toggle>
        </ion-item>
      </ion-list>

      <div class="section-title">PRIVACIDAD Y SEGURIDAD</div>
      <ion-list :inset="true">
        <ion-item button detail="true">
          <div slot="start" class="icon-box bg-orange">
            <ion-icon :icon="keyOutline"></ion-icon>
          </div>
          <ion-label>Cambiar Contraseña</ion-label>
        </ion-item>

        <ion-item button detail="true" href="https://example.com" target="_blank">
          <div slot="start" class="icon-box bg-gray">
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
          </div>
          <ion-label>Política de privacidad</ion-label>
        </ion-item>
      </ion-list>

      <div class="section-title">ACTUALIZACIONES</div>
      <ion-list :inset="true">
        <ion-item button detail="true" @click="openDriveUpdates">
          <div slot="start" class="icon-box bg-green"> <ion-icon :icon="cloudDownloadOutline"></ion-icon>
          </div>
          <ion-label>
            <h2>Descargar nueva versión</h2>
            <p>Obtener el APK más reciente</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div class="section-title">INFORMACIÓN</div>
      <ion-list :inset="true">
        <ion-item button detail="true">
          <ion-label>Ayuda y Soporte</ion-label>
        </ion-item>
        <ion-item button detail="true">
          <ion-label>Términos y condiciones</ion-label>
        </ion-item>
      </ion-list>

      <div class="logout-container">
        <ion-button expand="block" fill="outline" color="danger" class="logout-btn" @click="presentLogoutAlert">
          <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
          Cerrar Sesión
        </ion-button>

        <div class="footer-info">
          <p class="version">v{{ appVersion }} (Build {{ appBuild }})</p>
        </div>
      </div>

      <div class="ion-padding-bottom"></div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonToggle, IonIcon, IonButtons, 
  IonButton, IonSearchbar, alertController 
} from '@ionic/vue';
import {
  globeOutline, keyOutline, moonOutline, notificationsOutline, mailOutline,
  timeOutline, fingerPrintOutline, shieldCheckmarkOutline, logOutOutline, 
  cloudDownloadOutline, colorWandOutline, chevronBackOutline
} from 'ionicons/icons';
import { Blur } from '@boxicons/vue';

// Plugins Nativos
import { App as CapacitorApp, App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';

// Servicios y Utilidades
import { AuthService } from "@/services/auth";
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { useDarkMode } from "@/utils/useDarkMode";
import { useAmbientMode } from "@/utils/useAmbientMode";
import { useGlassMode } from "@/utils/useGlassMode";

// ==========================================
// 1. ESTADO Y RUTAS (UI State)
// ==========================================
const router = useRouter();
const appVersion = ref('0.0.0');
const appBuild = ref('0000000');
const isPushEnabled = ref(false);
let appStateListener = null;

const { isDarkMode, toggleDarkMode } = useDarkMode();
const { isAmbientMode, toggleAmbientMode } = useAmbientMode();
const { isGlassMode, toggleGlassMode } = useGlassMode();

// ==========================================
// 2. CICLO DE VIDA (Mount & Unmount)
// ==========================================
onMounted(async () => {
  await loadAppInfo();
  await syncPushNotificationState();

  // SRP: Extraemos la lógica pesada a una función externa
  appStateListener = await App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) await syncPushNotificationState();
  });
});

onUnmounted(() => {
  if (appStateListener) appStateListener.remove();
});

// ==========================================
// 3. LÓGICA DE NEGOCIO Y SERVICIOS (El "Cómo")
// ==========================================
const loadAppInfo = async () => {
  try {
    const info = await App.getInfo();
    appVersion.value = info.version;
    appBuild.value = info.build;
  } catch (error) {
    console.warn("Modo navegador: Usando versión estática");
  }
};

const syncPushNotificationState = async () => {
  try {
    const permStatus = await PushNotifications.checkPermissions();
    const hasNativePermission = permStatus.receive === 'granted';
    const hasLocalState = localStorage.getItem('lau_push_enabled') === 'true';

    if (hasNativePermission && hasLocalState) {
      if (!isPushEnabled.value) await pushNotificationsService.initialize(true);
      isPushEnabled.value = true;
    } else {
      if (isPushEnabled.value && !hasNativePermission) await pushNotificationsService.unregister();
      isPushEnabled.value = false;
      localStorage.setItem('lau_push_enabled', 'false'); 
    }
  } catch (error) {
    console.error("Error sincronizando notificaciones:", error);
  }
};

const performLogout = async () => {
  try {
    await AuthService.logout();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Espera segura
  } catch (error) {
    console.error("Error al cerrar sesión (Fallback activado):", error);
    localStorage.clear();
    sessionStorage.clear();
  } finally {
    // Redirección forzada garantizada (Se ejecuta falle o no falle el bloque try)
    window.location.href = "/welcome";
  }
};

// ==========================================
// 4. CONTROLADORES DE INTERFAZ (El "Qué")
// ==========================================
const goBack = () => router.back();

const handleToggleChange = (event) => {
  if (event.detail.checked !== isDarkMode.value) toggleDarkMode();
};

const openDriveUpdates = async () => {
  const driveUrl = 'https://drive.google.com/drive/folders/1pur2Gzg2vekayB0TLPNYZyA1zHzU2noN';
  try {
    await CapacitorApp.openUrl({ url: driveUrl });
  } catch (error) {
    window.open(driveUrl, '_system');
  }
};

const handlePushToggle = async (event) => {
  const isChecked = event.detail.checked;
  if (isChecked === isPushEnabled.value) return;

  try {
    if (isChecked) {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        alert("Para recibir notificaciones, debes habilitarlas en los ajustes de tu teléfono.");
        await App.openAppSettings();
        event.target.checked = false;
        return;
      }

      await pushNotificationsService.initialize(true);
      isPushEnabled.value = true;
      localStorage.setItem('lau_push_enabled', 'true');
    } else {
      await presentPushDisableConfirm(event);
    }
  } catch (error) {
    isPushEnabled.value = false;
    event.target.checked = false;
  }
};

// ==========================================
// 5. ALERTAS Y MODALES (UI Feedback)
// ==========================================
const presentPushDisableConfirm = async (event) => {
  const alert = await alertController.create({
    header: 'Desactivar Notificaciones',
    message: '¿Estás seguro de que ya no quieres recibir notificaciones de LaU?',
    buttons: [
      { 
        text: 'Cancelar', 
        role: 'cancel', 
        handler: () => { event.target.checked = true; } 
      },
      {
        text: 'Desactivar', 
        role: 'confirm', 
        handler: async () => {
          await pushNotificationsService.unregister();
          isPushEnabled.value = false;
          localStorage.setItem('lau_push_enabled', 'false');
        }
      }
    ]
  });
  await alert.present();
};

const presentLogoutAlert = async () => {
  const alert = await alertController.create({
    header: 'Cerrar Sesión',
    message: '¿Estás seguro que deseas salir de tu cuenta?',
    mode: 'md',
    cssClass: 'my-rounded-alert',
    buttons: [
      { text: 'Cancelar', role: 'cancel', cssClass: 'secondary' },
      { text: 'Sí, salir', role: 'confirm', handler: () => performLogout() },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
ion-header ion-toolbar {
  --background: var(--app-background);
  --color: var(--app-text);
  --border-color: var(--app-border);
}

ion-content {
  --background: var(--app-background);
}

/* Estilo para los títulos de sección (iOS style) */
.section-title {
  padding-left: 20px;
  padding-top: 20px;
  padding-bottom: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ion-color-medium);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Estilos de las cajas de iconos */
.icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  /* Bordes redondeados como en tu diseño */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.icon-box ion-icon {
  font-size: 20px;
}

.bg-orange {
  background: rgba(249, 115, 22, 0.15);
  color: #f97316;
}

.bg-purple {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.bg-red {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.bg-blue {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.bg-indigo {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
}

.bg-green {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.bg-gray {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

/* Estilos del Footer */
.logout-container {
  padding: 20px;
}

.logout-btn {
  --border-radius: 12px;
  height: 50px;
  margin-bottom: 20px;
  font-weight: 600;
  --background: var(--app-background);
}

.footer-info {
  text-align: center;
  color: var(--ion-color-medium);
}

.footer-info p {
  margin: 2px 0;
  font-size: 12px;
}

.footer-info .version {
  font-size: 10px;
  opacity: 0.8;
}

ion-list.md.list-md.list-inset.hydrated,
.my-rounded-alert .alert-wrapper {
  border-radius: 20px !important;
}
</style>
<template>
  <ion-page>
    <div class="page-gradient-bg"></div>
    <ion-content class="settings-content" :fullscreen="true" ref="ionContentRef">
      
      <div class="settings-wrapper">

        <!-- ========== HEADER ========== -->
        <div class="settings-header">
          <button class="back-btn" @click="goBack" aria-label="Volver">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </button>
          <h1 class="header-title">Ajustes</h1>
          <div class="header-spacer"></div>
        </div>

        <!-- ========== PERFIL (AHORA FUNCIONAL, datos de sesión) ========== -->
        <div class="profile-card">
          <div class="profile-avatar">
            <img v-if="user?.imagen_url" :src="getFullImageUrl(user.imagen_url)" :alt="user?.name || 'Usuario'" />
            <ion-icon v-else :icon="personCircleOutline" class="avatar-fallback-icon"></ion-icon>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ user?.name || 'Usuario' }}</h2>
            <p class="profile-email">{{ user?.email || user?.username || '' }}</p>
          </div>
          <div class="edit-btn" aria-hidden="true">
            <ion-icon :icon="createOutline"></ion-icon>
          </div>
        </div>

        <!-- ========== GENERAL ========== -->
        <div class="settings-section">
          <div class="settings-card">
            <div class="section-title-row">General</div>
            <div class="item-divider"></div>

            <div class="settings-item">
              <ion-icon :icon="moonOutline" class="item-icon"></ion-icon>
              <span class="item-label item-label-only">Apariencia</span>
              <ion-toggle slot="end" mode="ios" :checked="isDarkMode" @ionChange="handleToggleChange"></ion-toggle>
            </div>

            <div class="item-divider"></div>

            <div class="settings-item">
              <Blur color="currentColor" class="item-icon boxicon" />
              <div class="item-text-group">
                <span class="item-label">Modo Ambiente <span class="beta-tag">BETA</span></span>
                <span class="item-sublabel">Colores dinámicos basados en fotos</span>
              </div>
              <ion-toggle slot="end" mode="ios" :checked="isAmbientMode" @ionChange="toggleAmbientMode"></ion-toggle>
            </div>

            <div class="item-divider"></div>

            <div class="settings-item">
              <ion-icon :icon="colorWandOutline" class="item-icon"></ion-icon>
              <div class="item-text-group">
                <span class="item-label">Menú de Cristal (iOS)</span>
                <span class="item-sublabel">Efecto translúcido en la barra inferior</span>
              </div>
              <ion-toggle slot="end" mode="ios" :checked="isGlassMode" @ionChange="toggleGlassMode"></ion-toggle>
            </div>
          </div>
        </div>

        <!-- ========== NOTIFICACIONES ========== -->
        <div class="settings-section">
          <div class="settings-card">
            <div class="section-title-row">Notificaciones</div>
            <div class="item-divider"></div>
            <div class="settings-item">
              <ion-icon :icon="notificationsOutline" class="item-icon"></ion-icon>
              <span class="item-label item-label-only">Notificaciones Push</span>
              <ion-toggle slot="end" mode="ios" :checked="isPushEnabled" @ionChange="handlePushToggle"></ion-toggle>
            </div>
          </div>
        </div>

        <!-- ========== PRIVACIDAD Y SEGURIDAD ========== -->
        <div class="settings-section">
          <div class="settings-card">
            <div class="section-title-row">Privacidad y seguridad</div>
            <div class="item-divider"></div>

            <button class="settings-item settings-item-btn" type="button">
              <ion-icon :icon="keyOutline" class="item-icon"></ion-icon>
              <span class="item-label item-label-only">Cambiar Contraseña</span>
              <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
            </button>

            <div class="item-divider"></div>

            <a class="settings-item settings-item-btn" href="https://example.com" target="_blank">
              <ion-icon :icon="shieldCheckmarkOutline" class="item-icon"></ion-icon>
              <span class="item-label item-label-only">Política de privacidad</span>
              <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
            </a>
          </div>
        </div>

        <!-- ========== ACTUALIZACIONES ========== -->
        <div class="settings-section">
          <div class="settings-card">
            <div class="section-title-row">Actualizaciones</div>
            <div class="item-divider"></div>
            <button class="settings-item settings-item-btn" type="button" @click="openDriveUpdates">
              <ion-icon :icon="cloudDownloadOutline" class="item-icon"></ion-icon>
              <div class="item-text-group">
                <span class="item-label">Descargar nueva versión</span>
                <span class="item-sublabel">Obtener el APK más reciente</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
            </button>
          </div>
        </div>

        <!-- ========== INFORMACIÓN ========== -->
        <div class="settings-section">
          <div class="settings-card">
            <div class="section-title-row">Información</div>
            <div class="item-divider"></div>

            <button class="settings-item settings-item-btn" type="button">
              <span class="item-label item-label-only">Ayuda y Soporte</span>
              <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
            </button>

            <div class="item-divider"></div>

            <button class="settings-item settings-item-btn" type="button">
              <span class="item-label item-label-only">Términos y condiciones</span>
              <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
            </button>
          </div>
        </div>

        <!-- ========== CERRAR SESIÓN ========== -->
        <div class="logout-container">
          <button class="logout-btn" @click="presentLogoutAlert" type="button">
            <ion-icon :icon="logOutOutline"></ion-icon>
            Cerrar Sesión
          </button>

          <div class="footer-info">
            <p class="version">v{{ appVersion }} (Build {{ appBuild }})</p>
          </div>
        </div>

      </div>
    </ion-content>

      <!-- ========== MODAL PERSONALIZADO: CERRAR SESIÓN ========== -->
    <transition name="logout-fade">
      <div v-if="showLogoutModal" class="logout-overlay" @click.self="closeLogoutModal">
        <transition name="logout-scale">
          <div v-if="showLogoutModal" class="logout-modal">
            <div class="logout-modal-icon">
              <ion-icon :icon="logOutOutline"></ion-icon>
            </div>

            <h3 class="logout-modal-title">Cerrar Sesión</h3>
            <p class="logout-modal-message">¿Estás seguro que deseas salir de tu cuenta?</p>

            <div class="logout-modal-actions">
              <button class="logout-modal-btn logout-modal-cancel" @click="closeLogoutModal" type="button">
                Cancelar
              </button>
              <button class="logout-modal-btn logout-modal-confirm" @click="confirmLogout" type="button">
                Sí, salir
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch  } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonIcon, IonToggle,
  alertController
} from '@ionic/vue';
import {
  keyOutline, moonOutline, notificationsOutline,
  shieldCheckmarkOutline, logOutOutline, cloudDownloadOutline,
  colorWandOutline, chevronBackOutline, chevronForwardOutline, createOutline,personCircleOutline 
} from 'ionicons/icons';
import { Blur } from '@boxicons/vue';

// Plugins Nativos
import { App as CapacitorApp, App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';

// Servicios y Utilidades
import { AuthService } from "@/services/auth";
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { getFullImageUrl } from '@/utils/imageUtils'; 
import { useDarkMode } from "@/utils/useDarkMode";
import { useAmbientMode } from "@/utils/useAmbientMode";
import { useGlassMode } from "@/utils/useGlassMode";

// ==========================================
// 1. ESTADO Y RUTAS (UI State)
// ==========================================
const ionContentRef = ref(null);
const router = useRouter();
const appVersion = ref('0.0.0');
const appBuild = ref('0000000');
const isPushEnabled = ref(false);
const showLogoutModal = ref(false);
let appStateListener = null;

const user = ref(AuthService.getUser());

const { isDarkMode, toggleDarkMode } = useDarkMode();
const { isAmbientMode, toggleAmbientMode } = useAmbientMode();
const { isGlassMode, toggleGlassMode } = useGlassMode();

// ==========================================
// 2. CICLO DE VIDA (Mount & Unmount)
// ==========================================
onMounted(async () => {
  user.value = AuthService.getUser();
  await loadAppInfo();
  await syncPushNotificationState();

  appStateListener = await App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) await syncPushNotificationState();
  });
});

onUnmounted(() => {
  if (appStateListener) appStateListener.remove();
});

// ==========================================
// 3. LÓGICA DE NEGOCIO Y SERVICIOS
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
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (error) {
    console.error("Error al cerrar sesión (Fallback activado):", error);
    localStorage.clear();
    sessionStorage.clear();
  } finally {
    window.location.href = "/welcome";
  }
};

// ==========================================
// 4. CONTROLADORES DE INTERFAZ
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
// 5. ALERTAS Y MODALES
// ==========================================
const presentPushDisableConfirm = async (event) => {
  const alert = await alertController.create({
    header: 'Desactivar Notificaciones',
    message: '¿Estás seguro de que ya no quieres recibir notificaciones de LaU?',
    buttons: [
      { text: 'Cancelar', role: 'cancel', handler: () => { event.target.checked = true; } },
      {
        text: 'Desactivar', role: 'confirm',
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

// ==========================================
// 5. MODAL PERSONALIZADO DE LOGOUT
// ==========================================
const presentLogoutAlert = () => {
  showLogoutModal.value = true;
};

const closeLogoutModal = () => {
  showLogoutModal.value = false;
};

const confirmLogout = () => {
  showLogoutModal.value = false;
  performLogout();
};

// ==========================================
// BLOQUEO DE SCROLL MIENTRAS EL MODAL ESTÁ ABIERTO
// ==========================================
watch(showLogoutModal, (isOpen) => {
    if (ionContentRef.value?.$el) {
        ionContentRef.value.$el.scrollY = !isOpen;
    }
});
</script>

<style scoped>
/* Deja solo esta versión de settings-content: */
.settings-content {
  --background: transparent;
  position: relative;
  z-index: 1;
}



.settings-wrapper {
  padding: 0 16px 40px 16px;
  max-width: 480px;
  margin: 0 auto;
}

/* ========== HEADER ========== */
.settings-header {
  display: flex;
  align-items: center;
  padding: calc(12px + env(safe-area-inset-top)) 0 20px 0;
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3); /* 👈 antes: sin borde */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #1c1c1e;

  /* Translúcido con blur, igual que .profile-card */
  background: rgba(255, 255, 255, 0.25); /* 👈 antes: #ffffff sólido */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}

.back-btn ion-icon {
  font-size: 20px;
}

.ion-palette-dark .back-btn {
  background: rgba(255, 255, 255, 0.06); /* 👈 antes: #1c1c1e sólido */
  border-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: var(--ion-color-dark, #1c1c1e);
}

.header-spacer {
  width: 38px; /* mismo ancho que back-btn, para centrar el título de verdad */
  flex-shrink: 0;
}

/* ========== FONDO DEGRADADO DE TODA LA PÁGINA (detrás de todo) ========== */
.page-gradient-bg {
  position: absolute; /* 👈 antes: fixed — esto es lo que lo rompía */
  top: 0;
  left: 0;
  right: 0;
  height: 55vh;
  z-index: 0;
  pointer-events: none;

  background: linear-gradient(171deg, rgba(96, 165, 250, 0.4) 0%, rgb(196 181 253 / 0%) 100%);

  mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
}

.ion-palette-dark .page-gradient-bg {
      background: linear-gradient(176deg, #a855f773 0%, /* 👈 antes 0.22 */ transparent /* 👈 antes 0.22 */);
}
/* ion-content debe ser transparente para dejar ver el gradiente que está detrás */
.settings-content {
  --background: transparent; /* 👈 antes: #f2f2f7 */
  position: relative;
  z-index: 1; /* por encima del gradiente fijo */
}

/* El color de fondo base de la página ahora vive en ion-page, detrás del gradiente */
ion-page {
  background: #f2f2f7 !important;
}

.ion-palette-dark ion-page {
  background: #0c0c0e !important;
}

:global(.ion-palette-dark) .page-gradient-bg {
  background: linear-gradient(
    120deg,
    rgba(59, 130, 246, 0.45) 0%,
    rgba(168, 85, 247, 0.45) 100%
  );
}

:global(.ion-palette-dark) ion-page {
  background: #0c0c0e !important;
}

/* El wrapper necesita quedar POR ENCIMA del fondo degradado */
.settings-wrapper {
  position: relative;
  z-index: 1;
  padding: 0 16px 40px 16px;
  max-width: 480px;
  margin: 0 auto;
}

/* ========== PERFIL (VISUAL) ========== */
.avatar-fallback-icon {
  width: 100%;
  height: 100%;
  font-size: 52px;
  color: #9ca3af;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  margin-bottom: 24px;

  /* Ya NO tiene su propio gradiente — deja ver el .page-gradient-bg de atrás */
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);

  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}

.ion-palette-dark .profile-card {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid #ffffff;
}

.ion-palette-dark .profile-avatar {
  border-color: rgba(255, 255, 255, 0.15);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1c1c1e;
}

.ion-palette-dark .profile-name,
.ion-palette-dark .profile-email {
  color: #ffffff;
}

.profile-email {
  margin: 2px 0 0 0;
  font-size: 12.5px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #1c1c1e;
}

.ion-palette-dark .edit-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.edit-btn ion-icon {
  font-size: 15px;
}

/* ========== SECCIONES ========== */
.settings-section {
  margin-bottom: 22px;
}

.section-title-row {
  padding: 14px 14px 10px 14px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ion-color-dark, #1c1c1e);
}

.settings-card {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.ion-palette-dark .settings-card {
  background: #1c1c1e;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.item-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin-left: 52px; /* alineado con el texto, no con el ícono */
}

.ion-palette-dark .item-divider {
  background: rgba(255, 255, 255, 0.08);
}

/* ========== ITEMS ========== */
.settings-item,
.settings-item-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  text-decoration: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.settings-item-btn:active {
  background: rgba(0, 0, 0, 0.03);
}

.ion-palette-dark .settings-item-btn:active {
  background: rgba(255, 255, 255, 0.04);
}

.item-icon {
  font-size: 20px;
  color: #6b7280;
  flex-shrink: 0;
  width: 22px;
}

.item-icon.boxicon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.item-text-group {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.item-label {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ion-color-dark, #1c1c1e);
}

.item-label-only {
  flex: 1;
}

.item-sublabel {
  font-size: 12px;
  color: var(--ion-color-medium, #8e8e93);
  margin-top: 1px;
}

.beta-tag {
  font-size: 9px;
  font-weight: 700;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  padding: 1px 5px;
  border-radius: 5px;
  margin-left: 4px;
  vertical-align: middle;
}

.chevron {
  font-size: 16px;
  color: #c7c7cc;
  flex-shrink: 0;
}

ion-toggle {
  flex-shrink: 0;
}

/* ========== LOGOUT ========== */
.logout-container {
  margin-top: 12px;
}

.logout-btn {
  width: 100%;
  height: 50px;
  border-radius: 16px;
  border: none;
  background: #ffffff;
  color: #ef4444;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.ion-palette-dark .logout-btn {
  background: #1c1c1e;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.logout-btn ion-icon {
  font-size: 18px;
}

.footer-info {
  text-align: center;
  margin-top: 14px;
  color: var(--ion-color-medium);
}

.footer-info p {
  margin: 2px 0;
  font-size: 11px;
  opacity: 0.7;
}

/* ========== MODAL PERSONALIZADO: CERRAR SESIÓN ========== */
.logout-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.logout-modal {
  width: 100%;
  max-width: 320px;
  padding: 28px 24px 20px 24px;
  border-radius: 24px;
  text-align: center;

  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);

  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
}

.ion-palette-dark .logout-modal {
  background: rgba(28, 28, 30, 0.9);
  border-color: rgba(255, 255, 255, 0.08);
}

.logout-modal-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.logout-modal-icon ion-icon {
  font-size: 26px;
}

.logout-modal-title {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--ion-color-dark, #1c1c1e);
}

.logout-modal-message {
  margin: 0 0 22px 0;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--ion-color-medium, #6b7280);
}

.logout-modal-actions {
  display: flex;
  gap: 10px;
}

.logout-modal-btn {
  flex: 1;
  height: 46px;
  border-radius: 14px;
  border: none;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
}

.logout-modal-cancel {
  background: rgba(0, 0, 0, 0.06);
  color: var(--ion-color-dark, #1c1c1e);
}

.ion-palette-dark .logout-modal-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.logout-modal-confirm {
  background: #ef4444;
  color: #ffffff;
}

/* ========== ANIMACIONES DEL MODAL ========== */
.logout-fade-enter-active,
.logout-fade-leave-active {
  transition: opacity 0.25s ease;
}

.logout-fade-enter-from,
.logout-fade-leave-to {
  opacity: 0;
}

.logout-scale-enter-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

.logout-scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.logout-scale-enter-from {
  transform: scale(0.85);
  opacity: 0;
}

.logout-scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>
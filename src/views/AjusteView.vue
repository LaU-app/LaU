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
          <ion-toggle slot="end" mode="ios" :checked="isDarkMode" 
            @ionChange="handleToggleChange"></ion-toggle>
        </ion-item>
      </ion-list>

      <div class="section-title">NOTIFICACIONES</div>
      <ion-list :inset="true">
        <ion-item>
          <div slot="start" class="icon-box bg-red">
            <ion-icon :icon="notificationsOutline"></ion-icon>
          </div>
          <ion-label>Notificaciones Push</ion-label>
          <ion-toggle slot="end" mode="ios"></ion-toggle>
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
          Cerrar Sesión Actual
        </ion-button>
        
        <div class="footer-info">
          <p class="version">Versión 1.0.2 (Build 202310)</p>
        </div>
      </div>

      <div class="ion-padding-bottom"></div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonNote, IonIcon, IonToggle,
  IonButtons, IonSearchbar, IonButton, alertController
} from '@ionic/vue';
import { 
  globeOutline, keyOutline, moonOutline, notificationsOutline, mailOutline, 
  timeOutline, fingerPrintOutline, shieldCheckmarkOutline, logOutOutline 
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { chevronBackOutline } from 'ionicons/icons'; // Importamos el icono
import { useDarkMode } from "@/utils/useDarkMode";
import { AuthService } from "@/services/auth";

const router = useRouter();
const { isDarkMode, toggleDarkMode } = useDarkMode();

const goBack = () => {
  // Aquí puedes agregar lógica extra antes de salir si quieres
  console.log("Saliendo de ajustes...");
  
  router.back(); // Esto regresa a la página anterior en el historial
};

const handleToggleChange = (event) => {
  // Evitamos bucles infinitos: solo cambiamos si el toggle es diferente al estado actual
  const isChecked = event.detail.checked;
  if (isChecked !== isDarkMode.value) {
    toggleDarkMode();
  }
};

const presentLogoutAlert = async () => {
  const alert = await alertController.create({
    header: 'Cerrar Sesión',
    message: '¿Estás seguro que deseas salir de tu cuenta?',
    mode: 'md',
    cssClass: 'my-rounded-alert',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        cssClass: 'secondary',
      },
      {
        text: 'Sí, salir',
        role: 'confirm',
        handler: () => {
          // Si el usuario dice "Sí", ejecutamos la lógica real
          performLogout(); 
        },
      },
    ],
  });

  await alert.present();
};

// Paso 2: Ejecutar el cierre de sesión (Tu lógica original adaptada)
const performLogout = async () => {
  try {
    // Intentamos cerrar sesión con el servicio
    await AuthService.logout();
    
    // Pequeña espera para asegurar que los procesos asíncronos terminen
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Redirección forzada al inicio
    window.location.href = "/welcome";
    
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    
    // Fallback: Limpieza forzada si falla el servicio
    localStorage.clear();
    sessionStorage.clear();
    
    window.location.href = "/welcome";
  }
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
  border-radius: 8px; /* Bordes redondeados como en tu diseño */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.icon-box ion-icon {
  font-size: 20px;
}

.bg-orange { background: rgba(249, 115, 22, 0.15); color: #f97316; }
.bg-purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.bg-red    { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.bg-blue   { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.bg-indigo { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
.bg-green  { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.bg-gray   { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

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
.pt-safe-top {
  padding-top: max(20px, env(safe-area-inset-top));
}

ion-list.md.list-md.list-inset.hydrated,
.my-rounded-alert .alert-wrapper  {
    border-radius: 20px !important;
}
</style>
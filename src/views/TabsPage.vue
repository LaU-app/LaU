<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <!-- Tabs solo para usuarios autenticados -->
      <ion-tab-bar v-if="isAuthenticated" slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button @click="openUsers">
          <ion-icon aria-hidden="true" :icon="peopleSharp" />
          <ion-label>Usuarios</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon aria-hidden="true" :icon="addCircle" />
          <ion-label>Crear</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="notifications" href="/tabs/notifications">
          <div class="notification-button-wrapper">
            <ion-icon aria-hidden="true" :icon="notificationsOutline" />
            <ion-badge v-if="unreadCount > 0" color="danger" class="notification-badge">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </ion-badge>
          </div>
          <ion-label>Notificaciones</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="perfil" href="/tabs/perfil">
          <ion-icon aria-hidden="true" :icon="person" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet, IonBadge } from '@ionic/vue';
import { home, peopleSharp, addCircle, notificationsOutline, person } from 'ionicons/icons';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/services/auth';
import { notificationsService } from '@/services/notificationsService';

const router = useRouter();

// Estado reactivo de autenticación
const isAuthenticated = ref(AuthService.isAuthenticated());

// Estado del contador de notificaciones
const unreadCount = ref(0);
let pollInterval = null;

// Actualizar cuando el componente se monta
onMounted(() => {
  isAuthenticated.value = AuthService.isAuthenticated();

  // Cargar contador inicial si está autenticado
  if (isAuthenticated.value) {
    loadUnreadCount();

    // Polling cada 30 segundos para actualizar el contador
    pollInterval = setInterval(() => {
      if (AuthService.isAuthenticated()) {
        loadUnreadCount();
      }
    }, 30000);
  }
});

// Limpiar interval al desmontar
onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});

// Cargar contador de notificaciones no leídas
const loadUnreadCount = async () => {
  try {
    const response = await notificationsService.getUnreadCount();
    if (response.success) {
      unreadCount.value = response.count;
    }
  } catch (error) {
    console.error('Error al cargar contador de notificaciones:', error);
  }
};

// Escuchar cambios de ruta para actualizar el estado
router.afterEach(() => {
  const wasAuthenticated = isAuthenticated.value;
  isAuthenticated.value = AuthService.isAuthenticated();

  // Si cambió a autenticado, cargar contador
  if (!wasAuthenticated && isAuthenticated.value) {
    loadUnreadCount();
  }

  // Si cambió a no autenticado, resetear contador
  if (wasAuthenticated && !isAuthenticated.value) {
    unreadCount.value = 0;
  }
});

// Función para abrir la vista de usuarios como modal
const openUsers = () => {
  router.push('/users');
};
</script>

<style scoped>
/* Estilos para el botón de notificaciones con badge */
.notification-button-wrapper {
  position: relative;
  display: inline-block;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 2px 4px;
  font-size: 10px;
  font-weight: bold;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animación para el badge cuando aparece */
@keyframes badgePulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.notification-badge {
  animation: badgePulse 0.3s ease-out;
}

/* Asegurar que el ion-icon dentro del wrapper tenga el tamaño correcto */
.notification-button-wrapper ion-icon {
  font-size: 24px;
}
</style>

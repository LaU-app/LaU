<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <!-- Tabs solo para usuarios autenticados -->
      <ion-tab-bar v-if="isAuthenticated" slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="custom-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path
              d="M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-1v-7a3 3 0 0 0 -2.824 -2.995l-.176 -.005h-2a3 3 0 0 0 -3 3v7h-1a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.293 11.707a1 1 0 0 1 1 1v7h-4v-7a1 1 0 0 1 .883 -.993l.117 -.007z"
            />
          </svg>
        </ion-tab-button>

        <ion-tab-button @click="openUsers">
          <ion-icon aria-hidden="true" :icon="peopleSharp" />
        </ion-tab-button>

        <ion-tab-button tab="create-post" href="/tabs/create-post/foto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="custom-icon create-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path
              d="M12 2l.324 .001l.318 .004l.616 .017l.299 .013l.579 .034l.553 .046c4.785 .464 6.732 2.411 7.196 7.196l.046 .553l.034 .579c.005 .098 .01 .198 .013 .299l.017 .616l.005 .642l-.005 .642l-.017 .616l-.013 .299l-.034 .579l-.046 .553c-.464 4.785 -2.411 6.732 -7.196 7.196l-.553 .046l-.579 .034c-.098 .005 -.198 .01 -.299 .013l-.616 .017l-.642 .005l-.642 -.005l-.616 -.017l-.299 -.013l-.579 -.034l-.553 -.046c-4.785 -.464 -6.732 -2.411 -7.196 -7.196l-.046 -.553l-.034 -.579a28.058 28.058 0 0 1 -.013 -.299l-.017 -.616c-.003 -.21 -.005 -.424 -.005 -.642l.001 -.324l.004 -.318l.017 -.616l.013 -.299l.034 -.579l.046 -.553c.464 -4.785 2.411 -6.732 7.196 -7.196l.553 -.046l.579 -.034c.098 -.005 .198 -.01 .299 -.013l.616 -.017c.21 -.003 .424 -.005 .642 -.005zm0 6a1 1 0 0 0 -1 1v2h-2l-.117 .007a1 1 0 0 0 .117 1.993h2v2l.007 .117a1 1 0 0 0 1.993 -.117v-2h2l.117 -.007a1 1 0 0 0 -.117 -1.993h-2v-2l-.007 -.117a1 1 0 0 0 -.993 -.883z"
              fill="currentColor"
              stroke-width="0"
            />
          </svg>
        </ion-tab-button>

        <ion-tab-button @click="openNotifications">
          <div class="notification-button-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="custom-icon"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M14.235 19c.865 0 1.322 1.024 .745 1.668a3.992 3.992 0 0 1 -2.98 1.332a3.992 3.992 0 0 1 -2.98 -1.332c-.552 -.616 -.158 -1.579 .634 -1.661l.11 -.006h4.471z"
              />
              <path
                d="M12 2c1.358 0 2.506 .903 2.875 2.141l.046 .171l.008 .043a8.013 8.013 0 0 1 4.024 6.069l.028 .287l.019 .289v2.931l.021 .136a3 3 0 0 0 1.143 1.847l.167 .117l.162 .099c.86 .487 .56 1.766 -.377 1.864l-.116 .006h-16c-1.028 0 -1.387 -1.364 -.493 -1.87a3 3 0 0 0 1.472 -2.063l.021 -.143l.001 -2.97a8 8 0 0 1 3.821 -6.454l.248 -.146l.01 -.043a3.003 3.003 0 0 1 2.562 -2.29l.182 -.017l.176 -.004z"
              />
            </svg>
            <ion-badge
              v-if="unreadCount > 0"
              color="danger"
              class="notification-badge"
            >
              {{ unreadCount > 99 ? "99+" : unreadCount }}
            </ion-badge>
          </div>
        </ion-tab-button>

        <ion-tab-button tab="perfil" href="#">
          <ion-icon aria-hidden="true" :icon="alarm" />
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
  IonBadge,
} from "@ionic/vue";
import { peopleSharp, alarm } from "ionicons/icons";
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { AuthService } from "@/services/auth";
import { notificationsService } from "@/services/notificationsService";

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
    console.error("Error al cargar contador de notificaciones:", error);
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
  router.push("/users");
};

// Función para abrir la vista de notificaciones como modal
const openNotifications = () => {
  router.push("/notifications");
};
</script>

<style scoped>
/* Estilos para los iconos SVG personalizados */
.custom-icon {
  width: 26px;
  height: 26px;
  color: currentColor;
  display: block;
}

/* Icono de Crear más grande que los demas */
.create-icon {
  width: 38px;
  height: 38px;
}

/* Asegurar que todos los iconos estén centrados */
ion-tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ajustar tamaño de ion-icon para que coincida */
ion-icon {
  font-size: 26px;
  display: block;
}

/* Estilos para el botón de notificaciones con badge */
.notification-button-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
.notification-button-wrapper ion-icon,
.notification-button-wrapper .custom-icon {
  font-size: 26px;
}
</style>

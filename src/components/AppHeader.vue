<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <div class="logo-container">
        <img src="/LaU.png" alt="LaU" class="logo-img" />
      </div>
      <ion-buttons slot="end" class="header-buttons">
        <!-- Botón de login para usuarios NO autenticados -->
        <ion-button v-if="!isAuthenticated" @click="goToLogin" aria-label="Iniciar sesión">
          <ion-icon :icon="logIn" class="header-icon"></ion-icon>
        </ion-button>

        <!-- <ion-button @click="$emit('toggleDarkMode')" :aria-label="isDarkMode ? 'Modo claro' : 'Modo oscuro'"
          fill="clear">
          <ion-icon :icon="isDarkMode ? sunny : moon" class="header-icon"></ion-icon>
        </ion-button> -->
        <ion-button v-if="isAuthenticated" @click="goToTasks" aria-label="Ir a Tareas" fill="clear"
          class="tasks-header-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
            class="header-hourglass">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path
              d="M17 2a2 2 0 0 1 1.995 1.85l.005 .15v2a6.996 6.996 0 0 1 -3.393 6a6.994 6.994 0 0 1 3.388 5.728l.005 .272v2a2 2 0 0 1 -1.85 1.995l-.15 .005h-10a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-2a6.996 6.996 0 0 1 3.393 -6a6.994 6.994 0 0 1 -3.388 -5.728l-.005 -.272v-2a2 2 0 0 1 1.85 -1.995l.15 -.005h10z" />
          </svg>
        </ion-button>

        <ion-button v-if="isAuthenticated" @click="goToChat" aria-label="Ir a Mensajes" fill="clear"
          class="tasks-header-btn chat-button-wrapper">
          <ion-icon :icon="chatbubbleEllipsesSharp" class="header-icon"></ion-icon>
          <ion-badge v-if="unreadChatCount > 0" color="danger" class="header-chat-badge">
            {{ unreadChatCount > 99 ? "99+" : unreadChatCount }}
          </ion-badge>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup>
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
} from "@ionic/vue";
import { moon, sunny, logIn, chatbubbleEllipsesSharp } from "ionicons/icons";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import chatService from "@/services/chatService";

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["toggleDarkMode"]);

const router = useRouter();

// Estado del contador de mensajes no leídos
const unreadChatCount = ref(0);
let pollInterval = null;

// Cargar contador de mensajes no leídos
const loadUnreadChatCount = async () => {
  try {
    const response = await chatService.getUnreadCount();
    if (response.success) {
      unreadChatCount.value = response.count;
    }
  } catch (error) {
    console.error("[AppHeader] Error al cargar contador de mensajes:", error);
  }
};

// Manejar notificación push de mensaje recibido
const handlePushNotification = (event) => {
  const notification = event.detail;
  const data = notification.data || {};
  
  // Si es un mensaje de chat, actualizar contador
  if (data.type === 'message' || data.type === 'chat') {
    loadUnreadChatCount();
  }
};

// Iniciar/detener polling según autenticación
const startPolling = () => {
  if (pollInterval) return;
  
  loadUnreadChatCount();
  pollInterval = setInterval(() => {
    loadUnreadChatCount();
  }, 30000); // Cada 30 segundos
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  unreadChatCount.value = 0;
};

onMounted(() => {
  // Listener para notificaciones push en tiempo real
  window.addEventListener('pushNotificationReceived', handlePushNotification);
});

onUnmounted(() => {
  stopPolling();
  window.removeEventListener('pushNotificationReceived', handlePushNotification);
});

// Observar cambios en isAuthenticated para iniciar/detener polling
watch(() => props.isAuthenticated, (newValue) => {
  if (newValue) {
    startPolling();
  } else {
    stopPolling();
  }
}, { immediate: true });

const goToLogin = () => {
  router.push("/login");
};

const goToTasks = () => {
  router.push('/tasks');
};

const goToChat = () => {
  router.push('/tabs/chat'); // <-- Cambia '/chat' por la ruta exacta que usas en tu rama
};
</script>

<style scoped>
@import "../theme/colors.css";
@import "../theme/home.css";

.header-buttons {
  padding-right: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}


.header-hourglass {
  width: 24px;
  height: 24px;
  color: #6b7280;
}

.tasks-header-btn {
  margin-left: 0;
  padding: 0 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-button-wrapper {
  position: relative;
}

.header-chat-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 14px;
  height: 14px;
  font-size: 8px;
  font-weight: 600;
  padding: 0 3px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.header-hourglass svg {
  width: 20px;
  height: 20px;
  display: block;
}
</style>

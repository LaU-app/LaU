<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Notificaciones</ion-title>
        <ion-buttons slot="end">
          <!-- Botón para marcar todas como leídas -->
          <ion-button @click="markAllAsRead" :disabled="unreadCount === 0">
            <ion-icon :icon="checkmarkDone" slot="icon-only" />
          </ion-button>
          <!-- Botón de opciones -->
          <ion-button @click="showActionSheet">
            <ion-icon :icon="ellipsisVertical" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Segmento para filtrar por tipo -->
      <ion-toolbar>
        <ion-segment v-model="selectedType" @ionChange="filterByType">
          <ion-segment-button value="all">
            <ion-label>Todas</ion-label>
            <ion-badge v-if="unreadCount > 0" color="primary">{{ unreadCount }}</ion-badge>
          </ion-segment-button>
          <ion-segment-button value="like">
            <ion-icon :icon="heart" />
            <ion-label>Likes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="comment">
            <ion-icon :icon="chatbubble" />
            <ion-label>Comentarios</ion-label>
          </ion-segment-button>
          <ion-segment-button value="follow">
            <ion-icon :icon="personAdd" />
            <ion-label>Seguidores</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Refresher para actualizar -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading inicial -->
      <div v-if="isLoading && notifications.length === 0" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Cargando notificaciones...</p>
      </div>

      <!-- Lista de notificaciones -->
      <ion-list v-else-if="notifications.length > 0" class="notifications-list">
        <NotificationItem v-for="notification in notifications" :key="notification.id" :notification="notification"
          @read="handleMarkAsRead" @click="handleNotificationClick" />

        <!-- Infinite scroll para cargar más -->
        <ion-infinite-scroll v-if="hasMorePages" @ionInfinite="loadMoreNotifications($event)" threshold="100px">
          <ion-infinite-scroll-content loading-spinner="crescent" loading-text="Cargando más notificaciones...">
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </ion-list>

      <!-- Estado vacío -->
      <div v-else class="empty-state">
        <ion-icon :icon="notificationsOutline" size="large" color="medium" />
        <h2>No tienes notificaciones</h2>
        <p>Cuando recibas likes, comentarios o nuevos seguidores, aparecerán aquí.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  IonBadge,
  actionSheetController,
  toastController,
  alertController
} from '@ionic/vue';
import {
  notificationsOutline,
  ellipsisVertical,
  checkmarkDone,
  heart,
  chatbubble,
  personAdd,
  trashOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { notificationsService } from '@/services/notificationsService';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import NotificationItem from '@/components/NotificationItem.vue';

const router = useRouter();

// Estado
const notifications = ref([]);
const selectedType = ref('all');
const isLoading = ref(false);
const unreadCount = ref(0);
const currentPage = ref(1);
const hasMorePages = ref(true);

// Cargar notificaciones
const loadNotifications = async (page = 1, append = false) => {
  try {
    isLoading.value = true;

    let response;
    if (selectedType.value === 'all') {
      response = await notificationsService.getNotifications(page);
    } else {
      response = await notificationsService.getNotificationsByType(selectedType.value, page);
    }

    if (response.success) {
      const newNotifications = response.data.data || [];

      if (append) {
        notifications.value = [...notifications.value, ...newNotifications];
      } else {
        notifications.value = newNotifications;
      }

      // Actualizar paginación
      currentPage.value = response.data.current_page || page;
      hasMorePages.value = response.data.next_page_url !== null;
    }
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
    showToast('Error al cargar notificaciones', 'danger');
  } finally {
    isLoading.value = false;
  }
};

// Cargar contador de no leídas
const loadUnreadCount = async () => {
  try {
    const response = await notificationsService.getUnreadCount();
    if (response.success) {
      unreadCount.value = response.count;
    }
  } catch (error) {
    console.error('Error al cargar contador:', error);
  }
};

// Filtrar por tipo
const filterByType = () => {
  currentPage.value = 1;
  hasMorePages.value = true;
  loadNotifications(1, false);
};

// Marcar como leída
const handleMarkAsRead = async (notificationId) => {
  try {
    await notificationsService.markAsRead(notificationId);

    // Actualizar en el array local
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read_at = new Date().toISOString();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }

    showToast('Notificación marcada como leída', 'success');
  } catch (error) {
    console.error('Error al marcar como leída:', error);
    showToast('Error al marcar como leída', 'danger');
  }
};

// Marcar todas como leídas
const markAllAsRead = async () => {
  try {
    const response = await notificationsService.markAllAsRead();

    if (response.success || response.message) {
      // Actualizar todas en el array local
      notifications.value.forEach(notification => {
        notification.read_at = new Date().toISOString();
      });

      unreadCount.value = 0;
      showToast('Todas las notificaciones marcadas como leídas', 'success');
    } else {
      throw new Error('Respuesta inesperada del servidor');
    }
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);

    // Mostrar mensaje de error más específico
    let errorMessage = 'Error al marcar notificaciones';

    if (error.response?.status === 404) {
      errorMessage = 'Funcionalidad no disponible en el servidor';
    } else if (error.response?.status === 401) {
      errorMessage = 'Sesión expirada. Inicia sesión nuevamente';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    showToast(errorMessage, 'danger');
  }
};

// Limpiar notificaciones leídas
const clearReadNotifications = async () => {
  const alert = await alertController.create({
    header: '¿Eliminar notificaciones leídas?',
    message: 'Esta acción no se puede deshacer.',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            const response = await notificationsService.clearReadNotifications();

            if (response.success) {
              // Filtrar notificaciones leídas del array local
              notifications.value = notifications.value.filter(n => !n.read_at);
              showToast(`${response.deleted_count} notificaciones eliminadas`, 'success');
            }
          } catch (error) {
            console.error('Error al limpiar notificaciones:', error);
            showToast('Error al eliminar notificaciones', 'danger');
          }
        }
      }
    ]
  });

  await alert.present();
};

// Mostrar action sheet con opciones
const showActionSheet = async () => {
  const actionSheet = await actionSheetController.create({
    header: 'Opciones',
    buttons: [
      {
        text: 'Marcar todas como leídas',
        icon: checkmarkCircleOutline,
        handler: markAllAsRead
      },
      {
        text: 'Eliminar leídas',
        icon: trashOutline,
        role: 'destructive',
        handler: clearReadNotifications
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ]
  });

  await actionSheet.present();
};

// Handle refresh
const handleRefresh = async (event) => {
  await Promise.all([
    loadNotifications(1, false),
    loadUnreadCount()
  ]);
  event.target.complete();
};

// Cargar más notificaciones (infinite scroll)
const loadMoreNotifications = async (event) => {
  if (hasMorePages.value) {
    await loadNotifications(currentPage.value + 1, true);
  }
  event.target.complete();
};

// Handle click en notificación
const handleNotificationClick = (notification) => {
  console.log('Notificación clickeada:', notification);
  // Aquí puedes agregar lógica adicional si es necesario
};

// Mostrar toast
const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'bottom',
    color
  });
  await toast.present();
};

// Función para cerrar la vista
const goBack = () => {
  router.back();
};

// Lifecycle
onMounted(() => {
  loadNotifications();
  loadUnreadCount();

  // Listener para cuando se recibe una notificación push en foreground
  const handlePushNotification = (event) => {
    const notification = event.detail;
    console.log('Nueva notificación push recibida:', notification);

    // Recargar notificaciones
    loadNotifications(1, false);
    loadUnreadCount();

    // Mostrar un toast
    showToast(notification.title || 'Nueva notificación', 'primary');
  };

  window.addEventListener('pushNotificationReceived', handlePushNotification);

  // Opcional: polling para actualizar el contador cada 30 segundos
  const interval = setInterval(loadUnreadCount, 30000);

  // Limpiar listeners al desmontar
  return () => {
    clearInterval(interval);
    window.removeEventListener('pushNotificationReceived', handlePushNotification);
  };
});
</script>

<style scoped>
/* Toolbar styles */
ion-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

ion-toolbar {
  --background: var(--ion-toolbar-background);
  --border-width: 0;
}

ion-toolbar ion-title {
  font-weight: bold;
  font-size: 18px;
  color: var(--ion-text-color);
}

ion-toolbar ion-button {
  --color: var(--ion-color-medium);
}

ion-toolbar ion-icon {
  font-size: 24px;
}

ion-content {
  --background: var(--ion-background-color);
}

.notifications-list {
  padding: 8px;
  background: var(--ion-background-color);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.loading-container p {
  color: var(--ion-text-color-secondary);
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  text-align: center;
}

.empty-state ion-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h2 {
  color: var(--ion-text-color);
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--ion-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

/* Estilos para el segmento */
ion-segment {
  --background: var(--ion-background-color);
  margin: 0;
}

ion-segment-button {
  --indicator-color: var(--ion-color-primary);
  --color: var(--ion-text-color-secondary);
  --color-checked: var(--ion-color-primary);
  font-size: 13px;
  min-height: 48px;
}

ion-segment-button ion-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

ion-segment-button ion-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
}
</style>

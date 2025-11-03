<template>
    <ion-button @click="goToNotifications" fill="clear" class="notification-button">
        <div class="notification-icon-wrapper">
            <ion-icon :icon="notificationsOutline" slot="icon-only" />
            <ion-badge v-if="unreadCount > 0" color="danger" class="notification-badge">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
            </ion-badge>
        </div>
    </ion-button>
</template>

<script setup>
import { IonButton, IonIcon, IonBadge } from '@ionic/vue';
import { notificationsOutline } from 'ionicons/icons';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { notificationsService } from '@/services/notificationsService';
import { AuthService } from '@/services/auth';

const router = useRouter();
const unreadCount = ref(0);
let pollInterval = null;

// Props opcionales
const props = defineProps({
    // Intervalo de actualización en milisegundos (default: 30 segundos)
    pollInterval: {
        type: Number,
        default: 30000
    },
    // Habilitar/deshabilitar polling automático
    autoUpdate: {
        type: Boolean,
        default: true
    }
});

// Cargar contador de notificaciones
const loadUnreadCount = async () => {
    if (!AuthService.isAuthenticated()) {
        unreadCount.value = 0;
        return;
    }

    try {
        const response = await notificationsService.getUnreadCount();
        if (response.success) {
            unreadCount.value = response.count;
        }
    } catch (error) {
        console.error('[NotificationBadge] Error al cargar contador:', error);
    }
};

// Navegar a notificaciones
const goToNotifications = () => {
    router.push('/notifications');
};

// Lifecycle hooks
onMounted(() => {
    loadUnreadCount();

    // Iniciar polling si está habilitado
    if (props.autoUpdate) {
        pollInterval = setInterval(loadUnreadCount, props.pollInterval);
    }
});

onUnmounted(() => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
});

// Exponer método para actualizar manualmente desde el componente padre
defineExpose({
    refresh: loadUnreadCount
});
</script>

<style scoped>
.notification-button {
    --padding-start: 8px;
    --padding-end: 8px;
    margin: 0;
}

.notification-icon-wrapper {
    position: relative;
    display: inline-block;
    width: 28px;
    height: 28px;
}

.notification-icon-wrapper ion-icon {
    font-size: 28px;
}

.notification-badge {
    position: absolute;
    top: -6px;
    right: -8px;
    min-width: 18px;
    height: 18px;
    padding: 2px 5px;
    font-size: 10px;
    font-weight: bold;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--ion-background-color, #fff);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Animación de pulso cuando hay notificaciones */
@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

.notification-badge {
    animation: pulse 2s infinite;
}

/* Efecto hover en escritorio */
@media (hover: hover) {
    .notification-button:hover .notification-icon-wrapper ion-icon {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
}
</style>

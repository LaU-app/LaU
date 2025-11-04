<template>
    <ion-item :class="['notification-item', { 'unread': !notification.read_at }]" @click="handleNotificationClick"
        button>
        <!-- Avatar del usuario que generó la notificación -->
        <ion-avatar slot="start">
            <img v-if="notification.from_user_data?.imagen_url" :src="notification.from_user_data.imagen_url"
                :alt="notification.from_user_data?.name || 'Usuario'" @error="handleImageError" />
            <ion-icon v-else :icon="personCircle" size="large"></ion-icon>
        </ion-avatar>

        <!-- Contenido de la notificación -->
        <ion-label class="notification-content">
            <div class="notification-header">
                <h3>
                    <span class="username">{{ notification.from_user_data?.name || 'Usuario' }}</span>
                    <ion-badge v-if="notification.from_user_data?.insignia"
                        :color="getBadgeColor(notification.from_user_data.insignia)" class="user-badge">
                        {{ notification.from_user_data.insignia }}
                    </ion-badge>
                </h3>
                <ion-text color="medium" class="time-ago">
                    {{ notification.time_ago }}
                </ion-text>
            </div>

            <p class="notification-message">{{ notification.message }}</p>

            <!-- Indicador de no leída -->
            <ion-badge v-if="!notification.read_at" color="primary" class="unread-badge">
                Nuevo
            </ion-badge>
        </ion-label>

        <!-- Thumbnail del post relacionado (si existe) -->
        <ion-thumbnail v-if="notification.post_data?.imagen_url" slot="end" class="post-thumbnail">
            <img :src="notification.post_data.imagen_url" :alt="notification.post_data.titulo || 'Post'"
                @error="handlePostImageError" />
        </ion-thumbnail>

        <!-- Icono según el tipo de notificación -->
        <div slot="end" class="notification-icon">
            <ion-icon :icon="getNotificationIcon(notification.type)" :color="getNotificationColor(notification.type)"
                size="large" />
        </div>
    </ion-item>
</template>

<script setup>
import { IonItem, IonAvatar, IonLabel, IonThumbnail, IonIcon, IonBadge, IonText } from '@ionic/vue';
import { heart, chatbubble, personAdd, personCircle } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const props = defineProps({
    notification: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['read', 'click']);

const router = useRouter();

// Obtener icono según el tipo de notificación
const getNotificationIcon = (type) => {
    const icons = {
        like: heart,
        comment: chatbubble,
        follow: personAdd
    };
    return icons[type] || chatbubble;
};

// Obtener color según el tipo de notificación
const getNotificationColor = (type) => {
    const colors = {
        like: 'danger',
        comment: 'primary',
        follow: 'success'
    };
    return colors[type] || 'medium';
};

// Obtener color de la insignia del usuario
const getBadgeColor = (insignia) => {
    const colors = {
        'Verificado': 'primary',
        'Premium': 'warning',
        'Admin': 'danger',
        'Moderador': 'success'
    };
    return colors[insignia] || 'medium';
};

// Manejar click en la notificación
const handleNotificationClick = () => {
    // Emitir evento para marcar como leída
    if (!props.notification.read_at) {
        emit('read', props.notification.id);
    }

    // Navegar según el tipo de notificación
    if (props.notification.type === 'follow') {
        // Navegar al perfil del usuario que siguió
        // Por ahora solo emitimos el evento
        emit('click', props.notification);
    } else if (props.notification.post_id) {
        // Navegar al post relacionado
        router.push(`/tabs/post/${props.notification.post_id}`);
    }
};

// Manejar error de carga de imagen del usuario
const handleImageError = (event) => {
    console.warn('Error al cargar imagen del usuario, usando icono por defecto');
    // El v-else con ion-icon se encargará de mostrar el icono
};

// Manejar error de carga de imagen del post
const handlePostImageError = (event) => {
    console.warn('Error al cargar imagen del post');
    event.target.style.display = 'none'; // Ocultar la imagen rota
};
</script>

<style scoped>
.notification-item {
    --background: #ffffff;
    --padding-start: 16px;
    --padding-end: 16px;
    --min-height: 80px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid #F3F4F6;
}

.notification-item.unread {
    background-color: #F0F9FF;
    border-left: 3px solid var(--ion-color-primary);
}

.notification-item:hover {
    background-color: #F9FAFB;
}

ion-avatar {
    width: 48px;
    height: 48px;
}

ion-avatar ion-icon {
    width: 100%;
    height: 100%;
    color: var(--ion-color-medium);
}

ion-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.notification-content {
    margin: 8px 0;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.notification-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.username {
    color: var(--ion-color-dark);
}

.user-badge {
    font-size: 10px;
    padding: 2px 6px;
}

.time-ago {
    font-size: 12px;
}

.notification-message {
    margin: 4px 0;
    font-size: 14px;
    color: var(--ion-color-medium);
    line-height: 1.4;
}

.unread-badge {
    font-size: 10px;
    padding: 2px 8px;
    margin-top: 4px;
}

.post-thumbnail {
    width: 60px;
    height: 60px;
    margin-right: 8px;
    border-radius: 8px;
    overflow: hidden;
}

.post-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.notification-icon {
    display: flex;
    align-items: center;
    margin-left: 8px;
}

/* Animación para nuevas notificaciones */
@keyframes slideIn {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification-item.unread {
    animation: slideIn 0.3s ease-out;
}
</style>

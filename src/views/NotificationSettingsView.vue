<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/perfil"></ion-back-button>
                </ion-buttons>
                <ion-title>Configuración de Notificaciones</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <!-- Estado de las notificaciones push -->
            <ion-card>
                <ion-card-header>
                    <ion-card-title>
                        <ion-icon :icon="notificationsOutline" />
                        Notificaciones Push
                    </ion-card-title>
                </ion-card-header>

                <ion-card-content>
                    <ion-item v-if="!pushAvailable" lines="none">
                        <ion-label class="ion-text-wrap">
                            <p class="status-message warning">
                                Las notificaciones push solo están disponibles en dispositivos móviles.
                            </p>
                        </ion-label>
                    </ion-item>

                    <ion-item v-else-if="!pushEnabled" lines="none">
                        <ion-icon :icon="alertCircleOutline" slot="start" color="warning" />
                        <ion-label class="ion-text-wrap">
                            <h3>Notificaciones desactivadas</h3>
                            <p>Activa las notificaciones push para recibir actualizaciones en tiempo real.</p>
                        </ion-label>
                    </ion-item>

                    <ion-item v-else lines="none">
                        <ion-icon :icon="checkmarkCircleOutline" slot="start" color="success" />
                        <ion-label class="ion-text-wrap">
                            <h3>Notificaciones activadas</h3>
                            <p>Recibirás notificaciones de likes, comentarios y nuevos seguidores.</p>
                        </ion-label>
                    </ion-item>

                    <ion-button v-if="pushAvailable && !pushEnabled" expand="block" @click="enablePushNotifications"
                        class="ion-margin-top">
                        <ion-icon :icon="notificationsOutline" slot="start" />
                        Activar notificaciones push
                    </ion-button>

                    <ion-button v-if="pushAvailable && pushEnabled" expand="block" fill="outline" color="danger"
                        @click="disablePushNotifications" class="ion-margin-top">
                        <ion-icon :icon="notificationsOffOutline" slot="start" />
                        Desactivar notificaciones push
                    </ion-button>
                </ion-card-content>
            </ion-card>

            <!-- Preferencias de notificaciones -->
            <ion-card v-if="pushEnabled">
                <ion-card-header>
                    <ion-card-title>
                        <ion-icon :icon="settingsOutline" />
                        Preferencias
                    </ion-card-title>
                </ion-card-header>

                <ion-list>
                    <ion-item>
                        <ion-icon :icon="heart" slot="start" color="danger" />
                        <ion-label>
                            <h3>Likes</h3>
                            <p>Cuando alguien le da like a tu publicación</p>
                        </ion-label>
                        <ion-toggle v-model="preferences.likes" @ionChange="savePreferences" />
                    </ion-item>

                    <ion-item>
                        <ion-icon :icon="chatbubble" slot="start" color="primary" />
                        <ion-label>
                            <h3>Comentarios</h3>
                            <p>Cuando alguien comenta en tu publicación</p>
                        </ion-label>
                        <ion-toggle v-model="preferences.comments" @ionChange="savePreferences" />
                    </ion-item>

                    <ion-item>
                        <ion-icon :icon="personAdd" slot="start" color="success" />
                        <ion-label>
                            <h3>Nuevos seguidores</h3>
                            <p>Cuando alguien empieza a seguirte</p>
                        </ion-label>
                        <ion-toggle v-model="preferences.follows" @ionChange="savePreferences" />
                    </ion-item>

                    <ion-item lines="none">
                        <ion-icon :icon="musicalNotes" slot="start" color="medium" />
                        <ion-label>
                            <h3>Sonido</h3>
                            <p>Reproducir sonido con las notificaciones</p>
                        </ion-label>
                        <ion-toggle v-model="preferences.sound" @ionChange="savePreferences" />
                    </ion-item>
                </ion-list>
            </ion-card>

            <!-- Canales de notificación (solo Android) -->
            <ion-card v-if="pushEnabled && isAndroid && channels.length > 0">
                <ion-card-header>
                    <ion-card-title>
                        <ion-icon :icon="layersOutline" />
                        Canales de notificación
                    </ion-card-title>
                    <ion-card-subtitle>Solo en Android</ion-card-subtitle>
                </ion-card-header>

                <ion-list>
                    <ion-item v-for="channel in channels" :key="channel.id">
                        <ion-label>
                            <h3>{{ channel.name }}</h3>
                            <p>{{ channel.description }}</p>
                        </ion-label>
                        <ion-badge slot="end" :color="getImportanceBadgeColor(channel.importance)">
                            Nivel {{ channel.importance }}
                        </ion-badge>
                    </ion-item>
                </ion-list>

                <ion-card-content>
                    <ion-button expand="block" fill="outline" @click="createDefaultChannel">
                        <ion-icon :icon="addCircleOutline" slot="start" />
                        Crear canal personalizado
                    </ion-button>
                </ion-card-content>
            </ion-card>

            <!-- Notificaciones entregadas -->
            <ion-card v-if="pushEnabled && deliveredNotifications.length > 0">
                <ion-card-header>
                    <ion-card-title>
                        <ion-icon :icon="listOutline" />
                        Notificaciones recientes
                    </ion-card-title>
                </ion-card-header>

                <ion-list>
                    <ion-item v-for="notification in deliveredNotifications" :key="notification.id">
                        <ion-label class="ion-text-wrap">
                            <h3>{{ notification.title }}</h3>
                            <p>{{ notification.body }}</p>
                        </ion-label>
                    </ion-item>
                </ion-list>

                <ion-card-content>
                    <ion-button expand="block" fill="outline" color="danger" @click="clearAllNotifications">
                        <ion-icon :icon="trashOutline" slot="start" />
                        Limpiar todas
                    </ion-button>
                </ion-card-content>
            </ion-card>

            <!-- Información del dispositivo -->
            <ion-card v-if="pushEnabled">
                <ion-card-header>
                    <ion-card-title>
                        <ion-icon :icon="phonePortraitOutline" />
                        Información del dispositivo
                    </ion-card-title>
                </ion-card-header>

                <ion-card-content>
                    <ion-list lines="none">
                        <ion-item>
                            <ion-label>
                                <p>Plataforma</p>
                                <h3>{{ platform }}</h3>
                            </ion-label>
                        </ion-item>
                        <ion-item>
                            <ion-label>
                                <p>Token del dispositivo</p>
                                <h3 class="token-text">{{ deviceToken || 'No disponible' }}</h3>
                            </ion-label>
                            <ion-button v-if="deviceToken" slot="end" fill="clear" @click="copyToken">
                                <ion-icon :icon="copyOutline" />
                            </ion-button>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>
        </ion-content>
    </ion-page>
</template>

<script setup>
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonToggle,
    IonBadge,
    toastController,
    alertController
} from '@ionic/vue';
import {
    notificationsOutline,
    notificationsOffOutline,
    settingsOutline,
    heart,
    chatbubble,
    personAdd,
    musicalNotes,
    layersOutline,
    listOutline,
    phonePortraitOutline,
    addCircleOutline,
    trashOutline,
    copyOutline,
    checkmarkCircleOutline,
    alertCircleOutline
} from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { Clipboard } from '@capacitor/clipboard';

// Estado
const pushAvailable = ref(false);
const pushEnabled = ref(false);
const platform = ref('web');
const deviceToken = ref(null);
const channels = ref([]);
const deliveredNotifications = ref([]);
const isAndroid = ref(false);

const preferences = ref({
    likes: true,
    comments: true,
    follows: true,
    sound: true
});

// Habilitar notificaciones push
const enablePushNotifications = async () => {
    try {
        // CRÍTICO: Pasar requestPermission = true para solicitar permisos
        await pushNotificationsService.initialize(true);
        pushEnabled.value = true;

        showToast('Notificaciones push activadas', 'success');

        // Cargar información adicional
        await loadDeviceInfo();
    } catch (error) {
        console.error('Error al activar notificaciones:', error);

        if (error.message.includes('denied') || error.message.includes('permission')) {
            showAlert(
                'Permisos denegados',
                'Has denegado los permisos de notificación. Por favor, actívalos en la configuración de tu dispositivo.'
            );
        } else if (error.message.includes('Silently aborting')) {
            // Error esperado cuando no se ha dado permiso desde el banner
            console.log('Usuario no ha dado permiso desde banner UI');
        } else {
            showToast('Error al activar notificaciones: ' + error.message, 'danger');
        }
    }
};

// Desactivar notificaciones push
const disablePushNotifications = async () => {
    const alert = await alertController.create({
        header: '¿Desactivar notificaciones?',
        message: 'Ya no recibirás notificaciones push de la aplicación.',
        buttons: [
            {
                text: 'Cancelar',
                role: 'cancel'
            },
            {
                text: 'Desactivar',
                role: 'destructive',
                handler: async () => {
                    try {
                        await pushNotificationsService.unregister();
                        pushEnabled.value = false;
                        deviceToken.value = null;
                        channels.value = [];
                        deliveredNotifications.value = [];

                        showToast('Notificaciones push desactivadas', 'warning');
                    } catch (error) {
                        console.error('Error al desactivar notificaciones:', error);
                        showToast('Error al desactivar notificaciones', 'danger');
                    }
                }
            }
        ]
    });

    await alert.present();
};

// Guardar preferencias
const savePreferences = async () => {
    // Guardar en localStorage
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences.value));

    // Aquí podrías enviar las preferencias al backend
    // await api.post('/notifications/preferences', preferences.value);

    showToast('Preferencias guardadas', 'success');
};

// Cargar información del dispositivo
const loadDeviceInfo = async () => {
    platform.value = pushNotificationsService.getPlatform();
    isAndroid.value = platform.value === 'android';
    deviceToken.value = pushNotificationsService.currentToken;

    // Cargar canales (solo Android)
    if (isAndroid.value) {
        channels.value = await pushNotificationsService.listChannels();
    }

    // Cargar notificaciones entregadas
    deliveredNotifications.value = await pushNotificationsService.getDeliveredNotifications();
};

// Crear canal personalizado
const createDefaultChannel = async () => {
    try {
        await pushNotificationsService.createChannel({
            id: 'sivar-social-alerts',
            name: 'Alertas Importantes',
            description: 'Notificaciones importantes de SivarSocial',
            importance: 5,
            sound: 'default',
            vibration: true,
            lights: true,
            lightColor: '#FF0000'
        });

        // Recargar canales
        channels.value = await pushNotificationsService.listChannels();

        showToast('Canal creado exitosamente', 'success');
    } catch (error) {
        console.error('Error al crear canal:', error);
        showToast('Error al crear canal', 'danger');
    }
};

// Limpiar todas las notificaciones
const clearAllNotifications = async () => {
    try {
        await pushNotificationsService.removeAllDeliveredNotifications();
        deliveredNotifications.value = [];
        showToast('Notificaciones limpiadas', 'success');
    } catch (error) {
        console.error('Error al limpiar notificaciones:', error);
        showToast('Error al limpiar notificaciones', 'danger');
    }
};

// Copiar token al portapapeles
const copyToken = async () => {
    try {
        await Clipboard.write({
            string: deviceToken.value
        });
        showToast('Token copiado al portapapeles', 'success');
    } catch (error) {
        console.error('Error al copiar token:', error);
        showToast('Error al copiar token', 'danger');
    }
};

// Obtener color del badge según importancia
const getImportanceBadgeColor = (importance) => {
    if (importance >= 4) return 'danger';
    if (importance >= 3) return 'warning';
    return 'medium';
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

// Mostrar alerta
const showAlert = async (header, message) => {
    const alert = await alertController.create({
        header,
        message,
        buttons: ['OK']
    });
    await alert.present();
};

// Lifecycle
onMounted(async () => {
    // Verificar disponibilidad
    pushAvailable.value = pushNotificationsService.isAvailable();

    console.log('[NotificationSettings] Push available:', pushAvailable.value);
    console.log('[NotificationSettings] Push initialized:', pushNotificationsService.isInitialized);

    pushEnabled.value = pushNotificationsService.isInitialized;

    if (pushEnabled.value) {
        await loadDeviceInfo();
    }

    // Cargar preferencias guardadas
    const savedPreferences = localStorage.getItem('notificationPreferences');
    if (savedPreferences) {
        preferences.value = JSON.parse(savedPreferences);
    }
});
</script>

<style scoped>
ion-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

ion-item ion-icon {
    font-size: 24px;
}

.status-message {
    margin: 0;
    padding: 12px;
    border-radius: 8px;
    background: var(--ion-color-light);
}

.status-message.warning {
    background: var(--ion-color-warning-tint);
    color: var(--ion-color-warning-contrast);
}

.token-text {
    font-size: 11px;
    word-break: break-all;
    color: var(--ion-color-medium);
    font-family: monospace;
}

ion-card {
    margin: 16px 0;
}

ion-list {
    background: transparent;
}
</style>

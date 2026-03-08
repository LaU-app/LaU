<template>
    <ion-page>
        <ion-header class="ion-no-border">
            <ion-toolbar>
                <ion-title>Mensajes</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="openNewChatModal">
                        <ion-icon :icon="createOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="chat-list-content">

            <div v-if="favorites.length > 0" class="favorites-section">
                <div class="favorites-label">Favoritos</div>
                <div class="favorites-scroll">
                    <div v-for="fav in favorites" :key="fav.id" class="favorite-item" @click="openChat(fav)">
                        <ion-avatar class="fav-avatar-container">
                            <img v-if="fav.imagen_url" :src="fav.imagen_url" />
                            <ion-icon v-else :icon="personCircle" class="fav-avatar-icon"></ion-icon>
                        </ion-avatar>
                        <span class="fav-name">{{ fav.name.split(' ')[0] }}</span>
                    </div>
                </div>
            </div>

            <div class="search-wrapper">
                <ion-searchbar placeholder="Buscar" class="custom-searchbar"></ion-searchbar>
            </div>

            <div class="messages-list">
                <div class="list-label" v-if="favorites.length > 0">Mensajes</div>

                <div v-for="contact in contacts" :key="contact.id" class="chat-item" @click="openChat(contact)">
                    <ion-avatar class="chat-item-avatar">
                        <img v-if="contact.imagen_url" :src="getFullImageUrl(contact.imagen_url)" />
                        <ion-icon v-else :icon="personCircle" class="chat-avatar-icon"></ion-icon>
                        <span v-if="contact.is_online" class="online-dot"></span>
                    </ion-avatar>

                    <div class="chat-item-content">
                        <div class="chat-item-header">
                            <h3 class="chat-name">{{ contact.name }}</h3>
                            <span class="chat-time">{{ contact.last_message_time }}</span>
                        </div>
                        <div class="chat-item-body">
                            <p class="last-message" :class="{ 'unread-text': contact.unread_count > 0 }">
                                {{ contact.last_message || 'Toca para iniciar chat' }}
                            </p>
                            <div v-if="contact.unread_count > 0" class="unread-badge">
                                {{ contact.unread_count }}
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="contacts.length === 0" class="empty-state">
                    <ion-icon :icon="chatbubbleEllipsesOutline" class="empty-icon"></ion-icon>
                    <p>No tienes mensajes recientes.</p>
                    <ion-button fill="solid" @click="openNewChatModal" class="start-chat-button">
                        Comenzar una conversación en LaU
                    </ion-button>
                </div>
            </div>

        </ion-content>

        <!-- Modal para seleccionar contacto mutual -->
        <ion-modal :is-open="isNewChatModalOpen" @didDismiss="closeNewChatModal">
            <ion-header>
                <ion-toolbar>
                    <ion-title>Nueva conversación</ion-title>
                    <ion-buttons slot="end">
                        <ion-button @click="closeNewChatModal">Cerrar</ion-button>
                    </ion-buttons>
                </ion-toolbar>
            </ion-header>
            <ion-content>
                <div v-if="loadingMutualFollowers" class="loading-container">
                    <ion-spinner></ion-spinner>
                    <p>Cargando contactos...</p>
                </div>

                <ion-list v-else>
                    <div v-if="mutualFollowers.length === 0" class="empty-state">
                        <p>No tienes seguidores mutuos para iniciar conversación.</p>
                        <p class="helper-text">Solo puedes chatear con usuarios que sigues y que te siguen.</p>
                    </div>

                    <ion-item v-for="user in mutualFollowers" :key="user.id" button @click="startChatWithUser(user)">
                        <ion-avatar slot="start">
                            <img v-if="user.imagen_url" :src="getFullImageUrl(user.imagen_url)" />
                            <ion-icon v-else :icon="personCircle" class="avatar-icon"></ion-icon>
                        </ion-avatar>
                        <ion-label>
                            <h3>{{ user.name }}</h3>
                            <p>@{{ user.username }}</p>
                        </ion-label>
                    </ion-item>
                </ion-list>
            </ion-content>
        </ion-modal>
    </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';
import { useRouter } from 'vue-router';
import chatService from '@/services/chatService';
import { followersService } from '@/services/followersService';
import { getFullImageUrl } from '@/utils/imageUtils';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonAvatar,
    IonIcon,
    IonButtons,
    IonButton,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner
} from '@ionic/vue';
import { personCircle, createOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
import { useDarkMode } from '@/utils/useDarkMode';

const { isDarkMode } = useDarkMode();

const contacts = ref([]);
const favorites = ref([]);
const router = useRouter();
let pollingInterval = null;

// Estado para modal de nueva conversación
const isNewChatModalOpen = ref(false);
const mutualFollowers = ref([]);
const loadingMutualFollowers = ref(false);

const loadData = async () => {
    try {
        // Cargar Contactos
        const resContacts = await chatService.getContacts();

        // Ordenar por último mensaje (más reciente primero)
        contacts.value = resContacts.data.sort((a, b) => {
            const dateA = a.last_message_date ? new Date(a.last_message_date) : new Date(0);
            const dateB = b.last_message_date ? new Date(b.last_message_date) : new Date(0);
            return dateB - dateA;
        });

        // Cargar Favoritos
        const resFavs = await chatService.getFavorites();

        // Limpiar datos de favoritos (asegurar que imagen_url vacía sea null)
        resFavs.data.forEach(fav => {
            if (!fav.imagen_url || fav.imagen_url.trim() === '') {
                fav.imagen_url = null;
            }
        });

        favorites.value = resFavs.data;
    } catch (error) {
        console.error("Error cargando chat list", error);
    }
};

const openChat = (user) => {
    router.push(`/chat/${user.id}`);
};

// Obtener seguidores mutuos (usuarios que yo sigo y que me siguen)
const getMutualFollowers = async () => {
    loadingMutualFollowers.value = true;
    try {
        // Obtener usuario actual
        const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (!currentUser.id) {
            console.error('[ChatList] No hay usuario autenticado');
            mutualFollowers.value = [];
            return;
        }

        // Obtener mis seguidores y a quienes sigo
        const [followersResult, followingResult] = await Promise.all([
            followersService.getFollowers(currentUser.id),
            followersService.getFollowing(currentUser.id)
        ]);

        if (!followersResult.success || !followingResult.success) {
            console.error('[ChatList] Error al obtener seguidores/siguiendo');
            mutualFollowers.value = [];
            return;
        }

        // Normalizar datos
        const followersData = followersResult.data.data || followersResult.data;
        const followingData = followingResult.data.data || followingResult.data;

        const followers = Array.isArray(followersData) ? followersData : [];
        const following = Array.isArray(followingData) ? followingData : [];

        // Obtener IDs de seguidores
        const followerIds = new Set(followers.map(f => {
            // Los seguidores pueden venir como { follower_id, user_id, id }
            return f.follower_id || f.user_id || f.id;
        }));

        // Filtrar usuarios que yo sigo Y que me siguen (mutuos)
        const mutuals = following.filter(user => {
            const userId = user.followed_id || user.user_id || user.id;
            return followerIds.has(userId);
        });

        console.log('[ChatList] Seguidores mutuos:', mutuals);
        mutualFollowers.value = mutuals;

    } catch (error) {
        console.error('[ChatList] Error obteniendo seguidores mutuos:', error);
        mutualFollowers.value = [];
    } finally {
        loadingMutualFollowers.value = false;
    }
};

// Abrir modal de nueva conversación
const openNewChatModal = async () => {
    isNewChatModalOpen.value = true;
    await getMutualFollowers();
};

// Cerrar modal de nueva conversación
const closeNewChatModal = () => {
    isNewChatModalOpen.value = false;
};

// Iniciar chat con usuario seleccionado
const startChatWithUser = (user) => {
    closeNewChatModal();
    const userId = user.followed_id || user.user_id || user.id;
    router.push(`/chat/${userId}`);
};

// Polling para actualizar lista cada 5 segundos
const startPolling = () => {
    pollingInterval = setInterval(() => {
        loadData();
    }, 5000);
};

const stopPolling = () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
};

onMounted(() => {
    loadData();
    startPolling();
});

onUnmounted(() => {
    stopPolling();
});

// Refrescar al volver a la vista (reactivo)
onActivated(() => {
    loadData();
    startPolling();
});

// Parar polling al salir de la vista
onDeactivated(() => {
    stopPolling();
});
</script>

<style scoped>
/* Header y Toolbar */
ion-header {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

ion-toolbar {
    --background: var(--ion-toolbar-background);
    --color: var(--ion-text-color);
    --border-width: 0;
}

ion-title {
    font-weight: 600;
    color: var(--ion-text-color);
}

.chat-list-content {
    --background: var(--ion-background-color);
}

/* Favoritos */
.favorites-section {
    padding: 15px 0 5px 15px;
    border-bottom: 1px solid var(--ion-border-color);
}

.favorites-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--ion-text-color);
    margin-bottom: 10px;
}

.favorites-scroll {
    display: flex;
    overflow-x: auto;
    gap: 15px;
    padding-bottom: 10px;
    scrollbar-width: none;
    /* Ocultar scrollbar */
}

.favorites-scroll::-webkit-scrollbar {
    display: none;
}

.favorite-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
}

.fav-avatar-container {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    border: 2px solid #2180f3;
    /* Azul Chatify */
    padding: 2px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.fav-avatar-container img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.fav-avatar-icon {
    width: 51px !important;
    height: 51px !important;
    font-size: 51px !important;
    color: var(--ion-color-medium);
    display: block !important;
}

.fav-name {
    font-size: 12px;
    color: var(--ion-text-color-secondary);
}

/* Buscador */
.search-wrapper {
    padding: 10px 15px;
}

.custom-searchbar {
    --background: var(--app-input-bg);
    --border-radius: 10px;
    --box-shadow: none;
    --color: var(--ion-text-color);
    --placeholder-color: var(--ion-text-color-secondary);
    padding: 0;
}

/* Lista Mensajes */
.messages-list {
    padding: 0 15px;
}

.list-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--ion-text-color);
    margin: 10px 0;
}

.chat-item {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid var(--ion-border-color);
    align-items: center;
    transition: background-color 0.2s ease;
}

.chat-item:active {
    background-color: var(--ion-background-hover);
}

.chat-item-avatar {
    position: relative;
    margin-right: 15px;
    width: 50px;
    height: 50px;
}

.chat-item-avatar img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
}

.chat-avatar-icon {
    width: 50px !important;
    height: 50px !important;
    font-size: 50px !important;
    color: var(--ion-color-medium);
}

.online-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #4caf50;
    border: 2px solid var(--ion-card-background);
    border-radius: 50%;
}

.chat-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.chat-item-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.chat-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--ion-text-color);
}

.chat-time {
    font-size: 11px;
    color: var(--ion-text-color-secondary);
}

.chat-item-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.last-message {
    margin: 0;
    font-size: 14px;
    color: var(--ion-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

.unread-text {
    font-weight: 600;
    color: var(--ion-text-color);
}

.unread-badge {
    background: #2180f3;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--ion-text-color-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.empty-state .empty-icon {
    width: 64px;
    height: 64px;
    font-size: 64px;
    color: var(--ion-color-medium);
}

.empty-state p {
    margin: 0;
    font-size: 16px;
}

.empty-state .start-chat-button {
    margin-top: 10px;
    --background: #8A2BE2;
    --background-hover: #7a24d1;
    --background-activated: #6a1eb8;
    --border-radius: 12px;
    --padding-start: 24px;
    --padding-end: 24px;
    --padding-top: 14px;
    --padding-bottom: 14px;
    font-weight: 600;
    font-size: 15px;
    text-transform: none;
    letter-spacing: 0.3px;
    box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);
    transition: all 0.3s ease;
}

.empty-state .start-chat-button:hover {
    box-shadow: 0 6px 16px rgba(138, 43, 226, 0.4);
    transform: translateY(-2px);
}

.empty-state .helper-text {
    font-size: 12px;
    margin-top: 10px;
    color: var(--ion-text-color-step-400);
}

/* Modal de nueva conversación */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 15px;
}

.loading-container p {
    color: var(--ion-text-color-secondary);
    margin: 0;
}

.avatar-icon {
    width: 40px !important;
    height: 40px !important;
    font-size: 40px !important;
    color: var(--ion-color-medium);
}

/* Estilos para avatares del modal de nueva conversación */
ion-modal ion-avatar {
    width: 50px;
    height: 50px;
    flex-shrink: 0;
}

ion-modal ion-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

ion-modal ion-item {
    --background: var(--ion-item-background);
    --color: var(--ion-text-color);
}

ion-modal ion-item h3 {
    color: var(--ion-text-color);
    font-weight: 500;
}

ion-modal ion-item p {
    color: var(--ion-text-color-secondary);
    font-size: 14px;
}
</style>
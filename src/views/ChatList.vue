<template>
    <ion-page>
        <ion-header class="ion-no-border">
            <ion-toolbar>
                <ion-title>Mensajes</ion-title>
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
                    <p>No tienes mensajes recientes.</p>
                </div>
            </div>

        </ion-content>
    </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';
import { useRouter } from 'vue-router';
import chatService from '@/services/chatService';
import { getFullImageUrl } from '@/utils/imageUtils';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonAvatar, IonIcon } from '@ionic/vue';
import { personCircle } from 'ionicons/icons';
import { useDarkMode } from '@/utils/useDarkMode';

const { isDarkMode } = useDarkMode();

const contacts = ref([]);
const favorites = ref([]);
const router = useRouter();
let pollingInterval = null;

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
    padding: 40px;
    color: var(--ion-text-color-secondary);
}
</style>
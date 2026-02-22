<template>
    <ion-page>
        <ion-header class="ion-no-border">
            <ion-toolbar class="chatify-toolbar">
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/chat" text=""
                        :color="isDarkMode ? 'light' : 'dark'"></ion-back-button>
                </ion-buttons>

                <ion-title @click="toggleInfoPanel(true)" class="chat-header-title">
                    <div class="header-content">
                        <ion-avatar class="header-avatar">
                            <img :src="chatUserAvatar || '/assets/img/default-user.png'" />
                        </ion-avatar>
                        <div class="header-text">
                            <span class="user-name">{{ chatUserName }}</span>
                            <div v-if="isPeerTyping" class="typing-status">Escribiendo...</div>
                        </div>
                    </div>
                </ion-title>

                <ion-buttons slot="end">
                    <ion-button @click="toggleInfoPanel(true)" color="medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="chat-content" ref="contentRef" :scroll-events="true">
            <div v-if="isLoading" class="loading-container">
                <ion-spinner name="crescent" color="primary"></ion-spinner>
            </div>

            <div class="messages-container" :class="{ 'visible': !isLoading }">
                <div v-for="msg in messages" :key="msg.id" class="message-wrapper"
                    :class="{ 'my-message': isMe(msg.from_id), 'other-message': !isMe(msg.from_id) }">

                    <div class="message-card">
                        <div v-if="msg.attachment || msg.localImage" class="message-attachment">
                            <img :src="msg.localImage || getAttachmentUrl(msg)" @load="scrollToBottom(0)" />
                        </div>

                        <div v-if="msg.body" class="message-text">
                            {{ msg.body }}
                        </div>

                        <div class="message-meta">
                            <span class="time">{{ formatDate(msg.created_at) }}</span>
                            <span v-if="isMe(msg.from_id)" class="ticks">
                                <svg v-if="msg.seen == 1" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" class="feather feather-check">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </span>
                        </div>
                    </div>

                </div>

                <div v-if="isPeerTyping" class="message-wrapper other-message">
                    <div class="message-card typing-card">
                        <div class="typing-dots"><span></span><span></span><span></span></div>
                    </div>
                </div>
            </div>
        </ion-content>

        <ion-footer class="chat-footer">
            <ion-toolbar>
                <div v-if="filePreview" slot="top" class="upload-preview-bar">
                    <img :src="filePreview" class="preview-thumb" />
                    <ion-button fill="clear" color="danger" @click="clearFile">
                        <ion-icon name="close-circle"></ion-icon> X
                    </ion-button>
                </div>

                <div class="input-area">
                    <ion-button fill="clear" @click="triggerFileUpload" class="icon-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48">
                            </path>
                        </svg>
                    </ion-button>
                    <input type="file" ref="fileInput" @change="handleFileChange" hidden accept="image/*" />

                    <input v-model="newMessage" placeholder="Escribe un mensaje..." @keyup.enter="sendMessage"
                        @input="handleTyping" class="native-input" />

                    <ion-button @click="sendMessage" fill="clear" class="send-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="icon icon-tabler icons-tabler-outline icon-tabler-send">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M10 14l11 -11" />
                            <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                        </svg>
                    </ion-button>
                </div>
            </ion-toolbar>
        </ion-footer>

        <ion-modal :is-open="showInfo" @didDismiss="toggleInfoPanel(false)" :initial-breakpoint="0.85"
            :breakpoints="[0, 0.85]">
            <ion-content class="info-panel">
                <div class="info-header-centered">
                    <div class="big-avatar"
                        :style="{ backgroundImage: 'url(' + (chatUserAvatar || '/assets/img/default-user.png') + ')' }">
                    </div>
                    <h2>{{ chatUserName }}</h2>
                    <div class="action-buttons">
                        <div class="action-btn" @click="toggleFavorite">
                            <svg v-if="isFavorite" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                viewBox="0 0 24 24" fill="gold" stroke="gold" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <polygon
                                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                                </polygon>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <polygon
                                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                                </polygon>
                            </svg>
                            <span>Favorito</span>
                        </div>
                        <div class="action-btn" @click="goToProfile">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Perfil</span>
                        </div>
                    </div>
                </div>
                <div class="shared-files-section">
                    <h3>Archivos Compartidos</h3>
                    <div v-if="sharedPhotos.length > 0" class="files-grid">
                        <div v-for="photo in sharedPhotos" :key="photo.id" class="file-item">
                            <img :src="getFullUrl(photo.url)" />
                        </div>
                    </div>
                    <div v-else class="no-files">
                        <p>No hay archivos compartidos</p>
                    </div>
                </div>
            </ion-content>
        </ion-modal>
    </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import chatService from '@/services/chatService';
import { AuthService } from '@/services/auth';
import { BASE_URL } from '@/services/api';
import api from '@/services/api';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonFooter, IonButton, IonModal, IonAvatar, IonIcon, IonSpinner } from '@ionic/vue';
import { useDarkMode } from '@/utils/useDarkMode';

const { isDarkMode } = useDarkMode();

// FUNCIÓN HELPER PARA COMPLETAR URLS
const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
};

const getAttachmentUrl = (msg) => {
    // Si la API ya devolvió la ruta relativa
    if (msg.attachment_url) return getFullUrl(msg.attachment_url);
    // Fallback para mensajes viejos en Pusher
    if (msg.attachment && typeof msg.attachment === 'string') {
        try {
            const att = JSON.parse(msg.attachment);
            return `${BASE_URL}/storage/attachments/${att.new_name}`;
        } catch (e) { return null; }
    }
    return null;
};

// ... HOOKS y VARIABLES (Igual que antes) ...
const useChat = (friendId, currentUserId, messagesRef) => {
    const isPeerTyping = ref(false);
    let typingTimeout = null;
    const subscribe = () => {
        if (!currentUserId.value) return;
        const myChannel = `chatify.${currentUserId.value}`;
        window.Echo.private(myChannel)
            .listen('.messaging', (e) => {
                if (String(e.from_id) === String(friendId)) {
                    messagesRef.value.push(e);
                    isPeerTyping.value = false;
                    chatService.makeSeen(friendId);
                    scrollToBottom(300);
                }
            })
            .listen('.client-typing', (e) => {
                if (String(e.from_id) === String(friendId)) {
                    isPeerTyping.value = true;
                    if (typingTimeout) clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => { isPeerTyping.value = false; }, 2500);
                    scrollToBottom(300);
                }
            })
            .listen('.client-seen', (e) => {
                if (e.seen) {
                    messagesRef.value.forEach(msg => {
                        if (String(msg.to_id) === String(friendId)) msg.seen = 1;
                    });
                }
            });
    };
    const unsubscribe = () => { if (currentUserId.value) window.Echo.leave(`chatify.${currentUserId.value}`); };
    return { isPeerTyping, subscribe, unsubscribe };
};

const route = useRoute();
const router = useRouter();
const contentRef = ref(null);
const fileInput = ref(null);
const messages = ref([]);
const newMessage = ref('');
const fileToUpload = ref(null);
const filePreview = ref(null);
const isLoading = ref(true);
const userId = route.params.id;
const myId = ref(null);
const chatUserName = ref('');
const chatUserUsername = ref('');
const chatUserAvatar = ref('');
const showInfo = ref(false);
const isFavorite = ref(false);
const sharedPhotos = ref([]);

const { isPeerTyping, subscribe, unsubscribe } = useChat(userId, myId, messages);

const scrollToBottom = (duration = 300) => { nextTick(() => { if (contentRef.value) contentRef.value.$el.scrollToBottom(duration); }); };

const loadData = async () => {
    isLoading.value = true;
    try {
        const res = await chatService.getMessages(userId);
        messages.value = res.data;
        const contacts = await chatService.getContacts();
        const user = contacts.data.find(c => String(c.id) === String(userId));
        if (user) {
            chatUserName.value = user.name;
            chatUserUsername.value = user.username;
            chatUserAvatar.value = user.imagen_url;
        }
        await chatService.makeSeen(userId);
        const favRes = await chatService.checkFavorite(userId);
        isFavorite.value = favRes.data.is_favorite;

        await nextTick();
        if (contentRef.value) await contentRef.value.$el.scrollToBottom(0);
        setTimeout(() => { isLoading.value = false; }, 100);
    } catch (e) { console.error(e); isLoading.value = false; }
};

const sendMessage = async () => {
    if (!newMessage.value.trim() && !fileToUpload.value) return;
    const textToSend = newMessage.value;
    const fileToSend = fileToUpload.value;
    const localPreviewUrl = filePreview.value;
    newMessage.value = '';
    fileToUpload.value = null;
    filePreview.value = null;
    try {
        const tempMsg = { id: Date.now(), body: textToSend, from_id: myId.value, seen: 0, created_at: new Date().toISOString(), localImage: localPreviewUrl };
        messages.value.push(tempMsg);
        scrollToBottom(300);
        await chatService.sendMessage(userId, textToSend, fileToSend);
        if (fileToSend) setTimeout(() => loadData(), 500);
    } catch (error) { console.error(error); }
};

const triggerFileUpload = () => fileInput.value.click();
const handleFileChange = (event) => { const file = event.target.files[0]; if (file) { fileToUpload.value = file; filePreview.value = URL.createObjectURL(file); } };
const clearFile = () => { fileToUpload.value = null; filePreview.value = null; };
const loadSharedInfo = async () => { try { const res = await chatService.getSharedPhotos(userId); sharedPhotos.value = res.data; } catch (e) { console.error(e); } };
const toggleInfoPanel = (state) => { showInfo.value = state; if (state) loadSharedInfo(); };
const toggleFavorite = async () => { try { const res = await chatService.toggleFavorite(userId); isFavorite.value = (res.data.status === 'added'); } catch (e) { console.error(e); } };
const goToProfile = () => { showInfo.value = false; if (chatUserUsername.value) { router.push(`/tabs/perfil/${chatUserUsername.value}`); } };
let lastTypingTime = 0;
const handleTyping = () => { const now = Date.now(); if (now - lastTypingTime > 1500) { api.post('/chat/typing', { id: userId }); lastTypingTime = now; } };
const isMe = (fromId) => String(fromId) === String(myId.value);
const formatDate = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

onMounted(async () => { const user = AuthService.getUser(); if (user) { myId.value = user.id; subscribe(); } await loadData(); });
onUnmounted(() => unsubscribe());
</script>

<style scoped>
/* Tus estilos (Sin cambios, mantener igual) */
.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}

.messages-container {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    opacity: 0;
    transition: opacity 0.2s ease-in;
}

.messages-container.visible {
    opacity: 1;
}

.chat-content {
    --background: var(--ion-background-color);
}

.chatify-toolbar {
    --background: var(--ion-toolbar-background);
    --border-width: 0 0 1px 0;
    --border-color: var(--ion-border-color);
}

.chat-header-title {
    padding: 0 8px;
}

.header-content {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
}

.header-avatar {
    width: 35px;
    height: 35px;
    flex-shrink: 0;
}

.header-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.header-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.user-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--ion-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    max-width: 100%;
}

.active-status,
.typing-status {
    font-size: 11px;
    color: #2180f3;
}

.message-wrapper {
    display: flex;
    width: 100%;
}

.message-card {
    max-width: 75%;
    padding: 8px 12px;
    border-radius: 8px;
    position: relative;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.my-message {
    justify-content: flex-end;
}

.my-message .message-card {
    background: #2180f3;
    color: white;
    border-bottom-right-radius: 0;
}

.message-meta {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 4px;
    gap: 5px;
}

.message-meta .time {
    font-size: 10px;
    opacity: 0.8;
}

.message-meta .ticks {
    display: flex;
    align-items: center;
}

.message-meta .ticks svg {
    color: rgba(255, 255, 255, 0.8);
    width: 14px;
    height: 14px;
}

.other-message {
    justify-content: flex-start;
}

.other-message .message-card {
    background: var(--app-card);
    color: var(--ion-text-color);
    border-bottom-left-radius: 0;
    border: 1px solid var(--ion-border-color);
}

.other-message .message-meta .time {
    color: var(--ion-text-color-secondary);
}

.message-attachment img {
    border-radius: 4px;
    max-width: 100%;
    margin-bottom: 5px;
}

.chat-footer ion-toolbar {
    --background: var(--ion-toolbar-background);
    --border-width: 1px 0 0 0;
    --border-color: var(--ion-border-color);
    padding: 5px;
}

.input-area {
    display: flex;
    align-items: center;
    gap: 8px;
}

.native-input {
    flex: 1;
    border: none;
    background: var(--app-input-bg);
    color: var(--ion-text-color);
    padding: 10px 15px;
    border-radius: 20px;
    outline: none;
    font-size: 15px;
}

.native-input::placeholder {
    color: var(--ion-text-color-secondary);
}

.icon-btn {
    color: var(--ion-text-color-secondary);
    margin: 0;
}

.send-btn {
    color: #2180f3;
}

.upload-preview-bar {
    padding: 10px;
    background: var(--app-input-bg);
    border-bottom: 1px solid var(--ion-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preview-thumb {
    height: 60px;
    border-radius: 5px;
}

.info-panel {
    --background: var(--ion-background-color);
}

.info-header-centered {
    padding: 30px 0;
    text-align: center;
    background: var(--ion-card-background);
    border-bottom: 1px solid var(--ion-border-color);
}

.big-avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    margin: 0 auto 15px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 15px;
}

.action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--ion-text-color);
    font-size: 12px;
}

.action-btn svg {
    margin-bottom: 5px;
    color: #2180f3;
}

.shared-files-section {
    padding: 20px;
}

.files-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
}

.file-item img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 4px;
}

/* Typing indicator */
.typing-card {
    background: var(--app-card) !important;
    border: 1px solid var(--ion-border-color);
    padding: 12px 16px !important;
}

.typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ion-text-color-secondary);
    animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing-bounce {

    0%,
    80%,
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
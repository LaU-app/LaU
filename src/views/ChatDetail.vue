<template>
    <ion-page>
        <ion-header class="ion-no-border transparent-header pt-safe-top">

            <div class="header-gradient-mask"></div>

            <div class="floating-header-container" :class="{ 'is-glass-header': isGlassMode }">

                <!-- Burbuja: Botón de volver circular -->
                <button class="header-bubble action-bubble" @click="router.push('/tabs/chat')" aria-label="Volver">
                    <ion-icon :icon="arrowBack"></ion-icon>
                </button>

                <!-- Burbuja: Info del contacto (avatar + nombre + estado) -->
                <div class="header-bubble info-bubble" @click="toggleInfoPanel(true)">
                    <ion-avatar class="header-avatar">
                        <img v-if="chatUserAvatar" :src="chatUserAvatar" />
                        <ion-icon v-else :icon="personCircle" class="header-avatar-icon"></ion-icon>
                    </ion-avatar>
                    <div class="header-user-text">
                        <span class="header-name">{{ chatUserName }}</span>
                        <span v-if="isPeerTyping" class="header-username typing-status">Escribiendo...</span>
                    </div>
                </div>

                <!-- Burbuja: Botón de información circular -->
                <button class="header-bubble action-bubble" @click="toggleInfoPanel(true)" aria-label="Información">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>

            </div>
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

                        <!-- Producto citado: el enlace se muestra como tarjeta encima del texto -->
                        <ProductLinkPreview v-if="productIn(msg)" :product-id="productIn(msg).id" variant="bubble"
                            @open="openProduct" />

                        <div v-if="productIn(msg) ? productIn(msg).rest : msg.body" class="message-text">
                            {{ productIn(msg) ? productIn(msg).rest : msg.body }}
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

        <!-- <ion-footer class="chat-footer">
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
        </ion-footer> -->

        <ion-footer class="ion-no-border transparent-footer">
            <div class="input-gradient-mask"></div>

            <div class="floating-chat-input" :class="{ 'is-glass': isGlassMode }">
                
                <LiquidGlassBox 
                    v-if="isGlassMode"
                    class="chat-glass-bg" 
                    :height="200" 
                    :depth="7" 
                    :radius="30"
                    :strength="100"
                    :chromaticAberration="3" 
                    :blur="1.8"
                    :width="calculatedBarWidth" 
                />

                <div class="chat-input-content">
                    <!-- Producto del Marketplace sobre el que se va a preguntar -->
                    <ProductLinkPreview v-if="attachedProductId" :product-id="attachedProductId" variant="composer"
                        removable @remove="detachProduct" @open="openProduct" />

                    <div v-if="filePreview" class="upload-preview-bar">
                        <img :src="filePreview" class="preview-thumb" />
                        <ion-button fill="clear" color="danger" @click="clearFile">
                            <ion-icon name="close-circle"></ion-icon> X
                        </ion-button>
                    </div>

                    <div class="input-area">
                        <ion-button fill="clear" @click="triggerFileUpload" class="icon-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                        </ion-button>
                        <input type="file" ref="fileInput" @change="handleFileChange" hidden accept="image/*" />

                        <textarea
                            v-model="newMessage"
                            ref="textareaRef"
                            placeholder="Escribe un mensaje..."
                            @keydown.enter.exact.prevent="sendMessage"
                            @input="handleTyping(); autoGrowTextarea()"
                            rows="1"
                            class="native-input auto-expand"
                        ></textarea>

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
                </div>
            </div>
        </ion-footer>

        <ion-modal :is-open="showInfo" @didDismiss="toggleInfoPanel(false)" :initial-breakpoint="0.85"
            :breakpoints="[0, 0.85]">
            <ion-content class="info-panel">
                <div class="info-header-centered">
                    <ion-avatar v-if="chatUserAvatar" class="big-avatar"
                        :style="{ backgroundImage: 'url(' + chatUserAvatar + ')' }">
                    </ion-avatar>
                    <ion-icon v-else :icon="personCircle" class="big-avatar-icon"></ion-icon>
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
import { IonPage, IonHeader, IonContent, IonFooter, IonButton, IonModal, IonAvatar, IonIcon, IonSpinner } from '@ionic/vue';
import { useDarkMode } from '@/utils/useDarkMode';
import { personCircle, arrowBack } from 'ionicons/icons'; 

import LiquidGlassBox from '@/components/LiquidGlassBox.vue';
import ProductLinkPreview from '@/components/marketplace/ProductLinkPreview.vue';
import { extractProductLink, productUrl } from '@/utils/productLink';
import { useGlassMode } from '@/utils/useGlassMode';
import { computed } from 'vue'; // Asegúrate de importar 'computed'

const { isDarkMode } = useDarkMode();
const { isGlassMode } = useGlassMode(); // <-- Extraemos la variable global


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
const chatUserName = ref(null);
const chatUserUsername = ref('');
const chatUserAvatar = ref(null);
const showInfo = ref(false);
const isFavorite = ref(false);
const sharedPhotos = ref([]);
const textareaRef = ref(null); 

const { isPeerTyping, subscribe, unsubscribe } = useChat(userId, myId, messages);

const scrollToBottom = (duration = 300) => { nextTick(() => { if (contentRef.value) contentRef.value.$el.scrollToBottom(duration); }); };

const loadData = async () => {
    isLoading.value = true;
    try {
        const res = await chatService.getMessages(userId);
        messages.value = res.data;

        // Intentar obtener datos del usuario desde contactos
        const contacts = await chatService.getContacts();
        let user = contacts.data.find(c => String(c.id) === String(userId));

        // Si no está en contactos, obtener datos directamente del usuario
        if (!user) {
            try {
                // La API responde { success, data }: se desenvuelve como en el resto de la app.
                const userRes = await api.get(`/users/${userId}`);
                user = userRes.data?.data || userRes.data;
                // Asegurar que tenga imagen_url
                if (user && !user.imagen_url && user.imagen) {
                    user.imagen_url = `${BASE_URL}/perfiles/${user.imagen}`;
                }
            } catch (err) {
                console.error('Error cargando datos del usuario:', err);
            }
        }

        if (user) {
            chatUserName.value = user.name || 'Usuario';
            chatUserUsername.value = user.username || '';
            chatUserAvatar.value = user.imagen_url;
        } else {
            // Fallback si no se pudo obtener el usuario
            chatUserName.value = 'Usuario';
            chatUserUsername.value = '';
            chatUserAvatar.value = null;
        }

        await chatService.makeSeen(userId);
        const favRes = await chatService.checkFavorite(userId);
        isFavorite.value = favRes.data.is_favorite;

        await nextTick();
        if (contentRef.value) await contentRef.value.$el.scrollToBottom(0);
        setTimeout(() => { isLoading.value = false; }, 100);
    } catch (e) { console.error(e); isLoading.value = false; }
};

// Producto del Marketplace adjunto al mensaje (viene de "Escribir al vendedor").
const attachedProductId = ref(Number(route.query.product) > 0 ? Number(route.query.product) : null);
const productIn = (msg) => extractProductLink(msg && msg.body);
const openProduct = (id) => router.push(`/tabs/marketplace/product/${id}`);
const detachProduct = () => {
    attachedProductId.value = null;
    router.replace({ query: {} });
};

const sendMessage = async () => {
    if (!newMessage.value.trim() && !fileToUpload.value && !attachedProductId.value) return;
    // El enlace del producto va al final del texto; la app lo dibuja como vista previa.
    const textToSend = [newMessage.value.trim(), attachedProductId.value ? productUrl(attachedProductId.value) : '']
        .filter(Boolean).join('\n');
    if (attachedProductId.value) detachProduct();
    const fileToSend = fileToUpload.value;
    const localPreviewUrl = filePreview.value;
    newMessage.value = '';
    fileToUpload.value = null;
    filePreview.value = null;

    nextTick(() => { // 👈 NUEVO: resetea altura del textarea
        if (textareaRef.value) textareaRef.value.style.height = 'auto';
    });

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

// Auto-crecimiento del textarea, con techo de altura antes de hacer scroll interno
const autoGrowTextarea = () => {
    nextTick(() => {
        const el = textareaRef.value;
        if (!el) return;
        el.style.height = 'auto'; // reset para medir el scrollHeight real
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'; // techo de 120px
    });
};

onMounted(async () => { 
  const user = AuthService.getUser(); 
  if (user) { 
    myId.value = user.id; 
    subscribe(); 
  } 
  await loadData();

  // Al llegar desde un producto se propone un primer mensaje; el estudiante puede editarlo.
  if (attachedProductId.value && !newMessage.value) {
    newMessage.value = 'Hola, me interesa este producto. ¿Sigue disponible?';
    autoGrowTextarea();
  }

  // Listener para notificaciones push de mensajes recibidos
  window.addEventListener('pushNotificationReceived', handlePushNotification);
});

onUnmounted(() => {
  unsubscribe();
  window.removeEventListener('pushNotificationReceived', handlePushNotification);
});

// Manejar notificación push de mensaje nuevo
const handlePushNotification = (event) => {
  const notification = event.detail;
  const data = notification.data || {};
  
  // Si la notificación es de un mensaje y es del usuario actual del chat
  if ((data.type === 'message' || data.type === 'chat') && 
      String(data.chat_user_id) === String(userId)) {
    console.log('Nuevo mensaje recibido en el chat actual');
    // Recargar mensajes
    loadData();
  }
};
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
    padding-top: calc(4.5rem + env(safe-area-inset-top, 0px)); /* 👈 NUEVO: espacio para el header flotante */
    padding-bottom: calc(5.5rem + env(safe-area-inset-bottom));
    
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

/* ==================================================
   HEADER FLOTANTE TIPO TELEGRAM (glass)
   ================================================== */
.transparent-header {
    background: transparent !important;
    position: absolute;
    top: 0; left: 0; right: 0;
    z-index: 100;
}

ion-header.transparent-header::after {
    display: none !important;
}

.floating-header-container {
    padding-top: calc(10px + env(safe-area-inset-top, 0px));
    padding-bottom: 10px;
    padding-left: 15px;
    padding-right: 15px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    pointer-events: none;
}

.header-bubble {
    background: var(--ion-card-background);
    border: 1px solid rgba(178, 178, 178, 0.15);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);

    pointer-events: auto;

    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease, border 0.3s ease;
}

.is-glass-header .header-bubble {
    background: rgba(var(--ion-color-light-rgb), 0.5);
    border: 0.5px solid rgba(255, 255, 255, 0.2);
}

.action-bubble {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    border: none;
    outline: none;
    color: var(--ion-color-dark);
}

.action-bubble ion-icon,
.action-bubble svg {
    font-size: 22px;
    color: inherit;
}

.action-bubble:active {
    transform: scale(0.95);
    opacity: 0.8;
}

.info-bubble {
    flex: 1;
    min-height: 44px;
    border-radius: 30px;
    padding: 4px 16px 4px 6px;
    justify-content: flex-start;
    overflow: hidden;
    gap: 10px;
    cursor: pointer;
}

.header-avatar {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
}

.header-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.header-avatar-icon {
    width: 34px !important;
    height: 34px !important;
    font-size: 34px !important;
    color: var(--ion-color-medium);
}

.header-user-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: left;
    min-width: 0;
    overflow: hidden;
}

.header-name {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.1;
    color: var(--ion-color-dark);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.header-username.typing-status {
    font-size: 0.75rem;
    color: #2180f3;
    line-height: 1.1;
}

.header-gradient-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: calc(75px + env(safe-area-inset-top, 0px));

    background: linear-gradient(
        to bottom,
        var(--ion-background-color) 0%,
        rgba(var(--ion-background-color-rgb), 0.7) 40%,
        rgba(var(--ion-background-color-rgb), 0.3) 70%,
        transparent 100%
    );

    pointer-events: none;
    z-index: -1;
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

.header-avatar-icon {
    width: 35px !important;
    height: 35px !important;
    font-size: 35px !important;
    color: var(--ion-color-medium);
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

/* ==================================================
   DISEÑO FLOTANTE DEL CHAT INPUT
   ================================================== */
ion-footer.transparent-footer {
    --background: transparent !important;
    background: transparent !important;
    --border-width: 0 !important;
    border: none !important;
    box-shadow: none !important;
    
    /* LA MAGIA: Esto hace que el footer flote sobre los mensajes */
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
}

.input-gradient-mask {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    /* Altura del degradado: cubre el espacio del footer y un poco más */
    height: calc(90px + env(safe-area-inset-bottom));
    
    /* El degradado de color sólido a transparente */
    background: linear-gradient(
        to top,
        var(--ion-background-color) 0%,
        rgba(var(--ion-background-color-rgb), 0.6) 40%,
        transparent 100%
    );
    
    /* Vital: que no bloquee los toques/clics a los últimos mensajes */
    pointer-events: none; 
    
    /* Z-index alto para estar sobre los mensajes, pero bajo el footer */
    z-index: 1; 
}

/* ==========================================
   1. ESTADO NORMAL (sin cristal)
   ========================================== */
.floating-chat-input {
    position: relative;
    z-index: 2;
    margin: 0 15px calc(15px + env(safe-area-inset-bottom)) 15px;
    border-radius: 30px;
    min-height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    border: 1px solid #b2b2b221;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    background: var(--ion-card-background);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    overflow: hidden;
    transition: background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease;
}

/* ==========================================
   2. ESTADO CRISTAL (Cuando se activa)
   ========================================== */
.floating-chat-input.is-glass {
    /* Igual que .floating-comment-bar.is-glass: apagamos TODO para dejar ver el SVG */
    background: transparent;
    border: none;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
}

/* El SVG de cristal líquido en el fondo */
.chat-glass-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    pointer-events: none;
    border-radius: 30px;
    background: transparent !important;

    height: 100% !important; /* 👈 antes: 200px fijo — ahora ocupa el contenedor real */

    transition: none !important;
    animation: none !important;
}

/* Contenido por encima del cristal */
.chat-input-content {
    position: relative;
    z-index: 1;
    width: 100%;
}

.input-area {
    display: flex;
    align-items: flex-end; /* 👈 antes: no estaba definido (default: center), ahora ancla abajo */
    gap: 8px;
    padding: 8px 15px;
}

.icon-btn,
.send-btn {
    padding-bottom: 4px; /* pequeño ajuste para que no queden pegados al borde inferior */
}

.icon-btn {
    --padding-start: 5px;
    --padding-end: 5px;
    color: var(--ion-text-color-secondary);
    margin: 0;
}

.send-btn {
    --padding-start: 5px;
    --padding-end: 5px;
    color: #2180f3;
    margin: 0;
}

/* El input ahora es transparente para dejar ver la pastilla de atrás */
.native-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--ion-text-color);
    padding: 10px 0;
    outline: none;
    font-size: 15px;

    /* 👇 NUEVO: necesario para que se comporte como textarea multilinea */
    resize: none;
    overflow-y: hidden; /* el JS cambia esto a auto cuando llega al techo */
    max-height: 120px;
    line-height: 1.3;
    font-family: inherit;
}

.native-input.auto-expand {
    overflow-y: auto; /* permite scroll interno una vez que supera 120px */
}

.native-input::placeholder {
    color: var(--ion-text-color-secondary);
}



/* ==================================================
   ✨ BORDE DE DESTELLO (Edge Glint) PARA EL CRISTAL ✨
   Mismo patrón que TabsPage/PostDetail: diagonal arriba-izq / abajo-der
   ================================================== */
.floating-chat-input.is-glass::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 30px;
    padding: 2.4px;
    pointer-events: none;
    z-index: 2;

    background: conic-gradient(
        from -45deg,
        rgba(0, 0, 0, 0.35) 0deg,
        rgba(0, 0, 0, 0.03) 60deg,
        rgba(0, 0, 0, 0.03) 150deg,
        rgba(0, 0, 0, 0.22) 180deg,
        rgba(0, 0, 0, 0.03) 210deg,
        rgba(0, 0, 0, 0.03) 300deg,
        rgba(0, 0, 0, 0.35) 360deg
    );

    -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
}

.floating-chat-input.is-glass {
    box-shadow:
        inset 0 0 10px rgba(0, 0, 0, 0.08),
        0 0 14px rgba(0, 0, 0, 0.06);
}

.ion-palette-dark .floating-chat-input.is-glass::after {
    background: conic-gradient(
        from -45deg,
        rgba(255, 255, 255, 0.5) 0deg,
        rgba(255, 255, 255, 0.02) 60deg,
        rgba(255, 255, 255, 0.02) 150deg,
        rgba(180, 200, 255, 0.4) 180deg,
        rgba(255, 255, 255, 0.02) 210deg,
        rgba(255, 255, 255, 0.02) 300deg,
        rgba(255, 255, 255, 0.5) 360deg
    );
}

.ion-palette-dark .floating-chat-input.is-glass {
    box-shadow:
        inset 0 0 10px rgba(255, 255, 255, 0.1),
        0 0 16px rgba(120, 160, 255, 0.12);
}

/* Colores del input/íconos sobre el cristal, mismo patrón que floating-comment-bar */
.floating-chat-input.is-glass .native-input {
    color: #1c1c1e;
}
.floating-chat-input.is-glass .native-input::placeholder {
    color: rgba(28, 28, 30, 0.5);
}
.floating-chat-input.is-glass .icon-btn {
    color: #3a3a3a;
}

.ion-palette-dark .floating-chat-input.is-glass .native-input {
    color: #ffffff;
}
.ion-palette-dark .floating-chat-input.is-glass .native-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
}
.ion-palette-dark .floating-chat-input.is-glass .icon-btn {
    color: #9ca3af;
}

/* send-btn siempre mantiene su color azul, con o sin cristal */
.floating-chat-input.is-glass .send-btn {
    color: #2180f3;
}

/* Barra de vista previa de imagen acoplada a la cápsula */
.upload-preview-bar {
    padding: 10px 20px;
    background: rgba(150, 150, 150, 0.1); 
    border-bottom: 1px solid rgba(150, 150, 150, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preview-thumb {
    height: 50px;
    border-radius: 8px;
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

.big-avatar-icon {
    width: 90px !important;
    height: 90px !important;
    font-size: 90px !important;
    color: var(--ion-color-medium);
    margin: 0 auto 15px;
    display: block;
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
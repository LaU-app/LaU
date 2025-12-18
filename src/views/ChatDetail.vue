<template>
    <ion-page>
        <ion-header class="ion-no-border">
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/chat" text=""></ion-back-button>
                </ion-buttons>
                <ion-title>
                    Chat
                    <div v-if="isPeerTyping" class="typing-status">escribiendo...</div>
                </ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="chat-content" ref="contentRef" :scroll-events="true">
            <div class="messages-container">
                <div v-for="msg in messages" :key="msg.id" class="message-wrapper"
                    :class="{ 'my-message': isMe(msg.from_id), 'other-message': !isMe(msg.from_id) }">

                    <div class="message-bubble">
                        {{ msg.body }}
                        <span class="message-time">{{ formatDate(msg.created_at) }}</span>
                    </div>

                </div>

                <div v-if="isPeerTyping" class="message-wrapper other-message typing-indicator-wrapper">
                    <div class="message-bubble typing-bubble">
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            </div>
        </ion-content>

        <ion-footer class="chat-footer">
            <ion-toolbar>
                <div class="input-wrapper">
                    <ion-input v-model="newMessage" placeholder="Escribe un mensaje..." @keyup.enter="sendMessage"
                        @ionInput="handleTyping" class="chat-input"></ion-input>

                    <ion-button @click="sendMessage" fill="clear" class="send-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M10 14l11 -11" />
                            <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                        </svg>
                    </ion-button>
                </div>
            </ion-toolbar>
        </ion-footer>
    </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import chatService from '@/services/chatService';
import { AuthService } from '@/services/auth';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonFooter, IonInput, IonButton } from '@ionic/vue';
import api from '@/services/api'; // Asegúrate de importar tu cliente axios

// === HOOK PERSONALIZADO: USE CHAT ===
const useChat = (friendId, currentUserId) => {
    const messages = ref([]);
    const isPeerTyping = ref(false);
    let typingTimeout = null;

    const subscribe = () => {
        if (!currentUserId.value) return;

        // Corregido: Sin el prefijo 'private-' extra
        const myChannel = `chatify.${currentUserId.value}`; 

        window.Echo.private(myChannel)
            .listen('.messaging', (e) => {
                if (String(e.from_id) === String(friendId)) {
                    messages.value.push(e);
                    // Si llega mensaje, quitar "escribiendo" inmediatamente
                    isPeerTyping.value = false;
                    if (typingTimeout) clearTimeout(typingTimeout);
                }
            })
            .listen('.client-typing', (e) => {
                if (String(e.from_id) === String(friendId)) {
                    isPeerTyping.value = true;
                    
                    // UX: Reducimos el tiempo de espera para que desaparezca más rápido
                    // si la persona deja de escribir
                    if (typingTimeout) clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => {
                        isPeerTyping.value = false;
                    }, 2500); // 2.5 segundos de tolerancia
                }
            });
    };

    const unsubscribe = () => {
        if (currentUserId.value) {
            window.Echo.leave(`chatify.${currentUserId.value}`);
        }
    };

    return { messages, isPeerTyping, subscribe, unsubscribe };
};

// === LOGICA DEL COMPONENTE ===
const route = useRoute();
const contentRef = ref(null);
const newMessage = ref('');
const userId = route.params.id; // ID del amigo
const myId = ref(null);

// Inicializar hook
const { messages, isPeerTyping, subscribe, unsubscribe } = useChat(userId, myId);

const scrollToBottom = () => {
    nextTick(() => {
        if (contentRef.value) contentRef.value.$el.scrollToPoint(0, 99999, 300);
    });
};

const loadMessages = async () => {
    try {
        const res = await chatService.getMessages(userId);
        messages.value = res.data;
        scrollToBottom();
    } catch (error) {
        console.error("Error cargando mensajes:", error);
    }
};

const sendMessage = async () => {
    if (!newMessage.value.trim()) return;

    const textToSend = newMessage.value;
    newMessage.value = '';

    try {
        // UI Optimista
        const tempMsg = {
            id: Date.now(),
            body: textToSend,
            from_id: myId.value,
            created_at: new Date().toISOString()
        };
        messages.value.push(tempMsg);
        scrollToBottom();

        await chatService.sendMessage(userId, textToSend);
    } catch (error) {
        console.error("Error enviando:", error);
    }
};

// Función para notificar que estoy escribiendo
// === LÓGICA DE ESCRIBIENDO (Throttle) ===
let lastTypingTime = 0; // Marca de tiempo del último envío
const THROTTLE_DELAY = 1500; // Enviar señal cada 1.5 segundos máx

const handleTyping = () => {
    const now = Date.now();
    
    // Si ha pasado más de 1.5s desde la última vez que avisamos, avisar de nuevo
    // O si es la primera vez (lastTypingTime es 0)
    if (now - lastTypingTime > THROTTLE_DELAY) {
        // Enviar INMEDIATAMENTE
        api.post('/chat/typing', { id: userId }); 
        lastTypingTime = now;
    }
};

const isMe = (fromId) => String(fromId) === String(myId.value);

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(async () => {
    const user = AuthService.getUser();
    if (user) {
        myId.value = user.id;
        // Iniciar suscripción una vez tenemos el ID
        subscribe();
    }
    await loadMessages();
});

onUnmounted(() => {
    unsubscribe();
});
</script>

<style scoped>
/* Tus estilos anteriores se mantienen igual... */
.chat-content {
    --background: #fbfbfb;
}

.messages-container {
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
}

.message-wrapper {
    display: flex;
    margin-bottom: 4px;
    width: 100%;
}

.message-bubble {
    max-width: 75%;
    padding: 10px 14px;
    font-size: 15px;
    position: relative;
    word-wrap: break-word;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-time {
    display: block;
    font-size: 10px;
    margin-top: 4px;
    opacity: 0.7;
    text-align: right;
}

.my-message {
    justify-content: flex-end;
}

.my-message .message-bubble {
    background: #2180f3;
    color: white;
    border-radius: 18px 18px 2px 18px;
    margin-right: 10px;
}

.my-message .message-time {
    color: rgba(255, 255, 255, 0.9);
}

.other-message {
    justify-content: flex-start;
}

.other-message .message-bubble {
    background: #ffffff;
    color: #333;
    border-radius: 18px 18px 18px 2px;
    margin-left: 10px;
}

.chat-footer ion-toolbar {
    --background: white;
    padding: 5px;
    border-top: 1px solid #eee;
}

.input-wrapper {
    display: flex;
    align-items: center;
    background: #f0f2f5;
    border-radius: 25px;
    padding: 2px 5px 2px 15px;
    margin: 5px;
}

.chat-input {
    --padding-start: 0;
    --background: transparent;
    margin-right: 10px;
}

.send-button {
    --color: #2180f3;
    margin: 0;
}

/* NUEVOS ESTILOS PARA TYPING */
.typing-status {
    font-size: 10px;
    color: var(--ion-color-medium);
    font-weight: normal;
    margin-top: -2px;
}

.typing-indicator-wrapper {
    margin-bottom: 10px;
}

.typing-bubble {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    min-width: 50px;
}

.typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
}

.typing-dots span {
    width: 6px;
    height: 6px;
    background-color: #999;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1);
    }
}
</style>
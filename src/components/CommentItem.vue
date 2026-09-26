<template>
    <div class="comment-container">
        <div class="comment-item">
            <ion-avatar class="comment-avatar">
                <img v-if="comment.user?.imagen_url" :src="getFullImageUrl(comment.user.imagen_url)"
                    :alt="comment.user?.name || 'Usuario'" @error="handleImageError" />
                <ion-icon v-else :icon="personCircle"></ion-icon>
            </ion-avatar>
            <div class="comment-content">
                <div class="comment-bubble">
                    <h4 class="comment-user">{{ comment.user?.name || 'Usuario' }}</h4>
                    <p class="comment-text">
                        <MentionTextRenderer :text="comment.comentario" />
                    </p>
                </div>

                <div class="comment-actions">
                    <p class="comment-meta">{{ timeAgo(comment.created_at) }}</p>

                    <ion-button fill="clear" size="small" class="reply-button" @click="emitReply">
                        Responder
                    </ion-button>
                </div>
            </div>
        </div>

        <div v-if="comment.children && comment.children.length > 0" 
             class="comment-replies"
             :class="{ 'max-depth-reached': depth >= 2 }">
             
            <CommentItem v-for="reply in comment.children" 
                :key="reply.id" 
                :comment="reply"
                :depth="depth + 1" 
                @reply="$emit('reply', $event)" />
        </div>
    </div>
</template>

<script setup>
import { IonAvatar, IonIcon, IonButton } from '@ionic/vue'
import { personCircle } from 'ionicons/icons'
import { timeAgo } from '@/utils/timeUtils';
import { getFullImageUrl } from '@/utils/imageUtils';
import MentionTextRenderer from './MentionTextRenderer.vue';
// Importación recursiva para poder usar el componente dentro de sí mismo
import CommentItem from './CommentItem.vue';

const props = defineProps({
    comment: {
        type: Object,
        required: true
    },
    // NUEVO: Contador de profundidad para saber qué tan anidados estamos
    depth: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits(['reply'])

const handleImageError = (event) => {
    if (event.target) {
        event.target.src = 'https://via.placeholder.com/36?text=User'
    }
}

const emitReply = () => {
    // Emitimos el objeto comentario actual para saber a quién responder
    emit('reply', props.comment)
}
</script>

<style scoped>
.comment-container {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.comment-item {
    display: flex;
    gap: 0.75rem;
    padding: 0 1rem;
    margin-bottom: 0.5rem;
}

.comment-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    margin-top: 0.25rem;
}

.comment-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.comment-avatar ion-icon {
    width: 100%;
    height: 100%;
}

.comment-content {
    flex: 1;
    min-width: 0;
}

.comment-bubble {
    background: var(--ion-color-light);
    border-radius: 16px;
    padding: 0.75rem 1rem;
}

.comment-user {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ion-color-dark);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.comment-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
    color: rgba(31, 41, 55, 0.95);
    word-wrap: break-word;
}

.comment-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.25rem;
    padding-left: 0.5rem;
}

.comment-meta {
    font-size: 0.75rem;
    color: var(--ion-color-medium);
    margin: 0;
}

.reply-button {
    --padding-start: 0;
    --padding-end: 0;
    --padding-top: 0;
    --padding-bottom: 0;
    height: auto;
    min-height: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: none;
    color: var(--ion-color-step-600);
}

/* Estilos para las respuestas anidadas */
.comment-replies {
    margin-left: 3rem;
    /* Sangría para las respuestas */
    border-left: 2px solid var(--ion-color-light-shade);
    padding-left: 0.5rem;
}

/* NUEVO: Si la profundidad es 1 o mayor, ya no empujamos más a la derecha */
.comment-replies.max-depth-reached {
    margin-left: 0;
    border-left: none;
    padding-left: 0;
}

/* Ajustes para modo oscuro */
.ion-palette-dark .comment-text {
    color: rgba(255, 255, 255, 0.95);
}
</style>
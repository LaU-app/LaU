<template>
    <div class="comment-item">
        <ion-avatar class="comment-avatar">
            <img v-if="comment.user?.imagen_url" :src="comment.user.imagen_url" :alt="comment.user?.name || 'Usuario'"
                @error="handleImageError" />
            <ion-icon v-else :icon="personCircle"></ion-icon>
        </ion-avatar>
        <div class="comment-content">
            <div class="comment-bubble">
                <h4 class="comment-user">{{ comment.user?.name || 'Usuario' }}</h4>
                <p class="comment-text">{{ comment.comentario }}</p>
            </div>
            <p class="comment-meta">{{ timeAgo(comment.created_at) }}</p>
        </div>
    </div>
</template>

<script setup>
import { IonAvatar, IonIcon } from '@ionic/vue'
import { personCircle } from 'ionicons/icons'
import { timeAgo } from '@/utils/timeUtils'

defineProps({
    comment: {
        type: Object,
        required: true
    }
})

const handleImageError = (event) => {
    if (event.target) {
        event.target.src = 'https://via.placeholder.com/36?text=User'
    }
}
</script>

<style scoped>
.comment-item {
    display: flex;
    gap: 0.75rem;
    padding: 0 1rem;
}

.comment-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    margin-top: 0.25rem;
}

.comment-content {
    flex: 1;
    min-width: 0;
}

.comment-bubble {
    background: var(--ion-color-light);
    border-radius: 16px;
    padding: 0.75rem 1rem;
    margin-bottom: 0.25rem;
}

.comment-user {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ion-color-dark);
}

.comment-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
    color: rgba(31, 41, 55, 0.95);
    word-wrap: break-word;
}

.comment-meta {
    font-size: 0.75rem;
    color: var(--ion-color-medium);
    margin: 0;
    padding-left: 0.5rem;
}

/* Modo oscuro */
.ion-palette-dark .comment-text {
    color: rgba(255, 255, 255, 0.95);
}
</style>

<template>
    <div class="post-stats">
        <ion-button fill="clear" size="small" :color="post.user_has_liked ? 'warning' : ''" class="action-button"
            @click="$emit('like')">
            <!-- Like icon SVG - mood emoji -->
            <svg v-if="!post.user_has_liked" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-mood-empty post-action-icon">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 10l.01 0" />
                <path d="M15 10l.01 0" />
                <path d="M9 15l6 0" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="currentColor"
                class="icon icon-tabler icons-tabler-filled icon-tabler-mood-happy post-action-icon">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path
                    d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-2 9.66h-6a1 1 0 0 0 -1 1v.05a3.975 3.975 0 0 0 3.777 3.97l.227 .005a4.026 4.026 0 0 0 3.99 -3.79l.006 -.206a1 1 0 0 0 -1 -1.029zm-5.99 -5l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993zm6 0l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993z" />
            </svg>
            <ion-label>{{ post.likes_count || 0 }}</ion-label>
        </ion-button>
        <ion-button fill="clear" size="small" class="action-button" @click="$emit('comment')">
            <!-- Comments icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-message-chatbot post-action-icon">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
                <path d="M9.5 9h.01" />
                <path d="M14.5 9h.01" />
                <path d="M9.5 13a3.5 3.5 0 0 0 5 0" />
            </svg>
            <ion-label>{{ post.comentarios_count || 0 }}</ion-label>
        </ion-button>
    </div>
    <ion-button fill="clear" size="small" class="action-button" @click="$emit('share')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="icon icon-tabler icons-tabler-outline icon-tabler-share-3 post-action-icon">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z" />
        </svg>
    </ion-button>
</template>

<script>
import { IonButton, IonLabel } from '@ionic/vue'

export default {
    name: 'PostActions',
    components: {
        IonButton,
        IonLabel
    },
    props: {
        post: {
            type: Object,
            required: true
        }
    },
    emits: ['like', 'comment', 'share']
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>

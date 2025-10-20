<template>
    <ion-list v-if="comments && comments.length > 0">
        <ion-item v-for="comment in comments" :key="comment.id" lines="none" class="comment-item">
            <ion-avatar slot="start" class="comment-avatar">
                <img v-if="comment.user?.imagen_url" :src="comment.user.imagen_url"
                    :alt="comment.user?.name || 'Usuario'" @error="$emit('imageError', $event)" />
                <ion-icon v-else :icon="personCircle"></ion-icon>
            </ion-avatar>
            <ion-label class="comment-content">
                <h3>{{ comment.user?.name || 'Usuario' }}</h3>
                <p>{{ comment.comentario }}</p>
                <p class="comment-meta">{{ timeAgo(comment.created_at) }}</p>
            </ion-label>
        </ion-item>
    </ion-list>
    <div v-else class="no-comments">
        <ion-text color="medium">
            <p>No hay comentarios aún</p>
        </ion-text>
    </div>
</template>

<script>
import { IonList, IonItem, IonAvatar, IonLabel, IonIcon, IonText } from '@ionic/vue'
import { personCircle } from 'ionicons/icons'
import { timeAgo } from '@/utils/timeUtils'

export default {
    name: 'CommentsSection',
    components: {
        IonList,
        IonItem,
        IonAvatar,
        IonLabel,
        IonIcon,
        IonText
    },
    props: {
        comments: {
            type: Array,
            default: () => []
        }
    },
    emits: ['imageError'],
    data() {
        return {
            personCircle
        }
    },
    methods: {
        timeAgo
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>

<template>
    <div class="post-stats">
        <ion-button fill="clear" size="small" :color="post.user_has_liked ? 'danger' : ''" class="action-button"
            @click="$emit('like')">
            <ion-icon :icon="post.user_has_liked ? heart : heartOutline" class="post-action-icon"></ion-icon>
            <ion-label>{{ post.likes_count || 0 }}</ion-label>
        </ion-button>
        <ion-button fill="clear" size="small" class="action-button" @click="$emit('comment')">
            <ion-icon :icon="chatbubbleOutline" class="post-action-icon"></ion-icon>
            <ion-label>{{ post.comentarios_count || 0 }}</ion-label>
        </ion-button>
    </div>
</template>

<script>
import { IonButton, IonLabel, IonIcon } from '@ionic/vue'
import { heart, heartOutline, chatbubbleOutline } from 'ionicons/icons'

export default {
    name: 'PostActions',
    components: {
        IonButton,
        IonLabel,
        IonIcon
    },
    props: {
        post: {
            type: Object,
            required: true
        }
    },
    emits: ['like', 'comment'],
    setup() {
        return {
            heart,
            heartOutline,
            chatbubbleOutline
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>

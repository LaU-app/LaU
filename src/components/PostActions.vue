<template>
    <div class="post-stats">
        <ion-button fill="clear" size="small" :color="post.user_has_liked ? 'danger' : ''" class="action-button"
            @click.stop="handleLike" :disabled="isLiking">
            <ion-icon :icon="post.user_has_liked ? heart : heartOutline" class="post-action-icon"></ion-icon>
            <ion-label>{{ post.likes_count || 0 }}</ion-label>
        </ion-button>
        <ion-button fill="clear" size="small" class="action-button" @click.stop="handleComment">
            <ion-icon :icon="chatbubbleOutline" class="post-action-icon"></ion-icon>
            <ion-label>{{ post.comentarios?.length || post.comentarios_count || 0 }}</ion-label>
        </ion-button>
    </div>
</template>

<script>
import { IonButton, IonLabel, IonIcon } from '@ionic/vue'
import { heart, heartOutline, chatbubbleOutline } from 'ionicons/icons'
import { ref } from 'vue'

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
    setup(props, { emit }) {
        const isLiking = ref(false)

        const handleLike = async () => {
            if (isLiking.value) return

            isLiking.value = true
            try {
                emit('like', props.post.id)
            } finally {
                // Pequeño delay para evitar clicks múltiples
                setTimeout(() => {
                    isLiking.value = false
                }, 500)
            }
        }

        const handleComment = () => {
            emit('comment', props.post.id)
        }

        return {
            heart,
            heartOutline,
            chatbubbleOutline,
            isLiking,
            handleLike,
            handleComment
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>

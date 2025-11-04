<template>
    <ion-card class="post-card" @click="goToPostDetail">
        <!-- Post Header -->
        <ion-card-header>
            <div class="post-header">
                <ion-avatar class="post-avatar">
                    <img v-if="post.user?.imagen_url" :src="post.user.imagen_url" :alt="post.user?.name || 'Usuario'"
                        @error="handleImageError" />
                    <ion-icon v-else :icon="personCircle" size="large"></ion-icon>
                </ion-avatar>
                <div class="post-user-info">
                    <ion-text>
                        <h3>{{ post.user?.name || 'Usuario' }}</h3>
                    </ion-text>
                    <ion-text>
                        <p class="post-meta">{{ post.user?.username || 'username' }} • Hace {{
                            timeAgo(post.created_at) }}</p>
                    </ion-text>
                </div>
            </div>
        </ion-card-header>

        <!-- Post Content -->
        <ion-card-content>
            <!-- Título y/o Descripción o Texto (Dinámico) -->
            <ion-text v-if="post.titulo || post.descripcion || post.texto">
                <h2 v-if="post.titulo" class="post-title">{{ post.titulo }}</h2>
                <p v-if="post.descripcion" class="post-text">{{ post.descripcion }}</p>
                <p v-if="post.texto && !post.descripcion" class="post-text post-text-only">{{ post.texto }}</p>
            </ion-text>

            <!-- Imagen Post -->
            <div v-if="post.tipo === 'imagen' && post.imagen_url" class="post-media">
                <ion-img :src="post.imagen_url" :alt="post.titulo || 'Post'" @ionError="handleImageError">
                </ion-img>
            </div>

            <!-- Música Post -->
            <div v-else-if="post.tipo === 'musica'" class="music-player">
                <MusicPlayer :post="post" @imageError="handleImageError" />
            </div>
        </ion-card-content>

        <!-- Post Actions -->
        <ion-card-content class="post-footer">
            <PostActions :post="post" />
        </ion-card-content>

    </ion-card>
</template>

<script>
import {
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonAvatar,
    IonText,
    IonIcon,
    IonImg
} from '@ionic/vue'
import { personCircle } from 'ionicons/icons'
import MusicPlayer from './MusicPlayer.vue'
import PostActions from './PostActions.vue'
import { timeAgo } from '@/utils/timeUtils'
import { useRouter } from 'vue-router'

export default {
    name: 'PostCard',
    components: {
        IonCard,
        IonCardHeader,
        IonCardContent,
        IonAvatar,
        IonText,
        IonIcon,
        IonImg,
        MusicPlayer,
        PostActions
    },
    props: {
        post: {
            type: Object,
            required: true
        }
    },
    emits: ['like', 'comment', 'share', 'imageError'],
    setup(props, { emit }) {
        const router = useRouter()

        const goToPostDetail = () => {
            router.push(`/tabs/post/${props.post.id}`)
        }

        const handleLike = (event) => {
            event.stopPropagation() // Evitar navegación al hacer like
            emit('like', props.post.id)
        }

        const handleShare = (event) => {
            event.stopPropagation() // Evitar navegación al compartir
            emit('share', props.post.id)
        }

        const handleImageError = (event) => {
            emit('imageError', event)
        }

        return {
            personCircle,
            goToPostDetail,
            handleLike,
            handleShare,
            handleImageError,
            timeAgo
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';

.post-card {
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    margin-bottom: 1rem;
}

.post-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.post-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--ion-color-dark);
}

.post-text {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--ion-color-step-600);
}

.post-text-only {
    font-weight: 600;
    font-size: 1rem;
    color: var(--ion-color-dark);
}

.comments-preview {
    padding-top: 0.5rem;
    padding-bottom: 0.75rem;
    border-top: 1px solid var(--ion-color-light-shade);
}

.comments-count {
    font-size: 0.9rem;
    margin: 0;
    cursor: pointer;
}
.comments-count:hover {
    text-decoration: underline;
}
</style>

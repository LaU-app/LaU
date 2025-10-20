<template>
    <ion-accordion :value="post.id.toString()">
        <ion-card slot="header" class="post-card">
            <!-- Post Header -->
            <ion-card-header>
                <div class="post-header">
                    <ion-avatar class="post-avatar">
                        <img v-if="post.user?.imagen_url" :src="post.user.imagen_url"
                            :alt="post.user?.name || 'Usuario'" @error="handleImageError" />
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
                <ion-text v-if="post.titulo || post.descripcion">
                    <p class="post-text">{{ post.descripcion || post.titulo }}</p>
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
                <PostActions :post="post" @like="$emit('like', post.id)" @comment="$emit('comment', post.id)"
                    @share="$emit('share', post.id)" />
            </ion-card-content>
        </ion-card>

        <!-- Comments Section (Accordion Content) -->
        <div slot="content" class="comments-section">
            <CommentsSection :comments="post.comentarios" @imageError="handleImageError" />
        </div>
    </ion-accordion>
</template>

<script>
import {
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonAvatar,
    IonText,
    IonIcon,
    IonImg,
    IonAccordion
} from '@ionic/vue'
import { personCircle } from 'ionicons/icons'
import MusicPlayer from './MusicPlayer.vue'
import PostActions from './PostActions.vue'
import CommentsSection from './CommentsSection.vue'
import { timeAgo } from '@/utils/timeUtils'

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
        IonAccordion,
        MusicPlayer,
        PostActions,
        CommentsSection
    },
    props: {
        post: {
            type: Object,
            required: true
        }
    },
    emits: ['like', 'comment', 'share', 'imageError'],
    data() {
        return {
            personCircle
        }
    },
    methods: {
        handleImageError(event) {
            this.$emit('imageError', event)
        },
        timeAgo
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>

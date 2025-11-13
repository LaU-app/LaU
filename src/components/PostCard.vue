<template>
    <ion-card class="post-card" @click="goToPostDetail">
        <!-- Post Header -->
        <ion-card-header>
            <div class="post-header">
                <ion-avatar class="post-avatar">
                    <img v-if="post.user?.imagen_url" :src="post.user.imagen_url" :alt="post.user?.name || 'Usuario'"
                        loading="lazy" @error="handleImageError" />
                    <ion-icon v-else :icon="personCircle" size="large"></ion-icon>
                </ion-avatar>
                <div class="post-user-info" v-memo="[post.user?.name, post.user?.username]">
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
                    <div slot="image" style="position: relative; padding-top: 75%; background: var(--ion-color-light);">
                        <ion-spinner name="crescent" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></ion-spinner>
                    </div>
                </ion-img>
            </div>

            <!-- Música Post -->
            <div v-else-if="post.tipo === 'musica'" class="music-player">
                <MusicPlayer :post="post" @imageError="handleImageError" />
            </div>

            <!-- Archivo Post -->
            <div v-else-if="post.tipo === 'archivo' && post.archivo_url" class="file-attachment">
                <div class="file-info">
                    <!-- Ícono dinámico según tipo de archivo -->
                    <div class="file-icon-container">
                        <ion-icon :icon="documentAttach" size="large" :color="getFileColor(post.archivo)"></ion-icon>
                    </div>
                    <div class="file-details">
                        <h4>{{ getFileName(post.archivo) }}</h4>
                        <p>{{ getFileExtension(post.archivo) }}</p>
                    </div>
                </div>
                <ion-button fill="clear" size="small" @click.stop="downloadFile(post.archivo_url)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                        <path d="M7 11l5 5l5 -5" />
                        <path d="M12 4l0 12" />
                    </svg>
                </ion-button>
            </div>
        </ion-card-content>
        <br>
        <!-- Post Actions -->
        <ion-card-content class="post-footer">
            <PostActions :post="post" @like="handleLike" @comment="handleComment" />
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
    IonImg,
    IonButton,
    IonSpinner
} from '@ionic/vue'
import { personCircle, documentAttach, downloadOutline } from 'ionicons/icons'
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
        IonButton,
        IonSpinner,
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

        const handleLike = (postId) => {
            emit('like', postId)
        }

        const handleComment = (postId) => {
            emit('comment', postId)
        }

        const handleShare = (event) => {
            event.stopPropagation() // Evitar navegación al compartir
            emit('share', props.post.id)
        }

        const handleImageError = (event) => {
            emit('imageError', event)
        }

        const getFileName = (filePath) => {
            if (!filePath) return 'Archivo'
            const parts = filePath.split('/')
            const fileName = parts[parts.length - 1]
            // Remover timestamp del nombre
            return fileName.replace(/^\d+_/, '')
        }

        const getFileExtension = (filePath) => {
            if (!filePath) return ''
            const extension = filePath.split('.').pop().toUpperCase()
            return `Archivo ${extension}`
        }

        const downloadFile = (fileUrl) => {
            if (!fileUrl) return
            window.open(fileUrl, '_blank')
        }

        const getFileColor = (filePath) => {
            if (!filePath) return 'medium'
            const extension = filePath.split('.').pop().toLowerCase()
            const colors = {
                'pdf': 'danger',
                'doc': 'primary',
                'docx': 'primary',
                'zip': 'warning',
                'rar': 'warning',
                'txt': 'medium',
                'xlsx': 'success',
                'xls': 'success'
            }
            return colors[extension] || 'medium'
        }

        return {
            personCircle,
            documentAttach,
            downloadOutline,
            goToPostDetail,
            handleLike,
            handleComment,
            handleShare,
            handleImageError,
            getFileName,
            getFileExtension,
            downloadFile,
            getFileColor,
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

.file-attachment {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--ion-color-light);
    border-radius: 12px;
    border: 1px solid var(--ion-color-light-shade);
    margin-top: 0.75rem;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
}

.file-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
}

.file-details h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ion-color-dark);
    word-break: break-word;
}

.file-details p {
    margin: 0.25rem 0 0 0;
    font-size: 0.8rem;
    color: var(--ion-color-medium);
}
</style>

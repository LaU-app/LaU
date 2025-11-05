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

            <!-- Archivo Post -->
            <div v-else-if="post.tipo === 'archivo' && post.archivo_url" class="file-attachment">
                <div class="file-info">
                    <!-- Ícono dinámico según tipo de archivo -->
                    <div class="file-icon-container" v-html="getFileIcon(post.archivo)"></div>
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
    IonImg,
    IonButton
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

        const getFileIcon = (filePath) => {
            if (!filePath) return ''
            const extension = filePath.split('.').pop().toLowerCase()

            const icons = {
                'pdf': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></svg>`,
                'doc': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /><path d="M20 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" /><path d="M12.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5z" /></svg>`,
                'docx': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M2 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /><path d="M17 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" /><path d="M9.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5z" /><path d="M19.5 15l3 6" /><path d="M19.5 21l3 -6" /></svg>`,
                'zip': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-1" /><path d="M11 17a2 2 0 0 1 2 2v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a2 2 0 0 1 2 -2z" /><path d="M11 5l-1 0" /><path d="M13 7l-1 0" /><path d="M11 9l-1 0" /><path d="M13 11l-1 0" /><path d="M11 13l-1 0" /><path d="M13 15l-1 0" /></svg>`
            }

            return icons[extension] || icons['pdf']
        }

        return {
            personCircle,
            documentAttach,
            downloadOutline,
            goToPostDetail,
            handleLike,
            handleShare,
            handleImageError,
            getFileName,
            getFileExtension,
            downloadFile,
            getFileIcon,
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

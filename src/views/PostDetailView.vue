<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="goBack">
                        <ion-icon :icon="arrowBack" slot="icon-only"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Detalle de Publicación</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <!-- Loading State -->
            <div v-if="loading" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Cargando publicación...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="error-container">
                <ion-icon :icon="alertCircle" size="large" color="danger"></ion-icon>
                <p>{{ error }}</p>
                <ion-button @click="loadPost">Reintentar</ion-button>
            </div>

            <!-- Post Detail -->
            <div v-else-if="post" class="post-detail-container">
                <!-- Post Card Principal -->
                <ion-card class="post-card">
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
                                    <p class="post-meta">{{ post.user?.username || 'username' }} • {{
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
                            <p v-if="post.descripcion" class="post-description">{{ post.descripcion }}</p>
                            <p v-if="post.texto && !post.descripcion" class="post-description post-text-only">{{
                                post.texto }}</p>
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
                            <ion-button fill="outline" size="small" @click.stop="downloadFile(post.archivo_url)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
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

                <!-- Comments Card -->
                <ion-card class="comments-card">
                    <ion-card-header>
                        <ion-card-title class="comments-title">
                            Comentarios ({{ post.comentarios?.length || 0 }})
                        </ion-card-title>
                    </ion-card-header>

                    <ion-card-content class="comments-content">
                        <!-- Comments List -->
                        <div v-if="post.comentarios && post.comentarios.length > 0" class="comments-list">
                            <div v-for="comment in post.comentarios" :key="comment.id" class="comment-item">
                                <ion-avatar class="comment-avatar">
                                    <img v-if="comment.user?.imagen_url" :src="comment.user.imagen_url"
                                        :alt="comment.user?.name || 'Usuario'" @error="handleImageError" />
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
                        </div>

                        <!-- No Comments State -->
                        <div v-else class="no-comments">
                            <ion-icon :icon="chatbubbleOutline" class="no-comments-icon"></ion-icon>
                            <ion-text color="medium">
                                <p>No hay comentarios aún</p>
                                <p class="no-comments-subtitle">¡Sé el primero en comentar!</p>
                            </ion-text>
                        </div>

                        <!-- Input de comentario dentro de la card -->
                        <div class="comment-input-container">
                            <ion-avatar class="current-user-avatar">
                                <img v-if="currentUser?.imagen_url" :src="currentUser.imagen_url"
                                    :alt="currentUser?.name || 'Tú'" />
                                <ion-icon v-else :icon="personCircle"></ion-icon>
                            </ion-avatar>
                            <ion-input ref="commentInputRef" v-model="newComment" placeholder="Escribe un comentario..."
                                class="comment-input" @keyup.enter="submitComment">
                            </ion-input>
                            <ion-button fill="clear" @click="submitComment" :disabled="!newComment.trim()"
                                class="send-button">
                                <ion-icon :icon="sendOutline" color="primary"></ion-icon>
                            </ion-button>
                        </div>
                    </ion-card-content>
                </ion-card>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonAvatar,
    IonText,
    IonImg,
    IonSpinner,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    toastController
} from '@ionic/vue'
import {
    arrowBack,
    personCircle,
    alertCircle,
    sendOutline,
    chatbubbleOutline,
    downloadOutline
} from 'ionicons/icons'
import MusicPlayer from '@/components/MusicPlayer.vue'
import PostActions from '@/components/PostActions.vue'
import { timeAgo } from '@/utils/timeUtils'
import api from '@/services/api'
import { AuthService } from '@/services/auth'

const route = useRoute()
const router = useRouter()

const post = ref(null)
const loading = ref(true)
const error = ref(null)
const newComment = ref('')
const commentInputRef = ref(null)
const currentUser = ref(null)

// Cargar datos del usuario actual
onMounted(async () => {
    currentUser.value = AuthService.getUser()
    await loadPost()
})

const loadPost = async () => {
    loading.value = true
    error.value = null

    try {
        const postId = route.params.id
        if (!postId) {
            throw new Error('ID de publicación no válido')
        }

        const response = await api.getPostById(postId)

        if (response.data.success) {
            post.value = response.data.data
        } else {
            throw new Error(response.data.message || 'Error al cargar la publicación')
        }
    } catch (err) {
        console.error('Error cargando post:', err)
        error.value = err.response?.data?.message || err.message || 'No se pudo cargar la publicación'
    } finally {
        loading.value = false
    }
}

const goBack = () => {
    router.back()
}

const handleImageError = (event) => {
    console.warn('Error cargando imagen:', event)
    if (event.target) {
        event.target.src = 'https://via.placeholder.com/150?text=Sin+Imagen'
    }
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

const handleLike = async () => {
    try {
        // TODO: Implementar lógica de like con la API
        console.log('Like en post:', post.value.id)
        const toast = await toastController.create({
            message: 'Like agregado',
            duration: 1500,
            position: 'bottom',
            color: 'success'
        })
        await toast.present()
    } catch (err) {
        console.error('Error al dar like:', err)
    }
}

const handleShare = async () => {
    try {
        // TODO: Implementar lógica de compartir
        console.log('Compartir post:', post.value.id)
        const toast = await toastController.create({
            message: 'Función de compartir próximamente',
            duration: 2000,
            position: 'bottom',
            color: 'medium'
        })
        await toast.present()
    } catch (err) {
        console.error('Error al compartir:', err)
    }
}

const focusCommentInput = () => {
    if (commentInputRef.value) {
        commentInputRef.value.$el.setFocus()
    }
}

const submitComment = async () => {
    if (!newComment.value.trim()) return

    try {
        // TODO: Implementar envío de comentario a la API
        console.log('Enviando comentario:', newComment.value)

        const toast = await toastController.create({
            message: 'Comentario agregado',
            duration: 1500,
            position: 'bottom',
            color: 'success'
        })
        await toast.present()

        // Limpiar input
        newComment.value = ''

        // Recargar post para obtener comentarios actualizados
        await loadPost()
    } catch (err) {
        console.error('Error al enviar comentario:', err)
        const toast = await toastController.create({
            message: 'Error al enviar comentario',
            duration: 2000,
            position: 'bottom',
            color: 'danger'
        })
        await toast.present()
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';



.loading-container,
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 2rem;
    text-align: center;
}

.error-container ion-icon {
    margin-bottom: 1rem;
}

.post-detail-container {
    padding: 1rem;
    padding-bottom: 0;
}

/* Post Card Styles */
.post-card {
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.post-avatar {
    width: 48px;
    height: 48px;
}

.post-user-info h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.post-meta {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: var(--ion-color-medium);
}

.post-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--ion-color-dark);
}

.post-description {
    font-size: 1rem;
    line-height: 1.5;
    margin: 0.5rem 0 1rem 0;
    color: var(--ion-color-step-600);
}

.post-text-only {
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--ion-color-dark);
}

.post-media {
    width: 100%;
    margin-top: 1rem;
    border-radius: 8px;
    overflow: hidden;
}

.post-media ion-img {
    width: 100%;
    height: auto;
    min-height: 200px;
}

.music-player {
    margin-top: 0.5rem;
}

.post-footer {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}

/* Comments Card Styles */
.comments-card {
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comments-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ion-color-dark);
}

.comments-content {
    padding: 0;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
}

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
    color: var(--ion-color-step-700);
    word-wrap: break-word;
}

.comment-meta {
    font-size: 0.75rem;
    color: var(--ion-color-medium);
    margin: 0;
    padding-left: 0.5rem;
}

.no-comments {
    padding: 3rem 1rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}

.no-comments-icon {
    font-size: 3rem;
    color: var(--ion-color-medium);
    opacity: 0.5;
}

.no-comments p {
    margin: 0;
    font-size: 1rem;
}

.no-comments-subtitle {
    font-size: 0.875rem !important;
    margin-top: 0.25rem !important;
}

/* Comment Input Container */
.comment-input-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    margin-top: 1rem;
    border-top: 1px solid var(--ion-color-light-shade);
    background: var(--ion-card-background);
}

.comment-input-container .current-user-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
}

.comment-input {
    flex: 1;
    --background: var(--ion-color-light);
    --padding-start: 1rem;
    --padding-end: 1rem;
    border-radius: 12px;
    min-height: 40px;
}

.send-button {
    --padding-start: 0.5rem;
    --padding-end: 0.5rem;
    margin: 0;
}

.send-button ion-icon {
    font-size: 1.5rem;
}

/* File Attachment Styles */
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

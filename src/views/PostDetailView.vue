<template>
    <ion-page>
        <ion-header>
            <ion-toolbar class="pt-safe-top">
                <ion-buttons slot="start">
                    <ion-button @click="goBack">
                        <ion-icon :icon="arrowBack" slot="icon-only"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Detalle de Publicación</ion-title>
                <ion-buttons slot="end" v-if="isMyPost">
                    <ion-button @click="confirmDelete" color="danger">
                        <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" ref="ionContentRef">
            <div v-if="loading" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Cargando publicación...</p>
            </div>

            <div v-else-if="error" class="error-container">
                <ion-icon :icon="alertCircle" size="large" color="danger"></ion-icon>
                <p>{{ error }}</p>
                <ion-button @click="loadPost">Reintentar</ion-button>
            </div>

            <div v-else-if="post" class="post-detail-container">
                <ion-card class="post-card">
                    <ion-card-header>
                        <div class="post-header">
                            <ion-avatar class="post-avatar">
                                <img v-if="post.user?.imagen_url" :src="post.user.imagen_url"
                                    :alt="post.user?.name || 'Usuario'" loading="lazy" @error="handleImageError" />
                                <ion-icon v-else :icon="personCircle" size="large"></ion-icon>
                            </ion-avatar>
                            <div class="post-user-info" v-once>
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

                    <ion-card-content>
                        <ion-text v-if="post.titulo || post.descripcion || post.texto">
                            <h2 v-if="post.titulo" class="post-title">{{ post.titulo }}</h2>
                            <p v-if="post.descripcion" class="post-description">{{ post.descripcion }}</p>
                            <p v-if="post.texto && !post.descripcion" class="post-description post-text-only">{{
                                post.texto }}</p>
                        </ion-text>

                        <div v-if="post.tipo === 'imagen' && post.imagen_url" class="post-media">
                            <ion-img :src="post.imagen_url" :alt="post.titulo || 'Post'" @ionError="handleImageError">
                            </ion-img>
                        </div>

                        <div v-else-if="post.tipo === 'musica'" class="music-player">
                            <MusicPlayer :post="post" @imageError="handleImageError" />
                        </div>

                        <div v-else-if="post.tipo === 'archivo' && post.archivo_url" class="file-attachment">
                            <div class="file-info">
                                <div class="file-icon-container" v-html="getFileIcon(post.archivo)"></div>
                                <div class="file-details">
                                    <h4>{{ getFileName(post.archivo) }}</h4>
                                    <p>{{ getFileExtension(post.archivo) }}</p>
                                </div>
                            </div>
                            <ion-button fill="outline" size="small" @click.stop="downloadFile(post.archivo_url, post.archivo)">
                                <ion-icon :icon="downloadOutline"></ion-icon>
                            </ion-button>
                        </div>
                    </ion-card-content>
                    <br>
                    <ion-card-content class="post-footer">
                        <PostActions :post="post" @like="handleLike" @comment="focusCommentInput" />
                    </ion-card-content>
                </ion-card>

                <ion-card class="comments-card">
                    <ion-card-header>
                        <ion-card-title class="comments-title">
                            Comentarios ({{ post.comentarios?.length || 0 }})
                        </ion-card-title>
                    </ion-card-header>

                    <ion-card-content class="comments-content">
                        <div v-if="post.comentarios && post.comentarios.length > 0" class="comments-list">
                            <CommentItem v-for="comment in post.comentarios" :key="comment.id" :comment="comment"
                                @reply="startReply" v-memo="[comment.id, comment.texto, comment.children?.length]" />
                        </div>

                        <div v-else class="no-comments">
                            <ion-icon :icon="chatbubbleOutline" class="no-comments-icon"></ion-icon>
                            <ion-text color="medium">
                                <p>No hay comentarios aún</p>
                                <p class="no-comments-subtitle">¡Sé el primero en comentar!</p>
                            </ion-text>
                        </div>

                        <div class="comment-input-container">
                            <div v-if="replyingToComment" class="replying-indicator">
                                <ion-text color="medium">
                                    <small>Respondiendo a <b>{{ replyingToComment.user?.name }}</b></small>
                                </ion-text>
                                <ion-button fill="clear" size="small" @click="cancelReply">
                                    <ion-icon slot="icon-only" :icon="closeCircle"></ion-icon>
                                </ion-button>
                            </div>

                            <div class="input-row">
                                <ion-avatar class="current-user-avatar">
                                    <img v-if="currentUser?.imagen_url" :src="currentUser.imagen_url"
                                        :alt="currentUser?.name || 'Tú'" loading="lazy" />
                                    <ion-icon v-else :icon="personCircle"></ion-icon>
                                </ion-avatar>
                                <div class="comment-input-wrapper">
                                    <ion-input ref="commentInputRef" v-model="newComment"
                                        :placeholder="replyingToComment ? 'Escribe tu respuesta...' : 'Escribe un comentario...'"
                                        class="comment-input" @keyup.enter="submitComment">
                                    </ion-input>
                                    <div class="comment-input-line"></div>
                                </div>
                                <ion-button fill="solid" shape="round" size="small" color="primary"
                                    @click="submitComment" :disabled="!newComment.trim()" class="send-comment-button">
                                    <ion-icon :icon="send"></ion-icon>
                                </ion-button>
                            </div>
                        </div>
                    </ion-card-content>
                </ion-card>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
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
    toastController,
    alertController
} from '@ionic/vue'
import {
    arrowBack,
    personCircle,
    alertCircle,
    send,
    chatbubbleOutline,
    downloadOutline,
    trashOutline,
    closeCircle
} from 'ionicons/icons'
import MusicPlayer from '@/components/MusicPlayer.vue'
import PostActions from '@/components/PostActions.vue'
import CommentItem from '@/components/CommentItem.vue'
import { timeAgo } from '@/utils/timeUtils'
import api from '@/services/api'
import postsService from '@/services/postsService'
import { AuthService } from '@/services/auth'
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { CapacitorHttp } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { openNativeFile } from '@/services/FileService';

const route = useRoute()
const router = useRouter()

const post = ref(null)
const loading = ref(true)
const error = ref(null)
const newComment = ref('')
const commentInputRef = ref(null)
const ionContentRef = ref(null)
const currentUser = ref(null)
const replyingToComment = ref(null)

// Computed para verificar si el post es del usuario actual
const isMyPost = computed(() => {
    if (!post.value || !currentUser.value) return false
    return post.value.user_id === currentUser.value.id || post.value.user?.id === currentUser.value.id
})

onMounted(async () => {
    currentUser.value = AuthService.getUser()
    await loadPost()
})

const loadPost = async () => {
    loading.value = true
    error.value = null

    try {
        const postId = route.params.id
        if (!postId) throw new Error('ID de publicación no válido')

        const response = await api.getPostById(postId)

        if (response.data.success) {
            const postData = response.data.data
            const currentUserId = AuthService.getUser()?.id

            let hasLiked = false;
            if (postData.user_has_liked !== undefined) {
                hasLiked = postData.user_has_liked;
            } else if (postData.likes && Array.isArray(postData.likes) && currentUserId) {
                hasLiked = postData.likes.some(like =>
                    like.user_id === currentUserId ||
                    like.usuario_id === currentUserId ||
                    like.id === currentUserId
                );
            }

            post.value = {
                ...postData,
                user_has_liked: hasLiked,
                likes_count: postData.likes_count !== undefined ? postData.likes_count : (postData.likes?.length || 0)
            }
        } else {
            throw new Error(response.data.message || 'Error al cargar la publicación')
        }
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'No se pudo cargar la publicación'
    } finally {
        loading.value = false
    }
}

const goBack = () => {
    router.back()
}

const handleImageError = (event) => {
    if (event.target) {
        event.target.src = 'https://via.placeholder.com/150?text=Sin+Imagen'
    }
}

const getFileName = (filePath) => {
    if (!filePath) return 'Archivo'
    const parts = filePath.split('/')
    const fileName = parts[parts.length - 1]
    return fileName.replace(/^\d+_/, '')
}

const getFileExtension = (filePath) => {
    if (!filePath) return ''
    const extension = filePath.split('.').pop().toUpperCase()
    return `Archivo ${extension}`
}

const downloadFile = (urlArchivo, nombreArchivo) => {
        // Si nombreArchivo viene con la ruta entera, puedes limpiarlo aquí antes
        // const nombreLimpio = getFileName(nombreArchivo);
        openNativeFile(urlArchivo, nombreArchivo);
};

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
        if (!post.value) return

        const previousLikedState = post.value.user_has_liked
        const previousLikesCount = post.value.likes_count || 0

        // Optimismo UI
        post.value.user_has_liked = !previousLikedState
        post.value.likes_count = post.value.user_has_liked
            ? previousLikesCount + 1
            : Math.max(0, previousLikesCount - 1)

        const result = await postsService.likePost(post.value.id)

        if (result.success && result.data) {
            post.value.user_has_liked = result.data.user_has_liked !== undefined
                ? result.data.user_has_liked
                : !previousLikedState
            post.value.likes_count = result.data.likes_count !== undefined
                ? result.data.likes_count
                : post.value.likes_count

            if (post.value.user_has_liked) {
                const toast = await toastController.create({
                    message: 'Like agregado',
                    duration: 1500,
                    position: 'bottom',
                    color: 'danger'
                })
                await toast.present()
            }
        } else {
            // Revertir
            post.value.user_has_liked = previousLikedState
            post.value.likes_count = previousLikesCount
        }
    } catch (err) {
        await loadPost()
    }
}

// --- Lógica de Comentarios y Respuestas ---

const startReply = (comment) => {
    replyingToComment.value = comment
    // Opcional: agregar @Username al inicio
    // newComment.value = `@${comment.user?.username || ''} `

    nextTick(() => {
        if (commentInputRef.value) {
            commentInputRef.value.$el.setFocus()
        }
    })
}

const cancelReply = () => {
    replyingToComment.value = null
    newComment.value = ''
}

const focusCommentInput = () => {
    cancelReply() // Asegurar que no esté respondiendo a nadie si clickea el icono general
    if (commentInputRef.value) {
        commentInputRef.value.$el.setFocus()
    }
}

// Función recursiva para encontrar el comentario padre y añadir la respuesta
const recursivelyAddReply = (commentsArray, parentId, newCommentObject) => {
    for (let i = 0; i < commentsArray.length; i++) {
        const comment = commentsArray[i];

        // Encontramos al padre directo
        if (comment.id === parentId) {
            if (!comment.children) {
                comment.children = [];
            }
            comment.children.push(newCommentObject);
            return true; // Éxito
        }

        // Buscar en los hijos de este comentario
        if (comment.children && comment.children.length > 0) {
            if (recursivelyAddReply(comment.children, parentId, newCommentObject)) {
                return true;
            }
        }
    }
    return false;
}

const submitComment = async () => {
    if (!newComment.value.trim()) return

    if (!AuthService.isAuthenticated()) {
        const toast = await toastController.create({
            message: 'Debes iniciar sesión para comentar',
            duration: 2000,
            position: 'bottom',
            color: 'warning'
        })
        await toast.present()
        return
    }

    try {
        const comentarioTexto = newComment.value.trim()
        const parentId = replyingToComment.value?.id || null
        const isReply = parentId !== null

        let response
        let success = false

        // Endpoints posibles
        const endpoints = [
            { url: `/posts/${post.value.id}/comments`, method: 'post' },
            { url: `/posts/${post.value.id}/comentarios`, method: 'post' },
            { url: `/comentarios`, method: 'post', body: { post_id: post.value.id } },
            { url: `/comments`, method: 'post', body: { post_id: post.value.id } }
        ]

        for (const endpoint of endpoints) {
            try {
                const requestBody = endpoint.body
                    ? { ...endpoint.body, comentario: comentarioTexto, parent_id: parentId }
                    : { comentario: comentarioTexto, parent_id: parentId }

                response = await api.post(endpoint.url, requestBody)
                success = true
                break
            } catch (endpointError) {
                if (endpointError.response?.status === 404) continue
                throw endpointError
            }
        }

        if (!success) throw new Error('Error de conexión')

        if (response.data.success !== false) {
            const nuevoComentario = response.data.data || response.data;

            // Completar datos de usuario si faltan (optimismo)
            if (!nuevoComentario.user && currentUser.value) {
                nuevoComentario.user = {
                    id: currentUser.value.id,
                    name: currentUser.value.name,
                    username: currentUser.value.username,
                    imagen_url: currentUser.value.imagen_url
                }
            }

            // Si el backend no devuelve time_ago
            if (!nuevoComentario.time_ago) {
                nuevoComentario.time_ago = 'ahora';
            }

            // Inicializar array si no existe
            if (!post.value.comentarios) {
                post.value.comentarios = [];
            }

            // Inserción Reactiva
            if (isReply) {
                recursivelyAddReply(post.value.comentarios, parentId, nuevoComentario);
            } else {
                post.value.comentarios.push(nuevoComentario);
            }

            const toast = await toastController.create({
                message: isReply ? 'Respuesta enviada' : 'Comentario agregado',
                duration: 1500,
                position: 'bottom',
                color: 'success'
            })
            await toast.present()

            // Limpiar UI
            cancelReply()
            newComment.value = ''

            // Scroll al fondo suavemente
            setTimeout(() => {
                if (ionContentRef.value) {
                    ionContentRef.value.$el.scrollToBottom(300);
                }
            }, 100);

        } else {
            throw new Error(response.data.message || 'Error al agregar comentario')
        }
    } catch (err) {
        const toast = await toastController.create({
            message: 'Error al enviar comentario',
            duration: 3000,
            position: 'bottom',
            color: 'danger'
        })
        await toast.present()
    }
}

const confirmDelete = async () => {
    const alert = await alertController.create({
        header: '¿Eliminar publicación?',
        message: 'Esta acción no se puede deshacer.',
        buttons: [
            {
                text: 'Cancelar',
                role: 'cancel',
                cssClass: 'alert-button-cancel'
            },
            {
                text: 'Eliminar',
                cssClass: 'alert-button-danger',
                handler: async () => {
                    await deletePost()
                }
            }
        ],
        cssClass: 'custom-alert-delete'
    })

    await alert.present()
}

const deletePost = async () => {
    try {
        const result = await postsService.deletePost(post.value.id)
        if (result.success) {
            const toast = await toastController.create({
                message: 'Publicación eliminada',
                duration: 2000,
                position: 'bottom',
                color: 'success'
            })
            await toast.present()
            setTimeout(() => {
                router.push({
                    path: '/tabs/tab1',
                    state: { postDeleted: true }
                })
            }, 500)
        } else {
            throw new Error(result.error)
        }
    } catch (err) {
        const toast = await toastController.create({
            message: 'Error al eliminar',
            duration: 3000,
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
    margin-bottom: 1.5rem;
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
    gap: 0.5rem;
    padding: 1rem 0;
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
    flex-direction: column;
    padding: 1rem;
    margin-top: 1rem;
    border-top: 1px solid var(--ion-color-light-shade);
    background: var(--ion-card-background);
}

.replying-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--ion-color-light);
    padding: 0.5rem 1rem;
    margin-bottom: 0.5rem;
    border-radius: 8px;
    border-left: 3px solid var(--ion-color-primary);
}

.input-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.comment-input-container .current-user-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
}

/* Wrapper para el input con línea animada */
.comment-input-wrapper {
    position: relative;
    flex: 1;
}

.comment-input {
    --background: rgba(55, 65, 81, 0.1);
    --padding-start: 1rem;
    --padding-end: 1rem;
    --padding-top: 0.75rem;
    --padding-bottom: 0.75rem;
    --placeholder-color: rgba(55, 65, 81, 0.5);
    --placeholder-opacity: 1;
    --color: rgba(31, 41, 55, 0.9);
    --border-radius: 0.5rem 0.5rem 0 0;
    min-height: 48px;
    font-size: 0.95rem;
    border: none !important;
    position: relative;
    z-index: 1;
}

.comment-input::part(native) {
    border-radius: 0.5rem 0.5rem 0 0 !important;
    background: rgba(55, 65, 81, 0.1) !important;
}

.comment-input {
    --highlight-height: 0px;
    --highlight-color: transparent !important;
    --highlight-color-focused: transparent !important;
}

/* Fondo base del wrapper */
.comment-input-wrapper::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(55, 65, 81, 0.3);
    z-index: 5;
}

/* Línea animada del input */
.comment-input-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--ion-color-primary);
    transition: width 0.3s ease;
    z-index: 20;
}

.comment-input-wrapper:focus-within .comment-input-line {
    width: 100%;
}

.comment-input-wrapper:focus-within::after {
    display: none;
}

/* Estilos para el botón de enviar comentario */
.send-comment-button {
    --padding-start: 10px;
    --padding-end: 10px;
    margin: 0;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
}

.send-comment-button ion-icon {
    color: white;
    font-size: 1.2rem;
}

.ion-palette-dark .send-comment-button ion-icon {
    color: var(--ion-background-color, #1e1e1e);
}

.send-comment-button:disabled {
    opacity: 0.4;
}

/* Modo oscuro */
.ion-palette-dark .comment-input {
    --background: rgba(55, 65, 81, 0.5);
    --color: #FFFFFF;
    --placeholder-color: rgba(255, 255, 255, 0.6);
}

.ion-palette-dark .comment-input::part(native) {
    background: rgba(55, 65, 81, 0.5) !important;
}

.ion-palette-dark .comment-input-wrapper::after {
    background: rgba(55, 65, 81, 0.5);
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

<style>
/* Estilos globales */
.comment-input-wrapper ion-input {
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --highlight-height: 0 !important;
}

.comment-input-wrapper ion-input .input-highlight {
    display: none !important;
}

.comment-input-wrapper ion-input .input-bottom {
    display: none !important;
}

:global(.custom-alert-delete) {
    --backdrop-opacity: 0.6;
}

:global(.custom-alert-delete .alert-wrapper) {
    border-radius: 16px;
}

:global(.alert-button-danger) {
    color: var(--ion-color-danger) !important;
    font-weight: 600;
}

:global(.alert-button-cancel) {
    color: var(--ion-color-medium) !important;
}
</style>
<template>
    <ion-page>
        <ion-header class="ion-no-border transparent-header pt-safe-top">

            <div class="header-gradient-mask"></div>

            <div class="floating-header-container" :class="{ 'is-glass-header': isGlassMode }">
                
                <!-- Burbuja 1: Botón de volver circular -->
                <button class="header-bubble action-bubble" @click="goBack">
                    <ion-icon :icon="arrowBack"></ion-icon>
                </button>

                <!-- Burbuja 2: Título / Info de Usuario -->
                <div class="header-bubble info-bubble">
                    <div class="header-title-container">
                        <transition name="slide-fade">
                            <div v-if="!showUserInHeader" class="header-default-title pl-4">
                                Publicación
                            </div>

                            <div v-else class="header-user-info">
                                <ion-avatar class="header-avatar">
                                    <img v-if="post?.user?.imagen_url" :src="getFullImageUrl(post.user.imagen_url)" 
                                        :alt="post?.user?.name" @error="handleImageError" />
                                    <ion-icon v-else :icon="personCircle"></ion-icon>
                                </ion-avatar>
                                <div class="header-user-text">
                                    <span class="header-name">{{ post?.user?.name || 'Usuario' }}</span>
                                    <span class="header-username">{{ post?.user?.username || 'username' }}</span>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>

                <!-- Burbuja 3: Botón eliminar circular (Totalmente independiente) -->
                <button v-if="isMyPost" class="header-bubble action-bubble delete-bubble" @click="confirmDelete">
                    <ion-icon :icon="trashOutline"></ion-icon>
                </button>

            </div>
        </ion-header>

        <ion-content :fullscreen="true" ref="ionContentRef" :scroll-events="true" @ionScroll="handleScroll">
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
                                <img v-if="post.user?.imagen_url" :src="getFullImageUrl(post.user.imagen_url)"
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

                        <div v-if="post.tipo === 'imagen' && post.imagen_url" class="post-media"
                            @click.stop="openImageModal">
                            <ion-img :src="getFullImageUrl(post.imagen_url)" :alt="post.titulo || 'Post'"
                                @ionError="handleImageError" class="post-media">
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
                            <ion-button fill="outline" size="small"
                                @click.stop="downloadFile(post.archivo_url, post.archivo)">
                                <ion-icon :icon="downloadOutline"></ion-icon>
                            </ion-button>
                        </div>
                    </ion-card-content>
                    <br>
                    <ion-card-content class="post-footer">
                        <div class="overlaid-actions-pill custom-pill ">
                            <PostActions :post="post" @like="handleLike" @comment="handleComment" @share="handleShare" />
                        </div>

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


                        <!-- <div class="comment-input-container">
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
                                    <img v-if="currentUser?.imagen_url" :src="getFullImageUrl(currentUser.imagen_url)"
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
                        </div> -->


                    </ion-card-content>
                </ion-card>
            </div>

            <FullScreenImageViewer 
                v-if="post" 
                :is-open="isImageModalOpen"
                :image-url="getFullImageUrl(post.imagen_url)"
                :is-ambient-mode="isAmbientMode"
                @close="isImageModalOpen = false"
            />
        </ion-content>

        <ion-footer class="ion-no-border transparent-footer">
            <div class="input-gradient-mask"></div>

            <div class="floating-comment-bar" ref="commentBarRef" :class="{ 'is-glass': isGlassMode }">

                <LiquidGlassBox 
                    v-if="isGlassMode"
                    class="comment-glass-bg" 
                    :height="200"  :depth="5" 
                    :radius="30"
                    :strength="100"
                    :chromaticAberration="3" 
                    :blur="1.8"
                    :width="calculatedBarWidth" 
                />

                <div class="comment-bar-content">
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
                            <img v-if="currentUser?.imagen_url" :src="getFullImageUrl(currentUser.imagen_url)"
                                :alt="currentUser?.name || 'Tú'" loading="lazy" />
                            <ion-icon v-else :icon="personCircle"></ion-icon>
                        </ion-avatar>
                        
                        <div class="comment-input-wrapper">
                            <ion-textarea ref="commentInputRef" v-model="newComment"
                                :placeholder="replyingToComment ? 'Escribe tu respuesta...' : 'Escribe un comentario...'"
                                class="comment-input auto-expand" 
                                auto-grow="true"
                                rows="1"
                                @keyup.enter.exact="submitComment"> </ion-textarea>
                            <div class="comment-input-line"></div>
                        </div>

                        <ion-button 
                            fill="solid" 
                            shape="round" 
                            size="small" 
                            color="primary"
                            @click="submitComment" 
                            :disabled="!newComment || newComment.trim() === '' || isSubmitting" 
                            class="send-comment-button">
                            
                            <ion-spinner v-if="isSubmitting" name="crescent" class="btn-spinner"></ion-spinner>
                            <ion-icon v-else :icon="send"></ion-icon>
                            
                        </ion-button>
                    </div>
                </div>
            </div>
        </ion-footer>

        <!-- ========== MODAL PERSONALIZADO: ELIMINAR PUBLICACIÓN ========== -->
        <transition name="delete-fade">
        <div v-if="showDeleteModal" class="delete-overlay" @click.self="closeDeleteModal">
            <transition name="delete-scale">
            <div v-if="showDeleteModal" class="delete-modal">
                <div class="delete-modal-icon">
                    <ion-icon :icon="trashOutline"></ion-icon>
                </div>

                <h3 class="delete-modal-title">¿Eliminar publicación?</h3>
                <p class="delete-modal-message">Esta acción no se puede deshacer.</p>

                <div class="delete-modal-actions">
                <button class="delete-modal-btn delete-modal-cancel" @click="closeDeleteModal" type="button">
                    Cancelar
                </button>
                <button class="delete-modal-btn delete-modal-confirm" @click="confirmDeleteAction" type="button">
                    Eliminar
                </button>
                </div>
            </div>
            </transition>
        </div>
        </transition>


    </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
    IonButton, IonIcon, IonAvatar, IonText, IonImg, IonSpinner, 
    IonTextarea, IonCard, IonCardHeader, IonCardContent, IonCardTitle,
    IonFooter, toastController, alertController, 
    onIonViewWillEnter, onIonViewWillLeave
} from '@ionic/vue';
import {
    arrowBack, personCircle, alertCircle, send, chatbubbleOutline, 
    downloadOutline, trashOutline, closeCircle
} from 'ionicons/icons';

// Componentes y Servicios
import MusicPlayer from '@/components/MusicPlayer.vue';
import PostActions from '@/components/PostActions.vue';
import CommentItem from '@/components/CommentItem.vue';
import FullScreenImageViewer from '@/components/FullScreenImageViewer.vue';
import LiquidGlassBox from '@/components/LiquidGlassBox.vue';

import { timeAgo } from '@/utils/timeUtils';
import { getFullImageUrl } from '@/utils/imageUtils';
import { useAmbientMode } from "@/utils/useAmbientMode";
import { useGlassMode } from '@/utils/useGlassMode';
import { AuthService } from '@/services/auth';
import { openNativeFile } from '@/services/FileService';
import postsService from '@/services/postsService';
import api from '@/services/api';

// ==========================================
// 1. ESTADO GLOBAL (Variables Reactivas)
// ==========================================
const route = useRoute();
const router = useRouter();

const post = ref(null);
const loading = ref(true);
const error = ref(null);
const currentUser = ref(null);

const { isAmbientMode } = useAmbientMode();
const { isGlassMode } = useGlassMode();

// UI y Referencias
const ionContentRef = ref(null);
const showUserInHeader = ref(false);
const isImageModalOpen = ref(false);
const showDeleteModal = ref(false);

// Comentarios
const newComment = ref('');
const commentInputRef = ref(null);
const replyingToComment = ref(null);
const isSubmitting = ref(false);
const commentBarRef = ref(null);
const dynamicBarHeight = ref(65);
const windowWidth = ref(window.innerWidth);
let resizeObserver = null;

// ==========================================
// 2. COMPUTADOS
// ==========================================
const isMyPost = computed(() => {
    if (!post.value || !currentUser.value) return false;
    return post.value.user_id === currentUser.value.id || post.value.user?.id === currentUser.value.id;
});

const canSendComment = computed(() => (newComment.value ?? '').trim().length > 0);
const calculatedBarWidth = computed(() => windowWidth.value - 30);

// ==========================================
// 3. UTILIDADES AISLADAS (Principio OCP / SRP)
// ==========================================
// Diccionario de utilidades para archivos, abierto a extensión sin modificar la vista
const FileFormatHelper = {
    getName: (filePath) => {
        if (!filePath) return 'Archivo';
        const parts = filePath.split('/');
        return parts[parts.length - 1].replace(/^\d+_/, '');
    },
    getExtension: (filePath) => {
        if (!filePath) return '';
        return `Archivo ${filePath.split('.').pop().toUpperCase()}`;
    },
    getIcon: (filePath) => {
        if (!filePath) return '';
        const ext = filePath.split('.').pop().toLowerCase();
        const baseSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
        const icons = {
            'pdf': `${baseSvg}<path stroke="#dc2626" d="M14 3v4a1 1 0 0 0 1 1h4 M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4 M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6 M17 18h2 M20 15h-3v6 M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z"/></svg>`,
            'doc': `${baseSvg}<path stroke="#2563eb" d="M14 3v4a1 1 0 0 0 1 1h4 M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4 M5 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z M20 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0 M12.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5z"/></svg>`,
            'zip': `${baseSvg}<path stroke="#ca8a04" d="M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-1 M11 17a2 2 0 0 1 2 2v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a2 2 0 0 1 2 -2z M11 5h-1 M13 7h-1 M11 9h-1 M13 11h-1 M11 13h-1 M13 15h-1"/></svg>`
        };
        return icons[ext] || icons['pdf']; // Retorna PDF por defecto si no lo encuentra
    }
};

// Funciones expuestas al template
const getFileName = FileFormatHelper.getName;
const getFileExtension = FileFormatHelper.getExtension;
const getFileIcon = FileFormatHelper.getIcon;

const handleImageError = (event) => {
    if (event.target) event.target.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
};

const showToast = async (message, color = 'dark') => {
    const toast = await toastController.create({ message, duration: 2000, position: 'bottom', color });
    await toast.present();
};

// ==========================================
// 4. NAVEGACIÓN Y TABS VISUALES
// ==========================================
const toggleGlobalTabs = (show) => {
    requestAnimationFrame(() => {
        const tabBar = document.querySelector('ion-tab-bar.floating-tabs-redesign'); // 👈 corregido
        const tabGradient = document.querySelector('.tabs-gradient-mask');
        if (tabBar) show ? tabBar.classList.remove('hide-tabs-animated') : tabBar.classList.add('hide-tabs-animated');
        if (tabGradient) show ? tabGradient.classList.remove('hide-tabs-animated') : tabGradient.classList.add('hide-tabs-animated');
    });
};

const goBack = () => {
    toggleGlobalTabs(true);
    window.history.length > 2 ? router.back() : router.push('/tabs/tab1');
};

onIonViewWillEnter(() => toggleGlobalTabs(false));
onIonViewWillLeave(() => toggleGlobalTabs(true));

const handleScroll = (event) => {
    showUserInHeader.value = event.detail.scrollTop > 120;
};

// ==========================================
// 5. CARGA DE POST Y ACCIONES BÁSICAS
// ==========================================
const loadPost = async () => {
    loading.value = true;
    error.value = null;
    try {
        const postId = route.params.id;
        if (!postId) throw new Error('ID no válido');

        const response = await api.getPostById(postId);
        if (!response.data.success) throw new Error(response.data.message || 'Error al cargar');

        const postData = response.data.data;
        const currentUserId = currentUser.value?.id;
        
        let hasLiked = postData.user_has_liked ?? (postData.likes?.some(l => l.user_id === currentUserId || l.usuario_id === currentUserId) || false);

        post.value = {
            ...postData,
            user_has_liked: hasLiked,
            likes_count: postData.likes_count ?? (postData.likes?.length || 0)
        };
    } catch (err) {
        error.value = err.response?.data?.message || err.message;
    } finally {
        loading.value = false;
    }
};

const handleLike = async () => {
    if (!post.value) return;
    const previousLikedState = post.value.user_has_liked;
    const previousLikesCount = post.value.likes_count || 0;

    post.value.user_has_liked = !previousLikedState;
    post.value.likes_count = post.value.user_has_liked ? previousLikesCount + 1 : Math.max(0, previousLikesCount - 1);

    try {
        const result = await postsService.likePost(post.value.id);
        if (result.success && result.data) {
            post.value.user_has_liked = result.data.user_has_liked ?? !previousLikedState;
            post.value.likes_count = result.data.likes_count ?? post.value.likes_count;
        } else {
            throw new Error('Fallo la petición');
        }
    } catch (err) {
        post.value.user_has_liked = previousLikedState;
        post.value.likes_count = previousLikesCount;
    }
};

// ==========================================
// 5. MODAL PERSONALIZADO: ELIMINAR PUBLICACIÓN
// ==========================================
const confirmDelete = () => {
    showDeleteModal.value = true;
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
};

const confirmDeleteAction = async () => {
    showDeleteModal.value = false;
    try {
        const result = await postsService.deletePost(post.value.id);
        if (result.success) {
            showToast('Publicación eliminada', 'success');
            setTimeout(() => router.push({ path: '/tabs/tab1', state: { postDeleted: true } }), 500);
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        showToast('Error al eliminar', 'danger');
    }
};

// ==========================================
// 6. GESTIÓN DE COMENTARIOS
// ==========================================
const startReply = (comment) => { replyingToComment.value = comment; };
const cancelReply = () => { replyingToComment.value = null; newComment.value = ''; };
const focusCommentInput = () => cancelReply();

const recursivelyAddReply = (commentsArray, parentId, newCommentObj) => {
    for (let comment of commentsArray) {
        if (comment.id === parentId) {
            if (!comment.children) comment.children = [];
            comment.children.push(newCommentObj);
            return true;
        }
        if (comment.children && recursivelyAddReply(comment.children, parentId, newCommentObj)) return true;
    }
    return false;
};

// [PRINCIPIO DIP] Aislamos las peticiones API directas para no acoplarlas al flujo visual
const apiSendComment = async (postId, text, parentId) => {
    const endpoints = [
        { url: `/posts/${postId}/comments`, body: { comentario: text, parent_id: parentId } },
        { url: `/posts/${postId}/comentarios`, body: { comentario: text, parent_id: parentId } },
        { url: `/comentarios`, body: { post_id: postId, comentario: text, parent_id: parentId } }
    ];
    for (const endpoint of endpoints) {
        try {
            return await api.post(endpoint.url, endpoint.body);
        } catch (err) {
            if (err.response?.status !== 404) throw err;
        }
    }
    throw new Error('No se encontró la ruta válida');
};

const submitComment = async () => {
    const text = (newComment.value ?? '').trim();
    if (!text || isSubmitting.value) return;

    if (!AuthService.isAuthenticated()) {
        showToast('Debes iniciar sesión para comentar', 'warning');
        return;
    }

    isSubmitting.value = true;
    try {
        const parentId = replyingToComment.value?.id || null;
        const response = await apiSendComment(post.value.id, text, parentId);

        if (response.data.success !== false) {
            const newCommentObj = response.data.data || response.data;
            
            // Datos optimistas
            if (!newCommentObj.user && currentUser.value) {
                newCommentObj.user = { ...currentUser.value };
            }
            newCommentObj.time_ago = newCommentObj.time_ago || 'ahora';
            if (!post.value.comentarios) post.value.comentarios = [];

            // Inserción en el árbol
            if (parentId) {
                recursivelyAddReply(post.value.comentarios, parentId, newCommentObj);
            } else if (!post.value.comentarios.some(c => c.id === newCommentObj.id)) {
                post.value.comentarios.push(newCommentObj);
            }

            showToast(parentId ? 'Respuesta enviada' : 'Comentario agregado', 'success');
            cancelReply();

            setTimeout(() => {
                if (ionContentRef.value) ionContentRef.value.$el.scrollToBottom(300);
            }, 100);
        } else {
            throw new Error(response.data.message);
        }
    } catch (err) {
        showToast('Error al enviar comentario', 'danger');
    } finally {
        isSubmitting.value = false;
    }
};

// ==========================================
// 7. CICLO DE VIDA Y EVENTOS
// ==========================================
const updateWidth = () => windowWidth.value = window.innerWidth;
const downloadFile = (url, name) => openNativeFile(url, name);
const openImageModal = () => isImageModalOpen.value = true;

onMounted(async () => {
    window.addEventListener('resize', updateWidth);
    if (commentBarRef.value) {
        resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) dynamicBarHeight.value = entry.contentRect.height;
        });
        resizeObserver.observe(commentBarRef.value);
    }
    currentUser.value = AuthService.getUser();
    await loadPost();
});

onUnmounted(() => {
    window.removeEventListener('resize', updateWidth);
    if (resizeObserver) resizeObserver.disconnect();
});

// ==========================================
// BLOQUEO DE SCROLL MIENTRAS EL MODAL ESTÁ ABIERTO
// ==========================================
watch(showDeleteModal, (isOpen) => {
    if (ionContentRef.value?.$el) {
        ionContentRef.value.$el.scrollY = !isOpen; // false = bloquea scroll, true = lo permite
    }
});
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';

ion-tabs.layout-with-tabs ion-content {
  --padding-bottom: 0px;
}

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
    /* Declaramos los lados por separado para evitar que choquen */
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 0;
    padding-top: calc(5rem + env(safe-area-inset-top, 0px));
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
    width: 100% !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center;
    background: transparent;
    /* max-height: calc(80vw * 16 / 9) !important; */
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

.comment-input-container .current-user-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
}

.comment-input-container .current-user-avatar ion-icon {
    width: 100%;
    height: 100%;
    font-size: 36px;
}

.comment-input-container .current-user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
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

.comment-input-wrapper ion-input,
.comment-input-wrapper ion-textarea {
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --highlight-height: 0 !important;
}

.comment-input-wrapper ion-input .input-highlight,
.comment-input-wrapper ion-textarea .input-highlight {
    display: none !important;
}

.comment-input-wrapper ion-input .input-bottom,
.comment-input-wrapper ion-textarea .input-bottom {
    display: none !important;
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

/* fondo imagen total - imagen completa sin cortes - borde redondeado suave */
/* --- VISOR DE IMAGEN A PANTALLA COMPLETA --- */
ion-modal.image-viewer-modal {
    --background: rgba(0, 0, 0, 0.95);
    /* Fondo casi negro */
}

ion-modal.image-viewer-modal ion-content {
    --background: #000 !important;
}

.modal-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
}

.fullscreen-img {
    max-width: 100vw;
    max-height: 100vh;
    object-fit: contain;
    /* Evita que se recorte, igual que en el feed */
    user-select: none;
}

.close-image-btn:hover {
    opacity: 1;
}

.close-image-btn {
    position: absolute;
    top: calc(20px + env(safe-area-inset-top));
    /* Respeta el notch del iPhone/Android */
    right: 15px;
    z-index: 100;

    /* Diseño del botón redondo gris */
    --background: rgba(100, 100, 100, 0.6);
    --border-radius: 50%;
    --padding-start: 0;
    --padding-end: 0;
    --border-color: 0.5px solid rgba(255, 255, 255, 0.3);

    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    margin: 0;
    transition: background 0.2s ease;
}

.close-image-btn ion-icon {
    color: #ffffff !important;
    font-size: 20px !important;
}

/* Efecto al tocarlo o pasar el mouse */
.close-image-btn:hover,
.close-image-btn:active {
    --background: rgba(100, 100, 100, 0.9);
}

/* --- FONDO BLUR DEL MODAL --- */
.modal-blur-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    filter: blur(30px) saturate(1.5) brightness(0.5);
    transform: scale(1.1);
    z-index: 0;
}

/* --- AJUSTES DEL CONTENEDOR PARA EL BLUR --- */
.modal-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}

/* Aseguramos que la foto nítida esté por encima del fondo blur */
.fullscreen-img {
    max-width: 100vw;
    max-height: 100vh;
    object-fit: contain;
    user-select: none;
    z-index: 2;
    position: relative;
}

/* IMPORTANTE: El modal debe ser completamente transparente para ver el blur */
ion-modal.image-viewer-modal {
    --background: transparent;
}

ion-modal.image-viewer-modal ion-content {
    --background: transparent;
}



/* --- ESTILOS DEL FOOTER FLOTANTE TIPO TABS --- */

/* Hacemos que el footer nativo de Ionic no tenga fondo ni sombra */
.transparent-footer {
    background: transparent !important;
}

/* El degradado que difumina el contenido detrás de la barra */
.input-gradient-mask {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(10px + 40px + 30px + env(safe-area-inset-bottom));
    /* Altura suficiente para difuminar */
    background: linear-gradient(to top,
            var(--ion-background-color) 0%,
            rgba(var(--ion-background-color-rgb), 0.5) 50%,
            transparent 100%);
    pointer-events: none;
    /* Que no bloquee los clics atrás */
    z-index: 1;
}

/* La barra de comentarios en sí, con diseño tipo píldora flotante */
/* ==========================================
   1. ESTADO NORMAL (Tu diseño original)
   ========================================== */
.floating-comment-bar {
    position: relative;
    z-index: 2; 
    margin: 0 15px max(10px , env(safe-area-inset-bottom)) 15px;
    padding: 8px 15px;
    border-radius: 30px;
    
    min-height: 65px;
    height: auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    
    border: 1px solid #b2b2b221;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    background: var(--ion-card-background); 
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); 
    
    /* 🔥 CAMBIO VITAL: Debe ser hidden para cortar el cristal gigante */
    overflow: hidden; 
    
    transition: background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease;
}


/* ==========================================
   2. ESTADO CRISTAL (Cuando se activa)
   ========================================== */
.floating-comment-bar.is-glass {
    /* Apagamos tus fondos y sombras para dejar ver el SVG que está adentro */
    background: transparent;
    border: none;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
}

/* El SVG de cristal líquido que pusimos en el fondo */
.comment-glass-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0; /* Atrás de todo */
    pointer-events: none;
    border-radius: 30px;
    background: transparent !important;

    /* 1. Forzamos a que ocupe el tamaño físico correcto de inmediato */
    height: 100% !important; 
    
    /* 2. ELIMINAMOS cualquier intento del navegador de animar el cambio del SVG */
    transition: none !important;
    animation: none !important;
}

/* Contenedor del contenido (Avatar, Input, Botón) */
.comment-bar-content {
    position: relative;
    z-index: 1; /* Arriba del SVG */
    width: 100%;
}

/* Ajustes finos para el indicador de respuesta en el cristal */
.is-glass .replying-indicator {
    background-color: rgba(var(--ion-color-light-rgb), 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255,255,255,0.1);
}

/* Limitamos cuánto puede crecer el textarea antes de hacer scroll interno */
/* .comment-input.auto-expand {
    max-height: 120px; 
    overflow-y: auto;
    --padding-start: 5px;
    --padding-end: 5px;
    --padding-top: 8px;
    --padding-bottom: 8px;
} */

.comment-input.auto-expand {
    max-height: 120px;
    overflow-y: auto;
    
    /* ¡AQUÍ ESTÁ LA MAGIA! Aumenta estos valores (12px o 15px suelen verse muy bien) */
    --padding-start: 15px; 
    --padding-end: 15px;
    
    /* Mantenemos el padding superior e inferior */
    --padding-top: 8px;
    --padding-bottom: 8px;
}

/* Opcional: Centrar verticalmente los elementos de la fila inferior */
.input-row {
    display: flex;
    align-items: flex-end; /* Mantiene el avatar y botón abajo mientras el textarea crece */
    gap: 0.75rem;
    padding-bottom: 4px; /* Un poco de respiro al crecer */
}

.current-user-avatar {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
}

.current-user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.current-user-avatar ion-icon {
    width: 100%;
    height: 100%;
    font-size: 36px;
}

.comment-input-wrapper {
    flex: 1;
}

/* Hacemos el input invisible para que se funda con la barra pill */
.comment-input {
    --background: transparent;
    /* Transparente para usar el fondo de la barra */
    --padding-start: 5px;
    --padding-end: 5px;
    --padding-top: 8px;
    --padding-bottom: 8px;
    min-height: 40px;
    font-size: 0.95rem;
}

/* Quitamos la sombra y bordes que trae ionic nativo */
.comment-input::part(native) {
    background: transparent !important;
    border: none !important;
}

.send-comment-button {
    --padding-start: 8px;
    --padding-end: 8px;
    margin: 0;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    --border-radius: 50%;
}

.replying-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--ion-color-light);
    padding: 0.2rem 1rem;
    margin-bottom: 0.5rem;
    border-radius: 20px;
    border-left: none;
    /* Quitamos la raya lateral para que se vea más limpio */
    font-size: 0.85rem;
}


/* --- ESTILOS DEL HEADER DINÁMICO --- */
/* --- ENCABEZADO FLOTANTE TIPO TELEGRAM --- */
.transparent-header {
    background: transparent !important;
    position: absolute; /* Vital: hace que la página pase por debajo */
    top: 0; left: 0; right: 0;
    z-index: 100;
}

/* Oculta la sombra por defecto de Ionic */
ion-header.transparent-header::after {
    display: none !important;
}

.floating-header-container {
    padding-top: calc(10px + env(safe-area-inset-top));
    padding-bottom: 10px;
    padding-left: 15px;
    padding-right: 15px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    pointer-events: none; 
}

/* Estilo base de las burbujas */
.header-bubble {
    background: var(--ion-card-background);
    border: 1px solid rgba(178, 178, 178, 0.15);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    
    /* Vuelve a activar los clics dentro de la burbuja */
    pointer-events: auto; 
    
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease, border 0.3s ease;
}

/* Sincronización con el Efecto Cristal del usuario */
.is-glass-header .header-bubble {
    background: rgba(var(--ion-color-light-rgb), 0.5);
    border: 0.5px solid rgba(255,255,255,0.2);
}

/* Burbuja 1: Circular para volver */
.back-bubble ion-icon {
    font-size: 24px;
    color: var(--ion-color-dark);
}

.back-bubble:active {
    transform: scale(0.95);
    opacity: 0.8;
}

/* Burbuja 2: Píldora para la info */
.info-bubble {
    flex: 1;
    min-height: 44px;
    border-radius: 30px;
    padding: 4px 6px 4px 16px;
    justify-content: space-between;
    overflow: hidden;
}


/* --- ESTILOS DEL INTERIOR DEL HEADER DINÁMICO --- */
.header-title-container {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    height: 100%;
    min-height: 36px;
}

.header-default-title {
    position: absolute;
    width: 100%;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--ion-color-dark);
    /* Ajuste para que se vea centrado visualmente si no está el basurero */
    text-align: left; 
}

.header-user-info {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.header-avatar {
    width: 32px;
    height: 32px;
}

.header-user-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: left;
}

.header-name {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.1;
    color: var(--ion-color-dark);
}

.header-username {
    font-size: 0.75rem;
    color: var(--ion-color-medium);
    line-height: 1.1;
}

/* Burbujas de acción circulares (Sirve para Volver y para Eliminar) */
.action-bubble {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    /* Quitamos los estilos de botón por defecto del navegador */
    border: none; 
    outline: none;
    color: var(--ion-color-dark);
}

.action-bubble ion-icon {
    font-size: 24px;
    /* El color por defecto heredado */
    color: inherit; 
}

/* Color específico para el botón de eliminar */
.action-bubble.delete-bubble {
    color: var(--ion-color-danger);
}

.action-bubble:active {
    transform: scale(0.95);
    opacity: 0.8;
}

/* Burbuja 2: Píldora para la info */
.info-bubble {
    flex: 1;
    min-height: 44px;
    border-radius: 30px;
    padding: 4px 6px 4px;
    /* Ya no necesita justify-content: space-between porque el basurero ya no está aquí */
    justify-content: center; 
    overflow: hidden;
}


/* --- DEGRADADO SUPERIOR (Fade-out al hacer scroll) --- */
.header-gradient-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    /* Altura suficiente para cubrir el notch del teléfono y las burbujas */
    height: calc(75px + env(safe-area-inset-top)); 
    
    /* Degradado lineal de arriba (sólido) hacia abajo (transparente) */
    background: linear-gradient(
        to bottom,
        var(--ion-background-color) 0%,
        rgba(var(--ion-background-color-rgb), 0.7) 40%,
        rgba(var(--ion-background-color-rgb), 0.3) 70%,
        transparent 100%
    );
    
    /* VITAL: Permite que los clics traspasen el degradado para poder tocar la pantalla */
    pointer-events: none; 
    
    /* Lo ponemos por detrás de las burbujas */
    z-index: -1; 
}


/* --- ANIMACIÓN SLIDE-FADE --- */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-enter-from {
    opacity: 0;
    transform: translateY(10px); /* Cambiado a vertical para que se vea más fluido al salir de la píldora */
}

.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* --- ANIMACIÓN SLIDE-FADE --- */
.btn-spinner {
    width: 20px;
    height: 20px;
    color: white;
}



/* ==================================================
   ✨ BORDE DE DESTELLO (Edge Glint) PARA EL CRISTAL ✨
   Mismo patrón que en TabsPage: diagonal arriba-izq / abajo-der
   ================================================== */

/* --- BARRA DE COMENTARIOS --- */
.floating-comment-bar.is-glass::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 30px; /* mismo radio que .floating-comment-bar */
    padding: 2.4px;
    pointer-events: none;
    z-index: 2; /* por encima de .comment-bar-content (z-index:1) */

    /* 🌞 TEMA CLARO (default) → destello NEGRO */
    background: conic-gradient(
        from -45deg,
        rgba(0, 0, 0, 0.35) 0deg,
        rgba(0, 0, 0, 0.03) 60deg,
        rgba(0, 0, 0, 0.03) 150deg,
        rgba(0, 0, 0, 0.22) 180deg,
        rgba(0, 0, 0, 0.03) 210deg,
        rgba(0, 0, 0, 0.03) 300deg,
        rgba(0, 0, 0, 0.35) 360deg
    );

    -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
}

.floating-comment-bar.is-glass {
    box-shadow:
        inset 0 0 10px rgba(0, 0, 0, 0.08),
        0 0 14px rgba(0, 0, 0, 0.06);
}

.ion-palette-dark .floating-comment-bar.is-glass::after {
    background: conic-gradient(
        from -45deg,
        rgba(255, 255, 255, 0.5) 0deg,
        rgba(255, 255, 255, 0.02) 60deg,
        rgba(255, 255, 255, 0.02) 150deg,
        rgba(180, 200, 255, 0.4) 180deg,
        rgba(255, 255, 255, 0.02) 210deg,
        rgba(255, 255, 255, 0.02) 300deg,
        rgba(255, 255, 255, 0.5) 360deg
    );
}

.ion-palette-dark .floating-comment-bar.is-glass {
    box-shadow:
        inset 0 0 10px rgba(255, 255, 255, 0.1),
        0 0 16px rgba(120, 160, 255, 0.12);
}

.delete-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;

    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    touch-action: none; /* 👈 NUEVO: bloquea gestos táctiles sobre el overlay */
}

/* ==================================================
   BOTONES DE ACCIONES Y CONTADORES
   ================================================== */
@keyframes likePop {
    0% { transform: scale(1); }
    40% { transform: scale(1.35); }
    100% { transform: scale(1); }
}

.overlaid-actions-container {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bottom-actions-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 16px 16px; 
}

.custom-pill {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 24px;
    padding: 6px 14px;
    display: flex;
    align-items: center;
    gap: 16px; 
    border: 1px solid rgb(0 0 0 / 15%);
}
.ion-palette-dark .custom-pill {
    border: 1px solid rgba(255, 255, 255, 0.15);
}
.action-btn-custom {
    background: transparent;
    border: none;
    color: #ffffff; 
    display: flex;
    align-items: center;
    gap: 4px; 
    padding: 0;
    margin: 0;
    cursor: pointer;
    line-height: 1; 
}

.action-btn-custom ion-icon {
    font-size: 22px;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.action-btn-custom .liked-active {
    color: #ff4757 !important;
    animation: likePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.action-count {
    font-weight: 600;
    font-size: 0.85rem;
    margin-top: 0; 
    display: inline-block;
}

.overlaid-save-pill {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(0 0 0 / 15%);
}

.ion-palette-dark .overlaid-save-pill {
    border: 1px solid rgba(255, 255, 255, 0.15);
}

.overlaid-save-pill ion-icon {
    color: #ffffff;
    font-size: 20px;
}

.adapt-color, .adapt-color-icon {
    color: var(--ion-color-dark, #333) !important;
}
.adapt-color ion-icon {
    color: var(--ion-color-dark, #333) !important;
}
.adapt-color .liked-active {
    color: #ff4757 !important; 
}

:global(body.dark) .solid-pill,
:global(.ion-palette-dark) .solid-pill {
    background: rgba(255, 255, 255, 0.1);
}
:global(body.dark) .adapt-color,
:global(body.dark) .adapt-color ion-icon,
:global(body.dark) .adapt-color-icon,
:global(.ion-palette-dark) .adapt-color,
:global(.ion-palette-dark) .adapt-color ion-icon,
:global(.ion-palette-dark) .adapt-color-icon {
    color: #ffffff !important;
}

</style>

<style>
/* Estilos globales */
.comment-input-wrapper ion-textarea {
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --highlight-height: 0 !important;
}

.comment-input-wrapper ion-textarea .input-highlight {
    display: none !important;
}

.comment-input-wrapper ion-textarea .input-bottom {
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

/* ========== MODAL PERSONALIZADO: ELIMINAR PUBLICACIÓN ========== */
.delete-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;

    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

.delete-modal {
    width: 100%;
    max-width: 320px;
    padding: 28px 24px 20px 24px;
    border-radius: 24px;
    text-align: center;

    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);

    backdrop-filter: blur(20px) saturate(1.5);
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
}

.ion-palette-dark .delete-modal {
    background: rgba(28, 28, 30, 0.9);
    border-color: rgba(255, 255, 255, 0.08);
}

.delete-modal-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 14px auto;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
}

.delete-modal-icon ion-icon {
    font-size: 26px;
    color: #ef4444;
}

.delete-modal-title {
    margin: 0 0 6px 0;
    font-size: 17px;
    font-weight: 700;
    color: var(--ion-color-dark, #1c1c1e);
}

.delete-modal-message {
    margin: 0 0 22px 0;
    font-size: 13.5px;
    line-height: 1.4;
    color: var(--ion-color-medium, #6b7280);
}

.delete-modal-actions {
    display: flex;
    gap: 10px;
}

.delete-modal-btn {
    flex: 1;
    height: 46px;
    border-radius: 14px;
    border: none;
    font-size: 14.5px;
    font-weight: 600;
    cursor: pointer;
}

.delete-modal-cancel {
    background: rgba(0, 0, 0, 0.06);
    color: var(--ion-color-dark, #1c1c1e);
}

.ion-palette-dark .delete-modal-cancel {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
}

.delete-modal-confirm {
    background: #ef4444;
    color: #ffffff;
}

/* ========== ANIMACIONES DEL MODAL ========== */
.delete-fade-enter-active,
.delete-fade-leave-active {
    transition: opacity 0.25s ease;
}

.delete-fade-enter-from,
.delete-fade-leave-to {
    opacity: 0;
}

.delete-scale-enter-active {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

.delete-scale-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.delete-scale-enter-from {
    transform: scale(0.85);
    opacity: 0;
}

.delete-scale-leave-to {
    transform: scale(0.9);
    opacity: 0;
}
</style>
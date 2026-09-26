<template>
    <div class="post-wrapper" @click="goToPostDetail">
       
        <!-- ========================================== -->
        <!-- 1. BURBUJA PRINCIPAL (Header + Imagen/Música)-->
        <!-- ========================================== -->
        <div class="post-main-bubble">
            
            <!-- ENCABEZADO -->
            <div class="post-header-redesign">
                <div class="post-user-left" @click.stop="goToProfile(post.user?.id)">
                    <ion-avatar class="post-avatar-small">
                        <img
                            v-if="post.user?.imagen_url"
                            :src="getFullImageUrl(post.user.imagen_url)"
                            :alt="post.user?.name || 'Usuario'"
                            loading="lazy"
                            @error="handleImageError"
                        />
                        <ion-icon
                            v-else
                            :icon="personCircle"
                            size="large"
                        ></ion-icon>
                    </ion-avatar>

                    <div
                        class="post-user-info"
                        v-memo="[post.user?.name, post.user?.username]"
                    >
                        <h3>{{ post.user?.name || 'Usuario' }}</h3>
                        <p class="post-meta">
                            {{ formatTimeRelative(post.created_at) }}
                        </p>
                    </div>
                </div>
                
                <div class="post-actions-right">
                    <!-- Botón Seguir -->
                    <!--
                    <ion-button
                        fill="solid"
                        class="btn-follow"
                        @click.stop="handleFollow"
                    >
                        FOLLOW
                    </ion-button>
                    -->

                    <!-- Menú de 3 puntos -->
                    <!--
                    <ion-button
                        fill="clear"
                        class="btn-more-options"
                        @click.stop="handleOptions"
                    >
                        <ion-icon :icon="ellipsisVertical"></ion-icon>
                    </ion-button>
                    -->
                </div>
            </div>

            <!-- ========================================== -->
            <!-- MEDIOS DEL POST (FOTO, MUSICA O ARCHIVO) -->
            <!-- ========================================== -->

            <!-- CASO 1: FOTOGRAFÍA -->
            <div
                v-if="post.tipo === 'imagen' && post.imagen_url"
                class="post-media-container"
                :class="{ 'is-loaded': isImageLoaded }"
                @click.stop="openImageModal"
            >
                <div
                    class="image-placeholder"
                    :class="{ 'is-hidden': isImageLoaded }"
                >
                    <ion-spinner name="crescent"></ion-spinner>
                </div>

                <img
                    :src="getFullImageUrl(post.imagen_mini_url || post.imagen_url)"
                    loading="lazy"
                    alt="Publicación"
                    @load="isImageLoaded = true"
                    @error="handleImageError"
                    class="post-media"
                    :class="{ 'is-visible': isImageLoaded }"
                />

                <!-- Acciones superpuestas en la imagen -->
                <div class="overlaid-actions-container">
                    <div class="overlaid-actions-pill custom-pill text-white">
                        <PostActions
                            :post="post"
                            @like="handleLike"
                            @comment="handleComment"
                            @share="handleShare"
                        />
                    </div>
                    
                    <!--
                    <div
                        class="overlaid-save-pill"
                        @click.stop="handleSave"
                    >
                        <ion-icon :icon="bookmarkOutline"></ion-icon>
                    </div>
                    -->
                </div>
            </div>

            <!-- CASO 2: MÚSICA -->
            <div
                v-else-if="post.tipo === 'musica'"
                class="full-width-media"
            >
                <div class="music-player-wrapper">
                    <MusicPlayer
                        :post="post"
                        @imageError="handleImageError"
                        class="seamless-player"
                    />
                </div>
                
                <!-- Acciones en la parte inferior de la burbuja -->
                <div class="bottom-actions-container">
                    <div class="overlaid-actions-pill custom-pill">
                        <PostActions
                            :post="post"
                            @like="handleLike"
                            @comment="handleComment"
                            @share="handleShare"
                        />
                    </div>
                    
                    <!--
                    <div
                        class="overlaid-save-pill solid-pill"
                        @click.stop="handleSave"
                    >
                        <ion-icon
                            :icon="bookmarkOutline"
                            class="adapt-color-icon"
                        ></ion-icon>
                    </div>
                    -->
                </div>
            </div>

            <!-- CASO 3: ARCHIVO -->
            <div
                v-else-if="post.tipo === 'archivo' && post.archivo_url"
                class="full-width-media"
            >
                <div class="file-attachment-seamless">
                    <div class="file-info">
                        <div class="file-icon-container">
                            <ion-icon
                                :icon="documentAttach"
                                size="large"
                                :color="getFileColor(post.archivo)"
                            ></ion-icon>
                        </div>

                        <div class="file-details">
                            <h4>{{ getFileName(post.archivo) }}</h4>
                            <p>{{ getFileExtension(post.archivo) }}</p>
                        </div>
                    </div>

                    <ion-button
                        fill="clear"
                        size="small"
                        @click.stop="downloadFile(post.archivo_url, post.archivo)"
                    >
                        <ion-icon :icon="downloadOutline"></ion-icon>
                    </ion-button>
                </div>
                
                <div class="bottom-actions-container">
                    <div class="overlaid-actions-pill custom-pill">
                        <PostActions
                            :post="post"
                            @like="handleLike"
                            @comment="handleComment"
                            @share="handleShare"
                        />
                    </div>
                    
                    <!--
                    <div
                        class="overlaid-save-pill solid-pill"
                        @click.stop="handleSave"
                    >
                        <ion-icon
                            :icon="bookmarkOutline"
                            class="adapt-color-icon"
                        ></ion-icon>
                    </div>
                    -->
                </div>
            </div>

        </div>
        <!-- Cierra Burbuja Principal -->

        <!-- ========================================== -->
        <!-- 2. BURBUJA DE DESCRIPCIÓN INDEPENDIENTE -->
        <!-- ========================================== -->
        <div
            class="post-caption-bubble"
            v-if="post.titulo || post.descripcion || post.texto"
        >
            <h2
                v-if="post.titulo"
                class="post-title"
            >
                {{ post.titulo }}
            </h2>
            
            <p
                v-if="post.descripcion"
                class="post-text"
            >
                <strong
                    v-if="post.user?.username"
                    class="caption-username"
                >
                    {{ post.user.username }}
                </strong>

                <span
                    v-html="formatTextWithLinks(post.descripcion)"
                    @click="handleLinkClick"
                ></span>
            </p>
            
            <p
                v-if="post.texto && !post.descripcion"
                class="post-text"
            >
                <strong
                    v-if="post.user?.username"
                    class="caption-username"
                >
                    {{ post.user.username }}
                </strong>

                <span
                    v-html="formatTextWithLinks(post.texto)"
                    @click="handleLinkClick"
                ></span>
            </p>
        </div>

        <!-- ========================================== -->
        <!-- 3. BURBUJA DE COMENTARIO Y LÍNEA -->
        <!-- ========================================== -->

        <!--
        <div
            class="post-comment-container"
            v-if="
                post.latest_comment ||
                (post.comentarios && post.comentarios.length > 0)
            "
        >
            <div class="thread-line"></div>
            
            <div
                class="post-comment-bubble"
                @click.stop="handleComment(post.id)"
            >
                <div class="comment-left">
                    <img
                        class="comment-avatar"
                        :src="
                            post.latest_comment?.user?.imagen_url ||
                            (
                                post.comentarios &&
                                post.comentarios[0]?.user?.imagen_url
                            )
                                ? getFullImageUrl(
                                    post.latest_comment?.user?.imagen_url ||
                                    post.comentarios[0]?.user?.imagen_url
                                )
                                : 'https://ionicframework.com/docs/img/demos/avatar.svg'
                        "
                    />

                    <p class="comment-text-preview">
                        <strong>
                            {{
                                post.latest_comment?.user?.username ||
                                (
                                    post.comentarios &&
                                    post.comentarios[0]?.user?.username
                                ) ||
                                'Usuario'
                            }}
                        </strong>

                        {{
                            post.latest_comment?.texto ||
                            (
                                post.comentarios &&
                                post.comentarios[0]?.texto
                            ) ||
                            'Ver comentarios...'
                        }}
                    </p>
                </div>

                <div
                    class="comment-right"
                    @click.stop="console.log('Like a comentario')"
                >
                    <ion-icon :icon="heartOutline"></ion-icon>

                    <span>
                        {{
                            Array.isArray(post.latest_comment?.likes)
                                ? post.latest_comment.likes.length
                                : (post.latest_comment?.likes || 0)
                        }}
                    </span>
                </div>
            </div>
        </div>
        -->

        <!-- Visor de Pantalla Completa -->
        <FullScreenImageViewer
            v-if="post"
            :is-open="isImageModalOpen"
            :image-url="getFullImageUrl(post.imagen_url)"
            @close="isImageModalOpen = false"
        />
    </div>
</template>

<script>
import {
    IonAvatar,
    IonIcon,
    IonButton,
    IonSpinner,
} from '@ionic/vue'

import {
    personCircle,
    documentAttach,
    downloadOutline,
    ellipsisVertical,
    heart,
    heartOutline,
    bookmarkOutline,
    chatbubbleOutline,
    shareOutline
} from 'ionicons/icons'

import MusicPlayer from './MusicPlayer.vue'
import { useRouter } from 'vue-router'
import { Share } from '@capacitor/share'
import PostActions from './PostActions.vue'
import { ref } from 'vue'
import { Browser } from '@capacitor/browser'
import { openNativeFile } from '@/services/FileService'
import { getFullImageUrl } from '@/utils/imageUtils'
import FullScreenImageViewer from './FullScreenImageViewer.vue'

export default {
    name: 'PostCard',

    components: {
        IonAvatar,
        IonIcon,
        IonButton,
        IonSpinner,
        MusicPlayer,
        FullScreenImageViewer,
        PostActions
    },

    props: {
        post: {
            type: Object,
            required: true
        }
    },

    emits: [
        'like',
        'comment',
        'share',
        'imageError'
    ],

    setup(props, { emit }) {
        const isImageLoaded = ref(false)
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
            event.stopPropagation()
            emit('share', props.post.id)
        }
        
        const handleImageError = (event) => {
            emit('imageError', event)
        }
        
        const handleFollow = () => {
            console.log(
                'Seguir a',
                props.post.user?.username
            )
        }

        const handleOptions = () => {
            console.log('Abrir menú de opciones')
        }

        const handleSave = () => {
            console.log('Guardar post')
        }

        const goToProfile = (userId) => {
            console.log('Ir al perfil', userId)
        }

        // ==========================================
        // FUNCIONES PARA EVITAR EL "[]"
        // ==========================================

        const getLikes = (post) => {
            if (typeof post.likes_count === 'number') {
                return post.likes_count
            }

            if (Array.isArray(post.likes)) {
                return post.likes.length
            }

            if (typeof post.likes === 'number') {
                return post.likes
            }

            return 0
        }

        const getComments = (post) => {
            if (
                typeof post.comentarios_count ===
                'number'
            ) {
                return post.comentarios_count
            }

            if (Array.isArray(post.comentarios)) {
                return post.comentarios.length
            }

            if (
                typeof post.comentarios ===
                'number'
            ) {
                return post.comentarios
            }

            return 0
        }

        // ==========================================

        const formatTimeRelative = (dateString) => {
            if (!dateString) {
                return 'today'
            }

            const date = new Date(dateString)
            const now = new Date()

            const secondsDiff = Math.floor(
                (now - date) / 1000
            )

            if (secondsDiff < 60) {
                return 'Hace un momento'
            }

            const minutesDiff = Math.floor(
                secondsDiff / 60
            )

            if (minutesDiff < 60) {
                return `Hace ${minutesDiff}m`
            }

            const hoursDiff = Math.floor(
                minutesDiff / 60
            )

            if (hoursDiff < 24) {
                return `${date
                    .getHours()
                    .toString()
                    .padStart(2, '0')}:${date
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}`
            }

            const daysDiff = Math.floor(
                hoursDiff / 24
            )

            if (daysDiff < 7) {
                return daysDiff === 1
                    ? 'Ayer'
                    : `Hace ${daysDiff}d`
            }

            return date.toLocaleDateString(
                'es-SV',
                {
                    month: 'short',
                    day: 'numeric'
                }
            )
        }

        const getFileName = (filePath) => {
            if (!filePath) {
                return 'Archivo'
            }

            return filePath
                .split('/')
                .pop()
                .replace(/^\d+_/, '')
        }

        const getFileExtension = (filePath) => {
            if (!filePath) {
                return ''
            }

            return `Archivo ${filePath
                .split('.')
                .pop()
                .toUpperCase()}`
        }

        const downloadFile = (
            urlArchivo,
            nombreArchivo
        ) => {
            openNativeFile(
                urlArchivo,
                nombreArchivo
            )
        }

        const getFileColor = (filePath) => {
            if (!filePath) {
                return 'medium'
            }

            const extension = filePath
                .split('.')
                .pop()
                .toLowerCase()

            const colors = {
                pdf: 'danger',
                doc: 'primary',
                docx: 'primary',
                zip: 'warning',
                rar: 'warning',
                txt: 'medium',
                xlsx: 'success',
                xls: 'success'
            }

            return colors[extension] || 'medium'
        }

        const isImageModalOpen = ref(false)

        const openImageModal = () => {
            isImageModalOpen.value = true
        }
        
        const formatTextWithLinks = (text) => {
            if (!text) {
                return ''
            }

            const urlRegex =
                /(https?:\/\/[^\s]+)/g

            return text.replace(
                urlRegex,
                (url) => {
                    return `<a href="${url}" class="post-link">${url}</a>`
                }
            )
        }

        const handleLinkClick = async (event) => {
            const link =
                event.target.closest('a')

            if (
                link &&
                link.classList.contains(
                    'post-link'
                )
            ) {
                event.preventDefault()
                event.stopPropagation()

                try {
                    await Browser.open({
                        url: link.href
                    })
                } catch (error) {
                    console.error(
                        'Error al abrir el enlace:',
                        error
                    )
                }
            }
        }

        return {
            personCircle,
            documentAttach,
            downloadOutline,
            ellipsisVertical,
            heart,
            heartOutline,
            bookmarkOutline,
            chatbubbleOutline,
            shareOutline,

            goToPostDetail,
            handleLike,
            handleComment,
            handleShare,
            handleImageError,
            handleFollow,
            handleOptions,
            handleSave,
            goToProfile,

            getFileName,
            getFileExtension,
            downloadFile,
            getFileColor,

            getFullImageUrl,
            formatTextWithLinks,
            handleLinkClick,

            isImageModalOpen,
            openImageModal,
            isImageLoaded,
            formatTimeRelative,

            getLikes,
            getComments
        }
    }
}
</script>

<style scoped>
/* ==================================================
   CONTENEDOR GLOBAL DEL POST
   ================================================== */

.post-wrapper {
    margin-bottom: 24px;
    position: relative;
}

/* Variables de color de las burbujas */
.post-main-bubble,
.post-caption-bubble,
.post-comment-bubble {
    background: #ffffff;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

/* Modo oscuro nativo */
.ion-palette-dark .post-main-bubble,
.ion-palette-dark .post-caption-bubble,
.ion-palette-dark .post-comment-bubble {
    background-color: #1E1E1E;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
}

/* ==================================================
   1. BURBUJA PRINCIPAL (Header + Imagen/Música)
   ================================================== */

.post-main-bubble {
    border-radius: 28px;
    overflow: hidden;
}

/* --- ENCABEZADO --- */

.post-header-redesign {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
}

.post-user-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.post-avatar-small {
    width: 36px;
    height: 36px;
}

.post-avatar-small img {
    border-radius: 50%;
    object-fit: cover;
    width: 100%;
    height: 100%;
}

.post-user-info h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ion-color-dark, #333);
}

.post-user-info .post-meta {
    margin: 2px 0 0 0;
    font-size: 0.75rem;
    color: var(--ion-color-medium, #888);
}

.post-actions-right {
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-follow {
    --background: var(
        --ion-color-primary,
        #10b981
    );

    --color: #ffffff;
    --border-radius: 20px;
    --box-shadow: none;

    font-size: 0.65rem;
    font-weight: 700;
    height: 28px;
    margin: 0;
    letter-spacing: 0.5px;
}

.btn-more-options {
    --color: var(
        --ion-color-medium,
        #888
    );

    margin: 0;
    --padding-start: 4px;
    --padding-end: 0;
}

/* ==================================================
   MEDIOS: IMAGEN
   ================================================== */

.post-media-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    background-color: var(
        --ion-color-step-100,
        #111
    );
    overflow: hidden;
}

.post-media-container:not(.is-loaded) {
    background-color: var(
        --ion-color-step-100,
        #111
    );
}

.post-media {
    opacity: 0;
    transition: opacity 0.4s ease-in-out;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.post-media.is-visible {
    opacity: 1;
}

.image-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;

    transform: translate(
        -50%,
        -50%
    );

    z-index: 5;
    width: 32px;
    height: 32px;

    transition: opacity 0.3s ease;
}

.image-placeholder.is-hidden {
    opacity: 0;
    visibility: hidden;
}

/* ==================================================
   MEDIOS: MÚSICA Y ARCHIVO
   ================================================== */

.full-width-media {
    width: 100%;
    position: relative;
    overflow: hidden;
}

.music-player-wrapper {
    width: 100%;
    margin: 0 !important;
    padding: 0 !important;
    display: block;
    box-sizing: border-box;
}

.seamless-player {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block;
}

:deep(.seamless-player > *),
:deep(.seamless-player ion-card) {
    margin-left: 0 !important;
    margin-right: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;

    width: 100% !important;
    max-width: 100% !important;

    border-radius: 0 !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
}

.file-attachment-seamless {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 16px;

    background:
        rgba(128, 128, 128, 0.05);

    border-top:
        1px solid
        rgba(128, 128, 128, 0.1);

    border-bottom:
        1px solid
        rgba(128, 128, 128, 0.1);
}

.file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.file-details h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ion-color-dark);
}

.file-details p {
    margin: 0.25rem 0 0 0;
    font-size: 0.8rem;
    color: var(--ion-color-medium);
}

/* ==================================================
   BOTONES DE ACCIONES Y CONTADORES
   ================================================== */

@keyframes likePop {
    0% {
        transform: scale(1);
    }

    40% {
        transform: scale(1.35);
    }

    100% {
        transform: scale(1);
    }
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

    padding:
        12px
        16px
        16px
        16px;
}

.custom-pill {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);

    border-radius: 24px;

    padding: 6px 14px;

    display: flex;
    align-items: center;
    gap: 16px;

    border:
        1px solid
        rgb(0 0 0 / 15%);
}

.ion-palette-dark .custom-pill {
    border:
        1px solid
        rgba(255, 255, 255, 0.15);
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

    transition:
        transform
        0.2s
        cubic-bezier(
            0.175,
            0.885,
            0.32,
            1.275
        );
}

.action-btn-custom .liked-active {
    color: #ff4757 !important;

    animation:
        likePop
        0.4s
        cubic-bezier(
            0.175,
            0.885,
            0.32,
            1.275
        )
        forwards;
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

    border:
        1px solid
        rgb(0 0 0 / 15%);
}

.ion-palette-dark
.overlaid-save-pill {
    border:
        1px solid
        rgba(255, 255, 255, 0.15);
}

.overlaid-save-pill ion-icon {
    color: #ffffff;
    font-size: 20px;
}

.adapt-color,
.adapt-color-icon {
    color:
        var(
            --ion-color-dark,
            #333
        )
        !important;
}

.adapt-color ion-icon {
    color:
        var(
            --ion-color-dark,
            #333
        )
        !important;
}

.adapt-color .liked-active {
    color: #ff4757 !important;
}

:global(body.dark) .solid-pill,
:global(.ion-palette-dark)
.solid-pill {
    background:
        rgba(255, 255, 255, 0.1);
}

:global(body.dark)
.adapt-color,
:global(body.dark)
.adapt-color ion-icon,
:global(body.dark)
.adapt-color-icon,
:global(.ion-palette-dark)
.adapt-color,
:global(.ion-palette-dark)
.adapt-color ion-icon,
:global(.ion-palette-dark)
.adapt-color-icon {
    color: #ffffff !important;
}

/* ==================================================
   2. BURBUJA DE DESCRIPCIÓN
   ================================================== */

.post-caption-bubble {
    border-radius: 20px;
    padding: 12px 16px;
    margin-top: 6px;
}

.post-title {
    font-size: 1rem;
    font-weight: 700;

    margin-top: 0;
    margin-bottom: 4px;

    color:
        var(
            --ion-color-dark,
            #333
        );
}

.post-text {
    font-size: 0.95rem;
    line-height: 1.4;

    color:
        var(
            --ion-color-dark,
            #333
        );

    margin: 0;
}

:deep(.post-link) {
    color: var(--ion-color-primary);
    text-decoration: none;
    font-weight: 500;
}

/* ==================================================
   3. BURBUJA DE COMENTARIO Y LÍNEA CONECTORA
   ================================================== */

.post-comment-container {
    position: relative;
    margin-top: 6px;
    padding-left: 36px;
}

.post-comment-bubble {
    border-radius: 20px;
    padding: 10px 14px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.thread-line {
    position: absolute;

    left: 32px;
    top: -12px;
    bottom: 50%;

    width: 14px;

    border-left:
        2px solid
        var(
            --ion-color-step-300,
            #999
        );

    border-bottom:
        2px solid
        var(
            --ion-color-step-300,
            #999
        );

    border-bottom-left-radius:
        12px;

    z-index: 1;
}

.comment-left {
    display: flex;
    align-items: center;

    gap: 8px;
    flex: 1;
    overflow: hidden;
}

.comment-avatar {
    width: 26px;
    height: 26px;

    border-radius: 50%;
    object-fit: cover;
}

.comment-text-preview {
    margin: 0;

    font-size: 0.85rem;

    color:
        var(
            --ion-color-medium,
            #555
        );

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.comment-text-preview strong {
    color:
        var(
            --ion-color-dark,
            #333
        );

    font-weight: 600;
    margin-right: 4px;
}

.comment-right {
    display: flex;
    align-items: center;
    gap: 4px;

    color:
        var(
            --ion-color-dark,
            #333
        );
}

.comment-right ion-icon {
    font-size: 16px;
}

.comment-right span {
    font-size: 0.8rem;
    font-weight: 600;
}

/* ==================================================
   BLINDAJE MODO OSCURO (TEXTOS)
   ================================================== */

:global(body.dark) .post-text,
:global(body.dark) .post-title,
:global(body.dark) .caption-username,
:global(body.dark) .post-user-info h3,
:global(body.dark)
.comment-text-preview strong,
:global(body.dark) .comment-right,
:global(.ion-palette-dark)
.post-text,
:global(.ion-palette-dark)
.post-title,
:global(.ion-palette-dark)
.caption-username,
:global(.ion-palette-dark)
.post-user-info h3,
:global(.ion-palette-dark)
.comment-text-preview strong,
:global(.ion-palette-dark)
.comment-right {
    color: #ffffff !important;
}

:global(body.dark)
.comment-text-preview,
:global(.ion-palette-dark)
.comment-text-preview {
    color: #aaaaaa !important;
}
</style>
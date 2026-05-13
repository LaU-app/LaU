<template>
    <ion-card 
        class="post-card" 
        :class="{ 
            'card-image-style': post.tipo === 'imagen' && isAmbientMode, 
            'is-dark-bg': post.tipo === 'imagen' && isAmbientMode && !isDarkImage, 
            'normal-card': !isAmbientMode || post.tipo !== 'imagen'
        }" 
        :style="isAmbientMode ? { '--ambient-gradient': ambientGradient } : {}"
        @click="goToPostDetail"
    >
       
        <div 
            v-if="post.tipo === 'imagen' && (post.imagen_mini_url || post.imagen_url) && isAmbientMode" 
            class="card-main-blur" 
            :style="{ backgroundImage: `url(${getFullImageUrl(post.imagen_mini_url || post.imagen_url)})` }"
        ></div>
       
        <!-- Post Header -->
        <ion-card-header class="relative-content">
            <div class="post-header">
                <ion-avatar class="post-avatar">
                    <img v-if="post.user?.imagen_url" :src="getFullImageUrl(post.user.imagen_url)" :alt="post.user?.name || 'Usuario'"
                        loading="lazy" @error="handleImageError" />
                    <ion-icon v-else :icon="personCircle" size="large"></ion-icon>
                </ion-avatar>
                <div class="post-user-info" v-memo="[post.user?.name, post.user?.username]">
                    <ion-text>
                        <h3>{{ post.user?.name || 'Usuario' }}</h3>
                    </ion-text>
                    <ion-text>
                        <!-- <p class="post-meta">{{ post.user?.username || 'username' }} • Hace {{
                            timeAgo(post.created_at) }}</p> -->
                        
                        <p class="post-meta">{{ post.user?.username || 'username' }} • {{ formatTimeRelative(post.created_at) }}</p>
                    </ion-text>
                </div>
            </div>
        </ion-card-header>

        <!-- Post Content -->
        <ion-card-content class="relative-content">
            <!-- Título y/o Descripción o Texto (Dinámico) -->
            <ion-text v-if="post.titulo || post.descripcion || post.texto">
                <h2 v-if="post.titulo" class="post-title">{{ post.titulo }}</h2>
                <p v-if="post.descripcion" class="post-text" v-html="formatTextWithLinks(post.descripcion)" @click="handleLinkClick"></p>
                <p v-if="post.texto && !post.descripcion" class="post-text post-text-only" v-html="formatTextWithLinks(post.texto)" @click="handleLinkClick"></p>
            </ion-text>

            <!-- Imagen Post -->
            <!-- <div v-if="post.tipo === 'imagen' && post.imagen_url" class="post-media" @click.stop="openImageModal">
                <ion-img :src="getFullImageUrl(post.imagen_url)" :alt="post.titulo || 'Post'" @ionError="handleImageError" class="post-media">
                    <div slot="image" style="position: relative; padding-top: 75%; background: var(--ion-color-light);">
                        <ion-spinner name="crescent" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></ion-spinner>
                    </div>
                </ion-img>
            </div> -->

            <!-- <div v-if="post.tipo === 'imagen' && post.imagen_url" 
                 class="post-media-container" 
                 :class="{ 'is-loaded': post.imageLoaded }" 
                 @click.stop="openImageModal">
                
                <div class="image-placeholder" :class="{ 'is-hidden': post.imageLoaded }">
                    <ion-spinner name="crescent"></ion-spinner>
                </div>

                <ion-img 
                    :src="getFullImageUrl(post.imagen_mini_url || post.imagen_url)" 
                    alt="" 
                    @ionImgDidLoad="post.imageLoaded = true" 
                    @ionError="handleImageError" 
                    class="post-media"
                    :class="{ 'is-visible': post.imageLoaded }">
                </ion-img>
            </div> -->

            <div v-if="post.tipo === 'imagen' && post.imagen_url" 
                 class="post-media-container" 
                 :class="{ 'is-loaded': isImageLoaded }" 
                 @click.stop="openImageModal">
                
                <div class="image-placeholder" :class="{ 'is-hidden': isImageLoaded }">
                    <ion-spinner name="crescent"></ion-spinner>
                </div>

                <!-- <ion-img 
                    :src="getFullImageUrl(post.imagen_mini_url || post.imagen_url)" 
                    alt="" 
                    @ionImgDidLoad="isImageLoaded = true" 
                    @ionError="handleImageError" 
                    class="post-media"
                    :class="{ 'is-visible': isImageLoaded }">
                </ion-img> -->

                <img 
                    :src="getFullImageUrl(post.imagen_mini_url || post.imagen_url)" 
                    loading="lazy"
                    alt="Publicación" 
                    @load="isImageLoaded = true" 
                    @error="handleImageError" 
                    class="post-media"
                    :class="{ 'is-visible': isImageLoaded }"
                />
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
                <ion-button fill="clear" size="small" @click.stop="downloadFile(post.archivo_url, post.archivo)">
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
        <ion-card-content class="post-footer relative-content">
            <PostActions :post="post" @like="handleLike" @comment="handleComment" />
        </ion-card-content>

        <FullScreenImageViewer 
            v-if="post" 
            :is-open="isImageModalOpen"
            :image-url="getFullImageUrl(post.imagen_url)"
            :is-ambient-mode="isAmbientMode"
            @close="isImageModalOpen = false"
        />

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
    IonSpinner,
    IonModal,
    createGesture
} from '@ionic/vue'
import { personCircle, documentAttach, downloadOutline, closeOutline } from 'ionicons/icons'
import MusicPlayer from './MusicPlayer.vue'
import PostActions from './PostActions.vue'
import { timeAgo } from '@/utils/timeUtils'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue';
import * as VibrantNamespace from 'node-vibrant';
import { useAmbientMode } from "@/utils/useAmbientMode";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { CapacitorHttp } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { openNativeFile } from '@/services/FileService';
import { getFullImageUrl } from '@/utils/imageUtils';
import FullScreenImageViewer from './FullScreenImageViewer.vue';
import { BASE_URL } from '../services/api.js'; 


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
        PostActions,
        IonModal,
        FullScreenImageViewer
    },
    props: {
        post: {
            type: Object,
            required: true
        }
    },
    emits: ['like', 'comment', 'share', 'imageError'],
    setup(props, { emit }) {
        const isImageLoaded = ref(false);
        
        const router = useRouter()
        const { isAmbientMode } = useAmbientMode();

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

        // Agrega esta función en tu <script setup> o en tus utilidades
        const formatTimeRelative = (dateString) => {
            if (!dateString) return '';

            const date = new Date(dateString);
            const now = new Date();
            const secondsDiff = Math.floor((now - date) / 1000);

            // Menos de un minuto
            if (secondsDiff < 60) {
                return 'Hace un momento';
            }

            // Menos de una hora
            const minutesDiff = Math.floor(secondsDiff / 60);
            if (minutesDiff < 60) {
                return `Hace ${minutesDiff}m`; // o 'Hace 5 minutos'
            }

            // Menos de un día (24 horas)
            const hoursDiff = Math.floor(minutesDiff / 60);
            if (hoursDiff < 24) {
                return `Hace ${hoursDiff}h`; // o 'Hace 3 horas'
            }

            // Menos de una semana (7 días)
            const daysDiff = Math.floor(hoursDiff / 24);
            if (daysDiff < 7) {
                return daysDiff === 1 ? 'Ayer' : `Hace ${daysDiff} d`; // o 'Hace 2 días'
            }

            // --- Si pasaron más de 7 días, mostramos la fecha estática (Sin el "Hace") ---

            const options = { month: 'short', day: 'numeric' }; // Ej: "21 feb"

            // Si es de un año anterior, le agregamos el año a la etiqueta
            if (date.getFullYear() !== now.getFullYear()) {
                options.year = 'numeric'; // Ej: "21 feb 2025"
            }

            // Usamos el API nativa de Javascript para traducir los meses al español (es-ES o es-SV)
            return date.toLocaleDateString('es-SV', options);
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

        const downloadFile = (urlArchivo, nombreArchivo) => {
             // Si nombreArchivo viene con la ruta entera, puedes limpiarlo aquí antes
             // const nombreLimpio = getFileName(nombreArchivo);
             openNativeFile(urlArchivo, nombreArchivo);
        };

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

        const isDarkImage = ref(false);

        const ambientGradient = ref('linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1))');

        // const extractColors = async (imageUrl) => {
        //     if (!imageUrl) return;

        //     try {
        //         const VibrantClass = VibrantNamespace.Vibrant || VibrantNamespace.default || VibrantNamespace;
                
        //         // 1. Limpiamos la URL (lo que ya hacías y te funcionaba)
        //         const relativePath = imageUrl.replace(/^.*\/\/[^\/]+/, '').replace(/^\//, '');

        //         // 2. Definimos la URL final
        //         // En local usará el proxy (/uploads) y en el APK usará el dominio completo
        //         const isLocal = window.location.host.includes('localhost:8100');

        //         const finalUrl = isLocal ? `/${relativePath}` : `${BASE_URL}/${relativePath}`;
                
        //         const urlWithCache = `${finalUrl}?t=${Date.now()}`;

        //         // 3. CARGA DE IMAGEN (El método más compatible)
        //         const img = new Image();
                
        //         // Solo pedimos crossOrigin si vamos al dominio real
        //         if (!isLocal) {
        //             img.crossOrigin = "anonymous";
        //         }

        //         const imagePromise = new Promise((resolve, reject) => {
        //             img.onload = () => resolve(img);
        //             img.onerror = () => reject(new Error("Error de red en el servidor"));
        //             img.src = urlWithCache;
        //         });

        //         const loadedImg = await imagePromise;
        //         const palette = await VibrantClass.from(loadedImg).getPalette();

        //         if (palette.Vibrant) {
        //             const rgb = palette.Vibrant.getRgb();
        //             const brightness = (rgb[0] * 0.299 + rgb[1] * 0.557 + rgb[2] * 0.114);
        //             const vPop = palette.Vibrant.getPopulation();
        //             const dvPop = palette.DarkVibrant ? palette.DarkVibrant.getPopulation() : 0;

        //             // isDarkImage.value = (brightness < 150) || (dvPop > vPop * 2);
        //             isDarkImage.value = (brightness < 165) || (dvPop > vPop * 2);
        //             ambientGradient.value = `linear-gradient(135deg, rgba(${rgb.join(',')}, 0.9), rgba(0,0,0,0.4))`;

        //             // LOG NIVEL INGENIERO PARA SIVARSOCIAL
        //             // console.log(
        //             //     `%c[SivarSocial] ${Capacitor.getPlatform().toUpperCase()} %c
        //             //     🎨 Modo UI: ${isDarkImage.value ? 'OSCURO (Texto Blanco)' : 'CLARO (Texto Negro)'}
        //             //     ✨ Brillo detectado: ${brightness.toFixed(2)} / 255
        //             //     🔗 URL: ${finalUrl}`,
        //             //     `color: ${isDarkImage.value ? '#3498db' : '#f39c12'}; font-weight: bold; font-size: 12px;`,
        //             //     "color: inherit; font-family: monospace;"
        //             // );
                    
        //             // console.log("✅ Color actualizado usando el dominio");
        //         }
        //     } catch (e) {
        //         // console.error("❌ Sigue fallando el servidor:", e.message);
        //         isDarkImage.value = false;
        //     }
        // };

        // --- LÓGICA DEL VISOR DE IMÁGENES Y GESTOS ---
        // ==========================================
        // LÓGICA DEL VISOR DE IMÁGENES Y GESTOS
        // ==========================================
        const isImageModalOpen = ref(false);
        const draggableImage = ref(null); 
        let gesture = null;

        const openImageModal = () => {
            isImageModalOpen.value = true;
        };

        const closeImageModal = () => {
            isImageModalOpen.value = false;
            
            if (gesture) {
                gesture.destroy();
                gesture = null;
            }

            setTimeout(() => {
                if (draggableImage.value) {
                    draggableImage.value.style.transform = `translateY(0px)`;
                    draggableImage.value.style.transition = 'none';
                }
            }, 300);
        };

        const initGesture = () => {
            if (!draggableImage.value) return;

            gesture = createGesture({
                el: draggableImage.value,
                gestureName: 'swipe-to-close',
                direction: 'y',
                
                onStart: () => {
                    draggableImage.value.style.transition = 'none';
                },
                
                onMove: (detail) => {
                    draggableImage.value.style.transform = `translateY(${detail.deltaY}px)`;
                },
                
                onEnd: (detail) => {
                    draggableImage.value.style.transition = 'transform 0.3s ease-out';
                    
                    if (Math.abs(detail.deltaY) > 150) {
                        const direccion = detail.deltaY > 0 ? 1 : -1;
                        draggableImage.value.style.transform = `translateY(${direccion * 100}vh)`;
                        
                        setTimeout(() => {
                            closeImageModal();
                        }, 200); 
                    } else {
                        draggableImage.value.style.transform = `translateY(0px)`;
                    }
                }
            });
            
            gesture.enable(true);
        };
        // ==========================================

        // --- LÓGICA DE DETECCIÓN DE LINKS ---
        const formatTextWithLinks = (text) => {
            if (!text) return '';
            const urlRegex = /(https?:\/\/[^\s]+)/g;

            return text.replace(urlRegex, (url) => {
                return `<a href="${url}" class="post-link">${url}</a>`;
            });
        };

        const handleLinkClick = async (event) => {
            const link = event.target.closest('a');

            if (link && link.classList.contains('post-link')) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await Browser.open({ url: link.href });
                } catch (error) {
                    console.error('Error al abrir el enlace:', error);
                }
            }
        };

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
            timeAgo,
            ambientGradient,
            isAmbientMode,
            getFullImageUrl,
            formatTextWithLinks,
            handleLinkClick,

            closeOutline,
            isImageModalOpen,
            openImageModal,
            closeImageModal,
            draggableImage,
            initGesture,
            isImageLoaded,
            formatTimeRelative
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

/* Configuración base de la card */
.post-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* La capa de fondo con Blur */
.card-main-blur {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-size: cover;
  background-position: center;
  /* En modo claro: un poco vibrante */
  filter: blur(20px) saturate(1.4) brightness(0.8);
  transform: scale(1.05);
  z-index: 0;

  transform: translateZ(0);
  will-change: transform, filter;
  backface-visibility: hidden;
}

/* Capa de oscuridad para que el texto blanco/negro se lea bien */
.card-image-style::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent !important; /* Ajusta este valor para oscurecer el fondo */
  z-index: 1;
}

/* Asegura que el contenido esté por encima del fondo */
.relative-content {
  position: relative;
  z-index: 2;
}

/* --- DINÁMICA DE COLORES --- */

.is-dark-bg :deep(h2),
.is-dark-bg :deep(h3),
.is-dark-bg :deep(p),
.is-dark-bg :deep(ion-text),
.is-dark-bg :deep(.post-meta),
.is-dark-bg :deep(ion-icon),
.is-dark-bg :deep(.action-button ion-icon),
.is-dark-bg :deep(.action-button ion-label) {
    color: #ffffff !important;
    --color: #ffffff !important; /* Variable interna de Ionic */
    text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
}

.is-dark-bg :deep(.action-button ion-icon),
.is-dark-bg :deep(.action-button ion-label) {
    color: #ffffff !important;
}

/* Transparencia para contenedores internos */
.card-image-style ion-card-header,
.card-image-style ion-card-content,
.card-image-style .post-footer {
    --background: transparent;
    background: transparent !important;
}

.post-card.card-image-style {
    /* Usamos la variable inyectada desde el :style */
    box-shadow: 0 15px 50px -15px var(--ambient-gradient) !important;
    transition: all 0.6s ease-in-out;
    border: none !important;
}

/* --- ESTILOS PARA EVITAR QUE LA IMAGEN SE CORTE --- */
.post-media {
    width: 100% !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center;
    background: transparent;
    /* max-height: calc(80vw * 16 / 9) !important; */
}

/* Apuntamos directamente a la imagen nativa dentro de ion-img */
/* ion-img.post-media::part(image) {
    object-fit: contain !important;
    width: 100%;
    height: 100%;
    border-radius: 8px; 
} */


 /* fondo imagen total - imagen completa sin cortes - borde redondeado suave */
 /* --- VISOR DE IMAGEN A PANTALLA COMPLETA --- */
ion-modal.image-viewer-modal {
    --background: rgba(0, 0, 0, 0.95); /* Fondo casi negro */
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
    object-fit: contain; /* Evita que se recorte, igual que en el feed */
    user-select: none;
}

.close-image-btn:hover {
    opacity: 1;
}

.close-image-btn {
    position: absolute;
    top: calc(20px + env(safe-area-inset-top)); /* Respeta el notch del iPhone/Android */
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

/* --- ESTILOS PARA LOS LINKS EN EL TEXTO --- */
:deep(.post-link) {
    color: var(--ion-color-primary);
    text-decoration: none;
    font-weight: 500;
    word-break: break-all;
}

:deep(.post-link:hover),
:deep(.post-link:active) {
    text-decoration: underline;
    opacity: 0.8;
}

.card-image-style.is-dark-bg :deep(.post-link) {
    color: #82b1ff !important;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
}

/* --- Estilos para los post --- */
/* Contenedor principal de la imagen */
.post-media-container {
    position: relative;
    width: 100%;
    background-color: var(--ion-color-light);
    overflow: hidden;
    border-radius: 8px;
    /* Eliminamos el min-height fijo de aquí */
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Solo aplicamos los 250px como esqueleto MIENTRAS carga el spinner */
.post-media-container:not(.is-loaded) {
    min-height: 250px;
}

/* El fondo con el spinner */
.image-placeholder {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
    z-index: 1;
}

/* Ocultar el spinner cuando carga */
.image-placeholder.is-hidden {
    opacity: 0;
    pointer-events: none;
}

/* La imagen de Ionic */
.post-media {
    opacity: 0; /* Empieza invisible para tapar el alt text */
    transition: opacity 0.4s ease-in-out; /* Animación de aparición suave */
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block; /* Elimina un pequeño margen blanco fantasma nativo de html */
}

/* Clase que se activa con el @ionImgDidLoad */
.post-media.is-visible {
    opacity: 1;
}

</style>
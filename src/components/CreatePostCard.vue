<template>
    <ion-card class="create-post-card">
        <ion-card-content>
            <div class="create-post-input">
                <ion-avatar class="create-post-avatar">
                    <img v-if="user.imagen_url" :src="user.imagen_url" alt="Usuario" loading="lazy" />
                    <ion-icon v-else :icon="personCircle" size="large"></ion-icon>
                </ion-avatar>
                <div class="input-container">
                    <ion-input v-model="postText" placeholder="¿Qué estás pensando?" class="post-input"
                        @ionInput="onTextInput" :disabled="isPosting">
                    </ion-input>
                    <div class="input-icon-wrapper">
                        <transition name="fade-slide">
                            <ion-button v-if="hasText" key="button" fill="solid" shape="round" size="small"
                                color="primary" @click="handlePublishText" :disabled="isPosting"
                                class="send-text-button">
                                <ion-icon v-if="!isPosting" :icon="sendIcon" slot="icon-only"></ion-icon>
                                <ion-spinner v-else name="crescent" slot="icon-only"></ion-spinner>
                            </ion-button>
                            <svg v-else key="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round"
                                class="icon icon-tabler icons-tabler-outline icon-tabler-bubble bubble-icon">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M12.4 3a5.34 5.34 0 0 1 4.906 3.239a5.333 5.333 0 0 1 -1.195 10.6a4.26 4.26 0 0 1 -5.28 1.863l-3.831 2.298v-3.134a2.668 2.668 0 0 1 -1.795 -3.773a4.8 4.8 0 0 1 2.908 -8.933a5.33 5.33 0 0 1 4.287 -2.16" />
                            </svg>
                        </transition>
                    </div>
                </div>
            </div>
            <ion-grid class="post-actions-grid">
                <ion-row>
                    <ion-col size="3">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/create-post/foto')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-photo"
                                    style="color: var(--ion-color-primary)">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M8.813 11.612c.457 -.38 .918 -.38 1.386 .011l.108 .098l4.986 4.986l.094 .083a1 1 0 0 0 1.403 -1.403l-.083 -.094l-1.292 -1.293l.292 -.293l.106 -.095c.457 -.38 .918 -.38 1.386 .011l.108 .098l4.674 4.675a4 4 0 0 1 -3.775 3.599l-.206 .005h-12a4 4 0 0 1 -3.98 -3.603l6.687 -6.69l.106 -.095zm9.187 -9.612a4 4 0 0 1 3.995 3.8l.005 .2v9.585l-3.293 -3.292l-.15 -.137c-1.256 -1.095 -2.85 -1.097 -4.096 -.017l-.154 .14l-.307 .306l-2.293 -2.292l-.15 -.137c-1.256 -1.095 -2.85 -1.097 -4.096 -.017l-.154 .14l-5.307 5.306v-9.585a4 4 0 0 1 3.8 -3.995l.2 -.005h12zm-2.99 5l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z" />
                                </svg>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="3">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/create-post/musica')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="icon icon-tabler icons-tabler-outline icon-tabler-brand-deezer"
                                    style="color: #8A2BE2">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M3 16.5h2v.5h-2z" />
                                    <path d="M8 16.5h2.5v.5h-2.5z" />
                                    <path d="M16 17h-2.5v-.5h2.5z" />
                                    <path d="M21.5 17h-2.5v-.5h2.5z" />
                                    <path d="M21.5 13h-2.5v.5h2.5z" />
                                    <path d="M21.5 9.5h-2.5v.5h2.5z" />
                                    <path d="M21.5 6h-2.5v.5h2.5z" />
                                    <path d="M16 13h-2.5v.5h2.5z" />
                                    <path d="M8 13.5h2.5v-.5h-2.5z" />
                                    <path d="M8 9.5h2.5v.5h-2.5z" />
                                </svg>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="3">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/create-post/archivo')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="currentColor"
                                    class="icon icon-tabler icons-tabler-filled icon-tabler-file-neutral"
                                    style="color: var(--ion-color-success)">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005zm2 14h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0 -2m-3.995 -4h-.01a1 1 0 0 0 0 2h.01a1 1 0 0 0 0 -2m4 0h-.01a1 1 0 0 0 0 2h.01a1 1 0 0 0 0 -2" />
                                    <path d="M19 7h-4l-.001 -4.001z" />
                                </svg>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="3">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/create-post/encuesta')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="icon icon-tabler icons-tabler-outline icon-tabler-chart-bar"
                                    style="color: #ff6b35">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M3 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                                    <path d="M15 8m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v11a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                                    <path d="M9 3m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v15a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                                </svg>
                            </div>
                        </ion-button>
                    </ion-col>
                </ion-row>
            </ion-grid>
        </ion-card-content>
    </ion-card>
</template>

<script>
import { IonCard, IonCardContent, IonAvatar, IonInput, IonGrid, IonRow, IonCol, IonButton, IonLabel, IonIcon, IonSpinner, toastController } from '@ionic/vue'
import { personCircle, send } from 'ionicons/icons'
import PostsService from '../services/postsService'

export default {
    name: 'CreatePostCard',
    components: {
        IonCard,
        IonCardContent,
        IonAvatar,
        IonInput,
        IonGrid,
        IonRow,
        IonCol,
        IonButton,
        IonLabel,
        IonIcon,
        IonSpinner
    },
    props: {
        user: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            personCircle,
            sendIcon: send,
            postText: '',
            isPosting: false
        }
    },
    computed: {
        hasText() {
            return this.postText && this.postText.trim().length > 0
        }
    },
    methods: {
        onTextInput(event) {
            // Input handler para eventos futuros si es necesario
        },
        async handlePublishText() {
            if (!this.postText || this.postText.trim() === '') {
                return
            }

            this.isPosting = true

            try {
                const result = await PostsService.createTextPost(this.postText.trim())

                if (result.success) {
                    // Mostrar mensaje de éxito
                    const toast = await toastController.create({
                        message: '¡Post publicado exitosamente!',
                        duration: 2000,
                        color: 'success',
                        position: 'top'
                    })
                    await toast.present()

                    // Limpiar el input
                    this.postText = ''

                    // Emitir evento para que el componente padre recargue los posts
                    this.$emit('post-created', result.data)
                } else {
                    throw new Error(result.error || 'Error al publicar')
                }
            } catch (error) {
                console.error('Error al publicar post:', error)
                const toast = await toastController.create({
                    message: error.message || 'Error al publicar el post',
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                })
                await toast.present()
            } finally {
                this.isPosting = false
            }
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';

.input-container {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
}

/* Ocultar la línea por defecto de Ionic */
.input-container ion-input {
    --highlight-height: 0px;
}

.input-container ion-input::part(native) {
    border-radius: 20px;
}

/* Crear un borde azul que rodea todo el input */
.input-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid transparent;
    border-radius: 20px;
    transition: border-color 0.3s ease;
    pointer-events: none;
    z-index: 5;
}

.input-container:focus-within::after {
    border-color: var(--ion-color-primary);
}

.input-icon-wrapper {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.bubble-icon {
    color: var(--ion-color-medium);
}

.input-icon-wrapper ion-button {
    position: absolute;
    right: -12px;
    --padding-start: 10px;
    --padding-end: 10px;
    margin: 0;
    width: 44px;
    height: 44px;
}

/* Estilos para el botón de enviar - color de icono adaptativo */
.send-text-button ion-icon {
    color: white;
}

/* Modo oscuro - icono gris como el fondo */
.ion-palette-dark .send-text-button ion-icon {
    color: var(--ion-background-color, #1e1e1e);
}

/* Transiciones suaves */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}

.fade-slide-enter-from {
    opacity: 0;
    transform: scale(0.8) translateX(10px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: scale(0.8) translateX(-10px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: scale(1) translateX(0);
}
</style>

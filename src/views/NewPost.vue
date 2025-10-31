<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="handleCancel">
                        <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>{{ postType === 'music' ? 'Compartir Música' : 'Crear Publicación' }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button :disabled="!canPost || isPosting" @click="handlePost" color="primary">
                        <strong>{{ isPosting ? 'Publicando...' : 'Publicar' }}</strong>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <div class="new-post-container">
                <!-- Usuario info -->
                <div class="user-info">
                    <ion-avatar>
                        <img v-if="user.imagen_url" :src="user.imagen_url" alt="Usuario" />
                        <img v-else src="https://via.placeholder.com/50" alt="Usuario" />
                    </ion-avatar>
                    <div class="user-details">
                        <ion-text>
                            <h3>{{ user.name || 'Usuario' }}</h3>
                        </ion-text>
                    </div>
                </div>

                <!-- Selector de tipo de post -->
                <ion-segment v-model="postType" @ionChange="handleSegmentChange">
                    <ion-segment-button value="normal">
                        <ion-icon :icon="documentTextOutline"></ion-icon>
                        <ion-label>Post Normal</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="music">
                        <ion-icon :icon="musicalNotesOutline"></ion-icon>
                        <ion-label>Música</ion-label>
                    </ion-segment-button>
                </ion-segment>

                <!-- FORMULARIO POST NORMAL -->
                <div v-if="postType === 'normal'" class="form-section">
                    <!-- Título (Opcional) -->
                    <ion-item>
                        <ion-label position="stacked">Título (Opcional)</ion-label>
                        <ion-input v-model="normalPost.title" placeholder="Escribe un título..."
                            maxlength="100"></ion-input>
                    </ion-item>

                    <!-- Descripción (Opcional) -->
                    <ion-item>
                        <ion-label position="stacked">Descripción (Opcional)</ion-label>
                        <ion-textarea v-model="normalPost.description" :auto-grow="true"
                            placeholder="¿Qué novedades tienes?" :rows="4"></ion-textarea>
                    </ion-item>

                    <!-- Imagen (Opcional) -->
                    <ion-item>
                        <ion-label position="stacked">Imagen (Opcional)</ion-label>
                        <div class="image-upload-container">
                            <input type="file" ref="normalImageInput" accept="image/*" @change="handleNormalImageSelect"
                                style="display: none" />
                            <ion-button expand="block" fill="outline" @click="$refs.normalImageInput.click()">
                                <ion-icon :icon="imageOutline" slot="start"></ion-icon>
                                Seleccionar Imagen
                            </ion-button>

                            <!-- Preview de imagen normal -->
                            <div v-if="normalPost.imagePreview" class="image-preview">
                                <img :src="normalPost.imagePreview" alt="Preview" />
                                <ion-button size="small" fill="clear" class="remove-image" @click="removeNormalImage">
                                    <ion-icon :icon="closeCircle" color="danger"></ion-icon>
                                </ion-button>
                            </div>
                        </div>
                    </ion-item>
                </div>

                <!-- FORMULARIO POST MÚSICA -->
                <div v-if="postType === 'music'" class="form-section">
                    <!-- Título Música (Opcional) -->
                    <ion-item>
                        <ion-label position="stacked">Título de la Canción (Opcional)</ion-label>
                        <ion-input v-model="musicPost.title" placeholder="Nombre de la canción..."
                            maxlength="100"></ion-input>
                    </ion-item>

                    <!-- Descripción Música (Opcional) -->
                    <ion-item>
                        <ion-label position="stacked">Descripción (Opcional)</ion-label>
                        <ion-textarea v-model="musicPost.description" :auto-grow="true"
                            placeholder="Cuéntanos sobre esta canción..." :rows="4"></ion-textarea>
                    </ion-item>

                    <!-- Imagen de portada (Opcional) -->
                    <ion-item>
                        <ion-label position="stacked">Portada de la Canción (Opcional)</ion-label>
                        <div class="image-upload-container">
                            <input type="file" ref="musicImageInput" accept="image/*" @change="handleMusicImageSelect"
                                style="display: none" />
                            <ion-button expand="block" fill="outline" @click="$refs.musicImageInput.click()">
                                <ion-icon :icon="imageOutline" slot="start"></ion-icon>
                                Seleccionar Portada
                            </ion-button>

                            <!-- Preview de portada música -->
                            <div v-if="musicPost.imagePreview" class="image-preview">
                                <img :src="musicPost.imagePreview" alt="Portada" />
                                <ion-button size="small" fill="clear" class="remove-image" @click="removeMusicImage">
                                    <ion-icon :icon="closeCircle" color="danger"></ion-icon>
                                </ion-button>
                            </div>
                        </div>
                    </ion-item>

                    <!-- URL de Spotify/Apple Music (Opcional) -->
                    <ion-item>
                        <ion-label position="stacked">URL de Música Externa (Opcional)</ion-label>
                        <ion-input v-model="musicPost.musicUrl" type="url"
                            placeholder="https://spotify.com/..."></ion-input>
                    </ion-item>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonAvatar,
    IonText,
    IonTextarea,
    IonLabel,
    IonInput,
    IonItem,
    IonSegment,
    IonSegmentButton,
    alertController,
    toastController,
    loadingController
} from '@ionic/vue'
import {
    closeOutline,
    imageOutline,
    documentAttachOutline,
    musicalNotesOutline,
    closeCircle,
    documentTextOutline
} from 'ionicons/icons'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { AuthService } from '../services/auth'

export default {
    name: 'NewPost',
    components: {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButton,
        IonButtons,
        IonIcon,
        IonAvatar,
        IonText,
        IonTextarea,
        IonLabel,
        IonInput,
        IonItem,
        IonSegment,
        IonSegmentButton
    },
    setup() {
        const router = useRouter()
        const postType = ref('normal')
        const isPosting = ref(false)

        // Datos del usuario
        const user = ref({
            name: 'Usuario',
            imagen_url: ''
        })

        // Formulario Post Normal
        const normalPost = ref({
            title: '',
            description: '',
            image: null,
            imagePreview: null
        })

        // Formulario Post Música
        const musicPost = ref({
            title: '',
            description: '',
            image: null,
            imagePreview: null,
            musicUrl: ''
        })

        // Referencias a inputs de archivo
        const normalImageInput = ref(null)
        const musicImageInput = ref(null)

        // Obtener datos del usuario al montar
        const loadUserData = async () => {
            try {
                const userData = AuthService.getUser()
                if (userData) {
                    user.value = {
                        name: userData.name || 'Usuario',
                        imagen_url: userData.imagen_url || ''
                    }
                }
            } catch (error) {
                console.error('Error cargando usuario:', error)
            }
        }

        // Llamar al cargar el componente
        loadUserData()

        // Validar si se puede publicar
        const canPost = computed(() => {
            if (postType.value === 'normal') {
                // Para posts tipo 'imagen', la imagen ES OBLIGATORIA según el backend
                // Pero título y descripción son opcionales
                return normalPost.value.image !== null
            } else {
                // Para posts tipo 'musica', todo es opcional
                return musicPost.value.title.trim() ||
                    musicPost.value.description.trim() ||
                    musicPost.value.image
            }
        })

        // Manejar cambio de segmento
        const handleSegmentChange = (e) => {
            postType.value = e.detail.value
        }

        // Manejar selección de imagen para post normal
        const handleNormalImageSelect = (event) => {
            const file = event.target.files[0]
            if (file && file.type.startsWith('image/')) {
                normalPost.value.image = file
                // Crear preview
                const reader = new FileReader()
                reader.onload = (e) => {
                    normalPost.value.imagePreview = e.target.result
                }
                reader.readAsDataURL(file)
            }
        }

        // Manejar selección de imagen para post música
        const handleMusicImageSelect = (event) => {
            const file = event.target.files[0]
            if (file && file.type.startsWith('image/')) {
                musicPost.value.image = file
                // Crear preview
                const reader = new FileReader()
                reader.onload = (e) => {
                    musicPost.value.imagePreview = e.target.result
                }
                reader.readAsDataURL(file)
            }
        }

        // Remover imagen de post normal
        const removeNormalImage = () => {
            normalPost.value.image = null
            normalPost.value.imagePreview = null
            if (normalImageInput.value) {
                normalImageInput.value.value = ''
            }
        }

        // Remover imagen de post música
        const removeMusicImage = () => {
            musicPost.value.image = null
            musicPost.value.imagePreview = null
            if (musicImageInput.value) {
                musicImageInput.value.value = ''
            }
        }

        // Manejar cancelación
        const handleCancel = async () => {
            if (canPost.value) {
                const alert = await alertController.create({
                    header: '¿Descartar publicación?',
                    message: 'Si sales ahora, perderás los cambios.',
                    buttons: [
                        {
                            text: 'Cancelar',
                            role: 'cancel'
                        },
                        {
                            text: 'Descartar',
                            role: 'destructive',
                            handler: () => {
                                router.back()
                            }
                        }
                    ]
                })
                await alert.present()
            } else {
                router.back()
            }
        }

        // Manejar publicación
        const handlePost = async () => {
            // Validación previa antes de enviar
            if (postType.value === 'normal' && !normalPost.value.image) {
                const toast = await toastController.create({
                    message: 'Debes seleccionar una imagen para publicar',
                    duration: 3000,
                    color: 'warning',
                    position: 'top'
                })
                await toast.present()
                return
            }

            const loading = await loadingController.create({
                message: 'Publicando...',
            })
            await loading.present()

            isPosting.value = true

            try {
                const formData = new FormData()

                if (postType.value === 'normal') {
                    // Post tipo imagen/normal
                    // Título es opcional en el backend
                    if (normalPost.value.title) {
                        formData.append('titulo', normalPost.value.title)
                    }
                    // Descripción es opcional (max 500 caracteres)
                    if (normalPost.value.description) {
                        formData.append('descripcion', normalPost.value.description)
                    }
                    // Imagen es requerida si tipo='imagen'
                    if (normalPost.value.image) {
                        formData.append('imagen', normalPost.value.image)
                    }
                    // Tipo es REQUERIDO
                    formData.append('tipo', 'imagen')
                } else {
                    // Post tipo música
                    // Título (título de la canción) es opcional
                    if (musicPost.value.title) {
                        formData.append('titulo', musicPost.value.title)
                    }
                    // Descripción es opcional (max 500 caracteres)
                    if (musicPost.value.description) {
                        formData.append('descripcion', musicPost.value.description)
                    }
                    // Imagen (portada) es opcional para posts de música
                    if (musicPost.value.image) {
                        formData.append('imagen', musicPost.value.image)
                    }
                    // Tipo es REQUERIDO
                    formData.append('tipo', 'musica')
                    // Campos opcionales de música según el backend
                    // artista, titulo (ya enviado arriba), album
                    // Por ahora no tenemos campos para artista/album en el formulario
                }

                // DEBUG: Ver qué estamos enviando
                console.log('=== FormData a enviar ===')
                const token = AuthService.getToken()
                console.log('Token:', token ? 'Presente ✓' : 'Ausente ✗')
                console.log('Token completo:', token)
                console.log('Usuario local:', AuthService.getUser())
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ':', pair[1])
                }

                // Enviar a la API usando el método específico
                const response = await api.createPost(formData)

                await loading.dismiss()

                if (response.data.success) {
                    const toast = await toastController.create({
                        message: '¡Publicación creada exitosamente!',
                        duration: 2000,
                        color: 'success',
                        position: 'top'
                    })
                    await toast.present()

                    // Limpiar formularios
                    normalPost.value = { title: '', description: '', image: null, imagePreview: null }
                    musicPost.value = { title: '', description: '', image: null, imagePreview: null, musicUrl: '' }

                    // Volver atrás
                    router.back()
                } else {
                    throw new Error(response.data.message || 'Error al crear publicación')
                }

            } catch (error) {
                await loading.dismiss()
                console.error('Error al publicar:', error)
                console.error('Respuesta del servidor:', error.response?.data)
                console.error('Error completo:', JSON.stringify(error.response?.data, null, 2))

                // Extraer el mensaje de error específico del servidor
                let errorMessage = 'Error al crear la publicación'

                if (error.response?.data) {
                    const errorData = error.response.data

                    // Si el error es de SQL (columna no encontrada), mostrar mensaje específico
                    if (errorData.error && errorData.error.includes('Column not found')) {
                        errorMessage = '⚠️ Error del servidor: La base de datos no está actualizada. Contacta al administrador del backend.'
                    }
                    // Laravel devuelve errores de validación en el campo 'errors'
                    else if (errorData.errors) {
                        const firstErrorKey = Object.keys(errorData.errors)[0]
                        errorMessage = errorData.errors[firstErrorKey][0]
                    } else if (errorData.message) {
                        errorMessage = errorData.message
                    } else if (errorData.error) {
                        errorMessage = errorData.error
                    }
                }

                const toast = await toastController.create({
                    message: errorMessage,
                    duration: 5000,
                    color: 'danger',
                    position: 'top'
                })
                await toast.present()
            } finally {
                isPosting.value = false
            }
        }

        return {
            user,
            postType,
            normalPost,
            musicPost,
            normalImageInput,
            musicImageInput,
            isPosting,
            canPost,
            handleSegmentChange,
            handleNormalImageSelect,
            handleMusicImageSelect,
            removeNormalImage,
            removeMusicImage,
            handleCancel,
            handlePost,
            // Iconos
            closeOutline,
            imageOutline,
            documentAttachOutline,
            musicalNotesOutline,
            closeCircle,
            documentTextOutline
        }
    }
}
</script>

<style scoped>
.new-post-container {
    padding: 16px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.user-details h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.post-textarea {
    font-size: 16px;
    min-height: 150px;
    margin-bottom: 16px;
}

.media-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
}

.media-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
}

.media-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-media {
    position: absolute;
    top: 4px;
    right: 4px;
    --padding-start: 4px;
    --padding-end: 4px;
    margin: 0;
}

.media-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 16px 0;
    border-top: 1px solid var(--ion-color-light);
}

.media-options ion-button {
    flex: 1;
    min-width: 100px;
}
</style>

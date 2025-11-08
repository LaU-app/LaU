<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="goBack">
                        <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Nueva publicación</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Selector de tipo -->
            <ion-segment :value="tipo" @ionChange="handleSegmentChange" class="segmento-personalizado">
                <ion-segment-button value="foto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="custom-icon">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path
                            d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" />
                        <path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                    </svg>
                    <ion-label>Foto</ion-label>
                </ion-segment-button>
                <ion-segment-button value="musica">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="custom-icon">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                        <path d="M9 17v-13h10v8" />
                        <path d="M9 8h10" />
                        <path d="M19 22v-6" />
                        <path d="M22 19l-3 -3l-3 3" />
                    </svg>
                    <ion-label>Música</ion-label>
                </ion-segment-button>
                <ion-segment-button value="archivo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="custom-icon">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                        <path
                            d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2zm-7 -7h.01m3.99 0h.01m-4.01 3h4" />
                    </svg>
                    <ion-label>Archivo</ion-label>
                </ion-segment-button>
            </ion-segment>

            <!-- Contenedor con animación fluida entre secciones -->
            <div class="contenedor-contenido" ref="contenedorContenidoRef">
                <!-- Sección de Foto -->
                <div v-show="tipo === 'foto'" class="seccion-contenido seccion-foto" data-seccion="foto">
                    <div class="contenido-interno">
                        <div class="seccion-encabezado">
                            <h2>Subir foto</h2>
                            <p>Comparte una imagen con tu comunidad</p>
                        </div>

                        <!-- Preview de la imagen -->
                        <div v-if="imagenPreview" class="vista-previa-imagen">
                            <img :src="imagenPreview" alt="Preview" />
                            <ion-button fill="clear" color="danger" @click="removeImage" class="boton-eliminar">
                                <ion-icon :icon="closeCircle"></ion-icon>
                            </ion-button>
                        </div>

                        <!-- Caja de subida -->
                        <div v-else class="caja-subida" @click="triggerFileInput">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"
                                stroke-linejoin="round" class="icon-medium icon-primary">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M15 8h.01" />
                                <path d="M6 13l2.644 -2.644a1.21 1.21 0 0 1 1.712 0l3.644 3.644" />
                                <path d="M13 13l1.644 -1.644a1.21 1.21 0 0 1 1.712 0l1.644 1.644" />
                                <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
                                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                                <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
                            </svg>
                            <h3>Tomar o seleccionar foto</h3>
                            <p class="texto-pequeno">Usa tu cámara o elige de la galería</p>
                            <p class="texto-pequeno">JPG, PNG. Máximo 20MB</p>
                            <ion-button fill="outline">Elegir</ion-button>
                        </div>
                        <input ref="fileInput" type="file" hidden accept="image/jpeg,image/png,image/jpg"
                            @change="handleFileUpload" />
                    </div>
                </div>

                <!-- Sección de Música -->
                <div v-show="tipo === 'musica'" class="seccion-contenido seccion-musica" data-seccion="musica">
                    <div class="contenido-interno">
                        <div class="seccion-encabezado">
                            <h2>Buscar música</h2>
                            <p>Encuentra y comparte una canción</p>
                        </div>

                        <!-- Canción seleccionada -->
                        <MusicTrackPreview v-if="selectedTrack" :track="selectedTrack" @remove="removeTrack"
                            ref="trackPreviewRef" />

                        <!-- Botón para buscar -->
                        <div v-else class="caja-subida" @click="openMusicSearch">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"
                                stroke-linejoin="round" class="icon-medium icon-primary">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                                <path d="M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                                <path d="M9 17v-13h10v13" />
                                <path d="M9 8h10" />
                            </svg>
                            <h3>Buscar música</h3>
                            <p class="texto-pequeno">Encuentra canciones de iTunes</p>
                            <ion-button fill="outline">Buscar canción</ion-button>
                        </div>
                    </div>
                </div>

                <!-- Sección de Archivo -->
                <div v-show="tipo === 'archivo'" class="seccion-contenido seccion-archivo" data-seccion="archivo">
                    <div class="contenido-interno">
                        <div class="seccion-encabezado">
                            <h2>Subir archivo</h2>
                            <p>Comparte documentos y materiales de estudio</p>
                        </div>

                        <!-- Preview del archivo -->
                        <div v-if="archivo && tipo === 'archivo'" class="vista-previa-archivo">
                            <div class="info-archivo">
                                <!-- Ícono dinámico según tipo de archivo -->
                                <div class="file-icon-container" v-html="getFileIcon(archivo.name)"></div>
                                <div class="detalles-archivo">
                                    <h4>{{ archivo.name }}</h4>
                                    <p>{{ formatFileSize(archivo.size) }}</p>
                                </div>
                            </div>
                            <ion-button fill="clear" color="danger" @click="removeFile">
                                <ion-icon :icon="closeCircle"></ion-icon>
                            </ion-button>
                        </div>

                        <!-- Caja de subida -->
                        <div v-else class="caja-subida" @click="triggerFileInput">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="icon-medium icon-success">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                <path
                                    d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2zm-7 -7h.01m3.99 0h.01" />
                                <path d="M10 17a3.5 3.5 0 0 0 4 0" />
                            </svg>
                            <h3>Subir archivo</h3>
                            <p class="texto-pequeno">PDF, DOC, DOCX, ZIP. Máximo 5MB</p>
                            <ion-button fill="outline">Seleccionar archivo</ion-button>
                        </div>
                        <input ref="fileInputArchivo" type="file" hidden accept=".pdf,.doc,.docx,.zip"
                            @change="handleFileUpload" />
                    </div>
                </div>
            </div>

            <!-- Título y descripción (común para todos) -->
            <div class="seccion-formulario">
                <ion-item>
                    <ion-label position="stacked">
                        {{ tipo === 'musica' ? 'Título (Opcional)' : 'Título' }}
                    </ion-label>
                    <ion-input v-model="titulo" :placeholder="tituloPlaceholder" />
                </ion-item>

                <ion-item>
                    <ion-label position="stacked">Descripción (Opcional)</ion-label>
                    <ion-textarea v-model="descripcion" :placeholder="descripcionPlaceholder" :rows="3" />
                </ion-item>
            </div>

            <!-- Visibilidad -->
            <div class="seccion-formulario">
                <ion-label class="etiqueta-seccion">¿Quién puede ver esta publicación?</ion-label>
                <ion-radio-group v-model="visibilidad">
                    <ion-item>
                        <ion-radio slot="start" value="publico" />
                        <ion-label>
                            <h3>Público</h3>
                            <p>Cualquier persona puede ver esta publicación</p>
                        </ion-label>
                    </ion-item>

                    <ion-item>
                        <ion-radio slot="start" value="seguidores" />
                        <ion-label>
                            <h3>Solo seguidores</h3>
                            <p>Solo tus seguidores pueden ver esta publicación</p>
                        </ion-label>
                    </ion-item>
                </ion-radio-group>
            </div>

            <!-- Botón Publicar -->
            <ion-button expand="block" :disabled="!puedePublicar" class="boton-publicar" @click="publicar">
                Publicar
            </ion-button>

            <!-- Mensajes de ayuda -->
            <p v-if="!puedePublicar" class="texto-ayuda">
                <span v-if="tipo === 'musica' && !selectedTrack">Busca una canción para continuar</span>
                <span v-else-if="tipo === 'foto' && !imagenPreview">Selecciona una foto para continuar</span>
                <span v-else-if="tipo === 'archivo' && !archivo">Selecciona un archivo para continuar</span>
                <span v-else-if="tipo !== 'musica' && !titulo">Agrega un título para continuar</span>
            </p>
        </ion-content>

        <!-- Modal de búsqueda de música -->
        <MusicSearchModal :isOpen="showMusicSearch" @close="closeMusicSearch" @select="handleTrackSelect" />
    </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonInput,
    IonTextarea,
    IonRadioGroup,
    IonRadio,
    IonBadge,
    alertController,
    toastController,
    loadingController,
    actionSheetController
} from '@ionic/vue'
import {
    cloudUploadOutline,
    closeOutline,
    closeCircle,
    documentOutline,
    cameraOutline,
    imagesOutline
} from 'ionicons/icons'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import MusicSearchModal from '@/components/MusicSearchModal.vue'
import MusicTrackPreview from '@/components/MusicTrackPreview.vue'
import musicService from '@/services/musicService'
import api from '../services/api'
import { AuthService } from '../services/auth'

const router = useRouter()
const route = useRoute()

// Estado principal del formulario
const tipo = ref('foto')
const busqueda = ref('')
const titulo = ref('')
const descripcion = ref('')
const visibilidad = ref('publico')
const archivo = ref(null)
const imagenPreview = ref(null)
const fileInput = ref(null)
const fileInputArchivo = ref(null)
const contenedorContenidoRef = ref(null)

// Estado para música
const showMusicSearch = ref(false)
const selectedTrack = ref(null)
const trackPreviewRef = ref(null)

// Inicializar el tipo desde la ruta
onMounted(() => {
    const tipoParam = route.params.tipo
    if (tipoParam && ['foto', 'musica', 'archivo'].includes(tipoParam)) {
        tipo.value = tipoParam
    } else {
        tipo.value = 'foto'
        // Actualizar la URL para que coincida con la ruta independiente
        router.replace(`/create-post/foto`)
    }
})

// Actualizar la ruta cuando cambia el tipo (sin agregar al historial y SIN animación de página)
watch(tipo, (nuevoTipo, tipoAnterior) => {
    if (tipoAnterior && route.params.tipo !== nuevoTipo) {
        // Detener audio si está reproduciéndose al cambiar de tipo
        if (trackPreviewRef.value) {
            trackPreviewRef.value.stopAudio()
        }

        // Actualizar la URL sin disparar animaciones de Ionic
        // Usamos history.replaceState directamente para evitar animaciones
        const newPath = `/create-post/${nuevoTipo}`
        const currentState = window.history.state

        // Mantener el estado del historial
        window.history.replaceState(
            {
                ...currentState,
                current: newPath
            },
            '',
            newPath
        )
        // Actualizar el estado interno del router sin navegación
        router.currentRoute.value.params.tipo = nuevoTipo
    }
}, { flush: 'post' })

// Limpiar el reproductor al desmontar el componente
onBeforeUnmount(() => {
    if (trackPreviewRef.value) {
        trackPreviewRef.value.stopAudio()
    }
})

// Manejar cambio de segmento con animación suave
const handleSegmentChange = (e) => {
    const nuevoValor = e.detail.value
    if (nuevoValor === tipo.value) return

    // Aplicar animación de fade-out a la sección actual
    const contenedor = contenedorContenidoRef.value
    if (contenedor) {
        contenedor.classList.add('cambiando')

        // Después de la animación de salida, cambiar el tipo
        setTimeout(() => {
            tipo.value = nuevoValor

            // Remover clase después de que la nueva sección esté visible
            setTimeout(() => {
                contenedor.classList.remove('cambiando')
            }, 50)
        }, 150) // Reducido para que sea más rápido
    } else {
        // Fallback si no hay referencia al contenedor
        tipo.value = nuevoValor
    }
}

const triggerFileInput = async () => {
    if (tipo.value === 'foto') {
        // Mostrar action sheet para elegir entre cámara y galería
        await showPhotoActionSheet()
    } else if (tipo.value === 'archivo') {
        fileInputArchivo.value?.click()
    }
}

const showPhotoActionSheet = async () => {
    const actionSheet = await actionSheetController.create({
        header: 'Seleccionar foto',
        buttons: [
            {
                text: 'Tomar foto',
                icon: cameraOutline,
                handler: () => {
                    takePicture()
                }
            },
            {
                text: 'Elegir de la galería',
                icon: imagesOutline,
                handler: () => {
                    pickFromGallery()
                }
            },
            {
                text: 'Cancelar',
                icon: closeOutline,
                role: 'cancel'
            }
        ]
    })
    await actionSheet.present()
}

const takePicture = async () => {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera
        })

        await processImage(image)
    } catch (error) {
        console.error('Error al tomar foto:', error)
        if (error.message !== 'User cancelled photos app') {
            showToast('Error al acceder a la cámara', 'danger')
        }
    }
}

const pickFromGallery = async () => {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.Uri,
            source: CameraSource.Photos
        })

        await processImage(image)
    } catch (error) {
        console.error('Error al seleccionar foto:', error)
        if (error.message !== 'User cancelled photos app') {
            showToast('Error al acceder a la galería', 'danger')
        }
    }
}

const processImage = async (image) => {
    try {
        // Mostrar preview
        imagenPreview.value = image.webPath

        // Convertir la imagen a un archivo Blob para enviar al servidor
        const response = await fetch(image.webPath)
        const blob = await response.blob()

        // Crear un File a partir del Blob
        const fileName = `photo_${Date.now()}.${image.format || 'jpg'}`
        const file = new File([blob], fileName, { type: `image/${image.format || 'jpeg'}` })

        // Validar tamaño (20MB según el backend)
        if (file.size > 20 * 1024 * 1024) {
            showToast('La imagen no debe superar 20MB', 'warning')
            imagenPreview.value = null
            return
        }

        archivo.value = file
    } catch (error) {
        console.error('Error al procesar imagen:', error)
        showToast('Error al procesar la imagen', 'danger')
    }
}

const handleFileUpload = (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return

    if (tipo.value === 'foto') {
        // Validar tamaño (20MB según el backend)
        if (file.size > 20 * 1024 * 1024) {
            showToast('La imagen no debe superar 20MB', 'warning')
            return
        }

        // Crear preview
        const reader = new FileReader()
        reader.onload = (ev) => {
            imagenPreview.value = ev.target.result
        }
        reader.readAsDataURL(file)
        archivo.value = file
    } else if (tipo.value === 'archivo') {
        // Validar tamaño (5MB según el backend)
        if (file.size > 5 * 1024 * 1024) {
            showToast('El archivo no debe superar 5MB', 'warning')
            return
        }

        // Validar extensión
        const validExtensions = ['.pdf', '.doc', '.docx', '.zip']
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

        if (!validExtensions.includes(fileExtension)) {
            showToast('Solo se permiten archivos PDF, DOC, DOCX y ZIP', 'warning')
            return
        }

        archivo.value = file
    }
}

const removeImage = () => {
    imagenPreview.value = null
    archivo.value = null
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const removeFile = () => {
    archivo.value = null
    if (fileInputArchivo.value) {
        fileInputArchivo.value.value = ''
    }
}

// Funciones para música
const openMusicSearch = () => {
    showMusicSearch.value = true
}

const closeMusicSearch = () => {
    showMusicSearch.value = false
}

const handleTrackSelect = (track) => {
    selectedTrack.value = track
    // NO auto-rellenar campos - el usuario escribe lo que quiera
}

const removeTrack = () => {
    // Detener el audio si está reproduciéndose
    if (trackPreviewRef.value) {
        trackPreviewRef.value.stopAudio()
    }
    selectedTrack.value = null
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (fileName) => {
    if (!fileName) return ''
    const extension = fileName.split('.').pop().toLowerCase()

    const icons = {
        'pdf': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></svg>`,
        'doc': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /><path d="M20 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" /><path d="M12.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5z" /></svg>`,
        'docx': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M2 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /><path d="M17 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" /><path d="M9.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5z" /><path d="M19.5 15l3 6" /><path d="M19.5 21l3 -6" /></svg>`,
        'zip': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M16 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M12 15v6" /><path d="M5 15h3l-3 6h3" /></svg>`
    }

    return icons[extension] || icons['pdf']
}

const puedePublicar = computed(() => {
    if (tipo.value === 'musica') {
        // Para música, solo necesita la canción seleccionada (título es opcional)
        return selectedTrack.value !== null
    }

    // Para foto y archivo, sí requiere título
    if (!titulo.value.trim()) return false
    return archivo.value !== null
})

const tituloPlaceholder = computed(() => {
    return tipo.value === 'musica'
        ? 'Título personalizado (opcional)'
        : `Título de tu ${tipo.value === 'foto' ? 'foto' : 'archivo'}`
})

const descripcionPlaceholder = computed(() => {
    return tipo.value === 'musica'
        ? '¿Por qué compartes esta canción?'
        : `Cuéntanos sobre ${tipo.value === 'foto' ? 'esta imagen' : 'este archivo'}`
})

const showToast = async (message, color = 'primary') => {
    const toast = await toastController.create({
        message,
        duration: 2000,
        position: 'top',
        color
    })
    await toast.present()
}

// Función para volver - usa router.back() para la transición nativa de Ionic
const goBack = () => {
    // Limpiar el formulario
    busqueda.value = ''
    titulo.value = ''
    descripcion.value = ''
    visibilidad.value = 'publico'
    archivo.value = null
    imagenPreview.value = null

    // Usar router.back() para usar la transición nativa de Ionic
    router.back()
}

const cancelar = () => {
    tipo.value = 'foto'
    busqueda.value = ''
    titulo.value = ''
    descripcion.value = ''
    visibilidad.value = 'publico'
    archivo.value = null
    imagenPreview.value = null
    router.push('/tabs/tab1')
}

const publicar = async () => {
    if (!puedePublicar.value) return

    // Validación previa específica para tipo foto
    if (tipo.value === 'foto' && !archivo.value) {
        const toast = await toastController.create({
            message: 'Debes seleccionar una imagen para publicar',
            duration: 3000,
            color: 'warning',
            position: 'top'
        })
        await toast.present()
        return
    }

    // Validación previa específica para tipo archivo
    if (tipo.value === 'archivo' && !archivo.value) {
        const toast = await toastController.create({
            message: 'Debes seleccionar un archivo para publicar',
            duration: 3000,
            color: 'warning',
            position: 'top'
        })
        await toast.present()
        return
    }

    // Validación para música
    if (tipo.value === 'musica' && !selectedTrack.value) {
        const toast = await toastController.create({
            message: 'Debes seleccionar una canción para publicar',
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

    try {
        const formData = new FormData()

        // Mapear el tipo de CreatePost a los tipos del backend
        let tipoBackend = 'archivo' // Por defecto para archivos
        if (tipo.value === 'foto') {
            tipoBackend = 'imagen'
            // Imagen es requerida para tipo 'imagen' (foto)
            if (archivo.value) {
                formData.append('imagen', archivo.value)
            }
        } else if (tipo.value === 'musica') {
            tipoBackend = 'musica'
            // Agregar datos de la canción con los nombres correctos de la BD
            if (selectedTrack.value) {
                // Campos de iTunes con los nombres exactos de la BD
                formData.append('itunes_track_id', selectedTrack.value.trackId || '')
                formData.append('itunes_track_name', selectedTrack.value.trackName || '')
                formData.append('itunes_artist_name', selectedTrack.value.artistName || '')
                formData.append('itunes_collection_name', selectedTrack.value.collectionName || '')
                // Obtener portada en alta resolución (600x600)
                const artworkUrl = selectedTrack.value.artworkUrl100
                    ? selectedTrack.value.artworkUrl100.replace('100x100bb', '600x600bb')
                    : ''
                formData.append('itunes_artwork_url', artworkUrl)
                formData.append('itunes_preview_url', selectedTrack.value.previewUrl || '')
                formData.append('itunes_track_view_url', selectedTrack.value.trackViewUrl || '')
                formData.append('itunes_track_time_millis', selectedTrack.value.trackTimeMillis || '')
                formData.append('itunes_primary_genre_name', selectedTrack.value.primaryGenreName || '')

                // 🎵 Generar enlace de Spotify para compartir (cross-platform)
                const artist = selectedTrack.value.artistName || ''
                const track = selectedTrack.value.trackName || ''
                const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${track} ${artist}`)}`
                formData.append('spotify_web_url', spotifyUrl)

                // 📱 Agregar términos de búsqueda para apps móviles
                formData.append('artist_search_term', artist)
                formData.append('track_search_term', track)
            }
        } else if (tipo.value === 'archivo') {
            // Para archivos, usamos tipo "archivo" en el backend
            tipoBackend = 'archivo'
            // Archivo es requerido para tipo 'archivo'
            if (archivo.value) {
                formData.append('archivo', archivo.value)
            }
        }

        // Campos opcionales: título y descripción
        if (titulo.value) {
            formData.append('titulo', titulo.value)
        }
        if (descripcion.value) {
            formData.append('descripcion', descripcion.value)
        }

        // Tipo es REQUERIDO
        formData.append('tipo', tipoBackend)

        // Visibilidad
        formData.append('visibilidad', visibilidad.value)

        // DEBUG: Ver qué estamos enviando
        console.log('=== FormData a enviar desde CreatePost ===')
        const token = AuthService.getToken()
        console.log('Token:', token ? 'Presente ✓' : 'Ausente ✗')
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

            // Limpiar formulario
            titulo.value = ''
            descripcion.value = ''
            archivo.value = null
            imagenPreview.value = null
            busqueda.value = ''
            visibilidad.value = 'publico'

            // Navegar al feed
            router.push('/tabs/tab1')
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
            duration: 4000,
            color: 'danger',
            position: 'top'
        })
        await toast.present()
    }
}
</script>

<style scoped>
/* Custom SVG icons */
.custom-icon {
    width: 24px;
    height: 24px;
    color: currentColor;
}

.icon-medium {
    width: 48px;
    height: 48px;
}

.icon-primary {
    color: var(--ion-color-primary);
}

.icon-success {
    color: var(--ion-color-success);
}

/* Toolbar styles */
ion-header {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

ion-toolbar {
    --background: var(--ion-background-color);
    --border-width: 0;
}

ion-toolbar ion-title {
    font-weight: bold;
    font-size: 18px;
    color: var(--ion-text-color);
}

ion-toolbar ion-button {
    --color: var(--ion-color-medium);
}

ion-toolbar ion-icon {
    font-size: 24px;
}

ion-content {
    --background: var(--ion-background-color);
}

.segmento-personalizado {
    margin: 16px;
    margin-bottom: 24px;
    width: calc(100% - 32px);
}

.segmento-personalizado ion-segment-button {
    flex: 1;
    max-width: none;
    min-width: 0;
}

.segmento-personalizado ion-label {
    margin-top: 4px;
    font-size: 12px;
}

/* Contenedor de las secciones con animación */
.contenedor-contenido {
    position: relative;
    min-height: 300px;
    overflow: hidden;
    transition: opacity 0.3s ease-in-out;
    padding: 0 16px;
}

/* Animación del contenedor durante el cambio */
.contenedor-contenido.cambiando {
    opacity: 0.4;
}

/* Estilos base para cada sección con animación */
.seccion-contenido {
    position: relative;
    width: 100%;
    opacity: 1;
    transform: translateY(0);
}

.contenido-interno {
    padding: 0;
    min-height: 200px;
}

.seccion-encabezado {
    text-align: center;
    margin-bottom: 1rem;
}

.seccion-encabezado h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0 0 0.5rem 0;
    color: var(--ion-text-color);
}

.seccion-encabezado p {
    font-size: 0.875rem;
    color: var(--ion-color-medium);
    margin: 0;
}

.caja-subida {
    border: 2px dashed var(--ion-border-color);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    background: var(--ion-card-background);
}

.caja-subida:hover {
    border-color: var(--ion-color-primary);
    background: var(--ion-color-light);
}

.caja-subida h3 {
    margin: 1rem 0 0.5rem 0;
    font-size: 1.125rem;
    color: var(--ion-text-color);
}

.caja-subida .texto-pequeno {
    font-size: 0.75rem;
    color: var(--ion-color-medium);
    margin-bottom: 1rem;
}

.vista-previa-imagen {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 1rem;
}

.vista-previa-imagen img {
    width: 100%;
    height: auto;
    display: block;
}

.vista-previa-imagen .boton-eliminar {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    --background: rgba(0, 0, 0, 0.5);
}

.vista-previa-archivo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 1px solid var(--ion-color-medium);
    border-radius: 12px;
    margin-bottom: 1rem;
}

.info-archivo {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.file-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
}

.detalles-archivo h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    word-break: break-word;
    color: var(--ion-text-color);
}

.detalles-archivo p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--ion-color-medium);
}

.caja-busqueda {
    border-radius: 12px;
    --background: var(--ion-card-background);
    margin-bottom: 1rem;
    border: 1px solid var(--ion-border-color);
}

.selected-track {
    margin-bottom: 1rem;
}

.seccion-formulario {
    margin: 1.5rem 0;
    padding: 0 16px;
}

.etiqueta-seccion {
    display: block;
    font-weight: 600;
    margin-bottom: 1rem;
}

ion-item h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

ion-item p {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: var(--ion-color-medium);
}

.boton-publicar {
    margin: 2rem 16px 1rem 16px;
}

.texto-ayuda {
    text-align: center;
    font-size: 0.875rem;
    color: var(--ion-color-medium);
    margin: 0;
    padding: 0 16px;
}

/* Estilos para ion-item sin fondo */
ion-item {
    --background: var(--ion-card-background);
    --border-color: var(--ion-border-color);
}

.vista-previa-archivo {
    background: var(--ion-card-background);
}
</style>
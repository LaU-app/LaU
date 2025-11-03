<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons v-if="fromCard" slot="start">
                    <ion-button @click="goBack">
                        <ion-icon :icon="arrowBack"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Nueva publicación</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <!-- Selector de tipo -->
            <ion-segment :value="tipo" @ionChange="handleSegmentChange" class="segmento-personalizado">
                <ion-segment-button value="foto">
                    <ion-icon :icon="cameraOutline" />
                    <ion-label>Foto</ion-label>
                </ion-segment-button>
                <ion-segment-button value="musica">
                    <ion-icon :icon="musicalNotesOutline" />
                    <ion-label>Música</ion-label>
                </ion-segment-button>
                <ion-segment-button value="archivo">
                    <ion-icon :icon="documentOutline" />
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
                            <ion-icon :icon="cloudUploadOutline" size="large" color="primary" />
                            <h3>Subir foto</h3>
                            <p class="texto-pequeno">JPG, PNG. Máximo 5MB</p>
                            <ion-button fill="outline">Seleccionar archivo</ion-button>
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
                        <ion-item class="caja-busqueda">
                            <ion-input v-model="busqueda" placeholder="¿Qué canción quieres compartir?"></ion-input>
                        </ion-item>
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
                                <ion-icon :icon="documentOutline" size="large" color="success"></ion-icon>
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
                            <ion-icon :icon="cloudUploadOutline" size="large" color="success" />
                            <h3>Subir archivo</h3>
                            <p class="texto-pequeno">PDF, DOCX, ZIP. Máximo 10MB</p>
                            <ion-button fill="outline">Seleccionar archivo</ion-button>
                        </div>
                        <input ref="fileInputArchivo" type="file" hidden accept=".pdf,.doc,.docx,.zip,.rar"
                            @change="handleFileUpload" />
                    </div>
                </div>
            </div>

            <!-- Título y descripción (común para todos) -->
            <div class="seccion-formulario">
                <ion-item>
                    <ion-label position="stacked">Título</ion-label>
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
                <span v-if="tipo === 'musica' && !busqueda">Busca una canción para continuar</span>
                <span v-else-if="tipo === 'foto' && !imagenPreview">Selecciona una foto para continuar</span>
                <span v-else-if="tipo === 'archivo' && !archivo">Selecciona un archivo para continuar</span>
                <span v-else-if="!titulo">Agrega un título para continuar</span>
            </p>
        </ion-content>
    </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
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
    alertController,
    toastController
} from '@ionic/vue'
import {
    cloudUploadOutline,
    cameraOutline,
    musicalNotesOutline,
    documentOutline,
    arrowBack,
    closeCircle
} from 'ionicons/icons'

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

// Detectar si viene del CreatePostCard o del Tab Menu directo
// Verificamos si la página anterior era tab1 (feed/home)
const fromCard = computed(() => {
    const historyState = window.history.state
    const fromTab1 = historyState?.back?.includes('/tabs/tab1')
    const position = historyState?.position

    // Si hay posición en el historial y viene de tab1, mostrar flecha
    return fromTab1 && position > 0
})

// Inicializar el tipo desde la ruta
onMounted(() => {
    const tipoParam = route.params.tipo
    if (tipoParam && ['foto', 'musica', 'archivo'].includes(tipoParam)) {
        tipo.value = tipoParam
    } else {
        tipo.value = 'foto'
        // No usar replace, usar push para mantener el historial correcto
        router.push(`/tabs/tab2/foto`)
    }
})

// Actualizar la ruta cuando cambia el tipo (sin agregar al historial y SIN animación de página)
watch(tipo, (nuevoTipo, tipoAnterior) => {
    if (tipoAnterior && route.params.tipo !== nuevoTipo) {
        // Actualizar la URL sin disparar animaciones de Ionic
        // Usamos history.replaceState directamente para evitar animaciones
        const newPath = `/tabs/tab2/${nuevoTipo}`
        const currentState = window.history.state

        // Mantener el estado del historial para que fromCard siga funcionando
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

const triggerFileInput = () => {
    if (tipo.value === 'foto') {
        fileInput.value?.click()
    } else if (tipo.value === 'archivo') {
        fileInputArchivo.value?.click()
    }
}

const handleFileUpload = (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return

    if (tipo.value === 'foto') {
        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('La imagen no debe superar 5MB', 'warning')
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
        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('El archivo no debe superar 10MB', 'warning')
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

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const puedePublicar = computed(() => {
    if (!titulo.value.trim()) return false

    if (tipo.value === 'musica') {
        return busqueda.value.trim().length > 0
    } else {
        return archivo.value !== null
    }
})

const tituloPlaceholder = computed(() => {
    return tipo.value === 'musica'
        ? 'Nombre de la canción'
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

// Función para volver (solo cuando viene de tarjeta) - siempre va a tab1
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

    const alert = await alertController.create({
        header: '¡Publicación creada!',
        message: 'Tu contenido ha sido publicado correctamente.',
        buttons: [{
            text: 'OK',
            handler: () => {
                cancelar()
            }
        }]
    })
    await alert.present()
}
</script>

<style scoped>
.segmento-personalizado {
    margin-bottom: 1.5rem;
}

/* Contenedor de las secciones con animación */
.contenedor-contenido {
    position: relative;
    min-height: 300px;
    overflow: hidden;
    transition: opacity 0.3s ease-in-out;
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
    padding: 0.5rem 0.25rem 1rem 0.25rem;
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
}

.seccion-encabezado p {
    font-size: 0.875rem;
    color: var(--ion-color-medium);
    margin: 0;
}

.caja-subida {
    border: 2px dashed var(--ion-color-medium);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.caja-subida:hover {
    border-color: var(--ion-color-primary);
    background: var(--ion-color-light);
}

.caja-subida h3 {
    margin: 1rem 0 0.5rem 0;
    font-size: 1.125rem;
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

.detalles-archivo h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.detalles-archivo p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--ion-color-medium);
}

.caja-busqueda {
    border-radius: 12px;
    --background: var(--ion-color-light);
    margin-bottom: 1rem;
}

.seccion-formulario {
    margin: 1.5rem 0;
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
    margin: 2rem 0 1rem 0;
}

.texto-ayuda {
    text-align: center;
    font-size: 0.875rem;
    color: var(--ion-color-medium);
    margin: 0;
}
</style>
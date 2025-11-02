<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" @click="cancelar">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>Publicar</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="publicar">Publicar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Selector de tipo -->
      <ion-segment v-model="tipo" class="segment-custom">
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


      <p class="ion-text-center ion-margin-top">Tipo seleccionado: {{ tipo }}</p>

      <!-- Interfaz de Música -->
      <div v-if="tipo === 'musica'" class="ion-text-center ion-margin-top">
        <h2 class="text-xl font-bold">Buscar música</h2>
        <p class="text-sm text-gray-500">Encuentra y comparte una canción</p>
        <ion-item class="search-box">
          <ion-input
            v-model="busqueda"
            placeholder="¿Qué quieres compartir?"
          ></ion-input>
        </ion-item>
      </div>

      <!-- Interfaz de Foto o Archivo -->
      <div v-else class="upload-box ion-text-center ion-padding">
        <ion-icon :icon="cloudUploadOutline" size="large" color="primary" />
        <h2 class="ion-margin-top">Subir {{ tipoLabel }}</h2>
        <label class="ion-text-primary ion-margin-top" style="cursor: pointer;">
          <input type="file" hidden @change="handleFileUpload" :accept="acceptType" />
          haz clic para seleccionar
        </label>
        <p class="text-small ion-margin-top">{{ formatoLabel }}</p>
      </div>

      <!-- Título y descripción -->
      <ion-item>
        <ion-label position="stacked">Título</ion-label>
        <ion-input v-model="titulo" :placeholder="tituloPlaceholder" />
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Descripción (Opcional)</ion-label>
        <ion-textarea v-model="descripcion" :placeholder="descripcionPlaceholder" />
      </ion-item>

      <!-- Visibilidad -->
      <div class="ion-margin-top">
        <ion-label class="ion-text-bold">¿Quién puede ver esta publicación?</ion-label>
        <ion-radio-group v-model="visibilidad">
          <ion-item>
            <ion-label>Público</ion-label>
            <ion-radio slot="start" value="publico" />
          </ion-item>
          <ion-note class="ion-padding-start text-small">
            Cualquier persona puede ver esta publicación
          </ion-note>

          <ion-item>
            <ion-label>Solo seguidores</ion-label>
            <ion-radio slot="start" value="seguidores" />
          </ion-item>
          <ion-note class="ion-padding-start text-small">
            Solo tus seguidores pueden ver esta publicación
          </ion-note>
        </ion-radio-group>
      </div>

      <!-- Botón Publicar -->
      <ion-button
        expand="block"
        :disabled="!puedePublicar"
        class="ion-margin-top"
        @click="publicar"
      >
        Publicar
      </ion-button>

      <p v-if="tipo === 'musica' && !busqueda" class="ion-text-center text-small text-gray-500 mt-2">
        Selecciona una canción para continuar
      </p>
      <p v-if="tipo !== 'musica' && !archivo" class="ion-text-center text-small text-gray-500 mt-2">
        Selecciona un archivo para continuar
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  cloudUploadOutline,
  cameraOutline,
  musicalNotesOutline,
  documentOutline
} from 'ionicons/icons'
import { alertController } from '@ionic/vue'

const router = useRouter()

const tipo = ref('foto')
const busqueda = ref('')
const titulo = ref('')
const descripcion = ref('')
const visibilidad = ref('publico')
const archivo = ref(null)

// ✅ Función corregida: usa e.target.value
const handleSegmentChange = (e) => {
  tipo.value = e.target.value
}

const handleFileUpload = (e) => {
  archivo.value = e.target.files[0]
}

const puedePublicar = computed(() => {
  return tipo.value === 'musica'
    ? busqueda.value.trim().length > 0
    : archivo.value && titulo.value.trim().length > 0
})

const tipoLabel = computed(() => {
  if (tipo.value === 'foto') return 'Foto'
  if (tipo.value === 'archivo') return 'Archivo'
  return 'Música'
})

const acceptType = computed(() => {
  if (tipo.value === 'foto') return '.jpg,.png'
  if (tipo.value === 'archivo') return '.pdf,.docx,.zip'
  return ''
})

const formatoLabel = computed(() => {
  if (tipo.value === 'foto') return 'JPG, PNG. Relación 1:1'
  if (tipo.value === 'archivo') return 'PDF, DOCX, ZIP'
  return ''
})

const tituloPlaceholder = computed(() => {
  return tipo.value === 'musica' ? 'Título de la canción (opcional)' : 'Título de la publicación'
})

const descripcionPlaceholder = computed(() => {
  return tipo.value === 'musica'
    ? 'Describe la música (opcional)'
    : 'Describe tu publicación (opcional)'
})

const cancelar = () => {
  tipo.value = 'foto'
  busqueda.value = ''
  titulo.value = ''
  descripcion.value = ''
  visibilidad.value = 'publico'
  archivo.value = null
  router.replace('/tabs/home')
}

const publicar = async () => {
  if (!puedePublicar.value) return
  const alert = await alertController.create({
    header: 'Publicación enviada',
    message: 'Tu contenido ha sido publicado correctamente.',
    buttons: ['OK']
  })
  await alert.present()
}
</script>

<style scoped>
.upload-box {
  border: 2px dashed #ccc;
  border-radius: 12px;
}
.text-small {
  font-size: 0.75rem;
  color: #666;
}
.segment-custom {
  --background: transparent;
  --indicator-color: transparent;
}
.segment-custom ion-segment-button {
  --background: white;
  --color: black;
  border-radius: 8px;
  margin: 0 4px;
  padding: 6px 12px;
  border: 1px solid #ccc;
}
.segment-custom ion-segment-button.segment-button-checked {
  --background: black;
  --color: white;
}
.search-box {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  background: #1a1a1a;
  color: white;
}
.search-box ion-input {
  color: white;
}
</style>

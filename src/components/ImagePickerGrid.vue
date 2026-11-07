<template>
  <div class="photo-picker">
    <!-- Sin fotos: una sola tarjeta compacta en vez de seis huecos vacíos -->
    <button v-if="!items.length" type="button" class="photo-empty" :disabled="disabled" aria-describedby="photo-hint" @click="pick(0)">
      <span class="photo-empty-icon"><ion-icon :icon="cameraOutline"/></span>
      <span><b>Agregar fotos</b><small>Cámara, galería o archivo</small></span>
    </button>

    <!-- Con fotos: portada + miniaturas desplazables -->
    <ul v-else class="photo-strip" aria-label="Fotos del producto">
      <li v-for="(item, index) in items" :key="item.id" class="photo-tile" :class="{ cover: index === 0 }">
        <!-- Toda la miniatura es un solo botón: sustituir, usar como portada o quitar -->
        <button type="button" class="photo-tile-main" :disabled="disabled" :aria-label="index === 0 ? 'Portada: sustituir o quitar' : `Foto ${index + 1}: sustituir, usar como portada o quitar`" @click="options(index)">
          <img :src="item.preview" alt=""/>
          <span v-if="index === 0" class="photo-cover">PORTADA</span>
        </button>
      </li>
      <li v-if="items.length < max" class="photo-tile">
        <button type="button" class="photo-add" :disabled="disabled" :aria-label="`Agregar foto, ${items.length} de ${max}`" @click="pick(items.length)">
          <ion-icon :icon="addOutline"/><span>Agregar</span>
        </button>
      </li>
    </ul>
    <small id="photo-hint" class="photo-hint">{{ items.length }} de {{ max }} fotos · la primera es la portada{{ items.length ? ' · tocá una para cambiarla' : '' }}</small>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { IonIcon, actionSheetController, toastController } from '@ionic/vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { addOutline, cameraOutline, closeOutline, imagesOutline, documentOutline, starOutline, trashOutline } from 'ionicons/icons'
import { optimizeImageToWebP } from '@/utils/imageOptimizer'
import type { PhotoItem } from '@/types/marketplace'

const props = withDefaults(defineProps<{
  max?: number
  initial?: { filename: string; url: string }[]
  disabled?: boolean
}>(), { max: 6, initial: () => [], disabled: false })
const emit = defineEmits<{ (event: 'change', items: PhotoItem[]): void }>()

let nextId = 0
const items = ref<PhotoItem[]>(props.initial.slice(0, props.max).map(image => ({ id: `remote-${nextId++}`, preview: image.url, filename: image.filename })))

watch(items, value => emit('change', [...value]), { deep: true, immediate: true })

const release = (item?: PhotoItem) => { if (item?.blob) URL.revokeObjectURL(item.preview) }

async function toast(message: string, color?: string) {
  await (await toastController.create({ message, duration: 2200, position: 'top', color })).present()
}

/** Mismo patrón que CreatePost.vue: Camera → webPath → blob, más conversión a WebP. */
async function fromCamera(source: CameraSource, index: number) {
  try {
    const photo = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.Uri, source })
    if (!photo.webPath) return
    const original = await (await fetch(photo.webPath)).blob()
    await place(index, original)
  } catch (error) {
    if (String(error).includes('cancel')) return
    await toast('No pudimos acceder a las fotos.', 'danger')
  }
}

/** Fallback web: input de archivo. */
function fromFile(index: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (file) await place(index, file)
  }
  input.click()
}

/** index < cantidad actual = sustituir; index === cantidad = agregar al final. */
async function place(index: number, file: Blob) {
  if (file.size > 20 * 1024 * 1024) {
    await toast('La imagen no debe superar 20 MB.', 'warning')
    return
  }
  try {
    // Se sube siempre en WebP ≤1080 px: mucho menos datos móviles.
    const blob = await optimizeImageToWebP(file)
    const item: PhotoItem = { id: `local-${nextId++}`, blob, preview: URL.createObjectURL(blob) }
    if (index < items.value.length) {
      release(items.value[index])
      items.value.splice(index, 1, item)
    } else if (items.value.length < props.max) {
      items.value.push(item)
    }
  } catch {
    await toast('No pudimos procesar esa imagen.', 'danger')
  }
}

function remove(index: number) {
  release(items.value[index])
  // Al quitarla, la siguiente sube de posición: nunca quedan huecos antes de la portada.
  items.value.splice(index, 1)
}

function makeCover(index: number) {
  const [item] = items.value.splice(index, 1)
  items.value.unshift(item)
}

const sources = (index: number, verb: string) => [
  { text: `${verb} con la cámara`, icon: cameraOutline, handler: () => { void fromCamera(CameraSource.Camera, index) } },
  { text: `${verb} desde la galería`, icon: imagesOutline, handler: () => { void fromCamera(CameraSource.Photos, index) } },
  { text: `${verb} desde un archivo`, icon: documentOutline, handler: () => fromFile(index) },
]

async function pick(index: number) {
  const sheet = await actionSheetController.create({
    header: 'Agregar foto',
    buttons: [...sources(index, 'Agregar'), { text: 'Cancelar', icon: closeOutline, role: 'cancel' }],
  })
  await sheet.present()
}

async function options(index: number) {
  const sheet = await actionSheetController.create({
    header: index === 0 ? 'Portada' : `Foto ${index + 1}`,
    buttons: [
      ...(index > 0 ? [{ text: 'Usar como portada', icon: starOutline, handler: () => makeCover(index) }] : []),
      ...sources(index, 'Sustituir'),
      { text: 'Quitar foto', icon: trashOutline, role: 'destructive', handler: () => remove(index) },
      { text: 'Cancelar', icon: closeOutline, role: 'cancel' },
    ],
  })
  await sheet.present()
}

function reset() {
  items.value.forEach(release)
  items.value = []
}

onBeforeUnmount(() => items.value.forEach(release))

defineExpose({ reset })
</script>

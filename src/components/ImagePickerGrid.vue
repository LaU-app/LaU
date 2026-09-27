<template>
  <div>
    <div class="photo-grid">
      <button
        v-for="(slot, index) in slots"
        :key="index"
        type="button"
        class="photo-slot"
        :class="{ primary: index === 0, filled: !!slot }"
        :aria-label="slot ? `Cambiar foto ${index + 1}` : `Agregar foto ${index + 1}`"
        @click="pick(index)"
      >
        <template v-if="slot">
          <img :src="slot.preview" :alt="`Foto ${index + 1}`"/>
          <span v-if="index === 0" class="photo-cover">PORTADA</span>
          <span class="photo-remove" role="button" :aria-label="`Quitar foto ${index + 1}`" @click.stop="remove(index)">
            <ion-icon :icon="closeOutline"/>
          </span>
        </template>
        <template v-else>
          <ion-icon :icon="index === 0 ? cameraOutline : addOutline"/>
          <span v-if="index === 0">Foto principal</span>
        </template>
      </button>
    </div>
    <small class="photo-hint">Hasta {{ max }} fotos · la primera es la portada</small>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonIcon, actionSheetController, toastController } from '@ionic/vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { addOutline, cameraOutline, closeOutline, imagesOutline } from 'ionicons/icons'
import { optimizeImageToWebP } from '@/utils/imageOptimizer'

interface Slot { blob: Blob; preview: string }

const props = withDefaults(defineProps<{ max?: number }>(), { max: 6 })
const emit = defineEmits<{ (event: 'change', blobs: Blob[]): void }>()

const slots = ref<(Slot | null)[]>(Array.from({ length: props.max }, () => null))

watch(slots, value => emit('change', value.filter(Boolean).map(slot => (slot as Slot).blob)), { deep: true })

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

async function place(index: number, file: Blob) {
  if (file.size > 20 * 1024 * 1024) {
    await toast('La imagen no debe superar 20 MB.', 'warning')
    return
  }
  try {
    // Se sube siempre en WebP ≤1080 px: mucho menos datos móviles.
    const blob = await optimizeImageToWebP(file)
    const previous = slots.value[index]
    if (previous) URL.revokeObjectURL(previous.preview)
    slots.value[index] = { blob, preview: URL.createObjectURL(blob) }
  } catch {
    await toast('No pudimos procesar esa imagen.', 'danger')
  }
}

function remove(index: number) {
  const slot = slots.value[index]
  if (slot) URL.revokeObjectURL(slot.preview)
  // Se compacta para que nunca queden huecos antes de la portada.
  const rest = slots.value.filter((entry, position) => position !== index && entry)
  slots.value = [...rest, ...Array.from({ length: props.max - rest.length }, () => null)] as (Slot | null)[]
}

async function pick(index: number) {
  const sheet = await actionSheetController.create({
    header: 'Agregar foto',
    buttons: [
      { text: 'Tomar foto', icon: cameraOutline, handler: () => { void fromCamera(CameraSource.Camera, index) } },
      { text: 'Elegir de la galería', icon: imagesOutline, handler: () => { void fromCamera(CameraSource.Photos, index) } },
      { text: 'Buscar archivo', icon: addOutline, handler: () => fromFile(index) },
      { text: 'Cancelar', icon: closeOutline, role: 'cancel' },
    ],
  })
  await sheet.present()
}

function reset() {
  slots.value.forEach(slot => slot && URL.revokeObjectURL(slot.preview))
  slots.value = Array.from({ length: props.max }, () => null)
}

defineExpose({ reset })
</script>

<style scoped>
.photo-hint { display: block; margin-top: 10px; font-size: 11px; line-height: 16px; color: var(--study-faint); }
</style>

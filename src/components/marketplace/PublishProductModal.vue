<template>
  <ion-page ref="pageRef" class="study-ui market-ui product-sheet">
    <!-- Encabezado fijo: título, paso actual y cierre -->
    <ion-header class="ion-no-border">
      <div class="sheet-head">
        <div class="sheet-title">
          <span class="eyebrow">PASO {{ step }} DE 2 · {{ step === 1 ? 'FOTOS Y DATOS' : 'DETALLES Y ENTREGA' }}</span>
          <h2 id="product-form-title" ref="titleRef" tabindex="-1">{{ editMode ? 'Editar producto' : '¿Qué vas a vender?' }}</h2>
        </div>
        <button type="button" class="sheet-close" aria-label="Cerrar formulario" :disabled="saving" @click="close">
          <ion-icon :icon="closeOutline"/>
        </button>
      </div>
      <ol class="sheet-steps" aria-label="Pasos">
        <li>
          <button type="button" :class="{ active: step === 1, done: step > 1 }" :aria-current="step === 1 ? 'step' : undefined" :disabled="saving" @click="goTo(1)">
            <span class="step-dot">1</span>Fotos y datos
          </button>
        </li>
        <li>
          <button type="button" :class="{ active: step === 2 }" :aria-current="step === 2 ? 'step' : undefined" :disabled="saving || !step1Valid" @click="goTo(2)">
            <span class="step-dot">2</span>Detalles y entrega
          </button>
        </li>
      </ol>
    </ion-header>

    <ion-content ref="contentRef">
      <!-- Sin botones submit dentro: Enter no publica; solo el botón "Publicar" envía -->
      <form class="sheet-form" novalidate @submit.prevent>
        <section v-show="step === 1" class="sheet-step" aria-labelledby="step-1-title">
          <h3 id="step-1-title" ref="step1Ref" class="sr-only" tabindex="-1">Paso 1 de 2: fotos y datos principales</h3>

          <div class="sheet-field">
            <span class="sheet-label">FOTOS <em aria-hidden="true">*</em></span>
            <ImagePickerGrid ref="picker" :initial="initialPhotos" :disabled="saving" @change="photos = $event"/>
          </div>

          <label class="sheet-field">
            <span class="sheet-label">TÍTULO <em aria-hidden="true">*</em></span>
            <input v-model="form.name" maxlength="120" placeholder="Ej. Calculadora TI-Nspire CX II" autocomplete="off" enterkeyhint="next" aria-required="true" :disabled="saving"/>
          </label>

          <div class="sheet-row">
            <label class="sheet-field">
              <span class="sheet-label">PRECIO <em aria-hidden="true">*</em></span>
              <span class="price-input"><b aria-hidden="true">$</b><input v-model="form.price" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" aria-required="true" aria-label="Precio en dólares" :disabled="saving"/></span>
            </label>
            <label class="sheet-field">
              <span class="sheet-label">ESTADO</span>
              <select v-model="form.condition" :disabled="saving">
                <option value="">Sin especificar</option>
                <option value="nuevo">Nuevo</option>
                <option value="como_nuevo">Como nuevo</option>
                <option value="buen_estado">Buen estado</option>
                <option value="aceptable">Aceptable</option>
              </select>
            </label>
          </div>

          <div class="sheet-field" role="group" aria-labelledby="category-label">
            <span id="category-label" class="sheet-label">CATEGORÍA <em aria-hidden="true">*</em></span>
            <div class="category-chips">
              <button v-for="category in categories" :key="category.id" type="button" :aria-pressed="form.category_id === category.id" :class="{ selected: form.category_id === category.id }" :disabled="saving" @click="form.category_id = category.id">
                <ion-icon :icon="categoryIcon(category.icon)"/>{{ category.name }}
              </button>
            </div>
            <p v-if="categoriesError" class="sheet-inline-error">No pudimos cargar las categorías. <button type="button" class="study-link" @click="loadCategories">Reintentar</button></p>
          </div>
        </section>

        <section v-show="step === 2" class="sheet-step" aria-labelledby="step-2-title">
          <h3 id="step-2-title" ref="step2Ref" class="sr-only" tabindex="-1">Paso 2 de 2: detalles, entrega y publicación</h3>

          <label class="sheet-field">
            <span class="sheet-label">DESCRIPCIÓN <small>{{ form.description.length }} / 400</small></span>
            <textarea v-model="form.description" rows="3" maxlength="400" placeholder="Estado, detalles, por qué lo vendés…" :disabled="saving"/>
          </label>

          <!-- En LaU todo se entrega dentro de un campus -->
          <div class="sheet-field">
            <label class="sheet-label" for="delivery-campus">CAMPUS DE ENTREGA</label>
            <select id="delivery-campus" v-model.number="campusId" class="campus-select" :disabled="saving || !campuses.length">
              <option v-if="!campuses.length" :value="campusId">{{ campusesError ? 'No pudimos cargar los campus' : 'Cargando campus…' }}</option>
              <option v-else-if="campusId === null" :value="null" disabled>Elegí el campus</option>
              <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.nombre }}{{ c.id === myCampusId ? ' (tu campus)' : '' }}</option>
            </select>
            <small class="campus-hint">Solo se entrega dentro del campus: así nadie tiene que ir a otro lugar.</small>
          </div>

          <div class="sheet-field">
            <label class="sheet-label" for="delivery-point">PUNTO DE ENTREGA</label>
            <input id="delivery-point" v-model="form.delivery_point" maxlength="120" placeholder="¿Dónde lo entregás?" autocomplete="off" enterkeyhint="done" :disabled="saving"/>
            <div class="quick-chips" role="group" aria-label="Lugares frecuentes">
              <button v-for="place in quickPlaces" :key="place" type="button" :aria-pressed="form.delivery_point === place" :class="{ selected: form.delivery_point === place }" :disabled="saving" @click="form.delivery_point = form.delivery_point === place ? '' : place">{{ place }}</button>
            </div>
            <!-- Punto exacto dentro del campus (opcional) -->
            <DeliveryPointPicker v-model="deliveryPin" :campus="selectedCampus" :disabled="saving"/>
          </div>

          <div class="sheet-field stock-field">
            <div>
              <span id="stock-label" class="sheet-label">UNIDADES DISPONIBLES</span>
              <small>Cuántas tenés para vender</small>
            </div>
            <div class="stock-stepper" role="group" aria-labelledby="stock-label">
              <button type="button" :disabled="saving || form.stock <= 1" aria-label="Quitar una unidad" @click="form.stock--">−</button>
              <output aria-live="polite">{{ form.stock }}</output>
              <button type="button" :disabled="saving || form.stock >= 100" aria-label="Añadir una unidad" @click="form.stock++">+</button>
            </div>
          </div>

          <p class="sheet-tip"><ion-icon :icon="bulbOutline"/>Con buenas fotos y un precio claro, las cosas se mueven mucho más rápido en el campus.</p>
        </section>
      </form>
    </ion-content>

    <!-- Pie fijo: errores junto a la acción y botón principal siempre visible -->
    <ion-footer class="ion-no-border">
      <div class="sheet-foot">
        <p v-if="error" class="sheet-error" role="alert"><ion-icon :icon="alertCircleOutline"/>{{ error }}</p>
        <p v-else-if="missing" class="publish-hint" aria-live="polite"><ion-icon :icon="alertCircleOutline"/>{{ missing }}</p>
        <div class="sheet-actions">
          <button v-if="step === 2" type="button" class="sheet-back" :disabled="saving" @click="goTo(1)">
            <ion-icon :icon="arrowBackOutline"/>Atrás
          </button>
          <button v-if="step === 1" type="button" class="study-button" :disabled="!step1Valid" @click="goTo(2)">
            Continuar<ion-icon :icon="arrowForwardOutline"/>
          </button>
          <button v-else type="button" class="study-button" :disabled="saving || !valid" :aria-busy="saving" @click="submit">
            <ion-spinner v-if="saving" name="crescent" aria-hidden="true"/>
            {{ saving ? progress : (editMode ? 'Guardar cambios' : 'Publicar') }}
            <ion-icon v-if="!saving" :icon="checkmarkOutline"/>
          </button>
        </div>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import DeliveryPointPicker from '@/components/marketplace/DeliveryPointPicker.vue'
import campusService, { type Campus } from '@/services/campusService'
import { IonPage, IonHeader, IonContent, IonFooter, IonIcon, IonSpinner, alertController } from '@ionic/vue'
import { arrowBackOutline, arrowForwardOutline, closeOutline, checkmarkOutline, bulbOutline, alertCircleOutline } from 'ionicons/icons'
import ImagePickerGrid from '@/components/ImagePickerGrid.vue'
import { categoryIcon } from '@/utils/categoryIcon'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import type { PhotoItem, Product, ProductCategory } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const props = defineProps<{ product?: Product | null }>()
const editMode = !!props.product

const pageRef = ref<{ $el: HTMLElement } | null>(null)
const contentRef = ref<{ $el: HTMLIonContentElement } | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const step1Ref = ref<HTMLElement | null>(null)
const step2Ref = ref<HTMLElement | null>(null)

const step = ref<1 | 2>(1)
const categories = ref<ProductCategory[]>([])
const categoriesError = ref(false)
const saving = ref(false)
const progress = ref('Publicando…')
const error = ref('')

const quickPlaces = ['Biblioteca Central', 'Cafetería', 'Entrada principal', 'Edificio de Ingeniería']

// Al editar, el selector arranca con las fotos actuales en su orden (la portada primero)
const initialPhotos = [...(props.product?.images ?? [])]
  .sort((a, b) => a.position - b.position)
  .map(image => ({ filename: image.filename, url: image.url }))
const photos = ref<PhotoItem[]>([])

const form = reactive({
  name: props.product?.name ?? '',
  description: props.product?.description ?? '',
  price: props.product ? String(props.product.price) : '',
  condition: props.product?.condition ?? '',
  category_id: props.product?.category_id ?? null as number | null,
  delivery_point: props.product?.delivery_point ?? '',
  stock: props.product?.stock ?? 1,
})
const initialForm = JSON.stringify(form)

// Campus de entrega (por defecto, el del estudiante) y punto exacto opcional dentro de él.
const campuses = ref<Campus[]>([])
const campusesError = ref(false)
const myCampusId = ref<number | null>(null)
const campusId = ref<number | null>(props.product?.universidad_id ?? null)
let initialCampusId: number | null = campusId.value
const initialPin = props.product?.delivery_lat != null && props.product?.delivery_lng != null
  ? { lat: Number(props.product.delivery_lat), lng: Number(props.product.delivery_lng) }
  : null
const deliveryPin = ref<{ lat: number; lng: number } | null>(initialPin)
const selectedCampus = computed(() => campuses.value.find(c => c.id === campusId.value) ?? null)

async function loadCampuses() {
  campusesError.value = false
  try {
    const map = await campusService.map()
    campuses.value = map.campuses
    myCampusId.value = map.my_campus_id
    if (campusId.value === null && map.my_campus_id) {
      campusId.value = map.my_campus_id
      initialCampusId = map.my_campus_id
    }
  } catch {
    campusesError.value = true
  }
}

// Al cambiar de campus, el punto marcado (que era del otro campus) se borra.
watch(campusId, (next, previous) => { if (previous !== null && next !== previous) deliveryPin.value = null })

const photosChanged = computed(() =>
  photos.value.some(photo => photo.blob) ||
  photos.value.map(photo => photo.filename).join('|') !== initialPhotos.map(photo => photo.filename).join('|')
)
const dirty = computed(() =>
  photosChanged.value || JSON.stringify(form) !== initialForm ||
  campusId.value !== initialCampusId || JSON.stringify(deliveryPin.value) !== JSON.stringify(initialPin)
)

// Al editar un producto que ya no tenía fotos se puede guardar sin agregar (como antes);
// si tenía, al menos una debe quedar.
const photosOk = computed(() => photos.value.length > 0 || (editMode && !initialPhotos.length && !photosChanged.value))

// Todo lo obligatorio está en el paso 1; el paso 2 solo tiene datos opcionales
const step1Valid = computed(() =>
  photosOk.value &&
  form.name.trim().length > 2 &&
  Number(form.price) > 0 &&
  !!form.category_id
)
// Si los campus no cargaron, decide el servidor (usa el campus del estudiante).
const valid = computed(() => step1Valid.value && form.stock >= 1 && form.stock <= 100 && (campusId.value !== null || !campuses.value.length))

const missing = computed(() => {
  if (step1Valid.value) return ''
  const parts = [
    !photosOk.value && 'una foto',
    form.name.trim().length <= 2 && 'el título',
    !(Number(form.price) > 0) && 'el precio',
    !form.category_id && 'la categoría',
  ].filter(Boolean) as string[]
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}` : parts[0]
  return `Para continuar falta ${list}.`
})

let modalEl: HTMLIonModalElement | null = null
let allowDismiss = false

async function goTo(next: 1 | 2) {
  if (saving.value || (next === 2 && !step1Valid.value)) return
  step.value = next
  error.value = ''
  await nextTick()
  await contentRef.value?.$el.scrollToTop(0)
  ;(next === 1 ? step1Ref : step2Ref).value?.focus()
}

const close = () => { void modalEl?.dismiss(undefined, 'cancel') }

async function confirmDiscard() {
  const alert = await alertController.create({
    header: editMode ? '¿Descartar los cambios?' : '¿Descartar la publicación?',
    message: 'Si cerrás ahora se pierde lo que llevás del formulario.',
    buttons: [
      { text: 'Seguir editando', role: 'cancel' },
      { text: 'Descartar', role: 'destructive' },
    ],
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  return role === 'destructive'
}

async function submit() {
  if (saving.value || !valid.value) return
  saving.value = true
  error.value = ''

  try {
    // Al crear siempre se envían; al editar solo si cambiaron (sin "images" el backend no las toca)
    let images: string[] | undefined
    if (!editMode || photosChanged.value) {
      const fresh = photos.value.filter(photo => photo.blob)
      let uploaded: string[] = []
      if (fresh.length) {
        progress.value = `Subiendo ${fresh.length} foto${fresh.length > 1 ? 's' : ''}…`
        uploaded = await marketplaceService.uploadImages(fresh.map(photo => photo.blob as Blob))
      }
      // El orden del arreglo es el orden de las fotos: la primera es la portada
      let next = 0
      images = photos.value.map(photo => (photo.blob ? uploaded[next++] : photo.filename as string))
    }

    progress.value = editMode ? 'Guardando…' : 'Publicando…'
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: form.stock,
      category_id: form.category_id,
      condition: form.condition || null,
      delivery_point: form.delivery_point.trim() || null,
      delivery_lat: deliveryPin.value?.lat ?? null,
      delivery_lng: deliveryPin.value?.lng ?? null,
    }
    if (campusId.value !== null) payload.universidad_id = campusId.value
    if (images) payload.images = images

    const product = editMode
      ? await marketplaceService.updateProduct(props.product!.id, payload)
      : await marketplaceService.createProduct(payload)

    allowDismiss = true
    await modalEl?.dismiss({ created: !editMode, updated: editMode, product }, 'saved')
  } catch (e) {
    error.value = marketplaceError(e, editMode ? 'No pudimos guardar los cambios.' : 'No pudimos publicar el producto.')
  } finally {
    saving.value = false
  }
}

async function loadCategories() {
  categoriesError.value = false
  try { categories.value = await marketplaceService.categories() } catch { categoriesError.value = true }
}

onMounted(() => {
  void loadCategories()
  void loadCampuses()
  modalEl = pageRef.value?.$el.closest('ion-modal') ?? null
  if (!modalEl) return
  // Cerrar con la X, el fondo o el botón atrás de Android pide confirmación si hay cambios
  modalEl.canDismiss = async () => {
    if (allowDismiss) return true
    if (saving.value) return false
    return dirty.value ? confirmDiscard() : true
  }
  // Foco inicial en el título del diálogo (sin abrir el teclado); Ionic lo devuelve al cerrar
  // (si ya se tocó un campo durante la animación, no se le roba el foco)
  modalEl.addEventListener('ionModalDidPresent', () => {
    const active = document.activeElement
    if (!active || active === modalEl || !modalEl?.contains(active)) titleRef.value?.focus()
  }, { once: true })
})
</script>

<style scoped>
/* La hoja usa la superficie como fondo; los campos van directo sobre ella, sin tarjetas */
.product-sheet ion-content { --background: var(--study-surface); }
.sheet-head, .sheet-steps, .sheet-foot { background: var(--study-surface); }

.sheet-head { display: flex; align-items: center; gap: 12px; padding: 18px 16px 8px 20px; }
.sheet-title { flex: 1; min-width: 0; }
.sheet-title .eyebrow { color: var(--study-purple); font-size: 10px; letter-spacing: .06em; margin-bottom: 2px; }
.sheet-title h2 { font-size: 22px; line-height: 28px; font-weight: 800; letter-spacing: -.02em; outline: none; }
.sheet-close { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border: 1px solid var(--study-border); border-radius: 50%; background: var(--study-bg); color: var(--study-text); font-size: 22px; }

.sheet-steps { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0; padding: 4px 20px 12px; list-style: none; border-bottom: 1px solid var(--study-border); }
.sheet-steps button { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; padding: 0 0 8px; border: 0; border-bottom: 3px solid var(--study-track); background: none; color: var(--study-muted); font-size: 12px; font-weight: 600; text-align: left; }
.sheet-steps button.active, .sheet-steps button.done { border-bottom-color: var(--study-purple); color: var(--study-text); }
.step-dot { display: grid; place-items: center; width: 22px; height: 22px; flex-shrink: 0; border-radius: 50%; background: var(--study-track); color: var(--study-muted); font-size: 11px; font-weight: 700; }
.sheet-steps button.active .step-dot, .sheet-steps button.done .step-dot { background: var(--study-purple); color: #fff; }

.sheet-form { padding: 16px 20px 20px; }
.sheet-step { display: flex; flex-direction: column; gap: 18px; animation: sheet-step-in .22s ease both; }
@keyframes sheet-step-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.sheet-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; margin: 0; }
.sheet-label { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 14px; font-weight: 600; letter-spacing: .035em; color: var(--study-muted); }
.sheet-label em { font-style: normal; color: var(--study-orange); }
.sheet-label small { margin-left: auto; font-size: 12px; font-weight: 400; letter-spacing: 0; color: var(--study-faint); }
.sheet-field input, .sheet-field textarea, .sheet-field select, .price-input {
  width: 100%; min-height: 48px; border: 1px solid var(--study-border); border-radius: 16px;
  background: var(--study-bg); color: var(--study-text); font-size: 16px; line-height: 22px; outline: none;
}
.sheet-field input, .sheet-field textarea, .sheet-field select { padding: 12px 14px; }
.sheet-field textarea { resize: vertical; min-height: 92px; }
.sheet-field input:focus, .sheet-field textarea:focus, .sheet-field select:focus, .price-input:focus-within { border-color: var(--study-text); }
.sheet-field input::placeholder, .sheet-field textarea::placeholder { color: var(--study-faint); }

.sheet-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.price-input { display: flex; align-items: center; gap: 4px; padding: 0 14px; }
.price-input b { font-size: 16px; color: var(--study-muted); }
.sheet-field .price-input input { min-height: 46px; padding: 0; border: 0; background: none; }

.category-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.category-chips button { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-bg); color: var(--study-muted); font-size: 13px; font-weight: 600; }
.category-chips button ion-icon { font-size: 17px; }
.category-chips button.selected { background: var(--study-cta); border-color: var(--study-cta); color: var(--study-on-cta); }
.quick-chips button { min-height: 44px; }
.campus-select { width: 100%; appearance: auto; }
.campus-hint { display: block; margin-top: 6px; font-size: 12px; color: var(--study-muted); }
/* En oscuro el CTA casi negro se confunde con el fondo de los chips: borde claro en el seleccionado */
.ion-palette-dark .category-chips button.selected, .ion-palette-dark .quick-chips button.selected { border-color: var(--study-text); }

.stock-field { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }
.stock-field small { display: block; margin-top: 3px; font-size: 12px; line-height: 16px; color: var(--study-faint); }
.stock-stepper { display: flex; align-items: center; gap: 4px; padding: 4px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-bg); }
.stock-stepper button { display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--study-cta); color: var(--study-on-cta); font-size: 22px; line-height: 1; }
.stock-stepper output { min-width: 36px; text-align: center; font-size: 18px; font-weight: 800; }

.sheet-tip { display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 12px 14px; border-radius: 14px; background: var(--study-blue-soft); color: var(--study-muted); font-size: 12px; line-height: 18px; }
.sheet-tip ion-icon { flex-shrink: 0; margin-top: 1px; font-size: 16px; color: var(--study-blue); }
.sheet-inline-error { margin: 0; font-size: 12px; line-height: 18px; color: var(--study-orange); }

.sheet-foot { display: grid; gap: 10px; padding: 12px 20px calc(12px + var(--ion-safe-area-bottom, 0px)); border-top: 1px solid var(--study-border); }
.sheet-error, .publish-hint { display: flex; align-items: flex-start; gap: 8px; margin: 0; font-size: 12px; line-height: 17px; }
.sheet-error { padding: 10px 12px; border-radius: 12px; background: var(--study-orange-soft, rgba(249, 115, 22, .1)); color: var(--study-text); }
.sheet-error ion-icon { color: var(--study-orange); }
.publish-hint { color: var(--study-muted); }
.sheet-error ion-icon, .publish-hint ion-icon { flex-shrink: 0; font-size: 16px; }
.publish-hint ion-icon { color: var(--study-orange); }
.sheet-actions { display: flex; gap: 10px; }
.sheet-actions .study-button { flex: 1; min-height: 52px; }
.sheet-actions .study-button ion-spinner { width: 18px; height: 18px; color: currentColor; }
.sheet-back { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 104px; min-height: 52px; padding: 0 16px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-text); font-size: 14px; font-weight: 700; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

@media (prefers-reduced-motion: reduce) {
  .sheet-step { animation: none; }
}
</style>

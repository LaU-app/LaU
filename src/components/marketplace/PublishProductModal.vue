<template>
  <ion-page class="study-ui market-ui"><ion-content><main class="study-shell study-body">
    <div class="form-heading">
      <button class="study-icon-button" aria-label="Cerrar" @click="close"><ion-icon :icon="arrowBackOutline"/></button>
      <div><span class="eyebrow">MARKETPLACE LaU</span><h1>{{ editMode ? 'Editar producto' : '¿Qué vas a vender?' }}</h1></div>
      <span class="study-icon-button"><ion-icon :icon="storefrontOutline"/></span>
    </div>

    <form class="task-form" @submit.prevent="submit">
      <div class="task-field study-card">
        <span>FOTOS <em>*</em></span>
        <ImagePickerGrid ref="picker" @change="blobs = $event"/>
      </div>

      <label class="task-field study-card">
        <span>TÍTULO <em>*</em></span>
        <input v-model="form.name" required maxlength="120" placeholder="Ej. Calculadora TI-Nspire CX II" :disabled="saving"/>
      </label>

      <label class="task-field study-card">
        <span>DESCRIPCIÓN <small>{{ form.description.length }} / 400</small></span>
        <textarea v-model="form.description" rows="4" maxlength="400" placeholder="Estado, detalles, por qué lo vendés…" :disabled="saving"/>
      </label>

      <div class="task-field study-card">
        <div class="price-row">
          <label><span>PRECIO <em>*</em></span><div class="price-input"><b>$</b><input v-model="form.price" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" required :disabled="saving"/></div></label>
          <label><span>ESTADO</span><select v-model="form.condition" :disabled="saving"><option value="">Sin especificar</option><option value="nuevo">Nuevo</option><option value="como_nuevo">Como nuevo</option><option value="buen_estado">Buen estado</option><option value="aceptable">Aceptable</option></select></label>
        </div>
      </div>

      <div class="task-field study-card">
        <span>CATEGORÍA <em>*</em></span>
        <div class="category-picker">
          <button v-for="category in categories" :key="category.id" type="button" :class="{selected:form.category_id===category.id}" :disabled="saving" @click="form.category_id=category.id">
            <ion-icon :icon="categoryIcon(category.icon)"/>{{ category.name }}
          </button>
        </div>
      </div>

      <div class="task-field study-card">
        <span>PUNTO DE ENTREGA</span>
        <input v-model="form.delivery_point" maxlength="120" placeholder="¿Dónde se lo entregás?" :disabled="saving"/>
        <div class="quick-chips">
          <button v-for="place in quickPlaces" :key="place" type="button" :class="{selected:form.delivery_point===place}" :disabled="saving" @click="form.delivery_point = form.delivery_point === place ? '' : place">{{ place }}</button>
        </div>
      </div>

      <div class="task-field study-card estimate-field">
        <div class="estimate-heading"><div><span class="eyebrow">UNIDADES DISPONIBLES</span><small>Cuántas tenés para vender</small></div><span class="study-symbol"><ion-icon :icon="cubeOutline"/></span></div>
        <div class="block-stepper">
          <button type="button" :disabled="saving || form.stock<=1" aria-label="Quitar una unidad" @click="form.stock--">−</button>
          <div><div><output>{{ form.stock }}</output><span>UNIDADES</span></div></div>
          <button type="button" :disabled="saving || form.stock>=100" aria-label="Añadir una unidad" @click="form.stock++">+</button>
        </div>
      </div>

      <div class="form-tip study-card"><span class="study-symbol tone-blue"><ion-icon :icon="bulbOutline"/></span><div><b>Tip de LaU</b><p>Con buenas fotos y un precio claro, las cosas se mueven mucho más rápido en el campus.</p></div></div>

      <p v-if="error" class="study-error" role="alert">{{ error }}</p>
      <p v-if="!valid && !saving" class="publish-hint"><ion-icon :icon="alertCircleOutline"/>Completá título, precio, categoría y al menos una foto.</p>

      <button class="study-button task-save" type="submit" :disabled="saving || !valid">
        {{ saving ? progress : (editMode ? 'Guardar cambios' : 'Publicar') }}<ion-icon v-if="!saving" :icon="checkmarkOutline"/>
      </button>
      <button class="study-link form-cancel" type="button" :disabled="saving" @click="close">Cancelar</button>
    </form>
  </main></ion-content></ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonPage, IonContent, IonIcon, modalController } from '@ionic/vue'
import { arrowBackOutline, storefrontOutline, checkmarkOutline, bulbOutline, cubeOutline, alertCircleOutline } from 'ionicons/icons'
import ImagePickerGrid from '@/components/ImagePickerGrid.vue'
import { categoryIcon } from '@/utils/categoryIcon'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import type { Product, ProductCategory } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const props = defineProps<{ product?: Product | null }>()
const editMode = !!props.product

const categories = ref<ProductCategory[]>([])
const blobs = ref<Blob[]>([])
const picker = ref<InstanceType<typeof ImagePickerGrid> | null>(null)
const saving = ref(false)
const progress = ref('Publicando…')
const error = ref('')

const quickPlaces = ['Biblioteca Central', 'Cafetería', 'Entrada principal', 'Edificio de Ingeniería']

const form = reactive({
  name: props.product?.name ?? '',
  description: props.product?.description ?? '',
  price: props.product ? String(props.product.price) : '',
  condition: props.product?.condition ?? '',
  category_id: props.product?.category_id ?? null as number | null,
  delivery_point: props.product?.delivery_point ?? '',
  stock: props.product?.stock ?? 1,
})

const valid = computed(() =>
  form.name.trim().length > 2 &&
  Number(form.price) > 0 &&
  !!form.category_id &&
  (editMode || blobs.value.length > 0)
)

const close = () => { if (!saving.value) void modalController.dismiss() }

async function submit() {
  if (saving.value || !valid.value) return
  saving.value = true
  error.value = ''

  try {
    let images: string[] | undefined
    if (blobs.value.length) {
      progress.value = `Subiendo ${blobs.value.length} foto${blobs.value.length > 1 ? 's' : ''}…`
      images = await marketplaceService.uploadImages(blobs.value)
    }

    progress.value = 'Publicando…'
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: form.stock,
      category_id: form.category_id,
      condition: form.condition || null,
      delivery_point: form.delivery_point.trim() || null,
    }
    if (images) payload.images = images

    const product = editMode
      ? await marketplaceService.updateProduct(props.product!.id, payload)
      : await marketplaceService.createProduct(payload)

    picker.value?.reset()
    await modalController.dismiss({ created: !editMode, updated: editMode, product })
  } catch (e) {
    error.value = marketplaceError(e, 'No pudimos publicar el producto.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try { categories.value = await marketplaceService.categories() } catch { /* se reintenta al reabrir */ }
})
</script>

<style scoped>
.price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.price-row label { display: grid; gap: 10px; min-width: 0; }
.price-input { display: flex; align-items: center; gap: 4px; border: 1px solid var(--study-border); background: var(--study-surface); border-radius: 24px; padding: 0 16px; }
.price-input b { font-size: 16px; color: var(--study-muted); }
.price-input input { border: 0 !important; padding: 14px 0 !important; background: none !important; }
.price-row select { border: 1px solid var(--study-border); background: var(--study-surface); color: var(--study-text); border-radius: 24px; padding: 14px 16px; font-size: 14px; min-height: 50px; }
.category-picker { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.category-picker button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 76px; padding: 10px 6px; border: 1px solid var(--study-border); border-radius: 16px; background: var(--study-bg); color: var(--study-muted); font-size: 11px; line-height: 14px; text-align: center; }
.category-picker button ion-icon { font-size: 20px; }
.category-picker button.selected { background: var(--study-cta); border-color: var(--study-cta); color: var(--study-on-cta); }
.publish-hint { display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 17px; color: var(--study-orange); }
.publish-hint ion-icon { font-size: 16px; flex-shrink: 0; }
</style>

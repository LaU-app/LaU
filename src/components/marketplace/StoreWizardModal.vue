<template>
  <ion-page class="study-ui market-ui"><ion-content><main class="study-shell study-body">
    <div class="form-heading">
      <button class="study-icon-button" aria-label="Cerrar" @click="close"><ion-icon :icon="arrowBackOutline"/></button>
      <div><span class="eyebrow">TU EMPRENDIMIENTO</span><h1>{{ editMode ? 'Editar tienda' : 'Crear mi tienda' }}</h1></div>
      <span class="study-icon-button"><ion-icon :icon="storefrontOutline"/></span>
    </div>

    <div v-if="!editMode" class="wizard-progress">
      <span class="eyebrow"><b>PASO {{ step }} DE 2</b><span>{{ step === 1 ? 'Perfil de la tienda' : 'Tu primer producto' }}</span></span>
      <div class="wizard-bar"><span :style="{ width: step === 1 ? '50%' : '100%' }"/></div>
    </div>

    <form v-if="step === 1" class="task-form" @submit.prevent="save">
      <button type="button" class="logo-drop" :aria-label="logoPreview ? 'Cambiar logo' : 'Subir logo'" @click="pickLogo">
        <img v-if="logoPreview" :src="logoPreview" alt="Logo de la tienda"/>
        <template v-else><ion-icon :icon="imageOutline"/><span>Subí el logo de tu tienda (opcional)</span></template>
      </button>

      <label class="task-field study-card">
        <span>NOMBRE DE TU EMPRENDIMIENTO <em>*</em></span>
        <input v-model="form.name" required maxlength="80" placeholder="Ej. Apuntes Perfectos" :disabled="saving"/>
      </label>

      <div class="task-field study-card">
        <span>¿QUÉ TIPO DE PRODUCTOS VENDÉS? <em>*</em></span>
        <div class="category-picker">
          <button v-for="category in categories" :key="category.id" type="button" :class="{selected:form.category_id===category.id}" :disabled="saving" @click="form.category_id=category.id">
            <ion-icon :icon="categoryIcon(category.icon)"/>{{ category.name }}
          </button>
        </div>
      </div>

      <label class="task-field study-card">
        <span>DESCRIPCIÓN DEL NEGOCIO</span>
        <textarea v-model="form.description" rows="4" maxlength="2000" placeholder="Contá brevemente qué hace especial a tu tienda…" :disabled="saving"/>
      </label>

      <label class="task-field study-card">
        <span>INSTAGRAM <small>Opcional</small></span>
        <input v-model="form.instagram" maxlength="60" placeholder="@tu_usuario" :disabled="saving"/>
      </label>

      <label class="task-field study-card">
        <span>WHATSAPP <small>Opcional</small></span>
        <input v-model="form.whatsapp" maxlength="30" placeholder="+503 0000 0000" :disabled="saving"/>
      </label>

      <div class="form-tip study-card"><span class="study-symbol tone-blue"><ion-icon :icon="bulbOutline"/></span><div><b>Tip de éxito</b><p>Una descripción clara ayuda a que más estudiantes confíen en tus productos.</p></div></div>

      <p v-if="error" class="study-error" role="alert">{{ error }}</p>

      <button class="study-button task-save" type="submit" :disabled="saving || !valid">
        {{ saving ? 'Guardando…' : editMode ? 'Guardar cambios' : 'Crear mi tienda' }}<ion-icon v-if="!saving" :icon="checkmarkOutline"/>
      </button>
      <button class="study-link form-cancel" type="button" :disabled="saving" @click="close">Cancelar</button>
    </form>

    <div v-else class="wizard-done">
      <span class="study-symbol tone-green"><ion-icon :icon="checkmarkCircleOutline"/></span>
      <h2>¡Tu tienda está lista!</h2>
      <p class="study-muted">Una tienda vacía no vende. Publicá tu primer producto ahora y empezá a moverte.</p>
      <button class="study-button" @click="publishFirst"><ion-icon :icon="addOutline"/>Publicar mi primer producto</button>
      <button class="study-link" @click="finish">Lo hago después</button>
    </div>
  </main></ion-content></ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonPage, IonContent, IonIcon, modalController } from '@ionic/vue'
import { arrowBackOutline, storefrontOutline, imageOutline, bulbOutline, checkmarkOutline, checkmarkCircleOutline, addOutline } from 'ionicons/icons'
import PublishProductModal from '@/components/marketplace/PublishProductModal.vue'
import { categoryIcon } from '@/utils/categoryIcon'
import marketplaceService, { marketplaceError } from '@/services/marketplaceService'
import { optimizeImageToWebP } from '@/utils/imageOptimizer'
import type { ProductCategory, Store } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const props = defineProps<{ store?: Store | null }>()
const editMode = !!props.store

const categories = ref<ProductCategory[]>([])
const step = ref(1)
const saving = ref(false)
const error = ref('')
const logoBlob = ref<Blob | null>(null)
const logoPreview = ref<string | null>(props.store?.logo_url ?? null)

const form = reactive({
  name: props.store?.name ?? '',
  category_id: props.store?.category_id ?? null as number | null,
  description: props.store?.description ?? '',
  instagram: props.store?.instagram ?? '',
  whatsapp: props.store?.whatsapp ?? '',
})

const valid = computed(() => form.name.trim().length > 1 && !!form.category_id)

function pickLogo() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const blob = await optimizeImageToWebP(file, 512)
      if (logoPreview.value?.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
      logoBlob.value = blob
      logoPreview.value = URL.createObjectURL(blob)
    } catch { error.value = 'No pudimos procesar esa imagen.' }
  }
  input.click()
}

const close = () => { if (!saving.value) void modalController.dismiss() }
const finish = () => modalController.dismiss({ saved: true })

async function save() {
  if (saving.value || !valid.value) return
  saving.value = true
  error.value = ''

  try {
    const fields: Record<string, string> = {
      name: form.name.trim(),
      category_id: String(form.category_id),
      description: form.description.trim(),
      instagram: form.instagram.trim(),
      whatsapp: form.whatsapp.trim(),
    }

    let payload: FormData | Record<string, unknown> = fields
    if (logoBlob.value) {
      const data = new FormData()
      Object.entries(fields).forEach(([key, value]) => data.append(key, value))
      data.append('logo', logoBlob.value, 'logo.webp')
      payload = data
    }

    if (editMode) {
      await marketplaceService.updateStore(payload)
      await modalController.dismiss({ saved: true })
    } else {
      await marketplaceService.createStore(payload)
      step.value = 2
    }
  } catch (e) {
    error.value = marketplaceError(e, 'No pudimos guardar tu tienda.')
  } finally {
    saving.value = false
  }
}

async function publishFirst() {
  const modal = await modalController.create({ component: PublishProductModal })
  await modal.present()
  await modal.onDidDismiss()
  await modalController.dismiss({ saved: true })
}

onMounted(async () => {
  try { categories.value = await marketplaceService.categories() } catch { /* se reintenta al reabrir */ }
})
</script>

<style scoped>
.category-picker { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.category-picker button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 76px; padding: 10px 6px; border: 1px solid var(--study-border); border-radius: 16px; background: var(--study-bg); color: var(--study-muted); font-size: 11px; line-height: 14px; text-align: center; }
.category-picker button ion-icon { font-size: 20px; }
.category-picker button.selected { background: var(--study-cta); border-color: var(--study-cta); color: var(--study-on-cta); }
.wizard-done { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 0; text-align: center; }
.wizard-done .study-symbol { width: 56px; height: 56px; font-size: 28px; }
.wizard-done p { max-width: 280px; }
.wizard-done .study-button { margin-top: 8px; }
</style>

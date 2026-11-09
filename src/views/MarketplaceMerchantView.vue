<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <main class="study-shell study-body merchant-page">
        <div class="detail-toolbar">
          <button class="study-icon-button" aria-label="Volver" @click="back"><ion-icon :icon="arrowBackOutline"/></button>
        </div>

        <header class="market-welcome">
          <h1>Vendé con el respaldo de LaU</h1>
          <p class="study-muted intro">Verificamos tu comercio, conectás tu cuenta de PayPal y los estudiantes pagan en línea con total confianza.</p>
        </header>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load">Reintentar</button></p>
        <div v-if="loading && !status" class="merchant-skeleton" aria-hidden="true"><i/><i/></div>

        <template v-if="status">
          <!-- Progreso del comercio -->
          <ol class="steps" aria-label="Progreso">
            <li v-for="(step, i) in steps" :key="step.label" :class="step.state">
              <span class="step-dot"><ion-icon v-if="step.state === 'done'" :icon="checkmarkOutline"/><template v-else>{{ i + 1 }}</template></span>
              <span>{{ step.label }}</span>
            </li>
          </ol>

          <!-- 1. Sin tienda -->
          <section v-if="!store" class="state-card study-card">
            <span class="study-symbol tone-blue"><ion-icon :icon="storefrontOutline"/></span>
            <h2>Primero creá tu tienda</h2>
            <p>Tu tienda es la vitrina que verán los estudiantes: nombre, logo, categoría y redes.</p>
            <button class="study-button" @click="createStore"><ion-icon :icon="addOutline"/>Crear mi tienda</button>
          </section>

          <!-- 2. Formulario (primera vez o tras observaciones) -->
          <form v-else-if="showForm" class="study-card legal-form" novalidate @submit.prevent="submit">
            <div v-if="status.verification?.status === 'rejected'" class="notice notice-warn" role="alert">
              <ion-icon :icon="alertCircleOutline"/>
              <div><b>LaU pidió cambios en tu solicitud</b><p>{{ status.verification.review_notes }}</p></div>
            </div>

            <h2>Datos legales del comercio</h2>
            <p class="study-muted">Los revisa el equipo de LaU. Solo los comercios verificados pueden cobrar con PayPal en el Marketplace.</p>

            <fieldset class="type-picker">
              <legend>Tipo de comercio</legend>
              <label v-for="(label, value) in status.business_types" :key="value" :class="{ active: form.business_type === value }">
                <input v-model="form.business_type" type="radio" name="business_type" :value="value"/>
                <span>{{ label }}</span>
              </label>
            </fieldset>

            <div class="grid-2">
              <label class="field span-2"><span>Razón social o nombre del titular</span>
                <input v-model.trim="form.legal_name" autocomplete="organization" placeholder="Papelería Campus Central, S.A. de C.V."/>
                <small v-if="fieldErrors.legal_name" class="err">{{ fieldErrors.legal_name }}</small></label>
              <label class="field"><span>NIT</span>
                <input v-model.trim="form.nit" inputmode="numeric" placeholder="0614-010190-101-3"/>
                <small v-if="fieldErrors.nit" class="err">{{ fieldErrors.nit }}</small></label>
              <label class="field"><span>NRC <small v-if="form.business_type !== 'sociedad'">(opcional)</small></span>
                <input v-model.trim="form.nrc" inputmode="numeric" placeholder="123456-7"/>
                <small v-if="fieldErrors.nrc" class="err">{{ fieldErrors.nrc }}</small></label>
              <label class="field span-2"><span>Representante legal</span>
                <input v-model.trim="form.legal_representative" autocomplete="name"/>
                <small v-if="fieldErrors.legal_representative" class="err">{{ fieldErrors.legal_representative }}</small></label>
              <label class="field"><span>Correo de contacto</span>
                <input v-model.trim="form.contact_email" type="email" autocomplete="email"/>
                <small v-if="fieldErrors.contact_email" class="err">{{ fieldErrors.contact_email }}</small></label>
              <label class="field"><span>Teléfono</span>
                <input v-model.trim="form.contact_phone" type="tel" autocomplete="tel" placeholder="+503 2222-3333"/>
                <small v-if="fieldErrors.contact_phone" class="err">{{ fieldErrors.contact_phone }}</small></label>
              <label class="field span-2"><span>Dirección del comercio</span>
                <input v-model.trim="form.address" autocomplete="street-address"/>
                <small v-if="fieldErrors.address" class="err">{{ fieldErrors.address }}</small></label>
              <label class="field span-2"><span>Sitio web o red social <small>(opcional)</small></span>
                <input v-model.trim="form.website" type="url" placeholder="https://"/>
                <small v-if="fieldErrors.website" class="err">{{ fieldErrors.website }}</small></label>
              <label class="field span-2"><span>¿Qué vas a vender a estudiantes?</span>
                <textarea v-model.trim="form.offer_description" rows="3" maxlength="1500" placeholder="Calculadoras, cuadernos, material de laboratorio…"/>
                <small v-if="fieldErrors.offer_description" class="err">{{ fieldErrors.offer_description }}</small></label>
            </div>

            <label class="upload" :class="{ filled: documentName }">
              <input type="file" accept="application/pdf,image/png,image/jpeg" @change="pickDocument"/>
              <ion-icon :icon="documentAttachOutline"/>
              <span>
                <b>{{ documentName || (status.verification?.has_document ? 'Documento enviado: ' + (status.verification.document_original_name || 'archivo') : 'Adjuntá tu documento legal') }}</b>
                <small>Escritura de constitución, matrícula de comercio o tarjeta de NIT/IVA. PDF o imagen, máximo 5 MB. Solo lo ve el equipo de LaU.</small>
              </span>
            </label>
            <small v-if="fieldErrors.document" class="err">{{ fieldErrors.document }}</small>

            <label class="terms">
              <input v-model="form.accepts_terms" type="checkbox"/>
              <span>Declaro que los datos son verdaderos y acepto que LaU los verifique. Entiendo que LaU puede suspender el distintivo ante reclamos o datos falsos.</span>
            </label>
            <small v-if="fieldErrors.accepts_terms" class="err">{{ fieldErrors.accepts_terms }}</small>

            <button class="study-button" type="submit" :disabled="submitting">
              <ion-spinner v-if="submitting" name="crescent"/><ion-icon v-else :icon="sendOutline"/>
              {{ submitting ? 'Enviando…' : 'Enviar solicitud' }}
            </button>
          </form>

          <!-- 3. En revisión -->
          <section v-else-if="store.verification_status === 'submitted'" class="state-card study-card">
            <span class="study-symbol tone-orange"><ion-icon :icon="hourglassOutline"/></span>
            <h2>Estamos revisando tu comercio</h2>
            <p>Enviaste tu solicitud {{ submittedAgo }}. El equipo de LaU revisa los datos legales y te avisamos aquí apenas haya una decisión.</p>
            <dl class="mini-summary">
              <div><dt>Razón social</dt><dd>{{ status.verification?.legal_name }}</dd></div>
              <div><dt>NIT</dt><dd>{{ status.verification?.nit }}</dd></div>
            </dl>
            <button class="study-link" @click="load"><ion-icon :icon="refreshOutline"/>Actualizar estado</button>
          </section>

          <!-- 4. Suspendido -->
          <section v-else-if="store.verification_status === 'suspended'" class="state-card study-card">
            <span class="study-symbol tone-orange"><ion-icon :icon="alertCircleOutline"/></span>
            <h2>Tu distintivo está suspendido</h2>
            <p>{{ status.verification?.review_notes || 'Escribinos para revisar tu caso.' }}</p>
          </section>

          <!-- 5. Aprobado: conectar PayPal / verificar / listo -->
          <template v-else-if="store.verification_status === 'approved'">
            <section v-if="store.accepts_paypal" class="state-card study-card success">
              <span class="study-symbol tone-green"><ion-icon :icon="shieldCheckmarkOutline"/></span>
              <h2>Tu comercio está verificado y cobra con PayPal</h2>
              <p>Los estudiantes ven el distintivo en tu tienda y pueden pagar en línea. El asistente de compras de LaU también recomienda tus productos cuando coinciden con lo que buscan.</p>
              <VerifiedBadge paypal/>
              <div class="actions-2">
                <button class="study-button" @click="router.push(`/tabs/marketplace/store/${store.slug}`)"><ion-icon :icon="eyeOutline"/>Ver mi tienda</button>
                <button class="study-button secondary-button" @click="publish"><ion-icon :icon="addOutline"/>Publicar producto</button>
              </div>
            </section>

            <section v-else class="state-card study-card">
              <span class="study-symbol tone-blue"><ion-icon :icon="logoPaypal"/></span>
              <h2>{{ store.paypal_status === 'pending' ? 'Terminá de conectar PayPal' : '¡Aprobado! Conectá tu cuenta de PayPal' }}</h2>
              <p v-if="store.paypal_status !== 'pending'">LaU verificó tu comercio. Ahora vinculá tu cuenta PayPal Business para recibir los pagos directamente en ella.</p>
              <p v-else>Si ya completaste los pasos en PayPal, verificá tu estado. Si no, abrí PayPal de nuevo.</p>

              <ul v-if="paypalChecks.length" class="checks">
                <li v-for="check in paypalChecks" :key="check.label" :class="{ ok: check.ok }">
                  <ion-icon :icon="check.ok ? checkmarkCircleOutline : ellipseOutline"/>{{ check.label }}
                </li>
              </ul>
              <p v-if="paypalReasons.length && !paypalChecks.every(c => c.ok)" class="study-muted">{{ paypalReasons[0] }}</p>

              <div class="actions-2">
                <button class="study-button" :disabled="connecting" @click="connect">
                  <ion-spinner v-if="connecting" name="crescent"/><ion-icon v-else :icon="logoPaypal"/>
                  {{ store.paypal_status === 'pending' ? 'Abrir PayPal de nuevo' : 'Conectar con PayPal' }}
                </button>
                <button v-if="store.paypal_status === 'pending'" class="study-button secondary-button" :disabled="refreshing" @click="refreshPayPal">
                  <ion-spinner v-if="refreshing" name="crescent"/><ion-icon v-else :icon="refreshOutline"/>Ya terminé, verificar
                </button>
              </div>
              <p class="study-muted fine"><ion-icon :icon="lockClosedOutline"/>LaU nunca ve tu contraseña de PayPal. Solo pedimos permiso para procesar pagos y reembolsos de tus ventas.</p>
            </section>
          </template>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, IonSpinner, modalController, toastController } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import {
  arrowBackOutline, storefrontOutline, addOutline, alertCircleOutline, documentAttachOutline, sendOutline,
  hourglassOutline, refreshOutline, shieldCheckmarkOutline, eyeOutline, logoPaypal, checkmarkCircleOutline,
  ellipseOutline, lockClosedOutline, checkmarkOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import StoreWizardModal from '@/components/marketplace/StoreWizardModal.vue'
import merchantService, { FieldErrors } from '@/services/merchantService'
import { CheckoutError } from '@/services/paypalCheckoutService'
import { openProductForm } from '@/utils/productForm'
import { useDarkMode } from '@/utils/useDarkMode'
import { useStudyScreen } from '@/utils/useStudyScreen'
import type { MerchantStatus } from '@/types/marketplace'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const route = useRoute()
const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const status = ref<MerchantStatus | null>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const connecting = ref(false)
const refreshing = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const documentFile = ref<File | null>(null)
const documentName = ref('')
const paypalChecks = ref<{ label: string; ok: boolean }[]>([])
const paypalReasons = ref<string[]>([])

const form = reactive({
  business_type: 'sociedad',
  legal_name: '', nit: '', nrc: '', legal_representative: '', contact_email: '', contact_phone: '',
  address: '', website: '', offer_description: '', accepts_terms: false,
})

const store = computed(() => status.value?.store ?? null)
const showForm = computed(() => !!store.value && ['none', 'rejected'].includes(store.value.verification_status))

const submittedAgo = computed(() => {
  const at = status.value?.verification?.submitted_at
  if (!at) return 'recientemente'
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86400000)
  return days <= 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`
})

const steps = computed(() => {
  const s = store.value
  const verification = s?.verification_status ?? 'none'
  return [
    { label: 'Tienda', state: s ? 'done' : 'current' },
    { label: 'Verificación LaU', state: verification === 'approved' ? 'done' : s ? 'current' : 'todo' },
    { label: 'PayPal', state: s?.accepts_paypal ? 'done' : verification === 'approved' ? 'current' : 'todo' },
    { label: 'Vendiendo', state: s?.accepts_paypal ? 'done' : 'todo' },
  ]
})

function prefill(next: MerchantStatus) {
  const v = next.verification
  if (!v) return
  Object.assign(form, {
    business_type: v.business_type, legal_name: v.legal_name, nit: v.nit, nrc: v.nrc ?? '',
    legal_representative: v.legal_representative, contact_email: v.contact_email, contact_phone: v.contact_phone,
    address: v.address, website: v.website ?? '', offer_description: v.offer_description,
  })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    status.value = await merchantService.status()
    prefill(status.value)
  } catch (e) {
    error.value = e instanceof CheckoutError ? e.message : 'No pudimos cargar tu comercio.'
  } finally {
    loading.value = false
  }
}

function pickDocument(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  documentFile.value = file
  documentName.value = file?.name ?? ''
}

async function submit() {
  submitting.value = true
  fieldErrors.value = {}
  const data = new FormData()
  Object.entries(form).forEach(([key, value]) => {
    if (key === 'accepts_terms') { if (value) data.append(key, '1') }
    else if (value !== '' && value !== null) data.append(key, String(value))
  })
  if (documentFile.value) data.append('document', documentFile.value)

  try {
    status.value = await merchantService.submit(data)
    await toast('Recibimos tu solicitud. El equipo de LaU la revisará.')
  } catch (e) {
    if (e instanceof FieldErrors) fieldErrors.value = e.fields
    await toast(e instanceof Error ? e.message : 'No pudimos enviar la solicitud.', 'warning')
  } finally {
    submitting.value = false
  }
}

async function connect() {
  connecting.value = true
  try {
    const { action_url } = await merchantService.connectPayPal()
    await load()
    // PayPal devuelve al comercio a esta misma pantalla (?paypal=retorno) al terminar.
    if (Capacitor.isNativePlatform()) await Browser.open({ url: action_url })
    else window.location.assign(action_url)
  } catch (e) {
    await toast(e instanceof Error ? e.message : 'No pudimos abrir PayPal.', 'warning')
  } finally {
    connecting.value = false
  }
}

async function refreshPayPal() {
  refreshing.value = true
  try {
    status.value = await merchantService.refreshPayPal()
    paypalChecks.value = status.value.paypal?.checks ?? []
    paypalReasons.value = status.value.paypal?.reasons ?? []
    if (status.value.store?.accepts_paypal) await toast('¡Listo! PayPal confirmó tu cuenta. Ya podés cobrar en LaU.')
  } catch (e) {
    await toast(e instanceof Error ? e.message : 'No pudimos consultar PayPal.', 'warning')
  } finally {
    refreshing.value = false
  }
}

async function createStore() {
  const modal = await modalController.create({ component: StoreWizardModal, componentProps: { store: null } })
  await modal.present()
  const { data } = await modal.onDidDismiss()
  if (data?.saved) await load()
}

async function publish() {
  await openProductForm()
}

async function toast(message: string, color?: string) {
  await (await toastController.create({ message, duration: 2600, position: 'top', color })).present()
}

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/tabs/marketplace')
}

useStudyScreen(load, ['marketplace'])

// Al volver de PayPal se consulta el estado real del comercio.
watch(() => [route.query.paypal, store.value?.paypal_status] as const, ([flag, paypalStatus]) => {
  if (flag === 'retorno' && paypalStatus === 'pending' && !refreshing.value) {
    void router.replace({ query: {} })
    void refreshPayPal()
  }
})
</script>

<style scoped>
.intro { margin-top: 8px; font-size: 14px; line-height: 21px; max-width: 58ch; }
.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; list-style: none; padding: 0; margin: 0 0 18px; }
.steps li { display: grid; justify-items: center; gap: 6px; text-align: center; font-size: 11px; font-weight: 600; color: var(--study-faint); position: relative; }
.steps li::before { content: ''; position: absolute; top: 14px; left: calc(-50% + 16px); width: calc(100% - 32px); height: 2px; background: var(--study-track); }
.steps li:first-child::before { display: none; }
.steps li.done::before, .steps li.current::before { background: var(--study-green); }
.step-dot { position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--study-track); color: var(--study-muted); font-size: 12px; font-weight: 800; }
.steps li.done { color: var(--study-green-ink); }
.steps li.done .step-dot { background: var(--study-green); color: #fff; }
.steps li.current { color: var(--study-text); }
.steps li.current .step-dot { background: var(--study-cta); color: var(--study-on-cta); }
.state-card { display: grid; justify-items: start; gap: 12px; padding: 22px; border-radius: 24px; margin-bottom: 24px; }
.state-card h2 { font-size: 20px; line-height: 26px; font-weight: 800; letter-spacing: -.02em; }
.state-card p { font-size: 14px; line-height: 21px; color: var(--study-muted); }
.state-card .study-button { width: auto; padding-inline: 22px; }
.state-card.success { border-color: var(--study-green); }
.actions-2 { display: flex; flex-wrap: wrap; gap: 10px; width: 100%; }
.actions-2 .study-button { flex: 1 1 200px; }
.actions-2 ion-spinner, .legal-form ion-spinner { width: 18px; height: 18px; color: currentColor; }
.mini-summary { display: grid; gap: 6px; margin: 0; width: 100%; font-size: 13px; }
.mini-summary div { display: flex; justify-content: space-between; gap: 12px; }
.mini-summary dt { color: var(--study-muted); }
.mini-summary dd { margin: 0; font-weight: 700; }
.checks { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; width: 100%; }
.checks li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--study-muted); }
.checks li.ok { color: var(--study-green-ink); font-weight: 600; }
.fine { display: flex; gap: 6px; align-items: flex-start; font-size: 12px !important; }
.fine ion-icon { flex-shrink: 0; margin-top: 3px; }
.legal-form { display: grid; gap: 16px; padding: 22px; border-radius: 24px; margin-bottom: 24px; }
.legal-form h2 { font-size: 19px; font-weight: 800; letter-spacing: -.02em; }
.notice { display: flex; gap: 12px; padding: 14px; border-radius: 16px; font-size: 13px; line-height: 19px; }
.notice ion-icon { flex-shrink: 0; font-size: 20px; }
.notice p { margin-top: 2px; color: var(--study-text); white-space: pre-line; }
.notice-warn { background: var(--study-orange-soft); }
.notice-warn ion-icon { color: var(--study-orange); }
.type-picker { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border: 0; padding: 0; margin: 0; }
.type-picker legend { font-size: 12px; font-weight: 600; color: var(--study-muted); margin-bottom: 6px; }
.type-picker label { display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 14px; border: 1.5px solid var(--study-border); font-size: 13px; font-weight: 600; cursor: pointer; }
.type-picker label.active { border-color: var(--study-purple); background: var(--study-purple-soft); }
.type-picker input { accent-color: var(--study-purple); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.span-2 { grid-column: 1 / -1; }
.field { display: grid; gap: 6px; font-size: 12px; font-weight: 600; color: var(--study-muted); }
.field small { font-weight: 500; }
.field input, .field textarea { width: 100%; border: 1px solid var(--study-border); border-radius: 14px; padding: 12px 14px; background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 15px; font-weight: 500; }
.field textarea { resize: vertical; line-height: 21px; }
.field input:focus, .field textarea:focus { outline: 2px solid var(--study-purple); outline-offset: 1px; }
.err { color: var(--study-orange); font-size: 12px; font-weight: 600; }
.upload { position: relative; display: flex; gap: 12px; align-items: center; padding: 16px; border-radius: 18px; border: 1.5px dashed var(--study-border); cursor: pointer; }
.upload.filled { border-style: solid; border-color: var(--study-green); }
.upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.upload ion-icon { font-size: 26px; color: var(--study-purple); flex-shrink: 0; }
.upload span { display: grid; gap: 3px; font-size: 13px; }
.upload small { color: var(--study-muted); line-height: 17px; }
.terms { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 19px; color: var(--study-muted); }
.terms input { width: 18px; height: 18px; margin-top: 1px; accent-color: var(--study-green-ink); flex-shrink: 0; }
.merchant-skeleton { display: grid; gap: 12px; }
.merchant-skeleton i { display: block; height: 72px; border-radius: 20px; background: var(--study-track); }
.merchant-skeleton i + i { height: 260px; }
@media (max-width: 520px) {
  .grid-2, .type-picker { grid-template-columns: 1fr; }
}
</style>

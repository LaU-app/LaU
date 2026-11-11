<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <main class="study-shell study-body merchant-page">
        <div class="detail-toolbar">
          <button class="study-icon-button" aria-label="Volver" @click="back"><ion-icon :icon="arrowBackOutline"/></button>
        </div>

        <header class="market-welcome">
          <h1>Tu negocio en LaU</h1>
          <p class="study-muted intro">Tres pasos separados. Avanzá solo hasta donde lo necesités.</p>
        </header>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load">Reintentar</button></p>
        <div v-if="loading && !status" class="merchant-skeleton" aria-hidden="true"><i/><i/><i/></div>

        <template v-if="status">
          <!-- 1. Tienda: cualquiera la abre (emprendimiento) -->
          <section class="level study-card" :class="{ done: !!store }">
            <div class="level-head">
              <span class="level-num">1</span>
              <div><h2>Tienda</h2><p>Nombre, logo y vitrina. Sin papeles.</p></div>
              <span v-if="store" class="level-state ok"><ion-icon :icon="checkmarkOutline"/>Lista</span>
            </div>

            <div v-if="!store" class="level-body">
              <p class="study-muted">Ideal si estás empezando: vendés con apartado y te pagan al entregar.</p>
              <button class="study-button" @click="openStore(null)"><ion-icon :icon="addOutline"/>Crear mi tienda</button>
            </div>

            <div v-else class="level-body">
              <div class="store-row">
                <span class="store-logo"><img v-if="store.logo_url" :src="store.logo_url" :alt="store.name"/><ion-icon v-else :icon="storefrontOutline"/></span>
                <div>
                  <b>{{ store.name }}</b>
                  <VerifiedBadge v-if="store.is_verified" :paypal="store.accepts_paypal"/>
                  <span v-else class="tier-chip">Emprendimiento</span>
                </div>
              </div>
              <div class="actions-2">
                <button class="study-button secondary-button" @click="router.push(`/tabs/marketplace/store/${store.slug}`)"><ion-icon :icon="eyeOutline"/>Ver tienda</button>
                <button class="study-button secondary-button" @click="publish"><ion-icon :icon="addOutline"/>Publicar</button>
              </div>
            </div>
          </section>

          <!-- 2. Negocio verificado: revisión legal del equipo de LaU -->
          <section class="level study-card" :class="{ done: verificationStatus === 'approved', locked: !store }">
            <div class="level-head">
              <span class="level-num">2</span>
              <div><h2>Negocio verificado</h2><p>Para negocios inscritos legalmente.</p></div>
              <span v-if="verificationStatus === 'approved'" class="level-state ok"><ion-icon :icon="shieldCheckmarkOutline"/>Verificado</span>
              <span v-else-if="verificationStatus === 'submitted'" class="level-state wait"><ion-icon :icon="hourglassOutline"/>En revisión</span>
              <span v-else-if="verificationStatus === 'rejected'" class="level-state warn"><ion-icon :icon="alertCircleOutline"/>Con cambios</span>
              <span v-else-if="verificationStatus === 'suspended'" class="level-state warn"><ion-icon :icon="alertCircleOutline"/>Suspendido</span>
            </div>

            <div v-if="!store" class="level-body"><p class="study-muted"><ion-icon :icon="lockClosedOutline"/> Primero creá tu tienda.</p></div>

            <!-- Sin solicitud: requisitos antes del formulario (no es para todos) -->
            <div v-else-if="verificationStatus === 'none' && !formOpen" class="level-body">
              <ul class="reqs">
                <li v-for="req in requirements" :key="req"><ion-icon :icon="documentTextOutline"/>{{ req }}</li>
              </ul>
              <p class="study-muted small">¿Todavía no tenés papeles? Seguí vendiendo como emprendimiento: no hace falta verificarte.</p>
              <button class="study-button" @click="formOpen = true"><ion-icon :icon="ribbonOutline"/>Tengo los documentos</button>
            </div>

            <!-- Formulario legal (primera vez o tras observaciones) -->
            <form v-else-if="showForm" class="level-body legal-form" novalidate @submit.prevent="submit">
              <div v-if="verificationStatus === 'rejected'" class="notice notice-warn" role="alert">
                <ion-icon :icon="alertCircleOutline"/>
                <div><b>LaU pidió cambios</b><p>{{ status.verification?.review_notes }}</p></div>
              </div>

              <fieldset class="type-picker">
                <legend>Tipo de negocio</legend>
                <label v-for="(label, value) in status.business_types" :key="value" :class="{ active: form.business_type === value }">
                  <input v-model="form.business_type" type="radio" name="business_type" :value="value"/>
                  <span>{{ label }}</span>
                </label>
              </fieldset>

              <div class="grid-2">
                <label class="field"><span>País</span>
                  <select v-model="form.country">
                    <option v-for="(label, code) in countries" :key="code" :value="code">{{ label }}</option>
                  </select></label>
                <label class="field"><span>{{ salvadoran ? 'NIT' : 'Identificador fiscal' }}</span>
                  <input v-model.trim="form.nit" :inputmode="salvadoran ? 'numeric' : 'text'" :placeholder="salvadoran ? '0614-010190-101-3' : 'Como aparece en tu registro'"/>
                  <small v-if="fieldErrors.nit" class="err">{{ fieldErrors.nit }}</small></label>
                <label class="field span-2"><span>Razón social o nombre del titular</span>
                  <input v-model.trim="form.legal_name" autocomplete="organization" placeholder="Librería Cuscatlán, S.A. de C.V."/>
                  <small v-if="fieldErrors.legal_name" class="err">{{ fieldErrors.legal_name }}</small></label>
                <label v-if="salvadoran" class="field"><span>NRC (registro de IVA)</span>
                  <input v-model.trim="form.nrc" inputmode="numeric" placeholder="123456-7"/>
                  <small v-if="fieldErrors.nrc" class="err">{{ fieldErrors.nrc }}</small></label>
                <label class="field" :class="{ 'span-2': !salvadoran }"><span>Representante legal</span>
                  <input v-model.trim="form.legal_representative" autocomplete="name"/>
                  <small v-if="fieldErrors.legal_representative" class="err">{{ fieldErrors.legal_representative }}</small></label>
                <label class="field"><span>Correo</span>
                  <input v-model.trim="form.contact_email" type="email" autocomplete="email"/>
                  <small v-if="fieldErrors.contact_email" class="err">{{ fieldErrors.contact_email }}</small></label>
                <label class="field"><span>Teléfono</span>
                  <input v-model.trim="form.contact_phone" type="tel" autocomplete="tel" placeholder="+503 2222-3333"/>
                  <small v-if="fieldErrors.contact_phone" class="err">{{ fieldErrors.contact_phone }}</small></label>
                <label class="field span-2"><span>Dirección</span>
                  <input v-model.trim="form.address" autocomplete="street-address"/>
                  <small v-if="fieldErrors.address" class="err">{{ fieldErrors.address }}</small></label>
                <label class="field span-2"><span>Sitio web o red social <small>(opcional)</small></span>
                  <input v-model.trim="form.website" type="url" placeholder="https://"/>
                  <small v-if="fieldErrors.website" class="err">{{ fieldErrors.website }}</small></label>
                <label class="field span-2"><span>¿Qué vas a vender a estudiantes?</span>
                  <textarea v-model.trim="form.offer_description" rows="3" maxlength="1500" placeholder="Calculadoras, cuadernos, material de laboratorio…"/>
                  <small v-if="fieldErrors.offer_description" class="err">{{ fieldErrors.offer_description }}</small></label>
              </div>

              <div class="docs">
                <span class="docs-title">Documentos <small>PDF o foto · máx. 5 MB · solo los ve el equipo de LaU</small></span>
                <label v-for="doc in documentSlots" :key="doc.kind" class="upload" :class="{ filled: files[doc.kind] || doc.sent }">
                  <input type="file" accept="application/pdf,image/png,image/jpeg" @change="pickDocument(doc.kind, $event)"/>
                  <ion-icon :icon="files[doc.kind] || doc.sent ? checkmarkCircleOutline : documentAttachOutline"/>
                  <span>
                    <b>{{ doc.label }}</b>
                    <small>{{ files[doc.kind]?.name || (doc.sent ? `Enviado: ${doc.name || 'archivo'}` : doc.hint) }}</small>
                  </span>
                  <small v-if="fieldErrors[doc.kind]" class="err">{{ fieldErrors[doc.kind] }}</small>
                </label>
              </div>

              <label class="opt-in" :class="{ checked: form.request_paypal }">
                <input v-model="form.request_paypal" type="checkbox"/>
                <ion-icon :icon="logoPaypal"/>
                <span><b>También quiero cobrar con PayPal</b><small>Opcional. Lo revisamos aparte y lo podés pedir después.</small></span>
              </label>

              <label class="terms">
                <input v-model="form.accepts_terms" type="checkbox"/>
                <span>Declaro que los datos son verdaderos y acepto que LaU los verifique. LaU puede suspender el distintivo ante reclamos o datos falsos.</span>
              </label>
              <small v-if="fieldErrors.accepts_terms" class="err">{{ fieldErrors.accepts_terms }}</small>

              <div class="actions-2">
                <button class="study-button" type="submit" :disabled="submitting">
                  <ion-spinner v-if="submitting" name="crescent"/><ion-icon v-else :icon="sendOutline"/>
                  {{ submitting ? 'Enviando…' : 'Enviar a revisión' }}
                </button>
                <button v-if="verificationStatus === 'none'" class="study-link" type="button" @click="formOpen = false">Ahora no</button>
              </div>
            </form>

            <div v-else-if="verificationStatus === 'submitted'" class="level-body">
              <p class="study-muted">Enviaste tu solicitud {{ submittedAgo }}. Te avisamos aquí y por correo.</p>
              <dl class="mini-summary">
                <div><dt>Razón social</dt><dd>{{ status.verification?.legal_name }}</dd></div>
                <div><dt>Documentos</dt><dd>{{ sentDocuments }} de 3</dd></div>
              </dl>
              <button class="study-link" @click="load"><ion-icon :icon="refreshOutline"/>Actualizar</button>
            </div>

            <div v-else-if="verificationStatus === 'suspended'" class="level-body">
              <p class="study-muted">{{ status.verification?.review_notes || 'Escribinos para revisar tu caso.' }}</p>
            </div>

            <div v-else-if="verificationStatus === 'approved'" class="level-body">
              <p class="study-muted">Tu tienda muestra el distintivo de LaU{{ status.verification?.country_label && status.verification.country !== 'SV' ? ` · ${status.verification.country_label}` : '' }}.</p>
            </div>
          </section>

          <!-- 3. Pagos en línea: aparte y opcional -->
          <section class="level study-card" :class="{ done: store?.accepts_paypal, locked: !canUseGateways }">
            <div class="level-head">
              <span class="level-num">3</span>
              <div><h2>Pagos en línea</h2><p>Opcional. Sin esto, los estudiantes apartan y pagan al recibir.</p></div>
              <span v-if="store?.accepts_paypal" class="level-state ok"><ion-icon :icon="logoPaypal"/>Activo</span>
            </div>

            <div v-if="!canUseGateways" class="level-body">
              <p class="study-muted"><ion-icon :icon="lockClosedOutline"/> Disponible para negocios verificados.</p>
            </div>

            <div v-else class="level-body gateways">
              <!-- PayPal -->
              <article class="gateway" :class="paypalState">
                <span class="gw-logo paypal"><ion-icon :icon="logoPaypal"/></span>
                <div class="gw-info">
                  <b>PayPal</b>
                  <small>{{ paypalCopy }}</small>
                </div>
                <span v-if="paypalState === 'live'" class="level-state ok">Cobrando</span>
                <span v-else-if="paypalState === 'review'" class="level-state wait">En revisión</span>
              </article>

              <div v-if="paypalRequest?.status === 'rejected' && paypalRequest.review_notes" class="notice notice-warn">
                <ion-icon :icon="alertCircleOutline"/><div><b>No se aprobó</b><p>{{ paypalRequest.review_notes }}</p></div>
              </div>

              <ul v-if="paypalChecks.length && paypalState !== 'live'" class="checks">
                <li v-for="check in paypalChecks" :key="check.label" :class="{ ok: check.ok }">
                  <ion-icon :icon="check.ok ? checkmarkCircleOutline : ellipseOutline"/>{{ check.label }}
                </li>
              </ul>
              <p v-if="paypalReasons.length && !paypalChecks.every(c => c.ok)" class="study-muted small">{{ paypalReasons[0] }}</p>

              <div class="actions-2">
                <button v-if="paypalState === 'none' || paypalState === 'rejected'" class="study-button" :disabled="requesting" @click="requestPayPal">
                  <ion-spinner v-if="requesting" name="crescent"/><ion-icon v-else :icon="logoPaypal"/>{{ paypalState === 'rejected' ? 'Volver a pedir' : 'Pedir PayPal' }}
                </button>
                <template v-else-if="paypalState === 'connect' || paypalState === 'pending'">
                  <button class="study-button" :disabled="connecting" @click="connect">
                    <ion-spinner v-if="connecting" name="crescent"/><ion-icon v-else :icon="logoPaypal"/>
                    {{ paypalState === 'pending' ? 'Abrir PayPal de nuevo' : 'Conectar con PayPal' }}
                  </button>
                  <button v-if="paypalState === 'pending'" class="study-button secondary-button" :disabled="refreshing" @click="refreshPayPal">
                    <ion-spinner v-if="refreshing" name="crescent"/><ion-icon v-else :icon="refreshOutline"/>Ya terminé
                  </button>
                </template>
              </div>
              <p v-if="paypalState === 'connect' || paypalState === 'pending'" class="study-muted fine"><ion-icon :icon="lockClosedOutline"/>LaU nunca ve tu contraseña de PayPal.</p>

              <!-- Tu pasarela: próximamente -->
              <article class="gateway soon">
                <span class="gw-logo"><ion-icon :icon="cardOutline"/></span>
                <div class="gw-info">
                  <b>Tu pasarela de siempre</b>
                  <small>Próximamente. Contanos cuál usás y la priorizamos.</small>
                </div>
                <button v-if="!otherOpen" class="study-link" @click="otherOpen = true">Contar</button>
              </article>
              <form v-if="otherOpen" class="other-form" @submit.prevent="requestOther">
                <input v-model.trim="other.name" maxlength="80" placeholder="Nombre de la pasarela" aria-label="Nombre de la pasarela"/>
                <input v-model.trim="other.note" maxlength="600" placeholder="Comentario (opcional)" aria-label="Comentario"/>
                <small v-if="fieldErrors.gateway_name" class="err">{{ fieldErrors.gateway_name }}</small>
                <button class="study-button secondary-button" type="submit" :disabled="requesting || other.name.length < 2">Enviar</button>
              </form>
              <ul v-if="otherRequests.length" class="other-list">
                <li v-for="g in otherRequests" :key="g.id"><ion-icon :icon="cardOutline"/>{{ g.label }}<span>{{ g.status === 'requested' ? 'Anotada' : g.status_label }}</span></li>
              </ul>
            </div>
          </section>
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
  ellipseOutline, lockClosedOutline, checkmarkOutline, documentTextOutline, ribbonOutline, cardOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import StoreWizardModal from '@/components/marketplace/StoreWizardModal.vue'
import merchantService, { FieldErrors } from '@/services/merchantService'
import { CheckoutError } from '@/services/paypalCheckoutService'
import { openProductForm } from '@/utils/productForm'
import { useDarkMode } from '@/utils/useDarkMode'
import { useStudyScreen } from '@/utils/useStudyScreen'
import type { MerchantStatus, VerificationDocumentKind } from '@/types/marketplace'
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
const requesting = ref(false)
const formOpen = ref(false)
const otherOpen = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const files = reactive<Partial<Record<VerificationDocumentKind, File>>>({})
const paypalChecks = ref<{ label: string; ok: boolean }[]>([])
const paypalReasons = ref<string[]>([])
const other = reactive({ name: '', note: '' })

const form = reactive({
  business_type: 'sociedad', country: 'SV',
  legal_name: '', nit: '', nrc: '', legal_representative: '', contact_email: '', contact_phone: '',
  address: '', website: '', offer_description: '', request_paypal: false, accepts_terms: false,
})

const requirements = [
  'NIT y NRC (o el registro fiscal de tu país)',
  'Matrícula de comercio, escritura o licencia municipal',
  'DUI o pasaporte del representante legal',
]

const HINTS: Record<VerificationDocumentKind, string> = {
  document: 'Tarjeta de NIT / NRC o constancia de IVA',
  registration_document: 'Matrícula (CNR), escritura de constitución o licencia',
  id_document: 'DUI o pasaporte, ambos lados',
}

const store = computed(() => status.value?.store ?? null)
const verificationStatus = computed(() => store.value?.verification_status ?? 'none')
const showForm = computed(() => !!store.value && (verificationStatus.value === 'rejected' || (verificationStatus.value === 'none' && formOpen.value)))
const salvadoran = computed(() => form.country === 'SV')
const countries = computed(() => status.value?.countries ?? { SV: 'El Salvador' })
const canUseGateways = computed(() => ['submitted', 'approved'].includes(verificationStatus.value))

const documentSlots = computed(() => {
  const sent = status.value?.verification?.documents ?? []
  const kinds = status.value?.documents ?? (Object.keys(HINTS) as VerificationDocumentKind[]).map(kind => ({ kind, label: kind }))
  return kinds.map(({ kind, label }) => {
    const doc = sent.find(entry => entry.kind === kind)
    return { kind, label, hint: HINTS[kind], sent: !!doc?.sent, name: doc?.name ?? null }
  })
})
const sentDocuments = computed(() => (status.value?.verification?.documents ?? []).filter(doc => doc.sent).length)

const paypalRequest = computed(() => status.value?.gateways?.find(g => g.gateway === 'paypal') ?? null)
const otherRequests = computed(() => status.value?.gateways?.filter(g => g.gateway === 'otra') ?? [])

/** Estado de PayPal para el negocio: pedir → revisión de LaU → conectar → cobrando. */
const paypalState = computed(() => {
  const s = store.value
  if (s?.accepts_paypal) return 'live'
  const request = paypalRequest.value
  if (!request) return 'none'
  if (request.status === 'rejected') return 'rejected'
  if (request.status === 'requested' || verificationStatus.value !== 'approved') return 'review'
  return s?.paypal_status === 'pending' ? 'pending' : 'connect'
})

const paypalCopy = computed(() => ({
  live: 'Los estudiantes pagan en línea y el dinero llega a tu cuenta.',
  none: 'Cobrá en línea. El equipo de LaU lo aprueba aparte.',
  rejected: 'Revisá las observaciones y volvé a pedirlo.',
  review: verificationStatus.value === 'approved' ? 'LaU está revisando tu pedido.' : 'Lo revisamos cuando aprobemos tu verificación.',
  connect: '¡Aprobado! Conectá tu cuenta PayPal Business.',
  pending: 'Si ya terminaste en PayPal, tocá "Ya terminé".',
}[paypalState.value]))

const submittedAgo = computed(() => {
  const at = status.value?.verification?.submitted_at
  if (!at) return 'recientemente'
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86400000)
  return days <= 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`
})

function prefill(next: MerchantStatus) {
  const v = next.verification
  if (!v) return
  Object.assign(form, {
    business_type: v.business_type, country: v.country || 'SV', legal_name: v.legal_name, nit: v.nit, nrc: v.nrc ?? '',
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
    error.value = e instanceof CheckoutError ? e.message : 'No pudimos cargar tu negocio.'
  } finally {
    loading.value = false
  }
}

function pickDocument(kind: VerificationDocumentKind, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) files[kind] = file
  else delete files[kind]
}

async function submit() {
  submitting.value = true
  fieldErrors.value = {}
  const data = new FormData()
  Object.entries(form).forEach(([key, value]) => {
    if (key === 'accepts_terms' || key === 'request_paypal') { if (value) data.append(key, '1') }
    else if (key === 'nrc' && !salvadoran.value) return
    else if (value !== '' && value !== null) data.append(key, String(value))
  })
  Object.entries(files).forEach(([kind, file]) => { if (file) data.append(kind, file) })

  try {
    status.value = await merchantService.submit(data)
    formOpen.value = false
    Object.keys(files).forEach(kind => delete files[kind as VerificationDocumentKind])
    await toast('Recibimos tu solicitud. El equipo de LaU la revisará.')
  } catch (e) {
    if (e instanceof FieldErrors) fieldErrors.value = e.fields
    await toast(e instanceof Error ? e.message : 'No pudimos enviar la solicitud.', 'warning')
  } finally {
    submitting.value = false
  }
}

async function requestPayPal() {
  requesting.value = true
  try {
    status.value = await merchantService.requestGateway({ gateway: 'paypal' })
    await toast('Pediste cobrar con PayPal. Te avisamos cuando lo aprobemos.')
  } catch (e) {
    await toast(e instanceof Error ? e.message : 'No pudimos enviar tu pedido.', 'warning')
  } finally {
    requesting.value = false
  }
}

async function requestOther() {
  requesting.value = true
  fieldErrors.value = {}
  try {
    status.value = await merchantService.requestGateway({ gateway: 'otra', gateway_name: other.name, note: other.note || undefined })
    other.name = ''
    other.note = ''
    otherOpen.value = false
    await toast('Gracias. La anotamos para integrarla.')
  } catch (e) {
    if (e instanceof FieldErrors) fieldErrors.value = e.fields
    await toast(e instanceof Error ? e.message : 'No pudimos enviar tu pedido.', 'warning')
  } finally {
    requesting.value = false
  }
}

async function connect() {
  connecting.value = true
  try {
    const { action_url } = await merchantService.connectPayPal()
    await load()
    // PayPal devuelve al negocio a esta misma pantalla (?paypal=retorno) al terminar.
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

async function openStore(current: null) {
  const modal = await modalController.create({ component: StoreWizardModal, componentProps: { store: current } })
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

// Al volver de PayPal se consulta el estado real del negocio.
watch(() => [route.query.paypal, store.value?.paypal_status] as const, ([flag, paypalStatus]) => {
  if (flag === 'retorno' && paypalStatus === 'pending' && !refreshing.value) {
    void router.replace({ query: {} })
    void refreshPayPal()
  }
})
</script>

<style scoped>
.intro { margin-top: 6px; font-size: 14px; line-height: 21px; }
.level { position: relative; display: grid; gap: 14px; padding: 20px; border-radius: 24px; margin-bottom: 14px; transition: border-color .2s ease; }
.level.done { border-color: color-mix(in srgb, var(--study-green) 55%, var(--study-border)); }
.level.locked { opacity: .62; }
.level-head { display: flex; align-items: center; gap: 12px; }
.level-head > div { flex: 1; min-width: 0; }
.level-head h2 { font-size: 18px; line-height: 23px; font-weight: 800; letter-spacing: -.02em; }
.level-head p { font-size: 13px; line-height: 18px; color: var(--study-muted); }
.level-num { width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; font-weight: 800; font-size: 15px; background: var(--study-track); color: var(--study-muted); }
.level.done .level-num { background: var(--study-green); color: #fff; }
.level-state { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
.level-state.ok { background: var(--study-green-soft); color: var(--study-green-ink); }
.level-state.wait { background: var(--study-orange-soft); color: var(--study-orange); }
.level-state.warn { background: var(--study-orange-soft); color: var(--study-orange); }
.level-body { display: grid; gap: 12px; }
.level-body .study-button { width: auto; padding-inline: 22px; justify-self: start; }
.level-body p ion-icon { vertical-align: -2px; }
.small { font-size: 12px; line-height: 17px; }
.store-row { display: flex; align-items: center; gap: 12px; }
.store-row > div { display: grid; gap: 4px; justify-items: start; min-width: 0; }
.store-logo { width: 52px; height: 52px; border-radius: 16px; overflow: hidden; display: grid; place-items: center; flex-shrink: 0; background: var(--study-purple-soft); color: var(--study-purple); font-size: 22px; }
.store-logo img { width: 100%; height: 100%; object-fit: cover; }
.tier-chip { padding: 3px 9px; border-radius: 999px; background: var(--study-track); color: var(--study-muted); font-size: 11px; font-weight: 700; }
.reqs { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.reqs li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 20px; }
.reqs ion-icon { color: var(--study-purple); font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.actions-2 { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; width: 100%; }
.actions-2 .study-button { flex: 1 1 120px; }
.level-body ion-spinner { width: 18px; height: 18px; color: currentColor; }
.mini-summary { display: grid; gap: 6px; margin: 0; font-size: 13px; }
.mini-summary div { display: flex; justify-content: space-between; gap: 12px; }
.mini-summary dt { color: var(--study-muted); }
.mini-summary dd { margin: 0; font-weight: 700; }
.legal-form { gap: 16px; }
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
.field input, .field textarea, .field select, .other-form input { width: 100%; border: 1px solid var(--study-border); border-radius: 14px; padding: 12px 14px; background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 15px; font-weight: 500; }
.field textarea { resize: vertical; line-height: 21px; }
.field input:focus, .field textarea:focus, .field select:focus, .other-form input:focus { outline: 2px solid var(--study-purple); outline-offset: 1px; }
.err { color: var(--study-orange); font-size: 12px; font-weight: 600; }
.docs { display: grid; gap: 8px; }
.docs-title { font-size: 12px; font-weight: 700; color: var(--study-muted); }
.docs-title small { font-weight: 500; }
.upload { position: relative; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 14px; border-radius: 16px; border: 1.5px dashed var(--study-border); cursor: pointer; }
.upload.filled { border-style: solid; border-color: var(--study-green); }
.upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.upload > ion-icon { font-size: 24px; color: var(--study-purple); flex-shrink: 0; }
.upload.filled > ion-icon { color: var(--study-green-ink); }
.upload span { display: grid; gap: 2px; font-size: 13px; flex: 1; min-width: 0; }
.upload span small { color: var(--study-muted); line-height: 17px; overflow-wrap: anywhere; }
.opt-in { display: flex; gap: 12px; align-items: center; padding: 14px; border-radius: 16px; border: 1.5px solid var(--study-border); cursor: pointer; }
.opt-in.checked { border-color: #0070ba; background: color-mix(in srgb, #0070ba 8%, transparent); }
.opt-in input { width: 18px; height: 18px; accent-color: #0070ba; flex-shrink: 0; }
.opt-in > ion-icon { font-size: 22px; color: #0070ba; flex-shrink: 0; }
.opt-in span { display: grid; gap: 2px; font-size: 13px; }
.opt-in small { color: var(--study-muted); }
.terms { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 19px; color: var(--study-muted); }
.terms input { width: 18px; height: 18px; margin-top: 1px; accent-color: var(--study-green-ink); flex-shrink: 0; }
.gateways { gap: 10px; }
.gateway { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 18px; background: var(--study-bg); }
.gateway.live { background: var(--study-green-soft); }
.gateway.soon { border: 1.5px dashed var(--study-border); background: transparent; }
.gw-logo { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0; font-size: 22px; background: var(--study-track); color: var(--study-muted); }
.gw-logo.paypal { background: #ffc439; color: #003087; }
.gw-info { flex: 1; min-width: 0; display: grid; gap: 2px; }
.gw-info b { font-size: 15px; }
.gw-info small { font-size: 12px; line-height: 17px; color: var(--study-muted); }
.other-form { display: grid; gap: 8px; }
.other-form .study-button { width: auto; justify-self: start; padding-inline: 20px; }
.other-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.other-list li { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.other-list span { margin-left: auto; font-size: 11px; color: var(--study-muted); font-weight: 600; }
.checks { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.checks li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--study-muted); }
.checks li.ok { color: var(--study-green-ink); font-weight: 600; }
.fine { display: flex; gap: 6px; align-items: flex-start; font-size: 12px; }
.fine ion-icon { flex-shrink: 0; margin-top: 2px; }
.merchant-skeleton { display: grid; gap: 12px; }
.merchant-skeleton i { display: block; height: 120px; border-radius: 24px; background: var(--study-track); }
@media (max-width: 520px) {
  .grid-2, .type-picker { grid-template-columns: 1fr; }
}
</style>

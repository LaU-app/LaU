<template>
  <ion-page class="study-ui market-ui admin-page">
    <ion-header class="ion-no-border admin-header">
      <ion-toolbar>
        <div class="admin-bar">
          <img src="/LaU.png" alt="" class="admin-brand"/>
          <div class="admin-title">
            <b>Panel de LaU</b>
            <span>Comercios verificados</span>
          </div>
          <div class="admin-session">
            <span v-if="admin" class="admin-name" :title="admin.email">{{ admin.name }}</span>
            <button type="button" class="admin-logout" :disabled="loggingOut" aria-label="Cerrar sesión" @click="logout">
              <ion-icon :icon="logOutOutline" aria-hidden="true"/><span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content/></ion-refresher>
      <main class="study-shell admin-shell">
        <div class="detail-back">
          <button type="button" class="back-link" @click="back"><ion-icon :icon="arrowBackOutline" aria-hidden="true"/>Comercios</button>
        </div>

        <p v-if="error" class="study-error" role="alert">
          {{ error }}
          <button v-if="!notFound" class="study-link" @click="load">Reintentar</button>
        </p>

        <div v-if="loading && !merchant" class="detail-skeleton" aria-hidden="true"><i/><i/><i/></div>

        <template v-if="merchant">
          <header class="store-hero study-card merchant-hero">
            <span class="store-logo">
              <img v-if="merchant.store?.logo_url && !logoFailed" :src="merchant.store.logo_url" alt="" @error="logoFailed = true"/>
              <b v-else>{{ initials(merchant.store?.name || merchant.legal_name) }}</b>
            </span>
            <div>
              <h1>{{ merchant.store?.name || merchant.legal_name }}</h1>
              <p>{{ merchant.legal_name }} · NIT {{ merchant.nit }}</p>
              <div class="hero-badges">
                <span class="admin-status" :class="`is-${merchant.status}`">{{ merchant.status_label || STATUS_LABELS[merchant.status] }}</span>
                <span v-if="merchant.store?.paypal_status === 'enabled'" class="paypal-badge is-enabled"><ion-icon :icon="logoPaypal" aria-hidden="true"/>PayPal activo</span>
                <span v-else-if="merchant.store?.paypal_status === 'pending'" class="paypal-badge is-pending"><ion-icon :icon="logoPaypal" aria-hidden="true"/>PayPal pendiente</span>
              </div>
              <small class="hero-date"><ion-icon :icon="calendarOutline" aria-hidden="true"/>Enviada el {{ formatDate(merchant.submitted_at) }}</small>
            </div>
          </header>

          <div class="detail-grid">
            <div class="detail-main">
              <section class="info-card study-card" aria-labelledby="sec-legal">
                <header class="info-head"><span class="study-symbol"><ion-icon :icon="businessOutline"/></span><h2 id="sec-legal">Datos legales</h2></header>
                <dl class="info-list">
                  <div><dt>Razón social</dt><dd>{{ merchant.legal_name }}</dd></div>
                  <div><dt>Tipo</dt><dd>{{ merchant.business_type_label || merchant.business_type }}</dd></div>
                  <div><dt>NIT</dt><dd>{{ merchant.nit }}</dd></div>
                  <div><dt>NRC</dt><dd>{{ merchant.nrc || '—' }}</dd></div>
                  <div><dt>Representante</dt><dd>{{ merchant.legal_representative }}</dd></div>
                </dl>
              </section>

              <section class="info-card study-card" aria-labelledby="sec-contact">
                <header class="info-head"><span class="study-symbol"><ion-icon :icon="callOutline"/></span><h2 id="sec-contact">Contacto</h2></header>
                <dl class="info-list">
                  <div><dt>Correo</dt><dd><a :href="`mailto:${merchant.contact_email}`">{{ merchant.contact_email }}</a></dd></div>
                  <div><dt>Teléfono</dt><dd><a :href="`tel:${phoneHref}`">{{ merchant.contact_phone }}</a></dd></div>
                  <div><dt>Dirección</dt><dd>{{ merchant.address }}</dd></div>
                  <div>
                    <dt>Sitio web</dt>
                    <dd>
                      <a v-if="website" :href="website.href" target="_blank" rel="noopener noreferrer">{{ website.label }}<ion-icon :icon="openOutline" aria-hidden="true"/></a>
                      <template v-else>—</template>
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="info-card study-card" aria-labelledby="sec-offer">
                <header class="info-head"><span class="study-symbol"><ion-icon :icon="pricetagsOutline"/></span><h2 id="sec-offer">Qué vende</h2></header>
                <p class="long-text">{{ merchant.offer_description || 'Sin descripción.' }}</p>
              </section>

              <section class="info-card study-card" aria-labelledby="sec-store">
                <header class="info-head"><span class="study-symbol"><ion-icon :icon="storefrontOutline"/></span><h2 id="sec-store">Tienda</h2></header>
                <dl v-if="storeDetail" class="info-list">
                  <div><dt>Nombre</dt><dd>{{ merchant.store?.name || '—' }}</dd></div>
                  <div><dt>Categoría</dt><dd>{{ storeDetail.category || 'Sin categoría' }}</dd></div>
                  <div>
                    <dt>Dueño</dt>
                    <dd>
                      {{ merchant.store?.owner?.name || '—' }}
                      <small v-if="merchant.store?.owner?.username">@{{ merchant.store.owner.username }}</small>
                      <a v-if="storeDetail.owner_email" class="block-link" :href="`mailto:${storeDetail.owner_email}`">{{ storeDetail.owner_email }}</a>
                    </dd>
                  </div>
                  <div><dt>Productos activos</dt><dd>{{ storeDetail.active_products }}</dd></div>
                  <div><dt>Pedidos pagados</dt><dd>{{ storeDetail.paid_orders }} · {{ money(storeDetail.paid_total) }}</dd></div>
                  <div>
                    <dt>PayPal</dt>
                    <dd class="flags">
                      <span class="flag" :class="{ ok: storeDetail.paypal_connected }"><ion-icon :icon="storeDetail.paypal_connected ? checkmarkCircleOutline : ellipseOutline" aria-hidden="true"/>{{ storeDetail.paypal_connected ? 'Conectado' : 'Sin conectar' }}</span>
                      <span class="flag" :class="{ ok: storeDetail.accepts_paypal }"><ion-icon :icon="storeDetail.accepts_paypal ? checkmarkCircleOutline : ellipseOutline" aria-hidden="true"/>{{ storeDetail.accepts_paypal ? 'Acepta pagos' : 'No acepta pagos' }}</span>
                    </dd>
                  </div>
                  <div><dt>Última consulta</dt><dd>{{ storeDetail.paypal_checked_at ? formatDateTime(storeDetail.paypal_checked_at) : 'Nunca' }}</dd></div>
                </dl>
                <p v-else class="study-muted">Este comercio ya no tiene tienda.</p>
              </section>

              <section class="info-card study-card" aria-labelledby="sec-doc">
                <header class="info-head"><span class="study-symbol"><ion-icon :icon="documentTextOutline"/></span><h2 id="sec-doc">Documento legal</h2></header>
                <button v-if="merchant.has_document" type="button" class="doc-button" :disabled="busy !== null" @click="openDocument">
                  <span class="study-symbol tone-blue"><ion-icon :icon="documentAttachOutline"/></span>
                  <span><b>Ver documento</b><small>{{ merchant.document_name || 'Archivo adjunto' }}</small></span>
                  <ion-spinner v-if="busy === 'document'" name="crescent"/>
                  <ion-icon v-else :icon="openOutline" aria-hidden="true"/>
                </button>
                <p v-else class="study-muted">El comercio no adjuntó documento.</p>
              </section>

              <section v-if="hasReview" class="info-card study-card" aria-labelledby="sec-review">
                <header class="info-head"><span class="study-symbol"><ion-icon :icon="clipboardOutline"/></span><h2 id="sec-review">Revisión</h2></header>
                <dl class="info-list">
                  <div v-if="merchant.reviewed_by"><dt>Revisó</dt><dd>{{ merchant.reviewed_by }}</dd></div>
                  <div v-if="merchant.reviewed_at"><dt>Fecha</dt><dd>{{ formatDateTime(merchant.reviewed_at) }}</dd></div>
                </dl>
                <p v-if="merchant.review_notes" class="long-text review-notes">{{ merchant.review_notes }}</p>
              </section>
            </div>

            <aside class="action-card study-card" aria-labelledby="sec-actions">
              <div>
                <h2 id="sec-actions">Decisión</h2>
                <p class="study-muted">{{ statusHint }}</p>
              </div>

              <label class="field">
                <span>Notas para el comercio</span>
                <textarea
                  ref="notesInput"
                  v-model="notes"
                  rows="4"
                  maxlength="1000"
                  placeholder="Qué debe corregir o por qué se suspende…"
                  :aria-invalid="!!notesError"
                  :disabled="busy !== null"
                  @input="notesError = ''"
                />
                <small v-if="notesError" class="err" role="alert">{{ notesError }}</small>
                <small v-else class="hint">Opcionales al aprobar. Obligatorias para pedir cambios o suspender.</small>
              </label>

              <div class="action-buttons">
                <button v-if="merchant.status !== 'approved'" type="button" class="study-button approve-button" :disabled="busy !== null" @click="approve">
                  <ion-spinner v-if="busy === 'approve'" name="crescent"/><ion-icon v-else :icon="checkmarkCircleOutline"/>Aprobar
                </button>
                <button v-if="merchant.status === 'submitted'" type="button" class="study-button secondary-button changes-button" :disabled="busy !== null" @click="reject">
                  <ion-spinner v-if="busy === 'reject'" name="crescent"/><ion-icon v-else :icon="createOutline"/>Pedir cambios
                </button>
                <button v-if="merchant.status === 'approved'" type="button" class="study-button danger-button" :disabled="busy !== null" @click="suspend">
                  <ion-spinner v-if="busy === 'suspend'" name="crescent"/><ion-icon v-else :icon="banOutline"/>Suspender
                </button>
                <button v-if="storeDetail?.paypal_connected" type="button" class="study-button secondary-button paypal-button" :disabled="busy !== null" @click="refreshPayPal">
                  <ion-spinner v-if="busy === 'paypal'" name="crescent"/><ion-icon v-else :icon="logoPaypal"/>Consultar PayPal
                </button>
              </div>
            </aside>
          </div>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
  alertController, toastController, onIonViewWillEnter, useIonRouter,
} from '@ionic/vue'
import {
  logOutOutline, arrowBackOutline, logoPaypal, calendarOutline, businessOutline, callOutline, openOutline,
  pricetagsOutline, storefrontOutline, documentTextOutline, documentAttachOutline, clipboardOutline,
  checkmarkCircleOutline, ellipseOutline, createOutline, banOutline,
} from 'ionicons/icons'
import {
  AdminService, adminErrorMessage, type ActionResult, type MerchantDetail, type VerificationStatus,
} from '@/services/adminService'
import '@/theme/study.css'
import '@/theme/marketplace.css'

type Busy = 'approve' | 'reject' | 'suspend' | 'paypal' | 'document'

const STATUS_LABELS: Record<VerificationStatus, string> = {
  submitted: 'En revisión', approved: 'Aprobada', rejected: 'Requiere cambios', suspended: 'Suspendida',
}

const route = useRoute()
const router = useRouter()
const ionRouter = useIonRouter()
// Ionic crea una instancia de la página por cada id, así que basta leerlo una vez.
const id = Number(route.params.id)

const admin = ref(AdminService.admin())
const loggingOut = ref(false)
const merchant = ref<MerchantDetail | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const busy = ref<Busy | null>(null)
const notes = ref('')
const notesError = ref('')
const notesInput = ref<HTMLTextAreaElement | null>(null)
const logoFailed = ref(false)

const storeDetail = computed(() => merchant.value?.store_detail ?? null)
const hasReview = computed(() => !!(merchant.value?.reviewed_at || merchant.value?.reviewed_by || merchant.value?.review_notes))
const phoneHref = computed(() => (merchant.value?.contact_phone ?? '').replace(/[^\d+]/g, ''))

// Solo enlaces http(s): si no trae protocolo se asume https.
const website = computed(() => {
  const raw = merchant.value?.website?.trim()
  if (!raw) return null
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return { href, label: raw.replace(/^https?:\/\//i, '').replace(/\/$/, '') }
})

const statusHint = computed(() => {
  const m = merchant.value
  if (!m) return ''
  switch (m.status) {
    case 'submitted': return 'Revisá los datos y el documento antes de decidir.'
    case 'rejected': return 'Pediste cambios. Esperá a que el comercio corrija su solicitud.'
    case 'suspended': return 'Suspendido: no puede recibir pagos.'
    default: return storeDetail.value?.accepts_paypal ? 'Aprobado y cobrando con PayPal.' : 'Aprobado. Falta que conecte PayPal.'
  }
})

const initials = (name?: string | null) =>
  (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('') || 'LaU'

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' }) : 'sin fecha'

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('es-SV', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

const money = (value: string | number) => `$${Number(value || 0).toFixed(2)}`

const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status

function toLogin() {
  void router.replace({ path: '/equipo/login', query: { next: route.fullPath } })
}

async function load() {
  if (!Number.isInteger(id) || id <= 0) {
    loading.value = false
    notFound.value = true
    error.value = 'No encontramos esta solicitud.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    merchant.value = await AdminService.merchant(id)
    notFound.value = false
  } catch (e) {
    const status = statusOf(e)
    if (status === 401) return toLogin()
    notFound.value = status === 404
    error.value = notFound.value ? 'No encontramos esta solicitud.' : adminErrorMessage(e, 'No pudimos cargar el comercio.')
  } finally {
    loading.value = false
  }
}

async function refresh(event: CustomEvent) {
  await load()
  await (event.target as HTMLIonRefresherElement).complete()
}

async function toast(message: string, color: 'success' | 'warning' | 'danger') {
  const t = await toastController.create({ message, color, position: 'top', duration: color === 'success' ? 2800 : 5000 })
  await t.present()
}

async function confirmAction(header: string, message: string, text: string): Promise<boolean> {
  const alert = await alertController.create({
    header,
    message,
    buttons: [{ text: 'Cancelar', role: 'cancel' }, { text, role: 'confirm' }],
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  return role === 'confirm'
}

// Pedir cambios y suspender exigen notas (mín. 10 caracteres); el backend valida lo mismo.
function requiredNotes(message: string): string | null {
  const value = notes.value.trim()
  if (value.length >= 10) return value
  notesError.value = message
  notesInput.value?.focus()
  return null
}

async function run(action: Exclude<Busy, 'document'>, call: () => Promise<ActionResult>) {
  busy.value = action
  try {
    const result = await call()
    if (result.data) merchant.value = result.data
    if (action !== 'paypal') { notes.value = ''; notesError.value = '' }
    const warn = (action === 'approve' && result.emailed === false)
      || (action === 'paypal' && result.data?.store?.paypal_status !== 'enabled')
    await toast(result.message || 'Listo.', warn ? 'warning' : 'success')
  } catch (e) {
    const status = statusOf(e)
    if (status === 401) return toLogin()
    const message = adminErrorMessage(e)
    if (status === 422 && (action === 'reject' || action === 'suspend')) notesError.value = message
    await toast(message, 'danger')
  } finally {
    busy.value = null
  }
}

async function approve() {
  const m = merchant.value
  if (!m || !(await confirmAction('¿Aprobar este comercio?', 'Le enviaremos un correo para que conecte PayPal.', 'Aprobar'))) return
  const value = notes.value.trim()
  await run('approve', () => AdminService.approve(m.id, value || undefined))
}

async function reject() {
  const m = merchant.value
  const value = requiredNotes('Explicá al comercio qué debe corregir (al menos 10 caracteres).')
  if (!m || value === null) return
  if (!(await confirmAction('¿Pedir cambios?', 'El comercio verá tus notas y podrá corregir su solicitud.', 'Pedir cambios'))) return
  await run('reject', () => AdminService.reject(m.id, value))
}

async function suspend() {
  const m = merchant.value
  const value = requiredNotes('Indicá el motivo de la suspensión (al menos 10 caracteres).')
  if (!m || value === null) return
  if (!(await confirmAction('¿Suspender este comercio?', 'Pierde el distintivo y deja de recibir pagos de inmediato.', 'Suspender'))) return
  await run('suspend', () => AdminService.suspend(m.id, value))
}

async function refreshPayPal() {
  const m = merchant.value
  if (m) await run('paypal', () => AdminService.refreshPayPal(m.id))
}

async function openDocument() {
  const m = merchant.value
  if (!m) return
  busy.value = 'document'
  try {
    await AdminService.openDocument(m.id)
  } catch (e) {
    if (statusOf(e) === 401) return toLogin()
    await toast(adminErrorMessage(e, 'No se pudo abrir el documento.'), 'danger')
  } finally {
    busy.value = null
  }
}

function back() {
  if (ionRouter.canGoBack()) ionRouter.back()
  else ionRouter.navigate('/equipo/comercios', 'back', 'replace')
}

async function logout() {
  loggingOut.value = true
  try {
    await AdminService.logout()
    await router.replace('/equipo/login')
  } finally {
    loggingOut.value = false
  }
}

let firstEnter = true
onMounted(() => { void load() })
onIonViewWillEnter(() => {
  admin.value = AdminService.admin()
  if (firstEnter) { firstEnter = false; return }
  if (busy.value === null) void load()
})
</script>

<style scoped>
/* Colores propios del panel (se suman a los tokens de study.css) */
.admin-page { --admin-amber: #a15c07; --admin-amber-soft: rgba(245, 158, 11, .14); --admin-red: #c92a2a; --admin-red-soft: rgba(224, 49, 49, .09); --admin-approve: #2d8024; --admin-on-approve: #fff; }
.ion-palette-dark .admin-page { --admin-amber: #fbbf24; --admin-amber-soft: rgba(251, 191, 36, .13); --admin-red: #ff8787; --admin-red-soft: rgba(255, 135, 135, .12); --admin-approve: #76d26b; --admin-on-approve: #0f2a0c; }

/* Cabecera */
.admin-header { border-bottom: 1px solid var(--study-border); }
.admin-header ion-toolbar { --background: var(--study-bg); --color: var(--study-text); --border-width: 0; --min-height: 64px; --padding-start: 16px; --padding-end: 16px; }
.admin-bar { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 1040px; margin: 0 auto; }
.admin-brand { height: 30px; width: auto; flex-shrink: 0; }
.admin-title { flex: 1; min-width: 0; display: grid; }
.admin-title b { font-size: 16px; line-height: 20px; font-weight: 800; letter-spacing: -.01em; }
.admin-title span { font-size: 12px; line-height: 16px; color: var(--study-muted); }
.admin-title b, .admin-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-session { display: flex; align-items: center; gap: 10px; min-width: 0; }
.admin-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--study-muted); }
.admin-logout { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 38px; padding: 0 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-text); font-size: 13px; font-weight: 600; box-shadow: var(--study-shadow); }
.admin-logout ion-icon { font-size: 17px; }

/* Contenido */
.admin-shell.study-shell { max-width: 1040px; padding: 16px 16px 40px; }
.detail-back { margin-bottom: 14px; }
.back-link { display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 14px 0 10px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-text); font-size: 13px; font-weight: 600; box-shadow: var(--study-shadow); }
.back-link ion-icon { font-size: 17px; }

.merchant-hero { align-items: flex-start; margin-bottom: 14px; }
.merchant-hero .store-logo b { font-size: 20px; font-weight: 800; letter-spacing: .02em; color: var(--study-muted); }
.merchant-hero p { -webkit-line-clamp: 3; }
.hero-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.hero-date { display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12px; line-height: 16px; color: var(--study-muted); }

.detail-grid { display: grid; gap: 14px; }
.detail-main { display: grid; gap: 14px; min-width: 0; }
.info-card { padding: 20px; border-radius: 22px; min-width: 0; }
.info-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.info-head .study-symbol { width: 34px; height: 34px; font-size: 17px; color: var(--study-muted); }
.info-head h2 { font-size: 16px; line-height: 22px; }
.info-list { margin: 0; display: grid; }
.info-list > div { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 12px; padding: 10px 0; border-top: 1px solid var(--study-border); }
.info-list > div:first-child { border-top: 0; }
.info-list dt { font-size: 13px; line-height: 20px; color: var(--study-muted); }
.info-list dd { margin: 0; min-width: 0; font-size: 14px; line-height: 20px; font-weight: 600; overflow-wrap: anywhere; }
.info-list dd small { margin-left: 4px; font-size: 12px; font-weight: 500; color: var(--study-muted); }
.info-list a { color: var(--study-blue); font-weight: 600; }
.info-list a ion-icon { font-size: 14px; margin-left: 4px; vertical-align: -2px; }
.info-list .block-link { display: block; margin-top: 2px; font-size: 13px; font-weight: 500; }
.flags { display: flex; flex-wrap: wrap; gap: 4px 14px; }
.flag { display: inline-flex; align-items: center; gap: 5px; color: var(--study-muted); }
.flag ion-icon { font-size: 16px; }
.flag.ok { color: var(--study-green-ink); }
.long-text { font-size: 14px; line-height: 22px; white-space: pre-line; overflow-wrap: anywhere; }
.review-notes { margin-top: 10px; padding: 12px 14px; border: 1px solid var(--study-border); border-radius: 14px; background: var(--study-bg); }

.doc-button { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--study-border); border-radius: 16px; background: var(--study-bg); color: var(--study-text); text-align: left; }
.doc-button > span:nth-child(2) { flex: 1; min-width: 0; display: grid; gap: 2px; }
.doc-button b { font-size: 14px; line-height: 19px; }
.doc-button small { font-size: 12px; line-height: 16px; color: var(--study-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-button > ion-icon { font-size: 18px; color: var(--study-faint); }
.doc-button ion-spinner { width: 18px; height: 18px; color: var(--study-muted); }

/* Distintivos de estado y de PayPal */
.admin-status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: var(--study-track); color: var(--study-muted); font-size: 11px; line-height: 16px; font-weight: 700; white-space: nowrap; }
.admin-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.admin-status.is-submitted { background: var(--admin-amber-soft); color: var(--admin-amber); }
.admin-status.is-approved { background: var(--study-green-soft); color: var(--study-green-ink); }
.admin-status.is-rejected { background: var(--admin-red-soft); color: var(--admin-red); }
.paypal-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; font-size: 11px; line-height: 16px; font-weight: 800; white-space: nowrap; }
.paypal-badge ion-icon { font-size: 12px; }
.paypal-badge.is-enabled { background: #ffc439; color: #003087; }
.paypal-badge.is-pending { background: var(--study-bg); color: var(--study-muted); border: 1px solid var(--study-border); font-weight: 700; }

/* Acciones */
.action-card { display: grid; gap: 14px; padding: 20px; border-radius: 22px; }
.action-card h2 { font-size: 18px; }
.action-card .study-muted { margin-top: 4px; font-size: 13px; line-height: 19px; }
.field { display: grid; gap: 6px; font-size: 12px; font-weight: 600; color: var(--study-muted); }
.field textarea { width: 100%; resize: vertical; min-height: 104px; padding: 12px 14px; border: 1px solid var(--study-border); border-radius: 14px; background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 14px; font-weight: 500; line-height: 21px; }
.field textarea::placeholder { color: var(--study-faint); }
.field textarea:focus { outline: 2px solid var(--study-text); outline-offset: 1px; }
.field textarea[aria-invalid="true"] { border-color: var(--admin-red); }
.field .hint { font-weight: 500; color: var(--study-faint); }
.field .err { color: var(--admin-red); }
.action-buttons { display: grid; gap: 10px; }
.action-buttons .study-button { min-height: 48px; font-size: 14px; }
.action-buttons ion-spinner { width: 18px; height: 18px; color: currentColor; }
.approve-button { background: var(--admin-approve); color: var(--admin-on-approve); }
.danger-button { background: var(--admin-red-soft); color: var(--admin-red); border: 1px solid color-mix(in srgb, var(--admin-red) 30%, transparent); box-shadow: none; }
.changes-button ion-icon { color: var(--admin-red); }
.paypal-button ion-icon { color: var(--study-blue); }

/* Carga */
.detail-skeleton { display: grid; gap: 14px; }
.detail-skeleton i { display: block; height: 120px; border-radius: 22px; background: var(--study-track); animation: admin-pulse 1.4s ease-in-out infinite; }
.detail-skeleton i + i { height: 220px; }
@keyframes admin-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

@media (max-width: 560px) {
  .admin-name { max-width: 110px; }
  .admin-logout { width: 38px; padding: 0; }
  .admin-logout span { display: none; }
}
@media (max-width: 380px) {
  .admin-name { max-width: 72px; }
}
@media (max-width: 420px) {
  .info-list > div { grid-template-columns: 104px minmax(0, 1fr); gap: 10px; }
  .merchant-hero { gap: 14px; padding: 18px; }
}
@media (min-width: 720px) {
  .admin-shell.study-shell { padding: 24px 24px 48px; }
}
@media (min-width: 900px) {
  .detail-grid { grid-template-columns: minmax(0, 1fr) 340px; align-items: start; gap: 20px; }
  .action-card { position: sticky; top: 20px; }
}
</style>

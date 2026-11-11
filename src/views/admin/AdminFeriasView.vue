<template>
  <ion-page class="study-ui market-ui admin-page">
    <ion-header class="ion-no-border admin-header">
      <ion-toolbar>
        <div class="admin-bar">
          <img src="/LaU.png" alt="" class="admin-brand"/>
          <div class="admin-title">
            <b>Panel de LaU</b>
            <span>Ferias en campus</span>
          </div>
          <nav class="admin-nav" aria-label="Secciones del panel">
            <router-link to="/equipo/comercios" replace>Comercios</router-link>
            <router-link to="/equipo/campus" replace>Campus</router-link>
            <router-link to="/equipo/ferias" replace class="is-current">Ferias</router-link>
          </nav>
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
        <div class="admin-intro">
          <div>
            <h1>Ferias</h1>
            <p class="study-muted">Ferias de comercios dentro de un campus. Pueden publicar un anuncio para los estudiantes de ese campus.</p>
          </div>
          <button type="button" class="new-button" :disabled="busy" @click="openCreate">
            <ion-icon :icon="addOutline" aria-hidden="true"/>Nueva feria
          </button>
        </div>

        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load()">Reintentar</button></p>

        <div class="feria-layout">
          <section class="feria-list-col" aria-label="Lista de ferias">
            <!-- Primera carga -->
            <ul v-if="loading && !loaded" class="row-skeleton" aria-hidden="true">
              <li v-for="n in 4" :key="n"><span><i/><i/><i/></span></li>
            </ul>

            <div v-else-if="loaded && !ferias.length && !error" class="study-empty study-card admin-empty">
              <span class="study-symbol tone-blue"><ion-icon :icon="calendarOutline"/></span>
              <h2>Aún no hay ferias</h2>
              <p>Creá la primera para un campus.</p>
              <button class="study-link" :disabled="busy" @click="openCreate">Nueva feria</button>
            </div>

            <template v-else-if="loaded">
              <p v-if="!current.length" class="no-upcoming study-card">No hay ferias en curso ni próximas.</p>

              <ul class="feria-list" :class="{ refreshing: loading }" :aria-busy="loading">
                <template v-for="row in rows" :key="row.key">
                  <li v-if="row.type === 'divider'" class="past-divider">
                    <button type="button" class="past-toggle" :aria-expanded="showPast" @click="showPast = !showPast">
                      <span>Pasadas</span><span class="chip-count">{{ past.length }}</span>
                      <ion-icon :icon="chevronDownOutline" :class="{ open: showPast }" aria-hidden="true"/>
                    </button>
                  </li>
                  <li v-else class="feria-row" :class="{ 'is-past': row.past, editing: row.feria.id === editingId }">
                    <div class="feria-main">
                      <div class="feria-tags">
                        <span class="campus-tag"><ion-icon :icon="schoolOutline" aria-hidden="true"/>{{ campusLabel(row.feria) }}</span>
                        <span v-if="row.feria.en_curso" class="tag is-live">En curso</span>
                        <span v-if="row.feria.banner_id != null" class="tag is-banner"><ion-icon :icon="megaphoneOutline" aria-hidden="true"/>Con anuncio</span>
                      </div>
                      <b class="feria-title">{{ row.feria.titulo }}</b>
                      <span class="feria-meta"><ion-icon :icon="calendarOutline" aria-hidden="true"/>{{ formatRange(row.feria) }}</span>
                      <span v-if="row.feria.lugar" class="feria-meta"><ion-icon :icon="locationOutline" aria-hidden="true"/>{{ row.feria.lugar }}</span>
                      <p v-if="row.feria.descripcion" class="feria-desc">{{ row.feria.descripcion }}</p>
                    </div>
                    <div class="feria-actions">
                      <button type="button" class="study-icon-button" :aria-label="`Editar ${row.feria.titulo}`" :disabled="busy" @click="openEdit(row.feria)">
                        <ion-icon :icon="createOutline"/>
                      </button>
                      <button type="button" class="study-icon-button delete-button" :aria-label="`Eliminar ${row.feria.titulo}`" :disabled="busy" @click="remove(row.feria)">
                        <ion-spinner v-if="deletingId === row.feria.id" name="crescent"/><ion-icon v-else :icon="trashOutline"/>
                      </button>
                    </div>
                  </li>
                </template>
              </ul>
            </template>
          </section>

          <form v-if="formOpen" ref="formEl" class="feria-form study-card" novalidate aria-labelledby="feria-form-title" @submit.prevent="save">
            <header class="editor-head">
              <h2 id="feria-form-title">{{ editingId !== null ? 'Editar feria' : 'Nueva feria' }}</h2>
              <button type="button" class="study-icon-button editor-close" aria-label="Cerrar" :disabled="saving" @click="closeForm">
                <ion-icon :icon="closeOutline"/>
              </button>
            </header>

            <div class="field">
              <label for="feria-campus">Campus</label>
              <select
                id="feria-campus"
                v-model="form.universidad_id"
                :aria-invalid="!!fieldErrors.universidad_id"
                :disabled="saving || campusesLoading"
                @change="clearError('universidad_id')"
              >
                <option :value="null" disabled>{{ campusesLoading ? 'Cargando campus…' : 'Elegí un campus' }}</option>
                <option v-for="c in campusOptions" :key="c.id" :value="c.id">{{ c.siglas ? `${c.siglas} · ${c.nombre}` : c.nombre }}</option>
              </select>
              <small v-if="fieldErrors.universidad_id" class="err" role="alert">{{ fieldErrors.universidad_id }}</small>
              <small v-else-if="campusesError" class="err">{{ campusesError }} <button type="button" class="study-link inline-link" @click="loadCampuses">Reintentar</button></small>
            </div>

            <div class="field">
              <label for="feria-titulo">Título</label>
              <input
                id="feria-titulo"
                v-model="form.titulo"
                type="text"
                maxlength="120"
                autocomplete="off"
                placeholder="Feria de emprendedores"
                :aria-invalid="!!fieldErrors.titulo"
                :disabled="saving"
                @input="clearError('titulo')"
              />
              <small v-if="fieldErrors.titulo" class="err" role="alert">{{ fieldErrors.titulo }}</small>
            </div>

            <div class="field">
              <label for="feria-descripcion">Descripción (opcional)</label>
              <textarea id="feria-descripcion" v-model="form.descripcion" rows="3" maxlength="1000" placeholder="Qué van a encontrar los estudiantes" :disabled="saving"/>
              <small class="hint">{{ form.descripcion.length }}/1000</small>
            </div>

            <div class="field">
              <label for="feria-lugar">Lugar dentro del campus (opcional)</label>
              <input id="feria-lugar" v-model="form.lugar" type="text" maxlength="160" autocomplete="off" placeholder="Plaza central" :disabled="saving"/>
            </div>

            <div class="dates">
              <div class="field">
                <label for="feria-inicio">Inicio</label>
                <input
                  id="feria-inicio"
                  v-model="form.inicia_en"
                  type="datetime-local"
                  :aria-invalid="!!fieldErrors.inicia_en"
                  :disabled="saving"
                  @input="clearError('inicia_en')"
                />
                <small v-if="fieldErrors.inicia_en" class="err" role="alert">{{ fieldErrors.inicia_en }}</small>
              </div>
              <div class="field">
                <label for="feria-fin">Fin</label>
                <input
                  id="feria-fin"
                  v-model="form.termina_en"
                  type="datetime-local"
                  :min="form.inicia_en || undefined"
                  :aria-invalid="!!fieldErrors.termina_en"
                  :disabled="saving"
                  @input="clearError('termina_en')"
                />
                <small v-if="fieldErrors.termina_en" class="err" role="alert">{{ fieldErrors.termina_en }}</small>
              </div>
            </div>

            <label class="check-field">
              <input v-model="form.crear_anuncio" type="checkbox" :disabled="saving"/>
              <span>
                <b>Publicar anuncio para los estudiantes de este campus</b>
                <small>Solo lo ven quienes estudian ahí, mientras dure la feria.</small>
              </span>
            </label>

            <p v-if="formError" class="form-error" role="alert"><ion-icon :icon="alertCircleOutline" aria-hidden="true"/>{{ formError }}</p>

            <div class="form-actions">
              <button type="button" class="study-button secondary-button" :disabled="saving" @click="closeForm">Cancelar</button>
              <button type="submit" class="study-button" :disabled="saving">
                <ion-spinner v-if="saving" name="crescent"/><ion-icon v-else :icon="checkmarkOutline"/>
                {{ saving ? 'Guardando…' : editingId !== null ? 'Guardar cambios' : 'Crear feria' }}
              </button>
            </div>
          </form>

          <div v-else-if="loaded && ferias.length" class="editor-placeholder study-card">
            <span class="study-symbol tone-blue"><ion-icon :icon="calendarOutline"/></span>
            <p>Creá una feria nueva o tocá editar en una de la lista.</p>
          </div>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
  alertController, toastController, onIonViewWillEnter,
} from '@ionic/vue'
import {
  logOutOutline, addOutline, calendarOutline, schoolOutline, megaphoneOutline, locationOutline, createOutline,
  trashOutline, chevronDownOutline, closeOutline, alertCircleOutline, checkmarkOutline,
} from 'ionicons/icons'
import {
  AdminService, adminErrorMessage, type AdminCampus, type AdminFeria, type FeriaInput,
} from '@/services/adminService'
import '@/theme/study.css'
import '@/theme/marketplace.css'

interface FeriaForm {
  universidad_id: number | null
  titulo: string
  descripcion: string
  lugar: string
  /** Valor del input datetime-local (YYYY-MM-DDTHH:mm, hora local). */
  inicia_en: string
  termina_en: string
  crear_anuncio: boolean
}

type FieldKey = 'universidad_id' | 'titulo' | 'inicia_en' | 'termina_en'

type Row =
  | { type: 'feria'; key: string; feria: AdminFeria; past: boolean }
  | { type: 'divider'; key: string }

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }

const router = useRouter()
const route = useRoute()
const admin = ref(AdminService.admin())
const loggingOut = ref(false)

const ferias = ref<AdminFeria[]>([])
const loading = ref(true)
const loaded = ref(false)
const error = ref('')
const now = ref(Date.now())
const showPast = ref(false)

const campuses = ref<AdminCampus[]>([])
const campusesLoading = ref(false)
const campusesError = ref('')

const emptyForm = (): FeriaForm => ({
  universidad_id: null, titulo: '', descripcion: '', lugar: '', inicia_en: '', termina_en: '', crear_anuncio: true,
})

const formOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<FeriaForm>(emptyForm())
const fieldErrors = reactive<Partial<Record<FieldKey, string>>>({})
const formError = ref('')
const saving = ref(false)
const deletingId = ref<number | null>(null)
const formEl = ref<HTMLFormElement | null>(null)

const busy = computed(() => saving.value || deletingId.value !== null)

// ── Fechas ────────────────────────────────────────────────────────────
/**
 * Fecha de la API: "YYYY-MM-DD HH:mm[:ss]" sin zona se toma como hora local; con zona (Z / ±hh:mm)
 * se convierte a la hora del dispositivo.
 */
function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const local = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value.trim())
  if (local) {
    const [, y, m, d, h, min, s] = local
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s ?? 0))
  }
  const date = new Date(value.replace(/(\.\d{3})\d+/, '$1'))
  return Number.isNaN(date.getTime()) ? null : date
}

const time = (value: string) => parseApiDate(value)?.getTime() ?? 0
const pad = (n: number) => String(n).padStart(2, '0')

function toInputValue(value: string): string {
  const d = parseApiDate(value)
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` : ''
}

const formatDate = (value: string) => parseApiDate(value)?.toLocaleString('es-SV', DATE_FORMAT) ?? value
const formatRange = (f: AdminFeria) => `${formatDate(f.inicia_en)} – ${formatDate(f.termina_en)}`

// ── Lista: en curso y próximas primero; pasadas plegadas al final ───────
const isPast = (f: AdminFeria) => !f.en_curso && time(f.termina_en) < now.value

const current = computed(() =>
  ferias.value
    .filter(f => !isPast(f))
    .sort((a, b) => Number(b.en_curso) - Number(a.en_curso) || time(a.inicia_en) - time(b.inicia_en)),
)

const past = computed(() => ferias.value.filter(isPast).sort((a, b) => time(b.inicia_en) - time(a.inicia_en)))

const rows = computed<Row[]>(() => {
  const toRow = (f: AdminFeria, isOld: boolean): Row => ({ type: 'feria', key: `f${f.id}`, feria: f, past: isOld })
  const list = current.value.map(f => toRow(f, false))
  if (past.value.length) {
    list.push({ type: 'divider', key: 'past' })
    if (showPast.value) list.push(...past.value.map(f => toRow(f, true)))
  }
  return list
})

const campusById = computed(() => new Map(campuses.value.map(c => [c.id, c])))

function campusLabel(f: AdminFeria): string {
  const c = f.universidad ?? campusById.value.get(f.universidad_id) ?? null
  return c?.siglas || c?.nombre || 'Campus'
}

// Si la feria que se edita es de un campus que no vino en la lista, se agrega para no perderlo.
const campusOptions = computed(() => {
  const list = [...campuses.value].sort((a, b) => (a.siglas || a.nombre).localeCompare(b.siglas || b.nombre, 'es'))
  const editing = editingId.value !== null ? ferias.value.find(f => f.id === editingId.value) : null
  const own = editing?.universidad
  if (own && !list.some(c => c.id === own.id)) list.unshift({ ...own, latitud: null, longitud: null, radio_entrega_m: 0, direccion: null, products_count: 0 })
  return list
})

// ── Carga ─────────────────────────────────────────────────────────────
const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status

function toLogin() {
  void router.replace({ path: '/equipo/login', query: { next: route.fullPath } })
}

async function toast(message: string, color: 'success' | 'warning' | 'danger') {
  const t = await toastController.create({ message, color, position: 'top', duration: color === 'success' ? 2800 : 5000 })
  await t.present()
}

// Contador de peticiones: solo la última respuesta actualiza la lista.
let request = 0

async function load(): Promise<void> {
  const id = ++request
  loading.value = true
  error.value = ''
  try {
    const list = await AdminService.ferias()
    if (id !== request) return
    ferias.value = Array.isArray(list) ? list : []
    now.value = Date.now()
    loaded.value = true
  } catch (e) {
    if (id !== request) return
    if (statusOf(e) === 401) return toLogin()
    error.value = adminErrorMessage(e, 'No pudimos cargar las ferias.')
  } finally {
    if (id === request) loading.value = false
  }
}

async function loadCampuses(): Promise<void> {
  campusesLoading.value = true
  campusesError.value = ''
  try {
    const list = await AdminService.campuses()
    campuses.value = Array.isArray(list) ? list : []
  } catch (e) {
    if (statusOf(e) === 401) return toLogin()
    campusesError.value = adminErrorMessage(e, 'No pudimos cargar los campus.')
  } finally {
    campusesLoading.value = false
  }
}

async function refresh(event: CustomEvent) {
  await Promise.all([load(), loadCampuses()])
  await (event.target as HTMLIonRefresherElement).complete()
}

// ── Formulario ────────────────────────────────────────────────────────
function clearErrors() {
  for (const key of Object.keys(fieldErrors) as FieldKey[]) delete fieldErrors[key]
  formError.value = ''
}

function clearError(key: FieldKey) {
  delete fieldErrors[key]
  formError.value = ''
}

// Con la columna fija (escritorio alto) el formulario ya está a la vista; si no, se desplaza hasta él.
const formIsSticky = () => window.matchMedia('(min-width: 900px) and (min-height: 820px)').matches

async function revealForm() {
  await nextTick()
  if (!formIsSticky()) formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openCreate() {
  if (busy.value) return
  // Si ya se está creando una, no se borra lo escrito.
  if (formOpen.value && editingId.value === null) {
    void revealForm()
    return
  }
  editingId.value = null
  Object.assign(form, emptyForm())
  if (campuses.value.length === 1) form.universidad_id = campuses.value[0].id
  clearErrors()
  formOpen.value = true
  if (!campuses.value.length && !campusesLoading.value) void loadCampuses()
  void revealForm()
}

function openEdit(f: AdminFeria) {
  if (busy.value) return
  editingId.value = f.id
  Object.assign(form, {
    universidad_id: f.universidad_id,
    titulo: f.titulo,
    descripcion: f.descripcion ?? '',
    lugar: f.lugar ?? '',
    inicia_en: toInputValue(f.inicia_en),
    termina_en: toInputValue(f.termina_en),
    crear_anuncio: f.banner_id != null,
  } satisfies FeriaForm)
  clearErrors()
  formOpen.value = true
  void revealForm()
}

function resetForm() {
  formOpen.value = false
  editingId.value = null
  Object.assign(form, emptyForm())
  clearErrors()
}

function closeForm() {
  if (!saving.value) resetForm()
}

function validate(): boolean {
  clearErrors()
  if (form.universidad_id === null) fieldErrors.universidad_id = 'Elegí el campus de la feria.'
  const titulo = form.titulo.trim()
  if (!titulo) fieldErrors.titulo = 'Escribí el título de la feria.'
  else if (titulo.length > 120) fieldErrors.titulo = 'El título puede tener hasta 120 caracteres.'

  const start = form.inicia_en ? parseApiDate(form.inicia_en) : null
  const end = form.termina_en ? parseApiDate(form.termina_en) : null
  if (!form.inicia_en) fieldErrors.inicia_en = 'Indicá cuándo empieza.'
  else if (!start) fieldErrors.inicia_en = 'Revisá la fecha de inicio.'
  if (!form.termina_en) fieldErrors.termina_en = 'Indicá cuándo termina.'
  else if (!end) fieldErrors.termina_en = 'Revisá la fecha de fin.'
  else if (start && end.getTime() <= start.getTime()) fieldErrors.termina_en = 'El fin tiene que ser después del inicio.'

  return Object.keys(fieldErrors).length === 0
}

function upsert(feria: AdminFeria) {
  const exists = ferias.value.some(f => f.id === feria.id)
  ferias.value = exists ? ferias.value.map(f => (f.id === feria.id ? feria : f)) : [...ferias.value, feria]
  now.value = Date.now()
}

async function save() {
  if (saving.value) return
  if (!validate()) {
    await nextTick()
    formEl.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  const id = editingId.value
  const editing = id !== null ? ferias.value.find(f => f.id === id) : undefined
  const input: FeriaInput = {
    universidad_id: form.universidad_id as number,
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim() || null,
    lugar: form.lugar.trim() || null,
    // Se envía tal cual lo da el input (YYYY-MM-DDTHH:mm), sin segundos.
    inicia_en: form.inicia_en.slice(0, 16),
    termina_en: form.termina_en.slice(0, 16),
    crear_anuncio: form.crear_anuncio,
  }
  // Al editar se conserva el punto en el mapa que ya tuviera la feria.
  if (editing) {
    input.latitud = editing.latitud
    input.longitud = editing.longitud
  }

  saving.value = true
  formError.value = ''
  try {
    const result = id !== null ? await AdminService.updateFeria(id, input) : await AdminService.createFeria(input)
    if (result?.data) upsert(result.data)
    else void load()
    resetForm()
    await toast(result?.message || (id !== null ? 'Feria actualizada.' : 'Feria creada.'), 'success')
  } catch (e) {
    const status = statusOf(e)
    if (status === 401) return toLogin()
    const message = adminErrorMessage(e, 'No se pudo guardar la feria.')
    if (status === 422) formError.value = message
    await toast(message, 'danger')
  } finally {
    saving.value = false
  }
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

async function remove(f: AdminFeria) {
  if (busy.value) return
  if (!(await confirmAction('¿Eliminar esta feria?', `Se eliminará «${f.titulo}». Esta acción no se puede deshacer.`, 'Eliminar'))) return
  deletingId.value = f.id
  try {
    const result = await AdminService.deleteFeria(f.id)
    ferias.value = ferias.value.filter(x => x.id !== f.id)
    if (editingId.value === f.id) resetForm()
    await toast(result?.message || 'Feria eliminada.', 'success')
  } catch (e) {
    const status = statusOf(e)
    if (status === 401) return toLogin()
    await toast(adminErrorMessage(e, 'No se pudo eliminar la feria.'), 'danger')
  } finally {
    deletingId.value = null
  }
}

// ── Sesión ────────────────────────────────────────────────────────────
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
onMounted(() => {
  void load()
  void loadCampuses()
})
onIonViewWillEnter(() => {
  admin.value = AdminService.admin()
  if (firstEnter) { firstEnter = false; return }
  if (busy.value) return
  void load()
  void loadCampuses()
})
</script>

<style scoped>
/* Colores propios del panel (se suman a los tokens de study.css) */
.admin-page { --admin-red: #c92a2a; --admin-red-soft: rgba(224, 49, 49, .09); }
.ion-palette-dark .admin-page { --admin-red: #ff8787; --admin-red-soft: rgba(255, 135, 135, .12); color-scheme: dark; }

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
/* Secciones del panel: segunda fila en teléfono, en la barra en pantallas grandes */
.admin-bar { flex-wrap: wrap; }
.admin-nav { order: 3; flex: 1 0 100%; display: flex; gap: 2px; padding: 3px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-tray); }
.admin-nav a { flex: 1; display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 6px 14px; border-radius: 999px; color: var(--study-muted); font-size: 13px; font-weight: 600; line-height: 18px; white-space: nowrap; transition: background-color .2s ease, color .2s ease; }
.admin-nav a:hover { color: var(--study-text); }
.admin-nav a.is-current { background: var(--study-surface); color: var(--study-text); box-shadow: var(--study-shadow); }

/* Contenido */
.admin-shell.study-shell { max-width: 1040px; padding: 20px 16px 40px; }
.admin-intro { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 16px; margin-bottom: 16px; }
.admin-intro > div { flex: 1 1 280px; min-width: 0; }
.admin-intro p { margin-top: 4px; max-width: 560px; font-size: 14px; line-height: 20px; }
.new-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 0 18px 0 14px; border: 0; border-radius: 999px; background: var(--study-cta); color: var(--study-on-cta); font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px -2px rgba(20, 20, 22, .16); }
.new-button ion-icon { font-size: 20px; }

.feria-layout { display: grid; gap: 16px; }
.feria-list-col { min-width: 0; }

/* Lista */
.feria-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; transition: opacity .2s ease; }
.feria-list.refreshing { opacity: .55; }
.feria-row {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: start;
  padding: 14px 14px 14px 16px; border: 1px solid var(--study-border); border-radius: 20px; background: var(--study-surface);
  box-shadow: var(--study-shadow); animation: study-arrive .25s both;
}
.feria-row.editing { border-color: var(--study-text); box-shadow: 0 0 0 1px var(--study-text); }
.feria-row.is-past { background: var(--study-bg); box-shadow: none; }
.feria-row.is-past .feria-title { color: var(--study-muted); }
.feria-main { min-width: 0; display: grid; gap: 4px; }
.feria-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
.campus-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-bg); color: var(--study-text); font-size: 11px; line-height: 16px; font-weight: 700; white-space: nowrap; }
.campus-tag ion-icon { font-size: 12px; color: var(--study-muted); }
.tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 11px; line-height: 16px; font-weight: 700; white-space: nowrap; }
.tag ion-icon { font-size: 12px; }
.tag.is-live { background: var(--study-green-soft); color: var(--study-green-ink); }
.tag.is-live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tag.is-banner { background: var(--study-blue-soft); color: var(--study-blue); }
.feria-title { font-size: 15px; line-height: 20px; font-weight: 700; overflow-wrap: anywhere; }
.feria-meta { display: flex; align-items: flex-start; gap: 5px; font-size: 12px; line-height: 17px; color: var(--study-muted); overflow-wrap: anywhere; }
.feria-meta ion-icon { font-size: 14px; margin-top: 1px; color: var(--study-faint); }
.feria-desc { margin-top: 2px; font-size: 13px; line-height: 19px; color: var(--study-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.feria-actions { display: flex; gap: 6px; }
.feria-actions .study-icon-button { width: 38px; height: 38px; font-size: 18px; }
.feria-actions ion-spinner { width: 18px; height: 18px; }
.study-ui .delete-button { color: var(--admin-red); }

.no-upcoming { margin-bottom: 10px; padding: 16px; border-radius: 18px; font-size: 13px; line-height: 19px; color: var(--study-muted); text-align: center; box-shadow: none; }
.past-divider { margin-top: 6px; }
.past-toggle { display: inline-flex; align-items: center; gap: 8px; min-height: 38px; padding: 6px 12px 6px 14px; border: 1px solid var(--study-border); border-radius: 999px; background: var(--study-surface); color: var(--study-muted); font-size: 13px; font-weight: 600; box-shadow: var(--study-shadow); }
.past-toggle ion-icon { font-size: 16px; transition: transform .2s ease; }
.past-toggle ion-icon.open { transform: rotate(180deg); }
.chip-count { min-width: 22px; padding: 1px 7px; border-radius: 999px; background: var(--study-track); color: var(--study-text); font-size: 11px; line-height: 16px; font-weight: 700; text-align: center; }

/* Formulario */
.feria-form { display: grid; gap: 14px; padding: 18px; border-radius: 22px; min-width: 0; scroll-margin-top: 12px; animation: study-arrive .25s both; }
.editor-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.editor-close { width: 36px; height: 36px; font-size: 18px; }
.field { display: grid; gap: 6px; min-width: 0; font-size: 12px; font-weight: 600; color: var(--study-muted); }
.field :is(input, select, textarea) { width: 100%; min-width: 0; min-height: 46px; padding: 11px 14px; border: 1px solid var(--study-border); border-radius: 14px; background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 14px; font-weight: 500; line-height: 20px; }
.field textarea { resize: vertical; min-height: 88px; }
.field input[type="datetime-local"] { -webkit-appearance: none; appearance: none; display: block; text-align: left; }
.field input[type="datetime-local"]::-webkit-date-and-time-value { text-align: left; }
.field :is(input, textarea)::placeholder { color: var(--study-faint); }
.field :is(input, select, textarea):focus { outline: 2px solid var(--study-text); outline-offset: 1px; }
.field [aria-invalid="true"] { border-color: var(--admin-red); }
.field :is(input, select, textarea):disabled { opacity: .7; }
.field .hint { font-weight: 500; color: var(--study-faint); justify-self: end; }
.field .err { color: var(--admin-red); }
.study-ui .inline-link { min-height: 0; padding: 0; margin-left: 4px; color: inherit; text-decoration: underline; font-size: inherit; }
.dates { display: grid; gap: 14px; }

.check-field { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1px solid var(--study-border); border-radius: 16px; background: var(--study-bg); cursor: pointer; }
.check-field input { flex-shrink: 0; width: 20px; height: 20px; margin: 1px 0 0; accent-color: var(--study-blue); cursor: pointer; }
.check-field span { display: grid; gap: 2px; min-width: 0; }
.check-field b { font-size: 13px; line-height: 19px; font-weight: 700; }
.check-field small { font-size: 12px; line-height: 17px; color: var(--study-muted); }

.form-error { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-radius: 14px; background: var(--admin-red-soft); color: var(--admin-red); font-size: 13px; line-height: 19px; font-weight: 600; }
.form-error ion-icon { flex-shrink: 0; font-size: 18px; margin-top: 1px; }
.form-actions { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 10px; }
.form-actions .study-button { min-height: 48px; font-size: 14px; }
.form-actions .secondary-button { box-shadow: var(--study-shadow); }
.form-actions ion-spinner { width: 18px; height: 18px; color: currentColor; }

.editor-placeholder { display: none; }

/* Vacío y carga */
.admin-empty { padding: 32px 20px; }
.row-skeleton { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.row-skeleton li { display: flex; padding: 16px; border: 1px solid var(--study-border); border-radius: 20px; background: var(--study-surface); animation: admin-pulse 1.4s ease-in-out infinite; }
.row-skeleton span { flex: 1; display: grid; gap: 10px; }
.row-skeleton span i { display: block; height: 10px; border-radius: 999px; background: var(--study-track); width: 30%; }
.row-skeleton span i:nth-child(2) { width: 65%; height: 12px; }
.row-skeleton span i:nth-child(3) { width: 50%; }
@keyframes admin-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

@media (max-width: 560px) {
  .admin-name { max-width: 110px; }
  .admin-logout { width: 38px; padding: 0; }
  .admin-logout span { display: none; }
}
@media (max-width: 380px) {
  .admin-name { max-width: 72px; }
}
@media (max-width: 899px) {
  .admin-bar { padding: 10px 0; }
  /* En teléfono el formulario aparece arriba, junto al botón "Nueva feria". */
  .feria-form { order: -1; }
}
@media (min-width: 720px) {
  .admin-shell.study-shell { padding: 28px 24px 48px; }
}
@media (min-width: 900px) {
  .admin-nav { order: 0; flex: 0 0 auto; }
  .admin-nav a { flex: 0 0 auto; }
  .feria-layout { grid-template-columns: minmax(0, 1fr) 380px; align-items: start; gap: 20px; }
  .feria-form { padding: 20px; }
  .editor-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 240px; padding: 28px; border-style: dashed; text-align: center; font-size: 14px; line-height: 20px; color: var(--study-muted); box-shadow: none; }
}
@media (min-width: 900px) and (min-height: 820px) {
  .feria-form, .editor-placeholder { position: sticky; top: 20px; }
}
</style>

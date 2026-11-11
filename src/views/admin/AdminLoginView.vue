<template>
  <ion-page class="study-ui market-ui admin-page">
    <ion-content>
      <main class="login-shell">
        <form class="login-card study-card" novalidate @submit.prevent="submit">
          <img src="/LaU.png" alt="LaU" class="login-logo"/>
          <div class="login-heading">
            <h1>Panel de LaU</h1>
            <p class="study-muted">Ingresá con tu cuenta del equipo para revisar comercios.</p>
          </div>

          <label class="field">
            <span>Correo</span>
            <input
              v-model.trim="email"
              type="email"
              inputmode="email"
              autocomplete="username"
              autocapitalize="off"
              spellcheck="false"
              :disabled="loading"
              required
            />
          </label>

          <label class="field">
            <span>Contraseña</span>
            <span class="password">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                :disabled="loading"
                required
              />
              <button
                type="button"
                class="reveal"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"/>
              </button>
            </span>
          </label>

          <p v-if="error" class="login-error" role="alert"><ion-icon :icon="alertCircleOutline" aria-hidden="true"/>{{ error }}</p>

          <button class="study-button" type="submit" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent"/><ion-icon v-else :icon="logInOutline"/>
            {{ loading ? 'Ingresando…' : 'Ingresar' }}
          </button>

          <p class="login-note"><ion-icon :icon="lockClosedOutline" aria-hidden="true"/>Este acceso es solo para el equipo de LaU.</p>
        </form>

        <button type="button" class="study-link home-link" @click="router.replace('/')"><ion-icon :icon="arrowBackOutline" aria-hidden="true"/>Volver a LaU</button>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, IonSpinner, onIonViewWillEnter } from '@ionic/vue'
import { logInOutline, lockClosedOutline, eyeOutline, eyeOffOutline, alertCircleOutline, arrowBackOutline } from 'ionicons/icons'
import { AdminService, adminErrorMessage } from '@/services/adminService'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

// Solo se respeta un destino dentro del panel (evita redirecciones a otras rutas).
const target = computed(() => {
  const next = route.query.next
  return typeof next === 'string' && next.startsWith('/equipo') && !next.startsWith('/equipo/login') ? next : '/equipo/comercios'
})

function loginError(e: unknown): string {
  const status = (e as { response?: { status?: number } })?.response?.status
  if (status === 429) return 'Demasiados intentos. Esperá un minuto y volvé a intentar.'
  if (!status) return 'No pudimos conectar con LaU. Revisá tu conexión.'
  return adminErrorMessage(e, 'No pudimos iniciar sesión.')
}

async function submit() {
  if (loading.value) return
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Ingresá tu correo y contraseña.'
    return
  }
  if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    error.value = 'Revisá el correo: no parece válido.'
    return
  }
  loading.value = true
  try {
    await AdminService.login(email.value, password.value)
    password.value = ''
    await router.replace(target.value)
  } catch (e) {
    error.value = loginError(e)
  } finally {
    loading.value = false
  }
}

// Con sesión activa no tiene sentido mostrar el formulario.
let redirecting = false
function redirectIfSignedIn() {
  if (redirecting || !AdminService.isAuthenticated()) return
  redirecting = true
  void router.replace(target.value).finally(() => { redirecting = false })
}

onMounted(redirectIfSignedIn)
onIonViewWillEnter(() => {
  error.value = ''
  password.value = ''
  showPassword.value = false
  redirectIfSignedIn()
})
</script>

<style scoped>
.admin-page { --admin-red: #c92a2a; --admin-red-soft: rgba(224, 49, 49, .09); }
.ion-palette-dark .admin-page { --admin-red: #ff8787; --admin-red-soft: rgba(255, 135, 135, .12); }

.login-shell {
  min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  padding: max(24px, env(safe-area-inset-top, 0px)) 16px max(24px, env(safe-area-inset-bottom, 0px));
}
.login-card { width: 100%; max-width: 400px; display: grid; gap: 16px; padding: 28px 24px; border-radius: 28px; animation: study-arrive .25s both; }
.login-logo { height: 44px; width: auto; justify-self: start; }
.login-heading p { margin-top: 6px; font-size: 14px; line-height: 20px; }

.field { display: grid; gap: 6px; font-size: 12px; font-weight: 600; color: var(--study-muted); }
.field input { width: 100%; min-height: 48px; padding: 12px 14px; border: 1px solid var(--study-border); border-radius: 14px; background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 15px; font-weight: 500; }
.field input:focus { outline: 2px solid var(--study-text); outline-offset: 1px; }
.field input:disabled { opacity: .7; }
.password { position: relative; display: block; }
.password input { padding-right: 52px; }
.reveal { position: absolute; top: 50%; right: 4px; transform: translateY(-50%); display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; background: none; color: var(--study-muted); font-size: 20px; }
.study-ui .reveal:active { transform: translateY(-50%) scale(.96); }

.login-error { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-radius: 14px; background: var(--admin-red-soft); color: var(--admin-red); font-size: 13px; line-height: 19px; font-weight: 600; }
.login-error ion-icon { flex-shrink: 0; font-size: 18px; margin-top: 1px; }
.login-card .study-button ion-spinner { width: 18px; height: 18px; color: currentColor; }
.login-note { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; line-height: 17px; color: var(--study-muted); text-align: center; }
.login-note ion-icon { font-size: 14px; }
.study-ui .home-link { color: var(--study-muted); }
</style>

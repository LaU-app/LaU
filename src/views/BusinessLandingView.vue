<template>
  <ion-page class="study-ui market-ui business-landing">
    <ion-content>
      <div class="landing">
        <header class="landing-nav">
          <router-link to="/" class="brand" aria-label="LaU"><img src="/LaU.png" alt="LaU"/><span>para comercios</span></router-link>
          <button class="nav-cta" @click="start">{{ loggedIn ? 'Ir a mi comercio' : 'Iniciar sesión' }}</button>
        </header>

        <section class="hero">
          <span class="eyebrow"><i/>LaU MARKETPLACE</span>
          <h1>Vendé a estudiantes universitarios con <em>pagos seguros de PayPal</em></h1>
          <p>LaU es la red social de estudiantes de El Salvador. Verificamos tu comercio, conectás tu cuenta de PayPal y tus productos aparecen en el Marketplace con el distintivo de confianza de LaU.</p>
          <div class="hero-actions">
            <button class="study-button" @click="start"><ion-icon :icon="storefrontOutline"/>Registrar mi comercio</button>
            <a class="study-button secondary-button" href="#como-funciona">Cómo funciona</a>
          </div>
          <ul class="trust">
            <li><ion-icon :icon="shieldCheckmarkOutline"/>Verificación legal por LaU</li>
            <li><ion-icon :icon="logoPaypal"/>Cobros directos a tu PayPal</li>
            <li><ion-icon :icon="sparklesOutline"/>Recomendado por Jev cuando coincide</li>
          </ul>
        </section>

        <section class="preview" aria-label="Así te ven los estudiantes">
          <div class="preview-card study-card">
            <div class="preview-store">
              <span class="preview-logo"><ion-icon :icon="storefrontOutline"/></span>
              <div><b>Tu comercio</b><VerifiedBadge paypal/></div>
            </div>
            <div class="preview-product">
              <span class="preview-thumb"><ion-icon :icon="calculatorOutline"/></span>
              <div><b>Calculadora científica</b><span>$18.50 · Entrega en campus</span></div>
            </div>
            <span class="preview-pay"><ion-icon :icon="logoPaypal"/>Pagar con PayPal</span>
          </div>
        </section>

        <section id="como-funciona" class="section">
          <h2>Cómo funciona</h2>
          <ol class="flow">
            <li v-for="(step, i) in STEPS" :key="step.title" class="study-card">
              <span class="flow-n">{{ i + 1 }}</span>
              <ion-icon :icon="step.icon" class="flow-icon"/>
              <b>{{ step.title }}</b>
              <p>{{ step.text }}</p>
            </li>
          </ol>
        </section>

        <section class="section two-col">
          <div>
            <h2>Qué necesitás</h2>
            <ul class="checklist">
              <li v-for="item in REQUIREMENTS" :key="item"><ion-icon :icon="checkmarkCircle"/>{{ item }}</li>
            </ul>
          </div>
          <div>
            <h2>Por qué LaU</h2>
            <ul class="checklist">
              <li v-for="item in BENEFITS" :key="item"><ion-icon :icon="checkmarkCircle"/>{{ item }}</li>
            </ul>
          </div>
        </section>

        <section class="section">
          <h2>Preguntas frecuentes</h2>
          <details v-for="faq in FAQ" :key="faq.q" class="faq study-card">
            <summary>{{ faq.q }}<ion-icon :icon="chevronDownOutline"/></summary>
            <p>{{ faq.a }}</p>
          </details>
        </section>

        <section class="final-cta">
          <h2>¿Listo para vender en LaU?</h2>
          <p>Creá tu cuenta, armá tu tienda y enviá tu solicitud desde la app.</p>
          <button class="study-button" @click="start"><ion-icon :icon="arrowForwardOutline"/>Empezar ahora</button>
        </section>

        <footer class="landing-foot">© {{ year }} LaU · Hecho por estudiantes en El Salvador</footer>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  storefrontOutline, shieldCheckmarkOutline, logoPaypal, sparklesOutline, calculatorOutline, checkmarkCircle,
  chevronDownOutline, arrowForwardOutline, personAddOutline, documentTextOutline, ribbonOutline, cashOutline,
} from 'ionicons/icons'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import { AuthService } from '@/services/auth'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const year = new Date().getFullYear()
const loggedIn = computed(() => !!AuthService.isAuthenticated())

const STEPS = [
  { icon: personAddOutline, title: 'Creá tu cuenta y tu tienda', text: 'Registrate en LaU y armá tu vitrina: nombre, logo, categoría y redes.' },
  { icon: documentTextOutline, title: 'Enviá tus datos legales', text: 'Razón social, NIT, NRC si sos sociedad, representante y un documento que lo respalde.' },
  { icon: ribbonOutline, title: 'LaU verifica tu comercio', text: 'Nuestro equipo revisa la información. Si falta algo, te lo indicamos en la app para que lo corrijas.' },
  { icon: cashOutline, title: 'Conectá PayPal y vendé', text: 'Vinculás tu cuenta PayPal Business y los estudiantes pagan en línea. El dinero llega a tu cuenta.' },
]

const REQUIREMENTS = [
  'NIT del comercio o del titular',
  'NRC si tu comercio es una sociedad',
  'Escritura, matrícula de comercio o tarjeta de NIT/IVA (PDF o foto)',
  'Cuenta PayPal Business con correo confirmado',
  'Productos útiles para estudiantes universitarios',
]

const BENEFITS = [
  'Llegás a estudiantes de las principales universidades del país',
  'Distintivo "Verificado por LaU" que genera confianza',
  'Pagos con PayPal: el comprador aprueba y vos recibís directo',
  'Jev puede recomendar tus productos cuando coinciden con lo que un estudiante busca',
  'Pedidos y entregas coordinados desde la app',
]

const FAQ = [
  { q: '¿Quién recibe el dinero de las ventas?', a: 'Tu cuenta de PayPal. Cada pago se dirige a la cuenta del comercio que vende el producto; LaU valida el comercio, el precio y el monto antes de confirmar el cobro.' },
  { q: '¿Puedo vender si soy persona natural?', a: 'Sí. Elegí "Persona natural con negocio" e indicá tu NIT. El NRC solo es obligatorio para sociedades.' },
  { q: '¿Cuánto tarda la verificación?', a: 'El equipo de LaU revisa cada solicitud manualmente. Vas a ver el estado en la app y, si hace falta corregir algo, las observaciones para reenviarla.' },
  { q: '¿Qué ve el estudiante al comprar?', a: 'Tu comercio con el distintivo de verificado, el producto, el precio y el total. Confirma la compra y aprueba el pago en PayPal; nada se cobra sin su confirmación.' },
  { q: '¿Qué es Jev?', a: 'Jev es un modelo de decisiones de TypeSafe AI que LaU usa en la compra inteligente: evalúa qué productos reales de comercios verificados coinciden con lo que un estudiante necesita. No inventa productos ni precios.' },
]

function start() {
  router.push(loggedIn.value ? '/tabs/marketplace/empresa' : '/welcome')
}
</script>

<style scoped>
.business-landing ion-content { --background: var(--study-bg); }
.landing { max-width: 1080px; margin: 0 auto; padding: 0 20px calc(32px + env(safe-area-inset-bottom)); }
.landing-nav { display: flex; align-items: center; justify-content: space-between; padding: calc(16px + env(safe-area-inset-top)) 0 16px; }
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--study-muted); font-size: 13px; font-weight: 600; }
.brand img { height: 30px; width: auto; }
.nav-cta { border: 1px solid var(--study-border); background: var(--study-surface); color: var(--study-text); border-radius: 999px; padding: 9px 16px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.hero { padding: 36px 0 28px; max-width: 720px; }
.hero .eyebrow { color: var(--study-purple); }
.hero .eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: var(--study-purple); }
.hero h1 { margin-top: 12px; font-size: clamp(30px, 6vw, 52px); line-height: 1.06; font-weight: 800; letter-spacing: -.035em; }
.hero h1 em { font-style: normal; color: var(--study-purple); }
.hero p { margin-top: 16px; font-size: 16px; line-height: 25px; color: var(--study-muted); max-width: 60ch; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.hero-actions .study-button { width: auto; padding-inline: 24px; text-decoration: none; }
.trust { display: flex; flex-wrap: wrap; gap: 10px 18px; list-style: none; padding: 0; margin: 24px 0 0; font-size: 13px; font-weight: 600; }
.trust li { display: flex; align-items: center; gap: 6px; }
.trust ion-icon { color: var(--study-green-ink); font-size: 18px; }
.preview { display: flex; justify-content: center; padding: 8px 0 36px; }
.preview-card { width: min(100%, 380px); display: grid; gap: 14px; padding: 20px; border-radius: 26px; transform: rotate(-1.5deg); box-shadow: 0 24px 60px -30px rgba(20, 20, 22, .45); }
.preview-store, .preview-product { display: flex; gap: 12px; align-items: center; }
.preview-store > div, .preview-product > div { display: grid; gap: 4px; }
.preview-product span { font-size: 13px; color: var(--study-muted); }
.preview-logo, .preview-thumb { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; font-size: 22px; }
.preview-logo { background: var(--study-purple-soft); color: var(--study-purple); }
.preview-thumb { background: var(--study-blue-soft); color: var(--study-blue); }
.preview-pay { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; border-radius: 999px; background: #ffc439; color: #003087; font-weight: 800; }
.section { padding: 28px 0; }
.section h2, .final-cta h2 { font-size: clamp(22px, 4vw, 30px); font-weight: 800; letter-spacing: -.025em; margin-bottom: 16px; }
.flow { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; list-style: none; padding: 0; margin: 0; }
.flow li { position: relative; display: grid; gap: 8px; padding: 20px; border-radius: 22px; }
.flow-n { position: absolute; top: 16px; right: 18px; font-size: 32px; font-weight: 800; color: var(--study-track); }
.flow-icon { font-size: 26px; color: var(--study-purple); }
.flow b { font-size: 16px; }
.flow p { font-size: 13px; line-height: 20px; color: var(--study-muted); }
.two-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
.checklist { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.checklist li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 21px; }
.checklist ion-icon { flex-shrink: 0; margin-top: 2px; font-size: 18px; color: var(--study-green); }
.faq { padding: 0; border-radius: 18px; margin-bottom: 10px; overflow: hidden; }
.faq summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 18px; cursor: pointer; font-weight: 700; font-size: 15px; list-style: none; }
.faq summary ion-icon { flex-shrink: 0; transition: transform .2s ease; }
.faq[open] summary ion-icon { transform: rotate(180deg); }
.faq p { padding: 0 18px 16px; font-size: 14px; line-height: 21px; color: var(--study-muted); }
.final-cta { margin: 20px 0; padding: 32px 24px; border-radius: 28px; background: var(--study-cta); color: var(--study-on-cta); text-align: center; display: grid; justify-items: center; gap: 10px; }
.final-cta h2 { margin: 0; color: inherit; }
.final-cta p { opacity: .8; font-size: 15px; }
.final-cta .study-button { width: auto; padding-inline: 26px; background: var(--study-on-cta); color: var(--study-cta); }
.landing-foot { text-align: center; font-size: 12px; color: var(--study-faint); padding: 12px 0; }
@media (prefers-reduced-motion: reduce) { .faq summary ion-icon { transition: none; } }
</style>

<template>
  <ion-page class="study-ui market-ui business-landing">
    <ion-content :scroll-events="true" @ionScroll="onScroll">
      <header class="nav" :class="{ scrolled }">
        <div class="nav-inner">
          <router-link to="/" class="brand" aria-label="LaU"><img src="/LaU.png" alt="LaU"/><span>Comercios</span></router-link>
          <nav class="nav-links" aria-label="Secciones">
            <a href="#como-funciona" @click.prevent="scrollTo('como-funciona')">Cómo funciona</a>
            <a href="#beneficios" @click.prevent="scrollTo('beneficios')">Beneficios</a>
            <a href="#requisitos" @click.prevent="scrollTo('requisitos')">Requisitos</a>
            <a href="#preguntas" @click.prevent="scrollTo('preguntas')">Preguntas</a>
          </nav>
          <button class="btn btn-primary btn-sm" @click="start">{{ loggedIn ? 'Mi comercio' : 'Registrar comercio' }}</button>
        </div>
      </header>

      <!-- HÉROE -->
      <section class="hero">
        <div class="aurora" aria-hidden="true"><i/><i/><i/></div>
        <div class="grid-mask" aria-hidden="true"/>
        <div class="hero-inner">
          <div class="hero-copy">
            <span class="pill enter" style="--d: 0ms"><ion-icon :icon="shieldCheckmark"/>LaU Marketplace para comercios</span>
            <h1 class="enter" style="--d: 90ms">Tu comercio, dentro de la red de <span class="grad">los universitarios</span></h1>
            <p class="lead enter" style="--d: 180ms">LaU reúne a estudiantes de El Salvador en una sola app. Verificamos tu comercio, conectás PayPal y vendés con el distintivo de confianza de LaU.</p>
            <div class="hero-actions enter" style="--d: 270ms">
              <button class="btn btn-primary" @click="start"><ion-icon :icon="storefrontOutline"/>Registrar mi comercio</button>
              <button class="btn btn-ghost" @click="scrollTo('como-funciona')">Ver cómo funciona<ion-icon :icon="arrowDownOutline"/></button>
            </div>
            <ul class="trust enter" style="--d: 360ms">
              <li><ion-icon :icon="ribbonOutline"/>Verificación legal</li>
              <li><ion-icon :icon="logoPaypal"/>Cobros con PayPal</li>
              <li><ion-icon :icon="sparklesOutline"/>Asistente de compras</li>
            </ul>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <div class="phone">
              <div class="phone-notch"/>
              <div class="screen">
                <div class="screen-top"><img src="/LaU.png" alt=""/><span class="screen-search"><ion-icon :icon="searchOutline"/>Calculadora…<b>Asistente</b></span></div>
                <div class="screen-store">
                  <span class="logo-dot"><ion-icon :icon="storefrontOutline"/></span>
                  <div><b>Papelería Campus</b><span class="mini-badge"><ion-icon :icon="shieldCheckmark"/>Verificado por LaU</span></div>
                </div>
                <div class="screen-product">
                  <span class="product-art"><ion-icon :icon="calculatorOutline"/></span>
                  <b>Calculadora científica</b>
                  <span>Entrega en tu campus</span>
                  <strong>$18.50</strong>
                  <span class="pay"><ion-icon :icon="logoPaypal"/>Comprar con PayPal</span>
                </div>
              </div>
            </div>
            <div class="float f-order"><span class="ok"><ion-icon :icon="checkmark"/></span><div><b>Nuevo pedido pagado</b><span>$18.50 · vía PayPal</span></div></div>
            <div class="float f-agent"><span class="orb"><i/><i/></span><div><b>Encontré lo que buscás</b><span class="match"><i/>98 % de coincidencia</span></div></div>
            <div class="float f-badge"><ion-icon :icon="shieldCheckmark"/>Comercio verificado</div>
          </div>
        </div>
      </section>

      <!-- ECOSISTEMA -->
      <section class="section eco">
        <div class="container">
          <h2 v-reveal>Una app para toda la vida universitaria</h2>
          <p v-reveal class="section-lead" style="--d: 80ms">Tu comercio aparece donde los estudiantes ya pasan su día.</p>
          <div class="pillars">
            <article v-for="(p, i) in PILLARS" :key="p.title" v-reveal class="pillar" :class="{ featured: p.featured }" :style="{ '--d': `${i * 110}ms` }">
              <span class="pillar-icon"><ion-icon :icon="p.icon"/></span>
              <b>{{ p.title }}</b>
              <p>{{ p.text }}</p>
            </article>
          </div>
        </div>
        <div class="marquee" aria-hidden="true">
          <div class="marquee-track">
            <span v-for="(c, i) in [...CATEGORIES, ...CATEGORIES]" :key="i"><ion-icon :icon="c.icon"/>{{ c.name }}</span>
          </div>
        </div>
      </section>

      <!-- CÓMO FUNCIONA -->
      <section id="como-funciona" class="section">
        <div class="container">
          <h2 v-reveal>De la solicitud a tu primera venta</h2>
          <p v-reveal class="section-lead" style="--d: 80ms">Cuatro pasos, todo desde la app de LaU.</p>
          <ol v-reveal class="timeline">
            <li v-for="(step, i) in STEPS" :key="step.title" :style="{ '--d': `${200 + i * 160}ms` }">
              <span class="step-n">{{ i + 1 }}</span>
              <div class="step-card">
                <ion-icon :icon="step.icon"/>
                <b>{{ step.title }}</b>
                <p>{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <!-- BENEFICIOS -->
      <section id="beneficios" class="section soft">
        <div class="container">
          <h2 v-reveal>Lo que ganás al vender en LaU</h2>
          <div class="benefits">
            <article v-for="(b, i) in BENEFITS" :key="b.title" v-reveal class="benefit" :style="{ '--d': `${(i % 3) * 90}ms` }">
              <span class="benefit-icon" :class="b.tone"><ion-icon :icon="b.icon"/></span>
              <b>{{ b.title }}</b>
              <p>{{ b.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- REQUISITOS -->
      <section id="requisitos" class="section">
        <div class="container two">
          <div v-reveal class="req-card">
            <h2>Qué necesitás</h2>
            <ul class="checklist">
              <li v-for="item in REQUIREMENTS" :key="item"><ion-icon :icon="checkmarkCircle"/>{{ item }}</li>
            </ul>
          </div>
          <div v-reveal class="review-card" style="--d: 120ms">
            <h3>Revisión humana de LaU</h3>
            <p>Nuestro equipo revisa cada solicitud. Si falta algo, te lo indicamos en la app y te avisamos por correo cuando tu comercio queda aprobado.</p>
            <div class="status-flow">
              <span class="st st-1"><i/>Enviada</span>
              <span class="st-line"/>
              <span class="st st-2"><i/>En revisión</span>
              <span class="st-line"/>
              <span class="st st-3"><ion-icon :icon="shieldCheckmark"/>Aprobada</span>
            </div>
          </div>
        </div>
      </section>

      <!-- PREGUNTAS -->
      <section id="preguntas" class="section soft">
        <div class="container narrow">
          <h2 v-reveal>Preguntas frecuentes</h2>
          <div class="faq">
            <div v-for="(faq, i) in FAQ" :key="faq.q" v-reveal class="faq-item" :class="{ open: openFaq === i }" :style="{ '--d': `${i * 60}ms` }">
              <button class="faq-q" :aria-expanded="openFaq === i" @click="openFaq = openFaq === i ? null : i">
                {{ faq.q }}<ion-icon :icon="addOutline"/>
              </button>
              <div class="faq-a"><p>{{ faq.a }}</p></div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA FINAL -->
      <section class="section">
        <div class="container">
          <div v-reveal class="cta">
            <div class="aurora small" aria-hidden="true"><i/><i/></div>
            <span class="cta-orb" aria-hidden="true"><i/><i/></span>
            <h2>Sumá tu comercio a LaU</h2>
            <p>Creá tu cuenta, armá tu tienda y enviá tu solicitud. Te acompañamos hasta tu primera venta.</p>
            <button class="btn btn-light" @click="start"><ion-icon :icon="arrowForwardOutline"/>Empezar ahora</button>
          </div>
        </div>
      </section>

      <footer class="foot">
        <img src="/LaU.png" alt="LaU"/>
        <span>© {{ year }} LaU · Hecho por estudiantes en El Salvador</span>
        <router-link to="/">Ir a la app</router-link>
      </footer>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Directive } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  storefrontOutline, shieldCheckmark, logoPaypal, sparklesOutline, ribbonOutline, arrowDownOutline, arrowForwardOutline,
  searchOutline, calculatorOutline, checkmark, checkmarkCircle, addOutline, peopleOutline, bookOutline, bagHandleOutline,
  personAddOutline, documentTextOutline, cashOutline, chatbubblesOutline, statsChartOutline, locationOutline,
  laptopOutline, constructOutline, shirtOutline, briefcaseOutline, hardwareChipOutline,
} from 'ionicons/icons'
import { AuthService } from '@/services/auth'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const year = new Date().getFullYear()
const loggedIn = computed(() => !!AuthService.isAuthenticated())
const scrolled = ref(false)
const openFaq = ref<number | null>(0)
let content: HTMLIonContentElement | null = null

const PILLARS = [
  { icon: peopleOutline, title: 'Comunidad', text: 'Publicaciones, perfiles y chat entre estudiantes de todo el país.' },
  { icon: bookOutline, title: 'Estudio', text: 'Pomodoro, tareas y progreso para organizar la carrera.' },
  { icon: bagHandleOutline, title: 'Marketplace', text: 'Comercios verificados y pagos con PayPal, sin salir de LaU.', featured: true },
]

const CATEGORIES = [
  { icon: bookOutline, name: 'Libros' }, { icon: laptopOutline, name: 'Tecnología' }, { icon: constructOutline, name: 'Materiales' },
  { icon: hardwareChipOutline, name: 'Electrónica' }, { icon: shirtOutline, name: 'Ropa' }, { icon: briefcaseOutline, name: 'Servicios' },
]

const STEPS = [
  { icon: personAddOutline, title: 'Creá tu cuenta y tu tienda', text: 'Nombre, logo, categoría y redes: tu vitrina dentro de LaU.' },
  { icon: documentTextOutline, title: 'Enviá tus datos legales', text: 'Razón social, NIT, NRC si sos sociedad y un documento de respaldo.' },
  { icon: ribbonOutline, title: 'LaU verifica tu comercio', text: 'Revisamos la información y te avisamos por correo al aprobarla.' },
  { icon: cashOutline, title: 'Conectá PayPal y vendé', text: 'Vinculás tu cuenta PayPal Business y recibís los pagos directamente.' },
]

const BENEFITS = [
  { icon: shieldCheckmark, tone: 't-green', title: 'Distintivo verificado', text: 'Tu tienda y tus productos muestran que LaU revisó tu comercio.' },
  { icon: logoPaypal, tone: 't-blue', title: 'Pagos con PayPal', text: 'El estudiante paga en línea y el dinero llega a tu cuenta PayPal.' },
  { icon: sparklesOutline, tone: 't-purple', title: 'Te recomienda el asistente', text: 'Cuando alguien busca lo que vendés, el asistente de LaU puede sugerirte.' },
  { icon: chatbubblesOutline, tone: 't-orange', title: 'Chat con tus clientes', text: 'Coordiná entregas y respondé dudas desde el chat de LaU.' },
  { icon: statsChartOutline, tone: 't-purple', title: 'Panel de ventas', text: 'Pedidos, productos y existencias en un solo lugar.' },
  { icon: locationOutline, tone: 't-green', title: 'Entregas en campus', text: 'Acordá puntos de entrega donde los estudiantes ya están.' },
]

const REQUIREMENTS = [
  'NIT del comercio o del titular',
  'NRC si tu comercio es una sociedad',
  'Escritura, matrícula de comercio o tarjeta de NIT/IVA (PDF o foto)',
  'Cuenta PayPal Business con correo confirmado',
  'Productos útiles para estudiantes universitarios',
]

const FAQ = [
  { q: '¿Quién recibe el dinero de las ventas?', a: 'Tu cuenta de PayPal. Cada pago se dirige a la cuenta del comercio que vende el producto; LaU valida el comercio, el precio y el monto antes de confirmar el cobro.' },
  { q: '¿Puedo vender si soy persona natural?', a: 'Sí. Elegí "Persona natural con negocio" e indicá tu NIT. El NRC solo es obligatorio para sociedades.' },
  { q: '¿Cuánto tarda la verificación?', a: 'El equipo de LaU revisa cada solicitud manualmente. Ves el estado en la app y te avisamos por correo cuando tu comercio queda aprobado.' },
  { q: '¿Qué ve el estudiante al comprar?', a: 'Tu comercio con el distintivo de verificado, el producto, el precio y el total. Confirma la compra y aprueba el pago en PayPal; nada se cobra sin su confirmación.' },
  { q: '¿Cómo funciona el asistente de compras?', a: 'El estudiante cuenta qué necesita y el asistente compara productos reales de comercios verificados. Nunca inventa productos ni precios: muestra lo que tenés publicado.' },
]

/** Aparición suave al entrar en pantalla (una sola vez por elemento). */
const observer = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in')
        observer?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.18 })
  : null

const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('reveal')
    if (observer) observer.observe(el)
    else el.classList.add('is-in')
  },
  unmounted(el) { observer?.unobserve(el) },
}

function onScroll(event: CustomEvent) {
  scrolled.value = (event.detail?.scrollTop ?? 0) > 24
}

async function scrollTo(id: string) {
  const target = document.getElementById(id)
  if (!content || !target) return
  await content.scrollToPoint(0, Math.max(0, target.offsetTop - 72), 600)
}

function start() {
  router.push(loggedIn.value ? '/tabs/marketplace/empresa' : '/welcome')
}

onMounted(() => {
  content = document.querySelector('.business-landing ion-content')
  document.title = 'LaU para comercios · Vendé con PayPal'
})
</script>

<style scoped>
.business-landing ion-content { --background: var(--study-bg); }
.container { max-width: 1120px; margin: 0 auto; padding: 0 20px; }
.container.narrow { max-width: 760px; }

/* Botones */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 0 22px; border-radius: 999px; border: 0; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
.btn:active { transform: scale(.97); }
.btn ion-icon { font-size: 19px; }
.btn-sm { min-height: 40px; padding: 0 16px; font-size: 13px; }
.btn-primary { background: linear-gradient(135deg, #8b45ec, #5b21b6); color: #fff; box-shadow: 0 12px 28px -14px rgba(91, 33, 182, .9); }
.btn-primary:hover { box-shadow: 0 16px 34px -14px rgba(91, 33, 182, 1); transform: translateY(-1px); }
.btn-ghost { background: var(--study-surface); color: var(--study-text); border: 1px solid var(--study-border); }
.btn-light { background: #fff; color: #3b0d7a; }

/* Navegación */
.nav { position: sticky; top: 0; z-index: 20; padding-top: env(safe-area-inset-top); transition: background .3s ease, box-shadow .3s ease, backdrop-filter .3s ease; }
.nav.scrolled { background: color-mix(in srgb, var(--study-bg) 78%, transparent); backdrop-filter: saturate(1.4) blur(14px); box-shadow: 0 1px 0 var(--study-border); }
.nav-inner { max-width: 1120px; margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; gap: 20px; }
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--study-muted); font-size: 13px; font-weight: 700; letter-spacing: .02em; }
.brand img { height: 30px; width: auto; }
.brand span { padding-left: 10px; border-left: 1px solid var(--study-border); }
.nav-links { flex: 1; display: flex; justify-content: center; gap: 26px; }
.nav-links a { color: var(--study-muted); text-decoration: none; font-size: 14px; font-weight: 600; transition: color .2s ease; }
.nav-links a:hover { color: var(--study-text); }

/* Héroe */
.hero { position: relative; overflow: hidden; padding: 28px 0 64px; margin-top: -68px; padding-top: 104px; }
.aurora { position: absolute; inset: 0; pointer-events: none; }
.aurora i { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; animation: drift 18s ease-in-out infinite alternate; }
.aurora i:nth-child(1) { width: 520px; height: 520px; left: -140px; top: -120px; background: #8b45ec; }
.aurora i:nth-child(2) { width: 460px; height: 460px; right: -120px; top: 40px; background: #2853e0; animation-duration: 22s; animation-delay: -6s; }
.aurora i:nth-child(3) { width: 360px; height: 360px; left: 38%; bottom: -200px; background: #76d26b; opacity: .3; animation-duration: 26s; animation-delay: -12s; }
.ion-palette-dark .aurora i { opacity: .35; }
@keyframes drift { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(40px, 30px) scale(1.08); } 100% { transform: translate(-30px, 50px) scale(.95); } }
.grid-mask { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(color-mix(in srgb, var(--study-text) 14%, transparent) 1px, transparent 1px); background-size: 26px 26px; mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%); opacity: .5; }
.hero-inner { position: relative; max-width: 1120px; margin: 0 auto; padding: 0 20px; display: grid; grid-template-columns: 1.05fr .95fr; gap: 48px; align-items: center; }
.pill { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 999px; background: color-mix(in srgb, var(--study-surface) 75%, transparent); border: 1px solid var(--study-border); backdrop-filter: blur(8px); font-size: 13px; font-weight: 700; color: var(--study-purple); }
.hero h1 { margin-top: 18px; font-size: clamp(36px, 5.6vw, 64px); line-height: 1.02; font-weight: 800; letter-spacing: -.045em; }
.grad { background: linear-gradient(100deg, #8b45ec, #2853e0 60%, #8b45ec); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: grad-move 6s linear infinite; }
@keyframes grad-move { to { background-position: 200% center; } }
.lead { margin-top: 18px; font-size: 18px; line-height: 28px; color: var(--study-muted); max-width: 54ch; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.trust { display: flex; flex-wrap: wrap; gap: 10px 22px; list-style: none; padding: 0; margin: 28px 0 0; font-size: 14px; font-weight: 600; color: var(--study-muted); }
.trust li { display: flex; align-items: center; gap: 7px; }
.trust ion-icon { color: var(--study-purple); font-size: 18px; }
.enter { animation: enter .8s cubic-bezier(.2, .8, .2, 1) both; animation-delay: var(--d, 0ms); }
@keyframes enter { from { opacity: 0; transform: translateY(18px); } }

/* Celular de muestra */
.hero-visual { position: relative; display: grid; place-items: center; min-height: 560px; animation: enter 1s cubic-bezier(.2, .8, .2, 1) .25s both; }
.phone { position: relative; width: 290px; height: 560px; border-radius: 46px; padding: 12px; background: #111014; box-shadow: 0 40px 80px -30px rgba(40, 10, 90, .55), inset 0 0 0 2px #2b2833; transform: rotate(-4deg); animation: phone-float 7s ease-in-out infinite; }
@keyframes phone-float { 50% { transform: rotate(-4deg) translateY(-10px); } }
.phone-notch { position: absolute; top: 18px; left: 50%; width: 92px; height: 24px; margin-left: -46px; border-radius: 14px; background: #000; z-index: 2; }
.screen { height: 100%; border-radius: 36px; overflow: hidden; background: #f7f7f4; color: #141416; padding: 52px 14px 14px; display: grid; align-content: start; gap: 12px; }
.screen-top { display: grid; gap: 10px; }
.screen-top img { height: 22px; width: auto; }
.screen-search { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 12px; border-radius: 999px; background: #fff; border: 1px solid rgba(20, 20, 22, .08); font-size: 12px; color: #9e9ea7; }
.screen-search b { margin-left: auto; padding: 5px 10px; border-radius: 999px; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 10px; }
.screen-store { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 16px; background: #fff; }
.screen-store > div { display: grid; gap: 3px; font-size: 12px; }
.logo-dot { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: rgba(123, 50, 217, .1); color: #7b32d9; }
.mini-badge { display: inline-flex; align-items: center; gap: 3px; width: fit-content; padding: 2px 7px; border-radius: 999px; background: rgba(118, 210, 107, .16); color: #2d8024; font-size: 9px; font-weight: 800; }
.screen-product { display: grid; gap: 4px; padding: 12px; border-radius: 18px; background: #fff; font-size: 12px; }
.screen-product span { color: #6e6d7a; }
.screen-product strong { font-size: 20px; letter-spacing: -.02em; }
.product-art { height: 120px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(123, 50, 217, .12), rgba(40, 83, 224, .12)); color: #7b32d9 !important; font-size: 48px; margin-bottom: 6px; }
.pay { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 6px; padding: 9px; border-radius: 999px; background: #ffc439; color: #003087 !important; font-weight: 800; }
.float { position: absolute; display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 18px; background: color-mix(in srgb, var(--study-surface) 92%, transparent); border: 1px solid var(--study-border); backdrop-filter: blur(12px); box-shadow: 0 20px 40px -22px rgba(30, 10, 70, .5); font-size: 12px; color: var(--study-text); }
.float > div { display: grid; gap: 2px; }
.float b { font-size: 13px; }
.float span { color: var(--study-muted); }
.f-order { top: 16%; left: -2%; animation: pop .7s cubic-bezier(.2, 1.4, .4, 1) 1.1s both, bob 6s ease-in-out 2s infinite; }
.f-agent { bottom: 20%; right: -4%; animation: pop .7s cubic-bezier(.2, 1.4, .4, 1) 1.5s both, bob 7s ease-in-out 2.4s infinite; }
.f-badge { top: 6%; right: 6%; padding: 9px 14px; font-weight: 800; color: var(--study-green-ink); gap: 6px; animation: pop .7s cubic-bezier(.2, 1.4, .4, 1) 1.9s both, bob 5s ease-in-out 2.8s infinite; }
@keyframes pop { from { opacity: 0; transform: scale(.7) translateY(10px); } }
@keyframes bob { 50% { transform: translateY(-8px); } }
.ok { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--study-green); color: #fff; font-size: 17px; }
.orb { position: relative; width: 30px; height: 30px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: radial-gradient(circle at 30% 28%, #d8c2ff, #8b45ec 45%, #2853e0); }
.orb i { position: absolute; inset: -35%; background: conic-gradient(from 0deg, transparent 0 25%, rgba(255, 255, 255, .6) 35%, transparent 50%); animation: spin 5s linear infinite; mix-blend-mode: soft-light; }
.orb i + i { animation-duration: 8s; animation-direction: reverse; }
@keyframes spin { to { transform: rotate(360deg); } }
.match { display: inline-flex; align-items: center; gap: 5px; color: var(--study-green-ink) !important; font-weight: 700; }
.match i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

/* Secciones */
.section { position: relative; padding: 72px 0; }
.section.soft { background: linear-gradient(180deg, transparent, var(--study-purple-soft) 30%, var(--study-purple-soft) 70%, transparent); }
.section h2 { font-size: clamp(28px, 4vw, 42px); line-height: 1.08; font-weight: 800; letter-spacing: -.035em; text-align: center; }
.section-lead { margin: 12px auto 0; text-align: center; color: var(--study-muted); font-size: 17px; max-width: 52ch; }
.reveal { opacity: 0; transform: translateY(26px); transition: opacity .8s cubic-bezier(.2, .8, .2, 1), transform .8s cubic-bezier(.2, .8, .2, 1); transition-delay: var(--d, 0ms); }
.reveal.is-in { opacity: 1; transform: none; }

/* Ecosistema */
.pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 40px; }
.pillar { display: grid; gap: 10px; padding: 26px; border-radius: 26px; background: var(--study-surface); border: 1px solid var(--study-border); box-shadow: var(--study-shadow); }
.pillar.featured { background: linear-gradient(var(--study-surface), var(--study-surface)) padding-box, linear-gradient(135deg, #8b45ec, #2853e0) border-box; border: 1.5px solid transparent; }
.pillar-icon { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: var(--study-purple-soft); color: var(--study-purple); font-size: 24px; }
.pillar b { font-size: 19px; }
.pillar p { color: var(--study-muted); font-size: 15px; line-height: 23px; }
.marquee { margin-top: 48px; overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
.marquee-track { display: flex; gap: 12px; width: max-content; animation: marquee 32s linear infinite; }
.marquee-track span { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; background: var(--study-surface); border: 1px solid var(--study-border); font-weight: 700; font-size: 15px; color: var(--study-muted); }
.marquee-track ion-icon { color: var(--study-purple); font-size: 18px; }
@keyframes marquee { to { transform: translateX(-50%); } }

/* Línea de pasos */
.timeline { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; list-style: none; padding: 0; margin: 48px 0 0; }
.timeline::before { content: ''; position: absolute; top: 21px; left: 12%; right: 12%; height: 3px; border-radius: 3px; background: var(--study-track); }
.timeline::after { content: ''; position: absolute; top: 21px; left: 12%; width: 0; height: 3px; border-radius: 3px; background: linear-gradient(90deg, #8b45ec, #2853e0); transition: width 1.6s cubic-bezier(.4, 0, .2, 1) .3s; }
.timeline.is-in::after { width: 76%; }
.timeline.reveal { transform: none; }
.timeline li { position: relative; display: grid; justify-items: center; gap: 14px; text-align: center; opacity: 0; transform: translateY(18px); transition: opacity .7s ease, transform .7s cubic-bezier(.2, .8, .2, 1); transition-delay: var(--d); }
.timeline.is-in li { opacity: 1; transform: none; }
.step-n { position: relative; z-index: 1; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-weight: 800; font-size: 17px; box-shadow: 0 0 0 6px var(--study-bg); }
.step-card { display: grid; justify-items: center; gap: 8px; padding: 22px 18px; border-radius: 22px; background: var(--study-surface); border: 1px solid var(--study-border); height: 100%; }
.step-card ion-icon { font-size: 26px; color: var(--study-purple); }
.step-card b { font-size: 16px; }
.step-card p { color: var(--study-muted); font-size: 14px; line-height: 21px; }

/* Beneficios */
.benefits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 40px; }
.benefit { display: grid; gap: 10px; padding: 24px; border-radius: 24px; background: var(--study-surface); border: 1px solid var(--study-border); transition: transform .3s ease, box-shadow .3s ease, opacity .8s cubic-bezier(.2, .8, .2, 1); }
.benefit:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -26px rgba(60, 20, 120, .5); }
.benefit-icon { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; font-size: 22px; }
.t-green { background: var(--study-green-soft); color: var(--study-green-ink); }
.t-blue { background: var(--study-blue-soft); color: var(--study-blue); }
.t-purple { background: var(--study-purple-soft); color: var(--study-purple); }
.t-orange { background: var(--study-orange-soft); color: var(--study-orange); }
.benefit b { font-size: 17px; }
.benefit p { color: var(--study-muted); font-size: 14px; line-height: 21px; }

/* Requisitos */
.two { display: grid; grid-template-columns: 1.1fr .9fr; gap: 20px; align-items: stretch; }
.req-card, .review-card { padding: 32px; border-radius: 28px; background: var(--study-surface); border: 1px solid var(--study-border); }
.req-card h2 { text-align: left; font-size: clamp(26px, 3vw, 34px); margin-bottom: 20px; }
.checklist { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.checklist li { display: flex; gap: 12px; align-items: flex-start; font-size: 16px; line-height: 23px; }
.checklist ion-icon { flex-shrink: 0; margin-top: 2px; font-size: 20px; color: var(--study-green); }
.review-card { background: linear-gradient(160deg, #2a0f57, #14093a); color: #fff; border: 0; display: grid; align-content: start; gap: 14px; }
.review-card h3 { font-size: 24px; font-weight: 800; letter-spacing: -.02em; }
.review-card p { color: rgba(255, 255, 255, .75); font-size: 15px; line-height: 23px; }
.status-flow { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.st { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; background: rgba(255, 255, 255, .1); font-size: 13px; font-weight: 700; }
.st i { width: 8px; height: 8px; border-radius: 50%; }
.st-1 i { background: #c4b5fd; }
.st-2 i { background: #ffb37a; animation: blink 1.6s ease-in-out infinite; }
.st-3 { background: #76d26b; color: #0f2e0b; }
.st-line { flex: 1; min-width: 14px; height: 2px; background: rgba(255, 255, 255, .25); }
@keyframes blink { 50% { opacity: .35; } }

/* Preguntas */
.faq { display: grid; gap: 10px; margin-top: 32px; }
.faq-item { border-radius: 20px; background: var(--study-surface); border: 1px solid var(--study-border); overflow: hidden; }
.faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 20px; border: 0; background: none; color: var(--study-text); font: inherit; font-size: 16px; font-weight: 700; text-align: left; cursor: pointer; }
.faq-q ion-icon { flex-shrink: 0; font-size: 20px; color: var(--study-purple); transition: transform .35s ease; }
.faq-item.open .faq-q ion-icon { transform: rotate(45deg); }
.faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s cubic-bezier(.2, .8, .2, 1); }
.faq-item.open .faq-a { grid-template-rows: 1fr; }
.faq-a p { overflow: hidden; padding: 0 20px; color: var(--study-muted); font-size: 15px; line-height: 23px; }
.faq-item.open .faq-a p { padding-bottom: 18px; }

/* CTA final */
.cta { position: relative; overflow: hidden; display: grid; justify-items: center; gap: 14px; text-align: center; padding: 56px 24px; border-radius: 34px; background: linear-gradient(135deg, #3b0d7a, #1a0b4a); color: #fff; }
.cta h2 { color: #fff; position: relative; }
.cta p { position: relative; max-width: 48ch; color: rgba(255, 255, 255, .78); font-size: 17px; line-height: 26px; }
.cta .btn { position: relative; margin-top: 8px; }
.aurora.small i:nth-child(1) { width: 380px; height: 380px; left: -120px; top: -160px; opacity: .45; }
.aurora.small i:nth-child(2) { width: 340px; height: 340px; right: -120px; top: auto; bottom: -180px; opacity: .45; }
.cta-orb { position: relative; width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background: radial-gradient(circle at 30% 28%, #e9d5ff, #8b45ec 45%, #2853e0); box-shadow: 0 0 0 10px rgba(255, 255, 255, .06); animation: bob 5s ease-in-out infinite; }
.cta-orb i { position: absolute; inset: -35%; background: conic-gradient(from 0deg, transparent 0 25%, rgba(255, 255, 255, .6) 35%, transparent 50%); animation: spin 6s linear infinite; mix-blend-mode: soft-light; }
.cta-orb i + i { animation-duration: 9s; animation-direction: reverse; }

.foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px 20px; padding: 28px 20px calc(36px + env(safe-area-inset-bottom)); color: var(--study-faint); font-size: 13px; }
.foot img { height: 22px; width: auto; }
.foot a { color: var(--study-purple); font-weight: 700; text-decoration: none; }

@media (max-width: 900px) {
  .nav-links { display: none; }
  .nav-inner { justify-content: space-between; }
  .hero-inner { grid-template-columns: 1fr; gap: 24px; }
  .hero-visual { min-height: 520px; }
  .pillars, .benefits { grid-template-columns: 1fr; }
  .two { grid-template-columns: 1fr; }
  .timeline { grid-template-columns: 1fr; gap: 14px; }
  .timeline::before, .timeline::after { left: 21px; right: auto; top: 22px; bottom: 22px; width: 3px; height: auto; }
  .timeline::after { height: 0; transition: height 1.6s cubic-bezier(.4, 0, .2, 1) .3s; }
  .timeline.is-in::after { width: 3px; height: calc(100% - 44px); }
  .timeline li { grid-template-columns: 44px 1fr; justify-items: start; align-items: start; text-align: left; }
  .step-card { justify-items: start; }
  .f-order { left: 0; top: 10%; }
  .f-agent { right: 0; bottom: 14%; }
  .f-badge { right: 2%; top: 2%; }
}
@media (max-width: 420px) {
  .phone { width: 250px; height: 500px; }
  .hero-visual { min-height: 480px; }
  .float { font-size: 11px; padding: 9px 11px; }
}
@media (prefers-reduced-motion: reduce) {
  .aurora i, .grad, .enter, .hero-visual, .phone, .float, .orb i, .cta-orb, .cta-orb i, .marquee-track, .st-2 i { animation: none !important; }
  .reveal, .timeline li { opacity: 1; transform: none; transition: none; }
  .timeline::after { transition: none; }
}
</style>

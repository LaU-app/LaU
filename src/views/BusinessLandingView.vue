<template>
  <ion-page class="study-ui business-landing">
    <ion-content :scroll-events="true" @ionScroll="onScroll">
      <!-- NAVEGACIÓN -->
      <header class="nav" :class="{ scrolled }">
        <div class="nav-inner">
          <router-link to="/" class="brand" aria-label="LaU, ir a la app">
            <img src="/LaU.png" alt="LaU"/>
            <span>para negocios</span>
          </router-link>
          <nav class="nav-links" aria-label="Secciones">
            <a v-for="link in NAV" :key="link.id" :href="`#${link.id}`" @click.prevent="scrollTo(link.id)">{{ link.label }}</a>
          </nav>
          <button class="btn btn-primary btn-sm" @click="start">
            <span class="wide-only">{{ loggedIn ? 'Ir a mi negocio' : 'Registrar mi negocio' }}</span>
            <span class="narrow-only">{{ loggedIn ? 'Mi negocio' : 'Registrarme' }}</span>
          </button>
        </div>
      </header>

      <main class="page">
        <!-- HÉROE -->
        <section class="hero">
          <div class="hero-bg" aria-hidden="true">
            <i class="glow g1"/><i class="glow g2"/><i class="glow g3"/>
            <svg class="ribbon" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
              <path d="M-80 560 C 120 520 180 260 360 250 S 560 470 720 430 S 900 120 1060 150 S 1260 330 1320 300"/>
            </svg>
            <div class="dots"/>
          </div>

          <div class="hero-inner">
            <div class="hero-copy">
              <h1 class="enter" style="--d: 0ms">
                Llevá tu negocio a
                <span class="la-u-wrap"><span class="la-u">La&nbsp;U</span><svg viewBox="0 0 200 22" aria-hidden="true"><path d="M4 15 C 58 4 138 2 196 12"/></svg></span>
              </h1>
              <p class="lead enter" style="--d: 120ms">Registrá tu negocio, recibí el sello de verificado y vendé a estudiantes dentro de su campus.</p>
              <div class="hero-actions enter" style="--d: 220ms">
                <button class="btn btn-primary btn-lg" @click="start">{{ ctaLabel }}<ion-icon :icon="arrowForward"/></button>
                <a class="btn btn-ghost btn-lg" :href="MAILTO"><ion-icon :icon="mailOutline"/>Escribinos</a>
              </div>
              <ul class="trust enter" style="--d: 320ms">
                <li><ion-icon :icon="shieldCheckmark"/>Verificación legal</li>
                <li><ion-icon :icon="locationOutline"/>Entregas en campus</li>
                <li><ion-icon :icon="logoPaypal"/>PayPal opcional</li>
              </ul>
            </div>

            <!-- Composición: campus isométrico + celular con el marketplace -->
            <div class="hero-visual" aria-hidden="true">
              <svg class="campus" viewBox="-245 -110 490 400">
                <polygon class="plate-l" :points="PLATE.left"/>
                <polygon class="plate-r" :points="PLATE.right"/>
                <polygon class="plate-top" :points="PLATE.top"/>
                <polygon v-for="(w, i) in WALKS" :key="`w${i}`" class="walk" :points="w"/>
                <polygon v-for="(l, i) in LAWNS" :key="`l${i}`" class="lawn" :points="l"/>
                <ellipse class="plaza" :cx="PLAZA.cx" :cy="PLAZA.cy" :rx="PLAZA.rx" :ry="PLAZA.ry"/>
                <ellipse class="zone" :cx="ZONE.cx" :cy="ZONE.cy" :rx="ZONE.rx" :ry="ZONE.ry"/>
                <ellipse class="zone zone-pulse" :cx="ZONE.cx" :cy="ZONE.cy" :rx="ZONE.rx" :ry="ZONE.ry"/>
                <polyline class="route" :points="ROUTE"/>
                <circle v-for="(p, i) in PEOPLE" :key="`p${i}`" class="person" :class="p.tone" :cx="p.cx" :cy="p.cy" r="3.4" :style="{ '--d': `${i * 0.6}s` }"/>
                <g v-for="(b, i) in BLOCKS" :key="`b${i}`" :class="`tone-${b.tone}`">
                  <polygon class="f-left" :points="b.left"/>
                  <polygon class="f-right" :points="b.right"/>
                  <polygon class="f-top" :points="b.top"/>
                  <polyline v-for="(f, k) in b.floors" :key="k" class="floor" :points="f"/>
                </g>
                <g v-for="(t, i) in TREES" :key="`t${i}`" class="tree">
                  <ellipse :cx="t.cx" :cy="t.cy + 2" rx="9" ry="4.5" class="tree-shadow"/>
                  <circle :cx="t.cx" :cy="t.cy - 10" r="9"/>
                </g>
                <g v-for="(pin, i) in PINS" :key="`pin${i}`" :transform="`translate(${pin.x} ${pin.y})`">
                  <g class="pin" :class="pin.tone" :style="{ '--d': `${i * 0.9}s` }">
                    <path d="M0 0 C -9 -11 -13 -17 -13 -25 A 13 13 0 1 1 13 -25 C 13 -17 9 -11 0 0 Z"/>
                    <circle cy="-25" r="5.5"/>
                  </g>
                </g>
              </svg>

              <div class="phone">
                <div class="screen">
                  <div class="s-top"><img src="/LaU.png" alt=""/><span class="s-avatar"/></div>
                  <div class="s-search"><ion-icon :icon="searchOutline"/>Busco una calculadora</div>
                  <div class="s-hint"><ion-icon :icon="sparkles"/>Asistente de compras de LaU</div>
                  <div class="s-card">
                    <div class="s-art"><ion-icon :icon="calculatorOutline"/></div>
                    <b>Calculadora científica</b>
                    <span class="s-store"><ion-icon :icon="shieldCheckmark"/>Papelería Campus</span>
                    <span class="s-meta"><ion-icon :icon="locationOutline"/>Entrega en tu campus</span>
                    <div class="s-actions"><span class="s-btn alt">Apartar</span><span class="s-btn pp"><ion-icon :icon="logoPaypal"/>PayPal</span></div>
                  </div>
                </div>
              </div>

              <div class="chip c-verified"><span class="chip-ic green"><ion-icon :icon="shieldCheckmark"/></span>Comercio verificado</div>
              <div class="chip c-zone"><span class="chip-ic purple"><ion-icon :icon="locationOutline"/></span>Zona de entrega</div>
              <div class="chip c-order"><span class="chip-ic warm"><ion-icon :icon="bagCheckOutline"/></span><span><b>Nuevo pedido</b><small>Entrega en el campus</small></span></div>
            </div>
          </div>
        </section>

        <!-- CÓMO FUNCIONA -->
        <section id="como-funciona" class="section">
          <div class="container">
            <div v-reveal class="head">
              <h2>Tres pasos,<br/>cero vueltas</h2>
              <p>Todo desde la app de LaU.</p>
            </div>
            <ol class="steps">
              <li v-for="(step, i) in STEPS" :key="step.title" v-reveal class="step" :style="{ '--d': `${i * 120}ms` }">
                <span class="step-n">0{{ i + 1 }}</span>
                <span class="step-icon"><ion-icon :icon="step.icon"/></span>
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
                <span v-if="step.tag" class="step-tag"><ion-icon :icon="logoPaypal"/>{{ step.tag }}</span>
              </li>
            </ol>
          </div>
        </section>

        <!-- BENEFICIOS (bento) -->
        <section id="beneficios" class="section">
          <div class="container">
            <div v-reveal class="head">
              <h2>Todo pasa<br/>en el campus</h2>
              <p>Lo que tu negocio ya tiene en LaU.</p>
            </div>

            <div class="bento">
              <!-- Entregas en campus -->
              <article v-reveal class="tile t-delivery">
                <div class="tile-copy">
                  <h3>Entregás dentro del campus</h3>
                  <p>Marcá tus zonas de entrega en el mapa 3D de las universidades de El Salvador.</p>
                </div>
                <svg class="map" viewBox="0 0 420 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect class="map-bg" x="0" y="0" width="420" height="250" rx="22"/>
                  <path class="road" d="M-10 190 C 80 170 120 90 210 100 S 330 190 430 150"/>
                  <path class="road thin" d="M120 -10 C 130 60 90 120 110 260"/>
                  <path class="road thin" d="M300 -10 C 290 70 340 120 320 260"/>
                  <g v-for="(c, i) in MAP_CAMPUSES" :key="i" :transform="`translate(${c.x} ${c.y})`">
                    <rect class="map-campus" x="-34" y="-22" width="68" height="44" rx="12"/>
                    <rect class="map-bldg" x="-22" y="-12" width="18" height="12" rx="3"/>
                    <rect class="map-bldg" x="2" y="-12" width="20" height="20" rx="3"/>
                    <rect class="map-bldg" x="-22" y="4" width="18" height="8" rx="3"/>
                    <circle class="map-ring" r="44" :style="{ '--d': `${i * 0.8}s` }"/>
                    <g class="map-pin" :style="{ '--d': `${i * 0.7}s` }">
                      <path d="M0 -26 C -7 -34 -10 -39 -10 -45 A 10 10 0 1 1 10 -45 C 10 -39 7 -34 0 -26 Z"/>
                      <circle cy="-45" r="4"/>
                    </g>
                  </g>
                </svg>
              </article>

              <!-- Asistente de compras -->
              <article v-reveal class="tile t-assistant" style="--d: 80ms">
                <div class="tile-copy">
                  <h3>Te recomienda el asistente de compras de LaU</h3>
                  <p>Cuando un estudiante busca, sugiere productos de negocios verificados.</p>
                </div>
                <div class="convo" aria-hidden="true">
                  <span class="bubble me">Busco audífonos para estudiar</span>
                  <div class="answer">
                    <span class="answer-head"><ion-icon :icon="sparkles"/>Te recomiendo</span>
                    <div class="answer-item">
                      <span class="answer-art"><ion-icon :icon="headsetOutline"/></span>
                      <span><b>Audífonos con micrófono</b><small><ion-icon :icon="shieldCheckmark"/>Comercio verificado</small></span>
                    </div>
                  </div>
                </div>
              </article>

              <!-- Ferias -->
              <article v-reveal class="tile t-fair" style="--d: 120ms">
                <div class="awning" aria-hidden="true"/>
                <span class="tile-ic warm"><ion-icon :icon="megaphoneOutline"/></span>
                <h3>Ferias en la U</h3>
                <p>Llevá tu stand a ferias dentro del campus, con anuncios en LaU.</p>
              </article>

              <!-- Sello -->
              <article v-reveal class="tile t-badge" style="--d: 160ms">
                <div class="seal" aria-hidden="true"><span class="seal-ring"/><ion-icon :icon="shieldCheckmark"/></div>
                <h3>Sello de confianza</h3>
                <p>Tu tienda y tus productos llevan el distintivo de Comercio verificado.</p>
              </article>

              <!-- Panel -->
              <article v-reveal class="tile t-panel" style="--d: 80ms">
                <div class="tile-copy">
                  <h3>Pedidos y ventas en un panel</h3>
                  <p>Productos, existencias y estados de cada pedido.</p>
                </div>
                <div class="orders" aria-hidden="true">
                  <div v-for="o in ORDERS" :key="o.label" class="order">
                    <span class="order-ic"><ion-icon :icon="o.icon"/></span>
                    <span class="order-line"><i :style="{ width: o.w }"/><i/></span>
                    <span class="status" :class="o.tone">{{ o.label }}</span>
                  </div>
                </div>
              </article>

              <!-- Chat -->
              <article v-reveal class="tile t-chat" style="--d: 140ms">
                <div class="tile-copy">
                  <h3>Chateá con tus clientes</h3>
                  <p>Coordiná la entrega sin salir de LaU.</p>
                </div>
                <div class="chat" aria-hidden="true">
                  <span class="bubble them">¿Me lo entregás en la biblioteca?</span>
                  <span class="bubble me">¡Claro! Te veo al salir de clase.</span>
                  <span class="typing"><i/><i/><i/></span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- PAGOS -->
        <section id="pagos" class="section">
          <div class="container">
            <div v-reveal class="pay-panel">
              <div class="pay-glow" aria-hidden="true"><i/><i/></div>
              <div class="pay-head">
                <h2>Cobrá a tu manera</h2>
                <p>Los pagos en línea son opcionales.</p>
              </div>
              <div class="pay-grid">
                <article class="pay-card">
                  <span class="pay-ic"><ion-icon :icon="bagCheckOutline"/></span>
                  <h3>Apartá y cobrá al entregar</h3>
                  <p>Funciona desde el primer día. El estudiante aparta y paga cuando recibe.</p>
                  <span class="pay-tag">Siempre disponible</span>
                </article>
                <article class="pay-card featured">
                  <span class="pay-ic pp"><ion-icon :icon="logoPaypal"/></span>
                  <h3>PayPal</h3>
                  <p>Pedilo al registrarte o cuando querás. Es una solicitud aparte.</p>
                  <span class="pp-button"><ion-icon :icon="logoPaypal"/>Pagar con PayPal</span>
                </article>
                <article class="pay-card soon">
                  <span class="pay-ic"><ion-icon :icon="extensionPuzzleOutline"/></span>
                  <h3>Tu pasarela</h3>
                  <p>Traé la que ya usás o pedinos que sumemos una nueva.</p>
                  <span class="pay-tag soon-tag">Próximamente</span>
                </article>
              </div>
            </div>
          </div>
        </section>

        <!-- REQUISITOS -->
        <section id="requisitos" class="section">
          <div class="container req">
            <div v-reveal class="req-copy">
              <h2>Papeles en regla,<br/>sello en tu tienda</h2>
              <ul class="docs">
                <li v-for="doc in DOCS" :key="doc.name">
                  <span class="doc-ic"><ion-icon :icon="doc.icon"/></span>
                  <span><b>{{ doc.name }}</b><small>{{ doc.note }}</small></span>
                </li>
              </ul>
              <div class="intl">
                <ion-icon :icon="globeOutline"/>
                <span><b>¿Tu negocio es de otro país?</b> Registralo con la identificación fiscal de tu país.</span>
              </div>
            </div>

            <div v-reveal class="papers" style="--d: 120ms" aria-hidden="true">
              <div v-for="(p, i) in PAPERS" :key="p" class="paper" :class="`p${i + 1}`">
                <span class="paper-title">{{ p }}</span>
                <i/><i/><i/><i class="short"/>
                <span class="paper-sign"/>
              </div>
              <div class="stamp"><ion-icon :icon="shieldCheckmark"/><span>Comercio<br/>verificado</span></div>
            </div>
          </div>
        </section>

        <!-- PREGUNTAS -->
        <section id="preguntas" class="section">
          <div class="container faq-wrap">
            <div v-reveal class="faq-side">
              <h2>Preguntas<br/>frecuentes</h2>
              <p>¿Otra duda? <a :href="MAILTO">Escribinos</a>.</p>
            </div>
            <div class="faq">
              <div v-for="(faq, i) in FAQ" :key="faq.q" v-reveal class="faq-item" :class="{ open: openFaq === i }" :style="{ '--d': `${i * 50}ms` }">
                <button class="faq-q" :aria-expanded="openFaq === i" @click="openFaq = openFaq === i ? null : i">
                  {{ faq.q }}<span class="faq-plus"><ion-icon :icon="addOutline"/></span>
                </button>
                <div class="faq-a"><p>{{ faq.a }}</p></div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA FINAL -->
        <section class="section last">
          <div class="container">
            <div v-reveal class="cta">
              <div class="cta-bg" aria-hidden="true"><i/><i/></div>
              <img class="cta-mark" src="/LaU1.png" alt="" aria-hidden="true"/>
              <h2>Nos vemos en La&nbsp;U</h2>
              <p>Registrá tu negocio y empezá a vender en el campus.</p>
              <div class="cta-actions">
                <button class="btn btn-light btn-lg" @click="start">{{ ctaLabel }}<ion-icon :icon="arrowForward"/></button>
                <a class="btn btn-outline-light btn-lg" :href="MAILTO"><ion-icon :icon="mailOutline"/>{{ EMAIL }}</a>
              </div>
            </div>
          </div>
        </section>

        <footer class="foot">
          <img src="/LaU.png" alt="LaU"/>
          <span>© {{ year }} LaU · Hecho en El Salvador</span>
          <a :href="MAILTO">{{ EMAIL }}</a>
          <router-link to="/">Ir a la app</router-link>
        </footer>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Directive } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  arrowForward, mailOutline, shieldCheckmark, locationOutline, logoPaypal, searchOutline, sparkles, calculatorOutline,
  bagCheckOutline, documentTextOutline, storefrontOutline, megaphoneOutline, headsetOutline, extensionPuzzleOutline,
  globeOutline, idCardOutline, businessOutline, receiptOutline, addOutline, cubeOutline, schoolOutline,
} from 'ionicons/icons'
import { AuthService } from '@/services/auth'
import '@/theme/study.css'

const router = useRouter()
const year = new Date().getFullYear()
const loggedIn = computed(() => !!AuthService.isAuthenticated())
const ctaLabel = computed(() => (loggedIn.value ? 'Ir a mi negocio' : 'Registrar mi negocio'))
const scrolled = ref(false)
const openFaq = ref<number | null>(0)
let content: HTMLIonContentElement | null = null

const EMAIL = 'lauapp.es@gmail.com'
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Quiero vender en LaU')}`

const NAV = [
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'beneficios', label: 'Beneficios' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'preguntas', label: 'Preguntas' },
]

const STEPS = [
  { icon: documentTextOutline, title: 'Registrate', text: 'Creá tu tienda y subí los papeles legales de tu negocio.', tag: '' },
  { icon: shieldCheckmark, title: 'Te verificamos', text: 'Nuestro equipo revisa todo y te da el sello de Comercio verificado.', tag: '' },
  { icon: storefrontOutline, title: 'Vendé', text: 'Publicá productos y recibí pedidos. Cobrá en línea si querés.', tag: 'PayPal opcional' },
]

const ORDERS = [
  { icon: cubeOutline, label: 'Apartado', tone: 'warm', w: '62%' },
  { icon: bagCheckOutline, label: 'Pagado', tone: 'green', w: '48%' },
  { icon: schoolOutline, label: 'Entregado', tone: 'purple', w: '70%' },
]

const DOCS = [
  { icon: documentTextOutline, name: 'NIT', note: 'Del negocio o del titular' },
  { icon: receiptOutline, name: 'NRC / IVA', note: 'Registro de contribuyente' },
  { icon: businessOutline, name: 'Matrícula de comercio o escritura', note: 'Respaldo legal del negocio' },
  { icon: idCardOutline, name: 'DUI del representante', note: 'Quien responde por el negocio' },
]

const PAPERS = ['DUI', 'Matrícula', 'NIT']

const FAQ = [
  { q: '¿Quién puede registrarse?', a: 'Cualquier negocio legal: sociedades o personas naturales con negocio, de El Salvador o de otro país.' },
  { q: '¿Necesito PayPal para vender?', a: 'No. Sin pagos en línea, el estudiante aparta y paga al recibir. PayPal lo pedís al registrarte o cuando querás.' },
  { q: '¿Cuánto tarda la verificación?', a: 'Depende de que tus papeles estén completos. Ves el estado en la app y, si falta algo, te lo decimos.' },
  { q: '¿Dónde se entregan los pedidos?', a: 'Solo dentro de los campus, en las zonas de entrega que marcás en el mapa de LaU.' },
  { q: '¿Cómo me recomienda el asistente?', a: 'Cuando un estudiante busca algo, el asistente de compras de LaU le sugiere productos de negocios verificados. Solo muestra lo que tenés publicado.' },
  { q: 'Soy estudiante y tengo un emprendimiento', a: 'Podés abrirlo con nombre y logo, sin papeles. No lleva sello de verificado ni recibe pagos en línea.' },
]

/* ---------- Campus isométrico del héroe ---------- */
type P3 = readonly [number, number, number]
const U = 26
const proj = ([x, y, z]: P3): [number, number] => [(x - y) * 0.866 * U, (x + y) * 0.5 * U - z * U]
const pts = (list: P3[]) => list.map((p) => proj(p).map((n) => n.toFixed(1)).join(',')).join(' ')
const quad = (x: number, y: number, w: number, d: number, z = 0) => pts([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]])
/** Círculo en el suelo visto en isométrico (elipse). */
const groundEllipse = (x: number, y: number, r: number) => {
  const [cx, cy] = proj([x, y, 0])
  return { cx, cy, rx: r * 1.2247 * U, ry: r * 0.7071 * U }
}

const PLATE = {
  top: quad(0, 0, 10, 10),
  left: pts([[0, 10, 0], [10, 10, 0], [10, 10, -0.6], [0, 10, -0.6]]),
  right: pts([[10, 0, 0], [10, 10, 0], [10, 10, -0.6], [10, 0, -0.6]]),
}
const WALKS = [quad(4.45, 0.2, 1.1, 9.6), quad(0.2, 4.45, 9.6, 1.1)]
const LAWNS = [quad(0.6, 3.3, 3.3, 0.8), quad(6.2, 6.1, 3.2, 0.5), quad(3.2, 6.1, 0.8, 3.3)]
const PLAZA = groundEllipse(5, 5, 1.35)
const ZONE = groundEllipse(5, 5, 2.05)
const ROUTE = pts([[8.1, 4.15, 0], [8.1, 5, 0], [6.4, 5, 0]])

interface Block { x: number; y: number; w: number; d: number; h: number; tone: 'lilac' | 'purple' | 'warm'; floors: number }
const RAW_BLOCKS: Block[] = [
  { x: 0.7, y: 0.7, w: 3, d: 2.3, h: 3, tone: 'purple', floors: 4 },
  { x: 6.2, y: 0.7, w: 3.1, d: 2, h: 1.9, tone: 'lilac', floors: 3 },
  { x: 7.4, y: 3.1, w: 1.4, d: 1, h: 0.9, tone: 'warm', floors: 1 },
  { x: 0.7, y: 6.3, w: 2.3, d: 3, h: 2.3, tone: 'lilac', floors: 3 },
  { x: 6.4, y: 6.9, w: 2.9, d: 2.4, h: 1.3, tone: 'lilac', floors: 2 },
]
// Orden del pintor: primero lo que está más atrás.
const BLOCKS = [...RAW_BLOCKS]
  .sort((a, b) => (a.x + a.y + (a.w + a.d) / 2) - (b.x + b.y + (b.w + b.d) / 2))
  .map(({ x, y, w, d, h, tone, floors }) => ({
    tone,
    top: quad(x, y, w, d, h),
    left: pts([[x, y + d, h], [x + w, y + d, h], [x + w, y + d, 0], [x, y + d, 0]]),
    right: pts([[x + w, y, h], [x + w, y + d, h], [x + w, y + d, 0], [x + w, y, 0]]),
    floors: Array.from({ length: floors - 1 }, (_, k) => {
      const z = (h * (k + 1)) / floors
      return pts([[x, y + d, z], [x + w, y + d, z], [x + w, y, z]])
    }),
  }))

const TREES = ([[1, 4.05], [2.3, 4.1], [3.6, 3.95], [3.6, 6.6], [3.65, 8.9], [9.2, 6.35], [7.1, 6.4], [9.4, 3.6]] as const)
  .map(([x, y]) => { const [cx, cy] = proj([x, y, 0]); return { cx, cy } })

const PEOPLE = ([[5, 1.8, 'purple'], [5.1, 8.4, 'warm'], [1.9, 5, 'warm'], [8.9, 4.95, 'purple'], [5.95, 5.6, 'green']] as const)
  .map(([x, y, tone]) => { const [cx, cy] = proj([x, y, 0]); return { cx, cy: cy - 3, tone } })

const PINS = [
  { at: [8.1, 3.6, 0.9] as P3, tone: 'warm' },
  { at: [5, 5, 0] as P3, tone: 'purple' },
].map(({ at, tone }) => { const [x, y] = proj(at); return { x, y, tone } })

/* ---------- Mapa de la tarjeta de entregas ---------- */
const MAP_CAMPUSES = [{ x: 96, y: 150 }, { x: 222, y: 92 }, { x: 330, y: 168 }]

/** Aparición suave al entrar en pantalla (una sola vez por elemento). */
const observer = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in')
        observer?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.15 })
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
  const scroller = await content.getScrollElement()
  const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 72
  await content.scrollToPoint(0, Math.max(0, top), 600)
}

/** CTA principal: con sesión va directo al panel del negocio; sin sesión, a iniciar sesión (desde ahí se crea la cuenta). */
function start() {
  router.push(loggedIn.value ? '/tabs/marketplace/empresa' : '/login')
}

onMounted(() => {
  content = document.querySelector('.business-landing ion-content')
  document.title = 'LaU para negocios · Vendé en el campus'
})
</script>

<style scoped>
/* ---------- Tokens de la página (claro / oscuro) ---------- */
.business-landing {
  --bl-bg: #f7f6f2;
  --bl-surface: #ffffff;
  --bl-surface-2: #fbfaf7;
  --bl-text: #141416;
  --bl-muted: #6e6d7a;
  --bl-faint: #a09fab;
  --bl-border: rgba(20, 20, 22, .08);
  --bl-purple: #8a2be2;
  --bl-purple-ink: #6b1fc4;
  --bl-purple-soft: rgba(138, 43, 226, .08);
  --bl-blue: #2853e0;
  --bl-warm: #ff8a3d;
  --bl-warm-ink: #c85a12;
  --bl-warm-soft: rgba(255, 138, 61, .12);
  --bl-green: #76d26b;
  --bl-green-ink: #2d8024;
  --bl-green-soft: rgba(118, 210, 107, .16);
  --bl-shadow: 0 1px 2px rgba(20, 20, 22, .04), 0 24px 48px -32px rgba(60, 20, 120, .28);
  /* Campus isométrico */
  --plate-top: #fdfbff; --plate-l: #e7ddf8; --plate-r: #d6c6f2;
  --walk: #f0e8fc; --lawn: #dcf1d3; --tree: #8fd685; --tree-shadow: rgba(60, 20, 120, .08);
  --lilac-top: #ffffff; --lilac-l: #ece3fb; --lilac-r: #dccdf5;
  --purple-top: #b98af5; --purple-l: #8a2be2; --purple-r: #6b1fc4;
  --warm-top: #ffd6b3; --warm-l: #ff9a57; --warm-r: #ea7631;
  --floor: rgba(255, 255, 255, .55);
  --map-bg: #f3eefb; --map-road: #ffffff; --map-campus: #e4d7f8; --map-bldg: #c9b0f2;
}
.ion-palette-dark .business-landing {
  --bl-bg: #111013;
  --bl-surface: #1c1a20;
  --bl-surface-2: #18161c;
  --bl-text: #f5f4f0;
  --bl-muted: #b2b1bd;
  --bl-faint: #85848f;
  --bl-border: rgba(255, 255, 255, .09);
  --bl-purple: #b57cff;
  --bl-purple-ink: #c9a2ff;
  --bl-purple-soft: rgba(181, 124, 255, .13);
  --bl-blue: #87a5ff;
  --bl-warm: #ff9a52;
  --bl-warm-ink: #ffb07a;
  --bl-warm-soft: rgba(255, 154, 82, .13);
  --bl-green-ink: #90dc83;
  --bl-green-soft: rgba(118, 210, 107, .13);
  --bl-shadow: 0 1px 2px rgba(0, 0, 0, .3), 0 24px 48px -30px rgba(0, 0, 0, .7);
  --plate-top: #26222f; --plate-l: #1b1823; --plate-r: #15131b;
  --walk: #312b3d; --lawn: #22392a; --tree: #4f9a49; --tree-shadow: rgba(0, 0, 0, .3);
  --lilac-top: #3d364c; --lilac-l: #2d2839; --lilac-r: #24202e;
  --purple-top: #a874f0; --purple-l: #7a26cf; --purple-r: #5c1aa6;
  --warm-top: #ffc79c; --warm-l: #f08746; --warm-r: #cf6728;
  --floor: rgba(255, 255, 255, .16);
  --map-bg: #201d27; --map-road: #2f2a3a; --map-campus: #2d2640; --map-bldg: #4a3b6a;
}
.business-landing ion-content { --background: var(--bl-bg); --color: var(--bl-text); }
.page { overflow-x: clip; color: var(--bl-text); }
.container { max-width: 1160px; margin: 0 auto; padding: 0 20px; }

/* ---------- Botones ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 20px; border-radius: 999px; border: 0; font: inherit; font-size: 15px; font-weight: 700; letter-spacing: -.01em; white-space: nowrap; cursor: pointer; text-decoration: none; transition: transform .25s cubic-bezier(.2, .8, .2, 1), box-shadow .25s ease, background-color .25s ease; }
.btn ion-icon { font-size: 19px; }
.btn-lg { min-height: 54px; padding: 0 26px; font-size: 16px; }
.btn-sm { min-height: 40px; padding: 0 16px; font-size: 13px; }
.btn-primary { background: linear-gradient(135deg, #9a3cf0, #6b1fc4); color: #fff; box-shadow: 0 14px 30px -14px rgba(107, 31, 196, .85), inset 0 1px 0 rgba(255, 255, 255, .25); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 20px 36px -14px rgba(107, 31, 196, .95), inset 0 1px 0 rgba(255, 255, 255, .25); }
.btn-primary ion-icon { transition: transform .25s ease; }
.btn-primary:hover ion-icon { transform: translateX(3px); }
.btn-ghost { background: var(--bl-surface); color: var(--bl-text); border: 1px solid var(--bl-border); box-shadow: var(--bl-shadow); }
.btn-ghost:hover { transform: translateY(-2px); }
.btn-ghost ion-icon { color: var(--bl-purple); }
.btn-light { background: #fff; color: #3d0c80; box-shadow: 0 16px 30px -16px rgba(0, 0, 0, .5); }
.btn-light:hover { transform: translateY(-2px); }
.btn-outline-light { background: rgba(255, 255, 255, .08); color: #fff; border: 1px solid rgba(255, 255, 255, .3); }
.btn-outline-light:hover { background: rgba(255, 255, 255, .16); }
.narrow-only { display: none; }

/* ---------- Navegación ---------- */
.nav { position: sticky; top: 0; z-index: 30; padding-top: env(safe-area-inset-top); transition: background-color .3s ease, box-shadow .3s ease; }
.nav.scrolled { background: color-mix(in srgb, var(--bl-bg) 80%, transparent); backdrop-filter: saturate(1.5) blur(16px); -webkit-backdrop-filter: saturate(1.5) blur(16px); box-shadow: 0 1px 0 var(--bl-border); }
.nav-inner { max-width: 1160px; margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; gap: 20px; }
.brand { display: flex; align-items: center; gap: 10px; color: var(--bl-muted); font-size: 13px; font-weight: 700; }
.brand img { height: 30px; width: auto; }
.brand span { padding-left: 10px; border-left: 1px solid var(--bl-border); white-space: nowrap; }
.nav-links { flex: 1; display: flex; justify-content: center; gap: 28px; }
.nav-links a { color: var(--bl-muted); font-size: 14px; font-weight: 600; transition: color .2s ease; }
.nav-links a:hover { color: var(--bl-text); }

/* ---------- Héroe ---------- */
.hero { position: relative; margin-top: -70px; padding: 118px 0 72px; }
.hero-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; -webkit-mask-image: linear-gradient(#000 70%, transparent); mask-image: linear-gradient(#000 70%, transparent); }
.glow { position: absolute; border-radius: 50%; filter: blur(80px); animation: drift 20s ease-in-out infinite alternate; }
.g1 { width: 560px; height: 560px; left: -180px; top: -200px; background: rgba(138, 43, 226, .32); }
.g2 { width: 480px; height: 480px; right: -140px; top: 60px; background: rgba(255, 138, 61, .22); animation-duration: 24s; animation-delay: -8s; }
.g3 { width: 420px; height: 420px; left: 35%; bottom: -260px; background: rgba(40, 83, 224, .16); animation-duration: 28s; animation-delay: -14s; }
.ion-palette-dark .g1 { background: rgba(138, 43, 226, .4); }
.ion-palette-dark .g2 { background: rgba(255, 138, 61, .14); }
@keyframes drift { 50% { transform: translate(40px, 30px) scale(1.08); } 100% { transform: translate(-30px, 50px) scale(.95); } }
.ribbon { position: absolute; inset: 0; width: 100%; height: 100%; }
.ribbon path { fill: none; stroke: var(--bl-purple); stroke-width: 70; stroke-linecap: round; opacity: .07; animation: fade-in 2.4s ease .2s both; }
.ion-palette-dark .ribbon path { opacity: .045; }
@keyframes fade-in { from { opacity: 0; } }
.dots { position: absolute; inset: 0; background-image: radial-gradient(color-mix(in srgb, var(--bl-text) 16%, transparent) 1px, transparent 1px); background-size: 24px 24px; mask-image: radial-gradient(ellipse 60% 55% at 70% 40%, #000 20%, transparent 75%); -webkit-mask-image: radial-gradient(ellipse 60% 55% at 70% 40%, #000 20%, transparent 75%); opacity: .55; }

.hero-inner { position: relative; max-width: 1160px; margin: 0 auto; padding: 0 20px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 32px; align-items: center; }
.hero h1 { font-size: clamp(44px, 6.4vw, 86px); line-height: .98; font-weight: 800; letter-spacing: -.055em; color: var(--bl-text); text-wrap: balance; }
.la-u-wrap { position: relative; display: inline-block; white-space: nowrap; }
.la-u { background: linear-gradient(100deg, #9a3cf0 10%, #6b1fc4 45%, #ff8a3d 95%); -webkit-background-clip: text; background-clip: text; color: transparent; padding-right: .04em; }
.la-u-wrap svg { position: absolute; left: .02em; width: 100%; bottom: -.14em; height: auto; overflow: visible; transform-origin: left center; animation: swoosh .9s cubic-bezier(.6, 0, .2, 1) .8s both; }
@keyframes swoosh { from { transform: scaleX(0); opacity: 0; } }
.la-u-wrap path { fill: none; stroke: var(--bl-warm); stroke-width: 6; stroke-linecap: round; }
.lead { margin-top: 26px; font-size: clamp(17px, 1.5vw, 20px); line-height: 1.5; color: var(--bl-muted); max-width: 30em; text-wrap: pretty; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.trust { display: flex; flex-wrap: wrap; gap: 10px 22px; list-style: none; padding: 0; margin: 30px 0 0; font-size: 14px; font-weight: 600; color: var(--bl-muted); }
.trust li { display: flex; align-items: center; gap: 7px; }
.trust ion-icon { color: var(--bl-purple); font-size: 18px; }
.enter { animation: enter .9s cubic-bezier(.2, .8, .2, 1) both; animation-delay: var(--d, 0ms); }
@keyframes enter { from { opacity: 0; transform: translateY(20px); } }

/* Composición visual: todo se escala con el ancho del contenedor (cqw) */
.hero-visual { position: relative; width: 100%; max-width: 620px; justify-self: end; aspect-ratio: 1 / .86; container-type: inline-size; animation: enter 1.1s cubic-bezier(.2, .8, .2, 1) .2s both; }
.campus { position: absolute; top: 0; right: -2%; width: 94%; height: auto; overflow: visible; filter: drop-shadow(0 30px 40px rgba(60, 20, 120, .18)); }
.ion-palette-dark .campus { filter: drop-shadow(0 30px 40px rgba(0, 0, 0, .5)); }
.campus polygon, .campus ellipse { stroke-linejoin: round; }
.plate-top { fill: var(--plate-top); stroke: var(--plate-top); stroke-width: 8; }
.plate-l { fill: var(--plate-l); stroke: var(--plate-l); stroke-width: 8; }
.plate-r { fill: var(--plate-r); stroke: var(--plate-r); stroke-width: 8; }
.walk { fill: var(--walk); }
.lawn { fill: var(--lawn); stroke: var(--lawn); stroke-width: 6; }
.plaza { fill: var(--walk); }
.zone { fill: rgba(138, 43, 226, .07); stroke: var(--bl-purple); stroke-width: 1.6; stroke-dasharray: 5 5; }
.zone-pulse { fill: none; stroke-dasharray: none; stroke-width: 1.2; transform-box: fill-box; transform-origin: center; animation: ring 3.2s ease-out infinite; }
@keyframes ring { from { transform: scale(.7); opacity: .8; } to { transform: scale(1.35); opacity: 0; } }
.route { fill: none; stroke: var(--bl-warm); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 2 7; animation: march 1.2s linear infinite; }
@keyframes march { to { stroke-dashoffset: -18; } }
.person { fill: var(--bl-purple); animation: breathe 2.4s ease-in-out infinite; animation-delay: var(--d); transform-box: fill-box; transform-origin: center; }
.person.warm { fill: var(--bl-warm); }
.person.green { fill: var(--bl-green); }
@keyframes breathe { 50% { transform: scale(1.35); } }
.tone-lilac .f-top { fill: var(--lilac-top); } .tone-lilac .f-left { fill: var(--lilac-l); } .tone-lilac .f-right { fill: var(--lilac-r); }
.tone-purple .f-top { fill: var(--purple-top); } .tone-purple .f-left { fill: var(--purple-l); } .tone-purple .f-right { fill: var(--purple-r); }
.tone-warm .f-top { fill: var(--warm-top); } .tone-warm .f-left { fill: var(--warm-l); } .tone-warm .f-right { fill: var(--warm-r); }
.f-top, .f-left, .f-right { stroke: rgba(255, 255, 255, .35); stroke-width: .6; }
.floor { fill: none; stroke: var(--floor); stroke-width: 1.4; }
.tree circle { fill: var(--tree); }
.tree-shadow { fill: var(--tree-shadow) !important; }
.pin { animation: hover 3.2s ease-in-out infinite; animation-delay: var(--d); }
.pin path { fill: var(--bl-purple); }
.pin.warm path { fill: var(--bl-warm); }
.pin circle { fill: #fff; }
@keyframes hover { 50% { transform: translateY(-6px); } }

.phone { position: absolute; left: 0; bottom: 0; width: 35cqw; aspect-ratio: 9 / 18.6; padding: 1.5cqw; border-radius: 6.4cqw; background: #121116; box-shadow: 0 40px 70px -30px rgba(40, 10, 90, .6), inset 0 0 0 .35cqw #2c2934; transform: rotate(-5deg); animation: float 7s ease-in-out infinite; }
.ion-palette-dark .phone { background: #0b0a0d; box-shadow: 0 40px 70px -30px rgba(0, 0, 0, .8), inset 0 0 0 .35cqw #3b3746, 0 0 0 1px rgba(255, 255, 255, .1); }
@keyframes float { 50% { transform: rotate(-5deg) translateY(-1.6cqw); } }
.phone::before { content: ''; position: absolute; top: 3.2cqw; left: 50%; width: 11cqw; height: 3cqw; margin-left: -5.5cqw; border-radius: 2cqw; background: #000; z-index: 2; }
.screen { height: 100%; border-radius: 5cqw; overflow: hidden; background: var(--bl-bg); color: var(--bl-text); padding: 7.6cqw 2.4cqw 2.4cqw; display: flex; flex-direction: column; gap: 1.6cqw; font-size: 1.9cqw; }
.s-top { display: flex; align-items: center; justify-content: space-between; }
.s-top img { height: 3.4cqw; width: auto; }
.s-avatar { width: 4.4cqw; height: 4.4cqw; border-radius: 50%; background: linear-gradient(135deg, #ffd6b3, #ff9a57); }
.s-search { display: flex; align-items: center; gap: 1cqw; padding: 1.4cqw 2cqw; border-radius: 99px; background: var(--bl-surface); border: 1px solid var(--bl-border); color: var(--bl-muted); white-space: nowrap; overflow: hidden; }
.s-search ion-icon { font-size: 2.4cqw; }
.s-hint { display: flex; align-items: center; gap: .8cqw; font-weight: 700; color: var(--bl-purple); font-size: 1.7cqw; }
.s-card { display: flex; flex-direction: column; gap: .7cqw; padding: 1.8cqw; border-radius: 3.4cqw; background: var(--bl-surface); border: 1px solid var(--bl-border); }
.s-art { height: 15cqw; border-radius: 2.4cqw; display: grid; place-items: center; background: linear-gradient(135deg, rgba(138, 43, 226, .16), rgba(255, 138, 61, .16)); color: var(--bl-purple); font-size: 7cqw; margin-bottom: .6cqw; }
.s-card b { font-size: 2.2cqw; letter-spacing: -.02em; }
.s-store { display: inline-flex; align-items: center; gap: .6cqw; color: var(--bl-green-ink); font-weight: 700; font-size: 1.7cqw; }
.s-meta { display: inline-flex; align-items: center; gap: .6cqw; color: var(--bl-muted); font-size: 1.7cqw; }
.s-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1cqw; margin-top: 1cqw; }
.s-btn { display: flex; align-items: center; justify-content: center; gap: .5cqw; padding: 1.3cqw 0; border-radius: 99px; font-weight: 800; font-size: 1.7cqw; }
.s-btn.alt { background: var(--bl-purple-soft); color: var(--bl-purple); }
.s-btn.pp { background: #ffc439; color: #003087; }

.chip { position: absolute; z-index: 3; display: flex; align-items: center; gap: 1.6cqw; padding: 1.4cqw 2.2cqw 1.4cqw 1.4cqw; border-radius: 99px; background: color-mix(in srgb, var(--bl-surface) 90%, transparent); border: 1px solid var(--bl-border); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 18px 36px -20px rgba(40, 10, 90, .45); font-size: clamp(10px, 2.2cqw, 14px); font-weight: 700; color: var(--bl-text); white-space: nowrap; }
.chip > span:last-child:not(.chip-ic) { display: grid; gap: .2cqw; }
.chip small { font-size: .82em; font-weight: 600; color: var(--bl-muted); }
.chip-ic { width: clamp(22px, 5cqw, 32px); height: clamp(22px, 5cqw, 32px); border-radius: 50%; display: grid; place-items: center; font-size: clamp(12px, 2.8cqw, 18px); color: #fff; }
.chip-ic.green { background: var(--bl-green); }
.chip-ic.purple { background: var(--bl-purple); }
.chip-ic.warm { background: var(--bl-warm); }
.c-verified { top: 31%; right: 0; animation: pop .7s cubic-bezier(.2, 1.4, .4, 1) 1.1s both, bob 6s ease-in-out 2s infinite; }
.c-zone { top: 64%; right: 24%; animation: pop .7s cubic-bezier(.2, 1.4, .4, 1) 1.4s both, bob 7s ease-in-out 2.3s infinite; }
.c-order { top: 6%; left: 2%; border-radius: 22px; animation: pop .7s cubic-bezier(.2, 1.4, .4, 1) 1.7s both, bob 5.5s ease-in-out 2.6s infinite; }
@keyframes pop { from { opacity: 0; transform: scale(.7) translateY(10px); } }
@keyframes bob { 50% { transform: translateY(-6px); } }

/* ---------- Secciones ---------- */
.section { position: relative; padding: 84px 0; }
.section h2 { font-size: clamp(34px, 4.6vw, 56px); line-height: 1; font-weight: 800; letter-spacing: -.045em; color: var(--bl-text); }
.section h3 { font-size: 19px; line-height: 1.2; font-weight: 800; letter-spacing: -.025em; color: var(--bl-text); }
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 40px; }
.head p { color: var(--bl-muted); font-size: 17px; padding-bottom: 6px; }
.reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.2, .8, .2, 1), transform .8s cubic-bezier(.2, .8, .2, 1); transition-delay: var(--d, 0ms); }
.reveal.is-in { opacity: 1; transform: none; }

/* ---------- Pasos ---------- */
.steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; list-style: none; padding: 0; margin: 0; }
.step { position: relative; display: flex; flex-direction: column; gap: 12px; padding: 30px 28px 32px; border-radius: 30px; background: var(--bl-surface); border: 1px solid var(--bl-border); box-shadow: var(--bl-shadow); overflow: hidden; }
.step-n { position: absolute; top: 14px; right: 22px; font-size: 76px; line-height: 1; font-weight: 800; letter-spacing: -.06em; color: transparent; -webkit-text-stroke: 1.5px color-mix(in srgb, var(--bl-purple) 28%, transparent); }
.step-icon { width: 54px; height: 54px; border-radius: 18px; display: grid; place-items: center; font-size: 26px; color: #fff; background: linear-gradient(135deg, #9a3cf0, #6b1fc4); box-shadow: 0 12px 24px -12px rgba(107, 31, 196, .8); margin-bottom: 18px; }
.step:nth-child(2) .step-icon { background: linear-gradient(135deg, #8fdc85, #3fa535); box-shadow: 0 12px 24px -12px rgba(45, 128, 36, .7); }
.step:nth-child(3) .step-icon { background: linear-gradient(135deg, #ffad6e, #ef7a2e); box-shadow: 0 12px 24px -12px rgba(200, 90, 18, .7); }
.step h3 { font-size: 26px; letter-spacing: -.035em; }
.step p { color: var(--bl-muted); font-size: 15px; line-height: 1.5; max-width: 24em; }
.step-tag { display: inline-flex; align-items: center; gap: 6px; width: fit-content; margin-top: 4px; padding: 6px 12px; border-radius: 99px; background: var(--bl-purple-soft); color: var(--bl-purple); font-size: 13px; font-weight: 700; }

/* ---------- Bento ---------- */
.bento { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: minmax(250px, auto); gap: 18px; }
.tile { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 10px; padding: 26px; border-radius: 30px; background: var(--bl-surface); border: 1px solid var(--bl-border); box-shadow: var(--bl-shadow); transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s ease, opacity .8s cubic-bezier(.2, .8, .2, 1); }
.tile.is-in:hover { transform: translateY(-4px); }
.tile p { color: var(--bl-muted); font-size: 15px; line-height: 1.45; }
.tile-copy { display: grid; gap: 8px; max-width: 30em; }
.tile-ic { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; font-size: 22px; margin-top: auto; }
.tile-ic.warm { background: var(--bl-warm-soft); color: var(--bl-warm-ink); }
.t-delivery { grid-column: span 2; grid-row: span 2; background: linear-gradient(180deg, var(--bl-surface), var(--bl-surface-2)); }
.t-assistant { grid-column: span 2; }
.t-panel { grid-column: span 2; }
.t-chat { grid-column: span 2; }

.map { flex: 1 1 auto; width: 100%; height: auto; min-height: 210px; margin-top: 8px; border-radius: 22px; }
.map-bg { fill: var(--map-bg); }
.road { fill: none; stroke: var(--map-road); stroke-width: 14; stroke-linecap: round; }
.road.thin { stroke-width: 8; }
.map-campus { fill: var(--map-campus); }
.map-bldg { fill: var(--map-bldg); }
.map-ring { fill: rgba(138, 43, 226, .06); stroke: var(--bl-purple); stroke-width: 1.5; stroke-dasharray: 5 5; transform-box: fill-box; transform-origin: center; animation: ring-soft 3.4s ease-in-out infinite; animation-delay: var(--d); }
@keyframes ring-soft { 50% { transform: scale(1.08); } }
.map-pin { animation: hover 3s ease-in-out infinite; animation-delay: var(--d); }
.map-pin path { fill: var(--bl-purple); }
.map-pin circle { fill: #fff; }
.map g:nth-of-type(2) .map-pin path { fill: var(--bl-warm); }

.convo { margin-top: auto; display: grid; gap: 10px; }
.bubble { width: fit-content; max-width: 88%; padding: 10px 14px; border-radius: 18px; font-size: 14px; font-weight: 600; line-height: 1.35; }
.bubble.me { justify-self: end; background: linear-gradient(135deg, #9a3cf0, #6b1fc4); color: #fff; border-bottom-right-radius: 6px; }
.bubble.them { background: var(--bl-bg); color: var(--bl-text); border: 1px solid var(--bl-border); border-bottom-left-radius: 6px; }
.answer { display: grid; gap: 8px; max-width: 360px; padding: 12px; border-radius: 20px; background: var(--bl-bg); border: 1px solid var(--bl-border); }
.answer-head { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; color: var(--bl-purple); }
.answer-head ion-icon { animation: twinkle 2.4s ease-in-out infinite; }
@keyframes twinkle { 50% { transform: scale(1.25) rotate(12deg); } }
.answer-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 14px; background: var(--bl-surface); }
.answer-item > span:last-child { display: grid; gap: 2px; min-width: 0; }
.answer-item b { font-size: 14px; }
.answer-item small { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--bl-green-ink); }
.answer-art { width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px; display: grid; place-items: center; font-size: 22px; color: var(--bl-purple); background: linear-gradient(135deg, rgba(138, 43, 226, .14), rgba(255, 138, 61, .14)); }

.t-fair { padding-top: 58px; }
.awning { position: absolute; top: 0; left: 0; right: 0; height: 34px; background: repeating-linear-gradient(90deg, var(--bl-warm) 0 28px, #9a3cf0 28px 56px); -webkit-mask: radial-gradient(14px 12px at 14px 22px, #000 98%, transparent) 0 0 / 28px 100% repeat-x, linear-gradient(#000, #000) 0 0 / 100% 22px no-repeat; mask: radial-gradient(14px 12px at 14px 22px, #000 98%, transparent) 0 0 / 28px 100% repeat-x, linear-gradient(#000, #000) 0 0 / 100% 22px no-repeat; }
.ion-palette-dark .awning { background: repeating-linear-gradient(90deg, #e07a38 0 28px, #7a26cf 28px 56px); }
.t-fair .tile-ic { margin: 0 0 6px; }

.t-badge { background: radial-gradient(120% 90% at 50% 0%, var(--bl-green-soft), transparent 60%), var(--bl-surface); }
.seal { position: relative; width: 66px; height: 66px; display: grid; place-items: center; margin-bottom: 8px; font-size: 32px; color: #fff; }
.seal::before { content: ''; position: absolute; inset: 7px; border-radius: 50%; background: linear-gradient(135deg, #8fdc85, #3fa535); box-shadow: 0 12px 24px -10px rgba(45, 128, 36, .7); }
.seal ion-icon { position: relative; }
.seal-ring { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(var(--bl-green) 0 12%, transparent 12% 25%, var(--bl-green) 25% 37%, transparent 37% 50%, var(--bl-green) 50% 62%, transparent 62% 75%, var(--bl-green) 75% 87%, transparent 87%); -webkit-mask: radial-gradient(circle, transparent 29px, #000 30px); mask: radial-gradient(circle, transparent 29px, #000 30px); opacity: .55; animation: spin 14s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.orders { margin-top: auto; display: grid; gap: 8px; }
.order { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px; background: var(--bl-bg); border: 1px solid var(--bl-border); }
.order-ic { width: 34px; height: 34px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--bl-surface); color: var(--bl-muted); font-size: 17px; }
.order-line { flex: 1; display: grid; gap: 6px; min-width: 0; }
.order-line i { display: block; height: 7px; border-radius: 9px; background: var(--bl-border); }
.order-line i:first-child { background: color-mix(in srgb, var(--bl-text) 16%, transparent); }
.order-line i:last-child { width: 34%; }
.status { flex-shrink: 0; padding: 5px 10px; border-radius: 99px; font-size: 12px; font-weight: 800; }
.status.warm { background: var(--bl-warm-soft); color: var(--bl-warm-ink); }
.status.green { background: var(--bl-green-soft); color: var(--bl-green-ink); }
.status.purple { background: var(--bl-purple-soft); color: var(--bl-purple); }

.chat { margin-top: auto; display: grid; gap: 8px; }
.typing { display: inline-flex; gap: 4px; width: fit-content; padding: 10px 14px; border-radius: 18px; border-bottom-left-radius: 6px; background: var(--bl-bg); border: 1px solid var(--bl-border); }
.typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--bl-faint); animation: typing 1.2s ease-in-out infinite; }
.typing i:nth-child(2) { animation-delay: .15s; }
.typing i:nth-child(3) { animation-delay: .3s; }
@keyframes typing { 0%, 60%, 100% { transform: none; opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }

/* ---------- Pagos ---------- */
.pay-panel { position: relative; overflow: hidden; padding: 56px 48px; border-radius: 40px; background: linear-gradient(150deg, #2a0d5c 0%, #1a0838 60%, #120628 100%); color: #fff; box-shadow: 0 40px 80px -40px rgba(42, 13, 92, .8); }
.ion-palette-dark .pay-panel { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .08); }
.pay-glow { position: absolute; inset: 0; pointer-events: none; }
.pay-glow i { position: absolute; border-radius: 50%; filter: blur(70px); }
.pay-glow i:first-child { width: 420px; height: 420px; left: -120px; top: -180px; background: rgba(154, 60, 240, .55); }
.pay-glow i:last-child { width: 360px; height: 360px; right: -100px; bottom: -200px; background: rgba(255, 138, 61, .3); }
.pay-head { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 36px; }
.pay-head h2 { color: #fff; }
.pay-head p { color: rgba(255, 255, 255, .7); font-size: 17px; padding-bottom: 6px; }
.pay-grid { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.pay-card { display: flex; flex-direction: column; gap: 10px; padding: 26px; border-radius: 26px; background: rgba(255, 255, 255, .06); border: 1px solid rgba(255, 255, 255, .12); backdrop-filter: blur(6px); }
.pay-card h3 { color: #fff; font-size: 21px; }
.pay-card p { color: rgba(255, 255, 255, .72); font-size: 15px; line-height: 1.45; }
.pay-card.featured { background: linear-gradient(160deg, rgba(255, 255, 255, .14), rgba(255, 255, 255, .05)); border-color: rgba(255, 255, 255, .24); }
.pay-card.soon { background: transparent; border: 1.5px dashed rgba(255, 255, 255, .26); }
.pay-ic { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; font-size: 24px; background: rgba(255, 255, 255, .1); color: #fff; margin-bottom: 8px; }
.pay-ic.pp { background: #fff; color: #003087; }
.pay-tag { width: fit-content; margin-top: auto; padding: 6px 12px; border-radius: 99px; background: rgba(118, 210, 107, .18); color: #a9ec9f; font-size: 12px; font-weight: 800; }
.soon-tag { background: rgba(255, 138, 61, .18); color: #ffc49a; }
.pp-button { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: auto; padding: 11px 16px; border-radius: 99px; background: #ffc439; color: #003087; font-size: 14px; font-weight: 800; box-shadow: 0 10px 24px -12px rgba(255, 196, 57, .8); }

/* ---------- Requisitos ---------- */
.req { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 56px; align-items: center; }
.docs { list-style: none; margin: 32px 0 0; padding: 0; display: grid; gap: 10px; }
.docs li { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 20px; background: var(--bl-surface); border: 1px solid var(--bl-border); }
.docs li > span:last-child { display: grid; gap: 2px; min-width: 0; }
.docs b { font-size: 16px; letter-spacing: -.01em; }
.docs small { font-size: 13px; color: var(--bl-muted); }
.doc-ic { width: 42px; height: 42px; flex-shrink: 0; border-radius: 14px; display: grid; place-items: center; background: var(--bl-purple-soft); color: var(--bl-purple); font-size: 20px; }
.intl { display: flex; align-items: flex-start; gap: 12px; margin-top: 16px; padding: 16px 18px; border-radius: 20px; background: var(--bl-warm-soft); color: var(--bl-text); font-size: 15px; line-height: 1.45; }
.intl ion-icon { flex-shrink: 0; font-size: 22px; color: var(--bl-warm-ink); margin-top: 1px; }

.papers { position: relative; height: 400px; max-width: 420px; width: 100%; justify-self: center; }
.paper { position: absolute; left: 50%; top: 50%; width: 220px; height: 290px; margin: -145px 0 0 -110px; padding: 22px 20px; border-radius: 18px; background: var(--bl-surface); border: 1px solid var(--bl-border); box-shadow: var(--bl-shadow); display: flex; flex-direction: column; gap: 10px; transition: transform 1s cubic-bezier(.2, .8, .2, 1); }
.paper i { display: block; height: 8px; border-radius: 8px; background: color-mix(in srgb, var(--bl-text) 10%, transparent); }
.paper i.short { width: 55%; }
.paper-title { font-size: 15px; font-weight: 800; color: var(--bl-purple); margin-bottom: 8px; padding-bottom: 12px; border-bottom: 1px solid var(--bl-border); }
.paper-sign { margin-top: auto; width: 70px; height: 22px; border-bottom: 2px solid color-mix(in srgb, var(--bl-text) 20%, transparent); border-radius: 0 0 40% 10%; }
.p1 { transform: rotate(-4deg); }
.p2 { transform: rotate(3deg); }
.p3 { transform: rotate(-1deg); }
.papers.is-in .p1 { transform: translate(-56px, 10px) rotate(-11deg); }
.papers.is-in .p2 { transform: translate(52px, -6px) rotate(8deg); }
.papers.is-in .p3 { transform: rotate(-1.5deg); }
.stamp { position: absolute; right: 6%; bottom: 8%; z-index: 2; width: 132px; height: 132px; border-radius: 50%; display: grid; place-items: center; align-content: center; gap: 2px; text-align: center; color: var(--bl-green-ink); background: color-mix(in srgb, var(--bl-surface) 85%, transparent); border: 3px solid currentColor; box-shadow: inset 0 0 0 5px color-mix(in srgb, var(--bl-surface) 85%, transparent), inset 0 0 0 7px currentColor; font-size: 13px; font-weight: 800; line-height: 1.15; text-transform: uppercase; letter-spacing: .04em; transform: rotate(-14deg) scale(1.8); opacity: 0; transition: transform .5s cubic-bezier(.3, 1.6, .5, 1) .9s, opacity .3s ease .9s; }
.stamp ion-icon { font-size: 30px; }
.papers.is-in .stamp { transform: rotate(-14deg) scale(1); opacity: 1; }

/* ---------- Preguntas ---------- */
.faq-wrap { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 56px; align-items: start; }
.faq-side p { margin-top: 18px; color: var(--bl-muted); font-size: 16px; }
.faq-side a { color: var(--bl-purple); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.faq { display: grid; gap: 10px; }
.faq-item { border-radius: 22px; background: var(--bl-surface); border: 1px solid var(--bl-border); overflow: hidden; transition: box-shadow .3s ease, opacity .8s cubic-bezier(.2, .8, .2, 1), transform .8s cubic-bezier(.2, .8, .2, 1); }
.faq-item.open { box-shadow: var(--bl-shadow); }
.faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 22px; border: 0; background: none; color: var(--bl-text); font: inherit; font-size: 17px; font-weight: 700; letter-spacing: -.01em; text-align: left; cursor: pointer; }
.faq-plus { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; background: var(--bl-purple-soft); color: var(--bl-purple); font-size: 18px; transition: transform .35s ease, background-color .3s ease, color .3s ease; }
.faq-item.open .faq-plus { transform: rotate(45deg); background: var(--bl-purple); color: #fff; }
.faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s cubic-bezier(.2, .8, .2, 1); }
.faq-item.open .faq-a { grid-template-rows: 1fr; }
.faq-a p { overflow: hidden; padding: 0 22px; color: var(--bl-muted); font-size: 15px; line-height: 1.55; }
.faq-item.open .faq-a p { padding-bottom: 20px; }

/* ---------- CTA final ---------- */
.section.last { padding-bottom: 40px; }
.cta { position: relative; overflow: hidden; display: grid; justify-items: start; gap: 16px; padding: 72px 56px; border-radius: 40px; background: linear-gradient(135deg, #9a3cf0 0%, #6b1fc4 55%, #4a1394 100%); color: #fff; box-shadow: 0 40px 80px -40px rgba(107, 31, 196, .9); }
.cta-bg { position: absolute; inset: 0; pointer-events: none; }
.cta-bg i { position: absolute; border-radius: 50%; filter: blur(60px); }
.cta-bg i:first-child { width: 380px; height: 380px; right: 10%; top: -220px; background: rgba(255, 138, 61, .45); }
.cta-bg i:last-child { width: 320px; height: 320px; left: -120px; bottom: -200px; background: rgba(40, 83, 224, .4); }
.cta-mark { position: absolute; right: -40px; bottom: -70px; width: 420px; height: auto; opacity: .12; transform: rotate(-8deg); pointer-events: none; }
.cta h2 { position: relative; color: #fff; font-size: clamp(40px, 6vw, 72px); }
.cta p { position: relative; color: rgba(255, 255, 255, .82); font-size: 18px; max-width: 30em; }
.cta-actions { position: relative; display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }

.foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 22px; padding: 28px 20px calc(36px + env(safe-area-inset-bottom)); color: var(--bl-faint); font-size: 13px; }
.foot img { height: 22px; width: auto; }
.foot a { color: var(--bl-purple); font-weight: 700; }

/* ---------- Responsivo ---------- */
@media (max-width: 1020px) {
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .t-delivery { grid-row: span 1; }
  .t-delivery, .t-assistant, .t-panel, .t-chat { grid-column: span 2; }
}
@media (max-width: 900px) {
  .nav-links { display: none; }
  .nav-inner { justify-content: space-between; }
  .hero { padding-bottom: 40px; }
  .hero-inner { grid-template-columns: minmax(0, 1fr); gap: 36px; }
  .hero-visual { justify-self: center; }
  .steps, .pay-grid { grid-template-columns: minmax(0, 1fr); }
  .head, .pay-head { flex-direction: column; align-items: flex-start; gap: 10px; }
  .head p, .pay-head p { padding-bottom: 0; }
  .req, .faq-wrap { grid-template-columns: minmax(0, 1fr); gap: 32px; }
  .papers { height: 360px; }
  .pay-panel { padding: 40px 24px; border-radius: 32px; }
  .cta { padding: 56px 28px; border-radius: 32px; }
}
@media (max-width: 560px) {
  .wide-only { display: none; }
  .narrow-only { display: inline; }
  .brand span { font-size: 12px; }
  .section { padding: 64px 0; }
  .container { padding: 0 16px; }
  .hero-inner, .nav-inner { padding-left: 16px; padding-right: 16px; }
  .hero h1 { font-size: clamp(40px, 12.5vw, 56px); }
  .hero-actions .btn { flex: 1 1 100%; }
  .hero-visual { aspect-ratio: 1 / 1.02; }
  .campus { width: 112%; right: -14%; top: -2%; }
  .phone { width: 44cqw; }
  .screen { font-size: 2.4cqw; gap: 2cqw; }
  .s-hint, .s-store, .s-meta, .s-btn { font-size: 2.2cqw; }
  .s-card b { font-size: 2.8cqw; }
  .c-verified { top: 27%; }
  .c-zone { top: 50%; right: 6%; }
  .bento { grid-template-columns: minmax(0, 1fr); grid-auto-rows: auto; }
  .t-delivery, .t-assistant, .t-panel, .t-chat { grid-column: auto; }
  .tile { padding: 22px; border-radius: 26px; }
  .step { padding: 26px 22px 28px; }
  .paper { width: 190px; height: 250px; margin: -125px 0 0 -95px; }
  .papers.is-in .p1 { transform: translate(-40px, 8px) rotate(-10deg); }
  .papers.is-in .p2 { transform: translate(38px, -4px) rotate(8deg); }
  .stamp { width: 112px; height: 112px; font-size: 11px; right: 2%; }
  .cta-actions .btn { flex: 1 1 100%; }
  .cta-actions .btn-outline-light { font-size: 14px; }
  .cta-mark { width: 280px; right: -60px; bottom: -40px; }
}
@media (prefers-reduced-motion: reduce) {
  .glow, .enter, .hero-visual, .phone, .chip, .pin, .person, .zone-pulse, .route, .map-ring, .map-pin, .seal-ring, .answer-head ion-icon, .typing i { animation: none !important; }
  .ribbon path, .la-u-wrap svg { animation: none; }
  .reveal { opacity: 1; transform: none; transition: none; }
  .paper, .stamp { transition: none; }
}
</style>

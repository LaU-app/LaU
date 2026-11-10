<template>
  <section class="ai-search" :class="`is-${status}`" aria-live="polite">
    <header class="ai-head">
      <span class="ai-icon" aria-hidden="true"><ion-icon :icon="sparkles"/></span>
      <div class="ai-title">
        <b>Búsqueda inteligente</b>
        <Transition name="swap" mode="out-in">
          <span :key="subtitle">{{ subtitle }}</span>
        </Transition>
      </div>
      <button type="button" class="ai-close" aria-label="Ocultar búsqueda inteligente" @click="$emit('dismiss')"><ion-icon :icon="closeOutline"/></button>
    </header>

    <!-- Pensando: esqueleto con brillo mientras el servidor evalúa -->
    <div v-if="status === 'thinking'" class="ai-skeleton" aria-hidden="true">
      <i class="sk-line w70"/><i class="sk-line w45"/>
      <div class="sk-card"><i class="sk-thumb"/><span><i class="sk-line w80"/><i class="sk-line w50"/><i class="sk-line w30"/></span></div>
    </div>

    <p v-else-if="status === 'error'" class="ai-error" role="alert">
      {{ error }} <button type="button" class="study-link" @click="$emit('retry')">Reintentar</button>
    </p>

    <template v-else-if="plan">
      <div class="ai-answer">
        <b>{{ plan.message.title }}</b>
        <p v-for="line in plan.message.body" :key="line">{{ line }}</p>
      </div>

      <TransitionGroup name="card" tag="div" class="ai-cards" appear>
        <article v-for="(rec, i) in plan.recommendations.slice(0, 3)" :key="rec.product.id" class="ai-card" :class="{ top: rec.recommended }" :style="{ '--i': i }">
          <span v-if="rec.recommended" class="top-flag"><ion-icon :icon="sparkles"/>Mejor opción</span>

          <button type="button" class="card-main" @click="$emit('open', rec.product.id)">
            <span class="thumb"><img v-if="rec.product.image_url" :src="rec.product.image_url" :alt="rec.product.name"/><ion-icon v-else :icon="cubeOutline"/></span>
            <span class="info">
              <b>{{ rec.product.name }}</b>
              <span class="store">{{ rec.store.name }}<VerifiedBadge compact :paypal="rec.store.accepts_paypal"/></span>
              <span class="price">${{ rec.product.price }} <small>{{ rec.product.currency }}</small></span>
            </span>
            <span class="match-ring" :class="matchLevel(rec.match_probability).tone" role="img" :aria-label="`${Math.round(rec.match_probability * 100)} % de coincidencia`">
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle class="match-ring-track" cx="20" cy="20" r="16"/>
                <circle class="match-ring-value" cx="20" cy="20" r="16" :style="{ '--p': rec.match_probability }"/>
              </svg>
              <b>{{ Math.round(rec.match_probability * 100) }}<small>%</small></b>
            </span>
          </button>
          <p class="match-text"><i :class="matchLevel(rec.match_probability).tone"/>{{ matchLevel(rec.match_probability).text }}</p>

          <!-- Por qué: frase real elegida por el modelo + razones calculadas -->
          <div v-if="rec.highlight || rec.reasons.length" class="why">
            <span class="why-title">Por qué te lo recomiendo</span>
            <blockquote v-if="rec.highlight">
              <ion-icon :icon="chatbubbleEllipsesOutline" aria-hidden="true"/>
              <span>«{{ rec.highlight }}»<small>Del detalle del producto</small></span>
            </blockquote>
            <ul v-if="rec.reasons.length">
              <li v-for="reason in rec.reasons" :key="reason"><ion-icon :icon="checkmarkCircle"/>{{ reason }}</li>
            </ul>
          </div>

          <ul class="facts" aria-label="Datos del producto">
            <li :class="{ low: rec.product.stock <= 3 }"><ion-icon :icon="cubeOutline"/>{{ stockText(rec.product.stock) }}</li>
            <li v-if="conditionText(rec.product.condition)"><ion-icon :icon="ribbonOutline"/>{{ conditionText(rec.product.condition) }}</li>
            <li v-if="rec.product.category"><ion-icon :icon="pricetagOutline"/>{{ rec.product.category }}</li>
            <li v-if="rec.product.delivery_point"><ion-icon :icon="locationOutline"/>{{ rec.product.delivery_point }}</li>
          </ul>
          <p v-if="rec.product.description" class="desc">{{ rec.product.description }}</p>

          <!-- Reseñas y videos (YouTube filtrado por el modelo) -->
          <div class="videos">
            <button type="button" class="videos-toggle" :aria-expanded="openVideos === rec.product.id" @click="toggleVideos(rec.product.id)">
              <ion-icon :icon="logoYoutube"/>Reseñas y videos
              <ion-icon class="chev" :class="{ open: openVideos === rec.product.id }" :icon="chevronDownOutline"/>
            </button>
            <div v-if="openVideos === rec.product.id" class="videos-body">
              <p v-if="videoState[rec.product.id]?.loading" class="study-muted"><span class="mini-spin"/>Buscando reseñas…</p>
              <template v-else-if="videoState[rec.product.id]?.data">
                <a v-for="video in videoState[rec.product.id]!.data!.videos" :key="video.id" class="video" :href="video.url" target="_blank" rel="noopener noreferrer">
                  <img v-if="video.thumbnail" :src="video.thumbnail" alt="" loading="lazy"/>
                  <span><b>{{ video.title }}</b><small>{{ video.channel }}</small></span>
                </a>
                <p class="study-muted videos-msg">
                  <template v-if="videoState[rec.product.id]!.data!.status !== 'found'">{{ videoState[rec.product.id]!.data!.message }} </template>
                  <a :href="videoState[rec.product.id]!.data!.search_url" target="_blank" rel="noopener noreferrer">Buscar en YouTube</a>
                </p>
              </template>
              <p v-else-if="videoState[rec.product.id]?.error" class="study-muted">{{ videoState[rec.product.id]!.error }}</p>
            </div>
          </div>

          <div class="card-actions">
            <button v-if="rec.store.accepts_paypal" type="button" class="study-button pay" :disabled="rec.product.stock < 1" @click="$emit('buy', rec.product.id, plan.decision_id)">
              <ion-icon :icon="logoPaypal"/>Comprar
            </button>
            <button type="button" class="study-button secondary-button" @click="$emit('open', rec.product.id)">Ver producto</button>
          </div>
        </article>
      </TransitionGroup>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  sparkles, closeOutline, cubeOutline, logoPaypal, chatbubbleEllipsesOutline, checkmarkCircle, ribbonOutline,
  pricetagOutline, locationOutline, logoYoutube, chevronDownOutline,
} from 'ionicons/icons'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import smartShoppingService, { type ProductVideos, type SmartPlan } from '@/services/smartShoppingService'
import { CheckoutError } from '@/services/paypalCheckoutService'

const props = defineProps<{ status: 'thinking' | 'done' | 'error'; plan: SmartPlan | null; error?: string }>()
defineEmits<{ dismiss: []; retry: []; open: [id: number]; buy: [productId: number, decisionId: number] }>()

// Etapas reales del trabajo (se muestran mientras responde el servidor).
const STAGES = ['Entendiendo lo que necesitás…', 'Buscando en comercios verificados…', 'Comparando opciones…']
const CONDITIONS: Record<string, string> = { nuevo: 'Nuevo', como_nuevo: 'Como nuevo', buen_estado: 'Buen estado', aceptable: 'Aceptable' }

const stage = ref(0)
const openVideos = ref<number | null>(null)
const videoState = reactive<Record<number, { loading: boolean; data?: ProductVideos; error?: string }>>({})
let timer: ReturnType<typeof setInterval> | null = null

const subtitle = computed(() => {
  if (props.status === 'thinking') return STAGES[stage.value]
  if (props.status === 'error') return 'No se pudo completar'
  return 'Productos de comercios verificados'
})

watch(() => props.status, (status) => {
  if (timer) clearInterval(timer)
  if (status !== 'thinking') return
  stage.value = 0
  timer = setInterval(() => { if (stage.value < STAGES.length - 1) stage.value++ }, 1300)
}, { immediate: true })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

function matchLevel(p: number) {
  if (p >= 0.9) return { text: 'Muy alta coincidencia con tu búsqueda', tone: 'tone-high' }
  if (p >= 0.7) return { text: 'Alta coincidencia con tu búsqueda', tone: 'tone-good' }
  if (p >= 0.5) return { text: 'Coincidencia parcial', tone: 'tone-mid' }
  return { text: 'Coincidencia baja', tone: 'tone-low' }
}

const stockText = (n: number) => n < 1 ? 'Agotado' : n === 1 ? '1 disponible' : `${n} disponibles`
const conditionText = (c: string | null) => (c ? CONDITIONS[c] ?? null : null)

async function toggleVideos(productId: number) {
  openVideos.value = openVideos.value === productId ? null : productId
  if (openVideos.value === null || videoState[productId]?.data || videoState[productId]?.loading) return
  videoState[productId] = { loading: true }
  try {
    videoState[productId] = { loading: false, data: await smartShoppingService.videos(productId) }
  } catch (e) {
    videoState[productId] = { loading: false, error: e instanceof CheckoutError ? e.message : 'No pudimos buscar reseñas.' }
  }
}
</script>

<style scoped>
.ai-search { position: relative; display: grid; gap: 14px; padding: 16px; margin-bottom: 22px; border-radius: 24px; background: linear-gradient(160deg, var(--study-purple-soft), var(--study-blue-soft) 70%), var(--study-surface); border: 1px solid var(--study-border); animation: ai-in .4s cubic-bezier(.2, .8, .2, 1) both; }
.ai-search.is-thinking::before { content: ''; position: absolute; inset: -1.5px; border-radius: inherit; padding: 1.5px; background: linear-gradient(90deg, #8b45ec, #2853e0, #76d26b, #8b45ec); background-size: 300% 100%; animation: glow 2s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
@keyframes glow { to { background-position: 300% 0; } }
@keyframes ai-in { from { opacity: 0; transform: translateY(10px); } }
.ai-head { display: flex; align-items: center; gap: 10px; }
.ai-icon { width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 18px; flex-shrink: 0; }
.is-thinking .ai-icon ion-icon { animation: twinkle 1.2s ease-in-out infinite; }
@keyframes twinkle { 50% { transform: scale(.8) rotate(12deg); opacity: .7; } }
.ai-title { flex: 1; min-width: 0; display: grid; gap: 1px; }
.ai-title b { font-size: 15px; }
.ai-title span { font-size: 12px; color: var(--study-muted); }
.is-thinking .ai-title span { color: var(--study-purple); font-weight: 600; }
.ai-close { width: 32px; height: 32px; border-radius: 50%; border: 0; background: transparent; color: var(--study-muted); display: grid; place-items: center; font-size: 18px; cursor: pointer; }
.ai-answer { display: grid; gap: 3px; }
.ai-answer b { font-size: 17px; letter-spacing: -.01em; }
.ai-answer p { font-size: 13px; color: var(--study-muted); line-height: 19px; }
.ai-error { font-size: 14px; }

/* Esqueleto con brillo */
.ai-skeleton { display: grid; gap: 10px; }
.sk-line { display: block; height: 11px; border-radius: 99px; background: linear-gradient(90deg, var(--study-track) 25%, color-mix(in srgb, var(--study-track) 40%, var(--study-surface)) 50%, var(--study-track) 75%); background-size: 200% 100%; animation: shimmer 1.3s linear infinite; }
.w30 { width: 30%; } .w45 { width: 45%; } .w50 { width: 50%; } .w70 { width: 70%; } .w80 { width: 80%; }
.sk-card { display: flex; gap: 12px; padding: 14px; border-radius: 18px; background: var(--study-surface); }
.sk-card span { flex: 1; display: grid; gap: 8px; align-content: center; }
.sk-thumb { width: 58px; height: 58px; border-radius: 14px; background: var(--study-track); animation: shimmer 1.3s linear infinite; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

.ai-cards { display: grid; gap: 12px; }
.ai-card { position: relative; display: grid; gap: 12px; padding: 16px; border-radius: 20px; background: var(--study-surface); border: 1px solid var(--study-border); }
.ai-card.top { background: linear-gradient(var(--study-surface), var(--study-surface)) padding-box, linear-gradient(135deg, #8b45ec, #2853e0) border-box; border: 1.5px solid transparent; margin-top: 6px; }
.top-flag { position: absolute; top: -10px; left: 14px; display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 11px; font-weight: 800; }
.card-main { display: flex; align-items: center; gap: 12px; width: 100%; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.thumb { width: 58px; height: 58px; border-radius: 14px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: var(--study-track); color: var(--study-faint); font-size: 24px; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; min-width: 0; display: grid; gap: 3px; }
.info b { font-size: 15px; line-height: 19px; overflow-wrap: anywhere; }
.store { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--study-muted); }
.price { font-size: 18px; font-weight: 800; letter-spacing: -.02em; }
.price small { font-size: 11px; color: var(--study-muted); font-weight: 600; }
.match-ring { position: relative; width: 54px; height: 54px; flex-shrink: 0; display: grid; place-items: center; }
.match-ring svg { position: absolute; inset: 0; transform: rotate(-90deg); }
.match-ring circle { fill: none; stroke-width: 4; }
.match-ring-track { stroke: var(--study-track); }
.match-ring-value { stroke: currentColor; stroke-linecap: round; stroke-dasharray: 100.53; stroke-dashoffset: calc(100.53 * (1 - var(--p))); animation: ring-fill 1.1s cubic-bezier(.2, .8, .2, 1) both; }
@keyframes ring-fill { from { stroke-dashoffset: 100.53; } }
.match-ring b { font-size: 14px; font-weight: 800; color: var(--study-text); }
.match-ring b small { font-size: 9px; }
.tone-high { color: var(--study-green-ink); } .tone-good { color: var(--study-green); } .tone-mid { color: var(--study-orange); } .tone-low { color: var(--study-faint); }
.match-text { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; }
.match-text i { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

.why { display: grid; gap: 8px; padding: 12px 14px; border-radius: 16px; background: var(--study-bg); }
.why-title { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--study-purple); }
.why blockquote { margin: 0; display: flex; gap: 8px; align-items: flex-start; font-size: 14px; line-height: 20px; }
.why blockquote ion-icon { flex-shrink: 0; margin-top: 2px; color: var(--study-purple); font-size: 16px; }
.why blockquote span { display: grid; gap: 2px; font-style: italic; }
.why blockquote small { font-style: normal; font-size: 11px; color: var(--study-faint); }
.why ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
.why li { display: flex; gap: 7px; align-items: flex-start; font-size: 13px; line-height: 19px; }
.why li ion-icon { flex-shrink: 0; margin-top: 2px; color: var(--study-green); font-size: 15px; }
.facts { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.facts li { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; background: var(--study-bg); font-size: 12px; font-weight: 600; color: var(--study-muted); }
.facts li.low { color: var(--study-orange); background: var(--study-orange-soft); }
.desc { font-size: 13px; line-height: 19px; color: var(--study-muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.videos { border-top: 1px solid var(--study-border); padding-top: 10px; }
.videos-toggle { width: 100%; display: flex; align-items: center; gap: 8px; padding: 4px 0; border: 0; background: none; color: var(--study-text); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.videos-toggle > ion-icon:first-child { color: #ff0033; font-size: 18px; }
.videos-toggle:focus { outline: none; }
.videos-toggle:focus-visible { outline: 2px solid var(--study-purple); outline-offset: 2px; border-radius: 8px; }
.chev { margin-left: auto; transition: transform .25s ease; color: var(--study-faint); }
.chev.open { transform: rotate(180deg); }
.videos-body { display: grid; gap: 8px; padding-top: 8px; animation: ai-in .3s ease both; }
.video { display: flex; gap: 10px; align-items: center; padding: 6px; border-radius: 14px; background: var(--study-bg); color: inherit; text-decoration: none; }
.video img { width: 96px; height: 54px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.video span { display: grid; gap: 2px; min-width: 0; }
.video b { font-size: 13px; line-height: 17px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.video small { font-size: 11px; color: var(--study-muted); }
.videos-msg a { color: var(--study-purple); font-weight: 700; }
.mini-spin { display: inline-block; width: 12px; height: 12px; margin-right: 6px; border-radius: 50%; border: 2px solid var(--study-track); border-top-color: var(--study-purple); animation: spin .8s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
.card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.card-actions .study-button { min-height: 44px; font-size: 13px; }
.card-actions .study-button:only-child { grid-column: 1 / -1; }
.pay { background: #ffc439; color: #003087; }

.card-enter-active { transition: opacity .5s ease, transform .5s cubic-bezier(.2, .8, .2, 1); transition-delay: calc(var(--i) * 110ms); }
.card-enter-from { opacity: 0; transform: translateY(14px); }
.swap-enter-active, .swap-leave-active { transition: opacity .2s ease, transform .2s ease; }
.swap-enter-from { opacity: 0; transform: translateY(5px); }
.swap-leave-to { opacity: 0; transform: translateY(-5px); }
@media (prefers-reduced-motion: reduce) {
  .ai-search, .ai-search.is-thinking::before, .sk-line, .sk-thumb, .match-ring-value, .is-thinking .ai-icon ion-icon, .mini-spin { animation: none !important; }
  .card-enter-active { transition: none; }
}
</style>

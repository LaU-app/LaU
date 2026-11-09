<template>
  <div class="study-ui market-ui agent" :class="{ 'is-page': page }">
    <header class="agent-head">
      <span class="orb orb-head" :class="{ thinking: busy }" aria-hidden="true"><i/><i/><i/></span>
      <div class="agent-id">
        <b>Asistente LaU</b>
        <span><i class="live-dot"/>{{ busy ? 'Buscando para vos…' : 'Comercios verificados · Pago con PayPal' }}</span>
      </div>
      <button v-if="!page" class="study-icon-button" aria-label="Cerrar asistente" @click="$emit('close')"><ion-icon :icon="closeOutline"/></button>
    </header>

    <div ref="scroller" class="agent-scroll">
      <Transition name="hello">
        <section v-if="!turns.length" class="agent-hello">
          <span class="orb orb-hero" aria-hidden="true"><i/><i/><i/></span>
          <h1>Contanos qué necesitás</h1>
          <div class="suggestions">
            <button v-for="(s, i) in SUGGESTIONS" :key="s" type="button" :style="{ '--i': i }" @click="send(s)">{{ s }}</button>
          </div>
        </section>
      </Transition>

      <TransitionGroup name="turn" tag="div" class="turns">
        <div v-for="turn in turns" :key="turn.id" class="turn">
          <div class="bubble user">
            {{ turn.text }}
            <span v-if="turn.budget" class="bubble-chip"><ion-icon :icon="walletOutline"/>Máx. ${{ turn.budget }}</span>
          </div>

          <div class="agent-row">
            <span class="orb orb-row" :class="{ thinking: turn.status === 'thinking' }" aria-hidden="true"><i/><i/><i/></span>
            <div class="agent-body">
              <div v-if="turn.status === 'thinking'" class="thinking" role="status" aria-live="polite">
                <Transition name="swap" mode="out-in"><span :key="stage">{{ STAGES[stage] }}</span></Transition>
                <span class="dots" aria-hidden="true"><i/><i/><i/></span>
              </div>

              <div v-else-if="turn.status === 'error'" class="bubble agent is-error" role="alert">
                {{ turn.error }}
                <button type="button" class="study-link" @click="retry(turn)">Reintentar</button>
              </div>

              <template v-else-if="turn.plan">
                <div class="bubble agent">
                  <b>{{ turn.plan.message.title }}</b>
                  <p v-for="line in turn.plan.message.body" :key="line">{{ line }}</p>
                </div>

                <TransitionGroup name="card" tag="div" class="agent-cards" appear>
                  <article v-for="(rec, i) in turn.plan.recommendations" :key="rec.product.id" class="agent-card" :class="{ top: rec.recommended }" :style="{ '--i': i }">
                    <span v-if="rec.recommended" class="top-flag"><ion-icon :icon="sparkles"/>Mejor opción</span>

                    <button type="button" class="card-main" @click="openProduct(rec.product.id)">
                      <span class="thumb"><img v-if="rec.product.image_url" :src="rec.product.image_url" :alt="rec.product.name"/><ion-icon v-else :icon="cubeOutline"/></span>
                      <span class="info">
                        <b>{{ rec.product.name }}</b>
                        <span class="store">{{ rec.store.name }}<VerifiedBadge compact :paypal="rec.store.accepts_paypal"/></span>
                        <span class="price">${{ rec.product.price }} <small>{{ rec.product.currency }}</small></span>
                      </span>
                      <span class="match-ring" :class="matchLevel(rec.match_probability).tone" role="img"
                        :aria-label="`${pct(rec.match_probability)} de coincidencia`">
                        <svg viewBox="0 0 40 40" aria-hidden="true">
                          <circle class="match-ring-track" cx="20" cy="20" r="16"/>
                          <circle class="match-ring-value" cx="20" cy="20" r="16" :style="{ '--p': rec.match_probability }"/>
                        </svg>
                        <b>{{ Math.round(rec.match_probability * 100) }}<small>%</small></b>
                      </span>
                    </button>

                    <p class="match-text"><i :class="matchLevel(rec.match_probability).tone"/>{{ matchLevel(rec.match_probability).text }}</p>

                    <ul class="signals">
                      <li>
                        <span class="sig-icon"><ion-icon :icon="checkmarkDoneOutline"/></span>
                        <span class="sig-text">{{ fitText(rec.fit.score) }}</span>
                        <span class="meter" aria-hidden="true"><i v-for="n in 3" :key="n" :class="{ on: n <= level(rec.fit.score, 3) }"/></span>
                      </li>
                      <li>
                        <span class="sig-icon"><ion-icon :icon="schoolOutline"/></span>
                        <span class="sig-text">{{ academicText(rec.academic.score) }}</span>
                        <span class="meter" aria-hidden="true"><i v-for="n in 3" :key="n" :class="{ on: n <= level(rec.academic.score * 1.5, 3) }"/></span>
                      </li>
                      <li v-if="rec.within_budget !== null" :class="{ warn: rec.within_budget === false }">
                        <span class="sig-icon"><ion-icon :icon="walletOutline"/></span>
                        <span class="sig-text">{{ budgetText(rec, turn.plan) }}</span>
                      </li>
                    </ul>

                    <div class="card-actions">
                      <button type="button" class="study-button pay" :disabled="!rec.store.accepts_paypal || rec.product.stock < 1" @click="buy(rec.product.id, turn.plan.decision_id)">
                        <ion-icon :icon="logoPaypal"/>Comprar
                      </button>
                      <button type="button" class="study-icon-button" aria-label="Ver detalle del producto" @click="openProduct(rec.product.id)"><ion-icon :icon="arrowForwardOutline"/></button>
                    </div>
                  </article>
                </TransitionGroup>
              </template>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <form class="composer" @submit.prevent="send()">
      <Transition name="budget">
        <label v-if="budgetOpen" class="budget-pill">
          <ion-icon :icon="walletOutline"/>
          <span>Presupuesto máximo</span>
          <span class="budget-input">$<input ref="budgetInput" v-model="budget" type="number" inputmode="decimal" min="0.5" max="10000" step="0.01" placeholder="20" aria-label="Presupuesto máximo en dólares"/></span>
          <button type="button" class="budget-clear" aria-label="Quitar presupuesto" @click="clearBudget"><ion-icon :icon="closeOutline"/></button>
        </label>
      </Transition>
      <div class="composer-box" :class="{ busy }">
        <button type="button" class="budget-toggle" :class="{ active: budgetOpen || budgetValue }" :aria-pressed="budgetOpen" aria-label="Presupuesto máximo" @click="toggleBudget">
          <ion-icon :icon="walletOutline"/><span v-if="budgetValue && !budgetOpen">${{ budgetValue }}</span>
        </button>
        <textarea ref="input" v-model="draft" rows="1" maxlength="400" :placeholder="placeholder" aria-label="Qué necesitás"
          @keydown.enter.exact.prevent="send()" @input="grow"/>
        <button type="submit" class="send" :disabled="busy || draft.trim().length < 3" aria-label="Enviar"><ion-icon :icon="arrowUpOutline"/></button>
      </div>
    </form>

    <ion-modal :is-open="checkout !== null" :initial-breakpoint="1" :breakpoints="[0, 1]" @didDismiss="checkout = null">
      <PayPalCheckoutSheet v-if="checkout" :product-id="checkout.productId" :decision-id="checkout.decisionId"
        @close="checkout = null" @orders="go('/tabs/marketplace/orders')"/>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon, IonModal } from '@ionic/vue'
import {
  closeOutline, walletOutline, arrowUpOutline, cubeOutline, sparkles, logoPaypal, arrowForwardOutline,
  checkmarkDoneOutline, schoolOutline,
} from 'ionicons/icons'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import PayPalCheckoutSheet from '@/components/marketplace/PayPalCheckoutSheet.vue'
import smartShoppingService, { type SmartPlan, type SmartRecommendation } from '@/services/smartShoppingService'
import { CheckoutError } from '@/services/paypalCheckoutService'

interface Turn {
  id: number
  text: string
  query: string
  budget: string | null
  status: 'thinking' | 'done' | 'error'
  plan?: SmartPlan
  error?: string
}

const props = defineProps<{ initialQuery?: string; page?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()

const SUGGESTIONS = [
  'Calculadora científica para Cálculo, máximo $25',
  'Bata de laboratorio para Química',
  'Algo para dibujo técnico',
]
// Etapas reales del trabajo del asistente (se muestran mientras responde el servidor).
const STAGES = ['Entendiendo lo que necesitás', 'Buscando en comercios verificados', 'Comparando opciones']

const turns = ref<Turn[]>([])
const draft = ref('')
const budget = ref<string | number>('')
const budgetOpen = ref(false)
const stage = ref(0)
const checkout = ref<{ productId: number; decisionId: number } | null>(null)
const scroller = ref<HTMLElement | null>(null)
const input = ref<HTMLTextAreaElement | null>(null)
const budgetInput = ref<HTMLInputElement | null>(null)
let stageTimer: ReturnType<typeof setInterval> | null = null
let nextId = 1

const busy = computed(() => turns.value.some(t => t.status === 'thinking'))
const budgetValue = computed(() => {
  const value = Number(budget.value)
  return Number.isFinite(value) && value > 0 ? value.toFixed(2).replace(/\.00$/, '') : ''
})
const placeholder = computed(() => turns.value.length ? 'Contame más detalles…' : '¿Qué necesitás?')

const pct = (p: number) => `${Math.round(p * 100)} %`
const level = (score: number, max: number) => Math.max(0, Math.min(max, Math.round(score)))

function matchLevel(p: number) {
  if (p >= 0.9) return { text: 'Muy alta coincidencia con lo que pediste', tone: 'tone-high' }
  if (p >= 0.7) return { text: 'Alta coincidencia con lo que pediste', tone: 'tone-good' }
  if (p >= 0.5) return { text: 'Coincidencia parcial', tone: 'tone-mid' }
  return { text: 'Coincidencia baja', tone: 'tone-low' }
}

function fitText(score: number) {
  return ['No cubre tu necesidad', 'Cubre solo una parte', 'Cubre lo esencial', 'Cubre todo lo que pediste'][level(score, 3)]
}

function academicText(score: number) {
  return ['Uso general', 'Útil para estudiar', 'Ideal para tu materia'][level(score, 2)]
}

function budgetText(rec: SmartRecommendation, plan: SmartPlan) {
  const max = plan.budget.amount
  if (!max) return ''
  if (rec.within_budget) return `Dentro de tu presupuesto de $${max}`
  const over = (Math.round(Number(rec.product.price) * 100) - Math.round(Number(max) * 100)) / 100
  return `$${over.toFixed(2)} más que tu presupuesto`
}

function scrollDown() {
  nextTick(() => {
    const el = scroller.value
    if (!el) return
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    else el.scrollTop = el.scrollHeight
  })
}

function startStages() {
  stage.value = 0
  if (stageTimer) clearInterval(stageTimer)
  stageTimer = setInterval(() => {
    if (stage.value < STAGES.length - 1) stage.value++
  }, 1300)
}

async function run(turn: Turn) {
  turn.status = 'thinking'
  turn.error = undefined
  startStages()
  scrollDown()
  try {
    turn.plan = await smartShoppingService.plan(turn.query, turn.budget ? Number(turn.budget) : null)
    turn.status = 'done'
  } catch (e) {
    turn.status = 'error'
    turn.error = e instanceof CheckoutError ? e.message : 'No pude completar la búsqueda.'
  } finally {
    if (stageTimer) clearInterval(stageTimer)
    scrollToLatestAnswer()
  }
}

/** Muestra la respuesta desde su inicio (la mejor opción queda a la vista). */
function scrollToLatestAnswer() {
  nextTick(() => {
    const el = scroller.value
    const answers = el?.querySelectorAll<HTMLElement>('.agent-row')
    const last = answers?.[answers.length - 1]
    if (!el || !last) return
    const top = Math.max(0, last.offsetTop - 12)
    if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: 'smooth' })
    else el.scrollTop = top
  })
}

function send(text?: string) {
  const value = (text ?? draft.value).trim()
  if (value.length < 3 || busy.value) return

  // Si el asistente pidió más detalles, la respuesta completa la consulta anterior.
  const previous = turns.value[turns.value.length - 1]
  const continues = previous?.status === 'done' && ['needs_clarification', 'confirm_choice'].includes(previous.plan?.outcome ?? '')
  const query = (continues ? `${previous!.query}. ${value}` : value).slice(0, 500)

  turns.value.push({ id: nextId++, text: value, query, budget: budgetValue.value || null, status: 'thinking' })
  draft.value = ''
  budgetOpen.value = false
  nextTick(grow)
  void run(turns.value[turns.value.length - 1])
}

function retry(turn: Turn) {
  void run(turn)
}

function toggleBudget() {
  budgetOpen.value = !budgetOpen.value
  if (budgetOpen.value) nextTick(() => budgetInput.value?.focus())
}

function clearBudget() {
  budget.value = ''
  budgetOpen.value = false
}

function grow() {
  const el = input.value
  if (!el) return
  if (!el.value) {
    // Vacío: vuelve a una línea y sin desplazamiento interno.
    el.style.height = ''
    el.style.overflowY = 'hidden'
    el.scrollTop = 0
    return
  }
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  // Sin barra de desplazamiento hasta llegar al alto máximo.
  el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden'
}

function buy(productId: number, decisionId: number) {
  checkout.value = { productId, decisionId }
}

function go(path: string) {
  checkout.value = null
  emit('close')
  router.push(path)
}

const openProduct = (id: number) => go(`/tabs/marketplace/product/${id}`)

onMounted(() => {
  if ((props.initialQuery ?? '').trim().length >= 3) send(props.initialQuery)
  else nextTick(() => input.value?.focus())
})
onBeforeUnmount(() => { if (stageTimer) clearInterval(stageTimer) })
</script>

<style scoped>
.agent { display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--study-bg); color: var(--study-text); }
.agent-head { display: flex; align-items: center; gap: 12px; padding: calc(14px + env(safe-area-inset-top)) 18px 12px; border-bottom: 1px solid var(--study-border); }
.agent.is-page .agent-head { padding-top: 14px; }
.agent-id { flex: 1; display: grid; gap: 1px; min-width: 0; }
.agent-id b { font-size: 16px; letter-spacing: -.01em; }
.agent-id span { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--study-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--study-green); box-shadow: 0 0 0 3px var(--study-green-soft); flex-shrink: 0; }

/* Orbe del asistente: gradiente LaU que gira y "respira"; se acelera mientras piensa. */
.orb { position: relative; display: inline-block; flex-shrink: 0; border-radius: 50%; overflow: hidden; isolation: isolate;
  background: radial-gradient(circle at 30% 28%, #d8c2ff 0%, #8b45ec 42%, #5b21b6 70%, #2853e0 100%);
  box-shadow: 0 8px 22px -10px rgba(123, 50, 217, .75), inset 0 0 0 1px rgba(255, 255, 255, .18); }
.orb i { position: absolute; inset: -35%; border-radius: 42%; background: conic-gradient(from 0deg, transparent 0 25%, rgba(255, 255, 255, .32) 35%, transparent 50% 100%); animation: orb-spin 7s linear infinite; }
.orb i:nth-child(2) { animation-duration: 11s; animation-direction: reverse; background: conic-gradient(from 120deg, transparent 0 30%, rgba(118, 170, 255, .4) 45%, transparent 60%); }
.orb i:nth-child(3) { inset: 26%; border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, .45), transparent 65%); animation: orb-breathe 3.2s ease-in-out infinite; }
.orb.thinking { animation: orb-pulse 1.3s ease-in-out infinite; }
.orb.thinking i { animation-duration: 1.4s; }
.orb.thinking i:nth-child(2) { animation-duration: 2.1s; }
.orb-head { width: 36px; height: 36px; }
.orb-row { width: 28px; height: 28px; margin-top: 2px; }
.orb-hero { width: 104px; height: 104px; margin-bottom: 18px; animation: orb-float 5s ease-in-out infinite; }
@keyframes orb-spin { to { transform: rotate(360deg); } }
@keyframes orb-breathe { 50% { transform: scale(1.25); opacity: .65; } }
@keyframes orb-pulse { 50% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(123, 50, 217, .14), 0 8px 22px -10px rgba(123, 50, 217, .75); } }
@keyframes orb-float { 50% { transform: translateY(-8px); } }

.agent-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 18px 8px; scroll-behavior: smooth; }
.agent-hello { display: grid; justify-items: center; text-align: center; padding: 6vh 4px 12px; }
.agent-hello h1 { font-size: clamp(24px, 6vw, 30px); line-height: 1.15; font-weight: 800; letter-spacing: -.03em; }
.suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 22px; max-width: 460px; }
.suggestions button { border: 1px solid var(--study-border); background: var(--study-surface); color: var(--study-text); border-radius: 999px; padding: 9px 14px; font: inherit; font-size: 13px; cursor: pointer; animation: rise .5s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--i) * 80ms + 150ms); transition: border-color .2s ease, transform .2s ease; }
.suggestions button:hover { border-color: var(--study-purple); transform: translateY(-1px); }

.turns { display: grid; gap: 18px; }
.turn { display: grid; gap: 12px; }
.bubble { max-width: 86%; padding: 11px 15px; border-radius: 20px; font-size: 14px; line-height: 20px; }
.bubble.user { justify-self: end; background: var(--study-cta); color: var(--study-on-cta); border-bottom-right-radius: 6px; display: grid; gap: 6px; overflow-wrap: anywhere; }
.bubble-chip { display: inline-flex; align-items: center; gap: 4px; width: fit-content; font-size: 11px; font-weight: 700; opacity: .8; }
.agent-row { display: flex; gap: 10px; align-items: flex-start; }
.agent-body { flex: 1; min-width: 0; display: grid; gap: 12px; }
.bubble.agent { max-width: 100%; background: var(--study-surface); border: 1px solid var(--study-border); border-bottom-left-radius: 6px; display: grid; gap: 4px; }
.bubble.agent b { font-size: 15px; }
.bubble.agent p { color: var(--study-muted); }
.bubble.is-error { color: var(--study-text); display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
.thinking { display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 18px; background: var(--study-purple-soft); color: var(--study-purple); font-size: 13px; font-weight: 600; width: fit-content; }
.dots { display: inline-flex; gap: 3px; }
.dots i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: dot 1.1s ease-in-out infinite; }
.dots i:nth-child(2) { animation-delay: .15s; }
.dots i:nth-child(3) { animation-delay: .3s; }
@keyframes dot { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

.agent-cards { display: grid; gap: 12px; }
.agent-card { position: relative; display: grid; gap: 12px; padding: 16px; border-radius: 22px; background: var(--study-surface); border: 1px solid var(--study-border); box-shadow: var(--study-shadow); }
.agent-card.top { border-color: transparent; background: linear-gradient(var(--study-surface), var(--study-surface)) padding-box, linear-gradient(135deg, #8b45ec, #2853e0) border-box; border: 1.5px solid transparent; }
.top-flag { position: absolute; top: -10px; left: 16px; display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 11px; font-weight: 800; }
.card-main { display: flex; align-items: center; gap: 12px; width: 100%; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.thumb { width: 58px; height: 58px; border-radius: 16px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: var(--study-track); color: var(--study-faint); font-size: 24px; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; min-width: 0; display: grid; gap: 3px; }
.info b { font-size: 15px; line-height: 19px; overflow-wrap: anywhere; }
.store { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--study-muted); }
.price { font-size: 18px; font-weight: 800; letter-spacing: -.02em; }
.price small { font-size: 11px; color: var(--study-muted); font-weight: 600; }

/* Anillo de coincidencia: la probabilidad como un indicador, no como texto suelto. */
.match-ring { position: relative; width: 56px; height: 56px; flex-shrink: 0; display: grid; place-items: center; }
.match-ring svg { position: absolute; inset: 0; transform: rotate(-90deg); }
.match-ring circle { fill: none; stroke-width: 4; }
.match-ring-track { stroke: var(--study-track); }
.match-ring-value { stroke: currentColor; stroke-linecap: round; stroke-dasharray: 100.53; stroke-dashoffset: calc(100.53 * (1 - var(--p))); animation: ring-fill 1.1s cubic-bezier(.2, .8, .2, 1) both; }
.match-ring b { font-size: 14px; font-weight: 800; color: var(--study-text); }
.match-ring b small { font-size: 9px; font-weight: 700; }
@keyframes ring-fill { from { stroke-dashoffset: 100.53; } }
.tone-high { color: var(--study-green-ink); }
.tone-good { color: var(--study-green); }
.tone-mid { color: var(--study-orange); }
.tone-low { color: var(--study-faint); }
.match-text { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; }
.match-text i { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

.signals { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.signals li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 14px; background: var(--study-bg); font-size: 13px; }
.sig-icon { width: 26px; height: 26px; border-radius: 9px; display: grid; place-items: center; background: var(--study-purple-soft); color: var(--study-purple); flex-shrink: 0; }
.sig-text { flex: 1; min-width: 0; }
.signals li.warn .sig-icon { background: var(--study-orange-soft); color: var(--study-orange); }
.meter { display: inline-flex; gap: 3px; }
.meter i { width: 14px; height: 5px; border-radius: 99px; background: var(--study-track); transition: background .4s ease; }
.meter i.on { background: var(--study-purple); }
.card-actions { display: flex; gap: 10px; align-items: center; }
.card-actions .pay { flex: 1; min-height: 46px; font-size: 14px; background: #ffc439; color: #003087; }
.card-actions .pay:disabled { opacity: .5; }

.composer { position: relative; padding: 10px 14px calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid var(--study-border); background: var(--study-bg); display: grid; gap: 8px; }
.agent.is-page .composer { padding-bottom: calc(14px + var(--lau-nav-space, 0px)); }
.composer-box { position: relative; display: flex; align-items: flex-end; gap: 8px; padding: 6px; border-radius: 26px; background: var(--study-surface); border: 1px solid var(--study-border); transition: box-shadow .3s ease, border-color .3s ease; }
.composer-box:focus-within { border-color: var(--study-purple); box-shadow: 0 0 0 4px var(--study-purple-soft); }
.composer-box.busy::before { content: ''; position: absolute; inset: -1.5px; border-radius: inherit; padding: 1.5px; background: linear-gradient(90deg, #8b45ec, #2853e0, #76d26b, #8b45ec); background-size: 300% 100%; animation: glow 2s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
@keyframes glow { to { background-position: 300% 0; } }
.composer textarea { flex: 1; min-width: 0; resize: none; border: 0; outline: none; background: transparent; color: var(--study-text); font: inherit; font-size: 15px; line-height: 21px; padding: 8px 4px; height: 38px; max-height: 120px; overflow-y: hidden; }
.composer textarea::placeholder { color: var(--study-faint); }
.budget-toggle { display: inline-flex; align-items: center; gap: 4px; height: 38px; min-width: 38px; padding: 0 10px; border-radius: 19px; border: 0; background: var(--study-bg); color: var(--study-muted); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; flex-shrink: 0; }
.budget-toggle ion-icon { font-size: 18px; }
.budget-toggle.active { background: var(--study-purple-soft); color: var(--study-purple); }
.send { width: 38px; height: 38px; border-radius: 50%; border: 0; display: grid; place-items: center; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 19px; cursor: pointer; flex-shrink: 0; transition: transform .2s ease, opacity .2s ease; }
.send:disabled { opacity: .35; cursor: default; }
.send:not(:disabled):active { transform: scale(.92); }
.budget-pill { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 14px; border-radius: 18px; background: var(--study-purple-soft); color: var(--study-purple); font-size: 13px; font-weight: 600; }
.budget-pill > span:first-of-type { flex: 1; }
.budget-input { display: inline-flex; align-items: center; gap: 2px; padding: 4px 10px; border-radius: 12px; background: var(--study-surface); color: var(--study-text); }
.budget-input input { width: 70px; border: 0; outline: none; background: transparent; color: inherit; font: inherit; font-size: 15px; }
.budget-clear { width: 30px; height: 30px; border-radius: 50%; border: 0; background: transparent; color: inherit; display: grid; place-items: center; cursor: pointer; }

/* Transiciones */
.hello-leave-active { transition: opacity .25s ease, transform .25s ease; }
.hello-leave-to { opacity: 0; transform: translateY(-12px) scale(.98); }
.turn-enter-active { transition: opacity .4s ease, transform .4s cubic-bezier(.2, .8, .2, 1); }
.turn-enter-from { opacity: 0; transform: translateY(14px); }
.card-enter-active { transition: opacity .5s ease, transform .5s cubic-bezier(.2, .8, .2, 1); transition-delay: calc(var(--i) * 110ms); }
.card-enter-from { opacity: 0; transform: translateY(16px) scale(.98); }
.swap-enter-active, .swap-leave-active { transition: opacity .2s ease, transform .2s ease; }
.swap-enter-from { opacity: 0; transform: translateY(6px); }
.swap-leave-to { opacity: 0; transform: translateY(-6px); }
.budget-enter-active, .budget-leave-active { transition: opacity .2s ease, transform .2s ease; }
.budget-enter-from, .budget-leave-to { opacity: 0; transform: translateY(6px); }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } }

@media (prefers-reduced-motion: reduce) {
  .orb, .orb i, .orb-hero, .match-ring-value, .suggestions button, .dots i, .composer-box.busy::before { animation: none !important; }
  .turn-enter-active, .card-enter-active, .hello-leave-active { transition: none; }
}
</style>

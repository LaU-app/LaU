<template>
  <ion-page class="study-ui market-ui">
    <AppHeader :isDarkMode="isDarkMode" :isAuthenticated="true" @toggleDarkMode="toggleDarkMode"/>
    <ion-content>
      <main class="study-shell study-body smart-page">
        <div class="detail-toolbar">
          <button class="study-icon-button" aria-label="Volver" @click="back"><ion-icon :icon="arrowBackOutline"/></button>
        </div>

        <header class="market-welcome">
          <span class="eyebrow"><i/>COMPRA INTELIGENTE CON JEV</span>
          <h1>Contanos qué necesitás</h1>
          <p class="study-muted intro">
            Jev, el modelo de decisiones de TypeSafe AI, evalúa productos reales de comercios verificados por LaU y te ayuda a elegir.
            No conoce tu saldo ni tus gastos: el presupuesto que indiques solo se usa en esta búsqueda.
          </p>
        </header>

        <form class="smart-form study-card" @submit.prevent="search">
          <label class="sr-only" for="smart-query">Qué necesitás</label>
          <textarea id="smart-query" v-model="query" rows="3" maxlength="500" :disabled="loading"
            placeholder="Ej.: Necesito una calculadora para Cálculo I y mi presupuesto máximo es de $25"/>
          <div class="smart-row">
            <label class="budget-field">
              <span>Presupuesto máximo <small>(opcional)</small></span>
              <span class="budget-input"><b>$</b><input v-model="budget" type="number" inputmode="decimal" min="0.5" max="10000" step="0.01" placeholder="25.00" :disabled="loading"/></span>
            </label>
            <button class="study-button" type="submit" :disabled="loading || query.trim().length < 3">
              <ion-spinner v-if="loading" name="crescent"/><ion-icon v-else :icon="sparklesOutline"/>
              {{ loading ? 'Evaluando…' : 'Buscar con Jev' }}
            </button>
          </div>
          <div class="examples" aria-label="Ejemplos">
            <button v-for="example in EXAMPLES" :key="example" type="button" class="status-chip" :disabled="loading" @click="useExample(example)">{{ example }}</button>
          </div>
        </form>

        <p v-if="loading" class="smart-loading" role="status"><ion-spinner name="dots"/>Jev está evaluando productos reales de comercios verificados…</p>
        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="search">Reintentar</button></p>

        <section v-if="plan" class="smart-result" aria-live="polite">
          <div class="result-head" :class="`is-${plan.outcome}`">
            <span class="study-symbol" :class="outcomeView.tone"><ion-icon :icon="outcomeView.icon"/></span>
            <div>
              <h2>{{ plan.message.title }}</h2>
              <ul><li v-for="line in plan.message.body" :key="line">{{ line }}</li></ul>
            </div>
          </div>

          <p v-if="plan.message.clarification" class="clarify"><ion-icon :icon="chatbubbleEllipsesOutline"/>{{ plan.message.clarification }}</p>

          <div class="signals" aria-label="Lo que entendió Jev">
            <span class="neutral-chip" title="Probabilidad que devolvió Jev">Intención de compra · {{ pct(plan.interpretation.purchase_intent) }}</span>
            <span v-if="plan.interpretation.category" class="neutral-chip">{{ plan.interpretation.category.name }} · {{ pct(plan.interpretation.category.probability) }}</span>
            <span v-if="plan.budget.amount" class="neutral-chip">Máximo ${{ plan.budget.amount }} · {{ plan.budget.source === 'field' ? 'indicado por vos' : 'leído de tu mensaje' }}</span>
          </div>

          <article v-for="rec in plan.recommendations" :key="rec.product.id" class="rec-card study-card" :class="{ top: rec.recommended }">
            <span v-if="rec.recommended" class="rec-ribbon"><ion-icon :icon="sparklesOutline"/>Recomendado</span>
            <div class="rec-main">
              <span class="rec-thumb"><img v-if="rec.product.image_url" :src="rec.product.image_url" :alt="rec.product.name"/><ion-icon v-else :icon="cubeOutline"/></span>
              <div class="rec-info">
                <h3>{{ rec.product.name }}</h3>
                <span class="rec-store">{{ rec.store.name }} <VerifiedBadge :paypal="rec.store.accepts_paypal" compact/></span>
                <b class="rec-price">${{ rec.product.price }} <small>{{ rec.product.currency }}</small></b>
              </div>
            </div>

            <div class="rec-metrics">
              <div class="metric">
                <span>Coincide con lo que pediste</span>
                <span class="bar" role="meter" :aria-valuenow="Math.round(rec.match_probability * 100)" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: pct(rec.match_probability) }"/></span>
                <b>{{ pct(rec.match_probability) }}</b>
              </div>
              <div class="rec-tags">
                <span class="status-chip"><i class="dot-purple"/>{{ rec.fit.label }}</span>
                <span class="status-chip"><i class="dot-blue"/>{{ rec.academic.label }}</span>
                <span v-if="rec.within_budget === true" class="status-chip"><i class="dot-green"/>Dentro de tu presupuesto</span>
                <span v-else-if="rec.within_budget === false" class="status-chip"><i class="dot-orange"/>Excede tu presupuesto</span>
              </div>
            </div>

            <div class="rec-actions">
              <button class="study-button" :disabled="!rec.store.accepts_paypal || rec.product.stock < 1" @click="buy(rec.product.id)">
                <ion-icon :icon="logoPaypal"/>{{ rec.within_budget === false ? 'Comprar de todos modos' : 'Comprar con PayPal' }}
              </button>
              <button class="study-button secondary-button" @click="router.push(`/tabs/marketplace/product/${rec.product.id}`)">Ver detalle</button>
            </div>
          </article>

          <details class="how-it-works">
            <summary><ion-icon :icon="informationCircleOutline"/>Cómo se tomó esta decisión</summary>
            <ol>
              <li>LaU buscó solo productos activos de comercios verificados que cobran con PayPal.</li>
              <li>Jev ({{ plan.model }}) respondió preguntas tipadas: si querés comprar, qué categoría buscás, qué significa cada monto de tu mensaje y cuánto se ajusta cada producto. Devuelve probabilidades, no texto.</li>
              <li>LaU comparó precios con tu presupuesto y aplicó umbrales conservadores: si la coincidencia no es clara, te pide confirmar en lugar de recomendar.</li>
              <li>Nada se cobra hasta que confirmes el resumen y apruebes el pago en PayPal.</li>
            </ol>
          </details>
        </section>
      </main>
    </ion-content>

    <ion-modal :is-open="checkoutProductId !== null" :initial-breakpoint="1" :breakpoints="[0, 1]" @didDismiss="checkoutProductId = null">
      <PayPalCheckoutSheet v-if="checkoutProductId !== null" :product-id="checkoutProductId" :decision-id="plan?.decision_id"
        @close="checkoutProductId = null" @orders="goToOrders"/>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, IonSpinner, IonModal } from '@ionic/vue'
import {
  arrowBackOutline, sparklesOutline, cubeOutline, logoPaypal, chatbubbleEllipsesOutline, informationCircleOutline,
  checkmarkCircleOutline, helpCircleOutline, walletOutline, searchOutline, alertCircleOutline,
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import PayPalCheckoutSheet from '@/components/marketplace/PayPalCheckoutSheet.vue'
import smartShoppingService, { type SmartOutcome, type SmartPlan } from '@/services/smartShoppingService'
import { CheckoutError } from '@/services/paypalCheckoutService'
import { useDarkMode } from '@/utils/useDarkMode'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const router = useRouter()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const EXAMPLES = [
  'Calculadora científica para Cálculo, máximo $25',
  'Bata de laboratorio para Química',
  'Algo para dibujo técnico de primer año',
]

const OUTCOMES: Record<SmartOutcome, { icon: string; tone: string }> = {
  recommendation: { icon: checkmarkCircleOutline, tone: 'tone-green' },
  confirm_choice: { icon: helpCircleOutline, tone: 'tone-orange' },
  over_budget: { icon: walletOutline, tone: 'tone-orange' },
  no_match: { icon: searchOutline, tone: 'tone-blue' },
  needs_clarification: { icon: chatbubbleEllipsesOutline, tone: 'tone-blue' },
  not_a_purchase: { icon: alertCircleOutline, tone: 'tone-blue' },
}

const query = ref('')
const budget = ref<string | number>('')
const loading = ref(false)
const error = ref('')
const plan = ref<SmartPlan | null>(null)
const checkoutProductId = ref<number | null>(null)

const outcomeView = computed(() => OUTCOMES[plan.value?.outcome ?? 'no_match'])

const pct = (p: number) => `${Math.round(p * 100)} %`

function useExample(example: string) {
  query.value = example
  void search()
}

async function search() {
  if (query.value.trim().length < 3 || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const maxBudget = Number(budget.value)
    plan.value = await smartShoppingService.plan(query.value.trim(), Number.isFinite(maxBudget) && maxBudget > 0 ? maxBudget : null)
  } catch (e) {
    plan.value = null
    error.value = e instanceof CheckoutError ? e.message : 'No pudimos completar la búsqueda.'
  } finally {
    loading.value = false
  }
}

function buy(productId: number) {
  checkoutProductId.value = productId
}

function goToOrders() {
  checkoutProductId.value = null
  router.push('/tabs/marketplace/orders')
}

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/tabs/marketplace')
}
</script>

<style scoped>
.intro { margin-top: 8px; font-size: 14px; line-height: 21px; max-width: 60ch; }
.smart-form { display: grid; gap: 14px; padding: 18px; border-radius: 24px; margin-bottom: 16px; }
.smart-form textarea { width: 100%; resize: vertical; min-height: 84px; border: 1px solid var(--study-border); border-radius: 16px; padding: 14px; background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 15px; line-height: 22px; }
.smart-form textarea:focus, .budget-input:focus-within { outline: 2px solid var(--study-purple); outline-offset: 1px; }
.smart-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: end; }
.smart-row .study-button { width: auto; padding-inline: 22px; min-height: 50px; }
.smart-row ion-spinner { width: 18px; height: 18px; color: currentColor; }
.budget-field { display: grid; gap: 6px; font-size: 12px; font-weight: 600; color: var(--study-muted); }
.budget-field small { font-weight: 500; }
.budget-input { display: flex; align-items: center; gap: 6px; border: 1px solid var(--study-border); border-radius: 14px; padding: 0 12px; background: var(--study-bg); min-height: 50px; }
.budget-input b { color: var(--study-muted); }
.budget-input input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--study-text); font: inherit; font-size: 15px; outline: none; }
.examples { display: flex; flex-wrap: wrap; gap: 8px; }
.examples .status-chip { cursor: pointer; border: 0; font: inherit; font-size: 12px; }
.smart-loading { display: flex; align-items: center; gap: 10px; justify-content: center; color: var(--study-muted); font-size: 13px; margin: 8px 0 16px; }
.smart-result { display: grid; gap: 14px; margin-bottom: 24px; animation: smart-in .25s ease both; }
.result-head { display: flex; gap: 14px; align-items: flex-start; }
.result-head h2 { font-size: 19px; line-height: 25px; font-weight: 800; letter-spacing: -.02em; }
.result-head ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 4px; color: var(--study-muted); font-size: 13px; line-height: 19px; }
.clarify { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 16px; background: var(--study-blue-soft); font-size: 13px; line-height: 19px; }
.clarify ion-icon { flex-shrink: 0; font-size: 18px; color: var(--study-blue); }
.signals { display: flex; flex-wrap: wrap; gap: 8px; }
.rec-card { position: relative; display: grid; gap: 14px; padding: 18px; border-radius: 22px; }
.rec-card.top { border-color: var(--study-green); box-shadow: 0 0 0 1px var(--study-green); }
.rec-ribbon { position: absolute; top: -10px; right: 16px; display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; background: var(--study-green-ink); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: .02em; }
.rec-main { display: flex; gap: 14px; align-items: center; }
.rec-thumb { width: 64px; height: 64px; border-radius: 16px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: var(--study-track); color: var(--study-faint); font-size: 26px; }
.rec-thumb img { width: 100%; height: 100%; object-fit: cover; }
.rec-info { display: grid; gap: 4px; min-width: 0; }
.rec-info h3 { font-size: 15px; line-height: 20px; font-weight: 700; overflow-wrap: anywhere; }
.rec-store { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--study-muted); }
.rec-price { font-size: 20px; font-weight: 800; letter-spacing: -.02em; }
.rec-price small { font-size: 12px; color: var(--study-muted); font-weight: 600; }
.rec-metrics { display: grid; gap: 10px; }
.metric { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; font-size: 12px; color: var(--study-muted); }
.metric b { color: var(--study-text); }
.bar { height: 6px; border-radius: 99px; background: var(--study-track); overflow: hidden; }
.bar i { display: block; height: 100%; border-radius: inherit; background: var(--study-green); }
.rec-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.rec-tags .status-chip { font-size: 11px; }
.rec-actions { display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; }
.rec-actions .study-button { min-height: 46px; font-size: 13px; }
.how-it-works { padding: 14px 16px; border-radius: 18px; background: var(--study-surface); border: 1px solid var(--study-border); font-size: 13px; line-height: 19px; }
.how-it-works summary { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; list-style: none; }
.how-it-works ol { margin: 10px 0 0; padding-left: 20px; display: grid; gap: 6px; color: var(--study-muted); }
@keyframes smart-in { from { opacity: 0; transform: translateY(6px); } }
@media (max-width: 520px) {
  .smart-row { grid-template-columns: 1fr; }
  .smart-row .study-button { width: 100%; }
  .metric { grid-template-columns: 1fr auto; }
  .metric .bar { grid-column: 1 / -1; grid-row: 2; }
}
@media (prefers-reduced-motion: reduce) { .smart-result { animation: none; } }
</style>

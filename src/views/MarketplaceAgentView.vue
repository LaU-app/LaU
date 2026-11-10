<template>
  <ion-page class="study-ui market-ui agent-page">
    <ion-header class="ion-no-border">
      <div class="agent-top">
        <button type="button" class="icon-btn" aria-label="Volver al Marketplace" @click="goBack"><ion-icon :icon="arrowBackOutline"/></button>
        <div class="agent-name">
          <b><ion-icon :icon="sparkles"/>Asistente de compras</b>
          <span>{{ conversation?.title || 'Comercios verificados · pago con PayPal' }}</span>
        </div>
        <button type="button" class="icon-btn history-btn" :class="{ active: historyOpen }" aria-label="Historial de chats" @click="historyOpen = !historyOpen">
          <ion-icon :icon="timeOutline"/>
        </button>
        <button type="button" class="icon-btn" aria-label="Nuevo chat" @click="newChat"><ion-icon :icon="createOutline"/></button>
      </div>
    </ion-header>

    <ion-content ref="contentRef" class="agent-content">
      <div class="agent-layout">
        <!-- Historial: panel lateral en escritorio, cajón en el teléfono -->
        <aside class="history" :class="{ open: historyOpen }" aria-label="Historial de chats">
          <div class="history-head">
            <b>Tus chats</b>
            <button type="button" class="study-link" @click="newChat">Nuevo</button>
          </div>
          <p v-if="historyLoading && !history.length" class="study-muted">Cargando…</p>
          <p v-else-if="!history.length" class="study-muted">Todavía no tenés chats.</p>
          <ul v-else>
            <li v-for="item in history" :key="item.id" :class="{ current: item.id === conversation?.id }">
              <button type="button" class="history-item" @click="openConversation(item.id)">
                <b>{{ item.title }}</b>
                <small>{{ relative(item.last_message_at) }}</small>
              </button>
              <button type="button" class="icon-btn small" :aria-label="`Eliminar ${item.title}`" @click="remove(item.id)"><ion-icon :icon="trashOutline"/></button>
            </li>
          </ul>
        </aside>
        <button v-if="historyOpen" type="button" class="history-scrim" aria-label="Cerrar historial" @click="historyOpen = false"/>

        <section class="chat" aria-live="polite">
          <p v-if="unavailable" class="study-error" role="alert">El chat no está disponible en este momento. La búsqueda del Marketplace sigue funcionando.</p>

          <div v-if="loading" class="chat-loading" aria-hidden="true"><i class="sk w60"/><i class="sk w40 right"/><i class="sk w70"/></div>

          <!-- Chat vacío -->
          <div v-else-if="!messages.length" class="chat-empty">
            <span class="empty-icon"><ion-icon :icon="sparkles"/></span>
            <h2>¿En qué te ayudo?</h2>
            <p>Busco en comercios verificados, comparo opciones y te preparo la compra con PayPal.</p>
            <div class="suggestions">
              <button v-for="s in SUGGESTIONS" :key="s" type="button" @click="send(s)">{{ s }}</button>
            </div>
          </div>

          <template v-else>
            <div v-for="message in messages" :key="message.id" class="msg" :class="message.role">
              <ul v-if="message.steps.length" class="steps" aria-label="Lo que hizo el asistente">
                <li v-for="(step, i) in message.steps" :key="i" :class="{ fail: !step.ok }"><ion-icon :icon="step.ok ? checkmarkCircle : alertCircleOutline"/>{{ step.label }}</li>
              </ul>
              <div class="bubble" v-html="format(message.content)"/>
              <AgentCards v-if="message.cards.length" :cards="message.cards" @open="openProduct" @buy="buy"/>
            </div>

            <!-- Pensando: el modelo planifica, usa herramientas y se verifica la respuesta -->
            <div v-if="sending" class="msg assistant thinking">
              <div class="bubble">
                <span class="dots" aria-hidden="true"><i/><i/><i/></span>
                <Transition name="swap" mode="out-in"><span :key="stage">{{ STAGES[stage] }}</span></Transition>
              </div>
            </div>
          </template>

          <p v-if="error" class="study-error" role="alert">{{ error }} <button type="button" class="study-link" @click="retry">Reintentar</button></p>

          <!-- Sugerencias de seguimiento -->
          <div v-if="messages.length && !sending && lastCards" class="suggestions follow">
            <button v-for="s in FOLLOW_UPS" :key="s" type="button" @click="send(s)">{{ s }}</button>
          </div>
          <div ref="endRef" class="chat-end"/>
        </section>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <form class="composer" :class="{ busy: sending }" @submit.prevent="send()">
        <textarea ref="inputRef" v-model="draft" rows="1" maxlength="1000" placeholder="Escribile al asistente…" aria-label="Mensaje para el asistente"
          :disabled="unavailable" @keydown.enter.exact.prevent="send()" @input="autosize"/>
        <button type="submit" class="send" :disabled="!draft.trim() || sending || unavailable" aria-label="Enviar"><ion-icon :icon="arrowUp"/></button>
      </form>
      <p class="composer-note">El asistente nunca paga por vos: cada compra la confirmás en PayPal.</p>
    </ion-footer>

    <ion-modal :is-open="checkout !== null" :initial-breakpoint="1" :breakpoints="[0, 1]" @didDismiss="checkout = null">
      <PayPalCheckoutSheet v-if="checkout" :product-id="checkout.productId" :quantity="checkout.quantity" :decision-id="checkout.decisionId"
        @close="checkout = null" @orders="goToOrders"/>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonHeader, IonContent, IonFooter, IonIcon, IonModal, alertController } from '@ionic/vue'
import {
  arrowBackOutline, sparkles, timeOutline, createOutline, trashOutline, checkmarkCircle, alertCircleOutline, arrowUp,
} from 'ionicons/icons'
import AgentCards from '@/components/marketplace/AgentCards.vue'
import PayPalCheckoutSheet from '@/components/marketplace/PayPalCheckoutSheet.vue'
import agentService, { type AgentConversation, type AgentConversationSummary, type AgentMessage } from '@/services/agentService'
import { CheckoutError } from '@/services/paypalCheckoutService'
import '@/theme/study.css'
import '@/theme/marketplace.css'

const SUGGESTIONS = ['Necesito una calculadora para Cálculo', 'Algo para mis clases de Química', '¿Cómo va mi último pedido?']
const FOLLOW_UPS = ['Compará las opciones', '¿Tiene reseñas?', 'Quiero comprarla']
const STAGES = ['Pensando…', 'Buscando en comercios verificados…', 'Revisando los datos…', 'Preparando la respuesta…']

const route = useRoute()
const router = useRouter()

const conversation = ref<AgentConversation | null>(null)
const messages = ref<AgentMessage[]>([])
const history = ref<AgentConversationSummary[]>([])
const historyLoading = ref(true)
const historyOpen = ref(false)
const loading = ref(false)
const sending = ref(false)
const unavailable = ref(false)
const error = ref('')
const draft = ref('')
const lastSent = ref('')
const stage = ref(0)
const checkout = ref<{ productId: number; quantity: number; decisionId: number | null } | null>(null)
const contentRef = ref<InstanceType<typeof IonContent> | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const endRef = ref<HTMLElement | null>(null)
let stageTimer: ReturnType<typeof setInterval> | null = null
let tempId = -1

const lastCards = computed(() => {
  const last = messages.value[messages.value.length - 1]
  return last?.role === 'assistant' && last.cards.some(c => c.type === 'products')
})

function errorText(e: unknown, fallback: string) {
  if (e instanceof CheckoutError) {
    if (e.code === 'agent_unavailable') unavailable.value = true
    return e.message
  }
  return fallback
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const data = await agentService.list()
    history.value = data.conversations
    unavailable.value = !data.available
  } catch { /* el historial no bloquea el chat */ } finally {
    historyLoading.value = false
  }
}

function show(data: AgentConversation) {
  conversation.value = data
  messages.value = data.messages
  scrollToEnd()
}

async function openConversation(id: number) {
  historyOpen.value = false
  if (conversation.value?.id === id) return
  router.replace(`/asistente/${id}`)
}

async function load(id: number) {
  loading.value = true
  error.value = ''
  try {
    show(await agentService.get(id))
  } catch (e) {
    error.value = errorText(e, 'No pudimos abrir este chat.')
    conversation.value = null
    messages.value = []
  } finally {
    loading.value = false
  }
}

/** Abre un chat nuevo a partir de una búsqueda inteligente (mismos resultados, sin repetir la búsqueda). */
async function startFromDecision(decisionId: number) {
  loading.value = true
  try {
    const data = await agentService.start({ decision_id: decisionId })
    show(data)
    router.replace(`/asistente/${data.id}`)
    void loadHistory()
  } catch (e) {
    error.value = errorText(e, 'No pudimos abrir el chat.')
  } finally {
    loading.value = false
  }
}

async function send(text?: string) {
  const message = (text ?? draft.value).trim()
  if (!message || sending.value || unavailable.value) return
  error.value = ''
  lastSent.value = message
  draft.value = ''
  autosize()

  // Mensaje del estudiante al instante; se reemplaza por la conversación del servidor.
  const optimistic: AgentMessage = { id: tempId--, role: 'user', content: message, cards: [], steps: [], created_at: null }
  messages.value = [...messages.value, optimistic]
  sending.value = true
  scrollToEnd()

  try {
    const data = conversation.value
      ? await agentService.send(conversation.value.id, message)
      : await agentService.start({ message })
    const isNew = !conversation.value
    show(data)
    if (isNew) router.replace(`/asistente/${data.id}`)
    void loadHistory()
  } catch (e) {
    // Si se cortó la conexión, el servidor pudo haber terminado igual: se recupera la respuesta.
    if (e instanceof CheckoutError && e.code === 'network' && await recover(message)) return
    messages.value = messages.value.filter(m => m.id !== optimistic.id)
    draft.value = message
    error.value = errorText(e, 'No pudimos enviar tu mensaje.')
  } finally {
    sending.value = false
    scrollToEnd()
  }
}

/** Busca en el servidor la respuesta a `message` (chat actual o el chat nuevo que se creó). */
async function recover(message: string): Promise<boolean> {
  try {
    let id = conversation.value?.id
    if (!id) {
      const recent = (await agentService.list()).conversations[0]
      if (!recent || !message.startsWith(recent.title.replace(/…$/, ''))) return false
      id = recent.id
    }
    const data = await agentService.get(id)
    const last = data.messages[data.messages.length - 1]
    const asked = data.messages[data.messages.length - 2]
    if (last?.role !== 'assistant' || asked?.content !== message) return false
    const isNew = !conversation.value
    show(data)
    if (isNew) router.replace(`/asistente/${data.id}`)
    void loadHistory()
    return true
  } catch {
    return false
  }
}

function retry() {
  if (lastSent.value && !draft.value) draft.value = lastSent.value
  void send()
}

function newChat() {
  historyOpen.value = false
  conversation.value = null
  messages.value = []
  error.value = ''
  router.replace('/asistente')
  nextTick(() => inputRef.value?.focus())
}

async function remove(id: number) {
  const alert = await alertController.create({
    header: '¿Eliminar este chat?',
    message: 'Se borra del historial. No afecta tus compras.',
    buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'destructive' }],
  })
  await alert.present()
  if ((await alert.onDidDismiss()).role !== 'destructive') return
  try {
    await agentService.remove(id)
    history.value = history.value.filter(c => c.id !== id)
    if (conversation.value?.id === id) newChat()
  } catch (e) {
    error.value = errorText(e, 'No pudimos eliminar el chat.')
  }
}

const openProduct = (id: number) => router.push(`/tabs/marketplace/product/${id}`)
const buy = (productId: number, decisionId: number | null, quantity: number) => { checkout.value = { productId, quantity, decisionId } }
function goToOrders() {
  checkout.value = null
  router.push('/tabs/marketplace/orders')
}
const goBack = () => (window.history.length > 1 ? router.back() : router.push('/tabs/marketplace'))

function scrollToEnd() {
  nextTick(() => {
    const el = contentRef.value?.$el as HTMLIonContentElement | undefined
    void el?.scrollToBottom?.(250)
  })
}

function autosize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 132)}px`
}

/** Texto del asistente: se escapa todo y solo se permiten negritas, viñetas y saltos de línea. */
function format(text: string) {
  const escaped = text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*[-*•]\s+/gm, '• ')
    .replace(/^#{1,4}\s*/gm, '')
    .replace(/\n/g, '<br>')
}

function relative(iso: string | null) {
  if (!iso) return ''
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  if (minutes < 1440) return `Hace ${Math.round(minutes / 60)} h`
  return new Date(iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })
}

watch(sending, (on) => {
  if (stageTimer) clearInterval(stageTimer)
  stage.value = 0
  if (on) stageTimer = setInterval(() => { if (stage.value < STAGES.length - 1) stage.value++ }, 2600)
})
onBeforeUnmount(() => { if (stageTimer) clearInterval(stageTimer) })

// Cambio de chat por la URL (historial, nuevo chat, enlaces).
watch(() => route.params.id, (id) => {
  const value = Number(Array.isArray(id) ? id[0] : id)
  if (value > 0 && value !== conversation.value?.id) void load(value)
})

onMounted(async () => {
  void loadHistory()
  const id = Number(route.params.id)
  const decision = Number(route.query.decision)
  const q = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  if (id > 0) await load(id)
  else if (decision > 0) await startFromDecision(decision)
  else if (q) await send(q)
  else nextTick(() => inputRef.value?.focus())
})
</script>

<style scoped>
.agent-page ion-header { background: var(--study-bg); }
.agent-top { display: flex; align-items: center; gap: 8px; max-width: 1100px; margin: 0 auto; padding: calc(10px + env(safe-area-inset-top)) 12px 10px; }
.agent-name { flex: 1; min-width: 0; display: grid; gap: 1px; }
.agent-name b { display: inline-flex; align-items: center; gap: 6px; font-size: 16px; }
.agent-name b ion-icon { color: var(--study-purple); }
.agent-name span { font-size: 12px; color: var(--study-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.icon-btn { width: 40px; height: 40px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%; border: 0; background: transparent; color: var(--study-text); font-size: 21px; cursor: pointer; }
.icon-btn.small { width: 32px; height: 32px; font-size: 16px; color: var(--study-faint); }
.icon-btn.active { background: var(--study-purple-soft); color: var(--study-purple); }
.icon-btn:focus-visible, .send:focus-visible { outline: 2px solid var(--study-purple); outline-offset: 2px; }

.agent-content { --background: var(--study-bg); }
.agent-layout { position: relative; display: flex; gap: 20px; max-width: 1100px; min-height: 100%; margin: 0 auto; padding: 8px 16px 20px; }

.history { width: 270px; flex-shrink: 0; align-self: flex-start; position: sticky; top: 8px; display: grid; gap: 8px; padding: 14px; border-radius: 20px; background: var(--study-surface); border: 1px solid var(--study-border); }
.history-head { display: flex; align-items: center; justify-content: space-between; }
.history ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; max-height: 70vh; overflow-y: auto; }
.history li { display: flex; align-items: center; gap: 4px; border-radius: 12px; }
.history li.current { background: var(--study-purple-soft); }
.history-item { flex: 1; min-width: 0; display: grid; gap: 1px; padding: 8px 10px; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.history-item b { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-item small { font-size: 11px; color: var(--study-muted); }
.history-btn { display: none; }
.history-scrim { display: none; }

.chat { flex: 1; min-width: 0; max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.chat-empty { display: grid; justify-items: center; gap: 8px; padding: 48px 8px 12px; text-align: center; }
.empty-icon { width: 54px; height: 54px; border-radius: 18px; display: grid; place-items: center; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 26px; }
.chat-empty h2 { margin: 6px 0 0; font-size: 22px; letter-spacing: -.02em; }
.chat-empty p { margin: 0; max-width: 340px; font-size: 14px; line-height: 20px; color: var(--study-muted); }
.suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 10px; }
.suggestions.follow { justify-content: flex-start; margin-top: -4px; }
.suggestions button { padding: 9px 14px; border-radius: 999px; border: 1px solid var(--study-border); background: var(--study-surface); color: var(--study-text); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }

.msg { display: grid; gap: 8px; max-width: 92%; animation: msg-in .3s cubic-bezier(.2, .8, .2, 1) both; }
@keyframes msg-in { from { opacity: 0; transform: translateY(8px); } }
.msg.user { justify-self: end; align-self: flex-end; }
.msg.assistant { align-self: flex-start; width: 100%; max-width: 560px; }
.bubble { padding: 11px 14px; border-radius: 20px; font-size: 14px; line-height: 21px; overflow-wrap: anywhere; }
.user .bubble { background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; border-bottom-right-radius: 6px; }
.assistant .bubble { background: var(--study-surface); border: 1px solid var(--study-border); border-bottom-left-radius: 6px; }
.steps { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.steps li { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; background: var(--study-green-soft, var(--study-bg)); color: var(--study-green-ink, var(--study-text)); font-size: 11px; font-weight: 700; }
.steps li.fail { background: var(--study-orange-soft); color: var(--study-orange); }
.thinking .bubble { display: inline-flex; align-items: center; gap: 10px; width: fit-content; color: var(--study-purple); font-weight: 600; position: relative; }
.thinking .bubble::before { content: ''; position: absolute; inset: -1.5px; border-radius: inherit; padding: 1.5px; background: linear-gradient(90deg, #8b45ec, #2853e0, #76d26b, #8b45ec); background-size: 300% 100%; animation: glow 2s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
@keyframes glow { to { background-position: 300% 0; } }
.dots { display: inline-flex; gap: 4px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: dot 1.2s ease-in-out infinite; }
.dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes dot { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
.chat-loading { display: grid; gap: 12px; padding-top: 16px; }
.sk { display: block; height: 42px; border-radius: 18px; background: var(--study-track); animation: pulse 1.3s ease-in-out infinite; }
.sk.right { justify-self: end; } .w40 { width: 40%; } .w60 { width: 60%; } .w70 { width: 70%; }
@keyframes pulse { 50% { opacity: .5; } }
.chat-end { height: 4px; }

.agent-page ion-footer { background: var(--study-bg); }
.composer { position: relative; display: flex; align-items: flex-end; gap: 8px; max-width: 720px; margin: 0 auto; padding: 8px 8px 8px 16px; border-radius: 26px; background: var(--study-surface); border: 1px solid var(--study-border); box-shadow: var(--study-shadow); width: calc(100% - 24px); }
.composer:focus-within { border-color: color-mix(in srgb, var(--study-purple) 50%, var(--study-border)); box-shadow: 0 0 0 4px var(--study-purple-soft); }
.composer.busy::before { content: ''; position: absolute; inset: -1.5px; border-radius: inherit; padding: 1.5px; background: linear-gradient(90deg, #8b45ec, #2853e0, #76d26b, #8b45ec); background-size: 300% 100%; animation: glow 2s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
.composer textarea { flex: 1; min-height: 24px; max-height: 132px; padding: 8px 0; border: 0; outline: none; resize: none; background: transparent; color: var(--study-text); font: inherit; font-size: 15px; line-height: 22px; }
.send { width: 40px; height: 40px; flex-shrink: 0; display: grid; place-items: center; border: 0; border-radius: 50%; background: linear-gradient(135deg, #8b45ec, #2853e0); color: #fff; font-size: 20px; cursor: pointer; transition: transform .15s ease, opacity .15s ease; }
.send:disabled { opacity: .4; cursor: default; }
.send:not(:disabled):active { transform: scale(.92); }
.composer-note { margin: 6px auto calc(8px + env(safe-area-inset-bottom)); text-align: center; font-size: 11px; color: var(--study-faint); }

.swap-enter-active, .swap-leave-active { transition: opacity .2s ease, transform .2s ease; }
.swap-enter-from { opacity: 0; transform: translateY(4px); }
.swap-leave-to { opacity: 0; transform: translateY(-4px); }

/* Teléfono y tablet: historial como cajón */
@media (max-width: 960px) {
  .history-btn { display: grid; }
  .history { position: fixed; z-index: 30; top: 0; bottom: 0; left: 0; width: min(300px, 84vw); border-radius: 0 22px 22px 0; transform: translateX(-105%); transition: transform .3s cubic-bezier(.32, .72, 0, 1); align-content: start; padding-top: calc(18px + env(safe-area-inset-top)); }
  .history.open { transform: none; box-shadow: var(--study-shadow); }
  .history ul { max-height: none; }
  .history-scrim { display: block; position: fixed; inset: 0; z-index: 29; border: 0; background: rgba(0, 0, 0, .35); }
  .agent-layout { padding: 4px 12px 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .msg, .dots i, .sk, .thinking .bubble::before, .composer.busy::before { animation: none !important; }
}
</style>

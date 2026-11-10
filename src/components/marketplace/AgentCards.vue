<template>
  <div class="agent-cards">
    <template v-for="(card, ci) in cards" :key="ci">
      <!-- Compra preparada por el agente: el estudiante confirma y paga en PayPal -->
      <article v-if="card.type === 'purchase'" class="a-card purchase">
        <span class="p-flag"><ion-icon :icon="bagCheckOutline"/>Compra lista para confirmar</span>
        <button type="button" class="row" @click="$emit('open', card.product.id)">
          <span class="thumb"><img v-if="card.product.image_url" :src="card.product.image_url" :alt="card.product.name"/><ion-icon v-else :icon="cubeOutline"/></span>
          <span class="info">
            <b>{{ card.product.name }}</b>
            <span class="store">{{ card.store.name }}<VerifiedBadge compact :paypal="card.store.accepts_paypal"/></span>
            <span class="qty">{{ card.quantity }} × ${{ card.product.price }}</span>
          </span>
          <span class="total"><small>Total</small>${{ card.total }}</span>
        </button>
        <button type="button" class="study-button pay" @click="$emit('buy', card.product.id, card.decision_id, card.quantity)">
          <ion-icon :icon="logoPaypal"/>Confirmar y pagar
        </button>
      </article>

      <!-- Productos reales de comercios verificados -->
      <div v-else-if="card.type === 'products'" class="product-list">
        <article v-for="item in card.items" :key="item.product.id" class="a-card" :class="{ top: item.recommended }">
          <button type="button" class="row" @click="$emit('open', item.product.id)">
            <span class="thumb"><img v-if="item.product.image_url" :src="item.product.image_url" :alt="item.product.name"/><ion-icon v-else :icon="cubeOutline"/></span>
            <span class="info">
              <b>{{ item.product.name }}</b>
              <span class="store">{{ item.store.name }}<VerifiedBadge compact :paypal="item.store.accepts_paypal"/></span>
              <span class="price">${{ item.product.price }} <small>{{ stockText(item.product.stock) }}</small></span>
            </span>
            <span v-if="item.match_probability !== null" class="match" :class="tone(item.match_probability)">
              {{ Math.round(item.match_probability * 100) }}<small>%</small>
            </span>
          </button>
          <p v-if="item.highlight" class="quote"><ion-icon :icon="chatbubbleEllipsesOutline"/>«{{ item.highlight }}»</p>
          <div class="actions">
            <button v-if="item.store.accepts_paypal" type="button" class="mini pay" :disabled="item.product.stock < 1" @click="$emit('buy', item.product.id, card.decision_id, 1)">
              <ion-icon :icon="logoPaypal"/>Comprar
            </button>
            <button type="button" class="mini" @click="$emit('open', item.product.id)">Ver producto</button>
          </div>
        </article>
      </div>

      <!-- Reseñas y videos que encontró el agente -->
      <article v-else-if="card.type === 'videos'" class="a-card videos">
        <span class="v-title"><ion-icon :icon="logoYoutube"/>Reseñas de {{ card.product.name }}</span>
        <a v-for="video in card.videos" :key="video.id" class="video" :href="video.url" target="_blank" rel="noopener noreferrer">
          <img v-if="video.thumbnail" :src="video.thumbnail" alt="" loading="lazy"/>
          <span><b>{{ video.title }}</b><small>{{ video.channel }}</small></span>
        </a>
        <p class="study-muted">
          <template v-if="card.status !== 'found'">{{ card.message }} </template>
          <a :href="card.search_url" target="_blank" rel="noopener noreferrer">Buscar en YouTube</a>
        </p>
      </article>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { bagCheckOutline, cubeOutline, logoPaypal, chatbubbleEllipsesOutline, logoYoutube } from 'ionicons/icons'
import VerifiedBadge from '@/components/marketplace/VerifiedBadge.vue'
import type { AgentCard } from '@/services/agentService'

defineProps<{ cards: AgentCard[] }>()
defineEmits<{ open: [id: number]; buy: [productId: number, decisionId: number | null, quantity: number] }>()

const stockText = (n: number) => n < 1 ? 'Agotado' : n === 1 ? '· 1 disponible' : `· ${n} disponibles`
const tone = (p: number) => p >= 0.9 ? 'tone-high' : p >= 0.7 ? 'tone-good' : p >= 0.5 ? 'tone-mid' : 'tone-low'
</script>

<style scoped>
.agent-cards { display: grid; gap: 10px; }
.product-list { display: grid; gap: 8px; }
.a-card { display: grid; gap: 10px; padding: 12px; border-radius: 18px; background: var(--study-surface); border: 1px solid var(--study-border); animation: card-in .35s cubic-bezier(.2, .8, .2, 1) both; }
.a-card.top { background: linear-gradient(var(--study-surface), var(--study-surface)) padding-box, linear-gradient(135deg, #8b45ec, #2853e0) border-box; border: 1.5px solid transparent; }
@keyframes card-in { from { opacity: 0; transform: translateY(8px); } }
.row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.thumb { width: 48px; height: 48px; border-radius: 12px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: var(--study-track); color: var(--study-faint); font-size: 20px; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; min-width: 0; display: grid; gap: 2px; }
.info b { font-size: 14px; line-height: 18px; overflow-wrap: anywhere; }
.store { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--study-muted); }
.price { font-size: 15px; font-weight: 800; }
.price small, .qty { font-size: 12px; font-weight: 600; color: var(--study-muted); }
.match { flex-shrink: 0; min-width: 46px; height: 30px; padding: 0 8px; border-radius: 999px; display: grid; place-items: center; font-size: 13px; font-weight: 800; background: var(--study-bg); }
.match small { font-size: 9px; }
.tone-high { color: var(--study-green-ink); } .tone-good { color: var(--study-green); } .tone-mid { color: var(--study-orange); } .tone-low { color: var(--study-faint); }
.quote { display: flex; gap: 6px; align-items: flex-start; margin: 0; font-size: 13px; line-height: 18px; font-style: italic; color: var(--study-muted); }
.quote ion-icon { flex-shrink: 0; margin-top: 2px; color: var(--study-purple); }
.actions { display: flex; gap: 8px; }
.mini { flex: 1; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 999px; border: 1px solid var(--study-border); background: var(--study-bg); color: var(--study-text); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.mini:disabled { opacity: .5; cursor: default; }
.pay { background: #ffc439; border-color: #ffc439; color: #003087; }
.purchase { border: 1.5px solid #ffc439; }
.p-flag { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: var(--study-text); }
.p-flag ion-icon { color: var(--study-green); font-size: 16px; }
.total { display: grid; justify-items: end; font-size: 18px; font-weight: 800; }
.total small { font-size: 11px; font-weight: 600; color: var(--study-muted); }
.purchase .study-button { min-height: 46px; }
.videos { gap: 8px; }
.v-title { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; }
.v-title ion-icon { color: #ff0033; font-size: 18px; }
.video { display: flex; gap: 10px; align-items: center; padding: 6px; border-radius: 12px; background: var(--study-bg); color: inherit; text-decoration: none; }
.video img { width: 88px; height: 50px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.video span { display: grid; gap: 2px; min-width: 0; }
.video b { font-size: 13px; line-height: 17px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.video small { font-size: 11px; color: var(--study-muted); }
.videos a:not(.video) { color: var(--study-purple); font-weight: 700; }
@media (prefers-reduced-motion: reduce) { .a-card { animation: none; } }
</style>

<template>
  <span class="verified-badge" :class="{ compact }" :title="paypal ? 'Comercio verificado por LaU · Acepta PayPal' : 'Comercio verificado por LaU'">
    <ion-icon :icon="shieldCheckmark" aria-hidden="true"/>
    <span v-if="!compact">Verificado por LaU</span>
    <span v-else class="sr-only">Verificado por LaU</span>
    <template v-if="paypal && !compact">
      <i aria-hidden="true"/>
      <ion-icon :icon="logoPaypal" aria-hidden="true"/>
      <span>PayPal</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { logoPaypal, shieldCheckmark } from 'ionicons/icons'

defineProps<{ paypal?: boolean; compact?: boolean }>()
</script>

<style scoped>
.verified-badge { display: inline-flex; align-items: center; gap: 5px; width: fit-content; padding: 3px 9px; border-radius: 999px; background: var(--study-green-soft); color: var(--study-green-ink); font-size: 12px; line-height: 16px; font-weight: 700; white-space: nowrap; }
.verified-badge ion-icon { font-size: 14px; flex-shrink: 0; }
.verified-badge i { width: 3px; height: 3px; border-radius: 50%; background: currentColor; opacity: .5; }
.verified-badge.compact { padding: 3px; }
</style>

<template>
  <h1 class="dynamic-task-heading" aria-label="Tu plan. A tu ritmo.">
    <span>Tu plan.</span>
    <span class="dynamic-line" aria-hidden="true">
      <Transition name="word-rise"><span :key="current">{{ current }}</span></Transition>
    </span>
  </h1>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const phrases = ['En movimiento.', 'A tu ritmo.', 'Más cerca.', 'Hecho posible.']
const index = ref(0)
const current = computed(() => phrases[index.value])
let rotation: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rotation = setInterval(() => { if (document.visibilityState === 'visible') index.value = (index.value + 1) % phrases.length }, 4000)
  }
})
onBeforeUnmount(() => { if (rotation) clearInterval(rotation) })
</script>

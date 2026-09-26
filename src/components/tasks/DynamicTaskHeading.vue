<template>
  <h1 class="dynamic-task-heading" :aria-label="current + ' LaU'">
    <span class="dynamic-line" aria-hidden="true">
      <Transition name="heading-rise"><span :key="current">{{ current }}</span></Transition>
    </span>
    <span class="heading-anchor" aria-hidden="true">LaU</span>
  </h1>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// Solo cambia la parte variable: "LaU" es el ancla fija del encabezado.
const phrases = ['Estudia en', 'Organízate en', 'Enfócate en', 'Avanza con', 'Planifica con', 'Pomodoro en', 'Tus tareas en', 'Cumple metas con']
const index = ref(0)
const current = computed(() => phrases[index.value])
let rotation: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rotation = setInterval(() => { if (document.visibilityState === 'visible') index.value = (index.value + 1) % phrases.length }, 4200)
  }
})
onBeforeUnmount(() => { if (rotation) clearInterval(rotation) })
</script>

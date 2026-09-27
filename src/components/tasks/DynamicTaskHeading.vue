<template>
  <h1
    class="dynamic-task-heading"
    :aria-label="current + ' LaU'"
  >
    <span
      class="dynamic-line"
      aria-hidden="true"
    >
      <Transition name="heading-rise">
        <span :key="current">
          {{ current }}
        </span>
      </Transition>
    </span>

    <span
      class="heading-anchor"
      aria-hidden="true"
    >
      LaU
    </span>
  </h1>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'

// Solo cambia la parte variable: "LaU" es el ancla fija del encabezado.
// Voseo salvadoreño, jugando con "ir a la U".
const phrases = [
  'Estudiá en',
  'Avanzá con',
  'Organizate con',
  'Enfocate en',
  'Hoy toca',
  'Modo',
  'Tu día en',
  'Al día con',
  'Ponete al día en',
  'Nos vemos en',
  'Tus metas en',
  'Tareas de'
]

const index = ref(0)

const current = computed(
  () => phrases[index.value]
)

let rotation:
  ReturnType<typeof setInterval>
  | undefined

onMounted(() => {
  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

  if (!reducedMotion) {
    rotation = setInterval(() => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        index.value =
          (index.value + 1) %
          phrases.length
      }
    }, 4200)
  }
})

onBeforeUnmount(() => {
  if (rotation) {
    clearInterval(rotation)
  }
})
</script>

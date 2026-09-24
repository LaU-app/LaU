<template><Transition name="celebrate"><div v-if="visible" class="study-celebration" role="status"><span aria-hidden="true">✦</span><b>{{ text }}</b><span aria-hidden="true">✧</span></div></Transition></template>
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
const props = withDefaults(defineProps<{ value: number; text?: string }>(), { text: '¡Un Pomodoro más! Bien hecho.' })
const visible = ref(false)
let timeout: ReturnType<typeof setTimeout> | undefined
watch(() => props.value, (value, old) => { if (value > old) { visible.value = true; clearTimeout(timeout); timeout = setTimeout(() => visible.value = false, 3000) } })
onBeforeUnmount(() => clearTimeout(timeout))
</script>


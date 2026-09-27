<template>
  <form class="study-card settings-card" @submit.prevent="save">
    <div class="section-title"><h2>Encuentra tu ritmo</h2><button type="button" class="study-link" @click="$emit('close')">Cerrar</button></div>
    <p class="study-muted">El enfoque actual conserva su duración. Los próximos bloques y descansos usarán estos ajustes.</p>
    <label v-for="field in fields" :key="field.key">{{ field.label }}<input v-model.number="form[field.key]" type="number" inputmode="numeric" required min="1" :max="field.max" step="1"/></label>
    <p v-if="validation" role="alert">{{ validation }}</p><button class="study-button" :disabled="busy || !ready" type="submit">{{ busy ? 'Guardando…' : 'Guardar mi ritmo' }}</button>
    <button type="button" class="study-link" :disabled="busy" @click="study.enableNotifications()">Activar avisos al terminar</button>
  </form>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { study } from '@/utils/useStudy'
const emit = defineEmits(['close'])
const { busy, ready } = study
const form = reactive({ focus_minutes: study.preferences.focus_minutes, short_break_minutes: study.preferences.short_break_minutes, long_break_minutes: study.preferences.long_break_minutes, cycles_before_long_break: study.preferences.cycles_before_long_break })
const fields: { key: keyof typeof form; label: string; max: number }[] = [
  { key: 'focus_minutes', label: 'Enfoque · minutos', max: 120 }, { key: 'short_break_minutes', label: 'Descanso corto · minutos', max: 30 },
  { key: 'long_break_minutes', label: 'Descanso largo · minutos', max: 60 }, { key: 'cycles_before_long_break', label: 'Bloques antes del descanso largo', max: 12 },
]
const validation = ref('')
async function save() {
  if (fields.some(f => !Number.isInteger(form[f.key]) || form[f.key] < 1 || form[f.key] > f.max)) { validation.value = 'Revisa los límites de cada campo.'; return }
  if (await study.savePreferences(form)) emit('close')
}
</script>

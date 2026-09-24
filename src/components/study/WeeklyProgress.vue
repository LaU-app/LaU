<template>
  <section class="study-card weekly-progress">
    <div class="section-title"><div><h2>Tu semana</h2><span class="study-muted">Lun — Dom</span></div><div class="weekly-total"><span class="eyebrow">TOTAL</span><b>{{ formatStudyTime(days.reduce((sum,day)=>sum+day.seconds,0)) }}</b></div></div>
    <div class="weekly-bars" role="group" aria-label="Tiempo de estudio por día">
      <button v-for="(day, index) in days" :key="day.date" :class="{ selected: selected === day.date }" :aria-pressed="selected === day.date" :aria-label="labels[index] + ': ' + formatStudyTime(day.seconds)" @click="selected = day.date">
        <span class="weekly-bar-space"><span class="weekly-bar" :style="{ height: Math.max(5, day.seconds / maximum * 100) + '%', animationDelay: index * 35 + 'ms' }"/></span>
        <span>{{ labels[index] }}</span><i v-if="day.date === today" aria-label="Hoy"/>
      </button>
    </div>
    <div class="weekly-selection" aria-live="polite"><span>Seleccionado: {{ selectedLabel }} ({{ formatStudyTime(selectedDay?.seconds || 0) }})</span><b v-if="difference!==null">{{ difference>=0 ? '+' : '' }}{{ difference }}% vs día anterior</b></div>
    <p v-if="!days.some(day => day.seconds)" class="study-muted">Tu primer enfoque dará vida a esta semana.</p>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatStudyTime } from '@/utils/studyTimer'
import { STUDY_TIMEZONE } from '@/utils/studyPresentation'
const props = defineProps<{ days: { date: string; seconds: number }[] }>()
const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const today = new Intl.DateTimeFormat('en-CA', { timeZone: STUDY_TIMEZONE }).format(new Date())
const selected = ref(today)
watch(() => props.days, days => { if (!days.some(day => day.date === selected.value)) selected.value = days[0]?.date || today }, { immediate: true })
const maximum = computed(() => Math.max(60, ...props.days.map(day => day.seconds)))
const selectedDay = computed(() => props.days.find(day => day.date === selected.value))
const difference=computed(()=>{const index=props.days.findIndex(day=>day.date===selected.value);const previous=props.days[index-1]?.seconds;return previous ? Math.round(((selectedDay.value?.seconds || 0)-previous)/previous*100) : null})
const selectedLabel = computed(() => selected.value === today ? 'Hoy' : new Intl.DateTimeFormat('es-SV', { timeZone: STUDY_TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(selected.value + 'T12:00:00-06:00')))
</script>

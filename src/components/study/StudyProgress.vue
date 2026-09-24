<template><section class="study-progress"><h1>Tu progreso</h1>
  <p v-if="loading && !summary" class="study-empty" role="status">Cargando tu progreso…</p><p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load">Reintentar</button></p>
  <template v-if="summary">
    <div class="today-card study-card"><div class="today-heading"><span class="eyebrow">TU ENFOQUE DE HOY</span><span class="neutral-chip" title="Tiempo mínimo para sumar un día a tu racha">Meta de racha: {{ summary.streak_minimum_seconds/60 }} min</span></div><div class="today-value"><strong :key="summary.today_seconds">{{ summary.today_seconds && summary.today_seconds<60 ? '<1' : Math.floor(summary.today_seconds/60) }}</strong><span>min</span></div><p><ion-icon :icon="checkmarkCircleOutline"/><span>{{ summary.today_seconds>=summary.streak_minimum_seconds ? '¡Excelente! Hoy sumaste un día a tu racha.' : 'Estás a '+Math.ceil((summary.streak_minimum_seconds-summary.today_seconds)/60)+' min de sumar un día a tu racha.' }}</span></p><div class="today-track" role="progressbar" aria-label="Meta de racha diaria" :aria-valuenow="Math.min(summary.today_seconds,summary.streak_minimum_seconds)" :aria-valuemax="summary.streak_minimum_seconds" :aria-valuemin="0"><span :style="{width:Math.min(100,summary.today_seconds/summary.streak_minimum_seconds*100)+'%'}"/></div></div>
    <div class="study-metrics"><div><span class="study-symbol tone-blue"><ion-icon :icon="bookOutline"/></span><b>{{ summary.sessions_completed }}</b><span>SESIONES</span></div><div><span class="study-symbol tone-blue"><ion-icon :icon="hourglassOutline"/></span><b>{{ summary.pomodoros_completed }}</b><span>POMODOROS</span></div><div><span class="study-symbol tone-orange"><ion-icon :icon="flameOutline"/></span><b>{{ summary.current_streak }}</b><span>DÍAS RACHA</span></div></div>
    <WeeklyProgress :days="summary.weekly"/>
    <div class="study-periods"><div class="study-card"><span class="eyebrow">ESTA SEMANA</span><strong>{{ formatStudyTime(summary.week_seconds) }}</strong><span class="period-note"><ion-icon :icon="trendingUpOutline"/>{{ summary.weekly.filter(day=>day.seconds>0).length }} días de estudio</span></div><div class="study-card"><span class="eyebrow">ESTE MES</span><strong>{{ formatStudyTime(summary.month_seconds) }}</strong><span class="neutral-chip">Mejor racha: {{ summary.best_streak }} días</span></div></div>
    <div v-if="usualHour" class="study-insight study-card"><span class="eyebrow">TU RITMO DE ESTUDIO</span><h2>Tu hora más habitual: {{ usualHour }}</h2><p class="study-muted">Según tus sesiones recientes.</p></div>
    <section class="study-history-section"><div class="section-title"><h2>Sesiones recientes</h2><button v-if="sessions.length>2 && !expanded" class="study-link" @click="expanded=true">Ver todas</button></div><p v-if="!sessions.length" class="study-empty">Aquí aparecerán tus sesiones.</p><ol class="study-history"><li v-for="session in (expanded ? sessions : sessions.slice(0,2))" :key="session.id"><span class="study-symbol" :class="session.status==='completed' ? 'tone-blue' : 'tone-green'"><ion-icon :icon="session.status==='completed' ? bookOutline : timerOutline"/></span><div><b>{{ session.task?.title || session.activity || 'Estudio libre' }}</b><span>{{ formatStudyTime(session.duration_seconds) }} · {{ labels[session.status] }}</span><small>{{ studyDate(session.started_at) }}</small></div><router-link v-if="session.task" class="round-arrow" :to="'/tasks/'+session.task.id" :aria-label="'Ver tarea '+session.task.title"><ion-icon :icon="chevronForwardOutline"/></router-link></li></ol><p v-if="historyError" role="alert">{{ historyError }}</p><button v-if="expanded && page<lastPage" class="study-link" :disabled="loadingMore" @click="more">{{ loadingMore ? 'Cargando…' : 'Ver más sesiones' }}</button></section>
    <router-link class="new-study-cta" to="/study?tab=focus"><div><span class="eyebrow">¿LISTO PARA SUMAR?</span><b>Nueva sesión de estudio</b></div><span class="round-arrow"><ion-icon :icon="arrowForwardOutline"/></span></router-link>
  </template>
</section></template>
<script setup lang="ts">
import { onMounted,onBeforeUnmount,ref,watch,computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { bookOutline,timerOutline,flameOutline,hourglassOutline,checkmarkCircleOutline,trendingUpOutline,timeOutline,chevronForwardOutline,arrowForwardOutline } from 'ionicons/icons'
import WeeklyProgress from './WeeklyProgress.vue'
import { studyService } from '@/services/studyService'
import { study } from '@/utils/useStudy'
import { formatStudyTime } from '@/utils/studyTimer'
import { studyDate,STUDY_TIMEZONE } from '@/utils/studyPresentation'
import type { StudySession, StudySummary } from '@/types/study'
const summary = ref<StudySummary | null>(null), sessions = ref<StudySession[]>([])
const loading = ref(true), error = ref(''), loadingMore = ref(false), historyError = ref('')
const page = ref(1), lastPage = ref(1)
const expanded=ref(false)
const usualHour=computed(()=>{const hours=new Map<number,number>();for(const session of sessions.value){if(!session.duration_seconds)continue;const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:STUDY_TIMEZONE,hour:'numeric',hourCycle:'h23'}).format(new Date(session.started_at)));hours.set(hour,(hours.get(hour)||0)+session.duration_seconds)}const best=[...hours].sort((a,b)=>b[1]-a[1])[0];return best ? `${best[0]%12 || 12}:00 ${best[0]<12 ? 'a. m.' : 'p. m.'}` : null})
const labels = {completed:'Pomodoro completo',finished:'Enfoque guardado',cancelled:'Cancelada',running:'En curso'}
let request = 0
async function load() {
  const id = ++request
  loading.value = true; error.value = ''
  try { const [stats,history] = await Promise.all([studyService.summary(), studyService.history()]); if (id !== request) return; summary.value = stats; sessions.value = history.data; page.value = 1; lastPage.value = history.last_page }
  catch { if (id === request) error.value = 'No pudimos cargar tu progreso. Inténtalo de nuevo.' }
  finally { if (id === request) loading.value = false }
}
async function more() {
  const generation = request
  loadingMore.value = true; historyError.value = ''
  try { const history = await studyService.history(page.value + 1); if (generation !== request) return; sessions.value.push(...history.data); page.value = history.current_page; lastPage.value = history.last_page }
  catch { historyError.value = 'No pudimos cargar más sesiones.' } finally { loadingMore.value = false }
}
onMounted(load); watch(study.revision, load); onBeforeUnmount(() => { request++ })
</script>
